import { useId, useState } from "react";
import { inScale, type MoneyScale } from "@/components/primitives";
import type { BudgetTrendPoint } from "@/domain/workspaces";

/**
 * Thực hiện, dự toán và dự báo trên cùng một thang.
 *
 * Ba đường phân biệt bằng **kiểu nét** (liền, chấm, gạch) và nhãn trực tiếp,
 * không chỉ bằng màu. Ba sắc xanh cạnh nhau là thứ người mù màu không đọc được,
 * và bản in đen trắng cũng không.
 *
 * Tháng chưa có thực hiện thì đường thực hiện **đứt** ở đó. Nối liền qua khoảng
 * trống là vẽ ra một tháng đã thu, và đó là loại sai không ai kiểm lại.
 */
export function ForecastChart({ points, unit }: { points: BudgetTrendPoint[]; unit: MoneyScale }) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);

  const values = points.flatMap((p) => [p.actual, p.plan, p.forecast]).filter((v): v is number => v !== null);
  if (!values.length) return <p className="dempty">Kỳ đang chọn chưa có số để vẽ.</p>;

  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const W = 720;
  const H = 220;
  const padL = 8;
  const padB = 24;
  const x = (i: number) => padL + (i * (W - padL * 2)) / Math.max(1, points.length - 1);
  const y = (v: number) => H - padB - ((v - min) / Math.max(1, max - min)) * (H - padB - 10);

  /** Đường đứt tại điểm thiếu số thay vì nối liền qua nó. */
  const path = (pick: (p: BudgetTrendPoint) => number | null) => {
    const out: string[] = [];
    let pen = false;
    points.forEach((p, i) => {
      const v = pick(p);
      if (v === null) {
        pen = false;
        return;
      }
      out.push(`${pen ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`);
      pen = true;
    });
    return out.join(" ");
  };

  const series = [
    { key: "actual", name: "Thực hiện", dash: undefined, color: "var(--data-primary)", pick: (p: BudgetTrendPoint) => p.actual },
    { key: "plan", name: "Dự toán", dash: "2 4", color: "var(--data-reference)", pick: (p: BudgetTrendPoint) => p.plan },
    { key: "forecast", name: "Dự báo", dash: "8 5", color: "var(--data-secondary)", pick: (p: BudgetTrendPoint) => p.forecast },
  ];

  const active = hover === null ? null : points[hover];

  return (
    <div className="dforecast">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Thực hiện, dự toán và dự báo theo tháng, đơn vị ${unit.unit}`}
      >
        <line x1={padL} y1={H - padB} x2={W - padL} y2={H - padB} className="dforecast-axis" />
        {series.map((s) => (
          <path
            key={s.key}
            d={path(s.pick)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dash}
            strokeLinecap="round"
          />
        ))}
        {points.map((p, i) => (
          <rect
            key={p.month}
            x={x(i) - 14}
            y={0}
            width={28}
            height={H - padB}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {hover !== null && (
          <line x1={x(hover)} y1={8} x2={x(hover)} y2={H - padB} className="dforecast-cross" />
        )}
        {points.map((p, i) => (
          <text key={`l-${p.month}`} x={x(i)} y={H - 8} textAnchor="middle" className="dforecast-tick">
            {p.label}
          </text>
        ))}
      </svg>

      <ul className="dforecast-legend" aria-hidden="true">
        {series.map((s) => (
          <li key={s.key}>
            <svg width="26" height="8" aria-hidden="true">
              <line x1="1" y1="4" x2="25" y2="4" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} />
            </svg>
            {s.name}
          </li>
        ))}
      </ul>

      {/* Bảng số liệu thay thế: biểu đồ nào cũng phải đọc được bằng bàn phím và
          bằng trình đọc màn hình, không chỉ bằng mắt và chuột. */}
      <details className="dforecast-table">
        <summary>Xem bảng số liệu</summary>
        <div className="dtable-wrap">
          <table className="dtable is-compact" id={id}>
            <thead>
              <tr>
                <th scope="col">Tháng</th>
                <th scope="col" className="is-num">Thực hiện</th>
                <th scope="col" className="is-num">Dự toán</th>
                <th scope="col" className="is-num">Dự báo</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.month}>
                  <th scope="row">{p.label}</th>
                  <td className="is-num" data-label="Thực hiện">{p.actual === null ? "" : inScale(p.actual, unit)}</td>
                  <td className="is-num" data-label="Dự toán">{p.plan === null ? "" : inScale(p.plan, unit)}</td>
                  <td className="is-num" data-label="Dự báo">{p.forecast === null ? "" : inScale(p.forecast, unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {active && (
        <p className="dhint" aria-hidden="true">
          <b>{active.label}</b> · thực hiện {active.actual === null ? "chưa có" : inScale(active.actual, unit)} ·
          dự toán {active.plan === null ? "chưa có" : inScale(active.plan, unit)} · dự báo{" "}
          {active.forecast === null ? "chưa có" : inScale(active.forecast, unit)}
        </p>
      )}
    </div>
  );
}
