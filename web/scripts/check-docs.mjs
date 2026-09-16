/**
 * Tài liệu nghiệp vụ và giao diện phải nói cùng một chuyện.
 *
 * Đây là loại lệch không ai phát hiện ra: cả hai bên đều đúng về mặt nội bộ, chỉ
 * là chúng mô tả hai sản phẩm khác nhau. Người đọc tài liệu đi tìm một tab không
 * tồn tại, hoặc chờ một ô lọc đã bị gỡ. Phép kiểm này so những điều KIỂM ĐƯỢC:
 * danh sách tab và danh sách ô lọc.
 *
 *   node scripts/check-docs.mjs
 */
import { readFileSync } from "node:fs";

const ROOT = new URL("../../", import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");

const BA = "bao-cao-outline/BA-PHAN-TICH-TMS-THEO-CHUONG-VA-DIA-BAN.md";
const problems = [];

/** Nhãn tab lấy thẳng từ nguồn, không chép tay sang đây. */
const tabs = [...read("web/src/app/tabs.ts").matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);
/** Nhãn ô lọc: các `<span>` con trực tiếp của label trong thanh lọc. */
const filterBar = read("web/src/components/FilterBar.tsx");
const filters = [...filterBar.matchAll(/<span>([^<{]+)<\/span>/g)]
  .map((m) => m[1].trim())
  .filter((x) => !["Kỳ báo cáo", "Phạm vi"].includes(x));

const ba = read(BA);

for (const tab of tabs)
  if (!ba.includes(tab)) problems.push(`Tab "${tab}" có trong giao diện nhưng không có trong ${BA}`);

// Tab đã bỏ mà tài liệu còn nhắc như đang có.
for (const stale of ["Chi tiết thu |"])
  if (ba.includes(stale)) problems.push(`${BA} còn mô tả tab "${stale.replace(" |", "")}" đã không còn trong giao diện`);

for (const field of filters)
  if (!ba.includes(field)) problems.push(`Ô lọc "${field}" có trong giao diện nhưng không được nhắc trong ${BA}`);

// Ô đã gỡ khỏi thanh lọc: tài liệu không được liệt kê nó như một ô còn dùng.
if (/Bộ lọc chung:[^\n]*chỉ tiêu\./.test(ba))
  problems.push(`${BA} vẫn liệt kê "chỉ tiêu" như một ô trong thanh lọc, nhưng ô đó đã được gỡ`);

if (problems.length) {
  console.error("✗ Tài liệu và giao diện đang lệch nhau:\n");
  for (const p of problems) console.error("  · " + p);
  console.error(`\n${problems.length} chỗ cần sửa.`);
  process.exit(1);
}
console.log(`✓ ${tabs.length} tab và ${filters.length} ô lọc đều khớp với tài liệu nghiệp vụ.`);
