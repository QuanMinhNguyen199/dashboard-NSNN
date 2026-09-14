import { useMemo, useState } from "react";
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
  Segmented,
  inScale,
  moneyScale,
  pct,
} from "@/components/primitives";

const collator = new Intl.Collator("vi");
const fold = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

/**
 * Danh sách và bản đồ dùng CHUNG một `selected-location` state trong URL, nên
 * bấm ở đâu cũng cho cùng kết quả. Bảng xếp hạng chỉ chứa 126 phường/xã trong
 * danh mục — dòng tổng thành phố và dòng tổng Kho bạc không nằm trong đó.
 */
export function LocationDetailTab() {
  const { filters, location, selectLocation } = useDashboardState();
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"high" | "low">("high");
  const { resource, retry } = useLocationDetail(filters, location);

  const ranked = useMemo(() => {
    const rows = LOCATIONS.map((item) => ({
      ...item,
      amount: sumOf(filters, { locationIds: [item.id] }),
    }));
    const withData = rows.filter((row) => row.amount !== null);
    withData.sort((a, b) =>
      order === "high" ? (b.amount ?? 0) - (a.amount ?? 0) : (a.amount ?? 0) - (b.amount ?? 0),
    );
    const missing = rows.filter((row) => row.amount === null).sort((a, b) => collator.compare(a.name, b.name));
    return [...withData, ...missing];
  }, [filters, order]);

  // 126 dòng phải cùng một đơn vị, nếu không thì không so sánh được bằng mắt —
  // đó là việc duy nhất của một danh sách xếp hạng.
  const listUnit = useMemo(() => moneyScale(ranked.map((row) => row.amount)), [ranked]);

  const visible = useMemo(() => {
    const needle = fold(query.trim());
    return needle ? ranked.filter((row) => fold(row.name).includes(needle)) : ranked;
  }, [ranked, query]);

  const mapRows = useMemo(
    () =>
      ranked
        .filter((row) => row.amount !== null)
        .map((row) => ({ slug: row.slug, id: row.id, name: row.name, amount: row.amount as number })),
    [ranked],
  );

  /** Điều hướng bàn phím trong danh sách: mũi tên lên/xuống, Home/End. */
  const onListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : Math.min(Math.max(index + (event.key === "ArrowDown" ? 1 : -1), 0), buttons.length - 1);
    buttons[next]?.focus();
  };

  return (
    <div className="dsplit">
      <Card
        title="Danh sách phường, xã"
        subtitle={`${visible.length}/${LOCATIONS.length} địa bàn`}
        unit={listUnit}
        className="dsplit-list"
        actions={
          <div className="dlist-tools">
            <label className="dsearch">
              <span className="sr-only">Tìm phường, xã</span>
              <input
                type="search"
                value={query}
                placeholder="Tìm phường, xã…"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            {/* Nút bật tắt cũ ghi trạng thái ĐANG dùng, nên không rõ bấm vào
                thì thành gì. Dùng đúng nhóm chọn như thẻ "Top địa bàn". */}
            <Segmented
              label="Thứ tự danh sách"
              value={order}
              options={[
                { value: "high" as const, label: "Cao nhất" },
                { value: "low" as const, label: "Thấp nhất" },
              ]}
              onChange={setOrder}
            />
          </div>
        }
      >
        <ul className="dlist" onKeyDown={onListKeyDown}>
          {visible.map((row, index) => (
            <li key={row.id}>
              <button
                type="button"
                className={row.id === location ? "is-selected" : undefined}
                aria-current={row.id === location ? "true" : undefined}
                onClick={() => selectLocation(row.id)}
              >
                <span className="dlist-rank">{row.amount === null ? "—" : index + 1}</span>
                <span className="dlist-name">{row.name}</span>
                <span className="dlist-amount">
                  {row.amount === null ? "chưa có" : inScale(row.amount, listUnit)}
                </span>
              </button>
            </li>
          ))}
          {visible.length === 0 && <li className="dempty">Không có phường, xã nào khớp “{query}”.</li>}
        </ul>
      </Card>

      <div className="dsplit-main">
        <LocationMap rows={mapRows} selectedId={location} onSelect={selectLocation} />

        <ResourceView resource={resource} retry={retry} minHeight={220}>
          {(data) => <LocationBody data={data} />}
        </ResourceView>
      </div>
    </div>
  );
}

function LocationBody({ data }: { data: LocationDetailData }) {
  const { filters, dispatchIntent } = useDashboardState();

  return (
    <>
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
        <Kpi label="Mã địa bàn" code note={data.meta.periodLabel}>
          {data.location.id}
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
