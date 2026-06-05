import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages with @cloudflare/next-on-pages adapter
  // Edge runtime is required for routes that hit external APIs.
};

export default nextConfig;
