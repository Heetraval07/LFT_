import type { Metadata, Viewport } from 'next';
import LegacyBoot from '../../_components/LegacyBoot';

// Generated from terms.html. The markup below is the original page markup, unchanged.
export const dynamic = 'force-dynamic'; // always read the latest published content
export const metadata: Metadata = {
  title: "Terms and Conditions — LFT Interior Design",
  description: "Terms and conditions for using the LFT Interior Design website.",
  icons: { icon: { url: '/images/logo/lft-logo.png', type: 'image/png' } },
};
export const viewport: Viewport = { themeColor: "#fbf9f5", colorScheme: 'light' };

const MAIN = "\n    <section class=\"page-hero page-hero-plain\" style=\"min-height:44vh\">\n      <div class=\"container\">\n        <p class=\"eyebrow\">Legal</p>\n        <h1 class=\"display\">Terms and Conditions</h1>\n      </div>\n    </section>\n    <section class=\"section\" style=\"padding-top:clamp(24px,4vw,56px)\">\n      <div class=\"container legal\">\n\n        <p class=\"muted\">Last updated: 2026</p>\n        <h2>1. About these terms</h2>\n        <p>This website is operated by LFT Interior Design LLC (“LFT”, “we”, “us”). By using the site you agree to these terms. If you do not agree, please do not use the site.</p>\n        <h2>2. Use of the website</h2>\n        <p>The content on this website is provided for general information about our interior design services. You may view and share pages for personal, non-commercial purposes. You must not copy, modify or redistribute our content, images or branding without our written permission.</p>\n        <h2>3. Projects and images</h2>\n        <p>Project descriptions and imagery are illustrative. Final scope, design, materials, timelines and costs for any commission are set out in a written agreement between LFT and the client.</p>\n        <h2>4. Enquiries</h2>\n        <p>Submitting an enquiry does not create a contract. A formal proposal or agreement is required before any work begins.</p>\n        <h2>5. Intellectual property</h2>\n        <p>All logos, designs, text and images on this site belong to LFT Interior Design LLC or its licensors and are protected by applicable intellectual-property laws.</p>\n        <h2>6. Liability</h2>\n        <p>We take care to keep the site accurate and available, but provide it “as is”. To the extent permitted by law, we are not liable for losses arising from use of the site or reliance on its content.</p>\n        <h2>7. Changes</h2>\n        <p>We may update these terms from time to time. The current version is always available on this page.</p>\n        <h2>8. Contact</h2>\n        <p>Questions about these terms: <a href=\"mailto:info@lftinteriors.com\">info@lftinteriors.com</a> · <a href=\"tel:+97142829773\">04 282 9773</a> · Ithraa Tower, Al Garhoud, Dubai, UAE.</p>\n\n      </div>\n    </section>\n  ";

export default async function Page() {
  const data = {};
  return (
    <>
      <main dangerouslySetInnerHTML={{ __html: MAIN }} />
      <LegacyBoot data={data} />
    </>
  );
}
