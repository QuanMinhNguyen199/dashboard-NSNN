import type { DashboardFilters } from "./types";
import { ALL_PERIODS } from "./catalog";

/**
 * Hiệu lực theo kỳ của các chiều dữ liệu TMS.
 *
 * Không phải chiều nào cũng dùng được ở mọi kỳ. Chiều địa bàn là ví dụ nặng
 * nhất: cột địa bàn hai cấp trên chứng từ chỉ được điền từ kỳ hạch toán 07/2025,
 * khi mô hình hành chính hai cấp có hiệu lực. Bên nghiệp vụ đã xác nhận mốc
 * này; các tỷ lệ theo chứng từ chưa có nguồn đủ truy vết trong bộ bàn giao nên
 * không ghi cứng vào ứng dụng.
 *
 * Trả bảng theo địa bàn cho kỳ tháng 6 nghĩa là trình bày 2,7% số tiền như thể
 * đó là toàn bộ. Không có cách nào để người đọc nhận ra, nên phải chặn ở đây.
 */

/** Kỳ hạch toán đầu tiên có dữ liệu địa bàn hai cấp. */
export const LOCATION_FROM = { year: 2025, month: 7 };

/** Tháng cuối của kỳ đang lọc; dùng làm mốc so với ngưỡng hiệu lực. */
function lastMonthOf(filters: Pick<DashboardFilters, "year" | "periodType" | "period">): number {
  if (filters.period === ALL_PERIODS) return 12;
  return filters.periodType === "MONTH" ? filters.period : filters.period * 3;
}

/**
 * Kỳ đang lọc có dùng được chiều địa bàn không.
 *
 * Xét theo tháng CUỐI của kỳ chứ không phải tháng đầu: chọn "tất cả các kỳ" năm
 * 2025 là cộng cả phần không có địa bàn lẫn phần có, và một tổng nửa vời còn khó
 * phát hiện hơn một tổng sai hẳn.
 */
export function locationDimensionAvailable(
  filters: Pick<DashboardFilters, "year" | "periodType" | "period">,
): boolean {
  if (filters.year > LOCATION_FROM.year) return true;
  if (filters.year < LOCATION_FROM.year) return false;
  if (filters.period === ALL_PERIODS) return false;
  return lastMonthOf(filters) >= LOCATION_FROM.month;
}

/** Câu giải thích khi chiều địa bàn chưa dùng được; `null` khi dùng được. */
export function locationDimensionNote(
  filters: Pick<DashboardFilters, "year" | "periodType" | "period">,
): string | null {
  if (locationDimensionAvailable(filters)) return null;
  return (
    "Chứng từ TMS chỉ có mã địa bàn hai cấp từ kỳ hạch toán tháng 7/2025. " +
    "Kỳ trước đó dùng 30 quận huyện cũ, và cột địa bàn trên chứng từ gần như trống, " +
    "nên nhóm theo địa bàn ở kỳ này sẽ trình bày một phần rất nhỏ số tiền như thể là toàn bộ."
  );
}
