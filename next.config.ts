import type { NextConfig } from 'next';

// Every original URL keeps working: /about.html etc. are served by the matching Next.js route.
const htmlPages = ['about', 'services', 'projects', 'project', 'contact', 'terms', 'privacy'];

const nextConfig: NextConfig = {
  output: 'standalone', // Hostinger starts Next.js's standalone server
  poweredByHeader: false,
  // Optional: comma-separated hostnames (e.g. "www.example.com,example.com") allowed to submit admin forms when a
  // proxy changes the Host header. Leave unset normally.
  experimental: {
    serverActions: { allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean) },
  },
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-mariadb', 'mariadb'],
  async rewrites() {
    return [
      { source: '/index.html', destination: '/' },
      ...htmlPages.map((p) => ({ source: `/${p}.html`, destination: `/${p}` })),
    ];
  },
};

export default nextConfig;
