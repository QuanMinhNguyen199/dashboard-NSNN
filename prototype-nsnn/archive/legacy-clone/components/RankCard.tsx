import { BarList } from "./BarList";
import { Card } from "./Card";
import { useTopRowCount } from "../hooks/useTopRowCount";
import { money } from "../lib/format";
import { useFilters } from "../state/FiltersProvider";
import type { ByWardRow } from "../lib/types";

/** `D6` — card Xếp hạng. Có ward thì hiện số hạng lớn, không thì hiện Top N. */
export function RankCard({ rows }: { rows: ByWardRow[] }) {
  const { ward, item, selectWard, historicalAreas } = useFilters();
  const topCount = useTopRowCount();
  const current = ward ? rows.find((row) => row.location_code === ward) : undefined;

  return (
    <Card title="Xếp hạng">
      {current ? (
        <div>
          <div className="text-base text-muted">Xếp hạng theo {item}</div>
          <div className="mt-1 text-[3.4rem] font-semibold leading-tight text-ink">
            {rows.findIndex((row) => row.location_code === current.location_code) + 1}
            <span className="ml-1 text-2xl font-normal text-muted"> / {rows.length} phường/xã</span>
          </div>
          <div className="mt-1 text-2xl font-semibold text-data-main">{money(current.amount)}</div>
        </div>
      ) : (
        <BarList
          rows={rows.slice(0, topCount).map((row) => ({
            name: row.location_name,
            amount: row.amount,
            id: row.location_code,
          }))}
          onRowClick={historicalAreas ? undefined : (row) => row.id && selectWard(row.id)}
        />
      )}
    </Card>
  );
}
