import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { Connect } from "vite";

const portalRoutes: Connect.NextHandleFunction = (req, res, next) => {
  if (process.env.VITE_PORTAL !== "true") return next();
  const base = `/${(process.env.VITE_BASE ?? "").split("/").filter(Boolean).join("/")}`.replace(/\/$/, "");
  const url = new URL(req.url ?? "/", "http://portal.local");
  if (url.pathname === `${base}/` || url.pathname === `${base}/quan-ly` || url.pathname === `${base}/nsnn`) {
    res.writeHead(302, { Location: `${base}/${url.pathname.endsWith("/nsnn") ? "nsnn" : "quan-ly"}/${url.search}` });
    return res.end();
  }
  if (url.pathname === `${base}/nsnn/`) req.url = `${base}/nsnn/index.html${url.search}`;
  if (url.pathname === `${base}/quan-ly/` || url.pathname === `${base}/nsnn/dang-nhap/`) req.url = `${base}/index.html${url.search}`;
  next();
};

export default defineConfig(({ command, mode }) => ({
  base: process.env.VITE_BASE ?? (command === "build" || mode === "production" ? "/tax-operations/" : "/"),
  plugins: [react(), {
    name: "portal-dashboard-index",
    configureServer(server) {
      server.middlewares.use(portalRoutes);
    },
    configurePreviewServer(server) { server.middlewares.use(portalRoutes); },
  }],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 5174, strictPort: false },
  preview: { port: 4174, strictPort: false },
  build: { outDir: "dist", sourcemap: false },
}));
