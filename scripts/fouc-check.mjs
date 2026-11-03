// Detects flash of unstyled content: slows down scripts (and, separately, the stylesheet) and inspects
// what the browser has painted/can paint BEFORE the app finishes loading.
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:5173';
const mode = process.argv[2] || 'check';
const pages = ['/', '/about.html', '/services.html', '/projects.html', '/project.html?p=dopamine-oasis-mall', '/contact.html', '/terms.html', '/privacy.html'];
const b = await chromium.launch();
const res = [];
const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };

// What a visitor would see while only the HTML (and whatever is render-blocking) has arrived.
async function earlyState(url, { delayJs = 2500, delayCss = 0 } = {}) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.route(/\/(src\/.*\.js|@vite\/client|node_modules\/.*|assets\/.*\.js|_next\/static\/.*\.js)(\?.*)?$/, async (r) => { await new Promise((x) => setTimeout(x, delayJs)); r.continue(); });
  if (delayCss) await p.route(/\.css(\?.*)?$/, async (r) => { await new Promise((x) => setTimeout(x, delayCss)); r.continue(); });
  await p.goto(base + url, { waitUntil: 'commit' });
  await p.waitForTimeout(900);
  const cdp = await ctx.newCDPSession(p);
  const early = Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png' })).data, 'base64');
  const info = await p.evaluate(() => {
    const cs = (e) => getComputedStyle(e);
    const h1 = document.querySelector('h1.visually-hidden');
    const bodyBg = cs(document.body).backgroundColor;
    const htmlBg = cs(document.documentElement).backgroundColor;
    // visible, in-flow text that is still unstyled (default serif font on a static element)
    const looksUnstyled = [...document.querySelectorAll('main *, body > *')].some((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 40 && r.height > 8 && /Times/i.test(cs(e).fontFamily) && (e.innerText || '').trim().length > 0 && cs(e).visibility !== 'hidden';
    });
    return {
      state: document.readyState,
      bodyFont: cs(document.body).fontFamily.slice(0, 30),
      bodyBg, htmlBg,
      hiddenH1Clipped: h1 ? cs(h1).position === 'absolute' && h1.getBoundingClientRect().width <= 2 : true,
      looksUnstyled,
      sheets: [...document.styleSheets].filter((s) => { try { return s.cssRules.length > 50; } catch { return true; } }).length,
    };
  });
  await ctx.close();
  return { ...info, shot: early };
}

if (mode === 'repro') {
  const r = await earlyState('/');
  console.log(JSON.stringify({ ...r, shot: undefined }));
  const { writeFileSync } = await import('node:fs');
  writeFileSync('screenshots/fouc-repro.png', r.shot);
  await b.close();
  process.exit(0);
}

for (const u of pages) {
  const r = await earlyState(u);
  const px = await (async () => { // sample the early screenshot's top-left + centre colours
    const p = await (await b.newContext()).newPage();
    await p.setContent(`<img id=i src="data:image/png;base64,${r.shot.toString('base64')}"><canvas id=c></canvas>`);
    return p.evaluate(async () => { const i = document.getElementById('i'); await i.decode(); const c = document.getElementById('c'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); const s = (x, y) => Array.from(g.getImageData(x, y, 1, 1).data.slice(0, 3)); return { tl: s(10, 10), mid: s(720, 450), br: s(1430, 890) }; });
  })();
  const light = (c) => c.every((v) => v > 252); // only a pure-white frame counts as a flash (Terms/Privacy are intentionally cream)
  check(`${u}: stylesheet already applied before scripts run (body font ${r.bodyFont})`, r.sheets >= 1 && !/Times/i.test(r.bodyFont));
  check(`${u}: no default-styled (Times) text visible early`, !r.looksUnstyled && r.hiddenH1Clipped);
  check(`${u}: early screen shows the page colour, not a white flash (${px.tl}/${px.mid})`, !light(px.tl) && !light(px.mid));
}

// stylesheet slow: the browser must wait (blank dark canvas) rather than paint unstyled HTML
{
  const r = await earlyState('/', { delayJs: 0, delayCss: 2500 });
  check('slow stylesheet: nothing is painted unstyled (page waits, canvas already dark)', !r.looksUnstyled && r.hiddenH1Clipped !== undefined);
  const p = await (await b.newContext()).newPage();
  await p.setContent(`<img id=i src="data:image/png;base64,${r.shot.toString('base64')}"><canvas id=c></canvas>`);
  const px = await p.evaluate(async () => { const i = document.getElementById('i'); await i.decode(); const c = document.getElementById('c'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); return Array.from(g.getImageData(720, 450, 1, 1).data.slice(0, 3)); });
  check(`slow stylesheet: canvas is dark while waiting (${px})`, !px.every((v) => v > 235));
}
await b.close();
const f = res.filter((r) => !r).length;
console.log(f ? `${f} failed` : `All ${res.length} checks passed`);
process.exitCode = f ? 1 : 0;
