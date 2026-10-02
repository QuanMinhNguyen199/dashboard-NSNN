import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { runProcess } from "../../scripts/run-process.mjs";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const base = `/${(process.env.VITE_BASE ?? "/dashboard-NSNN/").split("/").filter(Boolean).join("/")}/`.replace(/^\/\//, "/");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
// No SPA fallback: missing files return 404, just as on GitHub Pages.
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (!pathname.startsWith(base)) throw new Error("Outside base");
    let file = resolve(dist, pathname.slice(base.length));
    if (file !== resolve(dist) && !file.startsWith(resolve(dist) + sep)) throw new Error("Outside dist");
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    const bytes = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end("File not found");
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}${base}`;
try {
  for (const route of ["", "quan-ly/", "nsnn/", "nsnn/dang-nhap/"]) {
    const response = await fetch(new URL(route, url));
    assert.equal(response.status, 200, route);
    const html = await response.text();
    for (const match of html.matchAll(/(?:src|href)="([^\"]+\.(?:js|css))"/g)) {
      const asset = new URL(match[1], url);
      assert.equal((await fetch(asset)).status, 200, asset.href);
    }
  }
  assert.equal((await fetch(new URL("missing-route/", url))).status, 404);
  await runProcess("Static portal browser checks", process.execPath,
    [fileURLToPath(new URL("check-portal.mjs", import.meta.url)), url], { stdio: "inherit" });
  console.log("PASS static hosting: physical entry files, assets and browser flows under " + base);
} finally {
  await new Promise(resolve => server.close(resolve));
}
