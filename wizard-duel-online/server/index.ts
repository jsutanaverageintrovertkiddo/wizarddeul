import { InitializeGame } from 'boardgame.io/internal';
import { Server as BgioServer } from 'boardgame.io/server';
import type { Server as BgioServerNS, State } from 'boardgame.io';

import { WizardDuel } from '../src/core/game/game';
import { RoomRegistry } from './rooms';

const PORT = Number(process.env.SERVER_PORT ?? 8000);
const GAME_NAME = 'wizard-duel';

const registry = new RoomRegistry();
registry.startSweeping();

// ---------------------------------------------------------------------------
// boardgame.io server: owns authoritative game state and pushes every update
// (health, cards, turns, gameover) to all connected sockets in a match.
// ---------------------------------------------------------------------------
const bgServer = BgioServer({
  games: [WizardDuel as any],
  origins: true,
});

// boardgame.io's app is a Koa app; the Lobby API is already registered on
// bgServer.router (POST /games/:name/create, /games/:name/:id/join, ...).
const { app, router, db } = bgServer;

// Small CORS layer so the browser client can call the room REST endpoints.
app.use((ctx: any, next: any) => {
  ctx.set('Access-Control-Allow-Origin', ctx.get('Origin') || '*');
  ctx.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type');
  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    return;
  }
  return next();
});

// ---------------------------------------------------------------------------
// Room-code layer, mounted on the same Koa router.
// ---------------------------------------------------------------------------

const json = (ctx: any, status: number, body: unknown) => {
  ctx.status = status;
  ctx.type = 'application/json';
  ctx.body = JSON.stringify(body);
};

/** Read and JSON-parse the raw request body (no body-parser dependency). */
async function readBody(ctx: any): Promise<any> {
  if (ctx.request?.body && typeof ctx.request.body === 'object') {
    return ctx.request.body;
  }
  const raw: string = await new Promise((resolve, reject) => {
    let data = '';
    ctx.req.on('data', (chunk: Buffer) => (data += chunk.toString()));
    ctx.req.on('end', () => resolve(data));
    ctx.req.on('error', reject);
  });
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Build the initial boardgame.io State object for a fresh match using the
 * game's own setup pipeline, so the state matches the game definition exactly.
 */
function buildInitialState(
  seat0Name: string,
  seat1Name: string
): State {
  return InitializeGame({
    game: WizardDuel as any,
    numPlayers: 2,
    setupData: {
      names: { '0': seat0Name, '1': seat1Name },
      level: 'online',
    },
  });
}

/**
 * Rebuild the stored game state using the real wizard names. The initial state
 * is created at room time with a placeholder opponent name, so once the second
 * player joins we reseed it to guarantee both boards show correct names.
 */
async function reseedMatchState(
  matchID: string,
  names: { '0': string; '1': string }
) {
  try {
    const state = buildInitialState(names['0'], names['1']);
    await db.setState(matchID, state);
  } catch (e) {
    console.warn('reseedMatchState skipped:', (e as Error)?.message);
  }
}

/** Rewrite the match's player names + setupData once both seats are occupied. */
async function refreshMatchNames(
  matchID: string,
  names: { '0': string; '1': string }
) {
  try {
    const meta: any = await db.fetch(matchID, { metadata: true });
    const metadata: any = meta?.metadata;
    if (!metadata) return;
    metadata.players = {
      0: { ...(metadata.players?.[0] ?? { id: 0 }), name: names['0'] },
      1: { ...(metadata.players?.[1] ?? { id: 1 }), name: names['1'] },
    };
    metadata.setupData = { names, level: 'online' };
    metadata.updatedAt = Date.now();
    await db.setMetadata(matchID, metadata);
  } catch (e) {
    console.warn('refreshMatchNames skipped:', (e as Error)?.message);
  }
}

/** CREATE ROOM */
router.post('/api/rooms', async (ctx: any) => {
  const body = await readBody(ctx);
  const playerName: string = body.playerName ?? 'Wizard 1';

  const room = registry.create(playerName);
  const host = room.seats['0']!;

  const initialState = buildInitialState(host.name, 'Wizard 2');

  await db.createMatch(room.matchID, {
    initialState,
    metadata: {
      gameName: GAME_NAME,
      players: {
        // boardgame.io stores metadata.players keyed by numeric player index.
        0: { id: 0, name: host.name },
        1: { id: 1 },
      },
      setupData: {
        names: { '0': host.name, '1': 'Wizard 2' },
        level: 'online',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as BgioServerNS.MatchData,
  });

  json(ctx, 201, {
    roomCode: room.roomCode,
    matchID: room.matchID,
    playerID: '0',
    token: host.token,
    playerName: host.name,
  });
});

/** Room status (the waiting screen polls this to detect a join). */
router.get('/api/rooms/:code', async (ctx: any) => {
  const room = registry.getByCode(ctx.params.code);
  if (!room) return json(ctx, 404, { error: 'ROOM_NOT_FOUND' });
  registry.touch(room);

  json(ctx, 200, {
    roomCode: room.roomCode,
    players: {
      '0': room.seats['0']?.name ?? null,
      '1': room.seats['1']?.name ?? null,
    },
    connectedCount: registry.connectedCount(room),
    started: room.started,
    finished: room.finished,
  });
});

/** JOIN ROOM */
router.post('/api/rooms/:code/join', async (ctx: any) => {
  const room = registry.getByCode(ctx.params.code);
  if (!room) return json(ctx, 404, { error: 'ROOM_NOT_FOUND' });

  const body = await readBody(ctx);
  const playerName: string = body.playerName ?? 'Wizard 2';
  const existingToken: string | undefined = body.token;

  const isReconnect =
    !!existingToken &&
    (['0', '1'] as const).some((id) => room.seats[id]?.token === existingToken);

  if (!isReconnect) {
    if (registry.isFull(room)) return json(ctx, 409, { error: 'ROOM_FULL' });
    if (room.finished) return json(ctx, 409, { error: 'GAME_FINISHED' });
    if (room.started) return json(ctx, 409, { error: 'GAME_STARTED' });
  }

  let seat;
  try {
    seat = registry.join(room, playerName, existingToken);
  } catch (e: any) {
    return json(ctx, 409, { error: e?.code ?? 'ROOM_FULL' });
  }

  registry.touch(room, seat.playerID);

  const opponentID = seat.playerID === '0' ? '1' : '0';

  // Both seats filled â†’ start the duel. Update match metadata so the game state
  // exposes the real display names, and flip the room so the waiting client
  // auto-advances into the battle.
  if (registry.isFull(room) && !room.started) {
    registry.markStarted(room);
    const names = {
      '0': room.seats['0']!.name,
      '1': room.seats['1']!.name,
    };
    // Rebuild the authoritative game state with the real wizard names so both
    // boards display the correct names, then update the match metadata.
    await reseedMatchState(room.matchID, names);
    await refreshMatchNames(room.matchID, names);
  }

  json(ctx, 200, {
    roomCode: room.roomCode,
    matchID: room.matchID,
    playerID: seat.playerID,
    token: seat.token,
    playerName: room.seats[seat.playerID]!.name,
    opponentName: room.seats[opponentID]?.name ?? 'Opponent',
  });
});

/** Report game over back to the room registry. */
router.post('/api/rooms/:code/finish', async (ctx: any) => {
  const room = registry.getByCode(ctx.params.code);
  if (!room) return json(ctx, 404, { error: 'ROOM_NOT_FOUND' });
  room.finished = true;
  registry.touch(room);
  json(ctx, 200, { ok: true });
});

/** Health check. */
router.get('/api/health', async (ctx: any) => {
  json(ctx, 200, { ok: true, game: GAME_NAME });
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
bgServer.run(PORT, () => {
  console.log(`\n  Wizard Duel multiplayer server listening on :${PORT}`);
  console.log(`  Game: ${GAME_NAME}`);
  console.log(`  Lobby API + /api/rooms available on the same port\n`);
});

export { bgServer, registry };