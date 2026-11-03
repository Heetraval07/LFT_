import { servicesPage, authoritiesBlock, faq, highlights } from './services-data.js';

const ARROW = '<svg viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M0 6h22M17 1l5 5-5 5"/></svg>';
const GLYPHS = [
  '<circle cx="24" cy="24" r="12"/>',
  '<rect x="12" y="12" width="24" height="24"/>',
  '<path d="M24 10l14 24H10z"/>',
  '<path d="M24 8l14 16-14 16L10 24z"/>',
  '<path d="M24 9l12 7v16l-12 7-12-7V16z"/>',
  '<circle cx="24" cy="24" r="12"/><circle cx="24" cy="24" r="5"/>',
  '<path d="M10 34V14l14 10 14-10v20z"/>',
];

const authCard = (a, i) => `
  <li class="sv-auth">
    ${a.src
      ? `<img src="${a.src}" alt="${a.name}" loading="lazy">`
      : `<span class="sv-auth-ph" title="Placeholder logo">
           <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${GLYPHS[i % GLYPHS.length]}</svg>
           <b>${a.name}</b>
         </span>`}
  </li>`;

export function renderServicesPage() {
  const root = document.getElementById('services-page');
  const sv = servicesPage;

  root.innerHTML = `
    <div class="page-lines" aria-hidden="true">${'<span></span>'.repeat(7)}</div>

    <div class="sv-top">
      <section class="sv-services" id="services">
        <h1 class="sv-title" data-reveal>${sv.title}</h1>
        <div class="sv-grid">
          ${sv.items.map((s, i) => `
            <a class="sv-card" id="${s.id}" href="/contact.html?service=${s.id}" data-reveal style="--d:${(i % 3) * 110}ms" aria-label="${s.title} — enquire">
              <span class="sv-num">${String(i + 1).padStart(2, '0')}</span>
              <h2>${s.title}</h2>
              <p>${s.text}</p>
              <span class="sv-arrow">${ARROW}</span>
            </a>`).join('')}
        </div>
      </section>

      <section class="sv-authorities" id="authorities" aria-label="${authoritiesBlock.title}">
        <div class="sv-auth-box" data-reveal>
          <h2>${authoritiesBlock.title}</h2>
          <ul class="sv-auth-row">${authoritiesBlock.items.map(authCard).join('')}</ul>
        </div>
        <p class="sv-demo sv-demo-center">${authoritiesBlock.demoNote}</p>
      </section>
    </div>

    <section class="sv-faq" id="faq">
      <div class="sv-faq-wrap">
        <h2 class="sv-faq-title" data-reveal>${faq.title}</h2>
        <div class="sv-faq-list" data-reveal>
          ${faq.items.map((f, i) => `
            <div class="sv-faq-item">
              <h3><button type="button" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}"><span>${f.q}</span><i aria-hidden="true"></i></button></h3>
              <div class="sv-faq-panel" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}"><p>${f.a}</p></div>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <section class="sv-quotes" id="highlights" aria-label="Highlights">
      <svg class="sv-bp sv-bp-left" viewBox="0 0 420 500" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
        <path d="M0 500V300l120-60 120 40v220M120 240V120l140 40v340M30 330h200M30 380h200M30 430h200M60 300v200M120 270v230M180 290v210M260 160l120 60v280M300 240v260M340 260v240"/>
      </svg>
      <svg class="sv-bp sv-bp-right" viewBox="0 0 420 500" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
        <path d="M420 500V330l-100-40-80 30v180M320 290V200l-90-30v330M420 380H240M420 430H240M380 330v170M330 350v150M280 340v160M130 500V400h110M60 500V440h70"/>
      </svg>
      <div class="sv-slider" id="sv-slider">
        <div class="sv-track">
          ${highlights.map((h, i) => `
            <figure class="sv-slide ${i === 0 ? 'is-active' : ''}" aria-hidden="${i !== 0}">
              <blockquote>${h.text}</blockquote>
              <figcaption><i></i>${h.tag}</figcaption>
            </figure>`).join('')}
        </div>
        <div class="sv-dots">${highlights.map((_, i) => `<button aria-label="Show highlight ${i + 1}" class="${i === 0 ? 'is-active' : ''}"></button>`).join('')}</div>
      </div>
    </section>`;

  // FAQ accordion: one open at a time, smooth height transition
  const items = [...root.querySelectorAll('.sv-faq-item')];
  items.forEach((item) => {
    const btn = item.querySelector('button');
    const panel = item.querySelector('.sv-faq-panel');
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      items.forEach((o) => {
        o.classList.remove('is-open');
        o.querySelector('button').setAttribute('aria-expanded', 'false');
        o.querySelector('.sv-faq-panel').style.maxHeight = '0px';
      });
      if (open) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
  addEventListener('resize', () => {
    const o = root.querySelector('.sv-faq-item.is-open .sv-faq-panel');
    if (o) o.style.maxHeight = o.scrollHeight + 'px';
  });

  // Highlights slider
  const slider = root.querySelector('#sv-slider');
  const slides = slider.querySelectorAll('.sv-slide');
  const dots = slider.querySelectorAll('.sv-dots button');
  let cur = 0;
  let timer;
  const go = (n) => {
    slides[cur].classList.remove('is-active');
    slides[cur].setAttribute('aria-hidden', 'true');
    dots[cur].classList.remove('is-active');
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add('is-active');
    slides[cur].setAttribute('aria-hidden', 'false');
    dots[cur].classList.add('is-active');
  };
  const start = () => { clearInterval(timer); timer = setInterval(() => go(cur + 1), 6500); };
  dots.forEach((d, n) => d.addEventListener('click', () => { go(n); start(); }));
  start();

  // Jump to an anchored service (links from the About page)
  if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
}
