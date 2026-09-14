import { useState } from "react";
import { ALL_PERIODS, INDICATOR_BY_SLUG, INDICATORS, YEARS, latestMonth } from "@/domain/catalog";
import { periodCount } from "@/domain/metrics";
import { DEFAULT_FILTERS, useDashboardState } from "@/state/DashboardState";
import { useHostContext } from "@/host/HostContext";
import type { AccumulationMode, DashboardFilters, PeriodType } from "@/domain/types";
import { Segmented } from "@/components/primitives";

/**
 * Bộ lọc chung, giữ nguyên khi chuyển tab.
 *
 * Danh sách kỳ chỉ liệt kê kỳ **thực sự có dữ liệu**, nên không thể chọn một kỳ
 * tương lai rồi diễn giải dữ liệu thiếu thành 0.
 */
export function FilterBar() {
  const { filters, resetFilters, setFilters } = useDashboardState();
  const { host, embedded, postToHost } = useHostContext();
  const count = periodCount(filters);
  const periods = Array.from({ length: count }, (_, i) => i + 1);
  const periodLabel = filters.periodType === "MONTH" ? "Tháng" : "Quý";
  const allPeriods = filters.period === ALL_PERIODS;
  const [open, setOpen] = useState(false);
  const compact = embedded || host.source === "mobile";
  const usesHostFilter = host.source === "mobile" && host.capabilities.openFilterModal;
  // Năm đã đủ mười hai tháng thì gọi đúng tên là "Cả năm"; năm đang chạy thì
  // nói rõ mới có bao nhiêu tháng, không gọi là cả năm cho một phần năm.
  const months = latestMonth(filters.year);
  const allLabel = months === 12 ? "Cả năm" : `Từ đầu năm (${months} tháng)`;
  const budgetLabel =
    filters.budgetLevel === "NSNN"
      ? "Tổng NSNN"
      : filters.budgetLevel === "NSTW"
        ? "NSTW"
        : "NSĐP";
  const indicatorLabel = INDICATOR_BY_SLUG[filters.indicator]?.name ?? filters.indicator;
  const mobilePeriodValue = allPeriods
    ? `Từ đầu năm ${filters.year}`
    : `${periodLabel} ${filters.period}/${filters.year}`;
  const mobileCalculation = allPeriods
    ? `${months} tháng có dữ liệu`
    : filters.accumulation === "YTD"
      ? "Lũy kế"
      : "Trong kỳ";

  const isDefaultFilter = (Object.keys(DEFAULT_FILTERS) as (keyof DashboardFilters)[]).every(
    (key) => filters[key] === DEFAULT_FILTERS[key],
  );

  return (
    <section
      className="dfilters"
      data-open={open}
      data-embedded={compact}
      data-host={host.source}
      aria-label="Bộ lọc chung"
    >
      <div className="dfilters-summary">
        <div className="dfilters-mobile-copy">
          <div className="dfilters-mobile-group">
            <span>Kỳ báo cáo</span>
            <strong title={mobilePeriodValue}>{mobilePeriodValue}</strong>
            <small title={mobileCalculation}>{mobileCalculation}</small>
          </div>
          <div className="dfilters-mobile-group">
            <span>Chỉ tiêu</span>
            <strong title={indicatorLabel}>{indicatorLabel}</strong>
            <small title={budgetLabel}>{budgetLabel}</small>
          </div>
        </div>
        <button
          type="button"
          className="dbtn dfilters-toggle"
          aria-expanded={usesHostFilter ? undefined : open}
          onClick={() => {
            if (usesHostFilter) {
              postToHost("NSNN_OPEN_FILTER", { currentFilters: filters });
              return;
            }
            setOpen((value) => !value);
          }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M2 3.25h12M4.5 8h7M6.5 12.75h3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="dfilters-toggle-label">
            {open ? "Xong" : "Bộ lọc"}
          </span>
        </button>
      </div>

      <label className="dfilter-year">
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

      <div className="dfield dfilter-cycle">
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

      <label className="dfilter-period">
        <span>{periodLabel}</span>
        <select
          value={filters.period}
          onChange={(event) => setFilters({ period: Number(event.target.value) })}
        >
          <option value={ALL_PERIODS}>{allLabel}</option>
          {periods.map((period) => (
            <option key={period} value={period}>
              {periodLabel} {period}
            </option>
          ))}
        </select>
      </label>

      <div className="dfield dfilter-accumulation">
        <span>Cách tính</span>
        <Segmented
          label="Cách tính"
          value={allPeriods ? "YTD" : filters.accumulation}
          options={[
            { value: "PERIOD" as AccumulationMode, label: "Trong kỳ" },
            { value: "YTD" as AccumulationMode, label: "Lũy kế" },
          ]}
          onChange={(accumulation) => setFilters({ accumulation })}
          // Chọn tất cả các kỳ thì số đã là lũy kế toàn bộ, "trong kỳ" vô nghĩa.
          disabled={allPeriods}
          hint={`${allLabel} luôn là số cộng dồn từ tháng 1, nên không chọn được cách tính.`}
        />
      </div>

      <label className="dfilter-budget">
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

      <label className="dfilter-indicator">
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

      {/* Render ở mọi ngữ cảnh. Trước đây điều kiện `open` khiến nút chỉ tồn tại
          ở bản thu gọn, nên desktop rộng — nơi bày cả sáu điều khiển cùng lúc và
          cũng là nơi dễ lạc bộ lọc nhất — hoàn toàn không có đường về mặc định. */}
      {(
        <div className="dfilters-reset-row">
          <button
            type="button"
            className="dfilters-reset"
            onClick={resetFilters}
            disabled={isDefaultFilter}
            title="Đặt lại về Tháng 8/2026, Trong kỳ, Tổng NSNN và TỔNG SỐ"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}
    </section>
  );
}
