import type { TmsBreakdownData } from "@/domain/types";
import { useMemo } from "react";
import { taxOfficeLocationIds } from "@/domain/tms";
import { LOCATION_BY_ID } from "@/domain/catalog";
import { Card, columnLabel, inScale, moneyScale } from "@/components/primitives";
import { Amount } from "./TmsTables";
import { toDisplayNumber } from "@/domain/money";

/** Các địa bàn do CQT đang chọn quản lý; bộ lọc CQT nằm trên thanh lọc chính. */
export function TaxOfficeAssignedAreas({
  data,
  selectedCode,
}: {
  data: TmsBreakdownData | null;
  selectedCode: string | null;
}) {
  const selectedScope = data?.taxOfficeScopes?.offices.find((office) => office.code === selectedCode);
  const selectedLocations = useMemo(() => {
    if (!selectedCode) return [];
    const amounts = new Map((selectedScope?.locations ?? []).map((row) => [row.id, row.amount]));
    return taxOfficeLocationIds(selectedCode).map((id) => ({
      id,
      name: LOCATION_BY_ID[id]?.name ?? id,
      amount: amounts.get(id) ?? null,
    })).sort((a, b) =>
      (toDisplayNumber(b.amount) ?? -Infinity) - (toDisplayNumber(a.amount) ?? -Infinity)
      || a.name.localeCompare(b.name, "vi"),
    );
  }, [selectedCode, selectedScope]);
  const locationScale = useMemo(() => {
    const scale = moneyScale(selectedLocations.map((row) => toDisplayNumber(row.amount)));
    // Một chữ số thập phân cho cả cột giúp phân biệt dấu nghìn với dấu thập phân.
    return { ...scale, decimals: scale.divisor === 1 ? 0 : 1 };
  }, [selectedLocations]);
  const locationAmount = (value: number | null) =>
    value === 0
      ? (0).toLocaleString("vi-VN", { minimumFractionDigits: locationScale.decimals })
      : inScale(value, locationScale);

  if (!selectedCode) return null;
  return (
    <section className="dtax-scope is-compact" aria-labelledby="tax-office-location-title">
      <div className="dtax-scope-head">
        <div className="dtax-scope-titleline">
          <h3 id="tax-office-location-title">Địa bàn phụ trách</h3>
          <span className={data?.taxOfficeScopes?.origin === "mock" ? "dtag is-review" : "dtag"}>
            {data?.taxOfficeScopes?.origin === "mock" ? "Số thu mô phỏng" : `Kỳ ${data?.taxOfficeScopes?.period ?? ""}`}
          </span>
        </div>
        <p>{selectedLocations.length.toLocaleString("vi-VN")} phường/xã · Sắp theo số thu giảm dần</p>
      </div>
      {selectedLocations.length > 0 ? (
        <table className="dtax-locations">
          <caption className="sr-only">Địa bàn phụ trách, sắp theo số thu giảm dần</caption>
          <thead>
            <tr><th scope="col">STT</th><th scope="col">Địa bàn</th><th scope="col">{columnLabel("Số thu", locationScale)}</th></tr>
          </thead>
          <tbody>
            {selectedLocations.map((row, index) => (
              <tr key={row.id}>
                <td className="dtax-rank">{String(index + 1).padStart(2, "0")}</td>
                <td className="dtax-name">{row.name}</td>
                <td className="dtax-amount">{locationAmount(toDisplayNumber(row.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="dempty">Mã này không thuộc danh sách 25 Thuế cơ sở phân công theo địa bàn.</p>
      )}
    </section>
  );
}
const sumOrNull = (values: (number | null)[]) =>
  values.some((value) => value !== null) ? values.reduce((sum: number, v) => sum + (v ?? 0), 0) : null;

/**
 * Cấp quản lý và cấp ngân sách cùng có hai bậc, nên rất dễ bị đọc thành một thứ.
 *
 * Đây là HAI CÁCH CHIA của cùng một tổng, không phải hai nguồn số để đối soát.
 * Vì vậy dòng cộng là phần bắt buộc của bảng chứ không phải trang trí: không có
 * nó, hai cột bày ra bốn con số khác nhau và người đọc mặc định là số bị lệch.
 * Có nó thì câu chuyện đúng hiện ra ngay — cùng một tổng, cắt theo hai trường
 * khác nhau của cùng một giao dịch.
 */
export function CorrespondencePanel({ data }: { data: TmsBreakdownData }) {
  const managementTotal = sumOrNull(data.correspondence.map((row) => row.amount));
  const budgetTotal = sumOrNull(data.correspondence.map((row) => row.budgetAmount));
  /**
   * MỘT thang cho cả bốn cột số, kể cả hai ô dòng Cộng.
   *
   * Cả bảng tồn tại để nói rằng hai cách chia cho cùng một tổng. Nếu mỗi cột tự
   * chọn đơn vị thì hai con số bằng nhau lại hiện ra hai dạng khác nhau, và
   * bảng nói ngược lại điều nó được lập ra để nói.
   */
  const scale = moneyScale([
    ...data.correspondence.flatMap((row) => [row.amount, row.budgetAmount]),
    managementTotal,
    budgetTotal,
  ]);
  return (
    <Card title="Cấp quản lý và cấp ngân sách" subtitle="Cùng một tổng, cắt theo hai trường khác nhau của giao dịch">
      <div className="dtable-wrap">
        <table className="dtable dtms-pairs">
          <caption className="sr-only">
            Đối chiếu cấp quản lý của Chương với cấp ngân sách được hưởng
          </caption>
          <thead>
            <tr>
              <th scope="col">Cấp quản lý của Chương</th>
              <th scope="col" className="is-num">{columnLabel("Số tiền", scale)}</th>
              <th scope="col">Cấp ngân sách hưởng</th>
              <th scope="col" className="is-num">{columnLabel("Số tiền", scale)}</th>
            </tr>
          </thead>
          <tbody>
            {data.correspondence.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.management}</th>
                <td className="is-num" data-label="Số tiền"><Amount value={row.amount} scale={scale} /></td>
                {/* Nhóm chưa tra được cấp quản lý không có vế ngân sách tương
                    ứng: nó là một nhóm của cột trái, không phải một cấp ngân
                    sách. Ô trống, không phải một nhãn nghe cho cân bảng. */}
                {row.budget ? <th scope="row">{row.budget}</th> : <td />}
                <td className="is-num" data-label="Số tiền"><Amount value={row.budgetAmount} scale={scale} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Cộng</th>
              <td className="is-num" data-label="Số tiền"><Amount value={managementTotal} scale={scale} /></td>
              <th scope="row">Cộng</th>
              <td className="is-num" data-label="Số tiền"><Amount value={budgetTotal} scale={scale} /></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="dhint">
        Hai cột cộng ra cùng một số vì cùng chia một tổng. Cấp quản lý đọc từ mã Chương trên chứng từ; cấp
        ngân sách được hưởng là trường khác của chính giao dịch đó. Chúng cùng hình dạng hai bậc nhưng không
        suy được ra nhau, nên một đơn vị do trung ương quản lý vẫn có thể nộp khoản mà ngân sách địa phương
        hưởng.
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
    <Card title="Chất lượng dữ liệu" subtitle="Ba phép kiểm tra chạy bên trong TMS, trên chính số đang hiện">
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
      {/* Ba phép kiểm ở trên đều chạy BÊN TRONG TMS, nên chúng phải khớp tuyệt
          đối. Quan hệ với Kho bạc là chuyện khác hẳn và đã có bảng riêng; để
          chung một chỗ thì hai loại sai số bị đọc lẫn vào nhau. */}
      <p className="dhint">
        Phạm vi là <b>tổng thu nội địa A</b>, gồm dầu thô và condensate. Thu xuất nhập khẩu nằm ngoài bộ quy tắc này.
      </p>
    </Card>
  );
}
