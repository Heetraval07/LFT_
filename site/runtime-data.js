// Content that comes from the database. The server renders it into the page (see app/_components/LegacyBoot.tsx)
// and these browser scripts read it from window.__LFT_DATA__ before rendering.
export const runtime = (typeof window !== 'undefined' && window.__LFT_DATA__) || {};
