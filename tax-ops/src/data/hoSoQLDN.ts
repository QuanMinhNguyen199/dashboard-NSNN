import { hatCua, nguyen, prng } from "@/data/ngauNhien";
import {
  CHI_TIEU_Q, canBoCua, capCua, doiTuongCua, tyLeCua,
  type ChiTieuQ, type DauViecId, type DongDN, type PhamVi, type ViecQ,
} from "@/data/qldn";

/*
  Phần bổ sung theo biên bản 22/10/2026 "Báo cáo tiến độ NSNN, workspace CBT"
  §3.2 — năm việc phía Thuế yêu cầu thêm cho không gian làm việc khối QLDN:

  1. Cảnh báo nhắc việc: bấm hồ sơ ra chi tiết thủ tục đã nộp, nội dung là
     gì; đầu việc theo danh mục và trạng thái.
  2. Cưỡng chế: hiện từng biện pháp (một DN có thể chịu nhiều biện pháp),
     không hiện Có/Không.
  3. Sức khỏe doanh nghiệp: lịch sử xử phạt, hồ sơ, thủ tục, so với các năm
     trước.
  4. Tổng quan đối tượng: thêm phân tích rủi ro.
  5. Xếp hạng cán bộ theo phòng quản lý.

  Mọi số ở đây là SỐ ĐẶT RA, sinh tất định như phần còn lại của bản mẫu. Mỗi
  hàm gieo trên dãy RIÊNG của nó (hạt 61–79) để không chen vào dãy của
  `qldn.ts` — chen vào là đổi số đã đưa đi trình diễn.

  Ba chỗ còn CHỜ phía Thuế, nên màn nói thẳng là tạm hoặc chưa có, không tự
  đặt ra quy tắc nghiệp vụ:
  • Xếp loại sức khỏe DN — Phòng Kiểm tra gửi tiêu chí (việc số 3).
  • Cách tính điểm cán bộ — các phòng gửi chỉ tiêu (việc số 2).
  • Cách hiển thị phân tích rủi ro — việc số 4, chưa có người phụ trách.
*/

const homNay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const lui = (d: Date, ngay: number) => { const x = new Date(d); x.setDate(x.getDate() - ngay); return x; };
const trieu = (x: number) => Math.round(x).toLocaleString("vi-VN");

/* =====================================================================
   1. Chi tiết hồ sơ của một cảnh báo
   ===================================================================== */

/*
  Việc có hai gốc. Bốn đầu việc bắt đầu từ HỒ SƠ NGƯỜI NỘP THUẾ GỬI LÊN (hoàn
  GTGT, hoàn TNCN, TTHC, xác minh hóa đơn theo đề nghị); sáu đầu việc còn lại
  PHÁT SINH TRÊN HỆ THỐNG (TMS, TPR) — không có "thủ tục đã nộp" nào, nên khối
  chi tiết gọi đúng tên gốc của nó thay vì bịa ra một hồ sơ.
*/
type Goc = "NNT" | "HE_THONG";
const THU_TUC: Record<DauViecId, { goc: Goc; ten: string; noiDung: (r: () => number) => string }> = {
  "hoan-gtgt": { goc: "NNT", ten: "Giấy đề nghị hoàn trả khoản thu NSNN (mẫu 01/HT)", noiDung: (r) => `Đề nghị hoàn thuế GTGT kỳ quý ${nguyen(r, 2, 3)}/2026, số tiền ${trieu(400 + r() * 9600)} triệu đồng` },
  "hoan-tncn": { goc: "NNT", ten: "Tờ khai quyết toán thuế TNCN (mẫu 02/QTT-TNCN) kèm đề nghị hoàn", noiDung: (r) => `Đề nghị hoàn thuế TNCN nộp thừa năm 2025, số tiền ${trieu(3 + r() * 60)} triệu đồng` },
  dvc: { goc: "NNT", ten: "Tờ khai điều chỉnh thông tin đăng ký thuế (mẫu 08-MST)", noiDung: (r) => r() < 0.5 ? "Thay đổi địa chỉ trụ sở chính" : "Thay đổi người đại diện theo pháp luật" },
  "xp-tk": { goc: "HE_THONG", ten: "Tờ khai nộp chậm, ghi nhận trên TMS", noiDung: (r) => `Tờ khai thuế GTGT tháng ${nguyen(r, 7, 9)}/2026 nộp chậm ${nguyen(r, 3, 45)} ngày` },
  "k-ttr": { goc: "HE_THONG", ten: "Danh sách rủi ro hệ số K trên TPR", noiDung: (r) => `Hệ số K quý 2/2026 bằng ${(1.2 + r() * 1.4).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}, vượt ngưỡng rà soát` },
  xmhd: { goc: "NNT", ten: "Phiếu đề nghị xác minh hóa đơn của cơ quan thuế khác", noiDung: (r) => `Xác minh ${nguyen(r, 2, 28)} hóa đơn theo đề nghị của Thuế tỉnh ${["Bắc Ninh", "Hưng Yên", "Hải Phòng", "Thái Nguyên", "Nghệ An"][nguyen(r, 0, 4)]}` },
  "cc-han": { goc: "HE_THONG", ten: "Khoản nợ quá hạn 90 ngày trên TMS", noiDung: (r) => `Tiền thuế nợ quá 90 ngày: ${trieu(50 + r() * 4950)} triệu đồng` },
  "cc-cham-dut": { goc: "HE_THONG", ten: "Chứng từ nộp tiền đã hạch toán trên TMS", noiDung: (r) => `Đã nộp đủ ${trieu(50 + r() * 3000)} triệu đồng tiền nợ đang bị cưỡng chế` },
  "thxc-cham-dut": { goc: "HE_THONG", ten: "Chứng từ nộp tiền đã hạch toán trên TMS", noiDung: (r) => `Đã nộp đủ ${trieu(20 + r() * 900)} triệu đồng, đủ điều kiện hủy tạm hoãn xuất cảnh` },
  "tk-ton": { goc: "HE_THONG", ten: "Tờ khai tồn trên trục dữ liệu", noiDung: (r) => `Tờ khai 01/GTGT kỳ tháng ${nguyen(r, 7, 9)}/2026 chưa ghi nhận vào sổ thuế` },
};

export const NHAN_GOC: Record<Goc, string> = { NNT: "Hồ sơ người nộp thuế gửi", HE_THONG: "Phát sinh trên hệ thống" };

export interface BuocXuLy { ten: string; ngay: Date | null; trang: "XONG" | "DANG" | "CHUA" }
export interface ChiTietViec {
  goc: Goc;
  thuTuc: string;
  maHoSo: string;
  ngayNhan: Date;
  kenh: string;
  noiDung: string;
  buoc: BuocXuLy[];
  vanBan: { ten: string; so: string; ngay: Date }[];
}

export function chiTietViec(v: ViecQ): ChiTietViec {
  const r = prng(hatCua(61, "ctviec", v.id));
  const tt = THU_TUC[v.dauViec];
  const ngayNhan = lui(v.han, nguyen(r, 5, 20));
  const kenh = tt.goc === "HE_THONG" ? (v.dauViec === "k-ttr" ? "TPR" : "TMS") : r() < 0.7 ? "Cổng Dịch vụ công" : "Thuế điện tử (eTax)";
  const ten = tt.goc === "NNT"
    ? ["Tiếp nhận hồ sơ", "Phân công cán bộ", "Thẩm định, xử lý", "Trình lãnh đạo duyệt", "Trả kết quả cho NNT"]
    : ["Phát sinh trên hệ thống", "Phân công cán bộ", "Xử lý", "Trình lãnh đạo duyệt", "Ban hành, hoàn tất"];
  /* Bước đang ở: chưa xử lý và đang xử lý cùng đứng ở bước 3, khác nhau ở
     chỗ bước ấy đã bắt đầu chưa. */
  const dangO = v.trangThai === "CHO_DUYET" ? 3 : 2;
  const qua = Math.max(1, Math.round((homNay().getTime() - ngayNhan.getTime()) / 86400000));
  const buoc: BuocXuLy[] = ten.map((t, i) => ({
    ten: t,
    trang: i < dangO ? "XONG" : i === dangO && v.trangThai !== "CHUA" ? "DANG" : "CHUA",
    ngay: i < dangO || (i === dangO && v.trangThai !== "CHUA") ? lui(homNay(), Math.max(0, qua - Math.round((qua * i) / 4))) : null,
  }));
  const kyHieu = ["HS", "BB", "DTQĐ", "CV"];
  const so = nguyen(r, 1200, 9800);
  return {
    goc: tt.goc,
    thuTuc: tt.ten,
    maHoSo: `${tt.goc === "NNT" ? "HS" : "PS"}-2026-${String(so).padStart(6, "0")}`,
    ngayNhan,
    kenh,
    noiDung: tt.noiDung(r),
    buoc,
    vanBan: v.hoSo.map((h, i) => ({ ten: h, so: `${so + i * 7}/${kyHieu[i]}-${v.donVi.replace(/\s+/g, "").slice(0, 8)}`, ngay: lui(homNay(), Math.max(0, qua - i * 2)) })),
  };
}

/* =====================================================================
   2. Biện pháp cưỡng chế
   ===================================================================== */

/*
  Sáu biện pháp áp với người nộp thuế là tổ chức (Luật Quản lý thuế, điều về
  các biện pháp cưỡng chế). Bỏ "khấu trừ một phần tiền lương" — biện pháp áp
  với cá nhân, khối QLDN không quản lý cá nhân kinh doanh.
*/
export const BIEN_PHAP_CC = [
  { id: "tk", ten: "Trích tiền từ tài khoản, phong tỏa tài khoản", ngan: "Trích tài khoản", ty: 0.64 },
  { id: "hd", ten: "Dừng sử dụng hóa đơn", ngan: "Dừng hóa đơn", ty: 0.46 },
  { id: "ben3", ten: "Thu tiền, tài sản khác do bên thứ ba đang giữ", ngan: "Thu qua bên thứ ba", ty: 0.09 },
  { id: "kb", ten: "Kê biên tài sản, bán đấu giá tài sản kê biên", ngan: "Kê biên tài sản", ty: 0.05 },
  { id: "gp", ten: "Thu hồi giấy chứng nhận đăng ký doanh nghiệp, giấy phép", ngan: "Thu hồi giấy phép", ty: 0.03 },
] as const;
export type BienPhapId = (typeof BIEN_PHAP_CC)[number]["id"];

export interface BienPhapTong { id: BienPhapId; ten: string; soNNT: number; dangHieuLuc: number }

/** Số NNT theo từng biện pháp — một NNT có thể đứng ở nhiều dòng. */
export function bienPhapPhamVi(pv: PhamVi): { ds: BienPhapTong[]; soNNT: number; nhieuBienPhap: number } {
  const phan = pv.canBo?.phan ?? 1;
  const ds = BIEN_PHAP_CC.map((b) => ({ id: b.id, ten: b.ten, soNNT: 0, dangHieuLuc: 0 }));
  let soNNT = 0, nhieu = 0;
  for (const d of pv.donVi) {
    const n = doiTuongCua(d.id, phan).no.cuongChe;
    const r = prng(hatCua(67, "bpcc", d.id));
    soNNT += n;
    nhieu += Math.round(n * (0.18 + r() * 0.1));
    BIEN_PHAP_CC.forEach((b, i) => {
      const so = Math.round(n * b.ty * (0.85 + r() * 0.3));
      ds[i].soNNT += so;
      ds[i].dangHieuLuc += Math.round(so * (0.55 + r() * 0.3));
    });
  }
  return { ds, soNNT, nhieuBienPhap: nhieu };
}

export interface CuongCheDN { bienPhap: string; ngan: string; soQD: string; tuNgay: Date; conHieuLuc: boolean }

/** Biện pháp đã áp với MỘT doanh nghiệp — chỉ DN đang nợ mới có. */
export function cuongCheDN(d: DongDN): CuongCheDN[] {
  if (!d.no) return [];
  const r = prng(hatCua(71, "ccdn", d.khoa));
  if (r() > 0.55) return [];
  const ra: CuongCheDN[] = [];
  let ngay = lui(homNay(), nguyen(r, 120, 400));
  for (const b of BIEN_PHAP_CC) {
    /* Biện pháp đầu luôn áp; các biện pháp sau áp tiếp khi biện pháp trước chưa thu đủ. */
    if (ra.length && r() > b.ty) continue;
    ngay = lui(ngay, -nguyen(r, 20, 75));
    if (ngay > homNay()) break;
    ra.push({ bienPhap: b.ten, ngan: b.ngan, soQD: `${nguyen(r, 1000, 9999)}/QĐ-CCTT`, tuNgay: ngay, conHieuLuc: r() < 0.6 });
  }
  return ra;
}

/* =====================================================================
   3. Hồ sơ sức khỏe một doanh nghiệp
   ===================================================================== */

export const NAM_SO_SANH = [2023, 2024, 2025, 2026] as const;

export interface NamDN {
  nam: number;
  /** `false` khi DN chưa thành lập năm ấy — ô hiện "chưa thành lập", không hiện 0. */
  co: boolean;
  thu: number; no: number;
  keKhaiDung: number; keKhaiKy: number;
  soLanPhat: number; tienPhat: number;
  soTTHC: number;
}
export interface PhatDN { ngay: Date; soQD: string; hanhVi: string; tien: number; daNop: boolean }
export interface ThuTucDN { ngay: Date; ten: string; kenh: string; ketQua: string }
export interface HoSoDN {
  nam: NamDN[];
  phat: PhatDN[];
  thuTuc: ThuTucDN[];
  cuongChe: CuongCheDN[];
  dauHieu: string[];
}

const HANH_VI = [
  "Chậm nộp hồ sơ khai thuế",
  "Khai sai dẫn đến thiếu số thuế phải nộp",
  "Lập hóa đơn không đúng thời điểm",
  "Không nộp báo cáo tình hình sử dụng hóa đơn",
  "Chậm thông báo thay đổi thông tin đăng ký thuế",
];
const THU_TUC_DN = [
  "Khai thuế GTGT (mẫu 01/GTGT)", "Quyết toán thuế TNDN (mẫu 03/TNDN)", "Quyết toán thuế TNCN (mẫu 05/QTT-TNCN)",
  "Đề nghị hoàn thuế (mẫu 01/HT)", "Thay đổi thông tin đăng ký thuế (mẫu 08-MST)", "Đề nghị gia hạn nộp thuế",
];
const DAU_HIEU = [
  "Doanh thu kê khai thấp hơn tổng hóa đơn đầu ra",
  "Nợ thuế quá hạn trên 90 ngày",
  "Có hóa đơn đầu vào từ doanh nghiệp bỏ địa chỉ kinh doanh",
  "Nộp chậm tờ khai từ 3 kỳ trở lên trong năm",
  "Lỗ liên tục 3 năm nhưng doanh thu tăng",
  "Đề nghị hoàn thuế GTGT liên tiếp nhiều kỳ",
];

export function hoSoDN(d: DongDN): HoSoDN {
  const r = prng(hatCua(73, "hsdn", d.khoa));
  const conHoatDong = d.trangThai === "HD" || d.trangThai === "MOI";
  /* Mức tuân thủ của riêng DN: kéo cả số lần phạt, kê khai muộn lẫn dấu hiệu
     rủi ro về cùng một hướng, để hồ sơ đọc ra một doanh nghiệp nhất quán. */
  const kem = r() * (d.no ? 1.4 : 0.9) + (conHoatDong ? 0 : 0.5);
  const thuGoc = d.thu2026 ? d.thu2026 / 0.75 : 0.5 + r() * 6;
  const nam: NamDN[] = NAM_SO_SANH.map((n, i) => {
    const co = n >= d.namThanhLap;
    const du = n === 2026 ? 9 : 12;
    const lech = 0.75 + r() * 0.5;
    const tre = Math.min(du, Math.round(kem * (1 + r() * 2)));
    const phat = Math.max(0, Math.round(kem * 1.6 + r() * 1.2 - 0.8));
    return {
      nam: n, co,
      thu: !co ? 0 : n === 2026 ? d.thu2026 : Math.round(thuGoc * lech * (0.85 + i * 0.05) * 100) / 100,
      no: !co ? 0 : n === 2026 ? d.no : Math.round((d.no ? d.no * (0.4 + r() * 0.9) : r() < 0.15 ? r() * 2 : 0) * 100) / 100,
      keKhaiDung: co ? du - tre : 0, keKhaiKy: co ? du : 0,
      soLanPhat: co ? phat : 0,
      tienPhat: co ? phat * Math.round(5 + r() * 40) : 0,
      soTTHC: co ? nguyen(r, 2, 9) : 0,
    };
  });

  const phat: PhatDN[] = [];
  nam.forEach((n) => {
    for (let k = 0; k < n.soLanPhat; k++) {
      const ngay = new Date(n.nam, nguyen(r, 0, n.nam === 2026 ? 8 : 11), nguyen(r, 1, 28));
      phat.push({
        ngay, soQD: `${nguyen(r, 100, 9999)}/QĐ-XPHC`, hanhVi: HANH_VI[nguyen(r, 0, HANH_VI.length - 1)],
        tien: Math.round(n.tienPhat / Math.max(1, n.soLanPhat)), daNop: n.nam < 2026 || r() < 0.6,
      });
    }
  });
  phat.sort((a, b) => b.ngay.getTime() - a.ngay.getTime());

  const thuTuc: ThuTucDN[] = Array.from({ length: conHoatDong ? nguyen(r, 4, 8) : nguyen(r, 1, 3) }, (_, k) => {
    const ngay = lui(homNay(), nguyen(r, 3, 60) + k * nguyen(r, 20, 45));
    const cu = homNay().getTime() - ngay.getTime() > 20 * 86400000;
    return {
      ngay, ten: THU_TUC_DN[nguyen(r, 0, THU_TUC_DN.length - 1)],
      kenh: r() < 0.82 ? "Thuế điện tử (eTax)" : "Cổng Dịch vụ công",
      ketQua: cu ? (r() < 0.9 ? "Đã chấp nhận" : "Không chấp nhận, yêu cầu bổ sung") : "Đang giải quyết",
    };
  }).sort((a, b) => b.ngay.getTime() - a.ngay.getTime());

  const dauHieu = DAU_HIEU.filter((_, k) => (k === 1 ? d.no > 0 && r() < 0.7 : r() < kem * 0.22));
  return { nam, phat, thuTuc, cuongChe: cuongCheDN(d), dauHieu };
}

/* =====================================================================
   4. Phân loại rủi ro của phạm vi
   ===================================================================== */

/*
  Ba mức cao, trung bình, thấp — cùng thang ba mức mà đề án DN360 dẫn (Thông
  tư 94/2026/TT-BTC, Điều 13). Chỉ phân loại doanh nghiệp còn hoạt động.
  Danh sách dấu hiệu dùng lại bộ `DAU_HIEU` của hồ sơ DN; một DN có thể mang
  nhiều dấu hiệu nên cột dấu hiệu không cộng ra số DN.
*/
export type MucRuiRo = "CAO" | "TB" | "THAP";
export const MUC_RUI_RO: { id: MucRuiRo; ten: string }[] = [
  { id: "CAO", ten: "Rủi ro cao" }, { id: "TB", ten: "Rủi ro trung bình" }, { id: "THAP", ten: "Rủi ro thấp" },
];

export function ruiRoPhamVi(pv: PhamVi) {
  const phan = pv.canBo?.phan ?? 1;
  const muc: Record<MucRuiRo, number> = { CAO: 0, TB: 0, THAP: 0 };
  const dauHieu = DAU_HIEU.map((ten) => ({ ten, so: 0 }));
  let tong = 0;
  for (const d of pv.donVi) {
    const o = doiTuongCua(d.id, phan);
    const n = o.trangThai.HD + o.trangThai.MOI;
    const r = prng(hatCua(79, "ruiro", d.id));
    const cao = Math.round(n * (0.04 + r() * 0.04)), tb = Math.round(n * (0.16 + r() * 0.1));
    muc.CAO += cao; muc.TB += tb; muc.THAP += n - cao - tb; tong += n;
    const ty = [0.07, 0.06, 0.025, 0.05, 0.03, 0.015];
    dauHieu.forEach((x, i) => { x.so += Math.round(n * ty[i] * (0.7 + r() * 0.6)); });
  }
  return { tong, muc, dauHieu: dauHieu.sort((a, b) => b.so - a.so) };
}

/* =====================================================================
   5. Xếp hạng cán bộ trong một phòng — CÁCH TÍNH TẠM
   ===================================================================== */

/*
  Chờ các phòng gửi chỉ tiêu đánh giá cán bộ (biên bản 22/10, việc số 2).
  Trong lúc chờ, bản mẫu chấm theo đúng dáng thang điểm của file chấm phòng
  (mỗi chỉ tiêu −1 / 0 / +1, điểm là trung bình), nhưng MỐC là tỷ lệ chung
  của chính phòng ấy: cán bộ tốt hơn mức phòng quá 2 điểm phần trăm được +1,
  kém hơn quá 2 điểm được −1, còn lại 0. Đây là giả định, màn ghi rõ như vậy.

  Bỏ Thu NSNN: cán bộ không có số giao thu (biên bản 09/10 §6), nên không có
  tỷ lệ để so. Nợ (kiểu TANG) so mức tăng nợ — thấp hơn là tốt.
*/
export const NGUONG_CB = 0.02;
const CT_CAN_BO = CHI_TIEU_Q.filter((c) => c.the !== "thu");

export interface DiemChiTieuCB { ct: ChiTieuQ; cb: number | null; phong: number | null; diem: -1 | 0 | 1 }
export interface HangCanBo { id: string; ten: string; diem: number; tren: number; duoi: number; hang: number; chiTiet: DiemChiTieuCB[] }

export function xepHangCanBo(dvId: string, thang: number): HangCanBo[] {
  const dong = canBoCua(dvId).map((cb) => {
    const chiTiet = CT_CAN_BO.map((ct): DiemChiTieuCB => {
      const x = tyLeCua(ct, capCua(ct, dvId, thang, 2026, cb));
      const p = tyLeCua(ct, capCua(ct, dvId, thang));
      if (x === null || p === null) return { ct, cb: x, phong: p, diem: 0 };
      const hon = ct.kieu === "CAO" ? x - p : p - x;
      return { ct, cb: x, phong: p, diem: hon > NGUONG_CB ? 1 : hon < -NGUONG_CB ? -1 : 0 };
    });
    const tren = chiTiet.filter((c) => c.diem > 0).length, duoi = chiTiet.filter((c) => c.diem < 0).length;
    return { id: cb.id, ten: cb.ten, diem: (tren - duoi) / chiTiet.length, tren, duoi, chiTiet };
  });
  /* Bằng điểm thì ít chỉ tiêu dưới mức phòng hơn xếp trên, rồi theo tên —
     không có hai cán bộ cùng hạng, như bảng xếp hạng phòng. */
  return dong
    .sort((a, b) => b.diem - a.diem || a.duoi - b.duoi || a.ten.localeCompare(b.ten, "vi"))
    .map((d, i) => ({ ...d, hang: i + 1 }));
}
