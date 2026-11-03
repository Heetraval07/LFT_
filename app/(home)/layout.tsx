import SiteDocument from '../_components/SiteDocument';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SiteDocument fonts="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Manrope:wght@400;500;600&family=Montserrat:wght@500;600&display=swap" page="home" bodyClass="has-dark-hero" bg="#2a2520" preloadImage="/images/1571460.jpg">
      {children}
    </SiteDocument>
  );
}
