/*
  Bộ file gốc do Phòng QLRR kết xuất hằng tuần — nguồn dữ liệu mới của báo
  cáo kiểm tra (MoM Phòng Kiểm tra 04/11/2026 §3.3b, CẦN XÁC NHẬN). Thay cho
  kéo tự động từ TTR: file kéo theo hướng dẫn chỉ có 9 cột, thiếu mã phòng,
  tiền và toàn bộ 30 Thuế cơ sở (so sánh 03/11/2026).

  Cột bắt buộc lấy từ chính bốn tệp mẫu trong folder 05-11 (đọc 05/11/2026):
  mỗi tệp một sheet trùng tên, tiêu đề cột ở dòng 1. Chỉ liệt kê cột báo cáo
  "Chi tiết TTKT" cần, không liệt kê khoá nội bộ (THC_ID, KHH_ID…).
*/

import { DON_VI_KT, type DonViKT } from "@/data/kiemTra";

export type MaTep = "DANG_THUC_HIEN" | "KET_LUAN" | "QDXL" | "SO_NOP_SAU_KT";
export interface TepQLRR { ma: MaTep; ten: string; moTa: string; cot: string[]; khop: RegExp }

export const TEP_QLRR: TepQLRR[] = [
  { ma: "DANG_THUC_HIEN", ten: "Đang thực hiện", moTa: "Mỗi dòng một cuộc đang thực hiện.",
    cot: ["MA_CQT", "MA_PHONG", "TIN", "TEN_DTNT", "KY_KE_HOACH", "TTR_KTRA", "LOAI_KH", "SO_QDINH", "NGAY_RA_QDINH"], khop: /^DANGTHUCHIEN/ },
  { ma: "KET_LUAN", ten: "Kết luận", moTa: "Mỗi dòng một cuộc đã có kết luận.",
    cot: ["MA_CQ_RA_QDINH", "MA_PHONG", "TIN", "TEN_DTNT", "KY_KE_HOACH", "SO_QDINH", "KLUAN_SO", "KLUAN_NGAY"], khop: /^KETLUAN/ },
  { ma: "QDXL", ten: "Quyết định xử lý", moTa: "Mỗi dòng một tiểu mục của một quyết định xử lý.",
    cot: ["MA_CQT", "MA_PHONG", "TIN", "SO_QDINH_XULY", "NGAY_RA_QDINH_XULY", "MA_TMUC", "SO_TIEN", "TGIAM_LO", "TGIAM_KTRU", "MA_TRUONG_DOAN", "TEN_TRUONG_DOAN"], khop: /^QDXL/ },
  { ma: "SO_NOP_SAU_KT", ten: "Số nộp sau kiểm tra", moTa: "Mỗi dòng một tiểu mục số đã nộp của một quyết định xử lý.",
    cot: ["MA_CQT", "MA_PHONG", "TIN", "SO_QDXL", "MA_TMUC", "DA_NOP", "MA_TRUONG_DOAN", "TEN_TRUONG_DOAN"], khop: /^SONOP/ },
];

/** Tên tệp → ô của bộ: bỏ dấu cách, gạch dưới, phần mở rộng; "SONOPSAUKIEMTRA" cũng khớp ô số nộp. */
export const oCuaTep = (tenTep: string): MaTep | null => {
  const goc = tenTep.replace(/\.[^.]+$/, "").toUpperCase().replace(/[^A-Z]/g, "");
  return TEP_QLRR.find((t) => t.khop.test(goc))?.ma ?? null;
};

export interface KiemTep { ma: MaTep | null; ten: string; coKB: number; ngay: Date; loi: string | null }

/*
  Kiểm được ngay trên máy: tên, phần mở rộng, chữ ký tệp (Excel 97-2003 bắt
  đầu D0 CF 11 E0; .xlsx là tệp zip PK). Cột và số dòng chỉ kiểm được khi nạp:
  trình duyệt của bản demo không đọc định dạng .xls cũ.
*/
export async function kiemTepQLRR(f: File): Promise<KiemTep> {
  const ma = oCuaTep(f.name);
  const kq = { ma, ten: f.name, coKB: Math.round(f.size / 1024), ngay: new Date(f.lastModified) };
  if (!ma) return { ...kq, loi: "Tên tệp không khớp tệp nào của bộ (DANG_THUC_HIEN, KET_LUAN, QDXL, SO_NOP_SAU_KT)." };
  if (!/\.xlsx?$/i.test(f.name)) return { ...kq, loi: "Chỉ nhận tệp Excel .xls hoặc .xlsx đúng như QLRR kết xuất." };
  const dau = new Uint8Array(await f.slice(0, 4).arrayBuffer());
  const ole = dau[0] === 0xd0 && dau[1] === 0xcf && dau[2] === 0x11 && dau[3] === 0xe0;
  const zip = dau[0] === 0x50 && dau[1] === 0x4b;
  if (!ole && !zip) return { ...kq, loi: "Tệp không phải Excel thật (có thể là trang web lưu đuôi .xls). Kết xuất lại từ QLRR." };
  if (f.size < 2048) return { ...kq, loi: "Tệp gần như rỗng. Kết xuất lại từ QLRR." };
  return { ...kq, loi: null };
}

/*
  Quy tắc gán đơn vị khi nạp (MoM 04/11 §3.2a). Văn phòng Cục chia theo
  MA_PHONG, đúng sáu mã mà biểu đầu ra "Chi tiet TTKT" ghi sẵn ở cột mã:
  10100Q3…Q7 là Phòng Kiểm tra số 1…5, 10100P6 là Phòng QLHKD. Thuế cơ sở
  chia theo mã CQT; năm mã cũ gộp vào dòng của Thuế cơ sở mới (bảng §6 của so
  sánh 03/11). Mã trưởng đoàn = mã phòng + số thứ tự (10100Q3062, 1014104009).

  Đo trên bốn tệp mẫu (05/11/2026): QDXL, SO_NOP, KET_LUAN gán được 99,2–100%
  số dòng. DANG_THUC_HIEN chỉ 41%: tệp chứa kế hoạch từ 2005, các cuộc cũ
  mang mã phòng của cơ cấu trước (1010055, 1010048…) — chờ Phòng Kiểm tra
  cho bảng đổi mã hoặc chốt chỉ lấy kế hoạch năm hiện hành.
*/
export const MA_GOP: Record<string, string> = { "10125": "10115", "10139": "10135", "10141": "10153", "10149": "10143", "10145": "10147" };

export function donViCuaDong(maCQT: string, maPhong: string): DonViKT | null {
  if (maCQT === "10100") return DON_VI_KT.find((d) => d.khoi === "VP" && maPhong.startsWith(d.ma)) ?? null;
  const ma = MA_GOP[maCQT] ?? maCQT;
  return DON_VI_KT.find((d) => d.khoi === "TCS" && d.ma === ma) ?? null;
}
