import { useSyncExternalStore } from "react";

/**
 * Khổ hẹp theo đúng ngưỡng của stylesheet.
 *
 * Bề rộng quyết định mức chi tiết, không phải ngữ cảnh nhúng: iframe 500px trong
 * một cửa sổ rộng vẫn là khổ hẹp, còn iframe 900px thì không. Hook đọc thẳng
 * cùng một media query mà CSS dùng, nên hai bên không thể trôi khỏi nhau.
 *
 * Giá trị phía máy chủ là `false`: khi chưa có `window` thì chưa biết bề rộng,
 * và bản đầy đủ là mặc định an toàn hơn bản rút gọn.
 */
const NARROW = "(max-width: 767px)";

export function useNarrow(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(NARROW);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}
