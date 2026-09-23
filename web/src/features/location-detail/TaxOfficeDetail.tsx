import { useMemo } from "react";
import { useTmsBreakdown } from "@/data/hooks";
import { useDashboardState } from "@/state/DashboardState";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { TrendChart } from "@/components/charts";
import { Card, Change, Money, ResourceView, moneyScale, pct } from "@/components/primitives";
import { taxOfficeCodeLabel, taxOfficeLocationIds, taxOfficeNameOf } from "@/domain/tms";
import type { TmsBreakdownData } from "@/domain/types";
import { TaxOfficeAssignedAreas } from "./TaxOfficeAssignedAreas";

/**
 * Trang chi tiết của MỘT cơ quan thuế.
 *
 * Cùng tab với chi tiết phường/xã, đổi mặt theo ô `Phạm vi`: chọn một phường thì
 * ra view địa bàn, chọn một đơn vị thuế thì ra view này. Hai view trả lời hai
 * câu hỏi khác nhau trên cùng một phạm vi — "địa bàn này thu được bao nhiêu" và
 * "đơn vị này quản được bao nhiêu" — nên chúng không gộp làm một bảng được.
 */
export function TaxOfficeDetail({ code }: { code: string }) {
  const { filters } = useDashboardState();
  const { resource, retry, pending } = useTmsBreakdown(filters, "all", null, code);
  const ten = taxOfficeNameOf(code) ?? code;

  return (
    <ResourceView resource={resource} retry={retry} minHeight={320} pending={pending}>
      {(data) => <Than data={data} code={code} ten={ten} year={filters.year} />}
    </ResourceView>
  );
}

function Than({
  data,
  code,
  ten,
  year,
}: {
  data: TmsBreakdownData;
  code: string;
  ten: string;
  year: number;
}) {
  const chiTiet = data.taxOfficeDetail;
  const locationCount = taxOfficeLocationIds(code).length;
  const scopeLabel = locationCount
    ? `${locationCount} phường/xã phụ trách`
    : "Quản lý theo đối tượng, không có phạm vi phường/xã cố định";
  // Hai ô tiền nằm cạnh nhau phải cùng thang và cùng số lẻ mới so được bằng mắt.
  const unit = useMemo(
    () => moneyScale([chiTiet?.kpiPeriod.amount ?? null, chiTiet?.kpiYtd.amount ?? null, chiTiet?.plan ?? null]),
    [chiTiet],
  );

  if (!chiTiet)
    return (
      <>
        <h2 className="dsubject">
          {ten}
          <small className="dsubject-meta">
            <span><i>Mã CQT</i><b>{taxOfficeCodeLabel(code)}</b></span>
            <span><i>Phạm vi quản lý</i><b>{scopeLabel}</b></span>
          </small>
        </h2>
        <p className="dempty">Kỳ đang chọn chưa có số liệu của đơn vị này.</p>
      </>
    );

  return (
    <>
      <h2 className="dsubject">
        {ten}
        <small className="dsubject-meta">
          <span><i>Mã CQT</i><b>{taxOfficeCodeLabel(code)}</b></span>
          <span><i>Phạm vi quản lý</i><b>{scopeLabel}</b></span>
        </small>
      </h2>

      <KpiStrip columns={4} label={`Chỉ số ${ten}`}>
        <Kpi
          label="Thu trong kỳ do đơn vị quản lý"
          note={
            <>
              <Change current={chiTiet.kpiPeriod.amount} previous={chiTiet.kpiPeriod.previous} label="" /> so cùng kỳ
            </>
          }
        >
          <Money value={chiTiet.kpiPeriod.amount} scale={unit} />
        </Kpi>
        <Kpi
          label="Lũy kế từ đầu năm"
          note={
            <>
              <Change current={chiTiet.kpiYtd.amount} previous={chiTiet.kpiYtd.previous} label="" /> so cùng kỳ
            </>
          }
        >
          <Money value={chiTiet.kpiYtd.amount} scale={unit} />
        </Kpi>
        {/* Dự toán giao cho từng cơ quan thuế CHƯA CÓ: chỉ có dự toán theo địa
            bàn. Ô này nói rõ điều đó ngay dưới con số, vì "% hoàn thành dự toán"
            là câu người đọc dễ trích dẫn nhất mà lại đang dựa trên một mẫu số
            chưa tồn tại. */}
        <Kpi
          label={`Dự toán năm ${year}`}
          note={
            chiTiet.planOrigin === "mock"
              ? "Chưa có số giao cho cơ quan thuế — đang dùng số mô phỏng"
              : undefined
          }
        >
          <Money value={chiTiet.plan} scale={unit} />
        </Kpi>
        {/* Mẫu số mô phỏng thì tỷ lệ cũng mô phỏng — nói ngay ở ô này chứ không
            nhờy ô bên cạnh nói hộ. */}
        <Kpi
          label="Hoàn thành dự toán"
          note={
            chiTiet.planOrigin === "mock" ? "Lũy kế trên dự toán mô phỏng" : "Lũy kế trên dự toán"
          }
        >
          {chiTiet.completionRate === null ? null : pct(chiTiet.completionRate)}
        </Kpi>
      </KpiStrip>

      <Card
        title="Xu hướng thu của đơn vị"
        subtitle="12 tháng, so với cùng kỳ năm trước"
      >
        <TrendChart points={chiTiet.trend} year={year} height={220} />
      </Card>

      {/* Không bọc trong `Card`: panel này đã mang tiêu đề "Địa bàn phụ trách"
          của chính nó, nên bọc thêm là hai lần cùng một dòng chữ chồng lên nhau. */}
      <TaxOfficeAssignedAreas data={data} selectedCode={code} />
    </>
  );
}
