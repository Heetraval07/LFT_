// Contact form endpoint: validates, rate-limits and emails the enquiry via SMTP.
// Visitors only ever see generic messages; SMTP errors are logged on the server, never returned.
import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { sendEnquiry, smtpConfigured } from '../../../lib/mail.ts';
import { brand } from '../../../site/data.js';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().max(191).regex(/^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/),
  phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/).refine((v) => v === '' || v.replace(/\D/g, '').length >= 6),
  message: z.string().trim().min(10).max(5000),
  company: z.string().max(0).optional(), // honeypot: real visitors never fill this hidden field
  startedAt: z.number().optional(),
});

// In-memory limits (per server process). Hostinger may restart idle apps, which only ever makes them more lenient.
const hits = new Map<string, number[]>();
const recent = new Map<string, number>();
const WINDOW = 10 * 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW)) hits.delete(k);
  return list.length > MAX_PER_WINDOW;
}

const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: NextRequest) {
  // only accept same-site browser submissions
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== req.headers.get('host')) return fail(403, 'Your message could not be sent.');
  if (!(req.headers.get('content-type') || '').includes('application/json')) return fail(415, 'Your message could not be sent.');

  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown').trim();

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 20_000) return fail(413, 'Your message is too long.');
    body = JSON.parse(raw);
  } catch {
    return fail(400, 'Your message could not be sent.');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? '');
    const msg: Record<string, string> = {
      name: 'Please enter your name.', email: 'Please enter a valid email address.', phone: 'Please enter a valid phone number.',
      message: 'Please tell us a little about your project (at least 10 characters).',
    };
    if (field === 'company') return NextResponse.json({ ok: true }); // bot: pretend success, send nothing
    return fail(422, msg[field] || 'Please check the form and try again.');
  }
  const d = parsed.data;
  if (d.startedAt && Date.now() - d.startedAt < 2500) return NextResponse.json({ ok: true }); // filled in faster than a human can type

  // duplicate guard: the same person sending the same message within 10 minutes is only emailed once
  const key = createHash('sha256').update(`${d.email.toLowerCase()}|${d.message.replace(/\s+/g, ' ').toLowerCase()}`).digest('hex');
  const seen = recent.get(key);
  if (seen && Date.now() - seen < WINDOW) return NextResponse.json({ ok: true, duplicate: true });

  // Only messages that would really be emailed count towards the limit (typos and rejected forms don't).
  if (rateLimited(ip)) return fail(429, `You have sent several messages in a short time. Please wait a few minutes, or call us on ${brand.phone}.`);

  if (!smtpConfigured()) {
    console.error('[contact] SMTP is not configured (SMTP_HOST / SMTP_USER / SMTP_PASSWORD / CONTACT_RECEIVER_EMAIL).');
    return fail(503, `Sorry, our contact form is temporarily unavailable. Please email ${brand.email} or call ${brand.phone}.`);
  }
  try {
    await sendEnquiry({ name: d.name, email: d.email, phone: d.phone, message: d.message, ip });
  } catch (err) {
    console.error('[contact] SMTP send failed:', (err as Error)?.message);
    return fail(502, `Sorry, your message could not be sent. Please try again, or email ${brand.email} or call ${brand.phone}.`);
  }
  recent.set(key, Date.now());
  if (recent.size > 5000) for (const [k, t] of recent) if (Date.now() - t > WINDOW) recent.delete(k);
  return NextResponse.json({ ok: true });
}
