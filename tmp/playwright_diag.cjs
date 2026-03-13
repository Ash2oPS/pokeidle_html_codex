const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chromium' }).catch(() => chromium.launch({ headless: true }));
  const page = await browser.newPage();
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) console.log('NAV', frame.url());
  });
  page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE_ERR', msg.text()); });
  page.on('pageerror', (err) => console.log('PAGE_ERR', String(err)));
  await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'));
  console.log('HAS_CANVAS', hasCanvas);
  const text = await page.evaluate(() => typeof window.render_game_to_text === 'function' ? window.render_game_to_text() : null);
  fs.mkdirSync('output/web-game-ppu-check-manual', { recursive: true });
  await page.screenshot({ path: 'output/web-game-ppu-check-manual/shot-0.png', fullPage: false });
  if (text) fs.writeFileSync('output/web-game-ppu-check-manual/state-0.json', text);
  await browser.close();
})();
