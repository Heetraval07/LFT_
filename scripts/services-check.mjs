// Verifies the Services page: layout metrics, content, FAQ accordion, links, slider and responsiveness.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const b = await chromium.launch();
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };
const near = (a, e, t = 2) => Math.abs(a - e) <= t;

const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('requestfailed', (r) => { if (!/google|gstatic/.test(r.url()) && r.failure()?.errorText !== 'net::ERR_ABORTED') errs.push('req ' + r.url()); }); // aborted = cancelled prefetch/navigation, not an error
await p.goto(base + '/services.html', { waitUntil: 'networkidle' });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 60)); } scrollTo({ top: 0, behavior: 'instant' }); });
await p.waitForTimeout(1500);

const text = await p.evaluate(() => document.body.innerText);
check('no ORRO / old brand', !/orro|maison|verre|dewa|trakhees|rta\b/i.test(text));
check('no sections from old page', !/how it works|one-hour consultation|from first call/i.test(text));

// metrics vs the reference (measured on the original at 1440px)
const m = await p.evaluate(() => {
  const q = (s) => document.querySelector(s), r = (e) => e.getBoundingClientRect();
  const title = q('.sv-title'), tc = getComputedStyle(title);
  const cards = [...document.querySelectorAll('.sv-card')].map((c) => r(c));
  const num = getComputedStyle(q('.sv-num')), h2 = getComputedStyle(q('.sv-card h2')), pp = getComputedStyle(q('.sv-card p'));
  const auth = [...document.querySelectorAll('.sv-auth')].map((a) => { const x = r(a); return [Math.round(x.width), Math.round(x.height), getComputedStyle(a).backgroundColor, Math.round(x.top)]; });
  const box = q('.sv-auth-box'), bc = getComputedStyle(box), bb = r(box);
  const rows = new Set(cards.map((c) => Math.round(c.top))).size;
  return {
    titleTop: Math.round(r(title).top + scrollY), titleFs: tc.fontSize, titleFw: tc.fontWeight, titleCol: tc.color, titleTa: tc.textAlign, ff: tc.fontFamily.slice(0, 12),
    cards: cards.map((c) => [Math.round(c.x), Math.round(c.width)]).slice(0, 3), n: cards.length, rows,
    num: [num.fontSize, num.fontWeight, num.color], h2: [h2.fontSize, h2.fontWeight], p: [pp.fontSize, pp.color],
    auth, boxBg: bc.backgroundColor, boxW: Math.round(bb.width), boxCenter: Math.round(bb.x + bb.width / 2), h2auth: getComputedStyle(box.querySelector('h2')).fontWeight,
    bodyBg: getComputedStyle(document.body).backgroundColor, lines: document.querySelectorAll('.page-lines span').length,
    cardIds: [...document.querySelectorAll('.sv-card')].map((c) => c.id),
    titles: [...document.querySelectorAll('.sv-card h2')].map((h) => h.textContent),
  };
});
check(`title 48px bold white centred (y=${m.titleTop}; ref 378)`, m.titleFs === '48px' && m.titleFw === '700' && m.titleCol === 'rgb(255, 255, 255)' && m.titleTa === 'center' && near(m.titleTop, 378, 12));
check('9 services in 3 columns x 3 rows', m.n === 9 && m.rows === 3 && m.cards.length === 3);
check(`columns at x=135/535/935, 370 wide (${JSON.stringify(m.cards)})`, m.cards.every(([x, w], i) => near(x, 135 + i * 400, 2) && near(w, 370, 2)));
check(`number 20px/600 tan; title 24px/600; text 15px (${m.num}|${m.h2}|${m.p})`, m.num[0] === '20px' && m.num[1] === '600' && m.num[2] === 'rgb(166, 161, 130)' && m.h2[0] === '24px' && m.h2[1] === '600' && m.p[0] === '15px');
check('service names', m.titles.join('|') === 'Restaurant & F&B|Retail Fitout|Hospitality|In-house Joinery|MEP Solutions|Design & Build|Villa Projects|Commercial Fit Out|Entertainment', m.titles.join('|'));
check('7 white authority cards, 143x94, one row', m.auth.length === 7 && m.auth.every(([w, h, bg]) => w === 143 && h === 94 && bg === 'rgb(255, 255, 255)') && new Set(m.auth.map((a) => a[3])).size === 1, JSON.stringify(m.auth[0]));
check(`charcoal container #222, centred (${m.boxW}w @ ${m.boxCenter})`, m.boxBg === 'rgb(34, 34, 34)' && near(m.boxCenter, 720, 2) && m.h2auth === '700');
check('page bg #1b1b1b + 7 divider lines', m.bodyBg === 'rgb(27, 27, 27)' && m.lines === 7);
check('"Licensed & Approved by UAE Authorities" heading + placeholder note', /Licensed & Approved by UAE Authorities/.test(text) && /Placeholder logos/.test(text) && (await p.$$('.sv-auth-ph[title="Placeholder logo"]')).length === 7);

// card hover
await p.evaluate(() => document.querySelector('.sv-card').scrollIntoView({ block: 'center' }));
await p.waitForTimeout(1200);
const c0 = await p.$eval('.sv-card h2', (e) => getComputedStyle(e).color);
await p.hover('.sv-card');
await p.waitForTimeout(600);
const c1 = await p.$eval('.sv-card h2', (e) => getComputedStyle(e).color);
check('card hover tints title + moves arrow', c0 !== c1 && (await p.$eval('.sv-card .sv-arrow', (e) => getComputedStyle(e).transform)) !== 'none', `${c0}->${c1}`);

// card links -> contact with service preselected
const links = await p.$$eval('.sv-card', (a) => a.map((x) => x.getAttribute('href')));
check('all card links point to the contact page', links.every((h) => h.startsWith('/contact.html')), links.join(' '));
await p.click('#kitchens');
await p.waitForURL(/contact\.html\?service=kitchens/);
check('joinery card -> contact (message pre-filled with Kitchens & Joinery)', (await p.inputValue('#f-message')).includes('Kitchens & Joinery'));

// anchors used by the About page still resolve
for (const id of ['commercial', 'residential', 'kitchens']) {
  await p.goto(base + '/services.html#' + id, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const top = await p.$eval('#' + id, (e) => Math.round(e.getBoundingClientRect().top));
  check(`#${id} anchor scrolls into view (top=${top})`, top > -20 && top < 400);
}

// FAQ accordion
await p.goto(base + '/services.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.getElementById('faq').scrollIntoView());
await p.waitForTimeout(1300);
const faq = await p.evaluate(() => {
  const items = [...document.querySelectorAll('.sv-faq-item')];
  const t = document.querySelector('.sv-faq-title');
  return { n: items.length, titleFs: getComputedStyle(t).fontSize, border: getComputedStyle(items[0]).borderBottomColor, qs: items.map((i) => i.querySelector('button span').textContent) };
});
check('8 FAQ items + centred bold heading', faq.n === 8 && faq.titleFs === '40px');
for (const kw of ['commercial fit-outs', 'villa', 'joinery', 'consultation', 'long does a project take', 'manage the project'])
  check(`FAQ covers: ${kw}`, faq.qs.some((q) => q.toLowerCase().includes(kw)));
const panelH = (i) => p.$eval(`#faq-a-${i}`, (e) => e.getBoundingClientRect().height);
check('all collapsed at start', (await panelH(0)) === 0 && (await panelH(3)) === 0);
await p.click('#faq-q-0');
await p.waitForTimeout(150);
const mid = await panelH(0);
await p.waitForTimeout(700);
const open = await panelH(0);
check(`opens smoothly (mid ${mid.toFixed(0)}px -> ${open.toFixed(0)}px)`, mid > 0 && mid < open && open > 40);
check('aria-expanded true + icon morphs', (await p.getAttribute('#faq-q-0', 'aria-expanded')) === 'true' && (await p.$eval('#faq-q-0 i', (e) => getComputedStyle(e, '::after').opacity)) === '0');
await p.click('#faq-q-3');
await p.waitForTimeout(900);
check('opening another closes the first', (await panelH(0)) === 0 && (await panelH(3)) > 40);
await p.click('#faq-q-3');
await p.waitForTimeout(900);
check('clicking again collapses', (await panelH(3)) === 0 && (await p.getAttribute('#faq-q-3', 'aria-expanded')) === 'false');
await p.focus('#faq-q-5');
await p.keyboard.press('Enter');
await p.waitForTimeout(800);
check('keyboard Enter opens an item', (await panelH(5)) > 40);
const contactFaq = await p.$eval('#faq-a-7', (e) => e.textContent);
check('FAQ contact answer uses LFT details', /04 282 9773/.test(contactFaq) && /info@lftinteriors\.com/.test(contactFaq));

// slider
await p.evaluate(() => document.getElementById('highlights').scrollIntoView());
await p.waitForTimeout(800);
await p.click('.sv-dots button:nth-child(2)');
await p.waitForTimeout(1600);
check('slider dot shows 2nd highlight', await p.$eval('.sv-slide:nth-child(2)', (e) => e.classList.contains('is-active')));
await p.waitForTimeout(7200);
check('slider auto-advances', await p.$eval('.sv-slide:nth-child(3)', (e) => e.classList.contains('is-active')));

// footer + header unchanged/consistent
check('footer LFT details', await p.$eval('footer', (f) => /info@lftinteriors\.com/.test(f.innerText) && /04 282 9773/.test(f.innerText) && /Ithraa Tower, Al Garhoud, Dubai, UAE/.test(f.innerText) && f.querySelectorAll('.footer-lines span').length === 7));
check('header uses LFT logo', (await p.$$eval('.hdr-main img[src*="lft-logo"]', (i) => i.length)) >= 1);
check('no JS / request errors', errs.length === 0, errs.join('|'));

// responsive
for (const [name, w, cols] of [['tablet', 820, 2], ['mobile', 390, 1]]) {
  const q = await b.newPage({ viewport: { width: w, height: 844 } });
  await q.goto(base + '/services.html', { waitUntil: 'networkidle' });
  await q.waitForTimeout(800);
  const r = await q.evaluate(() => ({
    ov: document.documentElement.scrollWidth > innerWidth,
    cols: getComputedStyle(document.querySelector('.sv-grid')).gridTemplateColumns.split(' ').length,
    wide: [...document.querySelectorAll('#services-page *')].filter((e) => !e.closest('.page-lines, .sv-bp') && e.getBoundingClientRect().right > innerWidth + 1).length,
    authRows: new Set([...document.querySelectorAll('.sv-auth')].map((a) => Math.round(a.getBoundingClientRect().top))).size,
  }));
  check(`${name}: ${cols} col grid, no overflow (auth rows ${r.authRows})`, !r.ov && r.cols === cols && r.wide === 0, JSON.stringify(r));
  await q.close();
}
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
