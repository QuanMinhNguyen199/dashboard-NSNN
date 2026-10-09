import type {
  DataRun, DebtRow, RefundRow, ReportRun, RiskRow, SourceBatch, WorkItem } from "@/domain/types";

export const DATA_AS_OF = "27/09/2026 – 18:00";

export const workItems: WorkItem[] = [
  { id: "w1", title: "Chốt báo cáo kiểm tra tại bàn tuần 39", module: "Kiểm tra tại bàn", assignee: "Phòng QL3", due: "Hôm nay – 16:30", status: "DUE", count: 35 },
  { id: "w2", title: "Bổ sung dữ liệu mua vào tháng 8", module: "Chênh lệch HĐĐT", assignee: "Phòng QL2", due: "Quá hạn 2 ngày", status: "OVERDUE", count: 26 },
  { id: "w3", title: "Xác nhận 18 ánh xạ chưa khớp", module: "Danh bạ quản lý", assignee: "Quản trị dữ liệu", due: "29/09 – 11:00", status: "BLOCKED", count: 18 },
  { id: "w4", title: "Duyệt báo cáo nợ tuần 39", module: "Nợ và cưỡng chế", assignee: "Trưởng phòng QL1", due: "30/09 – 09:00", status: "DUE", count: 1 },
  /*
    Bốn dòng nữa để hàng đợi đọc ra đúng một ca làm việc.

    Dữ liệu trình diễn là vật liệu thiết kế: bốn dòng cho ra một trang nửa trống
    và không nói được gì về mật độ, trong khi người dùng ngồi cả ngày với hàng
    đợi thật dài hơn thế nhiều. Mọi dòng đều mang nhãn mô phỏng như phần còn lại
    của kho và không dùng để báo cáo.
  */
  { id: "w5", title: "Đối chiếu hồ sơ hoàn kỳ tháng 9", module: "Hoàn thuế", assignee: "Phòng QL4", due: "30/09 – 15:00", status: "DUE", count: 7 },
  { id: "w6", title: "Phân loại 42 trường hợp nợ mới phát sinh", module: "Nợ và cưỡng chế", assignee: "Phòng QLDN2", due: "01/10 – 09:00", status: "DUE", count: 42 },
  { id: "w7", title: "Xác minh 9 hóa đơn rủi ro cao", module: "Xác minh hóa đơn", assignee: "Phòng QL3", due: "Quá hạn 1 ngày", status: "OVERDUE", count: 9 },
  { id: "w8", title: "Chốt danh sách tạm hoãn xuất cảnh", module: "Nợ và cưỡng chế", assignee: "Trưởng phòng QL1", due: "02/10 – 10:00", status: "DUE", count: 3 },
];

export const sourceBatches: SourceBatch[] = [
  { id: "TTR-2026-09", source: "TTR", period: "Tháng 9/2026", received: 35, expected: 35, rows: 182_406, quality: 98.4, status: "READY", updatedAt: "27/09 – 17:42" },
  { id: "TMS-NO-2026-09", source: "TMS", period: "Tháng 9/2026", received: 5, expected: 5, rows: 3_812, quality: 94.8, status: "WARNING", updatedAt: "27/09 – 16:20" },
  { id: "HDDT-2026-08", source: "HĐĐT", period: "Tháng 8/2026", received: 26, expected: 52, rows: 428_905, quality: 50, status: "MISSING", updatedAt: "26/09 – 15:08" },
  { id: "VIETTEL-2026-09-27", source: "Viettel", period: "Ngày 27/09/2026", received: 1, expected: 1, rows: 684, quality: 100, status: "READY", updatedAt: "27/09 – 18:03" },
  /* Chỉ dùng nguồn CÓ THẬT trong danh mục hệ thống. Thêm một cái tên nghe hợp lý
     nhưng không tồn tại là bịa ra một đường dữ liệu, không phải dựng giao diện. */
  { id: "XMHD-2026-09", source: "XMHĐ", period: "Tháng 9/2026", received: 12, expected: 12, rows: 96_120, quality: 99.1, status: "READY", updatedAt: "27/09 – 17:05" },
  { id: "TMS-NO-2026-08", source: "TMS", period: "Tháng 8/2026", received: 18, expected: 21, rows: 54_907, quality: 86.3, status: "PROCESSING", updatedAt: "27/09 – 18:11" },
];

export const debtRows: DebtRow[] = [
  { id: "d1", taxpayer: "Doanh nghiệp mô phỏng An Phúc", maskedTaxId: "0101•••382", unit: "Phòng QLDN1", officer: "Nguyễn Minh A", debt: 8240, age: 146, action: "EXIT_SUSPENSION" },
  { id: "d2", taxpayer: "Doanh nghiệp mô phỏng Đông Đô", maskedTaxId: "0104•••917", unit: "Thuế cơ sở 4", officer: "Trần Thu B", debt: 1860, age: 112, action: "ENFORCE" },
  { id: "d3", taxpayer: "Doanh nghiệp mô phỏng Trường Sơn", maskedTaxId: "0107•••064", unit: "Thuế cơ sở 11", officer: "Lê Quang C", debt: 742, age: 94, action: "ENFORCE" },
  { id: "d4", taxpayer: "Hộ kinh doanh mô phỏng 0142", maskedTaxId: "0109•••142", unit: "Thuế cơ sở 21", officer: "Phạm Lan D", debt: 128, age: 62, action: "MONITOR" },
  { id: "d5", taxpayer: "Doanh nghiệp mô phỏng Hồng Hà", maskedTaxId: "0112•••605", unit: "Phòng QLDN2", officer: "Vũ Hải E", debt: 512, age: 31, action: "REVIEW" },
];

export const riskRows: RiskRow[] = [
  { id: "r1", taxpayer: "Doanh nghiệp mô phỏng 0031", maskedTaxId: "0105•••031", unit: "Thuế cơ sở 2", declarations: 18, state: "EXPLANATION", variance: 18.4, kFactor: 4.8 },
  { id: "r2", taxpayer: "Doanh nghiệp mô phỏng 0148", maskedTaxId: "0108•••148", unit: "Phòng QLDN3", declarations: 12, state: "INSPECTION", variance: 14.2, kFactor: 5.1 },
  { id: "r3", taxpayer: "Doanh nghiệp mô phỏng 0294", maskedTaxId: "0102•••294", unit: "Thuế cơ sở 8", declarations: 9, state: "ADJUSTED", variance: 9.7, kFactor: 3.6 },
  { id: "r4", taxpayer: "Doanh nghiệp mô phỏng 0411", maskedTaxId: "0111•••411", unit: "Thuế cơ sở 17", declarations: 8, state: "ASSESSED", variance: 7.1, kFactor: null },
  { id: "r5", taxpayer: "Doanh nghiệp mô phỏng 0530", maskedTaxId: "0106•••530", unit: "Thuế cơ sở 21", declarations: 7, state: "ACCEPTED", variance: 4.3, kFactor: 1.8 },
];

export const refundRows: RefundRow[] = [
  { id: "h1", code: "HS-2026-09271", receivedAt: "04/09/2026", unit: "Thuế cơ sở 5", source151: true, source6291: false, daysOpen: 24, status: "MISMATCH" },
  { id: "h2", code: "HS-2026-09188", receivedAt: "08/09/2026", unit: "Phòng QLDN4", source151: true, source6291: true, daysOpen: 20, status: "OVERDUE" },
  { id: "h3", code: "HS-2026-09314", receivedAt: "15/09/2026", unit: "Thuế cơ sở 12", source151: true, source6291: true, daysOpen: 13, status: "IN_TIME" },
  { id: "h4", code: "HS-2026-09389", receivedAt: "21/09/2026", unit: "Thuế cơ sở 19", source151: true, source6291: true, daysOpen: 7, status: "IN_TIME" },
  { id: "h5", code: "HS-2026-09074", receivedAt: "27/08/2026", unit: "Thuế cơ sở 1", source151: true, source6291: true, daysOpen: 18, status: "DONE" },
];

export const reportRuns: ReportRun[] = [
  { id: "b1", name: "Kiểm tra tại bàn tuần 39", owner: "Phòng QL3", cycle: "WEEK", period: "22–27/09/2026", source: "TTR – Danh bạ TMS", status: "APPROVED", updatedAt: "27/09 – 17:48" },
  { id: "b2", name: "Tình hình nợ và cưỡng chế tuần 39", owner: "Phòng QL1", cycle: "WEEK", period: "22–27/09/2026", source: "TMS 9.4.16.1 – 2.2.7", status: "DRAFT", updatedAt: "27/09 – 16:35", qualityNote: "18 MST chưa ánh xạ" },
  { id: "b3", name: "Chênh lệch tờ khai – HĐĐT tháng 8", owner: "Phòng QL2", cycle: "MONTH", period: "Tháng 8/2026", source: "HĐĐT", status: "BLOCKED", updatedAt: "26/09 – 15:10", qualityNote: "Thiếu 26 file mua vào" },
  { id: "b4", name: "Hoàn thuế TNCN tháng 9", owner: "Phòng QL4", cycle: "MONTH", period: "Tháng 9/2026", source: "TMS 1.5.1 – 6.29.1", status: "DRAFT", updatedAt: "27/09 – 14:20", qualityNote: "7 hồ sơ vênh nguồn" },
  { id: "b5", name: "Tổng đài hỗ trợ ngày 27/09", owner: "Phòng QL4", cycle: "WEEK", period: "27/09/2026", source: "Viettel", status: "REVIEWED", updatedAt: "27/09 – 18:06" },
  { id: "b6", name: "Kết quả kiểm tra tại bàn tháng 8", owner: "Phòng QL3", cycle: "MONTH", period: "Tháng 8/2026", source: "TTR – Danh bạ TMS", status: "REVIEWED", updatedAt: "05/09 – 09:12" },
];

/*
  Nhật ký lượt chạy (EP-05). Bảy lượt bao đủ các kết cục mà FT-05.4 phải xử lý:
  chạy tự động đạt, chạy tự động LỆCH SỐ DÒNG, chạy tự động hỏng, nhập tệp thủ công
  thay thế, và một lượt đang chạy.

  Cặp TTR tháng 9 có hai bản (v1 và v2) để thấy vùng thô không ghi đè: bản v1
  lệch số dòng vẫn còn nguyên sau khi v2 chạy lại.
*/
export const dataRuns: DataRun[] = [
  { id: "R-0912", source: "TTR", period: "Tháng 9/2026", scope: "30 đơn vị – 35 file", mode: "MANUAL", startedAt: "27/09 – 17:42", rowsSource: 182_406, rowsStore: 182_406, version: 2, status: "OK", note: "Cán bộ nhập tệp thủ công: TTR chạy trên IE cũ, chưa kéo tự động được" },
  { id: "R-0911", source: "TTR", period: "Tháng 9/2026", scope: "30 đơn vị – 35 file", mode: "MANUAL", startedAt: "27/09 – 15:08", rowsSource: 182_406, rowsStore: 176_385, version: 1, status: "MISMATCH", note: "Thiếu 6.021 dòng: một file kết xuất bị cắt giữa chừng. Bản này được giữ nguyên, không ghi đè" },
  { id: "R-0908", source: "TMS", period: "Tháng 9/2026", scope: "Toàn thành phố", mode: "AUTO", startedAt: "27/09 – 16:20", rowsSource: 3_812, rowsStore: 3_812, version: 4, status: "OK", note: "Kéo theo lịch 16h; tham số kỳ và phạm vi đúng như cán bộ chọn tay" },
  { id: "R-0907", source: "XMHĐ", period: "Tháng 9/2026", scope: "Toàn thành phố", mode: "AUTO", startedAt: "27/09 – 17:05", rowsSource: 96_120, rowsStore: 96_120, version: 3, status: "OK", note: "Chia 3 lần kéo để nguồn không quá tải" },
  { id: "R-0906", source: "HĐĐT", period: "Tháng 8/2026", scope: "26 file mua vào", mode: "AUTO", startedAt: "26/09 – 15:08", rowsSource: null, rowsStore: 0, version: 1, status: "FAILED", note: "Hết thời gian chờ ở bước đăng nhập; chưa lấy được số dòng ở nguồn để đối soát" },
  { id: "R-0905", source: "Viettel", period: "Ngày 27/09/2026", scope: "Tổng đài", mode: "AUTO", startedAt: "27/09 – 18:03", rowsSource: 684, rowsStore: 684, version: 1, status: "OK", note: "Chạy đúng 18h theo BR-42" },
  { id: "R-0904", source: "TMS", period: "Tháng 8/2026", scope: "Toàn thành phố", mode: "AUTO", startedAt: "27/09 – 18:11", rowsSource: null, rowsStore: 54_907, version: 2, status: "RUNNING", note: "Đang kéo; đối soát số dòng chạy sau khi xong" },
];
