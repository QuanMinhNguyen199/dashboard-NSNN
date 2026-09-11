import {
  ALL_ITEMS,
  ITEM_BY_CODE,
  LOCATIONS,
  SOURCE_BY_CODE,
  latestMonth,
  ALL_PERIODS,
  type BudgetLevel,
  type ItemDef,
  type SourceCode,
} from "./catalog";
import type { DashboardFilters, RevenueObservation } from "./types";

/**
 * Kho quan sát gốc.
 *
 * KPI, xu hướng, cơ cấu, xếp hạng, bảng và waterfall đều gọi `amountOf` ở đây;
 * không widget nào tự sinh số riêng. Hàm sinh là thuần và tất định nên cùng bộ
 * lọc luôn cho cùng kết quả, và các tổng ở mọi chiều đều cộng khớp nhau.
 *
 * Đơn vị nội bộ là **đồng**, chuẩn hoá đúng một lần tại đây.
 */

const CITY = "CITY";
const YEAR_BASE = 2024;
const ITEM_INDEX = new Map(ALL_ITEMS.map((item, index) => [item.code, index]));
const LOCATION_INDEX = new Map(LOCATIONS.map((l, i) => [l.id, i]));

/** Băm tất định 32 bit — thay cho số ngẫu nhiên, để mock tái lập được. */
function hash(...parts: number[]): number {
  let h = 2166136261;
  for (const part of parts) {
    h ^= part + 0x9e3779b9;
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** Quy mô nền của từng khoản thu, đơn vị tỷ đồng/tháng ở mức toàn thành phố. */
const ITEM_SCALE: Record<string, number> = {
  "I.1.1": 5400, "I.1.2": 1250, "I.2": 4600, "I.3": 8100,
  "I.4": 5300, "I.5": 1180, "I.6": 1750, "I.7": 690,
  "I.8": 4, "I.9": 180, "I.10": 2100, "I.11": 4300, "I.12": 140,
  "I.13": 105, "I.14": 72, "I.15": 0, "I.16": 560,
  "I.17": 36, "I.18": 350, "I.19": 700, "I.20": 105,
  "III.1.1": 210, "III.1.2": 640, "III.1.3": 290, "III.1.4": 2380,
  "III.1.5": 60, "III.1.6": 85, "III.1.7": 75,
  "III.2.1": -680, "III.2.2": -140, "III.2.3": -55,
  "II.1": 720, "II.2": 130,
  IV: 60, V: 145, VI: 9, VII: 48, VIII: -12,
};

/** Nhịp mùa vụ trong năm; tháng 12 dồn quyết toán. */
const SEASON = [1.24, 0.73, 1.07, 1.19, 0.92, 1.15, 1.03, 1.1, 1.07, 1.16, 1.11, 1.47];

/** Tỷ lệ điều tiết về trung ương, khác nhau theo khoản thu. */
function centralShare(item: ItemDef): number {
  if (item.source === "crude-oil") return 1;
  if (item.source === "import-export") return 1;
  if (item.group === "nha-dat") return 0.05;
  return 0.3 + hash(ITEM_INDEX.get(item.code) ?? 0, 7) * 0.45;
}

/** Tốc độ tăng riêng của từng khoản; nếu dùng chung một hệ số thì mọi ô %YoY trùng nhau. */
function annualRate(item: ItemDef): number {
  const i = ITEM_INDEX.get(item.code) ?? 0;
  return 0.02 + hash(i, 31) * 0.18;
}

/** Trọng số địa bàn: quy mô nền và xu hướng riêng của từng phường/xã. */
function locationWeight(locationIndex: number, year: number, group: string): number {
  const base = (1 + ((locationIndex * 37 + 11) % 101)) ** 1.32;
  const groupTilt = 0.55 + hash(locationIndex, group.length * 13) * 1.35;
  // Biên độ đủ rộng để %YoY của các địa bàn trải ra, thay vì dồn quanh mức chung.
  const trend = (1 + (hash(locationIndex, 5) - 0.42) * 0.9) ** (year - YEAR_BASE);
  return base * groupTilt * trend;
}

const weightCache = new Map<string, { total: number; weights: number[] }>();
function locationWeights(year: number, group: string) {
  const key = `${year}:${group}`;
  const cached = weightCache.get(key);
  if (cached) return cached;
  const weights = LOCATIONS.map((_, i) => locationWeight(i, year, group));
  const entry = { weights, total: weights.reduce((a, b) => a + b, 0) };
  weightCache.set(key, entry);
  return entry;
}

/**
 * Hai phường/xã cố ý thiếu số liệu năm 2026 để kiểm thử trạng thái `partial`.
 * Đây là quan sát **thiếu**, không phải giá trị 0.
 */
export const MISSING_2026 = new Set([LOCATIONS.at(-1)!.id, LOCATIONS.at(-2)!.id]);

export function hasObservation(year: number, month: number, locationId: string): boolean {
  if (month > latestMonth(year)) return false;
  if (year === 2026 && MISSING_2026.has(locationId)) return false;
  return true;
}

/**
 * Giá trị một quan sát, đơn vị đồng.
 * `null` = chưa có dữ liệu. `0` và số âm là giá trị hợp lệ và phải giữ nguyên.
 */
export function amountOf(
  year: number,
  month: number,
  itemCode: string,
  locationId: string,
  level: BudgetLevel,
): number | null {
  const item = ITEM_BY_CODE[itemCode];
  if (!item) return null;
  if (!hasObservation(year, month, locationId)) return null;

  const cityOnly = SOURCE_BY_CODE[item.source].cityOnly;
  if (cityOnly !== (locationId === CITY)) return null;

  const itemIndex = ITEM_INDEX.get(itemCode)!;
  const scaleTy = ITEM_SCALE[itemCode] ?? 0;
  if (scaleTy === 0) return 0; // Khoản có danh mục nhưng không phát sinh: 0 hợp lệ.

  const growth = (1 + annualRate(item)) ** (year - YEAR_BASE);
  const wobble = 1 + (hash(itemIndex, month, year) - 0.5) * 0.16;
  let amountTy = scaleTy * SEASON[month - 1] * growth * wobble;

  if (!cityOnly) {
    const group = item.group ?? item.source;
    const { weights, total } = locationWeights(year, group);
    const index = LOCATION_INDEX.get(locationId);
    if (index === undefined) return null;
    const missingWeight = LOCATIONS.reduce(
      (sum, l, i) => sum + (hasObservation(year, month, l.id) ? 0 : weights[i]),
      0,
    );
    amountTy *= weights[index] / (total - missingWeight);
  }

  const share = level === "NSTW" ? centralShare(item) : 1 - centralShare(item);
  return Math.round(amountTy * share * 1e9);
}

/** Các tháng thuộc kỳ đang chọn, theo PERIOD hoặc YTD. */
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

export const LEVELS: BudgetLevel[] = ["NSTW", "NSDP"];

/** Các cấp ngân sách nằm trong phạm vi bộ lọc hiện tại. */
export const levelsOf = (budgetLevel: DashboardFilters["budgetLevel"]): BudgetLevel[] =>
  budgetLevel === "NSNN" ? LEVELS : [budgetLevel];

/**
 * Chỉ tiêu là ba TỔNG khác nhau, không phải một field.
 * `thu-nsnn` bỏ vay và chuyển giao; `tong-so-tru-hoan-thue` bỏ dòng hoàn GTGT.
 */
export function itemsForIndicator(indicator: DashboardFilters["indicator"], items: ItemDef[]): ItemDef[] {
  if (indicator === "tong-so-tru-hoan-thue") return items.filter((i) => i.code !== "III.2.1");
  if (indicator === "thu-nsnn") return items.filter((i) => i.code !== "VI" && i.code !== "VII");
  return items;
}

interface SumOptions {
  items?: ItemDef[];
  locationIds?: string[];
  year?: number;
  months?: number[];
}

/**
 * Tổng của một lát cắt. Trả `null` khi mọi quan sát trong lát đều thiếu — không
 * bao giờ trả 0 thay cho dữ liệu chưa có.
 */
const sumCache = new Map<string, number | null>();

export function sumOf(filters: DashboardFilters, options: SumOptions = {}): number | null {
  // Tổng thành phố cho 12 tháng × 2 năm là hàng triệu phép cộng nếu tính lại mỗi
  // lần render, nên ghi nhớ theo khoá tất định của lát cắt.
  const cacheKey = [
    options.year ?? filters.year,
    filters.indicator,
    filters.budgetLevel,
    (options.months ?? monthsOf(filters)).join(","),
    options.items ? options.items.map((i) => i.code).join(",") : "*",
    options.locationIds ? options.locationIds.join(",") : "*",
  ].join("|");
  const cached = sumCache.get(cacheKey);
  if (cached !== undefined) return cached;
  const result = computeSum(filters, options);
  if (sumCache.size > 4000) sumCache.clear();
  sumCache.set(cacheKey, result);
  return result;
}

function computeSum(filters: DashboardFilters, options: SumOptions): number | null {
  const year = options.year ?? filters.year;
  const months = options.months ?? monthsOf(filters);
  const items = itemsForIndicator(filters.indicator, options.items ?? ALL_ITEMS);
  const levels = levelsOf(filters.budgetLevel);

  let total = 0;
  let seen = false;
  for (const item of items) {
    // Nguồn do trung ương quản lý (XNK, dầu thô) không phân bổ được về phường/xã.
    // Khi phạm vi là một địa bàn cụ thể thì phải BỎ HẲN, không được cộng nguyên
    // phần thành phố vào từng địa bàn.
    const cityOnly = SOURCE_BY_CODE[item.source].cityOnly;
    if (cityOnly && options.locationIds) continue;
    const locations = cityOnly ? [CITY] : (options.locationIds ?? LOCATIONS.map((l) => l.id));
    for (const locationId of locations) {
      for (const month of months) {
        for (const level of levels) {
          const value = amountOf(year, month, item.code, locationId, level);
          if (value === null) continue;
          seen = true;
          total += value;
        }
      }
    }
  }
  return seen ? total : null;
}

export const CITY_ID = CITY;

/** Danh sách quan sát thô của một lát cắt — dùng cho bảng và đối chiếu. */
export function listObservations(
  filters: DashboardFilters,
  options: SumOptions = {},
): RevenueObservation[] {
  const year = options.year ?? filters.year;
  const months = options.months ?? monthsOf(filters);
  const items = itemsForIndicator(filters.indicator, options.items ?? ALL_ITEMS);
  const levels = levelsOf(filters.budgetLevel);
  const out: RevenueObservation[] = [];
  for (const item of items) {
    const cityOnly = SOURCE_BY_CODE[item.source].cityOnly;
    if (cityOnly && options.locationIds) continue;
    const locations = cityOnly ? [CITY] : (options.locationIds ?? LOCATIONS.map((l) => l.id));
    for (const locationId of locations)
      for (const month of months)
        for (const level of levels)
          out.push({
            year,
            month,
            locationId,
            itemCode: item.code,
            sourceCode: item.source as SourceCode,
            budgetLevel: level,
            amountVnd: amountOf(year, month, item.code, locationId, level),
          });
  }
  return out;
}
