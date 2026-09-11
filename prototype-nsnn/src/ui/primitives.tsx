import type { ReactNode } from "react";
import type { AmountRow, ResourceState } from "../dashboard/types";
import { yoy } from "../dashboard/selectors";

/* ───────────────────────────── Định dạng số ─────────────────────────────── */

/** Tiền, đơn vị đồng. Một thang duy nhất cho toàn ứng dụng. */
export function money(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1e12) return sign + (abs / 1e12).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + " nghìn tỷ";
  if (abs >= 1e9) return sign + (abs / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " tỷ";
  if (abs >= 1e6) return sign + (abs / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " triệu";
  return value.toLocaleString("vi-VN");
}

export const exact = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value) ? "—" : Math.round(value).toLocaleString("vi-VN") + " đ";

/** Phần trăm một số lẻ theo vi-VN; không bao giờ in NaN hay Infinity. */
export function pct(value: number | null | undefined, withSign = false): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const text = Math.abs(value).toLocaleString("vi-VN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const sign = withSign ? (value > 0 ? "+" : value < 0 ? "−" : "") : value < 0 ? "−" : "";
  return `${sign}${text}%`;
}

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ─────────────────────────────── Bề mặt ─────────────────────────────────── */

export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("dcard", className)}>
      <header className="dcard-head">
        <div className="dcard-title">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="dcard-actions">{actions}</div>}
      </header>
      <div className="dcard-body">{children}</div>
    </section>
  );
}

/** Tam giác chỉ hướng vẽ bằng SVG — màu không bao giờ là dấu hiệu duy nhất. */
function Caret({ dir }: { dir: "up" | "down" }) {
  return (
    <svg width="7" height="6" viewBox="0 0 7 6" aria-hidden="true" focusable="false">
      <path d={dir === "up" ? "M3.5 0 7 6H0z" : "M3.5 6 0 0h7z"} fill="currentColor" />
    </svg>
  );
}

export function Change({
  current,
  previous,
  label = "so cùng kỳ",
}: {
  current: number | null;
  previous: number | null;
  label?: string;
}) {
  const value = yoy(current, previous);
  if (value === null)
    return (
      <span
        className="dchange neutral"
        title="Cùng kỳ năm trước chưa có số liệu, hoặc quá nhỏ để tỷ lệ phần trăm còn có nghĩa."
      >
        Chưa có kỳ trước
      </span>
    );
  const tone = value > 0.05 ? "up" : value < -0.05 ? "down" : "flat";
  return (
    <span className={`dchange ${tone}`}>
      {tone !== "flat" && <Caret dir={tone === "up" ? "up" : "down"} />}
      {pct(value, true)}
      <span className="sr-only"> {label}</span>
    </span>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  hint,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  /** Tắt khi lựa chọn không còn nghĩa trong ngữ cảnh hiện tại. */
  disabled?: boolean;
  /** Lý do bị tắt — hiện qua title để người dùng biết vì sao. */
  hint?: string;
}) {
  return (
    <div
      className={cx("dseg", disabled && "is-disabled")}
      role="group"
      aria-label={label}
      title={disabled ? hint : undefined}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          aria-pressed={value === option.value}
          className={value === option.value ? "is-active" : undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ──────────────────────── Danh sách thanh xếp hạng ──────────────────────── */

/**
 * `scale` phải trùng đại lượng dùng để sắp xếp:
 *   · `amount` — thanh chạy từ 0 theo số tiền.
 *   · `share`  — thanh đo trên tổng, dùng cho cặp phần-trên-tổng.
 *   · `change` — thanh phân kỳ quanh mốc 0 theo %YoY.
 */
export function Bars({
  rows,
  total,
  scale = "amount",
  onSelect,
  emptyText = "Không có mục nào khớp bộ lọc hiện tại.",
}: {
  rows: AmountRow[];
  total?: number | null;
  scale?: "amount" | "share" | "change";
  onSelect?: (row: AmountRow) => void;
  emptyText?: string;
}) {
  if (!rows.length) return <p className="dempty">{emptyText}</p>;

  const changes = rows.map((row) => yoy(row.amount, row.previous));
  const maxAmount = Math.max(...rows.map((row) => Math.abs(row.amount)), 1);
  const maxChange = Math.max(...changes.map((c) => Math.abs(c ?? 0)), 1);
  const twoSided =
    scale === "change" && changes.some((c) => (c ?? 0) < 0) && changes.some((c) => (c ?? 0) > 0);
  const reach = twoSided ? 50 : 100;

  return (
    <ul className={cx("dbars", twoSided && "is-two-sided")}>
      {rows.map((row, index) => {
        const change = changes[index] ?? 0;
        const width =
          scale === "change"
            ? (Math.abs(change) / maxChange) * reach
            : scale === "share" && total
              ? (Math.abs(row.amount) / total) * 100
              : (Math.abs(row.amount) / maxAmount) * 100;
        const inner = (
          <>
            <span className="dbar-rank">{index + 1}</span>
            <span className="dbar-main">
              <span className="dbar-label">
                {/* Tên dài bị cắt ở thẻ hẹp: giữ nguyên bản đầy đủ trong title. */}
                <b title={row.name}>{row.name}</b>
                <span>
                  {money(row.amount)}
                  {row.share != null && ` · ${pct(row.share)}`}
                </span>
              </span>
              <span className="dbar-track">
                <i
                  className={scale === "change" ? (change >= 0 ? "pos" : "neg") : undefined}
                  style={{
                    width: `${Math.max(width, 0.5)}%`,
                    left: twoSided ? (change >= 0 ? "50%" : `${50 - width}%`) : 0,
                  }}
                />
              </span>
            </span>
            <Change current={row.amount} previous={row.previous} />
          </>
        );
        return (
          <li key={row.id}>
            {onSelect ? (
              <button type="button" className="dbar-row" onClick={() => onSelect(row)}>
                {inner}
              </button>
            ) : (
              <div className="dbar-row is-static">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ──────────────────────────── Trạng thái dữ liệu ────────────────────────── */

export function ResourceView<T>({
  resource,
  retry,
  children,
  minHeight = 160,
}: {
  resource: ResourceState<T>;
  retry?: () => void;
  children: (data: T, partial?: string) => ReactNode;
  minHeight?: number;
}) {
  if (resource.status === "loading")
    return (
      <div className="dstate is-loading" style={{ minHeight }} role="status" aria-live="polite">
        <span>Đang tổng hợp số liệu…</span>
      </div>
    );
  if (resource.status === "error")
    return (
      <div className="dstate is-error" style={{ minHeight }} role="alert">
        <b>Không tải được dữ liệu</b>
        <span>{resource.message}</span>
        {resource.retryable && retry && (
          <button type="button" className="dbtn" onClick={retry}>
            Thử lại
          </button>
        )}
      </div>
    );
  if (resource.status === "no-data")
    return (
      <div className="dstate" style={{ minHeight }}>
        <b>Chưa có số liệu</b>
        <span>{resource.message}</span>
      </div>
    );
  if (resource.status === "not-applicable")
    return (
      <div className="dstate is-quiet" style={{ minHeight }}>
        <span>{resource.reason}</span>
      </div>
    );
  return <>{children(resource.data, resource.status === "partial" ? resource.message : undefined)}</>;
}

export function CoverageNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="dnote" role="note">
      <span aria-hidden="true">⚠</span> {message} Các số dưới đây là dữ liệu thật của phần đã báo cáo,
      không suy diễn cho phần còn thiếu.
    </p>
  );
}
