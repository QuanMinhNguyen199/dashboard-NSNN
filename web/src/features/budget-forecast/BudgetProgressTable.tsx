import { useState } from "react";
import { SortHeader, sortRows, useSort } from "@/components/SortableHeader";
import { Change, columnLabel, inScale, pct, type MoneyScale } from "@/components/primitives";
import {
  BUDGET_STATUS_LABEL,
  type BudgetBreakdownRow,
  type BudgetProgressRow,
  type BudgetViewBy,
} from "@/domain/workspaces";

type SortKey = "name" | "completion" | "actual" | "remaining" | "change" | "status";

/**
 * Bảng tiến độ dự toán, dùng chung cho cả hai góc nhìn.
 *
 * Một cấu trúc bảng cho cả "theo địa bàn" và "theo khoản thu" là chủ ý: hai
 * chế độ trả lời cùng một câu hỏi từ hai phía, nên chúng phải sắp xếp, mở rộng
 * và xuất file giống hệt nhau. Hai bảng riêng sẽ trôi khỏi nhau sau vài lượt sửa.
 */
export function BudgetProgressTable({
  rows,
  breakdown,
  viewBy,
  unit,
}: {
  rows: BudgetProgressRow[];
  breakdown: Record<string, BudgetBreakdownRow[]>;
  viewBy: BudgetViewBy;
  unit: MoneyScale;
}) {
  const { sort, toggle } = useSort<SortKey>("completion");
  const [open, setOpen] = useState<string | null>(null);

  if (!rows.length)
    return <p className="dempty">Không có dòng nào ở trạng thái đang lọc.</p>;

  const ordered = sortRows(rows, sort, (row, key) =>
    key === "name"
      ? row.name
      : key === "completion"
        ? row.completionRate
        : key === "remaining"
          ? row.remaining
          : key === "change"
            ? row.previous === null
              ? null
              : row.actual - row.previous
            : key === "status"
              ? row.status
              : row.actual,
  );

  const firstHeader = viewBy === "location" ? "Phường, xã" : "Khoản thu";

  return (
    <div className="dtable-wrap">
      <table className="dtable dbudget-table">
        <caption className="sr-only">
          Tiến độ thực hiện dự toán, mở một dòng để xem thành phần cấu thành
        </caption>
        <thead>
          <tr>
            <SortHeader sortKey="name" label={firstHeader} sort={sort} onSort={toggle} />
            <SortHeader
              sortKey="actual"
              label={columnLabel("Thực hiện", unit)}
              numeric
              className="dcol-money"
              sort={sort}
              onSort={toggle}
            />
            <th scope="col" className="is-num dcol-money">
              {columnLabel("Dự toán", unit)}
            </th>
            <SortHeader
              sortKey="completion"
              label="Hoàn thành"
              numeric
              className="dcol-pct"
              sort={sort}
              onSort={toggle}
            />
            <SortHeader
              sortKey="remaining"
              label={columnLabel("Còn thiếu", unit)}
              numeric
              className="dcol-money"
              sort={sort}
              onSort={toggle}
            />
            <SortHeader
              sortKey="change"
              label="So cùng kỳ"
              numeric
              className="dcol-change"
              sort={sort}
              onSort={toggle}
            />
            <SortHeader sortKey="status" label="Trạng thái" className="dcol-status" sort={sort} onSort={toggle} />
          </tr>
        </thead>
        {ordered.map((row) => {
          const expanded = open === row.id;
          const parts = breakdown[row.id] ?? [];
          return (
            <tbody key={row.id}>
              <tr className={expanded ? "is-open" : undefined}>
                <th scope="row">
                  <button
                    type="button"
                    className="dtms-toggle"
                    aria-expanded={expanded}
                    disabled={parts.length === 0}
                    onClick={() => setOpen(expanded ? null : row.id)}
                  >
                    <span aria-hidden="true" className="dtms-caret" />
                    {row.name}
                    {parts.length > 0 && <em>{parts.length} khoản</em>}
                  </button>
                </th>
                <td className="is-num" data-label="Thực hiện">
                  {inScale(row.actual, unit)}
                </td>
                <td className="is-num" data-label="Dự toán">
                  {inScale(row.plan, unit)}
                </td>
                <td className="is-num" data-label="Hoàn thành">
                  {pct(row.completionRate)}
                </td>
                {/* Còn thiếu hiện giá trị tuyệt đối; chiều đã nằm ở cột Trạng
                    thái, nên một dấu trừ ở đây chỉ thêm một thứ phải giải mã. */}
                <td className="is-num" data-label="Còn thiếu">
                  {inScale(Math.abs(row.remaining), unit)}
                </td>
                <td className="is-num" data-label="So cùng kỳ">
                  <Change current={row.actual} previous={row.previous} label="" />
                </td>
                <td data-label="Trạng thái">
                  <span className={row.status === "atRisk" ? "dtag is-review" : "dtag"}>
                    {BUDGET_STATUS_LABEL[row.status]}
                  </span>
                </td>
              </tr>
              {expanded &&
                parts.map((part) => (
                  <tr key={part.id} className="is-child">
                    <th scope="row">{part.name}</th>
                    <td className="is-num" data-label="Thực hiện">
                      {inScale(part.actual, unit)}
                    </td>
                    <td className="is-num" data-label="Dự toán">
                      {inScale(part.plan, unit)}
                    </td>
                    <td className="is-num" data-label="Hoàn thành">
                      {pct(part.completionRate)}
                    </td>
                    <td className="is-num" data-label="Còn thiếu">
                      {inScale(Math.abs(part.plan - part.actual), unit)}
                    </td>
                    <td className="is-num" data-label="So cùng kỳ">
                      <Change current={part.actual} previous={part.previous} label="" />
                    </td>
                    <td />
                  </tr>
                ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
