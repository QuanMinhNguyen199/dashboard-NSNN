import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nsnnApi } from "./plugins/nsnn-api";

/**
 * GitHub Pages phục vụ site ở `/dashboard-NSNN/`, nên bản build phải mang đúng
 * base đó, còn dev server vẫn chạy ở gốc để URL ngắn khi làm việc.
 * Đặt `VITE_BASE=/` nếu deploy lên một domain riêng ở gốc.
 */
const REPO_BASE = "/dashboard-NSNN/";

export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE ?? (command === "build" ? REPO_BASE : "/"),
  plugins: [react(), nsnnApi()],
  // `@/` trỏ vào src. Import tuyệt đối để đổi chỗ một file không kéo theo việc
  // sửa `../../` ở khắp nơi.
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173, strictPort: false },
  preview: { port: 4173, strictPort: false },
  build: { outDir: "dist", sourcemap: false },
}));
