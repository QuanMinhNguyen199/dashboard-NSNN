import type {
  AdvancedComparisonFilters,
  DashboardDataProvider,
  DashboardFilters,
  DashboardResponse,
  RevenueScope,
  TabId,
} from "@/domain/types";
import type { ManagementLevelFilter } from "@/domain/tms";
import type { ReportDimension } from "@/domain/report";
import {
  PayloadError,
  SOURCES_ALLOWED,
  TABS_ALLOWED,
  assert as assertRaw,
  isRecord,
  sanitizeNavigation,
  validateAdvancedComparison,
  validateLocationDetail,
  validateOverview,
  validateRevenueAnalysis,
  validateTmsBreakdown,
  validateReportGrid,
} from "../validate";

/**
 * TypeScript chỉ thu hẹp kiểu qua một hàm assertion khi tên gọi có chú kiểu
 * tường minh; hàm nhập khẩu trực tiếp thì không đủ điều kiện.
 */
const assert: (condition: unknown, message: string) => asserts condition = assertRaw;

/** Provider đọc JSON ngoài — dùng chung cho API và MCP, khác nhau ở endpoint. */
export class JsonDashboardProvider implements DashboardDataProvider {
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
  getTmsBreakdown(
    filters: DashboardFilters,
    managementLevel: ManagementLevelFilter,
    locationId: string | null,
    taxOfficeCode: string | null,
    signal: AbortSignal,
  ) {
    // Payload không khai `origin` thì hiểu là dữ liệu thật: nhãn mô phỏng chỉ
    // được bật khi có ai đó nói rõ đây là số mô phỏng.
    return this.post(
      "/tms-breakdown",
      { filters, managementLevel, locationId, taxOfficeCode },
      signal,
      (raw) => validateTmsBreakdown(isRecord(raw) && raw.origin === undefined ? { ...raw, origin: "api" } : raw),
    );
  }
  getReportGrid(
    filters: DashboardFilters,
    options: {
      groupBy: ReportDimension;
      subGroupBy: ReportDimension | null;
      columnOffset: number;
      columnLimit: number;
    },
    signal: AbortSignal,
  ) {
    return this.post("/report", { filters, ...options }, signal, (raw) =>
      validateReportGrid(isRecord(raw) && raw.origin === undefined ? { ...raw, origin: "api" } : raw),
    );
  }
}
