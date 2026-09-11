import { BarList } from "./BarList";
import { Card } from "./Card";
import { exact, money } from "../lib/format";
import { useFilters } from "../state/FiltersProvider";
import type { ByItemRow, ByWardRow } from "../lib/types";

/** `L6` — card Chi tiết địa bàn, max-height 22rem và cuộn dọc. */
export function WardDetailCard({
  curWard,
  itemRows,
}: {
  curWard?: ByWardRow;
  itemRows: ByItemRow[];
}) {
  const { ward, item } = useFilters();
  if (!ward) return null;

  if (!curWard)
    return (
      <Card title="Chi tiết địa bàn">
        <p className="m-0 text-sm text-muted">Địa bàn này chưa có số liệu trong kỳ đã chọn.</p>
      </Card>
    );

  return (
    <Card title="Chi tiết địa bàn" className="max-h-[22rem] overflow-y-auto">
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 text-[.86rem]">
        <dt className="text-muted">Địa bàn</dt>
        <dd className="font-semibold text-ink">{curWard.location_name}</dd>
        <dt className="text-muted">Mã</dt>
        <dd>{curWard.location_code}</dd>
        <dt className="text-muted">{item}</dt>
        <dd className="font-semibold text-data-main">{money(curWard.amount)}</dd>
        <dt className="text-muted">Chính xác</dt>
        <dd>{exact(curWard.amount)}</dd>
      </dl>
      <h3 className="mb-2 mt-3 text-[.85rem] uppercase tracking-wide text-muted">Cơ cấu thu</h3>
      <BarList rows={itemRows.slice(0, 6)} />
    </Card>
  );
}
