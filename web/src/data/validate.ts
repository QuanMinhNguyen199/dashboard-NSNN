import type {
  AdvancedComparisonData,
  AdvancedComparisonMode,
  DashboardNavigationAction,
  LocationDetailData,
  OverviewData,
  ReportGridData,
  RevenueAnalysisData,
  TabId,
  TmsBreakdownData,
} from "@/domain/types";
import type {
  BudgetForecastData,
  EnterpriseManagementData,
  InspectionData,
  ReportSummaryData,
} from "@/domain/workspaces";
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
  "report",
  "revenue-analysis",
  "location-detail",
  "advanced-compare",
];
const TMS_LEVELS_ALLOWED = ["all", "trung-uong", "dia-phuong", "tinh", "xa"];
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
    value.unclassifiedBudget,
    value.centralBudgetSources,
    value.localBudgetLevels,
    value.scopeTotal,
    "Overview",
  );
  validateIndustries(value.industries, value.scopeTotal, "Overview");
  validateTaxOfficeProgress(value.taxOfficeProgress, "Overview");
  validateTopTaxpayers(value.topTaxpayers, "Overview");
  validateEstimate(value.estimate, "Overview");
  validateWaterfall(value.waterfall, "Overview");
  return value as unknown as OverviewData;
}

/**
 * Cơ cấu ngành là một phép PHÂN RÃ của tổng phạm vi, nên phải cộng lại bằng nó.
 *
 * Kiểm ở biên dữ liệu vì đây đúng là chỗ từng sai: một phép chia làm tròn riêng
 * từng lát cho ra biểu đồ trông vẫn đẹp mà tổng thì lệch, và trên màn hình
 * không có gì tố giác. Mảng rỗng là hợp lệ — đó là lúc đang khoá một ngành.
 */
function validateIndustries(value: unknown, totalValue: unknown, where: string): void {
  assert(Array.isArray(value), `${where}.industries: phải là mảng.`);
  const rows = value as unknown[];
  if (!rows.length) return;
  for (const row of rows) validateAmountRow(row, `${where}.industries`);
  assert(
    isRecord(totalValue) && isFinite_(totalValue.amount),
    `${where}.industries: thiếu tổng phạm vi để đối soát.`,
  );
  const sum = (rows as { amount: number }[]).reduce((a, row) => a + row.amount, 0);
  const total = (totalValue as { amount: number }).amount;
  assert(
    Math.abs(sum - total) < 0.5,
    `${where}.industries: cộng đủ các ngành phải bằng tổng phạm vi (lệch ${sum - total}).`,
  );
}

/** Tiến độ theo cơ quan thuế: mẫu số phải khai nguồn, không để giao diện tự đoán. */
function validateTaxOfficeProgress(value: unknown, where: string): void {
  assert(Array.isArray(value), `${where}.taxOfficeProgress: phải là mảng.`);
  for (const row of value as unknown[]) {
    validateAmountRow(row, `${where}.taxOfficeProgress`);
    assert(isRecord(row), `${where}.taxOfficeProgress: dòng rỗng.`);
    assert(isFinite_(row.plan), `${where}.taxOfficeProgress: thiếu dự toán.`);
    assert(
      row.completionRate === null || isFinite_(row.completionRate),
      `${where}.taxOfficeProgress: tỷ lệ hoàn thành phải là số hoặc null.`,
    );
    assert(
      row.planOrigin === "api" || row.planOrigin === "mock",
      `${where}.taxOfficeProgress: planOrigin phải là "api" hoặc "mock".`,
    );
  }
}

/**
 * Hai tầng cấp ngân sách là các phép phân rã, không phải danh sách độc lập.
 * Kiểm tra mã và phép cộng ở biên dữ liệu để UI không thể vẽ một donut đẹp
 * nhưng sai tổng.
 */
function validateBudgetLevels(
  topValue: unknown,
  unclassifiedValue: unknown,
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
  if (unclassifiedValue !== null) validateAmountRow(unclassifiedValue, `${where}.unclassifiedBudget`);
  const unclassified = unclassifiedValue as { amount: number } | null;
  const central = centralValue as { id: string; amount: number }[];
  const local = localValue as { id: string; amount: number }[];

  if (!top.length) {
    assert(
      !central.length && !local.length && unclassified === null,
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

  const topSum = top.reduce((sum, row) => sum + row.amount, 0) + (unclassified?.amount ?? 0);
  assert(
    Math.abs(topSum - (totalValue.amount as number)) < 0.5,
    `${where}: NSTW + NSĐP + chênh chưa giải thích phải khớp tổng NSNN đến từng đồng.`,
  );

  const nsdp = top.find((row) => row.id === "NSDP")!.amount;
  const nstw = top.find((row) => row.id === "NSTW")!.amount;
  const centralSum = central.reduce((sum, row) => sum + row.amount, 0);
  assert(
    Math.abs(centralSum - nstw) < 0.5,
    `${where}: tổng bốn nguồn thu phải khớp NSTW đến từng đồng.`,
  );
  const localSum = local.reduce((sum, row) => sum + row.amount, 0);
  assert(
    Math.abs(localSum - nsdp) < 0.5,
    `${where}: tổng tỉnh + huyện + xã phải khớp NSĐP đến từng đồng.`,
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
  validateTrend(value.monthlyTrend, "Phân tích thu.monthlyTrend");
  validateTrend(value.cumulativeTrend, "Phân tích thu.cumulativeTrend");
  validateEstimate(value.estimate, "Phân tích thu");
  for (const key of ["byTaxOffice", "byIndustry"] as const) {
    assert(Array.isArray(value[key]), `Phân tích thu.${key}: phải là mảng.`);
    for (const row of value[key] as unknown[]) validateAmountRow(row, `Phân tích thu.${key}`);
  }
  validateTopTaxpayers(value.topTaxpayers, "Phân tích thu");
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
    /*
      `taxItems` la CUNG MOT TONG cat theo mot chieu khac, nen no phai cong lai
      bang dung `amount` cua nhom. Kiem o bien vi giao dien bay hai cach cat do
      canh nhau qua mot nut chuyen: lech mot dong thi bam nut la tong doi, ma
      khong co gi tren man hinh noi rang no vua doi.
    */
    const taxItems = (group as { taxItems?: unknown }).taxItems;
    if (taxItems !== null && taxItems !== undefined) {
      assert(Array.isArray(taxItems), `${where}.groups[].taxItems: phai la mang hoac null.`);
      const rows = taxItems as unknown[];
      assert(rows.length > 0, `${where}.groups[].taxItems: mang rong thi phai tra null.`);
      for (const item of rows) validateAmountRow(item, `${where}.groups[].taxItems`);
      const sum = (rows as { amount: number }[]).reduce((a, r) => a + r.amount, 0);
      const total = (group as { amount: number }).amount;
      assert(
        Math.abs(sum - total) < 0.5,
        `${where}.groups[].taxItems: cong lai phai bang tong cua nhom (lech ${sum - total}).`,
      );
    }
  }
  assert(members === 21, `${where}.groups: ba nhóm phải phủ đủ 21 khoản nội địa, đang có ${members}.`);
}

/**
 * Bóc tách theo cơ quan đã thu là một phép PHÂN RÃ, nên phải cộng lại bằng tổng
 * của địa bàn.
 *
 * Kiểm ở biên dữ liệu vì ba dòng này đứng ngay dưới ô KPI mang chính tổng đó:
 * lệch một đồng thì màn hình bày hai con số khác nhau cho cùng một đại lượng,
 * cách nhau vài chục pixel, và không có gì nói lên điều đó.
 */
function validateCollectedBy(value: unknown, totalValue: unknown, where: string): void {
  assert(isRecord(value), `${where}.collectedBy: thiếu khối bóc tách theo cơ quan thu.`);
  assert(
    value.origin === "api" || value.origin === "mock",
    `${where}.collectedBy: origin phải là "api" hoặc "mock".`,
  );
  assert(Array.isArray(value.rows), `${where}.collectedBy.rows: phải là mảng.`);
  const rows = value.rows as unknown[];
  if (!rows.length) return;
  for (const row of rows) validateAmountRow(row, `${where}.collectedBy`);
  assert(
    isRecord(totalValue) && isFinite_(totalValue.amount),
    `${where}.collectedBy: thiếu tổng địa bàn để đối soát.`,
  );
  const sum = (rows as { amount: number }[]).reduce((a, row) => a + row.amount, 0);
  const total = (totalValue as { amount: number }).amount;
  assert(
    Math.abs(sum - total) < 0.5,
    `${where}.collectedBy: ba nhóm cộng lại phải bằng tổng địa bàn (lệch ${sum - total}).`,
  );
}

/** Người nộp thuế: tên và nhóm ngành là chỗ giao diện hiển thị, nên chúng bắt buộc. */
function validateTopTaxpayers(value: unknown, where: string): void {
  assert(isRecord(value), `${where}.topTaxpayers: thiếu khối người nộp thuế.`);
  assert(
    value.origin === "api" || value.origin === "mock",
    `${where}.topTaxpayers: origin phải là "api" hoặc "mock".`,
  );
  assert(Array.isArray(value.rows), `${where}.topTaxpayers.rows: phải là mảng.`);
  for (const row of value.rows as unknown[]) {
    assert(isRecord(row), `${where}.topTaxpayers: dòng rỗng.`);
    assert(typeof row.name === "string" && row.name.length > 0, `${where}.topTaxpayers: thiếu tên.`);
    assert(typeof row.industry === "string", `${where}.topTaxpayers: thiếu nhóm ngành.`);
    assert(isFinite_(row.amount), `${where}.topTaxpayers: thiếu số tiền.`);
  }
}

export function validateLocationDetail(value: unknown): LocationDetailData {
  assert(isRecord(value), "Chi tiết địa bàn: payload rỗng.");
  validateMeta(value.meta, "Chi tiết địa bàn");
  assert(
    isRecord(value.location) && typeof value.location.id === "string" && value.location.id in LOCATION_BY_ID,
    "Chi tiết địa bàn: mã địa bàn không nằm trong danh mục 126 phường/xã.",
  );
  validateAmountRow(value.kpiPeriod, "Chi tiết địa bàn.kpiPeriod");
  validateAmountRow(value.kpiYtd, "Chi tiết địa bàn.kpiYtd");
  validateTrend(value.trend, "Chi tiết địa bàn");
  validateEstimate(value.estimate, "Chi tiết địa bàn");
  for (const key of ["taxGroups", "industries"] as const) {
    assert(Array.isArray(value[key]), `Chi tiết địa bàn.${key}: phải là mảng.`);
    for (const row of value[key] as unknown[]) validateAmountRow(row, `Chi tiết địa bàn.${key}`);
  }
  validateAmountRow(value.scopeTotal, "Chi tiết địa bàn.scopeTotal");
  /*
    Đối soát với `scopeTotal`, KHÔNG phải `kpiPeriod`.

    `kpiPeriod` cố định ở khung trong kỳ còn các khối phân rã đi theo `Cách tính`,
    nên so với nó là so hai khung thời gian khác nhau.
  */
  validateCollectedBy(value.collectedBy, value.scopeTotal, "Chi tiết địa bàn");
  validateIndustries(value.industries, value.scopeTotal, "Chi tiết địa bàn");
  validateTopTaxpayers(value.topTaxpayers, "Chi tiết địa bàn");
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
/**
 * Khối chỉ số của một đơn vị thuế.
 *
 * Ràng buộc quan trọng nhất là ràng buộc CÓ MẶT: khối này phải xuất hiện đúng
 * khi payload đang lọc theo một cơ quan. Thiếu nó thì trang chi tiết đơn vị
 * hiện một dải KPI trống mà không có lỗi nào; thừa nó khi không lọc cơ quan
 * nghĩa là một chỉ số của "ai đó" đang chờ được gán nhầm cho toàn thành phố.
 */
function validateTaxOfficeDetail(value: unknown, codeValue: unknown, where: string): void {
  const coCode = typeof codeValue === "string" && codeValue.length > 0;
  if (value === null || value === undefined) {
    // Lọc theo cơ quan mà kỳ đó không có chứng từ thì cả payload đã là `null`
    // từ builder, nên tới được đây mà thiếu khối này là sai hợp đồng.
    assert(!coCode, `${where}.taxOfficeDetail: đang lọc theo một cơ quan thì phải có khối chỉ số.`);
    return;
  }
  assert(coCode, `${where}.taxOfficeDetail: không lọc cơ quan nào thì không được có khối chỉ số.`);
  assert(isRecord(value), `${where}.taxOfficeDetail: phải là một đối tượng.`);
  validateAmountRow(value.kpiPeriod, `${where}.taxOfficeDetail.kpiPeriod`);
  validateAmountRow(value.kpiYtd, `${where}.taxOfficeDetail.kpiYtd`);
  assert(isFinite_(value.plan), `${where}.taxOfficeDetail: thiếu dự toán.`);
  assert(
    value.completionRate === null || isFinite_(value.completionRate),
    `${where}.taxOfficeDetail: tỷ lệ hoàn thành phải là số hoặc null.`,
  );
  assert(
    value.planOrigin === "api" || value.planOrigin === "mock",
    `${where}.taxOfficeDetail: planOrigin phải là "api" hoặc "mock".`,
  );
  validateTrend(value.trend, `${where}.taxOfficeDetail`);
}

export function validateTmsBreakdown(value: unknown): TmsBreakdownData {
  assert(isRecord(value), "Mã hạch toán: payload rỗng.");
  validateMeta(value.meta, "Mã hạch toán");
  assert(
    TMS_LEVELS_ALLOWED.includes(String(value.level)),
    "Mã hạch toán: cấp quản lý không nằm trong danh sách cho phép.",
  );
  assert(typeof value.scopeName === "string", "Mã hạch toán: thiếu tên phạm vi địa bàn.");
  assert(
    value.taxOfficeCode === null || typeof value.taxOfficeCode === "string",
    "Mã hạch toán: mã cơ quan thuế phải là chuỗi hoặc null.",
  );
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
  validateTaxOfficeDetail(value.taxOfficeDetail, value.taxOfficeCode, "Mã hạch toán");
  /**
   * Quan hệ giữa số TMS và số Kho bạc KHÔNG phải điều kiện hợp lệ của payload.
   *
   * Trước đây chỗ này chặn "TMS không được lớn hơn NSNN cùng kỳ". Đúng về mặt
   * định nghĩa phạm vi, sai về mặt vận hành: hai hệ thống chốt số ở hai thời
   * điểm khác nhau nên TMS có lúc nhỉnh hơn, và ở cấp phường biên độ chỉ khoảng
   * 0,2% nên payload thật sẽ bị từ chối, tab hiện lỗi thay vì hiện số.
   *
   * Lời giải KHÔNG phải là nới thành một ngưỡng phần trăm. Đặt ngưỡng tức là
   * tuyên bố có một mức chênh được phép bỏ qua, mà thẩm quyền tuyên bố điều đó
   * không nằm ở tầng validator, và phụ lục nghiệp vụ yêu cầu **giải thích được**
   * chênh lệch chứ không cho phép bỏ qua nó. Vì vậy phép so chuyển hẳn sang
   * bảng đối soát trên giao diện: chênh lệch luôn hiện ra bằng con số thật,
   * không kèm phán quyết đạt hay không đạt.
   */
  if (value.nsnnTotal !== null && value.nsnnTotal !== undefined)
    validateAmountRow(value.nsnnTotal, "Mã hạch toán.nsnnTotal");

  /**
   * Quan hệ cơ quan thuế với địa bàn là KẾT QUẢ QUAN SÁT, không phải danh mục.
   *
   * Vì vậy không có phép kiểm nào ép mỗi địa bàn chỉ thuộc một cơ quan. Ngược
   * lại: `sharedLocations` được phép lớn, và trên dữ liệu thật nó đúng là lớn.
   * Chỉ kiểm hình dạng và kiểm rằng phần trăm nằm trong khoảng hợp lệ.
   */
  if (value.taxOfficeScopes !== null && value.taxOfficeScopes !== undefined) {
    const scopes = value.taxOfficeScopes;
    assert(isRecord(scopes), "Mã hạch toán: taxOfficeScopes phải là một đối tượng.");
    assert(typeof scopes.period === "string", "Mã hạch toán: taxOfficeScopes thiếu kỳ.");
    assert(Array.isArray(scopes.offices), "Mã hạch toán: taxOfficeScopes thiếu danh sách cơ quan.");
    for (const raw of scopes.offices as unknown[]) {
      assert(isRecord(raw), "Mã hạch toán: dòng cơ quan thuế không phải đối tượng.");
      assert(
        typeof raw.amount === "string" && /^-?\d+$/.test(raw.amount),
        "Mã hạch toán: số tiền của cơ quan thuế phải là decimal.",
      );
      assert(Array.isArray(raw.locations), "Mã hạch toán: cơ quan thuế thiếu danh sách địa bàn.");
    }
    assert(
      scopes.sharedShare === null ||
        (isFinite_(scopes.sharedShare) && scopes.sharedShare >= 0 && scopes.sharedShare <= 100),
      "Mã hạch toán: tỷ lệ địa bàn dùng chung phải nằm trong 0..100 hoặc null.",
    );
  }

  // Kiểm hình dạng, không kiểm độ lớn: xem ghi chú ngay trên.
  if (value.reconciliation !== null && value.reconciliation !== undefined) {
    const recon = value.reconciliation;
    assert(isRecord(recon), "Mã hạch toán: reconciliation phải là một đối tượng.");
    assert(
      recon.treasuryAmount === null ||
        (typeof recon.treasuryAmount === "number" && Number.isFinite(recon.treasuryAmount)),
      "Mã hạch toán: số Kho bạc phải là số hoặc null.",
    );
    for (const key of ["tmsUpdatedAt", "treasuryUpdatedAt"] as const)
      assert(
        recon[key] === null ||
          (typeof recon[key] === "string" && !Number.isNaN(Date.parse(recon[key] as string))),
        `Mã hạch toán: ${key} phải là mốc thời gian hợp lệ hoặc null.`,
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
  if (value.taxOfficeScopes !== null && value.taxOfficeScopes !== undefined && levelTotal !== null) {
    const scopes = value.taxOfficeScopes as { offices: { code: string; amount: string }[] };
    const officeSum = scopes.offices.reduce(
      (sum, office) => sum + Number(office.amount),
      0,
    );
    if (value.taxOfficeCode === null)
      assert(
        officeSum === levelTotal,
        `Mã hạch toán: tổng theo cơ quan thuế (${Math.round(officeSum)}) không bằng tổng của cấp đang chọn (${Math.round(levelTotal)}).`,
      );
    else {
      const selected = scopes.offices.find((office) => office.code === value.taxOfficeCode);
      assert(selected !== undefined, "Mã hạch toán: cơ quan thuế đang lọc không có trong danh sách.");
      assert(
        Number(selected.amount) === levelTotal,
        "Mã hạch toán: số của cơ quan thuế đang lọc không bằng tổng KPI.",
      );
    }
  }
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

  /**
   * Mọi cách chia theo cấp phải cộng lại bằng đúng phạm vi, kể cả nhóm chưa tra
   * được cấp.
   *
   * Đây là lỗi không hiện ra như lỗi: bảng vẫn đủ dòng, số vẫn đẹp, chỉ là một
   * nhóm bị rơi khỏi danh sách nên cột cộng thiếu. Người đọc thấy hai con số
   * khác nhau cho cùng một tổng và kết luận là số bị lệch, trong khi thứ hỏng là
   * bảng chứ không phải số. Điều kiện `!== null` giữ chỗ cho provider API trả
   * phần chia chưa đầy đủ, nhưng đã trả số thì phải cộng đúng.
   */
  const scopeAmount = (value.scopeTotal as { amount: number | null }).amount;
  const levelSum = sumOrNull(value.levels as { amount: number | null }[]);
  if (levelSum !== null && scopeAmount !== null)
    assert(
      levelSum === scopeAmount,
      `Mã hạch toán: tổng theo cấp quản lý (${Math.round(levelSum)}) không bằng phạm vi TMS (${Math.round(scopeAmount)}).`,
    );

  if (Array.isArray(value.correspondence)) {
    const pairs = value.correspondence as { amount: number | null; budgetAmount: number | null }[];
    const managementSum = sumOrNull(pairs);
    if (managementSum !== null && scopeAmount !== null)
      assert(
        managementSum === scopeAmount,
        `Mã hạch toán: cột cấp quản lý trong bảng đối chiếu cộng ra ${Math.round(managementSum)}, không bằng phạm vi TMS ${Math.round(scopeAmount)}.`,
      );
    const budgetSum = sumOrNull(pairs.map((row) => ({ amount: row.budgetAmount })));
    if (budgetSum !== null && scopeAmount !== null)
      assert(
        budgetSum === scopeAmount,
        `Mã hạch toán: cột cấp ngân sách trong bảng đối chiếu cộng ra ${Math.round(budgetSum)}, không bằng phạm vi TMS ${Math.round(scopeAmount)}.`,
      );
  }

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


/* ───────────────────────────── Lưới báo cáo ─────────────────────────────── */

const CELL_STATUS = ["confirmed", "needsReview", "notApplicable"];
const DIMENSIONS_ALLOWED = ["location", "taxOffice", "industry"];

/** Chuỗi decimal nguyên có dấu, hoặc `null`. Số lẻ bị từ chối chứ không làm tròn. */
const isDecimalOrNull = (value: unknown) =>
  value === null || (typeof value === "string" && /^-?\d+$/.test(value));

export function validateReportGrid(value: unknown): ReportGridData {
  assert(isRecord(value), "Báo cáo: payload rỗng.");
  validateMeta(value.meta, "Báo cáo");
  assert(value.origin === "mock" || value.origin === "api", "Báo cáo: origin không hợp lệ.");
  assert(
    DIMENSIONS_ALLOWED.includes(String(value.groupBy)),
    "Báo cáo: chiều chính không nằm trong danh sách cho phép.",
  );
  assert(
    value.subGroupBy === null || DIMENSIONS_ALLOWED.includes(String(value.subGroupBy)),
    "Báo cáo: chiều chi tiết không nằm trong danh sách cho phép.",
  );
  assert(
    value.subGroupBy !== value.groupBy,
    "Báo cáo: chiều chi tiết trùng chiều chính nên không tạo thành mẫu nào.",
  );
  for (const key of ["rows", "columns", "cells"] as const)
    assert(Array.isArray(value[key]), `Báo cáo: thiếu danh sách ${key}.`);

  const rows = value.rows as { id: string; total: unknown; status: unknown; parent: string | null }[];
  const ids = new Set<string>();
  for (const row of rows) {
    assert(typeof row.id === "string" && row.id.length > 0, "Báo cáo: dòng thiếu id.");
    assert(!ids.has(row.id), `Báo cáo: id dòng bị trùng (${row.id}).`);
    ids.add(row.id);
    assert(isDecimalOrNull(row.total), `Báo cáo: tổng của dòng ${row.id} không phải decimal hợp lệ.`);
    assert(CELL_STATUS.includes(String(row.status)), `Báo cáo: trạng thái dòng ${row.id} không hợp lệ.`);
  }
  for (const row of rows)
    assert(
      row.parent === null || ids.has(row.parent),
      `Báo cáo: dòng ${row.id} trỏ tới cha không có trong bảng.`,
    );

  const page = value.columnPage as { offset: number; limit: number; total: number };
  assert(isRecord(page) && isFinite_(page.total) && isFinite_(page.offset), "Báo cáo: thiếu columnPage.");
  assert(
    (value.columns as unknown[]).length <= page.total + (value.subGroupBy ? page.limit : 0),
    "Báo cáo: số cột trả về vượt tổng số cột đã khai báo.",
  );

  /**
   * Tổng theo cột của một hàng phải bằng đúng tổng của hàng đó.
   *
   * Chỉ kiểm được khi trang đang xem là toàn bộ các cột. Đây là phép kiểm bắt
   * đúng loại lỗi tệ nhất của bảng nhiều chiều: bảng vẫn đủ dòng, số vẫn đẹp,
   * chỉ là phần tiền của một nhóm rơi mất mà không ai thấy.
   */
  const cells = value.cells as { rowId: string; columnId: string; value: unknown; status: unknown }[];
  for (const cell of cells) {
    assert(isDecimalOrNull(cell.value), `Báo cáo: ô ${cell.rowId}/${cell.columnId} không phải decimal hợp lệ.`);
    assert(CELL_STATUS.includes(String(cell.status)), `Báo cáo: trạng thái ô ${cell.rowId} không hợp lệ.`);
    assert(ids.has(cell.rowId), `Báo cáo: ô trỏ tới dòng ${cell.rowId} không có trong bảng.`);
  }
  if (page.offset === 0 && page.limit >= page.total) {
    const byRow = new Map<string, bigint>();
    const seen = new Set<string>();
    for (const cell of cells) {
      if (cell.value === null) continue;
      byRow.set(cell.rowId, (byRow.get(cell.rowId) ?? 0n) + BigInt(cell.value as string));
      seen.add(cell.rowId);
    }
    for (const row of rows) {
      if (row.total === null || !seen.has(row.id)) continue;
      assert(
        byRow.get(row.id) === BigInt(row.total as string),
        `Báo cáo: tổng theo cột của dòng ${row.id} không bằng tổng của dòng.`,
      );
    }
  }
  return value as unknown as ReportGridData;
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

/* ═══════════ Validators cho ba workspace mở theo biên bản 18/09/2026 ═════ */

/**
 * `freshness` là chỗ dễ nói dối nhất trong toàn bộ payload.
 *
 * `dataAsOf` được phép `null` — nguồn chưa cho biết thì nói là chưa biết. Nhưng
 * nếu có thì phải parse được, vì một chuỗi rác ở đây sẽ hiện nguyên lên màn hình
 * như một mốc chốt số có thật.
 */
const FRESHNESS_STATUS = ["official", "provisional", "mock"];
const DATA_SOURCES = ["TMS", "TTR", "TREASURY", "MANUAL_PLAN"];

function validateFreshness(value: unknown, where: string) {
  assert(isRecord(value), `${where}: thiếu khối freshness.`);
  assert(
    value.dataAsOf === null ||
      (typeof value.dataAsOf === "string" && !Number.isNaN(Date.parse(value.dataAsOf))),
    `${where}: dataAsOf phải là null hoặc một mốc thời gian hợp lệ.`,
  );
  assert(
    typeof value.generatedAt === "string" && !Number.isNaN(Date.parse(value.generatedAt)),
    `${where}: generatedAt không hợp lệ.`,
  );
  assert(
    FRESHNESS_STATUS.includes(String(value.status)),
    `${where}: status phải là official, provisional hoặc mock.`,
  );
  assert(Array.isArray(value.sources), `${where}: sources phải là mảng.`);
  for (const s of value.sources as unknown[])
    assert(
      DATA_SOURCES.includes(String(s)),
      `${where}: nguồn "${String(s)}" không nằm trong danh sách cho phép.`,
    );
}

/** Tổng phải bằng tổng các dòng. Đây là lời hứa chính của mọi bảng ngân sách. */
function assertSums(rows: number[], total: number, where: string, what: string) {
  const sum = rows.reduce((a, b) => a + b, 0);
  assert(
    Math.abs(sum - total) < 1,
    `${where}: ${what} của các dòng cộng lại là ${sum} nhưng tổng ghi ${total}.`,
  );
}

export function validateBudgetForecast(value: unknown): BudgetForecastData {
  assert(isRecord(value), "Dự toán: payload rỗng.");
  validateMeta(value.meta, "Dự toán");
  validateFreshness(value.freshness, "Dự toán");
  assert(
    value.viewBy === "location" || value.viewBy === "revenueItem",
    "Dự toán: viewBy không hợp lệ.",
  );
  assert(Array.isArray(value.rows) && value.rows.length > 0, "Dự toán: thiếu danh sách dòng.");
  assert(isRecord(value.totals), "Dự toán: thiếu khối tổng.");

  const rows = value.rows as Record<string, unknown>[];
  for (const row of rows) {
    assert(
      typeof row.id === "string" && typeof row.name === "string",
      "Dự toán: dòng thiếu id hoặc tên.",
    );
    assert(isFinite_(row.plan) && isFinite_(row.actual), "Dự toán: plan và actual phải là số hữu hạn.");
    assert(isNullableNumber(row.previous), "Dự toán: previous phải là số hoặc null.");
    // Tỷ lệ hoàn thành `null` nghĩa là CHƯA TÍNH ĐƯỢC (dự toán bằng 0), không
    // phải 0%. Quy nó về 0 là nói đơn vị đó chưa thu được đồng nào.
    assert(isNullableNumber(row.completionRate), "Dự toán: completionRate phải là số hoặc null.");
    assert(isNullableNumber(row.forecast), "Dự toán: forecast phải là số hoặc null.");
    assert(isNullableNumber(row.forecastError), "Dự toán: forecastError phải là số hoặc null.");
    assert(
      row.forecastError === null || (row.forecast !== null && row.actual !== null),
      "Dự toán: có sai số dự báo nhưng thiếu forecast hoặc actual để tính ra nó.",
    );
  }
  const totals = value.totals as Record<string, unknown>;
  assertSums(
    rows.map((r) => Number(r.plan)),
    Number(totals.plan),
    "Dự toán",
    "dự toán",
  );
  assertSums(
    rows.map((r) => Number(r.actual)),
    Number(totals.actual),
    "Dự toán",
    "thực hiện",
  );
  return value as unknown as BudgetForecastData;
}

export function validateEnterpriseManagement(value: unknown): EnterpriseManagementData {
  assert(isRecord(value), "Doanh nghiệp: payload rỗng.");
  validateMeta(value.meta, "Doanh nghiệp");
  validateFreshness(value.freshness, "Doanh nghiệp");
  assert(
    ["industry", "taxOffice", "location"].includes(String(value.groupBy)),
    "Doanh nghiệp: groupBy không hợp lệ.",
  );
  assert(Array.isArray(value.groups) && value.groups.length > 0, "Doanh nghiệp: thiếu nhóm.");
  assert(isRecord(value.totals), "Doanh nghiệp: thiếu khối tổng.");
  const groups = value.groups as Record<string, unknown>[];
  const totals = value.totals as Record<string, unknown>;
  assertSums(
    groups.map((g) => Number(g.amount)),
    Number(totals.amount),
    "Doanh nghiệp",
    "số thu",
  );
  assert(
    groups.some((g) => g.unclassified === true),
    "Doanh nghiệp: thiếu nhóm chưa xác định. Nhóm này phải còn trong tổng, không được loại bỏ.",
  );
  // Mã doanh nghiệp không được mang hình dạng mã số thuế thật.
  for (const list of Object.values((value.enterprises ?? {}) as Record<string, unknown>)) {
    for (const row of (list as Record<string, unknown>[]) ?? []) {
      assert(
        !/^\d{10}(-\d{3})?$/.test(String(row.token)),
        "Doanh nghiệp: token trùng hình dạng mã số thuế. Mock không được mang dữ liệu người nộp thuế.",
      );
    }
  }
  return value as unknown as EnterpriseManagementData;
}

export function validateInspection(value: unknown): InspectionData {
  assert(isRecord(value), "Kiểm tra: payload rỗng.");
  validateMeta(value.meta, "Kiểm tra");
  validateFreshness(value.freshness, "Kiểm tra");
  assert(
    value.cycle === "week" || value.cycle === "month",
    "Kiểm tra: chu kỳ phải là week hoặc month.",
  );
  assert(isRecord(value.summary), "Kiểm tra: thiếu khối tổng hợp.");
  assert(Array.isArray(value.units) && value.units.length > 0, "Kiểm tra: thiếu bảng đơn vị.");
  const units = value.units as Record<string, unknown>[];
  const summary = value.summary as Record<string, unknown>;
  // KPI phải cộng đúng bằng bảng bên dưới, nếu không thì lãnh đạo và cán bộ đọc
  // hai con số khác nhau về cùng một kỳ.
  assertSums(
    units.map((u) => Number(u.totalCases)),
    Number(summary.totalCases),
    "Kiểm tra",
    "số cuộc",
  );
  assertSums(
    units.map((u) => Number(u.completedCases)),
    Number(summary.completedCases),
    "Kiểm tra",
    "số cuộc hoàn thành",
  );
  assertSums(
    units.map((u) => Number(u.processedAmount)),
    Number(summary.processedAmount),
    "Kiểm tra",
    "số tiền xử lý",
  );
  assertSums(
    units.map((u) => Number(u.paidAmount)),
    Number(summary.paidAmount),
    "Kiểm tra",
    "số đã nộp",
  );
  assert(
    Number(summary.paidAmount) <= Number(summary.processedAmount) + 1,
    "Kiểm tra: số đã nộp lớn hơn số tiền xử lý.",
  );
  return value as unknown as InspectionData;
}

export function validateReportSummary(value: unknown): ReportSummaryData {
  assert(isRecord(value), "Tóm tắt báo cáo: payload rỗng.");
  validateMeta(value.meta, "Tóm tắt báo cáo");
  validateFreshness(value.freshness, "Tóm tắt báo cáo");
  assert(
    ["location", "taxOffice", "industry"].includes(String(value.dimension)),
    "Tóm tắt báo cáo: chiều không hợp lệ.",
  );
  assert(isFinite_(value.total), "Tóm tắt báo cáo: tổng phải là số hữu hạn.");
  assert(
    isFinite_(value.classifiedAmount) && isFinite_(value.unclassifiedAmount),
    "Tóm tắt báo cáo: thiếu phần đã xác định hoặc chưa xác định.",
  );
  assert(
    Math.abs(
      Number(value.classifiedAmount) + Number(value.unclassifiedAmount) - Number(value.total),
    ) < 1,
    "Tóm tắt báo cáo: phần đã xác định cộng phần chưa xác định không bằng tổng.",
  );
  return value as unknown as ReportSummaryData;
}
