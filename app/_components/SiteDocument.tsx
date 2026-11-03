// Shared <html>/<head>/<body> for every public page. Mirrors the original static HTML pages exactly:
// same critical inline style, fonts, stylesheet and <body> attributes the page scripts rely on.
import '../../site/styles.css';
import type { ReactNode } from 'react';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Manrope:wght@400;500;600&family=Montserrat:wght@300;400;500;600;700;800&display=swap';

export default function SiteDocument(props: {
  page: string; fonts?: string; bodyClass?: string; bg: string; scheme?: 'dark' | 'light'; preloadImage?: string; children: ReactNode;
}) {
  const scheme = props.scheme ?? 'dark';
  const critical = `html{background:${props.bg};color-scheme:${scheme}}body{margin:0}.visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}`;
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: critical }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href={props.fonts || FONTS} rel="stylesheet" />
        {props.preloadImage ? <link rel="preload" as="image" href={props.preloadImage} fetchPriority="high" /> : null}
      </head>
      <body data-page={props.page} className={props.bodyClass || undefined} id="top" suppressHydrationWarning>
        {props.children}
      </body>
    </html>
  );
}
