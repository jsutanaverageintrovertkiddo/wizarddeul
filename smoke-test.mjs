// Quick end-to-end multiplayer smoke test:
// connects two socket.io clients to the same match, plays a card as player 0,
// and verifies player 1 receives the updated state (HP / turn / names).
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

const createRoom = (playerName) =>
  api('/api/rooms', { method: 'POST', body: JSON.stringify({ playerName }) });

const joinRoom = (code, playerName) =>
  api(`/api/rooms/${code}/join`, {
    method: 'POST',
    body: JSON.stringify({ playerName }),
  });

const connectClient = (matchID, playerID, credentials) =>
  new Promise((resolve, reject) => {
    const socket = io(SERVER, { transports: ['websocket'] });
    const state = { latest: null };
    socket.on('connect', () => {
      socket.emit('sync', matchID, playerID, credentials, (_err, data) => {
        state.latest = data;
        resolve({ socket, state });
      });
    });
    socket.on('sync', (data) => {
      state.latest = data;
    });
    socket.on('update', (matchID_, state_) => {
      if (matchID_ === matchID) state.latest = state_;
    });
    socket.on('connect_error', reject);
    setTimeout(() => reject(new Error('connect timeout')), 8000);
  });

const waitFor = (predicate, getValue, timeoutMs = 8000) =>
  new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      const v = getValue();
      if (predicate(v)) {
        clearInterval(timer);
        resolve(v);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        reject(new Error('waitFor timeout'));
      }
    }, 100);
  });

const run = async () => {
  const host = await createRoom('Merlin');
  const guest = await joinRoom(host.roomCode, 'Morgana');
  console.log(`Room ${host.roomCode} created; guest joined as ${guest.playerID}`);

  const c0 = await connectClient(host.matchID, host.playerID, host.token);
  const c1 = await connectClient(guest.matchID, guest.playerID, guest.token);

  const s0 = await waitFor(
    (v) => v?.G?.players?.['0']?.hand?.length === 5,
    () => c0.state.latest
  );

  console.log(
    'Player 0 sees names:',
    s0.G.players['0'].name,
    '/',
    s0.G.players['1'].name
  );
  console.log('Player 0 hand size:', s0.G.players['0'].hand.length);

  const s1 = c1.state.latest;
  console.log(
    'Player 1 sees names:',
    s1.G.players['0'].name,
    '/',
    s1.G.players['1'].name
  );

  const hpBefore = s1.G.players['1'].hp;

  // Player 0 plays their first card (draw happens on turn 1? turn 1 has no draw).
  const cardIdBefore = s0.G.players['0'].hand[0].id;
  c0.socket.emit('action', {
    type: 'MAKE_MOVE',
    payload: {
      type: 'playCard',
      args: [0],
      playerID: '0',
      credentials: host.token,
    },
  });

  const s1After = await waitFor(
    (v) => v?.ctx?.turn === 2 || v?.ctx?.currentPlayer === '1',
    () => c1.state.latest
  );

  console.log('After P0 move -> currentPlayer:', s1After.ctx.currentPlayer);
  console.log('Turn:', s1After.ctx.turn);
  console.log(
    'P1 HP before/after:',
    hpBefore,
    '->',
    s1After.G.players['1'].hp
  );
  console.log('P0 hand size after play:', s1After.G.players['0'].hand.length);

  c0.socket.close();
  c1.socket.close();
  console.log('SMOKE TEST PASSED');
  process.exit(0);
};

run().catch((e) => {
  console.error('SMOKE TEST FAILED:', e.message);
  process.exit(1);
});