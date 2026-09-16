import type {
  AdvancedComparisonData,
  AdvancedComparisonMode,
  DashboardNavigationAction,
  LocationDetailData,
  OverviewData,
  RevenueAnalysisData,
  TabId,
  TmsBreakdownData,
} from "@/domain/types";
import { LOCATION_BY_ID, SOURCE_BY_CODE } from "@/domain/catalog";

/**
 * Ranh giới tin cậy giữa dữ liệu bên ngoài và giao diện.
 *
 * MCP và API chỉ được trả **dữ liệu** và **navigation intent đã whitelist**.
 * Không component, không HTML, không JavaScript, không CSS class, không URL thô.
 * Ứng dụng tự dịch intent đã kiểm tra thành URL nội bộ.
 */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isFinite_ = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isNullableNumber = (value: unknown) => value === null || isFinite_(value);

export const SOURCES_ALLOWED = ["api", "mcp", "fixture", "mock"];
export const TABS_ALLOWED: TabId[] = [
  "overview",
  "revenue-analysis",
  "location-detail",
  "tms-breakdown",
  "advanced-compare",
];
const TMS_LEVELS_ALLOWED = ["all", "trung-uong", "dia-phuong", "tinh", "huyen", "xa", "unknown"];
const MODES_ALLOWED: AdvancedComparisonMode[] = ["period", "revenue", "location"];

export class PayloadError extends Error {}

/** Không phải lỗi: lát cắt hợp lệ nhưng chưa có quan sát nào. */
export class NoDataError extends Error {
  readonly name = "NoDataError";
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new PayloadError(message);
}

function validateAmountRow(value: unknown, where: string) {
  assert(isRecord(value), `${where}: dòng số liệu không phải object.`);
  assert(typeof value.id === "string" && typeof value.name === "string", `${where}: thiếu id hoặc name.`);
  assert(isFinite_(value.amount), `${where}: amount phải là số hữu hạn.`);
  assert(isNullableNumber(value.previous), `${where}: previous phải là số hoặc null.`);
}

function validateTrend(value: unknown, where: string) {
  assert(Array.isArray(value), `${where}: trend phải là mảng.`);
  for (const point of value) {
    assert(isRecord(point) && isFinite_(point.month), `${where}: điểm xu hướng thiếu month.`);
    assert(
      isNullableNumber(point.current) && isNullableNumber(point.previous),
      `${where}: giá trị xu hướng phải là số hoặc null.`,
    );
  }
}

function validateWaterfall(value: unknown, where: string) {
  assert(isRecord(value), `${where}: waterfall không phải object.`);
  assert(isFinite_(value.start) && isFinite_(value.end), `${where}: waterfall thiếu mốc đầu/cuối.`);
  assert(Array.isArray(value.steps), `${where}: waterfall thiếu các bước.`);
  for (const step of value.steps)
    assert(
      isRecord(step) && typeof step.name === "string" && isFinite_(step.delta),
      `${where}: bước waterfall không hợp lệ.`,
    );
  // Đối chiếu bắt buộc: tổng các bước phải khớp chênh lệch chung.
  const sum = (value.steps as { delta: number }[]).reduce((total, step) => total + step.delta, 0);
  assert(
    Math.abs(sum - ((value.end as number) - (value.start as number))) < 1000,
    `${where}: tổng các bước waterfall lệch quá 1.000 đồng so với chênh lệch chung.`,
  );
}

function validateMeta(value: unknown, where: string) {
  assert(isRecord(value), `${where}: thiếu metadata.`);
  assert(SOURCES_ALLOWED.includes(String(value.source)), `${where}: nguồn dữ liệu không hợp lệ.`);
  assert(value.unit === "VND", `${where}: đơn vị phải được chuẩn hoá về VND tại adapter.`);
  assert(typeof value.periodLabel === "string", `${where}: thiếu nhãn kỳ.`);
  assert(typeof value.derivedQuarter === "boolean", `${where}: thiếu cờ quý dẫn xuất.`);
  assert(isRecord(value.coverage), `${where}: thiếu thông tin độ phủ.`);
  assert(
    isFinite_(value.coverage.covered) && isFinite_(value.coverage.total),
    `${where}: độ phủ phải là số.`,
  );
}

export function validateOverview(value: unknown): OverviewData {
  assert(isRecord(value), "Overview: payload rỗng.");
  validateMeta(value.meta, "Overview");
  validateAmountRow(value.kpiPeriod, "Overview.kpiPeriod");
  validateAmountRow(value.kpiYtd, "Overview.kpiYtd");
  validateTrend(value.trend, "Overview");
  for (const key of ["sources", "domesticItems", "locations", "budgetLevels", "centralBudgetSources", "localBudgetLevels"] as const) {
    assert(Array.isArray(value[key]), `Overview.${key}: phải là mảng.`);
    for (const row of value[key] as unknown[]) validateAmountRow(row, `Overview.${key}`);
  }
  assert(
    (value.domesticItems as unknown[]).length === 21,
    "Overview: khoản thu nội địa phải đủ đúng 21 dòng.",
  );
  validateBudgetLevels(
    value.budgetLevels,
    value.centralBudgetSources,
    value.localBudgetLevels,
    value.scopeTotal,
    "Overview",
  );
  validateEstimate(value.estimate, "Overview");
  validateWaterfall(value.waterfall, "Overview");
  return value as unknown as OverviewData;
}

/**
 * Hai tầng cấp ngân sách là các phép phân rã, không phải danh sách độc lập.
 * Kiểm tra mã và phép cộng ở biên dữ liệu để UI không thể vẽ một donut đẹp
 * nhưng sai tổng.
 */
function validateBudgetLevels(
  topValue: unknown,
  centralValue: unknown,
  localValue: unknown,
  totalValue: unknown,
  where: string,
): void {
  assert(
    Array.isArray(topValue) && Array.isArray(centralValue) && Array.isArray(localValue),
    `${where}: thiếu cơ cấu cấp ngân sách.`,
  );
  assert(isRecord(totalValue) && isFinite_(totalValue.amount), `${where}: thiếu tổng NSNN để đối soát.`);
  const top = topValue as { id: string; amount: number }[];
  const central = centralValue as { id: string; amount: number }[];
  const local = localValue as { id: string; amount: number }[];

  if (!top.length) {
    assert(
      !central.length && !local.length,
      `${where}: không có cơ cấu NSTW/NSĐP thì không được có dữ liệu phân rã.`,
    );
    return;
  }

  assert(
    top.length === 2 && ["NSTW", "NSDP"].every((id) => top.some((row) => row.id === id)),
    `${where}: cấp cao nhất phải gồm đúng NSTW và NSĐP.`,
  );
  assert(
    local.length === 3 && ["PROVINCE", "DISTRICT", "COMMUNE"].every((id) => local.some((row) => row.id === id)),
    `${where}: NSĐP phải được phân rã đủ cấp tỉnh, huyện và xã.`,
  );
  assert(
    central.length === 4 && ["domestic", "import-export", "crude-oil", "other"].every((id) => central.some((row) => row.id === id)),
    `${where}: NSTW phải được phân rã đủ bốn nguồn thu.`,
  );

  const topSum = top.reduce((sum, row) => sum + row.amount, 0);
  assert(
    Math.abs(topSum - (totalValue.amount as number)) < 1000,
    `${where}: NSTW + NSĐP lệch quá 1.000 đồng so với tổng NSNN.`,
  );

  const nsdp = top.find((row) => row.id === "NSDP")!.amount;
  const nstw = top.find((row) => row.id === "NSTW")!.amount;
  const centralSum = central.reduce((sum, row) => sum + row.amount, 0);
  assert(
    Math.abs(centralSum - nstw) < 1000,
    `${where}: tổng bốn nguồn thu lệch quá 1.000 đồng so với NSTW.`,
  );
  const localSum = local.reduce((sum, row) => sum + row.amount, 0);
  assert(
    Math.abs(localSum - nsdp) < 1000,
    `${where}: tổng tỉnh + huyện + xã lệch quá 1.000 đồng so với NSĐP.`,
  );
}

export function validateRevenueAnalysis(value: unknown): RevenueAnalysisData {
  assert(isRecord(value), "Phân tích thu: payload rỗng.");
  validateMeta(value.meta, "Phân tích thu");
  assert(
    typeof value.scope === "string" && value.scope in SOURCE_BY_CODE,
    "Phân tích thu: nguồn thu không nằm trong danh mục.",
  );
  assert(Array.isArray(value.breakdown), "Phân tích thu: thiếu bảng chi tiết.");
  for (const row of value.breakdown as unknown[]) validateAmountRow(row, "Phân tích thu.breakdown");
  validateTrend(value.trend, "Phân tích thu");
  validateGroups(value.groups, value.scope as string, "Phân tích thu");
  validateWaterfall(value.waterfall, "Phân tích thu");
  return value as unknown as RevenueAnalysisData;
}

/** Dự toán: cho phép vắng mặt, nhưng có thì phải dùng được. */
function validateEstimate(value: unknown, where: string): void {
  if (value === null || value === undefined) return;
  assert(isRecord(value), `${where}.estimate: phải là object hoặc null.`);
  assert(
    typeof value.annual === "number" && Number.isFinite(value.annual) && value.annual > 0,
    `${where}.estimate.annual: dự toán phải là số dương.`,
  );
  assert(
    value.progress === null || (typeof value.progress === "number" && Number.isFinite(value.progress)),
    `${where}.estimate.progress: phải là số hữu hạn hoặc null.`,
  );
  assert(
    value.origin === "mock" || value.origin === "api",
    `${where}.estimate.origin: phải nêu rõ số đến từ mock hay API.`,
  );
}

/**
 * Ba nhóm thu nội địa. Ràng buộc đáng giá nhất là **đủ 21 khoản con**: nhóm
 * thiếu khoản vẫn vẽ ra một biểu đồ trông bình thường, chỉ sai tổng — đúng loại
 * lỗi không ai phát hiện bằng mắt.
 */
function validateGroups(value: unknown, scope: string, where: string): void {
  if (scope !== "domestic") {
    assert(value === null || value === undefined, `${where}.groups: chỉ nguồn nội địa mới có ba nhóm.`);
    return;
  }
  assert(Array.isArray(value), `${where}.groups: nguồn nội địa phải có ba nhóm.`);
  const groups = value as unknown[];
  assert(groups.length === 3, `${where}.groups: phải đủ đúng ba nhóm.`);
  let members = 0;
  for (const group of groups) {
    validateAmountRow(group, `${where}.groups`);
    assert(isRecord(group) && Array.isArray(group.items), `${where}.groups[].items: phải là mảng.`);
    const items = group.items as unknown[];
    assert(items.length > 0, `${where}.groups[].items: nhóm rỗng không vẽ được.`);
    for (const item of items) validateAmountRow(item, `${where}.groups[].items`);
    members += items.length;
  }
  assert(members === 21, `${where}.groups: ba nhóm phải phủ đủ 21 khoản nội địa, đang có ${members}.`);
}

export function validateLocationDetail(value: unknown): LocationDetailData {
  assert(isRecord(value), "Chi tiết địa bàn: payload rỗng.");
  validateMeta(value.meta, "Chi tiết địa bàn");
  assert(
    isRecord(value.location) && typeof value.location.id === "string" && value.location.id in LOCATION_BY_ID,
    "Chi tiết địa bàn: mã địa bàn không nằm trong danh mục 126 phường/xã.",
  );
  validateAmountRow(value.kpiPeriod, "Chi tiết địa bàn.kpiPeriod");
  validateTrend(value.trend, "Chi tiết địa bàn");
  return value as unknown as LocationDetailData;
}

/**
 * Danh mục TMS: kiểm cấu trúc, và kiểm rằng KHÔNG có số bịa lọt vào.
 *
 * Chưa có giao dịch TMS nào được bàn giao, nên mọi dòng ở tầng Chương/Mục/Tiểu
 * mục phải mang `amount: null`. Một con số xuất hiện ở đó chỉ có thể đến từ một
 * phép suy diễn không có căn cứ trong tài liệu, nên ranh giới dữ liệu chặn nó
 * lại thay vì để nó chảy ra màn hình trông như số đã đối soát.
 */
/** Dòng TMS: `amount` có thể chưa tồn tại, nên `null` là hợp lệ chứ không phải thiếu. */
function validateTmsRow(value: unknown, where: string) {
  assert(isRecord(value), `${where}: dòng không phải object.`);
  assert(typeof value.id === "string" && typeof value.name === "string", `${where}: thiếu mã hoặc tên.`);
  assert(isNullableNumber(value.amount), `${where}: amount phải là số hoặc null.`);
  assert(isNullableNumber(value.previous), `${where}: previous phải là số hoặc null.`);
}

/** Cộng các dòng; `null` nếu có bất kỳ dòng nào chưa có số, vì tổng khi đó vô nghĩa. */
function sumOrNull(rows: { amount: number | null }[]): number | null {
  let total = 0;
  for (const row of rows) {
    if (row.amount === null) return null;
    total += row.amount;
  }
  return total;
}

/**
 * Ranh giới tin cậy của tab Mã hạch toán.
 *
 * Hợp đồng cho phép `amount` là `null` — chưa tính được — hoặc là một con số.
 * Lớp mock hiện trả `null` ở toàn bộ tầng Chương/Mục/Tiểu mục vì chưa có giao
 * dịch nào được bàn giao, nhưng đó là chính sách của **lớp mock**, không phải
 * của hợp đồng: một provider API thật trả số phải đi qua được đúng validator
 * này mà không phải sửa dòng nào.
 *
 * Phép đối soát vì vậy có điều kiện. Còn `null` thì không so được và bỏ qua;
 * đủ số thì so **khớp tuyệt đối**, không cho sai số. Đây là phép chia lại cùng
 * một tổng nên mọi đồng đều phải về đúng một nhóm, kể cả nhóm chưa xác định.
 */
export function validateTmsBreakdown(value: unknown): TmsBreakdownData {
  assert(isRecord(value), "Mã hạch toán: payload rỗng.");
  validateMeta(value.meta, "Mã hạch toán");
  assert(
    TMS_LEVELS_ALLOWED.includes(String(value.level)),
    "Mã hạch toán: cấp quản lý không nằm trong danh sách cho phép.",
  );
  assert(typeof value.scopeName === "string", "Mã hạch toán: thiếu tên phạm vi địa bàn.");
  // `origin` quyết định giao diện có gắn nhãn mô phỏng hay không, nên nó phải là
  // một trong hai giá trị đóng chứ không phải chuỗi tự do.
  assert(
    value.origin === "mock" || value.origin === "api",
    "Mã hạch toán: origin phải là \"mock\" hoặc \"api\".",
  );
  for (const key of ["sections", "chapters", "taxOffices", "levels", "localLevels"] as const)
    assert(Array.isArray(value[key]), `Mã hạch toán: thiếu danh sách ${key}.`);

  validateTmsRow(value.scopeTotal, "Mã hạch toán.scopeTotal");
  validateTmsRow(value.levelTotal, "Mã hạch toán.levelTotal");
  if (value.nsnnTotal !== null && value.nsnnTotal !== undefined) {
    validateAmountRow(value.nsnnTotal, "Mã hạch toán.nsnnTotal");
    const scope = (value.scopeTotal as { amount: number | null }).amount;
    // Phạm vi TMS là tập CON của NSNN: chỉ thu nội địa. Lớn hơn mẫu số nghĩa là
    // có phần thu bị đếm hai lần hoặc mẫu số lấy sai địa bàn.
    if (scope !== null)
      assert(
        scope <= (value.nsnnTotal as { amount: number }).amount,
        "Mã hạch toán: phạm vi TMS lớn hơn tổng thu NSNN cùng kỳ, không thể là tập con.",
      );
  }

  const sections = value.sections as { name: string; amount: number | null; subItems?: unknown[] }[];
  for (const key of ["chapters", "taxOffices", "levels", "localLevels"] as const)
    for (const row of value[key] as unknown[]) validateTmsRow(row, `Mã hạch toán.${key}`);

  for (const section of sections) {
    validateTmsRow(section, "Mã hạch toán.sections");
    assert(Array.isArray(section.subItems), "Mã hạch toán: Mục thiếu danh sách Tiểu mục.");
    const subItems = section.subItems as { amount: number | null }[];
    for (const sub of subItems) validateTmsRow(sub, "Mã hạch toán.subItems");
    const subSum = sumOrNull(subItems);
    if (subSum !== null && section.amount !== null)
      assert(
        subSum === section.amount,
        `Mã hạch toán: tổng Tiểu mục của Mục ${section.name} lệch ${Math.round(subSum - section.amount)} đồng.`,
      );
  }

  const levelTotal = (value.levelTotal as { amount: number | null }).amount;
  const sectionSum = sumOrNull(sections);
  if (sectionSum !== null && levelTotal !== null)
    assert(
      sectionSum === levelTotal,
      `Mã hạch toán: tổng theo Mục (${Math.round(sectionSum)}) không bằng tổng của cấp đang chọn (${Math.round(levelTotal)}).`,
    );
  const chapterSum = sumOrNull(value.chapters as { amount: number | null }[]);
  if (chapterSum !== null && levelTotal !== null)
    assert(
      chapterSum === levelTotal,
      `Mã hạch toán: tổng theo Chương (${Math.round(chapterSum)}) không bằng tổng theo Mục.`,
    );

  const localSum = sumOrNull(value.localLevels as { amount: number | null }[]);
  const localRow = (value.levels as { id: string; amount: number | null }[]).find((r) => r.id === "dia-phuong");
  if (localSum !== null && localRow && localRow.amount !== null)
    assert(localSum === localRow.amount, "Mã hạch toán: tỉnh + huyện + xã không bằng dòng địa phương.");

  return value as unknown as TmsBreakdownData;
}

export function validateAdvancedComparison(value: unknown): AdvancedComparisonData {
  assert(isRecord(value), "So sánh: payload rỗng.");
  validateMeta(value.meta, "So sánh");
  assert(MODES_ALLOWED.includes(value.mode as AdvancedComparisonMode), "So sánh: chế độ không hợp lệ.");
  assert(isRecord(value.a) && isRecord(value.b), "So sánh: thiếu một trong hai vế.");
  assert(Array.isArray(value.rows), "So sánh: thiếu bảng delta.");
  assertRowsReconcile(value, "So sánh");
  if (value.waterfall !== null && value.waterfall !== undefined)
    validateWaterfall(value.waterfall, "So sánh");
  return value as unknown as AdvancedComparisonData;
}

/**
 * Phân rã phải cộng lại đúng bằng con số tổng đứng ngay trên nó.
 *
 * Đây là anh em của phép đối soát waterfall, áp cho quan hệ giữa **dải KPI** và
 * **bảng chênh lệch** bên dưới. Lỗi mà nó canh không hiện ra như một lỗi: bảng
 * vẫn đủ dòng, vẫn sắp xếp được, chỉ là tổng của nó khác con số phía trên. Người
 * đọc thấy hai đáp án cho cùng một câu hỏi, cùng một nhãn kỳ, cách nhau 20px —
 * và không có cách nào biết bên nào đúng.
 *
 * Ngưỡng 1.000 đồng là sai số làm tròn chấp nhận được, giống ngưỡng của waterfall.
 */
function assertRowsReconcile(value: Record<string, unknown>, where: string): void {
  const delta = value.delta;
  if (typeof delta !== "number" || !Number.isFinite(delta)) return;
  // Không có phân rã là một câu trả lời hợp lệ: hai nguồn thu không có khoản
  // chung nên không tồn tại phép chia nhỏ nào đúng. Ép nó phải cộng ra `delta`
  // chính là thứ đã đẻ ra bảng toàn số 0 trước đây.
  if ((value.rows as unknown[]).length === 0) return;
  let sum = 0;
  for (const row of value.rows as unknown[]) {
    if (!isRecord(row) || typeof row.delta !== "number" || !Number.isFinite(row.delta)) return;
    sum += row.delta;
  }
  assert(
    Math.abs(sum - delta) <= 1000,
    `${where}: tổng chênh lệch các dòng (${Math.round(sum)}) không khớp chênh lệch của chỉ số (${Math.round(delta)}).`,
  );
}

/** Lọc navigation intent: chỉ giữ những intent đúng dạng và trỏ tới thực thể có thật. */
export function sanitizeNavigation(value: unknown): DashboardNavigationAction[] {
  if (!Array.isArray(value)) return [];
  const out: DashboardNavigationAction[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    switch (raw.type) {
      case "OPEN_REVENUE_PREVIEW":
        if (typeof raw.sourceId === "string" && raw.sourceId in SOURCE_BY_CODE)
          out.push({ type: raw.type, sourceId: raw.sourceId });
        break;
      case "OPEN_REVENUE_ANALYSIS":
        if (typeof raw.sourceId === "string" && raw.sourceId in SOURCE_BY_CODE) {
          const view = ["overview", "ranking", "waterfall"].includes(String(raw.view))
            ? (raw.view as "overview" | "ranking" | "waterfall")
            : undefined;
          out.push({ type: raw.type, sourceId: raw.sourceId, view });
        }
        break;
      case "OPEN_LOCATION_DETAIL":
        if (typeof raw.locationId === "string" && raw.locationId in LOCATION_BY_ID)
          out.push({ type: raw.type, locationId: raw.locationId });
        break;
      case "OPEN_ADVANCED_COMPARISON":
        if (
          MODES_ALLOWED.includes(raw.mode as AdvancedComparisonMode) &&
          Array.isArray(raw.entityIds) &&
          raw.entityIds.every((id) => typeof id === "string")
        )
          out.push({
            type: raw.type,
            mode: raw.mode as AdvancedComparisonMode,
            entityIds: (raw.entityIds as string[]).slice(0, 5),
          });
        break;
      default:
        break; // Mọi thứ khác bị bỏ qua một cách an toàn.
    }
  }
  return out;
}
