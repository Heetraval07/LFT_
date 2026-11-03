// Pixel-compares every page of two running copies of the site (e.g. the old Vite build vs the new Next.js app).
// Usage: node scripts/compare-builds.mjs http://localhost:4173 http://localhost:5173
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const [A = 'http://localhost:4173', B = 'http://localhost:5173'] = process.argv.slice(2);
const pages = ['/', '/about.html', '/services.html', '/projects.html', '/project.html?p=eyewa-masdar', '/project.html?p=dopamine-oasis-mall', '/contact.html', '/terms.html', '/privacy.html'];
mkdirSync('screenshots/compare', { recursive: true });

const b = await chromium.launch();
// Reduced motion: no slideshow timing, reveal or marquee movement, so both captures are deterministic.
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
async function shoot(base, path) {
  const p = await ctx.newPage();
  await p.goto(base + path, { waitUntil: 'networkidle' });
  await p.waitForSelector('footer');
  await p.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    scrollTo(0, 0);
    // map iframes and the live marquee are third-party / time-based: blank them in both captures
    document.querySelectorAll('iframe').forEach((f) => { f.style.visibility = 'hidden'; });
    document.querySelectorAll('.partners-track, .hdr-sticky, .up-btn').forEach((e) => { e.style.visibility = 'hidden'; });
  });
  await p.waitForTimeout(1200);
  const png = await p.screenshot({ fullPage: true });
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.close();
  return { png, h };
}
const diffPage = await ctx.newPage();
await diffPage.setContent('<canvas id=a></canvas><canvas id=b></canvas>');
let worst = 0;
for (const path of pages) {
  const [x, y] = [await shoot(A, path), await shoot(B, path)];
  const r = await diffPage.evaluate(async ([pa, pb]) => {
    const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + s; });
    const [ia, ib] = await Promise.all([load(pa), load(pb)]);
    const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
    const ca = document.getElementById('a'), cb = document.getElementById('b');
    ca.width = cb.width = w; ca.height = cb.height = h;
    const ga = ca.getContext('2d'), gb = cb.getContext('2d');
    ga.drawImage(ia, 0, 0); gb.drawImage(ib, 0, 0);
    const da = ga.getImageData(0, 0, w, h).data, db = gb.getImageData(0, 0, w, h).data;
    let diff = 0;
    for (let k = 0; k < da.length; k += 4) if (Math.abs(da[k] - db[k]) + Math.abs(da[k + 1] - db[k + 1]) + Math.abs(da[k + 2] - db[k + 2]) > 48) diff++;
    return { pct: (100 * diff) / (w * h), sizes: [ia.width, ia.height, ib.width, ib.height] };
  }, [x.png.toString('base64'), y.png.toString('base64')]);
  const name = path.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
  writeFileSync(`screenshots/compare/${name}-old.png`, x.png);
  writeFileSync(`screenshots/compare/${name}-new.png`, y.png);
  worst = Math.max(worst, r.pct);
  console.log(`${path.padEnd(38)} height old ${x.h} / new ${y.h}   differing pixels ${r.pct.toFixed(3)}%`);
}
await b.close();
console.log(`worst page: ${worst.toFixed(3)}% of pixels differ`);
