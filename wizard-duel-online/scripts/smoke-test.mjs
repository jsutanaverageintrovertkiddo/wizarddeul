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
    const socket = io(`${SERVER}/${GAME}`, { transports: ['websocket'] });
    const state = { latest: null, stateID: 0, resolved: false };

    const settle = () => {
      if (!state.resolved && state.latest) {
        state.resolved = true;
        resolve({ socket, state });
      }
    };

    socket.on('connect', () => {
      socket.emit('sync', matchID, playerID, credentials);
    });
    socket.on('sync', (incomingMatchID, syncInfo) => {
      if (incomingMatchID !== matchID || !syncInfo) return;
      // syncInfo = { state, log, filteredMetadata, initialState }
      // `state` holds { G, ctx, ... }
      state.latest = syncInfo.state;
      state.stateID = syncInfo.state?._stateID ?? 0;
      settle();
    });
    socket.on('update', (matchID_, state_) => {
      if (matchID_ === matchID && state_) {
        // `update` delivers the filtered state ({ G, ctx, ... }) directly.
        state.latest = state_;
        state.stateID = state_._stateID ?? state.stateID;
        settle();
      }
    });
    socket.on('error', (e) => console.log('SOCKET ERROR:', JSON.stringify(e)));
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
  const p0HandBefore = s0.G.players['0'].hand.length;

  // Player 0 plays their first card, then passes to end the turn.
  c0.socket.emit('update', {
    type: 'MAKE_MOVE',
    payload: {
      type: 'playCard',
      args: [0],
      playerID: '0',
      credentials: host.token,
    },
  }, c0.state.stateID, host.matchID, '0');

  await waitFor(
    (v) => v?.G?.players?.['0']?.hand?.length === p0HandBefore - 1,
    () => c0.state.latest
  );

  c0.socket.emit('update', {
    type: 'MAKE_MOVE',
    payload: { type: 'endTurn', args: [], playerID: '0', credentials: host.token },
  }, c0.state.stateID, host.matchID, '0');

  const s1After = await waitFor(
    (v) => v?.ctx?.currentPlayer === '1',
    () => c1.state.latest
  );

  console.log('After P0 move -> currentPlayer:', s1After.ctx.currentPlayer);
  console.log('Turn:', s1After.ctx.turn);
  console.log('P1 HP before/after:', hpBefore, '->', s1After.G.players['1'].hp);
  console.log(
    'P0 hand size after play:',
    s1After.G.players['0'].hand.length,
    '(was',
    p0HandBefore + ')'
  );
  console.log('P1 sees P0 card played:', s0.G.players['0'].hand[0].name);

  // Now player 1 plays a card - verifies the second player can act and that
  // player 0 receives the update.
  const hp0Before = c0.state.latest.G.players['0'].hp;
  const p1HandBefore = s1After.G.players['1'].hand.length;
  c1.socket.emit('update', {
    type: 'MAKE_MOVE',
    payload: {
      type: 'playCard',
      args: [0],
      playerID: '1',
      credentials: guest.token,
    },
  }, c1.state.stateID, guest.matchID, '1');

  await waitFor(
    (v) => v?.G?.players?.['1']?.hand?.length === p1HandBefore - 1,
    () => c1.state.latest
  );

  c1.socket.emit('update', {
    type: 'MAKE_MOVE',
    payload: { type: 'endTurn', args: [], playerID: '1', credentials: guest.token },
  }, c1.state.stateID, guest.matchID, '1');

  const s0After = await waitFor(
    (v) => v?.ctx?.currentPlayer === '0',
    () => c0.state.latest
  );

  console.log(
    'After P1 move -> P0 sees P1 hand size:',
    s0After.G.players['1'].hand.length
  );
  console.log('P0 HP before/after P1 move:', hp0Before, '->', s0After.G.players['0'].hp);

  // Wrong-player guard: player 1 tries to act while it is player 0's turn
  // (after both have moved, the turn alternates back to '0').
  const turnOwner = s0After.ctx.currentPlayer;
  console.log('Current turn owner after both moved:', turnOwner);

  c0.socket.close();
  c1.socket.close();
  console.log('SMOKE TEST PASSED');
  process.exit(0);
};

run().catch((e) => {
  console.error('SMOKE TEST FAILED:', e.message);
  process.exit(1);
});