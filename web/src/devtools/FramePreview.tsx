import { useEffect, useMemo, useRef, useState } from "react";

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
 *
 * Tab đồng bộ hai chiều: mở khung thì vào đúng tab đang xem, thoát ra thì trang
 * chính về đúng tab vừa dừng trong khung. Cùng origin nên đọc thẳng được
 * `contentWindow.location` mà không cần `postMessage`.
 */

const PRESETS = [
  { width: 390, label: "390", note: "Điện thoại" },
  { width: 500, label: "500", note: "Khung chat hẹp" },
  { width: 720, label: "720", note: "Nửa màn hình" },
  { width: 960, label: "960", note: "Khung rộng" },
  { width: 1280, label: "1280", note: "Toàn cỡ" },
];

const MOBILE_DEVICES = [
  { id: "iphone-se", label: "iPhone SE", width: 375, height: 667, platform: "ios" },
  { id: "iphone-13-mini", label: "iPhone 13 mini", width: 375, height: 812, platform: "ios" },
  { id: "iphone-14", label: "iPhone 14", width: 390, height: 844, platform: "ios" },
  { id: "iphone-14-pro-max", label: "iPhone 14 Pro Max", width: 430, height: 932, platform: "ios" },
  { id: "iphone-15-pro-max", label: "iPhone 15 Pro Max", width: 430, height: 932, platform: "ios" },
  { id: "pixel-5", label: "Pixel 5", width: 393, height: 851, platform: "android" },
  { id: "pixel-7", label: "Pixel 7", width: 412, height: 915, platform: "android" },
  { id: "galaxy-s8-plus", label: "Galaxy S8+", width: 360, height: 740, platform: "android" },
  { id: "galaxy-s20-ultra", label: "Galaxy S20 Ultra", width: 412, height: 915, platform: "android" },
  { id: "galaxy-s23", label: "Galaxy S23", width: 360, height: 780, platform: "android" },
  { id: "galaxy-z-fold-5", label: "Galaxy Z Fold 5", width: 344, height: 882, platform: "android" },
] as const;

const MIN = 320;
const MAX = 1440;

export const frameWidthFromUrl = (search: string): number | null => {
  const raw = new URLSearchParams(search).get("frame");
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(Math.max(Math.round(value), MIN), MAX) : 500;
};

/**
 * URL nội dung cho iframe: đúng trạng thái của trang chính, chỉ bỏ `frame`.
 *
 * Bỏ `frame` là bắt buộc — giữ lại thì trang trong iframe cũng vào chế độ xem
 * thử và lồng iframe vô hạn.
 */
const previewSrc = () => {
  const query = new URLSearchParams(window.location.search);
  query.delete("frame");
  query.delete("device");
  const tail = query.toString();
  return `${window.location.pathname}${tail ? `?${tail}` : ""}`;
};

export function FramePreview({ initialWidth }: { initialWidth: number }) {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(0);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  // Tính một lần khi mở: đổi chiều rộng không được làm iframe tải lại, nếu
  // không thì mọi thao tác bên trong (tab, bộ lọc, địa bàn đang chọn) mất sạch.
  const src = useMemo(previewSrc, []);
  const requestedHost = useMemo(() => {
    const query = new URLSearchParams(window.location.search);
    return query.get("host") === "mobile" ? "mobile" : "web";
  }, []);
  const [mobileDeviceId, setMobileDeviceId] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    const requested = query.get("device");
    if (MOBILE_DEVICES.some((device) => device.id === requested)) return requested!;
    const platform = query.get("platform");
    const candidates = MOBILE_DEVICES.filter((device) => !platform || device.platform === platform);
    return (candidates.length ? candidates : MOBILE_DEVICES).reduce((nearest, device) =>
      Math.abs(device.width - initialWidth) < Math.abs(nearest.width - initialWidth) ? device : nearest
    ).id;
  });
  const mobileDevice =
    MOBILE_DEVICES.find((device) => device.id === mobileDeviceId) ?? MOBILE_DEVICES[1];

  const announceHost = (device = mobileDevice) => {
    frameRef.current?.contentWindow?.postMessage(
      {
        type: "NSNN_HOST_CONTEXT",
        payload: {
          source: requestedHost,
          platform: requestedHost === "mobile" ? device.platform : "desktop",
          displayMode: requestedHost === "mobile" ? "report" : "dashboard",
          // Dev preview không có modal native; dashboard giữ panel HTML hoạt động.
          capabilities: { openFilterModal: false, navigation: true },
        },
      },
      window.location.origin,
    );
  };

  useEffect(() => {
    document.title = `${requestedHost === "mobile" ? "Xem thử mobile" : "Xem thử iframe"} · Thu Ngân sách TP Hà Nội`;
  }, [requestedHost]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    query.set("frame", String(width));
    if (requestedHost === "mobile") {
      query.set("device", mobileDevice.id);
      query.set("platform", mobileDevice.platform);
    }
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
  }, [mobileDevice.id, mobileDevice.platform, requestedHost, width]);

  // Chiều cao thật của khung, để con số hiển thị là số thật chứ không phải ước lượng.
  useEffect(() => {
    const measure = () => setHeight(Math.max(0, window.innerHeight - 56));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /** Thoát về đúng trạng thái đang dừng TRONG khung, không phải trạng thái lúc mở. */
  const exit = () => {
    let target = src;
    try {
      const inner = frameRef.current?.contentWindow?.location;
      if (inner) {
        const query = new URLSearchParams(inner.search);
        query.delete("frame");
        query.delete("host");
        query.delete("platform");
        const tail = query.toString();
        target = `${inner.pathname}${tail ? `?${tail}` : ""}`;
      }
    } catch {
      // Không đọc được thì quay về đúng chỗ đã mở khung — vẫn hơn là đứng yên.
    }
    window.location.href = target;
  };

  return (
    <div className="dframe">
      <header className="dframe-bar" data-host={requestedHost}>
        <span className="dframe-title">
          {requestedHost === "mobile" ? "Xem thử mobile" : "Xem thử iframe"}
        </span>

        {requestedHost === "web" && (
          <>
            <span className="dframe-host">Web host</span>

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
          </>
        )}

        {requestedHost === "mobile" && (
          <label className="dframe-device">
            <span className="sr-only">Thiết bị Mobile dùng để xem thử</span>
            <select
              value={mobileDevice.id}
              onChange={(event) => {
                const device =
                  MOBILE_DEVICES.find((item) => item.id === event.target.value) ?? MOBILE_DEVICES[1];
                setMobileDeviceId(device.id);
                setWidth(device.width);
                announceHost(device);
              }}
            >
              {MOBILE_DEVICES.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <button type="button" className="dframe-exit" onClick={exit}>
          Thoát
        </button>
      </header>

      <div className="dframe-stage">
        <iframe
          ref={frameRef}
          className="dframe-window"
          title="Dashboard Thu NSNN trong iframe"
          src={src}
          style={{
            width,
            height: requestedHost === "mobile" ? mobileDevice.height : undefined,
          }}
          onLoad={() => announceHost()}
        />
      </div>
    </div>
  );
}
