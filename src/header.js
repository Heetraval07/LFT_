import { brand, nav } from './data.js';

const SEARCH_SVG = '<svg viewBox="0 0 16 17" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="6.8" cy="7.2" r="5.4"/><path d="M11 11.6l4.2 4.4"/></svg>';

function isActive(href) {
  const path = location.pathname.replace(/\/index\.html$/, '/');
  if (href === '/') return path === '/';
  if (href === '/projects.html' && path === '/project.html') return true;
  return path === href;
}

// Two files: the original (black) for light backgrounds, and a light variant for dark ones.
// CSS picks the right one (see .hdr-logo in styles.css).
const logo = (cls = '') => `
  <a href="/" class="hdr-logo ${cls}" aria-label="${brand.name} home">
    <img class="logo-img logo-img-light" src="/images/logo/lft-logo-light.png" alt="${brand.name}" width="69" height="52">
    <img class="logo-img logo-img-dark" src="/images/logo/lft-logo.png" alt="" width="69" height="52" aria-hidden="true">
  </a>`;

const navList = (cls) =>
  `<ul class="${cls}">${nav.map((l) => `<li><a href="${l.href}" class="${isActive(l.href) ? 'is-active' : ''}">${l.label}</a></li>`).join('')}</ul>`;

const desktopBar = (cls) => `
  <div class="${cls}">
    <div class="hdr-inner">
      ${logo()}
      <nav aria-label="Main">${navList('hdr-nav')}</nav>
      <div class="hdr-tools">
        <button class="hdr-burger" data-open="info" aria-label="Open info panel"><i></i><i></i><i></i></button>
        <button class="hdr-search" data-open="search" aria-label="Search projects">${SEARCH_SVG}</button>
      </div>
    </div>
  </div>`;

export function renderHeader() {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.id = 'site-header';
  header.innerHTML = `
    ${desktopBar('hdr-main')}
    ${desktopBar('hdr-sticky').replace('hdr-sticky"', 'hdr-sticky" aria-hidden="true"')}
    <div class="hdr-mobile">
      ${logo()}
      <button class="hdr-toggle" data-open="nav" aria-label="Open menu" aria-expanded="false" aria-controls="nav-drawer"><i></i><i></i><i></i></button>
    </div>`;
  document.body.prepend(header);

  const searchForm = (cls) => `
    <form class="${cls}" action="/projects.html" role="search">
      <input type="search" name="q" placeholder="Search..." aria-label="Search projects">
      <button type="submit" aria-label="Search">${SEARCH_SVG}</button>
    </form>`;

  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  const navDrawer = document.createElement('aside');
  navDrawer.className = 'drawer drawer-left';
  navDrawer.id = 'nav-drawer';
  navDrawer.setAttribute('aria-label', 'Menu');
  navDrawer.innerHTML = `
    <button class="drawer-close" aria-label="Close menu">✕</button>
    <div class="drawer-logo">${logo()}</div>
    ${searchForm('drawer-search')}
    ${navList('drawer-nav')}`;
  const infoDrawer = document.createElement('aside');
  infoDrawer.className = 'drawer drawer-right';
  infoDrawer.setAttribute('aria-label', 'Studio information');
  infoDrawer.innerHTML = `
    <button class="drawer-close" aria-label="Close panel">✕</button>
    <div class="drawer-info">
      <p class="drawer-title">${brand.name}</p>
      <p>${brand.legalName}</p>
      <h4>Office</h4><p>${brand.address.join('<br>')}</p>
      <h4>Email</h4><p><a href="mailto:${brand.email}">${brand.email}</a></p>
      <h4>Phone</h4><p><a href="tel:${brand.phoneLink}">${brand.phone}</a></p>
      <h4>Follow</h4><p>${brand.social.map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${s.label}</a>`).join(' · ')}</p>
    </div>`;
  const pop = document.createElement('div');
  pop.className = 'search-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Search projects');
  pop.innerHTML = `
    <button class="search-close" aria-label="Close search">✕</button>
    <form action="/projects.html" role="search">
      <input type="search" name="q" placeholder="Search projects…" aria-label="Search projects">
      <button type="submit" aria-label="Search">${SEARCH_SVG}</button>
    </form>`;
  document.body.append(overlay, navDrawer, infoDrawer, pop);

  /* ----- Drawers ----- */
  const toggle = header.querySelector('.hdr-toggle');
  let openDrawer = null;
  const setDrawer = (drawer) => {
    if (openDrawer) openDrawer.classList.remove('is-open');
    openDrawer = drawer;
    if (drawer) drawer.classList.add('is-open');
    document.body.classList.toggle('drawer-open', !!drawer);
    toggle.setAttribute('aria-expanded', String(drawer === navDrawer));
    toggle.setAttribute('aria-label', drawer === navDrawer ? 'Close menu' : 'Open menu');
  };
  const setSearch = (open) => {
    pop.classList.toggle('is-open', open);
    document.body.classList.toggle('no-scroll', open);
    if (open) setTimeout(() => pop.querySelector('input').focus(), 50);
  };
  toggle.addEventListener('click', () => setDrawer(openDrawer === navDrawer ? null : navDrawer));
  header.querySelectorAll('.hdr-burger').forEach((b) => b.addEventListener('click', () => setDrawer(infoDrawer)));
  header.querySelectorAll('.hdr-search').forEach((b) => b.addEventListener('click', () => setSearch(true)));
  overlay.addEventListener('click', () => setDrawer(null));
  [navDrawer, infoDrawer].forEach((d) => d.querySelector('.drawer-close').addEventListener('click', () => setDrawer(null)));
  navDrawer.addEventListener('click', (e) => { if (e.target.closest('.drawer-nav a')) setDrawer(null); });
  pop.querySelector('.search-close').addEventListener('click', () => setSearch(false));
  pop.addEventListener('click', (e) => { if (e.target === pop) setSearch(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setDrawer(null); setSearch(false); } });
  matchMedia('(min-width: 1200px)').addEventListener('change', (e) => { if (e.matches && openDrawer === navDrawer) setDrawer(null); });

  /* ----- Sticky bar: flips in when scrolling UP past the header's height, hides on scroll down ----- */
  const sticky = header.querySelector('.hdr-sticky');
  const THRESHOLD = 147;
  let last = scrollY;
  const onScroll = () => {
    const y = scrollY;
    if (y !== last) sticky.classList.toggle('is-shown', y > THRESHOLD && y < last);
    sticky.setAttribute('aria-hidden', String(!sticky.classList.contains('is-shown')));
    last = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
}
