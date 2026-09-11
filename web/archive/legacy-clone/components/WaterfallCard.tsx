import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Async } from "./Async";
import { Card } from "./Card";
import { ZoomModal } from "./ZoomModal";
import { useApi } from "../hooks/useApi";
import { money } from "../lib/format";
import { useFilters } from "../state/FiltersProvider";
import type { WaterfallBar, WaterfallData } from "../lib/types";

const EMPTY: WaterfallData = { bars: [], total_delta: null };

/** `jie` — thanh ngang tăng/giảm với đường mốc 0. */
function WaterfallChart({ bars, rowH = 50 }: { bars: WaterfallBar[]; rowH?: number }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, bars.length * rowH)}>
      <BarChart data={bars} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
        <XAxis type="number" tickFormatter={money} fontSize={10} stroke="var(--line)" tick={{ fill: "var(--ink-2)" }} />
        <YAxis type="category" dataKey="name" width={150} fontSize={11} stroke="var(--line)" tick={{ fill: "var(--ink-2)" }} />
        <Tooltip formatter={(value: number) => money(value)} />
        <ReferenceLine x={0} stroke="var(--ink)" />
        <Bar dataKey="delta" radius={3}>
          {bars.map((bar, i) => (
            <Cell key={i} fill={bar.delta >= 0 ? "var(--up)" : "var(--down)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** `Nie` */
export function WaterfallCard() {
  const { apiParams } = useFilters();
  const params = { ...apiParams, ward: undefined };
  const { data, loading, error } = useApi<WaterfallData>("/api/waterfall", params, EMPTY);

  if (loading || error) return <Async loading={loading} error={error} />;

  return (
    <Card title="Waterfall — biến động Thu NSNN so kỳ trước">
      {data.bars.length ? (
        <>
          <ZoomModal
            title="Waterfall — biến động Thu NSNN so kỳ trước"
            render={(height) => (
              <WaterfallChart
                bars={data.bars}
                rowH={Math.max(50, height / Math.max(1, data.bars.length))}
              />
            )}
          />
          {data.total_delta != null && (
            <div className="mt-2 text-sm text-muted">
              Tổng biến động:{" "}
              <b className="text-ink">
                {data.total_delta >= 0 ? "+" : ""}
                {money(data.total_delta)}
              </b>
            </div>
          )}
        </>
      ) : (
        <p className="m-0 text-sm text-muted">
          Cần ≥ 2 kỳ liên tiếp để so sánh -- kỳ đang chọn chưa có kỳ liền trước.
        </p>
      )}
    </Card>
  );
}
