# Wizard Duel — 2-Player Online Multiplayer

A real, playable **2-player online** version of
[ruichen199801/wizard-duel](https://github.com/ruichen199801/wizard-duel).

The UI, arena, wizard presentation, cards, spells, animations, health bars,
turn flow and win/lose screens are taken from the reference project so the game
**looks and feels like the original** — the work here is the multiplayer layer
on top of it.

- **Frontend:** React + TypeScript + Vite + Bootstrap (same styling as the reference)
- **Game state / sync:** [boardgame.io](https://boardgame.io/) over **socket.io**
- **Server:** Node + tsx, boardgame.io server + a room-code REST API
- **Matchmaking:** 6-character room codes, exactly 2 players per room

---

## Quick start

You need **Node.js 18+** (tested on Node 26).

```bash
cd wizard-duel-online
npm install
```

### Run both the multiplayer server and the client together

```bash
npm run dev
```

This starts:

| process | URL | what it is |
|---|---|---|
| game server | `http://localhost:8000` | authoritative game state + WebSockets + room API |
| Vite client | `http://localhost:5173` | the game you open in a browser |

Open **http://localhost:5173** in a browser. Vite proxies `/socket.io`, `/games`
and `/api` to the server on port 8000, so the browser sees everything as
same-origin — no CORS or URL configuration needed.

### Or run them in separate terminals

```bash
# Terminal 1 — multiplayer server
npm run server        # or: npm run dev:server   (watch mode)

# Terminal 2 — client
npm run dev:client
```

---

## How to play a duel

1. **Browser A** → `http://localhost:5173` → **Create Room**
   → enter a wizard name → a room is created and you see
   **ROOM CODE**, `1 / 2 PLAYERS`, **Waiting for opponent...** and **Copy Code**.
2. **Browser B** (a different browser, a different computer, or a private
   window) → `http://localhost:5173` → **Join Room**
   → enter a name, paste the **6-character room code**, click **Join Game**.
3. The moment the second player joins, **both clients automatically enter the
   same battle**. The host's waiting screen advances on its own.

### In the duel

- You draw **1** card at the start of your turn and play **1** card, then the
  turn passes to your opponent.
- Click a card to preview it, then click **End Turn** to play it.
- Drop your opponent's HP to **0** to win.
- If it is not your turn, the cards are not clickable and any attempt to act
  shows **"Wait for your turn."**
- Every 11 turns all buffs and debuffs are washed away.

### Result screen

- Winner sees **VICTORY** with **Play Again** / **Return to Menu**.
- Loser sees **DEFEAT** with **Return to Menu**.
- If the opponent closes their browser or loses connection, the remaining
  player sees **"Opponent disconnected."**

---

## Testing it yourself (two browsers)

**Same machine, two windows**

1. Window 1 → Create Room → copy the code.
2. Window 2 (incognito/private, so `sessionStorage` is separate) → Join Room →
   paste the code.
3. Play a card in Window 1 — Window 2 immediately shows the damage / heal / buff.
4. Play a card in Window 2 — Window 1 updates instantly.
5. Try to play out of turn — the action is blocked.

**Two devices on the same network**

Run the client so it is reachable from the other device, and point it at the
server through the `VITE_SERVER_URL` variable:

```bash
# .env.local
VITE_SERVER_URL=http://<your-lan-ip>:8000
```

Then `npm run dev` and open `http://<your-lan-ip>:5173` on both devices.

---

## Automated multiplayer tests

The tests drive **real socket.io clients** against a running server and assert
that both players receive identical state.

```bash
# with the server running on :8000
npm run test:smoke     # room create/join + first move syncs to the other player
npm run test:sync      # 10 actions: HP / turn / hand stay identical on both clients
npm run test:win       # plays a full duel and checks both see the same winner
```

They print a per-action comparison, e.g.:

```
action 7: both see 21|18|1 (hp0|hp1|turnOwner)
action 8: both see 21|18|0 (hp0|hp1|turnOwner)
Mismatches: 0
Names synced as: Merlin/Morgana
SYNC TEST PASSED
```

---

## Room / error behaviour

| situation | result |
|---|---|
| Invalid code | `Room not found.` |
| Room already has 2 players | `Room is full.` |
| Room's game already started | `Game already started.` |
| Room's game already finished | `Game already finished.` |
| Server unreachable | `Network error. Is the server running?` |

Room lifecycle: `WAITING` → `PLAYER 1 CONNECTED` → `PLAYER 2 CONNECTED` →
`GAME STARTED` → `GAME FINISHED`.

---

## Project layout

```
wizard-duel-online/
├─ server/
│  ├─ index.ts          boardgame.io server + /api/rooms REST layer
│  └─ rooms.ts          in-memory room registry (6-char codes, 2 seats)
├─ shared game logic (runs on the server, imported by the client for types)
│  └─ src/core/         ported engine: game.ts, effect/, level/, gameUtils
│  └─ src/model/        cards, card effects, deck, player, shared state
├─ src/
│  ├─ components/       board/, card/, ui/, modals/, lobby/  (reference UI)
│  ├─ hooks/            audio, music, animation, log, preload, persistence
│  ├─ services/         roomApi (REST), multiplayerClient (socket transport)
│  ├─ utils/            assetUtils (all image/audio/music paths) + helpers
│  └─ index.css         reference styling + online additions
├─ public/              the reference project's images, animations, audio, music
└─ scripts/             socket.io multiplayer tests (not part of the app)
```

### How multiplayer actually works

1. `POST /api/rooms` mints a 6-character code, creates a boardgame.io **match**
   with `numPlayers: 2`, and stores a seat token for the host.
2. The host's browser polls `GET /api/rooms/:code` while on the waiting screen.
3. `POST /api/rooms/:code/join` fills the second seat, rewrites the match
   metadata with both real names, and marks the room **started**.
4. Both browsers open a **socket.io** connection to `/wizard-duel` and `sync`
   to the **same matchID**. boardgame.io then pushes every state change
   (HP, cards, effects, turn, gameover) to both clients — there is no simulated
   opponent and no `localStorage` game state.
5. Turns are enforced **server-side** by boardgame.io: a move sent by the wrong
   player is rejected, so the UI's "Wait for your turn." matches the authority.

---

## Credits

Game design, art and the original single-player game:
[ruichen199801/wizard-duel](https://github.com/ruichen199801/wizard-duel) (MIT).
This project reuses that game's engine, assets and visual design, and adds the
online multiplayer architecture on top. Please see the original project's
`CREDITS.md` and `LICENSE`.