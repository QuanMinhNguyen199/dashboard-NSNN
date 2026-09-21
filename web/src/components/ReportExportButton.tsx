import { useState } from "react";
import { DATA_SOURCE_NAME, FRESHNESS_STATUS_LABEL, type DataFreshness } from "@/domain/workspaces";

/**
 * Cách một cột được ghi ra Excel.
 *
 * Khai rõ ở từng cột chứ không đoán từ tiêu đề. Đoán theo chuỗi — thấy "(%)"
 * thì coi là phần trăm — sẽ hỏng lặng lẽ vào ngày ai đó đổi tên cột, và file
 * xuất ra vẫn mở được nên không ai biết là nó sai.
 */
export type ExportFormat = "text" | "money" | "percent" | "count";

/**
 * Một cột của bản xuất. `value` nhận cả hàng để cột dẫn xuất không phải tính hai lần.
 */
export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number | null;
  format?: ExportFormat;
  /** Bề rộng cột trong Excel, tính theo ký tự. */
  width?: number;
}

export interface ExportRequest<T> {
  /** Tên file, không được mang dữ liệu nhạy cảm. */
  fileName: string;
  columns?: ExportColumn<T>[];
  /**
   * Lấy TOÀN BỘ tập được phép xuất, không phải trang đang xem.
   *
   * Hàm chứ không phải mảng: bảng có phân trang thì mảng đang render chỉ là một
   * lát. Xuất đúng lát đó ra file rồi gọi nó là "báo cáo theo bộ lọc" là sai, và
   * là loại sai không ai phát hiện cho tới khi đối chiếu tổng.
   */
  rows: () => Promise<T[]> | T[];
  /**
   * Dùng cho báo cáo chéo: cả dòng lẫn cột chỉ biết được sau khi tải toàn bộ
   * các trang cột. Khi có `prepare`, nút xuất dùng kết quả này thay cho
   * `rows`/`columns` tĩnh.
   */
  prepare?: () => Promise<{ rows: T[]; columns: ExportColumn<T>[] }>;
  /** Tên sheet và tiêu đề in ở dòng đầu. Mặc định lấy theo `fileName`. */
  title?: string;
  meta: {
    periodLabel: string;
    scopeLabel: string;
    unit: string;
    freshness: DataFreshness;
  };
}

type Phase = "idle" | "working" | "done" | "error";

/**
 * Xuất Excel theo đúng bộ lọc đang xem.
 *
 * Interface nhận một `ExportRequest` thay vì nhận sẵn mảng dòng, nên đổi từ CSV
 * sang XLSX chỉ phải viết lại một hàm serialize — không phải đụng vào từng
 * workspace.
 */
export function ReportExportButton<T>({
  request,
  label = "Xuất Excel",
}: {
  request: ExportRequest<T>;
  label?: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setPhase("working");
    setMessage(null);
    try {
      const prepared = request.prepare ? await request.prepare() : null;
      const rows = prepared?.rows ?? (await request.rows());
      const columns = prepared?.columns ?? request.columns;
      if (!columns?.length) throw new Error("Báo cáo chưa có cấu trúc cột để xuất.");
      await writeWorkbook(rows, request, columns);
      setPhase("done");
      setMessage(`Đã xuất ${rows.length.toLocaleString("vi-VN")} dòng.`);
    } catch (error) {
      setPhase("error");
      setMessage((error as Error)?.message ?? "Không tạo được file.");
    }
  };

  return (
    <span className="dexport">
      <button type="button" className="dbtn" onClick={run} disabled={phase === "working"}>
        {phase === "working" ? "Đang tạo file…" : label}
      </button>
      {/* Vùng sống luôn có mặt, rỗng khi chưa có gì: gắn vào DOM cùng lúc với
          nội dung thì trình đọc màn hình không bao giờ đọc được câu thông báo. */}
      <span className="sr-only" role="status">
        {message ?? ""}
      </span>
      {message && (
        <small className={phase === "error" ? "is-error" : undefined} aria-hidden="true">
          {message}
        </small>
      )}
    </span>
  );
}

/* ── Định dạng lấy theo file mẫu của ngành ────────────────────────────────────
 *
 * Bản mẫu do bên nghiệp vụ gửi dùng Times New Roman 14 cho toàn bảng, đầu bảng
 * nền vàng chữ đậm viền `medium`, ô số `#,##0`, ô tỷ lệ `0.0%`, cột tên rộng
 * khoảng 50 ký tự còn cột số khoảng 13. Giữ đúng các giá trị đó ở đây để file
 * xuất ra dán thẳng vào bộ hồ sơ của họ mà không phải định dạng lại.
 */
const FONT = "Times New Roman";
const SIZE = 14;
const HEAD_FILL = "#FFFF00";
const NUM_FORMAT: Record<ExportFormat, string | undefined> = {
  text: undefined,
  money: "#,##0",
  count: "#,##0",
  percent: "0.0%",
};

/**
 * Giá trị đưa vào ô, theo đúng kiểu Excel hiểu.
 *
 * Phần trăm trong app là số 0–100, còn Excel hiểu định dạng `0.0%` là "nhân với
 * 100 rồi thêm dấu %". Không chia 100 ở đây thì 12,5% xuất ra thành 1250,0%.
 */
/**
 * Mốc thời gian viết như người Việt đọc, không phải như máy ghi.
 *
 * `generatedAt` là chuỗi ISO. Đổ thẳng vào ô thì người nhận thấy
 * "2026-09-21T08:39:30.218Z" — đúng đến từng mili giây và không ai đọc nổi, lại
 * còn lệch múi giờ so với đồng hồ trên tường của họ.
 */
function stamp(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function cellValue(raw: string | number | null, format: ExportFormat) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return null;
    return format === "percent" ? raw / 100 : raw;
  }
  return String(raw);
}

async function writeWorkbook<T>(
  rows: T[],
  request: ExportRequest<T>,
  columns: ExportColumn<T>[],
): Promise<void> {
  // Nạp muộn: thư viện ghi xlsx nặng hơn phần còn lại của màn hình báo cáo cộng
  // lại, mà chỉ chạy khi người dùng thật sự bấm xuất. Import tĩnh thì mọi người
  // mở dashboard đều phải tải nó.
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const { meta } = request;
  const span = columns.length;
  const title = request.title ?? request.fileName;

  const base = { fontFamily: FONT, fontSize: SIZE, alignVertical: "center" } as const;
  const headCell = {
    ...base,
    fontWeight: "bold",
    backgroundColor: HEAD_FILL,
    align: "center",
    wrap: true,
    borderStyle: "medium",
  } as const;
  const bodyCell = { ...base, borderStyle: "thin" } as const;

  const metaRow = (key: string, value: string) => [
    { ...base, value: key, fontWeight: "bold" as const },
    { ...base, value, columnSpan: Math.max(1, span - 1) },
  ];

  const data = [
    [{ ...base, value: title, fontWeight: "bold" as const, fontSize: SIZE + 2, columnSpan: span }],
    metaRow("Kỳ báo cáo", meta.periodLabel),
    metaRow("Phạm vi", meta.scopeLabel),
    metaRow("Đơn vị", meta.unit),
    metaRow("Nguồn", meta.freshness.sources.map((s) => DATA_SOURCE_NAME[s]).join(" · ")),
    // Mốc chốt số để TRỐNG khi nguồn chưa chốt. Viết "chưa xác định" vào ô là
    // biến một ô trống thành một chuỗi, và cột mất khả năng lọc theo ngày.
    metaRow("Dữ liệu chốt lúc", stamp(meta.freshness.dataAsOf)),
    metaRow("Báo cáo dựng lúc", stamp(meta.freshness.generatedAt)),
    metaRow("Trạng thái", FRESHNESS_STATUS_LABEL[meta.freshness.status]),
    [],
    columns.map((c) => ({ ...headCell, value: c.header })),
    ...rows.map((row) =>
      columns.map((c) => {
        const format = c.format ?? "text";
        const value = cellValue(c.value(row), format);
        // `type` và `format` phải khớp nhau. Gắn `#,##0` lên một ô kiểu chuỗi
        // thì thư viện từ chối ghi cả file — đó là ô rỗng hoặc ô chữ lọt vào
        // một cột số, chuyện xảy ra ngay khi có một dòng chưa có số.
        if (value === null) return { ...bodyCell };
        if (typeof value === "number") {
          return {
            ...bodyCell,
            value,
            type: Number,
            format: NUM_FORMAT[format],
            align: "right" as const,
          };
        }
        return { ...bodyCell, value, type: String, align: "left" as const };
      }),
    ),
  ];

  const blob = await writeXlsxFile(data as never, {
    sheet: sheetName(title),
    // Đầu bảng nằm ở dòng 10; dính nó lại để cuộn xuống dòng 500 vẫn biết đang
    // đọc cột nào.
    stickyRowsCount: 10,
    columns: columns.map((c, i) => ({ width: c.width ?? (i === 0 ? 46 : 15) })),
  }).toBlob();

  // Tự tải xuống thay vì dùng `.toFile()` của thư viện: cùng một đường với mọi
  // chỗ khác trong app, và `URL.revokeObjectURL` chạy ngay nên không giữ lại
  // vài megabyte trong bộ nhớ sau mỗi lần xuất.
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${request.fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // KHÔNG thu hồi ngay. Trình duyệt đọc blob sau khi cú bấm đã trả về, nên thu
  // hồi trong cùng một nhịp có thể huỷ luôn lượt tải — và người dùng thấy nút
  // báo "đã xuất" mà không có file nào.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Tên sheet hợp lệ với Excel: tối đa 31 ký tự và không chứa `: \ / ? * [ ]`.
 * Tên sai thì Excel báo file hỏng chứ không báo sai tên sheet.
 */
function sheetName(raw: string): string {
  const cleaned = raw.replace(/[:\\/?*[\]]/g, " ").trim();
  return (cleaned || "Báo cáo").slice(0, 31);
}
