// Screenshots every page at desktop and mobile widths and reports console errors.
// Usage: npm run dev (in another terminal), then npm run screenshots
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE_URL || 'http://localhost:5173';
const pages = ['/', '/about.html', '/services.html', '/projects.html', '/project.html?p=linden-house', '/contact.html'];
const viewports = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
mkdirSync('screenshots', { recursive: true });

const browser = await chromium.launch();
let problems = 0;
for (const [vpName, viewport] of Object.entries(viewports)) {
  const ctx = await browser.newContext({ viewport });
  for (const path of pages) {
    const page = await ctx.newPage();
    page.on('pageerror', (e) => { problems++; console.log(`  [error] ${path}: ${e.message}`); });
    page.on('console', (m) => { if (m.type() === 'error') { problems++; console.log(`  [console] ${path}: ${m.text()}`); } });
    page.on('requestfailed', (r) => { if (!r.url().includes('openstreetmap')) { problems++; console.log(`  [request] ${path}: ${r.url()}`); } });
    await page.goto(base + path, { waitUntil: 'networkidle' });
    // Scroll through the page so scroll-triggered reveals fire.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 80)); }
      scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForTimeout(1300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) { problems++; console.log(`  [layout] ${path} scrolls horizontally at ${vpName}`); }
    const name = path.replace(/[/?=.]+/g, '_').replace(/^_|_html$/g, '') || 'home';
    await page.screenshot({ path: `screenshots/${vpName}-${name || 'home'}.png`, fullPage: true });
    console.log(`ok ${vpName} ${path}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(problems ? `${problems} problem(s) found` : 'No problems found');
process.exitCode = problems ? 1 : 0;
