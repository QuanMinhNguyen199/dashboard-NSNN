import { BarList } from "./BarList";
import { Card } from "./Card";
import { useTopRowCount } from "../hooks/useTopRowCount";
import { useFilters } from "../state/FiltersProvider";
import type { ByItemRow, ByWardRow } from "../lib/types";

/** `uR` — Top chỉ tiêu; tiêu đề đổi theo phạm vi đang xem. */
export function TopItemsCard({
  itemRows,
  curWard,
}: {
  itemRows: ByItemRow[];
  curWard?: ByWardRow;
}) {
  const topCount = useTopRowCount();
  const { tab, wardName, ward } = useFilters();
  const title =
    tab === "detail" && ward
      ? `Top chỉ tiêu (${wardName ?? ward})`
      : curWard
        ? `Top chỉ tiêu (${curWard.location_name})`
        : "Top chỉ tiêu (toàn TP)";

  return (
    <Card title={title}>
      <BarList rows={itemRows.slice(0, topCount)} />
    </Card>
  );
}
