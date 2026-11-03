import { maCuaTCS } from "@/data/danhMuc";
import { hatCua, mstGia, nguyen, prng, tenNNTGia } from "@/data/ngauNhien";
import { CHI_TIEU_Q, DON_VI_Q, capCua, type DonViQ } from "@/data/qldn";

/*
  Quản lý kê khai — bốn báo cáo của Phòng QLDN5 (QL5), folder 02-11:
  "Nghiệp vụ XPHC, kê khai, DVC và TKTT" và "Nghiệp vụ nộp thừa" (cập nhật
  28/10/2026), cùng các mẫu Excel trong `general_data/QL5`.

  • Xử phạt VPHC — mẫu "TONG HOP BAO CAO XPVPHC", sheet TONG HOP.
  • Đóng mã, giải thể — mẫu "BC dong MST", sheet Tuan2_thang9.
  • Tờ khai tồn trục — TMS 3.2.3.2 / 3.2.3.3; tài liệu ghi "chưa có mẫu Excel".
  • Nộp thừa — mẫu "Nop thua" (báo cáo trung gian), danh sách >1 tỷ / >10
    triệu và nhận xét hai tháng.

  MỌI con số là số ĐẶT RA, sinh tất định. Mẫu Excel có số thật — chỉ lấy cấu
  trúc cột, tên đơn vị và mã CQT, không lấy số.

  Hai bảng của tab cũ BÁM số chỉ tiêu đang hiện ở cùng tab (`capCua`): một
  tab không được nói hai con số "phải xử phạt" khác nhau.
*/

const ctCua = (id: string) => CHI_TIEU_Q.find((c) => c.id === id)!;
const tron = Math.round;

/* ---------- Xử phạt VPHC (mẫu TONG HOP, cột C–I) ---------- */

export interface SoXP { phai: number; qd: number; canhCao: number }
export const daXP = (s: SoXP) => s.qd + s.canhCao;

/** Tử/mẫu của chỉ tiêu 20 — "Số đã xử phạt / Tổng số phải xử phạt" — tách đã xử phạt thành quyết định phạt và cảnh cáo. */
export function soXP(dvId: string, thang: number): SoXP {
  const c = capCua(ctCua("xp"), dvId, thang);
  const r = prng(hatCua(thang, "ql5-xp", dvId));
  const canhCao = tron(c.tu * r() * 0.03);
  return { phai: c.mau, qd: c.tu - canhCao, canhCao };
}
export const congXP = (ids: string[], thang: number): SoXP => ids.map((id) => soXP(id, thang))
  .reduce((a, b) => ({ phai: a.phai + b.phai, qd: a.qd + b.qd, canhCao: a.canhCao + b.canhCao }), { phai: 0, qd: 0, canhCao: 0 });

/* ---------- Đóng mã, giải thể (mẫu BC dong MST, cột C–L) ---------- */

/*
  Kỳ của mẫu tính TỪ 01/04/2026 (P_DONGMST_TU) đến ngày báo cáo. Tổng phải
  xử lý = tồn (C) + hoàn thành (F) = mẫu số của chỉ tiêu 22 (phát sinh mới,
  Phòng QLDN5); số tồn quá hạn của chỉ tiêu nằm TRONG số tồn C.
*/
export interface SoDM { tonCQT: number; tonNNT: number; tt01: number; tt0307: number; xongCQT: number }
export const tonDM = (s: SoDM) => s.tonCQT + s.tonNNT;
export const xongDM = (s: SoDM) => s.tt01 + s.tt0307;
export const xongNNT = (s: SoDM) => xongDM(s) - s.xongCQT;
/** Cột L của dòng đơn vị: I / (I + D). */
export const tyLeDM = (s: SoDM) => (s.xongCQT + s.tonCQT ? s.xongCQT / (s.xongCQT + s.tonCQT) : null);

export function soDM(dvId: string, thang: number): SoDM {
  const c = capCua(ctCua("gt-moi"), dvId, thang);
  const r = prng(hatCua(thang, "ql5-dm", dvId));
  const ton = c.tu + tron((c.mau - c.tu) * (0.15 + r() * 0.25));
  const xong = c.mau - ton;
  const tonCQT = tron(ton * (0.5 + r() * 0.45));
  const tt01 = tron(xong * (0.6 + r() * 0.2));
  return { tonCQT, tonNNT: ton - tonCQT, tt01, tt0307: xong - tt01, xongCQT: tron(xong * (0.4 + r() * 0.3)) };
}
export const congDM = (ids: string[], thang: number): SoDM => ids.map((id) => soDM(id, thang))
  .reduce((a, b) => ({ tonCQT: a.tonCQT + b.tonCQT, tonNNT: a.tonNNT + b.tonNNT, tt01: a.tt01 + b.tt01, tt0307: a.tt0307 + b.tt0307, xongCQT: a.xongCQT + b.xongCQT }),
    { tonCQT: 0, tonNNT: 0, tt01: 0, tt0307: 0, xongCQT: 0 });

/* ---------- Đơn vị lá (CQT nguồn) ---------- */

/*
  Nguồn TKTT và nộp thừa kéo theo CQT: năm file 10100P1–P5 cho Văn phòng
  (CQT 0101), mỗi địa bàn một file. Thuế cơ sở 18–22 có HAI mã CQT, nên một
  đơn vị báo cáo cộng hai lá.
*/
export interface La { id: string; dvId: string; cqt: string; nhan: string }
export const LA: La[] = DON_VI_Q.flatMap((d): La[] => d.khoi === "VP"
  ? [{ id: `10100${d.id}`, dvId: d.id, cqt: "0101", nhan: d.ngan }]
  : maCuaTCS(Number(d.id.slice(1))).map((c) => ({ id: c.ma, dvId: d.id, cqt: c.ma, nhan: `${d.ten} · ${c.diaBan}` })));
export const laCua = (dvIds: string[]) => LA.filter((l) => dvIds.includes(l.dvId));
const hatLa = (la: La) => LA.indexOf(la);

/* ---------- Tờ khai tồn trục (RS-QL5-06) ---------- */

/*
  Từ bộ kéo 26/10/2026 chỉ theo dõi trạng thái CQT cần xử lý: 7B ở TMS
  3.2.3.2 (nhận trước 10/2017); 4B, 5B, 5G ở TMS 3.2.3.3. Nghĩa của ba mã sau
  lấy theo thứ tự tài liệu liệt kê — "cần nhập thủ công, lỗi của CQT hoặc CBT
  thực hiện phân loại" — CHƯA được nghiệp vụ xác nhận từng mã.
*/
export type TrangThaiTK = "7B" | "4B" | "5B" | "5G";
export const TRANG_THAI_TK: { id: TrangThaiTK; nhan: string; nguon: string }[] = [
  { id: "4B", nhan: "Cần nhập thủ công", nguon: "TMS 3.2.3.3" },
  { id: "5B", nhan: "Lỗi của CQT", nguon: "TMS 3.2.3.3" },
  { id: "5G", nhan: "CBT thực hiện phân loại", nguon: "TMS 3.2.3.3" },
  { id: "7B", nhan: "Chuyển vào TMS không thành công", nguon: "TMS 3.2.3.2" },
];
/** Ngày chụp của lần kéo đầy đủ gần nhất — số mô phỏng. */
export const NGAY_KEO_TK = new Date(2026, 10, 2);
export const NHAN_NGAY_KEO_TK = "02/11/2026";

export interface ToKhaiTon { id: string; la: La; mst: string; ten: string; mau: string; ky: string; ngayNhan: Date; trangThai: TrangThaiTK; soNgay: number }

const MAU_TK = ["01/GTGT", "05/KK-TNCN", "03/TNDN", "01/TTĐB", "01/TAIN", "05/QTT-TNCN", "02/TNDN", "01/BVMT"];
const NGAY = 86_400_000;

let boTK: ToKhaiTon[] | null = null;
export function toKhaiTon(): ToKhaiTon[] {
  if (boTK) return boTK;
  boTK = LA.flatMap((la) => {
    const r = prng(hatCua(2026, "ql5-tktt", la.id));
    const vp = la.cqt === "0101";
    const n = vp ? nguyen(r, 2, 12) : nguyen(r, 3, 26);
    return Array.from({ length: n }, (_, i): ToKhaiTon => {
      /* 7B chỉ có ở nguồn trước 10/2017, nên tờ khai 7B tồn hàng nghìn ngày. */
      const x = r();
      const trangThai: TrangThaiTK = x < 0.08 ? "7B" : x < 0.45 ? "4B" : x < 0.7 ? "5B" : "5G";
      const ngayNhan = trangThai === "7B"
        ? new Date(2014, 0, 1 + nguyen(r, 0, 1360))
        : new Date(NGAY_KEO_TK.getTime() - (r() < 0.75 ? nguyen(r, 1, 90) : nguyen(r, 91, 1500)) * NGAY);
      const mau = MAU_TK[nguyen(r, 0, MAU_TK.length - 1)];
      const nam = ngayNhan.getFullYear();
      const ky = mau.includes("QTT") || mau === "03/TNDN" ? `Năm ${nam - 1}` : r() < 0.5 ? `Tháng ${String(nguyen(r, 1, 12)).padStart(2, "0")}/${nam}` : `Quý ${nguyen(r, 1, 4)}/${nam}`;
      const so = hatLa(la) * 40 + i;
      return { id: `${la.id}-${i}`, la, mst: mstGia(3000 + so), ten: tenNNTGia(so + 7), mau, ky, ngayNhan, trangThai, soNgay: tron((NGAY_KEO_TK.getTime() - ngayNhan.getTime()) / NGAY) };
    });
  });
  return boTK;
}

/* ---------- Nộp thừa (TMS 8.5.2, sổ thuế S1/KTT) ---------- */

/*
  Thừa dòng = MAX(0, Dư cuối kỳ nộp thừa − Dư cuối kỳ phải nộp); ngưỡng xét
  trên tổng theo tháng + CQT + MST (threshold_scope = cqt_mst). Hai nhánh
  >1 tỷ và >10 triệu tính độc lập; đúng bằng ngưỡng bị loại.
*/
export const NGUONG_NT = { ty: 1_000_000_000, muoiTrieu: 10_000_000 } as const;
export type NhanhNT = "ty" | "muoiTrieu";

export interface DongS1 { chuong: string; tieuMuc: string; phaiNop: number; nopThua: number; duocHoan: number; thua: number }
export interface NNTThua { la: La; mst: string; ten: string; dong: DongS1[]; tong: number }

interface UngVien { la: La; mst: string; ten: string; goc: number; tu: number; den: number; soDong: number; hat: number }
const boUV = new Map<string, UngVien[]>();
function ungVien(la: La): UngVien[] {
  const co = boUV.get(la.id);
  if (co) return co;
  const r = prng(hatCua(2026, "ql5-nt", la.id));
  const vp = la.cqt === "0101";
  const n = vp ? nguyen(r, 50, 110) : nguyen(r, 8, 40);
  const ds = Array.from({ length: n }, (_, i): UngVien => {
    const so = hatLa(la) * 120 + i;
    /* Phân bố lệch: đa số vài triệu đến vài trăm triệu, một ít trên 1 tỷ. */
    const goc = 10 ** (6.4 + r() ** (vp ? 1.3 : 1.7) * 3.7);
    const tu = r() < 0.7 ? 1 : nguyen(r, 2, 10);
    const den = r() < 0.35 ? nguyen(r, tu + 1, 11) : 13;
    return { la, mst: mstGia(6000 + so), ten: tenNNTGia(so + 3), goc, tu, den, soDong: nguyen(r, 1, 3), hat: so };
  });
  boUV.set(la.id, ds);
  return ds;
}

const TIEU_MUC = [["1701", "754"], ["1052", "554"], ["1001", "557"], ["1757", "754"], ["4254", "554"]] as const;

/** NNT của một lá ở một tháng, kèm các dòng sổ S1. Thừa = 0 nếu MST không còn số dư thừa. */
function nntThang(la: La, thang: number): NNTThua[] {
  return ungVien(la).flatMap((u) => {
    if (thang < u.tu || thang >= u.den) return [];
    const r = prng(hatCua(thang, "ql5-nt-t", la.id, u.mst));
    const tong = tron(u.goc * (0.7 + r() * 0.6));
    /* Tổng chia cho các dòng tiểu mục; dòng cuối có khi bằng 0 (vẫn giữ khi nhóm đạt ngưỡng). */
    const phan = Array.from({ length: u.soDong }, (_, i) => (i === u.soDong - 1 && u.soDong > 1 && r() < 0.3 ? 0 : 0.2 + r()));
    const tp = phan.reduce((a, b) => a + b, 0);
    let con = tong;
    const dong = phan.map((p, i): DongS1 => {
      const thua = i === phan.length - 1 ? con : tron((tong * p) / tp);
      con -= thua;
      const [tieuMuc, chuong] = TIEU_MUC[(u.hat + i) % TIEU_MUC.length];
      const phaiNop = r() < 0.6 ? tron(thua * r() * 0.4) : 0;
      return { chuong, tieuMuc, phaiNop, nopThua: phaiNop + thua, duocHoan: r() < 0.15 ? tron(thua * r() * 0.5) : 0, thua };
    });
    return [{ la, mst: u.mst, ten: u.ten, dong, tong }];
  });
}

const boNT = new Map<string, NNTThua[]>();
/** Danh sách đã chọn của một nhánh: nhóm CQT + MST có tổng Thừa VƯỢT ngưỡng. */
export function danhSachNT(thang: number, nhanh: NhanhNT, la: La[] = LA): NNTThua[] {
  const khoa = `${thang}-${nhanh}`;
  let ds = boNT.get(khoa);
  if (!ds) {
    ds = LA.flatMap((l) => nntThang(l, thang)).filter((n) => n.tong > NGUONG_NT[nhanh]);
    boNT.set(khoa, ds);
  }
  if (la.length === LA.length) return ds;
  const ids = new Set(la.map((l) => l.id));
  return ds.filter((n) => ids.has(n.la.id));
}

/* Nhận xét hai tháng liền nhau, nhánh >1 tỷ, khóa CQT + MST. */
export type NhanXet = "NEW" | "UNFINISHED" | "COMPLETED";
export const NHAN_NX: Record<NhanXet, string> = { NEW: "Phát sinh mới", UNFINISHED: "Chưa hoàn thành", COMPLETED: "Đã hoàn thành" };
const khoaNT = (n: NNTThua) => `${n.la.cqt}|${n.la.id}|${n.mst}`;

export function nhanXetNT(thang: number, la: La[] = LA) {
  const nay = danhSachNT(thang, "ty", la), truoc = danhSachNT(thang - 1, "ty", la);
  const mTruoc = new Map(truoc.map((n) => [khoaNT(n), n]));
  const mNay = new Set(nay.map(khoaNT));
  const cua = new Map<string, { nx: NhanXet; chenh: number | null }>(nay.map((n) => {
    const t = mTruoc.get(khoaNT(n));
    return [khoaNT(n), t ? { nx: "UNFINISHED" as const, chenh: n.tong - t.tong } : { nx: "NEW" as const, chenh: null }];
  }));
  const daXong = truoc.filter((n) => !mNay.has(khoaNT(n)));
  return {
    cua: (n: NNTThua) => cua.get(khoaNT(n)) ?? null,
    dem: { NEW: nay.filter((n) => cua.get(khoaNT(n))?.nx === "NEW").length, UNFINISHED: nay.filter((n) => cua.get(khoaNT(n))?.nx === "UNFINISHED").length, COMPLETED: daXong.length } as Record<NhanXet, number>,
    daXong,
  };
}

/*
  Báo cáo trung gian (mẫu "Nop thua"): cột C là tiền đã phân bổ của nhánh
  >1 tỷ, làm tròn triệu đồng THEO TỪNG LÁ rồi mới cộng. D (xác nhận thừa
  đúng) và E (nợ sai đã điều chỉnh) do bên Thuế nhập — ở đây là số đặt ra
  để thấy được bảng đầy đủ. F = D + E; G = C − F; H = F / C.
*/
export interface SoNT { c: number; d: number; e: number }
export const fNT = (s: SoNT) => s.d + s.e;
export const gNT = (s: SoNT) => s.c - fNT(s);
export const hNT = (s: SoNT) => (s.c ? fNT(s) / s.c : null);

export function soNTLa(la: La, thang: number): SoNT {
  const ds = danhSachNT(thang, "ty", [la]);
  const c = tron(ds.reduce((a, n) => a + n.tong, 0) / 1e6);
  const r = prng(hatCua(thang, "ql5-nt-de", la.id));
  const d = tron(c * (0.55 + r() * 0.4));
  const e = Math.min(c - d, tron(c * r() * 0.06));
  return { c, d, e };
}
export const congNT = (ids: string[], thang: number): SoNT => laCua(ids).map((l) => soNTLa(l, thang))
  .reduce((a, b) => ({ c: a.c + b.c, d: a.d + b.d, e: a.e + b.e }), { c: 0, d: 0, e: 0 });

export type { DonViQ };
