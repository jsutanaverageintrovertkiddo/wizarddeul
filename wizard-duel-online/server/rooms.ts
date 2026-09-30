import { PlayerID } from 'boardgame.io';

/** A single occupied seat in a room. */
export interface Seat {
  name: string;
  /** Secret token so the same browser can reclaim its seat. */
  token: string;
  /** ISO timestamp of the last time this seat issued HTTP requests. */
  lastSeen: number;
}

/** In-memory room record. Exactly two seats. */
export interface Room {
  roomCode: string;
  /** boardgame.io match id owning the game state. */
  matchID: string;
  createdAt: number;
  seats: Record<PlayerID, Seat | null>;
  /** Set once both seats are filled and the match has been started. */
  started: boolean;
  /** Set once a client reports the duel is over. */
  finished: boolean;
}

export interface RoomRegistryOptions {
  /** Rooms older than this (ms) with no activity are swept. */
  ttlMs?: number;
  /** How often to sweep, in ms. */
  sweepIntervalMs?: number;
}

/**
 * In-memory registry of rooms. Keyed by 6-character room code and by match id.
 *
 * Rooms live in a single Node process. For a horizontally-scaled deployment you
 * would swap this for Redis, but the interface (create/join/lookup) stays the
 * same, which keeps the rest of the server unchanged.
 */
export class RoomRegistry {
  private byCode = new Map<string, Room>();
  private byMatch = new Map<string, Room>();
  private readonly ttlMs: number;
  private readonly sweepIntervalMs: number;
  private sweepTimer?: NodeJS.Timeout;

  constructor(options: RoomRegistryOptions = {}) {
    this.ttlMs = options.ttlMs ?? 1000 * 60 * 60 * 6; // 6 hours
    this.sweepIntervalMs = options.sweepIntervalMs ?? 1000 * 60 * 10;
  }

  startSweeping() {
    if (this.sweepTimer) return;
    this.sweepTimer = setInterval(() => this.sweep(), this.sweepIntervalMs);
    // Do not keep the process alive just for the sweeper.
    this.sweepTimer.unref?.();
  }

  stopSweeping() {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = undefined;
    }
  }

  private sweep() {
    const now = Date.now();
    for (const room of [...this.byCode.values()]) {
      const lastActivity = Math.max(
        room.createdAt,
        ...Object.values(room.seats).map((s) => s?.lastSeen ?? 0)
      );
      if (now - lastActivity > this.ttlMs) {
        this.delete(room.roomCode);
      }
    }
  }

  /** Generate a unique 6-character uppercase alphanumeric code. */
  private generateCode(): string {
    // Avoid ambiguous characters (0/O, 1/I) for easy reading aloud.
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 1000; attempt++) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      if (!this.byCode.has(code)) return code;
    }
    throw new Error('Could not allocate a unique room code.');
  }

  /** Normalise user input: trim, uppercase, strip spaces. */
  static normaliseCode(input: string): string {
    return (input ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  static isValidCode(code: string): boolean {
    return /^[A-Z0-9]{6}$/.test(code);
  }

  private static makeToken(): string {
    return (
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2)
    );
  }

  create(hostName: string): Room {
    const roomCode = this.generateCode();
    const now = Date.now();
    const room: Room = {
      roomCode,
      matchID: `room-${roomCode}`,
      createdAt: now,
      seats: {
        '0': {
          name: this.sanitiseName(hostName) ?? 'Wizard 1',
          token: RoomRegistry.makeToken(),
          lastSeen: now,
        },
        '1': null,
      },
      started: false,
      finished: false,
    };
    this.byCode.set(roomCode, room);
    this.byMatch.set(room.matchID, room);
    return room;
  }

  getByCode(code: string): Room | undefined {
    return this.byCode.get(RoomRegistry.normaliseCode(code));
  }

  getByMatch(matchID: string): Room | undefined {
    return this.byMatch.get(matchID);
  }

  /** Join the open seat, or reclaim a seat if the token matches. */
  join(
    room: Room,
    playerName: string,
    existingToken?: string
  ): { playerID: PlayerID; token: string } {
    const now = Date.now();

    // Reconnect path: token matches an occupied seat.
    if (existingToken) {
      for (const id of ['0', '1'] as PlayerID[]) {
        const seat = room.seats[id];
        if (seat && seat.token === existingToken) {
          seat.lastSeen = now;
          return { playerID: id, token: seat.token };
        }
      }
    }

    // Fresh join into the empty seat.
    const openId = (['0', '1'] as PlayerID[]).find(
      (id) => room.seats[id] === null
    );
    if (!openId) {
      throw Object.assign(new Error('Room is full.'), { code: 'ROOM_FULL' });
    }

    const token = RoomRegistry.makeToken();
    room.seats[openId] = {
      name: this.sanitiseName(playerName) ?? `Wizard ${Number(openId) + 1}`,
      token,
      lastSeen: now,
    };
    return { playerID: openId, token };
  }

  touch(room: Room, playerID?: PlayerID) {
    const now = Date.now();
    if (playerID && room.seats[playerID]) {
      room.seats[playerID]!.lastSeen = now;
    } else {
      Object.values(room.seats).forEach((s) => {
        if (s) s.lastSeen = now;
      });
    }
  }

  markStarted(room: Room) {
    room.started = true;
  }

  isFull(room: Room): boolean {
    return room.seats['0'] !== null && room.seats['1'] !== null;
  }

  connectedCount(room: Room): number {
    return Object.values(room.seats).filter(Boolean).length;
  }

  delete(code: string) {
    const room = this.byCode.get(RoomRegistry.normaliseCode(code));
    if (room) {
      this.byCode.delete(room.roomCode);
      this.byMatch.delete(room.matchID);
    }
  }

  private sanitiseName(name?: string): string | undefined {
    if (!name) return undefined;
    const cleaned = name.trim().slice(0, 16);
    return cleaned.length > 0 ? cleaned : undefined;
  }
}