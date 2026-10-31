// Builds trimmed dark + light logo variants from LFT-logo.png (original is left untouched).
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const b = await chromium.launch();
const p = await b.newPage();
const src = 'data:image/png;base64,' + readFileSync('LFT-logo.png').toString('base64');
const out = await p.evaluate(async (s) => {
  const img = new Image();
  img.src = s;
  await img.decode();
  const [x0, y0, x1, y1] = [35, 28, 542, 409]; // content bounds, measured separately
  const pad = 4;
  const w = x1 - x0 + 1 + pad * 2, h = y1 - y0 + 1 + pad * 2;
  const make = (light) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.drawImage(img, x0 - pad, y0 - pad, w, h, 0, 0, w, h);
    if (light) {
      const id = g.getImageData(0, 0, w, h);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        // near-black (and dark-grey antialiasing) -> white, keep alpha; gold untouched
        const max = Math.max(d[i], d[i + 1], d[i + 2]);
        if (d[i + 3] > 0 && max < 110) { const k = 1 - max / 110; d[i] = d[i] + (255 - d[i]) * k; d[i + 1] = d[i + 1] + (255 - d[i + 1]) * k; d[i + 2] = d[i + 2] + (255 - d[i + 2]) * k; }
      }
      g.putImageData(id, 0, 0);
    }
    return c.toDataURL('image/png').split(',')[1];
  };
  return { dark: make(false), light: make(true), w, h };
}, src);
mkdirSync('public/images/logo', { recursive: true });
writeFileSync('public/images/logo/lft-logo.png', Buffer.from(out.dark, 'base64'));
writeFileSync('public/images/logo/lft-logo-light.png', Buffer.from(out.light, 'base64'));
console.log('logos', out.w + 'x' + out.h);
await b.close();
