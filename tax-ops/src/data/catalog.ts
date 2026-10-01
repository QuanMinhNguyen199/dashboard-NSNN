/*
  Dữ liệu mô phỏng cho ba màn nền: lô dữ liệu, ánh xạ và quy tắc nghiệp vụ.

  Mọi con số ở đây là **số mô phỏng tất định** — cùng một lần mở cho ra cùng một
  kết quả, nhưng không phải số nghiệp vụ thật. Mỗi khối trên giao diện đều khai
  nguồn mà nó SẼ lấy khi nối dữ liệu thật, để người xem biết chỗ nào còn trống
  chứ không chỉ biết "đây là demo".
*/
import type { BatchFile, ReportVersion } from "@/domain/types";

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

/* Bảng tham số ngưỡng chuyển sang `data/thamSo.ts` — xem ghi chú ở đó về
   lý do phải có đúng một nguồn. Tái xuất để nơi đang nhập khỏi phải đổi. */
export { ruleItems } from "@/data/thamSo";

/*
  `runId` phải trỏ đúng một `ReportRun`. Trước đây cả ba dòng mang "rp1" trong
  khi reportRuns dùng id b1..b6, nên panel Phiên bản rơi vào empty state với mọi
  báo cáo — đúng cái panel mang luận điểm truy vết của sản phẩm.
*/
export const reportVersions: ReportVersion[] = [
  { id: "v1", runId: "b1", version: "v3", createdAt: "27/09 – 17:20", createdBy: "Trần Quang Dương", guiBoi: "Trần Quang Dương", chotBoi: "Phạm Thanh Vy", note: "Chạy lại sau khi bổ sung file Thuế cơ sở 6" },
  { id: "v2", runId: "b1", version: "v2", createdAt: "26/09 – 09:05", createdBy: "Trần Quang Dương", guiBoi: null, chotBoi: null, note: "Thiếu một file nguồn, số chưa đủ" },
  { id: "v3", runId: "b1", version: "v1", createdAt: "25/09 – 16:40", createdBy: "Trần Quang Dương", guiBoi: null, chotBoi: null, note: "Bản chạy đầu tiên của kỳ" },
];
