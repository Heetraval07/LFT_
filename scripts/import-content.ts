// Imports a content-export.json (made by `npm run content:export`) into the database named by DATABASE_URL.
//
//   npm run content:import -- --file content-export.json            (preview only: changes nothing)
//   npm run content:import -- --file content-export.json --yes      (really import)
//   add --update to also overwrite projects/testimonials that already exist (matched by slug / name+text)
//
// SAFE BY DEFAULT: existing records are skipped, nothing is ever deleted, admin accounts are untouched, and it always
// prints the target database name first. Preview, check the name, then re-run with --yes.
import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { db } from '../lib/db.ts';

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };
const flag = (n: string) => process.argv.includes(`--${n}`);
const file = arg('file');
if (!file) { console.error('Usage: npm run content:import -- --file content-export.json [--yes] [--update]'); process.exit(1); }
const commit = flag('yes');
const update = flag('update');

type Img = { path: string; alt: string | null; width: number | null; height: number | null; sortOrder: number; isCover: boolean };
type Proj = { name: string; slug: string; client: string | null; shortDescription: string; description: string; location: string; type: string | null; designVision: string | null; keyDetails: unknown; isFeatured: boolean; homeOrder: number; isPublished: boolean; sortOrder: number; categories: string[]; images: Img[] };
type Test = { clientName: string; designation: string | null; company: string | null; text: string; photoPath: string | null; logoPath: string | null; rating: number | null; isFeatured: boolean; isPublished: boolean; sortOrder: number };
const data = JSON.parse(readFileSync(file, 'utf8')) as { format: string; version: number; exportedAt: string; sourceEnv: string; categories: { name: string; slug: string; sortOrder: number }[]; projects: Proj[]; testimonials: Test[]; uploads: string[] };
if (data.format !== 'lft-content-export' || data.version !== 1) { console.error('This is not a supported LFT content export file.'); process.exit(1); }

const url = process.env.DATABASE_URL || '';
const dbName = (url.match(/^mysql:\/\/[^/]+\/([^?]+)/i) || [])[1] || 'unknown';
console.log(`Target database : ${decodeURIComponent(dbName)}   (APP_ENV=${process.env.APP_ENV || 'unlabelled'})`);
console.log(`File            : ${file}  (exported ${data.exportedAt} from "${data.sourceEnv}")`);
console.log(`Mode            : ${commit ? 'IMPORT' : 'PREVIEW (nothing will change)'}${update ? ' + update existing' : ' (existing records are skipped)'}`);

// uploaded files must already be copied into UPLOAD_DIR on the target server
const dir = process.env.UPLOAD_DIR;
const missingFiles = data.uploads.filter((u) => !dir || !existsSync(path.join(/*turbopackIgnore: true*/ dir, path.basename(u))));
if (data.uploads.length) console.log(missingFiles.length ? `WARNING: ${missingFiles.length} of ${data.uploads.length} uploaded photos are not in UPLOAD_DIR${dir ? '' : ' (UPLOAD_DIR is not set)'}. Copy the uploads folder first, or those photos will show as broken.` : `Uploaded photos: all ${data.uploads.length} found in UPLOAD_DIR.`);

const plan = { catNew: 0, projNew: 0, projUpd: 0, projSkip: 0, testNew: 0, testUpd: 0, testSkip: 0 };
const existingCats = new Set((await db.category.findMany({ select: { name: true } })).map((c) => c.name));
plan.catNew = data.categories.filter((c) => !existingCats.has(c.name)).length;
const existingSlugs = new Set((await db.project.findMany({ select: { slug: true } })).map((p) => p.slug));
for (const p of data.projects) existingSlugs.has(p.slug) ? (update ? plan.projUpd++ : plan.projSkip++) : plan.projNew++;
const existingTests = await db.testimonial.findMany({ select: { id: true, clientName: true, text: true } });
const findTest = (t: Test) => existingTests.find((e) => e.clientName === t.clientName && e.text === t.text);
for (const t of data.testimonials) findTest(t) ? (update ? plan.testUpd++ : plan.testSkip++) : plan.testNew++;
console.log(`Plan            : categories +${plan.catNew}; projects +${plan.projNew}, update ${plan.projUpd}, skip ${plan.projSkip}; testimonials +${plan.testNew}, update ${plan.testUpd}, skip ${plan.testSkip}`);

if (!commit) { console.log('\nPreview only. Check the target database above, then re-run with --yes to import.'); await db.$disconnect(); process.exit(0); }

let n = 0;
await db.$transaction(async (tx) => {
  for (const c of data.categories) {
    if (!existingCats.has(c.name)) { await tx.category.create({ data: { name: c.name, slug: c.slug, sortOrder: c.sortOrder } }); n++; }
  }
  const cats = new Map((await tx.category.findMany()).map((c) => [c.name, c.id]));
  for (const p of data.projects) {
    const exists = existingSlugs.has(p.slug);
    if (exists && !update) continue;
    const fields = {
      name: p.name, client: p.client, shortDescription: p.shortDescription, description: p.description, location: p.location, type: p.type,
      designVision: p.designVision, keyDetails: (p.keyDetails ?? []) as never, isFeatured: p.isFeatured, homeOrder: p.homeOrder, isPublished: p.isPublished, sortOrder: p.sortOrder,
    };
    const saved = exists ? await tx.project.update({ where: { slug: p.slug }, data: fields }) : await tx.project.create({ data: { slug: p.slug, ...fields } });
    if (exists) { await tx.projectImage.deleteMany({ where: { projectId: saved.id } }); await tx.projectCategory.deleteMany({ where: { projectId: saved.id } }); }
    await tx.projectImage.createMany({ data: p.images.map((i) => ({ projectId: saved.id, path: i.path, alt: i.alt, width: i.width, height: i.height, sortOrder: i.sortOrder, isCover: i.isCover })) });
    const rows = p.categories.filter((c) => cats.has(c)).map((c, k) => ({ projectId: saved.id, categoryId: cats.get(c)!, position: k }));
    if (rows.length) await tx.projectCategory.createMany({ data: rows });
    n++;
  }
  for (const t of data.testimonials) {
    const e = findTest(t);
    const fields = { designation: t.designation, company: t.company, photoPath: t.photoPath, logoPath: t.logoPath, rating: t.rating, isFeatured: t.isFeatured, isPublished: t.isPublished, sortOrder: t.sortOrder };
    if (e && update) { await tx.testimonial.update({ where: { id: e.id }, data: fields }); n++; }
    else if (!e) { await tx.testimonial.create({ data: { clientName: t.clientName, text: t.text, ...fields } }); n++; }
  }
}, { timeout: 120_000 });
console.log(`\nImport complete (${n} record(s) created/updated). Nothing was deleted.`);
await db.$disconnect();
