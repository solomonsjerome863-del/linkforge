import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["21.0.5.33", "47.57.242.119", "linkforge.digital", "www.linkforge.digital"],
};

export default nextConfig;
