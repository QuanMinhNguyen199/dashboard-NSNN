import { Async } from "./Async";
import { Delta } from "./Delta";
import { useApi } from "../hooks/useApi";
import { exact, money, pct1, pctChange } from "../lib/format";
import { useFilters } from "../state/FiltersProvider";
import type { Acc, KpiCompare, KpiRow } from "../lib/types";

const EMPTY: KpiCompare = { current: [], previous: [] };

/** `Oa` — tìm một dòng KPI; bỏ qua dòng amount === 0. */
function pick(
  rows: KpiRow[],
  item: string,
  acc: Acc,
  level: "city" | "ward",
): KpiRow | undefined {
  return rows.find(
    (row) =>
      row.item === item && row.acc === acc && row.location_level === level && row.amount !== 0,
  );
}

/**
 * `aR` — bốn KPI. Lưu ý: đây KHÔNG phải bốn ô cùng đổi tên theo ô lọc Chỉ tiêu.
 * Tổng số và Thu NSNN luôn đọc ở acc=PERIOD, còn YTD đọc riêng và có fallback về cấp city.
 */
export function Kpis({ scope }: { scope: "overview" | "detail" }) {
  const { apiParams } = useFilters();
  const params = scope === "detail" ? apiParams : { ...apiParams, ward: undefined };
  const { data, loading, error } = useApi<KpiCompare>("/api/kpi-compare", params, EMPTY);

  const cur = data.current;
  const prev = data.previous;
  const total = pick(cur, "TỔNG SỐ", "PERIOD", "ward");
  const net = pick(cur, "THU NGÂN SÁCH NHÀ NƯỚC", "PERIOD", "ward");
  const ytd = pick(cur, "TỔNG SỐ", "YTD", "ward") ?? pick(cur, "TỔNG SỐ", "YTD", "city");

  const totalDelta = pctChange(total?.amount, pick(prev, "TỔNG SỐ", "PERIOD", "ward")?.amount);
  const netDelta = pctChange(
    net?.amount,
    pick(prev, "THU NGÂN SÁCH NHÀ NƯỚC", "PERIOD", "ward")?.amount,
  );
  const share = total && net && total.amount ? (net.amount / total.amount) * 100 : null;

  const cards = [
    {
      label: "Tổng số",
      value: total ? money(total.amount) : "—",
      sub: total ? exact(total.amount) : "kỳ này chưa có số liệu",
      delta: totalDelta,
      tip: "Tổng thu, gồm cả vay và chuyển giao. % so với kỳ trước.",
    },
    {
      label: "Thu NSNN (thu thuần)",
      value: net ? money(net.amount) : "—",
      sub: "không gồm vay và thu chuyển giao",
      delta: netDelta,
      tip: "Thu thuần -- không tính vay và chuyển giao.",
    },
    {
      label: "Tỷ trọng thu thuần",
      value: share != null ? `${pct1(share)}%` : "—",
      sub: "trên tổng thu (còn lại là vay + chuyển giao)",
      delta: null,
      tip: "Tỷ lệ thu thuần trên tổng thu. Càng cao, càng ít phụ thuộc vay/chuyển giao.",
    },
    {
      label: "Luỹ kế từ đầu năm (YTD)",
      value: ytd ? money(ytd.amount) : "—",
      sub: ytd ? exact(ytd.amount) : "—",
      delta: null,
      tip: "Tổng thu cộng dồn từ đầu năm tới kỳ này.",
    },
  ];

  if (loading || error) return <Async loading={loading} error={error} />;

  return (
    <div className="nsnn-kpis">
      {cards.map((card) => (
        <div
          key={card.label}
          title={card.tip}
          className="nsnn-kpi"
        >
          <div className="nsnn-kpi-label">{card.label}</div>
          <div className="nsnn-kpi-value">{card.value}</div>
          <div className="nsnn-kpi-sub">
            {card.sub} <Delta pct={card.delta} />
          </div>
        </div>
      ))}
    </div>
  );
}
