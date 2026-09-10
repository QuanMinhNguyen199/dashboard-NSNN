import { INDICATORS, YEARS } from "../dashboard/catalog";
import { periodCount } from "../dashboard/selectors";
import { useDashboardState } from "../state/DashboardState";
import type { AccumulationMode, PeriodType } from "../dashboard/types";
import { Segmented } from "./primitives";

/**
 * Bộ lọc chung, giữ nguyên khi chuyển tab.
 *
 * Danh sách kỳ chỉ liệt kê kỳ **thực sự có dữ liệu**, nên không thể chọn một kỳ
 * tương lai rồi diễn giải dữ liệu thiếu thành 0.
 */
export function FilterBar() {
  const { filters, setFilters } = useDashboardState();
  const periods = Array.from({ length: periodCount(filters) }, (_, i) => i + 1);
  const periodLabel = filters.periodType === "MONTH" ? "Tháng" : "Quý";

  return (
    <section className="dfilters" aria-label="Bộ lọc chung">
      <label>
        <span>Năm</span>
        <select
          value={filters.year}
          onChange={(event) => setFilters({ year: Number(event.target.value) })}
        >
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <div className="dfield">
        <span>Chu kỳ</span>
        <Segmented
          label="Chu kỳ"
          value={filters.periodType}
          options={[
            { value: "MONTH" as PeriodType, label: "Tháng" },
            { value: "QUARTER" as PeriodType, label: "Quý" },
          ]}
          onChange={(periodType) => setFilters({ periodType })}
        />
      </div>

      <label>
        <span>{periodLabel}</span>
        <select
          value={filters.period}
          onChange={(event) => setFilters({ period: Number(event.target.value) })}
        >
          {periods.map((period) => (
            <option key={period} value={period}>
              {periodLabel} {period}
            </option>
          ))}
        </select>
      </label>

      <div className="dfield">
        <span>Cách tính</span>
        <Segmented
          label="Cách tính"
          value={filters.accumulation}
          options={[
            { value: "PERIOD" as AccumulationMode, label: "Trong kỳ" },
            { value: "YTD" as AccumulationMode, label: "Lũy kế" },
          ]}
          onChange={(accumulation) => setFilters({ accumulation })}
        />
      </div>

      <label>
        <span>Cấp ngân sách</span>
        <select
          value={filters.budgetLevel}
          onChange={(event) =>
            setFilters({ budgetLevel: event.target.value as typeof filters.budgetLevel })
          }
        >
          <option value="NSNN">Tổng NSNN</option>
          <option value="NSTW">NSTW</option>
          <option value="NSDP">NSĐP</option>
        </select>
      </label>

      <label className="dfield-wide">
        <span>Chỉ tiêu</span>
        <select
          value={filters.indicator}
          onChange={(event) =>
            setFilters({ indicator: event.target.value as typeof filters.indicator })
          }
        >
          {INDICATORS.map((indicator) => (
            <option key={indicator.slug} value={indicator.slug} title={indicator.note}>
              {indicator.name}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
