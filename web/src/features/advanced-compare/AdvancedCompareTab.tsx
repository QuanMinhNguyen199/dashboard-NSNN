import { LOCATIONS, SOURCES, YEARS, sameAllocationScope, type SourceCode } from "@/domain/catalog";
import { periodCount, periodTokenLabel } from "@/domain/metrics";
import { useAdvancedComparison } from "@/data/hooks";
import type { AdvancedComparisonData, AdvancedComparisonMode } from "@/domain/types";
import { useDashboardState } from "@/state/DashboardState";
import { GridRows } from "@/components/Grid";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { TrendChart, WaterfallChart } from "@/components/charts";
import {
  Card,
  Money,
  ResourceView,
  Segmented,
  inScale,
  moneyScale,
  pct,
} from "@/components/primitives";

const MODES: { value: AdvancedComparisonMode; label: string }[] = [
  { value: "period", label: "Theo kỳ" },
  { value: "revenue", label: "Theo nguồn thu" },
  { value: "location", label: "Theo địa bàn" },
];

export function AdvancedCompareTab() {
  const state = useDashboardState();
  const { filters, mode, periodA, periodB, compareSource, compareSourceB, locationA, locationB } = state;

  const comparisonFilters = {
    ...filters,
    mode,
    periodA,
    periodB,
    source: compareSource,
    item: compareSourceB,
    locationA: locationA ?? undefined,
    locationB: locationB ?? undefined,
  };

  const ready =
    mode === "period"
      ? !!periodA && !!periodB
      : mode === "revenue"
        ? compareSource !== compareSourceB && sameAllocationScope(compareSource, compareSourceB)
        : !!locationA && !!locationB && locationA !== locationB;

  // Chưa đủ vế là trạng thái chờ, không phải lỗi tải. Câu này nằm ngay trong
  // khung chờ chứ không đứng thành một dòng ghi chú riêng phía trên: hai chỗ
  // cùng nói một việc thì người đọc phải đọc hai lần để biết chúng trùng nhau.
  const waiting =
    mode === "revenue"
      ? compareSource !== compareSourceB
        ? "Hai nguồn này khác phạm vi phân bổ nên không đặt cạnh nhau được. Chọn lại vế B."
        : "Chọn hai nguồn thu khác nhau để so sánh."
      : mode === "location"
        ? "Chọn hai phường, xã khác nhau để so sánh."
        : "Chọn đủ hai kỳ để so sánh.";

  const { resource, retry } = useAdvancedComparison(comparisonFilters, ready, waiting);

  return (
    <>
      <div className="dmode">
        <Segmented label="Chế độ so sánh" value={mode} options={MODES} onChange={state.setMode} />
      </div>

      <CompareBuilder />

      <ResourceView resource={resource} retry={retry} minHeight={380}>
        {(data) => <CompareBody data={data} />}
      </ResourceView>
    </>
  );
}

/** Bộ dựng hai vế. Không cho ghép hai đối tượng khác phạm vi phân bổ. */
function CompareBuilder() {
  const state = useDashboardState();
  const { mode, filters } = state;

  if (mode === "period")
    return (
      <section className="dbuilder" aria-label="Chọn hai kỳ">
        <PeriodPicker label="Kỳ A" value={state.periodA} onChange={(periodA) => state.setCompare({ periodA })} />
        <span className="dbuilder-arrow" aria-hidden="true">→</span>
        <PeriodPicker label="Kỳ B" value={state.periodB} onChange={(periodB) => state.setCompare({ periodB })} />
      </section>
    );

  if (mode === "revenue") {
    const compatible = (code: SourceCode) => sameAllocationScope(state.compareSource, code);
    return (
      <section className="dbuilder" aria-label="Chọn hai nguồn thu">
        <label>
          <span>Nguồn A</span>
          <select
            value={state.compareSource}
            onChange={(event) => state.setCompare({ compareSource: event.target.value as SourceCode })}
          >
            {SOURCES.map((source) => (
              <option key={source.code} value={source.code}>
                {source.shortName}
              </option>
            ))}
          </select>
        </label>
        <span className="dbuilder-arrow" aria-hidden="true">→</span>
        <label>
          <span>Nguồn B</span>
          <select
            value={state.compareSourceB}
            onChange={(event) => state.setCompare({ compareSourceB: event.target.value as SourceCode })}
          >
            {SOURCES.map((source) => (
              <option
                key={source.code}
                value={source.code}
                disabled={!compatible(source.code) || source.code === state.compareSource}
              >
                {source.shortName}
                {!compatible(source.code) ? " — khác phạm vi phân bổ" : ""}
              </option>
            ))}
          </select>
        </label>
        <p className="dbuilder-note">
          Kỳ đang xét: {filters.periodType === "MONTH" ? "tháng" : "quý"} {filters.period}/{filters.year}.
          Không ghép nguồn phân bổ theo địa bàn với nguồn do trung ương quản lý.
        </p>
      </section>
    );
  }

  return (
    <section className="dbuilder" aria-label="Chọn hai địa bàn">
      <label>
        <span>Địa bàn A</span>
        <select
          value={state.locationA ?? ""}
          onChange={(event) => state.setCompare({ locationA: event.target.value || null })}
        >
          <option value="">— Chọn phường, xã —</option>
          {LOCATIONS.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
      <span className="dbuilder-arrow" aria-hidden="true">→</span>
      <label>
        <span>Địa bàn B</span>
        <select
          value={state.locationB ?? ""}
          onChange={(event) => state.setCompare({ locationB: event.target.value || null })}
        >
          <option value="">— Chọn phường, xã —</option>
          {LOCATIONS.map((location) => (
            <option key={location.id} value={location.id} disabled={location.id === state.locationA}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function PeriodPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (token: string) => void;
}) {
  const match = /^(\d{4})([mq])(\d{1,2})$/.exec(value) ?? ["", "2026", "m", "8"];
  const [, year, kind, num] = match;
  const periodType = kind === "q" ? "QUARTER" : "MONTH";
  const max = periodCount({ year: Number(year), periodType });

  return (
    <div className="dpicker">
      <label>
        <span>{label}</span>
        <select
          value={year}
          onChange={(event) => onChange(`${event.target.value}${kind}${Math.min(Number(num), periodCount({ year: Number(event.target.value), periodType }))}`)}
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">{label} — kỳ trong năm</span>
        <select
          aria-label={`${label} — kỳ trong năm`}
          value={`${kind}${num}`}
          onChange={(event) => onChange(`${year}${event.target.value}`)}
        >
          <optgroup label="Theo tháng">
            {Array.from({ length: periodCount({ year: Number(year), periodType: "MONTH" }) }, (_, i) => i + 1).map(
              (month) => (
                <option key={`m${month}`} value={`m${month}`}>
                  Tháng {month}
                </option>
              ),
            )}
          </optgroup>
          <optgroup label="Theo quý">
            {Array.from(
              { length: periodCount({ year: Number(year), periodType: "QUARTER" }) },
              (_, i) => i + 1,
            ).map((quarter) => (
              <option key={`q${quarter}`} value={`q${quarter}`}>
                Quý {quarter}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <span className="dpicker-label">{periodTokenLabel(value)}</span>
      <span className="sr-only">{max} kỳ có dữ liệu</span>
    </div>
  );
}

function CompareBody({ data }: { data: AdvancedComparisonData }) {
  const { filters } = useDashboardState();
  const bothKnown = data.a.total !== null && data.b.total !== null;
  // Bảng chênh lệch: ba cột tiền phải cùng một đơn vị mới đọc được theo hàng ngang.
  const deltaUnit = moneyScale(data.rows.flatMap((row) => [row.a, row.b, row.delta]));
  // Vế A, vế B và chênh lệch nằm trên cùng một dải: cùng thang mới so được.
  const kpiUnit = moneyScale([data.a.total, data.b.total, data.delta]);

  return (
    <>
      <KpiStrip label="Chỉ số so sánh">
        <Kpi label={data.a.label} note="Vế A">
          {data.a.total === null ? "chưa có số liệu" : <Money value={data.a.total} scale={kpiUnit} />}
        </Kpi>
        <Kpi label={data.b.label} note="Vế B">
          {data.b.total === null ? "chưa có số liệu" : <Money value={data.b.total} scale={kpiUnit} />}
        </Kpi>
        <Kpi
          label="Chênh lệch tuyệt đối"
          tone={data.delta === null ? undefined : data.delta >= 0 ? "pos" : "neg"}
          note={bothKnown ? "B trừ A" : "Thiếu một vế nên không tính chênh lệch"}
        >
          {data.delta === null ? (
            "—"
          ) : (
            <>
              {data.delta >= 0 ? "+" : "−"}
              <Money value={Math.abs(data.delta)} scale={kpiUnit} />
            </>
          )}
        </Kpi>
        <Kpi
          label="Chênh lệch tương đối"
          tone={data.deltaPct === null ? undefined : data.deltaPct >= 0 ? "pos" : "neg"}
          note={data.deltaPct === null ? "Mẫu số không hợp lệ" : "Trên giá trị vế A"}
        >
          {pct(data.deltaPct, true)}
        </Kpi>
      </KpiStrip>

      {data.rows.length === 0 && (
        <p className="dnote" role="note">
          Hai nguồn thu không có khoản thu chung nên chỉ so được ở mức tổng —
          một bảng theo khoản sẽ phải điền 0 cho những khoản vốn không tồn tại ở
          vế kia, và con số đó đọc ra thành “mất trắng” chứ không phải “không áp
          dụng”.
        </p>
      )}

      <GridRows
        rows={[
          [
            {
              id: "waterfall",
              span: 7,
              wide: true,
              // Không có cầu nối ở chế độ so nguồn thu; `resolveRow` cho bảng
              // chênh lệch nở đủ 12 cột thay vì để trống nửa hàng.
              hidden: data.waterfall === null,
              render: () => (
                <Card title="Cầu nối chênh lệch" subtitle={`Từ ${data.a.label} sang ${data.b.label}`}>
                  <WaterfallChart data={data.waterfall!} />
                </Card>
              ),
            },
            {
              id: "delta-table",
              // Không có phân rã thì không dựng bảng rỗng; `resolveRow` cho
              // widget còn lại nở đủ 12 cột.
              hidden: data.rows.length === 0,
              span: 5,
              // Bảng năm cột đi kèm: cả hàng cùng xuống một cột khi hẹp.
              wide: true,
              render: () => (
                <Card
                  title="Bảng chênh lệch"
                  subtitle={
                    data.mode === "revenue"
                      ? "Các khoản của hai vế; khoản chỉ có ở một vế thì vế kia bằng 0"
                      : "Sắp theo độ lớn tuyệt đối"
                  }
                  unit={deltaUnit}
                >
                  <div className="dtable-wrap">
                    <table className="dtable is-compact">
                      <thead>
                        <tr>
                          <th scope="col">Đối tượng</th>
                          <th scope="col" className="is-num">A</th>
                          <th scope="col" className="is-num">B</th>
                          <th scope="col" className="is-num">Chênh</th>
                          <th scope="col" className="is-num">Đóng góp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.rows.slice(0, 12).map((row) => (
                          <tr key={row.id}>
                            <th scope="row">{row.name}</th>
                            <td className="is-num">{inScale(row.a, deltaUnit)}</td>
                            <td className="is-num">{inScale(row.b, deltaUnit)}</td>
                            <td className={`is-num ${row.delta >= 0 ? "tone-pos" : "tone-neg"}`}>
                              {row.delta >= 0 ? "▲" : "▼"} {inScale(Math.abs(row.delta), deltaUnit)}
                            </td>
                            <td className="is-num">{pct(row.contribution)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ),
            },
          ],
          [
            {
              id: "trend",
              span: 12,
              render: () => (
                <Card title="Xu hướng hai vế" subtitle="12 tháng, cùng thang đo">
                  <TrendChart
                    points={data.trendB.map((point, index) => ({
                      ...point,
                      previous: data.trendA[index]?.current ?? null,
                    }))}
                    year={filters.year}
                    labelA={data.a.label}
                    labelB={data.b.label}
                    peers
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
