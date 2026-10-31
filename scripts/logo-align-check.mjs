// Verifies the navbar logo and footer logo share the same left edge at every breakpoint and on every page,
// with and without classic (always-visible) scrollbars, and that logo size/proportions are unchanged.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const mode = process.argv[2] || 'check';
const widths = [360, 390, 600, 601, 820, 1024, 1100, 1101, 1199, 1200, 1230, 1280, 1366, 1440, 1536, 1920, 2560];
const pages = ['/', '/about.html', '/services.html', '/projects.html', '/project.html?p=linden-house', '/contact.html', '/terms.html', '/privacy.html'];
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };

async function measure(page) {
  return page.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const hdrImg = [...document.querySelectorAll('.hdr-main .hdr-logo img, .hdr-mobile .hdr-logo img')].find(vis);
    const stk = document.querySelector('.hdr-sticky .hdr-logo img');
    const ftr = document.querySelector('.footer-logo img');
    const lay = (el) => { let x = 0; for (let n = el; n; n = n.offsetParent) x += n.offsetLeft; return x; }; // layout position (ignores the hidden sticky bar's flip transform)
    const mainImg = hdrImg.closest('.hdr-main') ? hdrImg : null; // the variant that is actually visible (dark on light pages)
    const h = hdrImg.getBoundingClientRect(), f = ftr.getBoundingClientRect(), s = stk && mainImg ? { width: 1, left: lay(stk) - lay(mainImg) + h.left } : null;
    return {
      hdrLeft: +h.left.toFixed(2), ftrLeft: +f.left.toFixed(2), stkLeft: s && s.width ? +s.left.toFixed(2) : null,
      hdrH: Math.round(h.height), ftrH: Math.round(f.height), hdrR: +(h.width / h.height).toFixed(3), ftrR: +(f.width / f.height).toFixed(3),
      ov: document.documentElement.scrollWidth > document.documentElement.clientWidth, vw: document.documentElement.clientWidth,
    };
  });
}

for (const scrollbars of [false, true]) {
  const b = await chromium.launch(scrollbars ? { ignoreDefaultArgs: ['--hide-scrollbars'] } : {});
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const bad = [];
  const table = [];
  for (const w of widths) {
    await p.setViewportSize({ width: w, height: 900 });
    const lefts = new Set();
    for (const u of pages) {
      await p.goto(base + u, { waitUntil: 'networkidle' });
      await p.waitForTimeout(250);
      const m = await measure(p);
      const expH = w >= 1200 ? 52 : 40;
      lefts.add(`${m.hdrLeft}|${m.ftrLeft}`);
      if (Math.abs(m.hdrLeft - m.ftrLeft) > 0.6) bad.push(`${w}px ${u}: header ${m.hdrLeft} vs footer ${m.ftrLeft}`);
      if (m.stkLeft !== null && Math.abs(m.stkLeft - m.hdrLeft) > 0.6) bad.push(`${w}px ${u}: sticky ${m.stkLeft} vs header ${m.hdrLeft}`);
      if (m.hdrH !== expH || m.ftrH !== 52 || Math.abs(m.hdrR - 1.323) > 0.02 || Math.abs(m.ftrR - 1.323) > 0.02) bad.push(`${w}px ${u}: size/ratio changed ${JSON.stringify(m)}`);
      if (m.ov) bad.push(`${w}px ${u}: horizontal overflow`);
    }
    const [h, f] = [...lefts][0].split('|');
    table.push(`${w}:${h}/${f}${lefts.size > 1 ? '*' : ''}`);
  }
  console.log(`  [${scrollbars ? 'classic scrollbars' : 'overlay scrollbars'}] header/footer logo left edge by width: ${table.join('  ')}`);
  if (mode === 'measure') { await b.close(); continue; }
  check(`${scrollbars ? 'with classic scrollbars' : 'no scrollbars'}: header, sticky bar and footer logo share one left edge on all ${pages.length} pages at ${widths.length} widths; size unchanged; no overflow`, bad.length === 0, bad.slice(0, 4).join(' || '));
  await b.close();
}
if (mode !== 'measure') {
  const f = res.filter((r) => !r).length;
  console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
  process.exitCode = f ? 1 : 0;
}
