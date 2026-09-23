import { useMemo, useState } from "react";
import { useDashboardState } from "@/state/DashboardState";
import { useOverview } from "@/data/hooks";
import type { OverviewData, TaxOfficeProgressRow, TaxpayerRow } from "@/domain/types";
import type { SourceCode } from "@/domain/catalog";
import { GridRows } from "@/components/Grid";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { DonutChart, TrendChart, TrendTable } from "@/components/charts";
import { TaxpayerDrawer } from "@/components/TaxpayerDrawer";
import { Bars, Card, Change, inScale, Money, ResourceView, Segmented, moneyScale, money, pct } from "@/components/primitives";

export function OverviewTab() {
  const { filters, dispatchIntent } = useDashboardState();
  const { resource, retry } = useOverview(filters);
  return <ResourceView resource={resource} retry={retry} minHeight={420}>
    {(data) => <OverviewBody data={data} dispatch={dispatchIntent} />}
  </ResourceView>;
}

function OverviewBody({ data, dispatch }: {
  data: OverviewData;
  dispatch: ReturnType<typeof useDashboardState>["dispatchIntent"];
}) {
  const { filters, setFilters, setSection, setTaxOfficeCode, setLocationScope, setTab } = useDashboardState();
  const [showTrendTable, setShowTrendTable] = useState(false);
  const [selectedBudgetLevel, setSelectedBudgetLevel] = useState<"NSTW" | "NSDP">("NSDP");
  const [managementView, setManagementView] = useState<"taxOffice" | "location">("taxOffice");
  const [locationMetric, setLocationMetric] = useState<"completion" | "amount">("completion");
  const [driverView, setDriverView] = useState<"industry" | "taxpayer">("industry");
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<TaxpayerRow | null>(null);

  const domestic = data.sources.find((row) => row.id === "domestic") ?? data.scopeTotal;
  const kpiUnit = moneyScale([data.kpiPeriod.amount, data.kpiYtd.amount, domestic.amount]);
  const budgetDetailRows = selectedBudgetLevel === "NSTW" ? data.centralBudgetSources : data.localBudgetLevels;
  const budgetDetailUnit = moneyScale(budgetDetailRows.map((row) => row.amount));
  const budgetDetailMax = Math.max(...budgetDetailRows.map((row) => Math.abs(row.amount)), 1);
  const taxOfficeProgress = useMemo(() => [...data.taxOfficeProgress]
    .filter((row) => row.completionRate !== null)
    .sort((a, b) => (b.completionRate ?? 0) - (a.completionRate ?? 0)).slice(0, 8), [data.taxOfficeProgress]);
  const locationProgress = useMemo<TaxOfficeProgressRow[]>(() => [...data.locations]
    .map((row, index) => {
      const plan = Math.max((row.previous ?? row.amount) * (1.06 + (index % 5) * 0.015), 1);
      return { ...row, plan, completionRate: row.amount / plan * 100, planOrigin: "mock" as const };
    })
    .sort((a, b) => locationMetric === "completion"
      ? (b.completionRate ?? 0) - (a.completionRate ?? 0)
      : b.amount - a.amount).slice(0, 8), [data.locations, locationMetric]);

  const openTaxOffice = (code: string) => {
    setLocationScope(null);
    setTaxOfficeCode(code);
    setTab("location-detail");
  };
  const openIndustry = (industry: string) => {
    setFilters({ industry });
    setSection("domestic");
    setTab("revenue-analysis");
  };

  return <>
    <KpiStrip label="Chỉ số điều hành" columns={4}>
      <Kpi label="Tổng thu trong kỳ" note={<><Change current={data.kpiPeriod.amount} previous={data.kpiPeriod.previous} label="" /> so cùng kỳ</>}><Money value={data.kpiPeriod.amount} scale={kpiUnit} /></Kpi>
      <Kpi label="Lũy kế đầu năm" note={<><Change current={data.kpiYtd.amount} previous={data.kpiYtd.previous} label="" /> so cùng kỳ</>}><Money value={data.kpiYtd.amount} scale={kpiUnit} /></Kpi>
      <Kpi label="Tổng thu nội địa" note={<><Change current={domestic.amount} previous={domestic.previous} label="" /> so cùng kỳ</>}><Money value={domestic.amount} scale={kpiUnit} /></Kpi>
      <Kpi label={filters.accumulation === "YTD" ? "% đạt dự toán thu nội địa" : "% hoàn thành kế hoạch tháng"} note={data.estimate ? `Dự toán ${money(data.estimate.annual)}` : "Chưa có dữ liệu dự toán"}>{data.estimate?.progress == null ? "—" : pct(data.estimate.progress * 100)}</Kpi>
    </KpiStrip>

    <GridRows rows={[
      [
        { id: "trend", span: 7, render: () => <Card title="Xu hướng thu ngân sách" subtitle={`Lũy kế ${filters.year} và cùng kỳ ${filters.year - 1}`} actions={<button type="button" className="dlink" onClick={() => setShowTrendTable((value) => !value)}>{showTrendTable ? "Xem biểu đồ" : "Xem bảng số liệu"}</button>}>{showTrendTable ? <TrendTable points={data.trend} year={filters.year} /> : <TrendChart points={data.trend} year={filters.year} />}</Card> },
        { id: "budget", span: 5, hidden: data.budgetLevels.length === 0, render: () => <Card title="Cơ cấu theo cấp ngân sách" subtitle="Phần Trung ương và phần Hà Nội được hưởng" unit={budgetDetailUnit}>
          <DonutChart rows={data.budgetLevels} centerLabel="NSNN" selectedId={selectedBudgetLevel} onSelect={(id) => setSelectedBudgetLevel(id as "NSTW" | "NSDP")} />
          <section className="dbudget-local" aria-live="polite"><h3>{selectedBudgetLevel === "NSTW" ? "Trong ngân sách trung ương" : "Trong ngân sách địa phương"}</h3><ul>{budgetDetailRows.map((row) => <li key={row.id}><div><span>{row.name}</span><strong className="dbudget-value">{inScale(row.amount, budgetDetailUnit)} <small>{budgetDetailUnit.short}</small></strong></div><span className="dbudget-track" aria-hidden="true"><i style={{ width: `${Math.max(Math.abs(row.amount) / budgetDetailMax * 100, 0.8)}%` }} /></span></li>)}</ul></section>
        </Card> },
      ],
      [
        { id: "sources", span: 12, render: () => <Card title="Cơ cấu 4 nhóm nguồn thu" subtitle="Chọn một nhóm để xem tóm tắt và đi tới phân tích liên quan" unit={moneyScale(data.sources.map((row) => row.amount))}><div className="doverview-sources">{data.sources.map((row) => <button key={row.id} type="button" onClick={() => dispatch({ type: "OPEN_REVENUE_PREVIEW", sourceId: row.id as SourceCode })}><span>{row.name}</span><strong><Money value={row.amount} /></strong><small>{pct(row.share)}</small><i aria-hidden="true">›</i></button>)}</div></Card> },
      ],
      [
        { id: "management", span: 6, render: () => <Card title="Theo dõi quản lý nhà nước" subtitle="Xếp hạng thực hiện theo đơn vị thuế hoặc địa bàn" actions={<Segmented label="Góc nhìn quản lý" value={managementView} options={[{ value: "taxOffice", label: "Theo cơ quan thuế" }, { value: "location", label: "Theo địa bàn" }]} onChange={setManagementView} />}>
          {managementView === "location" && <div className="doverview-inline-control"><Segmented label="Chỉ số địa bàn" value={locationMetric} options={[{ value: "completion", label: "% đạt dự toán" }, { value: "amount", label: "Quy mô dòng tiền" }]} onChange={setLocationMetric} /><span className="dtag is-review">Dự toán mô phỏng</span></div>}
          <ExecutionList rows={managementView === "taxOffice" ? taxOfficeProgress : locationProgress} mode={managementView === "location" && locationMetric === "amount" ? "amount" : "completion"} onSelect={(row) => managementView === "taxOffice" ? openTaxOffice(row.id) : dispatch({ type: "OPEN_LOCATION_DETAIL", locationId: row.id })} />
        </Card> },
        { id: "drivers", span: 6, render: () => <Card title="Động lực ngành nghề và doanh nghiệp" subtitle="Dữ liệu TMS mô phỏng cho tới khi nối chứng từ" actions={<Segmented label="Góc nhìn TMS" value={driverView} options={[{ value: "industry", label: "Top ngành nghề" }, { value: "taxpayer", label: "Top doanh nghiệp" }]} onChange={setDriverView} />} unit={driverView === "industry" ? moneyScale(data.industries.map((row) => row.amount)) : moneyScale(data.topTaxpayers.rows.map((row) => row.amount))}>
          {driverView === "industry" ? <Bars rows={data.industries.slice(0, 8)} total={data.industries.reduce((sum, row) => sum + row.amount, 0)} scale="share" onSelect={(row) => openIndustry(row.id)} /> : <TaxpayerList rows={data.topTaxpayers.rows.slice(0, 8)} onSelect={setSelectedTaxpayer} />}
        </Card> },
      ],
    ]} />
    <TaxpayerDrawer row={selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
  </>;
}

function ExecutionList({ rows, mode, onSelect }: { rows: TaxOfficeProgressRow[]; mode: "completion" | "amount"; onSelect: (row: TaxOfficeProgressRow) => void }) {
  const unit = moneyScale(rows.map((row) => row.amount));
  const max = Math.max(...rows.map((row) => mode === "completion" ? (row.completionRate ?? 0) : row.amount), 1);
  return <ol className="dexecution-list">{rows.map((row, index) => {
    const value = mode === "completion" ? (row.completionRate ?? 0) : row.amount;
    return <li key={row.id}><button type="button" onClick={() => onSelect(row)}><span>{index + 1}</span><b>{row.name}</b><strong>{mode === "completion" ? pct(value) : `${inScale(value, unit)} ${unit.short}`}</strong><i aria-hidden="true"><em style={{ width: `${Math.max(value / max * 100, 1)}%` }} /></i></button></li>;
  })}</ol>;
}

function TaxpayerList({ rows, onSelect }: { rows: TaxpayerRow[]; onSelect: (row: TaxpayerRow) => void }) {
  const unit = moneyScale(rows.map((row) => row.amount));
  return <ol className="dtaxpayer-list">{rows.map((row, index) => <li key={row.id}><button type="button" onClick={() => onSelect(row)}><span>{index + 1}</span><b>{row.name}<small>{row.industry}</small></b><strong>{inScale(row.amount, unit)} {unit.short}</strong><i aria-hidden="true">›</i></button></li>)}</ol>;
}

export { pct };
