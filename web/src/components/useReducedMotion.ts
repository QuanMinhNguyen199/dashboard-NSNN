import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Người dùng có yêu cầu giảm chuyển động không.
 *
 * Cần một nguồn duy nhất ở phía JavaScript vì media query trong CSS **không**
 * với tới hoạt ảnh do JavaScript điều khiển. Bản đồ dùng `d3.transition()` và
 * biểu đồ dùng hoạt ảnh nội bộ của Recharts — cả hai đều là vòng lặp
 * `requestAnimationFrame` thuần, nên khối `@media (prefers-reduced-motion)`
 * trong stylesheet chạy qua chúng mà không chạm được gì. Trước khi có hook này,
 * người bật cờ hệ thống vẫn nhận đủ 400ms phóng bản đồ.
 *
 * Nghe cả thay đổi về sau: người dùng bật cờ giữa phiên thì giao diện theo ngay,
 * không cần tải lại trang.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
