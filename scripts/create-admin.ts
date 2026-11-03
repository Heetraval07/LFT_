// Create (or reset the password of) an admin account. There is no public sign-up page.
//
//   npm run admin:create -- --email you@example.com --name "Your Name"
//
// You'll be asked for the password twice (typing is hidden). For automation, the password can be supplied
// through the ADMIN_PASSWORD environment variable instead. Passwords are stored only as bcrypt hashes.
import 'dotenv/config';
import { createInterface } from 'node:readline';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db.ts';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    out._writeToOutput = (s: string) => { if (s.includes(question)) out.output.write(s); else out.output.write('*'); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}

const email = (arg('email') || '').trim().toLowerCase();
const name = (arg('name') || '').trim();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !name) {
  console.error('Usage: npm run admin:create -- --email you@example.com --name "Your Name"');
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD || '';
if (!password) {
  password = await askHidden('New password (min 12 characters): ');
  const again = await askHidden('Repeat password: ');
  if (password !== again) { console.error('Passwords do not match.'); process.exit(1); }
}
if (password.length < 12) { console.error('Password must be at least 12 characters.'); process.exit(1); }

const passwordHash = await bcrypt.hash(password, 12);
const existing = await db.adminUser.findUnique({ where: { email } });
if (existing) {
  await db.adminUser.update({ where: { email }, data: { name, passwordHash, isActive: true } });
  await db.session.deleteMany({ where: { userId: existing.id } }); // sign out everywhere after a reset
  console.log(`Updated admin ${email} (password reset; existing sessions signed out).`);
} else {
  await db.adminUser.create({ data: { email, name, passwordHash } });
  console.log(`Created admin ${email}.`);
}
await db.$disconnect();
