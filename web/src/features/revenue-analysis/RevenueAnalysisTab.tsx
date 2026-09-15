import { useEffect, useMemo, useState } from "react";
import { SOURCES, SOURCE_BY_CODE, type DomesticGroupId, type SourceCode } from "@/domain/catalog";
import { useRevenueAnalysis } from "@/data/hooks";
import type { AmountRow, RevenueAnalysisData, RevenueGroupRow } from "@/domain/types";
import { useDashboardState } from "@/state/DashboardState";
import { GridRows } from "@/components/Grid";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { DonutChart, TrendChart, WaterfallChart } from "@/components/charts";
import {
  Bars,
  Card,
  Change,
  Money,
  ResourceView,
  inScale,
  moneyScale,
  pct,
} from "@/components/primitives";

/** Sub-navigation của workspace phân tích thu. */
const SECTIONS: { id: SourceCode; label: string }[] = [
  { id: "domestic", label: "Thu nội địa không kể dầu thô" },
  { id: "import-export", label: "Thu xuất nhập khẩu" },
  { id: "other", label: "Thu khác" },
];

export function RevenueAnalysisTab() {
  const { filters, section, setSection } = useDashboardState();
  const scope = SECTIONS.some((s) => s.id === section) ? section : "domestic";
  const { resource, retry } = useRevenueAnalysis(filters, scope);

  // Deep-link cũ tới nguồn không còn nằm trong đặc tả được đưa về mục mặc định,
  // để URL và nội dung đang hiển thị không lệch nhau.
  useEffect(() => {
    if (section !== scope) setSection(scope);
  }, [section, scope, setSection]);

  return (
    <>
      <nav className="dsubnav" aria-label="Nhóm nguồn thu">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={scope === item.id ? "page" : undefined}
            className={scope === item.id ? "is-active" : undefined}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <ResourceView resource={resource} retry={retry} minHeight={420}>
        {(data) => <AnalysisBody data={data} />}
      </ResourceView>
    </>
  );
}

function AnalysisBody({ data }: { data: RevenueAnalysisData }) {
  const { filters, view, group, setView, setGroup, dispatchIntent } = useDashboardState();
  const source = SOURCE_BY_CODE[data.scope];
  const sourceLabel = data.scope === "domestic" ? source.name : source.shortName;
  const kpi = data.kpis.total;
  const selectedGroup = data.groups?.find((row) => row.id === group) ?? data.groups?.[0];

  return (
    <>
      <KpiStrip label={`Chỉ số ${sourceLabel}`} columns={3}>
        <Kpi
          label={`${sourceLabel} trong kỳ`}
          note={<><Change current={kpi.amount} previous={kpi.previous} label="" /> so cùng kỳ</>}
        >
          <Money value={kpi.amount} />
        </Kpi>
        <Kpi label="Tỷ trọng trên tổng thu" note="Trên cùng chỉ tiêu và cấp ngân sách đang lọc">
          {pct(data.kpis.share)}
        </Kpi>
        <Kpi
          label="Đóng góp vào biến động"
          tone={data.kpis.contribution >= 0 ? "pos" : "neg"}
          note="Phần chênh lệch do nhóm này tạo ra"
        >
          {data.kpis.contribution >= 0 ? "+" : "−"}
          <Money value={Math.abs(data.kpis.contribution)} />
        </Kpi>
      </KpiStrip>

      <GridRows
        rows={[
          [
            {
              id: "trend",
              span: 7,
              render: () => (
                <Card title={`Xu hướng ${sourceLabel.toLowerCase()}`} subtitle="12 tháng, so năm trước">
                  <TrendChart points={data.trend} year={filters.year} />
                </Card>
              ),
            },
            {
              id: "structure",
              span: 5,
              render: () => (
                <Card
                  title={data.groups ? "Cơ cấu 3 nhóm thu nội địa" : "Cơ cấu trong nhóm"}
                  subtitle={data.groups ? "Chọn một nhóm để xem các khoản cấu thành" : "Tỷ trọng trên tổng nhóm"}
                  unit={!data.groups ? moneyScale(data.breakdown.map((row) => row.amount)) : undefined}
                >
                  {data.groups ? (
                    <DomesticGroupStructure
                      groups={data.groups}
                      selected={selectedGroup}
                      onSelect={(id) => setGroup(id as DomesticGroupId)}
                    />
                  ) : (
                    <Bars
                      rows={[...data.breakdown].sort((a, b) => b.amount - a.amount).slice(0, 8)}
                      total={data.breakdown.reduce((sum, row) => sum + Math.abs(row.amount), 0)}
                      scale="share"
                    />
                  )}
                </Card>
              ),
            },
          ],
          [
            {
              id: "table",
              span: 8,
              // Bảng sáu cột: dưới 1280px cho chiếm trọn hàng thay vì cuộn ngang trong thẻ.
              wide: true,
              render: () => <BreakdownTable data={data} />,
            },
            {
              id: "locations",
              span: 4,
              wide: true,
              // Nguồn do trung ương quản lý không phân bổ theo địa bàn: widget bị
              // loại khỏi lưới thay vì hiện một bảng rỗng.
              hidden: data.byLocation.length === 0,
              render: () => (
                <Card title="Đóng góp theo địa bàn" subtitle="10 phường, xã đóng góp nhiều nhất"
                  unit={moneyScale(data.byLocation.map((row) => row.amount))}>
                  <Bars
                    rows={data.byLocation}
                    onSelect={(row) =>
                      dispatchIntent({ type: "OPEN_LOCATION_DETAIL", locationId: row.id })
                    }
                  />
                </Card>
              ),
            },
          ],
          [
            {
              id: "net",
              span: 12,
              hidden: !data.netReconciliation,
              render: () => <NetReconciliation data={data} />,
            },
          ],
          [
            {
              id: "waterfall",
              span: 12,
              render: () => (
                <Card
                  title="Biến động trong nhóm"
                  subtitle="Đóng góp của từng khoản vào mức chênh · chọn để so sánh"
                  actions={
                    <button
                      type="button"
                      className="dlink"
                      onClick={() => setView(view === "waterfall" ? "overview" : "waterfall")}
                    >
                      {view === "waterfall" ? "Thu gọn" : "Mở rộng"}
                    </button>
                  }
                >
                  <WaterfallChart
                    data={data.waterfall}
                    onSelectStep={(id) =>
                      dispatchIntent({
                        type: "OPEN_ADVANCED_COMPARISON",
                        mode: "revenue",
                        entityIds: [data.scope, id],
                      })
                    }
                  />
                </Card>
              ),
            },
          ],
        ]}
      />
    </>
  );
}

function DomesticGroupStructure({
  groups,
  selected,
  onSelect,
}: {
  groups: RevenueGroupRow[];
  selected?: RevenueGroupRow;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="dgroup-analysis">
      <DonutChart
        rows={groups}
        centerLabel="Thu nội địa"
        selectedId={selected?.id}
        onSelect={onSelect}
      />
      {selected && (
        <div className="dgroup-detail">
          <div>
            <strong>{selected.name}</strong>
            {selected.meta && <span>{selected.meta}</span>}
          </div>
          {/* Bốn thanh và một dòng ghi chú ở MỌI nhóm, không phải "tối đa năm".
              Ba nhóm có 4, 5 và 12 khoản, nên `slice(0, 5)` cho ba chiều cao
              khác nhau và dòng ghi chú chỉ hiện ở nhóm đông — đổi lát donut là
              thẻ cao thêm 40px rồi 22px, thẻ cùng hàng giãn theo, và mọi thứ
              phía dưới trang xê dịch. Cấu trúc giống nhau thì không cần giữ chỗ
              bằng một con số ma nào cả. */}
          <Bars rows={selected.items.slice(0, 4)} showMoneyUnit />
          <small>
            {selected.items.length > 4
              ? `Còn ${selected.items.length - 4} khoản trong bảng chi tiết bên dưới.`
              : `Đủ cả ${selected.items.length} khoản của nhóm.`}
          </small>
        </div>
      )}
    </div>
  );
}

type SortKey = "name" | "amount" | "share" | "delta" | "pct";

/** Bảng đủ các khoản của nhóm, có tìm kiếm và sắp xếp mọi cột. */
function BreakdownTable({ data }: { data: RevenueAnalysisData }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "amount", desc: true });

  const rows = useMemo(() => {
    const normalise = (text: string) =>
      text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const needle = normalise(query.trim());
    const filtered = needle
      ? data.breakdown.filter((row) => normalise(row.name).includes(needle))
      : data.breakdown;

    const valueOf = (row: AmountRow): number | string => {
      switch (sort.key) {
        case "name":
          return row.name;
        case "share":
          return row.share ?? -Infinity;
        case "delta":
          return row.amount - (row.previous ?? 0);
        case "pct":
          return row.previous && row.previous > 0
            ? ((row.amount - row.previous) / row.previous) * 100
            : -Infinity;
        default:
          return row.amount;
      }
    };
    return [...filtered].sort((a, b) => {
      const x = valueOf(a);
      const y = valueOf(b);
      const cmp = typeof x === "string" ? String(x).localeCompare(String(y), "vi") : (x as number) - (y as number);
      return sort.desc ? -cmp : cmp;
    });
  }, [data.breakdown, query, sort]);

  // Ba cột tiền dùng CHUNG một thang, tính trên cả ba: nếu mỗi cột một đơn vị
  // thì không đọc được "kỳ này so kỳ trước" theo hàng ngang.
  const unit = useMemo(
    () =>
      moneyScale(
        data.breakdown.flatMap((row) => [row.amount, row.previous, row.amount - (row.previous ?? 0)]),
      ),
    [data.breakdown],
  );

  const header = (key: SortKey, label: string, numeric = true) => (
    <th scope="col" className={numeric ? "is-num" : undefined} aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : "none"}>
      <button
        type="button"
        onClick={() => setSort((current) => ({ key, desc: current.key === key ? !current.desc : true }))}
      >
        {label}
        <span aria-hidden="true">{sort.key === key ? (sort.desc ? " ↓" : " ↑") : ""}</span>
      </button>
    </th>
  );

  return (
    <Card
      title="Bảng chi tiết"
      subtitle={`${data.breakdown.length} khoản trong nhóm${data.scope === "domestic" ? " · đúng 21 khoản nội địa" : ""}`}
      unit={unit}
      actions={
        <label className="dsearch">
          <span className="sr-only">Tìm khoản thu</span>
          <input
            type="search"
            value={query}
            placeholder="Tìm khoản thu…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      }
    >
      <div className="dtable-wrap">
        <table className="dtable is-breakdown">
          <thead>
            <tr>
              {header("name", "Khoản thu", false)}
              {header("amount", "Kỳ này")}
              <th scope="col" className="is-num">Cùng kỳ</th>
              {header("delta", "Chênh lệch")}
              {header("pct", "±%")}
              {header("share", "Tỷ trọng")}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const delta = row.amount - (row.previous ?? 0);
              return (
                <tr key={row.id}>
                  <th scope="row">{row.name}</th>
                  <td className="is-num">{inScale(row.amount, unit)}</td>
                  <td className="is-num">
                    {row.previous === null ? "chưa có" : inScale(row.previous, unit)}
                  </td>
                  <td className={`is-num ${delta >= 0 ? "tone-pos" : "tone-neg"}`}>
                    {delta >= 0 ? "+" : "−"}
                    {inScale(Math.abs(delta), unit)}
                  </td>
                  <td className="is-num">
                    <Change current={row.amount} previous={row.previous} />
                  </td>
                  <td className="is-num">{pct(row.share)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="dempty">
                  Không có khoản thu nào khớp “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Chỉ nhóm XNK: tổng gộp − các dòng hoàn = thu ròng, đối chiếu được từng dòng. */
function NetReconciliation({ data }: { data: RevenueAnalysisData }) {
  const net = data.netReconciliation!;
  const unit = moneyScale([net.gross, net.net, ...net.deductions.map((row) => row.amount)]);
  return (
    <Card
      title="Đối chiếu thu ròng"
      subtitle="Tổng gộp trừ các khoản hoàn và khấu trừ"
      unit={unit}
    >
      <ul className="dledger">
        <li>
          <span>Tổng bảy khoản gộp</span>
          <strong>{inScale(net.gross, unit)}</strong>
        </li>
        {net.deductions.map((row) => (
          <li key={row.id}>
            <span>{row.name}</span>
            <strong className="tone-neg">{inScale(row.amount, unit)}</strong>
          </li>
        ))}
        <li className="is-total">
          <span>Thu cân đối ròng</span>
          <strong>{inScale(net.net, unit)}</strong>
        </li>
      </ul>
      <p className="dnote">
        Các dòng hoàn đã mang dấu âm trong nguồn nên phép cộng ở đây là cộng đại số — không trừ
        thêm một lần nữa.
      </p>
    </Card>
  );
}

export { SOURCES };
