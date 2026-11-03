// Storage check: proves (on the real server) that UPLOAD_DIR is writable AND survives redeployments,
// before photo uploads are switched on. Read-only apart from a small marker file inside UPLOAD_DIR.
import type { Metadata } from 'next';
import path from 'node:path';
import { access, mkdir, readFile, rm, writeFile, constants } from 'node:fs/promises';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../../../../lib/auth.ts';
import { uploadDir, uploadsEnabled } from '../../../../lib/storage.ts';

export const metadata: Metadata = { title: 'Photo storage check' };
export const dynamic = 'force-dynamic';

const MARKER = '.lft-storage-marker.json';

async function inspect() {
  const dir = uploadDir();
  const appDir = process.cwd();
  const r = {
    dir, appDir, configured: Boolean(dir), absolute: dir ? path.isAbsolute(dir) : false,
    insideApp: false, insideManaged: false, writable: false, marker: null as null | { createdAt: string; createdByBuild: string },
    error: '' as string,
  };
  if (!dir) return r;
  const resolved = path.resolve(/*turbopackIgnore: true*/ dir);
  r.insideApp = resolved.startsWith(path.resolve(/*turbopackIgnore: true*/ appDir) + path.sep) || resolved === path.resolve(/*turbopackIgnore: true*/ appDir);
  r.insideManaged = /[\\/](hbuilds|public_html)([\\/]|$)/.test(resolved) || /[\\/]\.next([\\/]|$)/.test(resolved);
  try {
    await mkdir(resolved, { recursive: true });
    await access(resolved, constants.W_OK);
    const probe = path.join(/*turbopackIgnore: true*/ resolved, `.probe-${process.pid}-${Date.now()}`);
    await writeFile(probe, 'ok');
    r.writable = (await readFile(probe, 'utf8')) === 'ok';
    await rm(probe, { force: true });
    r.marker = JSON.parse(await readFile(path.join(/*turbopackIgnore: true*/ resolved, MARKER), 'utf8').catch(() => 'null'));
  } catch (e) {
    r.error = (e as Error).message;
  }
  return r;
}

async function createMarker() {
  'use server';
  await requireAdmin();
  const dir = uploadDir();
  if (!dir) return;
  const file = path.join(/*turbopackIgnore: true*/ path.resolve(/*turbopackIgnore: true*/ dir), MARKER);
  const exists = await access(file).then(() => true, () => false);
  if (!exists) await writeFile(file, JSON.stringify({ createdAt: new Date().toISOString(), createdByBuild: process.cwd() }));
  revalidatePath('/admin/storage');
}

const Row = ({ ok, children }: { ok: boolean | null; children: React.ReactNode }) => (
  <li style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--a-line)' }}>
    <span className={`a-badge ${ok === null ? '' : ok ? 'is-on' : 'is-draft'}`} style={{ minWidth: 54, textAlign: 'center' }}>{ok === null ? '—' : ok ? 'OK' : 'Check'}</span>
    <span>{children}</span>
  </li>
);

export default async function StorageCheck() {
  await requireAdmin();
  const r = await inspect();
  const survived = Boolean(r.marker && r.marker.createdByBuild !== r.appDir);
  return (
    <>
      <div className="a-head">
        <div>
          <h1>Photo storage check</h1>
          <p>Uploads stay switched off until photos are proven to survive website updates on the server.</p>
        </div>
        <span className={`a-badge ${uploadsEnabled() ? 'is-on' : 'is-draft'}`}>{uploadsEnabled() ? 'Uploads ON' : 'Uploads OFF'}</span>
      </div>
      <section className="a-card">
        <h2>Current server</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <Row ok={r.configured}>UPLOAD_DIR is set{r.configured ? <>: <code>{r.dir}</code></> : ' (add it in the hosting environment variables)'}</Row>
          <Row ok={r.configured ? r.absolute : null}>It is a full (absolute) path</Row>
          <Row ok={r.configured ? !r.insideApp && !r.insideManaged : null}>It is outside the website&apos;s own folder (<code>{r.appDir}</code>), which is replaced on every update</Row>
          <Row ok={r.configured ? r.writable : null}>The website can create, read and delete files there{r.error ? ` — ${r.error}` : ''}</Row>
          <Row ok={r.marker ? survived : null}>
            {r.marker
              ? survived
                ? <>Marker file created on {new Date(r.marker.createdAt).toLocaleString('en-GB')} by an earlier version of the website is still there — <b>files survive redeployment</b>.</>
                : <>Marker file created {new Date(r.marker.createdAt).toLocaleString('en-GB')} by <b>this</b> version. Now redeploy the website and open this page again.</>
              : <>No marker yet. Create one, redeploy the website, then come back here.</>}
          </Row>
        </ul>
        {r.configured && r.writable && !r.marker ? (
          <form action={createMarker} style={{ marginTop: 16 }}><button className="a-btn is-accent">Create marker file</button></form>
        ) : null}
      </section>
      <section className="a-card">
        <h2>When everything above is OK</h2>
        <p style={{ margin: 0 }}>Set <code>UPLOADS_VERIFIED=true</code> in the hosting environment variables and restart the app. Photo uploads then switch on in the project and testimonial forms.</p>
      </section>
    </>
  );
}
