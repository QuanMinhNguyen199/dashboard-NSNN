/** Amounts remain in dong; these labels use billions by default. */
export const BILLION_SCALE = { divisor: 1e9, unit: "tỷ đồng", short: "tỷ", decimals: 2 };
export const MILLION_NOTE = "Đơn vị mặc định: tỷ đồng. Giá trị có trị tuyệt đối dưới 1 tỷ được ghi theo triệu đồng và kèm chữ “triệu”.";
export function budgetMoneyParts(value: number | null | undefined): { number: string; million: boolean } {
  if (value == null || !Number.isFinite(value)) return { number: "—", million: false };
  if (value === 0) return { number: "0", million: false };
  const absolute = Math.abs(value);
  const million = absolute < 1e9 && Number((absolute / 1e6).toFixed(2)) < 1000;
  const scaled = absolute / (million ? 1e6 : 1e9);
  const text = scaled < 0.01 ? "<0,01" : scaled.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  return { number: (value < 0 ? "−" : "") + text, million };
}
