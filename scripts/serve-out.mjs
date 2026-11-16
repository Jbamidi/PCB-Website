// Serves the static export in out/ the way GitHub Pages does: extensionless URLs
// resolve to .html files, folders to index.html, and unknown paths get 404.html.
// Usage: npm run start  (PORT and NEXT_PUBLIC_BASE_PATH are honoured)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("out");
const flag = process.argv.indexOf("-p");
const port = Number(flag > 0 ? process.argv[flag + 1] : process.env.PORT ?? 3300);
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".pdf": "application/pdf", ".txt": "text/plain", ".ico": "image/x-icon",
};

async function file(p) {
  try {
    const s = await stat(p);
    return s.isFile() ? p : null;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  let url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (base && url.startsWith(base)) url = url.slice(base.length) || "/";
  const target = path.join(root, url);
  if (!target.startsWith(root)) return res.writeHead(400).end();
  const found = (await file(target)) ?? (await file(target + ".html")) ?? (await file(path.join(target, "index.html")));
  const out = found ?? path.join(root, "404.html");
  res.writeHead(found ? 200 : 404, { "content-type": types[path.extname(out)] ?? "application/octet-stream" });
  res.end(await readFile(out));
}).listen(port, () => console.log(`Serving out/ at http://localhost:${port}${base}/`));
