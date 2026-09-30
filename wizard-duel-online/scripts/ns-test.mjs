import { io } from 'socket.io-client';

const SERVER = 'http://localhost:8000';

const tryNamespace = (ns) =>
  new Promise((resolve) => {
    const socket = io(`${SERVER}${ns}`, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 5000,
    });
    socket.on('connect', () => {
      console.log(`CONNECTED ns="${ns}" id=${socket.id}`);
      socket.close();
      resolve(true);
    });
    socket.on('connect_error', (err) => {
      console.log(`ERROR ns="${ns}": ${err.message}`);
      socket.close();
      resolve(false);
    });
  });

const run = async () => {
  await tryNamespace('');
  await tryNamespace('/wizard-duel');
  await tryNamespace('/wizardduel');
  process.exit(0);
};

run();