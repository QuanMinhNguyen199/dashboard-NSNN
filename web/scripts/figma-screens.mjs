/**
 * Đóng gói script dựng 27 artboard thành hai dạng chạy được.
 *
 * Gói Figma Starter chỉ cho 20 lệnh MCP mỗi THÁNG, nên khi hết hạn mức thì
 * không gửi được lệnh nào vào file nữa — kể cả lệnh chỉ đọc. Bản plugin chạy
 * tại máy đi thẳng vào Figma desktop, không qua MCP, nên không bị hạn mức.
 *
 * Chạy: node scripts/figma-screens.mjs
 *
 * Sinh ra:
 *   figma-plugin/code.js          — plugin chạy tại máy, không tốn lệnh MCP
 *   figma-plugin/manifest.json    — khai báo plugin
 *   scripts/.figma-screens.out.js — bản nạp vào `use_figma` khi còn hạn mức
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const goc = join(dirname(fileURLToPath(import.meta.url)), "..");
const mau = readFileSync(join(goc, "scripts/figma-screens.plugin.js"), "utf8");
const so = readFileSync(join(goc, "scripts/figma-screens.data.json"), "utf8").trim();

/* Nhúng dữ liệu bằng phép thay chuỗi chứ không bằng template literal: mã bên
   trong có sẵn dấu ` và ${...}, lồng vào template literal là hỏng ngay. */
const CHO = "const D = /* __DATA__ */ {};";
if (!mau.includes(CHO)) throw new Error("Không tìm thấy chỗ nhúng dữ liệu trong figma-screens.plugin.js");
const day = mau.replace(CHO, "const D = " + so + ";");

/* Bản MCP: `use_figma` tự bọc async và tự nhận giá trị `return`. */
writeFileSync(join(goc, "scripts/.figma-screens.out.js"), day, "utf8");

/* Bản plugin: phải tự đóng plugin và tự bắt lỗi, vì không có lớp bọc nào. */
const RA = "return await CHINH();";
if (!day.includes(RA)) throw new Error("Không tìm thấy dòng gọi CHINH()");
const plugin = day.replace(RA, [
  "CHINH()",
  '  .then((r) => figma.closePlugin("Đã dựng " + r.soArtboard + " artboard — " + r.trang.join(", ") + (r.loi.length ? " | Bỏ qua: " + r.loi.join(" ; ") : "")))',
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

const man = Object.keys(JSON.parse(so)).length;
console.log(`figma-plugin/code.js  ${(plugin.length / 1024).toFixed(1)} KB`);
console.log(`${man} màn hình × 3 khổ = ${man * 3} artboard`);
