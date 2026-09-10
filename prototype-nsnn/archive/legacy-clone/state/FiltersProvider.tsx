import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "../lib/api";
import { HISTORICAL_DISTRICTS } from "../lib/districts";
import { byVietnamese } from "../lib/format";
import {
  areaEra,
  hasPeriod,
  monthsInQuarter,
  parsePeriodToken,
  quartersInYear,
} from "../lib/periods";
import { ITEM_OPTIONS, parseUrl, serializeUrl } from "../lib/url";
import type {
  Acc,
  ApiParams,
  IgnoredParam,
  PeriodRow,
  TabKey,
  WardRow,
} from "../lib/types";
import { defaultFilters, periodCount } from "../overview/data";
import type { OverviewFilters } from "../overview/types";

/** `Ze` — parse URL đúng một lần lúc khởi động, như bundle gốc. */
const INITIAL = parseUrl(window.location.search);

/** `Az` — danh mục phường/xã, sort theo locale Việt. */
function useWardCatalog() {
  const [rows, setRows] = useState<WardRow[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<WardRow[]>("/api/wards")
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Danh mục địa bàn không đúng định dạng.");
        setRows([...data].sort(byVietnamese((r) => r.location_name)));
        setError(null);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setReady(true));
  }, []);

  return { rows, ready, error };
}

export interface FiltersValue {
  historicalAreas: boolean;
  district: string | null;
  districtName: string | null;
  selectDistrict: (slug: string | null) => void;
  catalogError: string | null;
  catalogReady: boolean;
  wardsReady: boolean;
  periodsReady: boolean;
  wardCatalog: WardRow[];
  year: string;
  quarter: string;
  month: string;
  acc: Acc;
  item: string;
  ward: string | null;
  tab: TabKey;
  years: number[];
  quartersInYear: number[];
  monthsInQuarter: number[];
  periods: PeriodRow[];
  setYear: (value: string) => void;
  setQuarter: (value: string) => void;
  setMonth: (value: string) => void;
  setAcc: (value: Acc) => void;
  setItem: (value: string) => void;
  selectWard: (code: string | null) => void;
  switchTab: (tab: TabKey) => void;
  apiParams: ApiParams;
  ignored: IgnoredParam[];
  clearIgnored: () => void;
  wardSlug: string | null;
  wardName: string | null;
  cmpa: string;
  cmpb: string;
  setCompare: (a: string, b: string) => void;
  overviewFilters: OverviewFilters;
  setOverviewFilters: (value: OverviewFilters) => void;
}

const Ctx = createContext<FiltersValue | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [overviewFilters, setOverviewFiltersState] = useState<OverviewFilters>(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedYear = Number(params.get("year")) || defaultFilters.year;
    const periodType = params.get("periodType") === "QUARTER" ? "QUARTER" : "MONTH";
    const max = periodCount({ year: selectedYear, periodType });
    const period = Math.min(Math.max(Number(params.get("period")) || (periodType === "MONTH" ? 8 : 2), 1), Math.max(max, 1));
    const level = params.get("level");
    const indicator = params.get("ovIndicator");
    return { year: selectedYear, periodType, period, acc: params.get("acc") === "YTD" ? "YTD" : "PERIOD", level: level === "NSTW" || level === "NSDP" ? level : "NSNN", indicator: indicator && ITEM_OPTIONS.some(option => option.value === indicator) ? indicator : defaultFilters.indicator };
  });
  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [year, setYearState] = useState(INITIAL.year ?? "");
  const [quarter, setQuarterState] = useState(INITIAL.quarter ?? "");
  const [month, setMonthState] = useState(INITIAL.month ?? "");
  const [acc, setAcc] = useState<Acc>(INITIAL.acc ?? "PERIOD");
  const [item, setItem] = useState(INITIAL.item ?? ITEM_OPTIONS[0].value);
  const [wardCode, setWardCode] = useState<string | null>(INITIAL.wardCode ?? null);
  const [tab, setTab] = useState<TabKey>(INITIAL.tab ?? "overview");
  const [cmpa, setCmpa] = useState(INITIAL.cmpa ?? "");
  const [cmpb, setCmpb] = useState(INITIAL.cmpb ?? "");
  const [ignored, setIgnored] = useState<IgnoredParam[]>(INITIAL.ignored);
  const [districtSlug, setDistrictSlug] = useState<string | null>(() => {
    const found = HISTORICAL_DISTRICTS.find(
      (d) => d.name_slug === INITIAL.district || d.location_code === INITIAL.district,
    );
    return found?.name_slug ?? null;
  });

  // Nhánh địa giới lịch sử — tab Compare luôn dùng danh mục phường/xã hiện tại.
  const historicalAreas = tab !== "compare" && areaEra(year, quarter, month) === "historical";
  const effectiveWard = historicalAreas ? null : wardCode;
  const effectiveDistrict = historicalAreas && tab === "detail" ? districtSlug : null;

  const [wardsSynced, setWardsSynced] = useState(false);
  const [periodsReady, setPeriodsReady] = useState(false);
  const [periodsError, setPeriodsError] = useState<string | null>(null);
  const { rows: wardCatalog, ready: wardsReady, error: wardsError } = useWardCatalog();

  const addIgnored = (param: string, value: string, reason: string) =>
    setIgnored((prev) =>
      prev.some((row) => row.param === param) ? prev : [...prev, { param, value, reason }],
    );

  // `/api/periods` — đồng thời kiểm tra tính hợp lệ của year/quarter/month/cmpa/cmpb trên URL.
  useEffect(() => {
    apiFetch<PeriodRow[]>("/api/periods")
      .then((rows) => {
        if (!Array.isArray(rows)) throw new Error("Danh mục kỳ không đúng định dạng.");
        setPeriodsError(null);
        setPeriods(rows);

        const maxYear = rows.reduce((acc2, row) => (row.year > acc2 ? row.year : acc2), 0);
        const urlYear = INITIAL.year;
        const yearExists = !!(urlYear && rows.some((r) => String(r.year) === urlYear));

        if (urlYear && !yearExists) {
          setYearState(maxYear ? String(maxYear) : "");
          addIgnored("year", urlYear, "năm này không có dữ liệu");
        } else if (!urlYear && maxYear) {
          setYearState(String(maxYear));
        }

        const activeYear = yearExists ? (urlYear as string) : String(maxYear);

        if (INITIAL.quarter) {
          const ok = rows.some(
            (r) => String(r.year) === activeYear && String(r.quarter) === INITIAL.quarter,
          );
          if (!ok) {
            setQuarterState("");
            addIgnored("quarter", INITIAL.quarter, `năm ${activeYear} không có quý này`);
          }
        }
        if (INITIAL.month) {
          const ok = rows.some(
            (r) => String(r.year) === activeYear && String(r.month) === INITIAL.month,
          );
          if (!ok) {
            setMonthState("");
            addIgnored("month", INITIAL.month, `năm ${activeYear} không có tháng này`);
          }
        }

        for (const [name, token] of [
          ["cmpa", INITIAL.cmpa],
          ["cmpb", INITIAL.cmpb],
        ] as const) {
          if (!token) continue;
          const parsed = parsePeriodToken(token);
          if (!(parsed && hasPeriod(rows, parsed))) {
            addIgnored(name, token, "kỳ này không có dữ liệu");
            if (name === "cmpa") setCmpa("");
            else setCmpb("");
          }
        }
      })
      .catch((err) => setPeriodsError(String(err)))
      .finally(() => setPeriodsReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đối chiếu ward trên URL với danh mục.
  useEffect(() => {
    if (!wardsReady) return;
    setWardsSynced(true);
    if (wardCatalog.length === 0) return;
    if (INITIAL.wardSlug) {
      const found = wardCatalog.find((w) => w.name_slug === INITIAL.wardSlug);
      if (found) setWardCode(found.location_code);
      else
        addIgnored(
          "ward",
          INITIAL.wardSlug.replace(/_/g, "-"),
          "không có phường/xã nào tên vậy",
        );
    } else if (INITIAL.wardCode) {
      if (!wardCatalog.find((w) => w.location_code === INITIAL.wardCode)) {
        setWardCode(null);
        addIgnored("ward", INITIAL.wardCode, "không có mã địa bàn này");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardsReady, wardCatalog]);

  const catalogSettled = periodsReady && wardsReady && wardsSynced;

  const slugOf = useMemo(() => {
    const map = new Map(wardCatalog.map((w) => [w.location_code, w.name_slug]));
    return (code: string) => map.get(code);
  }, [wardCatalog]);

  const catalogError = periodsError ?? wardsError;

  // `history.replaceState` — không tạo entry mới cho mỗi lần đổi filter.
  useEffect(() => {
    if (!catalogSettled || catalogError) return;
    window.history.replaceState(
      null,
      "",
      serializeUrl(
        {
          year: tab === "overview" ? String(overviewFilters.year) : year,
          quarter: tab === "overview" ? "" : quarter,
          month: tab === "overview" ? "" : month,
          acc: tab === "overview" ? overviewFilters.acc : acc,
          item: tab === "overview" ? overviewFilters.indicator : item,
          ward: effectiveWard,
          district: effectiveDistrict,
          tab,
          cmpa,
          cmpb,
          overview: tab === "overview" ? overviewFilters : undefined,
        },
        slugOf,
      ),
    );
  }, [
    catalogSettled,
    catalogError,
    year,
    quarter,
    month,
    acc,
    item,
    effectiveWard,
    effectiveDistrict,
    tab,
    cmpa,
    cmpb,
    slugOf,
    overviewFilters,
  ]);

  const years = useMemo(
    () => [...new Set(periods.map((p) => p.year))].sort((a, b) => b - a),
    [periods],
  );
  const quarterOptions = useMemo(() => quartersInYear(periods, year), [periods, year]);
  const monthOptions = useMemo(
    () => monthsInQuarter(periods, year, quarter),
    [periods, year, quarter],
  );

  /**
   * Chọn địa bàn là một phép ĐỔI PHẠM VI, không phải lọc tinh chỉnh tại chỗ:
   *   · chọn một phường  → sang "Chi tiết địa bàn", nơi thực sự có số của phường;
   *   · về toàn thành phố → quay lại "Tổng quan".
   * Tab So sánh tự quản lý địa bàn của nó nên không bị ép chuyển.
   * Không disable tab nào: người dùng vẫn mở được Tổng quan khi đang chọn phường,
   * và ScopeBar nói rõ Tổng quan luôn tính cho toàn thành phố.
   */
  const selectWard = useCallback((code: string | null) => {
    const next = code || null;
    setWardCode(next);
    setTab((current) => (current === "compare" ? current : next ? "detail" : "overview"));
  }, []);

  const selectDistrict = useCallback((slug: string | null) => {
    setDistrictSlug(HISTORICAL_DISTRICTS.some((d) => d.name_slug === slug) ? slug : null);
    setWardCode(null);
    setTab("detail");
  }, []);

  /** `Ae` — qua ranh giới lịch sử/hiện tại thì xoá địa bàn đang chọn. */
  const clearAcrossEra = (nextYear: string, nextQuarter: string, nextMonth: string) => {
    const before = areaEra(year, quarter, month) === "historical";
    const after = areaEra(nextYear, nextQuarter, nextMonth) === "historical";
    if (before !== after) {
      setWardCode(null);
      setDistrictSlug(null);
    }
  };

  const value: FiltersValue = {
    historicalAreas,
    district: effectiveDistrict,
    districtName:
      HISTORICAL_DISTRICTS.find((d) => d.name_slug === effectiveDistrict)?.location_name ??
      null,
    selectDistrict,
    catalogError,
    catalogReady: catalogSettled && !catalogError,
    wardsReady,
    periodsReady,
    wardCatalog,
    year,
    quarter,
    month,
    acc,
    item,
    ward: effectiveWard,
    tab,
    years,
    quartersInYear: quarterOptions,
    monthsInQuarter: monthOptions,
    periods,
    setYear: (next) => {
      setYearState(next);
      const keptQuarter = quartersInYear(periods, next).some((q) => String(q) === quarter)
        ? quarter
        : "";
      setQuarterState(keptQuarter);
      const keptMonth = monthsInQuarter(periods, next, keptQuarter).some(
        (m) => String(m) === month,
      )
        ? month
        : "";
      clearAcrossEra(next, keptQuarter, keptMonth);
      setMonthState(keptMonth);
    },
    setQuarter: (next) => {
      clearAcrossEra(year, next, "");
      setQuarterState(next);
      setMonthState("");
    },
    setMonth: (next) => {
      clearAcrossEra(year, quarter, next);
      setMonthState(next);
    },
    setAcc,
    setItem,
    selectWard,
    switchTab: setTab,
    apiParams: { year, quarter, month, acc, item, ward: effectiveWard },
    ignored,
    clearIgnored: () => setIgnored([]),
    wardSlug: effectiveWard ? (slugOf(effectiveWard) ?? null) : null,
    wardName: effectiveWard
      ? (wardCatalog.find((w) => w.location_code === effectiveWard)?.location_name ??
        effectiveWard)
      : null,
    cmpa,
    cmpb,
    setCompare: (a, b) => {
      setCmpa(a);
      setCmpb(b);
    },
    overviewFilters,
    setOverviewFilters: (next) => {
      setOverviewFiltersState(next);
      setYearState(String(next.year));
      setAcc(next.acc);
      setItem(next.indicator);
      if (next.periodType === "MONTH") {
        setQuarterState(String(Math.ceil(next.period / 3)));
        setMonthState(String(next.period));
      } else {
        setQuarterState(String(next.period));
        setMonthState("");
      }
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilters(): FiltersValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFilters() phải gọi trong <FiltersProvider>");
  return ctx;
}
