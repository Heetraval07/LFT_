import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import TestimonialForm from '../../../_ui/TestimonialForm';
import { db } from '../../../../../lib/db.ts';
import { uploadsEnabled } from '../../../../../lib/storage.ts';

export const metadata: Metadata = { title: 'Edit testimonial' };

export default async function EditTestimonial({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const t = await db.testimonial.findUnique({ where: { id } });
  if (!t) notFound();
  const { saved } = await searchParams;
  return (
    <>
      <div className="a-crumb"><Link href="/admin/testimonials">Testimonials</Link> / {t.clientName}</div>
      <div className="a-head"><h1>Edit Testimonial</h1></div>
      <TestimonialForm
        key={`${t.id}-${saved ?? ''}`}
        uploadsReady={uploadsEnabled()}
        saved={saved && ['published', 'saved as a draft'].includes(saved) ? saved : undefined}
        initial={{
          id: t.id, clientName: t.clientName, designation: t.designation ?? '', company: t.company ?? '', text: t.text,
          rating: t.rating ?? '', isFeatured: t.isFeatured, sortOrder: t.sortOrder, isPublished: t.isPublished, photoPath: t.photoPath, logoPath: t.logoPath,
        }}
      />
    </>
  );
}
