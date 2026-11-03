// End-to-end test of the admin dashboard through a real browser, checking each change on the public website.
// Works on its own temporary records (deleted at the end); the real projects are only read, never modified.
import { chromium } from 'playwright';
import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { db } from '../lib/db.ts';

const base = process.env.BASE_URL || 'http://localhost:5173';
const EMAIL = process.env.ADMIN_TEST_EMAIL || 'admin-test@lft.local';
const PW = process.env.ADMIN_TEST_PASSWORD || readFileSync('C:/Users/hrava/AppData/Local/Temp/claude/c--Orro/6593535e-a602-429a-a368-9c5ab38001c5/scratchpad/admin-test-pw.txt', 'utf8');
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };
const TAG = `E2E ${Date.now().toString(36)}`;
await db.loginAttempt.deleteMany({}); // local test DB only: start with a clean sign-in lockout counter
const realBefore = await db.project.findMany({ orderBy: { id: 'asc' }, include: { images: true, categories: true } });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1400, height: 950 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('dialog', (d) => d.accept()); // accept "Are you sure?" confirmations

try {
  // ---------- access control ----------
  for (const u of ['/admin', '/admin/projects', '/admin/projects/new', `/admin/projects/${realBefore[0].id}`, '/admin/projects/categories', '/admin/testimonials', '/admin/testimonials/new']) {
    await p.goto(base + u, { waitUntil: 'domcontentloaded' });
    check(`signed out: ${u} redirects to login`, new URL(p.url()).pathname === '/admin/login');
  }
  const anon = await p.request.post(base + '/admin/projects', { headers: { 'Next-Action': 'x' }, data: 'x', failOnStatusCode: false });
  check('signed out: forged action request is not processed', anon.status() >= 400 || !(await anon.text()).includes('Recently updated'));
  const robots = await p.evaluate(() => document.querySelector('meta[name="robots"]')?.content || '');
  check('admin pages are hidden from search engines', /noindex/.test(robots));

  // ---------- login ----------
  await p.fill('#email', EMAIL); await p.fill('#password', 'definitely-wrong-123'); await p.click('button[type=submit]');
  await p.waitForSelector('.a-alert.is-err');
  check('wrong password rejected with a generic message', /Incorrect email or password/.test(await p.textContent('.a-alert.is-err')));
  check('email kept after a failed attempt', (await p.inputValue('#email')) === EMAIL);
  await p.fill('#password', PW); await p.click('button[type=submit]');
  await p.waitForURL(base + '/admin');
  const cookie = (await ctx.cookies()).find((c) => c.name === 'lft_admin');
  check('signed in; session cookie is HTTP-only + SameSite', !!cookie && cookie.httpOnly && cookie.sameSite === 'Lax');
  const stats = await p.$$eval('.a-stat b', (x) => x.map((e) => +e.textContent));
  check(`dashboard counts match the database (${stats.join('/')})`, stats[0] === await db.project.count() && stats[1] === await db.project.count({ where: { isPublished: true } }) && stats[3] === await db.testimonial.count());

  // ---------- projects list ----------
  await p.goto(base + '/admin/projects', { waitUntil: 'networkidle' });
  check('projects list shows every project', (await p.$$('.a-table tbody tr')).length === realBefore.length);

  // ---------- create (draft) + validation + unique slug ----------
  await p.goto(base + '/admin/projects/new', { waitUntil: 'networkidle' });
  await p.click('button[value=draft]');
  await p.waitForSelector('.a-alert.is-err');
  check('validation: empty form shows a clear message', /Project name is required/.test(await p.textContent('.a-alert.is-err')));
  await p.fill('#name', `${TAG} Showroom`);
  check('slug is generated from the name', (await p.inputValue('#slug')) === `${TAG.toLowerCase().replace(' ', '-')}-showroom`);
  await p.fill('#location', 'Test Location, Dubai'); await p.fill('#shortDescription', 'A temporary project created by the automated admin test.');
  await p.fill('#description', 'First paragraph.\n\nSecond paragraph.'); await p.fill('#type', 'Showroom');
  await p.fill('#designVision', 'Vision text for the test.'); await p.fill('#keyDetails', 'Detail one\nDetail two');
  await p.selectOption('#mainCategoryId', { label: 'Retail Space' });
  await p.click('button[value=publish]');
  await p.waitForFunction(() => /photo/.test(document.querySelector('.a-alert.is-err')?.textContent || ''));
  check('cannot publish a project without photos', /Add at least one photo/.test(await p.textContent('.a-alert.is-err')));
  await p.click('button[value=draft]');
  await p.waitForURL(/\/admin\/projects\/\d+\?saved=/);
  const newId = Number(p.url().match(/projects\/(\d+)/)[1]);
  const created = await db.project.findUnique({ where: { id: newId }, include: { categories: { include: { category: true } } } });
  check('draft saved to the database with all fields', created && !created.isPublished && created.description === 'First paragraph.\n\nSecond paragraph.' && JSON.stringify(created.keyDetails) === '["Detail one","Detail two"]' && created.categories[0]?.category.name === 'Retail Space');
  // same name again -> unique slug
  await p.goto(base + '/admin/projects/new', { waitUntil: 'networkidle' });
  await p.fill('#name', `${TAG} Showroom`); await p.fill('#location', 'Dubai'); await p.fill('#shortDescription', 'Second project with the same name.');
  await p.click('button[value=draft]');
  await p.waitForURL(/\/admin\/projects\/\d+\?saved=/);
  const dupId = Number(p.url().match(/projects\/(\d+)/)[1]);
  const dup = await db.project.findUnique({ where: { id: dupId } });
  check(`duplicate name gets a unique slug (${dup.slug})`, dup.slug === `${created.slug}-2`);

  // Give the test project 3 photos (re-using bundled website photos; uploads are verified separately).
  const srcs = ['/images/projects/eyewa-ssmc/05.jpg', '/images/projects/eyewa-ssmc/02.jpg', '/images/projects/eyewa-ssmc/03.jpg'];
  await db.projectImage.createMany({ data: srcs.map((path, i) => ({ projectId: newId, path, sortOrder: i, isCover: i === 0 })) });

  // ---------- edit: reorder, cover, remove, publish ----------
  await p.goto(`${base}/admin/projects/${newId}`, { waitUntil: 'networkidle' });
  check('edit form shows the 3 photos', (await p.$$('.a-photo')).length === 3);
  await p.click('.a-photo:nth-child(3) [aria-label^="Move photo 3 earlier"]'); // 3 -> position 2
  await p.click('.a-photo:nth-child(3) [aria-label^="Use photo 3 as cover"]'); // cover = original 2nd photo, now 3rd
  await p.click('.a-photo:nth-child(1) [aria-label^="Remove photo 1"]');
  check('photo manager updates live (2 left, one cover)', (await p.$$('.a-photo')).length === 2 && (await p.$$('.a-photo.is-cover')).length === 1);
  await p.fill('#shortDescription', 'Edited short description for the test.');
  await p.check('input[name=isFeatured]'); await p.fill('#homeOrder', '0');
  await p.click('button[value=publish]');
  await p.waitForURL(/saved=published/);
  check('publish confirmation shown', /published/.test(await p.textContent('.a-alert.is-ok')));
  const after = await db.projectImage.findMany({ where: { projectId: newId }, orderBy: { sortOrder: 'asc' } });
  check('photo order, cover and removal saved', after.map((i) => i.path).join() === [srcs[2], srcs[1]].join() && after.find((i) => i.isCover)?.path === srcs[1]);
  check('removed bundled photo file is never deleted from disk', existsSync(`public${srcs[0]}`));

  // ---------- public website reflects it immediately (no redeploy) ----------
  const pub = await ctx.newPage();
  await pub.goto(`${base}/projects.html`, { waitUntil: 'networkidle' });
  const tiles = await pub.$$eval('.pj-item', (a) => a.map((x) => x.getAttribute('aria-label')));
  check('new project appears on the public Projects page', tiles.includes(`${TAG} Showroom`) && tiles.length === realBefore.filter((x) => x.isPublished).length + 1);
  check('draft project is NOT public', !tiles.some((t, i) => tiles.indexOf(t) !== i));
  await pub.goto(`${base}/project.html?p=${created.slug}`, { waitUntil: 'networkidle' });
  await pub.waitForSelector('.pd-slider');
  check('public detail page shows the edited content', (await pub.textContent('.pd-banner h1')) === `${TAG} Showroom` && /Edited short description/.test(await pub.textContent('.pd-copy')) && (await pub.title()).startsWith(`${TAG} Showroom`));
  const pubShots = await pub.$$eval('.pd-shot img', (x) => x.map((i) => new URL(i.src).pathname));
  check('public gallery uses the cover first, then the new order', pubShots.join() === [srcs[1], srcs[2]].join());
  await pub.goto(`${base}/`, { waitUntil: 'networkidle' });
  await pub.waitForSelector('.recent-item');
  check('featured project shows in the homepage gallery', (await pub.$$eval('.recent-item', (a) => a.map((x) => x.getAttribute('aria-label')))).includes(`${TAG} Showroom`));

  // ---------- list actions: unfeature, unpublish ----------
  await p.goto(`${base}/admin/projects`, { waitUntil: 'networkidle' });
  const row = p.locator('.a-table tbody tr', { hasText: `${TAG} Showroom` }).first();
  await row.locator('button', { hasText: 'Remove from homepage' }).click();
  await p.waitForLoadState('networkidle');
  await row.locator('button', { hasText: 'Unpublish' }).click();
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
  const flags = await db.project.findUnique({ where: { id: newId }, select: { isPublished: true, isFeatured: true } });
  check('unfeature + unpublish from the list', !flags.isPublished && !flags.isFeatured);
  await pub.goto(`${base}/project.html?p=${created.slug}`, { waitUntil: 'networkidle' });
  await pub.waitForSelector('h1');
  check('unpublished project disappears from the website', (await pub.textContent('h1')) === 'Project not found');

  // ---------- categories ----------
  await p.goto(`${base}/admin/projects/categories`, { waitUntil: 'networkidle' });
  await p.fill('#cat-name-new', `${TAG} Cat`); await p.fill('#cat-order-new', '99');
  await p.click('button:has-text("Add category")');
  await p.waitForSelector('text=Category added.');
  await pub.goto(`${base}/projects.html`, { waitUntil: 'networkidle' });
  check('new category appears as a filter tab on the website', (await pub.$$eval('.pj-filters button', (x) => x.map((e) => e.textContent))).includes(`${TAG} Cat`));
  await p.reload({ waitUntil: 'networkidle' });
  await p.locator('div.a-row', { has: p.locator(`input[value="${TAG} Cat"]`) }).locator('button:has-text("Delete")').last().click();
  await p.waitForLoadState('networkidle'); await p.waitForTimeout(400);
  check('category deleted', !(await db.category.findFirst({ where: { name: `${TAG} Cat` } })));

  // ---------- delete projects ----------
  for (const id of [newId, dupId]) {
    await p.goto(`${base}/admin/projects`, { waitUntil: 'networkidle' });
    const name = (await db.project.findUnique({ where: { id } })).name;
    await p.locator('.a-table tbody tr', { has: p.locator(`a[href="/admin/projects/${id}"]`) }).locator('button:has-text("Delete")').click();
    await p.waitForURL(/deleted=1/);
    check(`project "${name}" deleted (with its photo records)`, !(await db.project.findUnique({ where: { id } })) && (await db.projectImage.count({ where: { projectId: id } })) === 0);
  }
  check('bundled photos still on disk after deleting the project', srcs.every((s) => existsSync(`public${s}`)));

  // ---------- testimonials ----------
  await p.goto(`${base}/admin/testimonials/new`, { waitUntil: 'networkidle' });
  await p.fill('#clientName', `${TAG} Client`); await p.fill('#designation', 'Operations Manager'); await p.fill('#company', 'Test Co');
  await p.fill('#text', 'This testimonial was created by the automated admin test and will be removed.');
  await p.selectOption('#rating', '5'); await p.check('input[name=isFeatured]');
  await p.click('button[value=publish]');
  await p.waitForURL(/\/admin\/testimonials\/\d+\?saved=published/);
  const tId = Number(p.url().match(/testimonials\/(\d+)/)[1]);
  await pub.goto(`${base}/about.html`, { waitUntil: 'networkidle' });
  await pub.waitForSelector('#testimonials .ab-slide');
  const first = await pub.$eval('#testimonials .ab-slide', (e) => e.innerText);
  check('published + featured testimonial is first on the About page', first.includes(`${TAG} Client`) && first.includes('Operations Manager, Test Co') && /★★★★★/.test(first));
  await p.fill('#text', 'Edited testimonial text from the automated admin test.');
  await p.click('button[value=draft]');
  await p.waitForURL(/saved=saved/);
  await pub.goto(`${base}/about.html`, { waitUntil: 'networkidle' });
  check('unpublished (draft) testimonial disappears from the About page', !(await pub.evaluate(() => document.body.innerText)).includes(`${TAG} Client`));
  await p.goto(`${base}/admin/testimonials`, { waitUntil: 'networkidle' });
  await p.locator('.a-table tbody tr', { hasText: `${TAG} Client` }).locator('button:has-text("Publish")').click();
  await p.waitForLoadState('networkidle'); await p.waitForTimeout(400);
  check('publish from the list', (await db.testimonial.findUnique({ where: { id: tId } })).isPublished);
  const before = (await db.testimonial.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] })).map((t) => t.id);
  await p.locator('.a-table tbody tr', { hasText: `${TAG} Client` }).locator('[aria-label$="up"]').click();
  await p.waitForLoadState('networkidle'); await p.waitForTimeout(400);
  const afterOrder = (await db.testimonial.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] })).map((t) => t.id);
  check('reorder moves it up one place', afterOrder.indexOf(tId) === before.indexOf(tId) - 1);
  await p.locator('.a-table tbody tr', { hasText: `${TAG} Client` }).locator('button:has-text("Delete")').click();
  await p.waitForURL(/deleted=1/);
  check('testimonial deleted', !(await db.testimonial.findUnique({ where: { id: tId } })));

  // ---------- real projects untouched ----------
  const realAfter = await db.project.findMany({ where: { id: { in: realBefore.map((r) => r.id) } }, orderBy: { id: 'asc' }, include: { images: true, categories: true } });
  const sig = (list) => JSON.stringify(list.map((x) => [x.id, x.slug, x.isPublished, x.isFeatured, x.homeOrder, x.images.map((i) => [i.path, i.sortOrder, i.isCover]), x.categories.map((c) => c.categoryId)]));
  check('the 8 real projects and their 76 photos are unchanged', sig(realAfter) === sig(realBefore) && realAfter.reduce((n, x) => n + x.images.length, 0) === 76);

  // ---------- logout ----------
  await p.goto(`${base}/admin`, { waitUntil: 'networkidle' });
  await p.click('button:has-text("Logout")');
  await p.waitForURL(/\/admin\/login/);
  await p.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });
  check('after logout the dashboard is locked again', new URL(p.url()).pathname === '/admin/login');
  check('no JS errors in the admin', errs.length === 0, errs.slice(0, 3).join(' | '));

  // ---------- mobile admin ----------
  const mctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mp = await mctx.newPage();
  await mp.goto(`${base}/admin/login`, { waitUntil: 'networkidle' });
  await mp.fill('#email', EMAIL); await mp.fill('#password', PW); await mp.click('button[type=submit]');
  await mp.waitForURL(base + '/admin');
  check('admin works on a phone without sideways scrolling', !(await mp.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
  await mp.screenshot({ path: 'screenshots/admin-mobile.png' });
  await mp.click('button:has-text("Logout")');
  await mctx.close();
} finally {
  // safety net: remove anything this test created, even if a step failed
  const leftovers = await db.project.findMany({ where: { name: { startsWith: TAG } }, select: { id: true } });
  if (leftovers.length) await db.project.deleteMany({ where: { id: { in: leftovers.map((x) => x.id) } } });
  await db.testimonial.deleteMany({ where: { clientName: { startsWith: TAG } } });
  await db.category.deleteMany({ where: { name: { startsWith: TAG } } });
  await b.close();
  await db.$disconnect();
}
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
