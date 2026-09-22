import { TrendChart } from "@/components/TrendChart";
import { useId, useState, type CSSProperties } from "react";

export { TrendChart };

import type { AmountRow, TrendPoint, Waterfall } from "@/domain/types";
import { inScale, LiveNotice, money, moneyScale, pct } from "@/components/primitives";

/**
 * Bốn bậc màu của biểu đồ tròn, tham chiếu qua token chứ không viết cứng mã hex:
 * hệ này giữ luật "không một mã màu nào nằm ngoài `:root`". Cả bốn đều đạt ≥3:1
 * trên nền trắng vì lát donut vừa mang thông tin vừa là thứ bấm được.
 */
const DONUT_TOKENS = ["--donut-1", "--donut-2", "--donut-3", "--donut-4"];

/**
 * Số lát TỐI ĐA mà thang màu nói được.
 *
 * Xuất ra để nơi gọi cắt danh sách theo đúng con số này thay vì tự đoán. Thang
 * có bốn bậc; đưa vào lát thứ năm là `index % 4` quay vòng và hai lát khác hẳn
 * nhau nhận cùng một màu. Đo trên bản trước: donut `Cơ cấu theo Mục` có sáu lát,
 * `--donut-1` tô cả 38,1% lẫn 11,1% — lệch nhau 3,4 lần mà cùng một sắc. In đen
 * trắng thì hai cặp trùng biến mất hoàn toàn.
 */
export const DONUT_STEPS = DONUT_TOKENS.length;

const donutColor = (index: number) => `var(${DONUT_TOKENS[index % DONUT_TOKENS.length]})`;

/**
 * Nhóm "chưa xác định" không phải một bậc của thang.
 *
 * Thang xanh đơn sắc mã hoá ĐỘ LỚN: đậm hơn nghĩa là nhiều hơn. Nhóm chưa xác
 * định không nói về độ lớn mà nói rằng chưa biết xếp phần tiền đó vào đâu —
 * cho nó một bậc xanh là dùng thang để nói một điều thang không nói được, và
 * người quét nhanh đọc nó thành một hạng mục nghiệp vụ ngang hàng các hạng mục
 * kia. Màu trung tính tách nó ra khỏi thang, và cũng giải phóng bậc xanh đó cho
 * một hạng mục thật.
 *
 * Nhận diện bằng `id` vì đó là tín hiệu lớp dữ liệu đang phát ra: mọi nhóm chưa
 * xác định đều mang tiền tố `chua-xac-dinh` (`chua-xac-dinh`, `-muc`, `-cap`).
 */
const isUnclassified = (id: string) => id === "chua-xac-dinh" || id.startsWith("chua-xac-dinh-");

/**
 * Lát KHÔNG mang độ lớn: nhóm chưa xác định, và phần gộp "Khác".
 *
 * "Khác" cũng vậy và vì cùng một lý do. Nó là phần dư của phép cắt danh sách,
 * không phải một hạng mục nghiệp vụ — mà vì nó gộp nhiều mục lại nên nó thường
 * là lát LỚN NHẤT, và xếp bậc theo độ lớn thì nó chiếm ngay bậc đậm nhất. Thang
 * khi đó tuyên bố rằng "phần còn lại" là hạng mục quan trọng nhất trong hình.
 */
const isResidual = (id: string) => id === "khac" || isUnclassified(id);

/** Biểu đồ cơ cấu nhỏ gọn, có bảng chú giải đọc được bằng bàn phím. */
export function DonutChart({
  rows,
  centerLabel = "Tổng",
  selectedId,
  selectedIds = [],
  onSelect,
  labels = "legend",
  getCalloutLabel = (row) => row.name,
}: {
  rows: AmountRow[];
  centerLabel?: string;
  selectedId?: string;
  /** Dùng khi một phép so sánh cần giữ nhiều lát nổi bật đồng thời. */
  selectedIds?: readonly string[];
  onSelect?: (id: string) => void;
  labels?: "legend" | "callout";
  getCalloutLabel?: (row: AmountRow) => string;
}) {
  const chartId = useId();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const positiveRows = rows.filter((row) => row.amount > 0);
  const total = positiveRows.reduce((sum, row) => sum + row.amount, 0);
  if (!positiveRows.length || total <= 0) return null;

  /* Một donut có thể có một lựa chọn chính và nhiều lát cùng được giữ sáng.
     Hover/focus chỉ bổ sung vào tập này, không được làm mờ lựa chọn đã có. */
  const visibleIds = new Set(positiveRows.map((row) => row.id));
  const selectedSet = new Set(
    [selectedId, ...selectedIds].filter((id): id is string => Boolean(id && visibleIds.has(id))),
  );
  const emphasizedIds = new Set(selectedSet);
  if (hoveredId && visibleIds.has(hoveredId)) emphasizedIds.add(hoveredId);

  const callout = labels === "callout";
  const centerX = callout ? 170 : 60;
  const centerY = callout ? 97 : 60;
  const radius = callout ? 62 : 45;
  const circumference = 2 * Math.PI * radius;
  /**
   * Bậc màu đi theo ĐỘ LỚN, không theo thứ tự mảng.
   *
   * Thang đơn sắc tồn tại để "đậm = nhiều". Gán màu theo chỉ số mảng thì thứ tự
   * dữ liệu quyết định độ đậm: ở donut ba nhóm nội địa, lát 18,3% nhận màu đậm
   * hơn lát 30,2% — thang nói ngược lại chính con số nó đang mã hoá, và người
   * quét nhanh đọc sai thứ hạng. Giữ nguyên THỨ TỰ LÁT theo danh mục nghiệp vụ;
   * chỉ bậc màu được xếp lại.
   */
  const rankByAmount = new Map(
    [...positiveRows]
      .filter((row) => !isResidual(row.id))
      .sort((a, b) => b.amount - a.amount)
      .map((row, rank) => [row.id, rank]),
  );
  /** Màu lát: bậc thang cho hạng mục thật, màu trung tính cho phần dư. */
  const sliceColor = (row: AmountRow) =>
    isResidual(row.id) ? "var(--nodata)" : donutColor(rankByAmount.get(row.id) ?? 0);

  let runningOffset = 0;
  const slices = positiveRows.map((row, index) => {
    const length = (row.amount / total) * circumference;
    const middleAngle = -Math.PI / 2 + ((runningOffset + length / 2) / circumference) * Math.PI * 2;
    const slice = { row, index, length, offset: runningOffset, middleAngle };
    runningOffset += length;
    return slice;
  });
  const calloutPositions = new Map<string, { left: number; top: number }>();
  if (callout) {
    for (const side of [-1, 1] as const) {
      const onSide = slices
        .filter(({ middleAngle }) => (Math.cos(middleAngle) >= 0 ? 1 : -1) === side)
        .map((slice) => ({ slice, top: 50 + Math.sin(slice.middleAngle) * 37 }))
        .sort((a, b) => a.top - b.top);
      const gap = 18;
      for (let index = 1; index < onSide.length; index += 1)
        onSide[index].top = Math.max(onSide[index].top, onSide[index - 1].top + gap);
      const overflow = onSide.at(-1)?.top ?? 0;
      if (overflow > 88) for (const item of onSide) item.top -= overflow - 88;
      const underflow = onSide[0]?.top ?? 100;
      if (underflow < 12) for (const item of onSide) item.top += 12 - underflow;
      for (const { slice, top } of onSide)
        calloutPositions.set(slice.row.id, { left: side > 0 ? 77.5 : 22.5, top });
    }
  }

  return (
    <div className={`ddonut-layout${callout ? " is-callout" : ""}`}>
      <div className={`ddonut${callout ? " is-callout" : ""}`}>
        <svg viewBox={callout ? "0 0 340 194" : "0 0 120 120"} role={onSelect ? "group" : "img"} aria-label={`Cơ cấu ${positiveRows.map((row) => `${row.name} ${pct((row.amount / total) * 100)}`).join(", ")}`}>
          <circle className="ddonut-track" cx={centerX} cy={centerY} r={radius} transform={`rotate(-90 ${centerX} ${centerY})`} />
          {slices.map(({ row, length, offset }) => {
            const segment = (
              <circle
                key={row.id}
                className={`ddonut-segment${onSelect ? " is-interactive" : ""}${selectedSet.has(row.id) ? " is-selected" : ""}${hoveredId === row.id ? " is-hovered" : ""}${emphasizedIds.size > 0 && !emphasizedIds.has(row.id) ? " is-muted" : ""}`}
                cx={centerX}
                cy={centerY}
                r={radius}
                style={{ stroke: sliceColor(row) }}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${centerX} ${centerY})`}
                role={onSelect ? "button" : undefined}
                tabIndex={onSelect ? 0 : undefined}
                aria-pressed={onSelect ? selectedSet.has(row.id) : undefined}
                data-segment-id={row.id}
                aria-label={onSelect ? `${row.name}, ${pct((row.amount / total) * 100)}. Chọn để xem chi tiết` : undefined}
                onPointerEnter={() => setHoveredId(row.id)}
                onPointerLeave={() => setHoveredId(null)}
                onClick={onSelect ? () => onSelect(row.id) : undefined}
                onKeyDown={onSelect ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(row.id);
                  }
                } : undefined}
              >
                <title>{row.name}: {money(row.amount)} · {pct((row.amount / total) * 100)}</title>
              </circle>
            );
            return segment;
          })}
        </svg>
        {/* Tâm donut là vị trí đắt nhất của biểu đồ. "100%" chiếm chỗ đó để nói
            một điều ai cũng biết, và không phản hồi khi người dùng chọn lát —
            nên ở phép phân rã ba tầng, tầng giữa mất mốc neo: bấm xong không có
            gì xác nhận mình vừa bấm cái nào. Ưu tiên lát đang rê chuột, rồi lát
            đang chọn, cuối cùng mới là tổng. */}
        {(() => {
          const active =
            positiveRows.find((row) => row.id === hoveredId) ??
            positiveRows.find((row) => selectedSet.has(row.id));
          return active ? (
            <span>
              <b>{pct((active.amount / total) * 100)}</b>
              <small>{active.name}</small>
            </span>
          ) : (
            <span>
              <b>{money(total)}</b>
              <small>{centerLabel}</small>
            </span>
          );
        })()}
        {callout && (
          <div className="ddonut-labels">
            {slices.map(({ row }) => {
              const position = calloutPositions.get(row.id)!;
              const content = (
                <>
                  <i style={{ background: sliceColor(row) }} />
                  <span>{getCalloutLabel(row)}</span>
                  <strong>{pct((row.amount / total) * 100)}</strong>
                </>
              );
              const style = { left: `${position.left}%`, top: `${position.top}%` };
              return onSelect ? (
                <button key={row.id} type="button"
                  className={`ddonut-float-label${selectedSet.has(row.id) ? " is-selected" : ""}`}
                  style={style} aria-pressed={selectedSet.has(row.id)} onClick={() => onSelect(row.id)} title={row.name}>
                  {content}
                </button>
              ) : (
                <div key={row.id} className="ddonut-float-label" style={style} title={row.name}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
      {!callout && <ul className="ddonut-legend">
        {positiveRows.map((row) => {
          const tooltipId = `${chartId}-${row.id}`;
          const content = (
            <>
              <i style={{ background: sliceColor(row) }} />
              <span>{row.name}</span>
              <strong>{pct((row.amount / total) * 100)}</strong>
            </>
          );
          return (
            <li key={row.id} onPointerEnter={() => setHoveredId(row.id)} onPointerLeave={() => setHoveredId(null)}>
              {onSelect ? (
                <button type="button" className={selectedSet.has(row.id) ? "is-selected" : undefined}
                  aria-pressed={selectedSet.has(row.id)} aria-describedby={tooltipId}
                  onFocus={() => setHoveredId(row.id)} onBlur={() => setHoveredId(null)} onClick={() => onSelect(row.id)}>
                  {content}
                </button>
              ) : (
                <div
                  tabIndex={0}
                  aria-describedby={tooltipId}
                  onFocus={() => setHoveredId(row.id)}
                  onBlur={() => setHoveredId(null)}
                >
                  {content}
                </div>
              )}
              <span id={tooltipId} className="ddonut-tooltip" role="tooltip">
                {money(row.amount)} · {pct((row.amount / total) * 100)}
              </span>
            </li>
          );
        })}
      </ul>}
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
  /**
   * Chỉ chia đôi rãnh khi tập đang xem THẬT SỰ có cả hai dấu — đúng luật mà
   * `Bars` đã cài (`twoSided ? 50 : 100`) nhưng widget này thì chưa. Với một tập
   * toàn dương, `left: 50%` cố định khiến một nửa chiều ngang mã hoá con số
   * không: ở "Biến động trong nhóm" (11 bước đều dương) đó là 50% widget chết,
   * và ở Tổng quan nửa trái được dành cho một giá trị −3 trong khi giá trị dương
   * lớn nhất là +6.964 — tỷ lệ 1:2300.
   */
  const hasNegative = data.steps.some((step) => step.delta < 0);
  const hasPositive = data.steps.some((step) => step.delta > 0);
  const twoSided = hasNegative && hasPositive;
  const reach = twoSided ? 50 : 100;
  const origin = twoSided ? 50 : hasNegative ? 100 : 0;
  // Cầu nối và các bước phải cùng một đơn vị: đây là phép cộng, đọc theo cột
  // dọc. Trước đây "48,62 nghìn tỷ" đứng cạnh "+367,6 tỷ" trong cùng một phép.
  const unit = moneyScale([data.start, data.end, difference, ...data.steps.map((s) => s.delta)]);

  /**
   * Số ĐỌC ĐƯỢC phải cộng ra số tổng ĐỌC ĐƯỢC.
   *
   * Mỗi bước được làm tròn riêng rồi in ra, nên sai số làm tròn tích luỹ mà
   * không ai gánh: trên Tổng quan bốn bước in ra +6.964, +368, +173, −3 — cộng
   * lại là 7.502, trong khi dòng tổng in +7.501. Ở tầng số thô thì khớp; ở tầng
   * chữ trên màn hình thì không. Với một tài liệu được đọc thành tiếng trong
   * cuộc họp, tầng chữ mới là tầng thật.
   *
   * Cách bù: dồn toàn bộ phần dư vào bước có phần thập phân bị cắt nhiều nhất —
   * quy tắc "largest remainder". Bước đó lệch đúng một đơn vị hiển thị cuối
   * cùng, và tổng thì khớp.
   */
  const displayDeltas = (() => {
    const step = Math.pow(10, -unit.decimals) * unit.divisor;
    const rounded = data.steps.map((s) => Math.round(s.delta / step) * step);
    const target = Math.round(difference / step) * step;
    const residual = target - rounded.reduce((sum, v) => sum + v, 0);
    if (Math.abs(residual) < step / 2) return rounded;
    // Bước nào bị cắt nhiều nhất thì nhận phần dư.
    let worst = 0;
    let worstGap = -1;
    data.steps.forEach((s, i) => {
      const gap = Math.abs(s.delta - rounded[i]);
      if (gap > worstGap) { worstGap = gap; worst = i; }
    });
    const out = [...rounded];
    out[worst] += residual;
    return out;
  })();

  return (
    <div
      className="dwaterfall"
      data-unit={unit.divisor}
      data-two-sided={twoSided ? "true" : "false"}
      style={{ "--origin": `${origin}%` } as CSSProperties}
    >
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
        {data.steps.map((step, index) => {
          const width = (Math.abs(step.delta) / scale) * reach;
          const inner = (
            <>
              <span className="dcontrib-name" title={step.name}>{step.name}</span>
              <span className="dcontrib-track">
                <i
                  className={step.delta >= 0 ? "pos" : "neg"}
                  style={{
                    width: `${Math.max(width, 0.6)}%`,
                    left: step.delta >= 0 ? `${origin}%` : `${origin - width}%`,
                  }}
                />
              </span>
              <strong className={step.delta >= 0 ? "pos" : "neg"}>
                {step.delta >= 0 ? "+" : "−"}
                {inScale(Math.abs(displayDeltas[index]), unit)}
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

      <LiveNotice className="dnote is-warn">
        {data.reconciled
          ? null
          : `Tổng các bước lệch ${money(Math.abs(data.drift))} so với chênh lệch chung — cần đối chiếu lại nguồn trước khi dùng số này.`}
      </LiveNotice>
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
