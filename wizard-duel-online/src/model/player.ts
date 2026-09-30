import { PlayerID } from 'boardgame.io';
import { Effect } from './cardEffects';
import { Card } from './cards';

// Optional for level override, but required as part of the Player interface
export interface PlayerStats {
  maxHp?: number;
  baseAtk?: number;
  baseDef?: number;
  hp?: number;
  atk?: number;
  def?: number;
}

export interface Player extends Required<PlayerStats> {
  // Display name shown on the board. Assigned from the room's player slot.
  name: string;
  readonly id: PlayerID; // '0' or '1' - both are human in online mode
  hand: Card[];
  effects: Effect[];
}

/** Factory so each game gets fresh, independent player objects. */
export const createPlayer = (id: PlayerID, name: string): Player => ({
  name,
  id,
  maxHp: 30,
  baseAtk: 0,
  baseDef: 0,
  hp: 30,
  atk: 0,
  def: 0,
  hand: [],
  effects: [],
});