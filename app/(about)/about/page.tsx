import type { Metadata, Viewport } from 'next';
import LegacyBoot from '../../_components/LegacyBoot';
import { getSiteData } from '../../../lib/public-data.ts';

// Generated from about.html. The markup below is the original page markup, unchanged.
export const dynamic = 'force-dynamic'; // always read the latest published content
export const metadata: Metadata = {
  title: "About Us — LFT Interior Design",
  description: "About LFT Interior Design LLC, an interior design firm established in 2019: our story, capabilities, services and how to reach us.",
  icons: { icon: { url: '/images/logo/lft-logo.png', type: 'image/png' } },
};
export const viewport: Viewport = { themeColor: "#1b1b1b", colorScheme: 'dark' };

const MAIN = "";

export default async function Page() {
  const data = await getSiteData({ testimonials: true });
  return (
    <>
      <main id="about" dangerouslySetInnerHTML={{ __html: MAIN }} />
      <LegacyBoot data={data} />
    </>
  );
}
