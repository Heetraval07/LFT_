import { chromium } from 'playwright';
const b = await chromium.launch();
for (const [n, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://localhost:5173/about.html', { waitUntil: 'networkidle' });
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 70)); } scrollTo({ top: 0, behavior: 'instant' }); });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `screenshots/a-${n}-full.png`, fullPage: true });
  console.log(n, 'height', await p.evaluate(() => document.body.scrollHeight), 'errors', errs.join('|') || 'none');
  await p.close();
}
await b.close();
