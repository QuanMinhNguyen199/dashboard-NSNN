import { useMemo } from "react";
import { Pager, usePage } from "@/components/Pager";
import { sortRows, useSort, SortStrip, SortHeaders, type SortCol } from "@/components/SortableHeader";
import { Change, columnLabel, inScale, type MoneyScale } from "@/components/primitives";
import type { EnterpriseRevenueRow } from "@/domain/workspaces";

type SortKey = "name" | "amount" | "change";

/**
 * Danh sách doanh nghiệp trong một nhóm.
 *
 * Cột đầu là **mã hiển thị dạng token**, không phải mã số thuế. Bản mô phỏng
 * không được mang dữ liệu người nộp thuế, kể cả dữ liệu trông-như-thật: một mã
 * mười chữ số trong bản demo sẽ bị ai đó tra thử.
 */
export function EnterpriseTable({
  rows,
  unit,
  query,
  groupName,
}: {
  rows: EnterpriseRevenueRow[];
  unit: MoneyScale;
  query: string;
  groupName: string;
}) {
  const { sort, toggle } = useSort<SortKey>("amount");

  const matched = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) => r.token.toLowerCase().includes(needle) || r.displayName.toLowerCase().includes(needle),
    );
  }, [rows, query]);

  const ordered = sortRows(matched, sort, (row, key) =>
    key === "name"
      ? row.displayName
      : key === "change"
        ? row.previous === null
          ? null
          : row.amount - row.previous
        : row.amount,
  );

  const page = usePage(ordered.length);
  const slice = page.slice(ordered);

  if (!rows.length) return <p className="dempty">Nhóm này chưa có doanh nghiệp trong bản mô phỏng.</p>;

  const displayName = (row: EnterpriseRevenueRow) => {
    const suffix = ` · ${groupName}`;
    return row.displayName.endsWith(suffix) ? row.displayName.slice(0, -suffix.length) : row.displayName;
  };

    const cot: SortCol<SortKey>[] = [
    { key: "name", label: "Doanh nghiệp" },
    { key: "amount", label: columnLabel("Số thu", unit), numeric: true, className: "dcol-money" },
    { key: "change", label: "So cùng kỳ", numeric: true, className: "dcol-change" },
  ];

  return (
    <>
      <SortStrip cot={cot} sort={sort} onSort={toggle} nhan="danh sách doanh nghiệp" />
      <div className="dtable-wrap">
        <table className="dtable dent-list">
          <caption className="sr-only">Doanh nghiệp mô phỏng trong nhóm đang chọn</caption>
          <thead>
            <tr>
              <SortHeaders cot={cot} sort={sort} onSort={toggle} />
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.token}>
                <th scope="row">
                  <span className="dtms-code">{row.token}</span>
                  {displayName(row)}
                </th>
                <td className="is-num" data-label="Số thu">
                  {inScale(row.amount, unit)}
                </td>
                <td className="is-num" data-label="So cùng kỳ">
                  <Change current={row.amount} previous={row.previous} label="" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager
        className="dpager-management"
        current={page.current}
        pages={page.pages}
        from={page.from}
        to={page.to}
        total={ordered.length}
        noun="doanh nghiệp"
        onChange={page.setPage}
      />
    </>
  );
}
