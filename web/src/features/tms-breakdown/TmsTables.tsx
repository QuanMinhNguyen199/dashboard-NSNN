import { useEffect, useState } from "react";
import type { TmsRow, TmsSectionRow } from "@/domain/types";
import type { Pinned } from "@/components/usePinned";
import { SortHeader, sortRows, useSort } from "@/components/SortableHeader";
import { share } from "@/domain/metrics";
import { Change, columnLabel, inScale, moneyScale, pct, type MoneyScale } from "@/components/primitives";

/** Khoá của nhóm chưa tra được Mục cha; phải trùng khoá mà lớp dữ liệu phát ra. */
export const UNKNOWN_SECTION = "chua-xac-dinh-muc";

/**
 * Ô số tiền trong bảng.
 *
 * `null` là **chưa tính được**, và chỗ đó để trống — không "—", không "chưa có
 * dữ liệu", không một dòng gợi ý nào. Một ký hiệu thay chỗ vẫn là một thứ để
 * đọc, và người quét bảng sẽ cố giải mã nó; ô trống thì không.
 *
 * `scale` là BẮT BUỘC, và đó là điểm chính. Ô tiền trong bảng không được tự
 * chọn đơn vị của riêng nó: để mỗi ô tự chọn thì cùng một cột có "238,9" mang
 * nghĩa tỷ nằm ngay trên "750,0" mang nghĩa nghìn, và hai số cách nhau sáu bậc
 * độ lớn trông như cùng cỡ. Bắt buộc truyền thang khiến mọi bảng phải tính một
 * thang chung cho cả cột, và đơn vị chỉ còn ghi một lần ở đầu cột — đúng quy
 * tắc đã ghi ở `moneyScale`.
 */
export function Amount({ value, scale }: { value: number | null; scale: MoneyScale }) {
  return value === null ? null : (
    <span className="dmoney">
      <b>{inScale(value, scale)}</b>
    </span>
  );
}


/**
 * Nút ghim một dòng.
 *
 * Nhãn đọc được nói rõ mã nào đang được ghim, vì trình đọc màn hình chỉ nghe
 * thấy "nút" nếu để trống, và trong một bảng trăm dòng thì điều đó vô dụng.
 */
export function PinStar({
  id,
  name,
  pinned,
  onToggle,
}: {
  id: string;
  name: string;
  pinned: Pinned;
  /**
   * Gọi thay cho `pinned.toggle` để nút đi CÙNG một đường với cú bấm vào dòng.
   *
   * Không có nó thì bấm đúng ngôi sao, hoặc nhấn Enter khi nó đang có focus, sẽ
   * ghim mà không phát nhịp sáng định vị — và người dùng bàn phím là nhóm dễ
   * mất dấu nhất khi dòng nhảy sang khối khác, lại là nhóm duy nhất không nhận
   * được tín hiệu đó.
   */
  onToggle?: (id: string) => void;
}) {
  const on = pinned.has(id);
  return (
    <button
      type="button"
      className={on ? "dpin is-on" : "dpin"}
      aria-pressed={on}
      title={on ? "Bỏ ghim" : "Ghim lên đầu"}
      aria-label={`${on ? "Bỏ ghim" : "Ghim"} ${name}`}
      onClick={(event) => {
        // Dòng cũng bắt click để ghim. Không chặn nổi bọt thì bấm đúng ngôi sao
        // sẽ kích hoạt hai lần và trạng thái quay về chỗ cũ.
        event.stopPropagation();
        if (onToggle) onToggle(id);
        else pinned.toggle(id);
      }}
    >
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M8 1.6l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.4l-3.8 2 .7-4.3-3.1-3 4.3-.6z"
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/** Trạng thái là một nhãn có chữ, không phải một chấm màu. */
function StatusTag({ row }: { row: { status: "confirmed" | "needsReview"; reviewNote?: string } }) {
  if (row.status === "confirmed") return <span className="dtag">Đã có hướng dẫn</span>;
  return (
    <span className="dtag is-review" title={row.reviewNote}>
      Cần xác nhận
    </span>
  );
}

type SectionSort = "name" | "amount" | "share" | "change" | "status";

export function SectionTable({
  sections,
  open,
  onToggle,
  total,
}: {
  sections: TmsSectionRow[];
  open: string[];
  onToggle: (id: string) => void;
  total: number | null;
}) {
  const { sort, toggle } = useSort<SectionSort>("amount");
  /**
   * Tỷ trọng cùng mẫu số với số tiền nên hai cột sắp ra cùng một thứ tự.
   *
   * Nhưng chúng phải mang HAI khoá khác nhau: `aria-sort` mô tả cột nào được
   * bấm, không phải cột nào tình cờ cùng thứ tự. Dùng chung một khoá thì trình
   * đọc màn hình nghe bảng đang sắp theo hai cột cùng lúc, và mũi tên cũng hiện
   * ở cả hai.
   */
  /** Một thang cho cả cột, tính từ cả dòng Mục lẫn dòng Tiểu mục bên trong. */
  const scale = moneyScale(
    sections.flatMap((section) => [section.amount, ...section.subItems.map((sub) => sub.amount)]),
  );
  const ordered = sortRows(sections, sort, (row, key) =>
    key === "name"
      ? row.name
      : key === "change"
        ? row.previous === null || row.amount === null
          ? null
          : row.amount - row.previous
        : key === "status"
          ? row.status
          : row.amount,
  );

  if (!sections.length)
    return <p className="dempty">Cấp này không có mã nào trong điều kiện báo cáo hiện hành.</p>;

  return (
    <div className="dtable-wrap">
      <table className="dtable dtms-table">
        <caption className="sr-only">Mục và Tiểu mục nằm trong điều kiện báo cáo của cấp quản lý đang chọn</caption>
        <thead>
          <tr>
            <SortHeader sortKey="name" label="Mục" sort={sort} onSort={toggle} />
            {/* Mỗi đầu cột tự khai vai trò để CSS đặt bề rộng theo đó — xem
                khối `.dcol-*`. Ghim theo vị trí thì luật rơi nhầm bảng. */}
            <SortHeader
              sortKey="amount"
              label={columnLabel("Số tiền", scale)}
              numeric
              className="dcol-money"
              sort={sort}
              onSort={toggle}
            />
            <SortHeader sortKey="share" label="Tỷ trọng" numeric className="dcol-pct" sort={sort} onSort={toggle} />
            <SortHeader sortKey="change" label="So cùng kỳ" numeric className="dcol-change" sort={sort} onSort={toggle} />
            <SortHeader sortKey="status" label="Trạng thái" className="dcol-status" sort={sort} onSort={toggle} />
          </tr>
        </thead>
        {ordered.map((section) => {
          const expanded = open.includes(section.id);
          const unresolved = section.id === UNKNOWN_SECTION;
          return (
            <tbody key={section.id} className={unresolved ? "is-unresolved" : undefined}>
              <tr className={expanded ? "is-open" : undefined}>
                <th scope="row">
                  <button
                    type="button"
                    className="dtms-toggle"
                    aria-expanded={expanded}
                    onClick={() => onToggle(section.id)}
                  >
                    <span aria-hidden="true" className="dtms-caret" />
                    {section.name}
                    <em>{section.subItems.length} Tiểu mục</em>
                  </button>
                </th>
                <td className="is-num" data-label="Số tiền"><Amount value={section.amount} scale={scale} /></td>
                <td className="is-num" data-label="Tỷ trọng">{pct(share(section.amount, total))}</td>
                <td className="is-num" data-label="So cùng kỳ">
                  <Change current={section.amount} previous={section.previous} label="" />
                </td>
                <td><StatusTag row={section} /></td>
              </tr>
              {expanded &&
                section.subItems.map((sub) => (
                  <tr key={sub.id} className="is-child">
                    <th scope="row">
                      <span className="dtms-code">{sub.id}</span>
                      {sub.name}
                    </th>
                    <td className="is-num" data-label="Số tiền"><Amount value={sub.amount} scale={scale} /></td>
                    <td className="is-num" data-label="Tỷ trọng">{pct(share(sub.amount, total))}</td>
                    <td className="is-num" data-label="So cùng kỳ">
                      <Change current={sub.amount} previous={sub.previous} label="" />
                    </td>
                    <td><StatusTag row={sub} /></td>
                  </tr>
                ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

type CodeSort = "name" | "amount" | "meta";

/**
 * Bảng danh mục: mã kèm tên, một cột số tiền để trống, và một cột ngữ cảnh.
 *
 * Chương và cơ quan thuế là hai chiều khác nhau nhưng ở màn hình này chúng có
 * cùng hình dạng — danh mục chưa có số. Dùng chung một thành phần để hai bảng
 * không trôi khỏi nhau mỗi lần sửa một bên.
 */
export function CodeTable({
  rows,
  lastHeader,
  caption,
  emptyText = "Không có dòng nào khớp từ khoá.",
  showAmount = true,
  pinned,
  staleRows = [],
}: {
  rows: TmsRow[];
  lastHeader: string;
  caption: string;
  emptyText?: string;
  /** Bật cột ghim. Không truyền thì bảng không có cột đó. */
  pinned?: Pinned;
  /**
   * Mã đã ghim nhưng KHÔNG có trong danh sách của kỳ đang xem.
   *
   * Phải hiện chứ không được im lặng bỏ. Mã hạch toán có hiệu lực theo thời kỳ,
   * ví dụ dải Chương cấp huyện 600–799 đã bị bãi bỏ từ năm ngân sách 2026, nên
   * một mục ghim biến mất là chuyện sẽ xảy ra. Bỏ im lặng thì người dùng tưởng
   * mình bấm nhầm hoặc tưởng hệ thống quên.
   */
  staleRows?: string[];
  /**
   * Bỏ hẳn cột số tiền khi chiều đó chưa có căn cứ nào để chia.
   *
   * Cột rỗng suốt cả bảng, đứng cạnh những bảng đầy số, đọc thành lỗi chứ không
   * đọc thành "chưa có dữ liệu". Không có gì để điền thì đừng chừa chỗ.
   */
  showAmount?: boolean;
}) {
  /**
   * Dòng vừa ghim sáng lên một nhịp rồi tắt.
   *
   * Ghim làm dòng nhảy sang khối khác của bảng. Đổi chỗ tức thì thì mắt mất dấu
   * và người dùng phải dò lại xem nó đi đâu; một nhịp sáng ở vị trí mới đủ để
   * mắt bám theo. `prefers-reduced-motion` tắt hiệu ứng này ở tầng CSS.
   */
  const { sort, toggle: sortBy } = useSort<CodeSort>("amount");
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    if (flash === null) return;
    const timer = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(timer);
  }, [flash]);
  const toggle = (id: string) => {
    pinned?.toggle(id);
    setFlash(id);
  };

  if (!rows.length && !staleRows.length) return <p className="dempty">{emptyText}</p>;

  /**
   * Mục ghim đứng thành khối riêng, KHÔNG trộn lên đầu bảng xếp hạng.
   *
   * Bảng xếp theo số tiền giảm dần, nên vị trí trong bảng mang nghĩa "lớn thứ
   * mấy". Đẩy một mã nhỏ lên đầu chỉ vì nó được ghim là làm vị trí mất nghĩa, và
   * người đọc sẽ hiểu nhầm nó là mã lớn nhất.
   */
  // Sắp xếp áp cho cả khối ghim lẫn danh sách chính, nhưng KHÔNG trộn hai khối:
  // ghim vẫn là một nhóm riêng, chỉ là bên trong nhóm cũng theo cột đang sắp.
  const scale = moneyScale(rows.map((row) => row.amount));
  const ordered = sortRows(rows, sort, (row, key) =>
    key === "name" ? row.name : key === "meta" ? row.meta : row.amount,
  );
  const pinnedRows = pinned ? ordered.filter((row) => pinned.has(row.id)) : [];
  const restRows = pinned ? ordered.filter((row) => !pinned.has(row.id)) : ordered;

  const line = (row: TmsRow, extra?: string) => (
    <tr
      key={row.id}
      className={[extra, pinned ? "is-pinnable" : null, flash === row.id ? "is-flash" : null]
        .filter(Boolean)
        .join(" ") || undefined}
      onClick={pinned ? () => toggle(row.id) : undefined}
    >
      <th scope="row">{row.name}</th>
      {showAmount && (
        <td className="is-num" data-label="Số tiền">
          <Amount value={row.amount} scale={scale} />
        </td>
      )}
      {lastHeader && <td data-label={lastHeader}>{row.meta}</td>}
      {pinned && (
        <td className="dpin-cell">
          <PinStar id={row.id} name={row.name} pinned={pinned} onToggle={toggle} />
        </td>
      )}
    </tr>
  );

  return (
    <div className="dtable-wrap">
      <table className="dtable dtms-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <SortHeader sortKey="name" label={caption} sort={sort} onSort={sortBy} />
            {showAmount && (
              <SortHeader
                sortKey="amount"
                label={columnLabel("Số tiền", scale)}
                numeric
                className="dcol-money"
                sort={sort}
                onSort={sortBy}
              />
            )}
            {lastHeader && (
              <SortHeader sortKey="meta" label={lastHeader} className="dcol-meta" sort={sort} onSort={sortBy} />
            )}
            {pinned && <th scope="col" className="dpin-cell"><span className="sr-only">Ghim</span></th>}
          </tr>
        </thead>
        {(pinnedRows.length > 0 || staleRows.length > 0) && (
          <tbody className="dpin-group">
            <tr className="dpin-head">
              <th scope="row" colSpan={1 + 1 + (showAmount ? 1 : 0) + (lastHeader ? 1 : 0)}>
                Đã ghim
              </th>
            </tr>
            {pinnedRows.map((row) => line(row))}
            {staleRows.map((id) => (
              <tr
                key={id}
                className={flash === id ? "is-stale is-pinnable is-flash" : "is-stale is-pinnable"}
                onClick={pinned ? () => toggle(id) : undefined}
              >
                <th scope="row">
                  {id}
                  <em>Không có trong kỳ đang xem</em>
                </th>
                {showAmount && <td className="is-num" />}
                {lastHeader && <td />}
                {pinned && (
                  <td className="dpin-cell">
                    <PinStar id={id} name={id} pinned={pinned} onToggle={toggle} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        )}
        <tbody>{restRows.map((row) => line(row))}</tbody>
      </table>
    </div>
  );
}
