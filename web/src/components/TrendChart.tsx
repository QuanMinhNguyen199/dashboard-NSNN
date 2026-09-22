import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { TrendPoint } from "@/domain/types";
import { inScale, money, moneyScale } from "@/components/primitives";
import { useReducedMotion } from "@/components/useReducedMotion";

/**
 * Biểu đồ xu hướng, vẽ tay bằng SVG.
 *
 * Trước đây dùng Recharts. Đo ra: Recharts đóng góp **375 KB** mã thô (103 KB
 * sau gzip) — 57% toàn bộ bundle — cho đúng một biểu đồ đường 12 điểm, hai
 * chuỗi. Gzip không cứu được phần đắt nhất là **phân tích và thực thi**: trên
 * CPU chậm gấp 4, riêng khoản đó chiếm phần lớn 1.120ms thời gian chặn.
 *
 * Phần còn lại của ứng dụng vốn đã tự vẽ waterfall, danh sách thanh và bản đồ.
 * Recharts là ngoại lệ duy nhất, và nó là ngoại lệ đắt nhất.
 */

const PAD = { top: 12, right: 12, bottom: 22, left: 56 };

/** Bề rộng thật của khung, để vẽ ở tỉ lệ 1:1 thay vì co giãn viewBox. */
function useWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/** Vạch trục tròn số: 1, 2, 2,5 hoặc 5 nhân luỹ thừa 10. */
function niceTicks(max: number, count = 4, min = 0): number[] {
  if (!(max > 0)) return [0];
  const span = max - min;
  if (!(span > 0)) return [max];
  const rough = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.floor(min / step) * step; v <= max + step / 2; v += step) out.push(v);
  return out;
}

/**
 * Đáy trục: 0, hoặc một mốc tròn dưới giá trị nhỏ nhất.
 *
 * Chuỗi thu ngân sách chạy trong dải hẹp ở rất cao — đo trên `Xu hướng thu ngân
 * sách`: 37.000–63.000 trên trục gốc 0, nên khoảng 45% chiều cao khung không hề
 * có dữ liệu, còn biến động giữa các tháng bị nén vào nửa trên. Cả thẻ tồn tại
 * để so tháng này với tháng kia, và nó đang trả một nửa độ phân giải cho một
 * vùng trống.
 *
 * Cắt đáy CHỈ khi đáy thật sự cao — dưới ngưỡng đó thì phần lợi không bõ, mà
 * trục cắt luôn phóng đại biến động. Đây là biểu đồ ĐƯỜNG, không có vùng tô, nên
 * diện tích không mang nghĩa và mốc đáy có nhãn số ngay trên trục: người đọc
 * thấy trục bắt đầu từ 30.000 chứ không phải từ 0.
 */
const NGUONG_CAT = 0.3;
function dayTruc(trough: number, peak: number): number {
  return trough > peak * NGUONG_CAT ? trough : 0;
}

/**
 * Đường cong đơn điệu Fritsch–Carlson. Nội suy trơn nhưng **không vọt quá** giá
 * trị thật — với số liệu ngân sách thì một đỉnh do thuật toán bịa ra là sai số
 * liệu, không phải thẩm mỹ.
 */
function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0].x} ${pts[0].y}`;
  if (n === 2) return `M${pts[0].x} ${pts[0].y}L${pts[1].x} ${pts[1].y}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    slope.push((pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x));
  }
  const m: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) m.push(0);
    else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      m.push((w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]));
    }
  }
  m.push(slope[n - 2]);

  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i].x + h} ${pts[i].y + m[i] * h},${pts[i + 1].x - h} ${pts[i + 1].y - m[i + 1] * h},${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return d;
}

/** Cắt chuỗi tại các điểm thiếu: đường không được nối qua khoảng trống. */
function segments(values: (number | null)[], xOf: (i: number) => number, yOf: (v: number) => number) {
  const runs: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] = [];
  values.forEach((v, i) => {
    if (v === null || !Number.isFinite(v)) {
      if (run.length) runs.push(run);
      run = [];
    } else run.push({ x: xOf(i), y: yOf(v) });
  });
  if (run.length) runs.push(run);
  return runs;
}

export function TrendChart({
  points,
  year,
  height = 260,
  labelA,
  labelB,
  peers = false,
}: {
  points: TrendPoint[];
  year: number;
  height?: number;
  labelA?: string;
  labelB?: string;
  /**
   * Hai chuỗi NGANG HÀNG chứ không phải "hiện tại so với mốc tham chiếu".
   *
   * Nét đứt phi sắc `--data-reference` được DESIGN.md dành riêng cho mốc tham
   * chiếu — nó cố ý trông nhạt hơn để không tranh chấp với chuỗi chính. Tab So
   * sánh nhét vế A vào đúng slot đó, nên hai phường ngang hàng được vẽ bằng thứ
   * ngôn ngữ nói "cái này chỉ là nền". Ai học được "đứt xám = năm trước" ở ba
   * tab sẽ đọc sai tab thứ tư. Ở chế độ này, vế A dùng `--data-family` — bậc mà
   * DESIGN.md chỉ định cho "kỳ A".
   */
  peers?: boolean;
}) {
  const reduced = useReducedMotion();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const width = useWidth(boxRef);
  const [hover, setHover] = useState<number | null>(null);

  // Chú giải ghi cả vai trò chứ không chỉ ghi năm: "2025" một mình không nói
  // được nó là mốc so sánh, và người đọc phải tự suy ra từ việc nó nhỏ hơn.
  const nameCurrent = labelB ?? `Năm ${year} (hiện tại)`;
  const namePrevious = labelA ?? `Năm ${year - 1} (cùng kỳ)`;
  const hasGap = points.some((p) => p.current === null || p.previous === null);

  const peak = Math.max(
    0,
    ...points.flatMap((p) => [Math.abs(p.current ?? 0), Math.abs(p.previous ?? 0)]),
  );
  // Cùng thang với mọi con số khác trong ứng dụng. Trục riêng một bậc sẽ buộc
  // người đọc đổi đơn vị khi mắt đi từ biểu đồ sang KPI ngay bên cạnh.
  const axis = moneyScale([peak]);

  const trough = Math.min(
    ...points.flatMap((p) =>
      [p.current, p.previous].filter((v): v is number => v !== null && v !== undefined),
    ),
  );

  const geo = useMemo(() => {
    const innerW = Math.max(0, width - PAD.left - PAD.right);
    const innerH = Math.max(0, height - PAD.top - PAD.bottom);
    const ticks = niceTicks(peak, 4, dayTruc(Number.isFinite(trough) ? trough : 0, peak));
    const base = ticks[0] ?? 0;
    const top = ticks[ticks.length - 1] || 1;
    const span = top - base || 1;
    const xOf = (i: number) =>
      PAD.left + (points.length > 1 ? (innerW * i) / (points.length - 1) : innerW / 2);
    const yOf = (v: number) => PAD.top + innerH - (innerH * (v - base)) / span;
    return { innerW, innerH, ticks, xOf, yOf };
  }, [width, height, peak, trough, points.length]);

  const paths = useMemo(
    () => ({
      previous: segments(points.map((p) => p.previous), geo.xOf, geo.yOf).map(monotonePath),
      current: segments(points.map((p) => p.current), geo.xOf, geo.yOf).map(monotonePath),
    }),
    [points, geo],
  );

  const onMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!geo.innerW) return;
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left - PAD.left) / geo.innerW;
    const index = Math.round(ratio * (points.length - 1));
    setHover(index >= 0 && index < points.length ? index : null);
  };

  const active = hover === null ? null : points[hover];
  const ready = width > 0;

  return (
    <div className="dchart-wrap">
      <div
        className="dchart"
        ref={boxRef}
        style={{ "--chart-h": `${height}px` } as CSSProperties}
      >
        {ready && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`Xu hướng ${nameCurrent} so với ${namePrevious}`}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            {geo.ticks.map((t) => (
              <g key={t}>
                <line
                  className="dchart-grid"
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={geo.yOf(t)}
                  y2={geo.yOf(t)}
                />
                <text className="dchart-tick" x={PAD.left - 10} y={geo.yOf(t)} dy="0.32em" textAnchor="end">
                  {inScale(t, axis)}
                </text>
              </g>
            ))}

            {points.map((p, i) => (
              <text key={p.label} className="dchart-tick" x={geo.xOf(i)} y={height - 6} textAnchor="middle">
                {p.label}
              </text>
            ))}

            {active && (
              <line
                className="dchart-crosshair"
                x1={geo.xOf(hover!)}
                x2={geo.xOf(hover!)}
                y1={PAD.top}
                y2={PAD.top + geo.innerH}
              />
            )}

            {paths.previous.map((d, i) => (
              <path key={`p${i}`} className={`dchart-line ${peers ? "is-peer" : "is-previous"}`} d={d} />
            ))}
            {paths.current.map((d, i) => (
              <path
                key={`c${i}`}
                className={`dchart-line is-current${reduced ? "" : " is-drawing"}`}
                d={d}
              />
            ))}

            {points.map((p, i) =>
              p.current === null ? null : (
                <circle
                  key={p.label}
                  className={`dchart-dot${hover === i ? " is-active" : ""}`}
                  cx={geo.xOf(i)}
                  cy={geo.yOf(p.current)}
                  r={hover === i ? 4.5 : 3}
                />
              ),
            )}
          </svg>
        )}

        {active && (
          <div
            className="dchart-tip"
            style={{
              left: Math.min(Math.max(geo.xOf(hover!) + 12, 8), Math.max(8, width - 172)),
              top: PAD.top,
            }}
            aria-hidden="true"
          >
            <b>Tháng {active.label.replace("T", "")}</b>
            <span>
              <i className="solid" />
              {nameCurrent}
              <em>{active.current === null ? "chưa có" : money(active.current)}</em>
            </span>
            <span>
              <i />
              {namePrevious}
              <em>{active.previous === null ? "chưa có" : money(active.previous)}</em>
            </span>
          </div>
        )}
      </div>

      <div className="dlegend">
        <span>
          <i className="solid" />
          {nameCurrent}
        </span>
        <span>
          <i className={peers ? "is-peer" : undefined} />
          {namePrevious}
        </span>
        <span>Đơn vị trục: {axis.unit}</span>
        {hasGap && <span>Khoảng trống = chưa có số liệu</span>}
      </div>
    </div>
  );
}
