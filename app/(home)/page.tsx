import type { Metadata, Viewport } from 'next';
import LegacyBoot from '../_components/LegacyBoot';
import { getSiteData } from '../../lib/public-data.ts';

// Generated from index.html. The markup below is the original page markup, unchanged.
export const dynamic = 'force-dynamic'; // always read the latest published content
export const metadata: Metadata = {
  title: "LFT Interior Design — Interior Design in Dubai",
  description: "LFT Interior Design LLC is an interior design firm established in 2019, creating residential and commercial interiors that balance functionality, comfort and aesthetics.",
  icons: { icon: { url: '/images/logo/lft-logo.png', type: 'image/png' } },
};
export const viewport: Viewport = { themeColor: "#2a2520", colorScheme: 'dark' };

const MAIN = "\n    <!-- 1. Hero banner -->\n    <section class=\"hero\" id=\"hero\">\n      <div class=\"hero-slides\"></div>\n      <h1 class=\"visually-hidden\">LFT Interior Design</h1>\n    </section>\n\n    <!-- 2. Recent projects (rendered from src/data.js) -->\n    <section class=\"recent\" id=\"recent-projects\" aria-labelledby=\"recent-title\">\n      <h2 id=\"recent-title\" class=\"visually-hidden\">Recent projects</h2>\n      <div class=\"recent-grid\" id=\"home-projects\"></div>\n    </section>\n\n    <!-- 3. Partners marquee (rendered from `partners` in src/data.js) -->\n    <section class=\"partners\" id=\"partners\" aria-label=\"Our partners and clients\">\n      <p class=\"partners-label\" data-reveal>Our partners & clients</p>\n      <div class=\"partners-marquee\" id=\"home-partners\" data-reveal></div>\n    </section>\n  ";

export default async function Page() {
  const data = await getSiteData({ projects: true });
  return (
    <>
      <main dangerouslySetInnerHTML={{ __html: MAIN }} />
      <LegacyBoot data={data} />
    </>
  );
}
