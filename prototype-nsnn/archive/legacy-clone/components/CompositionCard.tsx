import { Async } from "./Async";
import { BarList } from "./BarList";
import { Card } from "./Card";
import { useApi } from "../hooks/useApi";
import { money, pct1 } from "../lib/format";
import { useFilters } from "../state/FiltersProvider";
import type { TreemapData } from "../lib/types";

const EMPTY: TreemapData = { parent: "", total: null, rows: [] };

/**
 * `Iie` — Cơ cấu Thu NSNN.
 * Endpoint tên /api/treemap nhưng bản gốc vẽ danh sách thanh ngang, không phải treemap.
 */
export function CompositionCard() {
  const { apiParams } = useFilters();
  const params = { ...apiParams, ward: undefined };
  const { data, loading, error } = useApi<TreemapData>("/api/treemap", params, EMPTY);

  if (loading || error) return <Async loading={loading} error={error} />;

  return (
    <Card title="Cơ cấu Thu NSNN">
      {data.rows.length ? (
        <>
          <div className="mb-2 text-sm text-muted">
            Cha: <b className="text-ink">{data.parent}</b> — tổng {money(data.total)}
          </div>
          <BarList
            rows={data.rows.map((row) => ({
              name: `${row.name} (${pct1((row.amount / (data.total || 1)) * 100)}%)`,
              amount: row.amount,
            }))}
          />
        </>
      ) : (
        <p className="m-0 text-sm text-muted">Chưa có số liệu.</p>
      )}
    </Card>
  );
}
