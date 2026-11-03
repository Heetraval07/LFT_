import { brand, services } from './data.js';
import { servicesPage } from './services-data.js';

const ADDRESS_QUERY = 'Ithraa Tower, Al Garhoud, Dubai, UAE';
const MAP_SRC = `https://maps.google.com/maps?q=${encodeURIComponent(ADDRESS_QUERY)}&z=16&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_QUERY)}`;

const content = {
  heading: 'Get in Touch',
  text: 'We are available for new project enquiries, collaborations and consultations. Reach out to our team to discuss your <b>interior design and fit-out</b> requirements, from a single room to a complete commercial space.',
};

const rules = {
  name: (v) => v.trim().length >= 2 || 'Please enter your name.',
  phone: (v) => !v.trim() || /^[+\d\s()-]{6,20}$/.test(v.trim()) || 'Please enter a valid phone number.',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
  message: (v) => v.trim().length >= 10 || 'Please tell us a little about your project (at least 10 characters).',
};

// Opens the visitor's email app with the enquiry filled in (used when no form endpoint is configured).
function openMailClient(url) {
  const a = document.createElement('a');
  a.href = url;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
}

export function renderContact() {
  const root = document.getElementById('contact-page');
  const addr = brand.address.join(', ');

  root.innerHTML = `
    <div class="page-lines" aria-hidden="true">${'<span></span>'.repeat(7)}</div>

    <section class="ct-top" aria-label="Map">
      <div class="ct-map" data-reveal>
        <iframe title="Map: ${brand.legalName}, ${addr}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen src="${MAP_SRC}"></iframe>
      </div>
    </section>

    <section class="ct-touch" id="get-in-touch">
      <div class="ct-wrap ct-grid">
        <div class="ct-info" data-reveal>
          <h1>${content.heading}</h1>
          <p>${content.text}</p>
          <dl class="ct-details">
            <div><dt>Company</dt><dd>${brand.legalName}</dd></div>
            <div><dt>Office Address</dt><dd>${addr}<br><a href="${MAP_LINK}" target="_blank" rel="noopener">View on Google Maps</a></dd></div>
            <div><dt>Email</dt><dd><a href="mailto:${brand.email}">${brand.email}</a></dd></div>
            <div><dt>Phone</dt><dd><a href="tel:${brand.phoneLink}">${brand.phone}</a></dd></div>
          </dl>
        </div>

        <form class="ct-form" id="contact-form" novalidate data-reveal style="--d:120ms">
          <div class="ct-field">
            <label class="sr-only" for="f-name">Your name</label>
            <input id="f-name" name="name" type="text" placeholder="Your Name" autocomplete="name" required aria-describedby="e-name">
            <span class="ct-error" id="e-name" role="alert"></span>
          </div>
          <div class="ct-field">
            <label class="sr-only" for="f-phone">Your phone number (optional)</label>
            <input id="f-phone" name="phone" type="tel" placeholder="Your Phone No" autocomplete="tel" aria-describedby="e-phone">
            <span class="ct-error" id="e-phone" role="alert"></span>
          </div>
          <div class="ct-field">
            <label class="sr-only" for="f-email">Your email</label>
            <input id="f-email" name="email" type="email" placeholder="Your Email" autocomplete="email" required aria-describedby="e-email">
            <span class="ct-error" id="e-email" role="alert"></span>
          </div>
          <div class="ct-field">
            <label class="sr-only" for="f-message">Your message</label>
            <textarea id="f-message" name="message" placeholder="Your Message" required aria-describedby="e-message"></textarea>
            <span class="ct-error" id="e-message" role="alert"></span>
          </div>
          <input class="ct-hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button type="submit" class="ct-send">Send Mail</button>
          <p class="ct-status" id="ct-status" role="status" aria-live="polite" hidden></p>
        </form>
      </div>
    </section>`;

  const form = root.querySelector('#contact-form');
  const status = root.querySelector('#ct-status');
  const send = root.querySelector('.ct-send');

  // Arriving from a service card on the Services page: start the message with that service.
  const wanted = new URLSearchParams(location.search).get('service');
  const match = servicesPage.items.find((s) => s.id === wanted) || services.find((s) => s.slug === wanted);
  if (match) form.elements.message.value = `I would like to enquire about ${match.title}.\n`;

  const showStatus = (kind, html) => {
    status.hidden = false;
    status.className = `ct-status is-${kind}`;
    status.innerHTML = html;
  };

  const check = (field) => {
    const rule = rules[field.name];
    if (!rule) return true;
    const res = rule(field.value);
    const ok = res === true;
    field.setAttribute('aria-invalid', String(!ok));
    root.querySelector(`#e-${field.name}`).textContent = ok ? '' : res;
    return ok;
  };
  form.addEventListener('blur', (e) => { if (e.target.name in rules) check(e.target); }, true);
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') check(e.target); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.hidden = true;
    const fields = ['name', 'phone', 'email', 'message'].map((n) => form.elements[n]);
    const results = fields.map(check);
    if (results.includes(false)) {
      fields[results.indexOf(false)].focus();
      showStatus('error', 'Please fix the highlighted fields and try again.');
      return;
    }
    if (form.elements.company.value) return; // honeypot: bots only

    const data = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim(),
    };
    const endpoint = document.querySelector('meta[name="form-endpoint"]')?.content.trim();
    const subject = `Website enquiry from ${data.name}`;
    const body = `Name: ${data.name}\nPhone: ${data.phone || '—'}\nEmail: ${data.email}\n\n${data.message}`;
    const mailto = `mailto:${brand.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (endpoint) {
      send.disabled = true;
      send.textContent = 'Sending…';
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...data, _subject: subject }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.reset();
        showStatus('success', 'Thank you — your message has been sent. We will get back to you shortly.');
      } catch {
        showStatus('error', `Sorry, your message could not be sent. Please try again, or email us at <a href="${mailto}">${brand.email}</a> or call <a href="tel:${brand.phoneLink}">${brand.phone}</a>.`);
      } finally {
        send.disabled = false;
        send.textContent = 'Send Mail';
      }
      return;
    }

    // No form service configured: hand the message to the visitor's email app. This is not a send.
    openMailClient(mailto);
    showStatus('info', `Your email app should now open with your message ready. Please press <b>Send</b> there to deliver it. If nothing opens, email <a href="mailto:${brand.email}">${brand.email}</a> or call <a href="tel:${brand.phoneLink}">${brand.phone}</a>.`);
  });
}
