import { useSyncExternalStore } from "react";

/**
 * Thiết bị nhập liệu là ngón tay, không phải con trỏ.
 *
 * Khác hẳn `useNarrow`, và phải khác. Bề rộng nói về CHỖ — 500px thì không đủ
 * chỗ cho hai cột, bất kể ai đang dùng. Con trỏ nói về CÁCH CHẠM VÀO — và một
 * iframe 500px trên màn hình máy bàn vẫn là chuột với bàn phím.
 *
 * Gộp hai thứ này lại thì khung chat hẹp nhận đúng những thứ chỉ điện thoại mới
 * dùng được: đo trong iframe 500px, `pointer` là `fine`, `hover` là `hover`,
 * vậy mà màn hình vẫn bảo "Vuốt sang trái để quay lại".
 *
 * Dùng cho cử chỉ và cho câu chữ mô tả cử chỉ. KHÔNG dùng cho bố cục — bố cục
 * theo bề rộng.
 */
const COARSE = "(pointer: coarse)";

export function useTouch(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(COARSE);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(COARSE).matches,
    // Chưa có `window` thì chưa biết; con trỏ là mặc định an toàn hơn, vì bày
    // thừa một cử chỉ không dùng được tệ hơn là thiếu một lối tắt.
    () => false,
  );
}
