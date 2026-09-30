// Plays the duel to completion as fast as possible and verifies both clients
// receive the same gameover result.
import { io } from 'socket.io-client';

const SERVER = 'http://localhost:8000';
const GAME = 'wizard-duel';

const api = async (path, init) => {
  const res = await fetch(`${SERVER}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return JSON.parse(text);
};

const connectClient = (matchID, playerID, credentials) =>
  new Promise((resolve, reject) => {
    const socket = io(`${SERVER}/${GAME}`, { transports: ['websocket'] });
    const state = { latest: null, stateID: 0, resolved: false };
    const settle = () => {
      if (!state.resolved && state.latest) {
        state.resolved = true;
        resolve({ socket, state });
      }
    };
    socket.on('connect', () => socket.emit('sync', matchID, playerID, credentials));
    socket.on('sync', (incoming, info) => {
      if (incoming !== matchID || !info) return;
      state.latest = info.state;
      state.stateID = info.state?._stateID ?? 0;
      settle();
    });
    socket.on('update', (m, s) => {
      if (m === matchID && s) {
        state.latest = s;
        state.stateID = s._stateID ?? state.stateID;
        settle();
      }
    });
    socket.on('connect_error', reject);
    setTimeout(() => reject(new Error('connect timeout')), 8000);
  });

const sendMove = (client, matchID, playerID, credentials, type, args) =>
  client.socket.emit(
    'update',
    { type: 'MAKE_MOVE', payload: { type, args, playerID, credentials } },
    client.state.stateID,
    matchID,
    playerID
  );

const run = async () => {
  const host = await api('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ playerName: 'Merlin' }),
  });
  const guest = await api(`/api/rooms/${host.roomCode}/join`, {
    method: 'POST',
    body: JSON.stringify({ playerName: 'Morgana' }),
  });

  const c0 = await connectClient(host.matchID, host.playerID, host.token);
  const c1 = await connectClient(guest.matchID, guest.playerID, guest.token);
  const clients = {
    '0': { c: c0, creds: host.token, matchID: host.matchID },
    '1': { c: c1, creds: guest.token, matchID: guest.matchID },
  };

  // Wait for both to have synced.
  for (let i = 0; i < 100 && !(c0.state.latest && c1.state.latest); i++) {
    await new Promise((r) => setTimeout(r, 50));
  }

  let moves = 0;
  const MAX = 400;

  while (moves < MAX) {
    const view = c0.state.latest;
    if (!view) break;
    if (view.ctx.gameover) break;

    const actorID = view.ctx.currentPlayer;
    const actor = clients[actorID];
    const st = actor.c.state.latest;
    if (!st?.G) break;

    const hand = st.G.players[actorID].hand;
    if (hand.length === 0) {
      sendMove(actor.c, actor.matchID, actorID, actor.creds, 'endTurn', []);
    } else {
      // Always play the first card, then pass.
      sendMove(actor.c, actor.matchID, actorID, actor.creds, 'playCard', [0]);
      sendMove(actor.c, actor.matchID, actorID, actor.creds, 'endTurn', []);
    }

    moves++;

    // Wait for the turn to change (or the game to end).
    const start = Date.now();
    while (Date.now() - start < 500) {
      const now = c0.state.latest;
      if (now?.ctx.gameover || now?.ctx.currentPlayer !== actorID) break;
      await new Promise((r) => setTimeout(r, 15));
    }
  }

  const end0 = c0.state.latest;
  const end1 = c1.state.latest;

  console.log('Moves executed:', moves);
  console.log('P0 final view HP:', end0.G.players['0'].hp, end0.G.players['1'].hp);
  console.log('P1 final view HP:', end1.G.players['0'].hp, end1.G.players['1'].hp);
  console.log('Gameover P0:', JSON.stringify(end0.ctx.gameover));
  console.log('Gameover P1:', JSON.stringify(end1.ctx.gameover));

  const sameHP =
    end0.G.players['0'].hp === end1.G.players['0'].hp &&
    end0.G.players['1'].hp === end1.G.players['1'].hp;
  const sameResult =
    JSON.stringify(end0.ctx.gameover) === JSON.stringify(end1.ctx.gameover);
  const hasWinner =
    end0.ctx.gameover && (end0.ctx.gameover.winner || end0.ctx.gameover.draw);

  console.log('sameHP:', sameHP, 'sameResult:', sameResult, 'hasWinner:', !!hasWinner);

  c0.socket.close();
  c1.socket.close();

  if (sameHP && sameResult && hasWinner) {
    console.log('WIN TEST PASSED');
    process.exit(0);
  } else {
    console.log('WIN TEST FAILED');
    process.exit(1);
  }
};

run().catch((e) => {
  console.error('WIN TEST ERROR:', e.message);
  process.exit(1);
});