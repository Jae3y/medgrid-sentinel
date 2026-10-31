/** Minimal static server for the exported app (out/). Usage: node scripts/serve.mjs [port] */
import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { extname, join, normalize } from "path";

const root = join(process.cwd(), "out");
const port = Number(process.argv[2] || process.env.PORT || 3003);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".txt": "text/plain; charset=utf-8", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2", ".ico": "image/x-icon" };

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    let p = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, "");
    if (p.includes("..")) throw new Error("bad path");
    let file = join(root, p);
    const s = await stat(file).catch(() => null);
    if (!s) file = (await stat(file + ".html").catch(() => null)) ? file + ".html" : join(root, "404.html");
    else if (s.isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(file.endsWith("404.html") && !p.endsWith("404.html") ? 404 : 200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end("error");
  }
}).listen(port, () => console.log(`MedGrid Sentinel static build on http://localhost:${port}`));
