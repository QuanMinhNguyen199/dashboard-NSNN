/*
  Sinh số giả TẤT ĐỊNH, dùng chung cho các bộ dữ liệu mẫu.

  Cùng một hạt giống luôn cho cùng một dãy, nên mở lại đúng kỳ và đúng đơn vị
  là thấy lại đúng con số cũ. Đây không phải chuyện gọn mã: một bản mẫu mà số
  nhảy sau mỗi lần tải lại thì không ai đối chiếu được hai màn với nhau, và
  mọi phép đo trong chốt kiểm đều vô nghĩa.

  `ql1.ts` và `ql3.ts` còn giữ bản sao riêng của mulberry32 từ trước. Khi nào
  sửa tới hai tệp ấy thì chuyển chúng sang đây, chứ không đổi lúc này — đổi
  nguồn sinh số của một phân hệ đang chạy là đổi mọi con số trên màn của nó.
*/

/** mulberry32: một hằng số, bốn phép, chu kỳ đủ dài cho dữ liệu mẫu. */
export function prng(hat: number) {
  let a = hat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Trộn hạt giống của kỳ với một chuỗi khóa (đơn vị, mục, chiều…). */
export const hatCua = (hatKy: number, ...khoa: string[]) => {
  let h = hatKy >>> 0;
  for (const ky of khoa.join("|")) h = (Math.imul(h, 31) + ky.charCodeAt(0)) >>> 0;
  return h;
};

/** Số nguyên trong [min, max]. */
export const nguyen = (r: () => number, min: number, max: number) => min + Math.floor(r() * (max - min + 1));

/*
  Dữ liệu người nộp thuế đều là dữ liệu ĐẶT RA, theo §1.2 mục 4 của
  `design_ql2ql4`: MST bắt đầu bằng 01000000, tên là "Công ty A", người là
  "Nguyễn Văn A". Không MST nào ở đây trỏ tới một doanh nghiệp có thật.
*/
export const mstGia = (i: number) => `01000${String(i + 1).padStart(5, "0")}`;

const CHU = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const tenNNTGia = (i: number) => `Công ty ${CHU[i % 26]}${i < 26 ? "" : ` ${Math.floor(i / 26) + 1}`}`;

const HO = ["Nguyễn Văn", "Trần Thị", "Lê Minh", "Phạm Thu", "Hoàng Anh", "Vũ Hải", "Đỗ Quang", "Bùi Ngọc"];
export const tenCanBoGia = (i: number) => `${HO[i % HO.length]} ${CHU[Math.floor(i / HO.length) % 26]}`;

export const NGANH_NGHE = [
  "Bán buôn vật liệu xây dựng",
  "Xây dựng công trình kỹ thuật dân dụng",
  "Bán buôn máy móc, thiết bị",
  "Vận tải hàng hóa đường bộ",
  "Bán lẻ hàng hóa khác trong cửa hàng chuyên doanh",
  "Dịch vụ lưu trú ngắn ngày",
  "Sản xuất sản phẩm từ plastic",
  "Hoạt động tư vấn quản lý",
];
