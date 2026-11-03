// Image file housekeeping. Bundled images (/images/...) ship with the website code and are never deleted here.
// Admin-uploaded images (/uploads/...) live in UPLOAD_DIR; a file is only removed once NO database record
// (project photo, testimonial photo or logo) still points at it.
import 'server-only';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { db } from './db.ts';

export const uploadDir = () => process.env.UPLOAD_DIR?.trim() || '';
export const uploadsEnabled = () => Boolean(uploadDir()) && process.env.UPLOADS_VERIFIED === 'true';

export async function isReferenced(p: string) {
  const [imgs, tPhoto, tLogo] = await Promise.all([
    db.projectImage.count({ where: { path: p } }),
    db.testimonial.count({ where: { photoPath: p } }),
    db.testimonial.count({ where: { logoPath: p } }),
  ]);
  return imgs + tPhoto + tLogo > 0;
}

// Call AFTER the database rows were removed/changed.
export async function deleteFilesIfUnreferenced(paths: (string | null | undefined)[]) {
  const dir = uploadDir();
  for (const p of new Set(paths.filter(Boolean) as string[])) {
    if (!p.startsWith('/uploads/') || !dir) continue; // bundled website images are never touched
    if (await isReferenced(p)) continue;
    const name = path.basename(p);
    if (!/^[a-z0-9-]+\.(jpg|jpeg|png|webp)$/i.test(name)) continue;
    await unlink(path.join(/*turbopackIgnore: true*/ dir, name)).catch(() => {});
  }
}
