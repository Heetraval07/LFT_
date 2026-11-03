import type { Metadata, Viewport } from 'next';
import LegacyBoot from '../../_components/LegacyBoot';

// Generated from contact.html. The markup below is the original page markup, unchanged.
export const dynamic = 'force-dynamic'; // always read the latest published content
export const metadata: Metadata = {
  title: "Contact Us — LFT Interior Design",
  description: "Contact LFT Interior Design LLC at Ithraa Tower, Al Garhoud, Dubai. Call 04 282 9773 or email info@lftinteriors.com.",
  icons: { icon: { url: '/images/logo/lft-logo.png', type: 'image/png' } },
};
export const viewport: Viewport = { themeColor: "#1b1b1b", colorScheme: 'dark' };

const MAIN = "";

export default async function Page() {
  const data = {};
  return (
    <>
      <main id="contact-page" dangerouslySetInnerHTML={{ __html: MAIN }} />
      <LegacyBoot data={data} />
    </>
  );
}
