// Verifies the battle board loads all images and text is readable.
export default async function run(page, ui) {
  const base = 'http://localhost:5173';
  const browser = page.context().browser();

  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('create-room-button').click();
  await page.getByTestId('player-name-input').waitFor({ timeout: 5000 });
  await page.getByTestId('player-name-input').fill('Aelric');
  await page.getByTestId('create-confirm-button').click();

  const code = (await page.getByTestId('room-code-display').innerText()).trim();

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

  // Wait for all <img> elements to finish loading (naturalWidth > 0).
  await page.waitForFunction(
    () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0);
    },
    { timeout: 15000 }
  ).catch(() => {});

  await page.waitForTimeout(500);

  const imgStats = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const broken = imgs.filter((i) => !i.complete || i.naturalWidth === 0);
    return {
      total: imgs.length,
      broken: broken.length,
      brokenSrcs: broken.map((i) => i.getAttribute('src')).slice(0, 10),
    };
  });

  // Read the computed colour of the HP value text on the local panel.
  const hpColor = await page.evaluate(() => {
    const el = document.querySelector('.pstats-text');
    return el ? getComputedStyle(el).color : 'none';
  });

  const bodyText = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const opponentVisibleOnA = bodyText.includes('Bramwen');
  const localVisibleOnA = bodyText.includes('Aelric');

  await page.screenshot({ path: 'battle-final-a.png', fullPage: false });
  await pageB.screenshot({ path: 'battle-final-b.png', fullPage: false });

  await ctxB.close();

  return {
    code,
    imagesTotal: imgStats.total,
    imagesBroken: imgStats.broken,
    brokenSrcs: imgStats.brokenSrcs,
    hpTextColor: hpColor,
    localVisibleOnA,
    opponentVisibleOnA,
    bodySample: bodyText.slice(0, 260),
  };
}