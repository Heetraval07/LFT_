// Checks that this server's environment variables are complete and sensible, and that the database is reachable.
// Run it after setting variables (and before going live):   npm run check:env
// Prints OK/problem lines only. It never prints passwords or full connection strings.
import 'dotenv/config';
import path from 'node:path';
import { access, mkdir, writeFile, rm, constants } from 'node:fs/promises';

let problems = 0;
let warnings = 0;
const ok = (m: string) => console.log(`  OK    ${m}`);
const bad = (m: string) => { problems++; console.log(`  FIX   ${m}`); };
const warn = (m: string) => { warnings++; console.log(`  NOTE  ${m}`); };
const env = (k: string) => (process.env[k] || '').trim();

console.log(`Environment label (APP_ENV): ${env('APP_ENV') || '(not set)'}`);

console.log('\nDatabase');
const url = env('DATABASE_URL');
const m = url.match(/^mysql:\/\/([^:@/]+):[^@]*@([^:/]+)(?::(\d+))?\/([^?]+)/i);
if (!url) bad('DATABASE_URL is not set');
else if (!m) bad('DATABASE_URL must look like mysql://USER:PASSWORD@localhost:3306/DATABASE (special characters in the password must be URL-encoded)');
else {
  ok(`user "${m[1]}", host "${m[2]}", port ${m[3] || '3306'}, database "${decodeURIComponent(m[4])}"`);
  if (!['localhost', '127.0.0.1'].includes(m[2])) warn(`Host is "${m[2]}". On Hostinger shared hosting it is normally "localhost".`);
  try {
    const { db } = await import('../lib/db.ts');
    const tables = (await db.$queryRawUnsafe('SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE()')) as { n: bigint }[];
    ok(`connected; ${Number(tables[0].n)} tables found`);
    if (Number(tables[0].n) === 0) warn('The database is empty. Run: npx prisma migrate deploy');
    else {
      const [projects, admins] = [await db.project.count(), await db.adminUser.count()];
      ok(`${projects} project(s), ${admins} admin account(s)`);
      if (admins === 0) warn('No admin yet. Run: npm run admin:create -- --email you@example.com --name "Your Name"');
    }
    await db.$disconnect();
  } catch (e) { bad(`could not connect/read: ${(e as Error).message.split('\n')[0]}`); }
}

console.log('\nContact form (SMTP)');
for (const k of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'CONTACT_RECEIVER_EMAIL']) env(k) ? ok(`${k} is set`) : bad(`${k} is not set (the contact form will show "temporarily unavailable")`);
if (env('SMTP_PORT') && !['465', '587'].includes(env('SMTP_PORT'))) warn(`SMTP_PORT is ${env('SMTP_PORT')}; usually 465 (SMTP_SECURE=true) or 587 (SMTP_SECURE=false)`);
if (env('SMTP_PORT') === '465' && env('SMTP_SECURE') === 'false') bad('Port 465 needs SMTP_SECURE=true');
if (env('SMTP_PORT') === '587' && env('SMTP_SECURE') === 'true') bad('Port 587 needs SMTP_SECURE=false');
if (/\s/.test(env('SMTP_PASSWORD'))) warn('SMTP_PASSWORD contains spaces. Gmail app passwords must be entered without spaces.');
if (/^(127\.0\.0\.1|localhost)$/.test(env('SMTP_HOST')) && env('NODE_ENV') === 'production') bad('SMTP_HOST points at this machine; use your real mail server');

console.log('\nPhoto uploads');
{
  const { inspectStorage } = await import('../lib/storage-core.ts');
  const s = await inspectStorage();
  if (s.state === 'off') (env('UPLOAD_DIR') ? bad : warn)(`Uploads are OFF: ${s.reason}`);
  else if (s.state === 'confirmed') ok(`photo folder confirmed persistent (survived a redeployment): ${s.dir}`);
  else warn(`photo folder is usable but not yet proven persistent; redeploy once, then run: npm run storage:check (${s.dir})`);
}

console.log('\nLeftover first-deploy settings');
for (const k of ['RUN_SEED', 'ADMIN_BOOTSTRAP_EMAIL', 'ADMIN_BOOTSTRAP_PASSWORD', 'ADMIN_BOOTSTRAP_NAME']) if (env(k)) warn(`${k} is still set. Remove it after the first successful deploy.`);

console.log(`\n${problems ? `${problems} thing(s) to fix` : 'No problems found'}${warnings ? `, ${warnings} note(s)` : ''}.`);
process.exit(problems ? 1 : 0);
