import { useEffect } from "react";
import type { TaxpayerRow } from "@/domain/types";
import { inScale, moneyScale } from "@/components/primitives";

export function TaxpayerDrawer({ row, onClose }: { row: TaxpayerRow | null; onClose: () => void }) {
  useEffect(() => {
    if (!row) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [row, onClose]);

  if (!row) return null;
  const history = [0.08, 0.1, 0.11, 0.1, 0.12, 0.13, 0.11, 0.15].map((ratio, index) => ({
    id: `m${index + 1}`,
    name: `T${index + 1}`,
    amount: Math.round(row.amount * ratio),
  }));
  const taxes = [
    { id: "gtgt", name: "Thuế GTGT", amount: Math.round(row.amount * 0.52) },
    { id: "tndn", name: "Thuế TNDN", amount: Math.round(row.amount * 0.34) },
    { id: "khac", name: "Khoản thu khác", amount: row.amount - Math.round(row.amount * 0.52) - Math.round(row.amount * 0.34) },
  ];
  const unit = moneyScale([row.amount, ...history.map((item) => item.amount)]);
  const max = Math.max(...history.map((item) => item.amount), 1);

  return (
    <div className="dtaxpayer-scrim" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside className="dtaxpayer-drawer" role="dialog" aria-modal="true" aria-labelledby="taxpayer-title">
        <header>
          <div>
            <span className="dtag is-review">Dữ liệu mô phỏng</span>
            <h2 id="taxpayer-title">{row.name}</h2>
            <p>{row.displayCode} · {row.industry}</p>
          </div>
          <button type="button" className="dbtn" onClick={onClose} aria-label="Đóng chi tiết doanh nghiệp">Đóng</button>
        </header>
        <dl className="dtaxpayer-meta">
          <div><dt>Đơn vị quản lý</dt><dd>{row.taxOffice ?? "Chưa xác định"}</dd></div>
          <div><dt>Tổng số đã nộp</dt><dd>{inScale(row.amount, unit)} {unit.short}</dd></div>
        </dl>
        <section>
          <h3>Lịch sử nộp theo tháng</h3>
          <div className="dtaxpayer-history" aria-label="Lịch sử nộp thuế mô phỏng">
            {history.map((item) => (
              <div key={item.id} title={`${item.name}: ${inScale(item.amount, unit)} ${unit.short}`}>
                <i style={{ height: `${Math.max((item.amount / max) * 100, 4)}%` }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3>Cơ cấu khoản đã nộp</h3>
          <ul className="dtaxpayer-taxes">
            {taxes.map((item) => <li key={item.id}><span>{item.name}</span><strong>{inScale(item.amount, unit)} {unit.short}</strong></li>)}
          </ul>
        </section>
      </aside>
    </div>
  );
}
