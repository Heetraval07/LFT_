import type { Metadata, Viewport } from 'next';
import LegacyBoot from '../../_components/LegacyBoot';

// Generated from privacy.html. The markup below is the original page markup, unchanged.
export const dynamic = 'force-dynamic'; // always read the latest published content
export const metadata: Metadata = {
  title: "Privacy Policy — LFT Interior Design",
  description: "How LFT Interior Design collects and uses personal information.",
  icons: { icon: { url: '/images/logo/lft-logo.png', type: 'image/png' } },
};
export const viewport: Viewport = { themeColor: "#fbf9f5", colorScheme: 'light' };

const MAIN = "\n    <section class=\"page-hero page-hero-plain\" style=\"min-height:44vh\">\n      <div class=\"container\">\n        <p class=\"eyebrow\">Legal</p>\n        <h1 class=\"display\">Privacy Policy</h1>\n      </div>\n    </section>\n    <section class=\"section\" style=\"padding-top:clamp(24px,4vw,56px)\">\n      <div class=\"container legal\">\n\n        <p class=\"muted\">Last updated: 2026</p>\n        <h2>1. Who we are</h2>\n        <p>LFT Interior Design LLC (“LFT”, “we”, “us”) is an interior design firm based at Ithraa Tower, Al Garhoud, Dubai, UAE. This policy explains how we handle personal information collected through this website.</p>\n        <h2>2. Information we collect</h2>\n        <p>When you contact us through the enquiry form, by email or by phone, we collect the details you choose to give us, such as your name, email address, phone number, the service you are interested in, your approximate budget and your message.</p>\n        <h2>3. How we use it</h2>\n        <p>We use this information to respond to your enquiry, prepare proposals and, where you become a client, to deliver our services. We do not sell your personal information.</p>\n        <h2>4. Sharing</h2>\n        <p>We share information only with trusted service providers who help us operate our business (for example email or IT providers), or where required by law.</p>\n        <h2>5. Retention and security</h2>\n        <p>We keep enquiry information only as long as needed for the purposes above, and take reasonable steps to protect it from loss or unauthorised access.</p>\n        <h2>6. Cookies and third parties</h2>\n        <p>This site may load fonts and an embedded map from third-party providers, which may receive technical information such as your IP address. Social media links take you to external sites with their own privacy policies.</p>\n        <h2>7. Your choices</h2>\n        <p>You may ask us to access, correct or delete the personal information we hold about you by contacting us.</p>\n        <h2>8. Contact</h2>\n        <p>Privacy questions: <a href=\"mailto:info@lftinteriors.com\">info@lftinteriors.com</a> · <a href=\"tel:+97142829773\">04 282 9773</a>.</p>\n\n      </div>\n    </section>\n  ";

export default async function Page() {
  const data = {};
  return (
    <>
      <main dangerouslySetInnerHTML={{ __html: MAIN }} />
      <LegacyBoot data={data} />
    </>
  );
}
