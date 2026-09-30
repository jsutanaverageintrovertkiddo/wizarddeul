import { PlayerID } from 'boardgame.io';

/**
 * Everything the client needs to remember about the room it is in. Stored in
 * sessionStorage so a page refresh can reconnect to the same seat.
 */
export interface RoomSession {
  roomCode: string;
  matchID: string;
  playerID: PlayerID;
  /** Secret token used to reclaim this seat after a refresh/reconnect. */
  token: string;
  playerName: string;
  opponentName: string;
  /** Wall-clock creation time, used to expire stale rooms server-side. */
  createdAt: number;
}

export interface CreateRoomResponse {
  roomCode: string;
  matchID: string;
  playerID: PlayerID;
  token: string;
  playerName: string;
}

export interface JoinRoomResponse {
  roomCode: string;
  matchID: string;
  playerID: PlayerID;
  token: string;
  playerName: string;
  opponentName: string;
}

export interface RoomStatusResponse {
  roomCode: string;
  players: { '0': string | null; '1': string | null };
  /** Number of currently-connected websocket clients (0..2). */
  connectedCount: number;
  started: boolean;
  finished: boolean;
}

export type RoomErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'GAME_STARTED'
  | 'GAME_FINISHED'
  | 'INVALID_CODE'
  | 'NETWORK_ERROR';

export class RoomError extends Error {
  readonly code: RoomErrorCode;
  constructor(code: RoomErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'RoomError';
  }
}

/** Human-readable message for each failure mode. */
export const ROOM_ERROR_MESSAGES: Record<RoomErrorCode, string> = {
  ROOM_NOT_FOUND: 'Room not found.',
  ROOM_FULL: 'Room is full.',
  GAME_STARTED: 'Game already started.',
  GAME_FINISHED: 'Game already finished.',
  INVALID_CODE: 'Enter a valid 6-character room code.',
  NETWORK_ERROR: 'Network error. Is the server running?',
};