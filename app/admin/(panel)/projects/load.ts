import 'server-only';
import { db } from '../../../../lib/db.ts';
import type { ProjectFormData } from '../../_ui/ProjectForm';

export async function categoriesForForm() {
  return db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { id: true, name: true } });
}

export async function projectForForm(id: number): Promise<ProjectFormData | null> {
  const p = await db.project.findUnique({
    where: { id },
    include: { images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }, categories: { orderBy: { position: 'asc' } } },
  });
  if (!p) return null;
  return {
    id: p.id, name: p.name, slug: p.slug, client: p.client ?? '', shortDescription: p.shortDescription, description: p.description,
    location: p.location, type: p.type ?? '', designVision: p.designVision ?? '',
    keyDetails: Array.isArray(p.keyDetails) ? (p.keyDetails as unknown[]).map(String).join('\n') : '',
    mainCategoryId: p.categories[0]?.categoryId ?? '', extraCategoryIds: p.categories.slice(1).map((c) => c.categoryId),
    isFeatured: p.isFeatured, homeOrder: p.homeOrder, sortOrder: p.sortOrder, isPublished: p.isPublished,
    images: p.images.map((i) => ({ id: i.id, path: i.path, alt: i.alt ?? '', isCover: i.isCover })),
  };
}

export async function nextSortOrder() {
  const last = await db.project.aggregate({ _max: { sortOrder: true } });
  return (last._max.sortOrder ?? -1) + 1;
}
