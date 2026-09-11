import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CSSProperties } from "react";
import type { TrendPoint, Waterfall } from "@/domain/types";
import { money, pct } from "@/components/primitives";

const AXIS = { stroke: "var(--divider)", tick: { fill: "var(--ink-2)", fontSize: 11 } } as const;

/**
 * Xu hướng 12 tháng, năm N và N−1.
 * `connectNulls={false}`: tháng chưa có dữ liệu để lại khoảng trống thật, không
 * nối đường và không vẽ điểm 0.
 */
export function TrendChart({
  points,
  year,
  height = 260,
  labelA,
  labelB,
}: {
  points: TrendPoint[];
  year: number;
  height?: number;
  labelA?: string;
  labelB?: string;
}) {
  const nameCurrent = labelB ?? `Năm ${year}`;
  const namePrevious = labelA ?? `Năm ${year - 1}`;
  const hasGap = points.some((p) => p.current === null || p.previous === null);

  // Đơn vị trục chọn theo độ lớn thực của chuỗi: số của một phường/xã tính bằng
  // tỷ, còn số toàn thành phố tính bằng nghìn tỷ. Cố định một đơn vị sẽ làm mọi
  // vạch của biểu đồ cấp phường làm tròn về 0.
  const peak = Math.max(
    0,
    ...points.flatMap((p) => [Math.abs(p.current ?? 0), Math.abs(p.previous ?? 0)]),
  );
  const axis = peak >= 2e12 ? { divisor: 1e12, unit: "nghìn tỷ đồng" } : { divisor: 1e9, unit: "tỷ đồng" };

  return (
    <div className="dchart-wrap">
      <div className="dchart" style={{ "--chart-h": `${height}px` } as CSSProperties}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 12, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--divider)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS.tick} />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tick={AXIS.tick}
              tickFormatter={(value: number) =>
                (value / axis.divisor).toLocaleString("vi-VN", { maximumFractionDigits: 0 })
              }
            />
            <Tooltip
              formatter={(value: number) => [money(value)]}
              labelFormatter={(label: string) => `Tháng ${String(label).replace("T", "")}`}
              contentStyle={{
                border: "1px solid var(--hairline)",
                borderRadius: "var(--r-control)",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              name={namePrevious}
              stroke="var(--data-reference)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="current"
              name={nameCurrent}
              stroke="var(--data-primary)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#fff" }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="dlegend">
        <span>
          <i className="solid" />
          {nameCurrent}
        </span>
        <span>
          <i />
          {namePrevious}
        </span>
        <span>Đơn vị trục: {axis.unit}</span>
        {hasGap && <span>Khoảng trống = chưa có số liệu</span>}
      </div>
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

  return (
    <div className="dwaterfall">
      <div className="dbridge">
        <div>
          <span>{data.startLabel}</span>
          <strong>{money(data.start)}</strong>
        </div>
        <div className="dbridge-arrow" aria-hidden="true" />
        <div>
          <span>{data.endLabel}</span>
          <strong>{money(data.end)}</strong>
        </div>
        <div className="dbridge-diff">
          <span>Chênh lệch</span>
          <strong className={difference >= 0 ? "pos" : "neg"}>
            {difference >= 0 ? "+" : "−"}
            {money(Math.abs(difference))}
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
                {money(Math.abs(step.delta))}
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
