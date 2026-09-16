import wards from "./wards.json";
import joins from "./tms-joins.json";

/**
 * Danh mục chỉ tiêu — nguồn sự thật cho mọi widget.
 *
 * Phân cấp: Thu NSNN → nguồn (I–VIII, gộp thành 4 nhóm hiển thị) → khoản thu.
 * Khoản thu KHÔNG đồng nghĩa sắc thuế, và mã con luôn mang mã cha để `I.1.1`
 * không bị lẫn với `III.1.1`.
 */

export type SourceCode = "domestic" | "import-export" | "crude-oil" | "other";
export type BudgetLevel = "NSTW" | "NSDP";

export interface SourceDef {
  code: SourceCode;
  name: string;
  shortName: string;
  /** Nguồn cấp I–VIII gộp vào nhóm hiển thị này. */
  romanCodes: string[];
  /** Nguồn trung ương quản lý, không phân bổ theo phường/xã. */
  cityOnly: boolean;
  note?: string;
}

export const SOURCES: SourceDef[] = [
  {
    code: "domestic",
    name: "Thu nội địa không kể dầu thô",
    shortName: "Thu nội địa",
    romanCodes: ["I"],
    cityOnly: false,
  },
  {
    code: "import-export",
    name: "Thu cân đối từ hoạt động xuất nhập khẩu",
    shortName: "Thu xuất nhập khẩu",
    romanCodes: ["III"],
    cityOnly: true,
    note: "Cơ quan hải quan quản lý, hạch toán ở cấp thành phố nên không phân bổ theo phường, xã.",
  },
  {
    code: "crude-oil",
    name: "Thu về dầu thô",
    shortName: "Thu dầu thô",
    romanCodes: ["II"],
    cityOnly: true,
    note: "Thu điều tiết trung ương, không phân bổ theo phường, xã.",
  },
  {
    code: "other",
    name: "Thu khác (IV–VIII)",
    shortName: "Thu khác",
    romanCodes: ["IV", "V", "VI", "VII", "VIII"],
    cityOnly: false,
    note: "Gộp đủ năm nguồn IV–VIII; nguồn V và VIII có thể mang giá trị âm hợp lệ.",
  },
];

/**
 * Hai nguồn thu chỉ ghép được khi cùng phạm vi phân bổ: nguồn phân bổ về địa bàn
 * và nguồn do trung ương quản lý không có mẫu số chung nên đặt cạnh nhau là sai.
 * Luật này chi phối cả giá trị mặc định, ô chọn, lẫn điều kiện gọi dữ liệu — để
 * ba chỗ đó lệch nhau thì người dùng rơi vào cặp mà chính giao diện cấm.
 */
export const sameAllocationScope = (a: SourceCode, b: SourceCode) =>
  SOURCE_BY_CODE[a].cityOnly === SOURCE_BY_CODE[b].cityOnly;

/** Nguồn ghép được với `a` và khác `a`; dùng khi vế A đổi làm vế B thành vô lệ. */
export const firstComparableTo = (a: SourceCode): SourceCode =>
  (SOURCES.find((s) => s.code !== a && sameAllocationScope(a, s.code)) ?? SOURCES[0]).code;

export const SOURCE_BY_CODE = Object.fromEntries(SOURCES.map((s) => [s.code, s])) as Record<
  SourceCode,
  SourceDef
>;

export interface ItemDef {
  /** Mã đầy đủ mang đường dẫn cha, ví dụ `I.1.1`. */
  code: string;
  /** Mã hiển thị trong bảng theo đúng đặc tả v2. */
  localCode: string;
  name: string;
  source: SourceCode;
  /** Nhóm phân tích của khoản thu nội địa. */
  group?: DomesticGroupId;
  /** Dòng hoàn thuế/khấu trừ: trừ ra khi tính thu ròng. */
  deduction?: boolean;
}

/** Đúng 21 khoản thu nội địa theo đặc tả v2 — không thêm chỉ tiêu cha `1`. */
export const DOMESTIC_ITEMS: ItemDef[] = [
  { code: "I.1.1", localCode: "1.1", name: "Doanh nghiệp nhà nước trung ương", source: "domestic", group: "sxkd" },
  { code: "I.1.2", localCode: "1.2", name: "Doanh nghiệp nhà nước địa phương", source: "domestic", group: "sxkd" },
  { code: "I.2", localCode: "2", name: "Doanh nghiệp có vốn đầu tư nước ngoài", source: "domestic", group: "sxkd" },
  { code: "I.3", localCode: "3", name: "Khu vực kinh tế ngoài quốc doanh", source: "domestic", group: "sxkd" },
  { code: "I.4", localCode: "4", name: "Thuế thu nhập cá nhân", source: "domestic", group: "phi-le-phi-khac" },
  { code: "I.5", localCode: "5", name: "Thuế bảo vệ môi trường", source: "domestic", group: "phi-le-phi-khac" },
  { code: "I.6", localCode: "6", name: "Lệ phí trước bạ", source: "domestic", group: "phi-le-phi-khac" },
  { code: "I.7", localCode: "7", name: "Phí, lệ phí", source: "domestic", group: "phi-le-phi-khac" },
  { code: "I.8", localCode: "8", name: "Thuế sử dụng đất nông nghiệp", source: "domestic", group: "nha-dat" },
  { code: "I.9", localCode: "9", name: "Thuế sử dụng đất phi nông nghiệp", source: "domestic", group: "nha-dat" },
  { code: "I.10", localCode: "10", name: "Tiền thuê đất, thuê mặt nước", source: "domestic", group: "nha-dat" },
  { code: "I.11", localCode: "11", name: "Tiền sử dụng đất", source: "domestic", group: "nha-dat" },
  { code: "I.12", localCode: "12", name: "Thuê và bán nhà thuộc sở hữu nhà nước", source: "domestic", group: "nha-dat" },
  { code: "I.13", localCode: "13", name: "Hoạt động xổ số kiến thiết", source: "domestic", group: "phi-le-phi-khac" },
  { code: "I.14", localCode: "14", name: "Cấp quyền khai thác khoáng sản, tài nguyên nước", source: "domestic", group: "phi-le-phi-khac" },
  { code: "I.15", localCode: "15", name: "Tiền sử dụng khu vực biển", source: "domestic", group: "phi-le-phi-khac" },
  { code: "I.16", localCode: "16", name: "Thu khác ngân sách", source: "domestic", group: "phi-le-phi-khac" },
  { code: "I.17", localCode: "17", name: "Quỹ đất công ích, hoa lợi công sản", source: "domestic", group: "phi-le-phi-khac" },
  { code: "I.18", localCode: "18", name: "Cổ tức, lợi nhuận, vốn nhà nước địa phương hưởng", source: "domestic", group: "phi-le-phi-khac" },
  { code: "I.19", localCode: "19", name: "Cổ tức, lợi nhuận, vốn nhà nước trung ương hưởng", source: "domestic", group: "phi-le-phi-khac" },
  { code: "I.20", localCode: "20", name: "Chênh lệch thu chi Ngân hàng Nhà nước", source: "domestic", group: "phi-le-phi-khac" },
];

/** Nhóm phân tích của khoản thu nội địa (đặc tả v2 §3). */
/**
 * Ba nhóm lớn của thu nội địa — tầng giữa mà 21 khoản được gộp vào.
 *
 * Danh sách thành viên **không** lặp lại ở đây: trường `group` trên từng khoản
 * trong `DOMESTIC_ITEMS` là nguồn duy nhất. Trước đây nhóm còn mang thêm mảng
 * `codes` liệt kê lại chính các khoản đó — hai danh sách song song luôn có ngày
 * lệch nhau, và khi lệch thì không có cách nào biết bên nào đúng.
 */
export const DOMESTIC_GROUPS = [
  { id: "sxkd", name: "Khối doanh nghiệp", note: "Doanh nghiệp nhà nước, FDI và ngoài quốc doanh" },
  { id: "nha-dat", name: "Khối nhà đất", note: "Tiền sử dụng đất, thuê đất và thuế liên quan" },
  { id: "phi-le-phi-khac", name: "Khối phí, lệ phí và khoản khác", note: "Thuế TNCN, phí, lệ phí và các khoản còn lại" },
] as const;

export type DomesticGroupId = (typeof DOMESTIC_GROUPS)[number]["id"];

/** Bảy dòng gộp và ba dòng hoàn để tính thu XNK ròng. */
export const IMPORT_EXPORT_ITEMS: ItemDef[] = [
  { code: "III.1.1", localCode: "1.1", name: "Thuế xuất khẩu", source: "import-export" },
  { code: "III.1.2", localCode: "1.2", name: "Thuế nhập khẩu", source: "import-export" },
  { code: "III.1.3", localCode: "1.3", name: "Thuế TTĐB hàng nhập khẩu", source: "import-export" },
  { code: "III.1.4", localCode: "1.4", name: "Thuế GTGT hàng nhập khẩu", source: "import-export" },
  { code: "III.1.5", localCode: "1.5", name: "Thuế bổ sung hàng nhập khẩu", source: "import-export" },
  { code: "III.1.6", localCode: "1.6", name: "Thuế BVMT hàng nhập khẩu", source: "import-export" },
  { code: "III.1.7", localCode: "1.7", name: "Thu khác từ hoạt động xuất nhập khẩu", source: "import-export" },
  { code: "III.2.1", localCode: "2.1", name: "Hoàn thuế GTGT", source: "import-export", deduction: true },
  { code: "III.2.2", localCode: "2.2", name: "Hoàn thuế XNK ưu đãi ô tô, công nghiệp hỗ trợ", source: "import-export", deduction: true },
  { code: "III.2.3", localCode: "2.3", name: "Hoàn thuế TTĐB xăng khoáng", source: "import-export", deduction: true },
];

export const CRUDE_OIL_ITEMS: ItemDef[] = [
  { code: "II.1", localCode: "1", name: "Dầu thô", source: "crude-oil" },
  { code: "II.2", localCode: "2", name: "Condensate", source: "crude-oil" },
];

/** Năm nguồn IV–VIII giữ nguyên nhận diện, kể cả khi bằng 0. */
export const OTHER_ITEMS: ItemDef[] = [
  { code: "IV", localCode: "IV", name: "Thu viện trợ", source: "other" },
  { code: "V", localCode: "V", name: "Các khoản huy động, đóng góp", source: "other" },
  { code: "VI", localCode: "VI", name: "Thu hồi cho vay, quỹ dự trữ tài chính", source: "other" },
  { code: "VII", localCode: "VII", name: "Tạm thu ngân sách", source: "other" },
  { code: "VIII", localCode: "VIII", name: "Khoản thu NSNN không có trong công thức", source: "other" },
];

export const ALL_ITEMS: ItemDef[] = [
  ...DOMESTIC_ITEMS,
  ...IMPORT_EXPORT_ITEMS,
  ...CRUDE_OIL_ITEMS,
  ...OTHER_ITEMS,
];

export const ITEM_BY_CODE = Object.fromEntries(ALL_ITEMS.map((i) => [i.code, i]));

export const itemsOfSource = (source: SourceCode) =>
  ALL_ITEMS.filter((item) => item.source === source);

/** Ba chỉ tiêu tổng — là các tổng khác nhau, không phải một field. */
export const INDICATORS = [
  { slug: "tong-so", name: "TỔNG SỐ", note: "Gồm cả vay và thu chuyển giao." },
  { slug: "thu-nsnn", name: "THU NGÂN SÁCH NHÀ NƯỚC", note: "Thu thuần, không gồm vay và chuyển giao." },
  {
    slug: "tong-so-tru-hoan-thue",
    name: "TỔNG SỐ (Đã loại trừ hoàn thuế GTGT)",
    note: "Tổng số sau khi trừ hoàn thuế giá trị gia tăng.",
  },
] as const;

export type IndicatorSlug = (typeof INDICATORS)[number]["slug"];
export const INDICATOR_BY_SLUG = Object.fromEntries(INDICATORS.map((i) => [i.slug, i]));

export interface LocationDef {
  id: string;
  name: string;
  slug: string;
  /**
   * Mã địa bàn 2 cấp của TMS, tám chữ số.
   *
   * `id` là mã Cục Thống kê — khoá mà dashboard dùng từ đầu. TMS đánh số địa bàn
   * theo hệ riêng, nên nối chứng từ về phường/xã cần đúng cặp mã này. Bảng nối
   * do bên nghiệp vụ bàn giao; `undefined` nghĩa là địa bàn chưa có mã TMS, và
   * phải giữ nguyên trạng thái đó chứ không suy từ tên.
   */
  tmsCode?: string;
}

/** Mã TMS theo mã Cục Thống kê, dựng một lần từ bảng nối đã bàn giao. */
const TMS_CODE_BY_LOCATION: Record<string, string> = Object.fromEntries(
  (joins.locations as { tmsCode: string; locationCode: string }[]).map((x) => [x.locationCode, x.tmsCode]),
);

/**
 * 126 phường/xã có thật. Dòng tổng của Kho bạc và dòng tổng thành phố KHÔNG nằm
 * trong danh mục này, nên không bao giờ lọt vào bảng xếp hạng địa bàn.
 */
export const LOCATIONS: LocationDef[] = (wards as { location_code: string; location_name: string; name_slug: string }[])
  .filter((w) => /^\d{5}$/.test(w.location_code))
  .map((w) => ({
    id: w.location_code,
    name: w.location_name,
    slug: w.name_slug,
    tmsCode: TMS_CODE_BY_LOCATION[w.location_code],
  }))
  .sort((a, b) => new Intl.Collator("vi").compare(a.name, b.name));

export const LOCATION_BY_ID = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]));

export const YEARS = [2026, 2025, 2024] as const;

/** Tháng cuối cùng thực sự có dữ liệu. Tháng sau đó là null, không phải 0. */
/**
 * Giá trị `period` nghĩa là "tất cả các kỳ đã có số liệu của năm".
 * Dùng 0 vì mọi kỳ thật đều đánh số từ 1, nên không đụng giá trị hợp lệ nào.
 */
export const ALL_PERIODS = 0;

export const latestMonth = (year: number) => (year === 2026 ? 8 : 12);
