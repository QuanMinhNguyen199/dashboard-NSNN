import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nsnnApi } from "./plugins/nsnn-api";

export default defineConfig({
  plugins: [react(), nsnnApi()],
  server: { port: 5173, strictPort: false },
  preview: { port: 4173, strictPort: false },
  build: { outDir: "dist", sourcemap: false },
});
