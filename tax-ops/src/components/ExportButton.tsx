import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { useAction } from "@/state/ActionContext";

/* Nút xuất mang màu nhận diện của định dạng tệp (03/11/2026): xanh lá Excel,
   xanh dương Word — người xem biết tệp gì sẽ tải về trước khi đọc nhãn.
   11/11/2026 (người dùng): giữ nền màu thương hiệu, thêm icon theo định dạng
   (bảng tính / văn bản), không bóng. */
export function ExportButton({ onExport, children, dinhDang = "excel" }: { onExport: () => Promise<void>; children: ReactNode; dinhDang?: "excel" | "word" }) {
  const [busy, setBusy] = useState(false);
  const notify = useAction();
  return <Button className={`is-xuat-${dinhDang}`} icon={busy ? undefined : dinhDang === "word" ? "doc" : "sheet"} disabled={busy} aria-busy={busy} onClick={async () => {
    if (busy) return;
    setBusy(true);
    try { await onExport(); notify("Đã tạo tệp báo cáo theo phạm vi đang chọn."); }
    catch { notify("Không thể tạo tệp báo cáo. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }}>{busy ? "Đang tạo tệp…" : children}</Button>;
}
