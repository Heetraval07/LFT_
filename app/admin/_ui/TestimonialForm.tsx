'use client';
import { useSubmit } from './useSubmit';
import { useActionState, useState } from 'react';
import { saveTestimonial, type FormState } from '../actions';

export type TestimonialFormData = {
  id?: number; clientName: string; designation: string; company: string; text: string; rating: number | '';
  isFeatured: boolean; sortOrder: number; isPublished: boolean; photoPath: string | null; logoPath: string | null;
};

export default function TestimonialForm({ initial, uploadsReady, saved }: { initial: TestimonialFormData; uploadsReady: boolean; saved?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTestimonial, undefined);
  const onSubmit = useSubmit(action);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [removeLogo, setRemoveLogo] = useState(false);
  return (
    <form onSubmit={onSubmit} className="a-form" noValidate>
      <input type="hidden" name="id" value={initial.id ?? ''} />
      <div>
        {saved ? <div className="a-alert is-ok" role="status">Testimonial {saved}.{saved === 'published' ? ' It now appears on the About Us page.' : ''}</div> : null}
        {state?.error ? <div className="a-alert is-err" role="alert">{state.error}</div> : null}
        <section className="a-card">
          <h2>Testimonial</h2>
          <div className="a-grid2">
            <div className="a-field">
              <label htmlFor="clientName">Client name *</label>
              <input id="clientName" name="clientName" type="text" required maxLength={120} defaultValue={initial.clientName} />
            </div>
            <div className="a-field">
              <label htmlFor="designation">Designation</label>
              <input id="designation" name="designation" type="text" maxLength={120} defaultValue={initial.designation} placeholder="e.g. Operations Manager" />
            </div>
          </div>
          <div className="a-field">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" type="text" maxLength={160} defaultValue={initial.company} />
          </div>
          <div className="a-field">
            <label htmlFor="text">Testimonial text *</label>
            <textarea id="text" name="text" required maxLength={3000} rows={6} defaultValue={initial.text} />
            <span className="a-hint">Use the client&apos;s own words, with their permission.</span>
          </div>
          <div className="a-field" style={{ maxWidth: 220 }}>
            <label htmlFor="rating">Rating (optional)</label>
            <select id="rating" name="rating" defaultValue={initial.rating === '' ? '' : String(initial.rating)}>
              <option value="">No rating</option>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n}/5)</option>)}
            </select>
          </div>
        </section>
        <section className="a-card">
          <h2>Photo &amp; logo <small>optional</small></h2>
          <div className="a-grid2">
            {([['Client photo', initial.photoPath, removePhoto, setRemovePhoto, 'removePhoto'], ['Company logo', initial.logoPath, removeLogo, setRemoveLogo, 'removeLogo']] as const).map(([label, src, rm, setRm, field]) => (
              <div key={field} className="a-field">
                <span className="a-label">{label}</span>
                {src && !rm ? <img src={src} alt="" style={{ maxWidth: 160, maxHeight: 120, borderRadius: 8, border: '1px solid var(--a-line)' }} /> : <span className="a-hint">None</span>}
                {src ? (
                  <label className="a-check"><input type="checkbox" name={field} checked={rm} onChange={(e) => setRm(e.target.checked)} /> Remove</label>
                ) : null}
              </div>
            ))}
          </div>
          {uploadsReady ? null : (
            <div className="a-alert is-info" style={{ marginTop: 14, marginBottom: 0 }}>
              <b>Photo and logo uploads are switched off for now.</b> They will be enabled once permanent photo storage on the
              Hostinger server has been confirmed.
            </div>
          )}
        </section>
      </div>
      <div className="a-sticky">
        <section className="a-card a-publish">
          <h2>Publish</h2>
          <div className="a-status-line">
            <span>Status</span>
            <span className={`a-badge ${initial.isPublished ? 'is-on' : 'is-draft'}`}>{initial.id ? (initial.isPublished ? 'Published' : 'Draft') : 'New'}</span>
          </div>
          <div className="a-row">
            <button className="a-btn is-accent" type="submit" name="intent" value="publish" disabled={pending}>{pending ? 'Saving…' : initial.isPublished ? 'Save & keep published' : 'Publish'}</button>
            <button className="a-btn is-ghost" type="submit" name="intent" value="draft" disabled={pending}>{initial.isPublished ? 'Unpublish & save as draft' : 'Save as draft'}</button>
          </div>
        </section>
        <section className="a-card">
          <h2>Display</h2>
          <label className="a-check" style={{ marginBottom: 14 }}>
            <input type="checkbox" name="isFeatured" defaultChecked={initial.isFeatured} /> Featured (shown first)
          </label>
          <div className="a-field">
            <label htmlFor="sortOrder">Display order</label>
            <input id="sortOrder" name="sortOrder" type="number" min={0} max={100000} defaultValue={initial.sortOrder} />
            <span className="a-hint">Lower numbers come first.</span>
          </div>
        </section>
      </div>
    </form>
  );
}
