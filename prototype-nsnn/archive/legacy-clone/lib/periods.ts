import type { PeriodKey, PeriodRow } from "./types";

/** `Bf` — địa giới hành chính áp dụng cho kỳ đang chọn. */
export function areaEra(
  year: string,
  quarter: string,
  month: string,
): "historical" | "current" | "mixed" | "unknown" {
  if (!/^\d{4}$/.test(year)) return "unknown";
  const y = Number(year);
  if (y < 2025) return "historical";
  if (y > 2025) return "current";
  if (month) {
    const m = Number(month);
    if (!Number.isInteger(m) || m < 1 || m > 12) return "unknown";
    return m < 7 ? "historical" : "current";
  }
  if (quarter) {
    const q = Number(quarter);
    if (!Number.isInteger(q) || q < 1 || q > 4) return "unknown";
    return q < 3 ? "historical" : "current";
  }
  return "mixed";
}

/** `Bi` — parse "2025m9" | "2026q3" | "2024y". */
export function parsePeriodToken(token: string): PeriodKey | null {
  const t = token.trim();
  const yearOnly = /^(\d{4})y$/i.exec(t);
  if (yearOnly) return { year: yearOnly[1] };
  const m = /^(\d{4})([qm])(\d{1,2})$/i.exec(t);
  if (!m) return null;
  const [, year, kind, rawNum] = m;
  const num = Number(rawNum);
  if (kind.toLowerCase() === "q")
    return num >= 1 && num <= 4 ? { year, quarter: String(num) } : null;
  return num >= 1 && num <= 12 ? { year, month: String(num) } : null;
}

/** `yo` — serialize ngược lại token. */
export function periodToken(key: PeriodKey): string {
  if (key.month) return `${key.year}m${Number(key.month)}`;
  if (key.quarter) return `${key.year}q${Number(key.quarter)}`;
  return `${key.year}y`;
}

/** `Co` — nhãn hiển thị của một kỳ. */
export function periodLabel(key: PeriodKey): string {
  if (key.month) return `Tháng ${Number(key.month)}/${key.year}`;
  if (key.quarter) return `Quý ${Number(key.quarter)}/${key.year}`;
  return `Cả năm ${key.year}`;
}

/** `i2` — tìm dòng danh mục ứng với một kỳ. */
export function findPeriod(rows: PeriodRow[], key: PeriodKey): PeriodRow | undefined {
  return rows.find((row) => {
    if (String(row.year) !== key.year) return false;
    if (key.month) return String(row.month) === key.month;
    if (key.quarter) return row.month === null && String(row.quarter) === key.quarter;
    return row.quarter === null && row.month === null;
  });
}

/** `o2` */
export function hasPeriod(rows: PeriodRow[], key: PeriodKey): boolean {
  return findPeriod(rows, key) !== undefined;
}

/** `cP` — khoá sắp xếp lấy mốc cuối kỳ. */
function periodEnd(row: PeriodRow): number {
  if (row.month == null && row.quarter == null) return row.year * 100 + 12;
  return row.year * 100 + (row.month ?? (row.quarter as number) * 3);
}

/** `Ez` — khoá lấy mốc đầu kỳ. */
function periodStart(row: PeriodRow): number {
  const m = row.month ?? (row.quarter != null ? row.quarter * 3 - 2 : 1);
  return row.year * 100 + m;
}

/** `Tz` — lọc các kỳ đã tới và đủ độ phủ ≥50% mức cao nhất. */
function usablePeriods(rows: PeriodRow[], now: Date): PeriodRow[] {
  const cutoff = now.getFullYear() * 100 + (now.getMonth() + 1);
  const started = rows.filter((row) => periodStart(row) <= cutoff);
  const pool = started.length ? started : rows;
  const best = Math.max(0, ...pool.map((row) => row.n_ward_with_data ?? 0));
  if (best === 0) return pool;
  const covered = pool.filter((row) => (row.n_ward_with_data ?? 0) >= best * 0.5);
  return covered.length ? covered : pool;
}

/** `kz` — cặp kỳ mặc định của tab So sánh: ưu tiên cùng kỳ năm trước. */
export function defaultComparePair(
  rows: PeriodRow[],
  now: Date = new Date(),
): { a: string; b: string } {
  if (!rows.length) return { a: "", b: "" };
  const toKey = (row: PeriodRow): PeriodKey =>
    row.month != null
      ? { year: String(row.year), month: String(row.month) }
      : row.quarter != null
        ? { year: String(row.year), quarter: String(row.quarter) }
        : { year: String(row.year) };

  const pool = usablePeriods(rows, now);
  const sorted = [...pool].sort((a, b) => periodEnd(b) - periodEnd(a));
  const latest = sorted[0];
  const bKey = toKey(latest);
  const sameLastYear: PeriodKey = { ...bKey, year: String(Number(bKey.year) - 1) };
  if (hasPeriod(pool, sameLastYear))
    return { a: periodToken(sameLastYear), b: periodToken(bKey) };
  const second = sorted[1];
  return second
    ? { a: periodToken(toKey(second)), b: periodToken(bKey) }
    : { a: periodToken(bKey), b: periodToken(bKey) };
}

/** `hP` — các quý có trong một năm. */
export function quartersInYear(rows: PeriodRow[], year: string): number[] {
  return [
    ...new Set(
      rows.filter((r) => String(r.year) === year && r.quarter != null).map((r) => r.quarter!),
    ),
  ].sort((a, b) => a - b);
}

/** `pP` — các tháng có trong năm (và quý nếu đã chọn). */
export function monthsInQuarter(
  rows: PeriodRow[],
  year: string,
  quarter: string,
): number[] {
  return [
    ...new Set(
      rows
        .filter(
          (r) =>
            String(r.year) === year &&
            (!quarter || String(r.quarter) === quarter) &&
            r.month != null,
        )
        .map((r) => r.month!),
    ),
  ].sort((a, b) => a - b);
}

/** `dM` — các lựa chọn kỳ trong một năm, dùng cho dropdown Compare (giảm dần). */
export function comparePeriodOptions(year: string, rows: PeriodRow[]) {
  const inYear = rows.filter((r) => String(r.year) === year);
  const desc = (a: number, b: number) => b - a;
  return {
    hasYear: inYear.some((r) => r.period_type === "YEAR"),
    quarters: inYear
      .filter((r) => r.period_type === "QUARTER")
      .map((r) => r.quarter!)
      .sort(desc),
    months: inYear
      .filter((r) => r.period_type === "MONTH")
      .map((r) => r.month!)
      .sort(desc),
  };
}

/** `ioe` — hậu tố kỳ trong năm của một token. */
export function periodSuffix(key: PeriodKey | null): string {
  if (!key) return "";
  if (key.month) return `m${key.month}`;
  if (key.quarter) return `q${key.quarter}`;
  return "y";
}

/** `ooe` — dựng PeriodKey từ năm + hậu tố. */
export function fromSuffix(year: string, suffix: string): PeriodKey | null {
  if (suffix === "y") return { year };
  if (suffix.startsWith("q")) return { year, quarter: suffix.slice(1) };
  if (suffix.startsWith("m")) return { year, month: suffix.slice(1) };
  return null;
}
