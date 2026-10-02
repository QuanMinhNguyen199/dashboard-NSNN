/*
  Dữ liệu GIẢ cho phân hệ Nợ và cưỡng chế của phòng QL1.

  Mục S5 bản thiết kế: "Mockup chỉ dùng dữ liệu giả". Cấu trúc — danh mục đơn
  vị, bốn mục báo cáo, tên cột — lấy theo tài liệu QL1; còn mọi con số, mã số
  thuế và tên người nộp thuế trong tệp này đều do hàm sinh ra, không lấy từ bất
  kỳ tệp nghiệp vụ nào.

  Số sinh bằng PRNG có hạt giống cố định, không phải `Math.random()`: bảng phải
  đọc ra cùng một con số ở mỗi lần dựng lại, nếu không người xem sẽ thấy tổng
  nợ nhảy mỗi lần chuyển tab và không tin được gì trên màn nữa.
*/

import { NGUONG, trieu } from "@/data/thamSo";

export interface DonViQL1 {
  id: string;
  ten: string;
  /** VP = khối Văn phòng Thuế TP; TCS = khối Thuế cơ sở. */
  nhom: "VP" | "TCS";
  ma: string;
  /** Số thứ tự trong mẫu Excel — cột STT của sheet `So_Sanh_No`, chạy 1–32. */
  stt: number;
}

/*
  Danh mục đơn vị, theo thứ tự và số thứ tự của mẫu Excel.

  Tên phòng lấy MỘT bản duy nhất. File đầu ra thật gọi cùng một phòng bằng hai
  tên khác nhau giữa các sheet — `So_Sanh_No` ghi "Phòng QLHKD, CN và thu khác"
  và "Phòng QLĐ", còn sheet cưỡng chế ghi "Phòng Thuế cá nhân, hộ kinh doanh và
  thu khác" và "Phòng Quản lý các khoản thu từ đất". Ghép hai sheet bằng tên
  phòng sẽ hụt dòng. Bản demo dùng tên đầy đủ cho mọi màn và để tên rút gọn làm
  việc hiển thị, không làm khóa.
*/
export const DON_VI_QL1: DonViQL1[] = [
  ...Array.from({ length: 5 }, (_, i) => ({ id: `P${i + 1}`, ten: `Phòng Quản lý, Hỗ trợ doanh nghiệp số ${i + 1}`, nhom: "VP" as const, ma: `VP0${i + 1}`, stt: i + 1 })),
  { id: "HKD", ten: "Phòng Thuế cá nhân, hộ kinh doanh và thu khác", nhom: "VP", ma: "VP06", stt: 6 },
  { id: "DAT", ten: "Phòng Quản lý các khoản thu từ đất", nhom: "VP", ma: "VP07", stt: 7 },
  ...Array.from({ length: 25 }, (_, i) => ({ id: `T${i + 1}`, ten: `Thuế cơ sở ${i + 1}`, nhom: "TCS" as const, ma: `TCS${String(i + 1).padStart(2, "0")}`, stt: i + 8 })),
];

export const DON_VI_THEO_ID = Object.fromEntries(DON_VI_QL1.map((d) => [d.id, d]));

export interface KyQL1 {
  id: string;
  loai: "TUAN" | "THANG";
  /** Ngày chốt số của kỳ, dùng cho cả nhãn lẫn hạt giống sinh số. */
  ngayChot: string;
  nhan: string;
  hat: number;
}

/*
  Bốn kỳ tuần và ba kỳ tháng. Ngày chốt tuần KHÔNG rơi cố định một thứ trong
  tuần — tài liệu ghi rõ điều đó là có thật ở tệp gốc, nên giữ nguyên thay vì
  xếp cho đều bảy ngày một lần.
*/
export const KY_QL1: KyQL1[] = [
  { id: "t-3107", loai: "TUAN", ngayChot: "31/07/2026", nhan: "Tuần · nợ đến 31/07/2026", hat: 731 },
  { id: "t-2207", loai: "TUAN", ngayChot: "22/07/2026", nhan: "Tuần · nợ đến 22/07/2026", hat: 722 },
  { id: "t-1607", loai: "TUAN", ngayChot: "16/07/2026", nhan: "Tuần · nợ đến 16/07/2026", hat: 716 },
  { id: "t-0707", loai: "TUAN", ngayChot: "07/07/2026", nhan: "Tuần · nợ đến 07/07/2026", hat: 707 },
  { id: "m-07", loai: "THANG", ngayChot: "31/07/2026", nhan: "Tháng 07/2026 · nợ đến 31/07/2026", hat: 1731 },
  { id: "m-06", loai: "THANG", ngayChot: "30/06/2026", nhan: "Tháng 06/2026 · nợ đến 30/06/2026", hat: 1630 },
  { id: "m-05", loai: "THANG", ngayChot: "31/05/2026", nhan: "Tháng 05/2026 · nợ đến 31/05/2026", hat: 1531 },
];

export const KY_MAC_DINH = KY_QL1[0].id;
export const KY_THEO_ID = Object.fromEntries(KY_QL1.map((k) => [k.id, k]));

export type TabQL1 = "no" | "cc" | "th" | "t06";

/* PRNG mulberry32: một hằng số, bốn phép, và cùng hạt giống luôn cho cùng dãy. */
function prng(hat: number) {
  let a = hat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Hạt giống gộp từ kỳ, đơn vị và mục báo cáo: đổi bất kỳ chiều nào cũng ra một
   dãy khác, nhưng quay lại đúng ba giá trị ấy thì ra lại đúng dãy cũ. */
const hatCua = (hatKy: number, maDonVi: string, tab: string) => {
  let h = hatKy;
  for (const ky of `${maDonVi}|${tab}`) h = (Math.imul(h, 31) + ky.charCodeAt(0)) >>> 0;
  return h;
};

/** Khối VP quản lý doanh nghiệp lớn nên số tiền lớn hơn hẳn khối Thuế cơ sở. */
const heSoQuyMo = (dv: DonViQL1) => dv.nhom === "VP" ? (dv.id === "DAT" ? 2.4 : dv.id === "HKD" ? 0.7 : 3.2) : 1;

/** Bốn chỉ tiêu của sheet gốc: tổng, khả năng thu, khó thu, đang xử lý. */
export interface BoNo { B: number; C: number; D: number; E: number }

/*
  Ba mốc so sánh, đúng mẫu Excel.

  `So_Sanh_No` có 28 cột số: 4 cột hiện trạng cộng BA nhóm "tăng giảm so với"
  — đầu năm, tháng trước, tuần trước — mỗi nhóm lại chia số tuyệt đối và số
  tương đối. Dữ liệu vì thế phải giữ cả ba mốc; màn hình chọn hiện một mốc tại
  một thời điểm, còn bản kết xuất Excel dựng đủ cả ba.
*/
export type MocSoSanh = "dauNam" | "thangTruoc" | "tuanTruoc";

export const NHAN_MOC: Record<MocSoSanh, string> = {
  dauNam: "đầu năm",
  thangTruoc: "tháng trước",
  tuanTruoc: "tuần trước",
};

export interface OTongHopNo {
  /** Nợ đến ngày báo cáo, đơn vị triệu đồng. */
  cur: BoNo;
  dauNam: BoNo;
  thangTruoc: BoNo;
  tuanTruoc: BoNo;
}

export interface OTongHopXuLy {
  phaiN: number; phaiT: number;
  daN: number; daT: number;
  chuaN: number; chuaT: number;
}

export interface OTongHop06 {
  nnt06: number; tongNo: number;
  daN: number; daT: number;
  chuaN: number; chuaT: number;
}

export function tongHopNo(hatKy: number, dv: DonViQL1): OTongHopNo {
  const r = prng(hatCua(hatKy, dv.ma, "no"));
  const q = heSoQuyMo(dv);
  const C = Math.round((18_000 + r() * 52_000) * q) / 10;
  const D = Math.round((2_600 + r() * 9_400) * q) / 10;
  const E = Math.round((900 + r() * 4_200) * q) / 10;
  const cur: BoNo = { B: Math.round((C + D + E) * 10) / 10, C, D, E };

  /*
    Biên lệch nới dần theo khoảng cách thời gian: tuần trước ±9%, tháng trước
    ±18%, đầu năm ±40%. Cho cả ba cùng một biên thì ba cột tăng giảm đọc ra
    gần như nhau, và màn hình mất hẳn lý do để có ba mốc.
  */
  const moc = (bien: number): BoNo => {
    const l = (k: number) => Math.round(k * (1 - bien + r() * bien * 2) * 10) / 10;
    const c = l(C), d = l(D), e = l(E);
    return { B: Math.round((c + d + e) * 10) / 10, C: c, D: d, E: e };
  };
  return { cur, tuanTruoc: moc(0.09), thangTruoc: moc(0.18), dauNam: moc(0.4) };
}

function tongHopXuLy(hatKy: number, dv: DonViQL1, tab: "cc" | "th"): OTongHopXuLy {
  const r = prng(hatCua(hatKy, dv.ma, tab));
  const q = heSoQuyMo(dv);
  const phaiN = Math.max(3, Math.round((tab === "cc" ? 38 : 16) * q * (0.6 + r() * 0.9)));
  const phaiT = Math.round((phaiN * (tab === "cc" ? 640 : 1_480) * (0.6 + r() * 0.9)) * 10) / 10;
  /* Tỷ lệ hoàn thành trải rộng 42–94% để bảng xếp hạng có đơn vị thật sự tụt
     lại, chứ không phải ba chục dòng quanh cùng một con số. */
  const tyLe = 0.42 + r() * 0.52;
  const daN = Math.round(phaiN * tyLe);
  const daT = Math.round(phaiT * (tyLe * (0.92 + r() * 0.16)) * 10) / 10;
  return { phaiN, phaiT, daN, daT, chuaN: phaiN - daN, chuaT: Math.round((phaiT - daT) * 10) / 10 };
}

function tongHop06(hatKy: number, dv: DonViQL1): OTongHop06 {
  const r = prng(hatCua(hatKy, dv.ma, "t06"));
  const q = heSoQuyMo(dv);
  const nnt06 = Math.max(2, Math.round(21 * q * (0.5 + r())));
  const tongNo = Math.round(nnt06 * 418 * (0.5 + r()) * 10) / 10;
  const tyLe = 0.3 + r() * 0.5;
  const daN = Math.round(nnt06 * tyLe);
  const daT = Math.round(tongNo * tyLe * (0.9 + r() * 0.2) * 10) / 10;
  return { nnt06, tongNo, daN, daT, chuaN: nnt06 - daN, chuaT: Math.round((tongNo - daT) * 10) / 10 };
}

/** Mục nào áp cho đơn vị nào. Tạm hoãn xuất cảnh không áp cho khối hộ kinh doanh. */
export const donViCuaTab = (tab: TabQL1) =>
  tab === "no" || tab === "cc" ? DON_VI_QL1 : DON_VI_QL1.filter((d) => d.id !== "HKD");

export const tongHopCuaTab = {
  no: tongHopNo,
  cc: (hat: number, dv: DonViQL1) => tongHopXuLy(hat, dv, "cc"),
  th: (hat: number, dv: DonViQL1) => tongHopXuLy(hat, dv, "th"),
  t06: tongHop06,
};

/* ---------- danh sách chi tiết ---------- */

export interface HangQL1 {
  id: string;
  mst: string;
  ten: string;
  donVi: string;
  maCQT: string;
  loaiNNT: string;
  chuong: string;
  nhomXuLy: string;
  /** Các cột tiền, triệu đồng. Mỗi mục chỉ dùng một phần trong số này. */
  noNgay: number;
  noDauNam: number;
  noThang: number;
  noDanhGia: number;
  tongDanhGia: number;
  nguong: number;
  tinhTrang: string;
  bienPhap: string;
  soQuyetDinh: string;
  ngayThucHien: string;
  ketLuan: string;
  ghiChu: string;
}

const LOAI_NNT = ["Doanh nghiệp, tổ chức", "Đơn vị sự nghiệp", "Hợp tác xã"];
const CHUONG = ["154", "254", "354", "554", "754"];
const NHOM_XU_LY = ["Bỏ địa chỉ kinh doanh", "Chờ xác minh", "Đã có quyết định", "Đang theo dõi"];
const BIEN_PHAP = ["Trích tiền từ tài khoản", "Thông báo hóa đơn không còn giá trị", "Kê biên tài sản", "Thu tiền của bên thứ ba"];

const TINH_TRANG = {
  cc: ["Đã cưỡng chế", "Chưa cưỡng chế", "Đang lập hồ sơ"],
  th: ["Đã tạm hoãn", "Chưa tạm hoãn", "Đã hủy tạm hoãn"],
  t06: ["Đã tạm hoãn", "Chưa tạm hoãn"],
  no: ["Đang theo dõi"],
};

const nhat = <T,>(r: () => number, bo: readonly T[]) => bo[Math.floor(r() * bo.length)];

/*
  Mã số thuế và tên đều là chuỗi KHÔNG trỏ tới ai: mã hiện dạng che theo đúng
  khuôn đã dùng trong bộ mô phỏng (`0108•••219`), tên là "Doanh nghiệp mô
  phỏng" cộng bốn chữ số. Một MST mười chữ số đầy đủ trong mockup có thể trùng
  một người nộp thuế có thật, và không ai kiểm được điều đó trước khi bản demo
  đã đi qua vài cuộc họp.
*/
export function danhSachQL1(hatKy: number, tab: TabQL1, soDong = 120): HangQL1[] {
  const r = prng(hatCua(hatKy, "DS", tab));
  const dsDonVi = donViCuaTab(tab);
  return Array.from({ length: soDong }, (_, i) => {
    const dv = dsDonVi[Math.floor(r() * dsDonVi.length)];
    const dau = 100 + Math.floor(r() * 99);
    const duoi = String(Math.floor(r() * 9000) + 1000);
    /* Danh sách tạm hoãn XC chỉ gồm NNT vượt ngưỡng, nên sàn của nó là chính
       ngưỡng ấy — sinh số thấp hơn rồi lọc bỏ là tạo rác rồi dọn. */
    const sanTHXC = trieu(NGUONG.thxcTien);
    const noNgay = Math.round((tab === "th" ? sanTHXC + r() * 7_400 : 180 + r() * 4_200) * 10) / 10;
    const noDauNam = Math.round(noNgay * (0.55 + r() * 0.7) * 10) / 10;
    const noThang = Math.round(noNgay * (0.88 + r() * 0.2) * 10) / 10;
    const noDanhGia = Math.round(noNgay * (0.7 + r() * 0.3) * 10) / 10;
    const tinhTrang = nhat(r, TINH_TRANG[tab]);
    const daLam = tinhTrang === "Đã cưỡng chế" || tinhTrang === "Đã tạm hoãn";
    return {
      id: `${tab}-${i}`,
      mst: `0${dau}•••${duoi.slice(-3)}`,
      ten: `Doanh nghiệp mô phỏng ${duoi}`,
      donVi: dv.ten,
      maCQT: dv.ma,
      loaiNNT: nhat(r, LOAI_NNT),
      chuong: nhat(r, CHUONG),
      nhomXuLy: nhat(r, NHOM_XU_LY),
      noNgay,
      noDauNam,
      noThang,
      noDanhGia,
      tongDanhGia: Math.round((noDanhGia + r() * 400) * 10) / 10,
      /* Ngưỡng lấy từ bảng tham số, không gõ lại: NT-06 đòi đổi ngưỡng là báo
         cáo đổi theo mà không phải sửa mã. */
      nguong: trieu(tab === "th" ? NGUONG.thxcTien : NGUONG.cuongCheTien),
      tinhTrang,
      bienPhap: tab === "cc" && daLam ? nhat(r, BIEN_PHAP) : "—",
      soQuyetDinh: tab === "cc" && daLam ? `${1000 + Math.floor(r() * 8999)}/QĐ-CCT` : "—",
      ngayThucHien: daLam ? `${String(1 + Math.floor(r() * 28)).padStart(2, "0")}/0${1 + Math.floor(r() * 7)}/2026` : "—",
      ketLuan: daLam ? "Đã thực hiện đúng quy định" : r() > 0.5 ? "Cần đôn đốc trong kỳ tới" : "Chờ bổ sung hồ sơ",
      ghiChu: r() > 0.72 ? "Số liệu lệch giữa hai nguồn, đang đối chiếu" : "—",
    };
  });
}
