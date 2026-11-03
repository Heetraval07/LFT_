import {
  img, heroSlides, HERO_INTERVAL_MS, projects,
  recentProjectSlugs, partners,
} from './data.js';
import { renderAbout } from './about.js';
import { renderServicesPage } from './services.js';
import { renderProjectsPage } from './projects.js';
import { renderContact } from './contact.js';
import { renderProjectDetail } from './project.js';

const $ = (s, r = document) => r.querySelector(s);

/* ---------- Home ---------- */
function home() {
  // Hero slideshow
  const hero = $('.hero-slides');
  // Only the first image is set up front; the others are fetched right after it, so the first paint stays fast.
  hero.innerHTML = heroSlides
    .map((s, i) => `<div class="hero-slide ${i === 0 ? 'is-active' : ''}" ${i === 0 ? `style="background-image:url(${img(s.id)})"` : ''} role="img" aria-label="${s.caption}"${i === 0 ? '' : ' aria-hidden="true"'}></div>`)
    .join('');
  const slides = [...hero.children];
  const ready = new Set([0]);
  const preload = (n) => new Promise((resolve) => {
    if (ready.has(n)) return resolve();
    const im = new Image();
    im.onload = im.onerror = () => {
      slides[n].style.backgroundImage = `url(${img(heroSlides[n].id)})`;
      ready.add(n);
      resolve();
    };
    im.src = img(heroSlides[n].id);
  });
  (async () => { for (let n = 1; n < slides.length; n++) await preload(n); })(); // warm the rest in order, one at a time

  let current = 0;
  let timer = null;
  const advance = () => {
    const next = (current + 1) % slides.length;
    if (!ready.has(next)) return; // never fade to an image that hasn't arrived yet (no blank frames)
    slides.forEach((s) => s.classList.remove('is-prev'));
    slides[current].classList.remove('is-active');
    slides[current].classList.add('is-prev'); // stays opaque underneath while the new image fades in
    slides[next].classList.add('is-active');
    slides[next].setAttribute('aria-hidden', 'false');
    slides[current].setAttribute('aria-hidden', 'true');
    current = next;
    preload((current + 1) % slides.length); // make sure the following image is ready in time
  };
  const start = () => { if (!timer) timer = setInterval(advance, HERO_INTERVAL_MS); };
  const stop = () => { clearInterval(timer); timer = null; };
  start();
  // Save CPU/battery: pause while the tab is in the background or the hero is scrolled out of view.
  let tabVisible = !document.hidden;
  let heroVisible = true;
  const sync = () => (tabVisible && heroVisible ? start() : stop());
  document.addEventListener('visibilitychange', () => { tabVisible = !document.hidden; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; sync(); }, { threshold: 0.05 }).observe($('.hero'));
  }

  // Recent projects gallery
  const bySlug = (s) => projects.find((p) => p.slug === s);
  $('#home-projects').innerHTML = recentProjectSlugs
    .map(bySlug)
    .filter(Boolean)
    .map((p, i) => `
      <a class="recent-item" href="/project.html?p=${p.slug}" aria-label="${p.title}" data-reveal style="--d:${(i % 3) * 90}ms">
        <img src="${img(p.cover)}" alt="${p.title}" loading="lazy">
        <span class="recent-title">${p.title}</span>
      </a>`)
    .join('');
  // Touch devices: first tap reveals the title, second tap opens the project.
  if (matchMedia('(hover: none)').matches) {
    $('#home-projects').addEventListener('click', (e) => {
      const item = e.target.closest('.recent-item');
      if (!item) return;
      if (!item.classList.contains('is-tapped')) {
        e.preventDefault();
        document.querySelectorAll('.recent-item.is-tapped').forEach((i) => i.classList.remove('is-tapped'));
        item.classList.add('is-tapped');
      }
    });
  }

  // Partners marquee: two identical groups so the loop is seamless
  const logo = (p) => `<li class="partner">${
    p.src ? `<img src="${p.src}" alt="${p.name}" loading="lazy">` : `<span class="partner-mark" title="Placeholder logo">${p.name}</span>`
  }</li>`;
  const group = (hidden) => `<ul class="partners-group"${hidden ? ' aria-hidden="true"' : ''}>${partners.map(logo).join('')}</ul>`;
  $('#home-partners').innerHTML = `<div class="partners-track">${group(false)}${group(true)}</div>`;
}

/* ---------- About ---------- */
function about() {
  renderAbout();
}

/* ---------- Services ---------- */
function servicesPage() {
  renderServicesPage();
}

/* ---------- Projects ---------- */
function projectsPage() {
  renderProjectsPage();
}

/* ---------- Project detail (shared template in project.js) ---------- */
function projectDetail() {
  renderProjectDetail();
}

/* ---------- Contact ---------- */
function contact() {
  renderContact();
}

export function renderPage(page) {
  ({ home, about, services: servicesPage, projects: projectsPage, project: projectDetail, contact })[page]?.();
}
