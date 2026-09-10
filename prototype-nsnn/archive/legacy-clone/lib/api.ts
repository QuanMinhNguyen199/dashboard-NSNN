import type { ApiParams } from "./types";

/**
 * Lớp fetch có cache/dedupe — chép lại `e2`, `Sz`, `$w`, `t2` của bundle gốc.
 * Giữ nguyên: sort key, bỏ query rỗng, timeout 30s, cache 30s (danh mục vĩnh viễn),
 * giới hạn 50 entry, và thông điệp lỗi tiếng Việt.
 */

interface Entry {
  controller: AbortController;
  users: number;
  settled: boolean;
  expires: number;
  promise: Promise<unknown>;
}

const CATALOG = ["/api/wards", "/api/periods"];
const cache = new Map<string, Entry>();

/** `e2` — dựng URL đã chuẩn hoá. */
export function buildUrl(pathname: string, params: ApiParams = {}): string {
  const search = new URLSearchParams();
  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    if (value) search.set(key, String(value));
  }
  return search.size ? `${pathname}?${search}` : pathname;
}

/** `Sz` — xoá các entry đã hoàn tất. */
export function clearSettled(): void {
  for (const [key, entry] of cache) if (entry.settled) cache.delete(key);
}

/** `t2` — nút "Tải lại dữ liệu". */
export function refreshAll(): void {
  clearSettled();
  window.dispatchEvent(new Event("nsnn:refresh"));
}

/** `$w` — fetch có dedupe theo URL đã chuẩn hoá. */
export async function apiFetch<T>(
  pathname: string,
  params: ApiParams = {},
  signal?: AbortSignal,
): Promise<T> {
  const url = buildUrl(pathname, params);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  let entry = cache.get(url);
  if (entry && entry.settled && entry.expires <= Date.now()) {
    cache.delete(url);
    entry = undefined;
  }

  if (!entry) {
    const controller = new AbortController();
    const fresh: Entry = {
      controller,
      users: 0,
      settled: false,
      expires: 0,
      promise: Promise.resolve(),
    };
    fresh.promise = (async () => {
      const timer = setTimeout(
        () => controller.abort(new Error("API phản hồi quá lâu. Vui lòng thử lại.")),
        30_000,
      );
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`${pathname} -> HTTP ${res.status}`);
        const type = res.headers.get("content-type");
        if (!type?.includes("application/json"))
          throw new Error(
            `${pathname} -> API không trả JSON. Kiểm tra cấu hình dịch vụ dữ liệu.`,
          );
        const body = await res.json();
        if (CATALOG.includes(pathname) && !Array.isArray(body))
          throw new Error("Danh mục không đúng định dạng.");
        fresh.settled = true;
        fresh.expires = CATALOG.includes(pathname) ? Infinity : Date.now() + 30_000;
        for (const [key, other] of cache) {
          if (cache.size <= 50) break;
          if (other.settled && !CATALOG.includes(key)) cache.delete(key);
        }
        return body;
      } finally {
        clearTimeout(timer);
      }
    })().catch((err) => {
      if (cache.get(url) === fresh) cache.delete(url);
      throw err;
    });
    cache.set(url, fresh);
    entry = fresh;
  }

  const shared = entry;
  return new Promise<T>((resolve, reject) => {
    let done = false;
    const release = () => {
      if (done) return false;
      done = true;
      signal?.removeEventListener("abort", onAbort);
      shared.users--;
      queueMicrotask(() => {
        if (!shared.users && !shared.settled) {
          if (cache.get(url) === shared) cache.delete(url);
          shared.controller.abort();
        }
      });
      return true;
    };
    const onAbort = () => {
      if (release()) reject(new DOMException("Aborted", "AbortError"));
    };
    shared.users++;
    signal?.addEventListener("abort", onAbort, { once: true });
    shared.promise.then(
      (value) => {
        if (release()) resolve(value as T);
      },
      (err) => {
        if (release()) reject(err);
      },
    );
  });
}
