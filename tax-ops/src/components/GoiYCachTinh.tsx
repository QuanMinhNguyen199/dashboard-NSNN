import { useEffect, useRef, useState, type ReactNode } from "react";
import { Focusable, Tooltip, TooltipTrigger } from "react-aria-components";

/*
  Nhãn "Cách tính ⓘ" / "Tạm tính ⓘ" — MỘT kiểu cho mọi chỗ giải thích cách
  tính (09/11/2026, người dùng chốt):

  • Chuột: rê vào là hiện, rời ra là ẩn. Bấm KHÔNG làm gì — nhãn không phải
    nút, không có trạng thái bấm.
  • Bàn phím: Tab tới là hiện (React Aria mở tooltip khi focus bằng bàn phím),
    Esc đóng.
  • Cảm ứng: không có hover, nên CHẠM để mở/đóng, chạm ra ngoài thì đóng —
    nếu không, người dùng máy tính bảng không đọc được cách tính. Chạm được
    nhận ra qua `pointerType`, nên trên máy tính chuột bấm vẫn không làm gì.

  VỊ TRÍ (09/11/2026, người dùng: đặt cuối hàng điều khiển thì dễ bị bỏ qua):
  ngay SAU TÊN KHỐI mà nó giải thích — chỗ mắt đọc đầu tiên. Ba kiểu:
  • "icon": chỉ ⓘ cạnh tên khối (09/11/2026, người dùng chốt bỏ chữ). Màu
    nói loại: xanh = cách tính, vàng (`is-tam-tinh`) = số đang tính tạm.
    `nhan` lúc này là tên đọc cho trình đọc màn hình.
  • "trang-thai": nhãn vàng "Tạm tính ⓘ" — cả khối đang tính tạm.
  • "nhan": chữ + ⓘ, cho chỗ đứng một mình.
*/
export function GoiYCachTinh({ nhan = "Cách tính", tieuDe = "Cách tính", children, className, placement = "bottom start", kieu = "nhan", tenDoc }: {
  nhan?: string; tieuDe?: string; children: ReactNode; className?: string;
  /** Tên cho trình đọc màn hình khi khác mặc định ("… — xem cách tính"). */
  tenDoc?: string;
  kieu?: "nhan" | "icon" | "trang-thai";
  /** Nhãn sát mép phải thì mở về bên trái ("bottom end"). */
  placement?: "bottom start" | "bottom end";
}) {
  const [mo, datMoNoi] = useState(false);
  const cham = useRef(false);
  /* Mở bằng CHẠM: React Aria tự gọi đóng ngay sau cú chạm (nó coi chạm như
     rời chuột). Khi đó chỉ chạm lại nhãn hoặc chạm ra ngoài mới đóng. */
  const moBangCham = useRef(false);
  const datMo = (v: boolean) => { if (!v) moBangCham.current = false; datMoNoi(v); };
  const nut = useRef<HTMLSpanElement>(null);

  /* Mở bằng chạm thì chạm ra ngoài là đóng. */
  useEffect(() => {
    if (!mo) return;
    const ngoai = (e: PointerEvent) => { if (!nut.current?.contains(e.target as Node)) datMo(false); };
    document.addEventListener("pointerdown", ngoai, true);
    return () => document.removeEventListener("pointerdown", ngoai, true);
  }, [mo]);

  return <TooltipTrigger delay={0} closeDelay={0} shouldCloseOnPress={false} isOpen={mo} onOpenChange={(v) => { if (!v && moBangCham.current) return; datMo(v); }}>
    <Focusable>
      <span ref={nut} className={`goi-y-nut is-${kieu}${className ? ` ${className}` : ""}`} tabIndex={0} role="button" aria-label={tenDoc ?? (kieu === "icon" ? nhan : `${nhan} — xem cách tính`)}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") datMo(true); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") datMo(false); }}
        onFocus={() => datMo(true)}
        onBlur={() => datMo(false)}
        onKeyDown={(e) => { if (e.key === "Escape") datMo(false); }}
        onPointerDown={(e) => { cham.current = e.pointerType === "touch"; }}
        /* Chạm: React Aria có thể đã mở sẵn khi nhãn nhận focus từ cú chạm,
           nên lật theo cờ "đã mở bằng chạm", không theo `mo`. */
        onClick={() => { if (!cham.current) return; if (moBangCham.current) datMo(false); else { moBangCham.current = true; datMoNoi(true); } }}>
        {kieu !== "icon" && nhan}
        <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.1" fill="none" stroke="currentColor" strokeWidth="1.9"/><circle cx="10" cy="6.3" r="1.25" fill="currentColor"/><path d="M10 9.1v5.4" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"/></svg>
      </span>
    </Focusable>
    <Tooltip className="goi-y-hop" placement={placement} offset={6}>
      <div className="goi-y-noi-dung">
        <strong>{tieuDe}</strong>
        {children}
      </div>
    </Tooltip>
  </TooltipTrigger>;
}
