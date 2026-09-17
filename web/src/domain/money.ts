/**
 * Số tiền dạng chuỗi decimal, đơn vị đồng.
 *
 * Đặc tả yêu cầu truyền và cộng bằng decimal, không dùng `number` của
 * JavaScript. Lý do rất cụ thể: lũy kế toàn thành phố đã tới 951.928.375.508.344
 * đồng, còn đối soát phải giữ đủ từng đồng để giải thích chênh lệch. Một phép
 * cộng mất chính xác ở chữ số cuối là đủ để sinh ra một khoản lệch không có thật.
 *
 * Quy ước trong file này: **cộng trừ bằng `bigint`, đổi sang `number` chỉ để
 * định dạng**. Ở khoảng giá trị đang dùng, `number` biểu diễn đúng tới khoảng
 * 9.007.199.254.740.991 đồng, nên đổi ở bước cuối là an toàn; cộng bằng `number`
 * thì không.
 */

/** Chuỗi decimal nguyên, cho phép dấu âm. Số lẻ bị từ chối chứ không làm tròn. */
const DECIMAL = /^-?\d+$/;

export function toDong(value: string | null | undefined): bigint | null {
  if (value === null || value === undefined) return null;
  const text = value.trim();
  if (!DECIMAL.test(text)) return null;
  return BigInt(text);
}

export const fromDong = (value: bigint | null): string | null => (value === null ? null : value.toString());

/**
 * Cộng một tập giá trị. Trả `null` khi **mọi** phần tử đều thiếu.
 *
 * Một phần tử thiếu giữa các phần tử có số không làm cả tổng thành `null`: dòng
 * tổng vẫn cộng được phần đã có, và trạng thái thiếu được mang riêng ở `status`
 * chứ không nhét vào con số.
 */
export function sumDong(values: (string | null)[]): string | null {
  let total = 0n;
  let seen = false;
  for (const value of values) {
    const parsed = toDong(value);
    if (parsed === null) continue;
    total += parsed;
    seen = true;
  }
  return seen ? total.toString() : null;
}

export function diffDong(a: string | null, b: string | null): string | null {
  const left = toDong(a);
  const right = toDong(b);
  return left === null || right === null ? null : (left - right).toString();
}

/** Đủ chữ số, có phân cách nghìn. Dùng cho đối soát, nơi không được làm tròn. */
export function formatExactDong(value: string | null): string | null {
  const parsed = toDong(value);
  if (parsed === null) return null;
  const negative = parsed < 0n;
  const digits = (negative ? -parsed : parsed).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return negative ? `−${grouped}` : grouped;
}

/**
 * Đổi sang `number` để đưa vào thành phần hiển thị có sẵn.
 *
 * Chỉ dùng ở bước định dạng. Trả `null` khi giá trị vượt khoảng biểu diễn chính
 * xác, để nơi gọi hiện số đầy đủ thay vì hiện một con số đã sai âm thầm.
 */
const SAFE = BigInt(Number.MAX_SAFE_INTEGER);

export function toDisplayNumber(value: string | null): number | null {
  const parsed = toDong(value);
  if (parsed === null) return null;
  const magnitude = parsed < 0n ? -parsed : parsed;
  return magnitude > SAFE ? null : Number(parsed);
}
