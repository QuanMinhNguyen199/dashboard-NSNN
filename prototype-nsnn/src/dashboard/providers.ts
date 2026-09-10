import { LOCATION_BY_ID, SOURCE_BY_CODE, type SourceCode } from "./catalog";
import {
  buildAdvancedComparison,
  buildLocationDetail,
  buildOverview,
  buildRevenueAnalysis,
} from "./selectors";
import type {
  AdvancedComparisonData,
  AdvancedComparisonFilters,
  AdvancedComparisonMode,
  DashboardDataProvider,
  DashboardFilters,
  DashboardNavigationAction,
  DashboardResponse,
  LocationDetailData,
  OverviewData,
  RevenueAnalysisData,
  RevenueScope,
  TabId,
} from "./types";

/**
 * Ranh giới tin cậy giữa dữ liệu bên ngoài và giao diện.
 *
 * MCP và API chỉ được trả **dữ liệu** và **navigation intent đã whitelist**.
 * Không component, không HTML, không JavaScript, không CSS class, không URL thô.
 * Ứng dụng tự dịch intent đã kiểm tra thành URL nội bộ.
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isFinite_ = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isNullableNumber = (value: unknown) => value === null || isFinite_(value);

const SOURCES_ALLOWED = ["api", "mcp", "fixture", "mock"];
const TABS_ALLOWED: TabId[] = ["overview", "revenue-analysis", "location-detail", "advanced-compare"];
const MODES_ALLOWED: AdvancedComparisonMode[] = ["period", "revenue", "location"];

class PayloadError extends Error {}

/** Không phải lỗi: lát cắt hợp lệ nhưng chưa có quan sát nào. */
export class NoDataError extends Error {
  readonly name = "NoDataError";
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new PayloadError(message);
}

function validateAmountRow(value: unknown, where: string) {
  assert(isRecord(value), `${where}: dòng số liệu không phải object.`);
  assert(typeof value.id === "string" && typeof value.name === "string", `${where}: thiếu id hoặc name.`);
  assert(isFinite_(value.amount), `${where}: amount phải là số hữu hạn.`);
  assert(isNullableNumber(value.previous), `${where}: previous phải là số hoặc null.`);
}

function validateTrend(value: unknown, where: string) {
  assert(Array.isArray(value), `${where}: trend phải là mảng.`);
  for (const point of value) {
    assert(isRecord(point) && isFinite_(point.month), `${where}: điểm xu hướng thiếu month.`);
    assert(
      isNullableNumber(point.current) && isNullableNumber(point.previous),
      `${where}: giá trị xu hướng phải là số hoặc null.`,
    );
  }
}

function validateWaterfall(value: unknown, where: string) {
  assert(isRecord(value), `${where}: waterfall không phải object.`);
  assert(isFinite_(value.start) && isFinite_(value.end), `${where}: waterfall thiếu mốc đầu/cuối.`);
  assert(Array.isArray(value.steps), `${where}: waterfall thiếu các bước.`);
  for (const step of value.steps)
    assert(
      isRecord(step) && typeof step.name === "string" && isFinite_(step.delta),
      `${where}: bước waterfall không hợp lệ.`,
    );
  // Đối chiếu bắt buộc: tổng các bước phải khớp chênh lệch chung.
  const sum = (value.steps as { delta: number }[]).reduce((total, step) => total + step.delta, 0);
  assert(
    Math.abs(sum - ((value.end as number) - (value.start as number))) < 1000,
    `${where}: tổng các bước waterfall lệch quá 1.000 đồng so với chênh lệch chung.`,
  );
}

function validateMeta(value: unknown, where: string) {
  assert(isRecord(value), `${where}: thiếu metadata.`);
  assert(SOURCES_ALLOWED.includes(String(value.source)), `${where}: nguồn dữ liệu không hợp lệ.`);
  assert(value.unit === "VND", `${where}: đơn vị phải được chuẩn hoá về VND tại adapter.`);
  assert(typeof value.periodLabel === "string", `${where}: thiếu nhãn kỳ.`);
  assert(typeof value.derivedQuarter === "boolean", `${where}: thiếu cờ quý dẫn xuất.`);
  assert(isRecord(value.coverage), `${where}: thiếu thông tin độ phủ.`);
  assert(
    isFinite_(value.coverage.covered) && isFinite_(value.coverage.total),
    `${where}: độ phủ phải là số.`,
  );
}

export function validateOverview(value: unknown): OverviewData {
  assert(isRecord(value), "Overview: payload rỗng.");
  validateMeta(value.meta, "Overview");
  validateAmountRow(value.kpiPeriod, "Overview.kpiPeriod");
  validateAmountRow(value.kpiYtd, "Overview.kpiYtd");
  validateTrend(value.trend, "Overview");
  for (const key of ["sources", "domesticItems", "locations", "budgetLevels"] as const) {
    assert(Array.isArray(value[key]), `Overview.${key}: phải là mảng.`);
    for (const row of value[key] as unknown[]) validateAmountRow(row, `Overview.${key}`);
  }
  assert(
    (value.domesticItems as unknown[]).length === 21,
    "Overview: khoản thu nội địa phải đủ đúng 21 dòng.",
  );
  validateWaterfall(value.waterfall, "Overview");
  return value as unknown as OverviewData;
}

export function validateRevenueAnalysis(value: unknown): RevenueAnalysisData {
  assert(isRecord(value), "Phân tích thu: payload rỗng.");
  validateMeta(value.meta, "Phân tích thu");
  assert(
    typeof value.scope === "string" && value.scope in SOURCE_BY_CODE,
    "Phân tích thu: nguồn thu không nằm trong danh mục.",
  );
  assert(Array.isArray(value.breakdown), "Phân tích thu: thiếu bảng chi tiết.");
  for (const row of value.breakdown as unknown[]) validateAmountRow(row, "Phân tích thu.breakdown");
  validateTrend(value.trend, "Phân tích thu");
  validateWaterfall(value.waterfall, "Phân tích thu");
  return value as unknown as RevenueAnalysisData;
}

export function validateLocationDetail(value: unknown): LocationDetailData {
  assert(isRecord(value), "Chi tiết địa bàn: payload rỗng.");
  validateMeta(value.meta, "Chi tiết địa bàn");
  assert(
    isRecord(value.location) && typeof value.location.id === "string" && value.location.id in LOCATION_BY_ID,
    "Chi tiết địa bàn: mã địa bàn không nằm trong danh mục 126 phường/xã.",
  );
  validateAmountRow(value.kpiPeriod, "Chi tiết địa bàn.kpiPeriod");
  validateTrend(value.trend, "Chi tiết địa bàn");
  return value as unknown as LocationDetailData;
}

export function validateAdvancedComparison(value: unknown): AdvancedComparisonData {
  assert(isRecord(value), "So sánh: payload rỗng.");
  validateMeta(value.meta, "So sánh");
  assert(MODES_ALLOWED.includes(value.mode as AdvancedComparisonMode), "So sánh: chế độ không hợp lệ.");
  assert(isRecord(value.a) && isRecord(value.b), "So sánh: thiếu một trong hai vế.");
  assert(Array.isArray(value.rows), "So sánh: thiếu bảng delta.");
  validateWaterfall(value.waterfall, "So sánh");
  return value as unknown as AdvancedComparisonData;
}

/** Lọc navigation intent: chỉ giữ những intent đúng dạng và trỏ tới thực thể có thật. */
export function sanitizeNavigation(value: unknown): DashboardNavigationAction[] {
  if (!Array.isArray(value)) return [];
  const out: DashboardNavigationAction[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    switch (raw.type) {
      case "OPEN_REVENUE_PREVIEW":
        if (typeof raw.sourceId === "string" && raw.sourceId in SOURCE_BY_CODE)
          out.push({ type: raw.type, sourceId: raw.sourceId });
        break;
      case "OPEN_REVENUE_ANALYSIS":
        if (typeof raw.sourceId === "string" && raw.sourceId in SOURCE_BY_CODE) {
          const view = ["overview", "ranking", "waterfall"].includes(String(raw.view))
            ? (raw.view as "overview" | "ranking" | "waterfall")
            : undefined;
          out.push({ type: raw.type, sourceId: raw.sourceId, view });
        }
        break;
      case "OPEN_LOCATION_DETAIL":
        if (typeof raw.locationId === "string" && raw.locationId in LOCATION_BY_ID)
          out.push({ type: raw.type, locationId: raw.locationId });
        break;
      case "OPEN_ADVANCED_COMPARISON":
        if (
          MODES_ALLOWED.includes(raw.mode as AdvancedComparisonMode) &&
          Array.isArray(raw.entityIds) &&
          raw.entityIds.every((id) => typeof id === "string")
        )
          out.push({
            type: raw.type,
            mode: raw.mode as AdvancedComparisonMode,
            entityIds: (raw.entityIds as string[]).slice(0, 5),
          });
        break;
      default:
        break; // Mọi thứ khác bị bỏ qua một cách an toàn.
    }
  }
  return out;
}

function envelope<T>(
  data: T,
  filters: DashboardFilters,
  page: DashboardResponse["page"],
  source: DashboardResponse["source"] = "mock",
): DashboardResponse<T> {
  return {
    schemaVersion: "1.0",
    requestId: `${page.tab}-${Date.now().toString(36)}`,
    source,
    generatedAt: new Date().toISOString(),
    filters,
    page,
    data,
  };
}

/** Trễ giả lập, huỷ được — để kiểm chứng việc huỷ request cũ. */
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

class MockDashboardProvider implements DashboardDataProvider {
  async getOverview(filters: DashboardFilters, signal: AbortSignal) {
    await delay(160, signal);
    const data = buildOverview(filters);
    if (!data) throw new PayloadError("Kỳ đang chọn không có trong danh mục.");
    return envelope(validateOverview(data), filters, { tab: "overview" });
  }

  async getRevenueAnalysis(filters: DashboardFilters, scope: RevenueScope, signal: AbortSignal) {
    await delay(160, signal);
    const data = buildRevenueAnalysis(filters, scope as SourceCode);
    if (!data) throw new PayloadError("Nguồn thu không nằm trong danh mục.");
    return envelope(validateRevenueAnalysis(data), filters, {
      tab: "revenue-analysis",
      section: scope,
    });
  }

  async getLocationDetail(filters: DashboardFilters, locationId: string, signal: AbortSignal) {
    await delay(160, signal);
    const data = buildLocationDetail(filters, locationId);
    if (!data)
      throw locationId in LOCATION_BY_ID
        ? new NoDataError("Địa bàn này chưa nạp số liệu trong kỳ đang chọn. Hãy chọn kỳ khác.")
        : new PayloadError("Địa bàn không nằm trong danh mục 126 phường/xã.");
    return envelope(validateLocationDetail(data), filters, { tab: "location-detail" });
  }

  async getAdvancedComparison(filters: AdvancedComparisonFilters, signal: AbortSignal) {
    await delay(180, signal);
    const data = buildAdvancedComparison(filters);
    if (!data) throw new PayloadError("Hai vế so sánh không tương thích hoặc chưa đủ tham số.");
    return envelope(validateAdvancedComparison(data), filters, {
      tab: "advanced-compare",
      comparisonMode: filters.mode,
    });
  }
}

/** Provider đọc JSON ngoài — dùng chung cho API và MCP, khác nhau ở endpoint. */
class JsonDashboardProvider implements DashboardDataProvider {
  constructor(
    private readonly base: string,
    private readonly kind: "api" | "mcp",
  ) {}

  private async post<T>(path: string, body: unknown, signal: AbortSignal, validate: (v: unknown) => T) {
    const response = await fetch(this.base + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ schemaVersion: "1.0", ...(body as object) }),
      signal,
    });
    if (!response.ok) throw new PayloadError(`Provider trả về HTTP ${response.status}.`);
    const payload: unknown = await response.json();
    assert(isRecord(payload), "Envelope không phải object.");
    assert(payload.schemaVersion === "1.0", "Envelope sai schemaVersion.");
    assert(typeof payload.requestId === "string", "Envelope thiếu requestId.");
    assert(SOURCES_ALLOWED.includes(String(payload.source)), "Envelope có nguồn không hợp lệ.");
    assert(
      typeof payload.generatedAt === "string" && !Number.isNaN(Date.parse(payload.generatedAt)),
      "Envelope thiếu generatedAt hợp lệ.",
    );
    assert(isRecord(payload.page) && TABS_ALLOWED.includes(payload.page.tab as TabId), "Envelope sai tab.");
    const data = validate(payload.data);
    return {
      ...(payload as unknown as DashboardResponse<T>),
      source: this.kind,
      data,
      navigation: sanitizeNavigation(payload.navigation),
    };
  }

  getOverview(filters: DashboardFilters, signal: AbortSignal) {
    return this.post("/overview", { filters }, signal, validateOverview);
  }
  getRevenueAnalysis(filters: DashboardFilters, scope: RevenueScope, signal: AbortSignal) {
    return this.post("/revenue-analysis", { filters, scope }, signal, validateRevenueAnalysis);
  }
  getLocationDetail(filters: DashboardFilters, locationId: string, signal: AbortSignal) {
    return this.post("/location-detail", { filters, locationId }, signal, validateLocationDetail);
  }
  getAdvancedComparison(filters: AdvancedComparisonFilters, signal: AbortSignal) {
    return this.post("/advanced-compare", { filters }, signal, validateAdvancedComparison);
  }
}

export function createProvider(): DashboardDataProvider {
  const mode = import.meta.env.VITE_DASHBOARD_PROVIDER;
  if (mode === "api") return new JsonDashboardProvider("/api/dashboard", "api");
  if (mode === "mcp") return new JsonDashboardProvider("/mcp/dashboard", "mcp");
  return new MockDashboardProvider();
}

export const provider = createProvider();
export const providerKind: "api" | "mcp" | "mock" =
  import.meta.env.VITE_DASHBOARD_PROVIDER === "api"
    ? "api"
    : import.meta.env.VITE_DASHBOARD_PROVIDER === "mcp"
      ? "mcp"
      : "mock";
