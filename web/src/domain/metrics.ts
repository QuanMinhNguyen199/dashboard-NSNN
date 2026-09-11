import { ALL_PERIODS, latestMonth } from "./catalog";
import type { DashboardFilters } from "./types";

/**
 * Toán thuần về kỳ và tỷ lệ.
 *
 * Không biết dữ liệu đến từ đâu, không đọc kho quan sát nào, nên đổi nguồn dữ
 * liệu không ảnh hưởng tới file này. Giao diện dùng trực tiếp; tầng mock dùng
 * lại đúng những hàm này để hai bên không lệch cách tính.
 */

/** Ngưỡng mẫu số: dưới mức này thì tỷ lệ phần trăm không còn ý nghĩa nghiệp vụ. */
const MIN_BASE_VND = 5e8;

export function yoy(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  if (previous <= 0 || Math.abs(previous) < MIN_BASE_VND) return null;
  return ((current - previous) / previous) * 100;
}

export const share = (part: number | null, whole: number | null): number | null =>
  part === null || whole === null || whole === 0 ? null : (part / whole) * 100;

export const periodCount = (f: Pick<DashboardFilters, "year" | "periodType">) =>
  f.periodType === "MONTH" ? latestMonth(f.year) : Math.floor(latestMonth(f.year) / 3);

/** `2026m8` → `{ year, periodType, period }`; token sai cú pháp trả null. */
export const parsePeriodToken = (token: string) => {
  const match = /^(\d{4})([mq])(\d{1,2})$/i.exec(token.trim());
  if (!match) return null;
  const [, year, kind, num] = match;
  const value = Number(num);
  const periodType = kind.toLowerCase() === "m" ? "MONTH" : "QUARTER";
  if (periodType === "MONTH" && (value < 1 || value > 12)) return null;
  if (periodType === "QUARTER" && (value < 1 || value > 4)) return null;
  return { year: Number(year), periodType: periodType as "MONTH" | "QUARTER", period: value };
};

export const periodTokenLabel = (token: string) => {
  const parsed = parsePeriodToken(token);
  if (!parsed) return "—";
  return `${parsed.periodType === "MONTH" ? "Tháng" : "Quý"} ${parsed.period}/${parsed.year}`;
};

export function monthsOf(
  filters: Pick<DashboardFilters, "year" | "periodType" | "period" | "accumulation">,
): number[] {
  // Cả năm = mọi tháng ĐÃ có số liệu của năm đó, không phụ thuộc Chu kỳ đang
  // chọn: Chu kỳ chỉ quyết định độ mịn của danh sách kỳ cụ thể. Nếu để chu kỳ
  // quý cắt về quý trọn vẹn thì cùng một mốc "cả năm" lại ra hai con số khác
  // nhau tuỳ Chu kỳ — khó hiểu và không có lý do nghiệp vụ nào.
  if (filters.period === ALL_PERIODS) {
    const last = latestMonth(filters.year);
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const end = filters.periodType === "MONTH" ? filters.period : filters.period * 3;
  const start = filters.periodType === "MONTH" ? end : end - 2;
  const from = filters.accumulation === "YTD" ? 1 : start;
  return Array.from({ length: end - from + 1 }, (_, i) => from + i);
}
