import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  allowedDevOrigins: ["*"],
  async headers() {
    return [
      {
        // Only apply no-store to HTML pages, not static assets
        source: "/:path((?!_next/static|_next/image|favicon|icon|manifest|og-image).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
