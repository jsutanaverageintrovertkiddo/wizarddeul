import { Ctx } from 'boardgame.io';
import { EffectType } from '../model/cardEffects';
import { Card, CardKeyword } from '../model/cards';
import { WizardDuelState } from '../model/shared';
import { cardAudio, cleanse, defrost, miss, potion } from './assetUtils';

/**
 * Returns the audio path to play when a card is played, accounting for
 * freeze / miss / cleanse / poison interactions.
 */
export const resolveCardAudio = (
  card: Card,
  G: WizardDuelState,
  ctx: Ctx
): string => {
  const hasFreezeEffect = G.players[ctx.currentPlayer].effects.some(
    (e) => e.type === EffectType.freeze
  );
  const hasPoisonEffect = G.players[ctx.currentPlayer].effects.some(
    (e) => e.type === EffectType.poison
  );
  const hasDamageKeyword = card.keywords.includes(CardKeyword.damage);
  const hasEffectKeyword = card.keywords.includes(CardKeyword.effect);
  const isUniqueHealCard =
    (card.effects.length === 1 && card.effects[0].type === EffectType.heal) ||
    card.id === '23';
  const shouldClearEffects = G.globalEffects.shouldClearEffects?.[ctx.turn - 1];

  if (hasEffectKeyword && shouldClearEffects) {
    return cleanse;
  } else if (hasFreezeEffect) {
    return defrost;
  } else if (hasDamageKeyword && G.globalEffects.shouldMiss?.[ctx.turn - 1]) {
    return miss;
  } else if (isUniqueHealCard && hasPoisonEffect) {
    return potion;
  } else {
    return cardAudio(card.id);
  }
};