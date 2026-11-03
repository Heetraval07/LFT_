# Deploying LFT Interior Design to Hostinger

Plan: **Hostinger Unlimited Web Hosting** (Node.js web apps are supported on Business/Unlimited and Cloud plans).
App: Next.js 16 (standalone server) · MariaDB via Prisma 7 · Node.js **22.18+ or 24** (choose 24 if offered).

> Nothing here touches production until you do it yourself in hPanel. Never paste passwords into the code or GitHub.

## 1. Create the database (hPanel → Databases → MySQL Databases)

1. Create a database (e.g. `u123456789_lft`) and a database user with a strong password.
2. Note the **database name, user, password**. Host is `localhost`, port `3306` (Hostinger's MySQL service is MariaDB).
3. Build the connection string — URL-encode special characters in the password (`@`→`%40`, `#`→`%23`, `:`→`%3A`, `/`→`%2F`):
   `mysql://u123456789_lftuser:PASSWORD@localhost:3306/u123456789_lft`

## 2. Create the Node.js app (hPanel → Websites → Add website → Node.js app)

- Source: connect the GitHub repository `Heetraval07/LFT_`, branch `main` (every push redeploys automatically).
- Node version: **24** (or 22).
- **Build command: `npm run build:hostinger`** — generates the database client, applies new migrations, then builds.
- Hostinger detects Next.js and starts its standalone server.

## 3. Environment variables (app → Environment variables)

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the connection string from step 1 |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | e.g. `smtp.hostinger.com` / `465` / `true` |
| `SMTP_USER` / `SMTP_PASSWORD` | the mailbox that sends the enquiries (its own password or app password) |
| `CONTACT_RECEIVER_EMAIL` | where enquiries should arrive (e.g. `info@lftinteriors.com`) |
| `UPLOAD_DIR` | absolute folder for uploaded photos, **outside** the app — see step 7 |
| `UPLOADS_VERIFIED` | `false` until step 7 passes |

**First deploy only** (remove straight after it succeeds):

| Variable | Purpose |
| --- | --- |
| `RUN_SEED=true` | loads the original 8 projects and 76 photos into the empty database |
| `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_PASSWORD` (12+ chars) | creates the first admin if none exists |

> If Hostinger doesn't expose environment variables during the build, run the same steps once over SSH from the
> app folder instead: `npx prisma migrate deploy`, `npm run db:seed`, `npm run admin:create -- --email … --name "…"`.

## 4. Deploy, then check

1. Deploy. In the build log look for `Applying database migrations…`, `Seed complete…` and `Created the first admin`.
2. **Remove `RUN_SEED` and the three `ADMIN_BOOTSTRAP_*` variables**, then restart the app.
3. Open the site: every page, `/projects.html`, a project page, `/contact.html`.
4. Sign in at **`/admin`**. More admins: `npm run admin:create -- --email name@domain --name "Name"` (SSH), which also
   resets a forgotten password.

## 5. Contact form

Send a test enquiry from `/contact.html`. It should arrive at `CONTACT_RECEIVER_EMAIL`, sent *from* `SMTP_USER`, with
**Reply-To** set to the visitor. If the visitor sees "temporarily unavailable", an SMTP variable is missing; if they see
"could not be sent", check the SMTP host/port/password (details are written to the app's log, never shown to visitors).

## 6. Day-to-day content (no GitHub, no redeploy)

Staff use `/admin` for projects, categories and testimonials. Every page reads the database on each request, so a
publish/unpublish/edit is live immediately. Only code or design changes need a GitHub push.

## 7. Photo uploads — verify persistent storage first

Hostinger replaces `~/domains/<domain>/hbuilds/` and `public_html/` on **every** deployment, so uploads must live
elsewhere. Uploads stay **off** until this check passes:

1. Create a folder outside the domain folders, e.g. `/home/u123456789/lft-uploads` (File Manager or SSH).
2. Set `UPLOAD_DIR=/home/u123456789/lft-uploads`, restart, open **/admin → Photo storage**. All rows must be OK.
3. Click **Create marker file**, then **redeploy** the app (or push any commit).
4. Reopen **Photo storage**: it must say the marker from an earlier version *is still there*.
5. Only then set `UPLOADS_VERIFIED=true` and restart. If step 4 fails, uploads must stay off — tell your developer.

## 8. Backups and restore

**Database**
- hPanel → Backups (Hostinger's automatic backups) can restore the database.
- Before big changes: hPanel → Databases → phpMyAdmin → select the database → *Export* (SQL). Or over SSH:
  `mysqldump -u USER -p DATABASE > lft-$(date +%F).sql`
- Restore: phpMyAdmin → *Import* the `.sql` file, or `mysql -u USER -p DATABASE < file.sql`.

**Uploaded photos** (`UPLOAD_DIR`)
- Back up the folder regularly: File Manager → compress → download, or `tar czf lft-uploads-$(date +%F).tgz -C /home/u123456789 lft-uploads`.
- Restore by extracting it back to the same path. Back up database and photos **together** — the database stores the
  photo paths.
- Bundled photos (the original 76 in `public/images/projects/`) ship with the code in GitHub.

**Avoiding accidental loss**
- Deleting a project/testimonial asks for confirmation. Uploaded photo files are removed only when **no** record
  still uses them; bundled website photos are never deleted by the admin.
- Never point `UPLOAD_DIR` inside `hbuilds/`, `public_html/` or the app folder.
- Never run `prisma migrate reset` or `prisma db push --force-reset` against production.

## 9. Schema changes later

Create migrations locally (`npm run db:migrate:dev -- --name describe-change`), commit `prisma/migrations/`, push.
The next deploy applies them with `prisma migrate deploy` (additive, keeps data).
