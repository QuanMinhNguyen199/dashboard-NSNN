import { ITEM_BY_CODE, LOCATION_BY_ID } from "@/domain/catalog";
import {
  CHAPTER_BY_CODE,
  LEVEL_BY_ID,
  LOCAL_LEVELS,
  SECTION_BY_CODE,
  SUB_ITEM_BY_CODE,
  TAX_OFFICES,
  TMS_ITEMS,
  TMS_ITEMS_WITHOUT_RULE,
  branchesOfItem,
  levelLabel,
  levelOfChapter,
  matchesLevel,
  reviewNoteOf,
  sectionOfSubItem,
  type ManagementLevelFilter,
} from "@/domain/tms";
import type { DashboardFilters, TmsBreakdownData, TmsRow, TmsSectionRow } from "@/domain/types";
import { share } from "@/domain/metrics";
import { sumOf } from "./observations";
import { metaOf } from "./build";

/**
 * Phân rã theo mã hạch toán: cấp quản lý của Chương → Mục → Tiểu mục.
 *
 * **Số ở tầng này là số mô phỏng.** Điều kiện báo cáo nói mã nào đủ điều kiện,
 * không nói mã nào chiếm bao nhiêu; tỷ lệ chỉ suy ra được từ giao dịch thật, mà
 * giao dịch thì chưa được bàn giao. Payload vì vậy mang `origin: "mock"` và
 * giao diện gắn nhãn cho tới khi provider API trả `origin: "api"`.
 *
 * Trong ràng buộc đó, lớp này vẫn giữ ba tính chất để bản demo không dạy sai:
 *
 * · **Không sinh tiền mới.** Mỗi khoản thu nội địa đã có tổng trong kho quan sát
 *   gốc; ở đây chỉ **chia lại** tổng đó xuống các cặp (Chương, Tiểu mục) thuộc
 *   điều kiện của chính khoản đó. Tổng theo Chương, theo Tiểu mục và theo chỉ
 *   tiêu vì vậy bằng nhau tới từng đồng, đúng phép kiểm của đặc tả mục 4.
 * · **Tất định.** Cùng bộ lọc luôn cho cùng con số, không có số ngẫu nhiên.
 * · **Giữ nguyên nhóm chưa xác định.** Mã chưa có tên vẫn mang số của nó thay vì
 *   bị gán bừa vào một Mục hay bị loại khỏi bảng.
 */

const UNKNOWN_SECTION = "chua-xac-dinh-muc";
const UNKNOWN_LEVEL = "chua-xac-dinh-cap";
const NO_NAME_NOTE = "Mã chưa có tên và hiệu lực trong danh mục tra cứu.";

/* ─────────────────────────── Phân bổ mô phỏng ───────────────────────────── */

/** Băm tất định 32 bit. Chỉ phục vụ số mô phỏng, không phải quy tắc nghiệp vụ. */
function hash(...parts: (string | number)[]): number {
  let h = 2166136261;
  for (const part of parts) {
    const text = String(part);
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** Chia `total` theo `weights` sao cho tổng các phần bằng đúng `total`. */
function allocate(total: number, weights: number[]): number[] {
  if (!weights.length) return [];
  const sumWeight = weights.reduce((a, b) => a + b, 0);
  if (sumWeight <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (total * w) / sumWeight);
  const floors = exact.map((v) => Math.floor(v));
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, index) => ({ index, fraction: v - Math.floor(v) }))
    .sort((a, b) => b.fraction - a.fraction);
  const out = [...floors];
  // Phần dư là số nguyên và nhỏ hơn số phần, nên hai vòng này hữu hạn.
  for (let i = 0; remainder > 0 && i < order.length; i++, remainder--) out[order[i].index] += 1;
  for (let i = order.length - 1; remainder < 0 && i >= 0; i--, remainder++) out[order[i].index] -= 1;
  return out;
}

/**
 * Chương được lấy mẫu cho nhánh không có điều kiện Chương riêng.
 *
 * Thuế TNCN, phí, lệ phí hay tiền sử dụng đất phát sinh dưới bất kỳ Chương nào,
 * nên hướng dẫn không khoá chúng vào nhánh nào. Nhưng ghép một khoản với cả trăm
 * Chương thì bảng vô nghĩa, mà thực tế cũng chỉ một phần có phát sinh. Lấy mẫu
 * trải đều để cả bốn cấp đều có mặt; phần nào thật sự phát sinh là việc của
 * giao dịch.
 */
function sampleChapters(pool: string[], seed: string, count: number): string[] {
  const out: string[] = [];
  const step = pool.length / count;
  const offset = Math.floor(hash(seed, "offset") * step);
  for (let i = 0; i < count; i++) {
    const code = pool[Math.min(pool.length - 1, Math.floor(i * step) + offset)];
    if (!out.includes(code)) out.push(code);
  }
  return out;
}

interface MockPair {
  chapterCode: string;
  subItemCode: string;
  weight: number;
}

/**
 * Tập cặp (Chương, Tiểu mục) mô phỏng của một khoản thu.
 *
 * Thưa chứ không phải tích Descartes: đặc tả cấm ghép mọi Chương với mọi Tiểu
 * mục, nên mỗi Tiểu mục chỉ đi cùng hai hoặc ba Chương trong nhánh của nó.
 */
const pairCache = new Map<string, MockPair[]>();

function mockPairsOf(itemCode: string): MockPair[] {
  const cached = pairCache.get(itemCode);
  if (cached) return cached;

  const pairs: MockPair[] = [];
  for (const [branchIndex, branch] of branchesOfItem(itemCode).entries()) {
    const chapters =
      branch.chapterScope === "branch"
        ? branch.chapters
        : sampleChapters(branch.chapters, `${itemCode}#${branchIndex}`, 9);
    if (!chapters.length) continue;
    for (const [subIndex, subItemCode] of branch.subItems.entries()) {
      const count = 2 + Math.floor(hash(itemCode, branchIndex, subItemCode) * 2);
      const start = Math.floor(hash(subItemCode, itemCode) * chapters.length);
      for (let k = 0; k < count; k++) {
        const chapterCode = chapters[(start + k * 3) % chapters.length];
        if (pairs.some((p) => p.chapterCode === chapterCode && p.subItemCode === subItemCode)) continue;
        pairs.push({
          chapterCode,
          subItemCode,
          weight: 0.4 + hash(itemCode, chapterCode, subItemCode, subIndex) * 1.6,
        });
      }
    }
  }
  const total = pairs.reduce((sum, p) => sum + p.weight, 0);
  const normalised = total > 0 ? pairs.map((p) => ({ ...p, weight: p.weight / total })) : [];
  pairCache.set(itemCode, normalised);
  return normalised;
}

interface PairAmount extends MockPair {
  amount: number;
  previous: number | null;
  itemCode: string;
}

/** Chia tổng của từng khoản thu xuống các cặp của chính nó. */
function pairAmounts(filters: DashboardFilters, locationIds?: string[]): PairAmount[] {
  const out: PairAmount[] = [];
  for (const item of TMS_ITEMS) {
    const total = sumOf(filters, { items: [item], locationIds });
    if (total === null) continue; // Thiếu dữ liệu: bỏ qua, không thay bằng 0.
    const previousTotal = sumOf(filters, { items: [item], locationIds, year: filters.year - 1 });
    const pairs = mockPairsOf(item.code);
    const weights = pairs.map((p) => p.weight);
    const amounts = allocate(total, weights);
    const previous = previousTotal === null ? null : allocate(previousTotal, weights);
    for (const [index, pair] of pairs.entries())
      out.push({
        ...pair,
        amount: amounts[index],
        previous: previous ? previous[index] : null,
        itemCode: item.code,
      });
  }
  return out;
}

/* ──────────────────────────── Gom theo từng chiều ───────────────────────── */

const addPrevious = (a: number | null, b: number | null) =>
  a === null && b === null ? null : (a ?? 0) + (b ?? 0);

interface Bucket {
  amount: number;
  previous: number | null;
  items: Set<string>;
}

function push(map: Map<string, Bucket>, key: string, pair: PairAmount) {
  const bucket = map.get(key) ?? { amount: 0, previous: null, items: new Set<string>() };
  bucket.amount += pair.amount;
  bucket.previous = addPrevious(bucket.previous, pair.previous);
  bucket.items.add(pair.itemCode);
  map.set(key, bucket);
}

function statusOf(bucket: Bucket, extra?: string): Pick<TmsRow, "status" | "reviewNote"> {
  const notes = [...bucket.items].map(reviewNoteOf).filter((n): n is string => !!n);
  if (extra) notes.unshift(extra);
  const unique = [...new Set(notes)];
  return unique.length ? { status: "needsReview", reviewNote: unique.join(" ") } : { status: "confirmed" };
}

const rowOf = (id: string, name: string, bucket: Bucket, extra?: string): TmsRow => ({
  id,
  name,
  amount: bucket.amount,
  previous: bucket.previous,
  ...statusOf(bucket, extra),
});

const byAmountDesc = (a: { amount: number | null }, b: { amount: number | null }) =>
  (b.amount ?? 0) - (a.amount ?? 0);

export function buildTmsBreakdown(
  filters: DashboardFilters,
  level: ManagementLevelFilter,
  locationId: string | null = null,
): TmsBreakdownData | null {
  // Địa bàn là chiều độc lập với cấp quản lý (ca TMS24), nhưng vẫn là bộ lọc thật.
  const locationIds = locationId ? [locationId] : undefined;
  const pairs = pairAmounts(filters, locationIds);
  if (!pairs.length) return null;

  // Phân bố theo cấp tính trên TOÀN phạm vi, không theo cấp đang lọc: đó là mẫu
  // số để đọc "cấp này chiếm bao nhiêu", nên lọc rồi mới cộng là tự tính 100%.
  const levelBuckets = new Map<string, Bucket>();
  let scopeAmount = 0;
  let scopePrevious: number | null = null;
  for (const pair of pairs) {
    push(levelBuckets, levelOfChapter(pair.chapterCode) ?? UNKNOWN_LEVEL, pair);
    scopeAmount += pair.amount;
    scopePrevious = addPrevious(scopePrevious, pair.previous);
  }

  const selected = pairs.filter((pair) => matchesLevel(level, levelOfChapter(pair.chapterCode)));

  const sectionBuckets = new Map<string, Bucket>();
  const subItemBuckets = new Map<string, Bucket>();
  const chapterBuckets = new Map<string, Bucket>();
  let levelAmount = 0;
  let levelPrevious: number | null = null;
  for (const pair of selected) {
    push(sectionBuckets, sectionOfSubItem(pair.subItemCode) ?? UNKNOWN_SECTION, pair);
    push(subItemBuckets, pair.subItemCode, pair);
    push(chapterBuckets, pair.chapterCode, pair);
    levelAmount += pair.amount;
    levelPrevious = addPrevious(levelPrevious, pair.previous);
  }

  const subItemsBySection = new Map<string, string[]>();
  for (const code of subItemBuckets.keys()) {
    const key = sectionOfSubItem(code) ?? UNKNOWN_SECTION;
    subItemsBySection.set(key, [...(subItemsBySection.get(key) ?? []), code]);
  }

  const sectionRow = (key: string): TmsSectionRow => {
    const known = SECTION_BY_CODE[key];
    const children = (subItemsBySection.get(key) ?? [])
      .map((code) => {
        const def = SUB_ITEM_BY_CODE[code];
        return rowOf(
          code,
          def ? def.name : "Chưa có tên trong danh mục",
          subItemBuckets.get(code)!,
          def ? undefined : NO_NAME_NOTE,
        );
      })
      .sort(byAmountDesc);
    const base = rowOf(
      key,
      known ? `${known.code} · ${known.name}` : "Chưa xác định Mục",
      sectionBuckets.get(key)!,
      known ? undefined : "Tiểu mục chưa có tên trong danh mục nên chưa tra được Mục cha.",
    );
    return { ...base, share: share(base.amount, levelAmount), subItems: children };
  };

  const sections = [...sectionBuckets.keys()]
    .filter((key) => key !== UNKNOWN_SECTION)
    .map(sectionRow)
    .sort(byAmountDesc);
  /**
   * Nhóm chưa xác định đứng ĐẦU bảng, không phải cuối.
   *
   * Nó không dự thi thứ hạng với các Mục thật, nhưng thường là nhóm lớn nhất vì
   * điều kiện báo cáo tham chiếu hàng trăm mã chưa có tên. Xếp cuối một bảng có
   * vùng cuộn riêng nghĩa là con số quan trọng nhất nằm ngoài tầm nhìn.
   */
  if (sectionBuckets.has(UNKNOWN_SECTION)) sections.unshift(sectionRow(UNKNOWN_SECTION));

  const chapterRows = [...chapterBuckets.entries()]
    .map(([code, bucket]) => {
      const def = CHAPTER_BY_CODE[code];
      const row = rowOf(
        code,
        def ? `${code} · ${def.name}` : `${code} · chưa có tên trong danh mục`,
        bucket,
        def ? undefined : NO_NAME_NOTE,
      );
      return {
        ...row,
        share: share(row.amount, levelAmount),
        meta: def ? LEVEL_BY_ID[def.level].name : "Chưa xác định cấp",
      };
    })
    .sort(byAmountDesc);

  /** Cộng một nhóm cấp; `levels` là tầng trên nên địa phương đã gộp ba cấp con. */
  const sumLevels = (ids: string[]) =>
    ids.reduce(
      (acc, id) => {
        const bucket = levelBuckets.get(id);
        return bucket
          ? { amount: acc.amount + bucket.amount, previous: addPrevious(acc.previous, bucket.previous) }
          : acc;
      },
      { amount: 0, previous: null as number | null },
    );
  const localTotals = sumLevels(LOCAL_LEVELS);
  const centralTotals = sumLevels(["trung-uong"]);
  const unknownTotals = sumLevels([UNKNOWN_LEVEL]);

  const levels: TmsRow[] = [
    {
      id: "trung-uong",
      name: "Trung ương",
      ...centralTotals,
      share: share(centralTotals.amount, scopeAmount),
      meta: `Chương ${LEVEL_BY_ID["trung-uong"].range}`,
      status: "confirmed",
    },
    {
      id: "dia-phuong",
      name: "Địa phương",
      ...localTotals,
      share: share(localTotals.amount, scopeAmount),
      meta: "Gồm cấp tỉnh, cấp huyện và cấp xã",
      status: "confirmed",
    },
    ...(levelBuckets.has(UNKNOWN_LEVEL)
      ? [
          {
            id: UNKNOWN_LEVEL,
            name: "Chưa xác định cấp",
            ...unknownTotals,
            share: share(unknownTotals.amount, scopeAmount),
            meta: "Chương chưa có bản ghi trong danh mục",
            status: "confirmed" as const,
          },
        ]
      : []),
  ];

  const localLevels: TmsRow[] = LOCAL_LEVELS.filter((id) => levelBuckets.has(id)).map((id) => {
    const bucket = levelBuckets.get(id)!;
    return {
      id,
      name: LEVEL_BY_ID[id].name,
      amount: bucket.amount,
      previous: bucket.previous,
      // Mẫu số là địa phương, không phải toàn phạm vi: đây là phân rã của dòng cha.
      share: share(bucket.amount, localTotals.amount),
      meta: `Chương ${LEVEL_BY_ID[id].range}`,
      status: "confirmed",
    };
  });

  /**
   * Cấp quản lý của Chương và cấp ngân sách được hưởng có CÙNG HÌNH DẠNG hai
   * bậc nhưng là hai trường khác nhau, không suy được ra nhau. Đặt cạnh nhau và
   * hiện khoảng chênh là cách duy nhất trả lời dứt điểm câu "hai cái này có phải
   * một không"; con số chênh chính là bằng chứng rằng không.
   */
  const budgetTotalOf = (budgetLevel: "NSTW" | "NSDP") =>
    filters.budgetLevel !== "NSNN" && filters.budgetLevel !== budgetLevel
      ? null
      : sumOf({ ...filters, budgetLevel }, { items: TMS_ITEMS, locationIds });

  const correspondence = [
    { id: "trung-uong", management: "Trung ương", budget: "NSTW", amount: centralTotals.amount, budgetAmount: budgetTotalOf("NSTW") },
    { id: "dia-phuong", management: "Địa phương", budget: "NSĐP", amount: localTotals.amount, budgetAmount: budgetTotalOf("NSDP") },
  ].map((row) => ({ ...row, gap: row.budgetAmount === null ? null : row.amount - row.budgetAmount }));

  const nsnnAmount = sumOf(filters, { locationIds });
  const nsnnPrevious = sumOf(filters, { locationIds, year: filters.year - 1 });
  const scopeName = locationId ? (LOCATION_BY_ID[locationId]?.name ?? locationId) : "Toàn thành phố";

  return {
    meta: metaOf(filters, `${levelLabel(level)} · ${scopeName}`),
    level,
    origin: "mock",
    scopeName,
    nsnnTotal:
      nsnnAmount === null
        ? null
        : { id: "nsnn", name: "Tổng thu NSNN cùng kỳ và cùng địa bàn", amount: nsnnAmount, previous: nsnnPrevious },
    scopeTotal: {
      id: "scope",
      name: "Thu nội địa trong phạm vi TMS",
      amount: scopeAmount,
      previous: scopePrevious,
      status: "confirmed",
    },
    levelTotal: {
      id: "level",
      name: levelLabel(level),
      amount: levelAmount,
      previous: levelPrevious,
      share: share(levelAmount, nsnnAmount),
      status: "confirmed",
    },
    levels,
    localLevels,
    correspondence,
    sections,
    chapters: chapterRows,
    // Danh sách không lọc theo cấp quản lý: hai chiều độc lập với nhau.
    taxOffices: TAX_OFFICES.map((office) => ({
      id: office.code,
      name: `${office.code} · ${office.name}`,
      amount: null,
      previous: null,
      status: "confirmed" as const,
    })),
    quality: {
      subItemsWithoutName: [...subItemBuckets.keys()].filter((code) => !SUB_ITEM_BY_CODE[code]).length,
      chaptersWithoutLevel: [...chapterBuckets.keys()].filter((code) => !CHAPTER_BY_CODE[code]).length,
      itemsWithoutRule: TMS_ITEMS_WITHOUT_RULE.map((item) => ITEM_BY_CODE[item.code]?.name ?? item.code),
    },
  };
}
