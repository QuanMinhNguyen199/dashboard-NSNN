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
  nhom: "work" | "qtcv" | "phanhe" | "data" | "vanhanh";
  /** Tuyến ẩn: mở được bằng đường dẫn nhưng không đứng trên thanh bên. */
  an?: boolean;
  /** Mục thanh bên sáng lên khi đang ở tuyến ẩn này. */
  thuoc?: ViewId;
  /** `null` = khung chung, mọi phòng đều mở. */
  phong: Phong[] | null;
  vaiTro: VaiTro[];
}

const NGHIEP_VU: VaiTro[] = ["CV", "TP"];

/* Bốn vai của không gian làm việc khối QLDN (biên bản 09/10/2026 §3). */
const KHOI_QLDN: VaiTro[] = ["CV", "PP", "TP", "LD_TP"];

export const NHAN_VAI: Record<VaiTro, string> = { CV: "Chuyên viên", PP: "Phó phòng", TP: "Trưởng phòng", LD_TP: "Lãnh đạo Thuế TP", VAN_HANH: "Vận hành dữ liệu", LANH_DAO_NN: "Lãnh đạo nhà nước" };

export const NAV: MucNav[] = [
  /* Ba mô-đun của không gian làm việc chung khối QLDN — biên bản 09/10/2026
     "Yêu cầu không gian làm việc khối QLDN": một giao diện cho mọi vai, dữ
     liệu lọc theo phân quyền TMS 2.4.2. */
  { id: "doituong", label: "Tổng quan đối tượng", short: "Đối tượng", icon: "users", nhom: "work", phong: null, vaiTro: KHOI_QLDN },
  { id: "canhbao", label: "Cảnh báo nhắc việc", short: "Cảnh báo", icon: "alert", nhom: "work", phong: null, vaiTro: KHOI_QLDN },

  /*
    QUẢN TRỊ CÔNG VIỆC (chốt 13/10/2026): bốn nhóm lớn của file chấm điểm lên
    thanh bên, thay cho bốn tab trên trang. Nhóm "Phân hệ" theo phòng đã gỡ —
    biên bản yêu cầu khối QLDN: "không chia theo kiểu phòng 1 làm nợ, phòng 3
    làm kiểm tra". Báo cáo của bốn phòng nằm trong nhóm chỉ tiêu nó đo, sau
    công tắc "Kết quả | Báo cáo" — xem `features/qldn/BaoCaoPhanHe`.
  */
  { id: "dieuhanh", label: "Tổng quan kết quả", short: "Kết quả", icon: "report", nhom: "qtcv", phong: null, vaiTro: KHOI_QLDN },
  { id: "kq-thu", label: "Thu NSNN", short: "Thu", icon: "report", nhom: "qtcv", phong: null, vaiTro: KHOI_QLDN },
  { id: "kq-no", label: "Quản lý nợ", short: "Nợ", icon: "debt", nhom: "qtcv", phong: null, vaiTro: KHOI_QLDN },
  { id: "kq-tthc", label: "Thủ tục hành chính", short: "TTHC", icon: "file", nhom: "qtcv", phong: null, vaiTro: KHOI_QLDN },
  { id: "kq-qlht", label: "Quản lý, hỗ trợ DN", short: "QL, hỗ trợ", icon: "risk", nhom: "qtcv", phong: null, vaiTro: KHOI_QLDN },

  /* Bốn phân hệ cũ thành TUYẾN ẨN: liên kết đã gửi và các chốt kiểm vẫn mở
     được, và mục nhóm chứa báo cáo của nó sáng lên trên thanh bên. */
  { id: "debt", label: "Báo cáo công tác nợ", short: "Báo cáo nợ", icon: "debt", nhom: "phanhe", phong: ["QL1"], vaiTro: NGHIEP_VU, an: true, thuoc: "kq-no" },
  { id: "hoadon", label: "Rủi ro hóa đơn", short: "Hóa đơn", icon: "file", nhom: "phanhe", phong: ["QL2"], vaiTro: NGHIEP_VU, an: true, thuoc: "kq-qlht" },
  { id: "risk", label: "Kiểm tra tại bàn", short: "Kiểm tra", icon: "risk", nhom: "phanhe", phong: ["QL3"], vaiTro: NGHIEP_VU, an: true, thuoc: "kq-qlht" },
  { id: "hoan", label: "Hoàn thuế TNCN và tổng đài", short: "Hoàn thuế", icon: "refund", nhom: "phanhe", phong: ["QL4"], vaiTro: NGHIEP_VU, an: true, thuoc: "kq-qlht" },

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
  { id: "qtcv", nhan: "Quản trị công việc" },
  { id: "phanhe", nhan: "Phân hệ" },
  { id: "data", nhan: "Dữ liệu" },
  { id: "vanhanh", nhan: "Vận hành" },
];

/** Phân hệ của từng phòng — dùng để biết "báo cáo của phòng mình" là màn nào. */
export const PHAN_HE_CUA: Record<string, ViewId> = { QL1: "debt", QL2: "hoadon", QL3: "risk", QL4: "hoan" };

/*
  Màn hình người dùng này mở được.

  Từ 09/10/2026 thanh bên mở CẢ NĂM PHÒNG cho mọi tài khoản nghiệp vụ, không
  còn cắt theo phòng của người đăng nhập. Quyết định của người dùng, và nó
  LỆCH khỏi mục S1 ("ẩn hẳn menu, không chỉ làm mờ") cùng ma trận §3 — nên nó
  được ghi ở đây kèm lý do thay vì để người sau phát hiện rồi đoán: bản mẫu
  này được xem bằng cách đi hết bốn phòng trong một phiên, và một tài khoản
  chỉ mở được một phòng thì người xem phải đăng xuất ba lần để đi hết hệ.

  Trục VAI TRÒ vẫn cắt như cũ: Vận hành dữ liệu chỉ mở màn giám sát, Lãnh đạo
  nhà nước không mở màn nào của hệ này. Đó mới là trục quyết định ai LÀM được
  gì; trục phòng chỉ quyết định ai thấy số của ai, và bản mẫu dùng dữ liệu mô
  phỏng nên không có số thật nào để che.

  Khi nối Keycloak, chỗ này đọc client role trong token, và lúc ấy trục phòng
  phải bật lại theo đúng ma trận §3.
*/
export const navCho = (user: Pick<DemoUser, "phong" | "vaiTro">) =>
  NAV.filter((m) => m.vaiTro.includes(user.vaiTro));
