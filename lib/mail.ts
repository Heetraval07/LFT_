// SMTP email via Nodemailer. Credentials come ONLY from server-side environment variables.
import 'server-only';
import nodemailer from 'nodemailer';

export function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.CONTACT_RECEIVER_EMAIL);
}

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransport() {
  if (transport) return transport;
  const port = Number(process.env.SMTP_PORT || 465);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: (process.env.SMTP_SECURE ?? (port === 465 ? 'true' : 'false')) === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
  return transport;
}

export type Enquiry = { name: string; email: string; phone: string; message: string; ip: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function sendEnquiry(e: Enquiry) {
  const from = process.env.SMTP_USER!; // the authenticated account is always the sender
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' });
  const text = `New enquiry from the LFT website (${when}, Dubai time)

Name:    ${e.name}
Email:   ${e.email}
Phone:   ${e.phone || '—'}

${e.message}

—
Reply to this email to answer ${e.name} directly.`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
<p style="color:#777">New enquiry from the LFT website · ${esc(when)} (Dubai time)</p>
<table style="border-collapse:collapse"><tr><td style="padding:2px 12px 2px 0;color:#777">Name</td><td><b>${esc(e.name)}</b></td></tr>
<tr><td style="padding:2px 12px 2px 0;color:#777">Email</td><td>${esc(e.email)}</td></tr>
<tr><td style="padding:2px 12px 2px 0;color:#777">Phone</td><td>${esc(e.phone || '—')}</td></tr></table>
<p style="white-space:pre-wrap;border-left:3px solid #a6a182;padding-left:12px;margin-top:16px">${esc(e.message)}</p>
<p style="color:#999;font-size:12px">Reply to this email to answer ${esc(e.name)} directly.</p></div>`;
  await getTransport().sendMail({
    from: { name: 'LFT Website', address: from },
    to: process.env.CONTACT_RECEIVER_EMAIL,
    replyTo: { name: e.name, address: e.email }, // visitor's address is ONLY ever the reply-to
    subject: `Website enquiry from ${e.name}`.slice(0, 150),
    text,
    html,
    headers: { 'X-LFT-Client-IP': e.ip },
  });
}
