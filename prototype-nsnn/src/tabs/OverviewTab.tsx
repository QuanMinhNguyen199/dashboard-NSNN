import { useState } from "react";
import { useDashboardState } from "../state/DashboardState";
import { useOverview } from "../dashboard/useResource";
import type { AmountRow, OverviewData } from "../dashboard/types";
import type { SourceCode } from "../dashboard/catalog";
import { GridRows } from "../ui/Grid";
import { TrendChart, TrendTable, WaterfallChart } from "../ui/charts";
import { Bars, Card, Change, CoverageNote, ResourceView, Segmented, money, pct } from "../ui/primitives";

/**
 * Tổng quan luôn ở phạm vi toàn thành phố, nên không có bộ chọn địa bàn trong
 * bộ lọc chung. Muốn xem một phường thì bấm vào nó và sang tab Chi tiết.
 */
export function OverviewTab() {
  const { filters, dispatchIntent } = useDashboardState();
  const { resource, retry } = useOverview(filters);

  return (
    <ResourceView resource={resource} retry={retry} minHeight={420}>
      {(data, partial) => <OverviewBody data={data} partial={partial} dispatch={dispatchIntent} />}
    </ResourceView>
  );
}

function OverviewBody({
  data,
  partial,
  dispatch,
}: {
  data: OverviewData;
  partial?: string;
  dispatch: ReturnType<typeof useDashboardState>["dispatchIntent"];
}) {
  const { filters } = useDashboardState();
  const [rankDirection, setRankDirection] = useState<"high" | "low">("high");
  const [growthDirection, setGrowthDirection] = useState<"up" | "down">("up");
  const [showTrendTable, setShowTrendTable] = useState(false);

  const ranked = [...data.locations].sort((a, b) =>
    rankDirection === "high" ? b.amount - a.amount : a.amount - b.amount,
  );
  const growth = [...data.locations]
    .map((row) => ({ row, change: yoyOf(row) }))
    .filter((entry) => entry.change !== null)
    .sort((a, b) => (b.change! - a.change!) * (growthDirection === "up" ? 1 : -1))
    .map((entry) => entry.row);

  const topItems = [...data.domesticItems].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <>
      <CoverageNote message={partial} />

      <section className="dkpis" aria-label="Chỉ số chính">
        <div>
          <span>Thu trong kỳ</span>
          <strong>{money(data.kpiPeriod.amount)}</strong>
          <small>
            <Change current={data.kpiPeriod.amount} previous={data.kpiPeriod.previous} /> so cùng kỳ
          </small>
        </div>
        <div>
          <span>Lũy kế từ đầu năm</span>
          <strong>{money(data.kpiYtd.amount)}</strong>
          <small>
            <Change current={data.kpiYtd.amount} previous={data.kpiYtd.previous} /> so cùng kỳ
          </small>
        </div>
        <div>
          <span>Độ phủ địa bàn</span>
          <strong>
            {data.meta.coverage.covered}
            <em>/{data.meta.coverage.total}</em>
          </strong>
          <small>
            {data.meta.coverage.missing.length
              ? `Thiếu ${data.meta.coverage.missing.length} địa bàn`
              : "Đầy đủ báo cáo"}
          </small>
        </div>
        <div className={`dkpi-insight tone-${data.insight.tone}`}>
          <span>Cần chú ý</span>
          <strong>{data.insight.title}</strong>
          <small>{data.insight.detail}</small>
        </div>
      </section>

      <GridRows
        rows={[
          [
            {
              id: "trend",
              span: 8,
              render: () => (
                <Card
                  title="Xu hướng thu ngân sách"
                  subtitle={`12 tháng · ${filters.accumulation === "YTD" ? "lũy kế từ đầu năm" : "thực hiện trong kỳ"}`}
                  actions={
                    <button
                      type="button"
                      className="dlink"
                      onClick={() => setShowTrendTable((value) => !value)}
                      aria-expanded={showTrendTable}
                    >
                      {showTrendTable ? "Xem biểu đồ" : "Xem bảng số liệu"}
                    </button>
                  }
                >
                  {showTrendTable ? (
                    <TrendTable points={data.trend} year={filters.year} />
                  ) : (
                    <TrendChart points={data.trend} year={filters.year} />
                  )}
                </Card>
              ),
            },
            {
              id: "sources",
              span: 4,
              render: () => (
                <Card title="Cơ cấu nguồn thu" subtitle="Tỷ trọng trên tổng thu · chọn để xem nhanh">
                  <Bars
                    rows={data.sources}
                    total={data.sources.reduce((sum, row) => sum + row.amount, 0)}
                    scale="share"
                    onSelect={(row) =>
                      dispatch({ type: "OPEN_REVENUE_PREVIEW", sourceId: row.id as SourceCode })
                    }
                  />
                </Card>
              ),
            },
          ],
          [
            {
              id: "items",
              span: 8,
              render: () => (
                <Card
                  title="Top khoản thu nội địa"
                  subtitle="Năm khoản lớn nhất trong 21 khoản nội địa"
                  actions={
                    <button
                      type="button"
                      className="dlink"
                      onClick={() =>
                        dispatch({
                          type: "OPEN_REVENUE_ANALYSIS",
                          sourceId: "domestic",
                          view: "ranking",
                        })
                      }
                    >
                      Xem tất cả 21 khoản
                    </button>
                  }
                >
                  <Bars rows={topItems} />
                </Card>
              ),
            },
            {
              id: "locations",
              span: 4,
              render: () => (
                <Card
                  title="Top địa bàn"
                  subtitle={`${data.meta.coverage.covered}/${data.meta.coverage.total} phường, xã có số liệu`}
                  actions={
                    <Segmented
                      label="Chiều xếp hạng"
                      value={rankDirection}
                      options={[
                        { value: "high", label: "Cao nhất" },
                        { value: "low", label: "Thấp nhất" },
                      ]}
                      onChange={setRankDirection}
                    />
                  }
                >
                  <Bars
                    rows={ranked.slice(0, 5)}
                    onSelect={(row) => dispatch({ type: "OPEN_LOCATION_DETAIL", locationId: row.id })}
                  />
                </Card>
              ),
            },
          ],
          [
            {
              id: "growth",
              span: 6,
              render: () => (
                <Card
                  title="Tăng trưởng địa bàn"
                  subtitle="Bỏ qua địa bàn chưa đủ số liệu kỳ trước"
                  actions={
                    <Segmented
                      label="Chiều tăng trưởng"
                      value={growthDirection}
                      options={[
                        { value: "up", label: "Tăng mạnh" },
                        { value: "down", label: "Giảm mạnh" },
                      ]}
                      onChange={setGrowthDirection}
                    />
                  }
                >
                  <Bars
                    rows={growth.slice(0, 5)}
                    scale="change"
                    onSelect={(row) => dispatch({ type: "OPEN_LOCATION_DETAIL", locationId: row.id })}
                  />
                </Card>
              ),
            },
            {
              id: "levels",
              span: 6,
              // Chọn riêng NSTW hoặc NSĐP thì widget này không còn nghĩa: bị loại
              // khỏi lưới và widget bên cạnh nở ra đủ 12 cột.
              hidden: data.budgetLevels.length === 0,
              render: () => (
                <Card title="Cơ cấu NSTW và NSĐP" subtitle="Tỷ trọng trên tổng NSNN">
                  <Bars
                    rows={data.budgetLevels}
                    total={data.budgetLevels.reduce((sum, row) => sum + row.amount, 0)}
                    scale="share"
                  />
                </Card>
              ),
            },
          ],
          [
            {
              id: "waterfall",
              span: 12,
              render: () => (
                <Card
                  title="Biến động so cùng kỳ"
                  subtitle="Đóng góp của từng nguồn vào mức chênh · chọn để so sánh"
                >
                  <WaterfallChart
                    data={data.waterfall}
                    onSelectStep={(id) =>
                      dispatch({
                        type: "OPEN_ADVANCED_COMPARISON",
                        mode: "revenue",
                        entityIds: [id, id === "domestic" ? "other" : "domestic"],
                      })
                    }
                  />
                </Card>
              ),
            },
          ],
        ]}
      />
    </>
  );
}

const yoyOf = (row: AmountRow) =>
  row.previous === null || row.previous <= 0 ? null : ((row.amount - row.previous) / row.previous) * 100;

export { pct };
