// Runs before every production build on Hostinger (see "build:hostinger" in package.json).
//
// 1. Always: apply pending database migrations (`prisma migrate deploy`). This only ADDS changes that are new;
//    it never resets or deletes data.
// 2. Only if RUN_SEED=true: load the original 8 projects / 76 photos (skips anything that already exists).
//    Set it for the FIRST deploy only, then remove it — otherwise a project you deleted would come back.
// 3. Only if ADMIN_BOOTSTRAP_EMAIL + ADMIN_BOOTSTRAP_PASSWORD are set AND no admin exists yet: create the
//    first admin. Remove both variables straight after the first successful deploy.
import 'dotenv/config';
import { execSync } from 'node:child_process';
import bcrypt from 'bcryptjs';

const run = (cmd: string) => execSync(cmd, { stdio: 'inherit', env: process.env });

if (!process.env.DATABASE_URL) {
  console.error('[deploy] DATABASE_URL is not set — add it in the hosting environment variables.');
  process.exit(1);
}

console.log('[deploy] Applying database migrations…');
run('npx prisma migrate deploy');

const { db } = await import('../lib/db.ts');

if (process.env.RUN_SEED === 'true') {
  console.log('[deploy] RUN_SEED=true → loading the original website content (existing records are skipped)…');
  run('node prisma/seed.ts');
}

const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
if (email && password) {
  const admins = await db.adminUser.count();
  if (admins > 0) {
    console.log('[deploy] An admin already exists — ADMIN_BOOTSTRAP_* ignored. Please remove these variables now.');
  } else if (password.length < 12) {
    console.error('[deploy] ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters. No admin created.');
  } else {
    await db.adminUser.create({ data: { email, name: process.env.ADMIN_BOOTSTRAP_NAME?.trim() || 'Administrator', passwordHash: await bcrypt.hash(password, 12) } });
    console.log(`[deploy] Created the first admin (${email}). REMOVE ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD from the environment now.`);
  }
}
await db.$disconnect();
