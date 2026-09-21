/**
 * Hai phép tất định dùng chung cho lớp mô phỏng của ba workspace mới.
 *
 * Kho mã đang có BA bản `hash` khác nhau — `observations.ts` băm theo số,
 * `report.ts` và `tms.ts` băm theo ký tự với hai cách trộn hằng số khác nhau.
 * Chúng cho ra ba dãy số khác nhau, và mọi con số mock hiện có đều sinh từ đó,
 * kể cả những con mà bộ nghiệm thu đang chốt. Hợp nhất ba bản là đổi toàn bộ số
 * mock của ứng dụng trong một lượt sửa không liên quan — nên không làm ở đây.
 *
 * File này là bản dùng cho phần MỚI, và là nơi nên gom về khi có một lượt dành
 * riêng cho việc đó.
 */

/** Băm tất định về khoảng [0, 1). Cùng đầu vào luôn cho cùng kết quả. */
export function hash(...parts: (string | number)[]): number {
  let h = 2166136261;
  for (const part of parts) {
    const text = String(part);
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e3779b9;
  }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Chia `total` theo `weights` sao cho tổng các phần bằng **đúng** `total`.
 *
 * Phương pháp phần dư lớn nhất. Chia theo tỷ lệ rồi làm tròn từng phần sẽ để
 * lại vài đồng chênh, và trên màn hình ngân sách thì một dòng "Cộng" lệch vài
 * đồng so với các dòng phía trên đủ để người đối soát mất tin vào cả bảng.
 */
export function allocate(total: number, weights: number[]): number[] {
  if (!weights.length) return [];
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (total * w) / sum);
  const floors = exact.map((v) => Math.floor(v));
  let rest = Math.round(total - floors.reduce((a, b) => a + b, 0));
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (let k = 0; k < order.length && rest > 0; k += 1, rest -= 1) out[order[k].i] += 1;
  return out;
}

/** Trọng số tất định trong khoảng [min, max] cho một khoá. */
export const weightOf = (min: number, max: number, ...parts: (string | number)[]) =>
  min + hash(...parts) * (max - min);
