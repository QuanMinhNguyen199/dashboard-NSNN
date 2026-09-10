import type { ReactNode } from "react";
import { refreshAll } from "../lib/api";

/** `Yt` — bọc trạng thái loading/error của từng card. */
export function Async({
  loading,
  error,
  children,
}: {
  loading?: boolean;
  error?: string | null;
  children?: ReactNode;
}) {
  if (loading)
    return (
      <div
        role="status"
        aria-busy="true"
        className="min-h-28 rounded-lg border border-line bg-card p-4 text-sm text-muted"
      >
        Đang tải dữ liệu…
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="min-h-28 rounded-lg border border-line bg-card p-4 text-sm text-muted"
      >
        Không tải được dữ liệu.{" "}
        <button className="underline" onClick={refreshAll}>
          Thử lại
        </button>
      </div>
    );
  return <>{children}</>;
}
