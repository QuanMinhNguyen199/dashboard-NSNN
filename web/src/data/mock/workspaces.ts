import {
  ALL_PERIODS,
  DOMESTIC_ITEMS,
  LOCATIONS,
  LOCATION_BY_ID,
  latestMonth,
} from "@/domain/catalog";
import { DIMENSION_BY_ID, type ReportDimension } from "@/domain/report";
import { monthsOf, share, yoy } from "@/domain/metrics";
import type { DashboardFilters } from "@/domain/types";
import {
  absolutePercentageError,
  budgetStatusOf,
  type BudgetBreakdownRow,
  type BudgetForecastData,
  type BudgetProgressRow,
  type BudgetTrendPoint,
  type BudgetViewBy,
  type DataFreshness,
  type EnterpriseGroupBy,
  type EnterpriseGroupRow,
  type EnterpriseManagementData,
  type EnterpriseRevenueRow,
  type InspectionCycle,
  type InspectionData,
  type InspectionTrendPoint,
  type InspectionUnitRow,
  type PolicyChangeRow,
  type ReportSummaryData,
} from "@/domain/workspaces";
import { allocate, hash, weightOf } from "./deterministic";
import { metaOf } from "./build";
import { sumOf } from "./observations";
import {
  OFFICIAL_18_09,
  officialDirectoryCount,
  officialDirectoryUnclassifiedCount,
} from "@/data/official-18-09";

/**
 * Lớp mô phỏng của ba mảng mở theo biên bản 18/09/2026.
 *
 * Ba bảo đảm, và chúng là điều kiện để bản demo còn dùng được để góp ý:
 *
 *   · **Tất định.** Cùng bộ lọc luôn ra cùng số. Không `Math.random`, không
 *     `Date.now()` trong phần sinh số. Người xem demo hai lần thấy hai con số
 *     khác nhau thì mọi nhận xét về số đều vô nghĩa.
 *   · **Cộng khớp.** Tổng luôn bằng tổng các dòng, vì tổng được tính TỪ các
 *     dòng chứ không tính song song. Chỗ phải chia ngược từ tổng xuống thì dùng
 *     `allocate` (phần dư lớn nhất) để không rơi mất đồng nào.
 *   · **Không dữ liệu thật của người nộp thuế.** Doanh nghiệp mang mã token
 *     sinh từ chỉ số dòng, cố ý không giống cấu trúc mã số thuế.
 */

/** Mọi payload của ba workspace đều mang trạng thái này cho tới khi nối nguồn thật. */
const MOCK_FRESHNESS = (sources: DataFreshness["sources"]): DataFreshness => ({
  // Mốc chốt số của NGUỒN. Lớp mock không có nguồn nào nên không được bịa ra một
  // mốc: để `null` thì giao diện hiện ô trống, đúng với sự thật.
  dataAsOf: null,
  generatedAt: new Date().toISOString(),
  status: "mock",
  sources,
});

/* ───────────────────── 1. Dự toán và dự báo ─────────────────────────────── */

/**
 * Dự toán giao cho một đơn vị, suy tất định từ thực hiện.
 *
 * Hệ số 0,82–1,18 cho ra đủ cả bốn trạng thái (vượt, xong, đúng tiến độ, nguy
 * cơ hụt) để duyệt được mọi nhánh giao diện. Đây là số để XEM GIAO DIỆN, không
 * phải dự toán nghiệp vụ: dự toán thật do đơn vị giao, không suy ra được từ số
 * đã thu.
 */
const planOf = (actual: number, key: string, year: number) =>
  Math.round(actual * weightOf(0.82, 1.18, "plan", key, year));

/** Dự báo cuối kỳ. Lệch quanh thực hiện để phần sai số có cái mà đo. */
const forecastOf = (actual: number, key: string, year: number) =>
  Math.round(actual * weightOf(0.94, 1.07, "forecast", key, year));

function budgetRow(
  id: string,
  name: string,
  actual: number,
  previous: number | null,
  filters: DashboardFilters,
): BudgetProgressRow {
  const plan = planOf(actual, id, filters.year);
  const completionRate = plan === 0 ? null : (actual / plan) * 100;
  const forecast = forecastOf(actual, id, filters.year);
  return {
    id,
    name,
    plan,
    actual,
    previous,
    completionRate,
    remaining: plan - actual,
    forecast,
    forecastError: absolutePercentageError(forecast, actual),
    status: budgetStatusOf(completionRate),
  };
}

export function buildBudgetForecast(
  filters: DashboardFilters,
  viewBy: BudgetViewBy,
): BudgetForecastData | null {
  const scopeTotal = sumOf(filters);
  if (scopeTotal === null) return null;

  const rows: BudgetProgressRow[] = [];
  const breakdown: Record<string, BudgetBreakdownRow[]> = {};

  if (viewBy === "location") {
    for (const loc of LOCATIONS) {
      const actual = sumOf(filters, { locationIds: [loc.id] });
      if (actual === null) continue;
      const previous = sumOf({ ...filters, year: filters.year - 1 }, { locationIds: [loc.id] });
      rows.push(budgetRow(loc.id, loc.name, actual, previous, filters));
      // Mở một địa bàn thì thấy các khoản thu tạo nên kết quả của nó.
      breakdown[loc.id] = DOMESTIC_ITEMS.map((item) => {
        const a = sumOf(filters, { items: [item], locationIds: [loc.id] }) ?? 0;
        const p = planOf(a, `${loc.id}|${item.code}`, filters.year);
        return {
          id: item.code,
          name: item.name,
          plan: p,
          actual: a,
          previous: sumOf({ ...filters, year: filters.year - 1 }, { items: [item], locationIds: [loc.id] }),
          completionRate: p === 0 ? null : (a / p) * 100,
        };
      }).filter((r) => r.actual > 0);
    }
  } else {
    for (const item of DOMESTIC_ITEMS) {
      const actual = sumOf(filters, { items: [item] });
      if (actual === null) continue;
      const previous = sumOf({ ...filters, year: filters.year - 1 }, { items: [item] });
      rows.push(budgetRow(item.code, item.name, actual, previous, filters));
      // Mở một khoản thu thì thấy mười địa bàn đóng góp nhiều nhất cho nó.
      breakdown[item.code] = LOCATIONS.map((loc) => {
        const a = sumOf(filters, { items: [item], locationIds: [loc.id] }) ?? 0;
        const p = planOf(a, `${item.code}|${loc.id}`, filters.year);
        return {
          id: loc.id,
          name: loc.name,
          plan: p,
          actual: a,
          previous: sumOf({ ...filters, year: filters.year - 1 }, { items: [item], locationIds: [loc.id] }),
          completionRate: p === 0 ? null : (a / p) * 100,
        };
      })
        .filter((r) => r.actual > 0)
        .sort((a, b) => b.actual - a.actual)
        .slice(0, 10);
    }
  }

  if (!rows.length) return null;

  // Tổng tính TỪ các dòng, nên "Cộng" và bảng không thể lệch nhau.
  const plan = rows.reduce((s, r) => s + r.plan, 0);
  const actual = rows.reduce((s, r) => s + r.actual, 0);
  const forecast = rows.reduce((s, r) => s + (r.forecast ?? 0), 0);
  const previousRows = rows.filter((r) => r.previous !== null);
  const previous = previousRows.length ? previousRows.reduce((s, r) => s + (r.previous ?? 0), 0) : null;

  return {
    meta: metaOf(filters, viewBy === "location" ? "126 phường, xã" : "21 khoản thu nội địa"),
    freshness: MOCK_FRESHNESS(["TMS", "MANUAL_PLAN"]),
    viewBy,
    totals: {
      plan,
      actual,
      previous,
      completionRate: plan === 0 ? null : (actual / plan) * 100,
      remaining: plan - actual,
      forecast,
      forecastError: absolutePercentageError(forecast, actual),
    },
    rows,
    breakdown,
    trend: budgetTrend(filters),
    forecastTargetPct: 3,
    quality: {
      withoutPlan: rows.filter((r) => r.plan === 0).length,
      forecastWithoutActual: 0,
    },
  };
}

/**
 * Thực hiện, dự toán và dự báo theo tháng.
 *
 * Tháng chưa tới thì `actual` là `null` chứ không phải 0 — đường biểu đồ phải
 * ĐỨT ở đó. Nối liền qua khoảng trống là vẽ ra một tháng đã thu 0 đồng.
 */
function budgetTrend(filters: DashboardFilters): BudgetTrendPoint[] {
  /**
   * Đường thực hiện chạy TỚI kỳ đang chọn, không chỉ đúng một tháng.
   *
   * Trước đây chỗ này lấy `monthsOf(filters)` làm phạm vi. Với `Cách tính:
   * Trong kỳ` thì hàm đó trả về đúng một tháng, nên đường "Thực hiện" của cả
   * biểu đồ 12 tháng chỉ có MỘT điểm — mà một điểm thì `<path>` chỉ ra một lệnh
   * `moveto` và không vẽ nét nào. Kết quả: chú giải hứa ba đường, màn hình vẽ
   * hai, không một dòng nào báo. Đây là biểu đồ dự toán so thực hiện; đường
   * thực hiện là chủ ngữ của nó.
   *
   * Chặn trên vẫn là kỳ đang chọn, không phải "mọi tháng có số": chọn Tháng 3
   * mà biểu đồ vẽ tới Tháng 8 là biểu đồ nói khác bộ lọc ngay phía trên nó.
   */
  const denThang = Math.max(...monthsOf(filters));
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const a = sumOf({ ...filters, periodType: "MONTH", period: month, accumulation: "PERIOD" });
    const inScope = month <= denThang;
    const actual = inScope ? a : null;
    return {
      month,
      label: `T${month}`,
      actual,
      plan: a === null ? null : planOf(a, `trend|${month}`, filters.year),
      // Dự báo phủ cả tháng chưa có thực hiện — đó chính là việc của dự báo.
      forecast: a === null ? null : forecastOf(a, `trend|${month}`, filters.year),
    };
  });
}

/* ─────────────────── 2. Quản lý doanh nghiệp ────────────────────────────── */

const UNCLASSIFIED = "chua-xac-dinh";

/**
 * Tên doanh nghiệp mô phỏng.
 *
 * Cố ý đọc ra ngay là giả: có tiền tố "DN mô phỏng" và một số thứ tự. Không
 * dùng tên có thật, không ghép từ ngẫu nhiên thành thứ trông như tên thật —
 * một cái tên trông thật trong bản demo sẽ bị ai đó chụp màn hình gửi đi.
 */
const enterpriseName = (index: number) =>
  `DN mô phỏng ${String(index + 1).padStart(3, "0")}`;

/**
 * Mã hiển thị của doanh nghiệp.
 *
 * KHÔNG phải mã số thuế. Tiền tố chữ và độ dài 8 khiến nó không thể bị nhầm với
 * MST 10 hoặc 13 chữ số, nên lọt vào URL hay log cũng không lộ gì.
 */
const enterpriseToken = (groupId: string, index: number) =>
  `DN-${String(Math.floor(hash(groupId, index) * 100000)).padStart(5, "0")}`;

export function buildEnterpriseManagement(
  filters: DashboardFilters,
  groupBy: EnterpriseGroupBy,
): EnterpriseManagementData | null {
  const total = sumOf(filters);
  if (total === null) return null;
  const previousTotal = sumOf({ ...filters, year: filters.year - 1 });

  // Dùng LẠI danh mục của tab Báo cáo, không dựng danh mục ngành thứ hai.
  const members = DIMENSION_BY_ID[groupBy as ReportDimension].members;
  const keys = [...members.map((m) => m.id), UNCLASSIFIED];
  const names = [...members.map((m) => m.name), "Chưa xác định"];

  // Chia từ tổng xuống bằng phần dư lớn nhất: các nhóm cộng lại đúng bằng tổng.
  const weights = keys.map((id) => weightOf(0.15, 1.85, groupBy, id, filters.year, filters.period));
  const amounts = allocate(total, weights);
  const prevWeights = keys.map((id) => weightOf(0.15, 1.85, groupBy, id, filters.year - 1, filters.period));
  const prevAmounts = previousTotal === null ? null : allocate(previousTotal, prevWeights);

  const groups: EnterpriseGroupRow[] = keys.map((id, i) => {
    const unclassified = id === UNCLASSIFIED;
    const officialCount = unclassified
      ? officialDirectoryUnclassifiedCount(groupBy)
      : officialDirectoryCount(groupBy, id, names[i]);
    return {
      id,
      name: names[i],
      amount: amounts[i],
      previous: prevAmounts ? prevAmounts[i] : null,
      share: share(amounts[i], total),
      enterpriseCount: officialCount ?? 0,
      unclassified,
    };
  });
  groups.sort((a, b) => {
    // Nhóm chưa xác định luôn xuống cuối: nó không phải một hạng mục để xếp hạng.
    if (a.unclassified !== b.unclassified) return a.unclassified ? 1 : -1;
    return b.amount - a.amount;
  });

  const enterprises: Record<string, EnterpriseRevenueRow[]> = {};
  for (const group of groups) {
    if (group.unclassified || group.enterpriseCount === 0) {
      enterprises[group.id] = [];
      continue;
    }
    // Danh bạ có thể chứa hàng chục nghìn bản ghi trong một nhóm. UI chỉ dựng
    // tối đa 12 dòng minh họa; con số tổng hợp trên bảng vẫn là số danh bạ thật.
    const previewCount = Math.min(group.enterpriseCount, 12);
    const w = Array.from({ length: previewCount }, (_, i) =>
      weightOf(0.3, 1.7, "ent", group.id, i),
    );
    const parts = allocate(group.amount, w);
    const prevParts =
      group.previous === null
        ? null
        : allocate(
            group.previous,
            Array.from({ length: previewCount }, (_, i) => weightOf(0.3, 1.7, "entPrev", group.id, i)),
          );
    enterprises[group.id] = parts.map((amount, i) => ({
      token: enterpriseToken(group.id, i),
      displayName: enterpriseName(i),
      industryId: groupBy === "industry" ? group.id : null,
      taxOfficeCode: groupBy === "taxOffice" ? group.id : null,
      locationId: groupBy === "location" ? group.id : null,
      amount,
      previous: prevParts ? prevParts[i] : null,
    }));
  }

  const unclassifiedAmount = groups.find((g) => g.unclassified)?.amount ?? 0;
  const classifiedAmount = total - unclassifiedAmount;

  return {
    meta: metaOf(filters, DIMENSION_BY_ID[groupBy as ReportDimension].name),
    freshness: MOCK_FRESHNESS(["TMS"]),
    groupBy,
    totals: {
      amount: total,
      previous: previousTotal,
      classifiedAmount,
      unclassifiedAmount,
      classifiedRate: share(classifiedAmount, total),
      groupCount: groups.filter((g) => !g.unclassified && g.amount > 0).length,
      directoryTotal: OFFICIAL_18_09.directory.total,
    },
    groups,
    enterprises,
  };
}

/* ─────────────────────────── 3. Kiểm tra ────────────────────────────────── */

/** Đơn vị mô phỏng. Tên trung tính, không phải phòng ban có thật. */
const INSPECTION_UNITS = [
  "Đoàn kiểm tra số 1",
  "Đoàn kiểm tra số 2",
  "Đoàn kiểm tra số 3",
  "Đoàn kiểm tra số 4",
  "Đoàn kiểm tra số 5",
  "Đoàn kiểm tra số 6",
];

/** Biến động chính sách — nội dung trung tính, KHÔNG bịa tên văn bản pháp luật. */
const POLICY_CHANGES: PolicyChangeRow[] = [
  {
    id: "pc-1",
    name: "Chính sách mô phỏng A · nhóm khai thác tài nguyên",
    effectiveFrom: "2026-07-01",
    scope: "Khoản thu tài nguyên, phí bảo vệ môi trường",
    reviewStatus: "assessed",
  },
  {
    id: "pc-2",
    name: "Chính sách mô phỏng B · lệ phí trước bạ",
    effectiveFrom: "2026-09-01",
    scope: "Lệ phí trước bạ, thu tiền sử dụng đất",
    reviewStatus: "reviewing",
  },
  {
    id: "pc-3",
    name: "Chính sách mô phỏng C · hộ kinh doanh",
    effectiveFrom: "2026-10-01",
    scope: "Khu vực ngoài quốc doanh",
    reviewStatus: "pending",
  },
];

export function buildInspection(
  filters: DashboardFilters,
  cycle: InspectionCycle,
): InspectionData | null {
  const scope = sumOf(filters);
  if (scope === null) return null;

  const units: InspectionUnitRow[] = INSPECTION_UNITS.map((name, i) => {
    const key = `${cycle}|${filters.year}|${filters.period}|${i}`;
    const totalCases = 18 + Math.floor(hash("cases", key) * 46);
    const completedCases = Math.floor(totalCases * weightOf(0.45, 0.98, "done", key));
    // Số tiền xử lý neo theo quy mô thu của kỳ để bậc độ lớn còn hợp lý.
    const processedAmount = Math.round(scope * weightOf(0.0008, 0.0042, "processed", key));
    const paidAmount = Math.round(processedAmount * weightOf(0.35, 0.95, "paid", key));
    const completionRate = totalCases === 0 ? null : (completedCases / totalCases) * 100;
    const paidRate = processedAmount === 0 ? null : (paidAmount / processedAmount) * 100;
    return {
      id: `unit-${i + 1}`,
      name,
      totalCases,
      completedCases,
      completionRate,
      processedAmount,
      paidAmount,
      paidRate,
      status:
        completionRate !== null && completionRate >= 95
          ? "completed"
          : completionRate !== null && completionRate < 60
            ? "late"
            : "inProgress",
    };
  });

  // KPI cộng TỪ bảng đơn vị, nên hai chỗ không thể nói hai con số khác nhau.
  const summary = {
    totalCases: units.reduce((s, u) => s + u.totalCases, 0),
    completedCases: units.reduce((s, u) => s + u.completedCases, 0),
    processedAmount: units.reduce((s, u) => s + u.processedAmount, 0),
    paidAmount: units.reduce((s, u) => s + u.paidAmount, 0),
  };

  /* Báo cáo tháng phải cho thấy cả chuỗi từ đầu năm đến kỳ đang chọn. Bản cũ
     cắt cứng 6 điểm và dùng trực tiếp `filters.period`; khi lọc theo Quý, số
     quý bị hiểu nhầm thành số tháng nên nhiều cột cùng mang nhãn "Tháng 1".
     Quy đổi kỳ về tháng kết thúc trước, rồi dựng đúng một điểm cho mỗi tháng. */
  const endMonth =
    filters.period === ALL_PERIODS
      ? latestMonth(filters.year)
      : filters.periodType === "MONTH"
        ? filters.period
        : Math.min(filters.period * 3, latestMonth(filters.year));
  const buckets = cycle === "week" ? 8 : endMonth;
  const trend: InspectionTrendPoint[] = Array.from({ length: buckets }, (_, i) => {
    const key = `${cycle}|trend|${filters.year}|${filters.period}|${i}`;
    const month = i + 1;
    // Mỗi điểm tháng neo vào đúng số thu của riêng tháng đó. Dùng tổng của kỳ
    // đang lọc cho mọi điểm sẽ làm một tháng nhỏ mang quy mô của cả quý/YTD.
    const trendScope =
      cycle === "month"
        ? (sumOf({
            ...filters,
            periodType: "MONTH",
            period: month,
            accumulation: "PERIOD",
          }) ?? scope)
        : scope;
    return {
      label: cycle === "week" ? `Tuần ${30 + i}` : `Tháng ${month}`,
      completedCases: 6 + Math.floor(hash("tc", key) * 22),
      processedAmount: Math.round(trendScope * weightOf(0.0004, 0.0016, "tp", key)),
      paidAmount: Math.round(trendScope * weightOf(0.0002, 0.0011, "tpaid", key)),
    };
  });

  const attention = units
    .filter((u) => u.status === "late" || (u.paidRate !== null && u.paidRate < 50))
    .map((u) => ({
      id: u.id,
      unit: u.name,
      reason:
        u.status === "late"
          ? `Mới hoàn thành ${u.completedCases}/${u.totalCases} cuộc`
          : `Đã nộp ${u.paidRate === null ? "" : Math.round(u.paidRate)}% số tiền xử lý`,
      tone: (u.status === "late" ? "critical" : "warning") as "warning" | "critical",
    }));

  return {
    meta: metaOf(filters, cycle === "week" ? "Báo cáo tuần" : "Báo cáo tháng"),
    freshness: MOCK_FRESHNESS(["TMS", "TTR"]),
    cycle,
    summary,
    units,
    trend,
    attention,
    policyChanges: POLICY_CHANGES,
  };
}

/* ───────────── Tóm tắt đặt trên bảng 113 chỉ tiêu của tab Báo cáo ───────── */

export function buildReportSummary(
  filters: DashboardFilters,
  dimension: ReportDimension,
): ReportSummaryData | null {
  const total = sumOf(filters);
  if (total === null) return null;
  const previousTotal = sumOf({ ...filters, year: filters.year - 1 });

  const members = DIMENSION_BY_ID[dimension].members;
  const keys = [...members.map((m) => m.id), UNCLASSIFIED];
  const names = [...members.map((m) => m.name), "Chưa xác định"];
  const amounts = allocate(
    total,
    keys.map((id) => weightOf(0.15, 1.85, dimension, id, filters.year, filters.period)),
  );
  const prevAmounts =
    previousTotal === null
      ? null
      : allocate(
          previousTotal,
          keys.map((id) => weightOf(0.15, 1.85, dimension, id, filters.year - 1, filters.period)),
        );

  const rows = keys.map((id, i) => ({
    id,
    name: names[i],
    amount: amounts[i],
    previous: prevAmounts ? prevAmounts[i] : null,
    unclassified: id === UNCLASSIFIED,
  }));
  const classified = rows.filter((r) => !r.unclassified);
  const unclassifiedAmount = rows.find((r) => r.unclassified)?.amount ?? 0;

  const withChange = classified
    .map((r) => ({ ...r, changePct: yoy(r.amount, r.previous) }))
    .filter((r) => r.changePct !== null);

  return {
    meta: metaOf(filters, DIMENSION_BY_ID[dimension].name),
    freshness: MOCK_FRESHNESS(["TMS"]),
    dimension,
    year: filters.year,
    total,
    groupCount: classified.filter((r) => r.amount > 0).length,
    classifiedAmount: total - unclassifiedAmount,
    unclassifiedAmount,
    classifiedRate: share(total - unclassifiedAmount, total),
    top: [...classified]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((r) => ({ id: r.id, name: r.name, amount: r.amount, share: share(r.amount, total) })),
    gainers: [...withChange]
      .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))
      .slice(0, 3)
      .map((r) => ({ id: r.id, name: r.name, amount: r.amount, changePct: r.changePct })),
    losers: [...withChange]
      .sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0))
      .slice(0, 3)
      .map((r) => ({ id: r.id, name: r.name, amount: r.amount, changePct: r.changePct })),
    trend: Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const base = { ...filters, periodType: "MONTH" as const, period: month, accumulation: "PERIOD" as const };
      return {
        month,
        label: `T${month}`,
        current: sumOf(base),
        previous: sumOf({ ...base, year: filters.year - 1 }),
      };
    }),
  };
}

export { LOCATION_BY_ID };
