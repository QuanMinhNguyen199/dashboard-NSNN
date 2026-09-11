import { useEffect, useMemo, useState } from "react";

/**
 * Xem thử dashboard trong iframe.
 *
 * Dùng `<iframe>` THẬT chứ không phải một khung `div` hẹp. Media query đọc kích
 * thước viewport chứ không đọc container, nên thu nhỏ một div chỉ làm nội dung
 * bị bóp lại mà bố cục vẫn giữ nguyên biến thể rộng — xem thử như vậy còn tệ hơn
 * không xem, vì nó cho cảm giác sai về cái sẽ chạy thật.
 *
 * Chế độ này nằm ngoài `DashboardProvider`: nếu nằm trong, `writeUrl` dựng lại
 * query từ state sau mỗi lần đổi bộ lọc và sẽ xoá mất tham số `frame`.
 */

const PRESETS = [
  { width: 390, label: "390", note: "Điện thoại" },
  { width: 500, label: "500", note: "Khung chat hẹp" },
  { width: 720, label: "720", note: "Nửa màn hình" },
  { width: 960, label: "960", note: "Khung rộng" },
  { width: 1280, label: "1280", note: "Toàn cỡ" },
];

const MIN = 320;
const MAX = 1440;

export const frameWidthFromUrl = (search: string): number | null => {
  const raw = new URLSearchParams(search).get("frame");
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(Math.max(Math.round(value), MIN), MAX) : 500;
};

/** URL để thoát: đúng chỗ người dùng đang đứng trước khi mở khung nhúng. */
const exitUrl = () => {
  const query = new URLSearchParams(window.location.search);
  query.delete("frame");
  const tail = query.toString();
  return `${window.location.pathname}${tail ? `?${tail}` : ""}`;
};

/** Bộ lọc chung — giữ lại để khung nhúng xem đúng phạm vi đang quan tâm. */
const SCOPE_KEYS = ["year", "periodType", "period", "acc", "level", "indicator"];

/**
 * Nội dung cho iframe: luôn mở ở Tổng quan.
 *
 * Bê nguyên tab đang đứng sang khung nhúng thì mở từ "So sánh nâng cao" sẽ rơi
 * vào trạng thái chưa chọn đủ hai vế, còn mở từ "Chi tiết phường/xã" thì bắt đầu
 * bằng một địa bàn cụ thể — cả hai đều không phải thứ cần thấy đầu tiên khi đang
 * kiểm bố cục. Bộ lọc chung vẫn giữ.
 */
const previewSrc = () => {
  const current = new URLSearchParams(window.location.search);
  const query = new URLSearchParams({ tab: "overview" });
  for (const key of SCOPE_KEYS) {
    const value = current.get(key);
    if (value !== null) query.set(key, value);
  }
  return `${window.location.pathname}?${query}`;
};

export function FramePreview({ initialWidth }: { initialWidth: number }) {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(0);

  // Tính một lần khi mở: đổi chiều rộng không được làm iframe tải lại, nếu
  // không thì mọi thao tác bên trong (tab, bộ lọc, địa bàn đang chọn) mất sạch.
  const src = useMemo(previewSrc, []);
  const back = useMemo(exitUrl, []);

  useEffect(() => {
    document.title = "Xem thử iframe · Thu NSNN Hà Nội";
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    query.set("frame", String(width));
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
  }, [width]);

  // Chiều cao thật của khung, để con số hiển thị là số thật chứ không phải ước lượng.
  useEffect(() => {
    const measure = () => setHeight(Math.max(0, window.innerHeight - 56));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const exit = () => {
    window.location.href = back;
  };

  return (
    <div className="dframe">
      <header className="dframe-bar">
        <span className="dframe-title">Xem thử iframe</span>

        <div className="dframe-presets" role="group" aria-label="Khổ dựng sẵn">
          {PRESETS.map((preset) => (
            <button
              key={preset.width}
              type="button"
              title={preset.note}
              aria-pressed={width === preset.width}
              className={width === preset.width ? "is-active" : undefined}
              onClick={() => setWidth(preset.width)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <label className="dframe-slider">
          <span className="sr-only">Chiều rộng khung, tính bằng pixel</span>
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={10}
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </label>

        <output className="dframe-size">
          {width} × {height || "—"} px
        </output>

        <button type="button" className="dframe-exit" onClick={exit}>
          Thoát
        </button>
      </header>

      <div className="dframe-stage">
        <iframe
          className="dframe-window"
          title="Dashboard Thu NSNN trong iframe"
          src={src}
          style={{ width }}
        />
      </div>
    </div>
  );
}
