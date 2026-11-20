import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Popover } from "react-aria-components";

/*
  Nhãn "Cách tính ⓘ" / "Tạm tính ⓘ" — MỘT kiểu cho mọi chỗ giải thích cách
  tính (09/11/2026, người dùng chốt), dựng thành TOGGLETIP (20/11/2026, người
  dùng duyệt theo đánh giá modern-web-guidance):

  • Rê chuột hoặc Tab tới: hiện. Rời đi: ẩn sau một nhịp ngắn, đủ để đưa chuột
    vào hộp — hộp ở lại khi chuột nằm trong nó (WCAG 1.4.13 "Hoverable"), bôi
    chọn được chữ.
  • Bấm, Enter, Space: hiện và GIỮ (không lật đóng — rê chuột thường đã mở
    sẵn, cú bấm theo sau không được đóng nó). Đóng bằng Esc, bấm ra ngoài,
    hoặc focus đi chỗ khác.
  • Cảm ứng: không có hover, chạm để mở, chạm lại hoặc chạm ra ngoài để đóng.
  • Trình đọc màn hình: nút thật có `aria-expanded`; nội dung `role="tooltip"`
    được `aria-controls` trỏ tới. Trước đây nội dung là mô tả phụ
    (`aria-describedby`), NVDA bỏ qua ở chế độ duyệt — mà đây là chữ cán bộ
    cần đọc (cách tính, các bước tìm nguyên nhân).

  Hộp dùng Popover của React Aria ở chế độ không chặn (`isNonModal`): không
  bẫy focus, không lớp phủ, vẫn có portal và tự lật khi sát mép — nên không bị
  cắt trong bảng cuộn hay panel hồ sơ. Không dùng `popover="hint"` +
  `interestfor` gốc: Safari chưa có, phải kèm hai polyfill.

  VỊ TRÍ (09/11/2026, người dùng: đặt cuối hàng điều khiển thì dễ bị bỏ qua):
  ngay SAU TÊN KHỐI mà nó giải thích — chỗ mắt đọc đầu tiên. Ba kiểu:
  • "icon": chỉ ⓘ cạnh tên khối. Màu nói loại: xanh = cách tính, vàng
    (`is-tam-tinh`) = số đang tính tạm. `nhan` lúc này là tên đọc.
  • "trang-thai": nhãn vàng "Tạm tính ⓘ" — cả khối đang tính tạm.
  • "nhan": chữ + ⓘ, cho chỗ đứng một mình.
*/
const NHIP_DONG = 160;

export function GoiYCachTinh({ nhan = "Cách tính", tieuDe = "Cách tính", children, className, placement = "bottom start", kieu = "nhan", tenDoc }: {
  nhan?: string; tieuDe?: string; children: ReactNode; className?: string;
  /** Tên cho trình đọc màn hình khi khác mặc định ("… — xem cách tính"). */
  tenDoc?: string;
  kieu?: "nhan" | "icon" | "trang-thai";
  /** Nhãn sát mép phải thì mở về bên trái ("bottom end"). */
  placement?: "bottom start" | "bottom end";
}) {
  const id = useId();
  const [mo, datMo] = useState(false);
  const nut = useRef<HTMLButtonElement>(null);
  const hop = useRef<HTMLDivElement>(null);
  /* Mở bằng bấm/chạm/Enter thì giữ cho tới khi đóng rõ ràng. */
  const ghim = useRef(false);
  const cham = useRef(false);
  const trongHop = useRef(false);
  const hen = useRef<number | undefined>(undefined);

  const huyHen = () => window.clearTimeout(hen.current);
  const hien = () => { huyHen(); datMo(true); };
  const dong = () => { huyHen(); ghim.current = false; datMo(false); };
  const dongSau = () => { huyHen(); hen.current = window.setTimeout(() => { if (!ghim.current && !trongHop.current) datMo(false); }, NHIP_DONG); };
  const ngoai = (t: EventTarget | null) => !(t instanceof Node) || (!nut.current?.contains(t) && !hop.current?.contains(t));

  useEffect(() => huyHen, []);
  useEffect(() => {
    if (!mo) return;
    const bamNgoai = (e: PointerEvent) => { if (ngoai(e.target)) dong(); };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const traFocus = hop.current?.contains(document.activeElement);
      dong();
      if (traFocus) nut.current?.focus();
    };
    document.addEventListener("pointerdown", bamNgoai, true);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", bamNgoai, true); document.removeEventListener("keydown", esc); };
  }, [mo]);

  return <>
    <button ref={nut} type="button" className={`goi-y-nut is-${kieu}${className ? ` ${className}` : ""}`}
      aria-label={tenDoc ?? (kieu === "icon" ? nhan : `${nhan} — xem cách tính`)}
      aria-expanded={mo} aria-controls={mo ? id : undefined}
      onPointerDown={(e) => { cham.current = e.pointerType !== "mouse"; }}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") hien(); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") dongSau(); }}
      onFocus={hien}
      /* Focus rời đi: đóng, trừ khi sang hộp nội dung hoặc chuột đang trong hộp (đang bôi chữ). */
      onBlur={(e) => { if (ngoai(e.relatedTarget) && !trongHop.current) dong(); }}
      onClick={() => {
        if (cham.current && ghim.current) { dong(); return; }
        ghim.current = true; hien();
      }}>
      {kieu !== "icon" && nhan}
      <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.1" fill="none" stroke="currentColor" strokeWidth="1.9"/><circle cx="10" cy="6.3" r="1.25" fill="currentColor"/><path d="M10 9.1v5.4" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"/></svg>
    </button>
    <Popover triggerRef={nut} isOpen={mo} onOpenChange={(v) => { if (!v) dong(); }} isNonModal
      className="goi-y-hop" placement={placement} offset={6}>
      <div ref={hop} id={id} role="tooltip" className="goi-y-noi-dung"
        onPointerEnter={() => { trongHop.current = true; huyHen(); }}
        onPointerLeave={() => { trongHop.current = false; if (!ghim.current) dongSau(); }}>
        <strong>{tieuDe}</strong>
        {children}
      </div>
    </Popover>
  </>;
}
