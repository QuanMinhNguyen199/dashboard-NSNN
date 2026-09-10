import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Async } from "../components/Async";
import { Card } from "../components/Card";
import { useApi } from "../hooks/useApi";
import { cx, money, pct1 } from "../lib/format";
import {
  comparePeriodOptions,
  defaultComparePair,
  findPeriod,
  fromSuffix,
  parsePeriodToken,
  periodLabel,
  periodSuffix,
} from "../lib/periods";
import { useFilters } from "../state/FiltersProvider";
import type {
  Acc,
  ByItemRow,
  ByScopeRow,
  ByWardRow,
  PeriodKey,
  PeriodRow,
  TrendRow,
} from "../lib/types";

const NO_WARDS: ByWardRow[] = [];
const NO_ITEMS: ByItemRow[] = [];
const NO_SCOPES: ByScopeRow[] = [];
const NO_TREND: TrendRow[] = [];

const SELECT = "rounded-[.35rem] border border-line bg-card px-2 py-1.5 text-sm text-ink";
const LABEL = "grid gap-1 text-[.78rem] text-muted";
const NAME_MAX = 40;
const AXIS_WIDTH = 210;
// Kỳ B là đích đến của phép so sánh nên mang màu nhấn; kỳ A là mốc nền.
const COLOR_A = "var(--data-family)";
const COLOR_B = "var(--data-primary)";
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** `Hie` */
const shorten = (name: string) =>
  name.length > NAME_MAX ? `${name.slice(0, NAME_MAX - 1)}…` : name;
/** `Vie` */
const signedPct = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${pct1(Math.abs(value))}%`;
/** `Yie` */
const headlinePct = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toLocaleString("vi-VN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
/** `fL` — mẫu số 0 trả về null, mẫu số âm lấy trị tuyệt đối. */
const relative = (from: number, to: number) =>
  from === 0 ? null : ((to - from) / Math.abs(from)) * 100;
/** `iM` */
const shareOf = (part: number, whole: number) => (whole === 0 ? null : (part / whole) * 100);
/** `Gs` — làm tròn nhiễu rất nhỏ về 0. */
const snap = (value: number | null, epsilon = 0.05) =>
  value === null ? null : Math.abs(value) < epsilon ? 0 : value;
/** `ja` */
const tokenLabel = (token: string) => {
  const parsed = parsePeriodToken(token);
  return parsed ? periodLabel(parsed) : "—";
};

interface CmpRow {
  name: string;
  a: number;
  b: number;
  delta: number;
  pct: number | null;
  shareA: number | null;
  shareB: number | null;
  points: number | null;
}

/** `oM` — ghép hai kỳ theo tên chỉ tiêu, tính delta, %, tỷ trọng và điểm phần trăm. */
function joinRows(
  aRows: { name: string; amount: number }[],
  bRows: { name: string; amount: number }[],
  totalA: number,
  totalB: number,
): CmpRow[] {
  const mapA = new Map(aRows.map((row) => [row.name, row.amount]));
  const mapB = new Map(bRows.map((row) => [row.name, row.amount]));
  return [...new Set([...mapA.keys(), ...mapB.keys()])]
    .map((name) => {
      const a = mapA.get(name) ?? 0;
      const b = mapB.get(name) ?? 0;
      const shareA = snap(shareOf(a, totalA));
      const shareB = snap(shareOf(b, totalB));
      return {
        name,
        a,
        b,
        delta: b - a,
        pct: snap(relative(a, b)),
        shareA,
        shareB,
        points: shareA !== null && shareB !== null ? snap(shareB - shareA) : null,
      };
    })
    .sort((x, y) => Math.max(y.a, y.b) - Math.max(x.a, x.b));
}

/** `yM` — mẫu số Thu NSNN, loại các dòng biến thể "loại trừ hoàn thuế". */
function itemDenominator(rows: ByItemRow[]): number {
  const total = rows
    .filter((row) => !row.name.includes("loại trừ hoàn thuế"))
    .reduce((sum, row) => sum + row.amount, 0);
  return total > 0 ? total : 0;
}

/** `gM` — mẫu số của cấp ngân sách là dòng NSNN. */
function scopeDenominator(rows: ByScopeRow[]): number {
  const row = rows.find((r) => r.code === "NSNN");
  return row && row.amount > 0 ? row.amount : 0;
}

/** `mb` — dựng query cho một kỳ. */
function periodParams(key: PeriodKey, acc: Acc, item: string) {
  const params: Record<string, string> = { year: key.year, acc, item };
  if (key.month) params.month = key.month;
  else if (key.quarter) params.quarter = key.quarter;
  return params;
}

/** `Gie` + `aM` — giá trị và thứ hạng của ward trong một kỳ; bỏ các dòng amount === 0. */
function sideOf(rows: ByWardRow[], ward: string) {
  const found = rows.find((row) => row.location_code === ward);
  const ranked = rows.filter((row) => row.amount !== 0);
  const index = ranked.findIndex((row) => row.location_code === ward);
  return {
    amount: found && found.amount !== 0 ? found.amount : null,
    rank: index < 0 ? null : { rank: index + 1, total: ranked.length },
  };
}

/** `uM` — một nửa của khối KPI so sánh. */
function CompareSide({
  label,
  side,
}: {
  label: string;
  side: { amount: number | null; rank: { rank: number; total: number } | null };
}) {
  return (
    <div>
      <div className="text-[.75rem] uppercase tracking-wide text-muted">{label}</div>
      <div
        className="mt-0.5 whitespace-nowrap text-2xl font-semibold text-ink"
        data-testid="cmp-amount"
      >
        {side.amount === null ? (
          <span className="text-base font-normal text-muted">chưa có số liệu</span>
        ) : (
          money(side.amount)
        )}
      </div>
      <div className="mt-0.5 whitespace-nowrap text-[.76rem] text-muted" data-testid="cmp-rank">
        {side.rank ? `hạng ${side.rank.rank}/${side.rank.total}` : "chưa có số liệu"}
      </div>
    </div>
  );
}

/** `Xie` — khối KPI A → B và Chênh lệch/thứ hạng. */
function CompareHeadline({
  pA,
  pB,
  a,
  b,
}: {
  pA: PeriodKey;
  pB: PeriodKey;
  a: { data: ByWardRow[]; loading: boolean; error: string | null };
  b: { data: ByWardRow[]; loading: boolean; error: string | null };
}) {
  const { ward } = useFilters();
  if (!ward) return null;

  if (a.error || b.error)
    return (
      <div className="rounded-lg border border-line bg-card p-4 text-sm text-muted">
        Không tải được số liệu để so sánh ({a.error ?? b.error}).
      </div>
    );
  if ((a.loading || b.loading) && !a.data.length && !b.data.length)
    return (
      <div className="rounded-lg border border-line bg-card p-4 text-sm text-muted">
        Đang tải số liệu hai kỳ...
      </div>
    );

  const sideA = sideOf(a.data, ward);
  const sideB = sideOf(b.data, ward);
  const bothKnown = sideA.amount !== null && sideB.amount !== null;
  const delta = bothKnown ? sideB.amount! - sideA.amount! : null;
  const pct = bothKnown ? snap(relative(sideA.amount!, sideB.amount!)) : null;
  const rankDelta =
    !sideA.rank || !sideB.rank ? null : sideA.rank.rank - sideB.rank.rank;
  const differentBase =
    sideA.rank !== null && sideB.rank !== null && sideA.rank.total !== sideB.rank.total;

  return (
    <div className="rounded-lg border border-line bg-card p-4" data-testid="cmp-headline">
      <div className="flex flex-wrap items-start gap-x-7 gap-y-4">
        <CompareSide label={periodLabel(pA)} side={sideA} />
        <div className="self-center text-xl text-muted" aria-hidden="true">
          →
        </div>
        <CompareSide label={periodLabel(pB)} side={sideB} />
        <div className="border-line pl-0 sm:border-l sm:pl-7">
          <div className="text-[.75rem] uppercase tracking-wide text-muted">Chênh lệch</div>
          <div className="mt-0.5 whitespace-nowrap text-2xl font-semibold" data-testid="cmp-delta">
            {delta === null ? (
              <span className="text-base font-normal text-muted">—</span>
            ) : (
              <>
                <span
                  className={cx(delta > 0 ? "text-up" : delta < 0 ? "text-down" : "text-ink")}
                >
                  {delta > 0 ? "+" : ""}
                  {money(delta)}
                </span>{" "}
                <span
                  className={cx(
                    "text-lg",
                    pct === null || pct === 0 ? "text-muted" : pct > 0 ? "text-up" : "text-down",
                  )}
                  data-testid="cmp-pct"
                >
                  {pct === null
                    ? "—"
                    : `${headlinePct(pct)}${pct > 0 ? " ▲" : pct < 0 ? " ▼" : ""}`}
                </span>
              </>
            )}
          </div>
          <div className="mt-0.5 whitespace-nowrap text-[.76rem]" data-testid="cmp-rankdelta">
            {rankDelta === null ? (
              <span className="text-muted">chưa so được thứ hạng</span>
            ) : rankDelta === 0 ? (
              <span className="text-muted">giữ nguyên hạng</span>
            ) : (
              <span className={rankDelta > 0 ? "text-up" : "text-down"}>
                {rankDelta > 0 ? "▲" : "▼"} {Math.abs(rankDelta)} bậc
              </span>
            )}
          </div>
        </div>
      </div>
      {differentBase && (
        <p className="m-0 mt-3 text-[.72rem] text-muted" data-testid="cmp-basenote">
          Hai kỳ có số phường báo cáo khác nhau ({sideA.rank?.total} và {sideB.rank?.total}) nên
          số bậc chỉ để tham khảo.
        </p>
      )}
    </div>
  );
}

/** `rM` — chart ngang hai chuỗi + danh sách delta bên dưới. */
function CompareBars({
  title,
  rows,
  labelA,
  labelB,
  note,
}: {
  title: string;
  rows: CmpRow[];
  labelA: string;
  labelB: string;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-card p-4" data-testid="cmp-bars">
      <h3
        className="m-0 mb-2 text-[.85rem] uppercase tracking-wide text-muted"
        data-testid="cmp-bars-title"
      >
        {title}
      </h3>
      {rows.length ? (
        <>
          <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 44)}>
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis type="number" tickFormatter={money} fontSize={10} stroke="var(--line)" tick={{ fill: "var(--ink-2)" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={AXIS_WIDTH}
                tickFormatter={shorten}
                fontSize={11}
                stroke="var(--line)"
                tick={{ fill: "var(--ink-2)" }}
              />
              <Tooltip formatter={(value: number) => money(value)} />
              <Legend />
              <ReferenceLine x={0} stroke="var(--ink)" />
              <Bar dataKey="a" name={labelA} fill={COLOR_A} radius={2} />
              <Bar dataKey="b" name={labelB} fill={COLOR_B} radius={2} />
            </BarChart>
          </ResponsiveContainer>
          {note && (
            <p className="m-0 mt-1 text-[.72rem] text-muted" data-testid="cmp-bars-note">
              {note}
            </p>
          )}
          <div className="mt-2.5 grid gap-2" data-testid="cmp-bars-list">
            {rows.map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-[1fr_auto] items-baseline gap-3 text-[.83rem]"
                data-testid="cmp-bars-row"
                data-name={row.name}
              >
                <div className="min-w-0 truncate text-ink" title={row.name} data-testid="cmp-bars-name">
                  {row.name}
                </div>
                <div
                  className="whitespace-nowrap text-right"
                  title={`${labelA}: ${money(row.a)} → ${labelB}: ${money(row.b)}`}
                >
                  <div>
                    <span
                      className={cx(
                        "font-medium",
                        row.delta > 0 ? "text-up" : row.delta < 0 ? "text-down" : "text-ink",
                      )}
                      data-testid="cmp-bars-delta"
                    >
                      {row.delta > 0 ? "+" : ""}
                      {money(row.delta)}
                    </span>{" "}
                    <span
                      className={cx(
                        "text-[.76rem]",
                        row.pct === null || row.pct === 0
                          ? "text-muted"
                          : row.pct > 0
                            ? "text-up"
                            : "text-down",
                      )}
                      data-testid="cmp-bars-pct"
                    >
                      {row.pct === null ? "—" : signedPct(row.pct)}
                    </span>
                  </div>
                  {row.shareA !== null && row.shareB !== null && (
                    <div className="text-[.72rem] text-muted" data-testid="cmp-bars-share">
                      {pct1(row.shareA)}% → {pct1(row.shareB)}%
                      {row.points !== null && (
                        <b className={row.points >= 0 ? "text-up" : "text-down"}>
                          {" "}
                          ({row.points >= 0 ? "+" : ""}
                          {pct1(row.points)} điểm)
                        </b>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="m-0 text-sm text-muted">Không có số liệu.</p>
      )}
    </div>
  );
}

/** `sM` — khoảng tháng của một kỳ. */
function monthSpan(key: PeriodKey): [number, number] {
  if (key.month) {
    const m = Number(key.month);
    return [m, m];
  }
  if (key.quarter) {
    const q = Number(key.quarter);
    return [q * 3 - 2, q * 3];
  }
  return [1, 12];
}
/** `pb` */
const spanLabel = (from: number, to: number) => (from === to ? `T${from}` : `T${from}–T${to}`);

/** `lM` — cắt đuôi chuỗi sau điểm cuối cùng khác 0/undefined. */
function trimTail(points: Record<string, number | undefined>[], key: string) {
  let last = -1;
  for (let i = 0; i < points.length; i++) {
    const value = points[i]?.[key];
    if (value !== undefined && value !== 0) last = i;
  }
  for (let i = last + 1; i < points.length; i++) delete points[i][key];
}

/** `Zie` — 12 điểm cho hai năm. */
function twelveMonths(rows: TrendRow[], acc: Acc, yearA: number, yearB: number) {
  const points = MONTHS.map((month) => ({ month }) as any);
  for (const row of rows) {
    if (row.acc !== acc) continue;
    const point = points[row.month - 1];
    if (!point) continue;
    if (row.year === yearA) point.a = row.amount;
    if (row.year === yearB) point.b = row.amount;
  }
  trimTail(points, "a");
  trimTail(points, "b");
  return points;
}

/** `Jie` — vùng tô; hai kỳ trùng khoảng thì chỉ tô một vùng. */
function bands(pA: PeriodKey, pB: PeriodKey) {
  const [a1, a2] = monthSpan(pA);
  const [b1, b2] = monthSpan(pB);
  if (a1 === b1 && a2 === b2)
    return [
      {
        key: "ab",
        from: a1,
        to: a2,
        color: "var(--muted)",
        text: `Cả hai kỳ: ${spanLabel(a1, a2)} (trùng khoảng nên chỉ tô một vùng)`,
      },
    ];
  return [
    { key: "a", from: a1, to: a2, color: COLOR_A, text: `${periodLabel(pA)}: ${spanLabel(a1, a2)}` },
    { key: "b", from: b1, to: b2, color: COLOR_B, text: `${periodLabel(pB)}: ${spanLabel(b1, b2)}` },
  ];
}

/** `eoe` — card Diễn biến 12 tháng. */
function CompareTrend({ pA, pB }: { pA: PeriodKey; pB: PeriodKey }) {
  const { ward, acc, item } = useFilters();
  const { data, error, loading } = useApi<TrendRow[]>(
    ward ? "/api/trend" : null,
    { item, ward },
    NO_TREND,
  );

  const yearA = Number(pA.year);
  const yearB = Number(pB.year);
  const sameYear = yearA === yearB;
  const points = useMemo(
    () => twelveMonths(data, acc, yearA, yearB),
    [data, acc, yearA, yearB],
  );
  const shades = useMemo(() => bands(pA, pB), [pA, pB]);
  const hasA = points.some((p) => p.a !== undefined);
  const hasB = points.some((p) => p.b !== undefined);
  const hasNegative = points.some(
    (p) => (p.a !== undefined && p.a < 0) || (p.b !== undefined && p.b < 0),
  );
  const accLabel = acc === "YTD" ? "luỹ kế từ đầu năm (YTD)" : "thực hiện trong kỳ";
  const title = `Diễn biến 12 tháng — ${sameYear ? yearA : `${yearA} và ${yearB}`}`;

  if (error)
    return (
      <Card title={title}>
        <p className="m-0 text-sm text-muted">Không tải được số liệu 12 tháng ({error}).</p>
      </Card>
    );
  if (loading && !data.length)
    return (
      <Card title={title}>
        <p className="m-0 text-sm text-muted">Đang tải số liệu 12 tháng...</p>
      </Card>
    );
  if (!hasA && !hasB)
    return (
      <Card title={title}>
        <p className="m-0 text-sm text-muted" data-testid="cmp-trend-empty">
          Phường/xã này không có tháng nào có số liệu trong{" "}
          {sameYear ? `năm ${yearA}` : `hai năm ${yearA} và ${yearB}`} (loại kỳ: {accLabel}).
        </p>
      </Card>
    );

  return (
    <Card title={title}>
      <div data-testid="cmp-trend">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={points} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis
              type="number"
              dataKey="month"
              domain={[0.5, 12.5]}
              ticks={MONTHS}
              tickFormatter={(value: number) => `T${value}`}
              fontSize={10}
              stroke="var(--line)"
              tick={{ fill: "var(--ink-2)" }}
            />
            <YAxis fontSize={10} stroke="var(--line)" tick={{ fill: "var(--ink-2)" }} tickFormatter={money} width={70} />
            <Tooltip
              formatter={(value: number) => money(value)}
              labelFormatter={(value: number) => `Tháng ${value}`}
            />
            {shades.map((band) => (
              <ReferenceArea
                key={band.key}
                className={`cmp-band cmp-band-${band.key}`}
                x1={band.from - 0.5}
                x2={band.to + 0.5}
                ifOverflow="hidden"
                fill={band.color}
                fillOpacity={0.12}
                stroke={band.color}
                strokeOpacity={0.35}
                strokeDasharray="3 3"
              />
            ))}
            {hasNegative && <ReferenceLine y={0} stroke="var(--ink)" />}
            {hasA && (
              <Line
                type="monotone"
                dataKey="a"
                name={String(yearA)}
                stroke={COLOR_A}
                strokeWidth={2.5}
                strokeDasharray="5 4"
                dot={{ r: 3.5 }}
                connectNulls={false}
              />
            )}
            {!sameYear && hasB && (
              <Line
                type="monotone"
                dataKey="b"
                name={String(yearB)}
                stroke={COLOR_B}
                strokeWidth={2.5}
                dot={{ r: 3.5 }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[.76rem] text-muted">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOR_A }} />
            Năm {yearA}
            {sameYear ? " (cả hai kỳ)" : " (đường đứt)"}
          </span>
          {!sameYear && (
            <span className="flex items-center gap-1.5">
              <i
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: COLOR_B }}
              />
              Năm {yearB} (đường liền)
            </span>
          )}
          <span>Số liệu: {accLabel}</span>
        </div>

        <div
          className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[.72rem] text-muted"
          data-testid="cmp-trend-bands"
        >
          <span>Vùng tô = khoảng tháng của kỳ:</span>
          {shades.map((band) => (
            <span
              key={band.key}
              data-testid="cmp-trend-band"
              data-kind={band.key}
              data-from={band.from}
              data-to={band.to}
            >
              {band.text}
            </span>
          ))}
        </div>

        {(!hasA || (!sameYear && !hasB)) && (
          <p className="m-0 mt-1 text-[.72rem] text-muted" data-testid="cmp-trend-missing-year">
            Năm {hasA ? yearB : yearA} không có tháng nào có số liệu cho phường/xã này.
          </p>
        )}
      </div>
    </Card>
  );
}

/** `cM` + `noe` — thông báo độ phủ khi hai kỳ có số phường báo cáo khác nhau. */
function CoverageNote({
  pA,
  pB,
  a,
  b,
}: {
  pA: PeriodKey;
  pB: PeriodKey;
  a: { data: ByWardRow[]; loading: boolean; error: string | null };
  b: { data: ByWardRow[]; loading: boolean; error: string | null };
}) {
  if (a.loading || b.loading || a.error || b.error) return null;
  const countA = a.data.filter((row) => row.amount !== 0).length;
  const countB = b.data.filter((row) => row.amount !== 0).length;
  if (countA === countB) return null;
  const low = Math.min(countA, countB);
  const high = Math.max(countA, countB);
  const severe = low < high * 0.9;

  return (
    <p
      className={cx(
        "m-0 rounded-lg px-3 py-2 text-[.78rem]",
        severe ? "bg-amber-50 text-amber-900" : "text-muted",
      )}
      data-testid="cmp-coverage"
    >
      {severe && <span aria-hidden="true">⚠ </span>}
      {periodLabel(pA)} có <b>{countA}</b> phường báo cáo, {periodLabel(pB)} có <b>{countB}</b>.
      {severe && " Chênh lệch dưới đây một phần là do thiếu dữ liệu, không phải sụt thu."}
    </p>
  );
}

/** `hM` — cặp select năm + kỳ trong năm cho Kỳ A / Kỳ B. */
function PeriodPicker({
  label,
  value,
  periods,
  onChange,
}: {
  label: string;
  value: string;
  periods: PeriodRow[];
  onChange: (token: string) => void;
}) {
  const parsed = parsePeriodToken(value);
  const year = parsed?.year ?? "";
  const suffix = periodSuffix(parsed);
  const options = comparePeriodOptions(year, periods);
  const years = [...new Set(periods.map((row) => row.year))].sort((a, b) => b - a);

  /** Đổi năm: giữ loại kỳ nếu tồn tại, nếu không fallback cả năm → quý đầu → tháng đầu. */
  function changeYear(nextYear: string) {
    const next = comparePeriodOptions(nextYear, periods);
    const candidate = fromSuffix(nextYear, suffix);
    if (candidate && findPeriod(periods, candidate)) {
      onChange(`${nextYear}${suffix}`);
      return;
    }
    const fallback = next.hasYear
      ? "y"
      : next.quarters.length
        ? `q${next.quarters[0]}`
        : next.months.length
          ? `m${next.months[0]}`
          : "";
    if (fallback) onChange(`${nextYear}${fallback}`);
  }

  return (
    <div className="flex items-end gap-1.5">
      <label className={LABEL}>
        {label}
        <select
          className={SELECT}
          value={year}
          onChange={(e) => changeYear(e.target.value)}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <select
        className={SELECT}
        value={suffix}
        onChange={(e) => onChange(`${year}${e.target.value}`)}
        aria-label={`${label} — kỳ trong năm`}
      >
        {options.hasYear && <option value="y">Cả năm</option>}
        {options.quarters.length > 0 && (
          <optgroup label="Theo quý">
            {options.quarters.map((q) => (
              <option key={`q${q}`} value={`q${q}`}>
                Quý {q}
              </option>
            ))}
          </optgroup>
        )}
        {options.months.length > 0 && (
          <optgroup label="Theo tháng">
            {options.months.map((m) => (
              <option key={`m${m}`} value={`m${m}`}>
                Tháng {m}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}

/** `soe` — tab So sánh hai kỳ. */
export function CompareTab() {
  const {
    ward,
    wardName,
    selectWard,
    periods,
    acc,
    item,
    cmpa,
    cmpb,
    setCompare,
    wardCatalog,
  } = useFilters();

  // Bộ chọn A/B là draft: đổi select chưa đổi heading/biểu đồ/URL, phải bấm So sánh.
  const [draftA, setDraftA] = useState("");
  const [draftB, setDraftB] = useState("");
  const seeded = useRef(false);

  const commit = (a: string, b: string) => {
    if (!parsePeriodToken(a) || !parsePeriodToken(b)) return;
    setCompare(a, b);
  };

  useEffect(() => {
    if (seeded.current || !periods.length || !ward) return;
    seeded.current = true;
    const fallback = defaultComparePair(periods);
    const a = cmpa || fallback.a;
    const b = cmpb || fallback.b;
    setDraftA(a);
    setDraftB(b);
    if (a && b) commit(a, b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods, ward]);

  const keyA = parsePeriodToken(cmpa);
  const keyB = parsePeriodToken(cmpb);

  const wardsA = useApi<ByWardRow[]>(
    ward && keyA ? "/api/by-ward" : null,
    keyA ? periodParams(keyA, acc, item) : {},
    NO_WARDS,
  );
  const wardsB = useApi<ByWardRow[]>(
    ward && keyB ? "/api/by-ward" : null,
    keyB ? periodParams(keyB, acc, item) : {},
    NO_WARDS,
  );
  const wardScoped = (key: PeriodKey) => ({ ...periodParams(key, acc, item), ward });
  const itemsA = useApi<ByItemRow[]>(
    ward && keyA ? "/api/by-item" : null,
    keyA ? wardScoped(keyA) : {},
    NO_ITEMS,
  );
  const itemsB = useApi<ByItemRow[]>(
    ward && keyB ? "/api/by-item" : null,
    keyB ? wardScoped(keyB) : {},
    NO_ITEMS,
  );
  const scopesA = useApi<ByScopeRow[]>(
    ward && keyA ? "/api/by-scope" : null,
    keyA ? wardScoped(keyA) : {},
    NO_SCOPES,
  );
  const scopesB = useApi<ByScopeRow[]>(
    ward && keyB ? "/api/by-scope" : null,
    keyB ? wardScoped(keyB) : {},
    NO_SCOPES,
  );

  const itemRows = joinRows(
    itemsA.data,
    itemsB.data,
    itemDenominator(itemsA.data),
    itemDenominator(itemsB.data),
  );
  const scopeRows = joinRows(
    scopesA.data,
    scopesB.data,
    scopeDenominator(scopesA.data),
    scopeDenominator(scopesB.data),
  );

  if (!ward)
    return (
      <div className="max-w-2xl rounded-lg border border-line bg-card p-5">
        <h2 className="m-0 mb-1.5 text-base font-semibold text-ink">
          Chọn một phường/xã để bắt đầu so sánh
        </h2>
        <p className="m-0 mb-3 text-sm text-muted">
          Trang này so sánh CÙNG MỘT địa bàn ở hai kỳ khác nhau — ví dụ Quý 3/2025 với Quý
          3/2026.
        </p>
        <select
          className={SELECT}
          value=""
          aria-label="Chọn phường/xã"
          onChange={(e) => selectWard(e.target.value || null)}
        >
          <option value="">— Chọn phường/xã —</option>
          {wardCatalog.map((row) => (
            <option key={row.location_code} value={row.location_code}>
              {row.location_name}
            </option>
          ))}
        </select>
      </div>
    );

  return (
    <div className="grid gap-4">
      <h2 className="m-0 text-base font-semibold text-ink">
        {(wardName ?? ward).toUpperCase()} — {tokenLabel(cmpa)} vs {tokenLabel(cmpb)}
      </h2>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-card p-3">
        <PeriodPicker label="Kỳ A" value={draftA} periods={periods} onChange={setDraftA} />
        <PeriodPicker label="Kỳ B" value={draftB} periods={periods} onChange={setDraftB} />
        <button
          type="button"
          onClick={() => commit(draftA, draftB)}
          disabled={!draftA || !draftB}
          className="rounded-[.35rem] bg-data-main px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          So sánh
        </button>
      </div>

      {keyA && keyB && (
        <>
          <CoverageNote pA={keyA} pB={keyB} a={wardsA} b={wardsB} />
          <Async
            loading={wardsA.loading || wardsB.loading}
            error={wardsA.error || wardsB.error}
          >
            <CompareHeadline pA={keyA} pB={keyB} a={wardsA} b={wardsB} />
          </Async>

          <div className="grid gap-4 xl:grid-cols-2">
            <Async
              loading={itemsA.loading || itemsB.loading}
              error={itemsA.error || itemsB.error}
            >
              <CompareBars
                title="Theo chỉ tiêu"
                rows={itemRows}
                labelA={tokenLabel(cmpa)}
                labelB={tokenLabel(cmpb)}
                note='Tỷ trọng trên tổng Thu NSNN — không phải trên con số ở đầu trang, vốn theo ô lọc Chỉ tiêu chung. Dòng "đã loại trừ hoàn thuế GTGT" là một tổng biến thể nên không nằm trong mẫu số, và tỷ trọng của nó gần 100%.'
              />
            </Async>
            <Async
              loading={scopesA.loading || scopesB.loading}
              error={scopesA.error || scopesB.error}
            >
              <CompareBars
                title="Theo cấp ngân sách"
                rows={scopeRows}
                labelA={tokenLabel(cmpa)}
                labelB={tokenLabel(cmpb)}
                note="Tỷ trọng tính trên NSNN. Sáu cấp không rời nhau (NSNN = NSTW + NSĐP; NSĐP = tỉnh + huyện + xã) nên các phần trăm dưới đây không cộng thành 100%."
              />
            </Async>
          </div>

          <CompareTrend pA={keyA} pB={keyB} />
        </>
      )}
    </div>
  );
}
