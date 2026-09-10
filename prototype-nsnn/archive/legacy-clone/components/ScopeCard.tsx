import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Async } from "./Async";
import { BarList } from "./BarList";
import { Card } from "./Card";
import { ZoomModal } from "./ZoomModal";
import { useApi } from "../hooks/useApi";
import { money, pct1 } from "../lib/format";
import { useFilters } from "../state/FiltersProvider";
import type { ByScopeRow } from "../lib/types";

const EMPTY: ByScopeRow[] = [];

const HINTS: Record<string, string> = {
  NSTW: "Phần giữ lại cho trung ương.",
  NSDP: "Phần giữ lại cho địa phương (tỉnh + huyện + xã).",
  PROVINCE: "Phần giữ lại ở cấp tỉnh.",
  DISTRICT: "Phần giữ lại ở cấp huyện.",
  COMMUNE: "Phần giữ lại ở cấp xã.",
};

const DONUT_COLORS = ["var(--data-main)", "var(--data-sub)"];

/** `Oie` — donut NSTW / NSĐP. */
function ScopeDonut({
  pct,
  twAmount,
  dpAmount,
  height = 240,
}: {
  pct: number;
  twAmount: number;
  dpAmount: number;
  height?: number;
}) {
  const data = [
    { name: "NSTW", value: pct, amount: twAmount },
    { name: "NSĐP", value: 100 - pct, amount: dpAmount },
  ];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 24, right: 24, bottom: 24, left: 24 }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="48%"
          outerRadius="72%"
          paddingAngle={2}
          label={({ name, value }: any) => `${name} ${pct1(value)}%`}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={DONUT_COLORS[i]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string, item: any) => [
            `${pct1(value)}% (${money(item?.payload?.amount)})`,
            name,
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * `lL` — card Theo cấp ngân sách.
 * Empty state khi thiếu NSTW hoặc NSDP, hoặc tổng hai phần bằng 0 — giữ nguyên như bản gốc.
 */
export function ScopeCard({ scope }: { scope: "overview" | "detail" }) {
  const { apiParams } = useFilters();
  const params = scope === "detail" ? apiParams : { ...apiParams, ward: undefined };
  const { data, loading, error } = useApi<ByScopeRow[]>("/api/by-scope", params, EMPTY);

  const top = data.filter((row) => ["NSTW", "NSDP"].includes(row.code));
  const local = data.filter((row) => ["PROVINCE", "DISTRICT", "COMMUNE"].includes(row.code));
  const tw = top.find((row) => row.code === "NSTW");
  const dp = top.find((row) => row.code === "NSDP");
  const sum = (tw?.amount ?? 0) + (dp?.amount ?? 0);

  if (loading || error) return <Async loading={loading} error={error} />;

  return (
    <Card title="Theo cấp ngân sách">
      {!sum || !tw || !dp ? (
        <p className="m-0 text-sm text-muted">Không có số liệu.</p>
      ) : (
        <>
          <ZoomModal
            title="Theo cấp ngân sách"
            render={(height) => (
              <ScopeDonut
                pct={(tw.amount / sum) * 100}
                twAmount={tw.amount}
                dpAmount={dp.amount}
                height={height}
              />
            )}
          />
          <div className="mt-2.5 text-sm text-muted">Trong đó ngân sách địa phương</div>
          <BarList
            rows={local.map((row) => ({ name: row.name, amount: row.amount }))}
            title={(row) => HINTS[local.find((r) => r.name === row.name)?.code ?? ""] ?? ""}
          />
        </>
      )}
    </Card>
  );
}
