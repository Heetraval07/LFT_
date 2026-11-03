import { projects, otherProjects, img } from './data.js';
import { projectTabs, projectTags, legacyCategory, perPage as DEFAULT_PER_PAGE, projectsIntro } from './projects-data.js';

const tagsOf = (p) => projectTags[p.slug] || [];
const esc = (s) => String(s).replace(/[<>&"]/g, '');

export function renderProjectsPage() {
  const root = document.getElementById('projects-page');
  const params = new URLSearchParams(location.search);
  const intro = projectsIntro;

  // State comes from the URL so filters/pages are linkable. ?perPage= is a testing aid.
  const perPage = Math.max(1, +params.get('perPage') || DEFAULT_PER_PAGE);
  const q = (params.get('q') || '').trim().toLowerCase();
  let cat = params.get('category') || 'All';
  cat = legacyCategory[cat] || cat;
  if (!projectTabs.includes(cat)) cat = 'All';
  let page = Math.max(1, +params.get('page') || 1);

  root.innerHTML = `
    <div class="page-lines" aria-hidden="true">${'<span></span>'.repeat(7)}</div>
    <section class="pj-banner" aria-label="Page banner">
      <div class="pj-banner-bg" style="background-image:url(${intro.banner.image})"></div>
      <div class="pj-wrap pj-banner-inner">
        <h1>${intro.banner.title}</h1>
        <nav class="pj-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><span aria-current="page">Our Projects</span></nav>
      </div>
    </section>

    <section class="pj-gallery">
      <div class="pj-wrap">
        <div class="pj-filters" id="pj-filters" role="toolbar" aria-label="Filter projects"></div>
        <p class="pj-note" id="pj-note" hidden></p>
        <div class="pj-grid" id="pj-grid" aria-live="polite"></div>
        <p class="pj-empty" id="pj-empty" hidden></p>
        <nav class="pj-pager" id="pj-pager" aria-label="Pagination" hidden></nav>

        <div class="pj-about" data-reveal>
          <h2>${intro.heading}</h2>
          ${intro.paragraphs.map((t) => `<p>${t}</p>`).join('')}
          <h3 class="pj-other-title">${intro.otherTitle}</h3>
          <ul class="pj-other">${otherProjects.map((n) => `<li>${n}</li>`).join('')}</ul>
        </div>
      </div>
    </section>`;

  const filtersEl = root.querySelector('#pj-filters');
  const grid = root.querySelector('#pj-grid');
  const empty = root.querySelector('#pj-empty');
  const pager = root.querySelector('#pj-pager');
  const note = root.querySelector('#pj-note');

  const matches = (p) => {
    if (q) return `${p.title} ${p.client || ''} ${p.category} ${p.location} ${tagsOf(p).join(' ')}`.toLowerCase().includes(q);
    return cat === 'All' || tagsOf(p).includes(cat);
  };
  const countFor = (tab) => (tab === 'All' ? projects.length : projects.filter((p) => tagsOf(p).includes(tab)).length);

  // Category tabs are hidden while showing header-search results
  if (q) {
    filtersEl.hidden = true;
  } else {
    filtersEl.innerHTML = projectTabs
      .map((t) => `<button type="button" data-cat="${t}" aria-pressed="${t === cat}" class="${t === cat ? 'is-active' : ''}">${t}</button>`)
      .join('');
  }

  const syncUrl = () => {
    const u = new URLSearchParams();
    if (q) u.set('q', params.get('q'));
    else if (cat !== 'All') u.set('category', cat);
    if (page > 1) u.set('page', page);
    if (params.get('perPage')) u.set('perPage', params.get('perPage'));
    const s = u.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  };

  const draw = (animate) => {
    const list = projects.filter(matches);
    const pages = Math.max(1, Math.ceil(list.length / perPage));
    page = Math.min(page, pages);
    const slice = list.slice((page - 1) * perPage, page * perPage);

    grid.innerHTML = slice
      .map((p, i) => `
        <a class="pj-item ${animate ? 'is-entering' : ''}" href="/project.html?p=${p.slug}" aria-label="${p.title}" style="--i:${i}${animate ? '' : `;--d:${(i % 3) * 90}ms`}"${animate ? '' : ' data-reveal'}>
          <img src="${img(p.cover)}" alt="${p.title}" loading="${i < 6 ? 'eager' : 'lazy'}">
          <span class="pj-title">${p.title}</span>
        </a>`)
      .join('');

    empty.hidden = list.length > 0;
    if (!list.length) {
      empty.innerHTML = q
        ? `No projects match “${esc(q)}”. <a href="/projects.html">View all projects</a>`
        : `No projects in “${cat}” yet. <button type="button" class="pj-link" data-cat="All">View all projects</button>`;
    }
    if (q) {
      note.hidden = false;
      note.innerHTML = `${list.length} result${list.length === 1 ? '' : 's'} for “${esc(q)}” · <a href="/projects.html">Clear search</a>`;
    }

    // Pagination only when needed
    pager.hidden = pages <= 1;
    if (pages > 1) {
      pager.innerHTML = `
        <button type="button" data-go="prev" ${page === 1 ? 'disabled' : ''}>Previous</button>
        ${Array.from({ length: pages }, (_, n) => `<button type="button" data-go="${n + 1}" class="${n + 1 === page ? 'is-active' : ''}" ${n + 1 === page ? 'aria-current="page"' : ''}>${n + 1}</button>`).join('')}
        <button type="button" data-go="next" ${page === pages ? 'disabled' : ''}>Next</button>`;
    }
    filtersEl.querySelectorAll('button').forEach((b) => {
      const on = b.dataset.cat === cat;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    syncUrl();
  };

  root.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-cat]');
    if (tab) {
      cat = tab.dataset.cat;
      page = 1;
      draw(true);
      return;
    }
    const go = e.target.closest('[data-go]');
    if (go && !go.disabled) {
      const list = projects.filter(matches);
      const pages = Math.max(1, Math.ceil(list.length / perPage));
      const v = go.dataset.go;
      page = v === 'prev' ? Math.max(1, page - 1) : v === 'next' ? Math.min(pages, page + 1) : +v;
      draw(true);
      root.querySelector('.pj-filters, .pj-note')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  draw(false);
}
