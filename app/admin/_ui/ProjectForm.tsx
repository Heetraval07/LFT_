'use client';
import { useSubmit } from './useSubmit';
import { useActionState, useMemo, useRef, useState } from 'react';
import UploadNote, { type UploadStatus } from './UploadNote';
import { saveProject, type FormState } from '../actions';

export type ProjectFormData = {
  id?: number; name: string; slug: string; client: string; shortDescription: string; description: string; location: string;
  type: string; designVision: string; keyDetails: string; mainCategoryId: number | ''; extraCategoryIds: number[];
  isFeatured: boolean; homeOrder: number; sortOrder: number; isPublished: boolean;
  images: { id: number; path: string; alt: string; isCover: boolean }[];
};

const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[—–]/g, '-')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 170);

// A photo in the manager: an existing one (has id) or one just uploaded and not saved yet (isNew, has width/height).
type Img = { key: string; id?: number; path: string; alt: string; width?: number; height?: number; isNew?: boolean };

export default function ProjectForm({ initial, categories, uploads, saved }: {
  initial: ProjectFormData; categories: { id: number; name: string }[]; uploads: UploadStatus; saved?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProject, undefined);
  const onSubmit = useSubmit(action);
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [images, setImages] = useState<Img[]>(initial.images.map((i) => ({ key: `id:${i.id}`, id: i.id, path: i.path, alt: i.alt })));
  const firstCover = initial.images.find((i) => i.isCover) ?? initial.images[0];
  const [coverKey, setCoverKey] = useState<string | null>(firstCover ? `id:${firstCover.id}` : null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ ok?: string; errors: string[] }>({ errors: [] });
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [mainCat, setMainCat] = useState<number | ''>(initial.mainCategoryId);
  const effectiveSlug = slugTouched ? slug : slugify(name);
  const removed = initial.images.filter((o) => !images.some((i) => i.id === o.id)).length;

  const imagesJson = useMemo(() => JSON.stringify(images.map((i) => (i.id ? { id: i.id, alt: i.alt } : { path: i.path, width: i.width, height: i.height, alt: i.alt }))), [images]);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = images.slice();
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setImages(next);
  };
  const remove = (key: string) => {
    const next = images.filter((i) => i.key !== key);
    setImages(next);
    if (coverKey === key) setCoverKey(next[0]?.key ?? null);
  };

  // Uploads the chosen files to the server right away (so previews are the real stored photos); they are attached to
  // the project when you press Save / Publish.
  const upload = async (files: FileList | File[]) => {
    const list = [...files];
    if (!list.length || !uploads.allowed) return;
    setUploading(true);
    setUploadMsg({ errors: [] });
    try {
      const fd = new FormData();
      list.forEach((f) => fd.append('files', f));
      const res = await fetch('/admin/upload', { method: 'POST', body: fd });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) { setUploadMsg({ errors: [out.error || 'The upload failed. Please try again.'] }); return; }
      const added: Img[] = (out.files as { path: string; width: number; height: number; name: string }[]).map((x) => ({ key: `path:${x.path}`, path: x.path, width: x.width, height: x.height, alt: '', isNew: true }));
      setImages((cur) => [...cur, ...added]);
      setCoverKey((c) => c ?? added[0]?.key ?? null);
      const n = added.length;
      setUploadMsg({
        ok: n ? `${n} photo${n === 1 ? '' : 's'} uploaded. Press Save or Publish to attach ${n === 1 ? 'it' : 'them'} to the project.` : undefined,
        errors: (out.errors as { name: string; error: string }[]).map((e) => `${e.name}: ${e.error}`),
      });
    } catch {
      setUploadMsg({ errors: ['The upload failed. Please check your connection and try again.'] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <form onSubmit={onSubmit} className="a-form" noValidate>
      <input type="hidden" name="id" value={initial.id ?? ''} />
      <input type="hidden" name="images" value={imagesJson} />
      <input type="hidden" name="coverKey" value={coverKey ?? ''} />

      <div>
        {saved ? <div className="a-alert is-ok" role="status">Project {saved}. {saved === 'published' ? 'It is now live on the website.' : ''}</div> : null}
        {state?.error ? <div className="a-alert is-err" role="alert">{state.error}</div> : null}

        <section className="a-card">
          <h2>Project details</h2>
          <div className="a-field">
            <label htmlFor="name">Project name *</label>
            <input id="name" name="name" type="text" required maxLength={160} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="a-field">
            <label htmlFor="slug">Web address (URL slug)</label>
            <div className="a-slug">
              <span>/project.html?p=</span>
              <input id="slug" name="slug" type="text" maxLength={180} value={effectiveSlug}
                onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); }} />
            </div>
            <span className="a-hint">Created automatically from the name. If another project already uses it, a number is added.{initial.id ? ' Changing it breaks old links to this project.' : ''}</span>
          </div>
          <div className="a-grid2">
            <div className="a-field">
              <label htmlFor="client">Client / brand</label>
              <input id="client" name="client" type="text" maxLength={120} defaultValue={initial.client} />
            </div>
            <div className="a-field">
              <label htmlFor="location">Location *</label>
              <input id="location" name="location" type="text" required maxLength={200} defaultValue={initial.location} placeholder="e.g. Dubai Mall, Dubai" />
            </div>
          </div>
          <div className="a-field">
            <label htmlFor="type">Project type</label>
            <input id="type" name="type" type="text" maxLength={120} defaultValue={initial.type} placeholder="e.g. Retail Store, Restaurant, Villa" />
            <span className="a-hint">Shown as &ldquo;Concept&rdquo; on the project page.</span>
          </div>
          <div className="a-field">
            <label htmlFor="shortDescription">Short description *</label>
            <textarea id="shortDescription" name="shortDescription" required maxLength={600} rows={3} defaultValue={initial.shortDescription} />
            <span className="a-hint">One or two sentences. Shown at the top of the project page and used for search engines.</span>
          </div>
          <div className="a-field">
            <label htmlFor="description">Full description</label>
            <textarea id="description" name="description" maxLength={20000} rows={6} defaultValue={initial.description} />
            <span className="a-hint">Leave an empty line between paragraphs.</span>
          </div>
        </section>

        <section className="a-card">
          <h2>Design vision</h2>
          <div className="a-field">
            <label htmlFor="designVision">Design concept / vision</label>
            <textarea id="designVision" name="designVision" maxLength={5000} rows={4} defaultValue={initial.designVision} />
          </div>
          <div className="a-field">
            <label htmlFor="keyDetails">Key project details</label>
            <textarea id="keyDetails" name="keyDetails" maxLength={5000} rows={6} defaultValue={initial.keyDetails} placeholder={'One item per line, e.g.\nFeature ceiling with linear lighting\nBespoke display joinery'} />
            <span className="a-hint">One item per line. Shown as the &ldquo;Key Elements of the Design Concept&rdquo; list.</span>
          </div>
        </section>

        <section className="a-card">
          <h2>Photos <small>{images.length} photo{images.length === 1 ? '' : 's'}{removed > 0 ? ` · ${removed} will be removed when you save` : ''}{images.some((i) => i.isNew) ? ` · ${images.filter((i) => i.isNew).length} new, not saved yet` : ''}</small></h2>
          {images.length ? (
            <div className="a-photos">
              {images.map((img, i) => (
                <div
                  key={img.key}
                  className={`a-photo${img.key === coverKey ? ' is-cover' : ''}${dragIndex === i ? ' is-dragging' : ''}${overIndex === i && dragIndex !== i ? ' is-over' : ''}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
                  onDragLeave={() => setOverIndex((o) => (o === i ? null : o))}
                  onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) move(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                >
                  <img src={img.path} alt={img.alt || `Photo ${i + 1}`} />
                  <span className="a-photo-n">{i + 1}</span>
                  {img.key === coverKey ? <span className="a-cover-tag">Cover</span> : img.isNew ? <span className="a-cover-tag is-new">New</span> : null}
                  <div className="a-photo-bar">
                    <span className="a-row" style={{ gap: 4 }}>
                      <button type="button" className="a-icon-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}>←</button>
                      <button type="button" className="a-icon-btn" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} aria-label={`Move photo ${i + 1} later`}>→</button>
                    </span>
                    <span className="a-row" style={{ gap: 4 }}>
                      <button type="button" className="a-icon-btn" onClick={() => setCoverKey(img.key)} disabled={img.key === coverKey} aria-label={`Use photo ${i + 1} as cover`} title="Use as cover">★</button>
                      <button type="button" className="a-icon-btn" onClick={() => remove(img.key)} aria-label={`Remove photo ${i + 1}`} title="Remove">✕</button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="a-empty" style={{ padding: 20 }}>No photos yet.</p>}
          <p className="a-note">Drag photos (or use the arrows) to change their order. ★ chooses the cover photo used on the Projects page, homepage and banner.</p>
          <div
            className="a-drop"
            onDragOver={(e) => { if (uploads.allowed) e.preventDefault(); }}
            onDrop={(e) => { if (uploads.allowed && e.dataTransfer.files.length) { e.preventDefault(); void upload(e.dataTransfer.files); } }}
          >
            <input ref={fileRef} id="photo-files" type="file" multiple accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="sr-only" disabled={!uploads.allowed || uploading}
              onChange={(e) => e.target.files && void upload(e.target.files)} />
            <label htmlFor="photo-files" className={`a-btn is-ghost${!uploads.allowed || uploading ? ' is-disabled' : ''}`} aria-disabled={!uploads.allowed || uploading}>
              {uploading ? 'Uploading…' : '+ Upload photos'}
            </label>
            <span className="a-hint">JPG, PNG or WebP · up to 10 MB each · pick several at once or drop them here</span>
          </div>
          {uploadMsg.ok ? <div className="a-alert is-ok" style={{ marginTop: 12, marginBottom: 0 }} role="status">{uploadMsg.ok}</div> : null}
          {uploadMsg.errors.length ? <div className="a-alert is-err" style={{ marginTop: 12, marginBottom: 0 }} role="alert">{uploadMsg.errors.map((e) => <div key={e}>{e}</div>)}</div> : null}
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
          {initial.id && initial.isPublished ? <p className="a-note"><a href={`/project.html?p=${initial.slug}`} target="_blank" rel="noopener">View on website ↗</a></p> : null}
        </section>

        <section className="a-card">
          <h2>Categories</h2>
          <div className="a-field">
            <label htmlFor="mainCategoryId">Main category</label>
            <select id="mainCategoryId" name="mainCategoryId" value={mainCat} onChange={(e) => setMainCat(e.target.value ? Number(e.target.value) : '')}>
              <option value="">— None —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="a-field">
            <span className="a-label">Also show under</span>
            <div className="a-checks">
              {categories.filter((c) => c.id !== mainCat).map((c) => (
                <label key={c.id} className="a-check">
                  <input type="checkbox" name="extraCategoryIds" value={c.id} defaultChecked={initial.extraCategoryIds.includes(c.id)} /> {c.name}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="a-card">
          <h2>Homepage &amp; order</h2>
          <label className="a-check" style={{ marginBottom: 14 }}>
            <input type="checkbox" name="isFeatured" defaultChecked={initial.isFeatured} />
            <span>Feature on the homepage<br /><span className="a-hint" style={{ color: 'var(--a-muted)', fontSize: 12.5 }}>Shown in the homepage projects gallery when published.</span></span>
          </label>
          <div className="a-grid2">
            <div className="a-field">
              <label htmlFor="homeOrder">Homepage position</label>
              <input id="homeOrder" name="homeOrder" type="number" min={0} max={999} defaultValue={initial.homeOrder} />
            </div>
            <div className="a-field">
              <label htmlFor="sortOrder">Display order</label>
              <input id="sortOrder" name="sortOrder" type="number" min={0} max={100000} defaultValue={initial.sortOrder} />
            </div>
          </div>
          <span className="a-hint" style={{ fontSize: 12.5, color: 'var(--a-muted)' }}>Lower numbers come first.</span>
        </section>
      </div>
    </form>
  );
}
