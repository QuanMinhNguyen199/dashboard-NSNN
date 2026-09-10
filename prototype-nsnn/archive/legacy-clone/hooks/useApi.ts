import { useEffect, useState } from "react";
import { apiFetch, buildUrl } from "../lib/api";
import { useFilters } from "../state/FiltersProvider";
import type { ApiParams } from "../lib/types";

interface ApiState<T> {
  identity: string;
  data: T;
  error: string | null;
  loading: boolean;
}

/**
 * `At` — hook fetch dùng chung cho mọi card.
 * `path` null nghĩa là không gọi (card đó không áp dụng ở scope hiện tại).
 * Chờ danh mục sẵn sàng trước khi gọi; lắng nghe `nsnn:refresh` từ nút Tải lại dữ liệu.
 */
export function useApi<T>(
  path: string | null,
  params: ApiParams,
  fallback: T,
): { data: T; error: string | null; loading: boolean } {
  const { catalogReady, catalogError } = useFilters();
  const [nonce, setNonce] = useState(0);
  const url = path ? buildUrl(path, params) : "";
  const identity = `${nonce}:${url}`;
  const [state, setState] = useState<ApiState<T>>();

  useEffect(() => {
    const bump = () => setNonce((n) => n + 1);
    window.addEventListener("nsnn:refresh", bump);
    return () => window.removeEventListener("nsnn:refresh", bump);
  }, []);

  useEffect(() => {
    if (!path || !catalogReady) return;
    const controller = new AbortController();
    setState({ identity, data: fallback, error: null, loading: true });
    apiFetch<T>(path, params, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setState({ identity, data, error: null, loading: false });
      },
      (err) => {
        if (!controller.signal.aborted)
          setState({ identity, data: fallback, error: String(err), loading: false });
      },
    );
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, catalogReady]);

  if (!path) return { data: fallback, error: null, loading: false };
  if (!catalogReady)
    return { data: fallback, error: catalogError, loading: !catalogError };
  if (state?.identity !== identity) return { data: fallback, error: null, loading: true };
  return state;
}
