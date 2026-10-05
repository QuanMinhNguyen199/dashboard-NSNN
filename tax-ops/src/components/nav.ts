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
  • "Lượt chạy dữ liệu" + "Lô dữ liệu" — §1.2 gọi tên một màn duy nhất,
    "Tình trạng dữ liệu". Hai màn là hai nửa của cùng một câu hỏi: kỳ này dữ
    liệu đã về đủ chưa.
  • "Ánh xạ quản lý" — không có trong tài liệu như một màn. Nội dung của nó
    (YC-CĐ-03, YC-CĐ-04 của BRD) là một phần chất lượng dữ liệu của kỳ, nên
    nó thành một mục trong Tình trạng dữ liệu.
  • "Quy tắc nghiệp vụ" — §4.2 đặt nó làm tab 9 BÊN TRONG phân hệ QL1
    ("Quy tắc & nguồn"). Ngưỡng chỉ có nghĩa cùng với bảng số nó đang áp vào.

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
  { id: "risk", label: "Kiểm tra tại bàn", short: "Kiểm tra", icon: "risk", nhom: "phanhe", phong: ["QL3"], vaiTro: NGHIEP_VU },

  /* MH-03 — QT-08: bảng báo cáo × kỳ. Nó thuộc nhóm phân hệ vì nó nói về
     báo cáo của phòng, không phải về đường đi của dữ liệu. */
  { id: "theoky", label: "Báo cáo theo kỳ", short: "Theo kỳ", icon: "clock", nhom: "phanhe", phong: null, vaiTro: NGHIEP_VU },

  { id: "tinhtrang", label: "Tình trạng dữ liệu", short: "Dữ liệu", icon: "database", nhom: "data", phong: null, vaiTro: NGHIEP_VU },

  /* Vai Vận hành dữ liệu không thuộc phòng nào và chỉ mở đúng màn này. */
  { id: "giamsat", label: "Giám sát dữ liệu", short: "Giám sát", icon: "clock", nhom: "vanhanh", phong: null, vaiTro: ["VAN_HANH"] },
];

export const NHOM: { id: MucNav["nhom"]; nhan: string }[] = [
  { id: "work", nhan: "Điều hành" },
  { id: "phanhe", nhan: "Phân hệ của phòng" },
  { id: "data", nhan: "Dữ liệu" },
  { id: "vanhanh", nhan: "Vận hành" },
];

/** Màn hình người dùng này mở được. Khi nối Keycloak, thay bằng client role trong token. */
export const navCho = (user: Pick<DemoUser, "phong" | "vaiTro">) =>
  NAV.filter((m) => m.vaiTro.includes(user.vaiTro) && (m.phong === null || (user.phong !== null && m.phong.includes(user.phong))));
