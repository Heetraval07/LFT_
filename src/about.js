import {
  aboutPage, clientsPartners, authorities, aboutServices, statement, clients, reachUs, sampleTestimonials,
} from './about-data.js';

const CHECK = '<svg class="ab-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.5-8"/></svg>';
const ARROW = '<svg viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M0 6h22M17 1l5 5-5 5"/></svg>';

// Different simple glyphs so placeholder cards don't all look identical (none imitate a real brand).
const GLYPHS = [
  '<circle cx="24" cy="24" r="14"/>',
  '<rect x="10" y="10" width="28" height="28"/>',
  '<path d="M24 8l16 28H8z"/>',
  '<path d="M24 6l16 18-16 18L8 24z"/>',
  '<path d="M24 8l14 8v16l-14 8-14-8V16z"/>',
  '<circle cx="24" cy="24" r="14"/><circle cx="24" cy="24" r="6"/>',
];

const logoCard = (item, i) => `
  <li class="ab-logo">
    ${item.src
      ? `<img src="${item.src}" alt="${item.name}" loading="lazy">`
      : `<span class="ab-logo-ph" title="Placeholder logo">
           <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${GLYPHS[i % GLYPHS.length]}</svg>
           <b>${item.name}</b>
         </span>`}
  </li>`;

function lines() {
  return `<div class="page-lines" aria-hidden="true">${'<span></span>'.repeat(7)}</div>`;
}

export function renderAbout() {
  const root = document.getElementById('about');
  const a = aboutPage;
  const cp = clientsPartners;
  const au = authorities;
  const sv = aboutServices;
  const cl = clients;
  const t = sampleTestimonials;

  root.innerHTML = `
    ${lines()}

    <section class="ab ab-intro" id="intro">
      <div class="ab-wrap">
        <p class="ab-mission" data-reveal>${a.mission}</p>
        <div class="ab-split">
          <figure class="ab-photo" data-reveal><img src="${a.image.src}" alt="${a.image.alt}"></figure>
          <div class="ab-copy" data-reveal style="--d:120ms">
            <h1 class="ab-kicker">${a.kicker}</h1>
            ${a.about.map((p) => `<p>${p}</p>`).join('')}
            <h2 class="ab-who">${a.whoWeAre.title}</h2>
            ${a.whoWeAre.text.map((p) => `<p>${p}</p>`).join('')}
            <h3 class="ab-sub">${a.capabilities.title}</h3>
            <ul class="ab-checks">${a.capabilities.items.map((i) => `<li>${CHECK}<span>${i}</span></li>`).join('')}</ul>
          </div>
        </div>
      </div>
    </section>

    <section class="ab ab-alt" id="partners">
      <div class="ab-wrap">
        <h2 class="ab-h2" data-reveal>${cp.title}</h2>
        <p class="ab-lead" data-reveal>${cp.intro}</p>
        <div class="ab-groups" data-reveal>
          <div class="ab-group"><h3>Approved by:</h3><ul class="ab-logos">${cp.approvedBy.map(logoCard).join('')}</ul></div>
          <div class="ab-group"><h3>Registered with:</h3><ul class="ab-logos">${cp.registeredWith.map((x, i) => logoCard(x, i + 3)).join('')}</ul></div>
        </div>
        <p class="ab-note-line">${cp.closing}</p>
        <p class="ab-demo">${cp.demoNote}</p>
      </div>
    </section>

    <section class="ab ab-alt ab-tight" id="authorities">
      <div class="ab-wrap">
        <h2 class="ab-h2 ab-caps" data-reveal>${au.title}</h2>
        <div class="ab-prose" data-reveal>${au.intro.map((p) => `<p>${p}</p>`).join('')}</div>
        <h3 class="ab-sub" data-reveal>${au.listTitle}</h3>
        <ul class="ab-checks ab-checks-wide" data-reveal>
          ${au.items.map((i) => `<li>${CHECK}<span><b>${i.name}</b> — ${i.note} <em class="ab-tag">Placeholder</em></span></li>`).join('')}
        </ul>
        <p class="ab-demo">${au.demoNote}</p>
      </div>
    </section>

    <section class="ab ab-alt ab-services" id="services">
      <div class="ab-wrap">
        <h2 class="ab-h2" data-reveal>${sv.title}</h2>
        <div class="ab-cards">
          ${sv.items.map((s, i) => `
            <a class="ab-card" href="${s.href}" data-reveal style="--d:${i * 100}ms">
              <span class="ab-num">${s.n}</span>
              <h3>${s.title}</h3>
              <p>${s.text}</p>
              <span class="ab-arrow">${ARROW}</span>
            </a>`).join('')}
        </div>
      </div>
    </section>

    <section class="ab ab-black ab-statement" id="statement">
      <p data-reveal>${statement
        .map((line) => line.map(([txt, kind]) => `<span class="${kind}">${txt}</span>`).join(''))
        .join('<br>')}</p>
    </section>

    <section class="ab ab-clients" id="clients">
      <div class="ab-wrap ab-center">
        <h2 class="ab-h2 ab-caps ab-bold" data-reveal>${cl.title}</h2>
        <ul class="ab-logos ab-logos-5" data-reveal>${cl.items.map(logoCard).join('')}</ul>
        <p class="ab-demo">${cl.demoNote}</p>
      </div>
    </section>

    <section class="ab ab-reach" id="reach">
      <div class="ab-wrap ab-center"><h2 class="ab-h2 ab-caps ab-bold" data-reveal>${reachUs.title}</h2></div>
      <div class="ab-map" data-reveal>
        <iframe title="Office location: ${reachUs.mapQuery}" loading="lazy"
          src="https://maps.google.com/maps?q=${encodeURIComponent(reachUs.mapQuery)}&z=15&output=embed"></iframe>
      </div>
    </section>

    <section class="ab ab-black ab-testimonials" id="testimonials" aria-label="Testimonials">
      <svg class="ab-blueprint" viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax slice" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
        <path d="M0 520V360l120-40v-60h140v110l90-30V200h110v250l70-20V140h160v320l60-30V230h120v200l80-40V170h150v240l90-30V280h130v140l110-50V210h140v310"/>
        <path d="M0 440h1440M120 320v200M260 260v260M350 200v320M460 140v380M620 140v380M680 230v290M800 170v350M890 170v350M1020 280v240M1150 210v310"/>
        <path d="M0 520L360 330M1440 520L1080 330M0 300L440 180M1440 300L1000 180" opacity=".5"/>
      </svg>
      <div class="ab-wrap ab-center">
        <p class="ab-demo ab-demo-label">${t.label}</p>
        <div class="ab-slider" id="ab-slider">
          <div class="ab-track">
            ${t.items.map((x, i) => `
              <figure class="ab-slide ${i === 0 ? 'is-active' : ''}" aria-hidden="${i !== 0}">
                <blockquote>“${x.quote}”</blockquote>
                <figcaption>— ${x.name} <span>${x.project}</span></figcaption>
              </figure>`).join('')}
          </div>
          <div class="ab-dots">${t.items.map((_, i) => `<button aria-label="Show testimonial ${i + 1}" class="${i === 0 ? 'is-active' : ''}"></button>`).join('')}</div>
        </div>
      </div>
    </section>`;

  // Testimonial slider: auto-advances, dots to jump
  const slider = root.querySelector('#ab-slider');
  const slides = slider.querySelectorAll('.ab-slide');
  const dots = slider.querySelectorAll('.ab-dots button');
  let i = 0;
  let timer;
  const go = (n) => {
    slides[i].classList.remove('is-active');
    slides[i].setAttribute('aria-hidden', 'true');
    dots[i].classList.remove('is-active');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('is-active');
    slides[i].setAttribute('aria-hidden', 'false');
    dots[i].classList.add('is-active');
  };
  const start = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 6500); };
  dots.forEach((d, n) => d.addEventListener('click', () => { go(n); start(); }));
  start();
}
