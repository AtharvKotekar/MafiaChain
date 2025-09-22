import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable for Mini App iframe embedding
  async headers() {
    return [
      {
        source: '/miniapp/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.farcaster.xyz https://*.warpcast.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
