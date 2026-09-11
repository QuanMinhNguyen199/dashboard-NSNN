import type { BudgetLevel, IndicatorSlug, SourceCode } from "./catalog";

export type PeriodType = "MONTH" | "QUARTER";
export type AccumulationMode = "PERIOD" | "YTD";
export type TabId = "overview" | "revenue-analysis" | "location-detail" | "advanced-compare";
export type AdvancedComparisonMode = "period" | "revenue" | "location";
export type RevenueScope = SourceCode;

/** Bộ lọc chung, giữ nguyên khi chuyển tab. */
export interface DashboardFilters {
  year: number;
  periodType: PeriodType;
  period: number;
  accumulation: AccumulationMode;
  indicator: IndicatorSlug;
  budgetLevel: BudgetLevel | "NSNN";
}

/** Quan sát gốc — mọi widget đều tổng hợp từ đây, không có nguồn số nào khác. */
export interface RevenueObservation {
  year: number;
  month: number;
  locationId: string;
  itemCode: string;
  sourceCode: SourceCode;
  budgetLevel: BudgetLevel;
  /** `null` là chưa có dữ liệu. `0` và số âm đều là giá trị hợp lệ. */
  amountVnd: number | null;
}

/**
 * Trạng thái của một tài nguyên.
 * `not-applicable` khiến widget bị loại khỏi lưới; `partial` vẫn hiện dữ liệu thật.
 */
export type ResourceState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "partial"; data: T; message: string }
  | { status: "no-data"; message: string; canChangeFilters: boolean }
  | { status: "not-applicable"; reason: string }
  | { status: "error"; message: string; retryable: boolean };

export interface AmountRow {
  id: string;
  name: string;
  /** Đơn vị đồng, chuẩn hoá một lần ở adapter. */
  amount: number;
  previous: number | null;
  /** Tỷ trọng trên mẫu số của widget; `null` khi mẫu số không hợp lệ. */
  share?: number | null;
  meta?: string;
}

export interface TrendPoint {
  month: number;
  label: string;
  current: number | null;
  previous: number | null;
}

export interface WaterfallStep {
  id: string;
  name: string;
  delta: number;
  from: number;
  to: number;
}

export interface Waterfall {
  startLabel: string;
  endLabel: string;
  start: number;
  end: number;
  steps: WaterfallStep[];
  /** Tổng các bước phải khớp `end - start`; nếu không, ghi rõ độ lệch. */
  reconciled: boolean;
  drift: number;
}

export interface Coverage {
  covered: number;
  total: number;
  missing: string[];
}

export interface DataMeta {
  source: "api" | "mcp" | "fixture" | "mock";
  generatedAt: string;
  unit: "VND";
  periodLabel: string;
  /** Quý được cộng từ ba tháng thay vì lấy báo cáo quý riêng. */
  derivedQuarter: boolean;
  scopeLabel: string;
  coverage: Coverage;
}

export interface OverviewData {
  meta: DataMeta;
  kpiPeriod: AmountRow;
  kpiYtd: AmountRow;
  insight: { tone: "neutral" | "positive" | "warning" | "critical"; title: string; detail: string };
  trend: TrendPoint[];
  sources: AmountRow[];
  domesticItems: AmountRow[];
  locations: AmountRow[];
  budgetLevels: AmountRow[];
  /** `null` khi không có dự toán cho phạm vi đang lọc. */
  estimate: BudgetEstimate | null;
  waterfall: Waterfall;
}

/**
 * Một nhóm lớn của thu nội địa, kèm các khoản con của chính nó.
 *
 * Khoản con đi cùng nhóm chứ không nằm ở danh sách phẳng riêng: màn hình phân rã
 * cần đúng các khoản thuộc nhóm đang mở, và để hai bên tự ghép bằng mã là mời
 * thêm một chỗ có thể ghép sai.
 */
export interface RevenueGroupRow extends AmountRow {
  /** Các khoản thu thuộc nhóm, đã xếp giảm dần. */
  items: AmountRow[];
}

/**
 * Dự toán giao đầu năm và tiến độ thực hiện.
 *
 * ⚠ API hiện **không** trả trường này — 143 response tham chiếu chỉ có `amount`.
 * Đặc tả v2 từng chủ động để dự toán ngoài phạm vi. Lớp mock vì thế tự suy ra
 * một con số để dựng giao diện, và `origin` nói rõ số đến từ đâu: giao diện phải
 * gắn nhãn mô phỏng chừng nào `origin` còn là `"mock"`. Khi API có trường thật,
 * chỉ cần adapter trả `origin: "api"` là nhãn tự biến mất.
 */
export interface BudgetEstimate {
  /** Dự toán cả năm, đơn vị đồng. */
  annual: number;
  /** Lũy kế thực hiện trên dự toán, 0..1; `null` khi dự toán không hợp lệ. */
  progress: number | null;
  origin: "mock" | "api";
}

export interface RevenueAnalysisData {
  meta: DataMeta;
  scope: RevenueScope;
  kpis: { total: AmountRow; share: number | null; contribution: number };
  trend: TrendPoint[];
  breakdown: AmountRow[];
  /** Chỉ nguồn nội địa: ba nhóm lớn, mỗi nhóm mang khoản con của nó. */
  groups: RevenueGroupRow[] | null;
  /** Chỉ nguồn XNK: tổng gộp, hoàn/khấu trừ và thu ròng. */
  netReconciliation: { gross: number; deductions: AmountRow[]; net: number } | null;
  byLocation: AmountRow[];
  waterfall: Waterfall;
}

export interface LocationDetailData {
  meta: DataMeta;
  location: { id: string; name: string; slug: string };
  kpiPeriod: AmountRow;
  rank: { position: number; total: number } | null;
  shareOfCity: number | null;
  trend: TrendPoint[];
  sources: AmountRow[];
  topItems: AmountRow[];
}

export interface ComparisonSide {
  id: string;
  label: string;
  total: number | null;
}

export interface AdvancedComparisonData {
  meta: DataMeta;
  mode: AdvancedComparisonMode;
  a: ComparisonSide;
  b: ComparisonSide;
  delta: number | null;
  deltaPct: number | null;
  rows: { id: string; name: string; a: number; b: number; delta: number; pct: number | null; contribution: number }[];
  waterfall: Waterfall;
  trendA: TrendPoint[];
  trendB: TrendPoint[];
}

export interface AdvancedComparisonFilters extends DashboardFilters {
  mode: AdvancedComparisonMode;
  periodA?: string;
  periodB?: string;
  source?: SourceCode;
  item?: string;
  locationA?: string;
  locationB?: string;
}

/** Ý định điều hướng MCP được phép trả về — danh sách đóng. */
export type DashboardNavigationAction =
  | { type: "OPEN_REVENUE_PREVIEW"; sourceId: string }
  | { type: "OPEN_REVENUE_ANALYSIS"; sourceId: string; view?: "overview" | "ranking" | "waterfall" }
  | { type: "OPEN_LOCATION_DETAIL"; locationId: string }
  | { type: "OPEN_ADVANCED_COMPARISON"; mode: AdvancedComparisonMode; entityIds: string[] };

export interface DashboardResponse<T = unknown> {
  schemaVersion: "1.0";
  requestId: string;
  source: DataMeta["source"];
  generatedAt: string;
  filters: DashboardFilters;
  page: { tab: TabId; section?: string; comparisonMode?: AdvancedComparisonMode };
  data: T;
  navigation?: DashboardNavigationAction[];
}

export interface DashboardDataProvider {
  getOverview(filters: DashboardFilters, signal: AbortSignal): Promise<DashboardResponse<OverviewData>>;
  getRevenueAnalysis(
    filters: DashboardFilters,
    scope: RevenueScope,
    signal: AbortSignal,
  ): Promise<DashboardResponse<RevenueAnalysisData>>;
  getLocationDetail(
    filters: DashboardFilters,
    locationId: string,
    signal: AbortSignal,
  ): Promise<DashboardResponse<LocationDetailData>>;
  getAdvancedComparison(
    filters: AdvancedComparisonFilters,
    signal: AbortSignal,
  ): Promise<DashboardResponse<AdvancedComparisonData>>;
}
