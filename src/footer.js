import { brand } from './data.js';
import instagram from 'bootstrap-icons/icons/instagram.svg?raw';
import linkedin from 'bootstrap-icons/icons/linkedin.svg?raw';
import facebook from 'bootstrap-icons/icons/facebook.svg?raw';
import envelope from 'bootstrap-icons/icons/envelope.svg?raw';
import telephone from 'bootstrap-icons/icons/telephone.svg?raw';

const icons = { instagram, facebook, linkedin };

// Footer order differs slightly from the header nav, per the brief.
const quickMenu = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about.html' },
  { label: 'Our Projects', href: '/projects.html' },
  { label: 'Our Services', href: '/services.html' },
  { label: 'Contacts', href: '/contact.html' },
];

export function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.id = 'site-footer';
  footer.innerHTML = `
    <div class="footer-lines" aria-hidden="true">${'<span></span>'.repeat(7)}</div>
    <div class="footer-inner" data-reveal>
      <div class="footer-col footer-brand">
        <a href="/" class="footer-logo" aria-label="${brand.name} home">
          <img src="/images/logo/lft-logo-light.png" alt="${brand.name}" width="69" height="52">
        </a>
        <p class="footer-mission">${brand.mission}</p>
        <p class="footer-est">EST. ${brand.established}</p>
      </div>
      <nav class="footer-col" aria-label="Quick menu">
        <h4>Quick Menu</h4>
        <ul class="footer-links">${quickMenu.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join('')}</ul>
      </nav>
      <div class="footer-col footer-connect">
        <h4>Connect With Us</h4>
        <p class="footer-label">Office Address</p>
        <address>${brand.legalName}<br>${brand.address.join(', ')}</address>
        <a class="footer-contact" href="mailto:${brand.email}"><span class="footer-icon">${envelope}</span>${brand.email}</a>
        <a class="footer-contact" href="tel:${brand.phoneLink}"><span class="footer-icon">${telephone}</span>${brand.phone}</a>
      </div>
      <div class="footer-col">
        <h4>Follow Us</h4>
        <ul class="footer-social">${brand.social
          .map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener noreferrer" aria-label="${s.label}">${icons[s.icon]}</a></li>`)
          .join('')}</ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} ${brand.legalName}. All rights reserved.</p>
      <ul>
        <li><a href="/terms.html">Terms and Conditions</a></li>
        <li><a href="/privacy.html">Privacy Policy</a></li>
      </ul>
    </div>`;
  document.body.append(footer);

  // Floating UP button (appears after scrolling)
  const up = document.createElement('button');
  up.className = 'up-btn';
  up.setAttribute('aria-label', 'Back to top');
  up.innerHTML = '<span>↑</span>UP';
  up.addEventListener('click', () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  document.body.append(up);
  const toggleUp = () => up.classList.toggle('is-visible', scrollY > 600);
  toggleUp();
  addEventListener('scroll', toggleUp, { passive: true });
}
