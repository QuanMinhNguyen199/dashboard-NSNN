import type { TmsBreakdownData } from "@/domain/types";
import { useCallback, useMemo, useRef } from "react";
import { taxOfficeLocationIds, taxOfficeScopeNote } from "@/domain/tms";
import { LOCATION_BY_ID } from "@/domain/catalog";
import { inScale, moneyScale } from "@/components/primitives";
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
          <p>{selectedLocations.length.toLocaleString("vi-VN")} phường/xã · Sắp theo số thu giảm dần</p>
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
