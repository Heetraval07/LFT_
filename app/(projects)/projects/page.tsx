import type { Metadata, Viewport } from 'next';
import LegacyBoot from '../../_components/LegacyBoot';
import { getSiteData } from '../../../lib/public-data.ts';

// Generated from projects.html. The markup below is the original page markup, unchanged.
export const dynamic = 'force-dynamic'; // always read the latest published content
export const metadata: Metadata = {
  title: "Our Projects — LFT Interior Design",
  description: "Completed interior design and fit-out projects by LFT Interior Design LLC: residential, commercial, kitchens and joinery.",
  icons: { icon: { url: '/images/logo/lft-logo.png', type: 'image/png' } },
};
export const viewport: Viewport = { themeColor: "#1b1b1b", colorScheme: 'dark' };

const MAIN = "";

export default async function Page() {
  const data = await getSiteData({ projects: true });
  return (
    <>
      <main id="projects-page" dangerouslySetInnerHTML={{ __html: MAIN }} />
      <LegacyBoot data={data} />
    </>
  );
}
