// Loads the original website content (prisma/seed-data.json) into the database.
// SAFE TO RE-RUN: only creates records that don't exist yet (matched by category name, project slug,
// testimonial text). It never updates or deletes anything, so admin edits are never overwritten.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { db } from '../lib/db.ts';

type SeedImage = { path: string; sortOrder: number; isCover: boolean; alt: string; width: number | null; height: number | null };
type SeedProject = {
  name: string; slug: string; client: string | null; shortDescription: string; description: string; location: string;
  type: string; designVision: string | null; keyDetails: string[]; isFeatured: boolean; homeOrder: number;
  isPublished: boolean; sortOrder: number; categories: string[]; images: SeedImage[];
};
type SeedTestimonial = { clientName: string; company: string | null; designation: string | null; text: string; isPublished: boolean; isFeatured: boolean; sortOrder: number };

const data = JSON.parse(readFileSync(new URL('./seed-data.json', import.meta.url), 'utf8')) as {
  categories: string[]; projects: SeedProject[]; testimonials: SeedTestimonial[];
};

const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

let made = { categories: 0, projects: 0, images: 0, testimonials: 0 };

for (const [i, name] of data.categories.entries()) {
  const exists = await db.category.findUnique({ where: { name } });
  if (!exists) { await db.category.create({ data: { name, slug: slugify(name), sortOrder: i } }); made.categories++; }
}
const cats = new Map((await db.category.findMany()).map((c) => [c.name, c.id]));

for (const p of data.projects) {
  if (await db.project.findUnique({ where: { slug: p.slug } })) continue;
  await db.project.create({
    data: {
      name: p.name, slug: p.slug, client: p.client, shortDescription: p.shortDescription, description: p.description,
      location: p.location, type: p.type, designVision: p.designVision, keyDetails: p.keyDetails,
      isFeatured: p.isFeatured, homeOrder: p.homeOrder, isPublished: p.isPublished, sortOrder: p.sortOrder,
      images: { create: p.images.map((im) => ({ path: im.path, alt: im.alt, width: im.width, height: im.height, sortOrder: im.sortOrder, isCover: im.isCover })) },
      categories: { create: p.categories.filter((c) => cats.has(c)).map((c, k) => ({ categoryId: cats.get(c)!, position: k })) },
    },
  });
  made.projects++;
  made.images += p.images.length;
}

for (const t of data.testimonials) {
  if (await db.testimonial.findFirst({ where: { text: t.text } })) continue;
  await db.testimonial.create({ data: { clientName: t.clientName, company: t.company, designation: t.designation, text: t.text, isPublished: t.isPublished, isFeatured: t.isFeatured, sortOrder: t.sortOrder } });
  made.testimonials++;
}

console.log(`Seed complete. Created: ${made.categories} categories, ${made.projects} projects (${made.images} photos), ${made.testimonials} testimonials. Existing records were left untouched.`);
await db.$disconnect();
