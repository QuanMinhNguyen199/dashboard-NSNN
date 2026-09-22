import { useState } from "react";
import { LOCATION_BY_ID, ALL_PERIODS, LOCATIONS, YEARS, latestMonth } from "@/domain/catalog";
import { TAX_OFFICE_ENTITIES, taxOfficeCodeLabel } from "@/domain/tms";
import { periodCount } from "@/domain/metrics";
import { DEFAULT_FILTERS, useDashboardState } from "@/state/DashboardState";
import { useHostContext } from "@/host/HostContext";
import type { AccumulationMode, DashboardFilters, PeriodType } from "@/domain/types";
import { Segmented } from "@/components/primitives";
import { AutocompleteSelect } from "@/components/AutocompleteSelect";

const taxOfficeOptions = [
  { value: "", label: "Tất cả cơ quan thuế" },
  // Một dòng cho mỗi CƠ QUAN, không phải mỗi mã. Nhãn giữ đủ mã nguồn để người
  // dùng đối chiếu được với chứng từ bên TMS mà không phải đoán số đã gộp.
  ...[...TAX_OFFICE_ENTITIES]
    .sort((a, b) => {
      const aNumber = Number(a.name.match(/cơ sở\s+(\d+)/i)?.[1] ?? Infinity);
      const bNumber = Number(b.name.match(/cơ sở\s+(\d+)/i)?.[1] ?? Infinity);
      return aNumber - bNumber || a.id.localeCompare(b.id);
    })
    .map((office) => ({ value: office.id, label: `${taxOfficeCodeLabel(office.id)} · ${office.name}` })),
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
  const selectedTaxOffice = TAX_OFFICE_ENTITIES.find((office) => office.id === taxOfficeCode) ?? null;
  const scopeLine =
    tab === "tms-breakdown"
      ? (selectedTaxOffice?.name ?? "Tất cả cơ quan thuế")
      : (location ? (LOCATION_BY_ID[location]?.name ?? location) : "Toàn thành phố");

  // Địa bàn tính vào "đã đổi" vì nó là một ô trong chính thanh lọc này. Bỏ sót
  // nó thì chọn một phường xong nút vẫn xám, và người dùng đọc ra là nút hỏng.
  const isDefaultFilter =
    location === null &&
    managementLevel === "all" &&
    (tab !== "tms-breakdown" || taxOfficeCode === null) &&
    (Object.keys(DEFAULT_FILTERS) as (keyof DashboardFilters)[]).every(
      (key) => filters[key] === DEFAULT_FILTERS[key],
    );

  /**
   * `data-keep` = ô này Ở LẠI khi panel lọc thu gọn.
   *
   * Ô nào ở lại phụ thuộc vào TAB, vì mỗi tab có một chiều điều khiển chính
   * khác nhau, và thanh lọc này đã đổi thành phần theo tab sẵn rồi: Mã hạch
   * toán thay cặp địa bàn + cấp quản lý bằng ô cơ quan thuế. Danh sách cũ nằm
   * trong CSS và kể tên từng lớp, nên ở tab đó **không ô nào** được miễn — thu
   * gọn panel là mất luôn ô cơ quan thuế, đúng thứ cả tab xoay quanh.
   *
   * Đánh dấu ở đây chứ không kể tên lớp trong CSS: quyết định "ô nào quan trọng
   * ở tab nào" nằm cùng chỗ với logic tab, và thêm một tab mới thì không phải
   * nhớ sang sửa một danh sách ở tệp khác.
   */
  /** Chọn địa bàn là lối điều hướng sang tab chi tiết; tab Mã hạch toán đi từ CQT xuống địa bàn phụ trách. */
  const locationField = (
    <div className="dfilter-location" data-keep="">
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
                quản lý, nhưng cấp quản lý không còn là ô của thanh lọc chung —
                nó thuộc về tab Mã hạch toán, nơi có thanh riêng của nó. */}
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
        <div className="dfilter-tax-office" data-keep="">
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
