import { useEffect, useState } from "react";
import { LOCATION_BY_ID, ALL_PERIODS, LOCATIONS, YEARS, latestMonth } from "@/domain/catalog";
import { TAX_OFFICE_ENTITIES, taxOfficeCodeLabel } from "@/domain/tms";
import { gridMembersOf } from "@/domain/report";
import { periodCount } from "@/domain/metrics";
import { DEFAULT_FILTERS, useDashboardState } from "@/state/DashboardState";
import { useHostContext } from "@/host/HostContext";
import type { AccumulationMode, DashboardFilters, PeriodType } from "@/domain/types";
import { Segmented } from "@/components/primitives";
import { AutocompleteSelect } from "@/components/AutocompleteSelect";

type ScopeKind = "city" | "tax-office" | "location";

/** Danh mục con tách riêng để ô thứ hai chỉ chứa đúng một loại đối tượng. */
const taxOfficeScopeOptions = [...TAX_OFFICE_ENTITIES]
    .sort((a, b) => {
      const aNumber = Number(a.name.match(/cơ sở\s+(\d+)/i)?.[1] ?? Infinity);
      const bNumber = Number(b.name.match(/cơ sở\s+(\d+)/i)?.[1] ?? Infinity);
      return aNumber - bNumber || a.id.localeCompare(b.id);
    })
    .map((office) => ({
      value: office.id,
      label: office.name,
      search: taxOfficeCodeLabel(office.id),
    }));
const locationScopeOptions = [...LOCATIONS]
    .sort((a, b) => a.name.localeCompare(b.name, "vi"))
    .map((item) => ({
      value: item.id,
      label: item.name,
      search: item.id,
    }));
const cityScopeOptions = [{ value: "city", label: "Toàn thành phố" }];


/**
 * Bộ lọc chung, giữ nguyên khi chuyển tab.
 *
 * Danh sách kỳ chỉ liệt kê kỳ **thực sự có dữ liệu**, nên không thể chọn một kỳ
 * tương lai rồi diễn giải dữ liệu thiếu thành 0.
 */
export function FilterBar() {
  const { tab, section, filters, location, taxOfficeCode, resetFilters, setFilters, setTab, setSection, setTaxOfficeCode, setLocationScope, dispatchIntent } =
    useDashboardState();
  const { host, embedded, postToHost } = useHostContext();
  const count = periodCount(filters);
  const periods = Array.from({ length: count }, (_, i) => i + 1);
  const periodLabel = filters.periodType === "MONTH" ? "Tháng" : "Quý";
  const allPeriods = filters.period === ALL_PERIODS;
  const [open, setOpen] = useState(false);
  const [scopeKind, setScopeKind] = useState<ScopeKind>(
    taxOfficeCode ? "tax-office" : location ? "location" : "city",
  );
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
  // Một ô `Phạm vi` cho cả ba nhóm, nên dòng phụ cũng đọc theo đúng thứ tự đó:
  // đơn vị thuế, rồi phường/xã, rồi toàn thành phố.
  const selectedTaxOffice = TAX_OFFICE_ENTITIES.find((office) => office.id === taxOfficeCode) ?? null;
  const scopeLine =
    selectedTaxOffice?.name ??
    (location ? (LOCATION_BY_ID[location]?.name ?? location) : "Toàn thành phố");

  // Đồng bộ khi phạm vi đổi từ URL, card hoặc điều hướng. Khi người dùng vừa
  // chọn một LOẠI mới mà chưa chọn giá trị con, giữ nguyên loại đó để họ hoàn
  // tất ở ô kế bên.
  useEffect(() => {
    if (taxOfficeCode) setScopeKind("tax-office");
    else if (location) setScopeKind("location");
    else if (tab === "overview") setScopeKind("city");
  }, [location, tab, taxOfficeCode]);

  // Địa bàn tính vào "đã đổi" vì nó là một ô trong chính thanh lọc này. Bỏ sót
  // nó thì chọn một phường xong nút vẫn xám, và người dùng đọc ra là nút hỏng.
  const isDefaultFilter =
    location === null &&
    taxOfficeCode === null &&
    scopeKind === "city" &&
    (Object.keys(DEFAULT_FILTERS) as (keyof DashboardFilters)[]).every(
      (key) => filters[key] === DEFAULT_FILTERS[key],
    );

  const showIndustryFilter =
    tab === "overview" ||
    tab === "revenue-analysis" ||
    (tab === "location-detail" && location !== null && taxOfficeCode === null);
  const industryDisabled = tab === "revenue-analysis" && section !== "domestic";
  const revenueGroup = tab === "revenue-analysis" ? section : "all";
  const industryOptions = [
    { value: "", label: "Tất cả ngành nghề" },
    ...gridMembersOf("industry").map((member) => ({ value: member.id, label: member.name })),
  ];

  const scopeValue = scopeKind === "tax-office" ? (taxOfficeCode ?? "") : scopeKind === "location" ? (location ?? "") : "city";
  const scopeOptions = scopeKind === "tax-office" ? taxOfficeScopeOptions : scopeKind === "location" ? locationScopeOptions : cityScopeOptions;
  const scopePlaceholder = scopeKind === "tax-office" ? "Tìm mã hoặc tên đơn vị thuế" : scopeKind === "location" ? "Tìm mã hoặc tên phường/xã" : "Toàn thành phố";

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
            {/* Dòng phụ nói phạm vi ĐỊA LÝ đang xem. Trước đây nó đọc nhãn cấp
                quản lý — một chiều đã bỏ cùng tab phân rã mã hạch toán. */}
            <small title={scopeLine}>{scopeLine}</small>
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

      <label className="dfilter-scope-kind">
        <span>Loại phạm vi</span>
        <select
          id="pham-vi-loai"
          value={scopeKind}
          onChange={(event) => {
            const next = event.target.value as ScopeKind;
            setScopeKind(next);
            setTaxOfficeCode(null);
            setLocationScope(null);
            setFilters({ industry: null });
            if (next === "city") setTab("overview");
          }}
        >
          <option value="city">Toàn thành phố</option>
          <option value="tax-office">Đơn vị thuế</option>
          <option value="location">Địa bàn hành chính</option>
        </select>
      </label>

      {/*
        Toàn thành phố thì KHÔNG có ô chi tiết.

        Trước đây ô này vẫn hiện, chỉ bị khoá. Một ô xám nằm giữa thanh lọc vẫn
        chiếm chỗ của một điều khiển và vẫn mời người dùng thử bấm vào; nó chỉ
        có nghĩa cho hai lựa chọn kia của `Loại phạm vi`, nên khi không ở hai
        lựa chọn đó thì nó không có việc gì để làm ở trên màn hình.
      */}
      {scopeKind !== "city" && (
      <div className="dfilter-location dfilter-scope-value">
        <AutocompleteSelect
          id="pham-vi-chi-tiet"
          label="Chi tiết phạm vi"
          value={scopeValue}
          options={scopeOptions}
          placeholder={scopePlaceholder}
          onChange={(value) => {
            if (scopeKind === "tax-office") {
              setLocationScope(null);
              setTaxOfficeCode(value);
              setTab("location-detail");
              return;
            }
            if (scopeKind === "location") {
              setTaxOfficeCode(null);
              setFilters({ industry: null });
              dispatchIntent({ type: "OPEN_LOCATION_DETAIL", locationId: value });
            }
          }}
        />
      </div>
      )}

      <label className="dfilter-budget">
        <span>Cấp ngân sách</span>
        <select
          disabled={taxOfficeCode !== null}
          title={
            taxOfficeCode !== null
              ? "Cơ quan thuế quản lý và giao chỉ tiêu theo tổng số thu thực tế phát sinh."
              : undefined
          }
          value={filters.budgetLevel}
          onChange={(event) => {
            const budgetLevel = event.target.value as typeof filters.budgetLevel;
            setFilters({ budgetLevel });
          }}
        >
          <option value="NSNN">Tổng NSNN</option>
          <option value="NSTW">NSTW</option>
          <option value="NSDP">NSĐP</option>
        </select>
      </label>

      <label className="dfilter-indicator">
        <span>Nhóm chỉ tiêu</span>
        <select
          disabled={location !== null || taxOfficeCode !== null}
          title={
            location !== null
              ? "Địa bàn cơ sở được xem theo toàn bộ nguồn thu nội địa phát sinh."
              : taxOfficeCode !== null
                ? "Đơn vị thuế được xem theo tổng số thu quản lý."
                : undefined
          }
          value={revenueGroup}
          onChange={(event) => {
            const value = event.target.value as "all" | "domestic" | "import-export" | "other";
            if (value === "all") {
              setFilters({ industry: null });
              if (location === null && taxOfficeCode === null) setTab("overview");
              return;
            }
            setSection(value);
            setFilters({ industry: value === "domestic" ? filters.industry : null });
            setTab("revenue-analysis");
          }}
        >
          <option value="all">Tất cả</option>
          <option value="domestic">Thu nội địa không kể dầu thô</option>
          <option value="import-export">Thu xuất nhập khẩu</option>
          <option value="other">Thu khác</option>
        </select>
      </label>

      {/*
        Ngành nghề là lát cắt MÔ PHỎNG, và màn hình phải nói ra điều đó.

        Kho quan sát không mang thuộc tính ngành trên từng giao dịch; danh bạ có
        ngành nhưng cho số DÒNG chứ không cho số tiền. Nên chọn một ngành là chia
        tất định từ tổng thật xuống, không phải lọc. Ghi thẳng vào nhãn chứ không
        giấu trong `title`: người đọc con số phải thấy điều này cùng lúc với con
        số, không phải khi rê chuột.
      */}
      {/* Đặc tả 23-09 chỉ nêu ngành nghề ở Tổng quan và view phường/xã. View
          CQT cùng tab Chi tiết không có khối ngành, nên cũng không hiện ô này. */}
      {showIndustryFilter && (
        <div
          className="dfilter-industry"
          title={industryDisabled ? "Thu xuất nhập khẩu và Thu khác không có mã ngành TMS." : undefined}
        >
          <AutocompleteSelect
            id="nganh-nghe"
            label="Ngành nghề kinh doanh"
            value={filters.industry ?? ""}
            options={industryOptions}
            placeholder="Tìm mã hoặc tên ngành"
            disabled={industryDisabled}
            onChange={(industry) => {
              const next = industry || null;
              setFilters({ industry: next });
              if (next && !(tab === "location-detail" && location !== null)) {
                setSection("domestic");
                setTab("revenue-analysis");
              }
            }}
          />
          <em className="dfilter-mock">Tạm thời</em>
        </div>
      )}

      {/* Render ở mọi ngữ cảnh. Trước đây điều kiện `open` khiến nút chỉ tồn tại
          ở bản thu gọn, nên desktop rộng — nơi bày cả sáu điều khiển cùng lúc và
          cũng là nơi dễ lạc bộ lọc nhất — hoàn toàn không có đường về mặc định. */}
      {(
        <div className="dfilters-reset-row">
          <button
            type="button"
            className="dfilters-reset"
            onClick={() => {
              setScopeKind("city");
              resetFilters();
            }}
            disabled={isDefaultFilter}
            title="Đặt lại về Tháng 8/2026, Lũy kế, Tổng NSNN và toàn thành phố"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}
    </section>
  );
}
