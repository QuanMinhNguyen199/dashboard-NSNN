import type { Phong, VaiTro } from "../domain/types";

export interface DemoUser {
  username: string;
  name: string;
  unit: string;
  /** Phòng nghiệp vụ. `null` với vai không thuộc phòng nào. */
  phong: Phong;
  vaiTro: VaiTro;
  permissions: readonly DemoPermission[];
}

export type DemoPermission = "TAX_OPS_VIEW" | "NSNN_VIEW";

export interface DemoAccount extends DemoUser {
  password: string;
  vaiTroLabel: string;
}

/*
  Tài khoản chia theo PHÒNG × VAI TRÒ, đúng ma trận ở mục 3 của bản thiết kế,
  và xếp theo SỐ PHÒNG: QL1 → QL2 → QL3 → QL4, mỗi phòng chuyên viên trước
  trưởng phòng. Thứ tự này là thứ tự người dùng đọc tên phòng của mình; xếp
  theo lúc nào tài khoản được thêm vào mã nguồn là bắt họ quét cả danh sách.

  Bản trước chỉ có một tài khoản "Cán bộ thuế" nhìn thấy cả chín màn. Thực tế
  không ai làm việc như thế: chuyên viên QL1 không mở báo cáo kiểm tra tại bàn
  của QL3, và bản thiết kế ghi thẳng "Xem phân hệ của phòng khác: ✗". Một tài
  khoản thấy mọi thứ làm cả bản demo nói sai về cách phân quyền sẽ chạy thật.

  `Vận hành dữ liệu` không thuộc phòng nào: vai này theo dõi job kéo và xử lý
  lỗi (Q-77), chỉ mở màn Giám sát dữ liệu.
*/
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { username: "cv.ql1", password: "demo123", name: "Nguyễn Minh Anh", unit: "Phòng Quản lý, Hỗ trợ doanh nghiệp số 1", phong: "QL1", vaiTro: "CV", vaiTroLabel: "Chuyên viên", permissions: ["TAX_OPS_VIEW"] },
  { username: "tp.ql1", password: "demo123", name: "Lê Thu Hà", unit: "Phòng Quản lý, Hỗ trợ doanh nghiệp số 1", phong: "QL1", vaiTro: "TP", vaiTroLabel: "Trưởng phòng", permissions: ["TAX_OPS_VIEW"] },
  /* Tên người đều là tên ĐẶT RA. Tài liệu thiết kế có nêu tên cán bộ thật ở
     cột "Hỏi ai", nhưng §1.2 mục 4 ghi "mọi mockup dùng dữ liệu giả", nên
     không tên nào trong số đó xuất hiện trên màn. */
  { username: "cv.ql2", password: "demo123", name: "Đỗ Khánh Linh", unit: "Phòng Quản lý, Hỗ trợ doanh nghiệp số 2", phong: "QL2", vaiTro: "CV", vaiTroLabel: "Chuyên viên", permissions: ["TAX_OPS_VIEW"] },
  { username: "tp.ql2", password: "demo123", name: "Bùi Trọng Nghĩa", unit: "Phòng Quản lý, Hỗ trợ doanh nghiệp số 2", phong: "QL2", vaiTro: "TP", vaiTroLabel: "Trưởng phòng", permissions: ["TAX_OPS_VIEW"] },
  { username: "cv.ql3", password: "demo123", name: "Trần Quang Dương", unit: "Phòng nghiệp vụ QL3", phong: "QL3", vaiTro: "CV", vaiTroLabel: "Chuyên viên", permissions: ["TAX_OPS_VIEW"] },
  { username: "tp.ql3", password: "demo123", name: "Phạm Thanh Vy", unit: "Phòng nghiệp vụ QL3", phong: "QL3", vaiTro: "TP", vaiTroLabel: "Trưởng phòng", permissions: ["TAX_OPS_VIEW"] },
  { username: "cv.ql4", password: "demo123", name: "Hoàng Diệu Chi", unit: "Phòng Quản lý, Hỗ trợ doanh nghiệp số 4", phong: "QL4", vaiTro: "CV", vaiTroLabel: "Chuyên viên", permissions: ["TAX_OPS_VIEW"] },
  { username: "tp.ql4", password: "demo123", name: "Ngô Bảo Sơn", unit: "Phòng Quản lý, Hỗ trợ doanh nghiệp số 4", phong: "QL4", vaiTro: "TP", vaiTroLabel: "Trưởng phòng", permissions: ["TAX_OPS_VIEW"] },
  /*
    Hai cán bộ đơn vị: một ở khối Văn phòng, một ở khối Thuế cơ sở. Cần đủ hai
    vì phiếu PRS-03 và PRS-05 tách theo đơn vị, và bản mẫu phải cho thấy được
    rằng mỗi người CHỈ nhìn thấy phần của đơn vị mình (S9).
  */
  { username: "vanhanh.dulieu", password: "demo123", name: "Vũ Hải Đăng", unit: "Tổ vận hành dữ liệu", phong: null, vaiTro: "VAN_HANH", vaiTroLabel: "Vận hành dữ liệu", permissions: ["TAX_OPS_VIEW"] },
  /* Lãnh đạo nhà nước KHÔNG có `TAX_OPS_VIEW`: đây là tài khoản của Dashboard
     Thu NSNN. Để trong danh sách để chứng minh được sự phân tách, không phải
     để nó vào được. */
  { username: "lanhdao.nhanuoc", password: "demo123", name: "Vũ Quang Đạt", unit: "Ủy ban nhân dân TP Hà Nội", phong: null, vaiTro: "LANH_DAO_NN", vaiTroLabel: "Lãnh đạo nhà nước", permissions: ["NSNN_VIEW"] },
];

const SESSION_KEY = "tax-ops-demo-user";

export function authenticate(username: string, password: string): DemoUser | null {
  const normalized = username.trim().toLowerCase();
  const account = DEMO_ACCOUNTS.find((item) => item.username === normalized && item.password === password);
  if (!account) return null;
  const { password: _password, vaiTroLabel: _label, ...user } = account;
  return user;
}

export function readDemoSession(): DemoUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<DemoUser>;
    const account = DEMO_ACCOUNTS.find((item) => item.username === value.username && item.vaiTro === value.vaiTro);
    if (!account) return null;
    const { password: _password, vaiTroLabel: _label, ...user } = account;
    return user;
  } catch {
    return null;
  }
}

export function writeDemoSession(user: DemoUser | null) {
  if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(SESSION_KEY);
}
