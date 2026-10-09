import { DAY_TCS, maCuaTCS, nhanTCS, phongVPCua } from "@/data/danhMuc";
import { hatCua, mstGia, nguyen, prng, tenCanBoGia, tenNNTGia } from "@/data/ngauNhien";
import type { MucKy } from "@/components/BoLoc";
import { nhanTuanDenNgay } from "@/data/nhanKy";

/*
  Dữ liệu mẫu của phân hệ QL4 — hoàn thuế TNCN và tổng đài (`design_ql2ql4` §5).

  Danh mục đơn vị KHÁC QL1, QL2, QL3: khối Văn phòng có SÁU dòng — năm phòng
  QLHTDN cộng Phòng Thuế cá nhân, hộ kinh doanh và thu khác (§5.1) [F]. Đây là
  dữ liệu chứ không phải lựa chọn hiển thị, nên nó lấy từ `danhMuc.ts`.

  Hai báo cáo chạy hai nhịp rất khác nhau: hoàn thuế theo tuần và lũy kế từ
  01/01, tổng đài theo NGÀY với hạn vài giờ (G18). Vì thế mỗi báo cáo một danh
  mục kỳ riêng, và tổng đài đứng trước trong điều hướng.
*/

export interface DonViQL4 {
  id: string;
  ten: string;
  nhom: "VP" | "TCS";
  /** Mã CQT; Thuế cơ sở hai địa bàn nối bằng dấu cộng, ví dụ "0117+0127". */
  ma: string;
  stt: number;
}

const VP = phongVPCua("QL4");

export const DON_VI_QL4: DonViQL4[] = [
  ...VP.map((p) => ({ id: p.id, ten: p.ten, nhom: "VP" as const, ma: p.ma, stt: p.thuTu })),
  ...DAY_TCS.map((so) => ({
    id: `T${so}`,
    ten: nhanTCS(so),
    nhom: "TCS" as const,
    ma: maCuaTCS(so).map((c) => c.ma).join("+"),
    stt: so + VP.length,
  })),
];

/* ── Kỳ ──────────────────────────────────────────────────────────────────── */

export interface KyQL4 extends MucKy { hat: number; ngayChot: string }

/*
  QL4-01: lũy kế "Hồ sơ xử lý từ ngày 01/01/yyyy đến dd/mm/yyyy" là nhịp chính
  [F]; tuần và năm là hai nhịp phụ. Mẫu tháng và năm chưa có (Q-91), nên bản
  mẫu chỉ dựng lũy kế và tuần — dựng một kỳ chưa có mẫu là đoán bố cục.
*/
export const KY_QL4_01: KyQL4[] = [
  ...["24/09/2026", "17/09/2026", "10/09/2026", "03/09/2026"].map((d, i) => ({
    id: `q401-lk${d.slice(0, 2)}${d.slice(3, 5)}`,
    loai: "LUYKE" as const,
    ngayChot: d,
    nhan: `Hồ sơ xử lý từ 01/01/2026 đến ${d}`,
    hat: 4100 + i,
  })),
  ...[39, 38, 37].map((w, i) => {
    const chot = ["24/09/2026", "17/09/2026", "10/09/2026"][i];
    return { id: `q401-w${w}`, loai: "TUAN" as const, ngayChot: chot, nhan: nhanTuanDenNgay(chot), hat: 4140 + i };
  }),
];

/** QL4-02: ngày là nhịp chính (mặc định hôm qua), cộng tuần và tháng. */
const NGAY_QL4_02 = ["26/09/2026", "25/09/2026", "24/09/2026", "23/09/2026", "22/09/2026"];

export const KY_QL4_02: KyQL4[] = [
  ...NGAY_QL4_02.map((d, i) => ({
    id: `q402-d${d.slice(0, 2)}${d.slice(3, 5)}`,
    loai: "NGAY" as const,
    ngayChot: d,
    nhan: `Ngày ${d}`,
    hat: 4200 + i,
  })),
  /* Mỗi tuần chốt vào ngày cuối của CHÍNH nó. Trước đây cả ba tuần cùng mang
     ngày chốt 26/09 của kỳ ngày mới nhất, nên dải trạng thái đầu màn nói "Số
     liệu ngày 26/09" cho cả tuần 37 — một ngày nằm ngoài tuần ấy. */
  ...[39, 38, 37].map((w, i) => {
    const chot = ["24/09/2026", "17/09/2026", "10/09/2026"][i];
    return { id: `q402-w${w}`, loai: "TUAN" as const, ngayChot: chot, nhan: nhanTuanDenNgay(chot), hat: 4240 + i };
  }),
  ...[9, 8].map((m) => ({
    id: `q402-m${String(m).padStart(2, "0")}`,
    loai: "THANG" as const,
    ngayChot: `${new Date(2026, m, 0).getDate()}/${String(m).padStart(2, "0")}/2026`,
    nhan: `Tháng ${String(m).padStart(2, "0")}/2026`,
    hat: 4260 + m,
  })),
];

export const KY_CUA_BAO_CAO_QL4: Record<string, KyQL4[]> = {
  "QL4-01": KY_QL4_01,
  "QL4-02": KY_QL4_02,
};

const quyMo = (dv: DonViQL4) => (dv.nhom === "VP" ? (dv.id === "HKD" ? 3.4 : 1.6) : 1);

/* ── QL4-01 · Tiến độ giải quyết hồ sơ hoàn TNCN ─────────────────────────── */

/*
  Sáu trạng thái ký điện tử của mẫu, dùng ở cả nhóm thủ công và nhóm tự động
  (cột 8–13 và 14–19) [F]. Tên giữ nguyên văn theo G4.
*/
export const TRANG_THAI_KDT = [
  "Lỗi truyền lên ký điện tử",
  "Đã truyền lên Ký điện tử",
  "KĐT nhận thành công (chưa ký)",
  "Từ chối ký",
  "Đã ký nhưng chưa lưu hành điện tử (Chưa cấp số)",
  "Đã ký và lưu hành điện tử (đã cấp số)",
] as const;

export interface HangQL4_01 {
  dv: DonViQL4;
  /** (2) Tự động có rà soát. */
  tuDongCoRaSoat: number;
  /** (3) Tự động. */
  tuDong: number;
  /** (4) Thủ công — tổng hồ sơ đã giải quyết theo đường thủ công. */
  thuCong: number;
  /** (6) Đang xử lý trong hạn. */
  dangXuLyTrongHan: number;
  /** (7) Đang xử lý quá hạn. */
  dangXuLyQuaHan: number;
  /** Sáu trạng thái KĐT của nhóm thủ công. */
  kdtThuCong: number[];
  /** Sáu trạng thái KĐT của nhóm tự động. */
  kdtTuDong: number[];
  /** (9) Đã cấp số. */
  daCapSo: number;
  /** Số hồ sơ vênh giữa 1.5.1 và 6.29.1 của đơn vị này. */
  hoSoVenh: number;
}

/** (1) = (2) + (3): tổng hồ sơ tiếp nhận theo đường tự động. */
export const tongTiepNhan = (h: HangQL4_01) => h.tuDongCoRaSoat + h.tuDong + h.thuCong;
/** (5) = (6) + (7). */
export const dangXuLy = (h: HangQL4_01) => h.dangXuLyTrongHan + h.dangXuLyQuaHan;
/** (8) = (9) + (10): tổng hồ sơ cần cấp số. */
export const canCapSo = (h: HangQL4_01) =>
  h.kdtThuCong[5] + h.kdtTuDong[5] + h.kdtThuCong[4] + h.kdtTuDong[4];
export const chuaCapSo = (h: HangQL4_01) => Math.max(0, canCapSo(h) - h.daCapSo);

/** Tỷ lệ hồ sơ quá hạn trong phần đang xử lý. Mẫu số 0 → `null` (G8). */
export const tyLeQuaHan = (h: HangQL4_01) => (dangXuLy(h) <= 0 ? null : h.dangXuLyQuaHan / dangXuLy(h));
/** Tỷ lệ hồ sơ tiếp nhận và xử lý tự động. */
export const tyLeTuDong = (h: HangQL4_01) =>
  tongTiepNhan(h) <= 0 ? null : (h.tuDongCoRaSoat + h.tuDong) / tongTiepNhan(h);

export const bangQL4_01 = (hatKy: number): HangQL4_01[] =>
  DON_VI_QL4.map((dv) => {
    const r = prng(hatCua(hatKy, dv.id, "hoan"));
    const heSo = quyMo(dv);
    const tuDongCoRaSoat = nguyen(r, 120, Math.round(2_600 * heSo));
    const tuDong = nguyen(r, 300, Math.round(5_400 * heSo));
    const thuCong = nguyen(r, 20, Math.round(900 * heSo));
    const dangXuLyTrongHan = nguyen(r, 0, Math.round(240 * heSo));
    const dangXuLyQuaHan = nguyen(r, 0, Math.round(90 * heSo));
    const chia = (tong: number) => {
      const ra = TRANG_THAI_KDT.map(() => 0);
      for (let i = 0; i < tong; i++) {
        /* Phần lớn hồ sơ đã đi tới bước cuối; lỗi và từ chối là thiểu số —
           nếu không thì bảng đọc ra như cả ngành đang hỏng. */
        const w = r();
        ra[w < 0.02 ? 0 : w < 0.08 ? 1 : w < 0.16 ? 2 : w < 0.2 ? 3 : w < 0.42 ? 4 : 5]++;
      }
      return ra;
    };
    const kdtThuCong = chia(thuCong);
    const kdtTuDong = chia(tuDongCoRaSoat + tuDong);
    const can = kdtThuCong[4] + kdtThuCong[5] + kdtTuDong[4] + kdtTuDong[5];
    return {
      dv,
      tuDongCoRaSoat,
      tuDong,
      thuCong,
      dangXuLyTrongHan,
      dangXuLyQuaHan,
      kdtThuCong,
      kdtTuDong,
      daCapSo: nguyen(r, Math.round(can * 0.6), can),
      hoSoVenh: nguyen(r, 0, Math.round(26 * heSo)),
    };
  });

/*
  Bình quân chung = TỶ LỆ TOÀN ĐỊA BÀN, không phải trung bình cộng tỷ lệ của
  các đơn vị. Hai cách cho hai con số khác nhau, và cách thứ hai cho một đơn
  vị mười hồ sơ cùng trọng số với một đơn vị mười nghìn hồ sơ. Q-26 và Q-89
  chưa trả lời; đây là giả định tạm thời và nó được ghi trên màn.
*/
export const binhQuanQuaHan = (ds: HangQL4_01[]) => {
  const mau = ds.reduce((t, h) => t + dangXuLy(h), 0);
  return mau <= 0 ? null : ds.reduce((t, h) => t + h.dangXuLyQuaHan, 0) / mau;
};

/*
  Bảng chấm điểm (sheet CHẤM ĐIỂM) [F]. Bậc nói theo khoảng cách tới bình quân
  chung, nên một đơn vị biết mình được cộng hay trừ vì lý do gì.
*/
export const BAC_DIEM = [
  { tu: -Infinity, den: -0.05, diem: 1, nhan: "Thấp hơn bình quân trên 5%" },
  { tu: -0.05, den: 0, diem: 0.5, nhan: "Thấp hơn bình quân từ 0–5%" },
  { tu: 0, den: 0.05, diem: -0.5, nhan: "Cao hơn bình quân từ 0–5%" },
  { tu: 0.05, den: Infinity, diem: -1, nhan: "Cao hơn bình quân trên 5%" },
] as const;

export const bacCua = (lech: number) => BAC_DIEM.find((b) => lech > b.tu && lech <= b.den) ?? BAC_DIEM[1];

/* ── QL4-01 · Hồ sơ đang xử lý và hồ sơ vênh ─────────────────────────────── */

export const TRANG_THAI_HO_SO = ["Đã tiếp nhận", "Đang kiểm tra", "Chờ bổ sung", "Chờ ký", "Chờ cấp số"] as const;

export interface HoSoHoan {
  so: string;
  mst: string;
  tenNNT: string;
  dv: DonViQL4;
  ngayNhan: string;
  hanXuLy: string;
  soNgayQuaHan: number;
  trangThai: string;
  trangThaiKDT: string;
  hinhThuc: "Tự động" | "Tự động có rà soát" | "Thủ công";
  phongXuLy: string;
  /** Các cột "Kiểm tra tự động" của 6.29.1 — hiển thị dạng tích/chéo. */
  kiemTra: boolean[];
}

/** Tên các cột kiểm tra tự động của 6.29.1 [F]. */
export const COT_KIEM_TRA = [
  "Khớp thông tin NNT",
  "CCCD tồn tại duy nhất tại 1 MST",
  "Khớp số thuế đã khấu trừ",
  "Khớp kỳ hoàn",
] as const;

export const danhSachHoSo = (hatKy: number, nhom: "VP" | "TCS", soDong = 160): HoSoHoan[] => {
  const r = prng(hatCua(hatKy, nhom, "hoso"));
  const don = DON_VI_QL4.filter((d) => d.nhom === nhom);
  return Array.from({ length: soDong }, (_, i) => {
    const dv = don[nguyen(r, 0, don.length - 1)];
    const ngay = nguyen(r, 1, 24);
    const quaHan = nguyen(r, -12, 26);
    return {
      so: `HS/${String(31000 + i).padStart(6, "0")}`,
      mst: mstGia(2000 + i),
      tenNNT: `Nguyễn Văn ${String.fromCharCode(65 + (i % 26))}`,
      dv,
      ngayNhan: `${String(ngay).padStart(2, "0")}/09/2026`,
      hanXuLy: `${String(Math.min(30, ngay + 6)).padStart(2, "0")}/09/2026`,
      soNgayQuaHan: quaHan,
      trangThai: TRANG_THAI_HO_SO[nguyen(r, 0, TRANG_THAI_HO_SO.length - 1)],
      trangThaiKDT: TRANG_THAI_KDT[nguyen(r, 0, TRANG_THAI_KDT.length - 1)],
      hinhThuc: (["Tự động", "Tự động có rà soát", "Thủ công"] as const)[nguyen(r, 0, 2)],
      phongXuLy: dv.nhom === "VP" ? dv.ten : `Đội kiểm tra ${nguyen(r, 1, 3)}`,
      kiemTra: COT_KIEM_TRA.map(() => r() > 0.18),
    };
  });
};

/*
  Hồ sơ vênh giữa TMS 1.5.1 (đầu hồ sơ) và 6.29.1 (cán bộ xử lý).

  Ba loại vênh theo BR-40 [F]. Loại thứ ba gom mọi trường hợp còn lại và nó
  CHÍNH LÀ thứ phiếu PRS-05 sinh ra để hỏi — hai loại đầu đã có cách giải
  thích, loại thứ ba thì chưa.
*/
export const LOAI_VENH = [
  "Kỳ hoàn ≤ 2020 – không tự sinh",
  "Tờ khai bổ sung từ 2021",
  "Khác",
] as const;

export const KET_QUA_PRS05 = ["Chưa có kết quả", "Đã xử lý trên TMS", "Không phải xử lý"] as const;

export interface HoSoVenh {
  so: string;
  mst: string;
  tenNNT: string;
  dv: DonViQL4;
  /** Có ở 1.5.1 mà thiếu ở 6.29.1, hoặc ngược lại. */
  chieu: "Thiếu ở 6.29.1" | "Thiếu ở 1.5.1";
  loai: string;
  ketQua: string;
  lyDo: string;
  phieu: string;
}

export const danhSachVenh = (hatKy: number, soDong = 120): HoSoVenh[] => {
  const r = prng(hatCua(hatKy, "venh"));
  return Array.from({ length: soDong }, (_, i) => {
    const dv = DON_VI_QL4[nguyen(r, 0, DON_VI_QL4.length - 1)];
    const ketQua = KET_QUA_PRS05[Math.min(2, Math.floor(r() * r() * 3.6))];
    return {
      so: `HS/${String(52000 + i).padStart(6, "0")}`,
      mst: mstGia(3000 + i),
      tenNNT: `Nguyễn Văn ${String.fromCharCode(65 + (i % 26))}`,
      dv,
      chieu: r() < 0.62 ? "Thiếu ở 6.29.1" : "Thiếu ở 1.5.1",
      loai: LOAI_VENH[nguyen(r, 0, LOAI_VENH.length - 1)],
      ketQua,
      lyDo: ketQua === "Không phải xử lý" ? "Hồ sơ đã rút trước khi tiếp nhận" : "",
      phieu: ketQua === "Chưa có kết quả" && r() < 0.5 ? "" : `PRS-05/${String(1400 + (i % 30)).padStart(4, "0")}`,
    };
  });
};

/* ── QL4-02 · Tổng đài ───────────────────────────────────────────────────── */

/*
  Danh mục tài khoản tổng đài nối tài khoản Viettel với đơn vị. Khoảng 33 đơn
  vị trong file mẫu, gồm cả các phòng không có trong danh mục hoàn thuế [F].

  Dòng "Chưa xác định đơn vị" là dòng THẬT, không phải lỗi hiển thị: file mẫu
  hiện có `#N/A` (G15). Nó đứng cuối bảng, mang màu cảnh báo và có nút gán.
*/
export const CHUA_XAC_DINH = "Chưa xác định đơn vị";

export const DON_VI_TONG_DAI: string[] = [
  ...DON_VI_QL4.map((d) => d.ten),
  "Phòng Công nghệ thông tin",
  "Phòng Dự toán, Lập rủi ro",
  "Phòng Quản lý đất",
  "Văn phòng",
];

export interface HangCuocGoi {
  /** Tài khoản tổng đài; nhiều tài khoản thuộc cùng một đơn vị. */
  user: string;
  nhanVien: string;
  donVi: string;
  diTraLoi: number;
  diKhongTraLoi: number;
  diThoiGian: number;
  denTraLoi: number;
  denKhongTraLoi: number;
  denThoiGian: number;
  noiBo: number;
}

export const tongDi = (h: HangCuocGoi) => h.diTraLoi + h.diKhongTraLoi;
export const tongDen = (h: HangCuocGoi) => h.denTraLoi + h.denKhongTraLoi;
/** Tỉ lệ nhỡ tính trên cuộc gọi ĐẾN — nhỡ cuộc gọi của NNT mới là vấn đề. */
export const tyLeNho = (h: HangCuocGoi) => (tongDen(h) <= 0 ? null : h.denKhongTraLoi / tongDen(h));
export const thoiGianTB = (h: HangCuocGoi) => {
  const n = h.diTraLoi + h.denTraLoi;
  return n <= 0 ? null : Math.round((h.diThoiGian + h.denThoiGian) / n);
};

export const danhSachCuocGoi = (hatKy: number): HangCuocGoi[] => {
  const r = prng(hatCua(hatKy, "goi"));
  return Array.from({ length: 105 }, (_, i) => {
    /* Khoảng 4% tài khoản không khớp danh mục — đúng như file mẫu có `#N/A`. */
    const lac = r() < 0.04;
    const donVi = lac ? CHUA_XAC_DINH : DON_VI_TONG_DAI[nguyen(r, 0, DON_VI_TONG_DAI.length - 1)];
    const denTraLoi = nguyen(r, 0, 46);
    const diTraLoi = nguyen(r, 0, 22);
    return {
      user: `TT_${String(i + 1).padStart(3, "0")}`,
      nhanVien: tenCanBoGia(i),
      donVi,
      diTraLoi,
      diKhongTraLoi: nguyen(r, 0, 9),
      diThoiGian: diTraLoi * nguyen(r, 40, 260),
      denTraLoi,
      denKhongTraLoi: nguyen(r, 0, 14),
      denThoiGian: denTraLoi * nguyen(r, 60, 340),
      noiBo: nguyen(r, 0, 12),
    };
  });
};

export const TRANG_THAI_PHIEU = ["Đang xử lý", "Hoàn thành"] as const;

export interface PhieuGhi {
  id: string;
  ngayTao: string;
  trangThai: string;
  chuDe: string;
  phanLoai: string;
  /** Văn bản tự do, có dữ liệu NNT — chỉ hiện ở mục Danh sách phiếu (S6). */
  moTa: string;
  taoBoi: string;
  chuyenVien: string;
  donVi: string;
  hanXuLy: string;
  hetHan: boolean;
  /** Cột "Hạn xử lý không đúng quy trình" của nguồn. */
  saiHan: boolean;
}

const CHU_DE = ["Hỏi về quyết toán thuế TNCN", "Tra cứu mã số thuế", "Hóa đơn điện tử", "Nộp thuế điện tử", "Hoàn thuế TNCN", "Đăng ký thuế"];
const PHAN_LOAI = ["Hướng dẫn chính sách", "Hỗ trợ kỹ thuật", "Khiếu nại", "Đề nghị cung cấp thông tin"];

export const danhSachPhieu = (hatKy: number, soDong = 220): PhieuGhi[] => {
  const r = prng(hatCua(hatKy, "phieu"));
  return Array.from({ length: soDong }, (_, i) => {
    const lac = r() < 0.03;
    const trangThai = r() < 0.62 ? "Hoàn thành" : "Đang xử lý";
    const ngay = nguyen(r, 1, 26);
    return {
      id: `TK${String(90000 + i).padStart(6, "0")}`,
      ngayTao: `${String(nguyen(r, 8, 17)).padStart(2, "0")}:${String(nguyen(r, 0, 59)).padStart(2, "0")} ${String(ngay).padStart(2, "0")}/09/2026`,
      trangThai,
      chuDe: CHU_DE[nguyen(r, 0, CHU_DE.length - 1)],
      phanLoai: PHAN_LOAI[nguyen(r, 0, PHAN_LOAI.length - 1)],
      moTa: `Người nộp thuế ${tenNNTGia(i)} hỏi về ${CHU_DE[nguyen(r, 0, CHU_DE.length - 1)].toLowerCase()}; đã hướng dẫn và hẹn gọi lại.`,
      taoBoi: tenCanBoGia(nguyen(r, 0, 40)),
      chuyenVien: tenCanBoGia(nguyen(r, 0, 40)),
      donVi: lac ? CHUA_XAC_DINH : DON_VI_TONG_DAI[nguyen(r, 0, DON_VI_TONG_DAI.length - 1)],
      hanXuLy: `${String(Math.min(30, ngay + 2)).padStart(2, "0")}/09/2026`,
      /* Phiếu đóng SAU hạn vẫn tính là hết hạn — Q-92 chưa trả lời, và cách
         đếm ngược lại sẽ giấu đúng những phiếu đã trễ rồi mới xong. */
      hetHan: r() < 0.22,
      saiHan: r() < 0.07,
    };
  });
};
