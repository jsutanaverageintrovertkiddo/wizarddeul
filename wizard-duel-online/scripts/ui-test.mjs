// Drives the full UI multiplayer flow across two independent browser contexts:
//   Browser A: CREATE ROOM -> waiting screen -> battle
//   Browser B: JOIN ROOM   -> battle
// Verifies both land in the same battle and see each other's wizard names.
export default async function run(page, ui) {
  const base = 'http://localhost:5173';
  const browser = page.context().browser();

  const results = {};

  // --- Browser A: create a room ---
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('create-room-button').click();

  const nameInputA = page.getByTestId('player-name-input');
  await nameInputA.waitFor({ timeout: 5000 });
  await nameInputA.fill('Aelric');
  await page.getByTestId('create-confirm-button').click();

  // Waiting screen shows the room code.
  const codeDisplay = page.getByTestId('room-code-display');
  await codeDisplay.waitFor({ timeout: 8000 });
  const roomCode = (await codeDisplay.innerText()).trim();
  results.roomCode = roomCode;

  const waitingStatus = await page.getByTestId('waiting-status').innerText();
  const playerCount = await page.getByTestId('player-count').innerText();
  results.waitingStatus = waitingStatus;
  results.playerCountBeforeJoin = playerCount;

  // --- Browser B: join the same room ---
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto(base, { waitUntil: 'domcontentloaded' });
  await pageB.getByTestId('join-room-button').click();

  await pageB.getByTestId('player-name-input').waitFor({ timeout: 5000 });
  await pageB.getByTestId('player-name-input').fill('Bramwen');
  await pageB.getByTestId('room-code-input').fill(roomCode);
  await pageB.getByTestId('join-game-button').click();

  // Both should auto-advance to the battle screen (matchup modal first).
  // The matchup modal's "Begin Duel" button is the marker.
  await page.getByRole('button', { name: 'Begin Duel' }).waitFor({ timeout: 12000 });
  await pageB.getByRole('button', { name: 'Begin Duel' }).waitFor({ timeout: 12000 });
  results.bothEnteredBattle = true;

  // Dismiss the matchup modal on both so the board is interactive.
  await page.getByRole('button', { name: 'Begin Duel' }).click();
  await pageB.getByRole('button', { name: 'Begin Duel' }).click();

  await page.waitForTimeout(1000);

  // Read what each board shows.
  const bodyA = await page.locator('body').innerText();
  const bodyB = await pageB.locator('body').innerText();

  results.boardAShowsOpponent = bodyA.includes('Bramwen');
  results.boardBShowsOpponent = bodyB.includes('Aelric');
  results.pageATitle = await page.title();
  results.pageBTitle = await pageB.title();

  // Capture a screenshot of the battle board for visual verification.
  await page.screenshot({ path: 'battle-a.png', fullPage: false });
  await pageB.screenshot({ path: 'battle-b.png', fullPage: false });

  await contextB.close();

  results.sampleA = bodyA.replace(/\s+/g, ' ').slice(0, 300);
  results.sampleB = bodyB.replace(/\s+/g, ' ').slice(0, 300);
  return results;
}