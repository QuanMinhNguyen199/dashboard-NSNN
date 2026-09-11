import { useEffect, useMemo, useState } from "react";
import { Async } from "./Async";
import { BarList } from "./BarList";
import { Card } from "./Card";
import { CollapseButton } from "./CollapseButton";
import { useApi } from "../hooks/useApi";
import { money, pct1 } from "../lib/format";
import { useFilters } from "../state/FiltersProvider";
import type { ByWardItemRow, ByWardScopeRow } from "../lib/types";

const NO_SCOPE: ByWardScopeRow[] = [];
const NO_ITEM: ByWardItemRow[] = [];
const HEAD = 5;

interface ScopeWard {
  name: string;
  tw: number;
  dp: number;
  total: number;
}

interface ItemWard {
  name: string;
  items: ByWardItemRow[];
  total: number;
}

/** `eM` — một dòng cấp ngân sách: tên | thanh stacked | phần trăm. */
function ScopeRow({ ward }: { ward: ScopeWard }) {
  const pct = (ward.tw / ward.total) * 100;
  return (
    <div className="grid grid-cols-1 items-center gap-2 py-2 sm:grid-cols-[9rem_1fr_13rem] sm:gap-3">
      <div className="min-w-0 truncate font-semibold text-ink">{ward.name}</div>
      <div
        title={`NSTW ${pct1(pct)}% (${money(ward.tw)}) / NSĐP ${pct1(100 - pct)}% (${money(ward.dp)})`}
        className="flex h-4 overflow-hidden rounded-[.25rem]"
      >
        <div className="bg-data-main" style={{ width: `${pct.toFixed(1)}%` }} />
        <div className="bg-data-cmp" style={{ width: `${(100 - pct).toFixed(1)}%` }} />
      </div>
      <div className="text-[.83rem] text-muted">
        NSTW <b className="text-data-main">{pct1(pct)}%</b> · NSĐP{" "}
        <b className="text-data-cmp">{pct1(100 - pct)}%</b>
      </div>
    </div>
  );
}

/** `tM` — một ô sắc thuế: tên địa bàn + 6 dòng thanh ngang. */
function ItemCell({ ward }: { ward: ItemWard }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <h4 className="m-0 mb-2.5 truncate text-sm font-semibold text-ink" title={ward.name}>
        {ward.name}
      </h4>
      <BarList
        rows={ward.items.slice(0, 6).map((row) => ({ name: row.name, amount: row.amount }))}
      />
    </div>
  );
}

/** `Bie` — So sánh cơ cấu giữa các địa bàn, hai chế độ Cấp ngân sách / Sắc thuế. */
export function WardCompositionCard() {
  const { apiParams } = useFilters();
  const params = { ...apiParams, ward: undefined };
  const [mode, setMode] = useState<"scope" | "item">("scope");
  const [expanded, setExpanded] = useState(false);

  const scopeQuery = useApi<ByWardScopeRow[]>(
    mode === "scope" ? "/api/by-ward-scope" : null,
    params,
    NO_SCOPE,
  );
  const itemQuery = useApi<ByWardItemRow[]>(
    mode === "item" ? "/api/by-ward-item" : null,
    params,
    NO_ITEM,
  );

  useEffect(() => setExpanded(false), [mode, scopeQuery.data, itemQuery.data]);

  const scopeWards = useMemo(() => {
    const byWard = new Map<string, ScopeWard>();
    for (const row of scopeQuery.data) {
      if (!byWard.has(row.location_code))
        byWard.set(row.location_code, { name: row.location_name, tw: 0, dp: 0, total: 0 });
      const entry = byWard.get(row.location_code)!;
      if (row.code === "NSTW") entry.tw = row.amount;
      else if (row.code === "NSDP") entry.dp = row.amount;
    }
    return [...byWard.values()]
      .map((entry) => ({ ...entry, total: entry.tw + entry.dp }))
      .filter((entry) => entry.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [scopeQuery.data]);

  const itemWards = useMemo(() => {
    const byWard = new Map<string, ItemWard>();
    for (const row of itemQuery.data) {
      if (!byWard.has(row.location_code))
        byWard.set(row.location_code, { name: row.location_name, items: [], total: 0 });
      const entry = byWard.get(row.location_code)!;
      entry.items.push(row);
      entry.total += row.amount;
    }
    return [...byWard.values()].sort((a, b) => b.total - a.total);
  }, [itemQuery.data]);

  const scopeHead = scopeWards.slice(0, HEAD);
  const scopeTail = scopeWards.slice(HEAD);
  const itemHead = itemWards.slice(0, HEAD);
  const itemTail = itemWards.slice(HEAD);

  const isEmpty = mode === "scope" ? !scopeWards.length : !itemWards.length;
  const hiddenCount = mode === "scope" ? scopeTail.length : itemTail.length;

  const loading = scopeQuery.loading || itemQuery.loading;
  const error = scopeQuery.error || itemQuery.error;
  if (loading || error) return <Async loading={loading} error={error} />;

  const tabClass = (active: boolean) =>
    active
      ? "rounded-[.35rem] bg-data-main px-2.5 py-1 text-xs text-white"
      : "rounded-[.35rem] border border-line px-2.5 py-1 text-xs text-muted";

  return (
    <Card
      title="So sánh cơ cấu giữa các địa bàn"
      headerAction={
        <CollapseButton show={expanded && hiddenCount > 0} onClick={() => setExpanded(false)} />
      }
    >
      <div className="mb-3 flex gap-1.5">
        <button type="button" onClick={() => setMode("scope")} className={tabClass(mode === "scope")}>
          Cấp ngân sách
        </button>
        <button type="button" onClick={() => setMode("item")} className={tabClass(mode === "item")}>
          Sắc thuế
        </button>
      </div>

      {isEmpty ? (
        <p className="m-0 text-sm text-muted">Chưa có số liệu.</p>
      ) : mode === "scope" ? (
        <div className="divide-y divide-line">
          {scopeHead.map((ward) => (
            <ScopeRow key={ward.name} ward={ward} />
          ))}
          {expanded &&
            scopeTail.map((ward) => <ScopeRow key={ward.name} ward={ward} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itemHead.map((ward) => (
            <ItemCell key={ward.name} ward={ward} />
          ))}
          {expanded && itemTail.map((ward) => <ItemCell key={ward.name} ward={ward} />)}
        </div>
      )}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-3 text-sm font-medium text-data-main"
        >
          {expanded ? "Thu gọn ▴" : `Xem thêm ${hiddenCount} phường/xã ▾`}
        </button>
      )}
    </Card>
  );
}
