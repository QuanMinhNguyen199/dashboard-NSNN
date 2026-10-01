import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Icon } from "@/components/ui";

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

export function CaseLayout({ children, detail, mobileOpen, onClose, label }: {
  children: ReactNode;
  detail: ReactNode;
  mobileOpen: boolean;
  onClose: () => void;
  label: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    if (mobileOpen && !modal.open) modal.showModal();
    else if (!mobileOpen && modal.open) modal.close();
  }, [mobileOpen]);

  return <div className="case-layout">
    <div className="case-list">{children}</div>
    <dialog ref={dialog} className="case-detail-dialog" aria-label={label} onClose={onClose}>
      <button type="button" className="case-detail-close" onClick={() => dialog.current?.close()} aria-label="Đóng chi tiết"><Icon name="close" size={20}/></button>
      {detail}
    </dialog>
  </div>;
}
