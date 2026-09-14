import { useEffect, useRef } from "react";
import { SOURCE_BY_CODE, itemsOfSource } from "@/domain/catalog";
import { share, yoy } from "@/domain/metrics";
import { sumOf } from "@/data/mock/observations";
import { trendOf } from "@/data/mock/build";
import { useDashboardState } from "@/state/DashboardState";
import { TrendChart } from "@/components/charts";
import { Change, money, pct } from "@/components/primitives";

/**
 * Drawer xem nhanh một nguồn thu.
 *
 * Chỉ phục vụ xem nhanh; phân tích đầy đủ nằm ở tab Phân tích thu. Hành vi bắt
 * buộc: trap focus, Escape đóng, có nút đóng nhìn thấy được, trả focus về phần
 * tử đã bấm, Back của trình duyệt đóng drawer, và URL trực tiếp mở đúng drawer.
 */
export function RevenuePreviewDrawer() {
  const { panelSource, closePreview, filters, dispatchIntent } = useDashboardState();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!panelSource) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePreview();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      // Trap focus: vòng quanh trong drawer, không rơi ra nền phía sau.
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], select, input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnTo.current?.focus?.();
    };
  }, [panelSource, closePreview]);

  if (!panelSource) return null;
  const source = SOURCE_BY_CODE[panelSource];
  const items = itemsOfSource(panelSource);
  const amount = sumOf(filters, { items });
  const previous = sumOf(filters, { items, year: filters.year - 1 });
  const cityTotal = sumOf(filters);
  const trend = trendOf(filters, { items });
  const change = yoy(amount, previous);

  return (
    <div className="ddrawer-root">
      <div className="ddrawer-scrim" onClick={closePreview} aria-hidden="true" />
      <div
        className="ddrawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        ref={panelRef}
      >
        <header className="ddrawer-head">
          <div>
            <p className="ddrawer-eyebrow">Xem nhanh nguồn thu</p>
            <h2 id="drawer-title">{source.name}</h2>
          </div>
          <button
            type="button"
            className="ddrawer-close"
            onClick={closePreview}
            aria-label="Đóng bảng xem nhanh"
            data-autofocus
          >
            <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
              <path
                d="M1 1l11 11M12 1L1 12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="ddrawer-value">
          <strong>{money(amount)}</strong>
          <Change current={amount} previous={previous} />
        </div>

        <dl className="ddrawer-meta">
          <div>
            <dt>Tỷ trọng trên tổng thu</dt>
            <dd>{pct(share(amount, cityTotal))}</dd>
          </div>
          <div>
            <dt>So cùng kỳ {filters.year - 1}</dt>
            <dd>{change === null ? "chưa đủ cơ sở" : pct(change, true)}</dd>
          </div>
          <div>
            <dt>Kỳ</dt>
            <dd>
              {filters.periodType === "MONTH" ? "Tháng" : "Quý"} {filters.period}/{filters.year}
              {filters.accumulation === "YTD" ? " · lũy kế" : ""}
            </dd>
          </div>
          <div>
            <dt>Cấp ngân sách</dt>
            <dd>{filters.budgetLevel === "NSNN" ? "Tổng NSNN" : filters.budgetLevel}</dd>
          </div>
          <div>
            <dt>Phạm vi</dt>
            <dd>{source.cityOnly ? "Toàn thành phố (không phân bổ)" : "Toàn thành phố Hà Nội"}</dd>
          </div>
          <div>
            <dt>Số khoản</dt>
            <dd>{items.length} khoản</dd>
          </div>
        </dl>

        {source.note && <p className="ddrawer-note">{source.note}</p>}

        <div className="ddrawer-chart">
          <TrendChart points={trend} year={filters.year} height={180} />
        </div>

        <button
          type="button"
          className="dbtn dbtn-primary ddrawer-cta"
          onClick={() =>
            dispatchIntent({ type: "OPEN_REVENUE_ANALYSIS", sourceId: panelSource, view: "overview" })
          }
        >
          Xem phân tích đầy đủ
        </button>
      </div>
    </div>
  );
}
