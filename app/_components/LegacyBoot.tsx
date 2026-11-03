'use client';
// Hands the server-loaded content to the website's existing browser scripts, then starts them.
// The scripts (site/*.js) build the header, page sections and footer exactly as before.
import { useEffect } from 'react';

declare global {
  interface Window { __LFT_DATA__?: unknown; __LFT_STARTED__?: boolean }
}

export default function LegacyBoot({ data }: { data: unknown }) {
  useEffect(() => {
    if (window.__LFT_STARTED__) return; // React may run effects twice in development
    window.__LFT_STARTED__ = true;
    window.__LFT_DATA__ = data ?? {};
    import('../../site/main.js');
  }, [data]);
  return null;
}
