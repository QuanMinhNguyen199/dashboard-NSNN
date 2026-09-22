import indicators from "@/domain/tms-indicators.json";

/**
 * Xuất Excel theo ĐÚNG mẫu báo cáo thu nội địa của ngành.
 *
 * Khác với `ReportExportButton` — bộ xuất chung dựng một bảng phẳng cho mọi
 * báo cáo — file này dựng lại nguyên hình dạng của sheet mẫu: khối tiêu đề sáu
 * dòng, đầu bảng gộp hai dòng, cột STT giữ đúng ký hiệu gốc (`A`, `A*`, `I`,
 * `2.1.1`, `a`), và định dạng số kiểu kế toán.
 *
 * Mọi con số đo từ chính tệp mẫu, không ước lượng:
 *
 *   · Times New Roman 11 cho toàn bảng.
 *   · Bề rộng cột: STT 11,5 — Chỉ tiêu 60 — cột số 18.
 *   · Chiều cao dòng 13,5; riêng dòng đầu bảng số liệu 28,5.
 *   · Viền trái/phải `medium` ở mọi ô, viền trên/dưới `thin` giữa các dòng, và
 *     `medium` ở dòng đầu tiên của vùng số liệu.
 *   · Dòng tổng hợp in đậm; dòng chi tiết in nghiêng — đúng cách mẫu phân biệt
 *     dòng cộng với dòng lấy số trực tiếp.
 */

/**
 * Định dạng kế toán, chép NGUYÊN VĂN từ ô số của mẫu.
 *
 * Kể cả phần trông như gõ nhầm (`""??` thay vì `"-"??`, và vế âm dùng `#,###`
 * chứ không `#,##0`). Mục tiêu là file dán vào bộ hồ sơ mà không lệch một ô
 * nào, nên không "sửa cho đúng" hộ bên nghiệp vụ.
 */
const KE_TOAN = '_(* #,##0_);_(* \\-#,###;_(* ""??_);_(@_)';
const FONT = "Times New Roman";
const CO = 11;

type Cell = Record<string, unknown>;

const CHI_TIEU = indicators.chiTieu as {
  ma: string;
  stt: string | null;
  /** STT nguyên trạng: mẫu lưu `1` là số, `1.1` là chuỗi. */
  sttGoc: string | number | null;
  /** Nguyên văn trong mẫu, kể cả danh sách mã Tiểu mục trong ngoặc. */
  tenDayDu: string;
  dongExcel: number;
  congThuc: string | null;
}[];

interface KieuDong {
  sttDam: boolean; tenDam: boolean;
  soDam: boolean; soNghieng: boolean;
  soNgang: string | null; soDinhDang: string;
  vienTren: string | null; vienDuoi: string | null;
}

/**
 * Kiểu trình bày theo TỪNG MẪU, chép thẳng từ tám sheet mẫu.
 *
 * Không dùng chung một bộ cho cả tám: đo trên cột số, chỉ 4/113 dòng giống nhau
 * giữa mẫu 1 và mẫu 3. Lấy một mẫu làm chuẩn cho cả tám thì bảy mẫu còn lại
 * sai kiểu ở hầu hết các dòng.
 */
const KIEU = indicators.kieuTheoMau as Record<string, Record<string, KieuDong>>;

export interface TemplateColumn {
  /** Khoá để tra giá trị của từng dòng. */
  id: string;
  /** Nhãn tầng ngoài; `null` khi báo cáo chỉ có một chiều. */
  ngoai: string | null;
  /** Nhãn tầng trong, hoặc nhãn duy nhất khi báo cáo một chiều. */
  trong: string;
}

export interface NsnnTemplateInput {
  /** Tên đơn vị in ở hai dòng đầu, đúng thứ tự trong mẫu. */
  coQuan: [string, string];
  tieuDe: string;
  columns: TemplateColumn[];
  /** Giá trị theo `dongExcel` của chỉ tiêu rồi tới `column.id`. */
  giaTri: Map<number, Map<string, number | null>>;
  fileName: string;
  sheet: string;
  /** Số hiệu mẫu 1–8; quyết định bộ kiểu dùng cho bản xuất. */
  mauSo: number | null;
}

const nen = { fontFamily: FONT, fontSize: CO, alignVertical: "center" } as const;

/** Ô của khối tiêu đề: không viền, không nền. */
const oTieuDe = (value: string, extra: Cell = {}): Cell => ({
  ...nen,
  value,
  fontWeight: "bold",
  align: "left",
  ...extra,
});

/**
 * Ô đầu bảng, gộp hai dòng.
 *
 * Mẫu gộp A7:A8, B7:B8 … nên nhãn nằm giữa theo chiều dọc của cả hai dòng.
 * Không gộp thì dòng 8 hiện ra một dải ô trống có viền, đúng thứ người nhận sẽ
 * hỏi "dòng này để làm gì".
 */
const oDauBang = (value: string, dayThin = false): Cell => ({
  ...nen,
  value,
  fontWeight: "bold",
  align: "center",
  wrap: true,
  rowSpan: 2,
  borderStyle: "medium",
  // Mẫu để đáy hai cột nhãn là `thin`, còn các cột số là `medium`.
  ...(dayThin ? { bottomBorderStyle: "thin" } : {}),
});

/**
 * Tên sheet hợp lệ: Excel cấm `: \ / ? * [ ]` và giới hạn 31 ký tự.
 *
 * "Tháng 8/2026" có dấu gạch chéo nên bị chặn. Không thay ở đây thì nút báo lỗi
 * đúng lúc người dùng cần file — và câu lỗi nói về ký tự lạ chứ không nói về kỳ
 * báo cáo, nên không ai đoán ra nguyên nhân.
 */
const tenSheet = (raw: string): string =>
  (raw.replace(/[:\/?*[\]]/g, "-").trim() || "Bao cao").slice(0, 31);

/**
 * Hai dòng đầu bảng.
 *
 * Năm trong tám mẫu là báo cáo HAI CHIỀU, và chúng dựng đầu bảng hai tầng: dòng
 * 7 là chiều ngoài, gộp ngang đúng số cột con của nó; dòng 8 là chiều trong.
 * Ba mẫu một chiều thì nhãn gộp dọc hai dòng.
 *
 * Viết một tầng cho cả tám là sai ở năm mẫu — và sai kiểu người nhận thấy ngay,
 * vì mất hẳn thông tin "cột này thuộc địa bàn nào".
 */
function dauBang(cot: TemplateColumn[], soCot: number): (Cell | null)[][] {
  const rong = (n: number): (Cell | null)[] => Array.from({ length: n }, () => null);
  if (!cot.some((c) => c.ngoai)) {
    return [
      [oDauBang("STT", true), oDauBang("CHỈ TIÊU", true), ...cot.map((c) => oDauBang(c.trong))],
      // Dòng 8 nằm trọn dưới `rowSpan` của dòng 7 nên phải toàn `null`.
      rong(soCot),
    ];
  }
  const tren: (Cell | null)[] = [oDauBang("STT", true), oDauBang("CHỈ TIÊU", true)];
  const duoi: (Cell | null)[] = [null, null];
  let i = 0;
  while (i < cot.length) {
    const nhom = cot[i].ngoai;
    let j = i;
    while (j < cot.length && cot[j].ngoai === nhom) j += 1;
    tren.push({
      ...nen,
      value: nhom ?? "",
      fontWeight: "bold",
      align: "center",
      wrap: true,
      borderStyle: "medium",
      columnSpan: j - i,
    });
    // Các ô bị ô gộp trùm lên phải là `null`.
    for (let k = i + 1; k < j; k += 1) tren.push(null);
    for (let k = i; k < j; k += 1) {
      duoi.push({
        ...nen,
        value: cot[k].trong,
        fontWeight: "bold",
        align: "center",
        wrap: true,
        borderStyle: "medium",
      });
    }
    i = j;
  }
  return [tren, duoi];
}

export async function xuatTheoMauNganh(input: NsnnTemplateInput): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const soCot = input.columns.length + 2;
  /**
   * Ô bị một ô khác trùm lên phải là `null`, KHÔNG phải ô rỗng có kiểu chữ.
   *
   * Thư viện từ chối ghi cả file nếu ô bị trùm mang bất cứ thuộc tính nào — và
   * câu lỗi nói về `columnSpan` chứ không nói rằng ô hàng xóm mới là chỗ sai.
   */
  const rong = (n: number): (Cell | null)[] => Array.from({ length: n }, () => null);

  const data: (Cell | null)[][] = [
    [oTieuDe(input.coQuan[0], { columnSpan: 2 }), ...rong(soCot - 1)],
    [oTieuDe(input.coQuan[1], { columnSpan: 2 }), ...rong(soCot - 1)],
    // Mẫu gộp A3:B3 và A4:B4 dù hai dòng này trống; giữ đúng để khung tiêu đề
    // có cùng hình dạng khi người nhận chỉnh sửa tiếp.
    [oTieuDe("", { columnSpan: 2 }), ...rong(soCot - 1)],
    [oTieuDe(" ", { columnSpan: 2 }), ...rong(soCot - 1)],
    [oTieuDe(input.tieuDe, { align: "center", columnSpan: Math.min(3, soCot) }), ...rong(soCot - 1)],
    [],
    ...dauBang(input.columns, soCot),
  ];

  // Cặp chiều ngoài tám mẫu thì mượn kiểu của mẫu 1 — vẫn đọc được, và nhãn
  // trên màn hình đã nói rõ đây không phải một trong tám mẫu.
  const boKieu = KIEU[String(input.mauSo ?? 1)] ?? KIEU["1"];
  for (const ct of CHI_TIEU) {
    const k = boKieu[String(ct.dongExcel)];
    // Viền và kiểu chữ chép từ mẫu, không suy ra luật: mẫu in đậm theo cách của
    // nghiệp vụ, có dòng không theo quy tắc nào đoán được. Đoán thì 152 ô lệch.
    const vien = {
      leftBorderStyle: "medium",
      rightBorderStyle: "medium",
      ...(k.vienTren ? { topBorderStyle: k.vienTren } : {}),
      ...(k.vienDuoi ? { bottomBorderStyle: k.vienDuoi } : {}),
    } as const;
    const nhan = { ...nen, ...vien, wrap: true };
    const so = input.giaTri.get(ct.dongExcel);
    data.push([
      {
        ...nhan,
        align: "right",
        ...(k.sttDam ? { fontWeight: "bold" as const } : {}),
        // Giữ đúng kiểu của mẫu: số ghi ra số, chuỗi ghi ra chuỗi.
        ...(typeof ct.sttGoc === "number"
          ? { value: ct.sttGoc, type: Number }
          : { value: (ct.sttGoc as string | null) ?? "", type: String }),
      },
      { ...nhan, value: ct.tenDayDu, align: "left", ...(k.tenDam ? { fontWeight: "bold" as const } : {}) },
      ...input.columns.map((c) => {
        const v = so?.get(c.id) ?? null;
        const kieuChu = {
          ...nen,
          ...vien,
          wrap: true,
          ...(k.soDam ? { fontWeight: "bold" as const } : {}),
          ...(k.soNghieng ? { fontStyle: "italic" as const } : {}),
          ...(k.soNgang ? { align: k.soNgang as "left" | "center" | "right" } : {}),
        };
        // `format` chỉ gắn được lên ô CÓ giá trị. Ô trống mang định dạng số thì
        // thư viện từ chối ghi cả file — mà ô trống là chuyện thường, vì chỉ
        // tiêu nào chưa có số thì để trống chứ không điền 0.
        if (v === null) return kieuChu;
        return k.soDinhDang === "General"
          ? { ...kieuChu, value: v, type: Number }
          : { ...kieuChu, value: v, type: Number, format: KE_TOAN };
      }),
    ]);
  }

  const blob = await writeXlsxFile(data as never, {
    sheet: tenSheet(input.sheet),
    columns: [
      { width: 11.5 },
      { width: 60 },
      ...input.columns.map(() => ({ width: 18 })),
    ],
    // Đầu bảng nằm ở dòng 7–8; dính tới hết dòng 8 để cuộn xuống chỉ tiêu thứ
    // một trăm vẫn biết đang đọc cột nào.
    stickyRowsCount: 8,
    /*
      Đóng băng cột STT và CHỈ TIÊU.

      Tệp mẫu không đóng băng gì cả, nhưng bản xuất này rộng tới 392 cột: cuộn
      sang cột thứ ba mươi là tên chỉ tiêu đã trôi khỏi màn hình, và người đọc
      còn lại một biển số không có nhãn. Đóng băng không đụng tới nội dung hay
      định dạng ô nào, nên độ khớp với mẫu giữ nguyên.
    */
    stickyColumnsCount: 2,
  }).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${input.fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Thu hồi ngay có thể huỷ lượt tải: trình duyệt đọc blob sau khi cú bấm đã
  // trả về.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
