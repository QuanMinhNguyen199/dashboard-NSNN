import { useFilters } from "../state/FiltersProvider";

/**
 * Thanh phạm vi — dải chung của cả ba tab.
 *
 * Địa bàn không phải một bộ lọc tinh chỉnh tại chỗ như Năm hay Chỉ tiêu; nó là
 * một phép **đổi phạm vi**. Tổng quan luôn đọc số toàn thành phố, nên khi người
 * dùng chọn một phường ở đó mà giao diện không đổi gì thì lựa chọn trông như bị
 * hỏng. Thanh này luôn nói rõ đang xem phạm vi nào và luôn có lối quay lại.
 */
export function ScopeBar() {
  const { ward, wardName, selectWard, tab, switchTab, historicalAreas, districtName } =
    useFilters();

  const isWard = !!ward;
  const scopeName = historicalAreas
    ? (districtName ?? "Địa giới trước 01/07/2025")
    : isWard
      ? (wardName ?? ward)
      : "Toàn thành phố Hà Nội";

  return (
    <div className="scope-bar">
      <span className="scope-mark" data-scope={isWard ? "ward" : "city"} aria-hidden="true" />
      <span>
        Phạm vi: <b>{scopeName}</b>
      </span>

      {isWard && (
        <>
          <span className="scope-sep" aria-hidden="true" />
          <button type="button" className="scope-back" onClick={() => selectWard(null)}>
            <svg width="9" height="8" viewBox="0 0 9 8" aria-hidden="true" focusable="false">
              <path d="M4 0v3h5v2H4v3L0 4z" fill="currentColor" />
            </svg>
            Về toàn thành phố
          </button>
        </>
      )}

      {/* Tổng quan luôn ở phạm vi thành phố. Nói thẳng điều đó và mở lối sang
          đúng trang có số liệu của phường, thay vì để lựa chọn im lặng vô hiệu. */}
      {isWard && tab === "overview" && (
        <span className="scope-note">
          Tổng quan luôn tính cho toàn thành phố.{" "}
          <button type="button" className="scope-back" onClick={() => switchTab("detail")}>
            Xem chi tiết {wardName ?? ward}
          </button>
        </span>
      )}

      {!isWard && tab === "compare" && (
        <span className="scope-note">Chọn một phường/xã để bắt đầu so sánh hai kỳ.</span>
      )}

      {!(isWard && tab === "overview") && tab !== "compare" && (
        <span className="scope-note">Số tiền rút gọn theo nghìn tỷ · tỷ · triệu đồng</span>
      )}
    </div>
  );
}
