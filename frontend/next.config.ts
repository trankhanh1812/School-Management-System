import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["neritic-yareli-monomeric.ngrok-free.dev"],
  async rewrites() {
    const backendApiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api").replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiBase}/:path*`,
      },
    ];
  },
  /* config options here */
};

export default nextConfig;
