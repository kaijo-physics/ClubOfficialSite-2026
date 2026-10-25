import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/articles/*": ["./content/articles/**/*"],
    "/article-assets/*": ["./content/articles/**/*"],
  },
};

export default nextConfig;
