import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const b = await chromium.launch();
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };
for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(base + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const t = await p.evaluate(() => document.querySelector('.hero').innerText + ' ' + (document.querySelector('footer .footer-top')?.innerText || ''));
  for (const s of ['INTERIOR ARCHITECTURE', 'Spaces made', 'EXPLORE PROJECTS', 'START A PROJECT', 'LINDEN HOUSE', 'Let’s make a space', 'GET IN TOUCH'])
    check(`${name}: no "${s}" visible`, !t.toLowerCase().includes(s.toLowerCase()));
  const h = await p.evaluate(() => {
    const hero = document.querySelector('.hero').getBoundingClientRect();
    const rec = document.querySelector('#recent-projects').getBoundingClientRect();
    const part = document.querySelector('#partners').getBoundingClientRect();
    const foot = document.querySelector('footer').getBoundingClientRect();
    return { heroBottom: hero.bottom, recTop: rec.top, partBottom: part.bottom, footTop: foot.top, heroImg: getComputedStyle(document.querySelector('.hero-slide.is-active')).backgroundImage, kids: document.querySelector('.hero').children.length };
  });
  check(`${name}: hero image still present`, h.heroImg.includes('/images/'));
  check(`${name}: no gap hero -> recent`, Math.abs(h.heroBottom - h.recTop) < 1, `${h.heroBottom}/${h.recTop}`);
  check(`${name}: no gap partners -> footer`, Math.abs(h.partBottom - h.footTop) < 1, `${h.partBottom}/${h.footTop}`);
  check(`${name}: footer CTA gone on home`, (await p.$('.footer-top')) === null);
  const secs = await p.$$eval('main > section', (s) => s.map((x) => x.id).join());
  check(`${name}: still 3 sections`, secs === 'hero,recent-projects,partners', secs);
  check(`${name}: no JS errors`, errs.length === 0, errs.join('|'));
  await p.screenshot({ path: `screenshots/c-${name}-hero.png` });
  await p.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await p.waitForTimeout(500);
  await p.screenshot({ path: `screenshots/c-${name}-bottom.png` });
  await p.close();
}
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
