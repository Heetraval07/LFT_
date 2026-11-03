// Verifies the Projects page: banner, grid metrics, filters, pagination, search, links and responsiveness.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const b = await chromium.launch();
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };
const near = (a, e, t = 2) => Math.abs(a - e) <= t;

const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => m.type() === 'error' && !/google|gstatic|maps/.test(m.text()) && errs.push(m.text()));
p.on('requestfailed', (r) => { if (!/google|gstatic/.test(r.url()) && r.failure()?.errorText !== 'net::ERR_ABORTED') errs.push('req ' + r.url()); }); // aborted = cancelled prefetch/navigation, not an error
const visibleCount = () => p.$$eval('.pj-item', (a) => a.length);
const titles = () => p.$$eval('.pj-item', (a) => a.map((x) => x.getAttribute('aria-label')));
const go = async (u) => { await p.goto(base + u, { waitUntil: 'networkidle' }); await p.waitForTimeout(500); };

await go('/projects.html');
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 80)); } scrollTo({ top: 0, behavior: 'instant' }); });
await p.waitForTimeout(1500);
const text = await p.evaluate(() => document.body.innerText);
check('no ORRO / old brand', !/orro|maison|verre|selected work|let.s talk about the space/i.test(text));
check('old cream layout + CTA banner gone', (await p.$$('.project-card, .banner, .filters')).length === 0);

const m = await p.evaluate(() => {
  const q = (s) => document.querySelector(s), r = (e) => e.getBoundingClientRect();
  const items = [...document.querySelectorAll('.pj-item')].map((e) => r(e));
  const h1 = q('.pj-banner h1'), hc = getComputedStyle(h1), ban = r(q('.pj-banner'));
  const cr = r(q('.pj-crumbs')), crc = getComputedStyle(q('.pj-crumbs [aria-current]'));
  const tabs = [...document.querySelectorAll('.pj-filters button')].map((e) => e.textContent);
  const rows = new Set(items.map((i) => Math.round(i.top))).size;
  const cols = new Set(items.map((i) => Math.round(i.left))).size;
  return {
    bodyBg: getComputedStyle(document.body).backgroundColor, banH: Math.round(ban.height), banTop: Math.round(ban.top + scrollY),
    h1: [hc.fontSize, hc.color, Math.round(r(h1).left)], crRight: Math.round(cr.right), crCol: crc.color,
    tabs, n: items.length, rows, cols, w: items.map((i) => Math.round(i.width)), h: items.map((i) => Math.round(i.height)),
    gapX: Math.round(items[1].left - items[0].right), gapY: Math.round(items[3].top - items[0].bottom), gridLeft: Math.round(items[0].left), gridRight: Math.round(items[2].right),
    lines: document.querySelectorAll('.page-lines span').length, radius: getComputedStyle(q('.pj-item')).borderRadius, shadow: getComputedStyle(q('.pj-item')).boxShadow,
    below: !!q('.pj-item + .pj-meta, .project-card-body'), headingFw: getComputedStyle(q('.pj-about h2')).fontWeight,
    imgs: [...document.querySelectorAll('.pj-item img')].map((i) => i.getAttribute('src')),
  };
});
check(`banner below header, ${m.banH}px tall (ref ~251)`, m.banTop === 147 && near(m.banH, 251, 3), `top=${m.banTop}`);
check(`banner title 44px white at x=172; breadcrumb right edge 1268 (${m.h1}, ${m.crRight})`, m.h1[0] === '44px' && m.h1[1] === 'rgb(255, 255, 255)' && near(m.h1[2], 172, 2) && near(m.crRight, 1268, 2));
check('breadcrumb: Home > Our Projects (active tan)', /Home\s*›\s*Our Projects/.test(text) && m.crCol === 'rgb(166, 161, 130)');
check('page bg charcoal + 7 divider lines', m.bodyBg === 'rgb(27, 27, 27)' && m.lines === 7);
check('filter tabs in reference order', m.tabs.join('|') === 'All|Beauty & Healthcare|Commercial|Downtown Lobby Renovations|Entertainment|F & B|Retail Space', m.tabs.join('|'));
check(`3 columns x 3 rows, 8 real projects (${m.cols}x${m.rows})`, m.n === 8 && m.cols === 3 && m.rows === 3);
check(`grid spans x=${m.gridLeft}..${m.gridRight} (ref 172..1268), gaps ${m.gapX}/${m.gapY}`, near(m.gridLeft, 172, 2) && near(m.gridRight, 1268, 2) && m.gapX === 14 && m.gapY === 14);
check(`landscape ~1.26 ratio (${m.w[0]}x${m.h[0]}), equal tiles`, new Set(m.w).size <= 2 && Math.abs(m.w[0] / m.h[0] - 1.26) < 0.03);
check('no radius / shadow / metadata under images', m.radius === '0px' && m.shadow === 'none' && !m.below && !/Lake Oswego|Seattle|2025|2024/.test(text));
check('8 distinct images, all LFT project photos', new Set(m.imgs).size === 8 && m.imgs.every((s) => s.startsWith('/images/projects/')));
check('no pagination when everything fits one page', await p.$eval('#pj-pager', (e) => e.hidden));
check('description heading + text (no demo note)', m.headingFw === '800' && /Completed Interior Design & Fit-Out Projects in the UAE/.test(text) && /Other projects/.test(text) && /Mott 32/.test(text) && /LFT Interior Design LLC delivers/.test(text) && !/demonstration content/.test(text));

// hover title
await p.evaluate(() => document.querySelector('.pj-grid').scrollIntoView({ block: 'center' }));
await p.waitForTimeout(800);
const t0 = await p.$eval('.pj-title', (e) => getComputedStyle(e).opacity);
await p.hover('.pj-item');
await p.waitForTimeout(600);
const t1 = await p.$eval('.pj-title', (e) => getComputedStyle(e).opacity);
check(`hover reveals title only on the hovered image (${t0}->${t1})`, t0 === '0' && t1 === '1' && (await p.$$eval('.pj-title', (t) => t.filter((x) => getComputedStyle(x).opacity === '1').length)) === 1);

// filters
await go('/projects.html');
const tab = (name) => p.click(`.pj-filters button[data-cat="${name}"]`);
await tab('Entertainment'); await p.waitForTimeout(400);
check('Entertainment -> Dopamine only', (await titles()).join() === 'Dopamine', (await titles()).join());
check('URL reflects category', p.url().includes('category=Entertainment'));
await tab('Beauty & Healthcare'); await p.waitForTimeout(300);
check('Beauty & Healthcare -> Eyewa SSMC', (await titles()).join() === 'Eyewa — SSMC');
await tab('Retail Space'); await p.waitForTimeout(300);
check('Retail Space -> 7 projects (Eyewa + Jargee), no Dopamine', (await visibleCount()) === 7 && !(await titles()).includes('Dopamine'));
await tab('F & B'); await p.waitForTimeout(300);
check('empty category shows message (no invented projects)', (await visibleCount()) === 0 && /No projects in “F & B” yet/.test(await p.$eval('#pj-empty', (e) => e.textContent)));
await p.click('#pj-empty [data-cat="All"]'); await p.waitForTimeout(300);
check('"View all" from empty state restores 8', (await visibleCount()) === 8);
await tab('Retail Space'); await tab('All'); await p.waitForTimeout(300);
check('All restores the full gallery', (await visibleCount()) === 8 && (await p.$eval('.pj-filters .is-active', (e) => e.textContent)) === 'All');
check('active tab has underline + aria-pressed', (await p.getAttribute('.pj-filters .is-active', 'aria-pressed')) === 'true');

// deep links + legacy links from project pages
await go('/projects.html?category=Entertainment');
check('?category=Entertainment preselects', (await visibleCount()) === 1);
await go('/projects.html?category=Residential');
check('old ?category=Residential link falls back to All', (await p.$eval('.pj-filters .is-active', (e) => e.textContent)) === 'All' && (await visibleCount()) === 8);

// pagination (using ?perPage=3 as a test hook: 8 projects -> 3 pages)
await go('/projects.html?perPage=3');
check('pagination appears with >1 page', !(await p.$eval('#pj-pager', (e) => e.hidden)));
const pager = () => p.$eval('#pj-pager', (e) => e.innerText.replace(/\s+/g, ' ').trim());
check('shows "Previous 1 2 3 Next"', (await pager()) === 'Previous 1 2 3 Next', await pager());
check('page 1: 3 images, Previous disabled', (await visibleCount()) === 3 && (await p.$eval('[data-go="prev"]', (e) => e.disabled)));
const first = (await titles())[0];
await p.click('[data-go="next"]'); await p.waitForTimeout(900);
check('Next -> page 2 (different images, 3)', (await visibleCount()) === 3 && (await titles())[0] !== first && (await p.$eval('#pj-pager .is-active', (e) => e.textContent)) === '2' && p.url().includes('page=2'));
await p.click('#pj-pager [data-go="3"]'); await p.waitForTimeout(900);
check('page 3: last page has 2 images, Next disabled', (await visibleCount()) === 2 && (await p.$eval('[data-go="next"]', (e) => e.disabled)));
await p.click('[data-go="prev"]'); await p.waitForTimeout(900);
check('Previous -> page 2', (await p.$eval('#pj-pager .is-active', (e) => e.textContent)) === '2');
check('active page is visually distinct', (await p.$eval('#pj-pager .is-active', (e) => getComputedStyle(e).color)) === 'rgb(166, 161, 130)');
// filter + pagination together
await p.click('.pj-filters button[data-cat="Retail Space"]'); await p.waitForTimeout(500);
check('changing filter resets to page 1; Retail Space = 7 -> 3 pages', (await p.$eval('#pj-pager .is-active', (e) => e.textContent)) === '1' && (await pager()) === 'Previous 1 2 3 Next' && (await visibleCount()) === 3);
await p.click('#pj-pager [data-go="3"]'); await p.waitForTimeout(700);
check('Retail Space page 3 has the remaining 1', (await visibleCount()) === 1);
await p.click('.pj-filters button[data-cat="Entertainment"]'); await p.waitForTimeout(500);
check('Entertainment (1 project) hides pagination', (await p.$eval('#pj-pager', (e) => e.hidden)) && (await visibleCount()) === 1);
await go('/projects.html?perPage=3&page=2');
check('?page=2 deep link works', (await p.$eval('#pj-pager .is-active', (e) => e.textContent)) === '2');

// header search still works
await go('/projects.html?q=jargee');
check('search ?q=jargee -> both Jargee stores, tabs hidden', (await titles()).join() === 'Jargee — Deerfield Mall,Jargee — Bawabat Al Sharq Mall' && (await p.$eval('#pj-filters', (e) => e.hidden)) && /2 results for “jargee”/.test(await p.$eval('#pj-note', (e) => e.textContent)));
await go('/projects.html?q=zzz');
check('search with no hits shows message', (await visibleCount()) === 0 && /No projects match/.test(await p.$eval('#pj-empty', (e) => e.textContent)));

// links
await go('/projects.html');
await p.click('.pj-item >> nth=3');
await p.waitForURL(/project\.html\?p=jargee-deerfield/);
check('image opens its project page', (await p.textContent('h1')).includes('Jargee — Deerfield Mall'));
check('project page back-link still works', await (async () => { const h = await p.$eval('.pd-crumbs a[href="/projects.html"]', (e) => e.getAttribute('href')); await p.goto(base + h, { waitUntil: 'networkidle' }); return (await p.$$('.pj-item')).length === 8; })());
await go('/projects.html');
await p.click('.pj-crumbs a');
await p.waitForURL(base + '/');
check('breadcrumb Home link works', p.url() === base + '/');

// footer + header
await go('/projects.html');
check('footer: LFT details, 7 animated lines, UP button', await p.$eval('footer', (f) => /info@lftinteriors\.com/.test(f.innerText) && /04 282 9773/.test(f.innerText) && /Ithraa Tower, Al Garhoud, Dubai, UAE/.test(f.innerText) && f.querySelectorAll('.footer-lines span').length === 7) && !!(await p.$('.up-btn')));
check('header: LFT logo, Our Projects active', (await p.$$eval('.hdr-main img[src*="lft-logo"]', (i) => i.length)) >= 1 && (await p.$eval('.hdr-main .hdr-nav a.is-active', (e) => e.textContent)) === 'Our Projects');
check('no JS / console errors', errs.length === 0, errs.join('|'));

// responsive
for (const [name, w, cols, wrapCheck] of [['tablet', 820, 2], ['mobile', 390, 1]]) {
  const q = await b.newPage({ viewport: { width: w, height: 844 } });
  await q.goto(base + '/projects.html', { waitUntil: 'networkidle' });
  await q.waitForTimeout(700);
  const r = await q.evaluate(() => ({
    ov: document.documentElement.scrollWidth > innerWidth,
    cols: getComputedStyle(document.querySelector('.pj-grid')).gridTemplateColumns.split(' ').length,
    wide: [...document.querySelectorAll('#projects-page *')].filter((e) => !e.closest('.page-lines, .pj-filters') && e.getBoundingClientRect().right > innerWidth + 1).length,
    fScroll: (() => { const f = document.querySelector('.pj-filters'); return f.scrollWidth > f.clientWidth; })(),
    fRows: new Set([...document.querySelectorAll('.pj-filters button')].map((x) => Math.round(x.getBoundingClientRect().top))).size,
  }));
  check(`${name}: ${cols} column(s), no page overflow (filters: ${r.fScroll ? 'scroll row' : r.fRows + ' rows'})`, !r.ov && r.cols === cols && r.wide === 0, JSON.stringify(r));
  if (name === 'mobile') {
    check('mobile filters scroll sideways in a single row', r.fScroll && r.fRows === 1);
    await q.click('.pj-filters button[data-cat="Retail Space"]');
    await q.waitForTimeout(400);
    check('mobile filter tap works', (await q.$$('.pj-item')).length === 7);
    await q.screenshot({ path: 'screenshots/pj-mobile-view.png' });
  }
  await q.close();
}
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
