import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Icon } from "@/components/ui";
import { createPortal } from "react-dom";

/*
  Chi tiết một bản ghi mở trong THANH TRƯỢT bên phải, ở MỌI khổ màn hình.

  Trước đây từ 1361px trở lên có một cột chi tiết đứng cố định bên phải, và chỉ
  dưới ngưỡng đó mới dùng thanh trượt. Cột cố định ấy có ba giá đắt:

  1. Nó chiếm 30% bề ngang suốt thời gian, kể cả khi người dùng chỉ đang đọc
     bảng — mà bảng mới là thứ cần bề ngang, đúng chỗ tên doanh nghiệp đang
     phải xuống dòng.
  2. Nó luôn hiện một bản ghi, nên lúc vừa mở màn nó hiện bản ghi ĐẦU TIÊN —
     một hồ sơ người dùng chưa chọn và chưa chắc quan tâm.
  3. Hai đường dựng song song cho cùng một nội dung: cột và thanh trượt phải
     nuôi cùng lúc, và mỗi luật bố cục mới phải kiểm hai lần.

  Thanh trượt giải quyết cả ba: bảng giữ trọn bề ngang, chi tiết chỉ xuất hiện
  khi được yêu cầu, và chỉ còn một đường dựng.
*/
export function useCaseSelection(initialId: string) {
  const [selectedId, setSelectedId] = useState(initialId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const select = (id: string, event: MouseEvent<HTMLElement>) => {
    setSelectedId(id);
    /* Nhớ nơi vừa bấm để trả focus về đúng hàng khi đóng — người dùng bàn phím
       không bị ném về đầu bảng sau mỗi lần xem chi tiết. */
    const target = event.currentTarget;
    lastTrigger.current = target instanceof HTMLTableRowElement
      ? target.querySelector<HTMLButtonElement>(".row-select")
      : target;
    setMobileOpen(true);
  };
  const close = () => {
    setMobileOpen(false);
    requestAnimationFrame(() => lastTrigger.current?.focus());
  };

  return { selectedId, setSelectedId, select, mobileOpen, close };
}

export function CaseLayout({ children, detail, mobileOpen, onClose, label, presentation = "inline" }: {
  children: ReactNode;
  detail: ReactNode;
  mobileOpen: boolean;
  onClose: () => void;
  label: string;
  presentation?: "inline" | "drawer";
}) {
  const khoi = useRef<HTMLElement>(null);

  /*
    Chi tiết hồ sơ mở ngay DƯỚI bảng, trong luồng trang — không còn là ngăn
    trượt phủ lên bảng.

    Ngăn trượt che mất chính cái bảng mà người dùng vừa chọn một dòng trong
    đó, nên muốn so hồ sơ này với dòng kế bên thì phải đóng ra đóng vào. Nó
    cũng mang đủ ba cái giá đã khiến bản xem trước bỏ hộp thoại (ghi ở đầu
    `features/XemTruocBaoCao.tsx`): không lọt vào ảnh chụp hay bản bàn giao,
    dựa vào `<dialog>`/`::backdrop`/bẫy focus của riêng nền web, và không có
    địa chỉ để trợ lý dẫn tới.

    `tabIndex={-1}` cùng cú `focus()`: khối mới hiện ra ở cuối trang thì người
    dùng bàn phím và trình đọc màn hình phải được đưa tới đó, vì không có bẫy
    focus nào làm việc ấy thay nữa. Nút Đóng trả focus về đúng dòng vừa bấm,
    như cũ.
  */
  useEffect(() => { if (mobileOpen && presentation === "inline") khoi.current?.focus(); }, [mobileOpen, presentation]);

  return <div className="case-layout">
    <div className="case-list">{children}</div>
    {mobileOpen && presentation === "drawer" && <CaseDrawer label={label} onClose={onClose}>{detail}</CaseDrawer>}
    {mobileOpen && presentation === "inline" && <section
      ref={khoi}
      tabIndex={-1}
      className="case-detail"
      aria-label={label}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      {/* Nút mang NHÃN, không chỉ dấu nhân: khối nay rộng bằng cả cột nội dung,
          nên một ô vuông 44px đứng một mình ở góc phải đọc thành một dải trống
          có vết mực, chứ không thành một hàng công cụ. */}
      <button type="button" className="case-detail-close" onClick={onClose}><Icon name="close" size={16}/><span>Đóng chi tiết</span></button>
      {detail}
    </section>}
  </div>;
}

function CaseDrawer({ children, label, onClose }: { children: ReactNode; label: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    const overflow = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = "hidden";
    return () => { node?.close(); document.body.style.overflow = overflow; };
  }, []);
  return createPortal(<dialog
    ref={dialog}
    className="case-drawer"
    aria-label={label}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}
  >
    <header className="case-drawer-heading"><h2>{label}</h2><button autoFocus type="button" className="case-detail-close" onClick={onClose}><Icon name="close" size={16}/><span>Đóng chi tiết</span></button></header>
    <div className="case-drawer-body">{children}</div>
  </dialog>, document.body);
}
