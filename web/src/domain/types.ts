import type { BudgetLevel, IndicatorSlug, SourceCode } from "./catalog";
import type { ManagementLevelFilter } from "./tms";
import type {
  BudgetForecastData,
  BudgetViewBy,
  EnterpriseGroupBy,
  EnterpriseManagementData,
  InspectionCycle,
  InspectionData,
  ReportSummaryData,
} from "./workspaces";
import type { ReportDimension, ReportRowKind } from "./report";

export type PeriodType = "MONTH" | "QUARTER";
export type AccumulationMode = "PERIOD" | "YTD";
export type TabId =
  | "overview"
  | "report"
  | "revenue-analysis"
  | "location-detail"
  | "tms-breakdown"
  | "advanced-compare";

/**
 * Bốn loại báo cáo bên trong tab `Báo cáo`.
 *
 * Ba mảng mở theo biên bản 18/09 là CHẾ ĐỘ của một tab, không phải tab cấp cao.
 * Thanh điều hướng giữ đúng sáu tab; thêm tab thứ bảy, tám, chín là đẩy chi phí
 * quét sang mọi người dùng kể cả người không bao giờ mở ba mảng đó.
 */
export type ReportMode = "nsnn" | "budget" | "taxpayer" | "inspection";
export type AdvancedComparisonMode = "period" | "revenue" | "location";
export type RevenueScope = SourceCode;

/** Bộ lọc chung, giữ nguyên khi chuyển tab. */
export interface DashboardFilters {
  year: number;
  periodType: PeriodType;
  period: number;
  accumulation: AccumulationMode;
  indicator: IndicatorSlug;
  budgetLevel: BudgetLevel | "NSNN";
}

/**
 * Quan sát gốc — mọi widget đều tổng hợp từ đây, không có nguồn số nào khác.
 *
 * Không đoạn mã nào tham chiếu kiểu này: lớp mock cộng thẳng qua `sumOf` thay vì
 * dựng mảng quan sát. Nó vẫn ở đây vì là hình dạng đã cam kết của kho quan sát,
 * được mô tả ở README gốc, `web/README.md` và tài liệu thiết kế; xoá đi là bỏ
 * mất phần khai báo của một khái niệm mà ba tài liệu đang dựa vào.
 */
export interface RevenueObservation {
  year: number;
  month: number;
  locationId: string;
  itemCode: string;
  sourceCode: SourceCode;
  budgetLevel: BudgetLevel;
  /** `null` là chưa có dữ liệu. `0` và số âm đều là giá trị hợp lệ. */
  amountVnd: number | null;
}

/**
 * Trạng thái của một tài nguyên.
 * `not-applicable` khiến widget bị loại khỏi lưới; `partial` vẫn hiện dữ liệu thật.
 */
export type ResourceState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "partial"; data: T; message: string }
  | { status: "no-data"; message: string; canChangeFilters: boolean }
  | { status: "not-applicable"; reason: string }
  | { status: "error"; message: string; retryable: boolean };

export interface AmountRow {
  id: string;
  name: string;
  /** Đơn vị đồng, chuẩn hoá một lần ở adapter. */
  amount: number;
  previous: number | null;
  /** Tỷ trọng trên mẫu số của widget; `null` khi mẫu số không hợp lệ. */
  share?: number | null;
  meta?: string;
}

export interface TrendPoint {
  month: number;
  label: string;
  current: number | null;
  previous: number | null;
}

export interface WaterfallStep {
  id: string;
  name: string;
  delta: number;
  from: number;
  to: number;
}

export interface Waterfall {
  startLabel: string;
  endLabel: string;
  start: number;
  end: number;
  steps: WaterfallStep[];
  /** Tổng các bước phải khớp `end - start`; nếu không, ghi rõ độ lệch. */
  reconciled: boolean;
  drift: number;
}

export interface Coverage {
  covered: number;
  total: number;
  missing: string[];
}

export interface DataMeta {
  source: "api" | "mcp" | "fixture" | "mock";
  generatedAt: string;
  unit: "VND";
  periodLabel: string;
  /** Quý được cộng từ ba tháng thay vì lấy báo cáo quý riêng. */
  derivedQuarter: boolean;
  scopeLabel: string;
  coverage: Coverage;
}

export interface OverviewData {
  meta: DataMeta;
  /** Luôn là số của riêng kỳ đang chọn, không đổi theo `accumulation`. */
  kpiPeriod: AmountRow;
  kpiYtd: AmountRow;
  /**
   * Tổng của đúng phạm vi đang lọc — có tính `accumulation`. Là mốc để đối soát
   * các phân rã theo cấp ngân sách: chúng cũng tính theo bộ lọc, nên so chúng
   * với `kpiPeriod` (vốn cố định trong-kỳ) sẽ lệch mỗi khi chọn Lũy kế.
   */
  scopeTotal: AmountRow;
  insight: { tone: "neutral" | "positive" | "warning" | "critical"; title: string; detail: string };
  trend: TrendPoint[];
  sources: AmountRow[];
  domesticItems: AmountRow[];
  locations: AmountRow[];
  /** Hai phần không giao nhau của NSNN: NSTW và NSĐP. */
  budgetLevels: AmountRow[];
  /** NSNN trừ NSTW và NSĐP; không được ép vào một trong hai cấp để làm tròn cơ cấu. */
  unclassifiedBudget: AmountRow | null;
  /** Phân rã NSTW theo bốn nguồn thu, phục vụ chi tiết khi chọn lát NSTW. */
  centralBudgetSources: AmountRow[];
  /** Phân rã NSĐP; tổng ba dòng phải khớp đúng dòng NSĐP phía trên. */
  localBudgetLevels: AmountRow[];
  /** `null` khi không có dự toán cho phạm vi đang lọc. */
  estimate: BudgetEstimate | null;
  waterfall: Waterfall;
}

/**
 * Một nhóm lớn của thu nội địa, kèm các khoản con của chính nó.
 *
 * Khoản con đi cùng nhóm chứ không nằm ở danh sách phẳng riêng: màn hình phân rã
 * cần đúng các khoản thuộc nhóm đang mở, và để hai bên tự ghép bằng mã là mời
 * thêm một chỗ có thể ghép sai.
 */
export interface RevenueGroupRow extends AmountRow {
  /** Các khoản thu thuộc nhóm, đã xếp giảm dần. */
  items: AmountRow[];
}

/**
 * Dự toán giao đầu năm và tiến độ thực hiện.
 *
 * ⚠ API hiện **không** trả trường này — 143 response tham chiếu chỉ có `amount`.
 * Đặc tả v2 từng chủ động để dự toán ngoài phạm vi. Lớp mock vì thế tự suy ra
 * một con số để dựng giao diện, và `origin` nói rõ số đến từ đâu: giao diện phải
 * gắn nhãn mô phỏng chừng nào `origin` còn là `"mock"`. Khi API có trường thật,
 * chỉ cần adapter trả `origin: "api"` là nhãn tự biến mất.
 */
export interface BudgetEstimate {
  /** Dự toán cả năm, đơn vị đồng. */
  annual: number;
  /** Lũy kế thực hiện trên dự toán, 0..1; `null` khi dự toán không hợp lệ. */
  progress: number | null;
  origin: "mock" | "api";
}

export interface RevenueAnalysisData {
  meta: DataMeta;
  scope: RevenueScope;
  kpis: { total: AmountRow; share: number | null; contribution: number };
  trend: TrendPoint[];
  breakdown: AmountRow[];
  /** Chỉ nguồn nội địa: ba nhóm lớn, mỗi nhóm mang khoản con của nó. */
  groups: RevenueGroupRow[] | null;
  /** Chỉ nguồn XNK: tổng gộp, hoàn/khấu trừ và thu ròng. */
  netReconciliation: { gross: number; deductions: AmountRow[]; net: number } | null;
  byLocation: AmountRow[];
  waterfall: Waterfall;
}

export interface LocationDetailData {
  meta: DataMeta;
  location: { id: string; name: string; slug: string };
  kpiPeriod: AmountRow;
  /** Lũy kế từ đầu năm của chính địa bàn — đối xứng với dải KPI Tổng quan. */
  kpiYtd: AmountRow;
  rank: { position: number; total: number } | null;
  shareOfCity: number | null;
  trend: TrendPoint[];
  sources: AmountRow[];
  topItems: AmountRow[];
}

/**
 * Trạng thái nghiệp vụ của một dòng TMS.
 *
 * `needsReview` là dòng có số nhưng chưa đủ căn cứ để công bố: mã thiếu tên
 * trong danh mục, hoặc điều kiện của khoản thu còn điểm chờ xác nhận. Đặc tả
 * cấm quy nó về 0 hay gán `confirmed`, nên nó là một trạng thái riêng chứ không
 * phải một giá trị đặc biệt của số tiền.
 */
export type TmsRowStatus = "confirmed" | "needsReview";

/**
 * Dòng TMS KHÔNG kế thừa `AmountRow` vì `amount` của nó có thể chưa tồn tại.
 *
 * `AmountRow.amount` là `number` — một cam kết rằng con số đã tính được. Ở tầng
 * Chương/Mục/Tiểu mục, cam kết đó chưa giữ được: chưa có giao dịch nào được bàn
 * giao nên không có phép tính nào cho ra số tiền của một mã. `null` ở đây nghĩa
 * là **chưa tính được**, khác hẳn `0` nghĩa là không phát sinh; giao diện để
 * trống chứ không thay bằng 0 hay một câu giải thích trong ô.
 */
export interface TmsRow {
  id: string;
  name: string;
  amount: number | null;
  previous: number | null;
  share?: number | null;
  meta?: string;
  status: TmsRowStatus;
  /** Vì sao dòng chưa được xác nhận; bỏ trống khi `status` là `confirmed`. */
  reviewNote?: string;
}

/** Một Mục kèm các Tiểu mục có phát sinh của chính nó trong phạm vi đang lọc. */
export interface TmsSectionRow extends TmsRow {
  subItems: TmsRow[];
}

export interface TmsBreakdownData {
  meta: DataMeta;
  level: ManagementLevelFilter;
  /**
   * Số tiền ở tầng Chương/Mục/Tiểu mục đến từ đâu.
   *
   * `"mock"` là số mô phỏng dựng để demo: điều kiện báo cáo nói mã nào đủ điều
   * kiện, không nói mã nào chiếm bao nhiêu, nên tỷ lệ giữa các mã là do lớp mô
   * phỏng đặt ra. Giao diện phải gắn nhãn chừng nào giá trị còn là `"mock"`;
   * provider API trả `"api"` là nhãn tự biến mất, không phải sửa giao diện.
   * Cùng khuôn với `BudgetEstimate.origin`.
   */
  origin: "mock" | "api";
  /** Cơ quan thuế đang lọc; `null` là toàn bộ danh sách trong phạm vi. */
  taxOfficeCode: string | null;
  /** Địa bàn đang xem: tên phường/xã, hoặc "Toàn thành phố" khi không lọc. */
  scopeName: string;
  /**
   * Tổng thu NSNN của cùng kỳ và cùng địa bàn — mẫu số của Kho bạc.
   *
   * Phạm vi TMS là tổng A: thu nội địa gồm dầu thô và condensate; không gồm thu
   * xuất nhập khẩu. Không mang con số này theo thì màn hình trả
   * lời "100%" cho câu hỏi tỷ trọng, và người đọc hiểu TMS là toàn bộ NSNN.
   * `null` khi kỳ đó chưa có quan sát nào.
   */
  nsnnTotal: AmountRow | null;
  /**
   * Tổng A của cùng kỳ và cùng địa bàn — phạm vi mà bộ quy tắc TMS mô tả.
   * `amount` là `null` khi kỳ/địa bàn đó chưa có quan sát nào.
   */
  scopeTotal: TmsRow;
  /**
   * Đối soát số chi tiết TMS với số tổng hợp Kho bạc trên CÙNG một phạm vi.
   *
   * TMS là nguồn chi tiết, Kho bạc là nguồn đối soát. Hai hệ thống chốt số ở hai
   * thời điểm khác nhau nên số của chúng lệch nhau, có lúc TMS nhỉnh hơn. Vế TMS
   * chính là `scopeTotal`; trường này mang vế còn lại cùng mốc chốt số của hai
   * bên, vì so hai con số mà không biết chúng chốt lúc nào thì phép so vô nghĩa.
   *
   * Không có ngưỡng nào ở đây, và cũng không được thêm vào: mọi chênh lệch đều
   * phải giải thích được bằng kỳ, phạm vi và mốc dữ liệu. Tuyên bố một mức chênh
   * là chấp nhận được không thuộc thẩm quyền của lớp dữ liệu hay giao diện.
   *
   * `treasuryAmount` là `null` khi nguồn chưa cung cấp số Kho bạc cùng phạm vi.
   * Lớp mô phỏng luôn trả `null`: nó chỉ có một nguồn số, nên một chênh lệch
   * bằng 0 ở đó là lời khẳng định đã đối soát trong khi chưa hề đối soát.
   */
  reconciliation: {
    treasuryAmount: number | null;
    /** Mốc chốt số dạng ISO; `null` khi nguồn không cho biết. */
    tmsUpdatedAt: string | null;
    treasuryUpdatedAt: string | null;
  } | null;
  /**
   * Tổng của cấp đang chọn: phần của `scopeTotal` thuộc các Chương trong dải cấp
   * đó. Bằng đúng `scopeTotal` khi xem tất cả các cấp.
   */
  levelTotal: TmsRow;
  /**
   * Tầng trên của cấp quản lý: trung ương, địa phương, và nhóm chưa xác định.
   * Ba dòng này cộng bằng `scopeTotal` — địa phương đã gộp tỉnh, huyện và xã.
   */
  levels: TmsRow[];
  /** Ba cấp bên trong địa phương; tổng của chúng bằng đúng dòng địa phương. */
  localLevels: TmsRow[];
  /**
   * Đối chiếu cấp quản lý của Chương với cấp ngân sách được hưởng.
   *
   * Hai chiều cùng hình dạng hai bậc nên rất dễ bị đọc thành một. Chúng là hai
   * trường khác nhau: cấp hưởng cần bảng phân bổ riêng, không suy từ Chương.
   * `gap` là khoảng chênh đo được giữa hai cách chia cùng một tổng; `null` khi
   * bộ lọc cấp ngân sách đang thu hẹp nên không còn vế để so.
   */
  correspondence: {
    id: string;
    management: string;
    budget: string;
    /** `null` khi chưa tính được phần thuộc cấp quản lý này. */
    amount: number | null;
    budgetAmount: number | null;
    gap: number | null;
  }[];
  /** Mục có phát sinh, đã xếp giảm dần; nhóm chưa xác định Mục luôn ở cuối. */
  sections: TmsSectionRow[];
  /** Chương có phát sinh trong cấp đang chọn — để tra cứu, không phải bậc chọn. */
  chapters: TmsRow[];
  /**
   * Cơ quan thuế quản lý chứng từ trong phạm vi.
   *
   * Chiều riêng, không suy từ địa bàn hay cấp quản lý của Chương, nên danh sách
   * không đổi theo bộ lọc cấp. Số tiền theo cơ quan thuế cần giao dịch nên để
   * `null` như mọi dòng danh mục khác.
   */
  taxOffices: TmsRow[];
  /**
   * Quan hệ cơ quan thuế với địa bàn, **suy từ giao dịch của kỳ**, không phải
   * từ một bảng danh mục.
   *
   * Không bảng nối nào trong bộ tài liệu cho quan hệ này, và đo trên chứng từ
   * thật thì biết vì sao: nó không phải quan hệ cha con. Tháng 7/2025 có 35 trên
   * 127 địa bàn nằm dưới từ hai cơ quan thuế trở lên, và phần đó giữ hơn một nửa
   * số tiền. Nguyên nhân là Thuế TP Hà Nội quản người nộp thuế lớn trên khắp địa
   * bàn, chồng lên các Thuế cơ sở.
   *
   * Vì vậy trường này là **kết quả quan sát của một kỳ**, không phải sơ đồ tổ
   * chức: kỳ khác có thể ra tập khác, và một địa bàn xuất hiện dưới nhiều cơ
   * quan là chuyện bình thường chứ không phải lỗi nối.
   *
   * `null` khi kỳ đang lọc chưa có chứng từ được nhập.
   */
  taxOfficeScopes: {
    /**
     * `"tms"` là số chứng từ thật. `"mock"` là số phân bổ giả tất định để kiểm
     * tra luồng lọc; giao diện phải gắn nhãn chừng nào giá trị còn là `"mock"`.
     */
    origin: "tms" | "mock";
    /** Kỳ hạch toán của số thật, hoặc kỳ báo cáo đang được mô phỏng. */
    period: string;
    offices: {
      code: string;
      name: string;
      /** Decimal đồng. */
      amount: string;
      txCount: number;
      /** Địa bàn CÓ PHÁT SINH dưới cơ quan này trong kỳ, xếp giảm dần. */
      locations: { id: string; name: string; amount: string }[];
    }[];
    /** Số địa bàn nằm dưới từ hai cơ quan thuế trở lên trong kỳ. */
    sharedLocations: number;
    /** Tổng số địa bàn có phát sinh trong kỳ. */
    totalLocations: number;
    /** Phần tiền thuộc các địa bàn dùng chung, 0..100. */
    sharedShare: number | null;
  } | null;
  quality: {
    /** Số Tiểu mục có phát sinh nhưng chưa có tên trong danh mục 180 mã. */
    subItemsWithoutName: number;
    /** Số Chương có phát sinh nhưng chưa có bản ghi nên chưa xác định được cấp. */
    chaptersWithoutLevel: number;
    /** Khoản thuộc tổng A chưa có điều kiện TMS được xác nhận, nằm ngoài phạm vi. */
    itemsWithoutRule: string[];
  };
}

export interface ComparisonSide {
  id: string;
  label: string;
  total: number | null;
}

export interface AdvancedComparisonData {
  meta: DataMeta;
  mode: AdvancedComparisonMode;
  a: ComparisonSide;
  b: ComparisonSide;
  delta: number | null;
  deltaPct: number | null;
  rows: { id: string; name: string; a: number; b: number; delta: number; pct: number | null; contribution: number }[];
  /** `null` ở chế độ so nguồn thu: "đi từ nguồn A sang nguồn B" không có nghĩa. */
  waterfall: Waterfall | null;
  trendA: TrendPoint[];
  trendB: TrendPoint[];
}

export interface AdvancedComparisonFilters extends DashboardFilters {
  mode: AdvancedComparisonMode;
  periodA?: string;
  periodB?: string;
  source?: SourceCode;
  item?: string;
  locationA?: string;
  locationB?: string;
}

/**
 * Trạng thái của một ô báo cáo.
 *
 * `notApplicable` dành cho tiêu đề B và D: chúng không phát sinh tổng, nên một
 * ô trống ở đó là kết quả đúng chứ không phải thiếu dữ liệu. `needsReview` là ô
 * có số nhưng chưa đủ căn cứ công bố. Ba trạng thái này không được quy về nhau.
 */
export type CellStatus = "confirmed" | "needsReview" | "notApplicable";

/** Một cột của báo cáo; `parentId` khác null khi báo cáo có chiều chi tiết. */
export interface ReportColumn {
  id: string;
  name: string;
  parentId: string | null;
}

export interface ReportCell {
  rowId: string;
  columnId: string;
  /**
   * Chuỗi decimal, đơn vị đồng. `null` là chưa tính được và khác 0.
   *
   * Chuỗi chứ không phải số: xem `domain/money.ts`. Giao diện cộng bằng `bigint`
   * và chỉ đổi sang `number` ở bước định dạng.
   */
  value: string | null;
  status: CellStatus;
  /** Khóa mở chi tiết do máy chủ cấp; `null` khi ô không mở xuống được. */
  drillToken: string | null;
}

export interface ReportRow {
  id: string;
  parent: string | null;
  kind: ReportRowKind;
  name: string;
  /** Độ sâu trong cây, dùng để thụt dòng; gốc là 0. */
  depth: number;
  /** Tổng của cả hàng trên toàn bộ các cột, kể cả cột ngoài trang đang xem. */
  total: string | null;
  status: CellStatus;
}

/**
 * Lưới báo cáo: hàng là cây chỉ tiêu, cột là chiều được chọn.
 *
 * Một trang cột chứ không phải toàn bộ: mẫu ngành theo địa bàn là 13 nhân 126
 * bằng 1.638 cột, và đặc tả cấm bày hết. `columnPage.total` cho biết còn bao
 * nhiêu cột nữa để giao diện nói thật về phạm vi đang hiện.
 */
export interface ReportGridData {
  meta: DataMeta;
  origin: "mock" | "api";
  /** Số hiệu trong tám mẫu; `null` khi cặp chiều không thuộc tám mẫu. */
  templateNo: number | null;
  groupBy: ReportDimension;
  subGroupBy: ReportDimension | null;
  rows: ReportRow[];
  columns: ReportColumn[];
  columnPage: { offset: number; limit: number; total: number };
  cells: ReportCell[];
  quality: {
    /** Số ô chưa đủ căn cứ công bố trong trang đang xem. */
    cellsNeedingReview: number;
    /** Phần tiền chưa nối được chiều đang nhóm, dạng decimal đồng. */
    unclassified: string | null;
  };
}

/** Ý định điều hướng MCP được phép trả về — danh sách đóng. */
export type DashboardNavigationAction =
  | { type: "OPEN_REVENUE_PREVIEW"; sourceId: string }
  | { type: "OPEN_REVENUE_ANALYSIS"; sourceId: string; view?: "overview" | "ranking" | "waterfall" }
  | { type: "OPEN_LOCATION_DETAIL"; locationId: string }
  | { type: "OPEN_ADVANCED_COMPARISON"; mode: AdvancedComparisonMode; entityIds: string[] };

export interface DashboardResponse<T = unknown> {
  schemaVersion: "1.0";
  requestId: string;
  source: DataMeta["source"];
  generatedAt: string;
  filters: DashboardFilters;
  page: { tab: TabId; section?: string; comparisonMode?: AdvancedComparisonMode };
  data: T;
  navigation?: DashboardNavigationAction[];
}

export interface DashboardDataProvider {
  getOverview(filters: DashboardFilters, signal: AbortSignal): Promise<DashboardResponse<OverviewData>>;
  getRevenueAnalysis(
    filters: DashboardFilters,
    scope: RevenueScope,
    signal: AbortSignal,
  ): Promise<DashboardResponse<RevenueAnalysisData>>;
  getLocationDetail(
    filters: DashboardFilters,
    locationId: string,
    signal: AbortSignal,
  ): Promise<DashboardResponse<LocationDetailData>>;
  getAdvancedComparison(
    filters: AdvancedComparisonFilters,
    signal: AbortSignal,
  ): Promise<DashboardResponse<AdvancedComparisonData>>;
  /**
   * Phân rã theo cấp quản lý của Chương, rồi theo Mục và Tiểu mục.
   *
   * `managementLevel` là bộ lọc, không phải bậc của một cây danh mục: máy chủ
   * lọc giao dịch có Chương thuộc cấp đó, tra Mục của từng Tiểu mục rồi cộng
   * theo đúng công thức của chỉ tiêu.
   */
  getTmsBreakdown(
    filters: DashboardFilters,
    managementLevel: ManagementLevelFilter,
    /** Địa bàn đang lọc; `null` là toàn thành phố. */
    locationId: string | null,
    /** Cơ quan thuế đang lọc; `null` là tất cả cơ quan. */
    taxOfficeCode: string | null,
    signal: AbortSignal,
  ): Promise<DashboardResponse<TmsBreakdownData>>;
  /**
   * Lưới báo cáo theo một trong tám mẫu.
   *
   * `groupBy` và `subGroupBy` quyết định cột; hàng luôn là cây 113 chỉ tiêu.
   * Đổi thứ tự hai chiều trên cùng tập dữ liệu phải giữ nguyên tổng của mỗi hàng.
   */
  getReportGrid(
    filters: DashboardFilters,
    options: {
      groupBy: ReportDimension;
      subGroupBy: ReportDimension | null;
      columnOffset: number;
      columnLimit: number;
    },
    signal: AbortSignal,
  ): Promise<DashboardResponse<ReportGridData>>;

  /**
   * Tóm tắt của lưới báo cáo, tính TRÊN TOÀN BỘ chiều chứ không trên trang cột.
   *
   * Tách khỏi `getReportGrid` có chủ ý: lưới phân trang cột, nên nếu giao diện
   * tự cộng lại từ những ô đang hiện thì "tổng thu" đổi mỗi lần lật trang. Số
   * tóm tắt phải nói về kỳ báo cáo, không nói về khung nhìn.
   */
  getReportSummary(
    filters: DashboardFilters,
    dimension: ReportDimension,
    signal: AbortSignal,
  ): Promise<DashboardResponse<ReportSummaryData>>;

  /** Dự toán, thực hiện và dự báo — xếp hạng theo địa bàn hoặc theo khoản thu. */
  getBudgetForecast(
    filters: DashboardFilters,
    viewBy: BudgetViewBy,
    signal: AbortSignal,
  ): Promise<DashboardResponse<BudgetForecastData>>;

  /** Số thu theo ngành nghề, cơ quan thuế hoặc địa bàn, kèm doanh nghiệp mô phỏng. */
  getEnterpriseManagement(
    filters: DashboardFilters,
    groupBy: EnterpriseGroupBy,
    signal: AbortSignal,
  ): Promise<DashboardResponse<EnterpriseManagementData>>;

  /** Kết quả kiểm tra theo tuần hoặc tháng, tổng hợp từ TMS và TTR. */
  getInspection(
    filters: DashboardFilters,
    cycle: InspectionCycle,
    signal: AbortSignal,
  ): Promise<DashboardResponse<InspectionData>>;
}
