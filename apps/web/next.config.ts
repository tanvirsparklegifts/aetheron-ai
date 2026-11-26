import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const nextConfig: NextConfig = {
  output: "export",
  basePath: isProduction ? "/aetheron-ai" : "",
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true
};

export default nextConfig;
