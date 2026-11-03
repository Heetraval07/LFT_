// Exports the website CONTENT (categories, projects with their photo list, testimonials) to a JSON file.
// Admin accounts, sessions and login history are NEVER exported. Read-only: nothing in the database changes.
//
//   npm run content:export -- [--out content-export.json]
//
// Uploaded photos live as files in UPLOAD_DIR; this file lists which ones the content needs (see "uploads").
// Copy that folder separately (see DEPLOYMENT.md, "Moving content to another server").
import 'dotenv/config';
import { writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { db } from '../lib/db.ts';

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };
const out = arg('out') || 'content-export.json';

const categories = await db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
const projects = await db.project.findMany({
  orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  include: { images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }, categories: { orderBy: { position: 'asc' }, include: { category: true } } },
});
const testimonials = await db.testimonial.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });

const data = {
  format: 'lft-content-export',
  version: 1,
  exportedAt: new Date().toISOString(),
  sourceEnv: process.env.APP_ENV || 'unlabelled',
  categories: categories.map((c) => ({ name: c.name, slug: c.slug, sortOrder: c.sortOrder })),
  projects: projects.map((p) => ({
    name: p.name, slug: p.slug, client: p.client, shortDescription: p.shortDescription, description: p.description,
    location: p.location, type: p.type, designVision: p.designVision, keyDetails: p.keyDetails,
    isFeatured: p.isFeatured, homeOrder: p.homeOrder, isPublished: p.isPublished, sortOrder: p.sortOrder,
    categories: p.categories.map((c) => c.category.name),
    images: p.images.map((i) => ({ path: i.path, alt: i.alt, width: i.width, height: i.height, sortOrder: i.sortOrder, isCover: i.isCover })),
  })),
  testimonials: testimonials.map((t) => ({
    clientName: t.clientName, designation: t.designation, company: t.company, text: t.text, photoPath: t.photoPath,
    logoPath: t.logoPath, rating: t.rating, isFeatured: t.isFeatured, isPublished: t.isPublished, sortOrder: t.sortOrder,
  })),
  uploads: [] as string[],
};
const used = new Set<string>();
for (const p of data.projects) for (const i of p.images) used.add(i.path);
for (const t of data.testimonials) for (const x of [t.photoPath, t.logoPath]) if (x) used.add(x);
data.uploads = [...used].filter((p) => p.startsWith('/uploads/')).sort();

writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
const bundled = used.size - data.uploads.length;
console.log(`Exported ${data.categories.length} categories, ${data.projects.length} projects, ${data.testimonials.length} testimonials → ${path.resolve(out)}`);
console.log(`Photos: ${bundled} bundled with the code (travel via GitHub), ${data.uploads.length} uploaded files (must be copied from UPLOAD_DIR).`);

const dir = process.env.UPLOAD_DIR;
if (data.uploads.length) {
  const missing = dir ? data.uploads.filter((u) => !existsSync(path.join(/*turbopackIgnore: true*/ dir, path.basename(u)))) : data.uploads;
  console.log(missing.length ? `WARNING: ${missing.length} uploaded file(s) are not in UPLOAD_DIR${dir ? '' : ' (UPLOAD_DIR is not set)'}.` : 'All uploaded files were found in UPLOAD_DIR.');
}
await db.$disconnect();
