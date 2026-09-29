/*
  Dữ liệu mô phỏng cho ba màn nền: lô dữ liệu, ánh xạ và quy tắc nghiệp vụ.

  Mọi con số ở đây là **số mô phỏng tất định** — cùng một lần mở cho ra cùng một
  kết quả, nhưng không phải số nghiệp vụ thật. Mỗi khối trên giao diện đều khai
  nguồn mà nó SẼ lấy khi nối dữ liệu thật, để người xem biết chỗ nào còn trống
  chứ không chỉ biết "đây là demo".
*/
import type { BatchFile, BusinessRule, ReportVersion } from "@/domain/types";

/**
 * File trong lô TTR tháng 9.
 *
 * Con số 35 không phải làm tròn cho đẹp: bảng tình hình tài liệu ghi rõ có 35
 * file chứ không phải 30, vì năm Thuế cơ sở tách hai địa bàn. Đây là **số file
 * nguồn**, không phải số cơ quan thuế — nhầm hai thứ này là nhầm ngay ở khâu
 * kiểm đủ file.
 */
export const batchFiles: BatchFile[] = [
  { id: "f1", name: "TTR_KTTB_T9_CQT01.xlsx", unit: "Thuế cơ sở 1", rows: 5_182, columns: 27, issue: "OK", note: "Đủ cột, khớp cấu trúc kỳ trước" },
  { id: "f2", name: "TTR_KTTB_T9_CQT02.xlsx", unit: "Thuế cơ sở 2", rows: 4_907, columns: 27, issue: "OK", note: "Đủ cột, khớp cấu trúc kỳ trước" },
  { id: "f3", name: "TTR-KTTB-thang9-CQT03.xlsx", unit: "Thuế cơ sở 3", rows: 6_021, columns: 26, issue: "COLUMN_DRIFT", note: "Thiếu cột “Ngày nhận tờ khai” so với kỳ trước" },
  { id: "f4", name: "TTR_KTTB_T9_CQT04_daghep.xlsx", unit: "Thuế cơ sở 4", rows: 3_884, columns: 27, issue: "HAND_EDITED", note: "Có công thức và dòng tổng chèn giữa bảng" },
  { id: "f5", name: "TTR_KTTB_T9_CQT05a.xlsx", unit: "Thuế cơ sở 5 – địa bàn A", rows: 2_450, columns: 27, issue: "OK", note: "Một trong hai file của đơn vị tách địa bàn" },
  { id: "f6", name: "TTR_KTTB_T9_CQT05b.xlsx", unit: "Thuế cơ sở 5 – địa bàn B", rows: 2_311, columns: 27, issue: "OK", note: "Một trong hai file của đơn vị tách địa bàn" },
  { id: "f7", name: "—", unit: "Thuế cơ sở 6", rows: 0, columns: 0, issue: "MISSING", note: "Chưa nhận được file của kỳ này" },
  { id: "f8", name: "TTR_KTTB_T9_CQT07.xlsx", unit: "Thuế cơ sở 7", rows: 4_112, columns: 27, issue: "OK", note: "Đủ cột, khớp cấu trúc kỳ trước" },
];

export const ruleItems: BusinessRule[] = [
  { id: "r1", name: "Đơn vị tổ chức", value: "30 đơn vị", effectiveFrom: "01/01/2026", document: "Quyết định tổ chức bộ máy", scope: "Toàn ngành", status: "ACTIVE" },
  { id: "r2", name: "Trạng thái kiểm tra tại bàn", value: "5 trạng thái", effectiveFrom: "01/01/2026", document: "Ánh xạ từ mã nguồn TTR", scope: "Kiểm tra tại bàn", status: "ACTIVE" },
  { id: "r3", name: "Trạng thái xác minh hóa đơn", value: "6 mã dùng", effectiveFrom: "01/01/2026", document: "Bỏ mã đã hủy và thay thế", scope: "Xác minh hóa đơn", status: "ACTIVE" },
  { id: "r4", name: "Phân tuổi nợ", value: "1–30 – 30–60 – 60–90 – trên 90 ngày", effectiveFrom: "01/01/2026", document: "Theo sổ nợ chốt ngày 3 hằng tháng", scope: "Nợ và cưỡng chế", status: "ACTIVE" },
  /* Hai ngưỡng dưới đây CHƯA được bật, và đó là chủ ý: biên bản ghi các file
     hiện đang ghi khác nhau, nên chưa có căn cứ để hệ thống tự ra cảnh báo. */
  { id: "r5", name: "Ngưỡng cưỡng chế", value: "Trên 90 ngày và trên 3 triệu", effectiveFrom: null, document: null, scope: "Nợ và cưỡng chế", status: "PENDING" },
  { id: "r6", name: "Ngưỡng tạm hoãn xuất cảnh", value: "Trên 120 ngày và trên 500 triệu", effectiveFrom: null, document: null, scope: "Nợ và cưỡng chế", status: "CONFLICT" },
  { id: "r7", name: "Ngưỡng hệ số K", value: "2 – dịch vụ 4", effectiveFrom: null, document: null, scope: "Cảnh báo rủi ro", status: "PENDING" },
];

/*
  `runId` phải trỏ đúng một `ReportRun`. Trước đây cả ba dòng mang "rp1" trong
  khi reportRuns dùng id b1..b6, nên panel Phiên bản rơi vào empty state với mọi
  báo cáo — đúng cái panel mang luận điểm truy vết của sản phẩm.
*/
export const reportVersions: ReportVersion[] = [
  { id: "v1", runId: "b1", version: "v3", createdAt: "27/09 – 17:20", createdBy: "Nguyễn Minh Anh", approvedBy: null, note: "Chạy lại sau khi bổ sung file Thuế cơ sở 6" },
  { id: "v2", runId: "b1", version: "v2", createdAt: "26/09 – 09:05", createdBy: "Nguyễn Minh Anh", approvedBy: null, note: "Thiếu một file nguồn, số chưa đủ" },
  { id: "v3", runId: "b1", version: "v1", createdAt: "25/09 – 16:40", createdBy: "Nguyễn Minh Anh", approvedBy: null, note: "Bản chạy đầu tiên của kỳ" },
];
