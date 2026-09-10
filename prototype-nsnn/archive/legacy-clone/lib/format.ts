import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** `Ro` — clsx + tailwind-merge, đúng như bundle gốc. */
export function cx(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * `He` — định dạng tiền. Đơn vị của API là **đồng**.
 * ≥10^12 "nghìn tỷ" (2 số lẻ) · ≥10^9 "tỷ" (1) · ≥10^6 "triệu" (1) · còn lại số thô.
 */
export function money(value: number | null | undefined): string {
  if (value == null) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12)
    return (value / 1e12).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + " nghìn tỷ";
  if (abs >= 1e9)
    return (value / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " tỷ";
  if (abs >= 1e6)
    return (value / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " triệu";
  return value.toLocaleString("vi-VN");
}

/** `Sb` — số chính xác, phân nhóm nghìn và hậu tố " đ". */
export function exact(value: number | null | undefined): string {
  return value == null ? "—" : Math.round(value).toLocaleString("vi-VN") + " đ";
}

const collator = new Intl.Collator("vi");

/** `r2` — comparator theo locale Việt Nam. */
export function byVietnamese<T>(pick: (row: T) => string) {
  return (a: T, b: T) => collator.compare(pick(a), pick(b));
}

/** `Ob` — phần trăm thay đổi; mẫu số 0 hoặc null trả về null. */
export function pctChange(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Overview tính nội bộ bằng **tỷ đồng**, còn API của hai tab kia trả **đồng**.
 * Hàm này đưa giá trị tỷ đồng về cùng thang hiển thị `money()` để cả ba tab
 * đọc một kiểu: "3,04 nghìn tỷ", không phải nơi "46.029,9 tỷ" nơi "3,04 nghìn tỷ".
 */
export function moneyFromTy(value: number | null | undefined): string {
  return value == null ? "—" : money(value * 1e9);
}

/** Một số lẻ theo locale vi-VN (dấu phẩy thập phân) — dùng cho mọi phần trăm. */
export function pct1(value: number): string {
  return value.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
