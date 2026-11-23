/*
  Chụp CẤU TRÚC màn chi tiết (hồ sơ NNT mở từ tab Đối chiếu nghĩa vụ) từ app đang chạy,
  để plugin Figma dựng lại thành layer sửa được (23/11/2026).

  Chạy khi dev server tax-ops đang mở ở cổng 5174:
    node tax-ops/design-system/capture-screen.mjs [baseUrl]
  Ghi ra tax-ops/design-system/screens/doi-chieu-chi-tiet.json, rồi chạy build.mjs để nhúng vào plugin.

  Mỗi phần tử nhìn thấy trong ngăn trượt thành một mục: hộp (nền, viền từng cạnh, bo góc),
  chữ (từng đoạn text với cỡ, cân nặng, màu, căn lề, giãn dòng) hoặc icon SVG (màu currentColor
  đã thay bằng màu thật). Toạ độ tính từ góc trên trái của ngăn. Dữ liệu là số liệu mô phỏng.
*/
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(dir, "..", "package.json"));
const puppeteer = require("puppeteer-core");
const base = (process.argv[2] ?? "http://localhost:5174/quan-ly/").replace(/\/?$/, "/");
const MAN = { ten: "Hồ sơ NNT · Đối chiếu nghĩa vụ", url: "?view=kq-kekhai&nhom=doichieu&nnt=0100006516", tai: "ld.thuetp" };
const KHO = [{ w: 1440, h: 900, touch: false }, { w: 390, h: 844, touch: true }];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const loi = []; page.on("pageerror", (e) => loi.push(e.message));
await page.setViewport({ width: 1440, height: 900 });
await page.goto(base, { waitUntil: "networkidle0" });
await page.evaluate((tk) => [...document.querySelectorAll(".demo-accounts-list button")].find((b) => b.querySelector("code")?.textContent === tk)?.click(), MAN.tai);
await wait(1200);
const ua = await browser.userAgent();
const ketQua = { ten: MAN.ten, nguon: "tax-ops " + MAN.url, chup: new Date().toISOString(), kho: [] };

for (const k of KHO) {
  await page.emulate({ viewport: { width: k.w, height: k.h, isMobile: k.touch, hasTouch: k.touch, deviceScaleFactor: 1 }, userAgent: k.touch ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148" : ua });
  await page.goto(base + MAN.url, { waitUntil: "networkidle0" });
  await wait(2500);
  /* Kéo khung nhìn cao bằng toàn bộ nội dung ngăn để không phần nào nằm sau thanh cuộn. */
  const cao = await page.evaluate(() => { const b = document.querySelector(".case-drawer-body"); const h = document.querySelector(".case-drawer-heading"); return Math.ceil(b.scrollHeight + (h ? h.offsetHeight : 0)); });
  await page.setViewport({ width: k.w, height: cao + 4, isMobile: k.touch, hasTouch: k.touch });
  await wait(800);
  const man = await page.evaluate(() => {
    const goc = document.querySelector(".case-drawer");
    const G = goc.getBoundingClientRect();
    const hex = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); if (a === 0) return null; return { hex: "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""), a: +(+a).toFixed(3) }; };
    const anDi = (e) => { const s = getComputedStyle(e); return s.display === "none" || s.visibility === "hidden" || +s.opacity === 0; };
    const sr = (e) => e.closest(".sr-only");
    const tenLop = (e) => (typeof e.className === "string" && e.className.trim().split(/\s+/)[0]) || e.tagName.toLowerCase();
    const mo = (e) => { let o = 1; for (let n = e; n && n !== goc.parentElement; n = n.parentElement) o *= +getComputedStyle(n).opacity; return +o.toFixed(3); };
    const R = (r) => ({ x: +(r.left - G.left).toFixed(1), y: +(r.top - G.top).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
    /* Khối lặp của app → component trong Figma (23/11/2026). Phần tử khớp selector mở một nhóm; con của
       nó nằm trong nhóm (nhóm lồng nhóm được). Biến thể lấy từ lớp "is-…" và loại bảng. */
    const COMP = [
      ["Chỉ báo", ".qd-dn-chi-bao .qd-cb"], ["Ô thông tin", ".qd-dn .detail-grid > div"], ["Tiêu đề khối", ".qd-dn-khoi > h3"],
      ["Bảng/Đầu cột", ".qd-dn thead tr"], ["Bảng/Hàng", ".qd-dn tbody tr"], ["Bảng/Hàng tổng", ".qd-dn tfoot tr"],
      ["Đối chiếu/Số tổng", ".qd-dc-ba > div"], ["Đối chiếu/Dòng cần soi", ".qd-dc-soi > li"], ["Nút/Xử lý dòng", ".qd-dc-nut"],
      ["Nút/Hành động", ".qd-dc-thao-tac button"], ["Bộ chọn bước", ".qd-dc-buoc"], ["Thu gọn", ".qd-dc-so-nut"],
      ["Ký hiệu giao dịch", ".qd-dc-ma"], ["Nút ⓘ", ".goi-y-nut"], ["Quay lại", ".qd-nnt-ve"], ["Không phát sinh", ".qd-dn-khong-ps"],
    ];
    const timComp = (e) => COMP.find(([, sel]) => e.matches(sel));
    const kieu = (e) => { const ds = [...e.classList].filter((c) => c.startsWith("is-")).map((c) => c.slice(3)); if (e.tagName === "TR") ds.unshift(e.closest("table").classList.contains("qd-ns-bang") ? "ngân sách" : "qua các năm"); return ds.join(" "); };
    const muc = [];
    const di = (e, dich = muc, laGoc = false) => {
      if (e.nodeType !== 1 || anDi(e) || sr(e)) return;
      const cp = !laGoc && timComp(e);
      if (cp) { const r0 = e.getBoundingClientRect(); if (!r0.width || !r0.height) return; const g = { t: "comp", comp: cp[0], kieu: kieu(e), ...R(r0), muc: [] }; dich.push(g); di(e, g.muc, true); return; }
      const r = e.getBoundingClientRect();
      if (e.tagName.toLowerCase() === "svg") {
        if (r.width && r.height) { const c = getComputedStyle(e).color; dich.push({ t: "svg", ten: e.getAttribute("aria-label") || "icon", ...R(r), op: mo(e), svg: e.outerHTML.replaceAll("currentColor", c) }); }
        return;
      }
      const s = getComputedStyle(e);
      if (r.width > 0 && r.height > 0) {
        const nen = hex(s.backgroundColor);
        const vien = ["Top", "Right", "Bottom", "Left"].map((c) => { const w = parseFloat(s["border" + c + "Width"]); const m = hex(s["border" + c + "Color"]); return w > 0 && m && s["border" + c + "Style"] !== "none" ? { w, ...m } : null; });
        /* Viền giả bằng box-shadow inset 1px (đường kẻ cột dính) — đổi thành viền phải. */
        const bong = s.boxShadow.match(/inset\s+(-?\d+)px\s+0(?:px)?\s+0(?:px)?\s+(rgba?\([^)]+\)|#[0-9a-f]+)/i) || s.boxShadow.match(/(rgba?\([^)]+\))\s+(-?\d+)px\s+0px\s+0px\s+0px\s+inset/i);
        if (bong) { const px = parseFloat(bong[1].startsWith("rgb") ? bong[2] : bong[1]); const m = hex(bong[1].startsWith("rgb") ? bong[1] : bong[2]); if (m && px < 0 && !vien[1]) vien[1] = { w: Math.abs(px), ...m }; }
        if (nen || vien.some(Boolean) || e === goc) {
          dich.push({ t: "hop", ten: tenLop(e), ...R(r), op: mo(e), nen, vien, bo: ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map((c) => Math.min(parseFloat(s["border" + c + "Radius"]) || 0, r.height / 2)) });
        }
      }
      for (const n of e.childNodes) {
        if (n.nodeType === 3) {
          const chu = n.textContent.replace(/\s+/g, " ");
          if (!chu.trim()) continue;
          const rg = document.createRange(); rg.selectNodeContents(n);
          const rr = rg.getBoundingClientRect(); const dong = rg.getClientRects().length;
          if (!rr.width || !rr.height) continue;
          const mau = hex(s.color);
          /* Nhiều dòng: tách theo đúng chỗ trình duyệt đã ngắt (gom từng ký tự theo đỉnh dòng), mỗi dòng
             một mục một dòng — đoạn bắt đầu giữa dòng (sau một nút chữ khác) không đè lên chữ trước nó,
             và Figma không phải tự ngắt lại theo bề rộng ước lượng. */
          if (dong > 1) {
            const goc0 = n.textContent; const dongs = [];
            for (let i = 0; i < goc0.length; i++) {
              const r1 = document.createRange(); r1.setStart(n, i); r1.setEnd(n, i + 1);
              const b = r1.getClientRects()[0]; if (!b || !b.width) { if (dongs.length) dongs[dongs.length - 1].s += goc0[i]; continue; }
              const top = Math.round(b.top);
              let d = dongs[dongs.length - 1];
              if (!d || Math.abs(d.top - top) > 2) { d = { top, s: "", l: b.left, r: b.right, t: b.top, b: b.bottom }; dongs.push(d); }
              d.s += goc0[i]; d.l = Math.min(d.l, b.left); d.r = Math.max(d.r, b.right); d.t = Math.min(d.t, b.top); d.b = Math.max(d.b, b.bottom);
            }
            for (const d of dongs) { const txt = d.s.replace(/\s+/g, " "); if (!txt.trim()) continue; dich.push({ t: "chu", ...R({ left: d.l, top: d.t, width: d.r - d.l, height: d.b - d.t }), chu: txt.trim(), op: mo(e), co: parseFloat(s.fontSize), dam: +s.fontWeight || 400, mau, gian: s.lineHeight === "normal" ? null : parseFloat(s.lineHeight), cach: parseFloat(s.letterSpacing) || 0, can: "left", mono: /mono|consolas/i.test(s.fontFamily), nhieuDong: false, gach: s.textDecorationLine.includes("underline") && s.textDecorationStyle === "solid" }); }
            continue;
          }
          dich.push({ t: "chu", ...R(rr), chu, op: mo(e), co: parseFloat(s.fontSize), dam: +s.fontWeight || 400, mau, gian: s.lineHeight === "normal" ? null : parseFloat(s.lineHeight), cach: parseFloat(s.letterSpacing) || 0, can: s.textAlign, mono: /mono|consolas/i.test(s.fontFamily), nhieuDong: dong > 1, gach: s.textDecorationLine.includes("underline") && s.textDecorationStyle === "solid" });
        } else di(n, dich);
      }
    };
    di(goc);
    return { w: Math.round(G.width), h: Math.round(Math.max(G.height, document.querySelector(".case-drawer-body").scrollHeight)), muc };
  });
  ketQua.kho.push({ rong: k.w, ...man });
  const phang = (ds) => ds.flatMap((m) => (m.t === "comp" ? [m, ...phang(m.muc)] : [m]));
  const tat = phang(man.muc); const dem = (t) => tat.filter((m) => m.t === t).length;
  console.log(`${k.w}px: ngăn ${man.w}×${man.h} · ${dem("comp")} khối component · ${dem("chu")} chữ, ${dem("hop")} hộp, ${dem("svg")} icon`);
}
await browser.close();
if (loi.length) console.log("Lỗi trang:", loi);
fs.mkdirSync(path.join(dir, "screens"), { recursive: true });
const out = path.join(dir, "screens", "doi-chieu-chi-tiet.json");
fs.writeFileSync(out, JSON.stringify(ketQua));
console.log("Đã ghi", path.relative(process.cwd(), out), Math.round(fs.statSync(out).size / 1024) + " kB");
