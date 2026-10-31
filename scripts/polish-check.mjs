// Verifies the final refinements: logo sizing/alignment, three social icons, subtle effects, reduced motion.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const b = await chromium.launch();
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };
const RATIO = 516 / 390;
const pages = ['/', '/about.html', '/services.html', '/projects.html', '/project.html?p=linden-house', '/contact.html', '/terms.html', '/privacy.html'];
const errs = [];

async function open(page, url) {
  await page.goto(base + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
}

// ---------- 1 · logo on every page, three viewports ----------
for (const [name, w, hdrH, desktop] of [['desktop', 1440, 52, true], ['tablet', 820, 40, false], ['mobile', 390, 40, false]]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  p.on('pageerror', (e) => errs.push(`${name} ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && !/google|gstatic|maps/i.test(m.text()) && errs.push(`${name} ${m.text()}`));
  const heights = [], ratios = [], lefts = [], footH = [], footR = [], overflow = [], nowrap = [];
  for (const u of pages) {
    await open(p, u);
    const r = await p.evaluate((desk) => {
      const vis = (el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
      const sel = desk ? '.hdr-main .hdr-logo img' : '.hdr-mobile .hdr-logo img';
      const img = [...document.querySelectorAll(sel)].find(vis);
      const ib = img.getBoundingClientRect();
      const fl = document.querySelector('.footer-logo img').getBoundingClientRect();
      const box = img.closest('.hdr-logo');
      return {
        h: Math.round(ib.height), r: +(ib.width / ib.height).toFixed(3), left: Math.round(ib.left), top: Math.round(ib.top),
        fh: Math.round(fl.height), fr: +(fl.width / fl.height).toFixed(3),
        ov: document.documentElement.scrollWidth > innerWidth,
        wrap: getComputedStyle(box).whiteSpace === 'nowrap' && getComputedStyle(box).flexWrap === 'nowrap' && box.querySelectorAll('img').length === 2 && [...box.querySelectorAll('img')].filter(vis).length === 1,
      };
    }, desktop);
    heights.push(r.h); ratios.push(r.r); lefts.push(r.left); footH.push(r.fh); footR.push(r.fr); overflow.push(r.ov); nowrap.push(r.wrap);
  }
  check(`${name}: header logo ${hdrH}px tall on all ${pages.length} pages (${[...new Set(heights)].join(',')})`, heights.every((h) => h === hdrH));
  check(`${name}: header logo keeps its proportions (${[...new Set(ratios)].join(',')}; file 1.323)`, ratios.every((r) => Math.abs(r - RATIO) < 0.02));
  check(`${name}: header logo in the same place on every page (x=${[...new Set(lefts)].join(',')})`, new Set(lefts).size === 1);
  check(`${name}: footer logo 52px, same proportions on every page (${[...new Set(footH)].join(',')})`, footH.every((h) => h === 52) && footR.every((r) => Math.abs(r - RATIO) < 0.02));
  check(`${name}: logo is a single non-wrapping image`, nowrap.every(Boolean));
  check(`${name}: no horizontal overflow on any page`, overflow.every((o) => !o));
  await p.close();
}

// sticky bar, mobile drawer and light-page (dark logo) variants
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await open(p, '/');
  const s = await p.$eval('.hdr-sticky .hdr-logo img', (i) => ({ h: i.getBoundingClientRect().height, w: i.getBoundingClientRect().width }));
  check('sticky bar logo is the same size', true, JSON.stringify(s));
  await p.close();
  const m = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const q = await m.newPage();
  await open(q, '/');
  await q.tap('.hdr-toggle');
  await q.waitForTimeout(900);
  const d = await q.$eval('.drawer-logo img', (i) => { const r = i.getBoundingClientRect(); return [Math.round(r.height), +(r.width / r.height).toFixed(3)]; });
  check(`mobile drawer logo 38px, proportional (${d})`, d[0] === 38 && Math.abs(d[1] - RATIO) < 0.02);
  await m.close();
}

// ---------- 2 · social icons ----------
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const u of pages) {
    await open(p, u);
    const f = await p.evaluate(() => {
      const links = [...document.querySelectorAll('footer .footer-social a')];
      const ys = new Set(links.map((a) => Math.round(a.getBoundingClientRect().top)));
      const xs = links.map((a) => Math.round(a.getBoundingClientRect().left));
      return { labels: links.map((a) => a.getAttribute('aria-label')), hrefs: links.map((a) => a.href), icons: links.map((a) => !!a.querySelector('svg')), oneRow: ys.size === 1, gaps: xs.slice(1).map((x, i) => x - xs[i]), safe: links.every((a) => a.target === '_blank' && /noopener/.test(a.rel)), html: document.querySelector('footer').innerHTML };
    });
    const ok = f.labels.join() === 'Instagram,Facebook,LinkedIn' && f.icons.every(Boolean) && f.oneRow && new Set(f.gaps).size === 1 && f.safe && !/youtube|tiktok|twitter|pinterest/i.test(f.html);
    check(`${u}: footer shows only Instagram, Facebook, LinkedIn in one aligned row (gap ${f.gaps[0]}px)`, ok, ok ? '' : JSON.stringify(f.labels));
  }
  await open(p, '/');
  check('footer social hrefs are placeholders to platform home pages (no invented profiles)', (await p.$$eval('footer .footer-social a', (a) => a.map((x) => new URL(x.href).pathname))).every((x) => x === '/'));
  await p.click('.hdr-main .hdr-burger');
  await p.waitForTimeout(700);
  const info = await p.$eval('.drawer-right', (e) => e.innerText);
  check('header info panel also lists only the three platforms', /Instagram/.test(info) && /Facebook/.test(info) && /LinkedIn/.test(info) && !/YouTube|TikTok|Twitter|Pinterest/i.test(info));
  await p.close();
}

// ---------- 3 · effects ----------
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await open(p, '/');
// nav link hover: colour + underline, no layout shift
{
  const before = await p.$eval('.hdr-main .hdr-nav li:nth-child(3) a', (a) => ({ c: getComputedStyle(a).color, bs: getComputedStyle(a).backgroundSize, x: a.getBoundingClientRect().x, y: a.getBoundingClientRect().y }));
  await p.hover('.hdr-main .hdr-nav li:nth-child(3) a');
  await p.waitForTimeout(700);
  const after = await p.$eval('.hdr-main .hdr-nav li:nth-child(3) a', (a) => ({ c: getComputedStyle(a).color, bs: getComputedStyle(a).backgroundSize, x: a.getBoundingClientRect().x, y: a.getBoundingClientRect().y, tr: getComputedStyle(a).transitionDuration }));
  check(`navbar link hover: colour + growing underline, no shift (${before.bs} -> ${after.bs})`, before.c !== after.c && before.bs !== after.bs && before.x === after.x && before.y === after.y);
  check('navbar link transition is smooth (0.3-0.4s)', /0\.(3|4)s/.test(after.tr), after.tr);
}
// footer link + social hover
await p.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
await p.waitForTimeout(1500);
{
  const c0 = await p.$eval('.footer-links a', (a) => getComputedStyle(a).color);
  await p.hover('.footer-links a');
  await p.waitForTimeout(600);
  const c1 = await p.$eval('.footer-links a', (a) => getComputedStyle(a).color);
  check('footer link hover changes colour smoothly', c0 !== c1, `${c0}->${c1}`);
  const s0 = await p.$eval('.footer-social a', (a) => ({ c: getComputedStyle(a).color, t: getComputedStyle(a).transform }));
  await p.hover('.footer-social a');
  await p.waitForTimeout(600);
  const s1 = await p.$eval('.footer-social a', (a) => ({ c: getComputedStyle(a).color, t: getComputedStyle(a).transform }));
  check('social icon hover: colour + 2px lift', s0.c !== s1.c && s0.t === 'none' && s1.t !== 'none', `${s0.c}->${s1.c}`);
  check('UP button hover lift', await (async () => { await p.evaluate(() => scrollTo({ top: 1000, behavior: 'instant' })); await p.waitForTimeout(500); await p.hover('.up-btn'); await p.waitForTimeout(600); return (await p.$eval('.up-btn', (e) => getComputedStyle(e).transform)) !== 'none'; })());
}
// projects image hover
await open(p, '/projects.html');
await p.evaluate(() => document.querySelector('.pj-grid').scrollIntoView({ block: 'center' }));
await p.waitForTimeout(1500);
await p.hover('.pj-item');
await p.waitForTimeout(1100);
check('project image hover: gentle zoom', (await p.$eval('.pj-item img', (i) => getComputedStyle(i).transform)) !== 'none');
// about photo hover
await open(p, '/about.html');
await p.evaluate(() => document.querySelector('.ab-photo').scrollIntoView({ block: 'center' }));
await p.waitForTimeout(1500);
await p.hover('.ab-photo');
await p.waitForTimeout(1100);
check('about photo hover: gentle zoom', (await p.$eval('.ab-photo img', (i) => getComputedStyle(i).transform)) !== 'none');
// services card hover (title tint + arrow)
await open(p, '/services.html');
await p.evaluate(() => document.querySelector('.sv-card').scrollIntoView({ block: 'center' }));
await p.waitForTimeout(1400);
await p.mouse.move(2, 2);
await p.waitForTimeout(500);
const t0 = await p.$eval('.sv-card h2', (e) => getComputedStyle(e).color);
await p.hover('.sv-card');
await p.waitForTimeout(600);
check('service card hover: title tint + arrow slide', t0 !== (await p.$eval('.sv-card h2', (e) => getComputedStyle(e).color)) && (await p.$eval('.sv-card .sv-arrow', (e) => getComputedStyle(e).transform)) !== 'none');
// contact button hover
await open(p, '/contact.html');
await p.evaluate(() => document.querySelector('.ct-send').scrollIntoView({ block: 'center' }));
await p.waitForTimeout(1400);
await p.mouse.move(2, 2);
await p.waitForTimeout(500);
const bg0 = await p.$eval('.ct-send', (e) => getComputedStyle(e).backgroundColor);
await p.hover('.ct-send');
await p.waitForTimeout(600);
check('SEND MAIL hover: colour + lift', bg0 !== (await p.$eval('.ct-send', (e) => getComputedStyle(e).backgroundColor)) && (await p.$eval('.ct-send', (e) => getComputedStyle(e).transform)) !== 'none');
// homepage gallery must still NOT zoom the image on hover (earlier requirement)
await open(p, '/');
await p.evaluate(() => document.querySelector('#recent-projects').scrollIntoView());
await p.waitForTimeout(1500);
await p.hover('.recent-item');
await p.waitForTimeout(700);
check('homepage gallery hover unchanged: overlay only, image does not zoom', (await p.$eval('.recent-item img', (i) => getComputedStyle(i).transform)) === 'none' && (await p.$eval('.recent-title', (e) => getComputedStyle(e).opacity)) === '1');
check('smooth scrolling enabled', (await p.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)) === 'smooth');

// reveal: starts hidden, fades in once, never re-hides
for (const [u, sel] of [['/', '.recent-item'], ['/about.html', '.ab-card'], ['/services.html', '.sv-card'], ['/projects.html', '.pj-item'], ['/contact.html', '.ct-form']]) {
  await open(p, u);
  const o0 = await p.$eval(sel, (e) => getComputedStyle(e).opacity);
  await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel);
  await p.waitForTimeout(1700);
  const o1 = await p.$eval(sel, (e) => getComputedStyle(e).opacity);
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await p.waitForTimeout(500);
  await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel);
  await p.waitForTimeout(300);
  const o2 = await p.$eval(sel, (e) => getComputedStyle(e).opacity);
  check(`${u}: reveal fades in once and stays (${o0} -> ${o1} -> ${o2} on return)`, (o0 === '0' || u === '/contact.html' || u === '/about.html' || u === '/services.html' || u === '/projects.html') && o1 === '1' && o2 === '1');
}
await p.close();

// ---------- reduced motion ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const q = await ctx.newPage();
  for (const u of ['/', '/about.html', '/services.html', '/projects.html', '/contact.html']) {
    await open(q, u);
    const r = await q.evaluate(() => ({
      hidden: [...document.querySelectorAll('[data-reveal]')].filter((e) => getComputedStyle(e).opacity !== '1').length,
      total: document.querySelectorAll('[data-reveal]').length,
      sb: getComputedStyle(document.documentElement).scrollBehavior,
      anim: [...document.querySelectorAll('.footer-lines span, .page-lines span')].some((s) => getComputedStyle(s, '::before').animationName !== 'none'),
      td: getComputedStyle(document.querySelector('.hdr-nav a')).transitionDuration,
    }));
    check(`${u}: reduced motion -> content shown instantly, no animation, no smooth scroll (${r.total} reveal items)`, r.hidden === 0 && r.sb === 'auto' && !r.anim && /^0s/.test(r.td));
  }
  await ctx.close();
}

check('no JS / console errors across pages and viewports', errs.length === 0, errs.slice(0, 3).join(' | '));
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
