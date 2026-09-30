# Wizard Duel

This repository contains two versions of **Wizard Duel**, a turn-based wizard
card game:

- [`wizard-duel/`](./wizard-duel/) — the original single-player game against
  computer-controlled opponents.
- [`wizard-duel-online/`](./wizard-duel-online/) — a two-player online version
  with room codes, synchronized matches, and a Node.js game server.

The online edition builds on the original game's engine, art, and visual design.
See each project folder's README for project-specific details.

## Requirements

- Node.js 18 or later
- npm

## Run the single-player game

```bash
cd wizard-duel
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Run the online game

```bash
cd wizard-duel-online
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The development command
starts both the Vite client and the multiplayer server (port 8000). Create a
room in one browser and join it with the room code from another browser or
private window.

To start either part separately, use `npm run dev:server` and
`npm run dev:client` in separate terminals from `wizard-duel-online/`.

## Build and multiplayer tests

Build the online client:

```bash
cd wizard-duel-online
npm run build
```

With the online server running, the multiplayer smoke, sync, and win tests can
be run with `npm run test:smoke`, `npm run test:sync`, and `npm run test:win`.

## Credits and license

The original game, art, and design are credited in
[`wizard-duel/CREDITS.md`](./wizard-duel/CREDITS.md). The original project is
licensed under MIT; see [`wizard-duel/LICENSE`](./wizard-duel/LICENSE) and
the online project's README for details.
