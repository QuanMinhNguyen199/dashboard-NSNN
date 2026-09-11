import { useFilters } from "../state/FiltersProvider";

/** `I6` — cảnh báo độ phủ: bao nhiêu phường/xã có số liệu trong kỳ. */
export function CoverageNotice({ nWithData }: { nWithData: number }) {
  const f = useFilters();
  const total = f.wardCatalog.length;

  if (f.tab === "compare" || f.historicalAreas || !f.catalogReady || total === 0 || nWithData >= total)
    return null;

  const periodText = f.month
    ? `Tháng ${f.month}/${f.year}`
    : f.quarter
      ? `Quý ${f.quarter}/${f.year}`
      : `Năm ${f.year}`;

  return (
    <div
      role="note"
      data-testid="ward-coverage-notice"
      className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <span aria-hidden="true">⚠</span>
      <p className="m-0">
        {nWithData === 0 ? (
          <>
            <b>{periodText}</b> chưa có số liệu của địa bàn nào. Danh mục địa bàn vẫn có thể
            chọn. Chọn một kỳ khác để xem.
          </>
        ) : (
          <>
            <b>{periodText}</b> chỉ có{" "}
            <b>
              {nWithData}/{total}
            </b>{" "}
            phường/xã có số liệu. Danh mục vẫn giữ đủ địa bàn; đây là độ phủ số liệu, không phải
            địa giới thay đổi.
          </>
        )}
      </p>
    </div>
  );
}
