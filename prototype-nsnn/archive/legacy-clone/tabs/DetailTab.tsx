import { Async } from "../components/Async";
import { Card } from "../components/Card";
import { Kpis } from "../components/Kpis";
import { MapCard } from "../components/MapCard";
import { RankCard } from "../components/RankCard";
import { ScopeCard } from "../components/ScopeCard";
import { TopItemsCard } from "../components/TopItemsCard";
import { TrendCard } from "../components/TrendCard";
import { WardDetailCard } from "../components/WardDetailCard";
import { useApi } from "../hooks/useApi";
import { useFilters } from "../state/FiltersProvider";
import type { ByItemRow, ByWardRow } from "../lib/types";

const EMPTY: ByItemRow[] = [];

/** `Tie` — tab Chi tiết địa bàn. */
export function DetailTab({
  wardRows,
  wardLoading,
  wardError,
}: {
  wardRows: ByWardRow[];
  wardLoading: boolean;
  wardError: string | null;
}) {
  const { apiParams, ward, district, districtName } = useFilters();
  const {
    data: itemRows,
    loading,
    error,
  } = useApi<ByItemRow[]>(district ? null : "/api/by-item", apiParams, EMPTY);
  const curWard = ward ? wardRows.find((row) => row.location_code === ward) : undefined;

  // Nhánh địa giới lịch sử: chỉ card tên quận/huyện + bản đồ, không dựng KPI.
  if (district)
    return (
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card title={districtName ?? "Địa bàn lịch sử"}>
          <p className="text-sm text-muted">
            Đang xem ranh giới quận/huyện. Chưa có dữ liệu thu theo đơn vị lịch sử này.
          </p>
        </Card>
        <MapCard wardRows={[]} />
      </div>
    );

  return (
    <>
      <Kpis scope="detail" />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Async loading={wardLoading} error={wardError}>
            <RankCard rows={wardRows} />
          </Async>
          {ward ? (
            <Async loading={wardLoading || loading} error={wardError || error}>
              <WardDetailCard curWard={curWard} itemRows={itemRows} />
            </Async>
          ) : (
            <TrendCard scope="detail" />
          )}
          <ScopeCard scope="detail" />
          {ward && <TrendCard scope="detail" />}
          <Async loading={loading} error={error}>
            <TopItemsCard itemRows={itemRows} curWard={curWard} />
          </Async>
        </div>
        <div className="grid gap-2">
          <MapCard wardRows={wardRows} />
          {(wardLoading || wardError) && <Async loading={wardLoading} error={wardError} />}
        </div>
      </div>
    </>
  );
}
