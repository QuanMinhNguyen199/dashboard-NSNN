import { Icon } from "@/components/ui";

/*
  Chỉ báo thay chữ trạng thái (11/11/2026, người dùng: "thay bớt bằng icon,
  indicator"). Mỗi chỉ báo vẫn mang TÊN ĐẦY ĐỦ cho trình đọc màn hình và
  `title` khi rê chuột — icon thay chữ trên màn, không thay nghĩa.

  Màu không đứng một mình: ✓ và ✗ khác HÌNH, nên người không phân biệt được
  xanh/đỏ vẫn đọc được.
*/
export function DauDat({ ok, nhan, chuDat = "Đạt", chuKhong = "Không đạt" }: { ok: boolean; nhan: string; chuDat?: string; chuKhong?: string }) {
  const chu = ok ? chuDat : chuKhong;
  return <span className={`dau-dat ${ok ? "is-dat" : "is-khong"}`} role="img" aria-label={`${nhan}: ${chu}`} title={chu}>
    <Icon name={ok ? "check" : "close"} size={14}/>
    {!ok && <span aria-hidden="true">{chu}</span>}
  </span>;
}

/** Mã trạng thái kèm nghĩa trong `title`: "06 · Không hoạt động…" → chip "MST 06". */
export function ChipMa({ giaTri, tienTo = "MST" }: { giaTri: string; tienTo?: string }) {
  const [ma, ...con] = giaTri.split(" · ");
  const nghia = con.join(" · ");
  const tot = ma === "00";
  return <span className={`chip-ma${tot ? " is-tot" : ""}`} title={nghia || undefined}>
    <span aria-hidden="true">{tienTo} {ma}</span>
    <span className="sr-only">{tienTo} {ma}{nghia ? `, ${nghia}` : ""}</span>
  </span>;
}
