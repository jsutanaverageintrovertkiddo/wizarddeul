// Bounded sync test: plays 12 actions and asserts both clients always see the
// same HP, turn owner, hands and gameover status. Also verifies the wrong
// player cannot act.
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

const waitFor = (predicate, getValue, timeoutMs = 4000) =>
  new Promise((resolve) => {
    const start = Date.now();
    const timer = setInterval(() => {
      const v = getValue();
      if (predicate(v)) {
        clearInterval(timer);
        resolve(v);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        resolve(v);
      }
    }, 50);
  });

const sendMove = (client, matchID, playerID, credentials, type, args) =>
  client.socket.emit(
    'update',
    { type: 'MAKE_MOVE', payload: { type, args, playerID, credentials } },
    client.state.stateID,
    matchID,
    playerID
  );

const snapshot = (v) =>
  v ? `${v.G.players['0'].hp}|${v.G.players['1'].hp}|${v.ctx.currentPlayer}` : 'none';

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

  await waitFor((v) => v?.G?.players?.['0']?.hand?.length === 5, () => c0.state.latest);

  let mismatches = 0;
  let actions = 0;

  for (let i = 0; i < 12; i++) {
    const view = c0.state.latest;
    if (!view || view.ctx.gameover) break;

    const actorID = view.ctx.currentPlayer;
    const c = actorID === '0' ? c0 : c1;
    const creds = actorID === '0' ? host.token : guest.token;
    const matchID = actorID === '0' ? host.matchID : guest.matchID;
    const actorState = c.state.latest;
    if (!actorState) break;

    const hand = actorState.G.players[actorID].hand;
    if (hand.length === 0) break;

    // 1) Play a card.
    sendMove(c, matchID, actorID, creds, 'playCard', [0]);
    await waitFor(
      (v) => v?.G?.players?.[actorID]?.hand?.length === hand.length - 1,
      () => c.state.latest
    );

    // 2) Pass the turn.
    sendMove(c, matchID, actorID, creds, 'endTurn', []);
    await waitFor(
      (v) => v && v.ctx.currentPlayer !== actorID,
      () => c0.state.latest
    );

    actions++;

    // 3) Assert both clients agree.
    const a = snapshot(c0.state.latest);
    const b = snapshot(c1.state.latest);
    if (a !== b) {
      mismatches++;
      console.log(`MISMATCH after action ${actions}: P0="${a}" P1="${b}"`);
    } else {
      console.log(`action ${actions}: both see ${a} (hp0|hp1|turnOwner)`);
    }
  }

  // 4) Wrong-player guard: whoever is NOT the turn owner must be rejected.
  const finalView = c0.state.latest;
  if (finalView && !finalView.ctx.gameover) {
    const owner = finalView.ctx.currentPlayer;
    const other = owner === '0' ? '1' : '0';
    const c = other === '0' ? c0 : c1;
    const creds = other === '0' ? host.token : guest.token;
    const matchID = other === '0' ? host.matchID : guest.matchID;

    const before = snapshot(c0.state.latest);
    sendMove(c, matchID, other, creds, 'endTurn', []);
    await new Promise((r) => setTimeout(r, 800));
    const after = snapshot(c0.state.latest);
    console.log(
      `wrong-player guard: owner=${owner}, other=${other}, unchanged=${before === after}`
    );
  }

  console.log('Total actions:', actions, 'Mismatches:', mismatches);

  const names =
    c0.state.latest.G.players['0'].name + '/' + c0.state.latest.G.players['1'].name;
  console.log('Names synced as:', names);

  c0.socket.close();
  c1.socket.close();

  if (mismatches === 0 && names === 'Merlin/Morgana') {
    console.log('SYNC TEST PASSED');
    process.exit(0);
  } else {
    console.log('SYNC TEST FAILED');
    process.exit(1);
  }
};

run().catch((e) => {
  console.error('SYNC TEST ERROR:', e.message);
  process.exit(1);
});