import { useCallback, useEffect, useState } from "react";

/**
 * Danh sách mã người dùng tự ghim, nhớ giữa các lần mở.
 *
 * Ghim là **sở thích hiển thị**, không phải dữ liệu nghiệp vụ, nên nó nằm ở
 * trình duyệt chứ không đi qua máy chủ. Hai hệ quả phải nói thẳng với người dùng
 * thay vì để họ tự phát hiện:
 *
 * · Ghim theo máy và theo trình duyệt. Đổi máy là danh sách trống.
 * · Trong iframe, chính sách cô lập lưu trữ có thể chặn hẳn. Khi đó mọi thao tác
 *   vẫn chạy bình thường trong phiên, chỉ là không nhớ sang lần sau.
 *
 * Muốn ghim theo tài khoản và đồng bộ giữa các máy thì cần chỗ lưu ở máy chủ,
 * và đó là một yêu cầu khác hẳn về quy mô.
 */

const PREFIX = "nsnn.pinned.";

/**
 * Đọc và ghi đều bọc try/catch.
 *
 * `localStorage` ném lỗi chứ không trả `null` khi bị chặn: cửa sổ ẩn danh, đã
 * tắt lưu trữ của site, hoặc iframe bị phân vùng. Để lỗi đó lọt ra ngoài thì cả
 * bảng không render được, chỉ vì một tính năng phụ.
 */
function read(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function write(key: string, ids: string[]): boolean {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}

export interface Pinned {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
  /** `false` khi trình duyệt không cho lưu; giao diện nói rõ là sẽ không nhớ. */
  persists: boolean;
}

export function usePinned(key: string): Pinned {
  const [ids, setIds] = useState<string[]>(() => read(key));
  const [persists, setPersists] = useState(true);

  // Đọc lại sau lần render đầu: giá trị khởi tạo chạy cả ở phía máy chủ, nơi
  // chưa có `window`, nên không được tin nó là trạng thái cuối.
  useEffect(() => {
    setIds(read(key));
  }, [key]);

  const toggle = useCallback(
    (id: string) => {
      setIds((current) => {
        const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
        setPersists(write(key, next));
        return next;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    setIds([]);
    setPersists(write(key, []));
  }, [key]);

  return { ids, has: (id) => ids.includes(id), toggle, clear, persists };
}
