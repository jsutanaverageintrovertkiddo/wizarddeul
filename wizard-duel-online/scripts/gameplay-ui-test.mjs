// Full gameplay test through the real UI:
//   A creates a room, B joins, both enter battle.
//   A selects a card and ends the turn.
//   B's board must reflect the change (A's card leaves A's hand / B's turn).
export default async function run(page, ui) {
  const base = 'http://localhost:5173';
  const browser = page.context().browser();
  const out = {};

  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('create-room-button').click();
  await page.getByTestId('player-name-input').waitFor({ timeout: 5000 });
  await page.getByTestId('player-name-input').fill('Aelric');
  await page.getByTestId('create-confirm-button').click();
  const code = (await page.getByTestId('room-code-display').innerText()).trim();
  out.roomCode = code;

  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  await pageB.goto(base, { waitUntil: 'domcontentloaded' });
  await pageB.getByTestId('join-room-button').click();
  await pageB.getByTestId('player-name-input').waitFor({ timeout: 5000 });
  await pageB.getByTestId('player-name-input').fill('Bramwen');
  await pageB.getByTestId('room-code-input').fill(code);
  await pageB.getByTestId('join-game-button').click();

  await page.getByRole('button', { name: 'Begin Duel' }).waitFor({ timeout: 12000 });
  await pageB.getByRole('button', { name: 'Begin Duel' }).waitFor({ timeout: 12000 });
  await page.getByRole('button', { name: 'Begin Duel' }).click();
  await pageB.getByRole('button', { name: 'Begin Duel' }).click();
  await page.waitForTimeout(1500);

  // Turn indicator on each side.
  out.turnIndicatorA = await page.getByTestId('turn-indicator').innerText();
  out.turnIndicatorB = await pageB.getByTestId('turn-indicator').innerText();

  // A should be able to act (seat 0 goes first). Count A's own cards.
  const countLocalCards = async (p) => {
    // The local hand is the interactive one (has click handlers); count all
    // card-front images in the lower half by using the last 5 card-front imgs.
    return p.locator('[data-testid=card-front]').count();
  };

  out.cardsBeforeA = await countLocalCards(page);

  // A clicks a card then End Turn.
  const cardFrontsA = page.locator('[data-testid=card-front]');
  await cardFrontsA.last().click();
  await page.waitForTimeout(300);
  out.endTurnEnabledA = await page
    .getByTestId('end-turn-button')
    .isEnabled();
  await page.getByTestId('end-turn-button').click();
  await page.waitForTimeout(2000);

  // B should now be the acting player.
  out.turnIndicatorA_after = await page.getByTestId('turn-indicator').innerText();
  out.turnIndicatorB_after = await pageB.getByTestId('turn-indicator').innerText();

  // Wrong-player guard: A (no longer acting) clicks End Turn -> blocked.
  out.endTurnEnabledA_after = await page.getByTestId('end-turn-button').isEnabled();

  // Try an out-of-turn action on A: click a card; a message should appear.
  const cardsOnA = page.locator('[data-testid=card-front]');
  const n = await cardsOnA.count();
  if (n > 0) {
    await cardsOnA.first().click();
    await page.waitForTimeout(500);
    out.waitMessageVisible = await page
      .getByTestId('board-message')
      .isVisible()
      .catch(() => false);
    out.waitMessageText = out.waitMessageVisible
      ? await page.getByTestId('board-message').innerText()
      : null;
  }

  // B plays a card.
  const cardFrontsB = pageB.locator('[data-testid=card-front]');
  const countB = await cardFrontsB.count();
  if (countB > 0) {
    await cardFrontsB.last().click();
    await pageB.waitForTimeout(300);
    out.endTurnEnabledB = await pageB.getByTestId('end-turn-button').isEnabled();
    await pageB.getByTestId('end-turn-button').click();
    await pageB.waitForTimeout(2000);
  }

  out.turnIndicatorA_final = await page.getByTestId('turn-indicator').innerText();
  out.turnIndicatorB_final = await pageB.getByTestId('turn-indicator').innerText();

  await ctxB.close();
  return out;
}