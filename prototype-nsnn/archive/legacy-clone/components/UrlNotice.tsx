import { useFilters } from "../state/FiltersProvider";

/** `N6` */
const ACC_LABEL: Record<string, string> = {
  PERIOD: "thực hiện trong kỳ",
  YTD: "luỹ kế từ đầu năm",
};

/** `M6` — banner amber liệt kê tham số URL đã bị bỏ qua. */
export function UrlNotice() {
  const f = useFilters();
  if (f.ignored.length === 0) return null;

  const periodText = f.month
    ? `tháng ${f.month}/${f.year}`
    : f.quarter
      ? `quý ${f.quarter}/${f.year}`
      : `năm ${f.year}`;

  return (
    <div
      role="alert"
      data-testid="url-param-notice"
      className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <span aria-hidden="true">⚠</span>
      <div className="grid gap-1">
        <p className="m-0">
          Đã bỏ qua {f.ignored.length} tham số trên đường dẫn:{" "}
          {f.ignored.map((row, i) => (
            <span key={`${row.param}:${i}`}>
              {i > 0 && "; "}
              <code className="rounded bg-amber-100 px-1">
                {row.param}={row.value}
              </code>{" "}
              — {row.reason}
            </span>
          ))}
        </p>
        <p className="m-0 font-semibold" data-testid="url-param-notice-current">
          Đang hiển thị: {f.wardName ?? "toàn thành phố"} · {periodText} · {ACC_LABEL[f.acc]} ·{" "}
          {f.item}
        </p>
      </div>
      <button
        type="button"
        onClick={f.clearIgnored}
        aria-label="Đóng cảnh báo"
        className="ml-auto rounded border border-amber-300 px-2 py-0.5 leading-none"
      >
        ×
      </button>
    </div>
  );
}
