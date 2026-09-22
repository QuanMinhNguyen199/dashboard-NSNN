import { sortRows, useSort, SortStrip, SortHeaders, type SortCol } from "@/components/SortableHeader";
import { columnLabel, inScale, pct, type MoneyScale } from "@/components/primitives";
import { INSPECTION_STATUS_LABEL, type InspectionUnitRow } from "@/domain/workspaces";

type SortKey = "name" | "cases" | "completion" | "processed" | "paid" | "paidRate";

/**
 * Kết quả kiểm tra theo đơn vị.
 *
 * Dòng "Cộng" là phần bắt buộc, không phải trang trí: KPI phía trên cộng từ
 * chính bảng này, nên nếu hai chỗ lệch nhau thì lãnh đạo và cán bộ đang đọc hai
 * con số khác nhau về cùng một kỳ. Có dòng cộng thì đối chiếu được ngay tại chỗ.
 */
export function InspectionReportTable({
  units,
  unit,
}: {
  units: InspectionUnitRow[];
  unit: MoneyScale;
}) {
  const { sort, toggle } = useSort<SortKey>("processed");
  if (!units.length) return <p className="dempty">Không có đơn vị nào ở trạng thái đang lọc.</p>;

  const ordered = sortRows(units, sort, (row, key) =>
    key === "name"
      ? row.name
      : key === "cases"
        ? row.totalCases
        : key === "completion"
          ? row.completionRate
          : key === "paid"
            ? row.paidAmount
            : key === "paidRate"
              ? row.paidRate
              : row.processedAmount,
  );

  const sum = {
    totalCases: units.reduce((s, u) => s + u.totalCases, 0),
    completedCases: units.reduce((s, u) => s + u.completedCases, 0),
    processedAmount: units.reduce((s, u) => s + u.processedAmount, 0),
    paidAmount: units.reduce((s, u) => s + u.paidAmount, 0),
  };

  const cot: SortCol<SortKey>[] = [
    { key: "name", label: "Đơn vị" },
    { key: "cases", label: "Số cuộc", numeric: true, className: "dcol-pct" },
    { key: "completion", label: "Hoàn thành", numeric: true, className: "dcol-pct" },
    { key: "processed", label: columnLabel("Số tiền xử lý", unit), numeric: true, className: "dcol-money" },
    { key: "paid", label: columnLabel("Đã nộp", unit), numeric: true, className: "dcol-money" },
    { key: "paidRate", label: "Tỷ lệ nộp", numeric: true, className: "dcol-pct" },
  ];

  return (
    <>
    <SortStrip cot={cot} sort={sort} onSort={toggle} nhan="kết quả kiểm tra" />
    <div className="dtable-wrap">
      <table className="dtable dinspect-table">
        <caption className="sr-only">Kết quả kiểm tra theo đơn vị</caption>
        <thead>
          <tr>
            <SortHeaders cot={cot} sort={sort} onSort={toggle} />
          </tr>
        </thead>
        <tbody>
          {ordered.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.name}</th>
              <td className="is-num" data-label="Số cuộc">
                {row.completedCases}/{row.totalCases}
              </td>
              <td className="is-num" data-label="Hoàn thành">
                {pct(row.completionRate)}
              </td>
              <td className="is-num" data-label="Số tiền xử lý">
                {inScale(row.processedAmount, unit)}
              </td>
              <td className="is-num" data-label="Đã nộp">
                {inScale(row.paidAmount, unit)}
              </td>
              <td className="is-num" data-label="Tỷ lệ nộp">
                {pct(row.paidRate)}
              </td>
              <td data-label="Trạng thái">
                {/* "Đang thực hiện" không phải một cảnh báo; chỉ "Chậm tiến độ"
                    mới cần ai đó làm gì. Cho cả hai cùng một sắc là giấu dòng
                    cần xử lý giữa những dòng không cần. */}
                <span
                  className={
                    row.status === "late"
                      ? "dtag is-alert"
                      : row.status === "completed"
                        ? "dtag"
                        : "dtag is-running"
                  }
                >
                  {INSPECTION_STATUS_LABEL[row.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Cộng</th>
            <td className="is-num" data-label="Số cuộc">
              {sum.completedCases}/{sum.totalCases}
            </td>
            <td className="is-num" data-label="Hoàn thành">
              {pct(sum.totalCases === 0 ? null : (sum.completedCases / sum.totalCases) * 100)}
            </td>
            <td className="is-num" data-label="Số tiền xử lý">
              {inScale(sum.processedAmount, unit)}
            </td>
            <td className="is-num" data-label="Đã nộp">
              {inScale(sum.paidAmount, unit)}
            </td>
            <td className="is-num" data-label="Tỷ lệ nộp">
              {pct(sum.processedAmount === 0 ? null : (sum.paidAmount / sum.processedAmount) * 100)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
    </>
  );
}
