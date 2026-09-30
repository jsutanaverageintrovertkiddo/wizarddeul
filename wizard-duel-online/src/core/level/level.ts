import { GlobalEffectProps, DrawMode } from '../../model/shared';
import { generateAttackOutcomes, getClearEffectSchedule } from './levelUtils';

/**
 * Online duels run the "full" ruleset: every card is available and the only
 * win condition is reducing the opponent's HP to 0. Turn cap prevents stalls.
 */
export const TURN_CAP = 100;

export const ONLINE_LEVEL = 'online';

export const maxTurn: number = TURN_CAP;

export const globalEffectsDefault: GlobalEffectProps = {
  drawMode: DrawMode.draw,
  showEnemyHand: false,
};

/**
 * Level-6 style effect: every N turns all buffs/debuffs are cleared. Kept for
 * flavour parity with the reference battle pacing.
 */
export const clearEffectSchedule = getClearEffectSchedule(
  TURN_CAP,
  11
);

// Kept for parity / potential future online modifiers.
export const missSchedule = generateAttackOutcomes(TURN_CAP, 0.3);