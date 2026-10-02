import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { useAction } from "@/state/ActionContext";

export function ExportButton({ onExport, children }: { onExport: () => Promise<void>; children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const notify = useAction();
  return <Button disabled={busy} aria-busy={busy} onClick={async () => {
    if (busy) return;
    setBusy(true);
    try { await onExport(); notify("Đã tạo tệp báo cáo theo phạm vi đang chọn."); }
    catch { notify("Không thể tạo tệp báo cáo. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }}>{busy ? "Đang tạo tệp…" : children}</Button>;
}
