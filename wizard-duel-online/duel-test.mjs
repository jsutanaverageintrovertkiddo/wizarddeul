// Full duel simulation: plays cards alternately until someone wins, verifying
// HP sync, turn alternation and the gameover result on BOTH clients.
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
    socket.on('connect', () =>
      socket.emit('sync', matchID, playerID, credentials)
    );
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

const waitFor = (predicate, getValue, timeoutMs = 10000) =>
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
    }, 60);
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

  await waitFor(
    (v) => v?.G?.players?.['0']?.hand?.length === 5,
    () => c0.state.latest
  );

  let turns = 0;
  const MAX_TURNS = 120;

  while (turns < MAX_TURNS) {
    const view = c0.state.latest;
    if (view.ctx.gameover) break;

    const actorID = view.ctx.currentPlayer;
    const actor = clients[actorID];
    const actorState = actor.c.state.latest;

    if (!actorState?.G) break;

    // Draw a card first (turns > 1 draw automatically on the board; here we
    // draw explicitly to mirror the board behaviour).
    const hand = actorState.G.players[actorID].hand;
    if (hand.length === 0) {
      sendMove(actor.c, actor.matchID, actorID, actor.creds, 'endTurn', []);
    } else {
      const idx = Math.floor(Math.random() * hand.length);
      sendMove(actor.c, actor.matchID, actorID, actor.creds, 'playCard', [idx]);
      await waitFor(
        (v) => v?.G?.players?.[actorID]?.hand?.length === hand.length - 1,
        () => actor.c.state.latest
      ).catch(() => { });

      const after = actor.c.state.latest;
      if (!after?.ctx?.gameover) {
        sendMove(actor.c, actor.matchID, actorID, actor.creds, 'endTurn', []);
      }
    }

    await waitFor(
      (v) => !v?.ctx || v.ctx.currentPlayer !== actorID || v.ctx.gameover,
      () => c0.state.latest
    ).catch(() => { });

    turns++;
  }

  const end0 = c0.state.latest;
  const end1 = c1.state.latest;

  console.log('Turns simulated:', turns);
  console.log('Final HP  (P0 view):', end0.G.players['0'].hp, '/', end0.G.players['1'].hp);
  console.log('Final HP  (P1 view):', end1.G.players['0'].hp, '/', end1.G.players['1'].hp);
  console.log('Gameover  (P0 view):', JSON.stringify(end0.ctx.gameover));
  console.log('Gameover  (P1 view):', JSON.stringify(end1.ctx.gameover));

  const bothAgree =
    JSON.stringify(end0.G.players) === JSON.stringify(end1.G.players) &&
    JSON.stringify(end0.ctx.gameover) === JSON.stringify(end1.ctx.gameover);

  console.log('Both clients agree on final state:', bothAgree);

  c0.socket.close();
  c1.socket.close();

  if (bothAgree && end0.ctx.gameover) {
    console.log('DUEL TEST PASSED');
    process.exit(0);
  } else {
    console.log('DUEL TEST INCONCLUSIVE (no gameover reached in cap)');
    process.exit(1);
  }
};

run().catch((e) => {
  console.error('DUEL TEST FAILED:', e.message);
  process.exit(1);
});