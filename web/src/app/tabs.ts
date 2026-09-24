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
  /**
   * Nhãn dùng ở thanh điều hướng đáy trên điện thoại.
   *
   * Năm tab chia nhau 390px thì mỗi ô chỉ còn ~78px — "Chi tiết Địa bàn &
   * Đơn vị Thuế" không có cách nào vừa. Nhãn ngắn là MỘT TRƯỜNG RIÊNG chứ
   * không phải phép cắt chuỗi: cắt máy móc cho ra "Chi tiết Địa bà..." — mất
   * đúng phần phân biệt nó với tab khác. Nhãn đầy đủ vẫn nằm ở `aria-label`
   * nên trình đọc màn hình không mất gì.
   */
  short: string;
  question: string;
}

export const TABS: TabDef[] = [
  { id: "overview", label: "Tổng quan", short: "Tổng quan", question: "Tình hình thu ngân sách toàn thành phố ra sao?" },
  {
    id: "report",
    label: "Báo cáo",
    short: "Báo cáo",
    question: "Số thu chia theo địa bàn, cơ quan thuế hoặc ngành nghề thế nào?",
  },
  { id: "revenue-analysis", label: "Phân tích thu", short: "Phân tích", question: "Nguồn hoặc khoản thu nào tạo ra kết quả đó?" },
  {
    id: "location-detail",
    label: "Chi tiết Địa bàn & Đơn vị Thuế",
    short: "Chi tiết",
    question: "Một phường/xã hoặc một đơn vị thuế cụ thể đang hoạt động ra sao?",
  },
  { id: "advanced-compare", label: "So sánh nâng cao", short: "So sánh", question: "Hai kỳ, nguồn thu hoặc địa bàn khác nhau thế nào?" },
];
