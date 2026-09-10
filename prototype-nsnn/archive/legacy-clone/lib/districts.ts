import type { WardRow } from "./types";

/**
 * `zf` — 30 quận/huyện trước 01/07/2025, trích nguyên văn từ bundle gốc.
 * Dùng cho nhánh địa giới lịch sử (năm 2024, và 2025 tháng 1–6 / quý 1–2).
 */
export const HISTORICAL_DISTRICTS: WardRow[] = [
  { location_code: "001", location_name: "Quận Ba Đình", name_slug: "ba_dinh" },
  { location_code: "002", location_name: "Quận Hoàn Kiếm", name_slug: "hoan_kiem" },
  { location_code: "003", location_name: "Quận Tây Hồ", name_slug: "tay_ho" },
  { location_code: "004", location_name: "Quận Long Biên", name_slug: "long_bien" },
  { location_code: "005", location_name: "Quận Cầu Giấy", name_slug: "cau_giay" },
  { location_code: "006", location_name: "Quận Đống Đa", name_slug: "dong_da" },
  { location_code: "007", location_name: "Quận Hai Bà Trưng", name_slug: "hai_ba_trung" },
  { location_code: "008", location_name: "Quận Hoàng Mai", name_slug: "hoang_mai" },
  { location_code: "009", location_name: "Quận Thanh Xuân", name_slug: "thanh_xuan" },
  { location_code: "016", location_name: "Huyện Sóc Sơn", name_slug: "soc_son" },
  { location_code: "017", location_name: "Huyện Đông Anh", name_slug: "dong_anh" },
  { location_code: "018", location_name: "Huyện Gia Lâm", name_slug: "gia_lam" },
  { location_code: "019", location_name: "Quận Nam Từ Liêm", name_slug: "nam_tu_liem" },
  { location_code: "020", location_name: "Huyện Thanh Trì", name_slug: "thanh_tri" },
  { location_code: "021", location_name: "Quận Bắc Từ Liêm", name_slug: "bac_tu_liem" },
  { location_code: "250", location_name: "Huyện Mê Linh", name_slug: "me_linh" },
  { location_code: "268", location_name: "Quận Hà Đông", name_slug: "ha_dong" },
  { location_code: "269", location_name: "Thị xã Sơn Tây", name_slug: "son_tay" },
  { location_code: "271", location_name: "Huyện Ba Vì", name_slug: "ba_vi" },
  { location_code: "272", location_name: "Huyện Phúc Thọ", name_slug: "phuc_tho" },
  { location_code: "273", location_name: "Huyện Đan Phượng", name_slug: "dan_phuong" },
  { location_code: "274", location_name: "Huyện Hoài Đức", name_slug: "hoai_duc" },
  { location_code: "275", location_name: "Huyện Quốc Oai", name_slug: "quoc_oai" },
  { location_code: "276", location_name: "Huyện Thạch Thất", name_slug: "thach_that" },
  { location_code: "277", location_name: "Huyện Chương Mỹ", name_slug: "chuong_my" },
  { location_code: "278", location_name: "Huyện Thanh Oai", name_slug: "thanh_oai" },
  { location_code: "279", location_name: "Huyện Thường Tín", name_slug: "thuong_tin" },
  { location_code: "280", location_name: "Huyện Phú Xuyên", name_slug: "phu_xuyen" },
  { location_code: "281", location_name: "Huyện Ứng Hòa", name_slug: "ung_hoa" },
  { location_code: "282", location_name: "Huyện Mỹ Đức", name_slug: "my_duc" },
];
