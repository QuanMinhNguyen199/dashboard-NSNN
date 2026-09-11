import { TrendChart } from "@/components/TrendChart";

export { TrendChart };

import type { AmountRow, TrendPoint, Waterfall } from "@/domain/types";
import { inScale, money, moneyScale, pct } from "@/components/primitives";

const DONUT_COLORS = ["#1657a8", "#5598e7", "#9abfe9", "#637a94"];

/** Biểu đồ cơ cấu nhỏ gọn, có bảng chú giải đọc được bằng bàn phím. */
export function DonutChart({
  rows,
  centerLabel = "Tổng",
  selectedId,
  onSelect,
}: {
  rows: AmountRow[];
  centerLabel?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const positiveRows = rows.filter((row) => row.amount > 0);
  const total = positiveRows.reduce((sum, row) => sum + row.amount, 0);
  if (!positiveRows.length || total <= 0) return null;

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="ddonut-layout">
      <div className="ddonut">
        <svg viewBox="0 0 120 120" role={onSelect ? "group" : "img"} aria-label={`Cơ cấu ${positiveRows.map((row) => `${row.name} ${pct((row.amount / total) * 100)}`).join(", ")}`}>
          <circle className="ddonut-track" cx="60" cy="60" r={radius} />
          {positiveRows.map((row, index) => {
            const length = (row.amount / total) * circumference;
            const segment = (
              <circle
                key={row.id}
                className={`ddonut-segment${onSelect ? " is-interactive" : ""}${selectedId === row.id ? " is-selected" : ""}`}
                cx="60"
                cy="60"
                r={radius}
                stroke={DONUT_COLORS[index % DONUT_COLORS.length]}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                role={onSelect ? "button" : undefined}
                tabIndex={onSelect ? 0 : undefined}
                aria-pressed={onSelect ? selectedId === row.id : undefined}
                data-segment-id={row.id}
                aria-label={onSelect ? `${row.name}, ${pct((row.amount / total) * 100)}. Chọn để xem chi tiết` : undefined}
                onClick={onSelect ? () => onSelect(row.id) : undefined}
                onKeyDown={onSelect ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(row.id);
                  }
                } : undefined}
              >
                <title>{row.name}: {pct((row.amount / total) * 100)}</title>
              </circle>
            );
            offset += length;
            return segment;
          })}
        </svg>
        <span><b>100%</b><small>{centerLabel}</small></span>
      </div>
      <ul className="ddonut-legend">
        {positiveRows.map((row, index) => {
          const content = (
            <>
              <i style={{ background: DONUT_COLORS[index % DONUT_COLORS.length] }} />
              <span>{row.name}</span>
              <strong>{pct((row.amount / total) * 100)}</strong>
            </>
          );
          return (
            <li key={row.id}>
              {onSelect ? (
                <button type="button" className={selectedId === row.id ? "is-selected" : undefined} aria-pressed={selectedId === row.id} onClick={() => onSelect(row.id)}>
                  {content}
                </button>
              ) : (
                <div>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Cầu nối biến động.
 *
 * Hai mốc tổng nằm ở dòng chữ phía trên; các bước delta vẽ trên thang riêng của
 * chúng, phân kỳ quanh mốc 0. Đặt chung một thang với hai tổng sẽ khiến mọi bước
 * teo lại thành vài pixel.
 */
export function WaterfallChart({
  data,
  onSelectStep,
}: {
  data: Waterfall;
  onSelectStep?: (stepId: string) => void;
}) {
  const difference = data.end - data.start;
  const scale = Math.max(...data.steps.map((step) => Math.abs(step.delta)), 1);
  // Cầu nối và các bước phải cùng một đơn vị: đây là phép cộng, đọc theo cột
  // dọc. Trước đây "48,62 nghìn tỷ" đứng cạnh "+367,6 tỷ" trong cùng một phép.
  const unit = moneyScale([data.start, data.end, difference, ...data.steps.map((s) => s.delta)]);

  return (
    <div className="dwaterfall" data-unit={unit.divisor}>
      <div className="dbridge">
        <div>
          <span>{data.startLabel}</span>
          <strong>{inScale(data.start, unit)}</strong>
        </div>
        <div className="dbridge-arrow" aria-hidden="true" />
        <div>
          <span>{data.endLabel}</span>
          <strong>{inScale(data.end, unit)}</strong>
        </div>
        <div className="dbridge-diff">
          <span>Chênh lệch · {unit.unit}</span>
          <strong className={difference >= 0 ? "pos" : "neg"}>
            {difference >= 0 ? "+" : "−"}
            {inScale(Math.abs(difference), unit)}
          </strong>
        </div>
      </div>

      <ul className="dcontrib">
        {data.steps.map((step) => {
          const width = (Math.abs(step.delta) / scale) * 50;
          const inner = (
            <>
              <span className="dcontrib-name">{step.name}</span>
              <span className="dcontrib-track">
                <i
                  className={step.delta >= 0 ? "pos" : "neg"}
                  style={{
                    width: `${Math.max(width, 0.6)}%`,
                    left: step.delta >= 0 ? "50%" : `${50 - width}%`,
                  }}
                />
              </span>
              <strong className={step.delta >= 0 ? "pos" : "neg"}>
                {step.delta >= 0 ? "+" : "−"}
                {inScale(Math.abs(step.delta), unit)}
              </strong>
            </>
          );
          return (
            <li key={step.id}>
              {onSelectStep && step.id !== "__other" ? (
                <button
                  type="button"
                  className="dcontrib-row"
                  onClick={() => onSelectStep(step.id)}
                  title="So sánh chi tiết mục này"
                >
                  {inner}
                </button>
              ) : (
                <div className="dcontrib-row is-static">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>

      {!data.reconciled && (
        <p className="dnote is-warn" role="status">
          Tổng các bước lệch {money(Math.abs(data.drift))} so với chênh lệch chung — cần đối chiếu
          lại nguồn trước khi dùng số này.
        </p>
      )}
    </div>
  );
}

/** Bảng thay thế cho biểu đồ, phục vụ đọc bằng bàn phím và trình đọc màn hình. */
export function TrendTable({ points, year }: { points: TrendPoint[]; year: number }) {
  return (
    <div className="dtable-wrap">
      <table className="dtable">
        <caption className="sr-only">Số liệu xu hướng theo tháng</caption>
        <thead>
          <tr>
            <th scope="col">Tháng</th>
            <th scope="col">Năm {year}</th>
            <th scope="col">Năm {year - 1}</th>
            <th scope="col">So cùng kỳ</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => {
            const change =
              point.current !== null && point.previous !== null && point.previous > 0
                ? ((point.current - point.previous) / point.previous) * 100
                : null;
            return (
              <tr key={point.month}>
                <th scope="row">{point.label}</th>
                <td>{point.current === null ? "chưa có" : money(point.current)}</td>
                <td>{point.previous === null ? "chưa có" : money(point.previous)}</td>
                <td>{pct(change, true)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
