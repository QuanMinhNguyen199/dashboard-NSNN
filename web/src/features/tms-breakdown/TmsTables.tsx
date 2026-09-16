import type { TmsRow, TmsSectionRow } from "@/domain/types";
import { share } from "@/domain/metrics";
import { Change, Money, pct } from "@/components/primitives";

/** Khoá của nhóm chưa tra được Mục cha; phải trùng khoá mà lớp dữ liệu phát ra. */
export const UNKNOWN_SECTION = "chua-xac-dinh-muc";

/**
 * Ô số tiền.
 *
 * `null` là **chưa tính được**, và chỗ đó để trống — không "—", không "chưa có
 * dữ liệu", không một dòng gợi ý nào. Một ký hiệu thay chỗ vẫn là một thứ để
 * đọc, và người quét bảng sẽ cố giải mã nó; ô trống thì không.
 */
export function Amount({ value }: { value: number | null }) {
  return value === null ? null : <Money value={value} />;
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
  if (!sections.length)
    return <p className="dempty">Cấp này không có mã nào trong điều kiện báo cáo hiện hành.</p>;

  return (
    <div className="dtable-wrap">
      <table className="dtable dtms-table">
        <caption className="sr-only">Mục và Tiểu mục nằm trong điều kiện báo cáo của cấp quản lý đang chọn</caption>
        <thead>
          <tr>
            <th scope="col">Mục</th>
            <th scope="col" className="is-num">Số tiền</th>
            <th scope="col" className="is-num">Tỷ trọng</th>
            <th scope="col" className="is-num">So cùng kỳ</th>
            <th scope="col">Trạng thái</th>
          </tr>
        </thead>
        {sections.map((section) => {
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
                <td className="is-num" data-label="Số tiền"><Amount value={section.amount} /></td>
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
                    <td className="is-num" data-label="Số tiền"><Amount value={sub.amount} /></td>
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
}: {
  rows: TmsRow[];
  lastHeader: string;
  caption: string;
  emptyText?: string;
  /**
   * Bỏ hẳn cột số tiền khi chiều đó chưa có căn cứ nào để chia.
   *
   * Cột rỗng suốt cả bảng, đứng cạnh những bảng đầy số, đọc thành lỗi chứ không
   * đọc thành "chưa có dữ liệu". Không có gì để điền thì đừng chừa chỗ.
   */
  showAmount?: boolean;
}) {
  if (!rows.length) return <p className="dempty">{emptyText}</p>;
  return (
    <div className="dtable-wrap">
      <table className="dtable dtms-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{caption}</th>
            {showAmount && <th scope="col" className="is-num">Số tiền</th>}
            {lastHeader && <th scope="col">{lastHeader}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.name}</th>
              {showAmount && (
                <td className="is-num" data-label="Số tiền">
                  <Amount value={row.amount} />
                </td>
              )}
              {lastHeader && <td>{row.meta}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
