import { useMemo } from "react";
import { refreshAll } from "../lib/api";
import { HISTORICAL_DISTRICTS } from "../lib/districts";
import { byVietnamese } from "../lib/format";
import { ITEM_OPTIONS } from "../lib/url";
import { useFilters } from "../state/FiltersProvider";
import type { Acc } from "../lib/types";
import { requestResetZoom } from "./MapCard";

/** `Sa` / `ho` — class của select và của label bọc ngoài. */
const SELECT = "rounded-[.35rem] border border-line bg-card px-2 py-1.5 text-sm text-ink";
const LABEL = "grid gap-1 text-[.78rem] text-muted";

/** `j6` — hàng bộ lọc chung. Tab Compare ẩn Năm/Quý/Tháng và Reset zoom. */
export function FilterBar() {
  const f = useFilters();
  const isCompare = f.tab === "compare";
  const hideArea = f.tab === "compare" && f.ward === null;

  const areaOptions = useMemo(
    () =>
      [...(f.historicalAreas ? HISTORICAL_DISTRICTS : f.wardCatalog)].sort(
        byVietnamese((row) => row.location_name),
      ),
    [f.historicalAreas, f.wardCatalog],
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-card p-3">
      {!isCompare && (
        <>
          <label className={LABEL}>
            Năm
            <select
              disabled={!f.periodsReady}
              className={SELECT}
              value={f.year}
              onChange={(e) => f.setYear(e.target.value)}
            >
              {f.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label
            className={LABEL}
            title="Xem theo quý (số Kho Bạc gộp sẵn, không phải tự cộng 3 tháng)."
          >
            Quý
            <select
              disabled={!f.periodsReady || !!f.catalogError}
              className={SELECT}
              value={f.quarter}
              onChange={(e) => f.setQuarter(e.target.value)}
            >
              <option value="">Tất cả quý</option>
              {f.quartersInYear.map((q) => (
                <option key={q} value={q}>
                  Quý {q}
                </option>
              ))}
            </select>
          </label>

          <label className={LABEL} title="Xem theo 1 tháng.">
            Tháng
            <select
              disabled={!f.periodsReady || !!f.catalogError}
              className={SELECT}
              value={f.month}
              onChange={(e) => f.setMonth(e.target.value)}
            >
              <option value="">Tất cả tháng</option>
              {f.monthsInQuarter.map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      <label
        className={LABEL}
        title="Trong kỳ = số riêng kỳ này. Luỹ kế = cộng dồn từ đầu năm."
      >
        Loại kỳ
        <select
          className={SELECT}
          value={f.acc}
          onChange={(e) => f.setAcc(e.target.value as Acc)}
        >
          <option value="PERIOD">Thực hiện trong kỳ</option>
          <option value="YTD">Luỹ kế từ đầu năm</option>
        </select>
      </label>

      <label
        className={LABEL}
        title="TỔNG SỐ gồm cả vay/chuyển giao. Thu NSNN là số thuần (không tính vay)."
      >
        Chỉ tiêu
        <select
          className={SELECT}
          value={f.item}
          onChange={(e) => f.setItem(e.target.value)}
        >
          {ITEM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {!hideArea && (
        <label
          className={LABEL}
          title={
            f.historicalAreas
              ? "Chọn quận/huyện để xem ranh giới lịch sử."
              : "Chọn phường/xã để xem chi tiết."
          }
        >
          Địa bàn
          <select
            className={SELECT}
            disabled={!f.historicalAreas && (!f.wardsReady || !!f.catalogError)}
            value={(f.historicalAreas ? f.district : f.ward) ?? ""}
            onChange={(e) =>
              f.historicalAreas
                ? f.selectDistrict(e.target.value || null)
                : f.selectWard(e.target.value || null)
            }
          >
            <option value="">— Tổng quan toàn thành phố —</option>
            {areaOptions.map((row) => (
              <option
                key={row.location_code}
                value={f.historicalAreas ? row.name_slug : row.location_code}
              >
                {row.location_name}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="button"
        className="self-end rounded border border-line px-3 py-1.5 text-sm"
        onClick={refreshAll}
      >
        Tải lại dữ liệu
      </button>

      {!isCompare && (
        <label className={LABEL}>
          {/* Bản gốc dùng non-breaking space (U+00A0), không phải khoảng trắng thường:
              khoảng trắng thường bị bỏ qua khi làm grid item, còn NBSP tạo một dòng lưới
              thật phía trên nút, khiến hàng filter cao thêm 24px. */}
          {"\u00a0"}
          <button
            type="button"
            onClick={requestResetZoom}
            className="rounded-[.35rem] border border-line bg-card px-3 py-1.5 text-sm"
          >
            Reset zoom
          </button>
        </label>
      )}
    </div>
  );
}
