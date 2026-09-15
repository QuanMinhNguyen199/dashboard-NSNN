import { useMemo } from "react";
import { LOCATIONS } from "@/domain/catalog";
import { sumOf } from "@/data/mock/observations";
import { useLocationDetail } from "@/data/hooks";
import type { LocationDetailData } from "@/domain/types";
import { useDashboardState } from "@/state/DashboardState";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { LocationMap } from "@/features/location-detail/LocationMap";
import { DonutChart, TrendChart } from "@/components/charts";
import {
  Bars,
  Card,
  Change,
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
  const { filters, location, selectLocation } = useDashboardState();
  const { resource, retry } = useLocationDetail(filters, location);

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

  return (
    // Bản đồ nằm NGOÀI `ResourceView`: khi chưa chọn địa bàn nào thì phần bên
    // trái là trạng thái chờ, và bản đồ lúc đó là lối chọn duy nhất còn lại —
    // để nó biến mất cùng dữ liệu là khoá luôn đường vào.
    <div className="dsplit">
      <div className="dsplit-info">
        <ResourceView resource={resource} retry={retry} minHeight={220}>
          {(data) => <LocationBody data={data} />}
        </ResourceView>
      </div>
      <LocationMap rows={mapRows} selectedId={location} onSelect={selectLocation} />
    </div>
  );
}

function LocationBody({ data }: { data: LocationDetailData }) {
  const { filters, dispatchIntent } = useDashboardState();

  return (
    <>
      {/* Tên địa bàn phải nhìn thấy được. Trước đây nó chỉ tồn tại trong
          `aria-label` của dải KPI, nên người dùng nhìn được nhận ÍT thông tin
          hơn người dùng trình đọc màn hình — và ở khổ hẹp, dòng đang chọn trong
          danh sách đã cuộn khuất nên không còn chỗ nào đối chiếu. */}
      <h2 className="dsubject">{data.location.name}</h2>

      <KpiStrip label={`Chỉ số ${data.location.name}`}>
        <Kpi
          label="Thu trong kỳ"
          note={<><Change current={data.kpiPeriod.amount} previous={data.kpiPeriod.previous} label="" /> so cùng kỳ</>}
        >
          <Money value={data.kpiPeriod.amount} />
        </Kpi>
        <Kpi label="Xếp hạng" note="Trong các phường, xã có số liệu">
          {data.rank ? data.rank.position : "—"}
          {data.rank && <em>/{data.rank.total}</em>}
        </Kpi>
        <Kpi label="Đóng góp vào thành phố" note="Trên tổng thu toàn thành phố cùng kỳ">
          {pct(data.shareOfCity)}
        </Kpi>
        <Kpi
          label="Lũy kế từ đầu năm"
          note={<><Change current={data.kpiYtd.amount} previous={data.kpiYtd.previous} label="" /> so cùng kỳ</>}
        >
          <Money value={data.kpiYtd.amount} />
        </Kpi>
      </KpiStrip>

      <div className="dstack">
        {/* Cơ cấu của một địa bàn chỉ còn các nguồn phân bổ được xuống địa bàn.
            Donut diễn đạt tỷ trọng rõ hơn hai thanh bị kéo cao theo biểu đồ bên cạnh. */}
        <div className="dstack-row is-chart-pair">
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

        <Card
          title="Khoản thu chính"
          subtitle="8 khoản lớn nhất trên địa bàn"
          unit={moneyScale(data.topItems.map((row) => row.amount))}
        >
          <Bars rows={data.topItems} />
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
