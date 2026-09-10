import { BarList, type BarRow } from "./BarList";
import { Card } from "./Card";
import { useTopRowCount } from "../hooks/useTopRowCount";
import { useFilters } from "../state/FiltersProvider";
import type { ByWardRow } from "../lib/types";

/** `kie` — Top địa bàn ở Overview; click một dòng thì chuyển sang tab Chi tiết địa bàn. */
export function TopWardsCard({ rows }: { rows: ByWardRow[] }) {
  const topCount = useTopRowCount();
  const { selectWard, switchTab, historicalAreas } = useFilters();

  const onRowClick = (row: BarRow) => {
    if (!row.id) return;
    selectWard(row.id);
    switchTab("detail");
  };

  return (
    <Card title="Top địa bàn">
      <BarList
        rows={rows.slice(0, topCount).map((row) => ({
          name: row.location_name,
          amount: row.amount,
          id: row.location_code,
        }))}
        onRowClick={historicalAreas ? undefined : onRowClick}
      />
    </Card>
  );
}
