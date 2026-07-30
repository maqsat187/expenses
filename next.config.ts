import type { NextConfig } from "next";

// Hosted on Vercel, which runs Next.js with its server side intact — that's
// what makes /api/market-data possible, and with it the live KASE and
// National Bank data the Gold Coin page needs.
//
// This previously carried `output: "export"`, `basePath: "/expenses"` and
// `assetPrefix` for GitHub Pages. Those are gone: a static export has no
// server, which is exactly why that setup had to bake market data in at
// deploy time and depend on a scheduler to refresh it.
// `trailingSlash: true` is gone with them: it existed so the static export
// produced directory-style URLs, and on a server it only added a 308
// redirect hop in front of /api/market-data.
const nextConfig: NextConfig = {};

export default nextConfig;
