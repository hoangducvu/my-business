import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // Charm photos change only when a piece is re-shot, so let the browser
        // and CDN hold on to them instead of revalidating all 181 on every visit.
        source: '/charms/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=604800' },
        ],
      },
    ]
  },
};

export default nextConfig;
