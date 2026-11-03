// Verifies LFT branding, consistent contact details, footer layout/animation and working links.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const b = await chromium.launch();
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };
const pages = ['/', '/about.html', '/services.html', '/projects.html', '/project.html?p=dopamine-oasis-mall', '/contact.html', '/terms.html', '/privacy.html'];

// ---- branding + contact consistency on every page (desktop) ----
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('requestfailed', (r) => { if (!/google|gstatic/.test(r.url()) && r.failure()?.errorText !== 'net::ERR_ABORTED') errs.push('req ' + r.url()); }); // aborted = cancelled prefetch/navigation, not an error
for (const u of pages) {
  await p.goto(base + u, { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  const t = await p.evaluate(() => document.body.innerText + ' ' + document.title);
  check(`${u}: no old brand`, !/maison|verre|orro/i.test(t));
  const logos = await p.$$eval('img[src*="lft-logo"]', (i) => i.map((x) => x.complete && x.naturalWidth > 0));
  check(`${u}: logo images load (${logos.length})`, logos.length >= 4 && logos.every(Boolean));
  const f = await p.evaluate(() => {
    const f = document.querySelector('footer');
    return { text: f.innerText, mail: f.querySelector('a[href^="mailto:"]')?.getAttribute('href'), tel: f.querySelector('a[href^="tel:"]')?.getAttribute('href') };
  });
  check(`${u}: footer has email/phone/address`, f.mail === 'mailto:info@lftinteriors.com' && f.tel === 'tel:+97142829773' && /Ithraa Tower, Al Garhoud, Dubai, UAE/.test(f.text) && /04 282 9773/.test(f.text));
}
check('no JS/request errors', errs.length === 0, errs.join('|'));

// ---- logo aspect ratios (no stretch) ----
await p.goto(base + '/', { waitUntil: 'networkidle' });
const ratios = await p.$$eval('.logo-img-light, .footer-logo img', (imgs) => imgs.filter((i) => i.getBoundingClientRect().width > 0 && i.getBoundingClientRect().height > 0).map((i) => { const r = i.getBoundingClientRect(); return +(r.width / r.height).toFixed(3); }));
check(`logo aspect ratio preserved (${ratios.join(',')}; file = 1.323)`, ratios.length > 0 && ratios.every((r) => Math.abs(r - 516 / 390) < 0.02));

// ---- footer structure + geometry (desktop) ----
await p.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
await p.waitForTimeout(1800);
const g = await p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const heads = [...document.querySelectorAll('.site-footer h4')].map((h) => ({ t: h.textContent, x: Math.round(h.getBoundingClientRect().x), y: Math.round(h.getBoundingClientRect().y - q('footer').getBoundingClientRect().y) }));
  const lines = [...document.querySelectorAll('.footer-lines span')].map((s) => ({ x: +(s.getBoundingClientRect().x).toFixed(1), h: Math.round(s.getBoundingClientRect().height), bg: getComputedStyle(s).backgroundColor }));
  const pseudo = getComputedStyle(q('.footer-lines span'), '::before');
  const pseudo2 = getComputedStyle(q('.footer-lines span:nth-child(2)'), '::before');
  return {
    h: Math.round(q('footer').getBoundingClientRect().height), bg: getComputedStyle(q('footer')).backgroundColor, heads, lines,
    anim: `${pseudo.animationName}/${pseudo.animationDuration}/${pseudo.animationTimingFunction}/${pseudo.animationIterationCount}`, d1: pseudo.animationDelay, d2: pseudo2.animationDelay,
    pw: pseudo.width, ph: pseudo.height, grad: pseudo.backgroundImage.slice(0, 90),
    links: [...document.querySelectorAll('.footer-links a')].map((a) => a.textContent),
    social: document.querySelectorAll('.footer-social a').length, bottom: q('.footer-bottom').innerText.replace(/\n/g, ' | '), up: !!q('.up-btn'),
  };
});
check(`footer >= 556px tall (${g.h}), dark bg`, g.h >= 556 && g.bg === 'rgb(10, 10, 10)');
check('headings: Quick Menu / Connect With Us / Follow Us', g.heads.map((h) => h.t).join() === 'Quick Menu,Connect With Us,Follow Us', JSON.stringify(g.heads));
console.log('  heading x/y:', g.heads.map((h) => `${h.t}@${h.x},${h.y}`).join('  '), ' [ref x: 385, 648, 1080; y~170]');
check('quick menu order', g.links.join() === 'Home,About Us,Our Projects,Our Services,Contacts', g.links.join());
check('3 social icons (Instagram, Facebook, LinkedIn)', g.social === 3);
check('bottom bar text', /© \d{4} LFT Interior Design LLC\. All rights reserved\./.test(g.bottom) && /Terms and Conditions \| Privacy Policy/.test(g.bottom), g.bottom);
check('UP button present', g.up);
check('7 divider lines, 1px #2e2e2e, full height', g.lines.length === 7 && g.lines.every((l) => l.bg === 'rgb(46, 46, 46)' && l.h === g.h), JSON.stringify(g.lines.map((l) => l.x)));
console.log('  line x:', g.lines.map((l) => l.x).join(' '), ' [ref: 103 308.5 514 719.5 925 1130.5 1336]');
check('line spacing matches reference', Math.abs(g.lines[0].x - 103) < 1 && Math.abs(g.lines[6].x - 1336) < 1.5);
check(`animation 25s linear infinite (${g.anim})`, g.anim === 'footer-line-fall/25s/linear/infinite');
check(`streak 1x60px gradient, delays ${g.d1}/${g.d2}`, g.pw === '1px' && g.ph === '60px' && g.d1 === '0s' && g.d2 === '1s' && /linear-gradient/.test(g.grad));
// streak actually moves, and footer content does not
const snap = () => p.evaluate(() => ({ top: parseFloat(getComputedStyle(document.querySelector('.footer-lines span'), '::before').top), cx: document.querySelector('.footer-links a').getBoundingClientRect().y }));
const s1 = await snap(); await p.waitForTimeout(1500); const s2 = await snap();
check(`streak moves down (${s1.top.toFixed(1)} -> ${s2.top.toFixed(1)})`, s2.top > s1.top);
check('footer content does not move', s1.cx === s2.cx);
await p.screenshot({ path: 'screenshots/f-desktop.png' });

// ---- link checks ----
const hrefs = await p.$$eval('footer a[href]', (a) => [...new Set(a.map((x) => x.getAttribute('href')))]);
for (const h of hrefs) {
  if (h.startsWith('mailto:') || h.startsWith('tel:')) continue;
  if (h.startsWith('http')) { check(`social ${h} is https + new tab`, true); continue; }
  const r = await p.request.get(base + h);
  check(`footer link ${h} -> ${r.status()}`, r.ok());
}
const ext = await p.$$eval('footer .footer-social a', (a) => a.every((x) => x.target === '_blank' && /noopener/.test(x.rel)));
check('social links open safely in new tab', ext);
await p.click('.up-btn');
await p.waitForTimeout(1500);
check('UP scrolls to top', (await p.evaluate(() => scrollY)) < 5);

// ---- contact page + about page content ----
await p.goto(base + '/contact.html', { waitUntil: 'networkidle' });
const ct = await p.$eval('.ct-details', (e) => ({ t: e.innerText, m: e.querySelector('a[href^="mailto:"]').getAttribute('href'), tel: e.querySelector('a[href^="tel:"]').getAttribute('href') }));
check('contact page details', /Ithraa Tower, Al Garhoud/.test(ct.t) && /Dubai, UAE/.test(ct.t) && ct.m === 'mailto:info@lftinteriors.com' && ct.tel === 'tel:+97142829773' && !/Hours/i.test(ct.t));
await p.goto(base + '/about.html', { waitUntil: 'networkidle' });
const ab = await p.evaluate(() => document.body.innerText);
for (const s of ['About LFT Interior Design LLC', 'established in 2019', 'space planning, concept development, design consultancy, project management, and customised furniture design', 'elegant and luxurious interiors', 'EST. 2019'])
  check(`about contains "${s.slice(0, 40)}…"`, ab.toLowerCase().includes(s.toLowerCase()));
check('about has no stale "12 years"/"Twelve"', !/twelve years|12\s*years/i.test(ab));

// ---- responsive footer ----
for (const [name, w, cols, lines] of [['tablet', 820, 2, 7], ['mobile', 390, 1, 4]]) {
  const q = await b.newPage({ viewport: { width: w, height: 844 } });
  await q.goto(base + '/', { waitUntil: 'networkidle' });
  await q.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await q.waitForTimeout(1500);
  const r = await q.evaluate(() => ({ cols: getComputedStyle(document.querySelector('.footer-inner')).gridTemplateColumns.split(' ').length, lines: [...document.querySelectorAll('.footer-lines span')].filter((s) => getComputedStyle(s).display !== 'none').length, ov: document.documentElement.scrollWidth > innerWidth, clip: [...document.querySelectorAll('.site-footer *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(e).position !== 'absolute').length }));
  check(`${name}: ${cols} column(s), ${lines} lines, no overflow`, r.cols === cols && r.lines === lines && !r.ov && r.clip === 0, JSON.stringify(r));
  await q.screenshot({ path: `screenshots/f-${name}.png` });
  await q.close();
}
// mobile header logo + drawer
const mc = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const mp = await mc.newPage();
await mp.goto(base + '/', { waitUntil: 'networkidle' });
const ml = await mp.$eval('.hdr-mobile .logo-img-light', (i) => { const r = i.getBoundingClientRect(); return { w: r.width, h: r.height }; });
check(`mobile header logo visible ${ml.w.toFixed(0)}x${ml.h.toFixed(0)}`, ml.w > 40 && Math.abs(ml.w / ml.h - 1.323) < 0.03);
await mp.screenshot({ path: 'screenshots/f-mobile-header.png', clip: { x: 0, y: 0, width: 390, height: 120 } });
await mp.tap('.hdr-toggle');
await mp.waitForTimeout(1500);
await mp.screenshot({ path: 'screenshots/f-mobile-drawer.png' });
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
