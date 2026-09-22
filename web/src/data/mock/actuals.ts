import actuals from "../tms-actuals.json";
import { LOCATION_BY_TMS_CODE } from "@/domain/catalog";
import { CITY_SCOPE } from "@/domain/report";
import { taxOfficeEntityOf, taxOfficeNameOf } from "@/domain/tms";
import { monthsOf } from "@/domain/metrics";
import type { DashboardFilters, TmsBreakdownData } from "@/domain/types";

/**
 * Tệp tổng hợp phục vụ rà soát cục bộ, hiện không được provider sử dụng.
 *
 * Bốn tài liệu bàn giao không đủ để truy vết nguồn, checksum, phạm vi lọc và
 * thời điểm chốt của artifact này. Vì vậy không được gọi các giá trị dưới đây
 * là số thật, không đưa chúng vào bundle sản phẩm và không dùng để chia mock.
 */

interface PeriodBucket {
  txCount: number;
  amount: string;
  bookedFrom: string | null;
  bookedTo: string | null;
  locationCoverage: { withLocation: number; withoutLocation: number; amountWithoutLocation: string };
  byLocation: Record<string, string>;
  byLocationCount: Record<string, number>;
  byTaxOffice: Record<string, string>;
  byTaxOfficeCount: Record<string, number>;
  byPair: Record<string, string>;
  byChapter: Record<string, string>;
  bySection: Record<string, string>;
  bySubItem: Record<string, string>;
  bySignal: Record<string, string>;
}

const PERIODS = actuals.periods as unknown as Record<string, PeriodBucket>;

/** Các kỳ hạch toán đã nhập, dạng `YYYY-MM`. */
export const ACTUAL_PERIODS = Object.keys(PERIODS).sort();

/**
 * Kỳ đang lọc ứng với những tháng nào đã có chứng từ.
 *
 * Giao giữa khoảng tháng của bộ lọc và các kỳ đã nhập. Trả mảng rỗng khi không
 * có tháng nào: khi đó màn hình phải nói chưa có chứng từ, chứ không được lấy
 * một kỳ khác gần đúng rồi trình bày như kỳ đang chọn.
 */
export function actualMonthsOf(filters: DashboardFilters): string[] {
  return monthsOf(filters)
    .map((month) => `${filters.year}-${String(month).padStart(2, "0")}`)
    .filter((key) => key in PERIODS);
}

const add = (a: bigint, b: string) => a + BigInt(b);

/**
 * Khóa cơ quan thuế của dữ liệu thật quy về THỰC THỂ ngay tại đây.
 *
 * Chứng từ mang mã nguồn, và kỳ 07/2025 phát sinh đủ cả 33 mã. Cộng thẳng theo
 * mã thì năm cơ quan hiện hành bị tách làm đôi: mỗi nửa ra một dòng riêng với
 * cùng một tên, nên bảng vừa đếm thừa vừa hiển thị hai dòng trùng tên mà không
 * có cách nào phân biệt. Gộp ở tầng khóa giữ tổng không đổi.
 */
const khoaCqt = (key: string) => taxOfficeEntityOf(key);
const khoaCap = (key: string) => {
  const [office, location] = key.split("|");
  return `${taxOfficeEntityOf(office)}|${location}`;
};

function mergeMap(
  months: string[],
  field: keyof PeriodBucket,
  khoa: (key: string) => string = (key) => key,
): Map<string, bigint> {
  const out = new Map<string, bigint>();
  for (const month of months) {
    const source = PERIODS[month][field] as Record<string, string>;
    for (const [rawKey, value] of Object.entries(source)) {
      const key = khoa(rawKey);
      out.set(key, add(out.get(key) ?? 0n, value));
    }
  }
  return out;
}

function mergeCount(
  months: string[],
  field: keyof PeriodBucket,
  khoa: (key: string) => string = (key) => key,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const month of months) {
    const source = PERIODS[month][field] as Record<string, number>;
    for (const [rawKey, value] of Object.entries(source)) {
      const key = khoa(rawKey);
      out.set(key, (out.get(key) ?? 0) + value);
    }
  }
  return out;
}

/** Tên địa bàn từ mã TMS tám chữ số; giữ nguyên mã khi chưa tra được. */
function locationName(tmsCode: string): string {
  if (tmsCode === CITY_SCOPE.id) return CITY_SCOPE.name;
  return LOCATION_BY_TMS_CODE[tmsCode]?.name ?? `${tmsCode} · chưa có tên`;
}

/**
 * Quan hệ cơ quan thuế với địa bàn của kỳ đang lọc.
 *
 * Suy từ cặp (cơ quan thuế, địa bàn) ghi trên từng chứng từ, không từ một bảng
 * danh mục, vì bảng đó không tồn tại và không thể tồn tại: đo trên kỳ 07/2025
 * thì 121 trên 128 địa bàn nằm dưới từ hai cơ quan thuế trở lên. Nguyên nhân là
 * Thuế TP Hà Nội và Chi cục Thuế Doanh nghiệp lớn quản người nộp thuế lớn trên
 * khắp địa bàn, chồng lên các Thuế cơ sở.
 */
export function taxOfficeScopesOf(
  filters: DashboardFilters,
): TmsBreakdownData["taxOfficeScopes"] {
  const months = actualMonthsOf(filters);
  if (!months.length) return null;

  const byOffice = mergeMap(months, "byTaxOffice", khoaCqt);
  const counts = mergeCount(months, "byTaxOfficeCount", khoaCqt);
  const pairs = mergeMap(months, "byPair", khoaCap);

  const locationsOf = new Map<string, { id: string; name: string; amount: bigint }[]>();
  const officesOfLocation = new Map<string, Set<string>>();
  const moneyOfLocation = new Map<string, bigint>();
  for (const [key, amount] of pairs) {
    const [office, location] = key.split("|");
    const list = locationsOf.get(office) ?? [];
    list.push({ id: location, name: locationName(location), amount });
    locationsOf.set(office, list);
    const offices = officesOfLocation.get(location) ?? new Set<string>();
    offices.add(office);
    officesOfLocation.set(location, offices);
    moneyOfLocation.set(location, (moneyOfLocation.get(location) ?? 0n) + amount);
  }

  const shared = [...officesOfLocation.entries()].filter(([, set]) => set.size > 1).map(([id]) => id);
  const totalLocationMoney = [...moneyOfLocation.values()].reduce((a, b) => a + b, 0n);
  const sharedMoney = shared.reduce((sum, id) => sum + (moneyOfLocation.get(id) ?? 0n), 0n);

  const offices = [...byOffice.entries()]
    .map(([code, amount]) => ({
      code,
      name: taxOfficeNameOf(code) ?? `${code} · chưa có tên trong danh mục`,
      amount: amount.toString(),
      txCount: counts.get(code) ?? 0,
      locations: (locationsOf.get(code) ?? [])
        .sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : 0))
        .map((row) => ({ id: row.id, name: row.name, amount: row.amount.toString() })),
    }))
    .sort((a, b) => (BigInt(b.amount) > BigInt(a.amount) ? 1 : -1));

  return {
    origin: "tms",
    period: months.join(", "),
    offices,
    sharedLocations: shared.length,
    totalLocations: officesOfLocation.size,
    // Mẫu số có thể âm khi phần hoàn lớn hơn phần thu; khi đó tỷ lệ vô nghĩa.
    sharedShare:
      totalLocationMoney > 0n ? Number((sharedMoney * 1000n) / totalLocationMoney) / 10 : null,
  };
}

/**
 * Kỳ dùng làm tham chiếu khi mô phỏng chiều cơ quan thuế.
 *
 * Kỳ đã nhập gần nhất và có độ phủ địa bàn cao nhất. Dùng tỷ lệ quan sát được ở
 * đây để chia tổng của một kỳ chưa có chứng từ, thay vì bốc một hàm băm: tỷ lệ
 * thật cho ra hình dạng đúng, và người xem vẫn được báo là số mô phỏng.
 */
const REFERENCE_PERIOD = "2025-07";

/**
 * Chiều cơ quan thuế cho kỳ CHƯA có chứng từ.
 *
 * Chia `total` theo đúng tỷ trọng của kỳ tham chiếu. Không sinh tiền mới: tổng
 * các cơ quan bằng đúng `total` truyền vào.
 */
export function mockTaxOfficeScopesOf(total: number | null): TmsBreakdownData["taxOfficeScopes"] {
  const reference = PERIODS[REFERENCE_PERIOD];
  if (!reference || total === null) return null;

  const base = BigInt(Math.round(total));
  const officeTotal = Object.values(reference.byTaxOffice).reduce((a, b) => a + BigInt(b), 0n);
  if (officeTotal === 0n) return null;

  // Cùng phép gộp như nhánh dữ liệu thật: kỳ tham chiếu cũng là chứng từ, nên
  // nó mang mã nguồn và cũng tách đôi năm cơ quan nếu cộng thẳng theo mã.
  const theoCqt = new Map<string, bigint>();
  for (const [code, value] of Object.entries(reference.byTaxOffice)) {
    const id = taxOfficeEntityOf(code);
    theoCqt.set(id, (theoCqt.get(id) ?? 0n) + BigInt(value));
  }
  const soCt = new Map<string, number>();
  for (const [code, value] of Object.entries(reference.byTaxOfficeCount)) {
    const id = taxOfficeEntityOf(code);
    soCt.set(id, (soCt.get(id) ?? 0) + value);
  }

  const pairsOf = new Map<string, [string, bigint][]>();
  const theoCap = new Map<string, bigint>();
  for (const [key, value] of Object.entries(reference.byPair)) {
    const [rawOffice, location] = key.split("|");
    const office = taxOfficeEntityOf(rawOffice);
    const capKey = `${office}|${location}`;
    theoCap.set(capKey, (theoCap.get(capKey) ?? 0n) + BigInt(value));
  }
  for (const [key, value] of theoCap) {
    const [office, location] = key.split("|");
    const list = pairsOf.get(office) ?? [];
    list.push([location, value]);
    pairsOf.set(office, list);
  }

  const officesOfLocation = new Map<string, Set<string>>();
  for (const key of theoCap.keys()) {
    const [office, location] = key.split("|");
    const set = officesOfLocation.get(location) ?? new Set<string>();
    set.add(office);
    officesOfLocation.set(location, set);
  }
  const shared = [...officesOfLocation.values()].filter((set) => set.size > 1).length;

  // Tỷ lệ giữ nguyên dấu của kỳ tham chiếu; phần hoàn vẫn là số âm.
  const scale = (value: bigint) => (base * value) / officeTotal;

  const offices = [...theoCqt.entries()]
    .map(([code, value]) => ({
      code,
      name: taxOfficeNameOf(code) ?? `${code} · chưa có tên trong danh mục`,
      amount: scale(value).toString(),
      txCount: soCt.get(code) ?? 0,
      locations: (pairsOf.get(code) ?? [])
        .sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0))
        .map(([id, value]) => ({ id, name: locationName(id), amount: scale(value).toString() })),
    }))
    .sort((a, b) => (BigInt(b.amount) > BigInt(a.amount) ? 1 : -1));

  return {
    origin: "mock",
    period: REFERENCE_PERIOD,
    offices,
    sharedLocations: shared,
    totalLocations: officesOfLocation.size,
    sharedShare: null,
  };
}

/** Tổng thu và khoảng ghi sổ của kỳ đang lọc; `null` khi kỳ chưa có chứng từ. */
export function actualTotalOf(filters: DashboardFilters): {
  period: string;
  amount: string;
  txCount: number;
  bookedFrom: string | null;
  bookedTo: string | null;
} | null {
  const months = actualMonthsOf(filters);
  if (!months.length) return null;
  let amount = 0n;
  let txCount = 0;
  let from: string | null = null;
  let to: string | null = null;
  for (const month of months) {
    const bucket = PERIODS[month];
    amount += BigInt(bucket.amount);
    txCount += bucket.txCount;
    if (bucket.bookedFrom && (from === null || bucket.bookedFrom < from)) from = bucket.bookedFrom;
    if (bucket.bookedTo && (to === null || bucket.bookedTo > to)) to = bucket.bookedTo;
  }
  return { period: months.join(", "), amount: amount.toString(), txCount, bookedFrom: from, bookedTo: to };
}
