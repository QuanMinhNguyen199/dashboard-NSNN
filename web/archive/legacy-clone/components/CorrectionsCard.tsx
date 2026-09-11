import { Async } from "./Async";
import { Card } from "./Card";
import { useApi } from "../hooks/useApi";
import { money } from "../lib/format";
import { useFilters } from "../state/FiltersProvider";
import type { CorrectionRow } from "../lib/types";

const EMPTY: CorrectionRow[] = [];

/** `qie` */
export function CorrectionsCard() {
  const { apiParams } = useFilters();
  const params = { ...apiParams, ward: undefined };
  const { data, loading, error } = useApi<CorrectionRow[]>("/api/corrections", params, EMPTY);

  if (loading || error) return <Async loading={loading} error={error} />;

  return (
    <Card title="Đính chính số liệu">
      {data.length ? (
        <div className="grid gap-2">
          {data.map((row, i) => (
            <div key={i} className="text-[.83rem]">
              <div className="font-semibold text-ink">
                {row.location_name} — {row.report_item_name}
              </div>
              <div className="text-muted">
                {money(row.old_amount)} → {money(row.new_amount)} (v{row.version})
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="m-0 text-sm text-muted">Chưa có chỉ tiêu nào bị đính chính trong kỳ này.</p>
      )}
    </Card>
  );
}
