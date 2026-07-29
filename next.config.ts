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
  // Client code fetches /market-data.json from the site's own origin, which
  // sits under the base path on GitHub Pages. next/link and next/image get
  // the prefix applied for them; a raw fetch() doesn't, so it's exposed
  // here for the one place that needs it.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
