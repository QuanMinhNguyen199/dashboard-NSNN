/*
  Màn hình chia theo PHÂN HỆ của phòng và phần KHUNG CHUNG.

  Bản thiết kế đặc tả hai phân hệ: QL1 (đánh giá công tác nợ) và QL3 (kiểm tra
  tại bàn). Màn hoàn thuế thuộc QL4 và các tab rủi ro thuộc QL2 — hai phòng đó
  có dữ liệu trong `general_data` nhưng CHƯA có thiết kế, nên không gắn vào
  điều hướng lần này. Mã của chúng giữ nguyên, không xoá.
*/
/*
  Năm màn, theo §1.2 bản thiết kế. Xem ghi chú đầu `components/nav.ts` về bốn
  màn đã gỡ và nội dung của chúng chuyển đi đâu.
*/
export type ViewId =
  | "workbench"
  | "debt" | "risk"
  | "tinhtrang"
  | "giamsat";
/*
  Phòng nghiệp vụ và VAI TRÒ tách làm hai trục, theo ma trận ở mục 3 bản thiết kế.

  Trước đây chỉ có một trục `UserRole` với `OFFICER` thấy toàn bộ chín màn. Thực
  tế quyền là tích của hai thứ: PHÒNG quyết định thấy phân hệ nào, VAI TRÒ quyết
  định bấm được nút nào trong phân hệ đó. Gộp làm một trục thì mỗi lần thêm
  phòng là nhân đôi số vai.

  Bản thiết kế đặc tả QL1 và QL3; QL2, QL4, QL5 có dữ liệu nhưng chưa có thiết
  kế nên chưa có phòng tương ứng ở đây.
*/
export type Phong = "QL1" | "QL3" | null;

/*
  `CV` chuyên viên làm số và gửi duyệt · `TP` trưởng phòng duyệt và chốt số ·
  `VAN_HANH` theo dõi job kéo, không thuộc phòng nào (Q-77) · `LANH_DAO_NN`
  là tài khoản của Dashboard Thu NSNN, không vào hệ tác nghiệp.
*/
export type VaiTro = "CV" | "TP" | "VAN_HANH" | "LANH_DAO_NN";
export type Tone = "neutral" | "positive" | "warning" | "critical" | "info";
/*
  BA trạng thái, không phải năm.

  BRD mục 6 ghi việc của hệ dừng ở "xuất báo cáo kèm nhật ký nguồn gốc"; "ký
  duyệt, gửi lãnh đạo" là việc NGƯỜI làm, bên ngoài hệ. Hai trạng thái cũ
  `APPROVED` và `PUBLISHED` giả định lãnh đạo bấm duyệt và phát hành bên trong
  web này — điều chưa tài liệu nào xác lập, và Q-03 "lãnh đạo nào nhận báo cáo"
  vẫn chưa có câu trả lời. Khi Q-03 được trả lời thì thêm lại.
*/
/*
  Ba bước của mục G10 bản thiết kế: Nháp → Chờ duyệt → Đã chốt.

  `BLOCKED` không phải bước thứ tư. Nó nói dữ liệu chưa đạt nên chưa gửi được,
  và nằm ngoài chuỗi — vì thế nó không có mặt trong `CHUOI` ở màn Báo cáo.
*/
export type ReportStatus = "DRAFT" | "PENDING" | "FINAL" | "BLOCKED";

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
  /** Ai gửi bản này lên trưởng phòng; `null` là chưa gửi. */
  guiBoi: string | null;
  /** Trưởng phòng đã chốt bản này; `null` là chưa chốt. */
  chotBoi: string | null;
  note: string;
}
