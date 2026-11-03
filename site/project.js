// Shared project detail template: /project.html?p=<slug>. Every project uses this one layout with its own data.
import { projects, brand, img } from './data.js';
import { detailsFor } from './project-details.js';
import { initLightbox, initReveal } from './main.js';

const CHECK = '<svg class="pd-check" viewBox="0 0 22 14" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M1 7.5l4 4L13 2.5M9 11.5l1 0L20 1.5"/></svg>';
const ARROW_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 12H4M10 6l-6 6 6 6"/></svg>';
const ARROW_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg>';
const GRID = '<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="1.5" y="1.5" width="7.5" height="7.5"/><rect x="13" y="1.5" width="7.5" height="7.5"/><rect x="1.5" y="13" width="7.5" height="7.5"/><rect x="13" y="13" width="7.5" height="7.5"/></svg>';

const lines = () => `<div class="page-lines" aria-hidden="true">${'<span></span>'.repeat(7)}</div>`;

// Natural size of each photo, so the slider only uses landscape shots (portraits would be cropped to a sliver).
const measure = (src) => new Promise((resolve) => {
  const im = new Image();
  im.onload = () => resolve({ src, landscape: im.naturalWidth >= im.naturalHeight });
  im.onerror = () => resolve({ src, landscape: false });
  im.src = src;
});

// Three other projects, preferring different brands first so the suggestions are varied.
function relatedTo(p) {
  const others = projects.filter((x) => x.slug !== p.slug);
  const start = projects.indexOf(p);
  others.sort((a, b) => ((projects.indexOf(a) - start + projects.length) % projects.length) - ((projects.indexOf(b) - start + projects.length) % projects.length));
  const picked = [];
  for (const x of others) if (picked.length < 3 && x.client !== p.client && !picked.some((y) => y.client === x.client)) picked.push(x);
  for (const x of others) if (picked.length < 3 && !picked.includes(x)) picked.push(x);
  return picked;
}

export async function renderProjectDetail() {
  const root = document.getElementById('project');
  const slug = new URLSearchParams(location.search).get('p');
  const idx = projects.findIndex((x) => x.slug === slug);

  if (idx === -1) {
    document.title = `Project not found — ${brand.name}`;
    root.innerHTML = `${lines()}
      <section class="pd-banner pd-banner-empty"><div class="pd-wrap pd-banner-inner">
        <h1>Project not found</h1>
        <nav class="pd-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><a href="/projects.html">Our Projects</a></nav>
      </div></section>
      <section class="pd-main"><div class="pd-wrap pd-empty">
        <p>We couldn’t find that project. It may have been renamed or removed.</p>
        <a class="pd-btn" href="/projects.html">View all projects</a>
      </div></section>`;
    return;
  }

  const p = projects[idx];
  const d = detailsFor(p);
  const prev = projects[(idx - 1 + projects.length) % projects.length];
  const next = projects[(idx + 1) % projects.length];
  const photos = [p.cover, ...p.gallery].map(img);
  document.title = `${p.title} — ${brand.name}`;

  // Slider: landscape photos (all of them if fewer than two are landscape).
  const sizes = await Promise.all(photos.map(measure));
  let slides = sizes.filter((s) => s.landscape).map((s) => s.src);
  if (slides.length < 2) slides = photos;
  slides = slides.slice(0, 8);

  root.innerHTML = `
    ${lines()}
    <section class="pd-banner" aria-label="Page banner">
      <div class="pd-banner-bg" style="background-image:url(${img(p.cover)})"></div>
      <div class="pd-wrap pd-banner-inner">
        <h1>${p.title}</h1>
        <nav class="pd-crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a><span aria-hidden="true">›</span>
          <a href="/projects.html">Our Projects</a><span aria-hidden="true">›</span>
          <span aria-current="page">${p.title}</span>
        </nav>
      </div>
    </section>

    <section class="pd-main">
      <div class="pd-wrap">
        <div class="pd-slider" id="pd-slider" aria-roledescription="carousel" aria-label="${p.title} photos" data-reveal>
          ${slides.map((src, i) => `
            <figure class="pd-slide ${i === 0 ? 'is-active' : ''}" aria-hidden="${i !== 0}" aria-label="Photo ${i + 1} of ${slides.length}">
              <img src="${src}" alt="${p.title} — photo ${i + 1}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
            </figure>`).join('')}
          ${slides.length > 1 ? `
            <button type="button" class="pd-arrow pd-prev" aria-label="Previous photo">${ARROW_L}</button>
            <button type="button" class="pd-arrow pd-next" aria-label="Next photo">${ARROW_R}</button>
            <p class="pd-count" aria-live="polite"><b>1</b> / ${slides.length}</p>` : ''}
        </div>

        <div class="pd-info">
          <aside class="pd-facts" data-reveal>
            <h2 class="pd-label">Project Information</h2>
            <dl>
              <div><dt>Project Name:</dt><dd>${p.title}</dd></div>
              ${p.client ? `<div><dt>Client:</dt><dd>${p.client}</dd></div>` : ''}
              <div><dt>Concept:</dt><dd>${d.concept}</dd></div>
              <div><dt>Location:</dt><dd>${p.location}</dd></div>
            </dl>
          </aside>
          <div class="pd-copy" data-reveal style="--d:120ms">
            <h2 class="pd-title">${p.title}</h2>
            <p>${p.intro}</p>
            ${(p.body || []).map((t) => `<p>${t}</p>`).join('')}
            ${d.vision || d.elements.length ? `
              <h3 class="pd-sub">Design Vision</h3>
              ${d.elements.length ? '<p class="pd-kicker">Key Elements of the Design Concept:</p>' : ''}
              ${d.vision ? `<p>${d.vision}</p>` : ''}
              ${d.elements.length ? `<ul class="pd-list">${d.elements.map((e) => `<li>${CHECK}<span>${e}</span></li>`).join('')}</ul>` : ''}
              <p>${d.closing}</p>` : ''}
          </div>
        </div>

        <div class="pd-gallery" data-count="${photos.length}">
          ${photos.map((src, i) => `
            <a href="${src}" class="pd-shot gallery-item" data-full="${src}" data-caption="${p.title} — photo ${i + 1} of ${photos.length}" data-reveal style="--d:${(i % 3) * 70}ms">
              <img src="${src}" alt="${p.title} — photo ${i + 1}" loading="lazy">
            </a>`).join('')}
        </div>

        <nav class="pd-pager" aria-label="More projects">
          <a href="/project.html?p=${prev.slug}" class="pd-circle" aria-label="Previous project: ${prev.title}" title="${prev.title}">${ARROW_L}</a>
          <a href="/projects.html" class="pd-grid-link" aria-label="All projects" title="All projects">${GRID}</a>
          <a href="/project.html?p=${next.slug}" class="pd-circle" aria-label="Next project: ${next.title}" title="${next.title}">${ARROW_R}</a>
        </nav>

        <section class="pd-related" aria-labelledby="pd-related-title">
          <h2 class="pd-label" id="pd-related-title">Project Concept</h2>
          <div class="pd-related-grid">
            ${relatedTo(p).map((r, i) => `
              <a class="pd-card" href="/project.html?p=${r.slug}" data-reveal style="--d:${i * 90}ms">
                <span class="pd-card-media"><img src="${img(r.cover)}" alt="${r.title}" loading="lazy"></span>
                <span class="pd-card-title">${r.title}</span>
              </a>`).join('')}
          </div>
        </section>
      </div>
    </section>`;

  initSlider(root.querySelector('#pd-slider'));
  initLightbox('.pd-shot');
  initReveal(root);
}

function initSlider(el) {
  const slides = [...el.querySelectorAll('.pd-slide')];
  if (slides.length < 2) return;
  const count = el.querySelector('.pd-count b');
  let i = 0;
  const go = (n) => {
    slides[i].classList.remove('is-active');
    slides[i].setAttribute('aria-hidden', 'true');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('is-active');
    slides[i].setAttribute('aria-hidden', 'false');
    count.textContent = i + 1;
    const nxt = slides[(i + 1) % slides.length].querySelector('img');
    if (nxt.loading === 'lazy') nxt.loading = 'eager'; // warm the following photo
  };
  el.querySelector('.pd-prev').addEventListener('click', () => go(i - 1));
  el.querySelector('.pd-next').addEventListener('click', () => go(i + 1));
  el.tabIndex = 0;
  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(i - 1);
    if (e.key === 'ArrowRight') go(i + 1);
  });
  let x0 = null;
  el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
    x0 = null;
  });
}
