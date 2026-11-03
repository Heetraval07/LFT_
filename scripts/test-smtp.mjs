// Checks your real SMTP login and sends ONE test email, using the same settings as the contact form.
//   npm.cmd run test:smtp
// Reads .env.local first, then .env. Prints only success/failure; the password is never shown.
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, CONTACT_RECEIVER_EMAIL } = process.env;
const missing = Object.entries({ SMTP_HOST, SMTP_USER, SMTP_PASSWORD, CONTACT_RECEIVER_EMAIL }).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error(`Missing in .env.local: ${missing.join(', ')}`);
  process.exit(1);
}
if (/\s/.test(SMTP_PASSWORD)) console.warn('Note: SMTP_PASSWORD contains spaces. Gmail shows app passwords in groups of 4; remove the spaces.');

const port = Number(SMTP_PORT || 465);
const transport = nodemailer.createTransport({
  host: SMTP_HOST, port, secure: (SMTP_SECURE ?? (port === 465 ? 'true' : 'false')) === 'true',
  auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
});

try {
  await transport.verify();
  console.log(`Login OK (${SMTP_HOST}:${port} as ${SMTP_USER}).`);
  await transport.sendMail({
    from: { name: 'LFT Website', address: SMTP_USER },
    to: CONTACT_RECEIVER_EMAIL,
    replyTo: { name: 'Test Visitor', address: 'test.visitor@example.com' },
    subject: 'LFT website SMTP test',
    text: 'This is a test message from your local LFT website. If you can read it, SMTP works.\n\nPress Reply: the To address should be test.visitor@example.com.',
  });
  console.log(`Test email sent to ${CONTACT_RECEIVER_EMAIL}. Check the inbox (and Spam).`);
} catch (e) {
  console.error('FAILED:', e.code || '', e.responseCode || '', (e.message || '').split('\n')[0]);
  if (e.responseCode === 535 || e.code === 'EAUTH') console.error('Gmail rejected the login: use an App Password (needs 2-Step Verification on), not your normal password.');
  process.exit(1);
}
