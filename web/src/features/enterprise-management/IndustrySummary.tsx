import { Pager, usePage } from "@/components/Pager";
import { SortHeader, sortRows, useSort } from "@/components/SortableHeader";
import { Change, columnLabel, inScale, pct, type MoneyScale } from "@/components/primitives";
import type { EnterpriseGroupRow, EnterpriseManagementData } from "@/domain/workspaces";

type SortKey = "name" | "amount" | "share" | "change" | "count";

/**
 * Xếp hạng nhóm theo số thu.
 *
 * Nhóm "Chưa xác định" luôn ở CUỐI và không tham gia xếp hạng, nhưng vẫn nằm
 * trong bảng và trong tổng. Loại nó ra cho bảng đẹp là làm tổng của bảng không
 * còn bằng tổng của kỳ — người đối soát sẽ phát hiện, và sẽ mất tin vào cả bảng.
 *
 * Vì vậy nó nằm ở `<tfoot>` chứ không phải dòng cuối của `<tbody>`: bảng có
 * phân trang, và một phần dư chiếm 10% số thu mà rơi sang trang 2 thì coi như
 * không có. `<tfoot>` cũng đúng ngữ nghĩa hơn — đây là phần còn lại của tổng,
 * không phải một đối thủ trong bảng xếp hạng.
 *
 * Dòng **Tổng** đứng cùng chỗ, và có mặt chính vì phân trang: khi bảng còn hiện
 * đủ mọi nhóm thì người đối soát cộng cột là ra tổng. Cắt trang làm mất khả
 * năng đó, nên tổng phải được ghi thẳng ra và hiện ở mọi trang — nếu không thì
 * phân trang đã lặng lẽ lấy đi một cách kiểm tra mà bảng vốn có.
 */
export function IndustrySummary({
  groups,
  unit,
  totals,
  selected,
  onSelect,
  dimensionName,
}: {
  groups: EnterpriseGroupRow[];
  unit: MoneyScale;
  totals: EnterpriseManagementData["totals"];
  selected: string | null;
  onSelect: (id: string | null) => void;
  dimensionName: string;
}) {
  const { sort, toggle } = useSort<SortKey>("amount");
  const ranked = groups.filter((g) => !g.unclassified);
  const rest = groups.filter((g) => g.unclassified);
  const page = usePage(ranked.length);

  if (!groups.length) return <p className="dempty">Kỳ đang chọn chưa có số để chia nhóm.</p>;

  const ordered = page.slice(
    sortRows(ranked, sort, (row, key) =>
      key === "name"
        ? row.name
        : key === "share"
          ? row.share
          : key === "count"
            ? row.enterpriseCount
            : key === "change"
              ? row.previous === null
                ? null
                : row.amount - row.previous
              : row.amount,
    ),
  );

  const cells = (row: EnterpriseGroupRow) => (
    <>
      <td className="is-num" data-label="Số thu">
        {inScale(row.amount, unit)}
      </td>
      <td className="is-num" data-label="Tỷ trọng">
        {pct(row.share)}
      </td>
      <td className="is-num" data-label="So cùng kỳ">
        <Change current={row.amount} previous={row.previous} label="" />
      </td>
      <td className="is-num" data-label="Doanh nghiệp">
        {row.enterpriseCount > 0 ? row.enterpriseCount.toLocaleString("vi-VN") : null}
      </td>
    </>
  );

  return (
    <>
      <div className="dtable-wrap">
        <table className="dtable dent-table">
          <caption className="sr-only">
            Số thu theo {dimensionName}, chọn một dòng để xem doanh nghiệp
          </caption>
          <thead>
            <tr>
              <SortHeader sortKey="name" label={dimensionName} sort={sort} onSort={toggle} />
              <SortHeader
                sortKey="amount"
                label={columnLabel("Số thu", unit)}
                numeric
                className="dcol-money"
                sort={sort}
                onSort={toggle}
              />
              <SortHeader sortKey="share" label="Tỷ trọng" numeric className="dcol-pct" sort={sort} onSort={toggle} />
              <SortHeader
                sortKey="change"
                label="So cùng kỳ"
                numeric
                className="dcol-change"
                sort={sort}
                onSort={toggle}
              />
              <SortHeader
                sortKey="count"
                label="Doanh nghiệp"
                numeric
                className="dcol-pct"
                sort={sort}
                onSort={toggle}
              />
            </tr>
          </thead>
          <tbody>
            {ordered.map((row) => {
              const active = selected === row.id;
              return (
                <tr key={row.id} className={active ? "is-active" : undefined}>
                  <th scope="row">
                    {row.enterpriseCount > 0 ? (
                      <button
                        type="button"
                        className="dlink"
                        aria-pressed={active}
                        onClick={() => onSelect(active ? null : row.id)}
                      >
                        {row.name}
                      </button>
                    ) : (
                      row.name
                    )}
                  </th>
                  {cells(row)}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {rest.map((row) => (
              <tr key={row.id} className="is-unresolved">
                <th scope="row">{row.name}</th>
                {cells(row)}
              </tr>
            ))}
            <tr className="is-total">
              <th scope="row">Tổng</th>
              <td className="is-num" data-label="Số thu">
                {inScale(totals.amount, unit)}
              </td>
              <td className="is-num" data-label="Tỷ trọng">
                {pct(totals.amount === 0 ? null : 100)}
              </td>
              <td className="is-num" data-label="So cùng kỳ">
                <Change current={totals.amount} previous={totals.previous} label="" />
              </td>
              <td className="is-num" data-label="Doanh nghiệp">
                {totals.directoryTotal?.toLocaleString("vi-VN")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Pager
        current={page.current}
        pages={page.pages}
        from={page.from}
        to={page.to}
        total={ranked.length}
        noun={dimensionName.toLowerCase()}
        onChange={page.setPage}
      />
    </>
  );
}
