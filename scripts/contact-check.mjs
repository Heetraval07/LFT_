// Verifies the Contact page: layout metrics, map, form validation, honest submission behaviour, responsiveness.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const b = await chromium.launch();
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };
const near = (a, e, t = 2) => Math.abs(a - e) <= t;

const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => m.type() === 'error' && !/google|gstatic|maps/i.test(m.text()) && errs.push(m.text()));
p.on('requestfailed', (r) => { if (!/google|gstatic/.test(r.url()) && r.failure()?.errorText !== 'net::ERR_ABORTED') errs.push('req ' + r.url()); }); // aborted = cancelled prefetch/navigation, not an error
await p.goto(base + '/contact.html', { waitUntil: 'networkidle' });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 60)); } scrollTo({ top: 0, behavior: 'instant' }); });
await p.waitForTimeout(1500);

const text = await p.evaluate(() => document.body.innerText);
check('no ORRO / old brand', !/orro|maison|verre/i.test(text));
check('old contact design removed', !/let.s start with a|conversation|estimated budget|under \$25k|residential interiors|send enquiry/i.test(text) && (await p.$$('select, .chips, .page-hero')).length === 0);

const order = await p.$$eval('#contact-page > section', (s) => s.map((x) => x.className.split(' ')[0]).join());
check(`section order: map then Get in Touch (${order})`, order === 'ct-top,ct-touch');

const m = await p.evaluate(() => {
  const q = (s) => document.querySelector(s), r = (e) => e.getBoundingClientRect();
  const map = r(q('.ct-map')), iframe = q('.ct-map iframe');
  const h1 = q('.ct-info h1'), hc = getComputedStyle(h1);
  const f = [...document.querySelectorAll('.ct-form input[type=text]:not(.ct-hp), .ct-form input[type=tel], .ct-form input[type=email], .ct-form textarea')].map((e) => { const b = r(e); return [Math.round(b.left), Math.round(b.width), Math.round(b.height), getComputedStyle(e).backgroundColor, getComputedStyle(e).borderTopWidth, Math.round(b.top + scrollY)]; });
  const btn = q('.ct-send'), bb = r(btn), bc = getComputedStyle(btn);
  const info = r(q('.ct-info')), form = r(q('.ct-form'));
  const ph = getComputedStyle(q('#f-name'), '::placeholder');
  return {
    mapTop: Math.round(map.top + scrollY), mapL: Math.round(map.left), mapW: Math.round(map.width), mapH: Math.round(map.height), src: iframe.src,
    top: getComputedStyle(q('.ct-top')).backgroundColor, touch: getComputedStyle(q('.ct-touch')).backgroundColor, touchTop: Math.round(r(q('.ct-touch')).top + scrollY),
    h1: [hc.fontSize, hc.fontWeight, hc.color, Math.round(r(h1).left)], infoW: Math.round(q('.ct-info p').getBoundingClientRect().width),
    fields: f, btn: [Math.round(bb.width), Math.round(bb.height), bc.backgroundColor, bc.color, Math.round(bb.left)], formLeft: Math.round(form.left), formW: Math.round(form.width),
    ph: [ph.textTransform, ph.fontSize], lines: document.querySelectorAll('.page-lines span').length, bodyBg: getComputedStyle(document.body).backgroundColor,
    order: [...document.querySelectorAll('.ct-form input[type=text]:not(.ct-hp), .ct-form input[type=tel], .ct-form input[type=email], .ct-form textarea')].map((e) => e.placeholder),
    req: ['name', 'email', 'message'].map((n) => q(`[name=${n}]`).required), phoneReq: q('[name=phone]').required,
  };
});
check(`map: full-width frame ${m.mapW}x${m.mapH} at x=${m.mapL}, y=${m.mapTop} (ref ~1233x665, y~320)`, near(m.mapW, 1233, 4) && near(m.mapH, 665, 6) && near(m.mapL, 104, 3) && near(m.mapTop, 320, 4));
check('map uses Google Maps for Ithraa Tower, Al Garhoud', /google\.com\/maps/.test(m.src) && /Ithraa(\+|%20)Tower/.test(m.src) && /Al(\+|%20)Garhoud/.test(m.src), m.src.slice(0, 70));
const frame = p.frames().find((f) => /google\.com\/maps/.test(f.url()));
check('map frame loaded from Google for Ithraa Tower (pin verified in screenshot)', !!frame && /ithraa/i.test(decodeURIComponent(frame.url())), frame ? frame.url().slice(0, 60) : 'no frame');
check('black band above map, charcoal contact section', m.top === 'rgb(10, 10, 10)' && m.touch === 'rgb(27, 27, 27)' && m.bodyBg === 'rgb(27, 27, 27)');
check(`heading "Get in Touch" 46px/800 white at x=${m.h1[3]} (ref ~171)`, m.h1[0] === '46px' && m.h1[1] === '800' && m.h1[2] === 'rgb(255, 255, 255)' && near(m.h1[3], 171, 4) && /Get in Touch/.test(text));
check(`intro text ~454px wide (${m.infoW})`, near(m.infoW, 454, 6));
check('fields in order: Name, Phone, Email, Message', m.order.join('|') === 'Your Name|Your Phone No|Your Email|Your Message', m.order.join('|'));
check('name/email/message required, phone optional', m.req.every(Boolean) && !m.phoneReq);
check(`inputs: black bg, no border, 534px wide (${m.fields.map((x) => x[1]).join(',')})`, m.fields.every((x) => x[3] === 'rgb(10, 10, 10)' && x[4] === '0px' && near(x[1], 534, 3)));
check(`input height 59, textarea 141 (${m.fields.map((x) => x[2]).join(',')})`, m.fields.slice(0, 3).every((x) => x[2] === 59) && m.fields[3][2] === 141);
check(`vertical pitch ~82px (${m.fields.map((x) => x[5]).join(',')})`, near(m.fields[1][5] - m.fields[0][5], 82, 1) && near(m.fields[2][5] - m.fields[1][5], 82, 1) && near(m.fields[3][5] - m.fields[2][5], 82, 1));
check('placeholders small uppercase', m.ph[0] === 'uppercase' && m.ph[1] === '11px');
check(`SEND MAIL button: white, black text, 168x45 (${m.btn})`, m.btn[0] === 168 && m.btn[1] === 45 && m.btn[2] === 'rgb(255, 255, 255)' && m.btn[3] === 'rgb(0, 0, 0)' && /send mail/i.test(text));
check(`two columns: form at x=${m.formLeft} (ref ~735), 7 divider lines`, near(m.formLeft, 735, 8) && m.lines === 7);
check('LFT contact details shown', /LFT Interior Design LLC/.test(text) && /Ithraa Tower, Al Garhoud, Dubai, UAE/.test(text) && (await p.$$eval('.ct-details a[href="mailto:info@lftinteriors.com"], .ct-details a[href="tel:+97142829773"]', (a) => a.length)) === 2);
check('Google Maps link works', (await p.$eval('.ct-details a[target]', (a) => a.href)).includes('google.com/maps/search') );

// ---- validation ----
const status = () => p.$eval('#ct-status', (e) => (e.hidden ? '' : e.textContent));
// capture mailto "clicks" (nothing is sent without a configured endpoint)
await p.evaluate(() => { window.__mail = []; document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href^="mailto:"]'); if (a && a.hidden) { e.preventDefault(); window.__mail.push(a.getAttribute('href')); } }, true); });
await p.click('.ct-send');
await p.waitForTimeout(300);
check('empty submit blocked, errors shown', (await p.$eval('#e-name', (e) => e.textContent)) !== '' && (await p.$eval('#e-email', (e) => e.textContent)) !== '' && (await p.$eval('#e-message', (e) => e.textContent)) !== '' && (await p.$eval('#e-phone', (e) => e.textContent)) === '' && /fix the highlighted/i.test(await status()));
check('nothing opened/sent on invalid submit', (await p.evaluate(() => window.__mail.length)) === 0 && !/sent|thank/i.test(await status()));
check('focus moves to first invalid field', await p.$eval('#f-name', (e) => e === document.activeElement));
await p.fill('#f-name', 'Jamie Lee');
await p.fill('#f-email', 'not-an-email');
await p.fill('#f-message', 'Short');
await p.fill('#f-phone', 'abc');
await p.click('.ct-send');
await p.waitForTimeout(300);
check('bad email / phone / short message rejected', /valid email/i.test(await p.$eval('#e-email', (e) => e.textContent)) && /valid phone/i.test(await p.$eval('#e-phone', (e) => e.textContent)) && /at least 10/i.test(await p.$eval('#e-message', (e) => e.textContent)) && (await p.evaluate(() => window.__mail.length)) === 0);
await p.fill('#f-email', 'jamie@example.com');
await p.fill('#f-phone', '+971 50 123 4567');
await p.fill('#f-message', 'We need a fit-out for a 120 sqm cafe in Al Garhoud.');
await p.waitForTimeout(200);
check('errors clear as fields become valid', (await p.$$eval('.ct-error', (e) => e.filter((x) => x.textContent).length)) === 0);
await p.click('.ct-send');
await p.waitForTimeout(400);
const mail = await p.evaluate(() => window.__mail);
check('no endpoint: opens email app to info@lftinteriors.com with the enquiry', mail.length === 1 && mail[0].startsWith('mailto:info@lftinteriors.com?subject=') && decodeURIComponent(mail[0]).includes('Jamie Lee') && decodeURIComponent(mail[0]).includes('jamie@example.com') && decodeURIComponent(mail[0]).includes('120 sqm cafe'), (mail[0] || '').slice(0, 60));
check('no fake success: message says to press Send, form not cleared', /press .*send.* to deliver/i.test(await status()) && !/thank you|has been sent/i.test(await status()) && (await p.inputValue('#f-name')) === 'Jamie Lee');
await p.screenshot({ path: 'screenshots/ct-status.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });

// ---- with an endpoint configured (route-mocked): success only on a real OK response ----
async function withEndpoint(handler) {
  const q = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await q.route('**/contact.html*', async (route) => {
    const r = await route.fetch();
    await route.fulfill({ response: r, body: (await r.text()).replace(/(<meta name="form-endpoint" content=")(")/, '$1https://forms.test/send$2') });
  });
  const seen = [];
  await q.route('https://forms.test/send', async (route) => { seen.push(JSON.parse(route.request().postData() || '{}')); await handler(route); });
  await q.goto(base + '/contact.html', { waitUntil: 'domcontentloaded' });
  await q.waitForSelector('#contact-form');
  await q.fill('#f-name', 'Sam Ortiz'); await q.fill('#f-email', 'sam@example.com'); await q.fill('#f-message', 'Please call me about a villa project.');
  await q.click('.ct-send');
  await q.waitForTimeout(800);
  return { q, seen };
}
let t = await withEndpoint((r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
check('endpoint OK -> real POST + success message + form cleared', t.seen.length === 1 && t.seen[0].email === 'sam@example.com' && t.seen[0].name === 'Sam Ortiz' && /has been sent/i.test(await t.q.$eval('#ct-status', (e) => e.textContent)) && (await t.q.inputValue('#f-name')) === '');
await t.q.close();
t = await withEndpoint((r) => r.fulfill({ status: 500, body: 'nope' }));
check('endpoint error -> error message with email fallback, form kept', /could not be sent/i.test(await t.q.$eval('#ct-status', (e) => e.textContent)) && (await t.q.$eval('#ct-status a[href^="mailto:info@lftinteriors.com"]', (a) => !!a)) && (await t.q.inputValue('#f-name')) === 'Sam Ortiz' && !(await t.q.$eval('.ct-send', (b) => b.disabled)));
await t.q.close();
t = await withEndpoint((r) => r.abort());
check('network failure -> error, not success', /could not be sent/i.test(await t.q.$eval('#ct-status', (e) => e.textContent)));
await t.q.close();

// ---- prefill from Services page cards + footer/header ----
await p.goto(base + '/contact.html?service=kitchens', { waitUntil: 'networkidle' });
check('?service= pre-fills the message', /Kitchens & Joinery/.test(await p.inputValue('#f-message')));
check('footer LFT details + 7 lines + UP button', await p.$eval('footer', (f) => /info@lftinteriors\.com/.test(f.innerText) && /04 282 9773/.test(f.innerText) && f.querySelectorAll('.footer-lines span').length === 7) && !!(await p.$('.up-btn')));
check('header: LFT logo, Contacts active', (await p.$$eval('.hdr-main img[src*="lft-logo"]', (i) => i.length)) >= 1 && (await p.$eval('.hdr-main .hdr-nav a.is-active', (e) => e.textContent)) === 'Contacts');
check('no JS / console errors', errs.length === 0, errs.join('|'));

// ---- responsive ----
for (const [name, w] of [['tablet', 820], ['mobile', 390]]) {
  const q = await b.newPage({ viewport: { width: w, height: 844 } });
  await q.goto(base + '/contact.html', { waitUntil: 'networkidle' });
  await q.waitForTimeout(800);
  const r = await q.evaluate(() => ({
    ov: document.documentElement.scrollWidth > innerWidth,
    cols: getComputedStyle(document.querySelector('.ct-grid')).gridTemplateColumns.split(' ').length,
    wide: [...document.querySelectorAll('#contact-page *')].filter((e) => !e.closest('.page-lines, iframe') && e.getBoundingClientRect().right > innerWidth + 1).length,
    mapH: Math.round(document.querySelector('.ct-map').getBoundingClientRect().height), mapW: Math.round(document.querySelector('.ct-map').getBoundingClientRect().width),
    btnW: Math.round(document.querySelector('.ct-send').getBoundingClientRect().width),
  }));
  check(`${name}: stacked, no overflow, map ${r.mapW}x${r.mapH}`, !r.ov && r.cols === 1 && r.wide === 0 && r.mapW >= w - 2, JSON.stringify(r));
  if (name === 'mobile') {
    await q.fill('#f-name', 'A'); await q.click('.ct-send'); await q.waitForTimeout(300);
    check('mobile: validation works', (await q.$eval('#e-name', (e) => e.textContent)) !== '');
    await q.screenshot({ path: 'screenshots/ct-mobile-form.png', fullPage: true });
  }
  await q.close();
}
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
