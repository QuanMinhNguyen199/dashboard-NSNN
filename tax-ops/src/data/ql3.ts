/*
  Dữ liệu GIẢ cho phân hệ Kiểm tra tại bàn của phòng QL3.

  Cấu trúc lấy từ file kết xuất thật `1_QL3_3_KQ tong hop cuoi cung.xls`:
  một sheet, 17 cột, một dòng tiêu đề, kỳ LŨY KẾ từ 01/01 đến ngày báo cáo.
  Mọi con số dưới đây do hàm sinh ra; mục S5 bản thiết kế: mockup chỉ dùng dữ
  liệu giả.
*/

export interface DonViQL3 {
  id: string;
  ten: string;
  nhom: "VP" | "TCS";
}

/*
  Danh mục đơn vị của QL3 KHÁC QL1, và khác ở hai chỗ cụ thể.

  Một: khối Văn phòng chỉ có năm phòng QLHTDN — không có Phòng Thuế cá nhân,
  hộ kinh doanh và cũng không có Phòng Quản lý các khoản thu từ đất, vì hai
  phòng ấy không làm kiểm tra tại bàn khối doanh nghiệp.

  Hai: thuế cơ sở ở đây mang MÃ CHỮ theo địa bàn — "Thuế cơ sở 01 (HKI)" —
  trong khi file QL1 chỉ ghi "Thuế cơ sở 1". Dùng chung một danh mục cho cả
  hai phân hệ sẽ sai ở một trong hai.
*/
const MA_DIA_BAN = [
  "HKI", "BDI", "HBT", "DDA", "CGI", "TXU", "THO", "NTL", "BTL", "DAN",
  "LBI", "GLA", "HMA", "TTR", "HDO", "STA", "BVI", "PTH", "MDU", "CMY",
  "TOA", "QOA", "SOT", "UHO", "MLI",
];

export const DON_VI_QL3: DonViQL3[] = [
  ...Array.from({ length: 5 }, (_, i) => ({ id: `P${i + 1}`, ten: `Phòng QLHTDN ${i + 1}`, nhom: "VP" as const })),
  ...MA_DIA_BAN.map((ma, i) => ({ id: `T${i + 1}`, ten: `Thuế cơ sở ${String(i + 1).padStart(2, "0")} (${ma})`, nhom: "TCS" as const })),
];

export interface KyQL3 {
  id: string;
  /** Lũy kế: luôn từ 01/01 của năm đến ngày này. */
  denNgay: string;
  nhan: string;
  thangKPI: string;
  hat: number;
}

export const KY_QL3: KyQL3[] = [
  { id: "q3-08", denNgay: "31/08/2026", nhan: "Lũy kế 01/01/2026 – 31/08/2026", thangKPI: "tháng 8/2026", hat: 2608 },
  { id: "q3-07", denNgay: "31/07/2026", nhan: "Lũy kế 01/01/2026 – 31/07/2026", thangKPI: "tháng 7/2026", hat: 2607 },
  { id: "q3-06", denNgay: "30/06/2026", nhan: "Lũy kế 01/01/2026 – 30/06/2026", thangKPI: "tháng 6/2026", hat: 2606 },
];

export const KY_QL3_MAC_DINH = KY_QL3[0].id;
export const KY_QL3_THEO_ID = Object.fromEntries(KY_QL3.map((k) => [k.id, k]));

function prng(hat: number) {
  let a = hat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hatCua = (hatKy: number, id: string) => {
  let h = hatKy;
  for (const k of id) h = (Math.imul(h, 31) + k.charCodeAt(0)) >>> 0;
  return h;
};

/** Một dòng của bảng — đúng 17 cột của sheet gốc, trừ cột tên đơn vị. */
export interface ODanhGiaQL3 {
  keHoach: number;
  daThucHien: number;
  daHoanThanh: number;
  kpiDangKy: number;
  chapNhan: number;
  choGiaiTrinh: number;
  dieuChinh: number;
  deNghiKiemTra: number;
  tangThu: number;
  giamKhauTru: number;
  giamLo: number;
  tienPhat: number;
  nopCham: number;
}

export function danhGiaQL3(hatKy: number, dv: DonViQL3): ODanhGiaQL3 {
  const r = prng(hatCua(hatKy, dv.id));
  const quyMo = dv.nhom === "VP" ? 1 : 1.6;
  const keHoach = Math.round((180 + r() * 480) * quyMo);
  const daThucHien = Math.round(keHoach * (0.18 + r() * 0.62));
  /*
    Đã hoàn thành KHÔNG tính hồ sơ chờ giải trình, nên nó luôn nhỏ hơn đã thực
    hiện — đúng định nghĩa cột trong file gốc. Sinh nó như một phần của đã
    thực hiện thay vì sinh độc lập, nếu không bảng sẽ có đơn vị hoàn thành
    nhiều hơn số đã làm.
  */
  const daHoanThanh = Math.round(daThucHien * (0.2 + r() * 0.6));
  const choGiaiTrinh = daThucHien - daHoanThanh;
  /* Bốn cột trạng thái cộng lại đúng bằng số đã thực hiện. */
  const dieuChinh = Math.round(daHoanThanh * (r() * 0.22));
  const deNghiKiemTra = Math.round(daHoanThanh * (r() * 0.18));
  const chapNhan = daHoanThanh - dieuChinh - deNghiKiemTra;
  const coDieuChinh = dieuChinh > 0;
  return {
    keHoach,
    daThucHien,
    daHoanThanh,
    kpiDangKy: Math.round(keHoach * (0.1 + r() * 0.26)),
    chapNhan,
    choGiaiTrinh,
    dieuChinh,
    deNghiKiemTra,
    /* Không điều chỉnh thì không có số thu — để số dương ở đó là bảng tự mâu thuẫn. */
    tangThu: coDieuChinh ? Math.round(dieuChinh * (12_000_000 + r() * 90_000_000)) : 0,
    giamKhauTru: coDieuChinh && r() > 0.7 ? Math.round(dieuChinh * r() * 24_000_000) : 0,
    giamLo: coDieuChinh && r() > 0.5 ? Math.round(dieuChinh * r() * 160_000_000) : 0,
    tienPhat: coDieuChinh && r() > 0.6 ? Math.round(dieuChinh * r() * 9_000_000) : 0,
    nopCham: coDieuChinh && r() > 0.55 ? Math.round(dieuChinh * r() * 4_000_000) : 0,
  };
}

/** Cộng nhiều dòng thành một dòng tổng. Dòng khối và dòng toàn ngành đều dùng nó. */
export function congQL3(bo: ODanhGiaQL3[]): ODanhGiaQL3 {
  const ra = {} as Record<string, number>;
  for (const o of bo) for (const [k, v] of Object.entries(o)) ra[k] = (ra[k] ?? 0) + v;
  return ra as unknown as ODanhGiaQL3;
}
