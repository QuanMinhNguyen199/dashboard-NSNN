import { DON_VI_KT } from "@/data/kiemTra";

/*
  Hồ sơ hoàn thuế GTGT trích từ TMS chức năng 6.2 — đặc tả "Hoàn GTGT" và
  biên bản 28/10/2026 (folder HoanGTGT).

  Chỉ giữ đúng các trường đặc tả mục 4 cho là cần: bốn mốc ngày và ba cột
  tiền, cộng phân loại hoàn trước / kiểm trước. Trường "trạng thái" và "số
  ngày quá hạn" của TMS CỐ Ý không có ở đây (kết luận 1): TMS còn tính theo
  thông tư cũ, nên không phép tính nào được phép đọc chúng.

  Toàn bộ hồ sơ là MÔ PHỎNG, sinh tất định — không phải hồ sơ thật.
*/

export type PhanLoaiHoan = "truoc" | "kiemTruoc";
export interface HoSoHoan {
  id: string;
  mst: string;
  tenNNT: string;
  donVi: string;
  phanLoai: PhanLoaiHoan;
  /** Hoàn kiêm bù trừ: không qua thẩm định, phần bù trừ không chi trực tiếp. */
  buTru: boolean;
  ngayNhan: Date;
  ngayTBCN: Date | null;
  ngayThamDinh: Date | null;
  ngayQD: Date | null;
  ngayLenh: Date | null;
  /** Triệu đồng. */
  deNghi: number;
  duocHoan: number | null;
  hoanTrucTiep: number | null;
}

/* Đơn vị quản lý theo Phụ lục 01–02 của báo cáo giao ban: sáu phòng khối VP rồi 25 Thuế cơ sở. */
export interface DonViHoan { id: string; ten: string; khoi: "VP" | "TCS" }
export const DON_VI_HOAN: DonViHoan[] = [
  ...[1, 2, 3, 4, 5].map((n) => ({ id: `QL${n}`, ten: `Phòng QLDN số ${n}`, khoi: "VP" as const })),
  { id: "TCN", ten: "Phòng Thuế cá nhân, HKD và thu khác", khoi: "VP" },
  ...DON_VI_KT.filter((d) => d.khoi === "TCS").map((d) => ({ id: d.id, ten: d.ten, khoi: "TCS" as const })),
];
export const tenDonViHoan = (id: string) => DON_VI_HOAN.find((d) => d.id === id)?.ten ?? id;

/* ---------- Ngày làm việc ---------- */

const laNghi = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
/*
  Số ngày làm việc từ mốc bắt đầu đến mốc kết thúc: KHÔNG tính ngày bắt đầu,
  tính ngày kết thúc, bỏ thứ Bảy và Chủ nhật (kết luận 3). Ngày lễ chưa trừ —
  đặc tả không nhắc; GIẢ ĐỊNH, chờ nghiệp vụ xác nhận khi đếm tay 20 hồ sơ mẫu.
*/
export function soNgayLamViec(tu: Date, den: Date): number {
  let n = 0;
  const d = new Date(tu.getFullYear(), tu.getMonth(), tu.getDate());
  const cuoi = new Date(den.getFullYear(), den.getMonth(), den.getDate()).getTime();
  while (d.getTime() < cuoi) { d.setDate(d.getDate() + 1); if (!laNghi(d)) n++; }
  return n;
}
function congNgayLV(tu: Date, n: number): Date {
  const d = new Date(tu);
  while (n > 0) { d.setDate(d.getDate() + 1); if (!laNghi(d)) n--; }
  return d;
}

/* ---------- Cấu hình cách tính hạn (đặc tả mục 5, quy tắc 4) ---------- */

export type MocBatDau = "nhan" | "tbcn";
export interface CauHinhHan { moc: MocBatDau; nguong: number }
export const CACH_TINH: { id: string; nhan: string; ngan: string; ch: CauHinhHan }[] = [
  { id: "tt", nhan: "Thông tư cũ · 9 ngày từ ngày nhận hồ sơ", ngan: "9 ngày · TT cũ", ch: { moc: "nhan", nguong: 9 } },
  { id: "nd", nhan: "Nghị định mới · 6 ngày từ ngày thông báo chấp nhận", ngan: "6 ngày · NĐ mới", ch: { moc: "tbcn", nguong: 6 } },
];
const mocCua = (h: HoSoHoan, moc: MocBatDau) => (moc === "nhan" ? h.ngayNhan : h.ngayTBCN);

/** Số ngày xử lý đến ngày quyết định hoàn — `null` khi chưa có quyết định hoặc thiếu mốc bắt đầu. */
export function ngayXuLy(h: HoSoHoan, ch: CauHinhHan): number | null {
  const bd = mocCua(h, ch.moc);
  return h.ngayQD && bd ? soNgayLamViec(bd, h.ngayQD) : null;
}
export const cham = (h: HoSoHoan, ch: CauHinhHan) => { const n = ngayXuLy(h, ch); return n !== null && n > ch.nguong; };
/** Đếm ngược chỉ cho nhắc nghiệp vụ: ngưỡng − ngày làm việc đã trôi tới hôm nay. `null` khi chưa có mốc bắt đầu. */
export function conLai(h: HoSoHoan, ch: CauHinhHan, homNay: Date): number | null {
  const bd = mocCua(h, ch.moc);
  return bd ? ch.nguong - soNgayLamViec(bd, homNay) : null;
}
export const lechTien = (h: HoSoHoan) => h.duocHoan !== null && h.hoanTrucTiep !== null && Math.abs(h.duocHoan - h.hoanTrucTiep) >= 0.5;

/* ---------- Sinh dữ liệu mô phỏng ---------- */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/* Tỷ trọng hồ sơ / tháng của từng đơn vị — phỏng theo độ lớn tương đối trong báo cáo giao ban T9. */
const NHIP: Record<string, number> = { QL1: 9, QL2: 21, QL3: 14, QL4: 12, QL5: 3, TCN: 26 };
const TEN = ["Minh Long", "Đại Phát", "Hồng Hà", "Tân Phú", "Sao Việt", "Hoàng Gia", "An Khang", "Thăng Long", "Phú Thịnh", "Bảo Minh", "Nam Á", "Kim Sơn", "Việt Tiến", "Hưng Thịnh"];
const NGANH = ["Xuất khẩu nông sản", "Dệt may", "Điện tử", "Gỗ", "Thép", "Dược phẩm", "Xây dựng", "Thương mại"];

function sinh(): HoSoHoan[] {
  const r = rng(20261028);
  const homNay = new Date(); homNay.setHours(0, 0, 0, 0);
  const out: HoSoHoan[] = [];
  const dau = new Date(2026, 0, 2);
  let n = 0;
  for (let d = new Date(dau); d <= homNay; d.setDate(d.getDate() + 1)) {
    if (laNghi(d)) continue;
    for (const dv of DON_VI_HOAN) {
      const nhip = (NHIP[dv.id] ?? 0.35) / 21;
      let k = 0, x = r();
      while (x < nhip && k < 4) { k++; x += r(); }
      for (let i = 0; i < k; i++) {
        n++;
        const ngayNhan = new Date(d);
        const kiemTruoc = r() < (dv.khoi === "TCS" ? 0.75 : dv.id === "TCN" ? 0.02 : dv.id === "QL5" ? 0.5 : 0.28);
        const buTru = !kiemTruoc && r() < 0.08;
        const ngayTBCN = congNgayLV(ngayNhan, 1 + Math.floor(r() * 3.6));
        const thamDinh = buTru ? null : congNgayLV(ngayTBCN, 1 + Math.floor(r() * 3));
        const xuLy = kiemTruoc ? 12 + Math.floor(r() * 18) : 2 + Math.floor(r() * r() * 9);
        const ngayQDdk = congNgayLV(ngayTBCN, xuLy);
        const coQD = ngayQDdk <= homNay;
        const deNghi = Math.round(dv.id === "TCN" ? 80 + r() * 900 : 150 + Math.pow(r(), 2.2) * 38_000);
        const tyDuoc = r() < 0.62 ? 1 : 0.45 + r() * 0.5;
        const duocHoan = coQD ? Math.round(deNghi * tyDuoc) : null;
        const hoanTrucTiep = duocHoan === null ? null : buTru ? Math.round(duocHoan * (0.3 + r() * 0.5)) : r() < 0.03 ? Math.round(duocHoan * (0.9 + r() * 0.08)) : duocHoan;
        out.push({
          id: `GTGT-26-${String(n).padStart(4, "0")}`,
          mst: `0${String(100_000_000 + Math.floor(r() * 899_999_999)).slice(0, 9)}`,
          tenNNT: `${r() < 0.5 ? "Công ty TNHH" : "Công ty CP"} ${NGANH[Math.floor(r() * NGANH.length)]} ${TEN[Math.floor(r() * TEN.length)]}`,
          donVi: dv.id, phanLoai: kiemTruoc ? "kiemTruoc" : "truoc", buTru,
          ngayNhan, ngayTBCN: ngayTBCN <= homNay ? ngayTBCN : null,
          ngayThamDinh: thamDinh && thamDinh <= homNay && coQD ? thamDinh : null,
          ngayQD: coQD ? ngayQDdk : null,
          ngayLenh: coQD ? ((l: Date) => (l <= homNay ? l : null))(congNgayLV(ngayQDdk, Math.floor(r() * 4))) : null,
          deNghi, duocHoan, hoanTrucTiep,
        });
      }
    }
  }
  return out;
}

let CACHE: HoSoHoan[] | null = null;
export const hoSoHoan = () => (CACHE ??= sinh());
