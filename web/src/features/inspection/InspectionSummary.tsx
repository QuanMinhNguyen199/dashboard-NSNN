import { Bars, inScale, type MoneyScale } from "@/components/primitives";
import type { InspectionTrendPoint } from "@/domain/workspaces";

/**
 * Diễn biến kiểm tra qua từng kỳ.
 *
 * Dùng `Bars` của hệ thay vì vẽ biểu đồ riêng: đây là so sánh độ lớn giữa vài
 * kỳ liền nhau, đúng việc mà thanh ngang làm tốt, và nó đã có sẵn nhãn trực
 * tiếp, tabular numerals và cách dùng bằng bàn phím.
 */
export function InspectionSummary({
  points,
  unit,
}: {
  points: InspectionTrendPoint[];
  unit: MoneyScale;
}) {
  if (!points.length) return <p className="dempty">Kỳ đang chọn chưa có kết quả kiểm tra.</p>;

  return (
    <div className="dstack">
      <div>
        <h3 className="dsubhead">Số cuộc hoàn thành</h3>
        <Bars
          rows={points.map((p) => ({
            id: `case-${p.label}`,
            name: p.label,
            amount: p.completedCases,
            previous: null,
          }))}
        />
      </div>
      <div className="dtms-sublevels">
        <h3>Số tiền xử lý</h3>
        <Bars
          rows={points.map((p) => ({
            id: `amt-${p.label}`,
            name: p.label,
            amount: p.processedAmount,
            previous: null,
          }))}
          money={unit}
          showMoneyUnit
        />
      </div>

      {/* Bảng số liệu thay thế cho phần đồ hoạ. */}
      <details>
        <summary>Xem bảng số liệu</summary>
        <div className="dtable-wrap">
          <table className="dtable is-compact dinspection-mini-table">
            <thead>
              <tr>
                <th scope="col">Kỳ</th>
                <th scope="col" className="is-num">Cuộc hoàn thành</th>
                <th scope="col" className="is-num">Số tiền xử lý</th>
                <th scope="col" className="is-num">Số đã nộp</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.label}>
                  <th scope="row">{p.label}</th>
                  <td className="is-num" data-label="Cuộc hoàn thành">{p.completedCases}</td>
                  <td className="is-num" data-label="Số tiền xử lý">{inScale(p.processedAmount, unit)}</td>
                  <td className="is-num" data-label="Số đã nộp">{inScale(p.paidAmount, unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
