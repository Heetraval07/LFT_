import type { Metadata } from 'next';
import Link from 'next/link';
import TestimonialForm from '../../../_ui/TestimonialForm';
import { db } from '../../../../../lib/db.ts';
import { uploadAvailability } from '../../../../../lib/storage.ts';

export const metadata: Metadata = { title: 'New testimonial' };

export default async function NewTestimonial() {
  const last = await db.testimonial.aggregate({ _max: { sortOrder: true } });
  return (
    <>
      <div className="a-crumb"><Link href="/admin/testimonials">Testimonials</Link> / New</div>
      <div className="a-head"><h1>Add New Testimonial</h1></div>
      <TestimonialForm
        uploads={await uploadAvailability()}
        initial={{ clientName: '', designation: '', company: '', text: '', rating: '', isFeatured: false, sortOrder: (last._max.sortOrder ?? -1) + 1, isPublished: false, photoPath: null, logoPath: null }}
      />
    </>
  );
}
