import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

/** `a_` — bọc một chart: click để phóng to trong modal 64rem, chart 460px. */
export function ZoomModal({
  title,
  render,
}: {
  title: string;
  render: (height: number) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} className="cursor-zoom-in">
        {render(240)}
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,64rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg border border-line bg-card p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
            <Dialog.Close
              className="rounded px-2 py-1 text-lg leading-none text-muted hover:bg-bg"
              aria-label="Đóng"
            >
              ✕
            </Dialog.Close>
          </div>
          {render(460)}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
