// Photo upload endpoint (admin only). Checks the real file contents, size limits and the storage state, then saves
// each photo under a random safe name in UPLOAD_DIR. Nothing is linked to a project/testimonial until the form is saved.
import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { writeFile, rename, rm } from 'node:fs/promises';
import { currentAdmin } from '../../../lib/auth.ts';
import { inspectImage } from '../../../lib/image-info.ts';
import { uploadAvailability, uploadDir, diskPathFor, UPLOAD_URL_PREFIX } from '../../../lib/storage.ts';

export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per photo
const MAX_FILES = 25;
const MAX_TOTAL_BYTES = 80 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

const json = (status: number, body: unknown) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: NextRequest) {
  if (!(await currentAdmin())) return json(401, { error: 'Please sign in again.' });
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== req.headers.get('host')) return json(403, { error: 'Upload refused.' });

  const avail = await uploadAvailability();
  if (!avail.allowed) return json(409, { error: `${avail.headline} ${avail.detail}` });

  let form: FormData;
  try { form = await req.formData(); } catch { return json(400, { error: 'The upload could not be read.' }); }
  const files = form.getAll('files').filter((f): f is File => typeof f !== 'string');
  if (!files.length) return json(400, { error: 'No photos were selected.' });
  if (files.length > MAX_FILES) return json(413, { error: `Please upload at most ${MAX_FILES} photos at a time.` });
  if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) return json(413, { error: 'These photos are too large to upload at once. Please upload fewer at a time.' });

  const dir = uploadDir();
  const saved: { path: string; width: number; height: number; name: string }[] = [];
  const errors: { name: string; error: string }[] = [];
  for (const f of files) {
    const label = f.name || 'photo';
    if (f.size === 0) { errors.push({ name: label, error: 'The file is empty.' }); continue; }
    if (f.size > MAX_FILE_BYTES) { errors.push({ name: label, error: 'Larger than 10 MB. Please make it smaller.' }); continue; }
    if (!ALLOWED_TYPES.has(f.type) || !ALLOWED_EXT.test(f.name)) { errors.push({ name: label, error: 'Only JPG, PNG and WebP photos are allowed.' }); continue; }
    const buf = Buffer.from(await f.arrayBuffer());
    const info = inspectImage(buf);
    if (!info) { errors.push({ name: label, error: 'This is not a valid JPG, PNG or WebP image.' }); continue; }
    if ((info.mime !== f.type) && !(info.mime === 'image/jpeg' && f.type === 'image/jpeg')) { errors.push({ name: label, error: 'The file type does not match its contents.' }); continue; }
    const name = `${randomBytes(16).toString('hex')}.${info.ext}`;
    const finalPath = diskPathFor(dir, name);
    const tmp = `${finalPath}.part`;
    try {
      await writeFile(tmp, buf, { flag: 'wx' });
      await rename(tmp, finalPath);
    } catch {
      await rm(tmp, { force: true }).catch(() => {});
      errors.push({ name: label, error: 'The photo could not be saved on the server.' });
      continue;
    }
    saved.push({ path: `${UPLOAD_URL_PREFIX}${name}`, width: info.width, height: info.height, name: label });
  }
  return json(200, { files: saved, errors });
}
