import { Ctx } from 'boardgame.io';

import { Effect, EffectType } from '../../model/cardEffects';
import { Card, CardId, Wish2, Wish3, Wish4, Wish5 } from '../../model/cards';
import { WizardDuelState } from '../../model/shared';
import { applyEffect } from '../effect/effect';
import { getEffects, hasEffect, undoEffect } from '../effect/effectUtils';
import { maxTurn } from '../level/level';

/**
 * Deal cards to a player's hand until it contains 5 cards.
 */
export const dealCards = (hand: Card[], deck: Card[]) => {
  hand.push(...deck.splice(0, 5 - hand.length));
};

/**
 * Get one copy of a card from a deck by id.
 */
export const getCardById = (deck: Card[], cardId: CardId): Card => {
  const card = deck.find((c) => c.id === cardId);
  if (!card) {
    throw new Error(`Card with id ${cardId} not found in the deck.`);
  }
  return card;
};

/**
 * Remove one copy of a card from deck or hand array by id.
 */
export const removeCardById = (array: Card[], cardId: CardId) => {
  const index = array.findIndex((card) => card.id === cardId);
  if (index !== -1) {
    array.splice(index, 1);
  }
};

/**
 * Determine whether the game has ended and return the result.
 * Ending is HP-based; a turn cap yields a draw.
 */
export const isVictory = ({ G, ctx }: { G: WizardDuelState; ctx: Ctx }) => {
  if (
    (G.players[0].hp <= 0 && G.players[1].hp <= 0) ||
    ctx.turn >= maxTurn + 1
  ) {
    return { draw: true };
  } else if (G.players[0].hp <= 0) {
    return { winner: '1' };
  } else if (G.players[1].hp <= 0) {
    return { winner: '0' };
  }
};

/**
 * Handle the end of game logic.
 */
export const onGameEnd = ({ G, ctx }: { G: WizardDuelState; ctx: Ctx }) => {
  if (!ctx.gameover.winner) {
    console.log('Draw!');
  } else {
    console.log(`${G.players[ctx.gameover.winner].name} wins!`);
  }
};

/**
 * Apply effects at the start of turn if any, such as transforming the current
 * player's hand (Wish cards roll a new effect each turn).
 */
export const executeStartOfTurnEffects = (G: WizardDuelState, ctx: Ctx) => {
  const replaceWishCards = (hand: Card[]) => {
    const replacementOptions = [Wish2, Wish3, Wish4, Wish5];
    return hand.map((card) => {
      if (card.name === 'Wish') {
        const availableOptions = replacementOptions.filter(
          (option) => option.id !== card.id
        );
        return availableOptions[
          Math.floor(Math.random() * availableOptions.length)
        ];
      } else {
        return card;
      }
    });
  };
  // Transform `Wish` to a random effect.
  G.players[ctx.currentPlayer].hand = replaceWishCards(
    G.players[ctx.currentPlayer].hand
  );
};

/**
 * Apply active end-of-turn effects on the current player (auras).
 */
export const executeEndOfTurnEffects = (G: WizardDuelState, ctx: Ctx) => {
  if (hasEffect(G, ctx.currentPlayer, EffectType.aura)) {
    const auraEffects = getEffects(G, ctx.currentPlayer, EffectType.aura);
    auraEffects.forEach((aura: Effect) => {
      applyEffect(G, ctx, aura.effect!);
    });
  }
};

/**
 * Apply global effects triggered at end of turn if any, e.g. clearing all
 * buffs and debuffs on scheduled turns.
 */
export const executeGlobalEndOfTurnEffects = (
  G: WizardDuelState,
  ctx: Ctx
) => {
  if (G.globalEffects.shouldClearEffects?.[ctx.turn - 1]) {
    G.players[0].effects.forEach((e) => {
      undoEffect(G, '0', e);
    });
    G.players[0].effects = [];

    G.players[1].effects.forEach((e) => {
      undoEffect(G, '1', e);
    });
    G.players[1].effects = [];
  }
};

/**
 * Log the details of the current turn and game state in the server console.
 */
export const logPlay = (G: WizardDuelState, ctx: Ctx, card: Card) => {
  const p = G.players[ctx.currentPlayer];
  console.log(
    `Turn ${ctx.turn}: ${p.name} played ${card.name} (${card.text})`
  );
};