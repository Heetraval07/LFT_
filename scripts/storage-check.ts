// The technical deployment test for photo storage. Replaces the old admin page.
//
//   npm run storage:check
//
// Run it over SSH in the app folder. It reports the same state the website uses to decide whether uploads are allowed.
// Normally you don't need it: the website performs this check by itself every time it starts. Use it to confirm
// after a redeploy, or when setting up a new server.
import 'dotenv/config';
import { inspectStorage, deployId, MARKER } from '../lib/storage-core.ts';

const refs = async () => {
  const { db } = await import('../lib/db.ts');
  const [a, b, c] = await Promise.all([
    db.projectImage.findMany({ where: { path: { startsWith: '/uploads/' } }, select: { path: true } }),
    db.testimonial.findMany({ where: { photoPath: { startsWith: '/uploads/' } }, select: { photoPath: true } }),
    db.testimonial.findMany({ where: { logoPath: { startsWith: '/uploads/' } }, select: { logoPath: true } }),
  ]);
  return [...a.map((x) => x.path), ...b.map((x) => x.photoPath!), ...c.map((x) => x.logoPath!)];
};

const s = await inspectStorage(refs);
const env = (process.env.APP_ENV || '').trim() || '(APP_ENV not set)';
console.log(`Photo folder : ${s.dir || '(UPLOAD_DIR not set)'}`);
console.log(`This deploy  : ${deployId()}`);
console.log(`Marker file  : ${MARKER}  (${s.deployments} deployment(s) seen)`);
console.log(`State        : ${s.state.toUpperCase()} — ${s.reason}`);
console.log('');
switch (s.state) {
  case 'confirmed':
    console.log('RESULT: PASS. The photo folder survived a redeployment. Uploads are allowed (staging and production).');
    break;
  case 'provisional':
    console.log(`RESULT: PENDING. Uploads are allowed on staging/local with a warning${env === 'production' ? ', but BLOCKED here because APP_ENV=production' : ''}.`);
    console.log('NEXT STEP: redeploy the website once (or push any commit), then run this again. A later deployment that still finds');
    console.log('the marker proves the folder is persistent, and the state becomes CONFIRMED automatically.');
    break;
  case 'lost':
    console.log('RESULT: FAIL. Photos used by the website are missing. Uploads are blocked. Restore the uploads backup into the folder.');
    break;
  default:
    console.log('RESULT: NOT READY. Fix the reason above (see DEPLOYMENT.md, "Photo storage").');
}
process.exit(s.state === 'confirmed' ? 0 : s.state === 'provisional' ? 2 : 1);
