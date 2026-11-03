// Admin authentication: bcrypt password hashes, database-backed sessions in an HTTP-only cookie,
// and login throttling. Server-only.
import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from './db.ts';

export const SESSION_COOKIE = 'lft_admin';
const SESSION_HOURS = 12;
const BCRYPT_ROUNDS = 12;

export const hashPassword = (pw: string) => bcrypt.hash(pw, BCRYPT_ROUNDS);
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export async function clientIp() {
  const h = await headers();
  return (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim().slice(0, 64);
}

// ---------- login throttling (persisted, so restarts don't reset it) ----------
const WINDOW_MIN = 15;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

async function recentFailures(key: string) {
  const since = new Date(Date.now() - WINDOW_MIN * 60_000);
  return db.loginAttempt.count({ where: { key, success: false, createdAt: { gte: since } } });
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(emailRaw: string, password: string): Promise<LoginResult> {
  const email = emailRaw.trim().toLowerCase();
  const ip = await clientIp();
  const [byEmail, byIp] = await Promise.all([recentFailures(`email:${email}`), recentFailures(`ip:${ip}`)]);
  if (byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP) {
    return { ok: false, error: `Too many failed attempts. Please wait ${WINDOW_MIN} minutes and try again.` };
  }

  const user = await db.adminUser.findUnique({ where: { email } });
  // Always run a bcrypt comparison so response time doesn't reveal whether the email exists.
  const valid = await bcrypt.compare(password, user?.passwordHash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
  const ok = Boolean(user && user.isActive && valid);

  await db.loginAttempt.createMany({ data: [{ key: `email:${email}`, success: ok }, { key: `ip:${ip}`, success: ok }] });
  if (!ok || !user) return { ok: false, error: 'Incorrect email or password.' };

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3_600_000);
  const ua = ((await headers()).get('user-agent') || '').slice(0, 255);
  await db.session.create({ data: { tokenHash: sha256(token), userId: user.id, expiresAt, userAgent: ua } });
  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  // housekeeping: drop expired sessions and old attempt rows
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 7 * 86_400_000) } } });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

export type Admin = { id: number; email: string; name: string };

export async function currentAdmin(): Promise<Admin | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const s = await db.session.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!s || s.expiresAt < new Date() || !s.user.isActive) return null;
  // refresh "last seen" at most once a minute
  if (Date.now() - s.lastSeenAt.getTime() > 60_000) await db.session.update({ where: { id: s.id }, data: { lastSeenAt: new Date() } });
  return { id: s.user.id, email: s.user.email, name: s.user.name };
}

// Use at the top of every admin page and every admin server action.
export async function requireAdmin(): Promise<Admin> {
  const admin = await currentAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}
