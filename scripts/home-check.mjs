import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const b = await chromium.launch();
const res = [];
const check = (n, ok) => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n}`); };

let p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto(base + '/', { waitUntil: 'networkidle' });
const secs = await p.$$eval('main > section', (s) => s.map((x) => x.id));
check(`exactly 3 sections: ${secs.join(', ')}`, secs.join() === 'hero,recent-projects,partners');
check('6 project tiles', (await p.$$('.recent-item')).length === 6);
const imgs = await p.$$eval('.recent-item img', (i) => i.map((x) => x.src));
check('6 distinct images', new Set(imgs).size === 6);
const cols = await p.$eval('.recent-grid', (g) => getComputedStyle(g).gridTemplateColumns.split(' ').length);
check(`3 columns (${cols})`, cols === 3);
await p.evaluate(() => document.querySelector('#recent-projects').scrollIntoView());
await p.waitForTimeout(400);
const op = (i) => p.$$eval('.recent-title', (t, i) => getComputedStyle(t[i]).opacity, i);
check('title hidden at rest', (await op(0)) === '0');
const box = await (await p.$$('.recent-item'))[0].boundingBox();
await p.mouse.move(box.x + 100, box.y + 100); await p.waitForTimeout(700);
check('hovered title visible', (await op(0)) === '1');
check('other tiles unchanged', (await op(1)) === '0' && (await op(4)) === '0');
const bs = await (await p.$$('.recent-item'))[0].boundingBox();
check('no resize on hover', Math.abs(bs.width - box.width) < 0.5);
await p.screenshot({ path: 'screenshots/x-home-hover.png' });
await p.evaluate(() => scrollTo({ top: document.querySelector('#recent-projects').offsetTop, behavior: 'instant' }));
await p.waitForTimeout(400); await p.screenshot({ path: 'screenshots/x-home-gallery.png' });
// up button
check('up button visible after scroll', await p.$eval('.up-btn', (e) => e.classList.contains('is-visible')));
// marquee moves and loops seamlessly
const x1 = await p.$eval('.partners-group', (e) => new DOMMatrix(getComputedStyle(e).transform).m41);
await p.waitForTimeout(1000);
const x2 = await p.$eval('.partners-group', (e) => new DOMMatrix(getComputedStyle(e).transform).m41);
check(`marquee moves right-to-left (${x1.toFixed(0)} -> ${x2.toFixed(0)})`, x2 < x1);
const [w, vw] = await p.$eval('.partners-group', (e) => [e.getBoundingClientRect().width, innerWidth]);
check(`one group wider than viewport (${Math.round(w)} >= ${vw})`, w >= vw);
await p.evaluate(() => document.querySelector('#partners').scrollIntoView({ block: 'center' }));
await p.waitForTimeout(300); await p.screenshot({ path: 'screenshots/x-home-partners.png' });
await p.click('.up-btn'); await p.waitForTimeout(1500);
check('up button scrolls to top', (await p.evaluate(() => scrollY)) < 5);
// project link
await p.evaluate(() => document.querySelector('#recent-projects').scrollIntoView());
await p.click('.recent-item >> nth=3'); await p.waitForLoadState('networkidle');
check('tile opens detail page', p.url().includes('p=eyewa-masdar'));
check('no console errors', errs.length === 0);

// Tablet + mobile
for (const [name, width, expect] of [['tablet', 820, 2], ['mobile', 390, 1]]) {
  const m = await b.newContext({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true });
  const q = await m.newPage();
  await q.goto(base + '/', { waitUntil: 'networkidle' });
  const c = await q.$eval('.recent-grid', (g) => getComputedStyle(g).gridTemplateColumns.split(' ').length);
  check(`${name}: ${expect} column(s)`, c === expect);
  check(`${name}: no horizontal scroll`, !(await q.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
  if (name === 'mobile') {
    check('mobile: title visible without hover', (await q.$eval('.recent-title', (t) => getComputedStyle(t).opacity)) === '1');
    await q.evaluate(() => document.querySelector('#recent-projects').scrollIntoView());
    await q.waitForTimeout(300); await q.screenshot({ path: 'screenshots/x-home-mobile-gallery.png' });
    await q.tap('.recent-item >> nth=0'); await q.waitForTimeout(400);
    check('mobile: first tap does not navigate', q.url().endsWith('/'));
  }
  await m.close();
}
// other pages unchanged
for (const [u, sel] of [['/about.html', '#about .ab-card'], ['/services.html', '.sv-card'], ['/projects.html', '.pj-item'], ['/contact.html', '#contact-form']]) {
  const q = await b.newPage(); await q.goto(base + u, { waitUntil: 'networkidle' });
  check(`${u} intact`, (await q.$$(sel)).length > 0); await q.close();
}
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`); process.exitCode = f ? 1 : 0;
