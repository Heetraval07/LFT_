// Clicks through the interactive parts of the site and checks they respond.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const out = process.env.OUT || 'screenshots';
const b = await chromium.launch();
const results = [];
const check = (name, ok) => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); };

// Mobile: hero + menu
const mctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); let p = await mctx.newPage();
await p.goto(base + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/x-mobile-hero.png` });
await p.tap('.hdr-toggle').catch(() => p.click('.hdr-toggle')); await p.waitForTimeout(700);
check('mobile menu opens', await p.isVisible('#nav-drawer a[href="/about.html"]'));
await p.screenshot({ path: `${out}/x-mobile-menu.png` });
await p.click('#nav-drawer a[href="/about.html"]'); await p.waitForURL(/about.html/);
check('mobile menu link navigates', p.url().endsWith('/about.html'));
await p.close();

p = await b.newPage({ viewport: { width: 1440, height: 900 } });
// Every nav link resolves
await p.goto(base + '/', { waitUntil: 'networkidle' });
const hrefs = await p.$$eval('a[href^="/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
for (const h of hrefs) { const r = await p.request.get(base + h); check(`link ${h} -> ${r.status()}`, r.ok()); }


// Projects filter
await p.goto(base + '/projects.html', { waitUntil: 'networkidle' });
await p.click('.pj-filters button[data-cat="Entertainment"]'); await p.waitForTimeout(400);
const visible = await p.$$eval('.pj-item', (cs) => cs.length);
check(`filter Entertainment shows 1 image (got ${visible})`, visible === 1);
check('filter updates URL', p.url().includes('category=Entertainment'));
await p.goto(base + '/projects.html?category=Retail%20Space', { waitUntil: 'networkidle' });
check('filter from URL', (await p.$$eval('.pj-item', (c) => c.length)) === 7);

// Project detail + lightbox
await p.goto(base + '/project.html?p=eyewa-masdar', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
check('project title', (await p.textContent('h1')).includes('Eyewa — My City Centre Masdar'));
await p.screenshot({ path: `${out}/x-project-top.png` });
await p.click('.gallery-item >> nth=1'); await p.waitForTimeout(400);
check('lightbox opens', await p.isVisible('.lightbox'));
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
check('lightbox next', (await p.textContent('.lightbox figcaption')).includes('photo 3'));
await p.screenshot({ path: `${out}/x-lightbox.png` });
await p.keyboard.press('Escape'); await p.waitForTimeout(400);
check('lightbox closes', !(await p.isVisible('.lightbox')));
await p.click('.pd-pager .pd-circle:last-child'); await p.waitForURL(/p=jargee-deerfield/); await p.waitForLoadState('networkidle');
check('next project link', p.url().includes('p=jargee-deerfield'));
await p.goto(base + '/project.html?p=nope', { waitUntil: 'networkidle' });
check('unknown project shows not-found', (await p.textContent('h1')).includes('not found'));

// Services FAQ + anchor
await p.goto(base + '/services.html#carpentry', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
const top = await p.$eval('#carpentry', (e) => Math.round(e.getBoundingClientRect().top));
check(`service anchor scrolls into view (top=${top})`, top < 200 && top > -50);
await p.click('#faq-q-0'); await p.waitForTimeout(700);
check('faq opens', (await p.$eval('#faq-a-0', (e) => e.offsetHeight)) > 20);

// Contact form (new layout: name / phone / email / message; no fake success)
await p.goto(base + '/contact.html?service=kitchens', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
check('service pre-fills message from URL', (await p.inputValue('#f-message')).includes('Kitchens & Joinery'));
await p.click('.ct-send'); await p.waitForTimeout(300);
check('empty submit shows errors', (await p.textContent('#e-name')).length > 0 && (await p.textContent('#e-email')).length > 0);
await p.screenshot({ path: `${out}/x-contact-errors.png` });
await b.close();
const failed = results.filter((r) => !r).length;
console.log(failed ? `${failed} check(s) failed` : `All ${results.length} checks passed`);
process.exitCode = failed ? 1 : 0;
