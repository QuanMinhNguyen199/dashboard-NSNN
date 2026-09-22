import type { ReactNode } from "react";
import { cx } from "@/components/primitives";

/**
 * Dải chỉ số và một ô trong dải.
 *
 * Cùng một hình dạng — nhãn, giá trị, dòng phụ — lặp **16 lần** trên bốn tab,
 * chỉ khác nội dung. Trước đây mỗi tab tự dựng lại `<section><div><span>…`, nên
 * thêm một biến thể là phải sửa bốn chỗ và rất dễ sót một.
 *
 * Ô không tự quyết định cách hiển thị giá trị: nó nhận `children` đã dựng sẵn.
 * Có ô in tiền, có ô in phần trăm, có ô in mã địa bàn — ép chúng qua một
 * `value: number` sẽ biến component thành cái máy phân nhánh.
 */

export type KpiTone = "positive" | "critical" | "warning" | "neutral";

export function KpiStrip({
  label,
  children,
  columns = 4,
}: {
  /** Nhãn cho trình đọc màn hình; dải không có tiêu đề nhìn thấy được. */
  label: string;
  children: ReactNode;
  /**
   * Số cột của dải.
   *
   * Phải chia hết số ô, nếu không hàng cuối để hở và dải trông như bị cắt dở.
   * Sáu ô thì dùng 3 (hai hàng đầy), năm ô thì dùng 5. Ba workspace mở có 5–6
   * KPI nên dải không còn mặc định bốn ô như trước.
   */
  columns?: 3 | 4 | 5 | 6;
}) {
  return (
    <section className="dkpis" data-columns={columns} aria-label={label}>
      {children}
    </section>
  );
}

export function Kpi({
  label,
  note,
  code = false,
  tone,
  onActivate,
  controls,
  children,
}: {
  label: string;
  /** Dòng phụ: so cùng kỳ, mẫu số, hoặc ngữ cảnh của con số. */
  note?: ReactNode;
  /** Mã định danh chứ không phải số đo: nhỏ hơn một bậc, giãn chữ nhẹ. */
  code?: boolean;
  /** Chiều biến động của chính giá trị. Bỏ trống khi giá trị không có chiều. */
  tone?: "pos" | "neg";
  /** Chỉ truyền khi ô thực sự dẫn tới một vùng nội dung chi tiết. */
  onActivate?: () => void;
  controls?: string;
  children: ReactNode;
}) {
  const content = (
    <>
      <span>{label}</span>
      <strong className={cx(code && "is-code", tone && `tone-${tone}`)}>{children}</strong>
      {note && <small>{note}</small>}
    </>
  );

  return (
    <div className={cx(onActivate && "is-actionable")}>
      {onActivate ? (
        <button type="button" className="dkpi-action" aria-controls={controls} onClick={onActivate}>
          {content}
        </button>
      ) : content}
    </div>
  );
}

/**
 * Ô cuối của dải Tổng quan: một câu nhận định thay cho một con số.
 * Nền lõm và màu theo mức độ để nó đọc như một kết luận, không như số thứ năm.
 */
export function KpiInsight({
  label,
  tone,
  note,
  children,
}: {
  label: string;
  tone: KpiTone;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`dkpi-insight tone-${tone}`}>
      <span>{label}</span>
      <strong>{children}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
