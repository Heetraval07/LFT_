import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '../../../../lib/db.ts';
import { deleteTestimonial, moveTestimonial, setTestimonialFlag } from '../../actions';
import ConfirmButton from '../../_ui/Confirm';

export const metadata: Metadata = { title: 'Testimonials' };

export default async function TestimonialsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const where = sp.status === 'published' ? { isPublished: true } : sp.status === 'draft' ? { isPublished: false } : {};
  const rows = await db.testimonial.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  return (
    <>
      <div className="a-head">
        <div>
          <h1>Testimonials</h1>
          <p>Published testimonials appear in the slider on the About Us page: featured ones first, then in this order.</p>
        </div>
        <Link className="a-btn is-accent" href="/admin/testimonials/new">+ Add New Testimonial</Link>
      </div>
      {sp.deleted ? <div className="a-alert is-ok">Testimonial deleted.</div> : null}
      <div className="a-row" style={{ marginBottom: 14 }}>
        {[['', 'All'], ['published', 'Published'], ['draft', 'Drafts']].map(([v, l]) => (
          <Link key={v} href={v ? `/admin/testimonials?status=${v}` : '/admin/testimonials'} className={`a-btn is-sm ${(sp.status || '') === v ? '' : 'is-ghost'}`}>{l}</Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="a-card a-empty">No testimonials here yet. <Link href="/admin/testimonials/new">Add one</Link>.</div>
      ) : (
        <table className="a-table">
          <thead><tr><th style={{ width: 64 }}>Order</th><th>Client</th><th>Testimonial</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={t.id}>
                <td>
                  <div className="a-row" style={{ gap: 4 }}>
                    <form action={moveTestimonial}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="dir" value="up" /><button className="a-icon-btn" disabled={i === 0 || Boolean(sp.status)} aria-label={`Move ${t.clientName} up`}>↑</button></form>
                    <form action={moveTestimonial}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="dir" value="down" /><button className="a-icon-btn" disabled={i === rows.length - 1 || Boolean(sp.status)} aria-label={`Move ${t.clientName} down`}>↓</button></form>
                  </div>
                </td>
                <td>
                  <Link className="a-title" href={`/admin/testimonials/${t.id}`}>{t.clientName}</Link>
                  <div className="a-sub">{[t.designation, t.company].filter(Boolean).join(', ') || '—'}</div>
                </td>
                <td className="a-sub" style={{ maxWidth: 420 }}>{t.text.length > 140 ? t.text.slice(0, 140) + '…' : t.text}</td>
                <td>
                  <div className="a-row" style={{ gap: 6 }}>
                    <span className={`a-badge ${t.isPublished ? 'is-on' : 'is-draft'}`}>{t.isPublished ? 'Published' : 'Draft'}</span>
                    {t.isFeatured ? <span className="a-badge is-star">★ Featured</span> : null}
                    {t.rating ? <span className="a-badge">{t.rating}/5</span> : null}
                  </div>
                </td>
                <td>
                  <div className="a-actions">
                    <Link className="a-btn is-sm is-ghost" href={`/admin/testimonials/${t.id}`}>Edit</Link>
                    <form action={setTestimonialFlag}>
                      <input type="hidden" name="id" value={t.id} /><input type="hidden" name="flag" value="isPublished" /><input type="hidden" name="value" value={String(!t.isPublished)} />
                      <button className="a-btn is-sm is-ghost">{t.isPublished ? 'Unpublish' : 'Publish'}</button>
                    </form>
                    <form action={setTestimonialFlag}>
                      <input type="hidden" name="id" value={t.id} /><input type="hidden" name="flag" value="isFeatured" /><input type="hidden" name="value" value={String(!t.isFeatured)} />
                      <button className="a-btn is-sm is-ghost">{t.isFeatured ? 'Unfeature' : 'Feature'}</button>
                    </form>
                    <form action={deleteTestimonial}>
                      <input type="hidden" name="id" value={t.id} />
                      <ConfirmButton className="a-btn is-sm is-danger" message={`Delete the testimonial from ${t.clientName}? This cannot be undone.`}>Delete</ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
