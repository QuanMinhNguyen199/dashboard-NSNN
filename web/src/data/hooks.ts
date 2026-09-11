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
  RevenueAnalysisData,
  RevenueScope,
} from "@/domain/types";

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
): { resource: ResourceState<T>; retry: () => void } {
  const [resource, setResource] = useState<ResourceState<T>>(
    enabled ? { status: "loading" } : { status: "not-applicable", reason: notApplicableReason ?? "" },
  );
  const [nonce, setNonce] = useState(0);
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
    setResource({ status: "loading" });

    loadRef.current(controller.signal).then(
      (response) => {
        if (run !== latest.current || controller.signal.aborted) return;
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

  return { resource, retry: useCallback(() => setNonce((n) => n + 1), []) };
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
    "Chưa chọn phường, xã.",
  );
}

export function useAdvancedComparison(filters: AdvancedComparisonFilters, ready: boolean) {
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
    "Chưa chọn đủ hai vế để so sánh.",
  );
}
