/*
  Chín màn, tách theo NHÓM CHỨC NĂNG chứ không theo tên phòng.

  "Dữ liệu và danh mục" trước đây gộp ba việc khác hẳn nhau vào một màn rồi chia
  bằng nút chuyển: tiếp nhận lô, xử lý ngoại lệ ánh xạ, và quản lý quy tắc. Ba
  việc đó có ba người làm, ba nhịp và ba trạng thái riêng, nên tách thành ba màn.
*/
export type ViewId =
  | "workbench"
  | "debt" | "risk" | "refund"
  | "reports"
  | "runs" | "batches" | "mapping" | "rules";
/*
  BA vai, chốt ngày 28/09.

  `STATE_LEADER` cố ý nằm trong danh sách dù KHÔNG vào được Web quản lý. Bỏ hẳn
  ra thì hệ thống mất khả năng nói "tài khoản này thuộc hệ khác", và người dùng
  chỉ thấy một lần đăng nhập thất bại không rõ lý do. Có tên trong danh sách thì
  từ chối được một cách có giải thích.
*/
export type UserRole = "OFFICER" | "TAX_LEADER" | "STATE_LEADER";
export type Tone = "neutral" | "positive" | "warning" | "critical" | "info";
export type ReportStatus = "DRAFT" | "REVIEW" | "APPROVED" | "PUBLISHED" | "BLOCKED";

export interface WorkItem {
  id: string;
  title: string;
  module: string;
  assignee: string;
  due: string;
  status: "DUE" | "OVERDUE" | "BLOCKED" | "DONE";
  count: number;
}

export interface SourceBatch {
  id: string;
  source: "TMS" | "TTR" | "HĐĐT" | "XMHĐ" | "VIETTEL";
  period: string;
  received: number;
  expected: number;
  rows: number;
  quality: number;
  status: "READY" | "WARNING" | "PROCESSING" | "MISSING";
  updatedAt: string;
}

/*
  Một lượt kéo dữ liệu từ hệ nguồn về vùng thô (EP-05).

  `rowsSource` là số dòng ĐẾM Ở NGUỒN, `rowsStore` là số dòng vào kho. Giữ hai
  con số riêng là cả điểm của FT-05.4: một lượt chạy "thành công" mà lệch số
  dòng là lượt chạy hỏng, và nếu chỉ lưu một con số thì không ai biết.

  `version` tăng dần theo từng lần kéo cùng một nguồn và kỳ — vùng thô không
  bao giờ ghi đè (FT-05.2), nên chạy lại kỳ cũ vẫn còn bản trước để đối chiếu.
*/
export interface DataRun {
  id: string;
  source: SourceBatch["source"];
  period: string;
  scope: string;
  mode: "AUTO" | "MANUAL";
  startedAt: string;
  rowsSource: number | null;
  rowsStore: number;
  version: number;
  status: "OK" | "MISMATCH" | "FAILED" | "RUNNING";
  note: string;
}

export interface MappingIssue {
  id: string;
  maskedTaxId: string;
  taxpayer: string;
  currentUnit: string | null;
  suggestedUnit: string | null;
  reason: string;
}

export interface DebtRow {
  id: string;
  taxpayer: string;
  maskedTaxId: string;
  unit: string;
  officer: string;
  debt: number;
  age: number;
  action: "MONITOR" | "ENFORCE" | "EXIT_SUSPENSION" | "REVIEW";
}

export interface RiskRow {
  id: string;
  taxpayer: string;
  maskedTaxId: string;
  unit: string;
  declarations: number;
  state: "ACCEPTED" | "EXPLANATION" | "ADJUSTED" | "ASSESSED" | "INSPECTION";
  variance: number;
  kFactor: number | null;
}

export interface RefundRow {
  id: string;
  code: string;
  receivedAt: string;
  unit: string;
  source151: boolean;
  source6291: boolean;
  daysOpen: number;
  status: "IN_TIME" | "OVERDUE" | "DONE" | "MISMATCH";
}

export interface ReportRun {
  id: string;
  name: string;
  owner: string;
  cycle: "WEEK" | "MONTH" | "YEAR";
  period: string;
  source: string;
  status: ReportStatus;
  updatedAt: string;
  qualityNote?: string;
}

/** Một file trong lô — dùng cho màn chi tiết lô dữ liệu. */
export interface BatchFile {
  id: string;
  name: string;
  unit: string;
  rows: number;
  columns: number;
  issue: "OK" | "COLUMN_DRIFT" | "HAND_EDITED" | "MISSING";
  note: string;
}

/** Một quy tắc nghiệp vụ có phiên bản và ngày hiệu lực. */
export interface BusinessRule {
  id: string;
  name: string;
  value: string;
  effectiveFrom: string | null;
  document: string | null;
  scope: string;
  status: "ACTIVE" | "PENDING" | "CONFLICT";
}

/** Một phiên bản của báo cáo đã chạy. */
export interface ReportVersion {
  id: string;
  runId: string;
  version: string;
  createdAt: string;
  createdBy: string;
  approvedBy: string | null;
  note: string;
}
