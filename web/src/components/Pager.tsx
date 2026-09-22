import { useState } from "react";

/**
 * Số dòng một trang bảng, dùng chung cho hai bảng đứng cạnh nhau.
 *
 * Đây là hằng số **dùng chung** chứ không phải hai hằng số trùng giá trị. Hai
 * bảng trong bố cục master–detail phải cao bằng nhau; nếu mỗi bên tự khai số
 * dòng thì chỉ cần một bên đổi là hai cột lệch nhau trở lại, và không ai nhớ
 * rằng hai con số đó phải bằng nhau.
 */
export const PAGE_ROWS = 10;

/**
 * Trang hiện tại, tự lùi khi tập dữ liệu ngắn lại.
 *
 * Người dùng đang ở trang 4 rồi gõ vào ô tìm kiếm còn 6 dòng: giữ nguyên `page`
 * sẽ cho ra một bảng trống trong khi vẫn có kết quả. `current` được kẹp lại mỗi
 * lần render nên không cần đồng bộ bằng effect.
 */
export function usePage(total: number, size: number = PAGE_ROWS) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(page, pages - 1);
  return {
    current,
    pages,
    from: current * size,
    to: Math.min(total, (current + 1) * size),
    setPage,
    reset: () => setPage(0),
    slice: <T,>(rows: T[]) => rows.slice(current * size, current * size + size),
  };
}

/**
 * Thanh phân trang.
 *
 * Luôn hiện, kể cả khi chỉ có một trang. Ẩn nó đi ở bảng ngắn làm thẻ bên đó
 * thấp hơn thẻ bên cạnh đúng bằng chiều cao thanh này, tức là lại lệch — và nút
 * mờ đã nói đủ rằng không còn trang nào.
 */
export function Pager({
  current,
  pages,
  from,
  to,
  total,
  noun,
  onChange,
  className,
}: {
  current: number;
  pages: number;
  from: number;
  to: number;
  total: number;
  /** Danh từ đếm được, ví dụ "doanh nghiệp" hoặc "nhóm". */
  noun: string;
  onChange: (page: number) => void;
  /** Lớp ngữ cảnh để một workspace có thể đổi bố cục mà không ảnh hưởng bảng khác. */
  className?: string;
}) {
  return (
    <div className={["dpager", className].filter(Boolean).join(" ")}>
      <button
        type="button"
        className="dbtn"
        disabled={current === 0}
        onClick={() => onChange(current - 1)}
      >
        Trang trước
      </button>
      <span className="dhint">
        {total === 0 ? `0 ${noun}` : `${from + 1}–${to} trên ${total} ${noun}`}
      </span>
      <button
        type="button"
        className="dbtn"
        disabled={current >= pages - 1}
        onClick={() => onChange(current + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
