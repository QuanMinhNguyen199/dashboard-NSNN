import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => ({
  base: process.env.VITE_BASE ?? (command === "build" || mode === "production" ? "/tax-operations/" : "/"),
  plugins: [react(), {
    name: "portal-dashboard-index",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (process.env.VITE_PORTAL === "true" && /^\/nsnn\/?(?:\?|$)/.test(req.url ?? "")) {
          req.url = (req.url ?? "").replace(/^\/nsnn\/?/, "/nsnn/index.html");
        }
        next();
      });
    },
  }],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 5174, strictPort: false },
  preview: { port: 4174, strictPort: false },
  build: { outDir: "dist", sourcemap: false },
}));
