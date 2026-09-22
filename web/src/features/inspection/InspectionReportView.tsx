import { useMemo, useState } from "react";
import { useInspection } from "@/data/hooks";
import { useDashboardState } from "@/state/DashboardState";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { Card, Money, ResourceView, moneyScale, pct } from "@/components/primitives";
import { DataFreshnessBar } from "@/components/DataFreshnessBar";
import { ReportExportButton } from "@/components/ReportExportButton";
import {
  INSPECTION_STATUS_LABEL,
  POLICY_REVIEW_LABEL,
  type InspectionCycle,
  type InspectionData,
  type InspectionStatus,
  type InspectionUnitRow,
} from "@/domain/workspaces";
import { InspectionSummary } from "./InspectionSummary";
import { InspectionReportTable } from "./InspectionReportTable";
import { revealSection } from "@/components/sectionNavigation";
import { useNarrow } from "@/components/useNarrow";

const CYCLES: { id: InspectionCycle; label: string }[] = [
  { id: "week", label: "Theo tuần" },
  { id: "month", label: "Theo tháng" },
];

export function InspectionReportView() {
  const { filters } = useDashboardState();
  const [cycle, setCycle] = useState<InspectionCycle>("month");
  const [status, setStatus] = useState<InspectionStatus>("all");
  const { resource, retry, pending } = useInspection(filters, cycle);

  return (
    <>
      <div className="dlocalbar">
        <div className="dfield">
          <span>Chu kỳ báo cáo</span>
          <div className="dseg" role="group" aria-label="Chu kỳ báo cáo kiểm tra">
            {CYCLES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={cycle === c.id ? "is-active" : undefined}
                aria-pressed={cycle === c.id}
                onClick={() => setCycle(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <label className="dfield">
          <span>Trạng thái</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as InspectionStatus)}>
            {(Object.keys(INSPECTION_STATUS_LABEL) as InspectionStatus[]).map((s) => (
              <option key={s} value={s}>
                {INSPECTION_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ResourceView resource={resource} retry={retry} minHeight={420} pending={pending}>
        {(data) => <InspectionBody data={data} status={status} />}
      </ResourceView>
    </>
  );
}

function InspectionBody({ data, status }: { data: InspectionData; status: InspectionStatus }) {
  const narrow = useNarrow();
  const units = useMemo(
    () => (status === "all" ? data.units : data.units.filter((u) => u.status === status)),
    [data.units, status],
  );
  const unit = useMemo(
    () => moneyScale([data.summary.processedAmount, data.summary.paidAmount]),
    [data.summary],
  );
  const completionRate =
    data.summary.totalCases === 0
      ? null
      : (data.summary.completedCases / data.summary.totalCases) * 100;
  const paidRate =
    data.summary.processedAmount === 0
      ? null
      : (data.summary.paidAmount / data.summary.processedAmount) * 100;

  return (
    <>
      <DataFreshnessBar freshness={data.freshness} />

      <KpiStrip columns={4} label={`Kiểm tra · ${data.meta.scopeLabel} · ${data.meta.periodLabel}`}>
        <Kpi label="Tổng số cuộc kiểm tra" onActivate={narrow ? () => revealSection("inspection-results") : undefined} controls="inspection-results">{data.summary.totalCases}</Kpi>
        <Kpi label="Đã hoàn thành" note={`${pct(completionRate)} tổng số cuộc`} onActivate={narrow ? () => revealSection("inspection-results") : undefined} controls="inspection-results">
          {data.summary.completedCases}
        </Kpi>
        {/* Tên trung tính có chủ ý. Biên bản họp ghi "tiền chi thu" và chưa ai
            xác nhận nó có phải "tiền truy thu" hay không — đặt tên theo phỏng
            đoán rồi dựng số theo tên đó là cách nhanh nhất để báo cáo sai nghĩa. */}
        <Kpi label="Số tiền xử lý qua kiểm tra" note="Tên chỉ tiêu chờ cơ quan thuế xác nhận" onActivate={narrow ? () => revealSection("inspection-results") : undefined} controls="inspection-results">
          <Money value={data.summary.processedAmount} scale={unit} />
        </Kpi>
        <Kpi label="Số tiền đã nộp" note={`${pct(paidRate)} số tiền xử lý`} onActivate={narrow ? () => revealSection("inspection-results") : undefined} controls="inspection-results">
          <Money value={data.summary.paidAmount} scale={unit} />
        </Kpi>
      </KpiStrip>

      <div className="dreport-split dinspection-split">
        <div className="dinspection-column">
          <div className="dinspection-trend">
            <Card
              title={data.cycle === "week" ? "Diễn biến theo tuần" : "Diễn biến theo tháng"}
              subtitle="Số cuộc hoàn thành và số tiền xử lý qua từng kỳ"
              unit={unit}
            >
              <InspectionSummary points={data.trend} unit={unit} />
            </Card>
          </div>

        </div>

        <div className="dinspection-column">
          <div className="dinspection-results dsection-target" id="inspection-results" tabIndex={-1}>
            <Card
              title="Kết quả theo đơn vị"
              subtitle={
                units.length === data.units.length ? undefined : `${units.length} trên ${data.units.length} đơn vị`
              }
              unit={unit}
              actions={
                <ReportExportButton
                  request={{
                    title: "Kết quả kiểm tra theo đơn vị",
                    fileName: `ket-qua-kiem-tra-theo-${data.cycle === "week" ? "tuan" : "thang"}`,
                    rows: () => data.units,
                    meta: {
                      periodLabel: data.meta.periodLabel,
                      scopeLabel: data.meta.scopeLabel,
                      unit: "đồng",
                      freshness: data.freshness,
                    },
                    columns: [
                      { header: "Đơn vị", value: (r: InspectionUnitRow) => r.name },
                      { header: "Số cuộc", value: (r: InspectionUnitRow) => r.totalCases, format: "count" },
                      { header: "Đã hoàn thành", value: (r: InspectionUnitRow) => r.completedCases, format: "count" },
                      { header: "Tỷ lệ hoàn thành (%)", value: (r: InspectionUnitRow) => r.completionRate, format: "percent" },
                      { header: "Số tiền xử lý (đồng)", value: (r: InspectionUnitRow) => r.processedAmount, format: "money" },
                      { header: "Số đã nộp (đồng)", value: (r: InspectionUnitRow) => r.paidAmount, format: "money" },
                      { header: "Tỷ lệ đã nộp (%)", value: (r: InspectionUnitRow) => r.paidRate, format: "percent" },
                    ],
                  }}
                />
              }
            >
              <InspectionReportTable units={units} unit={unit} />
            </Card>
          </div>

          <div className="dinspection-policy">
            <Card
              title="Biến động chính sách"
              subtitle="Nội dung mô phỏng · chưa gắn với văn bản pháp luật cụ thể"
            >
              <div className="dtable-wrap">
                <table className="dtable is-compact dinspection-mini-table">
                  <caption className="sr-only">Chính sách cần theo dõi ảnh hưởng tới số thu</caption>
                  <thead>
                    <tr>
                      <th scope="col">Chính sách</th>
                      <th scope="col" className="dcol-pct">Hiệu lực từ</th>
                      <th scope="col" className="dcol-meta">Phạm vi ảnh hưởng</th>
                      <th scope="col" className="dcol-status">Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.policyChanges.map((p) => (
                      <tr key={p.id}>
                        <th scope="row">{p.name}</th>
                        <td data-label="Hiệu lực từ">
                          {new Date(p.effectiveFrom).toLocaleDateString("vi-VN")}
                        </td>
                        <td data-label="Phạm vi ảnh hưởng">{p.scope}</td>
                        <td data-label="Đánh giá">
                          <span className={p.reviewStatus === "assessed" ? "dtag" : "dtag is-review"}>
                            {POLICY_REVIEW_LABEL[p.reviewStatus]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {data.attention.length > 0 && (
            <div className="dinspection-attention">
              <Card title="Cần chú ý" subtitle="Chậm tiến độ hoặc số đã nộp thấp">
                <ul className="dattention">
                  {data.attention.map((a) => (
                    <li key={a.id}>
                      <span className={a.tone === "critical" ? "dtag is-review" : "dtag"}>{a.unit}</span>
                      {a.reason}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
