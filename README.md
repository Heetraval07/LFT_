# LFT Interior Design — website + admin

Website and content dashboard for **LFT Interior Design LLC** (Ithraa Tower, Al Garhoud, Dubai).

- **Next.js 16** (App Router) serves the public pages and the `/admin` dashboard.
- **MariaDB** via **Prisma 7** stores projects, project photos (paths), categories, testimonials and admin accounts.
- **Nodemailer (SMTP)** delivers contact-form enquiries.
- The public design is the original site: its markup, `site/styles.css` and browser scripts (`site/*.js`) are reused
  unchanged; the server now hands them the published content from the database (`window.__LFT_DATA__`).

## Local setup

```bash
npm install
cp .env.example .env            # then fill in DATABASE_URL (local MariaDB) — see below
npx prisma migrate deploy       # create the tables
npm run db:seed                 # load the original 8 projects + 76 photos (safe to re-run)
npm run admin:create -- --email you@example.com --name "Your Name"
npm run dev                     # http://localhost:5173  (admin: http://localhost:5173/admin)
```

Local MariaDB (Windows): `winget install MariaDB.Server`, then create a database and user, e.g.
`CREATE DATABASE lft_dev; CREATE USER 'lft_app'@'localhost' IDENTIFIED BY '…'; GRANT ALL ON lft_dev.* TO 'lft_app'@'localhost';`

To try the contact form without a real mailbox, run `node scripts/fake-smtp.mjs` and point the SMTP variables at
`127.0.0.1:2525` (messages are saved to `screenshots/mail/`).

## Project layout

| Path | What |
| --- | --- |
| `app/(home)`, `app/(about)/about`, … | Public pages (one route per original page; old `*.html` URLs are rewritten to them) |
| `app/_components/` | Shared `<html>` shell and the component that starts the site scripts |
| `site/` | Original site scripts + `styles.css` (header, footer, pages, animations) |
| `app/admin/` | Admin dashboard (login, dashboard, projects, categories, testimonials, photo uploads) |
| `app/admin/actions.ts` | All admin write operations (each checks the session first) |
| `app/api/contact/route.ts` | Contact form endpoint (validation, spam trap, rate limit, SMTP) |
| `lib/` | Database client, auth/sessions, validation, public queries, mail, photo storage + image checks |
| `prisma/` | Schema, migrations, seed (`seed-data.json` = the original content) |
| `public/images/` | Bundled images, including the 76 original project photos |
| `scripts/` | Admin CLI, deploy tasks, fake SMTP server and the Playwright test suites |

## Tests

With the dev server (or a production build) running, each `scripts/*-check.mjs` drives the site in a real browser:
`admin-check` (dashboard end-to-end), `contact-check` (SMTP flow), `project-detail-check`, `projects-check`,
`about-check`, `services-check`, `home-check`, `header-check`, `footer-check`, `hero-check`, `polish-check`,
`fouc-check`, `nav-check`, `logo-align-check`, `cleanup-check`, `interactions`. Set `BASE_URL` to test another server.

## Deployment

Two stages — our own Hostinger server first (staging), then the client's account (production) with **no code
changes**: everything server-specific comes from environment variables (see `.env.example`), and the two servers use
separate databases. Content moves between them with `npm run content:export` / `content:import`.
Full steps, checks, backups and restore: **[DEPLOYMENT.md](DEPLOYMENT.md)**.
