import { useState } from "react";
import { sortRows, useSort, SortStrip, SortHeaders, type SortCol } from "@/components/SortableHeader";
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

  /**
   * Trạng thái giống nhau ở MỌI dòng đang hiện thì nó thuộc về đầu cột.
   *
   * Đo được: "Vượt dự toán" lặp trên từng dòng của bảng 126 phường/xã. Một cột
   * rộng, đầy trọng lượng, mang đúng không thông tin nào — và mắt người đối
   * soát quét bảng này để tìm NGOẠI LỆ, nên một cột hằng chỉ làm loãng chỗ mà
   * ngoại lệ đáng lẽ phải bật ra.
   */
  /**
   * Số khoản cấu thành giống nhau ở MỌI dòng — đo được: "20 khoản" trên cả 124
   * dòng. Một cột lặp đúng một chuỗi 124 lần không phân biệt được gì, mà vẫn
   * chiếm trọng lượng ngang tên phường/xã ngay cạnh nó.
   */
  const soKhoanChung =
    ordered.length > 1 &&
    ordered.every((row) => (breakdown[row.id] ?? []).length === (breakdown[ordered[0].id] ?? []).length)
      ? (breakdown[ordered[0].id] ?? []).length
      : null;

  const trangThaiChung =
    ordered.length > 1 && ordered.every((row) => row.status === ordered[0].status)
      ? BUDGET_STATUS_LABEL[ordered[0].status]
      : null;

  // Một danh sách cột cho CẢ đầu bảng lẫn hàng chip: hai danh sách thì chỉ cần
  // lệch một cột là chip sắp theo cột khác với cái nó ghi.
  const cot: SortCol<SortKey>[] = [
    // Thông tin không mất đi, nó chuyển lên đầu cột — nơi một câu nói đúng một
    // lần thay cho một chuỗi lặp 124 lần.
    { key: "name", label: soKhoanChung ? `${firstHeader} · mỗi dòng ${soKhoanChung} khoản` : firstHeader },
    { key: "actual", label: columnLabel("Thực hiện", unit), numeric: true, className: "dcol-money" },
    { key: null, label: columnLabel("Dự toán", unit), numeric: true, className: "dcol-money" },
    { key: "completion", label: "Hoàn thành", numeric: true, className: "dcol-pct" },
    { key: "remaining", label: columnLabel("Còn thiếu", unit), numeric: true, className: "dcol-money" },
    { key: "change", label: "So cùng kỳ", numeric: true, className: "dcol-change" },
    { key: "status", label: trangThaiChung ? `Trạng thái · tất cả ${trangThaiChung}` : "Trạng thái", className: "dcol-status" },
  ];

  return (
    <>
    <SortStrip cot={cot} sort={sort} onSort={toggle} nhan="tiến độ dự toán" />
    <div className="dtable-wrap">
      <table className="dtable dbudget-table">
        <caption className="sr-only">
          Tiến độ thực hiện dự toán, mở một dòng để xem thành phần cấu thành
        </caption>
        <thead>
          <tr>
            <SortHeaders cot={cot} sort={sort} onSort={toggle} />
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
                    {/* Số khoản giống nhau ở mọi dòng thì nó không phân biệt được
                        dòng nào với dòng nào; nó đã nằm ở phụ đề thẻ. */}
                    {parts.length > 0 && !soKhoanChung && <em>{parts.length} khoản</em>}
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
                  {trangThaiChung ? null : (
                    <span className={row.status === "atRisk" ? "dtag is-alert" : "dtag is-running"}>
                      {BUDGET_STATUS_LABEL[row.status]}
                    </span>
                  )}
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
    </>
  );
}
