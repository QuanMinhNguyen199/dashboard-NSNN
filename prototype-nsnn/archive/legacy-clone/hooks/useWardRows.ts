import { useMemo } from "react";
import { useApi } from "./useApi";
import { useFilters } from "../state/FiltersProvider";
import type { ByWardRow } from "../lib/types";

const EMPTY: ByWardRow[] = [];

/**
 * `loe` — bảng /api/by-ward dùng chung cho Overview, Detail và bản đồ.
 * Luôn bỏ `ward` khỏi query (đây là bảng toàn thành phố) và loại các dòng amount === 0.
 */
export function useWardRows() {
  const { apiParams, tab, district } = useFilters();
  const params = { ...apiParams };
  delete params.ward;
  const { data, error, loading } = useApi<ByWardRow[]>(
    tab === "compare" || tab === "overview" || district ? null : "/api/by-ward",
    params,
    EMPTY,
  );
  return {
    rows: useMemo(() => data.filter((row) => row.amount !== 0), [data]),
    error,
    loading,
  };
}
