import { useMemo, useState } from "react";
import { LOCATIONS } from "../dashboard/catalog";
import { sumOf } from "../dashboard/observations";
import { useLocationDetail } from "../dashboard/useResource";
import type { LocationDetailData } from "../dashboard/types";
import { useDashboardState } from "../state/DashboardState";
import { LocationMap } from "../ui/LocationMap";
import { TrendChart } from "../ui/charts";
import { Bars, Card, Change, CoverageNote, ResourceView, money, pct } from "../ui/primitives";

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
            <button
              type="button"
              className="dlink"
              onClick={() => setOrder((value) => (value === "high" ? "low" : "high"))}
            >
              {order === "high" ? "Cao nhất trước" : "Thấp nhất trước"}
            </button>
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
                  {row.amount === null ? "chưa có số liệu" : money(row.amount)}
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
          {(data, partial) => <LocationBody data={data} partial={partial} />}
        </ResourceView>
      </div>
    </div>
  );
}

function LocationBody({ data, partial }: { data: LocationDetailData; partial?: string }) {
  const { filters, dispatchIntent } = useDashboardState();

  return (
    <>
      <CoverageNote message={partial} />

      <section className="dkpis" aria-label={`Chỉ số ${data.location.name}`}>
        <div>
          <span>Thu trong kỳ</span>
          <strong>{money(data.kpiPeriod.amount)}</strong>
          <small>
            <Change current={data.kpiPeriod.amount} previous={data.kpiPeriod.previous} /> so cùng kỳ
          </small>
        </div>
        <div>
          <span>Xếp hạng</span>
          <strong>
            {data.rank ? data.rank.position : "—"}
            {data.rank && <em>/{data.rank.total}</em>}
          </strong>
          <small>Trong các phường, xã có số liệu</small>
        </div>
        <div>
          <span>Đóng góp vào thành phố</span>
          <strong>{pct(data.shareOfCity)}</strong>
          <small>Trên tổng thu toàn thành phố cùng kỳ</small>
        </div>
        <div>
          <span>Mã địa bàn</span>
          <strong className="is-code">{data.location.id}</strong>
          <small>{data.meta.periodLabel}</small>
        </div>
      </section>

      <div className="dstack">
        <Card title="Xu hướng theo tháng" subtitle="So với cùng kỳ năm trước">
          <TrendChart points={data.trend} year={filters.year} height={220} />
        </Card>

        <div className="dstack-row">
          <Card title="Cơ cấu nguồn thu" subtitle="Chỉ các nguồn phân bổ được theo địa bàn">
            <Bars
              rows={data.sources}
              total={data.sources.reduce((sum, row) => sum + row.amount, 0)}
              scale="share"
            />
          </Card>
          <Card title="Khoản thu chính" subtitle="Tám khoản lớn nhất trên địa bàn">
            <Bars rows={data.topItems} />
          </Card>
        </div>

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
