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
  /** Cưỡng chế khi nợ quá hạn này VÀ vượt mức tiền dưới đây. */
  cuongCheNgay: 90,
  cuongCheTien: 3_000_000,
  /** Tạm hoãn xuất cảnh. */
  thxcNgay: 120,
  thxcTien: 500_000_000,
  /** Vào danh sách doanh nghiệp tăng nợ khả năng thu. */
  tangNoKNT: 500_000_000,
  /** Nộp thừa gửi đơn vị rà soát. */
  nopThua: 1_000_000_000,
  /** Hệ số K theo ngành. */
  heSoK: 2,
  heSoKDichVu: 4,
} as const;

/** Đồng sang triệu đồng. Bảng tổng hợp nợ ghi bằng triệu, ngưỡng khai bằng đồng. */
export const trieu = (dong: number) => dong / 1e6;

const tien = (d: number) => new Intl.NumberFormat("vi-VN").format(d) + " đồng";

/*
  Mô tả để hiện trên màn Quy tắc. Giá trị lấy TỪ `NGUONG` chứ không gõ lại:
  gõ lại là mở đường cho bảng nói một đằng và hệ chạy một nẻo.
*/
export const ruleItems: BusinessRule[] = [
  { id: "r1", name: "Đơn vị tổ chức", value: "30 cơ quan thuế", effectiveFrom: "01/01/2026", document: "BRD mục 9.2 — YC-KD-03", scope: "Toàn ngành", status: "ACTIVE" },
  { id: "r2", name: "Trạng thái kiểm tra tại bàn", value: "5 trạng thái, giữ trạng thái cao nhất", effectiveFrom: "01/01/2026", document: "BRD mục 8.3 — BR-QL3-01", scope: "Kiểm tra tại bàn", status: "ACTIVE" },
  { id: "r3", name: "Trạng thái xác minh hóa đơn", value: "6 mã dùng, bỏ đã hủy và thay thế", effectiveFrom: "01/01/2026", document: "BRD mục 8.2 — BR-QL2-04", scope: "Xác minh hóa đơn", status: "ACTIVE" },
  { id: "r4", name: "Phân tuổi nợ", value: "1–30 · 31–60 · 61–90 · 91–120 · 121–365 · trên 365 ngày", effectiveFrom: "01/01/2026", document: "BRD mục 8.1 — BR-QL1-01", scope: "Nợ và cưỡng chế", status: "ACTIVE" },

  /*
    Ba ngưỡng này trước đây để trạng thái "chờ văn bản" và "đang mâu thuẫn" vì
    các file nguồn ghi khác nhau. BRD mục 9.4 nay chốt giá trị, nên chúng bật.
  */
  { id: "r5", name: "Ngưỡng cưỡng chế", value: `Trên ${NGUONG.cuongCheNgay} ngày và trên ${tien(NGUONG.cuongCheTien)}`, effectiveFrom: "01/10/2026", document: "BRD mục 9.4 — YC-QT-02", scope: "Nợ và cưỡng chế", status: "ACTIVE" },
  { id: "r6", name: "Ngưỡng tạm hoãn xuất cảnh", value: `Trên ${NGUONG.thxcNgay} ngày và trên ${tien(NGUONG.thxcTien)}`, effectiveFrom: "01/10/2026", document: "BRD mục 9.4 — YC-QT-02", scope: "Nợ và cưỡng chế", status: "ACTIVE" },
  { id: "r7", name: "Ngưỡng tăng nợ khả năng thu", value: `Từ ${tien(NGUONG.tangNoKNT)}`, effectiveFrom: "01/10/2026", document: "BRD mục 9.4 — YC-QT-02", scope: "Nợ và cưỡng chế", status: "ACTIVE" },
  { id: "r8", name: "Ngưỡng nộp thừa gửi rà soát", value: `Trên ${tien(NGUONG.nopThua)}`, effectiveFrom: "01/10/2026", document: "BRD mục 9.4 — YC-QT-02", scope: "Kê khai và nộp thừa", status: "ACTIVE" },
  { id: "r9", name: "Ngưỡng hệ số K", value: `${NGUONG.heSoK} · ngành dịch vụ ${NGUONG.heSoKDichVu}`, effectiveFrom: "01/10/2026", document: "BRD mục 9.4 — YC-QT-02", scope: "Cảnh báo rủi ro", status: "ACTIVE" },

  /*
    Vẫn còn một mâu thuẫn thật, và nó phải hiện ra: quyết định cưỡng chế từ
    01/7/2026 không còn ngày kết thúc (BRD mục 8.1), nên quy tắc cũ dựa vào
    ngày kết thúc để xác định "còn hiệu lực" không áp được cho quyết định mới.
  */
  { id: "r10", name: "Hiệu lực quyết định cưỡng chế", value: "Từ 01/07/2026 quyết định không còn ngày kết thúc", effectiveFrom: null, document: null, scope: "Nợ và cưỡng chế", status: "CONFLICT" },
  /* Q-03 vẫn chưa có câu trả lời — xem The Workflow rule trong DESIGN.md. */
  { id: "r11", name: "Lãnh đạo nhận báo cáo", value: "Chưa xác định cấp nhận và ký duyệt", effectiveFrom: null, document: null, scope: "Báo cáo", status: "PENDING" },
];
