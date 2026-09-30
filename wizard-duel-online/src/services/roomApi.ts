import {
  CreateRoomResponse,
  JoinRoomResponse,
  ROOM_ERROR_MESSAGES,
  RoomError,
  RoomErrorCode,
  RoomStatusResponse,
  RoomSession,
} from '../model/room';

const SESSION_KEY = 'wizardDuelSession';

/** All room REST calls go through Vite's proxy in dev (same origin). */
const apiFetch = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new RoomError('NETWORK_ERROR', ROOM_ERROR_MESSAGES.NETWORK_ERROR);
  }

  if (!res.ok) {
    let code: RoomErrorCode = 'NETWORK_ERROR';
    try {
      const body = await res.json();
      code = (body?.error as RoomErrorCode) ?? 'NETWORK_ERROR';
    } catch {
      /* non-JSON error body */
    }
    throw new RoomError(
      code,
      ROOM_ERROR_MESSAGES[code] ?? 'Something went wrong.'
    );
  }

  return (await res.json()) as T;
};

export const createRoom = (playerName: string) =>
  apiFetch<CreateRoomResponse>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ playerName }),
  });

export const joinRoom = (code: string, playerName: string) =>
  apiFetch<JoinRoomResponse>(`/api/rooms/${code}/join`, {
    method: 'POST',
    body: JSON.stringify({ playerName }),
  });

export const getRoomStatus = (code: string) =>
  apiFetch<RoomStatusResponse>(`/api/rooms/${code}`, { method: 'GET' });

export const finishRoom = (code: string) =>
  apiFetch<{ ok: boolean }>(`/api/rooms/${code}/finish`, { method: 'POST' });

// --- Session persistence (survives refresh, per-tab) ---

export const saveSession = (session: RoomSession) => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const loadSession = (): RoomSession | undefined => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as RoomSession) : undefined;
  } catch {
    return undefined;
  }
};

export const clearSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};