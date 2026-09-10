import type { ReactNode } from "react";
import { cx } from "../lib/format";

/** `Ut` — card chuẩn: tiêu đề uppercase + vùng nội dung. */
export function Card({
  title,
  headerAction,
  className,
  children,
}: {
  title: ReactNode;
  headerAction?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cx("nsnn-card rounded-lg border border-line bg-card p-4", className)}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="m-0 text-[.85rem] uppercase tracking-wide text-muted">{title}</h2>
        {headerAction}
      </div>
      {children}
    </div>
  );
}
