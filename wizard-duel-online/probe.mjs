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

const run = async () => {
  const host = await api('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ playerName: 'Merlin' }),
  });
  const guest = await api(`/api/rooms/${host.roomCode}/join`, {
    method: 'POST',
    body: JSON.stringify({ playerName: 'Morgana' }),
  });
  console.log('matchID:', host.matchID, 'tokens:', host.token, guest.token);

  const socket = io(`${SERVER}/${GAME}`, { transports: ['websocket'] });
  socket.on('connect', () => {
    console.log('connected');
    socket.emit('sync', host.matchID, host.playerID, host.token);
  });
  socket.on('sync', (incomingMatchID, syncInfo) => {
    console.log('SYNC matchID:', incomingMatchID);
    console.log('SYNC syncInfo keys:', syncInfo ? Object.keys(syncInfo) : syncInfo);
    if (syncInfo?.G) {
      console.log('G players:', Object.keys(syncInfo.G.players));
      console.log('P0 name/hand:', syncInfo.G.players['0']?.name, syncInfo.G.players['0']?.hand?.length);
      console.log('ctx:', JSON.stringify(syncInfo.ctx));
    }
  });
  socket.on('update', (matchID, state) => {
    console.log('UPDATE EVENT:', matchID, JSON.stringify(state).slice(0, 400));
  });
  socket.on('error', (e) => console.log('SOCKET ERROR:', e));

  setTimeout(() => process.exit(0), 6000);
};

run().catch((e) => {
  console.error('FAILED', e);
  process.exit(1);
});