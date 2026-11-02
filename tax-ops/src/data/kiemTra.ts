import { hatCua, prng } from "@/data/ngauNhien";

/*
  Kiểm tra tại trụ sở NNT — tab thứ hai của mục "Phòng kiểm tra" (30/10/2026).

  CẤU TRÚC lấy từ mẫu "Đầu ra - Biểu excel báo cáo.xlsx", sheet "Chi tiet
  TTKT" (thư mục 30-10): ba tầng dòng Toàn ngành › Khối VP Thuế TP (năm
  Phòng Kiểm tra cùng Phòng QLHKD cá nhân và thu khác) › Khối Thuế cơ sở (25
  đơn vị, mang mã CQT của mẫu), và hai phần cột — chung (D–S) và kế hoạch đích
  danh KH2026 (T–AF). CÁCH TÍNH theo công thức trong chính tệp mẫu và biên
  bản họp Phòng Kiểm tra 20/10/2026 §4.3.

  SỐ LIỆU: mô phỏng tất định. Tệp mẫu chứa số thật của Cục; KHÔNG con số nào
  ở đây chép từ đó (The Mockup Uses Only Fake Data Rule) — chỉ tên, mã đơn vị
  và thứ tự dòng. Quy mô đặt theo biên bản §3.1: Phòng Kiểm tra cỡ 300 cuộc
  tới quý III, bình quân khoảng 1–1,7 tỷ đồng một cuộc; Thuế cơ sở nhỏ hơn.

  Tiền tính bằng TRIỆU ĐỒNG trong dữ liệu; màn hiển thị tỷ đồng.
*/

export type KhoiKT = "VP" | "TCS";
export interface DonViKT {
  id: string;
  /** Mã CQT theo cột B của mẫu. */
  ma: string;
  ten: string;
  khoi: KhoiKT;
  /** Phòng Kiểm tra số mấy (1–5); không có với Phòng QLHKD và Thuế cơ sở. */
  so?: number;
  /** Phòng QLHKD không có chỉ tiêu nhiệm vụ và kế hoạch đích danh trong mẫu. */
  coChiTieu: boolean;
}

const TCS: [string, string][] = [
  ["10101", "Thuế cơ sở 2 - Ba Đình"], ["10103", "Thuế cơ sở 7 - Tây Hồ"], ["10105", "Thuế cơ sở 1 - Hoàn Kiếm"],
  ["10106", "Thuế cơ sở 11 - Long Biên"], ["10107", "Thuế cơ sở 3 - Hai Bà Trưng"], ["10108", "Thuế cơ sở 13 - Hoàng Mai"],
  ["10109", "Thuế cơ sở 4 - Đống Đa"], ["10111", "Thuế cơ sở 6 - Thanh Xuân"], ["10113", "Thuế cơ sở 5 - Cầu Giấy"],
  ["10115", "Thuế cơ sở 18 - Sóc Sơn - Mê Linh"], ["10117", "Thuế cơ sở 10 - Đông Anh"], ["10119", "Thuế cơ sở 12 - Gia Lâm"],
  ["10155", "Thuế cơ sở 8 - Nam Từ Liêm"], ["10157", "Thuế cơ sở 9 - Bắc Từ Liêm"], ["10123", "Thuế cơ sở 14 - Thanh Trì"],
  ["10127", "Thuế cơ sở 15 - Hà Đông"], ["10129", "Thuế cơ sở 16 - Sơn Tây"], ["10151", "Thuế cơ sở 17 - Ba Vì"],
  ["10131", "Thuế cơ sở 25 - Phúc Thọ"], ["10133", "Thuế cơ sở 24 - Đan Phượng"], ["10135", "Thuế cơ sở 22 - Thạch Thất - Quốc Oai"],
  ["10137", "Thuế cơ sở 23 - Hoài Đức"], ["10153", "Thuế cơ sở 21 - Thanh Oai - Chương Mỹ"], ["10143", "Thuế cơ sở 19 - Thường Tín - Phú Xuyên"],
  ["10147", "Thuế cơ sở 20 - Ứng Hòa - Mỹ Đức"],
];

/** Thứ tự dòng theo mẫu. */
export const DON_VI_KT: DonViKT[] = [
  ...[1, 2, 3, 4, 5].map((so) => ({ id: `KT${so}`, ma: `10100Q${so + 2}`, ten: `Phòng Kiểm tra số ${so}`, khoi: "VP" as const, so, coChiTieu: true })),
  { id: "QLHKD", ma: "10100P6", ten: "Phòng QLHKD cá nhân và thu khác", khoi: "VP", coChiTieu: false },
  ...TCS.map(([ma, ten]) => ({ id: `C${ma}`, ma, ten, khoi: "TCS" as const, coChiTieu: true })),
];
export const PHONG_KT = DON_VI_KT.filter((d) => d.so);
export const NHAN_KHOI_KT: Record<KhoiKT, string> = { VP: "Khối VP Thuế TP", TCS: "Khối Thuế cơ sở" };

/** Phạm vi đọc số: toàn ngành, một khối, hoặc một đơn vị. */
export type PhamViKT = "TN" | KhoiKT | string;
export const tenPhamViKT = (id: PhamViKT) => (id === "TN" ? "Toàn ngành" : id === "VP" || id === "TCS" ? NHAN_KHOI_KT[id] : DON_VI_KT.find((d) => d.id === id)?.ten ?? "Toàn ngành");

/* ---------- Loại hình cuộc kiểm tra (tài liệu 30-10, Bảng 4) ---------- */

export type LoaiHinh = "dichDanh" | "giaiThe" | "truocHoan" | "sauHoan" | "chuyenDe" | "khac";
export const LOAI_HINH: { id: LoaiHinh; nhan: string }[] = [
  { id: "dichDanh", nhan: "KH2026 (đích danh)" },
  { id: "giaiThe", nhan: "Giải thể, chuyển địa điểm" },
  { id: "truocHoan", nhan: "Trước hoàn" },
  { id: "sauHoan", nhan: "Sau hoàn" },
  { id: "chuyenDe", nhan: "Chuyên đề" },
  { id: "khac", nhan: "Khác" },
];

/* ---------- Bộ chỉ số ---------- */

/*
  Một bộ dùng cho cả phần chung và phần đích danh của mẫu:
  chung     — D giao · F htTruoc · G htNay · H coTruyThu · K thuTruoc · L thuNay
              · M giamKT · N giamLo · Q nop  (R nợ đọng = L − Q)
  đích danh — T giao · AA htTruoc · V htNay · W thuNay · X giamKT · Y giamLo · AD nop
  `doDang` không có trong mẫu Excel; nó là cột (14) của tài liệu mô tả.
*/
export interface ChiSoKT {
  giao: number;
  htTruoc: number;
  htNay: number;
  coTruyThu: number;
  thuTruoc: number;
  thuNay: number;
  giamKT: number;
  giamLo: number;
  nop: number;
  doDang: number;
}
export interface SoLieuKT { chung: ChiSoKT; dichDanh: ChiSoKT; loai: Record<LoaiHinh, number> }

/* Nhịp lũy kế: cuộc chung rải đều cả năm; cuộc đích danh tháng 1–4 gần như
   chưa có (làm cuộc tồn năm trước), dồn từ tháng 5 tới cuối năm (§3.1). */
const nhipChung = (thang: number) => Math.pow(thang / 12, 1.05);
const nhipDichDanh = (thang: number) => (thang <= 4 ? 0.02 * thang : 0.08 + 0.92 * Math.pow((thang - 4) / 8, 1.1));

/** Chia `tong` theo tỷ trọng, phần dư theo số lẻ lớn nhất — tổng luôn khớp. */
function chiaNguyen(tong: number, ty: number[]): number[] {
  const s = ty.reduce((a, b) => a + b, 0);
  const tho = ty.map((t) => (tong * t) / s);
  const out = tho.map(Math.floor);
  let du = tong - out.reduce((a, b) => a + b, 0);
  tho.map((t, i) => ({ i, le: t - Math.floor(t) })).sort((a, b) => b.le - a.le).forEach(({ i }) => { if (du > 0) { out[i]++; du--; } });
  return out;
}

const KHONG: ChiSoKT = { giao: 0, htTruoc: 0, htNay: 0, coTruyThu: 0, thuTruoc: 0, thuNay: 0, giamKT: 0, giamLo: 0, nop: 0, doDang: 0 };
const CACHE = new Map<string, SoLieuKT>();

function soLieuDonVi(d: DonViKT, thang: number): SoLieuKT {
  const khoa = `${d.id}|${thang}`;
  const co = CACHE.get(khoa);
  if (co) return co;
  const g = prng(hatCua(2026, "ktts", d.id));
  const r = prng(hatCua(2026 * 100 + thang, "ktts-ky", d.id));
  const phong = Boolean(d.so);
  /* Quy mô cả năm của đơn vị. Phòng QLHKD không có chỉ tiêu: chỉ có số hoàn thành. */
  const giao = !d.coChiTieu ? 0 : phong ? 300 + Math.round(g() * 30) : 80 + Math.round(g() * 840);
  const nam = d.coChiTieu ? giao * (0.95 + g() * 0.3) : 80 + g() * 30;
  const namTruoc = nam * (0.62 + g() * 0.32);
  const kh = d.coChiTieu ? Math.round(giao * (0.85 + g() * 0.06)) : 0;
  const bq = phong ? 750 + g() * 950 : d.coChiTieu ? 90 + g() * 330 : 200 + g() * 60;
  const bqTruoc = bq * (0.65 + g() * 0.35);
  const tyGiamKT = 0.02 + g() * 0.12;
  const tyGiamLo = 0.3 + g() * 1.6;
  const tyNop = 0.86 + g() * 0.13;
  const tyCoThu = 0.8 + g() * 0.18;
  const ddNam = kh * (0.45 + g() * 0.35);
  const ddNamTruoc = ddNam * (0.35 + g() * 0.5);
  const chia = [0.32 + g() * 0.12, 0.12 + g() * 0.08, 0.18 + g() * 0.08, 0.14 + g() * 0.1, 0.08 + g() * 0.08];

  const htNay = Math.round(nam * nhipChung(thang));
  const htTruoc = Math.round(namTruoc * nhipChung(thang));
  const thuNay = htNay * bq * (0.95 + r() * 0.1);
  const ddNay = Math.min(htNay, Math.round(ddNam * nhipDichDanh(thang)));
  const ddTruoc = Math.round(ddNamTruoc * nhipDichDanh(thang));
  const ddThu = ddNay * bq * (1 + r() * 0.25);
  const doDang = d.coChiTieu ? Math.round((phong ? 20 + g() * 40 : 4 + g() * 30) * (0.7 + r() * 0.5)) : 0;
  const chung: ChiSoKT = {
    giao, htTruoc, htNay, coTruyThu: Math.round(htNay * tyCoThu),
    thuTruoc: htTruoc * bqTruoc, thuNay, giamKT: thuNay * tyGiamKT, giamLo: thuNay * tyGiamLo,
    nop: thuNay * tyNop, doDang,
  };
  const dichDanh: ChiSoKT = !d.coChiTieu ? KHONG : {
    giao: kh, htTruoc: ddTruoc, htNay: ddNay, coTruyThu: Math.round(ddNay * tyCoThu),
    thuTruoc: ddTruoc * bqTruoc, thuNay: ddThu, giamKT: ddThu * tyGiamKT, giamLo: ddThu * tyGiamLo,
    nop: ddThu * (tyNop - 0.02), doDang: Math.round(doDang * 0.45),
  };
  const [giaiThe, truocHoan, sauHoan, chuyenDe, khac] = chiaNguyen(htNay - ddNay, chia);
  const kq: SoLieuKT = { chung, dichDanh, loai: { dichDanh: ddNay, giaiThe, truocHoan, sauHoan, chuyenDe, khac } };
  CACHE.set(khoa, kq);
  return kq;
}

const congChiSo = (ds: ChiSoKT[]): ChiSoKT => {
  const out = { ...KHONG };
  for (const c of ds) for (const k of Object.keys(out) as (keyof ChiSoKT)[]) out[k] += c[k];
  return out;
};
const congSoLieu = (ds: SoLieuKT[]): SoLieuKT => ({
  chung: congChiSo(ds.map((d) => d.chung)),
  dichDanh: congChiSo(ds.map((d) => d.dichDanh)),
  loai: Object.fromEntries(LOAI_HINH.map(({ id }) => [id, ds.reduce((s, d) => s + d.loai[id], 0)])) as Record<LoaiHinh, number>,
});

/** Số liệu lũy kế tới hết `thang`. Khối và toàn ngành là phép cộng các đơn vị, như công thức SUM của mẫu. */
export function soLieuKT(pv: PhamViKT, thang: number): SoLieuKT {
  if (pv === "TN") return congSoLieu(DON_VI_KT.map((d) => soLieuDonVi(d, thang)));
  if (pv === "VP" || pv === "TCS") return congSoLieu(DON_VI_KT.filter((d) => d.khoi === pv).map((d) => soLieuDonVi(d, thang)));
  const d = DON_VI_KT.find((x) => x.id === pv);
  return d ? soLieuDonVi(d, thang) : soLieuKT("TN", thang);
}

/* ---------- Tỷ lệ — một chỗ tính, theo công thức của mẫu ---------- */

const chia = (a: number, b: number) => (b ? a / b : null);
/** J = G/D (chung) · Z = V/T (đích danh). */
export const tyLeHT = (c: ChiSoKT) => chia(c.htNay, c.giao);
/** I = G/F · AC = V/AA. */
export const ssCungKySo = (c: ChiSoKT) => chia(c.htNay, c.htTruoc);
/** O = L/G · AB = W/V. */
export const binhQuan = (c: ChiSoKT) => chia(c.thuNay, c.htNay);
export const binhQuanTruoc = (c: ChiSoKT) => chia(c.thuTruoc, c.htTruoc);
/** P = L/K. */
export const ssCungKyThu = (c: ChiSoKT) => chia(c.thuNay, c.thuTruoc);
/** R = L − Q (biên bản §4.3). */
export const noDong = (c: ChiSoKT) => c.thuNay - c.nop;
/** S = Q/L · AF = AD/W. */
export const tyLeDonDoc = (c: ChiSoKT) => chia(c.nop, c.thuNay);
