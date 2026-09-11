import { useMemo, useState } from "react";
import { SOURCES, SOURCE_BY_CODE, type SourceCode } from "../dashboard/catalog";
import { useRevenueAnalysis } from "../dashboard/useResource";
import type { AmountRow, RevenueAnalysisData } from "../dashboard/types";
import { useDashboardState } from "../state/DashboardState";
import { GridRows } from "../ui/Grid";
import { TrendChart, WaterfallChart } from "../ui/charts";
import { Bars, Card, Change, CoverageNote, ResourceView, money, pct } from "../ui/primitives";

/** Sub-navigation của workspace phân tích thu. */
const SECTIONS: { id: SourceCode; label: string }[] = [
  { id: "domestic", label: "Thu nội địa" },
  { id: "import-export", label: "Thu xuất nhập khẩu" },
  { id: "other", label: "Thu khác" },
];

export function RevenueAnalysisTab() {
  const { filters, section, setSection } = useDashboardState();
  const scope = SECTIONS.some((s) => s.id === section) ? section : "domestic";
  const { resource, retry } = useRevenueAnalysis(filters, scope);

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
        {(data, partial) => <AnalysisBody data={data} partial={partial} />}
      </ResourceView>
    </>
  );
}

function AnalysisBody({ data, partial }: { data: RevenueAnalysisData; partial?: string }) {
  const { filters, view, setView, dispatchIntent } = useDashboardState();
  const source = SOURCE_BY_CODE[data.scope];
  const kpi = data.kpis.total;

  return (
    <>
      <CoverageNote message={partial} />

      <section className="dkpis" aria-label={`Chỉ số ${source.shortName}`}>
        <div>
          <span>{source.shortName} trong kỳ</span>
          <strong>{money(kpi.amount)}</strong>
          <small>
            <Change current={kpi.amount} previous={kpi.previous} /> so cùng kỳ
          </small>
        </div>
        <div>
          <span>Tỷ trọng trên tổng thu</span>
          <strong>{pct(data.kpis.share)}</strong>
          <small>Trên cùng chỉ tiêu và cấp ngân sách đang lọc</small>
        </div>
        <div>
          <span>Đóng góp vào biến động</span>
          <strong className={data.kpis.contribution >= 0 ? "tone-pos" : "tone-neg"}>
            {data.kpis.contribution >= 0 ? "+" : "−"}
            {money(Math.abs(data.kpis.contribution))}
          </strong>
          <small>Phần chênh lệch do nhóm này tạo ra</small>
        </div>
        <div>
          <span>Số khoản trong nhóm</span>
          <strong>{data.breakdown.length}</strong>
          <small>{source.cityOnly ? "Không phân bổ theo địa bàn" : "Có phân bổ theo phường, xã"}</small>
        </div>
      </section>

      <GridRows
        rows={[
          [
            {
              id: "trend",
              span: 8,
              render: () => (
                <Card title={`Xu hướng ${source.shortName.toLowerCase()}`} subtitle="12 tháng, so năm trước">
                  <TrendChart points={data.trend} year={filters.year} />
                </Card>
              ),
            },
            {
              id: "structure",
              span: 4,
              render: () => (
                <Card title="Cơ cấu trong nhóm" subtitle="Tỷ trọng trên tổng nhóm">
                  <Bars
                    rows={[...data.breakdown].sort((a, b) => b.amount - a.amount).slice(0, 8)}
                    total={data.breakdown.reduce((sum, row) => sum + Math.abs(row.amount), 0)}
                    scale="share"
                  />
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
                <Card title="Đóng góp theo địa bàn" subtitle="10 phường, xã đóng góp nhiều nhất">
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
                  <td className="is-num">{money(row.amount)}</td>
                  <td className="is-num">{row.previous === null ? "chưa có" : money(row.previous)}</td>
                  <td className={`is-num ${delta >= 0 ? "tone-pos" : "tone-neg"}`}>
                    {delta >= 0 ? "+" : "−"}
                    {money(Math.abs(delta))}
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
  return (
    <Card
      title="Đối chiếu thu ròng"
      subtitle="Tổng gộp trừ các khoản hoàn và khấu trừ"
    >
      <ul className="dledger">
        <li>
          <span>Tổng bảy khoản gộp</span>
          <strong>{money(net.gross)}</strong>
        </li>
        {net.deductions.map((row) => (
          <li key={row.id}>
            <span>{row.name}</span>
            <strong className="tone-neg">{money(row.amount)}</strong>
          </li>
        ))}
        <li className="is-total">
          <span>Thu cân đối ròng</span>
          <strong>{money(net.net)}</strong>
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
