/**
 * Kiểm tính toàn vẹn của danh mục và số đếm — chạy THẲNG mã domain.
 *
 *   node scripts/check-data-integrity.mjs
 *
 * Gói `src/domain/tms.ts` bằng esbuild (đã có sẵn theo Vite) rồi nạp vào Node.
 * Đọc lại hằng số trong tệp nguồn bằng regex thì chỉ kiểm được chữ; ở đây phép
 * gộp mã và bảng phạm vi địa bàn đều là code chạy lúc nạp, nên phải chạy thật.
 */
import { build } from "esbuild";
import { mkdir, readFile, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const GOC = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TAM = path.join(GOC, "node_modules", ".check-data-integrity");

const loi = [];
const kiem = (ten, thuc, mong) => {
  const ok = JSON.stringify(thuc) === JSON.stringify(mong);
  if (!ok) loi.push(`✗ ${ten}\n    mong đợi: ${JSON.stringify(mong)}\n    thực tế:  ${JSON.stringify(thuc)}`);
  else console.log(`✓ ${ten}`);
};

await mkdir(TAM, { recursive: true });
const ra = path.join(TAM, "tms.mjs");
const goi = async (nguon, ten) => {
  const ra = path.join(TAM, ten);
  await build({
    entryPoints: [path.join(GOC, nguon)],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: ra,
    alias: { "@": path.join(GOC, "src") },
    loader: { ".json": "json" },
    logLevel: "silent",
  });
  return import(pathToFileURL(ra).href);
};

await build({
  entryPoints: [path.join(GOC, "src/domain/tms.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: ra,
  alias: { "@": path.join(GOC, "src") },
  loader: { ".json": "json" },
  logLevel: "silent",
});
const tms = await import(pathToFileURL(ra).href);

/* ─────────────────────────── Danh mục cơ quan ──────────────────────────── */

kiem("9801 có tên CCT Thương mại điện tử", tms.taxOfficeNameOf("9801"), "CCT Thương mại điện tử");
kiem("9901 vẫn là CCT Doanh nghiệp lớn", tms.taxOfficeNameOf("9901"), "CCT Doanh nghiệp lớn");
kiem("Danh mục có 28 thực thể cơ quan thuế", tms.TAX_OFFICE_ENTITIES.length, 28);
kiem("33 mã nguồn quy về 28 cơ quan", Object.keys(tms.TAX_OFFICE_ENTITY_BY_CODE).length, 33);

// 25 Thuế cơ sở + 3 đơn vị khác. Không được gộp thành "28 Thuế cơ sở".
const coSo = tms.TAX_OFFICE_ENTITIES.filter((e) => /Thuế cơ sở \d+/.test(e.name));
kiem("25 Thuế cơ sở", coSo.length, 25);
kiem(
  "3 đơn vị không phải Thuế cơ sở",
  tms.TAX_OFFICE_ENTITIES.filter((e) => !/Thuế cơ sở \d+/.test(e.name))
    .map((e) => e.id)
    .sort(),
  ["0101", "9801", "9901"],
);
kiem("Số hiệu cơ sở chạy đủ 1–25", coSo.map((e) => Number(e.name.match(/cơ sở (\d+)/)[1])).sort((a, b) => a - b),
  Array.from({ length: 25 }, (_, i) => i + 1));

// "Chưa xác định" là trạng thái dữ liệu, không phải một cơ quan.
kiem(
  "Không có thực thể nào tên Chưa xác định",
  tms.TAX_OFFICE_ENTITIES.some((e) => /chưa xác định/i.test(e.name)),
  false,
);

/* ───────────────────── Danh mục bổ sung và phép hợp nhất ───────────────── */

kiem("Bảng MAP gốc vẫn nguyên 32 mã", tms.TAX_OFFICES_GOC.length, 32);
kiem("Bảng MAP gốc chưa có 9801", tms.TAX_OFFICES_GOC.some((o) => o.code === "9801"), false);
kiem(
  "Hợp nhất không sinh bản ghi trùng",
  tms.TAX_OFFICES.length,
  new Set(tms.TAX_OFFICES.map((o) => o.code)).size,
);
// Khi bảng MAP mới có 9801, dòng bổ sung phải tự biến mất chứ không nhân đôi.
kiem(
  "Mã bổ sung đã có trong gốc thì không thêm lần hai",
  (() => {
    const daCo = new Set(tms.TAX_OFFICES_GOC.map((o) => o.code));
    return tms.SUPPLEMENTAL_TAX_OFFICES.filter((o) => daCo.has(o.code)).length;
  })(),
  0,
);

/* ──────────────────────────── Phạm vi địa bàn ──────────────────────────── */

kiem("9801 không có danh sách địa bàn cố định", tms.taxOfficeLocationIds("9801"), []);
kiem(
  "9801 có câu trạng thái riêng, không phải câu báo mã sai",
  tms.taxOfficeScopeNote("9801"),
  "CCT Thương mại điện tử quản lý theo đối tượng, không có phạm vi phường/xã cố định.",
);
kiem(
  "Đúng 25 Thuế cơ sở có phường/xã phụ trách",
  tms.TAX_OFFICE_ENTITIES.filter((e) => tms.taxOfficeLocationIds(e.id).length > 0).length,
  25,
);

/* ───────────────────── Danh bạ và chứng từ không rơi rớt ───────────────── */

const danhBa = JSON.parse(await readFile(path.join(GOC, "src/data/official-18-09.json"), "utf8"))
  .directory.byTaxOfficeCode;
const actuals = JSON.parse(await readFile(path.join(GOC, "src/data/tms-actuals.json"), "utf8")).periods;

kiem("Danh bạ có 116 dòng mã 9801", danhBa["9801"], 116);
kiem(
  "Mọi mã CQT trong danh bạ đều tra được tên",
  Object.keys(danhBa).filter((code) => code !== "Chưa xác định" && tms.taxOfficeNameOf(code) === null),
  [],
);
kiem(
  "Mọi mã CQT trên chứng từ đều tra được tên",
  [...new Set(Object.values(actuals).flatMap((kyMot) => Object.keys(kyMot.byTaxOffice)))]
    .filter((code) => tms.taxOfficeNameOf(code) === null),
  [],
);
// Gộp mã không được làm mất tiền.
for (const [ky, b] of Object.entries(actuals)) {
  const truoc = Object.values(b.byTaxOffice).reduce((a, v) => a + BigInt(v), 0n);
  const theo = new Map();
  for (const [code, v] of Object.entries(b.byTaxOffice)) {
    const id = tms.taxOfficeEntityOf(code);
    theo.set(id, (theo.get(id) ?? 0n) + BigInt(v));
  }
  kiem(`Kỳ ${ky}: gộp mã giữ nguyên tổng`, (truoc - [...theo.values()].reduce((a, v) => a + v, 0n)).toString(), "0");
}

/* ════════════════ Mục lục ngân sách: danh mục và mã tham chiếu ═══════════ */

kiem("Danh mục có 104 Chương", tms.CHAPTERS.length, 104);
kiem("Danh mục có 37 Mục", tms.SECTIONS.length, 37);
kiem("Danh mục có 180 Tiểu mục", tms.SUB_ITEMS.length, 180);
kiem("Mã Chương không trùng", tms.CHAPTERS.length, new Set(tms.CHAPTERS.map((c) => c.code)).size);
kiem("Mã Tiểu mục không trùng", tms.SUB_ITEMS.length, new Set(tms.SUB_ITEMS.map((s) => s.code)).size);
// Tiểu mục thuộc Mục. Chương là chiều độc lập, không sở hữu Mục.
kiem(
  "Mọi Tiểu mục đều trỏ về một Mục có trong danh mục",
  tms.SUB_ITEMS.filter((s) => !tms.SECTION_BY_CODE[s.section]).map((s) => s.code),
  [],
);

/**
 * Mã tham chiếu trong điều kiện KHÁC danh mục Tiểu mục.
 *
 * Điều kiện báo cáo nhắc tới nhiều mã hơn số dòng tên mà danh mục hiện hành có.
 * Phần chênh chưa được xác minh là gì — có thể là cận khoảng, mã loại trừ, hoặc
 * mã chưa vào danh mục — nên không nơi nào được gọi cả tập đó là "Tiểu mục".
 */
const dung = new Set();
for (const item of tms.TMS_ITEMS)
  for (const b of tms.branchesOfItem(item.code)) for (const c of b.subItems) dung.add(c);
const coTen = [...dung].filter((c) => tms.SUB_ITEM_BY_CODE[c]).length;
kiem("293 mã tham chiếu trong điều kiện", dung.size, 293);
kiem("174 mã đối chiếu được danh mục", coTen, 174);
kiem("119 mã chưa có dòng tên", dung.size - coTen, 119);
kiem("Mã tham chiếu không trùng với mã Mục", [...dung].filter((c) => tms.SECTION_BY_CODE[c]), []);

/* ════════════════════════════ Địa bàn ════════════════════════════════════ */

const catalog = await goi("src/domain/catalog.ts", "catalog.mjs");
const report = await goi("src/domain/report.ts", "report.mjs");

kiem("126 phường/xã hiện hành", catalog.LOCATIONS.length, 126);
kiem("Mã địa bàn không trùng", catalog.LOCATIONS.length, new Set(catalog.LOCATIONS.map((l) => l.id)).size);
// "Cấp thành phố" là một phạm vi báo cáo, KHÔNG phải một phường/xã.
kiem(
  "Chiều địa bàn = 126 phường/xã + 1 phạm vi thành phố",
  report.DIMENSION_BY_ID.location.members.length,
  127,
);
kiem(
  "Không phường/xã nào mang mã của phạm vi thành phố",
  catalog.LOCATIONS.some((l) => l.id === report.CITY_SCOPE.id),
  false,
);

/* ═══════════════════ Cây chỉ tiêu và chiều báo cáo ═══════════════════════ */

const cay = JSON.parse(await readFile(path.join(GOC, "src/domain/report-tree.json"), "utf8")).rows;
kiem("113 dòng chỉ tiêu báo cáo", cay.length, 113);
kiem("Mã chỉ tiêu không trùng", cay.length, new Set(cay.map((r) => r.id)).size);
kiem("Số dòng chỉ tiêu khác số Tiểu mục", cay.length === tms.SUB_ITEMS.length, false);

// Mọi tab đọc CÙNG một danh mục: chiều báo cáo phải suy từ domain, không tự dựng.
kiem("Chiều cơ quan thuế = danh mục CQT", report.DIMENSION_BY_ID.taxOffice.members.length,
  tms.TAX_OFFICE_ENTITIES.length);
kiem("Chiều địa bàn phủ đủ 126 phường/xã",
  catalog.LOCATIONS.filter((l) => !report.DIMENSION_BY_ID.location.members.some((m) => m.id === l.id)).length, 0);
// "Chưa xác định" là trạng thái dữ liệu: có trên lưới, không có trong danh mục.
for (const chieu of ["location", "taxOffice", "industry"])
  kiem(
    `Chiều ${chieu}: "Chưa xác định" chỉ thêm ở lưới, không nằm trong danh mục`,
    [
      report.DIMENSION_BY_ID[chieu].members.some((m) => m.id === report.GRID_UNCLASSIFIED),
      report.gridMembersOf(chieu).length - report.DIMENSION_BY_ID[chieu].members.length,
    ],
    [false, 1],
  );

/* ═══════════════════ Bất biến của phép tổng hợp ══════════════════════════ */

const mockTms = await goi("src/data/mock/tms.ts", "mock-tms.mjs");
const mockWs = await goi("src/data/mock/workspaces.ts", "mock-ws.mjs");
const F = (o = {}) => ({ year: 2026, periodType: "MONTH", period: 8, accumulation: "PERIOD",
  indicator: "tong-so", budgetLevel: "NSNN", ...o });

// NSTW + NSĐP = Tổng NSNN. Cùng phạm vi, cùng bản chất số liệu thì phải khớp.
for (const ky of [3, 8]) {
  const t = (lv) => mockTms.buildTmsBreakdown(F({ budgetLevel: lv, period: ky }), "all")?.levelTotal.amount ?? null;
  const nsnn = t("NSNN"), tw = t("NSTW"), dp = t("NSDP");
  kiem(`Kỳ ${ky}: NSTW + NSĐP = Tổng NSNN`, tw + dp - nsnn, 0);
}

const bd = mockTms.buildTmsBreakdown(F(), "all");
// Mỗi Mục bằng đúng tổng Tiểu mục của nó; và tổng các Mục bằng tổng của cấp.
kiem(
  "Mọi Mục bằng tổng Tiểu mục của nó",
  bd.sections.filter(
    (s) => Math.abs(s.subItems.reduce((a, x) => a + (x.amount ?? 0), 0) - (s.amount ?? 0)) > 0.5,
  ).map((s) => s.id),
  [],
);
kiem(
  "Tổng các Mục bằng tổng của cấp",
  bd.sections.reduce((a, s) => a + (s.amount ?? 0), 0) - bd.levelTotal.amount,
  0,
);

// Tỷ trọng sau làm tròn phải bằng 100%, và các nhóm phải cộng đúng về tổng.
for (const chieu of ["industry", "taxOffice", "location"]) {
  const e = mockWs.buildEnterpriseManagement(F(), chieu);
  kiem(`Chiều ${chieu}: tỷ trọng cộng lại bằng 100%`,
    Number(e.groups.reduce((a, x) => a + (x.share ?? 0), 0).toFixed(4)), 100);
  kiem(`Chiều ${chieu}: tổng các nhóm bằng tổng chung`,
    e.groups.reduce((a, x) => a + x.amount, 0) - e.totals.amount, 0);
}

await rm(TAM, { recursive: true, force: true });

if (loi.length) {
  console.error("\n" + loi.join("\n"));
  console.error(`\n${loi.length} tiêu chí toàn vẹn dữ liệu KHÔNG đạt.`);
  process.exit(1);
}
console.log("\nToàn vẹn danh mục và số đếm: mọi tiêu chí đạt.");
