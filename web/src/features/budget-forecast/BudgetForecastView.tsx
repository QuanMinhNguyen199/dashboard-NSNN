import { useMemo, useState } from "react";
import { useBudgetForecast } from "@/data/hooks";
import { useDashboardState } from "@/state/DashboardState";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { Card, Money, ResourceView, moneyScale, pct } from "@/components/primitives";
import { DataFreshnessBar } from "@/components/DataFreshnessBar";
import { ReportExportButton } from "@/components/ReportExportButton";
import {
  BUDGET_STATUS_LABEL,
  meetsForecastTarget,
  type BudgetForecastData,
  type BudgetProgressRow,
  type BudgetStatus,
  type BudgetViewBy,
} from "@/domain/workspaces";
import { BudgetProgressTable } from "./BudgetProgressTable";
import { ForecastChart } from "./ForecastChart";
import { OfficialBudgetSnapshot } from "./OfficialBudgetSnapshot";
import { isOfficialCityTotalScope } from "@/data/official-18-09";

const VIEWS: { id: BudgetViewBy; label: string }[] = [
  { id: "location", label: "Theo địa bàn" },
  { id: "revenueItem", label: "Theo sắc thuế/khoản thu" },
];

const STATUS_FILTERS: { id: BudgetStatus | "all"; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "done", label: BUDGET_STATUS_LABEL.done },
  { id: "atRisk", label: BUDGET_STATUS_LABEL.atRisk },
  { id: "over", label: BUDGET_STATUS_LABEL.over },
];

export function BudgetForecastView() {
  const { filters } = useDashboardState();
  const [viewBy, setViewBy] = useState<BudgetViewBy>("location");
  const [status, setStatus] = useState<BudgetStatus | "all">("all");
  const { resource, retry, pending } = useBudgetForecast(filters, viewBy);

  return (
    <>
      {/* Hai ô lọc cục bộ đứng NGOÀI vùng tải: đổi góc nhìn thì chỉ phần số bên
          dưới tải lại, chỗ đứng để bấm tiếp vẫn còn nguyên. */}
      <div className="dlocalbar">
        <div className="dfield">
          <span>Cách xem</span>
          <div className="dseg" role="group" aria-label="Cách xem dự toán">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={viewBy === v.id ? "is-active" : undefined}
                aria-pressed={viewBy === v.id}
                onClick={() => setViewBy(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <label className="dfield">
          <span>Trạng thái</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as BudgetStatus | "all")}>
            {STATUS_FILTERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <p className="dlocal-context" aria-live="polite">
          {viewBy === "location"
            ? "Lũy kế đến kỳ báo cáo · tiến độ của từng phường, xã"
            : "Lũy kế đến kỳ báo cáo · tiến độ của từng sắc thuế, khoản thu"}
        </p>
      </div>

      <ResourceView key={viewBy} resource={resource} retry={retry} minHeight={420} pending={pending}>
        {(data) => (
          <BudgetBody
            data={data}
            status={status}
            showOfficialReference={isOfficialCityTotalScope(filters)}
          />
        )}
      </ResourceView>
    </>
  );
}

function BudgetBody({
  data,
  status,
  showOfficialReference,
}: {
  data: BudgetForecastData;
  status: BudgetStatus | "all";
  showOfficialReference: boolean;
}) {
  const rows = useMemo(
    () => (status === "all" ? data.rows : data.rows.filter((r) => r.status === status)),
    [data.rows, status],
  );
  const unit = useMemo(
    () => moneyScale([data.totals.plan, data.totals.actual, data.totals.forecast]),
    [data.totals],
  );

  /**
   * Sai số dự báo chỉ được kết luận khi có ĐỦ hai vế và nguồn không phải mô phỏng.
   *
   * `meetsForecastTarget` trả `null` cho bản mock, và `null` ở đây nghĩa là chưa
   * kết luận được — giao diện ghi "chưa đo được", không ghi "Đạt". Một bản mô
   * phỏng không đủ tư cách tuyên bố đạt chỉ tiêu nghiệm thu 3%.
   */
  const met = meetsForecastTarget(
    data.totals.forecastError,
    data.forecastTargetPct,
    data.freshness.status,
  );

  return (
    <>
      <DataFreshnessBar freshness={data.freshness} />

      <div className={showOfficialReference ? "dbudget-summary-split" : undefined}>
        <KpiStrip columns={6} label={`Dự toán mô phỏng · lũy kế · ${data.meta.scopeLabel} · ${data.meta.periodLabel}`}>
          <Kpi label="Thực hiện lũy kế" note={<>{data.rows.length} đơn vị có số</>}>
            <Money value={data.totals.actual} scale={unit} />
          </Kpi>
          <Kpi label="Dự toán được giao">
            <Money value={data.totals.plan} scale={unit} />
          </Kpi>
          <Kpi
            label="Tỷ lệ hoàn thành"
            tone={data.totals.completionRate !== null && data.totals.completionRate >= 100 ? "pos" : undefined}
          >
            {pct(data.totals.completionRate)}
          </Kpi>
          <Kpi
            label={data.totals.remaining >= 0 ? "Số còn phải thu" : "Đã vượt dự toán"}
            note="Dự toán trừ thực hiện"
          >
            <Money value={Math.abs(data.totals.remaining)} scale={unit} />
          </Kpi>
          <Kpi label="Dự báo cuối kỳ" note="Số mô phỏng, chưa phải dự báo nghiệp vụ">
            <Money value={data.totals.forecast} scale={unit} />
          </Kpi>
          <Kpi
            label="Sai số dự báo"
            note={
              met === null
                ? `Mục tiêu ≤ ${data.forecastTargetPct}% — chưa kết luận được trên số mô phỏng`
                : `Mục tiêu ≤ ${data.forecastTargetPct}%`
            }
          >
            {pct(data.totals.forecastError)}
          </Kpi>
        </KpiStrip>
        {showOfficialReference && <OfficialBudgetSnapshot variant="summary" />}
      </div>

      {showOfficialReference && <OfficialBudgetSnapshot variant="details" />}

      <Card
        title={data.viewBy === "location" ? "Tiến độ dự toán theo phường, xã" : "Tiến độ dự toán theo khoản thu"}
        /* "124 trên 124" không nói gì; chỉ khi đang lọc thì tỷ lệ mới là tin. */
        subtitle={
          rows.length === data.rows.length
            ? "Chọn một dòng để xem thứ cấu thành"
            : `${rows.length} trên ${data.rows.length} dòng · chọn một dòng để xem thứ cấu thành`
        }
        unit={unit}
        actions={
          <ReportExportButton
            request={{
              fileName:
                data.viewBy === "location"
                  ? "thuc-hien-du-toan-theo-phuong-xa"
                  : "thuc-hien-du-toan-theo-khoan-thu",
              // Xuất TOÀN BỘ tập, không phải phần đang lọc trên màn hình.
              rows: () => data.rows,
              meta: {
                periodLabel: data.meta.periodLabel,
                scopeLabel: data.meta.scopeLabel,
                unit: "đồng",
                freshness: data.freshness,
              },
              columns: [
                { header: data.viewBy === "location" ? "Phường, xã" : "Khoản thu", value: (r: BudgetProgressRow) => r.name },
                { header: "Dự toán (đồng)", value: (r: BudgetProgressRow) => r.plan },
                { header: "Thực hiện (đồng)", value: (r: BudgetProgressRow) => r.actual },
                { header: "Tỷ lệ hoàn thành (%)", value: (r: BudgetProgressRow) => r.completionRate },
                { header: "Còn thiếu hoặc vượt (đồng)", value: (r: BudgetProgressRow) => r.remaining },
                { header: "Cùng kỳ (đồng)", value: (r: BudgetProgressRow) => r.previous },
                { header: "Dự báo (đồng)", value: (r: BudgetProgressRow) => r.forecast },
                { header: "Sai số dự báo (%)", value: (r: BudgetProgressRow) => r.forecastError },
                { header: "Trạng thái", value: (r: BudgetProgressRow) => BUDGET_STATUS_LABEL[r.status] },
              ],
            }}
          />
        }
      >
        <BudgetProgressTable rows={rows} breakdown={data.breakdown} viewBy={data.viewBy} unit={unit} />
      </Card>

      <Card
        title="Thực hiện và dự báo theo tháng"
        subtitle="Thực hiện, dự toán và dự báo trên cùng một thang"
        unit={unit}
      >
        <ForecastChart points={data.trend} unit={unit} />
      </Card>

    </>
  );
}
