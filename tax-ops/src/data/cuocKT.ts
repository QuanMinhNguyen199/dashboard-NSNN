import { useSyncExternalStore } from "react";

/*
  Cuộc kiểm tra do đoàn kiểm tra nhập tay — "Module 2: Kiểm soát tiến độ và
  kiểm đếm công việc" của tài liệu "XÂY DỰNG ỨNG DỤNG AI - BC KIỂM TRA"
  (folder PKT, 03/11/2026). Mỗi dòng là đúng một dòng của bảng nhập trong tài
  liệu: phòng, MST, DN, trưởng đoàn, loại hình, ngành nghề, thời kỳ, doanh thu
  ba năm, bốn mốc (đăng ký / đối soát × ban hành / hoàn thành), quyết định
  kiểm tra, quyết định xử lý, tổng truy thu, ghi chú.

  Bốn mốc lưu THÁNG của năm 2026 (1–12), vì báo cáo đối soát đếm theo tháng:
  "đăng ký" là tháng đoàn hẹn, "đối soát" là tháng việc thật sự xảy ra.

  Toàn bộ số liệu dưới đây là MÔ PHỎNG, sinh tất định — không phải hồ sơ thật.
*/

export type LoaiCuoc = "kh" | "khTruoc" | "dongMa" | "chuyenDD" | "chiaTach" | "truocHoan" | "sauHoan" | "chuyenDe" | "chuyenTB" | "khac";
/** Thứ tự cột của mẫu đối soát (2.1)…(2.10). "kh" là KH năm nay; chín loại sau là kiểm tra đột xuất. */
export const LOAI_CUOC: { id: LoaiCuoc; nhan: string; ngan: string }[] = [
  { id: "kh", nhan: "KH2026", ngan: "KH2026" },
  { id: "khTruoc", nhan: "KH năm trước", ngan: "KH năm trước" },
  { id: "dongMa", nhan: "Đóng mã, giải thể", ngan: "Đóng mã, giải thể" },
  { id: "chuyenDD", nhan: "Chuyển địa điểm", ngan: "Chuyển địa điểm" },
  { id: "chiaTach", nhan: "Chia tách, sáp nhập", ngan: "Chia tách, sáp nhập" },
  { id: "truocHoan", nhan: "Trước hoàn", ngan: "Trước hoàn" },
  { id: "sauHoan", nhan: "Sau hoàn", ngan: "Sau hoàn" },
  { id: "chuyenDe", nhan: "Chuyên đề", ngan: "Chuyên đề" },
  { id: "chuyenTB", nhan: "Chuyển KT tại bàn sang KT tại trụ sở NNT", ngan: "Chuyển từ KT tại bàn" },
  { id: "khac", nhan: "Khác (chỉ đạo của LĐ CCT, giám định…)", ngan: "Khác" },
];
export const DOT_XUAT = LOAI_CUOC.filter((l) => l.id !== "kh");
export const nhanLoai = (id: LoaiCuoc) => LOAI_CUOC.find((l) => l.id === id)!.ngan;

/*
  Dòng của báo cáo đối soát, đúng thứ tự mẫu: TTKT1…TTKT5 rồi CNTK. Mẫu dùng
  ký hiệu cũ "TTKT"; màn ghi tên hiện hành "Phòng Kiểm tra số n". "CNTK" giữ
  nguyên ký hiệu của mẫu — tài liệu không ghi tên đầy đủ (CHƯA XÁC NHẬN).
*/
export const PHONG_DS: { id: string; ten: string; mau: string }[] = [
  ...[1, 2, 3, 4, 5].map((n) => ({ id: `KT${n}`, ten: `Phòng Kiểm tra số ${n}`, mau: `TTKT${n}` })),
  { id: "CNTK", ten: "CNTK", mau: "CNTK" },
];
export const tenPhongDS = (id: string) => PHONG_DS.find((p) => p.id === id)?.ten ?? id;

export interface CuocKT {
  id: string;
  phong: string;
  mst: string;
  tenDN: string;
  truongDoan: string;
  loai: LoaiCuoc;
  nganh: string;
  thoiKy: string;
  dt: [number | null, number | null, number | null];
  dkBH: number | null;
  dkHT: number | null;
  dsBH: number | null;
  dsHT: number | null;
  qdKT: { so: string; ngay: string };
  qdXL: { so: string; ngay: string };
  /** Tổng thuế truy thu và phạt, truy hoàn — triệu đồng. */
  thu: number | null;
  ghiChu: string;
}

export type TienDo = "chuaDK" | "dkBH" | "dangKT" | "dkHT" | "hoanThanh";
export const NHAN_TIEN_DO: Record<TienDo, string> = {
  chuaDK: "Chưa đăng ký", dkBH: "Đăng ký ban hành", dangKT: "Đang kiểm tra", dkHT: "Đăng ký hoàn thành", hoanThanh: "Hoàn thành",
};
/** Tiến độ đọc từ bốn mốc — không nhập riêng, để không bao giờ lệch với mốc. */
export const tienDo = (c: CuocKT): TienDo => (c.dsHT ? "hoanThanh" : c.dkHT ? "dkHT" : c.dsBH ? "dangKT" : c.dkBH ? "dkBH" : "chuaDK");

/* ---------- Sinh dữ liệu mô phỏng ---------- */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const NGANH = ["Xây lắp", "Thương mại", "Sản xuất nhựa", "Kinh doanh thiết bị y tế", "Vận tải", "Dịch vụ ăn uống", "Bất động sản", "Phần mềm", "Sản xuất bao bì", "Kinh doanh vật liệu xây dựng"];
const TEN_DN = ["Minh Long", "Đại Phát", "Hồng Hà", "Tân Phú", "Sao Việt", "Hoàng Gia", "An Khang", "Thăng Long", "Phú Thịnh", "Bảo Minh", "Nam Á", "Kim Sơn", "Việt Tiến", "Hưng Thịnh", "Trường An"];
const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đỗ", "Bùi"];
const TEN = ["Minh Đức", "Thu Hà", "Quang Huy", "Thanh Tâm", "Văn Hải", "Ngọc Lan", "Đức Anh", "Thị Hồng", "Mạnh Cường", "Bích Ngọc"];
const TY_LOAI: [LoaiCuoc, number][] = [["kh", 60], ["khTruoc", 8], ["dongMa", 8], ["chuyenDD", 3], ["chiaTach", 2], ["truocHoan", 7], ["sauHoan", 4], ["chuyenDe", 4], ["chuyenTB", 2], ["khac", 2]];
/** Tháng dữ liệu mới nhất của bản mô phỏng (10/2026). */
export const THANG_MOI_NHAT = 10;

function sinh(): CuocKT[] {
  const r = rng(20261103);
  const chon = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const loai = () => { let x = r() * 100; for (const [id, w] of TY_LOAI) { if ((x -= w) < 0) return id; } return "kh" as LoaiCuoc; };
  const ngay = (thang: number) => `${String(1 + Math.floor(r() * 27)).padStart(2, "0")}/${String(thang).padStart(2, "0")}/2026`;
  const out: CuocKT[] = [];
  let n = 0;
  for (const p of PHONG_DS) {
    const nhip = p.id === "CNTK" ? 0.6 : p.id === "KT3" ? 3.4 : 2.2 + r();
    for (let thang = 1; thang <= THANG_MOI_NHAT; thang++) {
      const so = Math.max(0, Math.round(nhip + (r() - 0.5) * 2));
      for (let i = 0; i < so; i++) {
        n++;
        const ten = chon(TEN_DN), nganh = chon(NGANH);
        const x = r();
        const dsBH = x < 0.76 ? thang : x < 0.9 && thang < THANG_MOI_NHAT ? thang + 1 : null;
        const dkHT = dsBH && dsBH + 1 <= 12 ? Math.min(12, dsBH + 1 + Math.floor(r() * 3)) : null;
        const y = r();
        const dsHT = dkHT && dkHT <= THANG_MOI_NHAT ? (y < 0.72 ? dkHT : y < 0.86 && dkHT < THANG_MOI_NHAT ? dkHT + 1 : null) : null;
        const dt = 5_000 + Math.round(r() * 180_000);
        out.push({
          id: `C${String(n).padStart(4, "0")}`,
          phong: p.id,
          mst: `01${String(Math.floor(r() * 1e8)).padStart(8, "0")}`,
          tenDN: `${chon(["Công ty TNHH", "Công ty CP", "CTCP"])} ${nganh.split(" ").slice(-2).join(" ")} ${ten}`,
          truongDoan: `${chon(HO)} ${chon(TEN)}`,
          loai: loai(),
          nganh,
          thoiKy: chon(["2022 – 2024", "2023 – 2024", "2021 – 2023", "2024"]),
          dt: [Math.round(dt * (0.8 + r() * 0.2)), Math.round(dt * (0.9 + r() * 0.2)), dt],
          dkBH: thang, dkHT, dsBH, dsHT,
          qdKT: dsBH ? { so: `${100 + n}/QĐ-${p.mau}`, ngay: ngay(dsBH) } : { so: "", ngay: "" },
          qdXL: dsHT ? { so: `${400 + n}/QĐ-XL`, ngay: ngay(dsHT) } : { so: "", ngay: "" },
          thu: dsHT ? Math.round(80 + r() * r() * 2_400) : null,
          ghiChu: "",
        });
      }
    }
  }
  return out;
}

/* ---------- Kho trong phiên: đoàn nhập ở tab Cuộc kiểm tra, báo cáo đọc lại ngay ---------- */

let kho: CuocKT[] = sinh();
const nghe = new Set<() => void>();
const bao = () => nghe.forEach((f) => f());
export function useCuocKT() {
  return useSyncExternalStore((f) => { nghe.add(f); return () => nghe.delete(f); }, () => kho);
}
export function luuCuoc(c: CuocKT) {
  kho = kho.some((x) => x.id === c.id) ? kho.map((x) => (x.id === c.id ? c : x)) : [...kho, c];
  bao();
}
export const maMoi = () => `C${String(kho.length + 1 + Math.floor(Math.random() * 1e4)).padStart(4, "0")}-M`;

/* ---------- Báo cáo đối soát (mẫu Module 2 – Mục 3) ---------- */

export type BieuDS = "dsBH" | "dsHT" | "dkBH" | "dkHT";
export interface DongDS { phong: string; tong: number; daLam: number; theoLoai: Record<LoaiCuoc, number>; thu: number }

const rongLoai = () => Object.fromEntries(LOAI_CUOC.map((l) => [l.id, 0])) as Record<LoaiCuoc, number>;

/*
  Hai biểu đăng ký đếm cuộc ĐĂNG KÝ trong tháng, tách KH2026 và chín loại đột
  xuất. Hai biểu đối soát lấy cùng tổng đăng ký làm (1), rồi đếm trong số đó
  những cuộc việc thật đã xảy ra NGAY TRONG THÁNG (2) — tỷ lệ (2)/(1) không thể
  vượt 100%. Cuộc làm trễ sang tháng sau không được tính là đúng hẹn (GIẢ
  ĐỊNH cách đếm, chờ Phòng Kiểm tra xác nhận).
*/
export function bangDoiSoat(ds: CuocKT[], bieu: BieuDS, thang: number): { dong: DongDS[]; tong: DongDS } {
  const ht = bieu === "dsHT" || bieu === "dkHT";
  const dong = PHONG_DS.map((p) => {
    const dk = ds.filter((c) => c.phong === p.id && (ht ? c.dkHT : c.dkBH) === thang);
    const lam = bieu === "dsBH" ? dk.filter((c) => c.dsBH === thang) : bieu === "dsHT" ? dk.filter((c) => c.dsHT === thang) : dk;
    const theoLoai = rongLoai();
    lam.forEach((c) => theoLoai[c.loai]++);
    return { phong: p.id, tong: dk.length, daLam: lam.length, theoLoai, thu: lam.reduce((a, c) => a + (c.thu ?? 0), 0) };
  });
  const theoLoai = rongLoai();
  dong.forEach((d) => LOAI_CUOC.forEach((l) => { theoLoai[l.id] += d.theoLoai[l.id]; }));
  return { dong, tong: { phong: "TONG", tong: dong.reduce((a, d) => a + d.tong, 0), daLam: dong.reduce((a, d) => a + d.daLam, 0), theoLoai, thu: dong.reduce((a, d) => a + d.thu, 0) } };
}
