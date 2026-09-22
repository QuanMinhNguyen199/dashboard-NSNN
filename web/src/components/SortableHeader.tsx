import { useState } from "react";
import { useNarrow } from "@/components/useNarrow";

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

/**
 * Một cột của bảng tra cứu.
 *
 * `key` là `null` cho cột KHÔNG sắp xếp được. Cột đó vẫn phải có mặt trong danh
 * sách vì thứ tự cột là thứ tự ở đây; bỏ nó ra thì đầu bảng lệch một ô so với
 * thân bảng mà chẳng có gì báo.
 */
export interface SortCol<K extends string> {
  key: K | null;
  label: string;
  numeric?: boolean;
  className?: string;
}

/** Cả hàng tiêu đề, dựng từ danh sách cột. */
export function SortHeaders<K extends string>({
  cot,
  sort,
  onSort,
}: {
  cot: SortCol<K>[];
  sort: SortState<K>;
  onSort: (key: K) => void;
}) {
  /*
    Ở khổ hẹp đầu bảng chỉ còn là NHÃN, không còn là nút.

    `thead` lúc đó được giấu theo kiểu sr-only để trình đọc màn hình vẫn biết
    tên cột cho các thẻ xếp chồng — nhưng `clip-path` không gỡ phần tử khỏi cây
    trợ năng, nên nếu giữ nút ở đây thì người dùng trình đọc màn hình gặp HAI bộ
    điều khiển sắp xếp cho cùng một bảng: một bộ nhìn thấy được là hàng chip, một
    bộ không. `aria-sort` vẫn giữ để họ biết bảng đang sắp theo cột nào.
  */
  const hep = useNarrow();
  return (
    <>
      {cot.map((c, i) =>
        c.key === null || hep ? (
          <th
            key={c.key ?? `x${i}`}
            scope="col"
            className={[c.numeric ? "is-num" : null, c.className].filter(Boolean).join(" ") || undefined}
            aria-sort={
              c.key !== null && sort.key === c.key
                ? sort.desc
                  ? "descending"
                  : "ascending"
                : undefined
            }
          >
            {c.label}
          </th>
        ) : (
          <SortHeader
            key={c.key}
            sortKey={c.key}
            label={c.label}
            numeric={c.numeric}
            className={c.className}
            sort={sort}
            onSort={onSort}
          />
        ),
      )}
    </>
  );
}

/**
 * Hàng chip sắp xếp cho khổ hẹp.
 *
 * Dưới 768px bảng xếp chồng thành thẻ và cả `thead` bị ẩn, nên mọi nút sắp xếp
 * biến mất — đo được 28 nút ở bốn bảng, cả trên mobile lẫn trong iframe. Không
 * có cách nào khác để đổi thứ tự, mà đây lại đúng là khổ màn hình người ta cần
 * nó nhất vì mỗi lần chỉ nhìn được vài thẻ.
 *
 * Lấy CÙNG một danh sách cột với `SortHeaders`, nên chip không thể lệch khỏi
 * đầu bảng. Chỉ dựng khi thật sự ở khổ hẹp chứ không ẩn bằng CSS: ẩn bằng CSS
 * thì trình đọc màn hình trên máy để bàn vẫn đọc thấy hai bộ điều khiển sắp xếp
 * cho cùng một bảng.
 */
export function SortStrip<K extends string>({
  cot,
  sort,
  onSort,
  nhan,
}: {
  cot: SortCol<K>[];
  sort: SortState<K>;
  onSort: (key: K) => void;
  /** Tên bảng, để trình đọc màn hình biết hàng chip này sắp xếp cho bảng nào. */
  nhan: string;
}) {
  const hep = useNarrow();
  const chip = cot.filter((c): c is SortCol<K> & { key: K } => c.key !== null);
  if (!hep || chip.length === 0) return null;
  return (
    <div className="dsort-strip" role="group" aria-label={`Sắp xếp ${nhan}`}>
      <span>Sắp xếp</span>
      <div>
        {chip.map((c) => {
          const dang = sort.key === c.key;
          return (
            <button
              key={c.key}
              type="button"
              data-sort-chip={c.key}
              aria-pressed={dang}
              onClick={() => onSort(c.key)}
            >
              {c.label}
              <span aria-hidden="true">{dang ? (sort.desc ? " ↓" : " ↑") : ""}</span>
              {dang && <span className="sr-only">, đang sắp {sort.desc ? "giảm dần" : "tăng dần"}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
