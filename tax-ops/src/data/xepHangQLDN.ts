/*
  Điểm xếp hạng khối QLDN — sheet "II. Khối QLDN" của file chấm điểm
  general_data/22-10/Bộ tiêu chí đánh giá các chỉ tiêu_BCGB tháng 10 (1).xlsx,
  chép nguyên số theo bản chuyển đổi "Yêu cầu update dữ liệu…" mục 3. Đây là
  SỐ CỦA FILE, không phải số mô phỏng như phần còn lại của bản mẫu.

  Nguồn duy nhất là ĐIỂM TỪNG CHỈ TIÊU (cột "Tính điểm"). Điểm nhóm = tổng điểm
  chỉ tiêu trong nhóm chia số chỉ tiêu (cột K, AM, AT, BS); tổng điểm = cộng
  bốn nhóm (BT). Tính từ đây ra khớp file ở cả năm phòng tới chữ số thứ tư.

  HIỂN THỊ NGUYÊN NHƯ FILE (người dùng chốt 22/10/2026), kể cả những chỗ đã
  ghi nhận là lệch bộ tiêu chí — không gắn nhãn, không sửa điểm:
  • STT 3 chấm lệch thang T1; STT 22 chấm theo hướng "cao là tốt" dù là tỷ lệ
    tồn quá hạn; STT 7 và 8 trùng số liệu ở cả năm phòng.
  • Điểm TTHC vẫn gồm chỉ tiêu hài lòng (STT 16) mà biên bản 09/10 đã bỏ.
  • "Quản lý, hỗ trợ DN" gồm cả kiểm tra tại bàn và hoàn trước GTGT, dù trên
    thanh bên hai việc này đã tách mục riêng (20/10/2026).
*/

export type NhomDiem = "thu" | "no" | "tthc" | "qlht";

export const KY_XEP_HANG = "Báo cáo giao ban tháng 10/2026";

/** Thứ tự phòng của mọi mảng `giaTri` / `diem` bên dưới — đúng thứ tự dòng của sheet. */
export const PHONG_XEP = ["P1", "P2", "P3", "P4", "P5"];

export interface ChiTieuDiem {
  /** STT trên bộ tiêu chí — trình tự thật của văn bản. */
  stt: number;
  /** Tên theo tiêu đề cột của sheet II. */
  ten: string;
  /** Mốc so sánh như file ghi. */
  moc: string;
  giaTri: string[];
  diem: number[];
  /** Ghi chú khi con số không có sẵn trong file mà được tính thêm. */
  ghi?: string;
}

const pt = (so: number[], le = 2) => so.map((x) => `${x.toLocaleString("vi-VN", { minimumFractionDigits: le, maximumFractionDigits: le })}%`);

export const NHOM_DIEM: { id: NhomDiem; ten: string; chiTieu: ChiTieuDiem[] }[] = [
  { id: "thu", ten: "Thu NSNN", chiTieu: [
    { stt: 1, ten: "Tỷ lệ số thực thu NSNN", moc: "BQ ngành 89,76%", giaTri: pt([86.41, 79.19, 96.27, 85.06, 84.39]), diem: [0, -1, 1, 0, -0.5] },
    { stt: 2, ten: "Thực thu tháng / ước thu tháng", moc: "Ước thu 100%", giaTri: pt([103.4, 104.3, 112.8, 174.1, 151.6], 1), diem: [1, 1, 0, -1, -1],
      ghi: "Tỷ lệ tính thêm từ cột Thực hiện và Ước thu; file không ghi sẵn." },
    { stt: 3, ten: "Tỷ lệ thu NSNN tăng giảm so với cùng kỳ", moc: "BQ ngành 121,56%", giaTri: pt([134.15, 113.61, 187.28, 82.44, 116.71]), diem: [1, -1, 1, -1, -0.5] },
  ] },
  { id: "no", ten: "Quản lý nợ", chiTieu: [
    { stt: 4, ten: "Tỷ lệ nợ tăng/giảm so với đầu năm", moc: "BQ ngành 3,71%", giaTri: pt([-8.88, -6.85, -15.10, 1.70, -11.19]), diem: [1, 1, 1, 0.5, 1] },
    { stt: 5, ten: "Tăng/giảm so với tháng trước", moc: "BQ ngành −0,81%", giaTri: pt([-5.65, 16.56, -18.10, 19.57, -8.39]), diem: [0.5, -1, 1, -1, 1] },
    { stt: 6, ten: "Tỷ lệ Tổng nợ / Tổng thu NSNN", moc: "Cục giao 8%", giaTri: pt([10.18, 0.95, 3.57, 3.26, 1.46]), diem: [-0.5, 1, 0.5, 0.5, 1] },
    { stt: 7, ten: "Tỷ lệ Nợ khả năng thu / Tổng thu NSNN", moc: "Cục giao 5%", giaTri: pt([7.97, 0.57, 1.44, 2.79, 0.69]), diem: [-0.5, 0.5, 0.5, 0.5, 0.5] },
    { stt: 8, ten: "Tỷ lệ nợ Thuế, phí / Tổng thu NSNN", moc: "Cục giao 5%", giaTri: pt([7.97, 0.57, 1.44, 2.79, 0.69]), diem: [-0.5, 0.5, 0.5, 0.5, 0.5] },
    { stt: 9, ten: "Tỷ lệ số lượng NNT đã cưỡng chế / phải cưỡng chế", moc: "BQ ngành 68,95%", giaTri: pt([63.76, 84.01, 77.96, 74.12, 39.18]), diem: [-1, 1, 1, 1, -1] },
    { stt: 10, ten: "Tỷ lệ số tiền đã cưỡng chế / phải cưỡng chế", moc: "BQ ngành 87,28%", giaTri: pt([98.63, 96.88, 95.74, 97.21, 96.13]), diem: [1, 1, 1, 1, 1] },
    { stt: 11, ten: "Tỷ lệ số lượng NNT đã THXC / phải THXC", moc: "BQ ngành 54,44%", giaTri: pt([83.92, 96.50, 97.85, 97.13, 95.83]), diem: [1, 1, 1, 1, 1] },
    { stt: 12, ten: "Tỷ lệ số tiền đã THXC / phải THXC", moc: "BQ ngành 92,40%", giaTri: pt([99.88, 99.90, 98.12, 99.20, 99.29]), diem: [1, 1, 1, 1, 1] },
  ] },
  { id: "tthc", ten: "Thủ tục hành chính", chiTieu: [
    { stt: 14, ten: "Tỷ lệ tồn quá hạn TTHC theo tháng (đã loại trừ hoàn GTGT, TNCN)", moc: "BQ ngành 2,57%", giaTri: pt([0, 2.56, 3.12, 4.17, 0]), diem: [0.5, 0.5, -0.5, -0.5, 0.5] },
    { stt: 16, ten: "Tỷ lệ đánh giá sự hài lòng (hệ thống Cục Thuế)", moc: "Mốc 90%", giaTri: pt([88.66, 88.66, 88.66, 88.66, 88.66]), diem: [-0.5, -0.5, -0.5, -0.5, -0.5] },
  ] },
  { id: "qlht", ten: "Quản lý, hỗ trợ DN", chiTieu: [
    { stt: 17, ten: "Rà soát TPR", moc: "BQ ngành 99,66%", giaTri: pt([100, 100, 100, 100, 100]), diem: [1, 1, 1, 1, 1] },
    { stt: 18, ten: "Xác minh hóa đơn", moc: "BQ ngành 99,68%", giaTri: pt([99.70, 99.77, 98.93, 99.79, 100]), diem: [1, 1, -0.5, 1, 1] },
    { stt: 19, ten: "Hệ số K", moc: "BQ ngành 99,74%", giaTri: pt([100, 100, 100, 100, 100]), diem: [1, 1, 1, 1, 1] },
    { stt: 20, ten: "Xử phạt VPHC", moc: "BQ ngành 92,56%", giaTri: pt([100, 98.55, 100, 100, 100]), diem: [1, 1, 1, 1, 1] },
    { stt: 22, ten: "Đóng mã giải thể phát sinh mới: tỷ lệ tồn quá hạn còn phải xử lý", moc: "BQ ngành 64,00%", giaTri: pt([74, 70, 69, 56, 70]), diem: [1, 1, 0.5, -1, 1] },
    { stt: 21, ten: "Đóng mã giải thể theo gói của Phòng QLDN3: tỷ lệ đã thực hiện", moc: "BQ ngành 75,53%", giaTri: pt([74.29, 48.32, 74.40, 65.33, 43.91]), diem: [-0.5, -1, -0.5, -1, -1] },
    { stt: 24, ten: "Kiểm tra tại bàn", moc: "BQ ngành 49,40%", giaTri: pt([55.78, 58.17, 42.36, 42.41, 44.03]), diem: [1, 1, -1, -1, -1] },
    { stt: 26, ten: "Tỷ lệ số tồn quá hạn / Tổng số hồ sơ tồn hoàn trước", moc: "BQ ngành 10,00%", giaTri: pt([0, 0, 0, 0, 0]), diem: [1, 1, 1, 1, 1] },
  ] },
];

const tron4 = (x: number) => Math.round(x * 10000) / 10000;

/*
  Chia từ TỔNG điểm chỉ tiêu, không cộng các điểm nhóm đã làm tròn: cộng bốn
  số đã làm tròn ra QLDN2 = 1,0834 trong khi file ghi 1,0833.
*/
export const DIEM_QLDN = PHONG_XEP.map((donVi, i) => {
  const tho = NHOM_DIEM.map((n) => n.chiTieu.reduce((s, c) => s + c.diem[i], 0) / n.chiTieu.length);
  return {
    donVi,
    diem: Object.fromEntries(NHOM_DIEM.map((n, j) => [n.id, tron4(tho[j])])) as Record<NhomDiem, number>,
    tong: tron4(tho.reduce((s, x) => s + x, 0)),
  };
});

