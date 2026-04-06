import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* @ts-ignore - allowedDevOrigins is required for IP access in dev */
  allowedDevOrigins: ["192.168.222.85", "renata-unstationed-archetypically.ngrok-free.dev"],
  async rewrites() {
    return [
      {
        source: "/api/v1/rpc/",
        destination: "http://192.168.222.146:8000/api/v1/rpc/",
      },
    ];
  },
};

export default nextConfig;
