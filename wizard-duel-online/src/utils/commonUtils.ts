import { Card } from '../model/cards';

/**
 * Shuffle a deck of cards using Fisher-Yates algorithm.
 */
export const shuffle = (deck: Card[]): Card[] => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
};

/**
 * Pauses execution for a specified time.
 * Example: await sleep(2000);
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};