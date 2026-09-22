import { useReportSummary } from "@/data/hooks";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { Money, ResourceView, moneyScale, pct } from "@/components/primitives";
import { DataFreshnessBar } from "@/components/DataFreshnessBar";
import { DIMENSION_BY_ID, type ReportDimension } from "@/domain/report";
import type { DashboardFilters } from "@/domain/types";
import type { ReportSummaryData } from "@/domain/workspaces";

/**
 * Lớp tóm tắt đặt TRÊN bảng chéo 113 chỉ tiêu.
 *
 * Bảng chéo trả lời được mọi câu hỏi nhưng bắt người đọc tự quét hàng trăm ô.
 * Lớp này trả lời trước bốn câu người ta hỏi nhiều nhất: tổng bao nhiêu, ai lớn
 * nhất, ai tăng ai giảm, và phần chưa xác định là bao nhiêu.
 *
 * Số ở đây đến từ **một lời gọi riêng**, không cộng lại từ các ô đang hiện.
 * Bảng phân trang cột: cộng ở frontend thì "tổng thu" đổi mỗi lần lật trang,
 * tức là con số nói về khung nhìn chứ không nói về kỳ báo cáo.
 */
export function ReportSummary({
  filters,
  dimension,
  onOpenTable,
}: {
  filters: DashboardFilters;
  dimension: ReportDimension;
  onOpenTable?: () => void;
}) {
  const { resource, retry, pending } = useReportSummary(filters, dimension);
  return (
    <ResourceView resource={resource} retry={retry} minHeight={140} pending={pending}>
      {(data) => <SummaryBody data={data} onOpenTable={onOpenTable} />}
    </ResourceView>
  );
}

function SummaryBody({ data, onOpenTable }: { data: ReportSummaryData; onOpenTable?: () => void }) {
  const unit = moneyScale([data.total, ...data.top.map((t) => t.amount)]);
  const name = DIMENSION_BY_ID[data.dimension].name;
  const top = data.top[0] ?? null;

  return (
    <>
      <DataFreshnessBar freshness={data.freshness} />

      <KpiStrip columns={4} label={`Tóm tắt · ${name} · ${data.meta.periodLabel}`}>
        <Kpi label="Tổng thu trong phạm vi" onActivate={onOpenTable} controls="nsnn-report-table">
          <Money value={data.total} scale={unit} />
        </Kpi>
        <Kpi label={`Số ${name.toLowerCase()} có dữ liệu`} onActivate={onOpenTable} controls="nsnn-report-table">{data.groupCount}</Kpi>
        <Kpi label="Đóng góp lớn nhất" note={top?.name} onActivate={onOpenTable} controls="nsnn-report-table">
          {top ? <Money value={top.amount} scale={unit} /> : null}
        </Kpi>
        <Kpi
          label="Đã xác định được nhóm"
          note={<><Money value={data.unclassifiedAmount} scale={unit} /> chưa xác định, vẫn nằm trong tổng</>}
          onActivate={onOpenTable}
          controls="nsnn-report-table"
        >
          {pct(data.classifiedRate)}
        </Kpi>
      </KpiStrip>
    </>
  );
}
