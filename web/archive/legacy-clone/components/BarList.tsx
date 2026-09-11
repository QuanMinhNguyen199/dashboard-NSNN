import { cx, money } from "../lib/format";

export interface BarRow {
  name: string;
  amount: number;
  id?: string;
}

/** `Go` — danh sách thanh ngang mảnh: tên trái, số tiền phải, thanh 4px bên dưới. */
export function BarList({
  rows,
  title,
  onRowClick,
}: {
  rows: BarRow[];
  title?: (row: BarRow) => string;
  onRowClick?: (row: BarRow) => void;
}) {
  if (!rows.length) return <p className="m-0 text-sm text-muted">Không có số liệu.</p>;
  const max = Math.max(...rows.map((r) => r.amount)) || 1;
  return (
    <div className="nsnn-barlist grid gap-2">
      {rows.map((row) => (
        <div
          key={row.name}
          title={title?.(row)}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={cx(
            "min-w-0",
            onRowClick && "cursor-pointer rounded-[.25rem] hover:bg-data-sub-bg",
          )}
        >
          <div className="flex items-baseline justify-between gap-2 text-[.83rem]">
            <span className="min-w-0 flex-1 truncate font-medium text-ink" title={row.name}>
              {row.name}
            </span>
            <span className="shrink-0 whitespace-nowrap text-muted">{money(row.amount)}</span>
          </div>
          <div className="nsnn-bar-track">
            <span
              className="nsnn-bar-fill"
              style={{ width: `${((row.amount / max) * 100).toFixed(1)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
