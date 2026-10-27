import { DAY_TCS, PHONG_VP, maCuaTCS, rutGonTenDonVi } from "@/data/danhMuc";
import { BO_TIEU_CHI } from "@/data/boTieuChi";
import { hatCua, mstGia, nguyen, prng, tenCanBoGia, tenNNTGia } from "@/data/ngauNhien";
import type { Phong, VaiTro } from "@/domain/types";

/*
  Không gian làm việc khối QLDN — biên bản 09/10/2026 "Yêu cầu không gian làm
  việc khối QLDN, Thuế TP Hà Nội" (gọi tắt: BB-YC). Ba mô-đun dùng chung tệp
  này: Tổng quan đối tượng (§5), Quản trị công việc (§6), Cảnh báo nhắc việc
  (§7).

  Số liệu là số ĐẶT RA, sinh tất định. BB-YC §2 ghi thẳng "Demo dùng dữ liệu
  mẫu, duyệt UI thì crawl data" — nguồn thật là TMS 2.4.2 (phân công cán bộ)
  và file Excel số giao.
*/

/* ---------- Đơn vị ---------- */

export type Khoi = "VP" | "TCS";
export const NHAN_KHOI: Record<Khoi, string> = { VP: "Khối phòng QLDN", TCS: "Khối thuế cơ sở" };

export interface DonViQ { id: string; ten: string; ngan: string; khoi: Khoi }

export const DON_VI_Q: DonViQ[] = [
  ...PHONG_VP.filter((p) => p.id.startsWith("P")).map((p) => ({ id: p.id, ten: p.ten, ngan: rutGonTenDonVi(p.ten), khoi: "VP" as const })),
  ...DAY_TCS.map((so) => ({
    id: `T${so}`,
    ten: `Thuế cơ sở ${String(so).padStart(2, "0")}`,
    ngan: `TCS ${String(so).padStart(2, "0")} (${maCuaTCS(so).map((c) => c.vietTat).join(", ")})`,
    khoi: "TCS" as const,
  })),
];
export const donViTheoId = (id: string) => DON_VI_Q.find((d) => d.id === id);

/* Quy mô tương đối của đơn vị — phòng QLDN quản lý ít DN nhưng DN lớn. */
const quyMo = (dvId: string) => {
  const r = prng(hatCua(17, "quymo", dvId));
  return dvId.startsWith("P") ? 1 + r() : 0.25 + r() * 0.55;
};

/* ---------- Vai trò và ma trận chỉ số (BB-YC §3, §4) ---------- */

export type VaiQ = "CB" | "PP" | "TP" | "LD";
export const vaiQ = (v: VaiTro): VaiQ | null =>
  v === "CV" ? "CB" : v === "PP" ? "PP" : v === "TP" ? "TP" : v === "LD_TP" ? "LD" : null;
export const NHAN_VAI_Q: Record<VaiQ, string> = { CB: "Cán bộ", PP: "Phó phòng", TP: "Trưởng phòng", LD: "Lãnh đạo Thuế TP" };

/*
  `true` có, `false` không, `"CHO"` là ô "Cần chốt" của ma trận §4. Bản mẫu
  HIỆN ô cần chốt, kèm nhãn "chờ chốt quyền" trên thanh phạm vi, để người
  duyệt thấy được thứ họ đang quyết; ẩn đi thì họ không có gì để quyết.
*/
export type Quyen = boolean | "CHO";
export type ChiSo = "soGiao" | "tyLe" | "binhQuan" | "noTrenThu" | "thuHang" | "uocThu" | "chonDonVi";
export const MA_TRAN: Record<ChiSo, Record<VaiQ, Quyen>> = {
  /* 15/10/2026: cán bộ được xem số giao và tỷ lệ CỦA DN MÌNH được phân công —
     bộ tiêu chí đánh giá bằng tỷ lệ, cán bộ cần thấy đúng con số mình được
     chấm. LỆCH biên bản 09/10 §4 ("cán bộ chỉ số tuyệt đối"); bình quân và
     thứ hạng — phần so với người khác — vẫn ẩn. */
  soGiao: { CB: true, PP: "CHO", TP: true, LD: true },
  tyLe: { CB: true, PP: "CHO", TP: true, LD: true },
  binhQuan: { CB: false, PP: "CHO", TP: true, LD: true },
  /* "Không được xem cột R đến Z" của file Excel = ba chỉ tiêu nợ/thu NSNN. */
  noTrenThu: { CB: false, PP: false, TP: true, LD: true },
  thuHang: { CB: false, PP: "CHO", TP: true, LD: true },
  uocThu: { CB: "CHO", PP: true, TP: true, LD: true },
  /* 15/10/2026: trưởng phòng (và phó phòng) xem được phòng QLDN khác và khối
     thuế cơ sở — chia phòng chỉ là chia số DN quản lý. Lãnh đạo chọn tự do. */
  chonDonVi: { CB: false, PP: true, TP: true, LD: true },
};
export const duocXem = (vai: VaiQ, cs: ChiSo) => MA_TRAN[cs][vai] !== false;
export const NHAN_CHI_SO: Record<ChiSo, string> = {
  soGiao: "số giao", tyLe: "tỷ lệ", binhQuan: "bình quân", noTrenThu: "nợ/thu", thuHang: "thứ hạng", uocThu: "ước thu", chonDonVi: "chọn đơn vị",
};
export const choChotCua = (vai: VaiQ) => (Object.keys(MA_TRAN) as ChiSo[]).filter((cs) => MA_TRAN[cs][vai] === "CHO");

/* ---------- Phạm vi dữ liệu ---------- */

/*
  Cán bộ chỉ thấy DN được phân công trên TMS 2.4.2. Phần DN của một cán bộ là
  một tỷ lệ cố định của đơn vị — đủ để mọi số tuyệt đối của cán bộ nhỏ hơn số
  của phòng mà không phải sinh từng doanh nghiệp.
*/
export interface PhamVi {
  vai: VaiQ;
  donVi: DonViQ[];
  /** Có khi vai là cán bộ: mã cán bộ và phần DN được giao. */
  canBo: { id: string; ten: string; phan: number } | null;
  /** Phòng của người xem khi công tắc đang ở khối thuế cơ sở — để nút quay về còn mang tên phòng. */
  phongGoc?: DonViQ;
}

export const donViCuaPhong = (phong: Phong): DonViQ | null => {
  const so = phong?.match(/^QL(\d)$/)?.[1];
  return so ? donViTheoId(`P${so}`) ?? null : null;
};

export interface CanBoQ { id: string; ten: string; phan: number }
export function canBoCua(dvId: string): CanBoQ[] {
  const r = prng(hatCua(23, "canbo", dvId));
  const n = dvId.startsWith("P") ? nguyen(r, 12, 18) : nguyen(r, 6, 11);
  const trongSo = Array.from({ length: n }, () => 0.6 + r());
  const tong = trongSo.reduce((a, b) => a + b, 0);
  const goc = Number(dvId.replace(/\D/g, "")) * 7;
  return trongSo.map((w, i) => ({ id: `${dvId}-CB${i + 1}`, ten: tenCanBoGia(goc + i), phan: w / tong }));
}

/* ---------- Kỳ ---------- */

export interface KyQ { id: string; nhan: string; thang: number }
export const KY_Q: KyQ[] = [
  { id: "2026-09", nhan: "Tháng 9/2026 · lũy kế từ 01/01", thang: 9 },
  { id: "2026-08", nhan: "Tháng 8/2026 · lũy kế từ 01/01", thang: 8 },
  { id: "2026-07", nhan: "Tháng 7/2026 · lũy kế từ 01/01", thang: 7 },
];
const hatKy = (thang: number, nam = 2026) => nam * 100 + thang;

/* =====================================================================
   MÔ-ĐUN 2 — Quản trị công việc (BB-YC §6)
   ===================================================================== */

/*
  Mười một thẻ theo danh sách §3 mục 2: thu NSNN; nợ; cưỡng chế; tạm hoãn
  xuất cảnh; TTHC tồn; rủi ro và xác minh hóa đơn; hệ số K; xử phạt; giải
  thể, đóng mã; kiểm tra tại bàn; hồ sơ và tỷ lệ hoàn. Hai chỉ tiêu đánh giá
  sự hài lòng đã BỎ (§4).

  Mỗi chỉ tiêu là một cặp tử/mẫu, vì §6 đòi "bình quân chung toàn thuế tính
  trên tổng số liệu của cả 30 đơn vị" — tức Σtử/Σmẫu, không phải trung bình
  các tỷ lệ. Lưu cặp số thì mọi phép gộp (phòng, khối, nhóm đơn vị lãnh đạo
  chọn) đều đúng.

  `kieu`:
  • CAO — tỷ lệ cao là tốt (đã cưỡng chế / phải cưỡng chế).
  • THAP — tỷ lệ thấp là tốt (tồn quá hạn / tổng hồ sơ).
  • TANG — tốc độ tăng của tử so với mẫu, thấp là tốt (nợ nay so nợ đầu năm).
*/
export type TheId = "thu" | "no" | "cc" | "thxc" | "tthc" | "hd" | "k" | "xp" | "gt" | "kttb" | "hoan";
export type Kieu = "CAO" | "THAP" | "TANG";

export interface ChiTieuQ {
  id: string;
  the: TheId;
  ten: string;
  kieu: Kieu;
  /** Nhãn số tuyệt đối (tử) và mẫu số. */
  nhanTu: string;
  nhanMau: string;
  dvt: string;
  /** Mẫu số ở quy mô 1, và khoảng tỷ lệ. */
  mau: [number, number];
  tyLe: [number, number];
  /** Nhãn ngắn trên công tắc khi một nhóm nhỏ có hai chỉ tiêu. */
  ngan?: string;
  /** Ghi chú trạng thái nghiệp vụ, nếu có. */
  ghiChu?: string;
  /** STT của chỉ tiêu trong sheet "0.Bộ tiêu chí đánh giá" — nguồn của công thức hiện trên tiêu đề cột. */
  stt: number;
}

export interface TheQ { id: TheId; ten: string; ngan: string }
export const THE_Q: TheQ[] = [
  { id: "thu", ten: "Thu NSNN", ngan: "Thu NSNN" },
  { id: "no", ten: "Nợ thuế", ngan: "Nợ thuế" },
  { id: "cc", ten: "Cưỡng chế nợ thuế", ngan: "Cưỡng chế" },
  { id: "thxc", ten: "Tạm hoãn xuất cảnh", ngan: "Tạm hoãn XC" },
  { id: "tthc", ten: "Thủ tục hành chính tồn", ngan: "TTHC" },
  { id: "hd", ten: "Rủi ro và xác minh hóa đơn", ngan: "Hóa đơn" },
  { id: "k", ten: "Hệ số K", ngan: "Hệ số K" },
  { id: "xp", ten: "Xử phạt vi phạm hành chính", ngan: "Xử phạt" },
  { id: "gt", ten: "Giải thể, đóng mã", ngan: "Giải thể" },
  { id: "kttb", ten: "Kiểm tra tại bàn", ngan: "KT tại bàn" },
  { id: "hoan", ten: "Hồ sơ hoàn thuế", ngan: "Hoàn thuế" },
];

/*
  Bốn NHÓM LỚN — đúng bốn cột "Tổng điểm trung bình" (màu xanh) của sheet
  "II. Khối QLDN" trong file Bộ tiêu chí đánh giá. Mười một thẻ là nhóm nhỏ
  bên trong; người dùng chọn nhóm lớn trước rồi lọc nhóm nhỏ, như cách file
  Excel xếp cột.
*/
export type NhomId = "thu" | "no" | "tthc" | "qlht" | "kttb" | "hoan";
export interface NhomQ { id: NhomId; ten: string; ngan: string; the: TheId[] }
export const NHOM_Q: NhomQ[] = [
  { id: "thu", ten: "Công tác thu NSNN", ngan: "Thu NSNN", the: ["thu"] },
  { id: "no", ten: "Công tác quản lý nợ", ngan: "Quản lý nợ", the: ["no", "cc", "thxc"] },
  { id: "tthc", ten: "Công tác thủ tục hành chính", ngan: "Thủ tục hành chính", the: ["tthc"] },
  { id: "qlht", ten: "Công tác quản lý, hỗ trợ doanh nghiệp", ngan: "Quản lý, hỗ trợ DN", the: ["hd", "k", "xp", "gt"] },
  /* Phòng thuế yêu cầu 20/10/2026: kiểm tra tại bàn và hoàn thuế mỗi việc một
     mục riêng trên thanh bên, tách khỏi "Quản lý, hỗ trợ DN". Thứ tự vẫn theo
     file chấm điểm: STT 24 rồi 25, 26 — đứng sau nhóm quản lý, hỗ trợ DN. */
  { id: "kttb", ten: "Công tác kiểm tra tại bàn", ngan: "Kiểm tra tại bàn", the: ["kttb"] },
  { id: "hoan", ten: "Công tác hoàn thuế", ngan: "Hoàn thuế", the: ["hoan"] },
];
export const nhomCuaThe = (the: TheId) => NHOM_Q.find((n) => n.the.includes(the))!;

/*
  Công thức của chỉ tiêu, lấy NGUYÊN VĂN cột "Cách tính" của bộ tiêu chí
  (sheet "0.Bộ tiêu chí đánh giá") qua STT — không gõ lại tay, để chữ trên màn
  luôn khớp với file cơ quan ban hành (chốt 15/10/2026). Chỉ bỏ tiền tố "Tỷ lệ
  (%)" thừa và giãn dấu chia cho dễ đọc.
*/
export function congThucCua(ct: ChiTieuQ): string {
  const goc = BO_TIEU_CHI.find((t) => t.stt === ct.stt)?.congThuc ?? `${ct.nhanTu}/${ct.nhanMau}`;
  const gon = goc.replace(/^Tỷ lệ (\(%\) )?/, "").replace(/\s*\/\s*/g, " / ").replace(/ - /g, " − ");
  return gon.charAt(0).toUpperCase() + gon.slice(1);
}

/*
  Tên chỉ tiêu, tử số và mẫu số BÁM NGUYÊN VĂN bộ tiêu chí (chốt 15/10/2026,
  người dùng: "cần bám sát tài liệu cho dễ kiểm soát"): `ten` là cột "Tên chỉ
  tiêu" theo STT, `nhanTu`/`nhanMau` là chữ trong cột "Cách tính". Không dùng
  từ tự đặt như "số giao" — file Excel gọi mẫu số thu là "Số DTPL".
*/
export const CHI_TIEU_Q: ChiTieuQ[] = [
  { id: "thu", stt: 1, the: "thu", ten: "Tỷ lệ số thực thu NSNN", kieu: "CAO", nhanTu: "Số thực thu lũy kế", nhanMau: "Số DTPL", dvt: "tỷ đồng", mau: [9000, 26000], tyLe: [0.72, 0.98] },
  { id: "no", stt: 4, the: "no", ten: "Tỷ lệ nợ tăng/giảm so với đầu năm", kieu: "TANG", nhanTu: "Tổng nợ kỳ báo cáo", nhanMau: "Tổng nợ đầu năm", dvt: "tỷ đồng", mau: [420, 1250], tyLe: [-0.14, 0.3] },
  { id: "cc-n", stt: 9, the: "cc", ngan: "Theo số NNT", ten: "Tỷ lệ số lượng NNT đã thực hiện cưỡng chế/Số lượng phải thực hiện cưỡng chế", kieu: "CAO", nhanTu: "Số lượng NNT đã cưỡng chế + nộp dần + đã đôn đốc nộp", nhanMau: "Số lượng NNT phải thực hiện cưỡng chế", dvt: "NNT", mau: [160, 620], tyLe: [0.55, 0.94] },
  { id: "cc-t", stt: 10, the: "cc", ngan: "Theo số tiền", ten: "Tỷ lệ số tiền đã thực hiện cưỡng chế/Số tiền phải thực hiện cưỡng chế", kieu: "CAO", nhanTu: "Số tiền thuế nợ quá 90N đã cưỡng chế + nộp dần + đã đôn đốc nộp", nhanMau: "Số tiền thuế nợ quá 90N phải thực hiện cưỡng chế", dvt: "tỷ đồng", mau: [180, 900], tyLe: [0.75, 0.99] },
  { id: "thxc-n", stt: 11, the: "thxc", ngan: "Theo số NNT", ten: "Tỷ lệ số lượng NNT đã thực hiện tạm hoãn xuất cảnh/Số lượng phải thực hiện THXC", kieu: "CAO", nhanTu: "Số lượng NNT đã THXC + đã đôn đốc nộp", nhanMau: "Số lượng NNT phải thực hiện THXC", dvt: "NNT", mau: [40, 210], tyLe: [0.3, 0.9] },
  { id: "thxc-t", stt: 12, the: "thxc", ngan: "Theo số tiền", ten: "Tỷ lệ số tiền đã thực hiện tạm hoãn xuất cảnh/Số tiền phải thực hiện THXC", kieu: "CAO", nhanTu: "Số tiền nợ đã THXC + đã đôn đốc nộp", nhanMau: "Số tiền phải thực hiện THXC", dvt: "tỷ đồng", mau: [60, 400], tyLe: [0.84, 1] },
  { id: "tthc", stt: 14, the: "tthc", ten: "Tỷ lệ tồn quá hạn thực hiện TTHC (Đã loại trừ hoàn GTGT và TNCN) theo tháng", kieu: "THAP", nhanTu: "Số TTHC tồn quá hạn", nhanMau: "Số TTHC đã thực hiện", dvt: "hồ sơ", mau: [900, 3200], tyLe: [0, 0.07] },
  { id: "tpr", stt: 17, the: "hd", ngan: "Rà soát TPR", ten: "Rà soát TPR", kieu: "CAO", nhanTu: "NNT đã thực hiện rà soát", nhanMau: "Tổng số NNT phải thực hiện rà soát", dvt: "NNT", mau: [120, 460], tyLe: [0.88, 1] },
  { id: "xmhd", stt: 18, the: "hd", ngan: "Xác minh hóa đơn", ten: "Xác minh hóa đơn", kieu: "CAO", nhanTu: "HĐ đã thực hiện xác minh", nhanMau: "Tổng số HĐ phải thực hiện xác minh", dvt: "hóa đơn", mau: [300, 1600], tyLe: [0.86, 1] },
  { id: "k", stt: 19, the: "k", ten: "Hệ số K", kieu: "CAO", nhanTu: "NNT đã thực hiện rà soát", nhanMau: "Tổng số NNT phải thực hiện rà soát", dvt: "NNT", mau: [90, 380], tyLe: [0.84, 1] },
  { id: "xp", stt: 20, the: "xp", ten: "Xử phạt VPHC", kieu: "CAO", nhanTu: "Số đã xử phạt", nhanMau: "Tổng số phải xử phạt", dvt: "quyết định", mau: [80, 320], tyLe: [0.45, 0.92] },
  { id: "gt-goi", stt: 21, the: "gt", ngan: "Theo gói QLDN3", ten: "Đóng mã giải thể (Không bao gồm đã chuyển kiểm tra tại trụ sở NNT) theo gói của Phòng QLDN3", kieu: "CAO", nhanTu: "Số đã thực hiện", nhanMau: "Tổng số lượng giao", dvt: "NNT", mau: [30, 160], tyLe: [0.3, 0.86] },
  { id: "gt-moi", stt: 22, the: "gt", ngan: "Phát sinh mới", ten: "Đóng mã giải thể (Không bao gồm đã chuyển kiểm tra tại trụ sở NNT) phát sinh mới", kieu: "THAP", nhanTu: "Số tồn quá hạn", nhanMau: "Tổng số hồ sơ phải xử lý", dvt: "hồ sơ", mau: [40, 180], tyLe: [0, 0.14] },
  { id: "kttb", stt: 24, the: "kttb", ten: "Kiểm tra tại bàn", kieu: "CAO", nhanTu: "Số HS đã thực hiện", nhanMau: "Tổng số HS", dvt: "hồ sơ", mau: [220, 820], tyLe: [0.4, 0.95], ghiChu: "KPI kiểm tra tại bàn chờ cơ quan thống nhất cách tính (biên bản demo 09/10, quyết định 5)" },
  { id: "hoan-tncn", stt: 25, the: "hoan", ngan: "Hoàn TNCN", ten: "Hoàn TNCN", kieu: "THAP", nhanTu: "Số tồn quá hạn", nhanMau: "Tổng số hồ sơ tồn", dvt: "hồ sơ", mau: [60, 260], tyLe: [0, 0.1] },
  { id: "hoan-gtgt", stt: 26, the: "hoan", ngan: "Hoàn trước GTGT", ten: "Hoàn trước GTGT", kieu: "THAP", nhanTu: "Số tồn quá hạn", nhanMau: "Tổng số hồ sơ tồn", dvt: "hồ sơ", mau: [20, 120], tyLe: [0, 0.12] },
];
export const chiTieuCuaThe = (the: TheId) => CHI_TIEU_Q.filter((c) => c.the === the);

/** Một cặp tử/mẫu kèm số việc quá hạn (tiêu chí phụ khi xếp hạng bằng nhau). */
export interface Cap { tu: number; mau: number; quaHan: number }
const RONG: Cap = { tu: 0, mau: 0, quaHan: 0 };
const cong = (a: Cap, b: Cap): Cap => ({ tu: a.tu + b.tu, mau: a.mau + b.mau, quaHan: a.quaHan + b.quaHan });

const lam = (x: number, dvt: string) => dvt === "tỷ đồng" ? Math.round(x * 10) / 10 : Math.round(x);

/*
  Một cặp số của một đơn vị ở một tháng. `nam` lùi một năm cho mốc cùng kỳ.
  Cán bộ (`canBo`) lấy phần DN của mình nhân vào cả tử lẫn mẫu, và tỷ lệ dao
  động quanh tỷ lệ của đơn vị.
*/
export function capCua(ct: ChiTieuQ, dvId: string, thang: number, nam = 2026, canBo?: CanBoQ): Cap {
  /*
    Quy mô và tỷ lệ gốc gieo theo NĂM, không theo tháng: số lũy kế phải đi lên
    tháng sau cao hơn tháng trước. Gieo theo tháng thì mỗi tháng là một đơn vị
    khác hẳn, và "so với tháng trước" của cán bộ ra số âm vô nghĩa. Tháng chỉ
    thêm một dao động nhỏ (±2 điểm phần trăm) cho tỷ lệ.
  */
  const r = prng(hatCua(nam, "ct", ct.id, dvId));
  const rt = prng(hatCua(hatKy(thang, nam), "dd", ct.id, dvId));
  const [m0, m1] = ct.mau;
  const [t0, t1] = ct.tyLe;
  /* Thu: số giao là số CẢ NĂM, nên tỷ lệ lũy kế đi lên theo tháng. Các chỉ
     tiêu khác là việc phát sinh lũy kế, nên mẫu số đi lên theo tháng. */
  /* Nợ đầu năm cũng là một số CỐ ĐỊNH trong năm, không lũy kế theo tháng. */
  /* Quy mô (mẫu số) là của ĐƠN VỊ, không của năm: gieo theo năm thì cùng kỳ
     2025 của một phòng là một phòng khác hẳn, và "thu so với cùng kỳ" ra 180%
     (sửa 15/10/2026). Vẫn rút `r()` để giữ nguyên thứ tự dãy — mọi số 2026 và
     mọi tỷ lệ 2025 không đổi. */
  const rMau = r();
  const gocMau = nam === 2026 ? rMau : prng(hatCua(2026, "ct", ct.id, dvId))();
  let mau = (m0 + gocMau * (m1 - m0)) * quyMo(dvId) * (ct.the === "thu" || ct.kieu === "TANG" ? 1 : thang / 9);
  let tyLe = (t0 + r() * (t1 - t0)) * (ct.the === "thu" ? thang / 9 : 1);
  if (ct.the !== "thu") tyLe += (rt() - 0.5) * 0.04 * (ct.kieu === "THAP" ? 0.3 : 1);
  if (nam < 2026) tyLe = ct.kieu === "TANG" ? tyLe * 0.8 : tyLe * (0.9 + r() * 0.12);
  if (canBo) {
    const rc = prng(hatCua(nam, "cb", ct.id, canBo.id));
    mau *= canBo.phan;
    tyLe = ct.kieu === "TANG" ? tyLe + (rc() - 0.5) * 0.12 : tyLe * (0.85 + rc() * 0.3);
  }
  tyLe = ct.kieu === "TANG" ? tyLe : Math.min(1, Math.max(0, tyLe));
  mau = lam(mau, ct.dvt);
  const tu = ct.kieu === "TANG" ? lam(mau * (1 + tyLe), ct.dvt) : lam(mau * tyLe, ct.dvt);
  const quaHan = nguyen(r, 0, ct.kieu === "THAP" ? 2 : 8) * (canBo ? 0 : 1) + Math.round(mau * 0.01);
  return { tu, mau, quaHan };
}

export const tyLeCua = (ct: ChiTieuQ, c: Cap) => {
  if (!c.mau) return null;
  return ct.kieu === "TANG" ? (c.tu - c.mau) / c.mau : c.tu / c.mau;
};

/** Gộp cặp số của một nhóm đơn vị — luôn cộng tử và mẫu rồi mới chia. */
export function capGop(ct: ChiTieuQ, dvIds: string[], thang: number, nam = 2026) {
  return dvIds.reduce((s, id) => cong(s, capCua(ct, id, thang, nam)), RONG);
}

export const TAT_CA_ID = DON_VI_Q.map((d) => d.id);

export interface KetQuaChiTieu {
  ct: ChiTieuQ;
  nay: Cap;
  thangTruoc: Cap;
  cungKy: Cap;
  /** Bình quân chung toàn thuế — Σ30 đơn vị. */
  binhQuan: Cap;
}

/** Cặp số của PHẠM VI đang xem ở ba mốc, cộng bình quân toàn thuế. */
export function ketQuaChiTieu(ct: ChiTieuQ, pv: PhamVi, ky: KyQ): KetQuaChiTieu {
  const ids = pv.donVi.map((d) => d.id);
  const lay = (thang: number, nam = 2026): Cap => {
    if (pv.canBo) return capCua(ct, ids[0], thang, nam, pv.canBo);
    return capGop(ct, ids, thang, nam);
  };
  return {
    ct,
    nay: lay(ky.thang),
    thangTruoc: lay(ky.thang - 1),
    cungKy: lay(ky.thang, 2025),
    binhQuan: capGop(ct, TAT_CA_ID, ky.thang),
  };
}

export interface HangXep { id: string; ten: string; cap: Cap; tyLe: number | null; hang: number }

/*
  Xếp hạng theo tỷ lệ — §6 (đang dùng trong demo, chờ chốt). Chiều tốt đi theo
  `kieu`; bằng nhau thì đơn vị ít việc quá hạn hơn xếp trên.
*/
export function xepHang(ct: ChiTieuQ, dong: { id: string; ten: string; cap: Cap }[]): HangXep[] {
  const tot = ct.kieu === "CAO" ? -1 : 1;
  return dong
    .map((d) => ({ ...d, tyLe: tyLeCua(ct, d.cap) }))
    .sort((a, b) => ((a.tyLe ?? 0) - (b.tyLe ?? 0)) * tot || a.cap.quaHan - b.cap.quaHan)
    .map((d, i) => ({ ...d, hang: i + 1 }));
}

export const theoDonVi = (ct: ChiTieuQ, ds: DonViQ[], thang: number) =>
  ds.map((d) => ({ id: d.id, ten: d.ngan, cap: capCua(ct, d.id, thang) }));

export const theoCanBo = (ct: ChiTieuQ, dvId: string, thang: number) =>
  canBoCua(dvId).map((cb) => ({ id: cb.id, ten: cb.ten, cap: capCua(ct, dvId, thang, 2026, cb) }));

/* ---------- Ước thu (§6: ngày, tuần, tháng) ---------- */

export type NhipUoc = "NGAY" | "TUAN" | "THANG";
export const NHAN_NHIP: Record<NhipUoc, string> = { NGAY: "Hôm nay", TUAN: "Tuần này", THANG: "Tháng này" };

/*
  Ước thu đặt ở đầu tháng; cán bộ muốn biết hôm nay / tuần này / tháng này đã
  thu được bao nhiêu phần trăm số ước. Số ước của ngày và tuần chia đều từ số
  ước tháng theo số ngày làm việc — GIẢ ĐỊNH, chờ nghiệp vụ xác nhận cách
  phân bổ.
*/
export function uocThu(pv: PhamVi, nhip: NhipUoc) {
  const ct = CHI_TIEU_Q[0];
  const ids = pv.donVi.map((d) => d.id);
  let uocThang = 0;
  for (const id of ids) {
    const r = prng(hatCua(20261010, "uoc", id));
    const giao = capCua(ct, id, 9).mau;
    uocThang += (giao / 12) * (0.85 + r() * 0.3) * (pv.canBo ? pv.canBo.phan : 1);
  }
  const phan = nhip === "THANG" ? 1 : nhip === "TUAN" ? 5 / 22 : 1 / 22;
  const r = prng(hatCua(20261012, "thucthu", ids.join(","), nhip, pv.canBo?.id ?? ""));
  const uoc = Math.round(uocThang * phan * 10) / 10;
  /* Tháng mới đi được 8/22 ngày làm việc nên thực thu tháng thấp hơn hẳn ước. */
  const tienDo = nhip === "THANG" ? 0.3 + r() * 0.15 : nhip === "TUAN" ? 0.55 + r() * 0.4 : 0.6 + r() * 0.7;
  return { uoc, thuc: Math.round(uoc * tienDo * 10) / 10 };
}

/* ---------- Biến động nợ (biên bản demo 09/10, mục 2) ---------- */

export function bienDongNo(ds: DonViQ[], ky: KyQ) {
  const ct = CHI_TIEU_Q[1];
  return ds.map((d) => {
    const c = capCua(ct, d.id, ky.thang);
    const truoc = capCua(ct, d.id, ky.thang - 1);
    const thu = capCua(CHI_TIEU_Q[0], d.id, ky.thang).tu;
    return { dv: d, no: c.tu, dauNam: c.mau, thangTruoc: truoc.tu, thu, noTrenThu: thu ? c.tu / thu : null };
  });
}

/* =====================================================================
   MÔ-ĐUN 1 — Tổng quan quản lý đối tượng (BB-YC §5)
   ===================================================================== */

export type TrangThaiDN = "HD" | "MOI" | "TAM_NGUNG" | "NGUNG" | "GIAI_THE" | "DONG_MA";
export const TRANG_THAI_DN: { id: TrangThaiDN; ten: string; ty: [number, number] }[] = [
  { id: "HD", ten: "Đang hoạt động", ty: [0.62, 0.74] },
  { id: "MOI", ten: "Mới thành lập (dưới 12 tháng)", ty: [0.06, 0.1] },
  { id: "TAM_NGUNG", ten: "Tạm ngừng kinh doanh", ty: [0.06, 0.1] },
  { id: "NGUNG", ten: "Ngừng hoạt động, bỏ địa chỉ kinh doanh", ty: [0.05, 0.09] },
  { id: "GIAI_THE", ten: "Đang giải thể", ty: [0.02, 0.04] },
  { id: "DONG_MA", ten: "Đã đóng mã số thuế", ty: [0.03, 0.06] },
];

export const NAM_THANH_LAP = ["Dưới 1 năm", "1–3 năm", "3–5 năm", "5–10 năm", "Trên 10 năm"];
export const QUY_MO_VON = ["Dưới 5 tỷ", "5–10 tỷ", "10–50 tỷ", "50–100 tỷ", "Trên 100 tỷ"];
export const SAC_THUE = ["Thuế GTGT", "Thuế TNDN", "Thuế TNCN", "Phí, lệ phí", "Thu khác"];

function chia(tong: number, trongSo: number[]) {
  const s = trongSo.reduce((a, b) => a + b, 0);
  const ra = trongSo.map((w) => Math.floor((tong * w) / s));
  ra[0] += tong - ra.reduce((a, b) => a + b, 0);
  return ra;
}

export interface DoiTuongDonVi {
  soDN: number;
  soCanBo: number;
  /** Hộ kinh doanh — chỉ thuế cơ sở quản lý (phòng QLDN không có HKD). */
  soHKD: number | null;
  /** Cá nhân nhận tiền lương, tiền công: phòng QLDN cũng có — người làm công
      tại các DN phòng quản lý (biên bản: "trưởng phòng QLDN 1 vào sẽ thấy phòng
      đang quản lý bao nhiêu DN, bao nhiêu cá nhân"). */
  soCaNhan: number | null;
  trangThai: Record<TrangThaiDN, number>;
  namThanhLap: number[];
  quyMoVon: number[];
  thuNam: { nam: string; so: number }[];
  sacThue: number[];
  keKhai: { dungHan: number; muon: number; chua: number };
  /** `tongNoDauNam` cho mốc so sánh của khối nợ (biên bản §2.4: luôn có mốc). */
  no: { soDN: number; tongNo: number; tongNoDauNam: number; cuongChe: number; thxc: number };
}

export function doiTuongCua(dvId: string, phan = 1): DoiTuongDonVi {
  const r = prng(hatCua(31, "doituong", dvId));
  const vp = dvId.startsWith("P");
  const soDN = Math.round((vp ? nguyen(r, 1600, 3200) : nguyen(r, 5200, 11800)) * phan);
  const tt = TRANG_THAI_DN.map((t) => t.ty[0] + r() * (t.ty[1] - t.ty[0]));
  const ttSo = chia(soDN, tt);
  const trangThai = Object.fromEntries(TRANG_THAI_DN.map((t, i) => [t.id, ttSo[i]])) as Record<TrangThaiDN, number>;
  const thu2025 = capCua(CHI_TIEU_Q[0], dvId, 9).mau * (0.92 + r() * 0.1) * phan;
  const keKhaiDung = 0.84 + r() * 0.1, keKhaiMuon = 0.03 + r() * 0.05;
  const hoatDong = trangThai.HD + trangThai.MOI;
  const noCap = capCua(CHI_TIEU_Q[1], dvId, 9);
  const tongNo = noCap.tu * phan;
  return {
    soDN,
    soCanBo: canBoCua(dvId).length,
    soHKD: vp ? null : Math.round(nguyen(r, 7000, 21000) * phan),
    /* Phòng QLDN lấy dãy số riêng: chen thêm một lượt `r()` vào dãy chung sẽ
       làm đổi mọi số đứng sau của phòng — số đã đưa đi trình diễn. */
    soCaNhan: vp ? Math.round(nguyen(prng(hatCua(37, "canhan", dvId)), 42000, 96000) * phan) : Math.round(nguyen(r, 18000, 64000) * phan),
    trangThai,
    namThanhLap: chia(soDN, [0.08 + r() * 0.04, 0.18 + r() * 0.06, 0.16 + r() * 0.05, 0.26 + r() * 0.06, 0.24 + r() * 0.08]),
    quyMoVon: chia(soDN, vp ? [0.3, 0.2, 0.28, 0.1, 0.12] : [0.62, 0.18, 0.14, 0.04, 0.02]),
    thuNam: [
      { nam: "2023", so: Math.round(thu2025 * (0.78 + r() * 0.06)) },
      { nam: "2024", so: Math.round(thu2025 * (0.88 + r() * 0.05)) },
      { nam: "2025", so: Math.round(thu2025) },
      { nam: "2026 (9 tháng)", so: Math.round(capCua(CHI_TIEU_Q[0], dvId, 9).tu * phan) },
    ],
    sacThue: chia(1000, [0.34 + r() * 0.05, 0.2 + r() * 0.05, 0.18 + r() * 0.05, 0.06 + r() * 0.02, 0.06 + r() * 0.03]),
    keKhai: (() => {
      const dung = Math.round(hoatDong * keKhaiDung), muon = Math.round(hoatDong * keKhaiMuon);
      return { dungHan: dung, muon, chua: Math.max(0, hoatDong - dung - muon) };
    })(),
    no: {
      soDN: Math.round(soDN * (0.11 + r() * 0.06)),
      tongNo: Math.round(tongNo * 10) / 10,
      tongNoDauNam: Math.round(noCap.mau * phan * 10) / 10,
      cuongChe: capCua(CHI_TIEU_Q[2], dvId, 9).tu * (phan < 1 ? phan : 1) | 0,
      thxc: capCua(CHI_TIEU_Q[4], dvId, 9).tu * (phan < 1 ? phan : 1) | 0,
    },
  };
}

/** Gộp tổng quan đối tượng của phạm vi. */
export function doiTuongPhamVi(pv: PhamVi): DoiTuongDonVi {
  const ds = pv.donVi.map((d) => doiTuongCua(d.id, pv.canBo?.phan ?? 1));
  const cong2 = (a: number[], b: number[]) => a.map((x, i) => x + b[i]);
  const g = ds.reduce((s, d) => ({
    soDN: s.soDN + d.soDN,
    soCanBo: s.soCanBo + d.soCanBo,
    soHKD: d.soHKD === null ? s.soHKD : (s.soHKD ?? 0) + d.soHKD,
    soCaNhan: d.soCaNhan === null ? s.soCaNhan : (s.soCaNhan ?? 0) + d.soCaNhan,
    trangThai: Object.fromEntries(TRANG_THAI_DN.map((t) => [t.id, s.trangThai[t.id] + d.trangThai[t.id]])) as Record<TrangThaiDN, number>,
    namThanhLap: cong2(s.namThanhLap, d.namThanhLap),
    quyMoVon: cong2(s.quyMoVon, d.quyMoVon),
    thuNam: s.thuNam.map((x, i) => ({ nam: x.nam, so: x.so + d.thuNam[i].so })),
    sacThue: cong2(s.sacThue, d.sacThue),
    keKhai: { dungHan: s.keKhai.dungHan + d.keKhai.dungHan, muon: s.keKhai.muon + d.keKhai.muon, chua: s.keKhai.chua + d.keKhai.chua },
    no: { soDN: s.no.soDN + d.no.soDN, tongNo: Math.round((s.no.tongNo + d.no.tongNo) * 10) / 10, tongNoDauNam: Math.round((s.no.tongNoDauNam + d.no.tongNoDauNam) * 10) / 10, cuongChe: s.no.cuongChe + d.no.cuongChe, thxc: s.no.thxc + d.no.thxc },
  }));
  /* Cơ cấu sắc thuế là phần nghìn, nên phải chia lại theo số đơn vị gộp. */
  return { ...g, sacThue: g.sacThue.map((x) => x / ds.length) };
}

/* ---------- Danh sách doanh nghiệp (tầng chi tiết của mô-đun 1) ---------- */

export interface DongDN {
  /** Khóa dựng lại được dòng này mà không cần trang chứa nó — cho `so=` của ngăn hồ sơ. */
  khoa: string;
  mst: string; ten: string; donVi: string; canBo: string; trangThai: TrangThaiDN;
  namThanhLap: number; von: number; thu2026: number; no: number;
}

/*
  Không sinh hết hàng chục nghìn DN: trang thứ p của trạng thái s chỉ dựng
  đúng các dòng của trang ấy, bằng chỉ số toàn cục → (đơn vị, thứ tự).
*/
export function trangDN(pv: PhamVi, trangThai: TrangThaiDN | null, trang: number, coTrang: number) {
  const phan = pv.canBo?.phan ?? 1;
  const khoi = pv.donVi.map((d) => {
    const o = doiTuongCua(d.id, phan);
    return { d, so: trangThai ? o.trangThai[trangThai] : o.soDN, o };
  });
  const tong = khoi.reduce((s, k) => s + k.so, 0);
  const dong: DongDN[] = [];
  let i = (trang - 1) * coTrang;
  const het = Math.min(tong, i + coTrang);
  for (; i < het; i++) {
    let j = i, k = 0;
    while (j >= khoi[k].so) { j -= khoi[k].so; k++; }
    dong.push(dungDN(pv, khoi[k].d, khoi[k].o, trangThai, j));
  }
  return { tong, dong };
}

/*
  Một dòng của danh sách, dựng từ (đơn vị, bộ lọc trạng thái, thứ tự trong
  đơn vị). Giữ nguyên cách gieo của bản trước — cùng hạt, cùng thứ tự rút
  `r()` — nên mọi dòng đã đưa đi trình diễn không đổi số.

  Lưu ý có sẵn từ trước: dòng dựng khi ĐANG LỌC theo trạng thái gieo theo thứ
  tự trong trạng thái ấy, nên cùng một vị trí cho ra doanh nghiệp khác với khi
  không lọc. Khóa vì thế mang cả bộ lọc.
*/
function dungDN(pv: PhamVi, d: DonViQ, o: DoiTuongDonVi, loc: TrangThaiDN | null, j: number): DongDN {
  let tt: TrangThaiDN = loc ?? "HD";
  if (!loc) {
    let con = j;
    for (const t of TRANG_THAI_DN) { if (con < o.trangThai[t.id]) { tt = t.id; break; } con -= o.trangThai[t.id]; }
  }
  const r = prng(hatCua(41, "dn", d.id, tt, String(j)));
  const so = Number(d.id.replace(/\D/g, "")) * 100000 + j + TRANG_THAI_DN.findIndex((t) => t.id === tt) * 20000;
  const cb = pv.canBo ?? canBoCua(d.id)[Math.floor(r() * canBoCua(d.id).length)];
  const moi = tt === "MOI";
  return {
    khoa: `${d.id}.${loc ?? "all"}.${j}`,
    mst: mstGia(so), ten: tenNNTGia(so), donVi: d.ngan, canBo: cb.ten, trangThai: tt,
    namThanhLap: moi ? 2026 : 2026 - nguyen(r, 1, 24),
    von: Math.round((d.khoi === "VP" ? 5 + r() * 400 : 0.5 + r() * 30) * 10) / 10,
    thu2026: tt === "HD" || moi ? Math.round(r() * (d.khoi === "VP" ? 120 : 8) * 100) / 100 : 0,
    no: r() < 0.14 ? Math.round(r() * (d.khoi === "VP" ? 40 : 3) * 100) / 100 : 0,
  };
}

/** Dựng lại một dòng từ khóa của nó; `null` khi khóa không thuộc phạm vi đang xem. */
export function dnTheoKhoa(pv: PhamVi, khoa: string): DongDN | null {
  const [dvId, loc, so] = khoa.split(".");
  const d = pv.donVi.find((x) => x.id === dvId);
  const j = Number(so);
  if (!d || !Number.isInteger(j) || j < 0) return null;
  const tt = loc === "all" ? null : TRANG_THAI_DN.find((t) => t.id === loc)?.id;
  if (tt === undefined) return null;
  const o = doiTuongCua(d.id, pv.canBo?.phan ?? 1);
  if (j >= (tt ? o.trangThai[tt] : o.soDN)) return null;
  return dungDN(pv, d, o, tt, j);
}

/* =====================================================================
   MÔ-ĐUN 3 — Cảnh báo nhắc việc (BB-YC §7)
   ===================================================================== */

export const DAU_VIEC = [
  { id: "hoan-gtgt", ten: "Hoàn thuế GTGT", noiDung: ["Giải quyết hồ sơ đề nghị hoàn thuế GTGT", "Ban hành quyết định hoàn thuế GTGT"] },
  { id: "hoan-tncn", ten: "Hoàn thuế TNCN", noiDung: ["Giải quyết hồ sơ hoàn thuế TNCN", "Trả kết quả hoàn thuế TNCN"] },
  { id: "dvc", ten: "Thủ tục hành chính trên Dịch vụ công", noiDung: ["Trả kết quả hồ sơ TTHC trên Dịch vụ công", "Xử lý hồ sơ đăng ký thay đổi thông tin"] },
  { id: "xp-tk", ten: "Xử phạt vi phạm về tờ khai", noiDung: ["Lập biên bản vi phạm nộp chậm tờ khai", "Ban hành quyết định xử phạt tờ khai"] },
  { id: "k-ttr", ten: "Hệ số K, TTR", noiDung: ["Rà soát doanh nghiệp có hệ số K vượt ngưỡng", "Gửi thông báo giải trình TTR"] },
  { id: "xmhd", ten: "Xác minh hóa đơn", noiDung: ["Trả lời phiếu xác minh hóa đơn", "Xác minh hóa đơn theo đề nghị của cơ quan khác"] },
  { id: "cc-han", ten: "Danh sách cưỡng chế đến hạn hôm nay", noiDung: ["Ban hành quyết định cưỡng chế trích tiền tài khoản", "Ban hành quyết định cưỡng chế ngừng sử dụng hóa đơn"] },
  { id: "cc-cham-dut", ten: "NNT cần chấm dứt cưỡng chế ngay", noiDung: ["Chấm dứt cưỡng chế do đã nộp đủ tiền nợ"] },
  { id: "thxc-cham-dut", ten: "NNT cần chấm dứt tạm hoãn xuất cảnh", noiDung: ["Đề nghị hủy tạm hoãn xuất cảnh do đã nộp đủ"] },
  { id: "tk-ton", ten: "Tờ khai tồn trục cần xử lý", noiDung: ["Xử lý tờ khai tồn trên trục, chưa ghi sổ thuế"] },
] as const;
export type DauViecId = (typeof DAU_VIEC)[number]["id"];

export type MucCanhBao = "QUA_HAN" | "HOM_NAY" | "SAP_DEN";
export const NHAN_MUC: Record<MucCanhBao, string> = { QUA_HAN: "Đã quá hạn", HOM_NAY: "Hết hạn hôm nay", SAP_DEN: "Sắp đến hạn" };

/*
  Trạng thái xử lý của một việc (biên bản 22/10/2026: "chi tiết các đầu việc
  theo danh mục, trạng thái"). Ba bước nằm TRONG cơ quan thuế; bước trả kết
  quả đã xong thì việc không còn là cảnh báo nên không có trạng thái riêng.
*/
export type TrangThaiViec = "CHUA" | "DANG" | "CHO_DUYET";
export const TRANG_THAI_VIEC: { id: TrangThaiViec; ten: string }[] = [
  { id: "CHUA", ten: "Chưa xử lý" },
  { id: "DANG", ten: "Đang xử lý" },
  { id: "CHO_DUYET", ten: "Chờ lãnh đạo duyệt" },
];

export interface ViecQ {
  id: string; dauViec: DauViecId; dvId: string; donVi: string; canBoId: string; canBo: string;
  mst: string; nnt: string; noiDung: string; han: Date; hoSo: string[]; trangThai: TrangThaiViec;
}

const homNay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const soNgay = (han: Date) => Math.round((han.getTime() - homNay().getTime()) / 86400000);

/*
  Việc sinh theo hạn TƯƠNG ĐỐI với hôm nay, để bản mẫu mở ngày nào cũng có đủ
  ba mức. Mỗi đầu việc ở mỗi đơn vị có thể không phát sinh việc nào — đúng
  trường hợp §7 bắt ghi "Không phát sinh trong ngày".
*/
export function viecCua(dvId: string): ViecQ[] {
  const d = donViTheoId(dvId)!;
  const ds = canBoCua(dvId);
  const ra: ViecQ[] = [];
  for (const dv of DAU_VIEC) {
    const r = prng(hatCua(53, "viec", dvId, dv.id));
    const n = r() < 0.22 ? 0 : nguyen(r, 1, d.khoi === "VP" ? 7 : 4);
    for (let i = 0; i < n; i++) {
      const cb = ds[Math.floor(r() * ds.length)];
      const han = homNay();
      han.setDate(han.getDate() + nguyen(r, -6, 12));
      const so = Number(dvId.replace(/\D/g, "")) * 1000 + DAU_VIEC.indexOf(dv) * 50 + i + (d.khoi === "VP" ? 0 : 500000);
      const soHoSo = nguyen(r, 0, 3);
      ra.push({
        id: `${dvId}-${dv.id}-${i}`, dauViec: dv.id, dvId, donVi: d.ngan, canBoId: cb.id, canBo: cb.ten,
        mst: mstGia(so), nnt: tenNNTGia(so), noiDung: dv.noiDung[i % dv.noiDung.length], han,
        hoSo: ["Hồ sơ đề nghị của NNT", "Biên bản làm việc", "Dự thảo quyết định", "Văn bản đôn đốc"].slice(0, soHoSo),
        /* Dãy riêng: rút thêm từ `r` sẽ đổi hạn và tên của mọi việc đứng sau. */
        trangThai: (() => { const x = prng(hatCua(59, "ttviec", dvId, dv.id, String(i)))(); return x < 0.45 ? "CHUA" : x < 0.8 ? "DANG" : "CHO_DUYET"; })(),
      });
    }
  }
  return ra;
}

export function mucCua(v: ViecQ, baoTruoc: number): MucCanhBao | null {
  const n = soNgay(v.han);
  if (n < 0) return "QUA_HAN";
  if (n === 0) return "HOM_NAY";
  return n <= baoTruoc ? "SAP_DEN" : null;
}

/** Việc trong phạm vi: cán bộ chỉ việc của mình, phòng việc của phòng. */
export function viecPhamVi(pv: PhamVi): ViecQ[] {
  if (pv.canBo) {
    /* Cán bộ demo đứng tên cán bộ đầu tiên của phòng — xem `phamViCua`. */
    const dvId = pv.donVi[0].id;
    return viecCua(dvId).filter((v, i) => v.canBoId === pv.canBo!.id || i % 2 === 0).map((v) => ({ ...v, canBoId: pv.canBo!.id, canBo: pv.canBo!.ten }));
  }
  return pv.donVi.flatMap((d) => viecCua(d.id));
}

/* ---------- Phạm vi theo người dùng ---------- */

export function phamViCua(user: { phong: Phong; vaiTro: VaiTro; name: string }, chonLD: string[]): PhamVi | null {
  const vai = vaiQ(user.vaiTro);
  if (!vai) return null;
  if (vai === "LD") {
    const ds = (chonLD.length ? chonLD : TAT_CA_ID).map(donViTheoId).filter((d): d is DonViQ => Boolean(d));
    return { vai, donVi: ds, canBo: null };
  }
  const dv = donViCuaPhong(user.phong);
  if (!dv) return null;
  if (vai === "CB") {
    const cb = canBoCua(dv.id)[0];
    return { vai, donVi: [dv], canBo: { id: cb.id, ten: user.name, phan: cb.phan } };
  }
  return { vai, donVi: [dv], canBo: null };
}

export const nhanPhamVi = (pv: PhamVi) => {
  if (pv.canBo) return `DN được phân công · ${pv.donVi[0].ngan}`;
  if (pv.vai !== "LD") return pv.donVi.length > 1 ? NHAN_KHOI[pv.donVi[0].khoi] : pv.donVi[0].ngan;
  if (pv.donVi.length === DON_VI_Q.length) return "Toàn thành phố";
  const khoi = (["VP", "TCS"] as Khoi[]).find((k) => {
    const cua = DON_VI_Q.filter((d) => d.khoi === k);
    return cua.length === pv.donVi.length && cua.every((d) => pv.donVi.includes(d));
  });
  if (khoi) return NHAN_KHOI[khoi];
  return pv.donVi.length === 1 ? pv.donVi[0].ngan : `${pv.donVi.length} đơn vị`;
};
