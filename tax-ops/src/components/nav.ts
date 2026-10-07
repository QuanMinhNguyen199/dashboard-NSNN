import type { IconName } from "@/components/ui";
import type { Phong, ViewId, VaiTro } from "@/domain/types";
import type { DemoUser } from "@/auth/demoAuth";

/*
  Danh sách màn lấy theo §1.2 bản thiết kế — "Hạng mục thiết kế" — chứ không
  theo thói quen dựng dashboard.

  Tài liệu liệt kê đúng bốn thứ: khung chung (đăng nhập, thanh đầu trang, menu
  trái theo quyền, bộ lọc chung, màn **Tình trạng dữ liệu**), phân hệ QL1,
  phân hệ QL3, và — ở mục 3 — một màn **Giám sát dữ liệu** cho vai Vận hành.

  Bốn màn đã gỡ, kèm lý do:

  • "Báo cáo" — tài liệu không có màn danh sách báo cáo. Luồng duyệt ở mục 3
    diễn ra TRÊN phân hệ của kỳ đang xem (CV gửi duyệt → TP duyệt, trả lại,
    chốt số), nên nó chuyển vào thanh duyệt ngay đầu phân hệ. Một màn riêng
    bắt người dùng rời khỏi số liệu họ vừa đọc để đi tìm chính nó.
  • "Lượt chạy dữ liệu", "Lô dữ liệu", "Ánh xạ quản lý" — §1.2 gọi tên một
    màn duy nhất, "Tình trạng dữ liệu". Ba màn này từng gộp vào đó thành ba
    MỤC; ngày 06/10/2026 gỡ nốt cả ba tên mục, vì không tên nào có trong tài
    liệu và hai mục sau chỉ dựa vào BRD YC-CĐ-03/04 và FRS MH-05 — tài liệu
    tham chiếu, không phải tài liệu đặt phạm vi. Mục ánh xạ còn đi ngược G14
    ("Người dùng KHÔNG tách tay"). Màn giữ đúng thứ dòng 48 bản thiết kế đòi:
    lần kéo gần nhất, nguồn nào thiếu hay lệch ngày, số dòng nguồn so với kho.
  • "Quy tắc nghiệp vụ" — §4.2 đặt nó làm tab 9 BÊN TRONG phân hệ QL1
    ("Quy tắc & nguồn"). Ngưỡng chỉ có nghĩa cùng với bảng số nó đang áp vào.
  • "Báo cáo theo kỳ" (MH-03) — gỡ 06/10/2026. Nó có trong FRS mục 13 (MH-03,
    QT-08, mức "Phải") nhưng KHÔNG có trong hai bản thiết kế `design_ql1ql3`
    và `design_ql2ql4`, vốn là tài liệu đặt phạm vi cho bản mẫu này. Trạng
    thái của kỳ đang xem đã nằm ngay trên thanh duyệt của từng phân hệ, nên
    một bảng kỳ × trạng thái riêng chỉ nói lại thứ đã có, ở một chỗ khác.
    Khi FRS được đưa vào phạm vi thì dựng lại từ mã trong lịch sử git.

  Quyền xem là tích của HAI trục, theo ma trận mục 3. `phong` liệt kê phòng
  nào mở được; `null` là khung chung. Mục bảo mật S1 ghi "ẩn hẳn menu, không
  chỉ làm mờ", nên đây là lọc danh sách chứ không phải vô hiệu hoá nút.
*/
export interface MucNav {
  id: ViewId;
  label: string;
  short: string;
  icon: IconName;
  nhom: "work" | "phanhe" | "data" | "vanhanh";
  /** `null` = khung chung, mọi phòng đều mở. */
  phong: Phong[] | null;
  vaiTro: VaiTro[];
}

const NGHIEP_VU: VaiTro[] = ["CV", "TP"];

export const NHAN_VAI: Record<VaiTro, string> = { CV: "Chuyên viên", TP: "Trưởng phòng", VAN_HANH: "Vận hành dữ liệu", LANH_DAO_NN: "Lãnh đạo nhà nước" };

export const NAV: MucNav[] = [
  { id: "workbench", label: "Công việc theo kỳ", short: "Việc", icon: "home", nhom: "work", phong: null, vaiTro: NGHIEP_VU },

  { id: "debt", label: "Báo cáo công tác nợ", short: "Báo cáo nợ", icon: "debt", nhom: "phanhe", phong: ["QL1"], vaiTro: NGHIEP_VU },
  { id: "hoadon", label: "Rủi ro hóa đơn", short: "Hóa đơn", icon: "file", nhom: "phanhe", phong: ["QL2"], vaiTro: NGHIEP_VU },
  { id: "risk", label: "Kiểm tra tại bàn", short: "Kiểm tra", icon: "risk", nhom: "phanhe", phong: ["QL3"], vaiTro: NGHIEP_VU },
  { id: "tonghopql3", label: "Kết quả tổng hợp", short: "Tổng hợp", icon: "report", nhom: "phanhe", phong: ["QL3"], vaiTro: NGHIEP_VU },
  { id: "hoan", label: "Hoàn thuế TNCN và tổng đài", short: "Hoàn thuế", icon: "refund", nhom: "phanhe", phong: ["QL4"], vaiTro: NGHIEP_VU },

  { id: "tinhtrang", label: "Tình trạng dữ liệu", short: "Dữ liệu", icon: "database", nhom: "data", phong: null, vaiTro: NGHIEP_VU },

  /* Vai Vận hành dữ liệu không thuộc phòng nào và chỉ mở đúng màn này. */
  { id: "giamsat", label: "Giám sát dữ liệu", short: "Giám sát", icon: "clock", nhom: "vanhanh", phong: null, vaiTro: ["VAN_HANH"] },
];

/*
  Nhãn nhóm hiện ở MỌI nhóm, kể cả nhóm chỉ có một mục.

  Có lúc đã thử bỏ nhãn của nhóm một mục cho gọn. Nhưng nhãn ở đây không phải
  để phân loại trong nội bộ nhóm — nó nói mục bên dưới THUỘC LOẠI VIỆC NÀO, và
  câu đó vẫn đúng với một mục. Bỏ đi thì ba đích của một phòng đọc ra như một
  danh sách phẳng không thứ bậc, và lúc thêm mục thứ hai vào một nhóm thì nhãn
  lại xuất hiện — thanh bên đổi hình theo dữ liệu.
*/
export const NHOM: { id: MucNav["nhom"]; nhan: string }[] = [
  { id: "work", nhan: "Điều hành" },
  { id: "phanhe", nhan: "Phân hệ" },
  { id: "data", nhan: "Dữ liệu" },
  { id: "vanhanh", nhan: "Vận hành" },
];

/** Màn hình người dùng này mở được. Khi nối Keycloak, thay bằng client role trong token. */
export const navCho = (user: Pick<DemoUser, "phong" | "vaiTro">) =>
  NAV.filter((m) => m.vaiTro.includes(user.vaiTro) && (m.phong === null || (user.phong !== null && m.phong.includes(user.phong))));
