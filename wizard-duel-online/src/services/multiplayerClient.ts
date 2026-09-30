import { Local, SocketIO } from 'boardgame.io/multiplayer';

/**
 * Pick the transport for a match. Both players connect to the same Node server
 * over socket.io and receive authoritative state updates from it â€” this is real
 * multiplayer, not a simulation.
 */
export const createMultiplayerTransport = (matchID: string) =>
  SocketIO({ server: resolveServerUrl() });

/**
 * The client talks to the server through Vite's dev proxy when running on
 * localhost, so the default (same-origin) works. When the client is served
 * from a different host, set VITE_SERVER_URL (e.g. https://duel.example.com).
 */
export const resolveServerUrl = (): string => {
  const configured = import.meta.env.VITE_SERVER_URL as string | undefined;
  if (configured && configured.length > 0) return configured;

  if (typeof window !== 'undefined') {
    // Same-origin: Vite proxies /socket.io and /games to the game server.
    return window.location.origin;
  }
  return 'http://localhost:8000';
};

/** Local-only transport, kept for potential offline practice mode. */
export const createLocalTransport = () => Local();

export { SocketIO };