import type { CSSProperties, ReactNode } from "react";

export type ColSpan = 12 | 8 | 7 | 6 | 5 | 4;

/**
 * Lưới 12 cột.
 *
 * Span đi qua CSS custom property đã kiểm tra, không dựng tên class Tailwind bằng
 * chuỗi động (chuỗi động sẽ bị purge và không có class thật trong bundle).
 * Không dùng `grid-auto-flow: dense` vì nó đảo thứ tự đọc và thứ tự tab bàn phím.
 */
const ALLOWED: ColSpan[] = [12, 8, 7, 6, 5, 4];

export const spanStyle = (span: ColSpan): CSSProperties =>
  ({ "--span": ALLOWED.includes(span) ? span : 12 }) as CSSProperties;

export function Grid({ children }: { children: ReactNode }) {
  return <div className="dg">{children}</div>;
}

export interface SlotConfig {
  id: string;
  span: ColSpan;
  /** Widget bị loại khỏi lưới khi không áp dụng cho ngữ cảnh hiện tại. */
  hidden?: boolean;
  render: () => ReactNode;
}

/**
 * Giải bố cục theo hàng: khi một widget trong cặp bị ẩn, widget còn lại nở ra
 * đủ 12 cột thay vì để lại khoảng trống.
 *   8 + 4 → 12 · 7 + 5 → 12 · 6 + 6 → 12
 */
export function resolveRow(slots: SlotConfig[]): { id: string; span: ColSpan; node: ReactNode }[] {
  const visible = slots.filter((slot) => !slot.hidden);
  if (visible.length === 0) return [];
  if (visible.length === 1)
    return [{ id: visible[0].id, span: 12, node: visible[0].render() }];
  return visible.map((slot) => ({ id: slot.id, span: slot.span, node: slot.render() }));
}

/** Dựng nhiều hàng, mỗi hàng tự giải span riêng. */
export function GridRows({ rows }: { rows: SlotConfig[][] }) {
  return (
    <Grid>
      {rows.flatMap((row) =>
        resolveRow(row).map((slot) => (
          <div key={slot.id} className="dg-cell" style={spanStyle(slot.span)}>
            {slot.node}
          </div>
        )),
      )}
    </Grid>
  );
}
