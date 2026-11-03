// Read-only queries for the public website. Only PUBLISHED content is ever returned here.
import { db } from './db.ts';

export type PublicProject = {
  slug: string; title: string; client: string | null; category: string; categories: string[];
  location: string; cover: string; gallery: string[]; intro: string; body: string[];
  type: string | null; vision: string | null; elements: string[];
};

const paragraphs = (s: string) => s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export async function getPublishedProjects(): Promise<PublicProject[]> {
  const rows = await db.project.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: {
      images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
      categories: { orderBy: { position: 'asc' }, include: { category: true } },
    },
  });
  return rows
    .filter((p) => p.images.length > 0) // a project needs at least one photo to appear publicly
    .map((p) => {
      const cover = p.images.find((i) => i.isCover) ?? p.images[0];
      const cats = p.categories.map((c) => c.category.name);
      return {
        slug: p.slug,
        title: p.name,
        client: p.client,
        category: cats[0] ?? '',
        categories: cats,
        location: p.location,
        cover: cover.path,
        gallery: p.images.filter((i) => i.id !== cover.id).map((i) => i.path),
        intro: p.shortDescription,
        body: paragraphs(p.description),
        type: p.type,
        vision: p.designVision,
        elements: Array.isArray(p.keyDetails) ? (p.keyDetails as unknown[]).map(String).filter(Boolean) : [],
      };
    });
}

export async function getFeaturedSlugs(): Promise<string[]> {
  const rows = await db.project.findMany({
    where: { isPublished: true, isFeatured: true, images: { some: {} } },
    orderBy: [{ homeOrder: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getCategoryNames(): Promise<string[]> {
  const rows = await db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { name: true } });
  return rows.map((r) => r.name);
}

export async function getPublishedTestimonials() {
  const rows = await db.testimonial.findMany({
    where: { isPublished: true },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
  });
  return rows.map((t) => ({
    quote: t.text, name: t.clientName, designation: t.designation, company: t.company,
    photo: t.photoPath, logo: t.logoPath, rating: t.rating,
  }));
}

// Everything a public page might need, in one round-trip-friendly call.
export async function getSiteData(parts: { projects?: boolean; testimonials?: boolean }) {
  const [projects, featured, categories, testimonials] = await Promise.all([
    parts.projects ? getPublishedProjects() : Promise.resolve(undefined),
    parts.projects ? getFeaturedSlugs() : Promise.resolve(undefined),
    parts.projects ? getCategoryNames() : Promise.resolve(undefined),
    parts.testimonials ? getPublishedTestimonials() : Promise.resolve(undefined),
  ]);
  return { projects, featured, categories, testimonials };
}
