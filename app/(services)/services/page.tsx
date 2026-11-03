import type { Metadata, Viewport } from 'next';
import LegacyBoot from '../../_components/LegacyBoot';

// Generated from services.html. The markup below is the original page markup, unchanged.
export const dynamic = 'force-dynamic'; // always read the latest published content
export const metadata: Metadata = {
  title: "Our Services — LFT Interior Design",
  description: "Interior design and fit-out services by LFT Interior Design LLC: commercial, restaurants, retail, hospitality, villas, joinery and more.",
  icons: { icon: { url: '/images/logo/lft-logo.png', type: 'image/png' } },
};
export const viewport: Viewport = { themeColor: "#1b1b1b", colorScheme: 'dark' };

const MAIN = "";

export default async function Page() {
  const data = {};
  return (
    <>
      <main id="services-page" dangerouslySetInnerHTML={{ __html: MAIN }} />
      <LegacyBoot data={data} />
    </>
  );
}
