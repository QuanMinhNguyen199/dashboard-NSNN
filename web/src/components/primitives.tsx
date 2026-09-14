import type { ReactNode } from "react";
import type { AmountRow, ResourceState } from "@/domain/types";
import { yoy } from "@/domain/metrics";

/* ───────────────────────────── Định dạng số ─────────────────────────────── */

/**
 * Tiền tệ: MỘT đơn vị cho cả một cột, không phải mỗi giá trị một đơn vị.
 *
 * Cách cũ chọn đơn vị theo từng số nên trong cùng một danh sách xếp hạng có
 * "50,72 nghìn tỷ" đứng cạnh "303,9 tỷ" — mắt phải đọc hậu tố mới biết số nào
 * lớn hơn, đúng thứ mà một bảng xếp hạng phải cho biết ngay. Bảng chi tiết tệ
 * hơn: bốn đơn vị trong sáu cột.
 *
 * Quy tắc mới, theo lối bảng số liệu tài chính:
 *   · Đơn vị chọn một lần cho cả tập giá trị, lấy theo giá trị lớn nhất.
 *   · Số lẻ cố định trong cả cột, nên dấu phẩy thẳng hàng.
 *   · Đơn vị ghi MỘT lần ở đầu thẻ hoặc đầu cột, không lặp ở từng dòng.
 *   · Giá trị nhỏ hơn độ phân giải hiển thị ghi "< 0,01" chứ không phải "0,00":
 *     số 0 tròn trĩnh là một khẳng định, không được nói thay cho phép làm tròn.
 */
export interface MoneyScale {
  divisor: number;
  /** Nhãn đơn vị đầy đủ, ví dụ "tỷ đồng". Ghi ở đầu thẻ hoặc đầu cột. */
  unit: string;
  /** Nhãn ngắn dùng khi số đứng một mình, ví dụ "tỷ". */
  short: string;
  decimals: number;
}

/**
 * Thang DỪNG Ở "tỷ" — không có bậc nghìn tỷ.
 *
 * Bậc 10¹² trong tiếng Việt là một từ ghép ("nghìn tỷ", CLDR viết tắt "NT").
 * Từ ghép bắt người đọc nhân nhẩm hai lần, còn "NT" thì không ai đọc ra. Dừng ở
 * "tỷ" cho cả ứng dụng đúng một đơn vị tiền duy nhất: mọi con số trên mọi tab
 * đều so được với nhau mà không phải đổi bậc lần nào. Số lớn dùng dấu chấm phân
 * cách nghìn — "434.710" đọc nhanh hơn "434,71 nghìn tỷ" vì không có phép nhân
 * nào trong đầu.
 *
 * Đây cũng là đơn vị của báo cáo ngân sách giấy: "Đơn vị tính: tỷ đồng".
 */
const STEPS = [
  { divisor: 1e9, unit: "tỷ đồng", short: "tỷ" },
  { divisor: 1e6, unit: "triệu đồng", short: "triệu" },
  { divisor: 1e3, unit: "nghìn đồng", short: "nghìn" },
  { divisor: 1, unit: "đồng", short: "đồng" },
];

/** Số lẻ đủ để giá trị lớn nhất còn khoảng bốn chữ số có nghĩa, cố định cả cột. */
const decimalsFor = (scaled: number) => (scaled >= 1000 ? 0 : scaled >= 100 ? 1 : 2);

/**
 * Chọn thang cho cả một tập giá trị. Lấy theo giá trị lớn nhất: dùng giá trị
 * nhỏ nhất sẽ cho ra những con số sáu bảy chữ số ở đầu bảng.
 */
export function moneyScale(values: Iterable<number | null | undefined>): MoneyScale {
  let max = 0;
  for (const value of values) {
    if (value == null || !Number.isFinite(value)) continue;
    max = Math.max(max, Math.abs(value));
  }
  const step = STEPS.find((candidate) => max >= candidate.divisor) ?? STEPS[STEPS.length - 1];
  return { ...step, decimals: step.divisor === 1 ? 0 : decimalsFor(max / step.divisor) };
}

/** Con số theo thang đã chọn, KHÔNG kèm đơn vị — đơn vị ghi một lần ở đầu cột. */
export function inScale(value: number | null | undefined, scale: MoneyScale): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const scaled = Math.abs(value) / scale.divisor;
  const floor = scale.decimals === 0 ? 1 : Math.pow(10, -scale.decimals);
  const sign = value < 0 ? "−" : "";
  // Dưới ngưỡng hiển thị thì ghi "<0,01" chứ không phải "0,00": số 0 tròn trĩnh
  // là một khẳng định, không được nói thay cho phép làm tròn. Viết liền để cả
  // cụm đọc như một token khi phía trước còn có dấu âm.
  if (scaled < floor)
    return `${sign}<${floor.toLocaleString("vi-VN", { minimumFractionDigits: scale.decimals })}`;
  return (
    sign +
    scaled.toLocaleString("vi-VN", {
      minimumFractionDigits: scale.decimals,
      maximumFractionDigits: scale.decimals,
    })
  );
}

/**
 * Tiền cho một giá trị ĐỨNG MỘT MÌNH (KPI, tooltip, nhãn trục) — có kèm đơn vị
 * vì không có đầu cột nào để ghi hộ. Dùng `inScale` cho mọi thứ xếp thành cột.
 */
export function money(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const scale = moneyScale([value]);
  const text = inScale(value, scale);
  return scale.short ? `${text} ${scale.short}` : text;
}

/**
 * Số tiền đứng một mình, tách chữ số khỏi đơn vị để chữ số giữ vai trò chính.
 * Đơn vị nhỏ hơn và nhạt hơn, không tranh chỗ với con số.
 */
export function Money({
  value,
  scale: given,
  className,
}: {
  value: number | null | undefined;
  /**
   * Thang dùng chung khi nhiều số đứng cạnh nhau và so sánh được với nhau —
   * ví dụ "Thu trong kỳ" và "Lũy kế từ đầu năm" trên cùng một dải KPI. Không
   * truyền thì mỗi số tự chọn thang của nó.
   */
  scale?: MoneyScale;
  className?: string;
}) {
  if (value == null || !Number.isFinite(value))
    return <span className={cx("dmoney", className)}>—</span>;
  const scale = given ?? moneyScale([value]);
  return (
    <span className={cx("dmoney", className)}>
      <b>{inScale(value, scale)}</b>
      {scale.short && <i>{scale.short}</i>}
    </span>
  );
}

/** Nhãn đơn vị dùng ở phụ đề thẻ hoặc đầu cột. */
export const unitLabel = (scale: MoneyScale) => `Đơn vị: ${scale.unit}`;

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
  unit,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  /** Đơn vị của các con số trong thẻ, ghi MỘT lần ở đây thay vì lặp từng dòng. */
  unit?: MoneyScale;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("dcard", className)}>
      <header className="dcard-head">
        <div className="dcard-title">
          <h2>{title}</h2>
          {(subtitle || unit) && (
            <p>
              {subtitle}
              {subtitle && unit && " · "}
              {unit && <span className="dunit">{unitLabel(unit)}</span>}
            </p>
          )}
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
      {/* Bỏ trống khi văn bản xung quanh đã nói câu này: trước đây dòng phụ của
          KPI đọc thành "+15,4% so cùng kỳ so cùng kỳ" cho trình đọc màn hình. */}
      {label && <span className="sr-only"> {label}</span>}
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
  money: moneyUnit,
  onSelect,
  emptyText = "Không có mục nào khớp bộ lọc hiện tại.",
}: {
  rows: AmountRow[];
  total?: number | null;
  scale?: "amount" | "share" | "change";
  /** Thang tiền dùng chung; bỏ trống thì tự tính từ chính các dòng đang hiển thị. */
  money?: MoneyScale;
  onSelect?: (row: AmountRow) => void;
  emptyText?: string;
}) {
  if (!rows.length) return <p className="dempty">{emptyText}</p>;

  const unit = moneyUnit ?? moneyScale(rows.map((row) => row.amount));

  const changes = rows.map((row) => yoy(row.amount, row.previous));
  const maxAmount = Math.max(...rows.map((row) => Math.abs(row.amount)), 1);
  const maxChange = Math.max(...changes.map((c) => Math.abs(c ?? 0)), 1);
  const twoSided =
    scale === "change" && changes.some((c) => (c ?? 0) < 0) && changes.some((c) => (c ?? 0) > 0);
  const reach = twoSided ? 50 : 100;

  return (
    <ul className={cx("dbars", twoSided && "is-two-sided")} data-unit={unit.divisor}>
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
                <span className="dbar-value">
                  {inScale(row.amount, unit)}
                  {row.share != null && <em>{pct(row.share)}</em>}
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
  children: (data: T) => ReactNode;
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
      <div className="dstate is-quiet" style={{ minHeight }} role="status">
        <b>Chưa có gì để hiển thị</b>
        <span>{resource.reason}</span>
      </div>
    );
  return <>{children(resource.data)}</>;
}
