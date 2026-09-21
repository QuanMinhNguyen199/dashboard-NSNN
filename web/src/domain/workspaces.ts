import type { Coverage, DataMeta } from "./types";

/**
 * Hợp đồng dữ liệu của ba mảng mở theo biên bản làm việc ngày 18/09/2026:
 * Dự toán và dự báo, Quản lý doanh nghiệp, Kiểm tra.
 *
 * Tách khỏi `types.ts` vì ba mảng này còn đang định hình: nhiều trường sẽ đổi
 * sau khi cơ quan thuế chốt công thức sai số, ý nghĩa "tiền chi thu" và nguồn
 * TTR. Để chúng ở một file riêng thì thấy ngay phần nào đã ổn định và phần nào
 * còn chờ, thay vì lẫn vào hợp đồng đã chạy được nhiều tháng.
 */

/* ───────────────────── Nguồn và thời điểm chốt số ───────────────────────── */

/**
 * Bốn mốc thời gian khác nhau, và chúng KHÔNG thay được cho nhau.
 *
 * `dataAsOf` là lúc NGUỒN chốt số; `generatedAt` là lúc hệ thống dựng báo cáo.
 * Trước đây prototype lấy `new Date()` lúc gọi mock rồi hiện nó như "thời điểm
 * dữ liệu" — câu đó luôn đúng giờ và luôn sai nghĩa: nó nói về lúc người dùng
 * bấm F5, không nói gì về độ mới của số. `dataAsOf` là `null` khi nguồn chưa
 * cho biết, và giao diện phải để trống chứ không được lấp bằng `generatedAt`.
 */
export interface DataFreshness {
  dataAsOf: string | null;
  generatedAt: string;
  status: "official" | "provisional" | "mock";
  sources: DataSourceId[];
}

export type DataSourceId = "TMS" | "TTR" | "TREASURY" | "MANUAL_PLAN";

export const DATA_SOURCE_NAME: Record<DataSourceId, string> = {
  TMS: "TMS · chứng từ ngành thuế",
  TTR: "TTR · kết quả thanh tra, kiểm tra",
  TREASURY: "Kho bạc · số tổng hợp",
  MANUAL_PLAN: "Dự toán giao · nhập thủ công",
};

export const FRESHNESS_STATUS_LABEL: Record<DataFreshness["status"], string> = {
  official: "Số chính thức",
  provisional: "Số tạm tính",
  mock: "Dữ liệu mô phỏng",
};

/* ──────────────────────── 1. Dự toán và dự báo ──────────────────────────── */

/** Chiều xếp hạng của bảng dự toán. Hai chế độ dùng CHUNG một cấu trúc bảng. */
export type BudgetViewBy = "location" | "revenueItem";

/**
 * Trạng thái hoàn thành dự toán.
 *
 * Ngưỡng đặt ở lớp dữ liệu chứ không ở component, vì đây là quy tắc nghiệp vụ
 * chờ cơ quan thuế duyệt — sửa một chỗ khi có quyết định, không đi tìm khắp UI.
 */
export type BudgetStatus = "done" | "onTrack" | "atRisk" | "over";

export const BUDGET_STATUS_LABEL: Record<BudgetStatus, string> = {
  done: "Đã hoàn thành",
  onTrack: "Đang theo tiến độ",
  atRisk: "Có nguy cơ hụt",
  over: "Vượt dự toán",
};

export interface BudgetProgressRow {
  id: string;
  name: string;
  /** Dự toán được giao, đồng. */
  plan: number;
  /** Thực hiện lũy kế theo bộ lọc, đồng. */
  actual: number;
  /** Cùng kỳ năm trước; `null` khi kỳ trước chưa có số. */
  previous: number | null;
  /** `actual / plan * 100`; `null` khi `plan` bằng 0 — không quy ước thành 0%. */
  completionRate: number | null;
  /** Dương là còn phải thu, âm là đã vượt. */
  remaining: number;
  /** Dự báo cuối kỳ; `null` khi kỳ đó chưa nằm trong phạm vi dự báo. */
  forecast: number | null;
  /**
   * Sai số tuyệt đối phần trăm giữa dự báo và thực hiện.
   *
   * `null` khi thiếu một trong hai vế, hoặc khi `actual` bằng 0 — chia cho 0
   * không ra "sai số vô hạn", nó ra "không đo được".
   */
  forecastError: number | null;
  status: BudgetStatus;
}

/** Một khoản thu cấu thành kết quả của một địa bàn, và ngược lại. */
export interface BudgetBreakdownRow {
  id: string;
  name: string;
  plan: number;
  actual: number;
  previous: number | null;
  completionRate: number | null;
}

export interface BudgetForecastData {
  meta: DataMeta;
  freshness: DataFreshness;
  viewBy: BudgetViewBy;
  /** Tổng của đúng phạm vi đang lọc — mốc để đối soát các dòng bên dưới. */
  totals: {
    plan: number;
    actual: number;
    previous: number | null;
    completionRate: number | null;
    remaining: number;
    forecast: number | null;
    forecastError: number | null;
  };
  rows: BudgetProgressRow[];
  /** Khoá là `BudgetProgressRow.id`. Mở một dòng để xem thứ cấu thành nó. */
  breakdown: Record<string, BudgetBreakdownRow[]>;
  /** Thực hiện và dự báo theo tháng, để vẽ hai đường phân biệt được. */
  trend: BudgetTrendPoint[];
  /** Ngưỡng sai số cơ quan thuế nêu; chưa duyệt công thức nên chỉ để hiển thị. */
  forecastTargetPct: number;
  quality: {
    /** Số địa bàn hoặc khoản thu chưa được giao dự toán. */
    withoutPlan: number;
    /** Số kỳ đã có dự báo nhưng chưa có thực hiện để đối chiếu. */
    forecastWithoutActual: number;
  };
}

export interface BudgetTrendPoint {
  month: number;
  label: string;
  actual: number | null;
  plan: number | null;
  forecast: number | null;
}

/* ─────────────────────── 2. Quản lý doanh nghiệp ────────────────────────── */

/** Ba góc nhìn dùng LẠI ba chiều của tab Báo cáo, không dựng danh mục thứ hai. */
export type EnterpriseGroupBy = "industry" | "taxOffice" | "location";

export interface EnterpriseGroupRow {
  id: string;
  name: string;
  amount: number;
  previous: number | null;
  /** Tỷ trọng trên tổng của phạm vi; `null` khi mẫu số không hợp lệ. */
  share: number | null;
  /** Số doanh nghiệp mô phỏng thuộc nhóm. */
  enterpriseCount: number;
  /** Nhóm "chưa xác định" — vẫn nằm trong tổng, không bị loại. */
  unclassified: boolean;
}

/**
 * Một doanh nghiệp trong bản mô phỏng.
 *
 * `token` KHÔNG phải mã số thuế. Đây là chuỗi sinh tất định từ chỉ số dòng, cố
 * ý không mang cấu trúc 10 hoặc 13 chữ số của MST thật để không ai nhầm nó là
 * dữ liệu người nộp thuế, và để nó có lọt vào URL hay log cũng vô hại.
 */
export interface EnterpriseRevenueRow {
  token: string;
  displayName: string;
  industryId: string | null;
  taxOfficeCode: string | null;
  locationId: string | null;
  amount: number;
  previous: number | null;
}

export interface EnterpriseManagementData {
  meta: DataMeta;
  freshness: DataFreshness;
  groupBy: EnterpriseGroupBy;
  totals: {
    amount: number;
    previous: number | null;
    /** Phần đã xác định được nhóm; phần còn lại nằm ở `unclassifiedAmount`. */
    classifiedAmount: number;
    unclassifiedAmount: number;
    /** `classifiedAmount / amount * 100`; `null` khi tổng bằng 0. */
    classifiedRate: number | null;
    groupCount: number;
    /** Tổng bản ghi danh bạ đã tổng hợp; không chứa dữ liệu nhận diện trên UI. */
    directoryTotal: number | null;
  };
  groups: EnterpriseGroupRow[];
  /** Khoá là `EnterpriseGroupRow.id`. Mở một nhóm để xem doanh nghiệp bên trong. */
  enterprises: Record<string, EnterpriseRevenueRow[]>;
}

/* ───────────────────────────── 3. Kiểm tra ──────────────────────────────── */

export type InspectionCycle = "week" | "month";

export type InspectionStatus = "all" | "completed" | "inProgress" | "late";

export const INSPECTION_STATUS_LABEL: Record<InspectionStatus, string> = {
  all: "Tất cả",
  completed: "Đã hoàn thành",
  inProgress: "Đang thực hiện",
  late: "Chậm tiến độ",
};

export interface InspectionSummaryData {
  totalCases: number;
  completedCases: number;
  /**
   * Số tiền xử lý qua kiểm tra.
   *
   * Tên trung tính có chủ ý. Biên bản họp ghi cụm "tiền chi thu" và chưa ai xác
   * nhận nó có đúng là "tiền truy thu" hay không — đặt tên theo phỏng đoán rồi
   * dựng số theo tên đó là cách nhanh nhất để cả báo cáo sai nghĩa.
   */
  processedAmount: number;
  paidAmount: number;
}

export interface InspectionUnitRow {
  id: string;
  name: string;
  totalCases: number;
  completedCases: number;
  completionRate: number | null;
  processedAmount: number;
  paidAmount: number;
  /** `paidAmount / processedAmount * 100`; `null` khi chưa có số xử lý. */
  paidRate: number | null;
  status: Exclude<InspectionStatus, "all">;
}

export interface InspectionTrendPoint {
  /** Nhãn kỳ: "Tuần 36" hoặc "Tháng 8". */
  label: string;
  completedCases: number;
  processedAmount: number;
  paidAmount: number;
}

/** Biến động chính sách cần theo dõi. Nội dung mock trung tính, không bịa văn bản. */
export interface PolicyChangeRow {
  id: string;
  name: string;
  effectiveFrom: string;
  scope: string;
  reviewStatus: "pending" | "reviewing" | "assessed";
}

export const POLICY_REVIEW_LABEL: Record<PolicyChangeRow["reviewStatus"], string> = {
  pending: "Chưa đánh giá",
  reviewing: "Đang đánh giá",
  assessed: "Đã đánh giá",
};

export interface InspectionData {
  meta: DataMeta;
  freshness: DataFreshness;
  cycle: InspectionCycle;
  summary: InspectionSummaryData;
  units: InspectionUnitRow[];
  trend: InspectionTrendPoint[];
  /** Việc cần chú ý: chậm tiến độ, đã nộp thấp, biến động lớn. */
  attention: { id: string; unit: string; reason: string; tone: "warning" | "critical" }[];
  policyChanges: PolicyChangeRow[];
}

/* ───────────────── Tóm tắt đặt trên bảng 113 chỉ tiêu ───────────────────── */

/**
 * Lớp tóm tắt của tab Báo cáo.
 *
 * Provider trả riêng phần này thay vì để giao diện cộng lại từ các ô đang hiện.
 * Bảng chéo phân trang cột: cộng ở frontend thì con số tóm tắt đổi theo trang
 * cột đang xem, tức là nó nói về khung nhìn chứ không nói về kỳ báo cáo.
 */
export interface ReportSummaryData {
  meta: DataMeta;
  freshness: DataFreshness;
  dimension: "location" | "taxOffice" | "industry";
  /** Năm của kỳ đang xem — biểu đồ xu hướng cần nó để đặt nhãn hai vế. */
  year: number;
  total: number;
  /** Số nhóm có phát sinh trong kỳ. */
  groupCount: number;
  classifiedAmount: number;
  unclassifiedAmount: number;
  classifiedRate: number | null;
  top: { id: string; name: string; amount: number; share: number | null }[];
  gainers: { id: string; name: string; amount: number; changePct: number | null }[];
  losers: { id: string; name: string; amount: number; changePct: number | null }[];
  trend: { month: number; label: string; current: number | null; previous: number | null }[];
}

/* ───────────────────────────── Sai số dự báo ────────────────────────────── */

/**
 * Sai số tuyệt đối phần trăm, tách riêng để thay công thức mà không sửa component.
 *
 * Cơ quan thuế đặt mục tiêu ≤ 3% nhưng CHƯA chốt công thức, phạm vi tính, kỳ
 * đánh giá và cách xử lý khoản thu đột biến. Hàm này là bản tạm để duyệt giao
 * diện; khi có quyết định thì đổi ở đây.
 *
 * Trả `null` chứ không trả 0 hay Infinity khi thiếu vế hoặc khi thực hiện bằng
 * 0: "không đo được" và "sai số bằng không" là hai kết luận khác hẳn nhau.
 */
export function absolutePercentageError(
  forecast: number | null | undefined,
  actual: number | null | undefined,
): number | null {
  if (forecast == null || actual == null) return null;
  if (!Number.isFinite(forecast) || !Number.isFinite(actual)) return null;
  if (actual === 0) return null;
  return (Math.abs(forecast - actual) / Math.abs(actual)) * 100;
}

/**
 * Sai số đã đạt ngưỡng chưa.
 *
 * `null` nghĩa là CHƯA KẾT LUẬN ĐƯỢC, và giao diện phải để trống chứ không ghi
 * "Đạt". Một bản mô phỏng không đủ tư cách tuyên bố đạt một chỉ tiêu nghiệm thu.
 */
export function meetsForecastTarget(
  error: number | null,
  targetPct: number,
  status: DataFreshness["status"],
): boolean | null {
  if (error === null) return null;
  if (status === "mock") return null;
  return error <= targetPct;
}

/** Trạng thái hoàn thành dự toán, quy tắc đặt một chỗ. */
export function budgetStatusOf(completionRate: number | null): BudgetStatus {
  if (completionRate === null) return "atRisk";
  if (completionRate >= 100) return completionRate >= 105 ? "over" : "done";
  return completionRate >= 75 ? "onTrack" : "atRisk";
}

export type { Coverage };
