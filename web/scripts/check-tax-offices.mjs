/**
 * Kiểm danh mục cơ quan thuế — chạy THẲNG mã domain, không đọc bằng mắt.
 *
 *   node scripts/check-tax-offices.mjs
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
const TAM = path.join(GOC, "node_modules", ".check-tax-offices");

const loi = [];
const kiem = (ten, thuc, mong) => {
  const ok = JSON.stringify(thuc) === JSON.stringify(mong);
  if (!ok) loi.push(`✗ ${ten}\n    mong đợi: ${JSON.stringify(mong)}\n    thực tế:  ${JSON.stringify(thuc)}`);
  else console.log(`✓ ${ten}`);
};

await mkdir(TAM, { recursive: true });
const ra = path.join(TAM, "tms.mjs");
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

await rm(TAM, { recursive: true, force: true });

if (loi.length) {
  console.error("\n" + loi.join("\n"));
  console.error(`\n${loi.length} tiêu chí danh mục cơ quan thuế KHÔNG đạt.`);
  process.exit(1);
}
console.log("\nDanh mục cơ quan thuế: mọi tiêu chí đạt.");
