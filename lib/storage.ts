// Image storage for the website. Bundled images (/images/...) ship with the code and are never touched here.
// Admin uploads (/uploads/<random>.jpg|png|webp) live as files in UPLOAD_DIR (outside the website folder); the database
// stores only their paths. A file is deleted only once NO database record still points at it.
import 'server-only';
import { unlink, access } from 'node:fs/promises';
import { db } from './db.ts';
import { appEnv } from './env-info.ts';
import { inspectStorage, UPLOAD_NAME, UPLOAD_URL_PREFIX, diskPathFor, type StorageStatus } from './storage-core.ts';

export { UPLOAD_NAME, UPLOAD_URL_PREFIX, diskPathFor };
export const uploadDir = () => (process.env.UPLOAD_DIR || '').trim();

// Every /uploads/... path the database depends on.
export async function referencedUploads(): Promise<string[]> {
  const [a, b, c] = await Promise.all([
    db.projectImage.findMany({ where: { path: { startsWith: UPLOAD_URL_PREFIX } }, select: { path: true } }),
    db.testimonial.findMany({ where: { photoPath: { startsWith: UPLOAD_URL_PREFIX } }, select: { photoPath: true } }),
    db.testimonial.findMany({ where: { logoPath: { startsWith: UPLOAD_URL_PREFIX } }, select: { logoPath: true } }),
  ]);
  return [...a.map((x) => x.path), ...b.map((x) => x.photoPath!), ...c.map((x) => x.logoPath!)];
}

// ---- the policy: when may admins upload? ----
//   confirmed    → yes
//   provisional  → yes on staging/local WITH a visible warning; NO on production until a redeploy has proven it
//   off / lost   → no, with a plain explanation
export type UploadAvailability = { allowed: boolean; state: StorageStatus['state']; headline: string; detail: string };

let cache: { at: number; status: StorageStatus } | null = null;
export async function storageStatus(force = false): Promise<StorageStatus> {
  if (!force && cache && Date.now() - cache.at < 15_000) return cache.status;
  const status = await inspectStorage(referencedUploads);
  cache = { at: Date.now(), status };
  return status;
}

export async function uploadAvailability(force = false): Promise<UploadAvailability> {
  const s = await storageStatus(force);
  const production = appEnv() === 'production';
  switch (s.state) {
    case 'confirmed':
      return { allowed: true, state: s.state, headline: 'Photo storage is confirmed safe.', detail: 'Uploaded photos survive website updates.' };
    case 'provisional':
      return production
        ? { allowed: false, state: s.state, headline: 'Photo uploads are waiting for a safety check.', detail: 'Photos can be uploaded here after the website has been updated (redeployed) once, which proves they are kept. Ask your developer to redeploy; no other action is needed.' }
        : { allowed: true, state: s.state, headline: 'Photo storage is not yet confirmed.', detail: 'Uploads work, but treat them as test photos until the website has been redeployed once. This is then confirmed automatically.' };
    case 'lost':
      return { allowed: false, state: s.state, headline: 'Some uploaded photos are missing.', detail: `${s.missing} photo file(s) used by the website cannot be found on the server, so uploads are paused to avoid more loss. Please contact your developer.` };
    default:
      return { allowed: false, state: s.state, headline: 'Photo uploads are not set up on this server yet.', detail: 'Your developer needs to finish the photo storage setup. Existing photos are not affected.' };
  }
}

// ---- housekeeping ----
export async function isReferenced(p: string) {
  const [imgs, tPhoto, tLogo] = await Promise.all([
    db.projectImage.count({ where: { path: p } }),
    db.testimonial.count({ where: { photoPath: p } }),
    db.testimonial.count({ where: { logoPath: p } }),
  ]);
  return imgs + tPhoto + tLogo > 0;
}

// An upload path is acceptable for saving only if it has our exact shape AND the file really exists in UPLOAD_DIR.
export async function uploadExists(p: string): Promise<boolean> {
  const dir = uploadDir();
  if (!dir || !p.startsWith(UPLOAD_URL_PREFIX)) return false;
  const name = p.slice(UPLOAD_URL_PREFIX.length);
  if (!UPLOAD_NAME.test(name)) return false;
  return access(diskPathFor(dir, name)).then(() => true, () => false);
}

// Call AFTER the database rows were removed/changed.
export async function deleteFilesIfUnreferenced(paths: (string | null | undefined)[]) {
  const dir = uploadDir();
  for (const p of new Set(paths.filter(Boolean) as string[])) {
    if (!p.startsWith(UPLOAD_URL_PREFIX) || !dir) continue; // bundled website images are never touched
    if (await isReferenced(p)) continue;
    const name = p.slice(UPLOAD_URL_PREFIX.length);
    if (!UPLOAD_NAME.test(name)) continue;
    await unlink(diskPathFor(dir, name)).catch(() => {});
  }
}
