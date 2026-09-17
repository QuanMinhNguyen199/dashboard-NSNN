import { useState } from "react";

/**
 * Sắp xếp theo cột, dùng chung cho các bảng tra cứu.
 *
 * Tách ra vì đã có ba bảng cần đúng hành vi này. Để mỗi bảng tự viết thì chúng
 * trôi khỏi nhau: một bảng đảo chiều khi bấm lại, bảng kia thì không; một bảng
 * đẩy ô trống xuống cuối, bảng kia đẩy lên đầu. Khác biệt kiểu đó không ai báo
 * lỗi nhưng làm người dùng mất tin vào bảng.
 */

export interface SortState<K extends string> {
  key: K;
  desc: boolean;
}

export function useSort<K extends string>(initialKey: K, initialDesc = true) {
  const [sort, setSort] = useState<SortState<K>>({ key: initialKey, desc: initialDesc });
  /** Bấm cột khác thì sắp giảm dần trước; bấm lại đúng cột đó thì đảo chiều. */
  const toggle = (key: K) =>
    setSort((current) => ({ key, desc: current.key === key ? !current.desc : true }));
  return { sort, toggle };
}

/**
 * So sánh hai giá trị ô.
 *
 * `null` **luôn** xuống cuối, kể cả khi đang sắp tăng dần. Ô trống nghĩa là chưa
 * tính được chứ không phải nhỏ nhất; để nó đứng đầu khi sắp tăng dần là nói sai
 * rằng nó bé hơn mọi số khác.
 */
export function compareCells(a: unknown, b: unknown, desc: boolean): number {
  const empty = (v: unknown) => v === null || v === undefined || v === "";
  if (empty(a) && empty(b)) return 0;
  if (empty(a)) return 1;
  if (empty(b)) return -1;
  if (typeof a === "number" && typeof b === "number") return desc ? b - a : a - b;
  const left = String(a);
  const right = String(b);
  const result = new Intl.Collator("vi", { numeric: true }).compare(left, right);
  return desc ? -result : result;
}

/** Sắp xếp một mảng theo hàm lấy khoá, không sửa mảng gốc. */
export function sortRows<T, K extends string>(
  rows: T[],
  sort: SortState<K>,
  valueOf: (row: T, key: K) => unknown,
): T[] {
  return [...rows].sort((a, b) => compareCells(valueOf(a, sort.key), valueOf(b, sort.key), sort.desc));
}

export function SortHeader<K extends string>({
  sortKey,
  label,
  numeric = false,
  sort,
  onSort,
  className,
}: {
  sortKey: K;
  label: string;
  numeric?: boolean;
  sort: SortState<K>;
  onSort: (key: K) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      className={[numeric ? "is-num" : null, className].filter(Boolean).join(" ") || undefined}
      // `aria-sort` là cách duy nhất trình đọc màn hình biết bảng đang sắp theo
      // cột nào; mũi tên chỉ nói được điều đó cho người nhìn thấy nó.
      aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
    >
      <button type="button" className="dsort" onClick={() => onSort(sortKey)}>
        {label}
        <span aria-hidden="true">{active ? (sort.desc ? " ↓" : " ↑") : ""}</span>
      </button>
    </th>
  );
}
