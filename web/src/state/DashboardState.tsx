import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ALL_PERIODS,
  INDICATORS,
  LOCATION_BY_ID,
  firstComparableTo,
  sameAllocationScope,
  YEARS,
  type IndicatorSlug,
  type DomesticGroupId,
  type SourceCode,
} from "@/domain/catalog";
import { periodCount } from "@/domain/metrics";
import { TAX_OFFICE_ENTITY_BY_CODE } from "@/domain/tms";
import { gridMembersOf } from "@/domain/report";
import { groupFromUrl, groupUrlId, sourceFromUrl, sourceUrlId } from "@/domain/urlIds";
import type {
  AdvancedComparisonMode,
  DashboardFilters,
  DashboardNavigationAction,
  TabId,
  ReportMode,
} from "@/domain/types";

/**
 * Nơi duy nhất sở hữu và đồng bộ URL state.
 *
 * Không component nào khác được đọc hay ghi `location.search`. Bộ lọc chung được
 * giữ nguyên khi chuyển tab; tham số riêng của tab chỉ xuất hiện khi tab đó đang mở.
 * Mở drawer dùng `pushState` để Back đóng drawer mà không mất bộ lọc.
 */

const TABS: TabId[] = [
  "overview",
  "report",
  "revenue-analysis",
  "location-detail",
  "advanced-compare",
];
const REPORT_MODES: ReportMode[] = ["nsnn", "budget", "taxpayer", "inspection"];

/**
 * Ba URL tạm của lượt trước chuyển thẳng sang chế độ báo cáo tương ứng.
 *
 * Lượt trước ba mảng này là tab cấp cao và đã sinh ra link thật. Bỏ chúng khỏi
 * `TABS` mà không xử lý gì thì `one("tab", TABS, "overview")` âm thầm đưa về
 * Tổng quan — người bấm link cũ không thấy màn hình trắng, nhưng thấy một màn
 * hình KHÁC mà không hiểu vì sao, và đó còn khó chịu hơn.
 *
 * Bảng này đọc ở `readUrl` nên redirect xảy ra ngay lúc dựng state, trước khi
 * render. `writeUrl` sau đó ghi lại đường dẫn chuẩn, nên Back và Forward đi qua
 * đúng một mục lịch sử cho mỗi lần điều hướng.
 */
const LEGACY_TAB_TO_REPORT: Record<string, ReportMode> = {
  "budget-forecast": "budget",
  enterprise: "taxpayer",
  inspection: "inspection",
};

const MODES: AdvancedComparisonMode[] = ["period", "revenue", "location"];
const VIEWS = ["overview", "ranking", "waterfall"] as const;
export type AnalysisView = (typeof VIEWS)[number];

export interface DashboardUrlState {
  tab: TabId;
  reportMode: ReportMode;
  filters: DashboardFilters;
  /** Tab Phân tích thu */
  section: SourceCode;
  view: AnalysisView;
  group: DomesticGroupId;
  /** Tab Chi tiết địa bàn */
  location: string | null;
  /** Đơn vị thuế đang lọc ở ô `Phạm vi`; loại trừ nhau với `location`. */
  taxOfficeCode: string | null;
  /** Drawer xem nhanh nguồn thu */
  panelSource: SourceCode | null;
  /** Tab So sánh nâng cao */
  mode: AdvancedComparisonMode;
  periodA: string;
  periodB: string;
  compareSource: SourceCode;
  compareSourceB: SourceCode;
  locationA: string | null;
  locationB: string | null;
}

export const DEFAULT_FILTERS: DashboardFilters = {
  year: 2026,
  periodType: "MONTH",
  period: 8,
  /*
    Mở lên là `Trong kỳ`, không phải `Lũy kế`.

    Đặc tả 25-09 ghi `Lũy kế` là mặc định; người dùng chọn ngược lại. Câu hỏi
    đầu tiên khi mở dashboard là "tháng này thu được bao nhiêu", còn lũy kế là
    câu hỏi thứ hai — và chỉ cách một cú gạt.

    Kéo theo: thẻ KPI nổi bật là "Tổng thu trong kỳ", và thẻ thứ tư đo trên kế
    hoạch của riêng kỳ chứ không trên dự toán cả năm (xem `estimateOf`).
  */
  accumulation: "PERIOD",
  indicator: "tong-so",
  budgetLevel: "NSNN",
  industry: null,
};

/**
 * Đặc tả 23-09 chỉ dùng ngành nghề ở Tổng quan và view PHƯỜNG/XÃ.
 *
 * View CQT trong cùng tab Chi tiết không có khối ngành; ba tab còn lại cũng
 * không nêu chiều này. Dùng chung một hàm cho URL, điều hướng và thanh lọc để
 * không có trạng thái "lọc ngầm" sau khi ô đã biến mất.
 */
export const supportsIndustryFilter = (
  tab: TabId,
  location: string | null,
  taxOfficeCode: string | null,
  section: SourceCode = "domestic",
) =>
  tab === "overview" ||
  (tab === "revenue-analysis" && section === "domestic") ||
  (tab === "location-detail" && location !== null && taxOfficeCode === null);

/** Kỳ mới nhất thực sự có dữ liệu — không bao giờ mặc định vào kỳ tương lai. */
function clampPeriod(filters: DashboardFilters): DashboardFilters {
  if (filters.period === ALL_PERIODS) return filters;
  const max = periodCount(filters);
  return { ...filters, period: Math.min(Math.max(filters.period, 1), Math.max(max, 1)) };
}

function readUrl(search: string): DashboardUrlState {
  const q = new URLSearchParams(search);
  const num = (key: string, fallback: number) => {
    const value = Number(q.get(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };
  const one = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const value = q.get(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  };

  const year = YEARS.includes(num("year", 2026) as (typeof YEARS)[number])
    ? num("year", 2026)
    : DEFAULT_FILTERS.year;
  const periodType = one("periodType", ["MONTH", "QUARTER"] as const, DEFAULT_FILTERS.periodType);
  const filters = clampPeriod({
    year,
    periodType,
    // `num` chỉ nhận số dương nên phải đọc riêng: 0 là "tất cả các kỳ", hợp lệ.
    period: q.get("period") === String(ALL_PERIODS)
      ? ALL_PERIODS
      : num("period", periodType === "MONTH" ? 8 : 2),
    accumulation: one("acc", ["PERIOD", "YTD"] as const, DEFAULT_FILTERS.accumulation),
    indicator: one(
      "indicator",
      INDICATORS.map((i) => i.slug) as readonly IndicatorSlug[],
      DEFAULT_FILTERS.indicator,
    ),
    budgetLevel: one("level", ["NSNN", "NSTW", "NSDP"] as const, DEFAULT_FILTERS.budgetLevel),
    // Mã ngành lạ đưa về `null` thay vì giữ nguyên chuỗi: một mã không có trong
    // danh mục sẽ lọc ra rỗng, và màn hình trống không nói được vì sao trống.
    industry: (() => {
      const raw = q.get("nganh");
      return raw && gridMembersOf("industry").some((m) => m.id === raw) ? raw : null;
    })(),
  });

  const locationOf = (key: string) => {
    const raw = q.get(key);
    return raw && raw in LOCATION_BY_ID ? raw : null;
  };

  // URL tạm của lượt trước: đổi thành tab `report` kèm đúng chế độ.
  const rawTab = q.get("tab") ?? "";
  const legacyMode = LEGACY_TAB_TO_REPORT[rawTab];

  const tab = legacyMode ? "report" : one("tab", TABS, "overview");
  /*
    Cùng luật với `setTab`, áp cả cho đường dẫn dán thẳng vào thanh địa chỉ.

    Một liên kết cũ dạng `?tab=report&nganh=dich-vu` mà chỉ giấu ô lọc thì cả
    tab Báo cáo đang bày số của một ngành, không chỗ nào nói ra, không chỗ nào
    tắt được. `writeUrl` viết lại URL ngay sau đó nên đường dẫn cũng thôi nói
    sai. Tổng quan tương tự: nó luôn là toàn thành phố.
  */
  const location = tab === "overview" ? null : locationOf("location");
  const taxOfficeCode = (() => {
    // Đường dẫn cũ có thể mang mã phụ (0127, 0151…). Quy về mã đại diện thay
    // vì trả null: người dùng đã lưu đường dẫn đó, và bỏ lọc im lặng thì họ
    // đọc số toàn thành phố như số của một cơ quan.
    if (tab === "overview") return null;
    const code = q.get("cqt");
    return code ? (TAX_OFFICE_ENTITY_BY_CODE[code] ?? null) : null;
  })();
  const section = sourceFromUrl(q.get("section"), "domestic");
  const scopedFilters = supportsIndustryFilter(tab, location, taxOfficeCode, section)
    ? filters
    : { ...filters, industry: null };

  return {
    tab,
    // Giá trị ngoài danh sách đóng luôn về mặc định, không giữ nguyên chuỗi lạ.
    reportMode: legacyMode ?? one("report", REPORT_MODES, "nsnn"),
    filters: scopedFilters,
    section,
    view: one("view", VIEWS, "overview"),
    group: groupFromUrl(q.get("group"), "sxkd"),
    location,
    taxOfficeCode,
    panelSource: q.get("panel") === "revenue-preview" ? sourceFromUrl(q.get("source"), "domestic") : null,
    mode: one("mode", MODES, "period"),
    periodA: q.get("periodA") ?? "2025m8",
    periodB: q.get("periodB") ?? "2026m8",
    compareSource: sourceFromUrl(q.get("source"), "domestic"),
    compareSourceB: sourceFromUrl(q.get("sourceB"), "other"),
    locationA: locationOf("locationA"),
    locationB: locationOf("locationB"),
  };
}

function writeUrl(state: DashboardUrlState): string {
  const q = new URLSearchParams();
  // `host` và `platform` là ngữ cảnh tích hợp, không phải dashboard state.
  // Giữ chúng qua mọi lần đồng bộ URL để bản mobile fallback vẫn đúng khi reload.
  // `latency` là công tắc trễ mô phỏng: cũng phải sống sót, vì chính hàm này
  // viết lại đường dẫn trước khi lớp dữ liệu kịp đọc tham số.
  const integration = new URLSearchParams(window.location.search);
  for (const key of ["host", "platform", "latency"] as const) {
    const value = integration.get(key);
    if (value) q.set(key, value);
  }
  q.set("tab", state.tab);
  q.set("year", String(state.filters.year));
  q.set("periodType", state.filters.periodType);
  q.set("period", String(state.filters.period));
  q.set("acc", state.filters.accumulation);
  q.set("level", state.filters.budgetLevel);
  q.set("indicator", state.filters.indicator);

  // Chỉ ghi `report` khi đang ở tab Báo cáo: để nó bám theo mọi tab thì URL của
  // năm tab kia mang một tham số không ảnh hưởng gì tới nội dung chúng hiển thị.
  if (state.tab === "report") q.set("report", state.reportMode);

  if (state.tab === "revenue-analysis") {
    q.set("section", sourceUrlId(state.section));
    q.set("view", state.view);
    if (state.section === "domestic") q.set("group", groupUrlId(state.group));
  }
  /**
   * `Phạm vi` vào URL ở MỌI tab, vì nó là bộ lọc DÙNG CHUNG.
   *
   * Trước đây địa bàn chỉ được ghi ở hai tab và cơ quan thuế chỉ ở một tab, vì
   * chúng là hai ô riêng của riêng tab đó. Giờ cả hai là hai nhánh của cùng một
   * ô trên thanh lọc chung: bỏ tham số ở tab nào thì tải lại trang là phạm vi
   * biến mất trong khi thanh lọc vẫn vẽ ra nó, và liên kết gửi cho người khác mở
   * ra một phạm vi khác với cái người gửi đang nhìn.
   *
   * Hai nhánh loại trừ nhau, nên không bao giờ có cả `location` lẫn `cqt`.
   */
  if (state.filters.industry) q.set("nganh", state.filters.industry);
  if (state.location) q.set("location", state.location);
  if (state.taxOfficeCode) q.set("cqt", state.taxOfficeCode);
  if (state.tab === "advanced-compare") {
    q.set("mode", state.mode);
    if (state.mode === "period") {
      q.set("periodA", state.periodA);
      q.set("periodB", state.periodB);
    } else if (state.mode === "revenue") {
      q.set("source", sourceUrlId(state.compareSource));
      q.set("sourceB", sourceUrlId(state.compareSourceB));
    } else {
      if (state.locationA) q.set("locationA", state.locationA);
      if (state.locationB) q.set("locationB", state.locationB);
    }
  }
  if (state.panelSource) {
    q.set("panel", "revenue-preview");
    q.set("source", sourceUrlId(state.panelSource));
  }
  return `?${q.toString()}`;
}

interface DashboardContextValue extends DashboardUrlState {
  setFilters: (patch: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  setTab: (tab: TabId) => void;
  setSection: (section: SourceCode) => void;
  /** Đổi loại báo cáo bên trong tab Báo cáo. */
  setReportMode: (mode: ReportMode) => void;
  setView: (view: AnalysisView) => void;
  setGroup: (group: DomesticGroupId) => void;
  selectLocation: (id: string | null) => void;
  /** Đổi phạm vi địa bàn mà KHÔNG đổi tab; dùng ở tab tự đọc được địa bàn. */
  setLocationScope: (id: string | null) => void;
  setTaxOfficeCode: (code: string | null) => void;
  openPreview: (source: SourceCode) => void;
  closePreview: () => void;
  setMode: (mode: AdvancedComparisonMode) => void;
  setCompare: (patch: Partial<Pick<DashboardUrlState, "periodA" | "periodB" | "compareSource" | "compareSourceB" | "locationA" | "locationB">>) => void;
  /** Chuyển một intent đã whitelist thành điều hướng nội bộ. */
  dispatchIntent: (action: DashboardNavigationAction) => void;
}

const Ctx = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardUrlState>(() => readUrl(window.location.search));
  /** Chỉ drawer dùng pushState; mọi thay đổi khác dùng replaceState. */
  const pushNext = useRef(false);

  useEffect(() => {
    const url = writeUrl(state);
    if (pushNext.current) {
      pushNext.current = false;
      window.history.pushState(null, "", url);
    } else if (url !== window.location.search) {
      window.history.replaceState(null, "", url);
    }
  }, [state]);

  // Back/Forward của trình duyệt là nguồn sự thật: đọc lại URL, không đoán.
  useEffect(() => {
    const onPop = () => setState(readUrl(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const patch = useCallback((next: Partial<DashboardUrlState>) => {
    setState((current) => ({ ...current, ...next }));
  }, []);

  const value = useMemo<DashboardContextValue>(
    () => ({
      ...state,
      setFilters: (next) =>
        setState((current) => {
          const merged = { ...current.filters, ...next };
          // Đổi năm hoặc loại kỳ thì phải kiểm tra lại kỳ đang chọn.
          return {
            ...current,
            filters: clampPeriod(merged),
            panelSource: null,
          };
        }),
      // "Đặt lại bộ lọc" phải đưa MỌI thứ người dùng đã đổi về mặc định, kể cả
      // địa bàn đang chọn — mặc định của nó là "Toàn thành phố". Trước đây reset
      // chỉ chạm `filters`, nên chọn một phường xong bấm đặt lại thì không có gì
      // xảy ra và nút trông như hỏng.
      resetFilters: () =>
        setState((current) => ({
          ...current,
          filters: { ...DEFAULT_FILTERS },
          location: null,
          taxOfficeCode: null,
          tab: current.tab === "location-detail" ? "overview" : current.tab,
          panelSource: null,
        })),
      /*
        Vào một tab thì bộ lọc phải đúng với tab đó.

        · **Tổng quan** luôn là toàn thành phố, nên bỏ CẢ HAI nhánh của ô
          `Phạm vi` — địa bàn và đơn vị thuế. Trước đây chỉ bỏ địa bàn, nên đi
          từ trang một đơn vị thuế về Tổng quan thì ô lọc vẫn ghi tên đơn vị đó
          trong khi màn hình bày số toàn thành phố: hai câu trả lời cho một câu
          hỏi, và con số là cái người đọc tin.
        · **Ngành nghề** chỉ có ở Tổng quan và view phường/xã theo đặc tả
          23-09. Sang tab khác hoặc view CQT phải xoá giá trị luôn chứ không chỉ
          giấu ô; nếu không số vẫn bị lọc mà màn hình không có cách tắt.
      */
      setTab: (tab) =>
        setState((current) => {
          const location = tab === "overview" ? null : current.location;
          const taxOfficeCode = tab === "overview" ? null : current.taxOfficeCode;
          return {
            ...current,
            tab,
            location,
            taxOfficeCode,
            filters: supportsIndustryFilter(tab, location, taxOfficeCode, current.section)
              ? current.filters
              : { ...current.filters, industry: null },
            panelSource: null,
          };
        }),
      setSection: (section) =>
        setState((current) => ({
          ...current,
          section,
          filters:
            section === "domestic"
              ? current.filters
              : { ...current.filters, industry: null },
        })),
      setReportMode: (reportMode) => patch({ reportMode }),
      setView: (view) => patch({ view }),
      setGroup: (group) => patch({ group }),
      setTaxOfficeCode: (taxOfficeCode) =>
        setState((current) => ({
          ...current,
          taxOfficeCode,
          filters: taxOfficeCode
            ? { ...current.filters, industry: null, budgetLevel: "NSNN" }
            : current.filters,
        })),
      selectLocation: (location) =>
        setState((current) => ({
          ...current,
          location,
          taxOfficeCode: location ? null : current.taxOfficeCode,
          tab: location ? "location-detail" : current.tab,
          filters: location ? current.filters : { ...current.filters, industry: null },
        })),
      setLocationScope: (location) =>
        setState((current) => ({
          ...current,
          location,
          filters: location || current.tab === "overview"
            ? current.filters
            : { ...current.filters, industry: null },
        })),
      openPreview: (panelSource) => {
        pushNext.current = true;
        patch({ panelSource });
      },
      closePreview: () => {
        // Đóng bằng nút hoặc Escape thì lùi lại đúng một bước để Back và nút đóng
        // để lại cùng một lịch sử.
        if (window.history.state !== null || window.location.search.includes("panel="))
          window.history.back();
        else patch({ panelSource: null });
      },
      setMode: (mode) => patch({ mode }),
      // Đổi vế A có thể làm vế B thành cặp không ghép được. Kéo B về một nguồn
      // hợp lệ ngay tại đây thay vì để màn hình lỗi báo hộ: người dùng vừa đổi
      // đúng thứ họ định đổi, không có lý do gì phải xử lý hậu quả.
      setCompare: (next) =>
        setState((current) => {
          const merged = { ...current, ...next };
          if (next.compareSource && !sameAllocationScope(merged.compareSource, merged.compareSourceB))
            merged.compareSourceB = firstComparableTo(merged.compareSource);
          return merged;
        }),
      dispatchIntent: (action) => {
        switch (action.type) {
          case "OPEN_REVENUE_PREVIEW":
            pushNext.current = true;
            patch({ panelSource: action.sourceId as SourceCode });
            break;
          case "OPEN_REVENUE_ANALYSIS":
            setState((current) => ({
              ...current,
              tab: "revenue-analysis",
              filters: { ...current.filters, industry: null },
              section: action.sourceId as SourceCode,
              view: action.view ?? "overview",
              panelSource: null,
            }));
            break;
          case "OPEN_LOCATION_DETAIL":
            setState((current) => ({
              ...current,
              tab: "location-detail",
              location: action.locationId,
              taxOfficeCode: null,
              panelSource: null,
            }));
            break;
          case "OPEN_ADVANCED_COMPARISON":
            setState((current) => {
              const [a, b] = action.entityIds;
              if (action.mode === "location")
                return { ...current, tab: "advanced-compare", filters: { ...current.filters, industry: null }, mode: "location", locationA: a ?? null, locationB: b ?? null, panelSource: null };
              if (action.mode === "revenue")
                return {
                  ...current,
                  tab: "advanced-compare",
                  filters: { ...current.filters, industry: null },
                  mode: "revenue",
                  compareSource: (a as SourceCode) ?? current.compareSource,
                  compareSourceB: (b as SourceCode) ?? current.compareSourceB,
                  panelSource: null,
                };
              return {
                ...current,
                tab: "advanced-compare",
                filters: { ...current.filters, industry: null },
                mode: "period",
                periodA: a ?? current.periodA,
                periodB: b ?? current.periodB,
                panelSource: null,
              };
            });
            break;
        }
      },
    }),
    [state, patch],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboardState(): DashboardContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboardState() phải gọi trong <DashboardProvider>");
  return ctx;
}
