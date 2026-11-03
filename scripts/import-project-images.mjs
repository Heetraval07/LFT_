// Copies the LFT team's project photos from images/<folder> into public/images/projects/<slug>/NN.jpg.
// Files are copied byte-for-byte (they are already web-sized, 720-1600px, 45-360KB), so quality is untouched.
import { readdirSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const folders = {
  'dopamine-oasis-mall': 'Dopamine',
  'eyewa-masdar': 'Eyewa/Masdar',
  'eyewa-al-barsha': 'Eyewa/Al Barsha',
  'eyewa-ssmc': 'Eyewa/Medical city Abudhabi',
  'eyewa-festival-plaza': 'Eyewa/Festival Plaza',
  'eyewa-arabian-center': 'Eyewa/Arabian Center_',
  'jargee-deerfield': 'Jargee/jargee deerfield',
  'jargee-bawabat-al-sharq': 'Jargee/Jargee Sharq Mall',
};

const map = {};
for (const [slug, dir] of Object.entries(folders)) {
  const files = readdirSync(join('images', dir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  const outDir = join('public', 'images', 'projects', slug);
  mkdirSync(outDir, { recursive: true });
  map[slug] = files.map((f, i) => {
    const name = String(i + 1).padStart(2, '0') + '.jpg';
    copyFileSync(join('images', dir, f), join(outDir, name));
    return { name, source: `${dir}/${f}` };
  });
  console.log(slug.padEnd(26), files.length);
}
writeFileSync(join('scripts', 'project-image-sources.json'), JSON.stringify(map, null, 2)); // which original file each NN.jpg came from
