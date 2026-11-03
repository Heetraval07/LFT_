// Self-check for the photo folder (UPLOAD_DIR). Pure Node: used by the website, by `npm run storage:check` and `check:env`.
//
// How persistence is proven WITHOUT anyone doing anything:
//   • Hostinger puts every deployment of the website in a new folder and overwrites the old one.
//   • So the first time a deployment starts, it writes a marker file into UPLOAD_DIR listing its own deployment id.
//   • When a LATER deployment starts and finds that marker (and the earlier id) still there, the folder has provably
//     survived a redeploy → state "confirmed".
//   • If photos that the database refers to are missing from the folder, the state becomes "lost" (a loud warning).
//
//   off          not usable (not set / not an absolute path / inside the app folder / not writable)
//   provisional  usable and outside the app folder, but not yet proven to survive a redeploy
//   confirmed    proven: survived at least one redeploy
//   lost         files that the database needs are missing
import { mkdir, access, readFile, writeFile, rename, rm, readdir, constants } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

export const UPLOAD_NAME = /^[a-f0-9]{32}\.(jpg|png|webp)$/;
export const MARKER = '.lft-storage-marker.json';
export const UPLOAD_URL_PREFIX = '/uploads/';

export type StorageState = 'off' | 'provisional' | 'confirmed' | 'lost';
export type StorageStatus = { state: StorageState; reason: string; dir: string; deployments: number; missing: number };

// Identifies THIS deployment of the website. A new deployment = a new build id and/or folder.
export function deployId(): string {
  if (process.env.LFT_DEPLOY_ID) return process.env.LFT_DEPLOY_ID; // used by tests
  let build = 'dev';
  try { build = readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim() || 'dev'; } catch { /* not a production build */ }
  return `${process.cwd()}|${build}`;
}

export const diskPathFor = (dir: string, name: string) => path.join(/*turbopackIgnore: true*/ dir, name);

type Marker = { storageId: string; createdAt: string; deployments: { id: string; at: string }[] };

function unsafeLocation(dir: string): string | null {
  const resolved = path.resolve(/*turbopackIgnore: true*/ dir);
  const app = path.resolve(/*turbopackIgnore: true*/ process.cwd());
  if (resolved === app || resolved.startsWith(app + path.sep)) return 'it is inside the website folder, which is replaced on every update';
  if (/[\\/](hbuilds|public_html)([\\/]|$)/.test(resolved) || /[\\/]\.next([\\/]|$)/.test(resolved)) return 'it is inside a folder that Hostinger overwrites on every deployment';
  return null;
}

// `referenced` returns the /uploads/... paths the database needs (to detect missing files). Optional.
export async function inspectStorage(referenced?: () => Promise<string[]>): Promise<StorageStatus> {
  const dir = (process.env.UPLOAD_DIR || '').trim();
  const off = (reason: string): StorageStatus => ({ state: 'off', reason, dir, deployments: 0, missing: 0 });
  if (!dir) return off('UPLOAD_DIR is not set');
  if (!path.isAbsolute(dir)) return off('UPLOAD_DIR must be a full (absolute) path');
  const bad = unsafeLocation(dir);
  if (bad) return off(`UPLOAD_DIR is unsafe: ${bad}`);

  try {
    await mkdir(/*turbopackIgnore: true*/ dir, { recursive: true });
    await access(/*turbopackIgnore: true*/ dir, constants.W_OK);
    const probe = diskPathFor(dir, `.probe-${process.pid}-${randomBytes(4).toString('hex')}`);
    await writeFile(probe, 'ok');
    await rm(probe, { force: true });
  } catch (e) {
    return off(`the photo folder is not writable (${(e as Error).message.split('\n')[0]})`);
  }

  // marker: create it, or add this deployment to it
  const file = diskPathFor(dir, MARKER);
  let marker: Marker | null = null;
  try { marker = JSON.parse(await readFile(file, 'utf8')) as Marker; } catch { marker = null; }
  const me = deployId();
  if (!marker || !Array.isArray(marker.deployments)) marker = { storageId: randomBytes(8).toString('hex'), createdAt: new Date().toISOString(), deployments: [] };
  if (!marker.deployments.some((d) => d.id === me)) {
    marker.deployments = [...marker.deployments, { id: me, at: new Date().toISOString() }].slice(-20);
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(marker, null, 2));
    await rename(tmp, file);
  }
  const deployments = new Set(marker.deployments.map((d) => d.id)).size;

  // photos the database depends on must still exist
  let missing = 0;
  if (referenced) {
    try {
      const present = new Set((await readdir(/*turbopackIgnore: true*/ dir)).filter((n) => UPLOAD_NAME.test(n)));
      missing = (await referenced()).filter((p) => p.startsWith(UPLOAD_URL_PREFIX) && !present.has(p.slice(UPLOAD_URL_PREFIX.length))).length;
    } catch { /* database not reachable right now: skip this check */ }
  }
  if (missing > 0) return { state: 'lost', reason: `${missing} uploaded photo file(s) used by the website are missing from the photo folder`, dir, deployments, missing };
  if (deployments >= 2) return { state: 'confirmed', reason: 'photos survived a website redeployment', dir, deployments, missing: 0 };
  return { state: 'provisional', reason: 'the folder is outside the website folder and writable, but a redeployment has not yet proven it keeps files', dir, deployments, missing: 0 };
}
