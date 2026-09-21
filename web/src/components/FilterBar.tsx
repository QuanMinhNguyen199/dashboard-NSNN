import { useState } from "react";
import { ALL_PERIODS, LOCATIONS, YEARS, latestMonth } from "@/domain/catalog";
import { LEVEL_BY_ID, LOCAL_LEVELS, TAX_OFFICES, levelLabel, type ManagementLevelFilter } from "@/domain/tms";
import { periodCount } from "@/domain/metrics";
import { DEFAULT_FILTERS, useDashboardState } from "@/state/DashboardState";
import { useHostContext } from "@/host/HostContext";
import type { AccumulationMode, DashboardFilters, PeriodType } from "@/domain/types";
import { Segmented } from "@/components/primitives";
import { AutocompleteSelect } from "@/components/AutocompleteSelect";

const taxOfficeOptions = [
  { value: "", label: "Tất cả cơ quan thuế" },
  ...[...TAX_OFFICES]
    .sort((a, b) => {
      const aNumber = Number(a.name.match(/cơ sở\s+(\d+)/i)?.[1] ?? Infinity);
      const bNumber = Number(b.name.match(/cơ sở\s+(\d+)/i)?.[1] ?? Infinity);
      return aNumber - bNumber || a.code.localeCompare(b.code);
    })
    .map((office) => ({ value: office.code, label: `${office.code} · ${office.name}` })),
];
const locationOptions = [
  { value: "", label: "Toàn thành phố" },
  ...[...LOCATIONS]
    .sort((a, b) => a.name.localeCompare(b.name, "vi"))
    .map((item) => ({ value: item.id, label: item.name })),
];

/**
 * Bộ lọc chung, giữ nguyên khi chuyển tab.
 *
 * Danh sách kỳ chỉ liệt kê kỳ **thực sự có dữ liệu**, nên không thể chọn một kỳ
 * tương lai rồi diễn giải dữ liệu thiếu thành 0.
 */
export function FilterBar() {
  const { tab, filters, location, managementLevel, taxOfficeCode, resetFilters, setFilters, setTab, setManagementLevel, setTaxOfficeCode, dispatchIntent } =
    useDashboardState();
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
  const mobilePeriodValue = allPeriods
    ? `Từ đầu năm ${filters.year}`
    : `${periodLabel} ${filters.period}/${filters.year}`;
  const mobileCalculation = allPeriods
    ? `${months} tháng có dữ liệu`
    : filters.accumulation === "YTD"
      ? "Lũy kế"
      : "Trong kỳ";
  const selectedTaxOffice = TAX_OFFICES.find((office) => office.code === taxOfficeCode) ?? null;

  // Địa bàn tính vào "đã đổi" vì nó là một ô trong chính thanh lọc này. Bỏ sót
  // nó thì chọn một phường xong nút vẫn xám, và người dùng đọc ra là nút hỏng.
  const isDefaultFilter =
    location === null &&
    managementLevel === "all" &&
    (tab !== "tms-breakdown" || taxOfficeCode === null) &&
    (Object.keys(DEFAULT_FILTERS) as (keyof DashboardFilters)[]).every(
      (key) => filters[key] === DEFAULT_FILTERS[key],
    );

  /** Chọn địa bàn là lối điều hướng sang tab chi tiết; tab Mã hạch toán đi từ CQT xuống địa bàn phụ trách. */
  const locationField = (
    <div className="dfilter-location">
      <AutocompleteSelect
        id="location-autocomplete"
        label="Chi tiết địa bàn"
        value={location ?? ""}
        options={locationOptions}
        placeholder="Tìm phường, xã"
        onChange={(id) => {
          if (id) dispatchIntent({ type: "OPEN_LOCATION_DETAIL", locationId: id });
          else setTab("overview");
        }}
      />
    </div>
  );

  /**
   * Lối đi tắt sang tab Mã hạch toán, cùng vai với ô "Chi tiết địa bàn".
   *
   * Chỗ này trước là ô "Chỉ tiêu" — ba giá trị mà người dùng gần như không đổi,
   * trong khi cấp quản lý là chiều họ thực sự cần và trước đây chỉ chạm tới được
   * sau khi đã vào đúng tab. Ô này giữ đúng hình dạng hai bậc của cấp quản lý
   * bằng `optgroup`, nên danh sách phẳng không nói sai rằng cấp xã ngang hàng
   * với trung ương.
   *
   * Chọn một cấp là điều hướng, không phải lọc lại tab đang đứng. "Tất cả cấp"
   * chỉ đưa về phạm vi đầy đủ: nó KHÔNG kéo người dùng khỏi tab hiện tại, khác
   * với "Toàn thành phố" của ô địa bàn — về toàn thành phố là về đúng câu hỏi mà
   * Tổng quan trả lời, còn bỏ lọc cấp thì không tương ứng với tab nào cả.
   */
  const managementField = (
    <label className="dfilter-management">
      <span>Cấp quản lý</span>
      <select
        value={managementLevel}
        title="Cấp quản lý của Chương. Chọn một cấp sẽ mở tab Mã hạch toán."
        onChange={(event) => {
          const next = event.target.value as ManagementLevelFilter;
          setManagementLevel(next);
          if (next !== "all") setTab("tms-breakdown");
        }}
      >
        <option value="all">Tất cả cấp</option>
        <option value="trung-uong">Trung ương</option>
        <optgroup label="Địa phương">
          <option value="dia-phuong">Tất cả địa phương</option>
          {LOCAL_LEVELS.map((id) => (
            <option key={id} value={id}>
              {LEVEL_BY_ID[id].name}
            </option>
          ))}
        </optgroup>
        <option value="unknown">Chưa xác định cấp</option>
      </select>
    </label>
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
            <span>Phạm vi</span>
            <strong title={budgetLabel}>{budgetLabel}</strong>
            <small title={tab === "tms-breakdown" ? (selectedTaxOffice?.name ?? "Tất cả cơ quan thuế") : levelLabel(managementLevel)}>
              {tab === "tms-breakdown" ? (selectedTaxOffice?.name ?? "Tất cả cơ quan thuế") : levelLabel(managementLevel)}
            </small>
          </div>
        </div>
        <button
          type="button"
          className="dbtn dfilters-toggle"
          aria-expanded={usesHostFilter ? undefined : open}
          onClick={() => {
            if (usesHostFilter) {
              postToHost("NSNN_OPEN_FILTER", { currentFilters: { ...filters, taxOfficeCode } });
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

      {/* Mã hạch toán đi từ CQT xuống địa bàn được phân công quản lý.
          Không đặt ô địa bàn ở đây vì nó đảo ngược luồng và làm người dùng
          tưởng một địa bàn chỉ thuộc một CQT. */}
      {tab !== "tms-breakdown" && locationField}

      <label className="dfilter-budget">
        <span>Cấp ngân sách</span>
        <select
          value={filters.budgetLevel}
          onChange={(event) => {
            const budgetLevel = event.target.value as typeof filters.budgetLevel;
            setFilters({ budgetLevel });
            if (tab === "tms-breakdown") {
              setManagementLevel(
                budgetLevel === "NSTW" ? "trung-uong" : budgetLevel === "NSDP" ? "dia-phuong" : "all",
              );
            }
          }}
        >
          <option value="NSNN">Tổng NSNN</option>
          <option value="NSTW">NSTW</option>
          <option value="NSDP">NSĐP</option>
        </select>
      </label>

      {tab === "tms-breakdown" && (
        <div className="dfilter-tax-office">
          <AutocompleteSelect
            id="tms-tax-office"
            label="Cơ quan thuế"
            value={taxOfficeCode ?? ""}
            options={taxOfficeOptions}
            placeholder="Tìm mã hoặc tên cơ quan"
            onChange={(code) => setTaxOfficeCode(code || null)}
          />
        </div>
      )}

      {/* Ở TAB Mã hạch toán thì ô này không hiện.
       *
       * Tab đó có thanh phân đoạn "Cấp quản lý của Chương" buộc vào đúng cùng
       * một state, cách ô này chừng 100px — cùng bộ lựa chọn, cùng kết quả, hai
       * điều khiển. Và bản trong tab tốt hơn: nó tách hai bậc (địa phương rồi
       * mới tới tỉnh/huyện/xã) thay vì trộn thành một danh sách phẳng, và nó
       * mang được câu giải thích "cấp của Chương, không phải cấp của địa bàn" —
       * thứ ô chọn trong thanh lọc chỉ nhét được vào `title`.
       *
       * Ô này vẫn giữ ở các tab khác, nơi nó làm việc KHÁC: chọn một cấp là
       * điều hướng sang Mã hạch toán. Nghịch lý là chính thành công của nó lại
       * thả người dùng vào màn hình có bản sao của nó — nên đúng ở đó thì nó
       * lui. */}
      {tab !== "tms-breakdown" && managementField}

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
            title="Đặt lại về Tháng 8/2026, Trong kỳ, Tổng NSNN, toàn thành phố và tất cả cấp quản lý"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}
    </section>
  );
}
