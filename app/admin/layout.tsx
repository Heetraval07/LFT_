import './admin.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { default: 'LFT Admin', template: '%s — LFT Admin' },
  robots: { index: false, follow: false }, // keep the admin out of search engines
  icons: { icon: { url: '/images/logo/lft-logo.png', type: 'image/png' } },
};

export default function AdminRoot({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
