// Verifies the About Us page: structure, content, placeholders, links, slider, map and responsiveness.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const b = await chromium.launch();
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };

const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('requestfailed', (r) => { if (!/google|gstatic/.test(r.url()) && r.failure()?.errorText !== 'net::ERR_ABORTED') errs.push('req ' + r.url()); }); // aborted = cancelled prefetch/navigation, not an error
await p.goto(base + '/about.html', { waitUntil: 'networkidle' });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 60)); } scrollTo({ top: 0, behavior: 'instant' }); });
await p.waitForTimeout(1200);

const ids = await p.$$eval('#about > section', (s) => s.map((x) => x.id).join());
check('section order', ids === 'intro,leadership,partners,authorities,services,statement,clients,reach,testimonials', ids);
const text = await p.evaluate(() => document.body.innerText);
check('no ORRO / old brand', !/orro|maison|nakheel|emaar|dewa|trakhees/i.test(text));
for (const s of [
  'About LFT Interior Design LLC', 'established in 2019', 'Who We Are', 'Our Capabilities',
  'Skilled Interior Design and Space Planning', 'Residential and Commercial Interior Solutions', 'Customised Furniture and Joinery',
  'Project Management and Coordination', 'Turnkey Interior Fit-Out Solutions',
  'Our Clients & Partners', 'We are proud to work with leading developers, brands, and industry partners.', 'Approved by:', 'Registered with:',
  'Authorities & Approvals', 'Our Services', 'Commercial Fit Out', 'Villa Projects', 'In-house Joinery',
  'Our Clients', 'Reach Us', 'Sample Testimonials – Demo Content', 'EST. 2019',
]) check(`text: ${s.slice(0, 48)}`, text.toLowerCase().includes(s.toLowerCase()));
check('statement text', /we meet new people\s*every day,\s*coming with\s*new dreams and hopes\.\s*our effort is to\s*make them true\./i.test(text.replace(/\n/g, ' ')));

// layout facts
const g = await p.evaluate(() => {
  const q = (s) => [...document.querySelectorAll(s)];
  const box = (e) => e.getBoundingClientRect();
  const cols = getComputedStyle(document.querySelector('.ab-cards')).gridTemplateColumns.split(' ').length;
  const cards = q('.ab-card').map((c) => Math.round(box(c).width));
  const partners = q('#partners .ab-logo').map((l) => { const r = box(l); return [Math.round(r.width), Math.round(r.height), getComputedStyle(l).backgroundColor]; });
  const clients = q('#clients .ab-logo').length;
  const split = document.querySelector('.ab-split');
  const img = box(document.querySelector('.ab-photo')), copy = box(document.querySelector('.ab-copy'));
  const same = q('#partners .ab-logo, #clients .ab-logo').every((l) => Math.abs(box(l).width - box(l).height) < 1);
  const lines = q('.page-lines span').length;
  const y = (id) => Math.round(box(document.getElementById(id)).top + scrollY);
  const rows = new Set(q('#clients .ab-logo').map((l) => Math.round(box(l).top))).size;
  return { cols, cards, partners, clients, img: [Math.round(img.width), Math.round(img.height), Math.round(img.left)], copyLeft: Math.round(copy.left), same, lines, rows, mapSrc: document.querySelector('.ab-map iframe').src, order: ['intro', 'partners', 'authorities', 'services', 'statement', 'clients', 'reach', 'testimonials'].map(y) };
});
check(`services: 3 equal columns (${g.cards.join('/')})`, g.cols === 3 && g.cards.every((w) => Math.abs(w - g.cards[0]) < 2));
check('partners: 6 white square cards', g.partners.length === 6 && g.partners.every(([w, h, bg]) => w === h && bg === 'rgb(255, 255, 255)'), JSON.stringify(g.partners[0]));
check('clients: 10 real brand-name cards in two rows of 5', g.clients === 10 && g.rows === 2);
check('all logo cards square + equal', g.same);
check(`photo left of copy (${g.img.join('x')}; copy at ${g.copyLeft})`, g.img[0] > 400 && g.img[2] < g.copyLeft && Math.abs(g.img[1] / g.img[0] - 743 / 453) < 0.05);
check('7 divider lines on page', g.lines === 7);
check('map points at Ithraa Tower, Al Garhoud', /Ithraa(\+|%20)Tower/.test(g.mapSrc) && /Al(\+|%20)Garhoud/.test(g.mapSrc), g.mapSrc.slice(0, 80));
check('sections stack in increasing order', g.order.every((v, i) => i === 0 || v > g.order[i - 1]));

// placeholders flagged
check('placeholder notes visible (partners/approvals only)', (text.match(/Demo placeholders/g) || []).length >= 1 && /Placeholder entries/.test(text) && (await p.$$('.ab-tag')).length === 5);
check('placeholder logo cards labelled', (await p.$$('.ab-logo-ph[title="Placeholder logo"]')).length === 6 && (await p.$$('.ab-wordmark')).length === 10);

// service cards link to real anchors
const hrefs = await p.$$eval('.ab-card', (a) => a.map((x) => x.getAttribute('href')));
for (const h of hrefs) { const r = await p.request.get(base + h.split('#')[0]); check(`service link ${h}`, r.ok()); }
const anchorsOk = await (async () => {
  const q = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const out = [];
  for (const h of hrefs) { await q.goto(base + h, { waitUntil: 'networkidle' }); out.push(await q.evaluate((id) => !!document.getElementById(id), h.split('#')[1])); }
  await q.close();
  return out.every(Boolean);
})();
check('service anchors exist on services page', anchorsOk);

// hover on a service card
await p.evaluate(() => document.getElementById('services').scrollIntoView());
await p.waitForTimeout(1300);
const before = await p.$eval('.ab-card h3', (e) => getComputedStyle(e).color);
await p.hover('.ab-card');
await p.waitForTimeout(600);
const after = await p.$eval('.ab-card h3', (e) => getComputedStyle(e).color);
const arrowTf = await p.$eval('.ab-card .ab-arrow', (e) => getComputedStyle(e).transform);
check('service hover: colour + arrow nudge', before !== after && arrowTf !== 'none', `${before} -> ${after}`);
await p.click('.ab-card');
await p.waitForURL(/services\.html#fit-out/);
check('service card navigates', p.url().includes('services.html#fit-out'));

// scroll reveal
await p.goto(base + '/about.html', { waitUntil: 'networkidle' });
const op0 = await p.$eval('.ab-card', (e) => getComputedStyle(e).opacity);
await p.evaluate(() => document.getElementById('services').scrollIntoView());
await p.waitForTimeout(1600);
const op1 = await p.$eval('.ab-card', (e) => getComputedStyle(e).opacity);
check(`scroll reveal fades in (${op0} -> ${op1})`, op0 === '0' && op1 === '1');

// testimonial slider: dots + auto
await p.evaluate(() => document.getElementById('testimonials').scrollIntoView());
await p.waitForTimeout(800);
await p.click('.ab-dots button:nth-child(2)');
await p.waitForTimeout(1500);
check('slider dot shows 2nd testimonial', await p.$eval('.ab-slide:nth-child(2)', (e) => e.classList.contains('is-active')));
const t = await p.$$eval('.ab-slide', (s) => s.map((x) => x.querySelector('blockquote').textContent.length > 30));
check('3 sample testimonials', t.length === 3 && t.every(Boolean));
await p.waitForTimeout(7200);
check('slider auto-advances', await p.$eval('.ab-slide:nth-child(3)', (e) => e.classList.contains('is-active')));

// footer + header consistent
check('footer present with LFT details', await p.$eval('footer', (f) => /info@lftinteriors\.com/.test(f.innerText) && /04 282 9773/.test(f.innerText) && /Ithraa Tower, Al Garhoud, Dubai, UAE/.test(f.innerText)));
check('header logo is LFT', (await p.$$eval('.hdr-main img[src*="lft-logo"]', (i) => i.length)) >= 1);
check('no JS / request errors', errs.length === 0, errs.join('|'));

// responsive
for (const [name, w] of [['tablet', 820], ['mobile', 390]]) {
  const q = await b.newPage({ viewport: { width: w, height: 844 } });
  await q.goto(base + '/about.html', { waitUntil: 'networkidle' });
  await q.waitForTimeout(800);
  const r = await q.evaluate(() => ({
    ov: document.documentElement.scrollWidth > innerWidth,
    split: getComputedStyle(document.querySelector('.ab-split')).gridTemplateColumns.split(' ').length,
    cards: getComputedStyle(document.querySelector('.ab-cards')).gridTemplateColumns.split(' ').length,
    wide: [...document.querySelectorAll('#about *')].filter((e) => !e.closest('.page-lines, .ab-blueprint') && e.getBoundingClientRect().right > innerWidth + 1).length,
  }));
  check(`${name}: stacked, no overflow`, !r.ov && r.split === 1 && r.cards === 1 && r.wide === 0, JSON.stringify(r));
  await q.close();
}
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
