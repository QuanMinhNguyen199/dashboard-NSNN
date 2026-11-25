import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { useAction } from "@/state/ActionContext";

/* Nút xuất mang màu nhận diện của định dạng tệp (03/11/2026): xanh lá Excel,
   xanh dương Word — người xem biết tệp gì sẽ tải về trước khi đọc nhãn.
   11/11/2026 (người dùng): giữ nền màu thương hiệu, thêm icon theo định dạng
   (bảng tính / văn bản), không bóng.
   25/11/2026 (người dùng, phương án A): nhãn chỉ nói định dạng rút còn
   "Excel" / "Word" — icon định dạng và màu nói phần còn lại. Tên đầy đủ
   "Xuất Excel" / "Xuất Word" vẫn có cho trình đọc màn hình và chú thích khi
   rê chuột. Nhãn nói NỘI DUNG xuất ("Xuất bảng này", "Xuất danh sách đang
   lọc", "Xuất Excel kết quả") giữ nguyên: hai nút Excel cạnh nhau chỉ khác
   nhau ở chữ. */
const TEN_DU = { excel: "Xuất Excel", word: "Xuất Word" } as const;
export function ExportButton({ onExport, children, dinhDang = "excel" }: { onExport: () => Promise<void>; children: ReactNode; dinhDang?: "excel" | "word" }) {
  const [busy, setBusy] = useState(false);
  const notify = useAction();
  const chiDinhDang = children === "Excel" || children === "Word";
  /* Đang tạo tệp: GIỮ nhãn, chỉ đổi icon sang đồng hồ — nút không co giãn
     (nhãn cũ "Đang tạo tệp…" dài gấp ba "Excel"). Trạng thái nói bằng
     aria-label / title; kết quả báo bằng thông báo như trước. */
  const ten = busy ? "Đang tạo tệp…" : chiDinhDang ? TEN_DU[dinhDang] : undefined;
  return <Button className={`is-xuat-${dinhDang}`} icon={busy ? "clock" : dinhDang === "word" ? "doc" : "sheet"} disabled={busy} aria-busy={busy}
    {...(ten ? { "aria-label": ten, title: ten } : {})} onClick={async () => {
    if (busy) return;
    setBusy(true);
    try { await onExport(); notify("Đã tạo tệp báo cáo theo phạm vi đang chọn."); }
    catch { notify("Không thể tạo tệp báo cáo. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }}>{children}</Button>;
}
