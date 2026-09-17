import { LOCATION_BY_ID, type SourceCode } from "@/domain/catalog";
import type {
  AdvancedComparisonFilters,
  DashboardDataProvider,
  DashboardFilters,
  DashboardResponse,
  RevenueScope,
} from "@/domain/types";
import type { ManagementLevelFilter } from "@/domain/tms";
import type { ReportDimension } from "@/domain/report";
import {
  buildAdvancedComparison,
  buildLocationDetail,
  buildOverview,
  buildRevenueAnalysis,
} from "../mock/build";
import { buildTmsBreakdown } from "../mock/tms";
import { buildReportGrid } from "../mock/report";
import {
  NoDataError,
  PayloadError,
  validateAdvancedComparison,
  validateLocationDetail,
  validateOverview,
  validateRevenueAnalysis,
  validateTmsBreakdown,
  validateReportGrid,
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

/**
 * Trễ mô phỏng của bản dựng thử.
 *
 * Backend thật của bản dev trả chậm, nên mock trả nhanh sẽ dạy người duyệt một
 * kỳ vọng sai: bố cục nào cũng đẹp khi dữ liệu về tức thì. Mặc định vì vậy đủ
 * dài để nhìn thấy trạng thái chờ thật sự trông thế nào, quanh mức 1 giây.
 *
 * Đổi bằng `?latency=` trên đường dẫn hoặc `VITE_MOCK_LATENCY`; đặt 0 khi chạy
 * kiểm thử hoặc khi đang sửa giao diện và không muốn chờ.
 */
const DEFAULT_LATENCY_MS = 1000;

function baseLatency(): number {
  const fromUrl = new URLSearchParams(window.location.search).get("latency");
  const raw = fromUrl ?? import.meta.env.VITE_MOCK_LATENCY;
  const value = Number(raw);
  return raw !== undefined && raw !== null && raw !== "" && Number.isFinite(value) && value >= 0
    ? value
    : DEFAULT_LATENCY_MS;
}

/**
 * Mỗi màn hình một hệ số riêng, tất định.
 *
 * Dùng chung một con số cho mọi endpoint thì mọi lần chờ dài bằng nhau, và đó
 * không phải thứ backend thật làm. Hệ số trải quanh 1 nên với mặc định 1 giây,
 * thời gian chờ rơi vào khoảng 0,9 đến 1,2 giây.
 */
const SPREAD = {
  overview: 1,
  revenue: 1.15,
  location: 0.95,
  tms: 1.1,
  compare: 1.2,
  report: 1.3,
  reconciliation: 0.9,
} as const;

const latencyFor = (screen: keyof typeof SPREAD) => Math.round(baseLatency() * SPREAD[screen]);

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
    await delay(latencyFor("overview"), signal);
    const data = buildOverview(filters);
    if (!data) throw new PayloadError("Kỳ đang chọn không có trong danh mục.");
    return envelope(validateOverview(data), filters, { tab: "overview" });
  }

  async getRevenueAnalysis(filters: DashboardFilters, scope: RevenueScope, signal: AbortSignal) {
    await delay(latencyFor("revenue"), signal);
    const data = buildRevenueAnalysis(filters, scope as SourceCode);
    if (!data) throw new PayloadError("Nguồn thu không nằm trong danh mục.");
    return envelope(validateRevenueAnalysis(data), filters, {
      tab: "revenue-analysis",
      section: scope,
    });
  }

  async getLocationDetail(filters: DashboardFilters, locationId: string, signal: AbortSignal) {
    await delay(latencyFor("location"), signal);
    const data = buildLocationDetail(filters, locationId);
    if (!data)
      throw locationId in LOCATION_BY_ID
        ? new NoDataError("Địa bàn này chưa nạp số liệu trong kỳ đang chọn. Hãy chọn kỳ khác.")
        : new PayloadError("Địa bàn không nằm trong danh mục 126 phường/xã.");
    return envelope(validateLocationDetail(data), filters, { tab: "location-detail" });
  }

  async getTmsBreakdown(
    filters: DashboardFilters,
    managementLevel: ManagementLevelFilter,
    locationId: string | null,
    taxOfficeCode: string | null,
    signal: AbortSignal,
  ) {
    await delay(latencyFor("tms"), signal);
    const data = buildTmsBreakdown(filters, managementLevel, locationId, taxOfficeCode);
    if (!data)
      throw new NoDataError(
        "Kỳ đang chọn chưa có giao dịch nội địa nào để phân rã theo Chương và Tiểu mục.",
      );
    return envelope(validateTmsBreakdown(data), filters, { tab: "tms-breakdown" });
  }

  async getReportGrid(
    filters: DashboardFilters,
    options: {
      groupBy: ReportDimension;
      subGroupBy: ReportDimension | null;
      columnOffset: number;
      columnLimit: number;
    },
    signal: AbortSignal,
  ) {
    await delay(latencyFor("report"), signal);
    const data = buildReportGrid(filters, options);
    if (!data)
      throw new PayloadError(
        "Cặp chiều không hợp lệ: chiều chi tiết phải khác chiều chính.",
      );
    return envelope(validateReportGrid(data), filters, {
      tab: "report",
      section: `${options.groupBy}/${options.subGroupBy ?? "-"}`,
    });
  }

  async getAdvancedComparison(filters: AdvancedComparisonFilters, signal: AbortSignal) {
    await delay(latencyFor("compare"), signal);
    const data = buildAdvancedComparison(filters);
    if (!data) throw new PayloadError("Hai vế so sánh không tương thích hoặc chưa đủ tham số.");
    return envelope(validateAdvancedComparison(data), filters, {
      tab: "advanced-compare",
      comparisonMode: filters.mode,
    });
  }
}
