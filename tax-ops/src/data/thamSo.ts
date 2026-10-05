import type { BusinessRule } from "@/domain/types";

/*
  Bảng tham số ngưỡng — YC-QT-02 của BRD.

  BRD ghi thẳng: "Bảng tham số cho người dùng nghiệp vụ sửa (có phê duyệt)",
  và liệt kê đủ bảy ngưỡng kèm giá trị hiện hành. Trước BRD, hai trong số đó
  nằm rải trong mã nguồn còn màn Quy tắc thì ghi "chưa có căn cứ" — nay đã có
  căn cứ, nên chúng chuyển sang đang áp dụng và về đúng một chỗ.

  Đây là NGUỒN DUY NHẤT của ngưỡng trong bản demo: màn Quy tắc đọc nó để hiện,
  bộ sinh dữ liệu QL1 đọc nó để dựng cột "Ngưỡng" và lọc danh sách tăng nợ.
  Sửa một con số ở đây là cả hai nơi đổi theo — đúng điều NT-06 đòi kiểm
  ("thay ngưỡng thì báo cáo thay đổi đúng mà không cần lập trình").
*/
export const NGUONG = {
  /** P_CC_NGAY · P_CC_TIEN — cưỡng chế khi nợ quá hạn này VÀ vượt mức tiền. */
  cuongCheNgay: 90,
  cuongCheTien: 3_000_000,
  /** P_XC_NGAY · P_XC_TIEN — tạm hoãn xuất cảnh, ngưỡng tiền áp cho doanh nghiệp. */
  thxcNgay: 120,
  thxcTien: 500_000_000,
  /** P_TANGNO — vào danh sách doanh nghiệp tăng nợ khả năng thu. */
  tangNoKNT: 500_000_000,
  /** P_THUA — nộp thừa gửi đơn vị rà soát. */
  nopThua: 1_000_000_000,
  /** P_K_MACDINH · P_K_DICHVU — hệ số K theo ngành. */
  heSoK: 2,
  heSoKDichVu: 4,
  /** P_DONGMST_TU — mốc bắt đầu tính đóng mã số thuế. */
  dongMSTTu: "01/04/2026",
  /** P_KTTB_NAM — kỳ kê khai dùng đếm doanh nghiệp trong kiểm tra tại bàn. */
  kttbNamTruoc: 1,
  /** P_TMS_MAXROW — số bản ghi tối đa mỗi lần kéo chức năng 1.5.1 của TMS. */
  tmsMaxRow: 99_999,
  /** P_LOGIN_SAI — số lần đăng nhập sai tối đa trước khi robot dừng, để không khóa tài khoản. */
  loginSai: 2,
} as const;

/*
  Quy tắc số BC-10 của FRS, gom về một chỗ vì ba màn đang mỗi màn một kiểu.

  Hai câu quyết định: "tỷ lệ khi mẫu số = 0 → để trống" và "tỷ lệ hiển thị 2
  chữ số thập phân". Để trống chứ không phải 0%: mẫu số bằng 0 nghĩa là KHÔNG
  CÓ GÌ để tính tỷ lệ, còn 0% nghĩa là có việc phải làm mà chưa làm được gì —
  hai câu khác hẳn nhau, và đơn vị đọc nhầm sẽ đi giải trình một con số không
  tồn tại.
*/
export function tyLe(tu: number, mau: number): number | null {
  return mau ? tu / mau : null;
}

export function hienTyLe(x: number | null): string {
  if (x === null || !Number.isFinite(x)) return "—";
  return `${new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x * 100)}%`;
}

/** Đồng sang triệu đồng. Bảng tổng hợp nợ ghi bằng triệu, ngưỡng khai bằng đồng. */
export const trieu = (dong: number) => dong / 1e6;

const tien = (d: number) => new Intl.NumberFormat("vi-VN").format(d) + " đồng";

/*
  Mô tả để hiện trên màn Quy tắc. Giá trị lấy TỪ `NGUONG` chứ không gõ lại:
  gõ lại là mở đường cho bảng nói một đằng và hệ chạy một nẻo.
*/
export const ruleItems: BusinessRule[] = [
  { id: "r1", name: "Đơn vị tổ chức", value: "30 cơ quan thuế", effectiveFrom: null, document: "BRD mục 9.2 — YC-KD-03", scope: "Toàn ngành", status: "ACTIVE" },
  { id: "r2", name: "Trạng thái kiểm tra tại bàn", value: "5 trạng thái, giữ trạng thái cao nhất", effectiveFrom: "01/01/2026", document: "BRD mục 8.3 — BR-QL3-01", scope: "Kiểm tra tại bàn", status: "ACTIVE" },
  { id: "r3", name: "Trạng thái xác minh hóa đơn", value: "6 mã dùng, bỏ đã hủy và thay thế", effectiveFrom: "01/01/2026", document: "BRD mục 8.2 — BR-QL2-04", scope: "Xác minh hóa đơn", status: "ACTIVE" },
  { id: "r4", name: "Phân tuổi nợ", value: "1–30 · 31–60 · 61–90 · 91–120 · 121–365 · trên 365 ngày", effectiveFrom: null, document: "BRD mục 8.1 — BR-QL1-01", scope: "Nợ và cưỡng chế", status: "ACTIVE" },

  /*
    Ba ngưỡng này trước đây để trạng thái "chờ văn bản" và "đang mâu thuẫn" vì
    các file nguồn ghi khác nhau. BRD mục 9.4 ghi giá trị tham chiếu; thiết kế QL1+QL3 §4.2 vẫn yêu cầu
    xác nhận ngưỡng cưỡng chế/tạm hoãn và ngày hiệu lực trước khi áp dụng thật.
  */
  { id: "r5", name: "Ngưỡng cưỡng chế", value: `Trên ${NGUONG.cuongCheNgay} ngày và trên ${tien(NGUONG.cuongCheTien)}`, effectiveFrom: null, document: "BRD mục 9.4 — YC-QT-02", scope: "Nợ và cưỡng chế", status: "PENDING" },
  { id: "r6", name: "Ngưỡng tạm hoãn xuất cảnh", value: `Trên ${NGUONG.thxcNgay} ngày và trên ${tien(NGUONG.thxcTien)}`, effectiveFrom: null, document: "BRD mục 9.4 — YC-QT-02", scope: "Nợ và cưỡng chế", status: "PENDING" },
  { id: "r7", name: "Ngưỡng tăng nợ khả năng thu", value: `Từ ${tien(NGUONG.tangNoKNT)}`, effectiveFrom: null, document: "BRD mục 9.4 — YC-QT-02", scope: "Nợ và cưỡng chế", status: "ACTIVE" },
  { id: "r8", name: "Ngưỡng nộp thừa gửi rà soát", value: `Trên ${tien(NGUONG.nopThua)}`, effectiveFrom: "01/10/2026", document: "BRD mục 9.4 — YC-QT-02", scope: "Kê khai và nộp thừa", status: "ACTIVE" },
  { id: "r9", name: "Ngưỡng hệ số K", value: `${NGUONG.heSoK} · ngành dịch vụ ${NGUONG.heSoKDichVu}`, effectiveFrom: "01/10/2026", document: "BRD mục 9.4 — YC-QT-02", scope: "Cảnh báo rủi ro", status: "ACTIVE" },

  /*
    Vẫn còn một mâu thuẫn thật, và nó phải hiện ra: quyết định cưỡng chế từ
    01/7/2026 không còn ngày kết thúc (BRD mục 8.1), nên quy tắc cũ dựa vào
    ngày kết thúc để xác định "còn hiệu lực" không áp được cho quyết định mới.
  */
  { id: "r8b", name: "Mốc tính đóng mã số thuế", value: `Từ ${NGUONG.dongMSTTu}`, effectiveFrom: "01/04/2026", document: "FRS mục 4.1 — P_DONGMST_TU", scope: "Kê khai và nộp thừa", status: "ACTIVE" },
  { id: "r8c", name: "Kỳ kê khai dùng đếm doanh nghiệp kiểm tra tại bàn", value: `Năm báo cáo − ${NGUONG.kttbNamTruoc}`, effectiveFrom: "01/01/2026", document: "FRS mục 4.1 — P_KTTB_NAM", scope: "Kiểm tra tại bàn", status: "ACTIVE" },
  /* Hai tham số kỹ thuật của robot thu thập. Chúng ở chung bảng vì FRS xếp
     chung, và vì khi robot dừng giữa chừng thì người nghiệp vụ cần biết ngưỡng
     nào vừa chặn nó lại — không phải đi hỏi bộ phận tin học. */
  { id: "r8d", name: "Số bản ghi tối đa mỗi lần kéo TMS 1.5.1", value: `${new Intl.NumberFormat("vi-VN").format(NGUONG.tmsMaxRow)} bản ghi`, effectiveFrom: "01/01/2026", document: "FRS mục 4.1 — P_TMS_MAXROW", scope: "Thu thập dữ liệu", status: "ACTIVE" },
  { id: "r8e", name: "Số lần đăng nhập sai tối đa", value: `${NGUONG.loginSai} lần rồi dừng`, effectiveFrom: "01/01/2026", document: "FRS mục 4.1 — P_LOGIN_SAI", scope: "Thu thập dữ liệu", status: "ACTIVE" },
  { id: "r10", name: "Hiệu lực quyết định cưỡng chế", value: "Từ 01/07/2026 quyết định không còn ngày kết thúc", effectiveFrom: null, document: null, scope: "Nợ và cưỡng chế", status: "CONFLICT" },
  /* Q-03 vẫn chưa có câu trả lời — xem The Workflow rule trong DESIGN.md. */
  { id: "r11", name: "Lãnh đạo nhận báo cáo", value: "Chưa xác định cấp nhận và ký duyệt", effectiveFrom: null, document: null, scope: "Báo cáo", status: "PENDING" },
];
