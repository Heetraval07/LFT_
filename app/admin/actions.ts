'use server';
// All admin write operations. Every action starts with requireAdmin(), so nothing here can run without a valid
// session. Next.js additionally rejects Server Action calls from other origins (CSRF protection).
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '../../lib/db.ts';
import { login, logout, requireAdmin } from '../../lib/auth.ts';
import { projectSchema, testimonialSchema, categorySchema, firstError, slugify, slugSchema } from '../../lib/validation.ts';
import { deleteFilesIfUnreferenced } from '../../lib/storage.ts';

export type FormState = { error?: string; ok?: string; email?: string } | undefined;

// Browsers send textarea line breaks as CRLF; store plain LF.
const str = (f: FormData, k: string) => String(f.get(k) ?? '').replace(/\r\n?/g, '\n');
const bool = (f: FormData, k: string) => f.get(k) === 'on' || f.get(k) === 'true';

// Public pages read the database on every request; this also clears any cached router data.
function refreshPublicSite() {
  for (const p of ['/', '/projects', '/project', '/about']) revalidatePath(p);
}

// ---------- auth ----------
export async function loginAction(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, 'email');
  const password = str(f, 'password');
  if (!email || !password) return { error: 'Please enter your email and password.', email };
  if (email.length > 191 || password.length > 200) return { error: 'Incorrect email or password.', email: email.slice(0, 191) };
  const r = await login(email, password);
  if (!r.ok) return { error: r.error, email };
  const next = str(f, 'next');
  redirect(next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin');
}

export async function logoutAction() {
  await logout();
  redirect('/admin/login');
}

// ---------- projects ----------
async function uniqueSlug(wanted: string, excludeId?: number) {
  const base = wanted || 'project';
  let slug = base;
  for (let n = 2; ; n++) {
    const hit = await db.project.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === excludeId) return slug;
    slug = `${base}-${n}`.slice(0, 180);
  }
}

type ImageEdit = { id: number; alt?: string };

export async function saveProject(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(str(f, 'id')) || undefined;
  const intent = str(f, 'intent'); // "draft" | "publish" | "save"
  const parsed = projectSchema.safeParse({
    name: str(f, 'name'), slug: str(f, 'slug'), client: str(f, 'client'), shortDescription: str(f, 'shortDescription'),
    description: str(f, 'description'), location: str(f, 'location'), type: str(f, 'type'), designVision: str(f, 'designVision'),
    keyDetails: str(f, 'keyDetails'), mainCategoryId: str(f, 'mainCategoryId'), extraCategoryIds: f.getAll('extraCategoryIds').map(String),
    isFeatured: bool(f, 'isFeatured'), homeOrder: str(f, 'homeOrder') || 0, sortOrder: str(f, 'sortOrder') || 0,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const v = parsed.data;

  // Photo order / cover / removals from the image manager (ids refer to existing ProjectImage rows of THIS project).
  let images: ImageEdit[] = [];
  let coverId = Number(str(f, 'coverImageId')) || null;
  try {
    const raw = JSON.parse(str(f, 'images') || '[]');
    if (!Array.isArray(raw)) throw new Error();
    images = raw.slice(0, 500).map((x) => ({ id: Number(x.id), alt: typeof x.alt === 'string' ? x.alt.trim().slice(0, 300) : undefined })).filter((x) => Number.isInteger(x.id) && x.id > 0);
  } catch {
    return { error: 'The photo list could not be read. Please reload the page and try again.' };
  }

  const current = id ? await db.project.findUnique({ where: { id }, include: { images: true } }) : null;
  if (id && !current) return { error: 'This project no longer exists.' };
  const ownIds = new Set(current?.images.map((i) => i.id) ?? []);
  images = images.filter((i) => ownIds.has(i.id));
  if (coverId && !images.some((i) => i.id === coverId)) coverId = images[0]?.id ?? null;
  if (!coverId) coverId = images[0]?.id ?? null;

  const isPublished = intent === 'publish' ? true : intent === 'draft' ? false : Boolean(current?.isPublished);
  if (isPublished && images.length === 0) return { error: 'Add at least one photo before publishing. You can save it as a draft for now.' };

  const wantedSlug = v.slug || slugify(v.name);
  if (!slugSchema.safeParse(wantedSlug).success) return { error: 'Please enter a valid URL slug.' };
  const slug = await uniqueSlug(wantedSlug, id);

  const catIds = [...new Set([...(v.mainCategoryId ? [v.mainCategoryId] : []), ...v.extraCategoryIds])];
  const validCats = new Set((await db.category.findMany({ where: { id: { in: catIds } }, select: { id: true } })).map((c) => c.id));
  const categoryRows = catIds.filter((c) => validCats.has(c)).map((categoryId, position) => ({ categoryId, position }));

  const data = {
    name: v.name, slug, client: v.client, shortDescription: v.shortDescription, description: v.description, location: v.location,
    type: v.type, designVision: v.designVision, keyDetails: v.keyDetails, isFeatured: v.isFeatured, homeOrder: v.homeOrder,
    sortOrder: v.sortOrder, isPublished,
  };

  const removedPaths = current ? current.images.filter((i) => !images.some((k) => k.id === i.id)).map((i) => i.path) : [];
  const saved = await db.$transaction(async (tx) => {
    const p = id
      ? await tx.project.update({ where: { id }, data })
      : await tx.project.create({ data });
    await tx.projectCategory.deleteMany({ where: { projectId: p.id } });
    if (categoryRows.length) await tx.projectCategory.createMany({ data: categoryRows.map((c) => ({ ...c, projectId: p.id })) });
    if (current) {
      await tx.projectImage.deleteMany({ where: { projectId: p.id, id: { notIn: images.map((i) => i.id) } } });
      for (const [k, img] of images.entries()) {
        await tx.projectImage.update({ where: { id: img.id }, data: { sortOrder: k, isCover: img.id === coverId, ...(img.alt !== undefined ? { alt: img.alt || null } : {}) } });
      }
    }
    return p;
  });
  await deleteFilesIfUnreferenced(removedPaths);
  refreshPublicSite();
  revalidatePath('/admin', 'layout');
  const msg = isPublished ? 'published' : 'saved as a draft';
  redirect(`/admin/projects/${saved.id}?saved=${encodeURIComponent(msg)}`);
}

export async function deleteProject(f: FormData) {
  await requireAdmin();
  const id = Number(str(f, 'id'));
  const p = await db.project.findUnique({ where: { id }, include: { images: true } });
  if (p) {
    await db.project.delete({ where: { id } }); // photos rows + category links are removed by cascade
    await deleteFilesIfUnreferenced(p.images.map((i) => i.path));
  }
  refreshPublicSite();
  redirect('/admin/projects?deleted=1');
}

export async function setProjectFlag(f: FormData) {
  await requireAdmin();
  const id = Number(str(f, 'id'));
  const flag = str(f, 'flag');
  const value = str(f, 'value') === 'true';
  if (!['isPublished', 'isFeatured'].includes(flag)) return;
  if (flag === 'isPublished' && value) {
    const n = await db.projectImage.count({ where: { projectId: id } });
    if (!n) redirect(`/admin/projects?error=${encodeURIComponent('Add at least one photo before publishing.')}`);
  }
  await db.project.update({ where: { id }, data: { [flag]: value } });
  refreshPublicSite();
  revalidatePath('/admin/projects');
}

export async function moveProject(f: FormData) {
  await requireAdmin();
  const id = Number(str(f, 'id'));
  const dir = str(f, 'dir') === 'up' ? -1 : 1;
  const all = await db.project.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { id: true } });
  const i = all.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  await db.$transaction(all.map((p, k) => db.project.update({ where: { id: p.id }, data: { sortOrder: k } })));
  refreshPublicSite();
  revalidatePath('/admin/projects');
}

// ---------- categories ----------
export async function saveCategory(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(str(f, 'id')) || undefined;
  const parsed = categorySchema.safeParse({ name: str(f, 'name'), sortOrder: str(f, 'sortOrder') || 0 });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const clash = await db.category.findFirst({ where: { name: parsed.data.name, ...(id ? { NOT: { id } } : {}) } });
  if (clash) return { error: 'A category with this name already exists.' };
  const data = { ...parsed.data, slug: slugify(parsed.data.name) };
  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });
  refreshPublicSite();
  revalidatePath('/admin/projects/categories');
  return { ok: id ? 'Category updated.' : 'Category added.' };
}

export async function deleteCategory(f: FormData) {
  await requireAdmin();
  await db.category.delete({ where: { id: Number(str(f, 'id')) } }).catch(() => {});
  refreshPublicSite();
  revalidatePath('/admin/projects/categories');
}

// ---------- testimonials ----------
export async function saveTestimonial(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(str(f, 'id')) || undefined;
  const intent = str(f, 'intent');
  const parsed = testimonialSchema.safeParse({
    clientName: str(f, 'clientName'), designation: str(f, 'designation'), company: str(f, 'company'), text: str(f, 'text'),
    rating: str(f, 'rating'), isFeatured: bool(f, 'isFeatured'), sortOrder: str(f, 'sortOrder') || 0,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const current = id ? await db.testimonial.findUnique({ where: { id } }) : null;
  if (id && !current) return { error: 'This testimonial no longer exists.' };
  const isPublished = intent === 'publish' ? true : intent === 'draft' ? false : Boolean(current?.isPublished);
  const removePhoto = bool(f, 'removePhoto');
  const removeLogo = bool(f, 'removeLogo');
  const data = {
    ...parsed.data, isPublished,
    ...(removePhoto ? { photoPath: null } : {}),
    ...(removeLogo ? { logoPath: null } : {}),
  };
  const saved = id ? await db.testimonial.update({ where: { id }, data }) : await db.testimonial.create({ data });
  await deleteFilesIfUnreferenced([removePhoto ? current?.photoPath : null, removeLogo ? current?.logoPath : null]);
  refreshPublicSite();
  revalidatePath('/admin', 'layout');
  redirect(`/admin/testimonials/${saved.id}?saved=${encodeURIComponent(isPublished ? 'published' : 'saved as a draft')}`);
}

export async function deleteTestimonial(f: FormData) {
  await requireAdmin();
  const id = Number(str(f, 'id'));
  const t = await db.testimonial.findUnique({ where: { id } });
  if (t) {
    await db.testimonial.delete({ where: { id } });
    await deleteFilesIfUnreferenced([t.photoPath, t.logoPath]);
  }
  refreshPublicSite();
  redirect('/admin/testimonials?deleted=1');
}

export async function setTestimonialFlag(f: FormData) {
  await requireAdmin();
  const flag = str(f, 'flag');
  if (!['isPublished', 'isFeatured'].includes(flag)) return;
  await db.testimonial.update({ where: { id: Number(str(f, 'id')) }, data: { [flag]: str(f, 'value') === 'true' } });
  refreshPublicSite();
  revalidatePath('/admin/testimonials');
}

export async function moveTestimonial(f: FormData) {
  await requireAdmin();
  const id = Number(str(f, 'id'));
  const dir = str(f, 'dir') === 'up' ? -1 : 1;
  const all = await db.testimonial.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { id: true } });
  const i = all.findIndex((t) => t.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  await db.$transaction(all.map((t, k) => db.testimonial.update({ where: { id: t.id }, data: { sortOrder: k } })));
  refreshPublicSite();
  revalidatePath('/admin/testimonials');
}
