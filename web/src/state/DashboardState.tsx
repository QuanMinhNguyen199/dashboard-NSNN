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
import { TAX_OFFICES, type ManagementLevelFilter } from "@/domain/tms";
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
  "tms-breakdown",
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

const MANAGEMENT_LEVELS_URL = ["all", "trung-uong", "dia-phuong", "tinh", "huyen", "xa", "unknown"] as const;

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
  /** Tab Mã hạch toán — bộ lọc cấp quản lý của Chương, không phải bậc danh mục. */
  managementLevel: ManagementLevelFilter;
  /** Tab Mã hạch toán — mã cơ quan thuế đang lọc. */
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
  accumulation: "PERIOD",
  indicator: "tong-so",
  budgetLevel: "NSNN",
};

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
  });

  const locationOf = (key: string) => {
    const raw = q.get(key);
    return raw && raw in LOCATION_BY_ID ? raw : null;
  };

  // URL tạm của lượt trước: đổi thành tab `report` kèm đúng chế độ.
  const rawTab = q.get("tab") ?? "";
  const legacyMode = LEGACY_TAB_TO_REPORT[rawTab];

  return {
    tab: legacyMode ? "report" : one("tab", TABS, "overview"),
    // Giá trị ngoài danh sách đóng luôn về mặc định, không giữ nguyên chuỗi lạ.
    reportMode: legacyMode ?? one("report", REPORT_MODES, "nsnn"),
    filters,
    section: sourceFromUrl(q.get("section"), "domestic"),
    view: one("view", VIEWS, "overview"),
    group: groupFromUrl(q.get("group"), "sxkd"),
    location: locationOf("location"),
    managementLevel: one("mgmt", MANAGEMENT_LEVELS_URL, "all"),
    taxOfficeCode: (() => {
      const code = q.get("cqt");
      return code && TAX_OFFICES.some((office) => office.code === code) ? code : null;
    })(),
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
   * Địa bàn vào URL ở MỌI tab đọc nó, không riêng Chi tiết phường/xã.
   *
   * Tab Mã hạch toán cũng lọc theo địa bàn, nên bỏ tham số ở đó nghĩa là tải lại
   * trang thì phạm vi biến mất còn thanh lọc thì vẫn vẽ ra nó — và liên kết gửi
   * cho người khác mở ra một phạm vi khác với cái người gửi đang nhìn.
   */
  if (state.location && (state.tab === "location-detail" || state.tab === "tms-breakdown"))
    q.set("location", state.location);
  if (state.tab === "tms-breakdown") {
    q.set("mgmt", state.managementLevel);
    if (state.taxOfficeCode) q.set("cqt", state.taxOfficeCode);
  }
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
  setManagementLevel: (level: ManagementLevelFilter) => void;
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
            // Cấp ngân sách hưởng và cấp quản lý của Chương là hai chiều độc
            // lập. Đổi NSTW/NSĐP không được tự đổi bộ lọc Chương.
            managementLevel: current.managementLevel,
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
          managementLevel: "all",
          taxOfficeCode: null,
          tab: current.tab === "location-detail" ? "overview" : current.tab,
          panelSource: null,
        })),
      // Về Tổng quan là về phạm vi toàn thành phố, nên bỏ luôn địa bàn đang chọn:
      // ô lọc "Chi tiết địa bàn" và tab đang đứng nói về CÙNG một thứ — phạm vi
      // đang xem — nên để chúng lệch nhau là bày ra hai câu trả lời cho một câu hỏi.
      setTab: (tab) =>
        setState((current) => ({
          ...current,
          tab,
          location: tab === "overview" ? null : current.location,
          panelSource: null,
        })),
      setSection: (section) => patch({ section }),
      setReportMode: (reportMode) => patch({ reportMode }),
      setView: (view) => patch({ view }),
      setGroup: (group) => patch({ group }),
      setManagementLevel: (managementLevel) => patch({ managementLevel }),
      setTaxOfficeCode: (taxOfficeCode) => patch({ taxOfficeCode }),
      selectLocation: (location) =>
        setState((current) => ({ ...current, location, tab: location ? "location-detail" : current.tab })),
      setLocationScope: (location) => patch({ location }),
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
              panelSource: null,
            }));
            break;
          case "OPEN_ADVANCED_COMPARISON":
            setState((current) => {
              const [a, b] = action.entityIds;
              if (action.mode === "location")
                return { ...current, tab: "advanced-compare", mode: "location", locationA: a ?? null, locationB: b ?? null, panelSource: null };
              if (action.mode === "revenue")
                return {
                  ...current,
                  tab: "advanced-compare",
                  mode: "revenue",
                  compareSource: (a as SourceCode) ?? current.compareSource,
                  compareSourceB: (b as SourceCode) ?? current.compareSourceB,
                  panelSource: null,
                };
              return {
                ...current,
                tab: "advanced-compare",
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
