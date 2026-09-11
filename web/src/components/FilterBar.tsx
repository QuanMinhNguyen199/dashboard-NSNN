import { useState } from "react";
import { ALL_PERIODS, INDICATOR_BY_SLUG, INDICATORS, YEARS, latestMonth } from "@/domain/catalog";
import { periodCount } from "@/domain/metrics";
import { useDashboardState } from "@/state/DashboardState";
import type { AccumulationMode, PeriodType } from "@/domain/types";
import { Segmented } from "@/components/primitives";

/**
 * Bộ lọc chung, giữ nguyên khi chuyển tab.
 *
 * Danh sách kỳ chỉ liệt kê kỳ **thực sự có dữ liệu**, nên không thể chọn một kỳ
 * tương lai rồi diễn giải dữ liệu thiếu thành 0.
 */
export function FilterBar() {
  const { filters, setFilters } = useDashboardState();
  const count = periodCount(filters);
  const periods = Array.from({ length: count }, (_, i) => i + 1);
  const periodLabel = filters.periodType === "MONTH" ? "Tháng" : "Quý";
  const allPeriods = filters.period === ALL_PERIODS;
  const [open, setOpen] = useState(false);
  // Năm đã đủ mười hai tháng thì gọi đúng tên là "Cả năm"; năm đang chạy thì
  // nói rõ mới có bao nhiêu tháng, không gọi là cả năm cho một phần năm.
  const months = latestMonth(filters.year);
  const allLabel = months === 12 ? "Cả năm" : `Từ đầu năm (${months} tháng)`;

  // Dòng tóm tắt chỉ hiện ở khổ hẹp. Sáu bộ lọc xếp thành lưới chiếm 326px —
  // gần một phần ba khung iframe 1100px — nên đẩy hết số liệu xuống dưới nếp
  // gấp. Thu gọn lại vẫn nêu đủ phạm vi bằng chữ, đúng Scope Bar Rule.
  const scope = [
    String(filters.year),
    allPeriods ? allLabel : `${periodLabel} ${filters.period}`,
    allPeriods ? null : filters.accumulation === "YTD" ? "Lũy kế" : "Trong kỳ",
    filters.budgetLevel === "NSNN" ? "Tổng NSNN" : filters.budgetLevel === "NSTW" ? "NSTW" : "NSĐP",
    INDICATOR_BY_SLUG[filters.indicator]?.name ?? filters.indicator,
  ].filter(Boolean);

  return (
    <section className="dfilters" data-open={open} aria-label="Bộ lọc chung">
      <div className="dfilters-summary">
        <p>
          <span className="dfilters-eyebrow">Đang xem</span>
          {scope.map((part) => (
            <b key={part as string}>{part}</b>
          ))}
        </p>
        <button
          type="button"
          className="dbtn dfilters-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Xong" : "Chọn lại"}
        </button>
      </div>

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
          <option value={ALL_PERIODS}>{allLabel}</option>
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
