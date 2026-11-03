// Simulates Hostinger redeployments with the REAL production build, in production mode, using a brand-new photo folder.
// Each "deployment" is a fresh start of the standalone server with a different LFT_DEPLOY_ID (what a new build folder
// looks like to the app). Requires: npm run build, then the standalone folder assembled (see DEPLOYMENT.md / this repo's tests).
import { chromium } from 'playwright';
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { db } from '../lib/db.ts';

const PORT = 3101;
const base = `http://127.0.0.1:${PORT}`;
const DIR = path.join(os.tmpdir(), `lft-redeploy-sim-${Date.now()}`);
const EMAIL = 'admin-test@lft.local';
const PW = readFileSync('C:/Users/hrava/AppData/Local/Temp/claude/c--Orro/6593535e-a602-429a-a368-9c5ab38001c5/scratchpad/admin-test-pw.txt', 'utf8');
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };
const jpeg = readFileSync('public/images/projects/eyewa-ssmc/05.jpg');
const TAG = `SIM ${Date.now().toString(36)}`;
await db.loginAttempt.deleteMany({});

let server = null;
async function deploy(id) {
  if (server) { server.kill(); await new Promise((r) => setTimeout(r, 1200)); }
  server = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve('.next/standalone'),
    env: { ...process.env, PORT: String(PORT), HOSTNAME: '127.0.0.1', NODE_ENV: 'production', APP_ENV: 'production', UPLOAD_DIR: DIR, LFT_DEPLOY_ID: id },
    stdio: 'ignore',
  });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base + '/admin/login')).status === 200) return; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 500)); }
  throw new Error('server did not start');
}

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1300, height: 900 } });
const p = await ctx.newPage();
async function login() {
  await p.goto(base + '/admin/login', { waitUntil: 'networkidle' });
  if (new URL(p.url()).pathname !== '/admin/login') return;
  await p.fill('#email', EMAIL); await p.fill('#password', PW); await p.click('button[type=submit]');
  await p.waitForURL(base + '/admin');
}
const api = () => p.evaluate(async (bytes) => {
  const fd = new FormData(); fd.append('files', new File([new Uint8Array(bytes)], 'p.jpg', { type: 'image/jpeg' }));
  const r = await fetch('/admin/upload', { method: 'POST', body: fd }); return { status: r.status, body: await r.json() };
}, [...jpeg]);
const note = async () => { await p.goto(base + '/admin/projects/new', { waitUntil: 'networkidle' }); return (await p.textContent('.a-card:has(h2:has-text("Photos"))')).replace(/\s+/g, ' '); };
let photoPath = null;

try {
  // ---- deployment 1: brand-new folder ----
  await deploy('build-1');
  await login();
  let t = await note();
  check('production, deployment 1: uploads are BLOCKED with a plain explanation', /waiting for a safety check/i.test(t) && (await p.$eval('#photo-files', (e) => e.disabled)));
  const blocked = await api();
  check('production, deployment 1: the upload endpoint refuses too (409)', blocked.status === 409 && /safety check/i.test(blocked.body.error));
  check('a marker was written to the new folder automatically', existsSync(path.join(DIR, '.lft-storage-marker.json')));

  // ---- deployment 2: restart that is the same build: proves nothing ----
  await deploy('build-1');
  await login();
  check('restart of the SAME build proves nothing: still blocked', /waiting for a safety check/i.test(await note()));

  // ---- deployment 2: a real redeploy ----
  await deploy('build-2');
  await login();
  t = await note();
  check('production, deployment 2: CONFIRMED automatically, uploads enabled, no action needed', /confirmed safe/i.test(t) && !(await p.$eval('#photo-files', (e) => e.disabled)));
  const ok = await api();
  check('upload works after confirmation', ok.status === 200 && ok.body.files.length === 1);
  photoPath = ok.body.files[0].path;
  // attach it to a real record
  await db.project.create({ data: { name: `${TAG} Sim`, slug: `${TAG.toLowerCase().replace(' ', '-')}`, shortDescription: 'x', description: '', location: 'x', isPublished: false, images: { create: [{ path: photoPath, sortOrder: 0, isCover: true }] } } });

  // ---- deployments 3 and 4: the photo survives ----
  await deploy('build-3');
  let served = await fetch(base + photoPath);
  check('deployment 3: the uploaded photo is still served', served.status === 200 && (await served.arrayBuffer()).byteLength === jpeg.length);
  await deploy('build-4');
  await login();
  served = await fetch(base + photoPath);
  check('deployment 4: still served, state still confirmed', served.status === 200 && /confirmed safe/i.test(await note()));

  // ---- a deployment that LOSES the folder content ----
  unlinkSync(path.join(DIR, photoPath.slice(9)));
  await deploy('build-5');
  await login();
  t = await note();
  check('photo missing but the database needs it: uploads BLOCKED with a clear warning', /uploaded photos are missing/i.test(t) && (await p.$eval('#photo-files', (e) => e.disabled)));
  const lost = await api();
  check('...and the endpoint refuses (409)', lost.status === 409 && /missing/i.test(lost.body.error));
  check('the missing photo is not served (404)', (await fetch(base + photoPath)).status === 404);

  // ---- the whole folder wiped (as if overwritten) ----
  rmSync(DIR, { recursive: true, force: true });
  await deploy('build-6');
  await login();
  t = await note();
  check('folder wiped: reported as missing photos, never silently accepted', /missing/i.test(t));
} finally {
  if (server) server.kill();
  await db.project.deleteMany({ where: { name: { startsWith: TAG } } });
  rmSync(DIR, { recursive: true, force: true });
  await b.close();
  await db.$disconnect();
}
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
