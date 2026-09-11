import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
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
import { CollapseButton } from "./CollapseButton";
import { Delta } from "./Delta";
import { useApi } from "../hooks/useApi";
import { money, pct1, pctChange } from "../lib/format";
import { useFilters } from "../state/FiltersProvider";
import type { HeatmapRow } from "../lib/types";

const EMPTY: HeatmapRow[] = [];
const SPARK_W = 220;
const SPARK_H = 52;
const HEAD = 5;

type Mode = "amount" | "growth" | "stability";

interface WardSeries {
  name: string;
  series: { month: string; amount: number }[];
  fullSeries: { month: string; amount: number | null }[];
  last: number;
  delta: number | null;
  cv: number | null;
}

const MODE_LABEL: Record<Mode, string> = {
  amount: "Theo tổng số",
  growth: "Theo tăng trưởng %",
  stability: "Theo độ ổn định",
};

/** `Lie` — sort theo giá trị cuối chuỗi / delta / hệ số biến thiên. */
const SORTERS: Record<Mode, (a: WardSeries, b: WardSeries) => number> = {
  amount: (a, b) => b.last - a.last,
  growth: (a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity),
  stability: (a, b) => (a.cv ?? Infinity) - (b.cv ?? Infinity),
};

/** `Rie` — độ lệch chuẩn tổng thể. */
function stdev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
}

/** `$ie` — path của sparkline; cần ≥2 điểm. */
function sparkPath(values: number[], width: number, height: number): string | null {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const x = (i: number) => (i / (values.length - 1)) * width;
  const y = (v: number) => height - ((v - min) / (max - min || 1)) * height;
  return values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
}

/** `Die` — "2026-08" → "08/2026". */
function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  return `${month}/${year}`;
}

/** `Fie` — modal xu hướng một địa bàn, chart 380px, modal 50rem. */
function WardTrendModal({ ward, onClose }: { ward: WardSeries; onClose: () => void }) {
  const points = ward.fullSeries.map((row) => ({
    label: monthLabel(row.month),
    amount: row.amount ?? undefined,
  }));
  const hasGap = ward.fullSeries.some((row) => row.amount == null);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,50rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg border border-line bg-card p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-ink">
              {ward.name} — xu hướng theo tháng
            </Dialog.Title>
            <Dialog.Close
              className="rounded px-2 py-1 text-lg leading-none text-muted hover:bg-bg"
              aria-label="Đóng"
            >
              ✕
            </Dialog.Close>
          </div>
          {ward.series.length < 2 ? (
            <p className="m-0 text-sm text-muted">
              Cần ≥ 2 tháng để vẽ xu hướng -- phường này hiện có: {ward.series.length}.
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={points} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="label" fontSize={11} stroke="var(--line)" tick={{ fill: "var(--ink-2)" }} />
                  <YAxis fontSize={11} stroke="var(--line)" tick={{ fill: "var(--ink-2)" }} tickFormatter={money} width={70} />
                  <Tooltip formatter={(value: number) => money(value)} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    name="Tổng số"
                    stroke="var(--data-main)"
                    strokeWidth={2.5}
                    dot={{ r: 3.5 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              {hasGap && (
                <p className="mt-1.5 text-[.76rem] text-muted">
                  Đường bị ngắt ở tháng phường này chưa có số liệu.
                </p>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** `zie` — Xếp hạng 126 phường/xã theo tháng. */
export function RankingCard() {
  const { apiParams } = useFilters();
  const params = { ...apiParams, ward: undefined };
  const { data, loading, error } = useApi<HeatmapRow[]>("/api/heatmap", params, EMPTY);
  const [mode, setMode] = useState<Mode>("amount");
  const [expanded, setExpanded] = useState(false);
  const [modalWard, setModalWard] = useState<WardSeries | null>(null);

  useEffect(() => setExpanded(false), [data, mode]);

  const { list, months } = useMemo(() => {
    const monthKeys = [
      ...new Set(data.map((row) => `${row.year}-${String(row.month).padStart(2, "0")}`)),
    ].sort();
    const byWard = new Map<string, { name: string; byMonth: Map<string, number> }>();
    for (const row of data) {
      const key = `${row.year}-${String(row.month).padStart(2, "0")}`;
      if (!byWard.has(row.location_code))
        byWard.set(row.location_code, { name: row.location_name, byMonth: new Map() });
      byWard.get(row.location_code)!.byMonth.set(key, row.amount);
    }
    return {
      list: [...byWard.values()].map<WardSeries>((ward) => {
        const series = monthKeys
          .filter((key) => ward.byMonth.has(key))
          .map((key) => ({ month: key, amount: ward.byMonth.get(key)! }));
        const fullSeries = monthKeys.map((key) => ({
          month: key,
          amount: ward.byMonth.get(key) ?? null,
        }));
        const values = series.map((row) => row.amount);
        const last = values.at(-1) ?? 0;
        const prev = values.length > 1 ? (values.at(-2) ?? null) : null;
        const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        const cv = values.length > 1 && mean ? (stdev(values) / mean) * 100 : null;
        return { name: ward.name, series, fullSeries, last, delta: pctChange(last, prev), cv };
      }),
      months: monthKeys,
    };
  }, [data]);

  const total = list.reduce((sum, row) => sum + row.last, 0) || 1;
  const sorted = [...list].sort(SORTERS[mode]);
  const head = sorted.slice(0, HEAD);
  const tail = sorted.slice(HEAD);

  const renderRow = (ward: WardSeries, index: number) => {
    const path = sparkPath(
      ward.series.map((row) => row.amount),
      SPARK_W,
      SPARK_H,
    );
    return (
      <div
        key={ward.name}
        onClick={() => setModalWard(ward)}
        className="grid min-h-[3.2rem] cursor-pointer grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-[.35rem] text-[.83rem] hover:bg-data-sub-bg"
      >
        <span>
          <span className="mr-2 text-muted">#{index + 1}</span>
          <b className="text-ink">{ward.name}</b>
        </span>
        <span className="w-[220px]">
          {path ? (
            <svg
              width={SPARK_W}
              height={SPARK_H}
              viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
              preserveAspectRatio="none"
              className="block h-[52px] w-full"
            >
              <path d={path} fill="none" stroke="var(--data-main)" strokeWidth={2} />
            </svg>
          ) : (
            <span className="text-muted">(cần ≥2 tháng)</span>
          )}
        </span>
        <span>
          {mode === "stability" ? (
            ward.cv == null ? (
              <span className="text-muted">—</span>
            ) : (
              <span className="text-muted">±{pct1(ward.cv)}%</span>
            )
          ) : (
            <Delta pct={ward.delta} />
          )}
        </span>
        <span className="whitespace-nowrap text-muted">
          {money(ward.last)}{" "}
          <span className="text-muted">({pct1((ward.last / total) * 100)}%)</span>
        </span>
      </div>
    );
  };

  if (loading || error) return <Async loading={loading} error={error} />;

  return (
    <Card
      title="Xếp hạng 126 phường/xã theo tháng"
      headerAction={
        <CollapseButton show={expanded && tail.length > 0} onClick={() => setExpanded(false)} />
      }
    >
      {data.length ? (
        <>
          <div className="mb-2.5 flex gap-1.5">
            {(Object.keys(MODE_LABEL) as Mode[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={
                  mode === key
                    ? "rounded-[.35rem] bg-data-main px-2.5 py-1 text-xs text-white"
                    : "rounded-[.35rem] border border-line px-2.5 py-1 text-xs text-muted"
                }
              >
                {MODE_LABEL[key]}
              </button>
            ))}
          </div>
          <div className="mb-2.5 text-sm text-muted">
            {list.length} phường/xã có số liệu, {months.length} tháng đã nạp ({months[0]}…
            {months.at(-1)})
          </div>
          <div className="grid gap-1.5">
            {head.map((ward, i) => renderRow(ward, i))}
            {expanded && tail.map((ward, i) => renderRow(ward, i + HEAD))}
          </div>
          {tail.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-2.5 text-sm font-medium text-data-main"
            >
              {expanded ? "Thu gọn ▴" : `Xem thêm ${tail.length} phường/xã ▾`}
            </button>
          )}
          {modalWard && (
            <WardTrendModal ward={modalWard} onClose={() => setModalWard(null)} />
          )}
        </>
      ) : (
        <p className="m-0 text-sm text-muted">Chưa có số liệu.</p>
      )}
    </Card>
  );
}
