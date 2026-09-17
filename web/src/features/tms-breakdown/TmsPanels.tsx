import type { TmsBreakdownData } from "@/domain/types";
import { useMemo, useState } from "react";
import { TAX_OFFICES } from "@/domain/tms";
import { Card, Money, columnLabel, moneyScale } from "@/components/primitives";
import { Amount } from "./TmsTables";
import { toDisplayNumber } from "@/domain/money";

interface TaxOfficePanelProps {
  /** Số của lần tải gần nhất; `null` khi chưa có lần nào xong. */
  data: TmsBreakdownData | null;
  /** Đang chờ số cho phạm vi vừa chọn. */
  pending?: boolean;
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
}

/**
 * Bộ lọc CQT cục bộ: ưu tiên Top 5, danh sách đầy đủ chỉ mở khi cần.
 *
 * Thẻ này nằm NGOÀI vùng tải lại, và đó là điểm chính. Trước đây nó nằm trong,
 * nên bấm chọn một cơ quan thuế thì chính ô chọn vừa bấm biến mất vào khung
 * chờ — người dùng mất luôn chỗ đứng để bấm tiếp. Danh mục 32 cơ quan là dữ
 * liệu tĩnh, không phụ thuộc kỳ hay cấp, nên ô chọn không có lý do gì phải đợi
 * mạng. Chỉ phần SỐ mới đợi.
 */
export function TaxOfficePanel({ data, pending = false, selectedCode, onSelect }: TaxOfficePanelProps) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");
  const scopes = data?.taxOfficeScopes ?? null;
  /**
   * Danh sách để CHỌN luôn lấy từ danh mục tĩnh, không lấy từ payload.
   *
   * Số tiền thì lấy từ payload khi có. Đang chờ thì bỏ trống số chứ không giữ
   * số cũ: đổi cấp quản lý xong mà vẫn hiện đóng góp của cấp trước là màn hình
   * tự nói sai, và làm mờ nó đi cũng không làm nó đúng lên.
   */
  const lastAmounts = useMemo(() => {
    const map = new Map<string, number | null>();
    if (!data) return map;
    if (scopes) for (const o of scopes.offices) map.set(o.code, toDisplayNumber(o.amount));
    else for (const o of data.taxOffices) map.set(o.id, o.amount);
    return map;
  }, [data, scopes]);
  /**
   * THỨ TỰ giữ theo lần tải trước kể cả khi đang chờ; chỉ SỐ mới bị giấu.
   *
   * Giấu cả thứ tự thì hàng Top 5 xáo tung mỗi lần bấm, và người dùng mất dấu
   * cái thẻ mình vừa định bấm. Thứ tự cũ không phải một khẳng định về số liệu
   * mới, nên giữ nó không nói sai điều gì.
   */
  const amountOf = pending ? new Map<string, number | null>() : lastAmounts;
  const offices = useMemo(
    () =>
      TAX_OFFICES.map((office) => ({
        code: office.code,
        name: office.name,
        amount: amountOf.get(office.code) ?? null,
        rank: lastAmounts.get(office.code) ?? null,
      })),
    [amountOf, lastAmounts],
  );
  // Xếp theo số của lần tải gần nhất, không theo `amount` (đang bị giấu khi chờ).
  const sorted = useMemo(
    () => [...offices].sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0)),
    [offices],
  );
  const selected = offices.find((office) => office.code === selectedCode) ?? null;
  const top = useMemo(() => {
    const rows = sorted.slice(0, 5);
    if (selected && !rows.some((office) => office.code === selected.code)) rows.push(selected);
    return rows;
  }, [selected, sorted]);
  const matched = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? sorted.filter(
          (office) => office.code.includes(needle) || office.name.toLowerCase().includes(needle),
        )
      : sorted;
  }, [query, sorted]);
  const scale = useMemo(() => moneyScale(offices.map((office) => office.amount)), [offices]);

  return (
    <Card
      title="Cơ quan thuế"
      subtitle="Bộ lọc cục bộ, độc lập với cấp quản lý của Chương"
    >
      <div className="dtax-picker">
        <label>
          <span>Cơ quan đang xem</span>
          <select
            value={selectedCode ?? ""}
            onChange={(event) => onSelect(event.target.value || null)}
          >
            <option value="">Tất cả cơ quan thuế</option>
            {sorted.map((office) => (
              <option key={office.code} value={office.code}>
                {office.code} · {office.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="dbtn"
          disabled={!selectedCode}
          onClick={() => onSelect(null)}
        >
          Bỏ chọn
        </button>
      </div>

      <div className="dtax-top" aria-label="Cơ quan thuế có số thu lớn nhất" aria-busy={pending}>
        {top.map((office) => {
          const active = selectedCode === office.code;
          return (
            <button
              key={office.code}
              type="button"
              className={active ? "is-active" : undefined}
              aria-pressed={active}
              onClick={() => onSelect(active ? null : office.code)}
            >
              <span><b>{office.code}</b>{office.name}</span>
              <strong>
                    {/* Đang chờ số của phạm vi mới: vạch chờ, KHÔNG phải dấu "—".
                        Gạch ngang là ký hiệu thay chỗ và bị đọc thành "không có
                        số", trong khi thực tế là "đang tính". */}
                    {pending ? <i className="dshimmer" style={{ width: 54 }} /> : <Money value={office.amount} scale={scale} />}
                  </strong>
            </button>
          );
        })}
      </div>

      <div className="dtax-more">
        <p className="dhint">
          {selected
            ? `Đang lọc toàn bộ KPI, Mục/Tiểu mục và Chương theo ${selected.code} · ${selected.name}.`
            : `Top 5 trên ${offices.length} cơ quan.`}
        </p>
        <button type="button" className="dlink" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Thu gọn" : `Xem tất cả ${offices.length} cơ quan`}
        </button>
      </div>

      {showAll && (
        <div className="dtax-all">
          <span className="dsearch">
            <input
              type="search"
              placeholder="Tìm mã hoặc tên cơ quan"
              aria-label="Tìm cơ quan thuế"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </span>
          <ul>
            {matched.map((office) => (
              <li key={office.code}>
                <button
                  type="button"
                  className={selectedCode === office.code ? "is-active" : undefined}
                  onClick={() => onSelect(selectedCode === office.code ? null : office.code)}
                >
                  <span><b>{office.code}</b>{office.name}</span>
                  <strong>
                    {/* Đang chờ số của phạm vi mới: vạch chờ, KHÔNG phải dấu "—".
                        Gạch ngang là ký hiệu thay chỗ và bị đọc thành "không có
                        số", trong khi thực tế là "đang tính". */}
                    {pending ? <i className="dshimmer" style={{ width: 54 }} /> : <Money value={office.amount} scale={scale} />}
                  </strong>
                </button>
              </li>
            ))}
          </ul>
          {matched.length === 0 && <p className="dempty">Không có cơ quan thuế nào khớp từ khoá.</p>}
        </div>
      )}
    </Card>
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
