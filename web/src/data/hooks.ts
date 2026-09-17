import { useCallback, useEffect, useRef, useState } from "react";
import { provider } from "@/data";
import type {
  AdvancedComparisonData,
  AdvancedComparisonFilters,
  DashboardFilters,
  DashboardResponse,
  LocationDetailData,
  OverviewData,
  ResourceState,
  ReportGridData,
  RevenueAnalysisData,
  RevenueScope,
  TmsBreakdownData,
} from "@/domain/types";
import type { ManagementLevelFilter } from "@/domain/tms";
import type { ReportDimension } from "@/domain/report";

/**
 * Hook tài nguyên dùng chung.
 *
 * Hai bảo đảm quan trọng:
 *   · Đổi bộ lọc nhanh thì request cũ bị huỷ qua `AbortSignal`.
 *   · Phản hồi cũ không bao giờ ghi đè kết quả mới — mỗi lần chạy mang một số
 *     thứ tự, và chỉ lần chạy mới nhất được phép ghi state.
 */
function useAsyncResource<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<DashboardResponse<T>>,
  enabled: boolean,
  notApplicableReason?: string,
  keepPreviousData = false,
): { resource: ResourceState<T>; retry: () => void; pending: boolean } {
  const [resource, setResource] = useState<ResourceState<T>>(
    enabled ? { status: "loading" } : { status: "not-applicable", reason: notApplicableReason ?? "" },
  );
  const [nonce, setNonce] = useState(0);
  /**
   * Đang chờ phản hồi trong khi màn hình vẫn hiện số của lần trước.
   *
   * `keepPreviousData` giữ bố cục không nhảy khi đổi thực thể, nhưng với trễ vài
   * giây thì nó cũng giữ luôn những con số đã cũ mà không nói gì. Cờ này để giao
   * diện đánh dấu phần đang chờ thay mới.
   */
  const [pending, setPending] = useState(false);
  const latest = useRef(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!enabled) {
      setResource({ status: "not-applicable", reason: notApplicableReason ?? "" });
      return;
    }
    const run = ++latest.current;
    const controller = new AbortController();
    setPending(true);
    // Chuyển nhanh giữa các thực thể cùng loại (đặc biệt là phường/xã) không
    // được làm cả vùng nội dung co về một placeholder thấp rồi nở lại. Giữ dữ
    // liệu trước đó trong lúc request mới chạy để chiều cao trang ổn định.
    setResource((current) =>
      keepPreviousData && (current.status === "ready" || current.status === "partial")
        ? current
        : { status: "loading" },
    );

    loadRef.current(controller.signal).then(
      (response) => {
        if (run !== latest.current || controller.signal.aborted) return;
        setPending(false);
        const coverage = (response.data as { meta?: { coverage?: { covered: number; total: number } } })
          .meta?.coverage;
        if (coverage && coverage.covered < coverage.total)
          setResource({
            status: "partial",
            data: response.data,
            message: `Mới có ${coverage.covered}/${coverage.total} phường, xã báo cáo trong kỳ này.`,
          });
        else setResource({ status: "ready", data: response.data });
      },
      (error: unknown) => {
        if (run !== latest.current) return;
        setPending(false);
        if ((error as Error)?.name === "AbortError") return;
        if ((error as Error)?.name === "NoDataError") {
          setResource({
            status: "no-data",
            message: (error as Error).message,
            canChangeFilters: true,
          });
          return;
        }
        setResource({
          status: "error",
          message: (error as Error)?.message ?? "Không tải được dữ liệu.",
          retryable: true,
        });
      },
    );

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce, enabled]);

  return { resource, pending, retry: useCallback(() => setNonce((n) => n + 1), []) };
}

const filterKey = (f: DashboardFilters) =>
  `${f.year}|${f.periodType}|${f.period}|${f.accumulation}|${f.indicator}|${f.budgetLevel}`;

export function useOverview(filters: DashboardFilters) {
  return useAsyncResource<OverviewData>(
    `overview|${filterKey(filters)}`,
    (signal) => provider.getOverview(filters, signal),
    true,
  );
}

export function useRevenueAnalysis(filters: DashboardFilters, scope: RevenueScope) {
  return useAsyncResource<RevenueAnalysisData>(
    `revenue|${scope}|${filterKey(filters)}`,
    (signal) => provider.getRevenueAnalysis(filters, scope, signal),
    true,
  );
}

export function useLocationDetail(filters: DashboardFilters, locationId: string | null) {
  return useAsyncResource<LocationDetailData>(
    `location|${locationId}|${filterKey(filters)}`,
    (signal) => provider.getLocationDetail(filters, locationId!, signal),
    !!locationId,
    "Chọn một phường, xã ở ô “Chi tiết địa bàn” phía trên, hoặc bấm một vùng trên bản đồ.",
    true,
  );
}

export function useTmsBreakdown(
  filters: DashboardFilters,
  level: ManagementLevelFilter,
  locationId: string | null,
  taxOfficeCode: string | null,
) {
  return useAsyncResource<TmsBreakdownData>(
    `tms|${level}|${locationId ?? "city"}|${taxOfficeCode ?? "all-offices"}|${filterKey(filters)}`,
    (signal) => provider.getTmsBreakdown(filters, level, locationId, taxOfficeCode, signal),
    true,
    undefined,
    // Đổi cấp quản lý là đổi lát cắt của cùng một bảng, không phải mở màn hình
    // khác. Giữ số cũ trong lúc tải để bảng không co lại rồi nở ra mỗi lần bấm.
    true,
  );
}

export function useReportGrid(
  filters: DashboardFilters,
  options: {
    groupBy: ReportDimension;
    subGroupBy: ReportDimension | null;
    columnOffset: number;
    columnLimit: number;
  },
) {
  return useAsyncResource<ReportGridData>(
    `report|${options.groupBy}|${options.subGroupBy ?? "-"}|${options.columnOffset}|${options.columnLimit}|${filterKey(filters)}`,
    (signal) => provider.getReportGrid(filters, options, signal),
    true,
    undefined,
    // Đổi chiều hoặc lật trang cột là đổi lát cắt của cùng một bảng. Giữ nội
    // dung cũ trong lúc tải để bảng không co lại rồi nở ra sau mỗi lần bấm.
    true,
  );
}

export function useAdvancedComparison(
  filters: AdvancedComparisonFilters,
  ready: boolean,
  waiting: string,
) {
  const key = [
    "compare",
    filters.mode,
    filters.periodA,
    filters.periodB,
    filters.source,
    filters.item,
    filters.locationA,
    filters.locationB,
    filterKey(filters),
  ].join("|");
  return useAsyncResource<AdvancedComparisonData>(
    key,
    (signal) => provider.getAdvancedComparison(filters, signal),
    ready,
    waiting,
  );
}
