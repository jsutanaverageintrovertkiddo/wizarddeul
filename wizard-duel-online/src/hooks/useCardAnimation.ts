import { Ctx } from 'boardgame.io';
import { useState } from 'react';

import { EffectType } from '../model/cardEffects';
import { Card } from '../model/cards';
import { WizardDuelState } from '../model/shared';
import {
  AnimationProps,
  AnimationTarget,
  getAnimationDataForCard,
  getAnimationTargetForCard,
} from '../utils/assetUtils';
import { sleep } from '../utils/commonUtils';

/**
 * Plays the GIF effect over the right wizard portrait. Because both seats are
 * human, the animation target is mapped relative to the *local* player so each
 * client sees the spell hit the correct side of the arena.
 */
export const useCardAnimation = (
  G: WizardDuelState,
  ctx: Ctx,
  localPlayerID: string
) => {
  const [showPlayerAnimation, setShowPlayerAnimation] = useState(false);
  const [showEnemyAnimation, setShowEnemyAnimation] = useState(false);
  const [cardAnimationData, setCardAnimationData] = useState<
    AnimationProps | undefined
  >();

  const handleShowCardAnimation = async (card: Card) => {
    const animationTarget = getAnimationTargetForCard(card.id);
    const animationData = getAnimationDataForCard(card.id);

    if (!animationTarget || !animationData) return;

    const shouldPlay = animateCardOnPlay();
    if (!shouldPlay) return;

    setCardAnimationData(animationData);

    // The acting seat and the local seat may differ; map target accordingly.
    const isLocalActor = ctx.currentPlayer === localPlayerID;
    const targetsLocalSelf =
      animationTarget === AnimationTarget.self ||
      animationTarget === AnimationTarget.both;
    const targetsLocalEnemy =
      animationTarget === AnimationTarget.enemy ||
      animationTarget === AnimationTarget.both;

    const showOnLocal = isLocalActor ? targetsLocalSelf : targetsLocalEnemy;
    const showOnOpponent = isLocalActor ? targetsLocalEnemy : targetsLocalSelf;

    setShowPlayerAnimation(showOnLocal);
    setShowEnemyAnimation(showOnOpponent);

    await sleep(animationData.timeout);

    setShowPlayerAnimation(false);
    setShowEnemyAnimation(false);
    setCardAnimationData(undefined);
  };

  /** Suppress the animation when the card cannot actually take effect. */
  const animateCardOnPlay = (): boolean => {
    const actor = G.players[ctx.currentPlayer];
    const hasFreezeEffect = actor.effects.some(
      (e) => e.type === EffectType.freeze
    );
    const shouldClearEffects =
      G.globalEffects.shouldClearEffects?.[ctx.turn - 1];

    if (hasFreezeEffect || shouldClearEffects) return false;
    return true;
  };

  return {
    cardAnimationData,
    showPlayerAnimation,
    showEnemyAnimation,
    handleShowCardAnimation,
  };
};