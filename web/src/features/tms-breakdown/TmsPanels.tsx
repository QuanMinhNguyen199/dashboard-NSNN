import type { TmsBreakdownData } from "@/domain/types";
import { useCallback, useMemo, useRef } from "react";
import { taxOfficeNameOf, taxOfficeLocationIds, taxOfficeScopeNote } from "@/domain/tms";
import { LOCATION_BY_ID } from "@/domain/catalog";
import { Card, columnLabel, inScale, moneyScale } from "@/components/primitives";
import { Amount } from "./TmsTables";
import { toDisplayNumber } from "@/domain/money";

const taxPeriodLabel = (period: string | undefined) => {
  if (!period) return null;
  const month = /^(\d{4})-(\d{2})$/.exec(period);
  return month ? `Tháng ${Number(month[2])}/${month[1]}` : period;
};

/**
 * Các địa bàn do CQT đang chọn quản lý; bộ lọc CQT nằm trên thanh lọc chính.
 *
 * Panel này KHÔNG dùng `ResourceView`, và đó là có chủ ý: hai nửa của nó có độ
 * tươi khác nhau.
 *
 *   · **Danh sách phường/xã** đến từ bảng phân công tĩnh (`taxOfficeLocationIds`),
 *     biết ngay khi người dùng chọn mã — không bao giờ cũ, không cần đợi mạng.
 *   · **Số thu từng địa bàn** đến từ payload, và có thể là số của mã vừa chọn
 *     trước đó.
 *
 * Nếu đợi cả panel thì tên phường biến mất rồi hiện lại y nguyên, tức là nháy
 * một cái mà không nói thêm điều gì. Nếu giữ nguyên cả panel như bản trước thì
 * số cũ nằm trơ ra một lúc rồi tự đổi — người dùng đọc phải số của mã khác mà
 * không biết. Nên chỉ **cột số và thanh tỷ lệ** vào trạng thái chờ; khung và
 * tên đứng yên.
 */
export function TaxOfficeAssignedAreas({
  data,
  selectedCode,
  pending = false,
}: {
  data: TmsBreakdownData | null;
  selectedCode: string | null;
  /** Đang chờ phản hồi cho một phạm vi khác với phạm vi của `data`. */
  pending?: boolean;
}) {
  const scopes = pending ? undefined : data?.taxOfficeScopes;
  const selectedScope = scopes?.offices.find((office) => office.code === selectedCode);
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
  const stripCleanupRef = useRef<(() => void) | null>(null);
  const bindScrollRegion = useCallback((region: HTMLElement | null) => {
    stripCleanupRef.current?.();
    stripCleanupRef.current = null;
    if (!region) return;
    const handleWheel = (event: WheelEvent) => {
      const strip = region.querySelector<HTMLOListElement>(".dtax-location-grid");
      if (!strip) return;
      // Chuột thường có thể gửi delta theo pixel, dòng hoặc cả trang. Cộng thẳng
      // `deltaY` khiến một nấc chuột dạng `line` chỉ dịch 3px và trông như không
      // hoạt động. Trackpad lại thường gửi `deltaX`, nên dùng trục có biên độ lớn
      // hơn rồi chuẩn hoá về pixel trước khi cuộn.
      const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (rawDelta === 0) return;
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 32
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? strip.clientWidth
          : 1;
      const delta = rawDelta * unit;
      const max = strip.scrollWidth - strip.clientWidth;
      const canMove = delta > 0 ? strip.scrollLeft < max - 1 : strip.scrollLeft > 1;
      if (!canMove) return;
      event.preventDefault();
      event.stopPropagation();
      strip.scrollLeft = Math.max(0, Math.min(max, strip.scrollLeft + delta));
    };
    // Gắn vào cả section để tiêu đề, khoảng giữa các card và vùng scrollbar đều
    // điều khiển cùng một dải; capture xử lý trước các vùng mô phỏng host.
    region.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    stripCleanupRef.current = () => region.removeEventListener("wheel", handleWheel, { capture: true });
  }, []);

  if (!selectedCode) return null;
  return (
    <section ref={bindScrollRegion} className="dtax-scope is-compact" aria-labelledby="tax-office-location-title">
      <span className="sr-only" role="status" aria-live="polite">
        {pending ? "Đang cập nhật số thu theo địa bàn." : ""}
      </span>
      <div className="dtax-scope-inner">
        <div className="dtax-scope-head">
          <div className="dtax-scope-titleline">
            <h2 id="tax-office-location-title">Địa bàn phụ trách</h2>
            {pending ? (
              <span className="dtag is-loading">Đang cập nhật số thu…</span>
            ) : (
              <span className={scopes?.origin === "mock" ? "dtag is-review" : "dtag"}>
                {scopes?.origin === "mock"
                  ? ["Mô phỏng", taxPeriodLabel(scopes.period)].filter(Boolean).join(" · ")
                  : (taxPeriodLabel(scopes?.period) ?? "Chưa có kỳ")}
              </span>
            )}
          </div>
          <p>
            {taxOfficeNameOf(selectedCode) ?? selectedCode} · {selectedLocations.length.toLocaleString("vi-VN")} phường/xã · Sắp theo số thu giảm dần
          </p>
        </div>
        {selectedLocations.length > 0 ? (
          <div className="dtax-location-strip">
            <ol
              className="dtax-location-grid"
              aria-busy={pending || undefined}
              aria-label="Địa bàn phụ trách, sắp theo số thu giảm dần"
              tabIndex={selectedLocations.length > 4 ? 0 : undefined}
            >
              {selectedLocations.map((row, index) => (
                <li key={row.id}>
                  <span className="dtax-rank" aria-label={`Hạng ${index + 1}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <strong className="dtax-name">{row.name}</strong>
                  <span className="dtax-card-amount">
                    {pending ? (
                      <i className="dshimmer" aria-hidden="true" />
                    ) : (
                      <>
                        {locationAmount(toDisplayNumber(row.amount))}
                        {toDisplayNumber(row.amount) !== null && <> <small>{locationScale.short}</small></>}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          /* Ba đơn vị quản theo đối tượng thì rỗng là ĐÚNG, nên phải nói ra
             điều đó. Câu cũ — "mã này không thuộc danh sách 25 Thuế cơ sở" —
             đọc như một lời từ chối, và người dùng hiểu thành mã họ chọn là
             mã sai. */
          <p className="dempty">
            {taxOfficeScopeNote(selectedCode ?? "") ??
              "Chưa có bảng phân công phường/xã cho cơ quan này."}
          </p>
        )}
      </div>
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
    <Card title="Cấp quản lý và cấp ngân sách" subtitle="Hai cách phân loại cùng một tổng">
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
    <Card title="Chất lượng dữ liệu">
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
        {/* Tách khỏi dòng trên chứ không gộp: một bên là chưa ai viết điều kiện,
            một bên là điều kiện đã có nhưng danh mục Tiểu mục chưa có tên cho
            các mã nó nhắc tới. Gộp lại thì người đi xử lý đi tìm điều kiện cho
            một khoản vốn đã có đủ điều kiện. */}
        <div>
          <dt>Khoản có điều kiện nhưng Tiểu mục chưa có trong danh mục</dt>
          <dd className={data.quality.itemsWithoutCataloguedSubItems.length ? "is-warn" : "is-ok"}>
            {data.quality.itemsWithoutCataloguedSubItems.length
              ? data.quality.itemsWithoutCataloguedSubItems.join("; ")
              : "Không có"}
          </dd>
        </div>
      </dl>
      {/* Ba phép kiểm ở trên đều chạy BÊN TRONG TMS, nên chúng phải khớp tuyệt
          đối. Quan hệ với Kho bạc là chuyện khác hẳn và đã có bảng riêng; để
          chung một chỗ thì hai loại sai số bị đọc lẫn vào nhau. */}
    </Card>
  );
}
