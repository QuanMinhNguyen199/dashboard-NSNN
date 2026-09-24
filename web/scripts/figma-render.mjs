/**
 * Đóng gói bộ dựng lại 27 màn thành plugin Figma chạy tại máy.
 *
 * Chuỗi đầy đủ:
 *   node scripts/figma-scrape.mjs   → đo hình học thật từ localhost
 *   node scripts/figma-render.mjs   → gói thành figma-plugin/code.js
 *   chạy plugin trong Figma desktop → 27 artboard
 *
 * Không đi qua Figma MCP, nên không đụng hạn mức 20 lệnh/tháng của gói Starter.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const goc = join(dirname(fileURLToPath(import.meta.url)), "..");
const mau = readFileSync(join(goc, "scripts/figma-render.plugin.js"), "utf8");
const so = readFileSync(join(goc, "scripts/figma-scrape.data.json"), "utf8").trim();

/* Nhúng bằng phép thay chuỗi, không bằng template literal: mã bên trong có sẵn
   dấu ` và ${...}, lồng vào template literal là hỏng ngay. */
const CHO = "const D = /* __DATA__ */ {};";
if (!mau.includes(CHO)) throw new Error("Không tìm thấy chỗ nhúng dữ liệu trong figma-render.plugin.js");
const ban = new Date().toISOString().slice(0, 16).replace("T", " ");
const day = mau
  .replace(CHO, "const D = " + so + ";")
  .replace('"__BAN__"', JSON.stringify(ban));

const RA = "return await CHINH();";
if (!day.includes(RA)) throw new Error("Không tìm thấy dòng gọi CHINH()");
const plugin = day.replace(RA, [
  "CHINH()",
  '  .then((r) => figma.closePlugin("[" + r.ban + " · " + r.ho + "] " + r.soArtboard + " artboard, " + r.soComponent + " component, " + r.soInstance + " instance, " + r.soLop + " khung auto layout — " + r.trang.join(", ")))',
  '  .catch((e) => figma.closePlugin("Lỗi: " + String(e && e.message ? e.message : e)));',
].join("\n"));

const thuMuc = join(goc, "figma-plugin");
mkdirSync(thuMuc, { recursive: true });
writeFileSync(join(thuMuc, "code.js"), plugin, "utf8");
writeFileSync(join(thuMuc, "manifest.json"), JSON.stringify({
  name: "NSNN · Dựng artboard",
  id: "nsnn-dung-artboard",
  api: "1.0.0",
  main: "code.js",
  editorType: ["figma"],
  networkAccess: { allowedDomains: ["none"] },
}, null, 2) + "\n", "utf8");

const d = JSON.parse(so);
const nut = Object.values(d).reduce((a, m) => a + m.nut.length, 0);
console.log(`figma-plugin/code.js  ${(plugin.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`${Object.keys(d).length} artboard · ${nut} phần tử`);
console.log(`dấu bản dựng: ${ban} — thông báo trong Figma phải in đúng chuỗi này`);
