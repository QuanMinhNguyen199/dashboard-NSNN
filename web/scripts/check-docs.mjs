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

/**
 * Đọc file có thể VẮNG MẶT một cách hợp lệ.
 *
 * `bao-cao-outline/noi-bo/` bị `.gitignore` loại khỏi repo có chủ ý — đó là tài
 * liệu nội bộ mô tả bộ số liệu mật. Nên trên máy lập trình viên thì thư mục đó
 * có, còn trên CI thì không bao giờ có. Trước đây `read()` ném ENOENT giữa
 * `npm run build`, và vì `check:docs` nằm trong chuỗi build nên **cả CI lẫn
 * deploy GitHub Pages đều chết** bằng một stack trace của `node:fs`, ở một bước
 * chẳng liên quan gì tới việc dịch mã.
 *
 * Một cổng kiểm tra không được đòi thứ mà chính sách của kho mã cấm nó có.
 */
const readOptional = (p) => {
  try {
    return read(p);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};

const BA = "bao-cao-outline/noi-bo/BA-PHAN-TICH-TMS-THEO-CHUONG-VA-DIA-BAN.md";
const problems = [];

/** Nhãn tab lấy thẳng từ nguồn, không chép tay sang đây. */
const tabs = [...read("web/src/app/tabs.ts").matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);
/** Nhãn ô lọc: cả ô chọn thường và ô tìm kiếm gợi ý trong thanh lọc. */
const filterBar = read("web/src/components/FilterBar.tsx");
const filters = [...filterBar.matchAll(/<span>([^<{]+)<\/span>/g), ...filterBar.matchAll(/<AutocompleteSelect\b[^>]*\blabel="([^"]+)"/gs)]
  .map((m) => m[1].trim())
  .filter((x) => !["Kỳ báo cáo", "Phạm vi"].includes(x));

const ba = readOptional(BA);

/**
 * Không có tài liệu thì bỏ qua, và nói rõ là đã bỏ qua.
 *
 * Im lặng thoát 0 còn tệ hơn: một lần CI xanh sẽ ngầm bảo rằng tài liệu đã được
 * đối chiếu, trong khi thật ra chưa hề. Câu dưới đây nói đúng cái đã làm và cái
 * chưa làm, để người đọc log không tự suy ra điều sai.
 */
if (ba === null) {
  console.log(
    [
      `⊘ Bỏ qua đối chiếu tài liệu: không có ${BA}.`,
      "  Thư mục tài liệu nội bộ nằm ngoài kho mã theo .gitignore, nên phép kiểm này",
      "  chỉ chạy được trên máy có bộ tài liệu. Giao diện KHÔNG được đối chiếu lần này.",
    ].join("\n"),
  );
  process.exit(0);
}

for (const tab of tabs)
  if (!ba.includes(tab)) problems.push(`Tab "${tab}" có trong giao diện nhưng không có trong ${BA}`);

/**
 * Chiều NGƯỢC LẠI: tài liệu mô tả một tab mà giao diện không còn có.
 *
 * Bản cũ chỉ soi một chiều — mỗi tab đang có phải được nhắc trong tài liệu — cộng
 * một danh sách chuỗi cũ viết tay ("Chi tiết thu |"). Nên khi tab Đối soát Kho
 * bạc bị gỡ khỏi giao diện, tài liệu vẫn liệt kê nó kèm trạng thái "Đã dựng" và
 * phép kiểm **vẫn báo xanh**: không tab hiện có nào thiếu, còn cái thừa thì
 * không ai hỏi tới. Một danh sách viết tay chỉ bắt được đúng lần đã xảy ra.
 *
 * Đọc thẳng cột đầu của bảng tab trong tài liệu và so hai chiều. Bảng nhận ra
 * bằng hàng tiêu đề bắt đầu bằng "| Tab |".
 */
const LINE_BREAK = String.fromCharCode(10);
const tabTable = ba.match(
  new RegExp(`^\\| Tab \\|.*${LINE_BREAK}\\|[-| ]+\\|${LINE_BREAK}((?:\\|.*${LINE_BREAK})+)`, "m"),
);
if (!tabTable) {
  problems.push(`${BA} không còn bảng tab (hàng tiêu đề "| Tab |"), nên không đối chiếu được.`);
} else {
  const documented = tabTable[1]
    .trim()
    .split(LINE_BREAK)
    .map((row) => row.split("|")[1]?.trim())
    .filter(Boolean);
  for (const named of documented)
    if (!tabs.includes(named))
      problems.push(`${BA} còn mô tả tab "${named}", nhưng giao diện không còn tab đó`);
}

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
