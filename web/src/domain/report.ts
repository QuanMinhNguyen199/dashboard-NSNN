import tree from "./report-tree.json";
import { LOCATIONS } from "./catalog";
import { TAX_OFFICES } from "./tms";

/**
 * Cây chỉ tiêu và tám mẫu báo cáo.
 *
 * Đây là trục của sản phẩm, không phải Chương với Tiểu mục. Chương và Tiểu mục
 * là **điều kiện lấy số** để ra 113 dòng này; không mẫu báo cáo nào lấy chúng
 * làm cột. Cột là địa bàn, cơ quan thuế hoặc ngành nghề.
 */

/**
 * Vai trò của một dòng trong cây, quyết định cách nó được tính và được cộng.
 *
 * `breakdown` và `ofWhich` là hai loại dòng **giải thích**: chúng có số nhưng
 * không được cộng vào dòng cha, vì cha đã bao gồm phần của chúng. Gộp chung
 * chúng với `direct` là cách cổ điển để tổng bị đếm hai lần.
 */
export type ReportRowKind = "formula" | "direct" | "breakdown" | "ofWhich" | "heading";

export interface ReportRowDef {
  /** Vị trí dòng trong hướng dẫn nghiệp vụ, giữ để đối chiếu với bản giấy. */
  line: number;
  id: string;
  parent: string | null;
  kind: ReportRowKind;
  name: string;
}

export const REPORT_ROWS = tree.rows as ReportRowDef[];

export const REPORT_ROW_BY_ID = Object.fromEntries(REPORT_ROWS.map((row) => [row.id, row]));

const CHILDREN = new Map<string | null, ReportRowDef[]>();
for (const row of REPORT_ROWS) {
  const list = CHILDREN.get(row.parent) ?? [];
  list.push(row);
  CHILDREN.set(row.parent, list);
}

export const childrenOf = (id: string | null): ReportRowDef[] => CHILDREN.get(id) ?? [];

export const ROOT_ROWS = childrenOf(null);

/**
 * Các dòng con **được cộng** vào dòng cha.
 *
 * Bỏ `breakdown` và `ofWhich` ra khỏi phép cộng: đó là lý do tồn tại của hàm
 * này, và cũng là tiêu chí nghiệm thu DS04.
 */
export const summableChildrenOf = (id: string) =>
  childrenOf(id).filter((row) => row.kind !== "breakdown" && row.kind !== "ofWhich");

/** Dòng lá theo nghĩa tính toán: có số của riêng nó, không cộng từ con. */
export const isLeaf = (row: ReportRowDef) =>
  row.kind === "direct" || row.kind === "breakdown" || row.kind === "ofWhich";

/* ─────────────────────────────── Chiều nhóm ─────────────────────────────── */

export type ReportDimension = "location" | "taxOffice" | "industry";

export interface DimensionMember {
  id: string;
  name: string;
}

/**
 * Mười ba nhóm ngành của danh bạ.
 *
 * Đây là danh mục `PL_NNKD` đã chuẩn hóa, không phải 1.834 mã ngành gốc. Mã gốc
 * dùng để nối từ mã số thuế; nhóm mới là chiều hiển thị của báo cáo.
 */
const INDUSTRY_GROUPS: DimensionMember[] = [
  { id: "thuong-mai", name: "Thương mại" },
  { id: "dich-vu", name: "Dịch vụ" },
  { id: "xay-dung", name: "Xây dựng" },
  { id: "khoa-hoc-y-te-giao-duc", name: "Khoa học, Y tế, Giáo dục" },
  { id: "cn-che-bien-che-tao", name: "Công nghiệp chế biến, chế tạo" },
  { id: "thong-tin-truyen-thong", name: "Thông tin, Truyền thông" },
  { id: "bat-dong-san", name: "Bất động sản" },
  { id: "van-tai", name: "Vận tải" },
  { id: "tai-chinh-ngan-hang-bao-hiem", name: "Tài chính, Ngân hàng, Bảo hiểm" },
  { id: "nong-lam-thuy-san", name: "Nông, Lâm, Thủy sản" },
  { id: "san-xuat", name: "Sản xuất" },
  { id: "khai-khoang", name: "Khai khoáng" },
  { id: "khac", name: "Khác" },
];

/**
 * Cấp thành phố là một phạm vi thật trên chứng từ, không phải một phường xã.
 *
 * Mã `10100000` xuất hiện trong chứng từ tháng 7/2025 với 69 dòng ở riêng một
 * đợt chiết. Danh mục 126 phường xã không có mã này, nên nếu không khai báo
 * riêng thì toàn bộ phần đó rơi vào nhóm chưa xác định và người đọc hiểu là dữ
 * liệu hỏng, trong khi nó là một cấp hạch toán hợp lệ.
 */
export const CITY_SCOPE = { id: "10100000", name: "Cấp thành phố" };

export interface DimensionDef {
  id: ReportDimension;
  name: string;
  /** Câu mô tả nguồn của chiều, hiện ở chú thích bảng. */
  source: string;
  members: DimensionMember[];
}

export const DIMENSIONS: DimensionDef[] = [
  {
    id: "location",
    name: "Địa bàn",
    source: "Cột địa bàn hai cấp trên chứng từ",
    members: [...LOCATIONS.map((item) => ({ id: item.id, name: item.name })), CITY_SCOPE],
  },
  {
    id: "taxOffice",
    name: "Cơ quan thuế",
    source: "Cột cơ quan thuế trên chứng từ",
    members: TAX_OFFICES.map((item) => ({ id: item.code, name: item.name })),
  },
  {
    id: "industry",
    name: "Ngành nghề",
    source: "Nối mã số thuế trên chứng từ sang danh bạ, lấy nhóm ngành",
    members: INDUSTRY_GROUPS,
  },
];

export const DIMENSION_BY_ID = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d])) as Record<
  ReportDimension,
  DimensionDef
>;

/**
 * Tám mẫu báo cáo là tám **cặp chiều**, không phải tám màn hình.
 *
 * Thứ tự lồng có nghĩa: mẫu 5 và mẫu 6 dùng cùng hai chiều nhưng đổi vai cha
 * con, và đặc tả yêu cầu hai mẫu đó phải cho cùng tổng trên cùng tập dữ liệu.
 */
export interface ReportTemplate {
  no: number;
  groupBy: ReportDimension;
  subGroupBy: ReportDimension | null;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  { no: 1, groupBy: "location", subGroupBy: null },
  { no: 2, groupBy: "taxOffice", subGroupBy: null },
  // Thứ tự lấy từ hai tầng header thực tế của từng sheet, không suy từ tên
  // sheet. Mẫu 3 ghi "CQT + địa bàn" nhưng header ngoài là địa bàn.
  { no: 3, groupBy: "location", subGroupBy: "taxOffice" },
  { no: 4, groupBy: "industry", subGroupBy: null },
  { no: 5, groupBy: "location", subGroupBy: "industry" },
  { no: 6, groupBy: "industry", subGroupBy: "location" },
  { no: 7, groupBy: "taxOffice", subGroupBy: "industry" },
  { no: 8, groupBy: "industry", subGroupBy: "taxOffice" },
];

/** Số hiệu mẫu của một cặp chiều; `null` khi cặp đó không nằm trong tám mẫu. */
export const templateNoOf = (
  groupBy: ReportDimension,
  subGroupBy: ReportDimension | null,
): number | null =>
  REPORT_TEMPLATES.find((t) => t.groupBy === groupBy && t.subGroupBy === subGroupBy)?.no ?? null;

/** Chiều còn lại được phép chọn làm chi tiết: khác chiều chính, hoặc bỏ trống. */
export const subDimensionsFor = (groupBy: ReportDimension): ReportDimension[] =>
  REPORT_TEMPLATES.filter((t) => t.groupBy === groupBy && t.subGroupBy !== null).map(
    (t) => t.subGroupBy as ReportDimension,
  );
