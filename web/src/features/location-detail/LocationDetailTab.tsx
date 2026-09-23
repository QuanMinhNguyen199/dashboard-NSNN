import { useMemo, type ReactNode } from "react";
import { LOCATIONS } from "@/domain/catalog";
import { TAX_OFFICE_ENTITIES, taxOfficeLocationIds } from "@/domain/tms";
import { sumOf } from "@/data/mock/observations";
import { useLocationDetail } from "@/data/hooks";
import type { LocationDetailData } from "@/domain/types";
import { useDashboardState } from "@/state/DashboardState";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { TaxOfficeDetail } from "./TaxOfficeDetail";
import { LocationMap } from "@/features/location-detail/LocationMap";
import { DonutChart, TrendChart } from "@/components/charts";
import {
  Bars,
  Card,
  Change,
  columnLabel,
  inScale,
  Money,
  ResourceView,
  moneyScale,
  pct,
} from "@/components/primitives";

/**
 * Danh sách và bản đồ dùng CHUNG một `selected-location` state trong URL, nên
 * bấm ở đâu cũng cho cùng kết quả. Bảng xếp hạng chỉ chứa 126 phường/xã trong
 * danh mục — dòng tổng thành phố và dòng tổng Kho bạc không nằm trong đó.
 */
export function LocationDetailTab() {
  const { filters, location, taxOfficeCode, selectLocation } = useDashboardState();
  const { resource, retry, pending } = useLocationDetail(filters, location);

  // Bản đồ nhiệt tô theo số tiền, không theo thứ hạng — nên chỉ cần số, không
  // cần sắp xếp. Việc chọn địa bàn đã chuyển sang ô lọc "Chi tiết địa bàn" ở
  // thanh lọc chung, nên danh sách 126 dòng kèm tìm kiếm không còn ở đây nữa.
  const mapRows = useMemo(
    () =>
      LOCATIONS.map((item) => ({ ...item, amount: sumOf(filters, { locationIds: [item.id] }) }))
        .filter((row): row is typeof row & { amount: number } => row.amount !== null)
        .map((row) => ({ slug: row.slug, id: row.id, name: row.name, amount: row.amount })),
    [filters],
  );

  // View cơ quan thuế đã có danh sách địa bàn được phân công. Giữ thêm bản đồ
  // toàn thành phố ở cạnh đó tạo ra hai cách diễn giải phạm vi và chiếm nửa
  // chiều rộng, nên màn CQT dùng trọn khung cho đúng nội dung của nó.
  if (taxOfficeCode) return <TaxOfficeDetail code={taxOfficeCode} />;

  // Khi chưa chọn phường/xã, bản đồ là lối vào trực quan thay cho một trang
  // trống. Sau khi chọn, nó đi cùng phần tóm tắt; các khối phân tích nằm dưới
  // và dùng toàn bộ chiều rộng để bảng không bị ép.
  if (!location)
    return <LocationMap rows={mapRows} selectedId={null} onSelect={selectLocation} />;

  return (
    <ResourceView resource={resource} retry={retry} minHeight={220} pending={pending}>
      {(data) => (
        <LocationBody
          data={data}
          map={<LocationMap rows={mapRows} selectedId={location} onSelect={selectLocation} />}
        />
      )}
    </ResourceView>
  );
}

function LocationBody({ data, map }: { data: LocationDetailData; map: ReactNode }) {
  const { filters, dispatchIntent } = useDashboardState();
  const kpiScale = moneyScale([
    data.kpiPeriod.amount,
    data.kpiYtd.amount,
    data.estimate?.annual,
  ]);
  const taxpayerScale = moneyScale(data.topTaxpayers.rows.map((row) => row.amount));
  const managingOffices = TAX_OFFICE_ENTITIES.filter((office) =>
    taxOfficeLocationIds(office.id).includes(data.location.id),
  );
  const managingOfficeLabel = managingOffices.length
    ? managingOffices.map((office) => office.name).join(", ")
    : "Chưa có đơn vị thuế phân công";
  const subjectContent = (
    <>
      {data.location.name}
      <small className="dsubject-meta">
        <span><i>Mã địa bàn</i><b>{data.location.id}</b></span>
        <span><i>Cơ quan thuế phụ trách</i><b>{managingOfficeLabel}</b></span>
      </small>
    </>
  );

  return (
    <>
      {/* Tên địa bàn phải nhìn thấy được. Trước đây nó chỉ tồn tại trong
          `aria-label` của dải KPI, nên người dùng nhìn được nhận ÍT thông tin
          hơn người dùng trình đọc màn hình — và ở khổ hẹp, dòng đang chọn trong
          danh sách đã cuộn khuất nên không còn chỗ nào đối chiếu. */}
      {/* Iframe/mobile đưa ngữ cảnh đã chọn lên trước bản đồ. Nếu để trong cột
          phân tích như desktop, bản đồ cao gần một màn hình sẽ che mất chính
          thông tin vừa chuyển ra khỏi dropdown Phạm vi. */}
      <h2 className="dsubject dsubject-compact">{subjectContent}</h2>
      <div className="dlocation-overview">
        <div className="dlocation-overview-main">
          <h2 className="dsubject dsubject-desktop">{subjectContent}</h2>

          <KpiStrip label={`Chỉ số ${data.location.name}`}>
            <Kpi
              label="Thu trong kỳ"
              note={<><Change current={data.kpiPeriod.amount} previous={data.kpiPeriod.previous} label="" /> so cùng kỳ</>}
            >
              <Money value={data.kpiPeriod.amount} scale={kpiScale} />
            </Kpi>
            <Kpi
              label="Lũy kế từ đầu năm"
              note={<><Change current={data.kpiYtd.amount} previous={data.kpiYtd.previous} label="" /> so cùng kỳ</>}
            >
              <Money value={data.kpiYtd.amount} scale={kpiScale} />
            </Kpi>
            <Kpi
              label={`Dự toán năm ${filters.year}`}
              note={data.estimate?.origin === "mock" ? "Số mô phỏng" : undefined}
            >
              <Money value={data.estimate?.annual} scale={kpiScale} />
            </Kpi>
            {/* Mẫu số là số mô phỏng thì TỶ LỆ cũng là số mô phỏng. Ô bên cạnh có
                nhãn rồi không thay được cho ô này: "% hoàn thành dự toán" là câu dễ
                bị tách ra khỏi ngữ cảnh và trích đi nhất. */}
            <Kpi
              label="Hoàn thành dự toán"
              note={
                data.estimate?.origin === "mock"
                  ? "Lũy kế trên dự toán mô phỏng"
                  : "Lũy kế trên dự toán"
              }
            >
              {data.estimate?.progress == null ? "—" : pct(data.estimate.progress * 100)}
            </Kpi>
          </KpiStrip>

          <Card title="Xu hướng theo tháng" subtitle="So với cùng kỳ năm trước">
            <TrendChart points={data.trend} year={filters.year} height={220} />
          </Card>

          <Card
            title="Cơ cấu nguồn thu"
            subtitle="Chỉ các nguồn phân bổ được theo địa bàn"
          >
            <DonutChart rows={data.sources} centerLabel="Nguồn thu" />
          </Card>
        </div>
        {map}
      </div>

      <div className="dstack">
        <div className="dstack-row">
          <Card
            title="Sắc thuế địa bàn phụ trách thu"
            subtitle="Doanh nghiệp, đất đai và các khoản thu khác"
            unit={moneyScale(data.taxGroups.map((row) => row.amount))}
          >
            <Bars rows={data.taxGroups} />
          </Card>
          <Card
            title="Số thu phát sinh theo cơ quan thu"
            subtitle="Phân biệt đơn vị quản lý người nộp thuế và đơn vị phụ trách địa bàn"
            unit={moneyScale(data.collectedBy.rows.map((row) => row.amount))}
            actions={data.collectedBy.origin === "mock" ? <span className="dtag is-review">Mô phỏng</span> : undefined}
          >
            <Bars rows={data.collectedBy.rows} />
          </Card>
        </div>

        {/* Nhãn "số mô phỏng" ở CẢ HAI nhánh của phụ đề. Bản trước bỏ nhãn khi
            đang lọc một ngành — lúc đó số vẫn mô phỏng y như cũ, chỉ là câu mang
            nhãn đã bị viết đè mất. */}
        <Card
          title="Cơ cấu ngành trên địa bàn"
          subtitle={filters.industry ? "Đang giới hạn theo ngành đã chọn · số mô phỏng" : "Phân nhóm ngành nghề từ dữ liệu TMS · số mô phỏng"}
          unit={moneyScale(data.industries.map((row) => row.amount))}
        >
          <Bars
            rows={data.industries}
            emptyText="Đã chọn một ngành; bỏ bộ lọc ngành nghề để xem toàn bộ cơ cấu."
          />
        </Card>

        <Card
          title="Người nộp thuế lớn trên địa bàn"
          subtitle={`Top ${data.topTaxpayers.rows.length} theo số thu`}
          actions={data.topTaxpayers.origin === "mock" ? <span className="dtag is-review">Mô phỏng</span> : undefined}
        >
          <div className="dtable-wrap">
            <table className="dtable dlocation-taxpayers">
              <thead>
                <tr>
                  <th scope="col">Người nộp thuế</th>
                  <th scope="col">Ngành nghề</th>
                  <th scope="col" className="is-num dcol-money">{columnLabel("Số thu", taxpayerScale)}</th>
                  <th scope="col" className="is-num dcol-pct">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody>
                {data.topTaxpayers.rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.name}</th>
                    <td>{row.industry}</td>
                    <td className="is-num">{inScale(row.amount, taxpayerScale)}</td>
                    <td className="is-num">{pct(row.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="dactions">
          <button
            type="button"
            className="dbtn dbtn-primary"
            onClick={() =>
              dispatchIntent({
                type: "OPEN_ADVANCED_COMPARISON",
                mode: "location",
                entityIds: [data.location.id, LOCATIONS.find((l) => l.id !== data.location.id)!.id],
              })
            }
          >
            So sánh với địa bàn khác
          </button>
        </div>
      </div>
    </>
  );
}
