import { CRUDE_OIL_ITEMS, DOMESTIC_ITEMS } from "@/domain/catalog";
import {
  DIMENSION_BY_ID,
  GRID_UNCLASSIFIED,
  REPORT_ROWS,
  gridMembersOf,
  childrenOf,
  isLeaf,
  summableChildrenOf,
  templateNoOf,
  type ReportDimension,
  type ReportRowDef,
} from "@/domain/report";
import type {
  CellStatus,
  DashboardFilters,
  ReportCell,
  ReportColumn,
  ReportGridData,
  ReportRow,
} from "@/domain/types";
import { sumOf } from "./observations";
import { metaOf } from "./build";

/**
 * Lưới báo cáo mô phỏng: hàng là cây 113 chỉ tiêu, cột là chiều được chọn.
 *
 * Ba tính chất được giữ để bản demo không dạy sai:
 *
 * · **Không sinh tiền mới.** Tổng của dòng gốc A lấy từ kho quan sát, rồi chia
 *   xuống các dòng lá và các cột. Mọi tổng cộng khớp tới từng đồng.
 * · **Chỉ nhánh A có số.** Hoàn thuế, trả lãi và thu hồi hoàn chưa có căn cứ nào
 *   trong kho quan sát, nên chúng để `null` kèm trạng thái riêng chứ không bịa.
 * · **Dòng giải thích không cộng vào cha.** `breakdown` và `ofWhich` lấy một
 *   phần của chính dòng cha; đưa chúng vào phép cộng là đếm tiền hai lần.
 */

const UNCLASSIFIED = GRID_UNCLASSIFIED;

/** Băm tất định 32 bit. Chỉ phục vụ số mô phỏng, không phải quy tắc nghiệp vụ. */
function hash(...parts: string[]): number {
  let h = 2166136261;
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) {
      h ^= part.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e3779b9;
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** Chia `total` theo `weights` sao cho tổng các phần bằng đúng `total`. */
function allocate(total: bigint, weights: number[]): bigint[] {
  if (!weights.length) return [];
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 0n);
  const scale = 1_000_000;
  const shares = weights.map((w) => BigInt(Math.round((w / sum) * scale)));
  const shareSum = shares.reduce((a, b) => a + b, 0n);
  if (shareSum === 0n) return weights.map(() => 0n);
  const parts = shares.map((s) => (total * s) / shareSum);
  let remainder = total - parts.reduce((a, b) => a + b, 0n);
  // Phần dư nhỏ hơn số phần, nên vòng này hữu hạn. Rải theo thứ tự trọng số
  // giảm dần để kết quả tất định, không phụ thuộc thứ tự lặp của Map.
  const order = weights
    .map((w, index) => ({ index, w }))
    .sort((a, b) => b.w - a.w || a.index - b.index);
  const step = remainder >= 0n ? 1n : -1n;
  for (let i = 0; remainder !== 0n && i < order.length; i++, remainder -= step)
    parts[order[i].index] += step;
  return parts;
}

/* ───────────────────────────── Tổng theo hàng ───────────────────────────── */

/**
 * Nhánh A là nhánh duy nhất có căn cứ để chia số.
 *
 * A gồm cả dầu thô, nên mẫu số lấy từ kho quan sát là thu nội địa cộng dầu thô.
 * A* bằng A trừ dầu thô, đúng theo định nghĩa trong hướng dẫn chứ không phải là
 * tổng đã trừ hoàn thuế giá trị gia tăng.
 */
const A_ITEMS = [...DOMESTIC_ITEMS, ...CRUDE_OIL_ITEMS];

function rowTotals(filters: DashboardFilters): Map<string, bigint | null> {
  const totals = new Map<string, bigint | null>();
  const rootAmount = sumOf(filters, { items: A_ITEMS });
  if (rootAmount === null) return totals;

  // Các dòng lá được cộng vào tổng, tính từ gốc A đi xuống theo cạnh cộng được.
  const summableLeaves: ReportRowDef[] = [];
  const walk = (id: string) => {
    const children = summableChildrenOf(id);
    if (!children.length) {
      const row = REPORT_ROWS.find((r) => r.id === id);
      if (row && isLeaf(row)) summableLeaves.push(row);
      return;
    }
    for (const child of children) walk(child.id);
  };
  walk("A");

  const weights = summableLeaves.map((row) => 0.35 + hash(row.id) * 1.3);
  const parts = allocate(BigInt(Math.round(rootAmount)), weights);
  summableLeaves.forEach((row, index) => totals.set(row.id, parts[index]));

  // Dòng công thức cộng từ con; đi ngược từ dưới lên nên con luôn có trước cha.
  for (const row of [...REPORT_ROWS].reverse()) {
    if (row.kind !== "formula") continue;
    const children = summableChildrenOf(row.id);
    if (!children.length) continue;
    let sum = 0n;
    let seen = false;
    for (const child of children) {
      const value = totals.get(child.id);
      if (value === undefined || value === null) continue;
      sum += value;
      seen = true;
    }
    totals.set(row.id, seen ? sum : null);
  }

  // A* không có con: theo định nghĩa nó là A trừ nhánh dầu thô.
  const a = totals.get("A");
  const oil = totals.get("A.I.1");
  totals.set("ASTAR", a === undefined || a === null || oil === undefined || oil === null ? null : a - oil);

  // Dòng giải thích lấy một phần của chính dòng cha và KHÔNG được cộng lên.
  for (const row of REPORT_ROWS) {
    if (row.kind !== "breakdown" && row.kind !== "ofWhich") continue;
    const parent = row.parent ? totals.get(row.parent) : null;
    if (parent === undefined || parent === null) {
      totals.set(row.id, null);
      continue;
    }
    const share = BigInt(Math.round(hash(row.id, "share") * 3000) + 200); // 2% đến 32%
    totals.set(row.id, (parent * share) / 10000n);
  }

  return totals;
}

/**
 * Trạng thái của một dòng.
 *
 * Tiêu đề B và D không phát sinh tổng, nên ô trống ở đó là kết quả đúng. Nhánh
 * B, C, D chưa có căn cứ tính nên mang `needsReview`, không mang số 0.
 */
function statusOf(row: ReportRowDef): CellStatus {
  if (row.kind === "heading") return "notApplicable";
  // Toàn bộ số trong provider này được chia bằng trọng số mô phỏng. Có giá trị
  // không đồng nghĩa đã được nghiệp vụ xác nhận, nên tuyệt đối không trả
  // `confirmed` rồi để UI/API hiểu đó là số đã kiểm chứng.
  return "needsReview";
}

const depthOf = (row: ReportRowDef, byId: Map<string, ReportRowDef>) => {
  let depth = 0;
  let current = row.parent;
  while (current) {
    depth += 1;
    current = byId.get(current)?.parent ?? null;
  }
  return depth;
};

/* ─────────────────────────────── Cột báo cáo ────────────────────────────── */

/**
 * Nhóm "Chưa xác định" là một cột thật, không phải phần bị bỏ đi.
 *
 * Giao dịch chưa nối được chiều đang nhóm vẫn mang tiền. Bỏ chúng khỏi bảng thì
 * tổng các cột không còn bằng tổng của hàng, và người đọc không có cách nào biết
 * phần thiếu lớn bao nhiêu.
 */
const membersOf = gridMembersOf;

interface LeafColumn {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
}

function leafColumns(groupBy: ReportDimension, subGroupBy: ReportDimension | null): LeafColumn[] {
  const groups = membersOf(groupBy);
  if (!subGroupBy)
    return groups.map((g) => ({ id: g.id, name: g.name, parentId: null, parentName: null }));
  const subs = membersOf(subGroupBy);
  const out: LeafColumn[] = [];
  for (const group of groups)
    for (const sub of subs)
      out.push({ id: `${group.id}/${sub.id}`, name: sub.name, parentId: group.id, parentName: group.name });
  return out;
}

/* ──────────────────────────────── Dựng lưới ─────────────────────────────── */

const gridCache = new Map<string, { rows: ReportRow[]; byRow: Map<string, bigint[]> }>();

export function buildReportGrid(
  filters: DashboardFilters,
  options: {
    groupBy: ReportDimension;
    subGroupBy: ReportDimension | null;
    columnOffset: number;
    columnLimit: number;
  },
): ReportGridData | null {
  const { groupBy, subGroupBy } = options;
  if (subGroupBy === groupBy) return null;

  const columns = leafColumns(groupBy, subGroupBy);
  const cacheKey = [
    filters.year,
    filters.periodType,
    filters.period,
    filters.accumulation,
    filters.indicator,
    filters.budgetLevel,
    groupBy,
    subGroupBy ?? "-",
  ].join("|");

  let cached = gridCache.get(cacheKey);
  if (!cached) {
    const totals = rowTotals(filters);
    const byId = new Map(REPORT_ROWS.map((row) => [row.id, row]));
    const byRow = new Map<string, bigint[]>();
    const rows: ReportRow[] = REPORT_ROWS.map((row) => {
      const value = totals.get(row.id) ?? null;
      if (value !== null) {
        // Trọng số cột phụ thuộc cả hàng lẫn cột, nên hai hàng khác nhau không
        // có cùng hình dáng phân bố — nếu không, mọi hàng trông như nhân bản.
        const weights = columns.map((column) => 0.2 + hash(row.id, column.id) * 1.8);
        byRow.set(row.id, allocate(value, weights));
      }
      return {
        id: row.id,
        parent: row.parent,
        kind: row.kind,
        name: row.name,
        depth: depthOf(row, byId),
        total: value === null ? null : value.toString(),
        status: statusOf(row),
      };
    });
    cached = { rows, byRow };
    if (gridCache.size > 24) gridCache.clear();
    gridCache.set(cacheKey, cached);
  }

  const offset = Math.max(0, Math.min(options.columnOffset, Math.max(0, columns.length - 1)));
  const limit = Math.max(1, options.columnLimit);
  const page = columns.slice(offset, offset + limit);

  const cells: ReportCell[] = [];
  for (const row of cached.rows) {
    const parts = cached.byRow.get(row.id);
    page.forEach((column, index) => {
      const absolute = offset + index;
      const value = parts ? parts[absolute] : null;
      cells.push({
        rowId: row.id,
        columnId: column.id,
        value: value === undefined || value === null ? null : value.toString(),
        status: row.status,
        // Mở chi tiết cần khóa do máy chủ cấp và kiểm quyền; lớp mô phỏng không
        // có quyền để kiểm nên không phát khóa, và giao diện phải chịu được điều đó.
        drillToken: null,
      });
    });
  }

  const pageColumns: ReportColumn[] = [];
  const seenParents = new Set<string>();
  for (const column of page) {
    if (column.parentId && !seenParents.has(column.parentId)) {
      seenParents.add(column.parentId);
      pageColumns.push({ id: column.parentId, name: column.parentName ?? column.parentId, parentId: null });
    }
    pageColumns.push({ id: column.id, name: column.name, parentId: column.parentId });
  }

  const unclassified = cached.byRow.get("A");
  const unclassifiedTotal =
    unclassified === undefined
      ? null
      : columns
          .map((column, index) => (column.id.endsWith(UNCLASSIFIED) ? unclassified[index] : 0n))
          .reduce((a, b) => a + b, 0n)
          .toString();

  return {
    meta: metaOf(filters, `${DIMENSION_BY_ID[groupBy].name}${subGroupBy ? ` · ${DIMENSION_BY_ID[subGroupBy].name}` : ""}`),
    origin: "mock",
    templateNo: templateNoOf(groupBy, subGroupBy),
    groupBy,
    subGroupBy,
    rows: cached.rows,
    columns: pageColumns,
    columnPage: { offset, limit, total: columns.length },
    cells,
    quality: {
      cellsNeedingReview: cells.filter((cell) => cell.status === "needsReview").length,
      unclassified: unclassifiedTotal,
    },
  };
}

/** Dòng con trực tiếp, dùng khi giao diện mở hoặc đóng một nhánh. */
export const reportChildrenOf = childrenOf;
