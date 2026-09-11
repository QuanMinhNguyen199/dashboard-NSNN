import {
  ALL_ITEMS,
  DOMESTIC_GROUPS,
  DOMESTIC_ITEMS,
  INDICATOR_BY_SLUG,
  LOCATIONS,
  LOCATION_BY_ID,
  SOURCES,
  SOURCE_BY_CODE,
  itemsOfSource,
  latestMonth,
  ALL_PERIODS,
  type ItemDef,
  type SourceCode,
} from "@/domain/catalog";
import {
  CITY_ID,
  MISSING_2026,
  amountOf,
  itemsForIndicator,
  levelsOf,
  sumOf,
} from "./observations";
import {
  monthsOf,
  parsePeriodToken,
  periodCount,
  periodTokenLabel,
  share,
  yoy,
} from "@/domain/metrics";
import type {
  AdvancedComparisonData,
  AdvancedComparisonFilters,
  AmountRow,
  BudgetEstimate,
  Coverage,
  DashboardFilters,
  DataMeta,
  LocationDetailData,
  OverviewData,
  RevenueAnalysisData,
  TrendPoint,
  Waterfall,
} from "@/domain/types";

/**
 * Dẫn xuất mọi widget từ cùng một kho quan sát.
 *
 * Quy tắc số liệu áp dụng thống nhất ở đây:
 *   · previous không hợp lệ (null, 0, hoặc quá nhỏ) → YoY là `null`, không phải −100%.
 *   · null không bao giờ bị đổi thành 0.
 *   · không cộng đồng thời chỉ tiêu cha và con.
 *   · waterfall phải khớp: tổng các bước = giá trị cuối − giá trị đầu.
 */

/** Ngưỡng mẫu số: dưới mức này thì %YoY vô nghĩa và bị loại. */
const periodLabel = (f: DashboardFilters) =>
  f.period === ALL_PERIODS
    ? latestMonth(f.year) === 12
      ? `Cả năm ${f.year}`
      : `${latestMonth(f.year)} tháng đầu ${f.year}`
    : `${f.periodType === "MONTH" ? "Tháng" : "Quý"} ${f.period}/${f.year}`;

function coverageOf(filters: DashboardFilters): Coverage {
  const missing =
    filters.year === 2026
      ? LOCATIONS.filter((l) => MISSING_2026.has(l.id)).map((l) => l.name)
      : [];
  return { covered: LOCATIONS.length - missing.length, total: LOCATIONS.length, missing };
}

function metaOf(filters: DashboardFilters, scopeLabel: string): DataMeta {
  return {
    source: "mock",
    generatedAt: new Date().toISOString(),
    unit: "VND",
    periodLabel: periodLabel(filters),
    // Mock không có file báo cáo quý riêng: quý được cộng từ ba tháng thành phần.
    derivedQuarter: filters.periodType === "QUARTER",
    scopeLabel,
    coverage: coverageOf(filters),
  };
}

const prevYear = (f: DashboardFilters) => f.year - 1;

/** Một dòng số tiền kèm cùng kỳ năm trước. */
function rowOf(
  id: string,
  name: string,
  filters: DashboardFilters,
  options: { items?: ItemDef[]; locationIds?: string[] },
  denominator?: number | null,
): AmountRow {
  const amount = sumOf(filters, options) ?? 0;
  const previous = sumOf(filters, { ...options, year: prevYear(filters) });
  return { id, name, amount, previous, share: share(amount, denominator ?? null) };
}

/**
 * Dự toán giao đầu năm — **số mô phỏng**.
 *
 * API không có trường này (xem `BudgetEstimate`). Ở đây suy ra từ thực hiện cả
 * năm trước nhân hệ số tăng, vì ba lý do: nó bám đúng phạm vi đang lọc (chỉ
 * tiêu, cấp ngân sách đều đã nằm trong `filters`), nó **tất định** nên cùng bộ
 * lọc luôn ra cùng con số — không có gì nhảy múa giữa hai lần tải — và nó nằm
 * trong khoảng hợp lý để tiến độ đọc ra tầm 60–90% thay vì một tỷ lệ vô nghĩa.
 *
 * Hệ số 1,08 là quy ước của prototype, không phải chỉ tiêu thật của Hà Nội.
 */
const ESTIMATE_GROWTH = 1.08;

function estimateOf(filters: DashboardFilters): BudgetEstimate | null {
  const wholeYear = { ...filters, period: ALL_PERIODS, accumulation: "YTD" as const };
  const lastYear = sumOf({ ...wholeYear, year: prevYear(filters) });
  if (lastYear === null || lastYear <= 0) return null;

  // Làm tròn tới tỷ: dự toán là con số giao bằng văn bản, không phải kết quả đo.
  const annual = Math.round((lastYear * ESTIMATE_GROWTH) / 1e9) * 1e9;
  const ytd = sumOf(filters, { months: monthsOf({ ...filters, accumulation: "YTD" }) });
  return {
    annual,
    progress: ytd === null || annual <= 0 ? null : ytd / annual,
    origin: "mock",
  };
}

/* ─────────────────────────── Xu hướng 12 tháng ─────────────────────────── */

/**
 * Mười hai điểm của năm N và N−1, tôn trọng PERIOD/YTD.
 * Tháng chưa có dữ liệu là `null` để đường bị ngắt, không nối và không vẽ điểm 0.
 */
export function trendOf(
  filters: DashboardFilters,
  options: { items?: ItemDef[]; locationIds?: string[] } = {},
): TrendPoint[] {
  const pointFor = (year: number, month: number) => {
    if (month > latestMonth(year)) return null;
    const months =
      filters.accumulation === "YTD"
        ? Array.from({ length: month }, (_, i) => i + 1)
        : [month];
    return sumOf(filters, { ...options, year, months });
  };
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: `T${i + 1}`,
    current: pointFor(filters.year, i + 1),
    previous: pointFor(prevYear(filters), i + 1),
  }));
}

/* ─────────────────────────────── Waterfall ─────────────────────────────── */

/**
 * Cầu nối từ cùng kỳ năm trước sang kỳ hiện tại.
 * Lấy 10 bước lớn nhất theo trị tuyệt đối, phần dư gộp vào "Khác" để tổng các
 * bước luôn bằng đúng chênh lệch chung.
 */
export function waterfallOf(
  rows: AmountRow[],
  labels: { start: string; end: string },
  maxSteps = 10,
): Waterfall {
  const start = rows.reduce((sum, row) => sum + (row.previous ?? 0), 0);
  const end = rows.reduce((sum, row) => sum + row.amount, 0);
  const deltas = rows
    .map((row) => ({ id: row.id, name: row.name, delta: row.amount - (row.previous ?? 0) }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const head = deltas.slice(0, maxSteps);
  const rest = deltas.slice(maxSteps);
  if (rest.length)
    head.push({
      id: "__other",
      name: `Khác (${rest.length} mục)`,
      delta: rest.reduce((sum, d) => sum + d.delta, 0),
    });

  let running = start;
  const steps = head.map((d) => {
    const from = running;
    running += d.delta;
    return { ...d, from, to: running };
  });

  const drift = running - end;
  return {
    startLabel: labels.start,
    endLabel: labels.end,
    start,
    end,
    steps,
    reconciled: Math.abs(drift) < 1000, // ngưỡng 1.000 đồng theo đặc tả
    drift,
  };
}

/* ─────────────────────────────── Tổng quan ─────────────────────────────── */

export function buildOverview(filters: DashboardFilters): OverviewData | null {
  if (filters.period !== ALL_PERIODS && (filters.period < 1 || filters.period > periodCount(filters)))
    return null;

  const total = sumOf(filters) ?? 0;
  // Lũy kế = chính khoảng kỳ hiện tại tính từ tháng 1; để `monthsOf` lo cả
  // trường hợp "tất cả các kỳ" thay vì dựng lại công thức ở đây.
  const ytdMonths = monthsOf({ ...filters, accumulation: "YTD" });

  const kpiPeriod: AmountRow = {
    id: "period",
    name: "Thu trong kỳ",
    amount: sumOf(filters, { months: monthsOf(filters) }) ?? 0,
    previous: sumOf(filters, { months: monthsOf(filters), year: prevYear(filters) }),
  };
  const kpiYtd: AmountRow = {
    id: "ytd",
    name: "Lũy kế từ đầu năm",
    amount: sumOf(filters, { months: ytdMonths }) ?? 0,
    previous: sumOf(filters, { months: ytdMonths, year: prevYear(filters) }),
  };

  const sources = SOURCES.map((source) =>
    rowOf(source.code, source.shortName, filters, { items: itemsOfSource(source.code) }, total),
  );

  const domesticItems = DOMESTIC_ITEMS.map((item) =>
    rowOf(item.code, item.name, filters, { items: [item] }),
  );
  const domesticTotal = domesticItems.reduce((sum, row) => sum + row.amount, 0);
  for (const row of domesticItems) row.share = share(row.amount, domesticTotal);

  // Địa bàn chưa nạp dữ liệu KHÔNG được biến thành dòng 0 — dòng 0 sẽ tạo ra
  // "-100%" giả trong bảng tăng trưởng. Chúng được báo qua độ phủ thay vì bịa số.
  const locations = LOCATIONS.map((location): AmountRow | null => {
    const amount = sumOf(filters, { locationIds: [location.id] });
    if (amount === null) return null;
    return {
      id: location.id,
      name: location.name,
      amount,
      previous: sumOf(filters, { locationIds: [location.id], year: prevYear(filters) }),
      share: share(amount, total),
    };
  }).filter((row): row is AmountRow => row !== null);

  const budgetLevels =
    filters.budgetLevel === "NSNN"
      ? (["NSTW", "NSDP"] as const).map((level) => {
          const scoped = { ...filters, budgetLevel: level };
          const amount = sumOf(scoped) ?? 0;
          return {
            id: level,
            name: level === "NSTW" ? "Ngân sách trung ương" : "Ngân sách địa phương",
            amount,
            previous: sumOf(scoped, { year: prevYear(filters) }),
            share: share(amount, total),
          } satisfies AmountRow;
        })
      : [];

  return {
    meta: metaOf(filters, "Toàn thành phố Hà Nội"),
    kpiPeriod,
    kpiYtd,
    insight: insightOf(kpiPeriod, locations, coverageOf(filters)),
    trend: trendOf(filters),
    sources,
    domesticItems,
    locations,
    budgetLevels,
    estimate: estimateOf(filters),
    waterfall: waterfallOf(sources, {
      start: `Cùng kỳ ${prevYear(filters)}`,
      end: periodLabel(filters),
    }),
  };
}

/** Cảnh báo quan trọng nhất của kỳ, theo thứ tự ưu tiên. */
function insightOf(
  kpi: AmountRow,
  locations: AmountRow[],
  coverage: Coverage,
): OverviewData["insight"] {
  if (coverage.missing.length)
    return {
      tone: "warning",
      title: `Thiếu ${coverage.missing.length} địa bàn`,
      detail: `${coverage.missing.join(", ")} chưa nạp số liệu trong kỳ này.`,
    };

  const drops = locations
    .map((row) => ({ row, change: yoy(row.amount, row.previous) }))
    .filter((entry) => entry.change !== null && entry.change <= -30)
    .sort((a, b) => (a.change ?? 0) - (b.change ?? 0));
  if (drops.length)
    return {
      tone: "critical",
      title: `${drops.length} địa bàn giảm sâu`,
      detail: `${drops[0].row.name} giảm ${Math.abs(drops[0].change!).toFixed(1)}% so cùng kỳ.`,
    };

  const change = yoy(kpi.amount, kpi.previous);
  if (change === null)
    return { tone: "neutral", title: "Chưa đủ cơ sở so sánh", detail: "Kỳ trước không có số liệu hợp lệ." };
  return {
    tone: change >= 0 ? "positive" : "warning",
    title: `Thu kỳ ${change >= 0 ? "tăng" : "giảm"} ${Math.abs(change).toFixed(1)}%`,
    detail: "So với cùng kỳ năm trước, trên cùng phạm vi và cấp ngân sách.",
  };
}

/* ────────────────────────────── Phân tích thu ───────────────────────────── */

export function buildRevenueAnalysis(
  filters: DashboardFilters,
  scope: SourceCode,
): RevenueAnalysisData | null {
  const source = SOURCE_BY_CODE[scope];
  if (!source) return null;

  const items = itemsOfSource(scope);
  const cityTotal = sumOf(filters);
  const total = sumOf(filters, { items }) ?? 0;
  const previous = sumOf(filters, { items, year: prevYear(filters) });

  const breakdown = items.map((item) => rowOf(item.code, item.name, filters, { items: [item] }, total));

  // Tầng giữa của thu nội địa: 21 khoản gộp thành ba nhóm. Thành viên lấy từ
  // `item.group` — nguồn duy nhất — nên thêm một khoản mới vào danh mục là nó tự
  // vào đúng nhóm, không phải nhớ sửa thêm một danh sách mã ở chỗ khác.
  const groups =
    scope === "domestic"
      ? DOMESTIC_GROUPS.map((group) => {
          const members = items.filter((item) => item.group === group.id);
          const row = rowOf(group.id, group.name, filters, { items: members }, total);
          const groupTotal = row.amount;
          return {
            ...row,
            meta: group.note,
            items: members
              .map((item) => rowOf(item.code, item.name, filters, { items: [item] }, groupTotal))
              .sort((a, b) => b.amount - a.amount),
          };
        })
      : null;

  // XNK: tách tổng gộp, các dòng hoàn và thu ròng để đối chiếu được với nhau.
  const netReconciliation =
    scope === "import-export"
      ? (() => {
          const grossItems = items.filter((i) => !i.deduction);
          const deductionItems = items.filter((i) => i.deduction);
          const gross = sumOf(filters, { items: grossItems }) ?? 0;
          const deductions = deductionItems.map((item) =>
            rowOf(item.code, item.name, filters, { items: [item] }),
          );
          return { gross, deductions, net: gross + deductions.reduce((s, d) => s + d.amount, 0) };
        })()
      : null;

  const byLocation = source.cityOnly
    ? []
    : LOCATIONS.map((location) =>
        rowOf(location.id, location.name, filters, { items, locationIds: [location.id] }, total),
      )
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

  return {
    meta: metaOf(filters, source.cityOnly ? "Toàn thành phố (không phân bổ theo địa bàn)" : "Toàn thành phố Hà Nội"),
    scope,
    groups,
    kpis: {
      total: { id: scope, name: source.name, amount: total, previous },
      share: share(total, cityTotal),
      contribution: total - (previous ?? total),
    },
    trend: trendOf(filters, { items }),
    breakdown,
    netReconciliation,
    byLocation,
    waterfall: waterfallOf(breakdown, {
      start: `Cùng kỳ ${prevYear(filters)}`,
      end: periodLabel(filters),
    }),
  };
}

/* ───────────────────────────── Chi tiết địa bàn ─────────────────────────── */

export function buildLocationDetail(
  filters: DashboardFilters,
  locationId: string,
): LocationDetailData | null {
  const location = LOCATION_BY_ID[locationId];
  if (!location) return null;

  const scope = { locationIds: [locationId] };
  const amount = sumOf(filters, scope);
  // Không có quan sát nào: trả null để provider chuyển thành trạng thái
  // "chưa có số liệu", thay vì dựng một trang toàn số 0.
  if (amount === null) return null;
  const previous = sumOf(filters, { ...scope, year: prevYear(filters) });
  const cityTotal = sumOf(filters);

  // Xếp hạng chỉ trên danh mục 126 phường/xã: dòng tổng thành phố và dòng tổng
  // Kho bạc không nằm trong danh mục nên không thể lọt vào bảng.
  const ranked = LOCATIONS.map((l) => ({ id: l.id, amount: sumOf(filters, { locationIds: [l.id] }) }))
    .filter((row) => row.amount !== null)
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  const position = ranked.findIndex((row) => row.id === locationId);

  const sources = SOURCES.filter((s) => !s.cityOnly).map((s) =>
    rowOf(s.code, s.shortName, filters, { items: itemsOfSource(s.code), ...scope }, amount),
  );

  const topItems = DOMESTIC_ITEMS.map((item) =>
    rowOf(item.code, item.name, filters, { items: [item], ...scope }, amount),
  )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  return {
    meta: metaOf(filters, location.name),
    location,
    kpiPeriod: { id: location.id, name: location.name, amount, previous },
    rank: position < 0 ? null : { position: position + 1, total: ranked.length },
    shareOfCity: share(amount, cityTotal),
    trend: trendOf(filters, scope),
    sources,
    topItems,
  };
}

/* ─────────────────────────── So sánh nâng cao ───────────────────────────── */

export function buildAdvancedComparison(
  filters: AdvancedComparisonFilters,
): AdvancedComparisonData | null {
  const base: DashboardFilters = {
    year: filters.year,
    periodType: filters.periodType,
    period: filters.period,
    accumulation: filters.accumulation,
    indicator: filters.indicator,
    budgetLevel: filters.budgetLevel,
  };

  let sideA: DashboardFilters;
  let sideB: DashboardFilters;
  let scopeA: { items?: ItemDef[]; locationIds?: string[] } = {};
  let scopeB: { items?: ItemDef[]; locationIds?: string[] } = {};
  let labelA: string;
  let labelB: string;
  let idA: string;
  let idB: string;
  let rowItems: ItemDef[] = itemsForIndicator(filters.indicator, DOMESTIC_ITEMS);

  if (filters.mode === "period") {
    const a = parsePeriodToken(filters.periodA ?? "");
    const b = parsePeriodToken(filters.periodB ?? "");
    if (!a || !b) return null;
    sideA = { ...base, ...a };
    sideB = { ...base, ...b };
    idA = filters.periodA!;
    idB = filters.periodB!;
    labelA = periodTokenLabel(idA);
    labelB = periodTokenLabel(idB);
  } else if (filters.mode === "revenue") {
    const a = SOURCE_BY_CODE[(filters.source ?? "domestic") as SourceCode];
    const b = SOURCE_BY_CODE[(filters.item ?? "import-export") as SourceCode];
    if (!a || !b) return null;
    // Không so hai đối tượng khác phạm vi phân bổ: một bên theo địa bàn, một bên không.
    if (a.cityOnly !== b.cityOnly) return null;
    sideA = base;
    sideB = base;
    scopeA = { items: itemsOfSource(a.code) };
    scopeB = { items: itemsOfSource(b.code) };
    idA = a.code;
    idB = b.code;
    labelA = a.shortName;
    labelB = b.shortName;
    rowItems = [];
  } else {
    const a = LOCATION_BY_ID[filters.locationA ?? ""];
    const b = LOCATION_BY_ID[filters.locationB ?? ""];
    if (!a || !b) return null;
    sideA = base;
    sideB = base;
    scopeA = { locationIds: [a.id] };
    scopeB = { locationIds: [b.id] };
    idA = a.id;
    idB = b.id;
    labelA = a.name;
    labelB = b.name;
  }

  const totalA = sumOf(sideA, scopeA);
  const totalB = sumOf(sideB, scopeB);
  const delta = totalA === null || totalB === null ? null : totalB - totalA;
  const deltaPct = yoy(totalB, totalA);

  const rows =
    filters.mode === "revenue"
      ? SOURCES.map((source) => {
          const items = itemsOfSource(source.code);
          const a = sumOf(sideA, { items }) ?? 0;
          const b = sumOf(sideB, { items }) ?? 0;
          return {
            id: source.code,
            name: source.shortName,
            a,
            b,
            delta: b - a,
            pct: yoy(b, a),
            contribution: delta ? ((b - a) / delta) * 100 : 0,
          };
        })
      : (rowItems.length ? rowItems : DOMESTIC_ITEMS).map((item) => {
          const a = sumOf(sideA, { ...scopeA, items: [item] }) ?? 0;
          const b = sumOf(sideB, { ...scopeB, items: [item] }) ?? 0;
          return {
            id: item.code,
            name: item.name,
            a,
            b,
            delta: b - a,
            pct: yoy(b, a),
            contribution: delta ? ((b - a) / delta) * 100 : 0,
          };
        });

  const waterfallRows: AmountRow[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    amount: row.b,
    previous: row.a,
  }));

  return {
    meta: metaOf(base, labelA + " vs " + labelB),
    mode: filters.mode,
    a: { id: idA, label: labelA, total: totalA },
    b: { id: idB, label: labelB, total: totalB },
    delta,
    deltaPct,
    rows: rows.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta)),
    waterfall: waterfallOf(waterfallRows, { start: labelA, end: labelB }),
    trendA: trendOf(sideA, scopeA),
    trendB: trendOf(sideB, scopeB),
  };
}

export { CITY_ID, ALL_ITEMS, INDICATOR_BY_SLUG, amountOf, levelsOf };
