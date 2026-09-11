import { LOCATION_BY_ID, type SourceCode } from "@/domain/catalog";
import type {
  AdvancedComparisonFilters,
  DashboardDataProvider,
  DashboardFilters,
  DashboardResponse,
  RevenueScope,
} from "@/domain/types";
import {
  buildAdvancedComparison,
  buildLocationDetail,
  buildOverview,
  buildRevenueAnalysis,
} from "../mock/build";
import {
  NoDataError,
  PayloadError,
  validateAdvancedComparison,
  validateLocationDetail,
  validateOverview,
  validateRevenueAnalysis,
} from "../validate";

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

export class MockDashboardProvider implements DashboardDataProvider {
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
