/*
  Danh sách nguồn cho tab "Dữ liệu gốc" của hai phân hệ.

  Tên nguồn lấy nguyên văn từ sheet `QuyTac_Nguon` của file kết xuất QL1, NHƯNG
  bỏ hẳn phần đường dẫn. File thật ghi đủ `D:\DTNGOC\QLHT DN SO 1\...` cho từng
  nguồn; mục S4 bản thiết kế cấm để đường dẫn thư mục máy cá nhân xuất hiện
  trên màn hình, và nó cũng không giúp gì người đọc báo cáo — thứ họ cần biết
  là nguồn nào, chốt ngày nào, bao nhiêu dòng.
*/

export interface NguonDuLieu {
  id: string;
  ten: string;
  heThong: string;
  cach: "TU_DONG" | "TAI_TAY";
  ngayChot: string;
  thoiDiemKeo: string;
  dongNguon: number;
  dongVaoKho: number;
  dungCho: string;
  /** Chỉ nguồn hiện tại phải cùng ngày chốt; nguồn so sánh và kế hoạch có mốc riêng. */
  doiChieuNgay: boolean;
}

export const NGUON_QL1: NguonDuLieu[] = [
  { id: "n1", ten: "Báo cáo nợ hiện tại", heThong: "TMS 9.9.2.7", cach: "TU_DONG", ngayChot: "22/07/2026", thoiDiemKeo: "23/07 – 02:10", dongNguon: 248_117, dongVaoKho: 248_117, dungCho: "So sánh nợ; danh sách cưỡng chế, tạm hoãn", doiChieuNgay: true },
  { id: "n2", ten: "Dữ liệu DAILY02 hiện tại", heThong: "TMS 9.9.2.7", cach: "TU_DONG", ngayChot: "22/07/2026", thoiDiemKeo: "23/07 – 02:26", dongNguon: 61_480, dongVaoKho: 61_480, dungCho: "So sánh nợ; DN tăng nợ", doiChieuNgay: true },
  { id: "n3", ten: "Dữ liệu 01/NNT đầu năm", heThong: "TMS 9.9.4.15", cach: "TU_DONG", ngayChot: "31/12/2025", thoiDiemKeo: "04/01 – 03:00", dongNguon: 232_904, dongVaoKho: 232_904, dungCho: "So sánh với đầu năm", doiChieuNgay: false },
  { id: "n4", ten: "Báo cáo tháng trước đúng phạm vi", heThong: "TMS 9.9.4.15", cach: "TU_DONG", ngayChot: "30/06/2026", thoiDiemKeo: "03/07 – 03:00", dongNguon: 241_356, dongVaoKho: 241_356, dungCho: "So sánh với tháng trước", doiChieuNgay: false },
  { id: "n5", ten: "Báo cáo tuần trước đúng phạm vi", heThong: "TMS 9.9.2.7", cach: "TU_DONG", ngayChot: "16/07/2026", thoiDiemKeo: "17/07 – 02:12", dongNguon: 247_002, dongVaoKho: 247_002, dungCho: "So sánh với tuần trước", doiChieuNgay: false },
  /* Nguồn duy nhất còn phải tải tay, và số dòng vào kho ÍT HƠN số dòng nguồn —
     đây là dòng mà người vận hành phải mở ra xem, nên nó không được chìm. */
  { id: "n6", ten: "Báo cáo đánh giá cưỡng chế / tạm hoãn", heThong: "TMS 9.4.16.1 · 9.7.5", cach: "TAI_TAY", ngayChot: "31/07/2026", thoiDiemKeo: "01/08 – 09:44", dongNguon: 18_926, dongVaoKho: 18_812, dungCho: "Cưỡng chế; tạm hoãn xuất cảnh", doiChieuNgay: true },
];

export const NGUON_QL3: NguonDuLieu[] = [
  { id: "m1", ten: "Kết quả kiểm tra hồ sơ khai thuế tại CQT — khối Văn phòng", heThong: "TTR · báo cáo tổng hợp số 6", cach: "TU_DONG", ngayChot: "31/08/2026", thoiDiemKeo: "01/09 – 01:40", dongNguon: 9_214, dongVaoKho: 9_214, dungCho: "Kết quả tổng hợp", doiChieuNgay: true },
  { id: "m2", ten: "Kết quả kiểm tra hồ sơ khai thuế tại CQT — khối Thuế cơ sở", heThong: "TTR · báo cáo tổng hợp số 6", cach: "TU_DONG", ngayChot: "31/08/2026", thoiDiemKeo: "01/09 – 02:05", dongNguon: 41_883, dongVaoKho: 41_650, dungCho: "Kết quả tổng hợp", doiChieuNgay: true },
  { id: "m3", ten: "Kế hoạch kiểm tra tại bàn năm 2026", heThong: "File phòng quản lý", cach: "TAI_TAY", ngayChot: "15/01/2026", thoiDiemKeo: "15/01 – 14:20", dongNguon: 13_655, dongVaoKho: 13_655, dungCho: "Kế hoạch kiểm tra năm", doiChieuNgay: false },
  { id: "m4", ten: "Danh bạ người nộp thuế", heThong: "TMS 2.9.2", cach: "TU_DONG", ngayChot: "31/08/2026", thoiDiemKeo: "01/09 – 01:05", dongNguon: 196_440, dongVaoKho: 196_440, dungCho: "Đối chiếu người nộp thuế", doiChieuNgay: true },
];

/*
  Cảnh báo lệch ngày chốt — yêu cầu riêng ở §4.4 bản thiết kế.

  File mẫu QL1 có ba mốc ngày khác nhau cho cùng một kỳ: tên file ghi tháng 7,
  tiêu đề bảng tổng hợp ghi nợ đến 31/07, còn `QuyTac_Nguon` và danh sách chi
  tiết ghi 22/07. Không có chỗ nào trong file nói vì sao. Màn hình phải nêu ra
  thay vì để người đọc tự phát hiện sau khi đã trích số đi họp.
*/
export function lechNgayChot(nguon: NguonDuLieu[], ngayBaoCao: string) {
  const mocChinh = nguon.filter((n) => n.doiChieuNgay).map((n) => n.ngayChot);
  const khac = [...new Set(mocChinh)].filter((d) => d !== ngayBaoCao);
  return khac;
}

export const lechDong = (n: NguonDuLieu) => n.dongNguon - n.dongVaoKho;
