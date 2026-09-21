import { useState } from "react";
import { DATA_SOURCE_NAME, FRESHNESS_STATUS_LABEL, type DataFreshness } from "@/domain/workspaces";

/**
 * Một cột của bản xuất. `value` nhận cả hàng để cột dẫn xuất không phải tính hai lần.
 */
export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number | null;
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
  meta: {
    periodLabel: string;
    scopeLabel: string;
    unit: string;
    freshness: DataFreshness;
  };
}

type Phase = "idle" | "working" | "done" | "error";

/**
 * Xuất CSV theo đúng bộ lọc đang xem.
 *
 * Interface nhận một `ExportRequest` thay vì nhận sẵn mảng dòng, để thêm XLSX
 * hay PDF sau này chỉ phải viết thêm một hàm serialize — không phải đụng vào
 * từng workspace.
 */
export function ReportExportButton<T>({ request, label = "Xuất CSV" }: { request: ExportRequest<T>; label?: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setPhase("working");
    setMessage(null);
    try {
      const prepared = request.prepare ? await request.prepare() : null;
      const rows = prepared?.rows ?? await request.rows();
      const columns = prepared?.columns ?? request.columns;
      if (!columns?.length) throw new Error("Báo cáo chưa có cấu trúc cột để xuất.");
      const blob = new Blob([toCsv(rows, request, columns)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${request.fileName}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
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

/**
 * Chuỗi CSV có BOM UTF-8.
 *
 * Không có BOM thì Excel trên Windows đọc file theo bảng mã hệ thống và mọi dấu
 * tiếng Việt thành ký tự lạ — người nhận sẽ báo "file hỏng" chứ không báo "sai
 * bảng mã", nên lỗi này tốn rất nhiều lượt trao đổi để tìm ra.
 */
function toCsv<T>(rows: T[], request: ExportRequest<T>, columns: ExportColumn<T>[]): string {
  const { meta } = request;
  const head = [
    ["Kỳ báo cáo", meta.periodLabel],
    ["Phạm vi", meta.scopeLabel],
    ["Đơn vị", meta.unit],
    ["Nguồn", meta.freshness.sources.map((s) => DATA_SOURCE_NAME[s]).join(" · ")],
    ["Dữ liệu chốt lúc", meta.freshness.dataAsOf ?? "chưa xác định"],
    ["Báo cáo dựng lúc", meta.freshness.generatedAt],
    ["Trạng thái", FRESHNESS_STATUS_LABEL[meta.freshness.status]],
  ];
  const lines: string[] = [];
  for (const [k, v] of head) lines.push(`${cell(k)},${cell(v)}`);
  lines.push("");
  lines.push(columns.map((c) => cell(c.header)).join(","));
  for (const row of rows) lines.push(columns.map((c) => cell(c.value(row))).join(","));
  return "﻿" + lines.join("\r\n");
}

/**
 * Một ô CSV.
 *
 * Số giữ nguyên dấu chấm thập phân để Excel đọc ra SỐ. Định dạng `vi-VN` ở đây
 * sẽ biến "1.234,5" thành một chuỗi, và cả cột mất khả năng tính toán.
 */
function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
