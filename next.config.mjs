import { dirname } from "path";
import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Fully static export: the whole engine runs in the browser, so the app can be served
  // from any static host or opened offline — no server, no API keys, no data leaving the device.
  output: "export",
  // Optional sub-path hosting (e.g. GitHub Pages at /medgrid-sentinel): set NEXT_BASE_PATH at build time.
  basePath: process.env.NEXT_BASE_PATH || "",
  env: { NEXT_PUBLIC_BASE_PATH: process.env.NEXT_BASE_PATH || "" },
  images: { unoptimized: true },
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
};

export default nextConfig;
