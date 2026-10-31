# LFT Interior Design — website

Website for **LFT Interior Design LLC** (Ithraa Tower, Al Garhoud, Dubai, UAE). A multi-page static site built with
[Vite](https://vitejs.dev) and plain HTML, CSS and JavaScript (no framework).

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build in dist/
npm run preview      # serve the production build (http://localhost:4173)
```

## Pages

| URL | What's on it |
| --- | --- |
| `/` | Five-image hero slideshow (3s crossfade), recent projects gallery, partners marquee |
| `/about.html` | About LFT, who we are, capabilities, clients & partners, authorities, services, brand statement, clients, map, testimonials |
| `/services.html` | Nine services, authorities block, FAQ accordion, highlights slider |
| `/projects.html` | Filterable, paginated project gallery (`?category=Commercial`, `?page=2`, `?q=` search) |
| `/project.html?p=<slug>` | Project detail with gallery lightbox and next/previous links |
| `/contact.html` | Google map, contact details, validated enquiry form |
| `/terms.html`, `/privacy.html` | Legal pages (generic templates — have them reviewed before launch) |

The navbar, footer, animated divider lines and floating UP button are shared by every page.

## Where to edit things

| What | Where |
| --- | --- |
| Company name, address, phone, email, social links, footer mission | `src/data.js` (`brand`) |
| Hero slideshow images and interval | `src/data.js` (`heroSlides`, `HERO_INTERVAL_MS`) |
| Projects (titles, photos, text) | `src/data.js` (`projects`); filter tabs and which tab each project belongs to: `src/projects-data.js` |
| About page content | `src/about-data.js` |
| Services page content and FAQ | `src/services-data.js` |
| Partners marquee logos | `src/data.js` (`partners`) |
| Colours, fonts, spacing | CSS variables and sections in `src/styles.css` |
| Images | `public/images/` (named by Pexels photo ID); logo files in `public/images/logo/` |

### Enquiry form delivery

The Contact form needs somewhere to send messages. Put a form-service URL (for example a Formspree form that delivers to
`info@lftinteriors.com`) in the `form-endpoint` tag in `contact.html`:

```html
<meta name="form-endpoint" content="https://formspree.io/f/your-form-id">
```

While that tag is empty, the form opens the visitor's email app with the message filled in instead. It never shows a
"sent" message unless a message was really delivered.

## Placeholders to replace before launch

- Social media links point to each platform's home page, not LFT's profiles.
- Partner, client and authority logos are neutral placeholders, not real organisations.
- Sample testimonials, the project names/photos and the nine-service list are demonstration content.
- Terms and Privacy pages are generic templates.

## Checks

With the dev server running (`npm run dev`), the scripts in `scripts/` drive the site in a real browser (Playwright):

```bash
npx playwright install chromium     # one-time
node scripts/hero-check.mjs         # hero slideshow: 5 images, 3s interval, crossfade
node scripts/fouc-check.mjs         # no flash of unstyled content
node scripts/nav-check.mjs          # refresh, logo and navbar navigation
node scripts/logo-align-check.mjs   # navbar/footer logo alignment at 17 widths
node scripts/polish-check.mjs       # logo sizing, social icons, hover/reveal effects, reduced motion
node scripts/about-check.mjs  node scripts/services-check.mjs  node scripts/projects-check.mjs  node scripts/contact-check.mjs
node scripts/home-check.mjs   node scripts/header-check.mjs    node scripts/footer-check.mjs   node scripts/cleanup-check.mjs
npm test                            # interaction smoke test
npm run screenshots                 # full-page desktop + mobile screenshots into screenshots/ (git-ignored)
```

## Credits

Photography from [Pexels](https://www.pexels.com) (free to use under the Pexels License). Icons from
[Bootstrap Icons](https://icons.getbootstrap.com) (MIT).
