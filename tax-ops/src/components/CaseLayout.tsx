import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Icon } from "@/components/ui";

const COMPACT_CASE_LAYOUT = "(max-width: 1360px)";

export function useCaseSelection(initialId: string) {
  const [selectedId, setSelectedId] = useState(initialId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const select = (id: string, event: MouseEvent<HTMLElement>) => {
    setSelectedId(id);
    if (window.matchMedia(COMPACT_CASE_LAYOUT).matches) {
      const target = event.currentTarget;
      lastTrigger.current = target instanceof HTMLTableRowElement
        ? target.querySelector<HTMLButtonElement>(".row-select")
        : target;
      setMobileOpen(true);
    }
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
    const media = window.matchMedia(COMPACT_CASE_LAYOUT);
    const sync = () => {
      if (mobileOpen && media.matches && !modal.open) modal.showModal();
      else if ((!mobileOpen || !media.matches) && modal.open) modal.close();
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [mobileOpen]);

  return <div className="case-layout">
    <div className="case-list">{children}</div>
    <aside className="case-detail" aria-label={label}>{detail}</aside>
    <dialog ref={dialog} className="case-detail-dialog" aria-label={label} onClose={onClose}>
      <button type="button" className="case-detail-close" onClick={() => dialog.current?.close()} aria-label="Đóng chi tiết"><Icon name="close" size={20}/></button>
      {detail}
    </dialog>
  </div>;
}
