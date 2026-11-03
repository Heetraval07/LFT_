// End-to-end test of photo uploads: security, validation, UI, saving, serving, deletion safety and the automatic
// storage self-check. Creates temporary records/files and removes them at the end.
import { chromium } from 'playwright';
import 'dotenv/config';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, rmSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { db } from '../lib/db.ts';

const base = process.env.BASE_URL || 'http://localhost:5173';
const DIR = process.env.UPLOAD_DIR;
const EMAIL = process.env.ADMIN_TEST_EMAIL || 'admin-test@lft.local';
const PW = process.env.ADMIN_TEST_PASSWORD || readFileSync('C:/Users/hrava/AppData/Local/Temp/claude/c--Orro/6593535e-a602-429a-a368-9c5ab38001c5/scratchpad/admin-test-pw.txt', 'utf8');
if (!DIR) throw new Error('Set UPLOAD_DIR (the dev server and this test must use the same folder).');
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };
const TAG = `UP ${Date.now().toString(36)}`;
const files = () => readdirSync(DIR).filter((n) => /^[a-f0-9]{32}\.(jpg|png|webp)$/.test(n));
const created = new Set();
await db.loginAttempt.deleteMany({});
const filesBefore = files().length;

const jpeg = (n) => readFileSync(`public/images/projects/eyewa-ssmc/0${n}.jpg`);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1400, height: 950 } });
const p = await ctx.newPage();
p.on('dialog', (d) => d.accept());
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));

// real PNG / WebP bytes, made by the browser itself
const png = Buffer.from(await p.evaluate(async () => { const c = document.createElement('canvas'); c.width = 64; c.height = 48; const g = c.getContext('2d'); g.fillStyle = '#c33'; g.fillRect(0, 0, 64, 48); return (await new Promise((r) => c.toBlob(r, 'image/png'))).arrayBuffer().then((a) => [...new Uint8Array(a)]); }));
const webp = Buffer.from(await p.evaluate(async () => { const c = document.createElement('canvas'); c.width = 40; c.height = 30; const g = c.getContext('2d'); g.fillStyle = '#39c'; g.fillRect(0, 0, 40, 30); return (await new Promise((r) => c.toBlob(r, 'image/webp'))).arrayBuffer().then((a) => [...new Uint8Array(a)]); }));

// browser-side upload helper (same origin + session cookie, like the real form)
const upload = (items) => p.evaluate(async (list) => {
  const fd = new FormData();
  for (const it of list) fd.append('files', new File([new Uint8Array(it.bytes)], it.name, { type: it.type }));
  const r = await fetch('/admin/upload', { method: 'POST', body: fd });
  return { status: r.status, body: await r.json() };
}, items.map((i) => ({ ...i, bytes: [...i.bytes] })));

try {
  // ---------- not signed in ----------
  await p.goto(base + '/admin/login', { waitUntil: 'networkidle' });
  const anon = await upload([{ name: 'a.jpg', type: 'image/jpeg', bytes: jpeg(1) }]);
  check('signed out: upload endpoint refuses (401)', anon.status === 401 && files().length === filesBefore);
  const anonServe = await ctx.request.get(base + '/uploads/00000000000000000000000000000000.jpg', { failOnStatusCode: false });
  check('unknown photo name -> 404', anonServe.status() === 404);

  // ---------- sign in; the Photo Storage page/menu item is gone ----------
  await p.fill('#email', EMAIL); await p.fill('#password', PW); await p.click('button[type=submit]');
  await p.waitForURL(base + '/admin');
  const navText = await p.$$eval('.a-nav a, .a-nav button', (x) => x.map((e) => e.textContent.trim()));
  check(`menu is Dashboard / Projects / Categories / Testimonials / Logout (${navText.join(', ')})`, navText.join() === 'Dashboard,Projects,Categories,Testimonials,Logout');
  const gone = await ctx.request.get(base + '/admin/storage', { failOnStatusCode: false });
  check('/admin/storage no longer exists (404)', gone.status() === 404);

  // ---------- validation (nothing bad may reach the disk) ----------
  const n0 = files().length;
  const bad = [
    { name: 'notes.jpg', type: 'image/jpeg', bytes: Buffer.from('this is plain text, not a picture') },
    { name: 'vector.svg', type: 'image/svg+xml', bytes: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>') },
    { name: 'page.jpg', type: 'image/jpeg', bytes: Buffer.from('<html><script>alert(1)</script></html>') },
    { name: 'tool.exe', type: 'application/octet-stream', bytes: Buffer.from('MZ\x90\x00fake') },
    { name: 'png-as-jpg.jpg', type: 'image/jpeg', bytes: png },
    { name: 'wrong-ext.gif', type: 'image/gif', bytes: Buffer.from('GIF89a\x01\x00\x01\x00') },
    { name: 'empty.jpg', type: 'image/jpeg', bytes: Buffer.alloc(0) },
    { name: 'huge.jpg', type: 'image/jpeg', bytes: Buffer.concat([jpeg(1), Buffer.alloc(11 * 1024 * 1024)]) },
  ];
  const rb = await upload(bad);
  check(`all ${bad.length} unsafe/invalid files rejected with a reason each`, rb.status === 200 && rb.body.files.length === 0 && rb.body.errors.length === bad.length, JSON.stringify(rb.body.errors.map((e) => e.name)));
  check('nothing was written to the photo folder', files().length === n0);
  check('error messages are plain English (no internal paths)', rb.body.errors.every((e) => !/[A-Z]:\\|\/home\/|\.ts|Error:/.test(e.error)));
  const many = await upload(Array.from({ length: 26 }, (_, i) => ({ name: `m${i}.jpg`, type: 'image/jpeg', bytes: jpeg(1) })));
  check('more than 25 files in one go is refused (413)', many.status === 413 && files().length === n0);

  // ---------- good files ----------
  const good = await upload([{ name: 'one.jpg', type: 'image/jpeg', bytes: jpeg(1) }, { name: 'two.png', type: 'image/png', bytes: png }, { name: 'three.webp', type: 'image/webp', bytes: webp }]);
  good.body.files.forEach((f) => created.add(f.path.replace('/uploads/', '')));
  check('JPG, PNG and WebP accepted together', good.status === 200 && good.body.files.length === 3 && good.body.errors.length === 0);
  check('files stored under random 32-hex names with the right extension, original names not used', good.body.files.every((f) => /^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(f.path)) && good.body.files.map((f) => f.path.split('.').pop()).join() === 'jpg,png,webp');
  check('width/height read from the file (1280x960 jpg, 64x48 png, 40x30 webp)', good.body.files.map((f) => `${f.width}x${f.height}`).join() === '1280x960,64x48,40x30', good.body.files.map((f) => `${f.width}x${f.height}`).join());
  check('files exist in the photo folder, outside the project folder', good.body.files.every((f) => existsSync(path.join(DIR, f.path.slice(9)))) && !path.resolve(DIR).startsWith(path.resolve('.')));
  check('no temporary .part files left behind', !readdirSync(DIR).some((n) => n.endsWith('.part')));
  const first = good.body.files[0];
  const served = await ctx.request.get(base + first.path);
  check('uploaded photo is served publicly with the right type and safety headers', served.status() === 200 && served.headers()['content-type'] === 'image/jpeg' && served.headers()['x-content-type-options'] === 'nosniff' && /immutable/.test(served.headers()['cache-control']) && (await served.body()).equals(jpeg(1)));
  for (const evil of ['/uploads/..%2f.env', '/uploads/..%5c..%5cpackage.json', '/uploads/.lft-storage-marker.json', '/uploads/x.jpg', '/uploads/' + first.path.slice(9).replace('.jpg', '.JPG')]) {
    const r = await ctx.request.get(base + evil, { failOnStatusCode: false });
    check(`path trick ${evil.slice(0, 34)} is refused (${r.status()})`, r.status() === 404 || r.status() === 400);
  }

  // ---------- through the real form ----------
  await p.goto(base + '/admin/projects/new', { waitUntil: 'networkidle' });
  const note = (await p.textContent('.a-card:has(h2:has-text("Photos"))')).replace(/\s+/g, ' ');
  check('form shows a plain status line (confirmed, or not yet confirmed) and the upload button', /confirmed safe|not yet confirmed/i.test(note) && (await p.$$('label[for="photo-files"]')).length === 1);
  check('status wording is plain (no "UPLOAD_DIR"/technical terms)', !/UPLOAD_DIR|marker|hbuilds|env/i.test(note));
  await p.fill('#name', `${TAG} Upload Project`); await p.fill('#location', 'Test, Dubai'); await p.fill('#shortDescription', 'Created by the upload test.');
  await p.setInputFiles('#photo-files', [
    { name: 'front.jpg', mimeType: 'image/jpeg', buffer: jpeg(2) },
    { name: 'plan.png', mimeType: 'image/png', buffer: png },
    { name: 'detail.webp', mimeType: 'image/webp', buffer: webp },
    { name: 'broken.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not an image') },
  ]);
  await p.waitForSelector('.a-photo');
  await p.waitForSelector('.a-alert.is-ok');
  check('3 good photos appear as previews with a "New" tag; the bad one is reported', (await p.$$('.a-photo')).length === 3 && (await p.$$('.a-cover-tag.is-new, .a-cover-tag')).length === 3 && /broken\.jpg: This is not a valid/.test(await p.textContent('.a-alert.is-err')));
  const previews = await p.$$eval('.a-photo img', (x) => x.map((i) => i.getAttribute('src')));
  await p.waitForFunction(() => [...document.querySelectorAll('.a-photo img')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 15000 }).catch(() => {});
  check('previews are the stored photos (/uploads/…) and they load', previews.every((s) => s.startsWith('/uploads/')) && (await p.$$eval('.a-photo img', (x) => x.every((i) => i.complete && i.naturalWidth > 0))));
  previews.forEach((s) => created.add(s.slice(9)));
  // reorder (move last to first), choose it as cover, remove the middle one
  await p.click('.a-photo:nth-child(3) [aria-label^="Move photo 3 earlier"]');
  await p.click('.a-photo:nth-child(2) [aria-label^="Move photo 2 earlier"]');
  await p.click('.a-photo:nth-child(1) [aria-label^="Use photo 1 as cover"]');
  const orderUi = await p.$$eval('.a-photo img', (x) => x.map((i) => i.getAttribute('src')));
  await p.click('.a-photo:nth-child(3) [aria-label^="Remove photo 3"]');
  const keptUi = await p.$$eval('.a-photo img', (x) => x.map((i) => i.getAttribute('src')));
  await p.click('button[value=publish]');
  await p.waitForURL(/saved=published/);
  const proj = await db.project.findFirst({ where: { name: `${TAG} Upload Project` }, include: { images: { orderBy: { sortOrder: 'asc' } } } });
  check('project saved with the 2 kept photos in the chosen order, first one is the cover', proj.isPublished && proj.images.map((i) => i.path).join() === keptUi.join() && proj.images[0].isCover && !proj.images[1].isCover);
  check('width/height stored for the new photos', proj.images.every((i) => i.width > 0 && i.height > 0));
  const removedName = orderUi[2].slice(9);
  check('the removed (never saved) upload stays on disk only as an orphan: harmless, never served in the project', existsSync(path.join(DIR, removedName)) && !proj.images.some((i) => i.path.endsWith(removedName)));

  // ---------- public site ----------
  const pub = await ctx.newPage();
  await pub.goto(`${base}/project.html?p=${proj.slug}`, { waitUntil: 'networkidle' });
  await pub.waitForSelector('.pd-slider');
  const pubShots = await pub.$$eval('.pd-shot img', (x) => x.map((i) => new URL(i.src).pathname));
  check('public project page shows the uploaded photos, loaded OK', pubShots.join() === proj.images.map((i) => i.path).join() && (await pub.$$eval('.pd-shot img', (x) => x.every((i) => i.complete && i.naturalWidth > 0))));
  await pub.goto(`${base}/projects.html`, { waitUntil: 'networkidle' });
  await pub.waitForSelector('.pj-item');
  check('public Projects page shows the cover', (await pub.$$eval('.pj-item img', (x) => x.map((i) => new URL(i.src).pathname))).includes(proj.images[0].path));

  // ---------- edit: add one more, then deletion safety ----------
  await p.goto(`${base}/admin/projects/${proj.id}`, { waitUntil: 'networkidle' });
  await p.setInputFiles('#photo-files', [{ name: 'extra.jpg', mimeType: 'image/jpeg', buffer: jpeg(3) }]);
  await p.waitForSelector('.a-photo:nth-child(3)');
  const extra = await p.$eval('.a-photo:nth-child(3) img', (i) => i.getAttribute('src'));
  created.add(extra.slice(9));
  await p.click('button[value=publish]');
  await p.waitForURL(/saved=published/);
  check('editing: a 3rd photo can be added later', (await db.projectImage.count({ where: { projectId: proj.id } })) === 3);
  // a second project shares one photo
  const shared = proj.images[0].path;
  const other = await db.project.create({ data: { name: `${TAG} Shares`, slug: `${TAG.toLowerCase().replace(' ', '-')}-shares`, shortDescription: 'x', description: '', location: 'x', images: { create: [{ path: shared, sortOrder: 0, isCover: true }] } } });
  // remove the shared photo from the first project in the UI
  await p.goto(`${base}/admin/projects/${proj.id}`, { waitUntil: 'networkidle' });
  await p.click('.a-photo:nth-child(1) [aria-label^="Remove photo 1"]');
  await p.click('button[value=publish]');
  await p.waitForURL(/saved=published/);
  check('removing a photo that another project still uses keeps the file', existsSync(path.join(DIR, shared.slice(9))));
  const unique = (await db.projectImage.findMany({ where: { projectId: proj.id } })).map((i) => i.path);
  await db.project.delete({ where: { id: other.id } });
  await p.goto(`${base}/admin/projects`, { waitUntil: 'networkidle' });
  await p.locator('.a-table tbody tr', { has: p.locator(`a[href="/admin/projects/${proj.id}"]`) }).locator('button:has-text("Delete")').click();
  await p.waitForURL(/deleted=1/);
  check('deleting the project removes the files only it used', unique.every((u) => !existsSync(path.join(DIR, u.slice(9)))) && (await db.projectImage.count({ where: { projectId: proj.id } })) === 0);
  check('bundled website photos are untouched by all of this', existsSync('public/images/projects/eyewa-ssmc/05.jpg') && (await db.projectImage.count({ where: { path: { startsWith: '/images/projects/' } } })) === 76);

  // ---------- testimonial photo / logo ----------
  await p.goto(`${base}/admin/testimonials/new`, { waitUntil: 'networkidle' });
  await p.fill('#clientName', `${TAG} Client`); await p.fill('#text', 'Upload test testimonial with a photo and a logo.');
  await p.setInputFiles('#up-photo', { name: 'me.png', mimeType: 'image/png', buffer: png });
  await p.waitForSelector('text=New photo uploaded');
  await p.setInputFiles('#up-logo', { name: 'logo.webp', mimeType: 'image/webp', buffer: webp });
  await p.waitForSelector('text=New logo uploaded');
  await p.click('button[value=publish]');
  await p.waitForURL(/saved=published/);
  const t = await db.testimonial.findFirst({ where: { clientName: `${TAG} Client` } });
  [t.photoPath, t.logoPath].forEach((x) => x && created.add(x.slice(9)));
  check('testimonial photo + logo saved as /uploads/ paths', /^\/uploads\/[a-f0-9]{32}\.png$/.test(t.photoPath) && /^\/uploads\/[a-f0-9]{32}\.webp$/.test(t.logoPath));
  await pub.goto(`${base}/about.html`, { waitUntil: 'networkidle' });
  await pub.waitForSelector('#testimonials .ab-slide');
  await pub.evaluate(() => document.getElementById('testimonials').scrollIntoView());
  await pub.waitForFunction(() => [...document.querySelectorAll('#testimonials .ab-t-photo, #testimonials .ab-t-logo')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 15000 }).catch(() => {});
  check('About page shows the testimonial photo and logo', (await pub.$$eval('#testimonials .ab-t-photo, #testimonials .ab-t-logo', (x) => x.every((i) => i.complete && i.naturalWidth > 0 && i.getAttribute('src').startsWith('/uploads/')))) && (await pub.$$('#testimonials .ab-t-photo')).length === 1);
  await p.goto(`${base}/admin/testimonials`, { waitUntil: 'networkidle' });
  await p.locator('.a-table tbody tr', { hasText: `${TAG} Client` }).locator('button:has-text("Delete")').click();
  await p.waitForURL(/deleted=1/);
  check('deleting the testimonial removes its photo and logo files', !existsSync(path.join(DIR, t.photoPath.slice(9))) && !existsSync(path.join(DIR, t.logoPath.slice(9))));

  // ---------- the automatic self-check (separate temporary folder, simulated redeploys) ----------
  const tmp = path.join(os.tmpdir(), `lft-storage-sim-${Date.now()}`);
  const run = (deploy, dir = tmp) => {
    try {
      const out = execFileSync(process.execPath, ['scripts/storage-check.ts'], { env: { ...process.env, UPLOAD_DIR: dir, LFT_DEPLOY_ID: deploy, APP_ENV: 'production' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      return { code: 0, out };
    } catch (e) { return { code: e.status, out: String(e.stdout) }; }
  };
  const st = (r) => (r.out.match(/State\s+:\s+(\w+)/) || [])[1];
  let r1 = run('deploy-1');
  check('first deployment: PROVISIONAL (uploads would stay blocked on production)', st(r1) === 'PROVISIONAL' && r1.code === 2 && /BLOCKED here because APP_ENV=production/.test(r1.out));
  mkdirSync(tmp, { recursive: true });
  writeFileSync(path.join(tmp, 'a'.repeat(32) + '.jpg'), jpeg(1));
  let r1b = run('deploy-1');
  check('same deployment again: still PROVISIONAL (restarts alone prove nothing)', st(r1b) === 'PROVISIONAL');
  let r2 = run('deploy-2');
  check('after a redeployment finds the earlier marker: CONFIRMED automatically', st(r2) === 'CONFIRMED' && r2.code === 0);
  check('photos are still there after the simulated redeployments', existsSync(path.join(tmp, 'a'.repeat(32) + '.jpg')));
  const nodir = run('deploy-3', path.join(os.tmpdir(), 'x'));
  check('a folder inside the app folder is refused as unsafe', st(run('deploy-4', path.resolve('uploads-inside'))) === 'OFF');
  check('a relative path is refused', st(run('deploy-5', 'relative/path')) === 'OFF');
  rmSync(tmp, { recursive: true, force: true });
  rmSync(path.join(os.tmpdir(), 'x'), { recursive: true, force: true });

  check('no JS errors in the admin', errs.length === 0, errs.slice(0, 2).join(' | '));
} finally {
  for (const n of created) { try { unlinkSync(path.join(DIR, n)); } catch { /* already gone */ } }
  await db.project.deleteMany({ where: { name: { startsWith: TAG } } });
  await db.testimonial.deleteMany({ where: { clientName: { startsWith: TAG } } });
  await b.close();
  await db.$disconnect();
}
check(`the photo folder is back to ${filesBefore} photo file(s) (test files cleaned up)`, files().length === filesBefore, `now ${files().length}`);
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
