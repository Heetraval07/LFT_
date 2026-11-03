'use client';
import { useSubmit } from './useSubmit';
import { useActionState, useMemo, useState } from 'react';
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

export default function ProjectForm({ initial, categories, uploadsReady, saved }: {
  initial: ProjectFormData; categories: { id: number; name: string }[]; uploadsReady: boolean; saved?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProject, undefined);
  const onSubmit = useSubmit(action);
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [images, setImages] = useState(initial.images);
  const [coverId, setCoverId] = useState<number | null>(initial.images.find((i) => i.isCover)?.id ?? initial.images[0]?.id ?? null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [mainCat, setMainCat] = useState<number | ''>(initial.mainCategoryId);
  const effectiveSlug = slugTouched ? slug : slugify(name);
  const removed = initial.images.length - images.length;

  const imagesJson = useMemo(() => JSON.stringify(images.map((i) => ({ id: i.id, alt: i.alt }))), [images]);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = images.slice();
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setImages(next);
  };
  const remove = (id: number) => {
    const next = images.filter((i) => i.id !== id);
    setImages(next);
    if (coverId === id) setCoverId(next[0]?.id ?? null);
  };

  return (
    <form onSubmit={onSubmit} className="a-form" noValidate>
      <input type="hidden" name="id" value={initial.id ?? ''} />
      <input type="hidden" name="images" value={imagesJson} />
      <input type="hidden" name="coverImageId" value={coverId ?? ''} />

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
          <h2>Photos <small>{images.length} photo{images.length === 1 ? '' : 's'}{removed > 0 ? ` · ${removed} will be removed when you save` : ''}</small></h2>
          {images.length ? (
            <div className="a-photos">
              {images.map((img, i) => (
                <div
                  key={img.id}
                  className={`a-photo${img.id === coverId ? ' is-cover' : ''}${dragIndex === i ? ' is-dragging' : ''}${overIndex === i && dragIndex !== i ? ' is-over' : ''}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
                  onDragLeave={() => setOverIndex((o) => (o === i ? null : o))}
                  onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) move(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                >
                  <img src={img.path} alt={img.alt || `Photo ${i + 1}`} />
                  <span className="a-photo-n">{i + 1}</span>
                  {img.id === coverId ? <span className="a-cover-tag">Cover</span> : null}
                  <div className="a-photo-bar">
                    <span className="a-row" style={{ gap: 4 }}>
                      <button type="button" className="a-icon-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}>←</button>
                      <button type="button" className="a-icon-btn" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} aria-label={`Move photo ${i + 1} later`}>→</button>
                    </span>
                    <span className="a-row" style={{ gap: 4 }}>
                      <button type="button" className="a-icon-btn" onClick={() => setCoverId(img.id)} disabled={img.id === coverId} aria-label={`Use photo ${i + 1} as cover`} title="Use as cover">★</button>
                      <button type="button" className="a-icon-btn" onClick={() => remove(img.id)} aria-label={`Remove photo ${i + 1}`} title="Remove">✕</button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="a-empty" style={{ padding: 20 }}>No photos yet.</p>}
          <p className="a-note">Drag photos (or use the arrows) to change their order. ★ chooses the cover photo used on the Projects page, homepage and banner.</p>
          {uploadsReady ? null : (
            <div className="a-alert is-info" style={{ marginTop: 14, marginBottom: 0 }}>
              <b>Uploading new photos is switched off for now.</b> It will be enabled once permanent photo storage on the
              Hostinger server has been confirmed, so photos are never lost when the website is updated.
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
