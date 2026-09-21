import { SortHeader, sortRows, useSort } from "@/components/SortableHeader";
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

  return (
    <div className="dtable-wrap">
      <table className="dtable dinspect-table">
        <caption className="sr-only">Kết quả kiểm tra theo đơn vị</caption>
        <thead>
          <tr>
            <SortHeader sortKey="name" label="Đơn vị" sort={sort} onSort={toggle} />
            <SortHeader sortKey="cases" label="Số cuộc" numeric className="dcol-pct" sort={sort} onSort={toggle} />
            <SortHeader
              sortKey="completion"
              label="Hoàn thành"
              numeric
              className="dcol-pct"
              sort={sort}
              onSort={toggle}
            />
            <SortHeader
              sortKey="processed"
              label={columnLabel("Số tiền xử lý", unit)}
              numeric
              className="dcol-money"
              sort={sort}
              onSort={toggle}
            />
            <SortHeader
              sortKey="paid"
              label={columnLabel("Đã nộp", unit)}
              numeric
              className="dcol-money"
              sort={sort}
              onSort={toggle}
            />
            <SortHeader
              sortKey="paidRate"
              label="Tỷ lệ nộp"
              numeric
              className="dcol-pct"
              sort={sort}
              onSort={toggle}
            />
            <th scope="col" className="dcol-status">Trạng thái</th>
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
                <span className={row.status === "completed" ? "dtag" : "dtag is-review"}>
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
  );
}
