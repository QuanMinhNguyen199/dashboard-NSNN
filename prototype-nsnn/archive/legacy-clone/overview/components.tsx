import type { CSSProperties, ReactNode } from 'react';
import type { AmountRow } from './types';
import { yoy } from './data';
import { moneyFromTy } from '../lib/format';

export function Grid({ children }: { children: ReactNode }) {
  return <div className="ov-grid">{children}</div>;
}

export function Card({
  title, subtitle, span = 6, controls, children, className = '',
}: {
  title: string; subtitle?: string; span?: 12 | 8 | 7 | 6 | 5 | 4;
  controls?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`ov-card ${className}`} style={{ '--ov-span': span } as CSSProperties}>
      <header className="ov-card-head">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        {controls && <div className="ov-card-controls">{controls}</div>}
      </header>
      {children}
    </section>
  );
}

/**
 * Một thang tiền duy nhất cho cả ba tab. Overview tính bằng tỷ đồng nhưng hiển
 * thị qua cùng hàm rút gọn với hai tab kia, nên "46,03 nghìn tỷ" ở Tổng quan và
 * "3,04 nghìn tỷ" ở Chi tiết địa bàn đọc cùng một kiểu.
 */
export const ty = (n: number | null) => (n === null ? '—' : moneyFromTy(n));

/** Phần trăm một số lẻ, luôn kèm dấu — dùng chung cho mọi chỗ hiển thị biến động. */
export const pct1 = (n: number) =>
  `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;

/** Tam giác chỉ hướng, vẽ bằng SVG để cùng nét với phần còn lại. */
function Caret({ dir }: { dir: 'up' | 'down' }) {
  return (
    <svg className="ov-caret" width="7" height="6" viewBox="0 0 7 6" aria-hidden="true" focusable="false">
      <path d={dir === 'up' ? 'M3.5 0 7 6H0z' : 'M3.5 6 0 0h7z'} fill="currentColor" />
    </svg>
  );
}

export function Change({ row }: { row: AmountRow }) {
  const value = yoy(row.amount, row.previous);
  if (value === null) return <span className="ov-change neutral">Chưa đủ cơ sở</span>;
  const tone = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  return (
    <span className={`ov-change ${tone}`}>
      {tone !== 'neutral' && <Caret dir={tone} />}
      {pct1(value)}
    </span>
  );
}

export function Segmented<T extends string>({
  value, options, onChange, label,
}: {
  value: T; options: readonly { value: T; label: string }[];
  onChange: (value: T) => void; label: string;
}) {
  return (
    <div className="ov-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'active' : ''}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Danh sách xếp hạng.
 *
 * `scale` quyết định thanh mã hoá đại lượng nào — và phải luôn trùng với đại
 * lượng dùng để sắp xếp. Trước đây danh sách "biến động" sắp theo %YoY nhưng
 * thanh lại vẽ theo số tiền, nên độ dài thanh trông ngẫu nhiên.
 *   · `amount` — thanh chạy từ 0 theo số tiền.
 *   · `change` — thanh phân kỳ hai phía quanh mốc 0 theo %YoY.
 */
export function Bars({
  rows, total, onSelect, scale = 'amount',
}: {
  rows: AmountRow[]; total?: number;
  onSelect?: (row: AmountRow) => void; scale?: 'amount' | 'change' | 'share';
}) {
  if (!rows.length) return <p className="ov-empty-row">Không có dòng nào đủ điều kiện.</p>;

  const changes = rows.map((row) => yoy(row.amount, row.previous) ?? 0);
  const maxAmount = Math.max(...rows.map((row) => Math.abs(row.amount)), 1);
  const maxChange = Math.max(...changes.map(Math.abs), 1);
  // Chỉ dành nửa rãnh cho phía âm khi tập đang xem thật sự có cả hai dấu; nếu
  // mọi dòng cùng chiều thì mốc 0 nằm ở mép và thanh dùng trọn chiều rộng.
  const twoSided = scale === 'change' && changes.some((v) => v < 0) && changes.some((v) => v > 0);
  const span = twoSided ? 50 : 100;

  return (
    <div className={`ov-bars ${scale === 'change' ? 'is-diverging' : ''} ${twoSided ? 'is-two-sided' : ''}`}>
      {rows.map((row, index) => {
        const change = changes[index];
        const width =
          scale === 'change'
            ? (Math.abs(change) / maxChange) * span
            : scale === 'share' && total
              // Cặp phần-trên-tổng phải đo theo tổng, không theo dòng lớn nhất:
              // nếu không thì 47% cũng vẽ gần kín rãnh như 53%.
              ? (Math.abs(row.amount) / total) * 100
              : (Math.abs(row.amount) / maxAmount) * 100;
        return (
          <button
            className="ov-bar-row"
            type="button"
            key={row.id}
            onClick={() => onSelect?.(row)}
            disabled={!onSelect}
          >
            <span className="ov-rank">{index + 1}</span>
            <span className="ov-bar-main">
              <span className="ov-bar-label">
                <b>{row.name}</b>
                <span>
                  {ty(row.amount)}
                  {total ? ` · ${((row.amount / total) * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%` : ''}
                </span>
              </span>
              <i>
                <span
                  className={scale === 'change' ? (change >= 0 ? 'pos' : 'neg') : ''}
                  style={
                    scale === 'change'
                      ? {
                          width: `${width}%`,
                          left: twoSided ? (change >= 0 ? '50%' : `${50 - width}%`) : 0,
                        }
                      : { width: `${width}%` }
                  }
                />
              </i>
            </span>
            <Change row={row} />
          </button>
        );
      })}
    </div>
  );
}
