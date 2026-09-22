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
/**
 * Mốc trục tròn số giữa `min` và `max`, cùng quy tắc với biểu đồ xu hướng.
 *
 * Giữ đáy ở 0 khi số nhỏ, và chỉ cắt đáy khi dải dữ liệu nằm cao — cắt đáy luôn
 * phóng đại biến động, nên nó phải đổi lại được bằng độ phân giải thật sự thu về.
 */
function niceTicks(max: number, min: number, count = 4): number[] {
  if (!(max > min)) return [min, max];
  const day = min > max * 0.3 ? min : 0;
  const rough = (max - day) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((v) => v >= rough) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.floor(day / step) * step; v <= max + step / 2; v += step) out.push(v);
  return out;
}

export function ForecastChart({ points, unit }: { points: BudgetTrendPoint[]; unit: MoneyScale }) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);

  const values = points.flatMap((p) => [p.actual, p.plan, p.forecast]).filter((v): v is number => v !== null);
  if (!values.length) return <p className="dempty">Kỳ đang chọn chưa có số để vẽ.</p>;

  const max = Math.max(...values);
  /**
   * Đáy THẬT của dữ liệu, không ép về 0.
   *
   * `Math.min(0, ...)` làm đáy luôn bằng 0, nên phép cắt trục bên dưới không
   * bao giờ chạy và gần một nửa khung cao là vùng trắng: chuỗi ngân sách chạy
   * trong dải 36.000–64.000, còn trục thì bắt đầu từ 0.
   */
  const min = Math.min(...values);
  const W = 720;
  const H = 220;
  /**
   * Chừa chỗ bên trái cho nhãn trục.
   *
   * Trước đây `padL` là 8 và biểu đồ không có trục dọc nào: cả SVG chỉ có mười
   * hai nhãn `T1`–`T12`, nên người đọc thấy ba đường mà không đọc được độ lớn
   * của điểm nào. Một biểu đồ dự toán so thực hiện mà không đọc được số thì
   * không trả lời được câu hỏi duy nhất nó sinh ra để trả lời.
   */
  const padL = 56;
  const padR = 8;
  const padB = 24;
  const ticks = niceTicks(max, min);
  const truc = { day: ticks[0], dinh: ticks[ticks.length - 1] };
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(1, points.length - 1);
  const y = (v: number) =>
    H - padB - ((v - truc.day) / Math.max(1, truc.dinh - truc.day)) * (H - padB - 10);

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
    /*
      `--data-reference` là màu DÀNH RIÊNG cho "cùng kỳ năm trước" — ba tab khác
      dùng nó đúng nghĩa đó. Để Dự toán mượn màu ấy là người đã học nó ở Tổng
      quan sẽ đọc dự toán thành số năm ngoái, và hai con số đó không thay thế
      nhau được. Dự toán là một chuỗi ngang hàng, nên nó lấy một bậc của thang.
    */
    { key: "plan", name: "Dự toán", dash: "2 4", color: "var(--data-family)", pick: (p: BudgetTrendPoint) => p.plan },
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
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} className="dforecast-grid" />
            <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" className="dforecast-tick">
              {inScale(t, unit)}
            </text>
          </g>
        ))}
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} className="dforecast-axis" />
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
        {/*
          Chuỗi chỉ có MỘT tháng có số thì phải vẽ ra một dấu chấm.

          `<path>` một điểm chỉ sinh ra một lệnh `moveto` và không vẽ gì cả, nên
          chuỗi đó biến mất hoàn toàn trong khi chú giải vẫn liệt kê nó. Đúng một
          điểm là trường hợp thật — tháng đầu năm, hoặc kỳ vừa mở — không phải
          một lỗi cần chặn, nên nó phải nhìn thấy được.
        */}
        {series.map((s) => {
          const co = points
            .map((p, i) => ({ v: s.pick(p), i }))
            .filter((d): d is { v: number; i: number } => d.v !== null);
          return co.length === 1 ? (
            <circle key={`d-${s.key}`} cx={x(co[0].i)} cy={y(co[0].v)} r={3.5} fill={s.color} />
          ) : null;
        })}
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
      <details className="dforecast-table dexpandable">
        <summary>Xem bảng số liệu</summary>
        <div className="dtable-wrap dexpandable-content">
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
