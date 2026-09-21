import { useMemo, useState } from "react";
import { useEnterpriseManagement } from "@/data/hooks";
import { useDashboardState } from "@/state/DashboardState";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { Card, Money, ResourceView, moneyScale, pct } from "@/components/primitives";
import { DataFreshnessBar } from "@/components/DataFreshnessBar";
import { ReportExportButton } from "@/components/ReportExportButton";
import { DIMENSION_BY_ID } from "@/domain/report";
import type {
  EnterpriseGroupBy,
  EnterpriseGroupRow,
  EnterpriseManagementData,
} from "@/domain/workspaces";
import { IndustrySummary } from "./IndustrySummary";
import { EnterpriseTable } from "./EnterpriseTable";

const GROUPS: { id: EnterpriseGroupBy; label: string }[] = [
  { id: "industry", label: "Theo ngành nghề" },
  { id: "taxOffice", label: "Theo cơ quan thuế" },
  { id: "location", label: "Theo địa bàn" },
];

export function EnterpriseManagementView() {
  const { filters } = useDashboardState();
  const [groupBy, setGroupBy] = useState<EnterpriseGroupBy>("industry");
  const [selected, setSelected] = useState<string | null>(null);
  const { resource, retry, pending } = useEnterpriseManagement(filters, groupBy);

  return (
    <>
      <div className="dlocalbar">
        <div className="dfield">
          <span>Xem theo</span>
          <div className="dseg" role="group" aria-label="Chiều phân tích quản lý thu">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={groupBy === g.id ? "is-active" : undefined}
                aria-pressed={groupBy === g.id}
                onClick={() => {
                  setGroupBy(g.id);
                  // Đổi chiều thì nhóm đang mở không còn nghĩa: một mã ngành
                  // không phải một mã cơ quan thuế.
                  setSelected(null);
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResourceView resource={resource} retry={retry} minHeight={420} pending={pending}>
        {(data) => (
          <EnterpriseBody key={data.groupBy} data={data} selected={selected} onSelect={setSelected} />
        )}
      </ResourceView>
    </>
  );
}

function EnterpriseBody({
  data,
  selected,
  onSelect,
}: {
  data: EnterpriseManagementData;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [enterpriseQuery, setEnterpriseQuery] = useState("");
  const unit = useMemo(() => moneyScale(data.groups.map((g) => g.amount)), [data.groups]);
  const dimensionName = DIMENSION_BY_ID[data.groupBy].name;
  const top = useMemo(
    () => data.groups.find((g) => !g.unclassified) ?? null,
    [data.groups],
  );
  // Master–detail luôn có nội dung ở cột phải. Khi chưa chọn, lấy nhóm đầu tiên
  // có doanh nghiệp làm bản xem trước để không tạo một nửa màn hình trống.
  const activeGroup: EnterpriseGroupRow | null =
    (selected === null ? null : data.groups.find((g) => g.id === selected)) ??
    data.groups.find((g) => !g.unclassified && g.enterpriseCount > 0) ??
    null;

  return (
    <>
      <DataFreshnessBar
        freshness={data.freshness}
        note="Số doanh nghiệp lấy từ danh bạ tổng hợp; số thu và chi tiết đang mô phỏng"
      />

      <KpiStrip columns={4} label={`Quản lý thu · ${dimensionName} · ${data.meta.periodLabel}`}>
        <Kpi label="Số thu trong phạm vi">
          <Money value={data.totals.amount} scale={unit} />
        </Kpi>
        <Kpi label="Bản ghi danh bạ" note={`${data.totals.groupCount} nhóm ${dimensionName.toLowerCase()} có dữ liệu`}>
          {data.totals.directoryTotal?.toLocaleString("vi-VN")}
        </Kpi>
        <Kpi label="Đóng góp lớn nhất" note={top ? top.name : undefined}>
          {top ? <Money value={top.amount} scale={unit} /> : null}
        </Kpi>
        <Kpi
          label="Đã xác định được nhóm"
          note={
            <>
              Chưa xác định: <Money value={data.totals.unclassifiedAmount} scale={unit} />
            </>
          }
        >
          {pct(data.totals.classifiedRate)}
        </Kpi>
      </KpiStrip>

      <div className="dreport-split dreport-master-detail">
        <Card
          title={`Số thu theo ${dimensionName.toLowerCase()}`}
          subtitle="Chọn một nhóm để xem doanh nghiệp ở cột bên cạnh"
          unit={unit}
          actions={
            <ReportExportButton
              request={{
                title: `Số thu theo ${dimensionName.toLowerCase()}`,
                fileName: `thu-theo-${data.groupBy}`,
                rows: () => data.groups,
                meta: {
                  periodLabel: data.meta.periodLabel,
                  scopeLabel: data.meta.scopeLabel,
                  unit: "đồng",
                  freshness: data.freshness,
                },
                columns: [
                  { header: dimensionName, value: (r: EnterpriseGroupRow) => r.name },
                  { header: "Số thu (đồng)", value: (r: EnterpriseGroupRow) => r.amount, format: "money" },
                  { header: "Tỷ trọng (%)", value: (r: EnterpriseGroupRow) => r.share, format: "percent" },
                  { header: "Cùng kỳ (đồng)", value: (r: EnterpriseGroupRow) => r.previous, format: "money" },
                  { header: "Số doanh nghiệp", value: (r: EnterpriseGroupRow) => r.enterpriseCount, format: "count" },
                ],
              }}
            />
          }
        >
          <IndustrySummary
            groups={data.groups}
            unit={unit}
            totals={data.totals}
            selected={activeGroup?.id ?? null}
            onSelect={(id) => {
              setEnterpriseQuery("");
              onSelect(id);
            }}
            dimensionName={dimensionName}
          />
        </Card>

        {activeGroup && (
          <div
            key={activeGroup.id}
            className="dreport-detail"
            aria-live="polite"
            aria-label={`Chi tiết doanh nghiệp thuộc ${activeGroup.name}`}
          >
          <Card
            title={`Doanh nghiệp thuộc ${activeGroup.name}`}
            unit={unit}
            actions={
              <label className="dsearch dhead-search">
                <span className="sr-only">Tìm doanh nghiệp</span>
                <input
                  type="search"
                  placeholder="Tìm mã hoặc tên doanh nghiệp"
                  value={enterpriseQuery}
                  onChange={(e) => setEnterpriseQuery(e.target.value)}
                />
              </label>
            }
          >
            <EnterpriseTable
              rows={data.enterprises[activeGroup.id] ?? []}
              unit={unit}
              query={enterpriseQuery}
              groupName={activeGroup.name}
            />
          </Card>
          </div>
        )}
      </div>
    </>
  );
}
