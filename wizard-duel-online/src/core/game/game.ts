import { Ctx, Game, Move } from 'boardgame.io';

import { EffectType } from '../../model/cardEffects';
import { CardId } from '../../model/cards';
import { getDeck } from '../../model/deck';
import { createPlayer } from '../../model/player';
import { MatchData, WizardDuelState } from '../../model/shared';
import { shuffle } from '../../utils/commonUtils';
import { applyEffect } from '../effect/effect';
import { hasEffect, removeEffects } from '../effect/effectUtils';
import { ONLINE_LEVEL, globalEffectsDefault } from '../level/level';
import {
  dealCards,
  executeEndOfTurnEffects,
  executeGlobalEndOfTurnEffects,
  executeStartOfTurnEffects,
  getCardById,
  isVictory,
  logPlay,
  onGameEnd,
  removeCardById,
} from './gameUtils';

/**
 * Setup receives the room metadata (names, level) so each seat gets the right
 * display name. boardgame.io passes `setup` data through `ctx` → `this` via the
 * second argument, wired up in the server's createRoom call.
 */
const setupData = (_ctx: unknown, setupData: Partial<MatchData> | undefined): WizardDuelState => {
  const names = setupData?.names ?? { '0': 'Wizard 1', '1': 'Wizard 2' };

  const G: WizardDuelState = {
    players: {
      '0': createPlayer('0', names['0'] ?? 'Wizard 1'),
      '1': createPlayer('1', names['1'] ?? 'Wizard 2'),
    },
    deck: shuffle([...getDeck()]),
    level: setupData?.level ?? ONLINE_LEVEL,
    globalEffects: { ...globalEffectsDefault },
  };

  dealCards(G.players['0'].hand, G.deck);
  dealCards(G.players['1'].hand, G.deck);

  return G;
};

/**
 * Draw one card. Turn 1 (the very first move of the game) is the only turn
 * without a draw phase.
 */
const drawCard: Move<WizardDuelState> = ({ G, ctx }, cardId?: CardId) => {
  if (ctx.turn <= 1) return;

  executeStartOfTurnEffects(G, ctx);

  const hand = G.players[ctx.currentPlayer].hand;
  if (hand.length >= 5 || G.deck.length === 0) {
    throw new Error('Invalid move: cannot draw more cards.');
  }

  if (cardId) {
    // Select mode (unused online, kept for parity)
    const card = getCardById(G.deck, cardId);
    hand.push(card);
    removeCardById(G.deck, cardId);
  } else {
    const card = G.deck.pop();
    if (!card) throw new Error('Tried to draw from an empty deck.');
    hand.push(card);
  }

  if (G.deck.length === 0) {
    G.deck = shuffle([...getDeck()]);
  }
};

/**
 * Play the card at `index` from the current player's hand, resolve all of its
 * effects, then let boardgame.io advance the turn.
 */
const playCard: Move<WizardDuelState> = ({ G, ctx }, index: number) => {
  const hand = G.players[ctx.currentPlayer].hand;
  if (index < 0 || index >= hand.length) {
    throw new Error('Invalid move: card index out of bounds.');
  }

  const card = hand[index];
  if (card.effects) {
    card.effects.forEach((e) => {
      applyEffect(G, ctx, e);
    });
  }

  // Freeze consumes the played card's effects this turn.
  let freezeTriggered = false;
  if (hasEffect(G, ctx.currentPlayer, EffectType.freeze)) {
    removeEffects(G, ctx.currentPlayer, EffectType.freeze);
    freezeTriggered = true;
  }

  executeEndOfTurnEffects(G, ctx);
  executeGlobalEndOfTurnEffects(G, ctx);
  removeCardById(hand, card.id);
  logPlay(G, ctx, card);
};

/**
 * Skip the current player's turn without acting. Used when a client cannot
 * render a valid action (e.g. all their cards were consumed) so the duel never
 * deadlocks.
 */
const endTurn: Move<WizardDuelState> = ({ G, ctx }) => {
  executeGlobalEndOfTurnEffects(G, ctx);
  console.log(`Turn ${ctx.turn}: ${G.players[ctx.currentPlayer].name} passed.`);
};

export const WizardDuel: Game<WizardDuelState> = {
  name: 'wizard-duel',

  setup: setupData,

  moves: {
    drawCard,
    playCard,
    endTurn,
  },

  turn: {
    // A wizard's turn is: play one card, then pass. The board calls
    // `events.endTurn()` right after `playCard`, so the turn flips as soon as a
    // card is played while `minMoves: 1` guarantees the turn can never stall.
    minMoves: 1,
    maxMoves: 2,
  },

  endIf: isVictory,

  onEnd: onGameEnd,
};

export type { Ctx };
