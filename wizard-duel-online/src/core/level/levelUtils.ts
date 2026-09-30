import { Card, Flame, Resurrect } from '../../model/cards';

/**
 * Produces a boolean array of length `turns` where `true` marks a scheduled
 * event (miss / clear) at that 1-based turn index.
 */
export const generateAttackOutcomes = (
  turns: number,
  rate: number
): boolean[] => {
  return Array.from({ length: turns }, () => Math.random() < rate);
};

/**
 * Marks every `interval`-th turn as an effect-clear turn.
 */
export const getClearEffectSchedule = (
  turns: number,
  interval: number
): boolean[] => {
  return Array.from(
    { length: turns },
    (_, index) => (index + 1) % interval === 0
  );
};

/**
 * Pick `count` cards from `cards` following `distribution` weights.
 */
export const randomPopulateHand = (
  cards: Card[],
  distribution: number[],
  count: number
): Card[] => {
  const pick = (): Card => {
    const roll = Math.random();
    let cumulative = 0;
    for (let i = 0; i < cards.length; i++) {
      cumulative += distribution[i] ?? 0;
      if (roll < cumulative) return cards[i];
    }
    return cards[cards.length - 1];
  };
  return Array.from({ length: count }, pick);
};

// Re-exported so callers do not need a second import path.
export { Flame, Resurrect };