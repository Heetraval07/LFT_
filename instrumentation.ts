// Runs once each time the website server starts. It silently records this deployment in the photo folder's marker
// file, which is how the site proves (without anyone doing anything) that uploaded photos survive redeployments.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  try {
    const { storageStatus } = await import('./lib/storage.ts');
    const s = await storageStatus(true);
    console.log(`[storage] photo folder: ${s.state} — ${s.reason}`);
  } catch (e) {
    console.error('[storage] startup check failed:', (e as Error).message);
  }
}
