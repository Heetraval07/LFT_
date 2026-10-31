import { chromium } from 'playwright';
const [w, h, tag] = [+(process.argv[2] || 1440), +(process.argv[3] || 900), process.argv[4] || 'd'];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: w, height: h } });
await p.goto('http://localhost:5173/about.html', { waitUntil: 'networkidle' });
for (const id of ['intro', 'partners', 'authorities', 'services', 'statement', 'clients', 'reach', 'testimonials']) {
  await p.evaluate((i) => { const e = document.getElementById(i); scrollTo({ top: e.getBoundingClientRect().top + scrollY - 20, behavior: 'instant' }); }, id);
  await p.waitForTimeout(1300);
  await p.screenshot({ path: `screenshots/as-${tag}-${id}.png` });
}
await b.close();
