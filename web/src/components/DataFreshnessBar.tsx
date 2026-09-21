import {
  DATA_SOURCE_NAME,
  FRESHNESS_STATUS_LABEL,
  type DataFreshness,
} from "@/domain/workspaces";
import type { ReactNode } from "react";

/**
 * Nguồn và trạng thái của dữ liệu đang xem, đặt MỘT lần gần đầu vùng nội dung.
 *
 * Dải này chỉ hiện những trường **mang tin ở trạng thái hiện tại**:
 *
 *   · Lớp mô phỏng không có nguồn nào chốt số, nên `dataAsOf` luôn rỗng và
 *     `generatedAt` chỉ ghi lúc người dùng tải lại trang. Bày hai ô đó ra —
 *     một ô trống có nhãn, một ô luôn đúng giờ mà không nói gì về độ mới của
 *     số — là ba phần tư chiều ngang dải dành cho thứ không giúp ai quyết định
 *     gì. Ở trạng thái mô phỏng, dải rút về đúng hai thứ đọc được: nhãn và nguồn.
 *   · Khi có nguồn thật, `dataAsOf` là trường quan trọng nhất của cả dải, nên
 *     nó xuất hiện cùng lúc với việc nó có giá trị.
 *
 * Nói cách khác: trường xuất hiện khi nó có gì để nói, không xuất hiện theo một
 * bố cục cố định rồi để trống.
 */
export function DataFreshnessBar({
  freshness,
  note,
}: {
  freshness: DataFreshness;
  note?: ReactNode;
}) {
  const stamp = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const mock = freshness.status === "mock";
  const asOf = stamp(freshness.dataAsOf);
  const generated = stamp(freshness.generatedAt);

  return (
    <div className="dfresh" role="group" aria-label="Nguồn và trạng thái dữ liệu">
      <span className={`dtag${mock ? " is-review" : ""}`}>
        {FRESHNESS_STATUS_LABEL[freshness.status]}
      </span>
      <dl>
        <div>
          <dt>Nguồn</dt>
          <dd>{freshness.sources.map((s) => DATA_SOURCE_NAME[s]).join(" · ")}</dd>
        </div>
        {!mock && asOf && (
          <div>
            <dt>Dữ liệu chốt lúc</dt>
            <dd>{asOf}</dd>
          </div>
        )}
        {!mock && generated && (
          <div>
            <dt>Báo cáo dựng lúc</dt>
            <dd>{generated}</dd>
          </div>
        )}
      </dl>
      {note && <span className="dfresh-note">{note}</span>}
    </div>
  );
}
