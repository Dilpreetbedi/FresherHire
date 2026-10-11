import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "https://fresherhire.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;
