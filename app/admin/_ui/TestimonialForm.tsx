'use client';
import { useSubmit } from './useSubmit';
import { useActionState, useState } from 'react';
import UploadNote, { type UploadStatus } from './UploadNote';
import { saveTestimonial, type FormState } from '../actions';

export type TestimonialFormData = {
  id?: number; clientName: string; designation: string; company: string; text: string; rating: number | '';
  isFeatured: boolean; sortOrder: number; isPublished: boolean; photoPath: string | null; logoPath: string | null;
};

export default function TestimonialForm({ initial, uploads, saved }: { initial: TestimonialFormData; uploads: UploadStatus; saved?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTestimonial, undefined);
  const onSubmit = useSubmit(action);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [removeLogo, setRemoveLogo] = useState(false);
  // freshly uploaded (not yet saved) photo / logo paths
  const [newPhoto, setNewPhoto] = useState('');
  const [newLogo, setNewLogo] = useState('');
  const [busy, setBusy] = useState<'photo' | 'logo' | null>(null);
  const [uploadError, setUploadError] = useState('');
  const upload = async (file: File | undefined, kind: 'photo' | 'logo') => {
    if (!file || !uploads.allowed) return;
    setBusy(kind); setUploadError('');
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/admin/upload', { method: 'POST', body: fd });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) { setUploadError(out.error || 'The upload failed. Please try again.'); return; }
      if (out.errors?.length) { setUploadError(`${out.errors[0].name}: ${out.errors[0].error}`); return; }
      (kind === 'photo' ? setNewPhoto : setNewLogo)(out.files[0].path);
      (kind === 'photo' ? setRemovePhoto : setRemoveLogo)(false);
    } catch { setUploadError('The upload failed. Please check your connection and try again.'); } finally { setBusy(null); }
  };
  return (
    <form onSubmit={onSubmit} className="a-form" noValidate>
      <input type="hidden" name="id" value={initial.id ?? ''} />
      <input type="hidden" name="newPhotoPath" value={newPhoto} />
      <input type="hidden" name="newLogoPath" value={newLogo} />
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
            {([['Client photo', initial.photoPath, newPhoto, removePhoto, setRemovePhoto, 'removePhoto', 'photo'], ['Company logo', initial.logoPath, newLogo, removeLogo, setRemoveLogo, 'removeLogo', 'logo']] as const).map(([label, saved, fresh, rm, setRm, field, kind]) => {
              const shown = fresh || (saved && !rm ? saved : '');
              return (
                <div key={field} className="a-field">
                  <span className="a-label">{label}</span>
                  {shown ? <img src={shown} alt="" style={{ maxWidth: 160, maxHeight: 120, borderRadius: 8, border: '1px solid var(--a-line)', objectFit: 'contain' }} /> : <span className="a-hint">None</span>}
                  {fresh ? <span className="a-hint" style={{ color: 'var(--a-ok)' }}>New {kind} uploaded. Press Save or Publish to keep it.</span> : null}
                  <div className="a-row">
                    <input id={`up-${kind}`} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="sr-only" disabled={!uploads.allowed || busy !== null}
                      onChange={(e) => { void upload(e.target.files?.[0], kind); e.target.value = ''; }} />
                    <label htmlFor={`up-${kind}`} className={`a-btn is-sm is-ghost${!uploads.allowed || busy !== null ? ' is-disabled' : ''}`}>{busy === kind ? 'Uploading…' : shown ? 'Replace' : 'Upload'}</label>
                    {saved || fresh ? (
                      <label className="a-check"><input type="checkbox" name={field} checked={rm} onChange={(e) => { setRm(e.target.checked); if (e.target.checked) (kind === 'photo' ? setNewPhoto : setNewLogo)(''); }} /> Remove</label>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          {uploadError ? <div className="a-alert is-err" style={{ marginTop: 12, marginBottom: 0 }} role="alert">{uploadError}</div> : null}
          <UploadNote status={uploads} />
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
