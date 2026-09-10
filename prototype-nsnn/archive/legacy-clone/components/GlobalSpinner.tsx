import { useGlobalLoading } from "../state/LoadingProvider";

/** `R6` — spinner tài nguyên cố định góc trên phải. */
export function GlobalSpinner() {
  const { isLoading } = useGlobalLoading();
  if (!isLoading) return null;
  return (
    <div
      role="status"
      aria-label="Đang tải tài nguyên"
      className="pointer-events-none fixed right-4 top-4 z-[999] rounded-full bg-data-main p-2"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-white" />
    </div>
  );
}
