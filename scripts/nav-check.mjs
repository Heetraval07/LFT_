// For every kind of page load (hard refresh, refresh, logo click, navbar click, direct URL) verifies that the
// browser's FIRST PAINT happened after the stylesheet had arrived, i.e. no unstyled frame was ever shown.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const b = await chromium.launch();
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };
const pages = ['/', '/about.html', '/services.html', '/projects.html', '/project.html?p=dopamine-oasis-mall', '/contact.html', '/terms.html', '/privacy.html'];

// first-paint vs stylesheet timing + what the first screen looks like
const paint = (p) => p.evaluate(async () => {
  await new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r)));
  await new Promise((r) => setTimeout(r, 150));
  const fp = performance.getEntriesByType('paint').find((e) => e.name === 'first-paint');
  const css = performance.getEntriesByType('resource').filter((e) => (/\.css(\?|$)/.test(e.name) || /\/src\/styles/.test(e.name)) && !/googleapis|gstatic/.test(e.name));
  const cssEnd = css.length ? Math.max(...css.map((e) => e.responseEnd)) : 0;
  const sheetLoaded = [...document.styleSheets].some((s) => { try { return s.cssRules.length > 100; } catch { return false; } });
  return { fp: fp ? Math.round(fp.startTime) : null, cssEnd: Math.round(cssEnd), sheetLoaded, hasCssLink: !!document.querySelector('head link[rel=stylesheet]:not([href^="http"])'), hdr: !!document.querySelector('.site-header'), ftr: !!document.querySelector('footer'), font: getComputedStyle(document.body).fontFamily.slice(0, 12) };
});
const ok = (r) => r.hasCssLink && r.sheetLoaded && r.fp !== null && r.fp >= r.cssEnd - 1 && !/Times/i.test(r.font) && r.hdr && r.ftr;
const label = (r) => `first-paint ${r.fp}ms >= css ${r.cssEnd}ms`;

const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => m.type() === 'error' && !/google|gstatic|maps/i.test(m.text()) && errs.push(m.text()));
const aborted = [];
p.on('requestfailed', (r) => { if (/google|gstatic/.test(r.url())) return; if (r.failure()?.errorText === 'net::ERR_ABORTED') aborted.push(r.url()); else errs.push('req ' + r.url() + ' ' + r.failure()?.errorText); });
const cdp = await ctx.newCDPSession(p);

// 5 · direct URL (cold) + 2 · normal refresh + 1 · hard refresh (cache disabled)
for (const u of pages) {
  await p.goto(base + u, { waitUntil: 'commit' });
  let r = await paint(p);
  check(`direct URL ${u}: styled from first paint (${label(r)})`, ok(r));
  await p.reload({ waitUntil: 'commit' });
  r = await paint(p);
  check(`refresh ${u}: styled from first paint (${label(r)})`, ok(r));
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await p.reload({ waitUntil: 'commit' });
  r = await paint(p);
  check(`HARD refresh ${u} (cache off): styled from first paint (${label(r)})`, ok(r));
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
}

// 3 · click the logo from every internal page (it is a normal link to "/")
for (const u of pages.filter((x) => x !== '/')) {
  await p.goto(base + u, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const href = await p.$eval('.hdr-main .hdr-logo', (a) => a.getAttribute('href'));
  const nav = p.waitForURL(base + '/', { waitUntil: 'commit' });
  await p.click('.hdr-main .hdr-logo');
  await nav;
  const r = await paint(p);
  check(`logo from ${u} -> "${href}": homepage styled from first paint (${label(r)})`, href === '/' && ok(r));
  check(`logo from ${u}: homepage fully rendered (hero + gallery + footer)`, await p.evaluate(() => !!document.querySelector('.hero-slide') && document.querySelectorAll('.recent-item').length === 6 && !!document.querySelector('footer')));
}

// 4 · navigate with the navbar between every pair of main pages
const navTargets = [['Home', '/'], ['About Us', '/about.html'], ['Our Services', '/services.html'], ['Our Projects', '/projects.html'], ['Contacts', '/contact.html']];
let from = '/';
await p.goto(base + from, { waitUntil: 'networkidle' });
for (const [label2, to] of [...navTargets, ...navTargets.slice().reverse()]) {
  if (to === from) continue;
  const w = p.waitForURL(new RegExp((base + to).replace(/[.]/g, '\\.') + '$'), { waitUntil: 'commit' });
  await p.click(`.hdr-main .hdr-nav a >> text="${label2}"`).catch(async () => { await p.click(`.hdr-main .hdr-nav a[href="${to}"]`); });
  await w;
  const r = await paint(p);
  check(`navbar ${from} -> ${label2}: styled from first paint (${label(r)})`, ok(r));
  from = to;
}

// prefetch warm-up: hovering the logo/nav pre-fetches the page
await p.goto(base + '/about.html', { waitUntil: 'networkidle' });
await p.hover('.hdr-main .hdr-logo');
await p.waitForTimeout(400);
check('hovering the logo prefetches the homepage', (await p.$$eval('link[rel=prefetch]', (l) => l.map((x) => new URL(x.href).pathname))).includes('/'));
await p.hover('.hdr-main .hdr-nav a[href="/contact.html"]');
await p.waitForTimeout(300);
check('hovering a nav link prefetches it once', (await p.$$eval('link[rel=prefetch][href="/contact.html"]', (l) => l.length)) === 1);
console.log('  cancelled requests (prefetches/old pages replaced by navigation):', [...new Set(aborted.map((u) => new URL(u).pathname))].join(' '));
check('no JS / console / request errors (cancelled prefetches are not errors)', errs.length === 0, errs.slice(0, 3).join(' | '));
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
