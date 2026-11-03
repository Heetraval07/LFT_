// Small helpers describing WHICH environment this copy of the app is running in (all from environment variables).
import 'server-only';

// APP_ENV is a free label ("staging", "production", "local"). It changes nothing about behaviour; it is only shown
// in the admin so people can tell the copies apart.
export const appEnv = () => (process.env.APP_ENV || '').trim().toLowerCase() || (process.env.NODE_ENV === 'production' ? 'production' : 'local');

// Database name only (never the host, user or password), for display and safety prompts.
export function databaseName(url = process.env.DATABASE_URL || '') {
  const m = url.match(/^mysql:\/\/[^/]+\/([^?]+)/i);
  return m ? decodeURIComponent(m[1]) : 'unknown';
}
