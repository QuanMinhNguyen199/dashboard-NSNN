import { Pager, usePage } from "@/components/Pager";
import { useNarrow } from "@/components/useNarrow";
import { sortRows, useSort, SortStrip, SortHeaders, type SortCol } from "@/components/SortableHeader";
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
  const hep = useNarrow();
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

  const cot: SortCol<SortKey>[] = [
    { key: "name", label: dimensionName },
    { key: "amount", label: columnLabel("Số thu", unit), numeric: true, className: "dcol-money" },
    { key: "share", label: "Tỷ trọng", numeric: true, className: "dcol-pct" },
    { key: "change", label: "So cùng kỳ", numeric: true, className: "dcol-change" },
    { key: "count", label: "Doanh nghiệp", numeric: true, className: "dcol-pct" },
  ];

  /**
   * Khổ hẹp dựng THẺ, không phải bảng xếp chồng.
   *
   * Bảng xếp chồng bằng CSS cho ra bốn cặp nhãn–số chạy liền thành hai dòng
   * chữ: "Số thu 8.212 Tỷ trọng 14,6% So cùng kỳ +46,9% Doanh nghiệp 52.640".
   * Mọi con số cùng một cỡ nên không có gì nói con số nào là con số chính, và
   * đọc lướt một danh sách mười mấy nhóm như vậy là không đọc được.
   *
   * Thẻ đặt ba tầng: tên nhóm, rồi SỐ THU cỡ lớn kèm biến động, rồi phần phụ.
   * Cả thẻ là một cái nút nên bấm chỗ nào cũng mở, và dấu › nói rằng nó mở ra
   * một trang khác chứ không phải bung ra tại chỗ.
   */
  const the = (row: EnterpriseGroupRow) => (
    <>
      <span className="dgc-ten">{row.name}</span>
      <span className="dgc-so">
        <strong>{inScale(row.amount, unit)}</strong>
        <small>{unit.short}</small>
        <Change current={row.amount} previous={row.previous} label="" />
      </span>
      <span className="dgc-phu">
        {pct(row.share)} tổng thu
        {row.enterpriseCount > 0 && ` · ${row.enterpriseCount.toLocaleString("vi-VN")} doanh nghiệp`}
      </span>
    </>
  );

  if (hep)
    return (
      <>
        <SortStrip cot={cot} sort={sort} onSort={toggle} nhan={`số thu theo ${dimensionName.toLowerCase()}`} />
        <ul className="dgroup-cards">
          {ordered.map((row) => (
            <li key={row.id}>
              {row.enterpriseCount > 0 ? (
                <button type="button" data-group={row.id} onClick={() => onSelect(row.id)}>
                  {the(row)}
                  <span className="dgc-mui" aria-hidden="true">›</span>
                  <span className="sr-only">, xem doanh nghiệp</span>
                </button>
              ) : (
                /* Nhóm không có doanh nghiệp nào thì không mở ra được gì. Vẫn
                   hiện để tổng cộng lại đúng, nhưng không giả vờ bấm được. */
                <div>{the(row)}</div>
              )}
            </li>
          ))}
        </ul>

        {/* Phần dư và dòng tổng nằm NGOÀI danh sách xếp hạng và ngoài phân
            trang: chúng là phần còn lại của tổng, không phải đối thủ trong bảng
            xếp hạng, và phải thấy được ở mọi trang. */}
        <div className="dgroup-sum">
          {rest.map((row) => (
            <p key={row.id}>
              <span>{row.name}</span>
              <span>
                {inScale(row.amount, unit)} {unit.short} · {pct(row.share)}
              </span>
            </p>
          ))}
          <p className="is-total">
            <span>Tổng</span>
            <span>
              {inScale(totals.amount, unit)} {unit.short} ·{" "}
              {totals.directoryTotal?.toLocaleString("vi-VN")} doanh nghiệp
            </span>
          </p>
        </div>

        <Pager
          className="dpager-management"
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


  return (
    <>
      <SortStrip cot={cot} sort={sort} onSort={toggle} nhan={`số thu theo ${dimensionName.toLowerCase()}`} />
      <div className="dtable-wrap">
        <table className="dtable dent-table">
          <caption className="sr-only">
            Số thu theo {dimensionName}, chọn một dòng để xem doanh nghiệp
          </caption>
          <thead>
            <tr>
              <SortHeaders cot={cot} sort={sort} onSort={toggle} />
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
        className="dpager-management"
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
