import type { NextConfig } from "next";

// GitHub Pages serves this project site from /expenses (repo name), so the
// build needs that base path baked in. Keep local `next dev` at the root by
// only applying it inside GitHub Actions.
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const basePath = isGithubActions ? "/expenses" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
