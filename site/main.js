import { img } from './data.js';
import { renderPage } from './pages.js';
import { renderHeader } from './header.js';
import { renderFooter } from './footer.js';

const page = document.body.dataset.page;

/* ---------- Scroll reveal ---------- */
export function initReveal(root = document) {
  const els = root.querySelectorAll('[data-reveal]:not(.is-visible)');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- Animated counters ---------- */
export function initCounters(root = document) {
  const els = root.querySelectorAll('[data-count]');
  const run = (el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const start = performance.now();
    const dur = 1600;
    const tick = (t) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  els.forEach((el) => io.observe(el));
}

/* ---------- Lightbox ---------- */
export function initLightbox(selector) {
  const triggers = [...document.querySelectorAll(selector)];
  if (!triggers.length) return;
  let box = document.querySelector('.lightbox');
  if (!box) {
    box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = `
      <button class="lb-close" aria-label="Close">×</button>
      <button class="lb-prev" aria-label="Previous image">‹</button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button class="lb-next" aria-label="Next image">›</button>`;
    document.body.append(box);
  }
  const imgEl = box.querySelector('img');
  const cap = box.querySelector('figcaption');
  let list = triggers;
  let i = 0;
  const show = (n) => {
    i = (n + list.length) % list.length;
    const t = list[i];
    imgEl.src = t.dataset.full || t.querySelector('img').src;
    imgEl.alt = t.dataset.caption || '';
    cap.textContent = t.dataset.caption || '';
  };
  const open = (n) => {
    list = triggers.filter((t) => !t.closest('[hidden]') && t.offsetParent !== null);
    show(list.indexOf(triggers[n]));
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add('is-open'));
    document.body.classList.add('no-scroll');
    box.querySelector('.lb-close').focus();
  };
  const close = () => {
    box.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(() => (box.hidden = true), 300);
  };
  triggers.forEach((t, n) => t.addEventListener('click', (e) => { e.preventDefault(); open(n); }));
  box.querySelector('.lb-close').onclick = close;
  box.querySelector('.lb-prev').onclick = () => show(i - 1);
  box.querySelector('.lb-next').onclick = () => show(i + 1);
  box.onclick = (e) => { if (e.target === box) close(); };
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
}

export { img };

renderHeader();
renderPage(page);
renderFooter();
initReveal();
initCounters();

/* Warm up internal pages when a link is hovered, focused or touched, so navigating
   (including the logo link) feels instant. Each page is fetched at most once. */
const warmed = new Set();
function warm(e) {
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || a.origin !== location.origin || a.target === '_blank' || a.hasAttribute('download')) return;
  const url = a.pathname + a.search;
  if (warmed.has(url) || url === location.pathname + location.search || !/(\/|\.html)$/.test(a.pathname)) return;
  warmed.add(url);
  const l = document.createElement('link');
  l.rel = 'prefetch';
  l.href = url;
  l.as = 'document';
  document.head.append(l);
}
['pointerover', 'focusin', 'touchstart'].forEach((t) => document.addEventListener(t, warm, { passive: true }));
