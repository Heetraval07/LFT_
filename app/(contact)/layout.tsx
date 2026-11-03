import SiteDocument from '../_components/SiteDocument';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SiteDocument fonts="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Manrope:wght@400;500;600&family=Montserrat:wght@300;400;500;600;700;800&display=swap" page="contact" bodyClass="has-dark-hero page-contact" bg="#1b1b1b">
      {children}
    </SiteDocument>
  );
}
