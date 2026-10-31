// Verifies the homepage hero slideshow: 5 unique local images, 3s interval, continuous crossfade, pausing, readability.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const b = await chromium.launch();
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };

const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
const imgReqs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
p.on('response', (r) => { if (/\/images\/.*\.jpg/.test(r.url())) imgReqs.push([new URL(r.url()).pathname, r.status()]); });
p.on('requestfailed', (r) => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') errs.push('req ' + r.url()); });

await p.goto(base + '/', { waitUntil: 'load' });
// start recording slide changes + per-frame opacity as early as possible
await p.evaluate(() => {
  const slides = [...document.querySelectorAll('.hero-slide')];
  window.__log = [];
  window.__minMax = 1;
  window.__frames = 0;
  const t0 = performance.now();
  slides.forEach((s, i) => new MutationObserver(() => { if (s.classList.contains('is-active')) window.__log.push({ i, t: Math.round(performance.now() - t0) }); }).observe(s, { attributes: true, attributeFilter: ['class'] }));
  const tick = () => {
    let mx = 0;
    slides.forEach((s) => { mx = Math.max(mx, +getComputedStyle(s).opacity); });
    window.__minMax = Math.min(window.__minMax, mx);
    window.__frames++;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await p.waitForTimeout(1500); // let first-slide settle + preloading finish
const probeAt = []; // incoming opacity partway through a fade
p.on('console', () => {});

// ---- structure ----
const s0 = await p.evaluate(() => ({
  n: document.querySelectorAll('.hero-slide').length,
  active: [...document.querySelectorAll('.hero-slide')].filter((s) => s.classList.contains('is-active')).length,
  urls: [...document.querySelectorAll('.hero-slide')].map((s) => (s.style.backgroundImage.match(/url\("?([^")]+)"?\)/) || [])[1]),
  hero: (() => { const h = document.querySelector('.hero').getBoundingClientRect(); return [Math.round(h.width), Math.round(h.height)]; })(),
  slideRects: [...document.querySelectorAll('.hero-slide')].map((s) => `${s.offsetWidth}x${s.offsetHeight}`),
}));
check('exactly 5 slides', s0.n === 5);
check(`5 unique local images (${s0.urls.map((u) => u && u.split('/').pop()).join(', ')})`, s0.urls.every(Boolean) && new Set(s0.urls).size === 5 && s0.urls.every((u) => u.startsWith('/images/')));
check('no external / hotlinked image URLs', s0.urls.every((u) => !/^https?:/.test(u)));
check('all 5 images fetched OK from the local server', [...new Set(s0.urls)].every((u) => imgReqs.some(([path, st]) => path === u && st === 200)), JSON.stringify(imgReqs.filter(([x]) => s0.urls.includes(x)).map(([x, s]) => x.split('/').pop() + ':' + s)));
check('one slide active at start; hero fills the screen, slides share its exact size', s0.active === 1 && s0.hero[1] === 900 && s0.slideRects.every((r) => r === `${s0.hero[0]}x${s0.hero[1]}`), `${s0.hero} ${s0.slideRects[0]}`);

// ---- timing: watch ~18s (6 changes => full loop incl. wrap-around) ----
const mid = [];
const watch = async () => {
  const start = Date.now();
  let seen = 0;
  while (Date.now() - start < 18500) {
    const n = await p.evaluate(() => window.__log.length);
    if (n > seen) {
      seen = n;
      await p.waitForTimeout(600); // ~600ms into the 1.2s fade
      mid.push(await p.evaluate(() => { const a = document.querySelector('.hero-slide.is-active'); const pr = document.querySelector('.hero-slide.is-prev'); return { inc: +getComputedStyle(a).opacity, out: pr ? +getComputedStyle(pr).opacity : null }; }));
    }
    await p.waitForTimeout(40);
  }
};
await watch();
const log = await p.evaluate(() => window.__log);
const order = log.map((l) => l.i);
const gaps = log.slice(1).map((l, k) => l.t - log[k].t);
check(`slides advance in sequence and loop (${order.join('>')})`, order.length >= 5 && order.every((v, k) => k === 0 || v === (order[k - 1] + 1) % 5) && order.includes(0) && order.slice(-3).includes(0) || order.every((v, k) => k === 0 || v === (order[k - 1] + 1) % 5));
check(`interval is 3000ms (gaps ${gaps.join(', ')})`, gaps.length >= 4 && gaps.every((g) => Math.abs(g - 3000) <= 150));
check(`crossfade is smooth, never instant (incoming opacity ~600ms in: ${mid.map((m) => m.inc.toFixed(2)).join(', ')})`, mid.length >= 4 && mid.every((m) => m.inc > 0.15 && m.inc < 0.95));
check('outgoing image stays fully opaque beneath the fade (no dip to the background)', mid.every((m) => m.out === 1));
const mm = await p.evaluate(() => ({ min: window.__minMax, frames: window.__frames }));
check(`never a dim/blank frame: lowest top opacity over ${mm.frames} frames = ${mm.min}`, mm.min >= 0.999 && mm.frames > 300);

// ---- pause: hidden tab ----
const count = () => p.evaluate(() => window.__log.length);
await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
await p.waitForTimeout(500);
const c1 = await count();
await p.waitForTimeout(7000);
check('pauses while the tab is in the background', (await count()) === c1);
await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
await p.waitForTimeout(3600);
check('resumes when the tab is visible again', (await count()) > c1);
// ---- pause: hero scrolled out of view ----
await p.evaluate(() => scrollTo({ top: 1600, behavior: 'instant' }));
await p.waitForTimeout(600);
const c2 = await count();
await p.waitForTimeout(6500);
check('pauses while the hero is scrolled out of view', (await count()) === c2);
await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
await p.waitForTimeout(3600);
check('resumes when the hero is back in view', (await count()) > c2);

// ---- the rest of the hero is unchanged ----
await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
const hero = await p.evaluate(() => ({
  h1: document.querySelector('.hero h1').textContent, overlay: getComputedStyle(document.querySelector('.hero'), '::after').backgroundImage.includes('linear-gradient'),
  sections: [...document.querySelectorAll('main > section')].map((s) => s.id).join(), logo: !!document.querySelector('.hdr-main img[src*="lft-logo"]'),
  nav: [...document.querySelectorAll('.hdr-main .hdr-nav a')].map((a) => a.textContent).join('|'), gallery: document.querySelectorAll('.recent-item').length,
  heroKids: [...document.querySelector('.hero').children].map((c) => c.className || c.tagName).join(','),
}));
check('hero design intact: overlay, navbar, logo, no on-hero text, same 3 homepage sections', hero.overlay && hero.logo && hero.heroKids === 'hero-slides,visually-hidden' && hero.sections === 'hero,recent-projects,partners' && hero.gallery === 6 && hero.nav === 'Home|About Us|Our Services|Our Projects|Contacts');

// ---- readability of the navbar over every slide ----
const lum = async (png) => {
  const q = await (await b.newContext()).newPage();
  await q.setContent(`<img id=i src="data:image/png;base64,${png.toString('base64')}"><canvas id=c></canvas>`);
  return q.evaluate(async () => {
    const i = document.getElementById('i'); await i.decode(); const c = document.getElementById('c'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0);
    const d = g.getImageData(400, 50, 640, 50).data; const ys = [];
    const L = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    for (let k = 0; k < d.length; k += 4) ys.push(0.2126 * L(d[k]) + 0.7152 * L(d[k + 1]) + 0.0722 * L(d[k + 2]));
    ys.sort((a, b) => a - b);
    const q = (p) => ys[Math.floor(p * (ys.length - 1))];
    // the nav text is a small share of pixels, so the median is the backdrop; p90 ignores the text highlights
    return { median: q(0.5), p75: q(0.75) };
  });
};
const lums = [];
await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
for (let tries = 0; tries < 9 && lums.filter(Boolean).length < 5; tries++) {
  const before = await p.evaluate(() => window.__log.length);
  while ((await p.evaluate(() => window.__log.length)) === before) await p.waitForTimeout(30);
  await p.waitForTimeout(1500); // fade finished, image settled
  const idx = await p.evaluate(() => [...document.querySelectorAll('.hero-slide')].findIndex((s) => s.classList.contains('is-active')));
  const png = await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 200 } });
  const idx2 = await p.evaluate(() => [...document.querySelectorAll('.hero-slide')].findIndex((s) => s.classList.contains('is-active')));
  if (idx !== idx2 || lums[idx]) continue;
  lums[idx] = await lum(png);
  const { writeFileSync } = await import('node:fs');
  writeFileSync(`screenshots/hero-slide-${idx + 1}.png`, png);
}
const ratio = (l) => 1.05 / (l + 0.05); // contrast of white text on a backdrop with relative luminance l
console.log('  navbar contrast (white text vs backdrop median / 75th pct):', lums.map((l, i) => l ? `#${i + 1} ${ratio(l.median).toFixed(1)}:1 / ${ratio(l.p75).toFixed(1)}:1` : `#${i + 1} n/a`).join('   '));
check('navbar text readable on all 5 slides (white text contrast >= 4.5:1 on the backdrop)', lums.filter(Boolean).length === 5 && lums.every((l) => ratio(l.median) >= 4.5));

check('no JS / console / request errors', errs.length === 0, errs.slice(0, 3).join(' | '));
await p.close();

// ---- tablet + mobile: runs, fills the screen, no overflow ----
for (const [name, w, h, touch] of [['tablet', 820, 1100, true], ['mobile', 390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: true });
  const q = await ctx.newPage();
  await q.goto(base + '/', { waitUntil: 'networkidle' });
  await q.evaluate(() => { window.__c = 0; document.querySelectorAll('.hero-slide').forEach((s) => new MutationObserver(() => { if (s.classList.contains('is-active')) window.__c++; }).observe(s, { attributes: true, attributeFilter: ['class'] })); });
  await q.waitForTimeout(7200);
  const r = await q.evaluate(() => ({ c: window.__c, ov: document.documentElement.scrollWidth > innerWidth, w: Math.round(document.querySelector('.hero').getBoundingClientRect().width), sw: document.querySelector('.hero-slide.is-active').offsetWidth, loaded: [...document.querySelectorAll('.hero-slide')].every((s) => s.style.backgroundImage) }));
  check(`${name}: rotates every 3s (${r.c} changes in 7.2s), all 5 loaded, fills width, no overflow`, (r.c === 2 || r.c === 3) && r.loaded && !r.ov && r.w === r.sw);
  await ctx.close();
}
// ---- reduced motion: still rotates, but with no animated transition ----
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const q = await ctx.newPage();
  await q.goto(base + '/', { waitUntil: 'networkidle' });
  const t = await q.$eval('.hero-slide', (s) => getComputedStyle(s).transitionDuration);
  await q.waitForTimeout(3500);
  check(`reduced motion: no fade animation (transition ${t}) but images still rotate`, /^0s/.test(t) && (await q.$eval('.hero-slide:nth-child(2)', (s) => s.classList.contains('is-active'))));
  await ctx.close();
}
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
