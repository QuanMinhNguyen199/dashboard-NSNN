/*
  Danh mục dùng chung — DM-01 và DM-02 của FRS mục 4, số liệu lấy nguyên văn
  Phụ lục A (31 mã cơ quan thuế).

  FRS mở đầu mục 4 bằng một câu quyết định cách tệp này tồn tại: "Mọi phân hệ
  khác đọc danh mục từ đây, không tự giữ bản riêng." Trước đó mỗi phân hệ tự
  khai danh sách đơn vị của mình, và hai bản đã lệch nhau thật — mã viết tắt
  của Thuế cơ sở 18 đến 25 ở phân hệ QL3 sai so với Phụ lục A, còn năm Thuế cơ
  sở có HAI mã địa bàn thì không bản nào thể hiện.

  Ví dụ cụ thể của cái lệch ấy: Thuế cơ sở 18 gồm Sóc Sơn (0117) và Mê Linh
  (0127). Một báo cáo kéo theo mã địa bàn mà gom theo "Thuế cơ sở 18" sẽ phải
  cộng hai mã; bản khai cứng một mã một đơn vị thì âm thầm bỏ mất một nửa.
*/

export interface MaCQT {
  /** Mã bốn chữ số dùng khi kéo dữ liệu từ hệ thống nguồn. */
  ma: string;
  diaBan: string;
  vietTat: string;
  /** Đơn vị báo cáo chứa mã này. `null` với Văn phòng, vì nó tách về các phòng. */
  thuocTCS: number | null;
}

/** Phụ lục A — 31 mã: 0101 Văn phòng và 30 mã địa bàn. */
export const DANH_MUC_CQT: MaCQT[] = [
  { ma: "0101", diaBan: "Văn phòng Thuế TP Hà Nội", vietTat: "VPC", thuocTCS: null },
  { ma: "0103", diaBan: "Ba Đình", vietTat: "BDI", thuocTCS: 2 },
  { ma: "0105", diaBan: "Tây Hồ", vietTat: "THO", thuocTCS: 7 },
  { ma: "0106", diaBan: "Hoàn Kiếm", vietTat: "HKI", thuocTCS: 1 },
  { ma: "0107", diaBan: "Long Biên", vietTat: "LBI", thuocTCS: 11 },
  { ma: "0108", diaBan: "Hai Bà Trưng", vietTat: "HBT", thuocTCS: 3 },
  { ma: "0109", diaBan: "Hoàng Mai", vietTat: "HMA", thuocTCS: 13 },
  { ma: "0111", diaBan: "Đống Đa", vietTat: "DDA", thuocTCS: 4 },
  { ma: "0113", diaBan: "Thanh Xuân", vietTat: "TXU", thuocTCS: 6 },
  { ma: "0115", diaBan: "Cầu Giấy", vietTat: "CGI", thuocTCS: 5 },
  { ma: "0117", diaBan: "Sóc Sơn", vietTat: "SSO", thuocTCS: 18 },
  { ma: "0119", diaBan: "Đông Anh", vietTat: "DAN", thuocTCS: 10 },
  { ma: "0121", diaBan: "Gia Lâm", vietTat: "GLA", thuocTCS: 12 },
  { ma: "0125", diaBan: "Thanh Trì", vietTat: "TTR", thuocTCS: 14 },
  { ma: "0127", diaBan: "Mê Linh", vietTat: "MLI", thuocTCS: 18 },
  { ma: "0129", diaBan: "Hà Đông", vietTat: "HDO", thuocTCS: 15 },
  { ma: "0131", diaBan: "Sơn Tây", vietTat: "STA", thuocTCS: 16 },
  { ma: "0133", diaBan: "Phúc Thọ", vietTat: "PTH", thuocTCS: 25 },
  { ma: "0135", diaBan: "Đan Phượng", vietTat: "DPH", thuocTCS: 24 },
  { ma: "0137", diaBan: "Thạch Thất", vietTat: "TTH", thuocTCS: 22 },
  { ma: "0139", diaBan: "Hoài Đức", vietTat: "HDU", thuocTCS: 23 },
  { ma: "0141", diaBan: "Quốc Oai", vietTat: "QOA", thuocTCS: 22 },
  { ma: "0143", diaBan: "Thanh Oai", vietTat: "TOA", thuocTCS: 21 },
  { ma: "0145", diaBan: "Thường Tín", vietTat: "TTI", thuocTCS: 19 },
  { ma: "0147", diaBan: "Mỹ Đức", vietTat: "MDU", thuocTCS: 20 },
  { ma: "0149", diaBan: "Ứng Hòa", vietTat: "UHO", thuocTCS: 20 },
  { ma: "0151", diaBan: "Phú Xuyên", vietTat: "PXU", thuocTCS: 19 },
  { ma: "0153", diaBan: "Ba Vì", vietTat: "BVI", thuocTCS: 17 },
  { ma: "0155", diaBan: "Chương Mỹ", vietTat: "CMY", thuocTCS: 21 },
  { ma: "0156", diaBan: "Nam Từ Liêm", vietTat: "NTL", thuocTCS: 8 },
  { ma: "0157", diaBan: "Bắc Từ Liêm", vietTat: "BTL", thuocTCS: 9 },
];

/** Mã địa bàn của một Thuế cơ sở. Năm đơn vị có hai mã — xem ghi chú đầu tệp. */
export const maCuaTCS = (so: number) => DANH_MUC_CQT.filter((c) => c.thuocTCS === so);

/**
 * Nhãn một Thuế cơ sở dùng trên báo cáo: số thứ tự cộng mã viết tắt của các
 * địa bàn nó gồm. Đơn vị hai địa bàn hiện cả hai, vì đó là thông tin người
 * dùng cần khi đối chiếu với file kéo theo mã địa bàn.
 */
export const nhanTCS = (so: number) => {
  const ma = maCuaTCS(so).map((c) => c.vietTat);
  return `Thuế cơ sở ${String(so).padStart(2, "0")}${ma.length ? ` (${ma.join(", ")})` : ""}`;
};

export const SO_TCS = 25;
export const DAY_TCS = Array.from({ length: SO_TCS }, (_, i) => i + 1);

/*
  DM-02 — danh mục đơn vị báo cáo thuộc Văn phòng.

  FRS liệt kê: QLDN1–5 mã 10100P1–10100P5, Phòng Quản lý các khoản thu từ đất,
  CNTK, DLRR, QLĐ "và các phòng khác phát sinh". Bản demo dựng những phòng có
  mặt trong hai file kết xuất thật; `thuTu` là thứ tự hiển thị mà DM-02 yêu cầu
  giữ cố định, không phải thứ tự chữ cái.
*/
/*
  Bốn phân hệ KHÔNG dùng chung một danh mục khối Văn phòng, và đó là dữ liệu
  chứ không phải lựa chọn giao diện:

  • QL1 — bảy phòng, gồm cả Thuế cá nhân – HKD và Quản lý thu từ đất.
  • QL3 và QL2 — năm phòng QLDN. `design_ql2ql4` §4.1 ghi thẳng "Danh sách đơn
    vị giống QL3 (chỉ 5 phòng QLHTDN ở khối VP)" [F].
  • QL4 — SÁU dòng: năm phòng QLDN cộng Phòng Thuế cá nhân, hộ kinh doanh và
    thu khác (§5.1) [F]; đây là chỗ QL4 khác QL1 và QL3.
*/
export type PhanHeCoDonVi = "QL1" | "QL2" | "QL3" | "QL4";

export interface PhongVP {
  id: string;
  ten: string;
  /** Mã đơn vị trên TMS; các phòng QLDN dùng dạng 10100Px. */
  ma: string;
  thuTu: number;
  /** Phân hệ nào có phòng này trong danh mục của mình. */
  coO: PhanHeCoDonVi[];
}

export const PHONG_VP: PhongVP[] = [
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `P${i + 1}`,
    ten: `Phòng Quản lý, Hỗ trợ doanh nghiệp số ${i + 1}`,
    ma: `10100P${i + 1}`,
    thuTu: i + 1,
    coO: ["QL1", "QL2", "QL3", "QL4"] as PhanHeCoDonVi[],
  })),
  /* Hai phòng này KHÔNG làm kiểm tra tại bàn khối doanh nghiệp, nên danh mục
     của QL3 không có chúng — bản thiết kế §5.1 ghi rõ điều đó. */
  { id: "HKD", ten: "Phòng Thuế cá nhân, hộ kinh doanh và thu khác", ma: "10100P6", thuTu: 6, coO: ["QL1", "QL4"] },
  { id: "DAT", ten: "Phòng Quản lý các khoản thu từ đất", ma: "10100P7", thuTu: 7, coO: ["QL1"] },
];

export const phongVPCua = (phanHe: PhanHeCoDonVi) => PHONG_VP.filter((p) => p.coO.includes(phanHe));

/**
 * Tên đơn vị rút gọn để HIỂN THỊ ở chỗ hẹp (thanh bên, ô bảng).
 *
 * "Phòng Quản lý, Hỗ trợ doanh nghiệp số 1" dài 39 ký tự, ở thanh bên rộng
 * 228px nó xuống ba dòng và đẩy khối người dùng cao thêm 32px. Đây là rút gọn
 * cách hiển thị, không phải đổi dữ liệu — nơi gọi vẫn giữ tên đầy đủ trong
 * `title` để tra được bằng chuột và bằng trình đọc màn hình.
 */
export const rutGonTenDonVi = (ten: string) => ten
  .replace(/^Phòng Quản lý,\s*Hỗ trợ doanh nghiệp số\s*/i, "Phòng QLHT DN ")
  .replace(/^Phòng Quản lý các khoản thu từ đất$/i, "Phòng QL thu từ đất")
  .replace(/^Phòng Thuế cá nhân, hộ kinh doanh và thu khác$/i, "Phòng Thuế cá nhân – HKD");
