/**
 * Sinh bộ artboard cho Figma.
 *
 * Hai trang, đặt ở `public/figma/` nên chúng chạy được ngay bằng chính dev
 * server và import thẳng vào Figma (Generate Design / html.to.design).
 *
 *   · `design-system.html` — bảng màu, thang chữ, nhịp giãn, bo góc, bóng đổ
 *     và bộ component dùng chung.
 *   · `frames.html` — mọi màn hình ở ba khổ: desktop, iframe nhúng, điện thoại.
 *
 * **Token được ĐỌC từ `dashboard.css`, không chép tay.** Chép tay thì bảng màu
 * trong Figma và màu trong app là hai nguồn sự thật, và chúng sẽ trôi khỏi nhau
 * ngay lần đầu ai đó sửa một biến — lúc đó bản thiết kế nói sai về chính sản
 * phẩm nó mô tả. Sinh lại là cách duy nhất giữ chúng bằng nhau.
 *
 * Chạy: node scripts/build-figma.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CSS_PATH = join(ROOT, "src/styles/dashboard.css");
const OUT_DIR = join(ROOT, "public/figma");

const css = readFileSync(CSS_PATH, "utf8");

/* ── Đọc token từ khối `:root` ───────────────────────────────────────────── */

/**
 * Chỉ lấy khối `:root` ĐẦU TIÊN.
 *
 * Các khối sau là ghi đè theo ngữ cảnh (khổ hẹp, host nhúng); gộp cả vào thì
 * một tên biến xuất hiện hai lần với hai giá trị, và bảng màu không nói được
 * giá trị nào là giá trị mặc định.
 */
const rootBlock = /:root\s*\{([\s\S]*?)\n\}/.exec(css);
if (!rootBlock) throw new Error("Không tìm thấy khối :root trong dashboard.css");

/*
  Tach theo DAU CHAM PHAY, khong theo dong.

  `dashboard.css` co dong `--s1: 4px; --s2: 8px; ... --s6: 32px;` - doc theo
  dong thi chi bat duoc bien dau tien va nam bien gian bien mat khoi bang mau
  ma khong co gi bao. Ban cu bat 79/85 token dung vi ly do nay.
*/
const tokens = [];
for (const decl of rootBlock[1].replace(/\/\*[\s\S]*?\*\//g, "").split(";")) {
  const m = /(--[a-z0-9-]+)\s*:\s*([\s\S]+)/i.exec(decl);
  if (m) tokens.push({ name: m[1].trim(), value: m[2].trim().replace(/\s+/g, " ") });
}

const laMau = (v) => /^#|^rgb|^hsl|^color\(|color-mix/i.test(v);
const nhom = (name) => {
  if (/^--(blue|navy|brand|canvas|surface|ink|hairline|divider|control-border|scrim|nodata|note|star|on-dark|pos|neg|data-|donut-|tooltip|focus|frame)/.test(name)) return "mau";
  if (/^--(fs|fw|lh|ls|measure)/.test(name)) return "chu";
  if (/^--s\d/.test(name)) return "gian";
  if (/^--r-/.test(name)) return "bo-goc";
  if (/^--shadow/.test(name)) return "bong";
  return "khac";
};

const theoNhom = {};
for (const t of tokens) {
  const k = laMau(t.value) ? "mau" : nhom(t.name);
  (theoNhom[k] ??= []).push(t);
}

/* ── Danh mục màn hình: nguồn sự thật là chính app ───────────────────────── */

const KY = "year=2026&periodType=MONTH&period=8";

/**
 * Mỗi dòng là MỘT artboard.
 *
 * Tab `Chi tiết` có hai biến thể vì nó đổi mặt theo ô `Phạm vi`: chọn một
 * phường ra một màn, chọn một đơn vị thuế ra một màn khác. Gộp chúng thành một
 * artboard là bỏ mất đúng một nửa tab.
 */
const MAN_HINH = [
  { id: "tong-quan", ten: "Tổng quan", url: `/?tab=overview&${KY}` },
  { id: "bao-cao-nsnn", ten: "Báo cáo · Thu NSNN", url: `/?tab=report&report=nsnn&${KY}` },
  { id: "bao-cao-budget", ten: "Báo cáo · Dự toán & dự báo", url: `/?tab=report&report=budget&${KY}` },
  { id: "bao-cao-taxpayer", ten: "Báo cáo · Quản lý thu", url: `/?tab=report&report=taxpayer&${KY}` },
  { id: "bao-cao-inspection", ten: "Báo cáo · Kết quả kiểm tra", url: `/?tab=report&report=inspection&${KY}` },
  { id: "phan-tich-thu", ten: "Phân tích thu", url: `/?tab=revenue-analysis&section=domestic&${KY}` },
  { id: "chi-tiet-dia-ban", ten: "Chi tiết · Phường/xã", url: `/?tab=location-detail&location=00004&${KY}` },
  { id: "chi-tiet-cqt", ten: "Chi tiết · Đơn vị thuế", url: `/?tab=location-detail&cqt=0106&${KY}` },
  { id: "so-sanh", ten: "So sánh nâng cao", url: `/?tab=advanced-compare&mode=period&${KY}` },
];

/**
 * Ba khổ, và `mobile` khác hai khổ kia ở HOST chứ không chỉ ở bề rộng.
 *
 * Bản nhúng iframe cũng hẹp nhưng giữ nguyên bố cục web; chỉ `host=mobile` mới
 * có thanh điều hướng đáy, bottom sheet và thẻ thay bảng. Đặt khổ theo bề rộng
 * mà quên host thì artboard "mobile" vẽ ra đúng bản nhúng.
 */
const KHO = [
  { id: "desktop", ten: "Desktop", w: 1440, h: 1024, them: "" },
  { id: "iframe", ten: "Nhúng iframe", w: 500, h: 900, them: "" },
  { id: "mobile", ten: "Điện thoại", w: 390, h: 844, them: "&host=mobile&platform=ios" },
];

/* ── Trang 1: Design system ──────────────────────────────────────────────── */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const oMau = (t) => `
      <figure class="fg-swatch">
        <span class="fg-chip" style="background: var(${t.name})"></span>
        <figcaption><code>${esc(t.name)}</code><small>${esc(t.value)}</small></figcaption>
      </figure>`;

/**
 * Moi token chu ap DUNG THUOC TINH cua no.
 *
 * Ban truoc ap tat ca lam `font-size`, nen `--measure: 72ch` - von la do dai
 * dong - cho ra mot dong chu cao 72ch va day ca trang rong 1728px tren khung
 * 1400px. Mot bang thang chu ma chinh no tran ngang thi khong dung duoc de
 * doc thang chu.
 */
const oChu = (t) => {
  const mau = "Thu ngân sách 1.234";
  if (/^--fw/.test(t.name)) return khungChu(t, `font-weight: var(${t.name})`, mau);
  if (/^--lh/.test(t.name)) return khungChu(t, `line-height: var(${t.name}); max-width: 30ch`, `${mau} ${mau}`);
  if (/^--ls/.test(t.name)) return khungChu(t, `letter-spacing: var(${t.name})`, mau);
  if (t.name === "--measure") return khungChu(t, `max-width: var(${t.name}); display: block`, `${mau} ${mau} ${mau} ${mau}`);
  return khungChu(t, `font-size: var(${t.name})`, mau);
};

const khungChu = (t, style, mau) => `
      <div class="fg-type">
        <p style="${style}">${mau}</p>
        <code>${esc(t.name)}</code><small>${esc(t.value)}</small>
      </div>`;

const oGian = (t) => `
      <div class="fg-space">
        <span style="width: var(${t.name})"></span>
        <code>${esc(t.name)}</code><small>${esc(t.value)}</small>
      </div>`;

const oBoGoc = (t) => `
      <div class="fg-radius">
        <span style="border-radius: var(${t.name})"></span>
        <code>${esc(t.name)}</code><small>${esc(t.value)}</small>
      </div>`;

const oBong = (t) => `
      <div class="fg-shadow">
        <span style="box-shadow: var(${t.name})"></span>
        <code>${esc(t.name)}</code>
      </div>`;

const designSystem = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Design system · Thu NSNN Hà Nội</title>
<link rel="stylesheet" href="/src/styles/dashboard.css" />
<style>
  /* App dat font o .dapp chu khong o body - nen trang nay phai tu khai,
     neu khong no rot ve serif mac dinh va bang thang chu dang do mot bo
     chu khac han bo chu cua san pham. */
  body { margin: 0; background: var(--canvas); color: var(--ink);
    font-family: "SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
  .fg-wrap { max-width: 1160px; margin: 0 auto; padding: 32px 24px 80px; }
  .fg-wrap h1 { margin: 0 0 4px; font-size: var(--fs-display); }
  .fg-wrap > p.fg-lead { margin: 0 0 32px; color: var(--ink-2); }
  .fg-sec { margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--hairline); }
  .fg-sec > h2 { margin: 0 0 4px; font-size: var(--fs-title); }
  .fg-sec > p { margin: 0 0 16px; color: var(--ink-3); font-size: var(--fs-label); }
  .fg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
  .fg-swatch { margin: 0; }
  .fg-chip { display: block; height: 56px; border: 1px solid var(--hairline); border-radius: var(--r-control); }
  .fg-swatch figcaption, .fg-type, .fg-space, .fg-radius, .fg-shadow { display: grid; gap: 1px; margin-top: 6px; }
  code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: var(--fs-label); color: var(--ink); }
  small { color: var(--ink-3); font-size: var(--fs-label); }
  .fg-type p { margin: 0; max-width: 100%; overflow-wrap: anywhere; }
  .fg-type { min-width: 0; overflow: hidden; }
  .fg-space > span { display: block; height: 14px; background: var(--brand); border-radius: 2px; }
  .fg-radius > span { display: block; height: 56px; background: var(--blue-100); border: 1px solid var(--brand); }
  .fg-shadow > span { display: block; height: 56px; background: var(--surface); border-radius: var(--r-surface); }
  .fg-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
  .fg-demo { padding: 16px; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-surface); }
</style>
</head>
<body>
<div class="fg-wrap">
  <h1>Design system · Thu ngân sách TP Hà Nội</h1>
  <p class="fg-lead">
    Sinh tự động từ <code>src/styles/dashboard.css</code> — ${tokens.length} biến.
    Sửa biến trong stylesheet rồi chạy lại <code>npm run build:figma</code>; đừng sửa tay trang này.
  </p>

  <section class="fg-sec">
    <h2>Bảng màu</h2>
    <p>${(theoNhom.mau ?? []).length} biến màu. Tên biến là tên layer nên dùng trong Figma.</p>
    <div class="fg-grid">${(theoNhom.mau ?? []).map(oMau).join("")}</div>
  </section>

  <section class="fg-sec">
    <h2>Chữ</h2>
    <p>Cỡ, độ đậm, giãn dòng và giãn chữ.</p>
    <div class="fg-grid">${(theoNhom.chu ?? []).map(oChu).join("")}</div>
  </section>

  <section class="fg-sec">
    <h2>Nhịp giãn</h2>
    <div class="fg-grid">${(theoNhom.gian ?? []).map(oGian).join("")}</div>
  </section>

  <section class="fg-sec">
    <h2>Bo góc</h2>
    <div class="fg-grid">${(theoNhom["bo-goc"] ?? []).map(oBoGoc).join("")}</div>
  </section>

  <section class="fg-sec">
    <h2>Bóng đổ</h2>
    <div class="fg-grid">${(theoNhom.bong ?? []).map(oBong).join("")}</div>
  </section>

  <section class="fg-sec">
    <h2>Nút</h2>
    <p>Mọi vùng chạm tối thiểu 44×44px ở khổ hẹp.</p>
    <div class="fg-demo fg-row">
      <button type="button" class="dbtn dbtn-primary">Nút chính</button>
      <button type="button" class="dbtn">Nút thường</button>
      <button type="button" class="dbtn is-secondary">Nút phụ</button>
      <button type="button" class="dbtn" disabled>Không dùng được</button>
      <button type="button" class="dlink">Liên kết trong thẻ</button>
    </div>
  </section>

  <section class="fg-sec">
    <h2>Rãnh phân đoạn</h2>
    <div class="fg-demo fg-row">
      <div class="dseg" role="group" aria-label="Cách tính">
        <button type="button" class="is-active">Trong kỳ</button>
        <button type="button">Lũy kế</button>
      </div>
      <div class="dseg" role="group" aria-label="Chu kỳ">
        <button type="button" class="is-active">Tháng</button>
        <button type="button">Quý</button>
      </div>
    </div>
  </section>

  <section class="fg-sec">
    <h2>Nhãn trạng thái</h2>
    <p>Nhãn <code>is-review</code> là chỗ màn hình nói ra rằng số đang là số mô phỏng.</p>
    <div class="fg-demo fg-row">
      <span class="dtag is-review">Số mô phỏng</span>
      <span class="dtag is-running">Đang chạy</span>
      <span class="dtag is-alert">Cần chú ý</span>
    </div>
  </section>

  <section class="fg-sec">
    <h2>Biến động</h2>
    <div class="fg-demo fg-row">
      <span class="dchange up">▲ +15,4%</span>
      <span class="dchange down">▼ −3,9%</span>
      <span class="dchange flat">0,0%</span>
    </div>
  </section>

  <section class="fg-sec">
    <h2>Thẻ và chỉ số</h2>
    <div class="dcard">
      <div class="dcard-head">
        <div class="dcard-title">
          <h3>Tiêu đề thẻ</h3>
          <p>Câu phụ đề giải thích thẻ đang nói về cái gì</p>
        </div>
        <span class="dtag is-review">Số mô phỏng</span>
      </div>
      <div class="dcard-body">
        <div class="dkpis">
          <div><span>Thu trong kỳ</span><strong>56.117 <small>tỷ</small></strong><em>▲ +15,4% so cùng kỳ</em></div>
          <div><span>Lũy kế từ đầu năm</span><strong>434.710 <small>tỷ</small></strong><em>▲ +13,2% so cùng kỳ</em></div>
          <div><span>Hoàn thành dự toán</span><strong>66,7%</strong><em>Lũy kế trên dự toán</em></div>
        </div>
      </div>
    </div>
  </section>

  <section class="fg-sec">
    <h2>Bảng</h2>
    <div class="dcard"><div class="dcard-body">
      <div class="dtable-wrap">
        <table class="dtable">
          <thead><tr><th>Khoản mục</th><th class="is-num">Kỳ này</th><th class="is-num">Cùng kỳ</th><th class="is-num">Tăng trưởng</th></tr></thead>
          <tbody>
            <tr><th scope="row">Khu vực kinh tế ngoài quốc doanh</th><td class="is-num">96.697</td><td class="is-num">79.912</td><td class="is-num"><span class="dchange up">▲ +21,0%</span></td></tr>
            <tr><th scope="row">Doanh nghiệp nhà nước trung ương</th><td class="is-num">55.734</td><td class="is-num">50.731</td><td class="is-num"><span class="dchange up">▲ +9,9%</span></td></tr>
          </tbody>
        </table>
      </div>
    </div></div>
  </section>

  <section class="fg-sec">
    <h2>Trạng thái rỗng</h2>
    <div class="dcard"><div class="dcard-body">
      <p class="dempty">Không có mục nào khớp bộ lọc hiện tại.</p>
    </div></div>
  </section>
</div>
</body>
</html>
`;

/* ── Trang 2: artboard từng màn hình ─────────────────────────────────────── */

const khungCua = (kho) => MAN_HINH.map((m) => `
      <figure class="fg-frame" data-frame="${m.id}--${kho.id}">
        <figcaption>${esc(m.ten)} · ${esc(kho.ten)} · ${kho.w}×${kho.h}</figcaption>
        <iframe
          title="${esc(m.ten)} ${esc(kho.ten)}"
          width="${kho.w}" height="${kho.h}" loading="lazy"
          src="${m.url}${kho.them}"></iframe>
      </figure>`).join("");

const frames = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Artboard · Thu NSNN Hà Nội</title>
<link rel="stylesheet" href="/src/styles/dashboard.css" />
<style>
  body { margin: 0; background: var(--canvas); color: var(--ink);
    font-family: "SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
  .fg-wrap { padding: 28px 24px 80px; }
  h1 { margin: 0 0 4px; font-size: var(--fs-display); }
  .fg-lead { margin: 0 0 8px; color: var(--ink-2); max-width: 70ch; }
  .fg-note { margin: 0 0 28px; padding: 12px 14px; background: var(--note-surface); border-left: 3px solid var(--note-line); color: var(--note-ink); font-size: var(--fs-label); max-width: 80ch; }
  h2 { margin: 36px 0 12px; font-size: var(--fs-title); }
  .fg-strip { display: flex; flex-wrap: wrap; gap: 28px; align-items: flex-start; }
  .fg-frame { margin: 0; }
  .fg-frame figcaption { margin-bottom: 6px; color: var(--ink-2); font-size: var(--fs-label); font-weight: var(--fw-label); }
  .fg-frame iframe { display: block; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-surface); }
</style>
</head>
<body>
<div class="fg-wrap">
  <h1>Artboard · Thu ngân sách TP Hà Nội</h1>
  <p class="fg-lead">
    ${MAN_HINH.length} màn hình × ${KHO.length} khổ = ${MAN_HINH.length * KHO.length} artboard.
    Mỗi khung là app THẬT chạy trong iframe, không phải ảnh chụp — nên nó không bao giờ cũ hơn sản phẩm.
  </p>
  <p class="fg-note">
    Khổ <strong>Điện thoại</strong> mang <code>host=mobile</code>; khổ <strong>Nhúng iframe</strong> thì không.
    Hai khổ này cùng hẹp nhưng khác bố cục: chỉ bản mobile mới có thanh điều hướng đáy,
    bộ lọc dạng bottom sheet và bảng chuyển thành thẻ. Bản nhúng giữ nguyên bố cục web.
  </p>
  ${KHO.map((kho) => `<h2>${esc(kho.ten)} · ${kho.w}px</h2><div class="fg-strip">${khungCua(kho)}</div>`).join("\n  ")}
</div>
</body>
</html>
`;

/* ── Trang 3: token dang JSON cho Figma Variables ────────────────────────── */

/*
  Mot collection moi nhom, ten bien giu nguyen `--ten` de doi chieu nguoc lai
  stylesheet khong phai doan. Gia tri de NGUYEN VAN chu khong quy ve rgb: mot
  so token la `var(--brand)` hoac `color-mix(...)`, quy doi o day la bien mot
  tham chieu thanh mot hang so, va lan sau ai sua `--brand` thi ban Figma van
  giu mau cu ma khong co gi bao.
*/
const NHAN_NHOM = {
  mau: "Color", chu: "Typography", gian: "Spacing",
  "bo-goc": "Radius", bong: "Shadow", khac: "Other",
};
const bienJson = {
  nguon: "src/styles/dashboard.css",
  sinhLuc: new Date().toISOString(),
  soBien: tokens.length,
  nhom: Object.fromEntries(
    Object.entries(theoNhom).map(([k, v]) => [
      NHAN_NHOM[k] ?? k,
      Object.fromEntries(v.map((t) => [t.name, t.value])),
    ]),
  ),
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "tokens.json"), JSON.stringify(bienJson, null, 2), "utf8");
writeFileSync(join(OUT_DIR, "design-system.html"), designSystem, "utf8");
writeFileSync(join(OUT_DIR, "frames.html"), frames, "utf8");

console.log(`✓ ${tokens.length} token đọc từ dashboard.css`);
for (const [k, v] of Object.entries(theoNhom)) console.log(`  · ${k}: ${v.length}`);
console.log(`✓ ${MAN_HINH.length} màn hình × ${KHO.length} khổ = ${MAN_HINH.length * KHO.length} artboard`);
console.log("→ public/figma/design-system.html");
console.log("→ public/figma/frames.html");
console.log("→ public/figma/tokens.json");
