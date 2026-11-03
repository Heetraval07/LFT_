// Server-side validation for everything submitted through the admin. Prisma parameterises every query,
// so values are never concatenated into SQL; these schemas add type/length checks and friendly messages.
import { z } from 'zod';

const text = (max: number, label: string) => z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);
const required = (max: number, label: string) => text(max, label).min(1, `${label} is required.`);
const optional = (max: number, label: string) => text(max, label).transform((v) => (v === '' ? null : v));
const int = (label: string, min = 0, max = 100000) => z.coerce.number({ error: `${label} must be a number.` }).int(`${label} must be a whole number.`).min(min).max(max);

export const slugSchema = z.string().trim().toLowerCase().max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'The URL slug may only contain lowercase letters, numbers and single hyphens.');

export const projectSchema = z.object({
  name: required(160, 'Project name'),
  slug: z.union([z.literal(''), slugSchema]),
  client: optional(120, 'Client'),
  shortDescription: required(600, 'Short description'),
  description: text(20000, 'Full description'),
  location: required(200, 'Location'),
  type: optional(120, 'Project type'),
  designVision: optional(5000, 'Design vision'),
  keyDetails: text(5000, 'Key project details').transform((v) => v.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 30)),
  mainCategoryId: z.union([z.literal(''), z.coerce.number().int().positive()]),
  extraCategoryIds: z.array(z.coerce.number().int().positive()).max(50),
  isFeatured: z.boolean(),
  homeOrder: int('Homepage position', 0, 999),
  sortOrder: int('Display order', 0, 100000),
});

export const testimonialSchema = z.object({
  clientName: required(120, 'Client name'),
  designation: optional(120, 'Designation'),
  company: optional(160, 'Company'),
  text: required(3000, 'Testimonial text'),
  rating: z.union([z.literal(''), z.coerce.number().int().min(1).max(5)]).transform((v) => (v === '' ? null : v)),
  isFeatured: z.boolean(),
  sortOrder: int('Display order', 0, 100000),
});

export const categorySchema = z.object({
  name: required(80, 'Category name'),
  sortOrder: int('Order', 0, 1000),
});

export const firstError = (e: z.ZodError) => e.issues[0]?.message ?? 'Please check the form.';

export const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[—–]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 170) || 'project';
