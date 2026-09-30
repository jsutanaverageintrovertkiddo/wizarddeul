import { PlayerID } from 'boardgame.io';

import { Card } from './cards';
import { Player } from './player';

export interface GlobalEffectProps {
  // Level-related effects
  drawMode?: DrawMode;
  showEnemyHand?: boolean;
  shouldMiss?: boolean[];
  shouldClearEffects?: boolean[];
  loseHpAmount?: number;

  // Power-related effects
  shouldPlayerMiss?: boolean[];
}

export interface WizardDuelState {
  readonly players: Record<PlayerID, Player>;
  readonly level: string;
  deck: Card[];
  globalEffects: GlobalEffectProps;
}

export enum DrawMode {
  draw = 'draw',
  select = 'select',
}

/** Per-player seat info attached when a room is created. */
export interface SeatInfo {
  /** Random per-seat token so reconnecting clients can reclaim their seat. */
  readonly token: string;
  /** Whether this seat has ever been occupied. */
  connected: boolean;
}

export interface MatchData {
  /** 6-character room code, e.g. "A7K9P2". */
  roomCode: string;
  /** Display names for seat '0' and '1'. */
  names: Record<PlayerID, string>;
  /** Secret tokens for seat reconnection. */
  seats: Record<PlayerID, SeatInfo>;
  /** Which level/battle configuration this duel uses. */
  level: string;
}
