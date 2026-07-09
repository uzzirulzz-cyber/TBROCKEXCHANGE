import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Keep Prisma + bcryptjs as external packages in standalone mode.
  // Without this, Next.js tries to bundle them and the Prisma engine
  // binaries + bcrypt native bindings don't get included, causing
  // "Internal server error" on every API route that touches the DB.
  serverExternalPackages: ["@prisma/client", "bcryptjs", "mongodb"],
  // Map path-style URLs to the single / route with a ?view= param.
  async rewrites() {
    return [
      { source: "/storefront", destination: "/?view=home" },
      { source: "/home", destination: "/?view=home" },
      { source: "/admin", destination: "/?view=admin" },
      { source: "/admin-login", destination: "/?view=admin-login" },
      { source: "/login", destination: "/?view=login" },
      { source: "/register", destination: "/?view=register" },
      { source: "/trade", destination: "/?view=trade" },
      { source: "/wallet", destination: "/?view=wallet" },
    ];
  },
};

export default nextConfig;
