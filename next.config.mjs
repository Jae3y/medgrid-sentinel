import { dirname } from "path";
import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Fully static export: the whole engine runs in the browser, so the app can be served
  // from any static host or opened offline — no server, no API keys, no data leaving the device.
  output: "export",
  images: { unoptimized: true },
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
};

export default nextConfig;
