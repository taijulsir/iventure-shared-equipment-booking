import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a minimal, self-contained server bundle (.next/standalone) that
  // only includes the production dependencies actually reachable from the
  // build, instead of requiring the full node_modules tree at runtime.
  // This is what the production Docker image copies into its runtime
  // stage — see frontend/Dockerfile.
  output: "standalone",
};

export default nextConfig;
