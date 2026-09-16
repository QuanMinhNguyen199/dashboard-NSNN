import type { TmsBreakdownData } from "@/domain/types";
import { Card } from "@/components/primitives";
import { Amount } from "./TmsTables";

/**
 * Cấp quản lý và cấp ngân sách cùng có hai bậc, nên rất dễ bị đọc thành một thứ.
 *
 * Bảng này không còn đo được khoảng chênh — cột cấp quản lý chưa có số. Chỗ
 * trống ở đúng một cột chính là nội dung: vế ngân sách đã có dữ liệu, vế cấp
 * quản lý thì chưa, nên không thể lấy cái này thay cái kia.
 */
export function CorrespondencePanel({ data }: { data: TmsBreakdownData }) {
  return (
    <Card title="Cấp quản lý và cấp ngân sách" subtitle="Hai trường khác nhau của cùng một giao dịch">
      <div className="dtable-wrap">
        <table className="dtable dtms-pairs">
          <caption className="sr-only">
            Đối chiếu cấp quản lý của Chương với cấp ngân sách được hưởng
          </caption>
          <thead>
            <tr>
              <th scope="col">Cấp quản lý của Chương</th>
              <th scope="col" className="is-num">Số tiền</th>
              <th scope="col">Cấp ngân sách hưởng</th>
              <th scope="col" className="is-num">Số tiền</th>
            </tr>
          </thead>
          <tbody>
            {data.correspondence.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.management}</th>
                <td className="is-num" data-label="Số tiền"><Amount value={row.amount} /></td>
                <th scope="row">{row.budget}</th>
                <td className="is-num" data-label="Số tiền"><Amount value={row.budgetAmount} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="dhint">
        Cấp quản lý đọc từ mã Chương; cấp ngân sách được hưởng cần bảng phân bổ riêng và chưa được bàn giao.
        Hai cột cùng hình dạng hai bậc nhưng không suy được ra nhau, nên khi có đủ dữ liệu vẫn phải đối chiếu
        chứ không dùng cột này thay cột kia.
      </p>
    </Card>
  );
}

/**
 * Đối soát tự suy từ dữ liệu, không viết cứng theo trạng thái hôm nay.
 *
 * Hôm nay mọi dòng đều `null` nên kết quả là "chưa có giao dịch". Khi provider
 * API trả số thật, cùng đoạn này tự chuyển sang so tổng mà không phải sửa một
 * dòng nào. Viết cứng câu "chưa có giao dịch" là gài một thứ phải nhớ gỡ, và
 * thứ phải nhớ gỡ thì sẽ không ai gỡ.
 */
function reconcile(data: TmsBreakdownData): { tone: "ok" | "warn"; text: string } {
  const total = data.levelTotal.amount;
  if (total === null || data.sections.some((row) => row.amount === null))
    return { tone: "warn", text: "Chưa có giao dịch TMS để tính" };
  const sum = data.sections.reduce((acc, row) => acc + (row.amount ?? 0), 0);
  return sum === total
    ? { tone: "ok", text: "Khớp tuyệt đối" }
    : { tone: "warn", text: `Lệch ${Math.round(sum - total).toLocaleString("vi-VN")} đồng` };
}

export function QualityPanel({ data }: { data: TmsBreakdownData }) {
  const check = reconcile(data);
  return (
    <Card title="Chất lượng dữ liệu và đối soát" subtitle="Ba phép kiểm tra chạy trên chính số đang hiện">
      <dl className="dtms-quality">
        <div>
          <dt>Tổng theo Mục so với tổng của cấp</dt>
          <dd className={check.tone === "ok" ? "is-ok" : "is-warn"}>{check.text}</dd>
        </div>
        <div>
          <dt>Mã chưa có tên trong danh mục</dt>
          <dd className={data.quality.subItemsWithoutName + data.quality.chaptersWithoutLevel > 0 ? "is-warn" : "is-ok"}>
            {data.quality.subItemsWithoutName} Tiểu mục, {data.quality.chaptersWithoutLevel} Chương
          </dd>
        </div>
        <div>
          <dt>Khoản thu chưa có điều kiện TMS</dt>
          <dd className={data.quality.itemsWithoutRule.length ? "is-warn" : "is-ok"}>
            {data.quality.itemsWithoutRule.length ? data.quality.itemsWithoutRule.join("; ") : "Không có"}
          </dd>
        </div>
      </dl>
      {data.origin === "mock" && (
        <p className="dhint">
          Số ở tầng Chương, Mục và Tiểu mục là <b>số mô phỏng</b> dựng để demo. Tổng cộng khớp tuyệt đối vì
          đây là phép chia lại cùng một tổng, nhưng <b>tỷ lệ</b> giữa các mã là do lớp mô phỏng đặt ra: điều
          kiện báo cáo nói mã nào đủ điều kiện, không nói mã nào chiếm bao nhiêu. Chỉ giao dịch thật mới cho
          ra tỷ lệ đúng, nên đừng đọc thứ hạng giữa các Tiểu mục như kết luận nghiệp vụ.
        </p>
      )}
      <p className="dhint">
        Phạm vi là <b>thu nội địa</b>. Thu xuất nhập khẩu, dầu thô và thu khác chưa có bộ quy tắc TMS riêng.
        Số chi tiết TMS và số tổng hợp Kho bạc có thể khác mốc cập nhật; chỉ đối soát khi cùng kỳ, cùng phạm
        vi chỉ tiêu và cùng mốc dữ liệu.
      </p>
    </Card>
  );
}
