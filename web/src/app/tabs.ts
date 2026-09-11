import type { TabId } from "@/domain/types";

/**
 * Danh mục workspace.
 *
 * Thêm hoặc đổi tên một tab thì sửa đúng file này cộng một nhánh trong
 * `App.tsx`. `question` là câu hỏi tab đó trả lời — hiện ở tooltip và dùng làm
 * thước đo: tab nào không nêu được câu hỏi riêng thì không nên tồn tại.
 */
export interface TabDef {
  id: TabId;
  label: string;
  question: string;
}

export const TABS: TabDef[] = [
  { id: "overview", label: "Tổng quan", question: "Tình hình thu ngân sách toàn thành phố ra sao?" },
  { id: "revenue-analysis", label: "Phân tích thu", question: "Nguồn hoặc khoản thu nào tạo ra kết quả đó?" },
  { id: "location-detail", label: "Chi tiết phường/xã", question: "Một địa bàn cụ thể đang hoạt động ra sao?" },
  { id: "advanced-compare", label: "So sánh nâng cao", question: "Hai kỳ, nguồn thu hoặc địa bàn khác nhau thế nào?" },
];
