import type { IconName } from "@/components/ui";
import type { Phong, ViewId, VaiTro } from "@/domain/types";
import type { DemoUser } from "@/auth/demoAuth";

/*
  Quyền xem màn là tích của HAI trục, theo ma trận ở mục 3 bản thiết kế.

  `phong` liệt kê phòng nào mở được màn đó; `null` nghĩa là khung chung, mọi
  phòng đều mở. `vaiTro` liệt kê vai nào mở được. Một màn chỉ hiện khi người
  dùng khớp CẢ HAI.

  Bản thiết kế ghi "Xem phân hệ của phòng khác: ✗" và mục bảo mật S1 ghi "ẩn
  hẳn menu, không chỉ làm mờ" — nên đây là lọc danh sách, không phải vô hiệu
  hoá nút.
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
  { id: "workbench", label: "Trang công việc", short: "Công việc", icon: "home", nhom: "work", phong: null, vaiTro: NGHIEP_VU },

  { id: "debt", label: "Báo cáo nợ", short: "Nợ", icon: "debt", nhom: "phanhe", phong: ["QL1"], vaiTro: NGHIEP_VU },
  { id: "risk", label: "Kiểm tra tại bàn", short: "Kiểm tra", icon: "risk", nhom: "phanhe", phong: ["QL3"], vaiTro: NGHIEP_VU },
  { id: "reports", label: "Báo cáo", short: "Báo cáo", icon: "report", nhom: "phanhe", phong: null, vaiTro: NGHIEP_VU },

  { id: "runs", label: "Lượt chạy dữ liệu", short: "Lượt chạy", icon: "clock", nhom: "data", phong: null, vaiTro: NGHIEP_VU },
  { id: "batches", label: "Lô dữ liệu", short: "Lô dữ liệu", icon: "database", nhom: "data", phong: null, vaiTro: NGHIEP_VU },
  { id: "mapping", label: "Ánh xạ quản lý", short: "Ánh xạ", icon: "users", nhom: "data", phong: null, vaiTro: NGHIEP_VU },
  { id: "rules", label: "Quy tắc nghiệp vụ", short: "Quy tắc", icon: "file", nhom: "data", phong: null, vaiTro: NGHIEP_VU },

  /* Vai Vận hành dữ liệu không thuộc phòng nào và chỉ mở đúng màn này. */
  { id: "giamsat", label: "Giám sát dữ liệu", short: "Giám sát", icon: "clock", nhom: "vanhanh", phong: null, vaiTro: ["VAN_HANH"] },
];

export const NHOM: { id: MucNav["nhom"]; nhan: string }[] = [
  { id: "work", nhan: "Điều hành" },
  { id: "phanhe", nhan: "Phân hệ" },
  { id: "data", nhan: "Dữ liệu" },
  { id: "vanhanh", nhan: "Vận hành" },
];

/** Màn hình người dùng này mở được. Khi nối Keycloak, thay bằng client role trong token. */
export const navCho = (user: Pick<DemoUser, "phong" | "vaiTro">) =>
  NAV.filter((m) => m.vaiTro.includes(user.vaiTro) && (m.phong === null || (user.phong !== null && m.phong.includes(user.phong))));
