// Verifies the shared project detail template on EVERY project: own photos only, all sections in ORRO order,
// slider, previous/next/all navigation, related projects, lightbox, dark styling and responsive layout.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const { projects } = await import('../src/data.js');
const b = await chromium.launch();
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };
const errs = [];

const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
p.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
const open = async (slug) => {
  await p.goto(`${base}/project.html?p=${slug}`, { waitUntil: 'networkidle' });
  await p.waitForSelector('.pd-slider');
  await p.waitForTimeout(300);
};

for (const [i, proj] of projects.entries()) {
  await open(proj.slug);
  const own = [proj.cover, ...proj.gallery];
  const r = await p.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const all = (s) => [...document.querySelectorAll(s)];
    const path = (u) => new URL(u, location.href).pathname;
    const order = ['.pd-banner', '.pd-slider', '.pd-info', '.pd-gallery', '.pd-pager', '.pd-related'].map((s) => Math.round(q(s).getBoundingClientRect().top + scrollY));
    return {
      h1: q('.pd-banner h1').textContent, title: document.title, crumbs: q('.pd-crumbs').innerText.replace(/\s+/g, ' '),
      banner: path(getComputedStyle(q('.pd-banner-bg')).backgroundImage.slice(5, -2)),
      slides: all('.pd-slide img').map((x) => path(x.src)), gallery: all('.pd-shot img').map((x) => path(x.src)),
      facts: q('.pd-facts').innerText, copy: q('.pd-copy').innerText,
      prev: q('.pd-pager .pd-circle:first-child').getAttribute('href'), next: q('.pd-pager .pd-circle:last-child').getAttribute('href'), grid: q('.pd-grid-link').getAttribute('href'),
      related: all('.pd-card').map((c) => ({ href: c.getAttribute('href'), img: path(c.querySelector('img').src), t: c.querySelector('.pd-card-title').textContent })),
      order, bg: getComputedStyle(document.body).backgroundColor, lines: all('.page-lines span').length,
      loaded: all('.pd-shot img, .pd-slide.is-active img').every((x) => !x.complete || x.naturalWidth > 0),
      tags: [q('.pd-label') && q('.pd-label').textContent, q('.pd-related .pd-label').textContent],
    };
  });
  const prev = projects[(i - 1 + projects.length) % projects.length].slug;
  const next = projects[(i + 1) % projects.length].slug;
  const tag = proj.slug;
  check(`${tag}: title "${proj.title}" in banner, tab title and breadcrumb (Home › Our Projects › …)`, r.h1 === proj.title && r.title.startsWith(proj.title) && r.crumbs === `Home › Our Projects › ${proj.title}`);
  check(`${tag}: banner + slider + gallery use only this project's photos`, r.banner === own[0] && r.slides.every((s) => own.includes(s)) && r.slides.length >= 2);
  check(`${tag}: gallery shows all ${own.length} photos once each, no repeats or other projects`, r.gallery.length === own.length && new Set(r.gallery).size === own.length && r.gallery.every((s) => s.includes(`/projects/${proj.slug}/`)));
  check(`${tag}: project information (name, client, concept, location)`, ['PROJECT NAME:', 'CONCEPT:', 'LOCATION:'].every((k) => r.facts.toUpperCase().includes(k)) && r.facts.includes(proj.location) && r.facts.includes(proj.client));
  check(`${tag}: description + design vision + key elements`, r.copy.includes(proj.intro) && /Design Vision/.test(r.copy) && /Key Elements of the Design Concept/.test(r.copy));
  check(`${tag}: sections in ORRO order (banner, slider, info, gallery, nav, related)`, r.order.every((v, k) => k === 0 || v > r.order[k - 1]), r.order.join('<'));
  check(`${tag}: prev/next/all links -> ${prev} / ${next} / projects`, r.prev === `/project.html?p=${prev}` && r.next === `/project.html?p=${next}` && r.grid === '/projects.html');
  check(`${tag}: 3 related projects, other projects only, with their own cover photo`, r.related.length === 3 && r.related.every((x) => { const o = projects.find((y) => `/project.html?p=${y.slug}` === x.href); return o && o.slug !== proj.slug && x.img === o.cover && x.t === o.title; }) && new Set(r.related.map((x) => x.href)).size === 3);
  check(`${tag}: dark page, divider lines, labels`, r.bg === 'rgb(27, 27, 27)' && r.lines === 7 && r.tags[0] === 'Project Information' && r.tags[1] === 'Project Concept');
}

// slider behaviour
await open('dopamine-oasis-mall');
const active = () => p.$$eval('.pd-slide', (s) => s.findIndex((x) => x.classList.contains('is-active')));
const n = await p.$$eval('.pd-slide', (s) => s.length);
await p.click('.pd-next'); await p.waitForTimeout(900);
check(`slider next -> 2/${n}`, (await active()) === 1 && (await p.textContent('.pd-count b')) === '2');
const op = await p.$eval('.pd-slide.is-active', (e) => getComputedStyle(e).transitionDuration);
check(`slider uses a crossfade (${op})`, /0\.8s/.test(op));
await p.click('.pd-prev'); await p.waitForTimeout(300); await p.click('.pd-prev'); await p.waitForTimeout(300);
check('slider prev wraps around to the last photo', (await active()) === n - 1);
await p.focus('.pd-slider'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
check('slider works with the keyboard', (await active()) === 0);
const slideBox = await p.$eval('.pd-slider', (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), Math.round(r.left)]; });
check(`slider ${slideBox[0]}x${slideBox[1]} at x=${slideBox[2]} (1096 wide, 1.6 ratio, aligned with content)`, slideBox[0] === 1096 && Math.abs(slideBox[0] / slideBox[1] - 1.6) < 0.02 && slideBox[2] === 172);

// lightbox from gallery
await p.click('.pd-shot >> nth=2'); await p.waitForTimeout(500);
check('gallery photo opens the lightbox at full size', await p.isVisible('.lightbox') && /photo 3 of/.test(await p.textContent('.lightbox figcaption')));
await p.keyboard.press('Escape'); await p.waitForTimeout(400);

// navigation clicks
await p.click('.pd-pager .pd-circle:last-child'); await p.waitForURL(/p=eyewa-arabian-center/); await p.waitForSelector('.pd-slider');
check('next arrow opens the next project', (await p.textContent('.pd-banner h1')) === 'Eyewa — Arabian Center');
await p.click('.pd-pager .pd-circle:first-child'); await p.waitForURL(/p=dopamine-oasis-mall/); await p.waitForSelector('.pd-slider');
check('previous arrow goes back', (await p.textContent('.pd-banner h1')) === 'Dopamine');
const rel = await p.$eval('.pd-card', (a) => a.getAttribute('href'));
await p.click('.pd-card'); await p.waitForURL(new RegExp(rel.replace(/[?.]/g, '\\$&'))); await p.waitForSelector('.pd-slider');
check(`related project card opens ${rel}`, p.url().endsWith(rel));
await p.click('.pd-grid-link'); await p.waitForURL(/projects\.html$/);
check('grid icon opens all projects', (await p.$$('.pj-item')).length === projects.length);
// every project tile on the listing opens its own page in the new template
let tilesOk = true;
for (const proj of projects) {
  await p.goto(`${base}/projects.html`, { waitUntil: 'networkidle' });
  await p.click(`.pj-item[href="/project.html?p=${proj.slug}"]`);
  await p.waitForSelector('.pd-slider');
  if ((await p.textContent('.pd-banner h1')) !== proj.title) tilesOk = false;
}
check(`all ${projects.length} project tiles on the listing open their page in the new template`, tilesOk);
await p.goto(`${base}/project.html?p=nope`, { waitUntil: 'networkidle' });
check('unknown project: dark not-found page with link back', (await p.textContent('h1')) === 'Project not found' && !!(await p.$('.pd-btn[href="/projects.html"]')));
check('no JS / console / 404 errors on any project page', errs.length === 0, errs.slice(0, 3).join(' | '));

// responsive
for (const [name, w, shotsPerRow, relCols] of [['tablet', 820, 2, 3], ['mobile', 390, 1, 1]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, hasTouch: true, isMobile: name === 'mobile' });
  const q = await ctx.newPage();
  await q.goto(`${base}/project.html?p=eyewa-masdar`, { waitUntil: 'networkidle' });
  await q.waitForSelector('.pd-slider');
  const r = await q.evaluate(() => ({
    ov: document.documentElement.scrollWidth > innerWidth,
    perRow: new Set([...document.querySelectorAll('.pd-shot')].slice(0, 3).map((e) => Math.round(e.getBoundingClientRect().top))).size,
    infoCols: getComputedStyle(document.querySelector('.pd-info')).gridTemplateColumns.split(' ').length,
    relCols: getComputedStyle(document.querySelector('.pd-related-grid')).gridTemplateColumns.split(' ').length,
  }));
  const rows = shotsPerRow === 1 ? 3 : 2;
  check(`${name}: no overflow, info stacks, gallery ${shotsPerRow}/row, related ${relCols} col(s)`, !r.ov && r.infoCols === 1 && r.perRow === rows && r.relCols === relCols, JSON.stringify(r));
  if (name === 'mobile') {
    const box = await q.$eval('.pd-slider', (e) => e.getBoundingClientRect());
    await q.touchscreen.tap(box.x + 10, box.y + 10);
    await q.evaluate(() => {
      const el = document.querySelector('.pd-slider');
      const t = (type, x) => el.dispatchEvent(new TouchEvent(type, { bubbles: true, touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: el, clientX: x, clientY: 100 })], changedTouches: [new Touch({ identifier: 1, target: el, clientX: x, clientY: 100 })] }));
      t('touchstart', 300); t('touchend', 120);
    });
    await q.waitForTimeout(300);
    check('mobile: swipe changes slide', (await q.textContent('.pd-count b')) === '2');
  }
  await ctx.close();
}
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
