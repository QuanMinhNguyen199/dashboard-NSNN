import { useState } from "react";
import { useDashboardState } from "@/state/DashboardState";
import { useOverview } from "@/data/hooks";
import type { AmountRow, OverviewData } from "@/domain/types";
import type { SourceCode } from "@/domain/catalog";
import { GridRows } from "@/components/Grid";
import { Kpi, KpiInsight, KpiStrip } from "@/components/Kpi";
import { DonutChart, TrendChart, TrendTable, WaterfallChart } from "@/components/charts";
import {
  Bars,
  Card,
  Change,
  inScale,
  Money,
  ResourceView,
  Segmented,
  moneyScale,
  money,
  pct,
} from "@/components/primitives";

/**
 * Tổng quan luôn ở phạm vi toàn thành phố, nên không có bộ chọn địa bàn trong
 * bộ lọc chung. Muốn xem một phường thì bấm vào nó và sang tab Chi tiết.
 */
export function OverviewTab() {
  const { filters, dispatchIntent } = useDashboardState();
  const { resource, retry } = useOverview(filters);

  return (
    <ResourceView resource={resource} retry={retry} minHeight={420}>
      {(data) => <OverviewBody data={data} dispatch={dispatchIntent} />}
    </ResourceView>
  );
}

function OverviewBody({
  data,
  dispatch,
}: {
  data: OverviewData;
  dispatch: ReturnType<typeof useDashboardState>["dispatchIntent"];
}) {
  const { filters } = useDashboardState();
  const [rankDirection, setRankDirection] = useState<"high" | "low">("high");
  const [growthDirection, setGrowthDirection] = useState<"up" | "down">("up");
  const [showTrendTable, setShowTrendTable] = useState(false);
  const [selectedBudgetLevel, setSelectedBudgetLevel] = useState<"NSTW" | "NSDP">("NSDP");

  const ranked = [...data.locations].sort((a, b) =>
    rankDirection === "high" ? b.amount - a.amount : a.amount - b.amount,
  );
  const growth = [...data.locations]
    .map((row) => ({ row, change: yoyOf(row) }))
    .filter((entry) => entry.change !== null)
    .sort((a, b) => (b.change! - a.change!) * (growthDirection === "up" ? 1 : -1))
    .map((entry) => entry.row);

  const topItems = [...data.domesticItems].sort((a, b) => b.amount - a.amount).slice(0, 5);
  // Thu trong kỳ và Lũy kế là cùng một đại lượng trên hai khung thời gian, nằm
  // cạnh nhau nên phải cùng đơn vị và cùng số lẻ mới so được.
  const kpiUnit = moneyScale([data.kpiPeriod.amount, data.kpiYtd.amount]);
  const budgetDetailRows = selectedBudgetLevel === "NSTW" ? data.centralBudgetSources : data.localBudgetLevels;
  const budgetDetailUnit = moneyScale(budgetDetailRows.map((row) => row.amount));
  const budgetDetailMax = Math.max(...budgetDetailRows.map((row) => Math.abs(row.amount)), 1);

  return (
    <>
      <KpiStrip label="Chỉ số chính">
        <Kpi
          label="Thu trong kỳ"
          note={<><Change current={data.kpiPeriod.amount} previous={data.kpiPeriod.previous} label="" /> so cùng kỳ</>}
        >
          <Money value={data.kpiPeriod.amount} scale={kpiUnit} />
        </Kpi>
        <Kpi
          label="Lũy kế từ đầu năm"
          note={<><Change current={data.kpiYtd.amount} previous={data.kpiYtd.previous} label="" /> so cùng kỳ</>}
        >
          <Money value={data.kpiYtd.amount} scale={kpiUnit} />
        </Kpi>
        <Kpi
          label="Tiến độ so dự toán"
          note={
            data.estimate
              ? `Dự toán${data.estimate.origin === "mock" ? " mô phỏng" : ""}: ${money(data.estimate.annual)}`
              : "Chưa có dữ liệu dự toán"
          }
        >
          {data.estimate?.progress == null ? "—" : pct(data.estimate.progress * 100)}
        </Kpi>
        <KpiInsight label="Cần chú ý" tone={data.insight.tone} note={data.insight.detail}>
          {data.insight.title}
        </KpiInsight>
      </KpiStrip>

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
                <Card
                  title="Cơ cấu nguồn thu"
                  subtitle="Tỷ trọng trên tổng thu · chọn để xem nhanh"
                  unit={moneyScale(data.sources.map((row) => row.amount))}
                >
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
                  unit={moneyScale(topItems.map((row) => row.amount))}
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
                  unit={moneyScale(ranked.slice(0, 5).map((row) => row.amount))}
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
                  unit={moneyScale(growth.slice(0, 5).map((row) => row.amount))}
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
                <Card
                  title="Theo cấp ngân sách"
                  subtitle="Tỷ trọng trên tổng NSNN · chọn một phần để xem chi tiết"
                  unit={budgetDetailUnit}
                >
                  <DonutChart
                    rows={data.budgetLevels}
                    centerLabel="NSNN"
                    selectedId={selectedBudgetLevel}
                    onSelect={(id) => setSelectedBudgetLevel(id as "NSTW" | "NSDP")}
                  />
                  <section
                    className="dbudget-local"
                    aria-live="polite"
                    aria-label={`Phân rã ngân sách ${selectedBudgetLevel === "NSTW" ? "trung ương" : "địa phương"}`}
                  >
                    <h3>
                      {selectedBudgetLevel === "NSTW"
                        ? "Trong đó ngân sách trung ương"
                        : "Trong đó ngân sách địa phương"}
                    </h3>
                    <ul>
                      {budgetDetailRows.map((row) => {
                        return (
                          <li key={row.id}>
                            <div>
                              <span>{row.name}</span>
                              <strong className="dbudget-value" title={money(row.amount)}>
                                {inScale(row.amount, budgetDetailUnit)} <small>{budgetDetailUnit.short}</small>
                              </strong>
                            </div>
                            <span className="dbudget-track" aria-hidden="true">
                              <i
                                className={row.amount < 0 ? "is-negative" : undefined}
                                style={{ width: `${Math.max((Math.abs(row.amount) / budgetDetailMax) * 100, 0.8)}%` }}
                              />
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
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
