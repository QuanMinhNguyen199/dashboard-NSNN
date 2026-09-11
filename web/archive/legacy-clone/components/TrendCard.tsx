import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Async } from "./Async";
import { Card } from "./Card";
import { ZoomModal } from "./ZoomModal";
import { useApi } from "../hooks/useApi";
import { money } from "../lib/format";
import { useFilters } from "../state/FiltersProvider";
import type { HeatmapRow, TrendRow } from "../lib/types";

const NO_TREND: TrendRow[] = [];
const NO_HEATMAP: HeatmapRow[] = [];

interface Point {
  label: string;
  PERIOD?: number;
  YTD?: number;
}

/** `Pie` — gom /api/trend thành 12 điểm của năm đang chọn. */
function toPoints(rows: TrendRow[], year: string): Point[] {
  if (!year) {
    const map = new Map<string, Point>();
    for (const row of rows) {
      const key = `${row.year}-${row.month}`;
      const point =
        map.get(key) ?? ({ label: `${String(row.month).padStart(2, "0")}/${row.year}` } as Point);
      point[row.acc] = row.amount;
      map.set(key, point);
    }
    return [...map.values()];
  }
  const y = Number(year);
  const points: Point[] = Array.from({ length: 12 }, (_, i) => ({
    label: `${String(i + 1).padStart(2, "0")}/${y}`,
  }));
  for (const row of rows) if (row.year === y) points[row.month - 1][row.acc] = row.amount;
  return points;
}

/** `Aie` — tháng nào có dưới 50% số địa bàn báo cáo thì coi là chưa nạp, ngắt đường. */
function sparseMonths(rows: HeatmapRow[], year: number): Set<number> {
  const byMonth = new Map<number, Set<string>>();
  for (const row of rows) {
    if (row.year !== year) continue;
    if (!byMonth.has(row.month)) byMonth.set(row.month, new Set());
    byMonth.get(row.month)!.add(row.location_code);
  }
  const sizes = [...byMonth.values()].map((set) => set.size);
  if (!sizes.length) return new Set();
  const threshold = Math.max(...sizes) * 0.5;
  const out = new Set<number>();
  for (const [month, set] of byMonth) if (set.size < threshold) out.add(month - 1);
  return out;
}

/** `Eie` — chart + legend chấm tròn. */
function TrendChart({ points, height = 260 }: { points: Point[]; height?: number }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={points} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="label" fontSize={10} stroke="var(--line)" tick={{ fill: "var(--ink-2)" }} />
          <YAxis fontSize={10} stroke="var(--line)" tick={{ fill: "var(--ink-2)" }} tickFormatter={money} width={70} />
          <Tooltip formatter={(value: number) => money(value)} />
          <Line
            type="monotone"
            dataKey="PERIOD"
            name="Thực hiện trong kỳ"
            stroke="var(--data-main)"
            strokeWidth={2.5}
            dot={{ r: 3.5 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="YTD"
            name="Luỹ kế (YTD)"
            stroke="var(--data-cmp)"
            strokeWidth={2.5}
            strokeDasharray="5 4"
            dot={{ r: 3.5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-1.5 flex items-center gap-1.5 text-[.76rem] text-muted">
        <i className="inline-block h-2.5 w-2.5 rounded-full bg-data-main" />
        Thực hiện trong kỳ (đường liền)
        <i className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-data-cmp" />
        Luỹ kế (YTD) (đường đứt)
      </div>
    </div>
  );
}

/** `Sw` — card Xu hướng theo tháng. */
export function TrendCard({ scope }: { scope: "overview" | "detail" }) {
  const { apiParams, year } = useFilters();
  const params = scope === "detail" ? apiParams : { ...apiParams, ward: undefined };
  const cityWide = !params.ward;

  const { data: trend, loading, error } = useApi<TrendRow[]>("/api/trend", params, NO_TREND);
  const points = useMemo(() => toPoints(trend, year), [trend, year]);

  const {
    data: heatmap,
    loading: heatLoading,
    error: heatError,
  } = useApi<HeatmapRow[]>(cityWide ? "/api/heatmap" : null, { item: params.item }, NO_HEATMAP);

  const sparse = useMemo(
    () => (cityWide && year ? sparseMonths(heatmap, Number(year)) : new Set<number>()),
    [cityWide, year, heatmap],
  );

  const masked = useMemo(
    () =>
      points.map((point, i) =>
        sparse.has(i) ? { ...point, PERIOD: undefined, YTD: undefined } : point,
      ),
    [points, sparse],
  );
  const filled = masked.filter((p) => p.PERIOD !== undefined || p.YTD !== undefined).length;

  if (loading || heatLoading || error || heatError)
    return <Async loading={loading || heatLoading} error={error || heatError} />;

  return (
    <Card title="Xu hướng theo tháng">
      {filled < 2 ? (
        <p className="m-0 text-sm text-muted">
          Cần ≥ 2 kỳ để vẽ xu hướng -- kỳ hiện có: {filled}.
        </p>
      ) : (
        <ZoomModal
          title="Xu hướng theo tháng"
          render={(height) => <TrendChart points={masked} height={height} />}
        />
      )}
    </Card>
  );
}
