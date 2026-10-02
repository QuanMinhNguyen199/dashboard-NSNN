import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Static hosts do not run Vite's routing middleware. Every public route needs
// its own index.html; retain the built absolute asset URLs in each copy.
export async function writePortalEntries(dist, base) {
  const html = await readFile(resolve(dist, "index.html"), "utf8");
  for (const route of ["quan-ly", "nsnn/dang-nhap"]) {
    await mkdir(resolve(dist, route), { recursive: true });
    await writeFile(resolve(dist, route, "index.html"), html);
  }
  const target = `${base}quan-ly/`;
  const safeTarget = JSON.stringify(target).replaceAll("<", "\\u003c");
  await writeFile(resolve(dist, "index.html"), `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>Quản lý nghiệp vụ Thuế</title></head>
<body><script>location.replace(${safeTarget} + location.search + location.hash);</script></body></html>
`);
}
