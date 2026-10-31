// Verifies the header against measurements taken from the reference site.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const out = process.env.OUT || 'screenshots';
const b = await chromium.launch();
const res = [];
const check = (n, ok, extra = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${extra}`); };
const near = (a, e, t = 1.5) => Math.abs(a - e) <= t;

const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(base + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const m = await p.evaluate(() => {
  const r = (s) => document.querySelector(s).getBoundingClientRect();
  const links = [...document.querySelectorAll('.hdr-main .hdr-nav a')].map((a) => {
    const bx = a.getBoundingClientRect(), c = getComputedStyle(a);
    return { t: a.textContent, x: bx.x, w: bx.width, fs: c.fontSize, ls: c.letterSpacing, fw: c.fontWeight, ff: c.fontFamily, col: c.color };
  });
  const st = document.querySelector('.hdr-sticky');
  return {
    hdr: r('.hdr-main'), pos: getComputedStyle(document.querySelector('.hdr-main')).position,
    logo: r('.hdr-main .hdr-logo'), links, burger: r('.hdr-main .hdr-burger'), search: r('.hdr-main .hdr-search svg'),
    stickyTf: getComputedStyle(st).transform, stickyTr: getComputedStyle(st).transition,
    font: document.fonts.check('500 12px Montserrat'),
  };
});
check('header height 147', near(m.hdr.height, 147), m.hdr.height);
check('header is absolute (scrolls away)', m.pos === 'absolute');
check('logo box x=135, 135 tall', near(m.logo.x, 135) && near(m.logo.height, 135), `${m.logo.x},${m.logo.height}`);
check('Montserrat loaded', m.font);
check('link font 12px / 500 / 1.2px', m.links.every((l) => l.fs === '12px' && l.fw === '500' && l.ls === '1.2px'), m.links[0].ff);
console.log('  link x:', m.links.map((l) => `${l.t}@${l.x.toFixed(0)}(${l.w.toFixed(0)})`).join(' '), ' [ref: 422(44) 510(74) 629(106) 779(110) 934(76)]');
check('HOME near x=422', near(m.links[0].x, 422, 6));
check('HOME is active colour (lightened tan on the homepage hero)', m.links[0].col === 'rgb(217, 210, 174)', m.links[0].col);
check('burger x~1228, 14 wide', near(m.burger.x, 1228, 3) && near(m.burger.width, 14, 1), `${m.burger.x}`);
check('search icon x~1286', near(m.search.x, 1286, 3), `${m.search.x}`);
check('sticky hidden at top (rotateX -90)', m.stickyTf.includes('-1'), m.stickyTf.slice(0, 40));
check('sticky transition 0.5s ease-in-out', /0\.5s ease-in-out/.test(m.stickyTr));
await p.screenshot({ path: `${out}/h-top.png`, clip: { x: 0, y: 0, width: 1440, height: 260 } });

const shown = () => p.evaluate(() => document.querySelector('.hdr-sticky').classList.contains('is-shown'));
const wheel = async (dy) => { await p.mouse.move(300, 500); await p.mouse.wheel(0, dy); await p.waitForTimeout(250); };
await wheel(100);
check('header scrolls away with page', (await p.$eval('.hdr-main', (e) => e.getBoundingClientRect().top)) < -50);
for (let i = 0; i < 6; i++) await wheel(300);
await p.waitForTimeout(800);
check('sticky hidden while scrolling down', !(await shown()));
await wheel(-60);
await p.waitForTimeout(800);
check('sticky shown on scroll up', await shown());
const sb = await p.$eval('.hdr-sticky', (e) => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return { h: r.height, bg: c.backgroundColor, pos: c.position, top: r.top }; });
check('sticky 135px, #0a0a0a, fixed at top', near(sb.h, 135) && sb.bg === 'rgb(10, 10, 10)' && sb.pos === 'fixed' && sb.top === 0, JSON.stringify(sb));
const ly = await p.$eval('.hdr-sticky .hdr-nav a', (a) => { const r = a.getBoundingClientRect(); return r.y + r.height / 2; });
check('sticky links vertically centred (~68)', near(ly, 67.5, 3), ly.toFixed(1));
await p.screenshot({ path: `${out}/h-sticky.png`, clip: { x: 0, y: 0, width: 1440, height: 220 } });
await wheel(300);
await p.waitForTimeout(800);
check('sticky hides again on scroll down', !(await shown()));
await p.evaluate(() => scrollTo({ top: 400, behavior: 'instant' }));
await wheel(-100);
await p.waitForTimeout(700);
check('shown when scrolling up at ~300', await shown());
await p.evaluate(() => scrollTo({ top: 150, behavior: 'instant' }));
await p.waitForTimeout(300);
await p.evaluate(() => scrollTo({ top: 130, behavior: 'instant' }));
await p.waitForTimeout(700);
check('hidden when scrolling up at ~130 (< 147)', !(await shown()));
await p.evaluate(() => scrollTo({ top: 1500, behavior: 'instant' }));
await p.waitForTimeout(600);
await p.evaluate(() => scrollTo({ top: 1480, behavior: 'instant' }));
await p.waitForTimeout(220);
await p.screenshot({ path: `${out}/h-mid.png`, clip: { x: 0, y: 0, width: 1440, height: 220 } });

// search popup + info panel
await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
await p.waitForTimeout(500);
await p.click('.hdr-main .hdr-search');
await p.waitForTimeout(600);
check('search popup opens', await p.$eval('.search-pop', (e) => e.classList.contains('is-open')));
await p.fill('.search-pop input', 'kitchen');
await p.keyboard.press('Enter');
await p.waitForURL(/q=kitchen/);
await p.waitForLoadState('networkidle');
check('search navigates & filters', p.url().includes('q=kitchen') && (await p.$$eval('.pj-item', (c) => c.length)) === 1);
await p.click('.hdr-main .hdr-burger');
await p.waitForTimeout(700);
check('info panel opens', await p.$eval('.drawer-right', (e) => e.classList.contains('is-open')));
await p.screenshot({ path: `${out}/h-info.png` });
await p.keyboard.press('Escape');
await p.waitForTimeout(500);
check('Escape closes panel', !(await p.$eval('.drawer-right', (e) => e.classList.contains('is-open'))));
check('no JS errors', errs.length === 0, errs.join('|'));

// 1199 vs 1200 breakpoint
for (const [w, desk] of [[1200, true], [1199, false]]) {
  const q = await b.newPage({ viewport: { width: w, height: 800 } });
  await q.goto(base + '/', { waitUntil: 'networkidle' });
  const vis = await q.evaluate(() => ({ d: getComputedStyle(document.querySelector('.hdr-main')).display !== 'none', m: getComputedStyle(document.querySelector('.hdr-mobile')).display !== 'none' }));
  check(`${w}px shows ${desk ? 'desktop' : 'mobile'} header`, vis.d === desk && vis.m === !desk);
  await q.close();
}

// Mobile
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const mp = await ctx.newPage();
await mp.goto(base + '/', { waitUntil: 'networkidle' });
await mp.waitForTimeout(1200);
const mm = await mp.evaluate(() => {
  const r = document.querySelector('.hdr-mobile').getBoundingClientRect(), c = getComputedStyle(document.querySelector('.hdr-mobile'));
  const t = document.querySelector('.hdr-toggle').getBoundingClientRect();
  return { h: r.height, bg: c.backgroundColor, pos: c.position, tx: t.x, hero: document.querySelector('.hero').getBoundingClientRect().top };
});
check('mobile bar 87px, #1b1b1b', near(mm.h, 87) && mm.bg === 'rgb(27, 27, 27)', JSON.stringify(mm));
check('hero starts below mobile bar', near(mm.hero, 87, 1), mm.hero);
check('toggle on the right (x~340)', near(mm.tx, 340, 6), mm.tx);
await mp.screenshot({ path: `${out}/h-m-top.png`, clip: { x: 0, y: 0, width: 390, height: 200 } });
await mp.tap('.hdr-toggle');
await mp.waitForTimeout(700);
const dw = await mp.$eval('#nav-drawer', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, w: r.width }; });
check('drawer 300px wide, slid in', near(dw.x, 0) && near(dw.w, 300), JSON.stringify(dw));
await mp.screenshot({ path: `${out}/h-m-open.png` });
await mp.tap('.drawer-nav a >> text=Our Projects');
await mp.waitForURL(/projects.html/);
check('drawer link navigates', mp.url().endsWith('/projects.html'));
await mp.goto(base + '/', { waitUntil: 'networkidle' });
await mp.evaluate(() => scrollTo({ top: 900, behavior: 'instant' }));
await mp.waitForTimeout(300);
await mp.evaluate(() => scrollTo({ top: 700, behavior: 'instant' }));
await mp.waitForTimeout(700);
check('mobile header does not reappear on scroll up', (await mp.$eval('.hdr-mobile', (e) => e.getBoundingClientRect().top)) < -300);
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
