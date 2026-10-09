/*
  Nhãn kỳ TUẦN — một cách viết cho cả bốn phòng.

  Trước đây mỗi báo cáo tự đặt nhãn tuần theo ý mình, và người dùng đọc ra bốn
  thứ khác nhau cho cùng một loại kỳ:

    QL1     "Tuần · nợ đến 31/07/2026"
    QL2-02  "Tuần 39/2026 · 18/09–24/09"
    QL2-04  "Tuần 39/2026 · đến 25/09"
    QL4     "Tuần 39/2026"

  Hai nhãn đầu không nói số tuần, nhãn cuối không nói ngày nào. Đổi tab là đổi
  cách đọc, trong khi kỳ là thứ người dùng kiểm lại mỗi lần mở một báo cáo.

  Dạng chuẩn là dạng nói ĐỦ hai thứ — tuần nào, và tuần ấy là những ngày nào:

    Tuần 39/2026 · 18/09–24/09

  Số tuần tính theo ISO 8601 (tuần bắt đầu thứ Hai, tuần 1 là tuần chứa thứ
  Năm đầu tiên của năm), vì đó là cách Excel và các hệ báo cáo đánh số tuần.
*/

const tach = (ngay: string) => {
  const [d, m, y] = ngay.split("/").map(Number);
  return new Date(y, m - 1, d);
};

const ddmm = (ngay: string) => ngay.slice(0, 5);

/** Số tuần ISO và năm của tuần ấy — cuối tháng 12 có thể thuộc tuần 1 năm sau. */
export function tuanIso(ngay: string): { tuan: number; nam: number } {
  const d = tach(ngay);
  /* Dời về thứ Năm của cùng tuần: năm của tuần ISO là năm chứa thứ Năm ấy. */
  const thu = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - thu + 3);
  const nam = d.getFullYear();
  const thuNamDau = new Date(nam, 0, 4);
  thuNamDau.setDate(thuNamDau.getDate() - ((thuNamDau.getDay() + 6) % 7) + 3);
  const tuan = 1 + Math.round((d.getTime() - thuNamDau.getTime()) / (7 * 86_400_000));
  return { tuan, nam };
}

/** `Tuần 39/2026 · 18/09–24/09` — dạng chuẩn, dùng khi kỳ có khoảng ngày thật. */
export function nhanTuan(ngayDau: string, ngayChot: string) {
  const { tuan, nam } = tuanIso(ngayChot);
  return `Tuần ${tuan}/${nam} · ${ddmm(ngayDau)}–${ddmm(ngayChot)}`;
}

/** Ngày đầu của tuần bảy ngày kết thúc ở `ngayChot`. */
export function dauTuan(ngayChot: string) {
  const d = tach(ngayChot);
  d.setDate(d.getDate() - 6);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/** Tuần bảy ngày kết thúc đúng ngày chốt — dùng khi kỳ chỉ khai ngày chốt. */
export const nhanTuanDenNgay = (ngayChot: string) => nhanTuan(dauTuan(ngayChot), ngayChot);

/*
  QL1 là ngoại lệ, và là ngoại lệ có lý do.

  Ngày chốt tuần của QL1 KHÔNG cách nhau bảy ngày — tệp gốc có 07/07, 16/07,
  22/07, 31/07, tức cách nhau 9, 6 rồi 9 ngày, và tài liệu ghi rõ điều đó là
  có thật. Số nợ ở đây cũng là ảnh chụp TẠI ngày chốt, không phải tổng của một
  khoảng. Dựng một khoảng bảy ngày cho nó là bịa ra một khoảng không tồn tại,
  nên nhãn giữ đúng hình dạng chung nhưng nói thẳng đây là mốc chụp:

    Tuần 31/2026 · nợ đến 31/07
*/
export const nhanTuanChupNgay = (ngayChot: string) => {
  const { tuan, nam } = tuanIso(ngayChot);
  return `Tuần ${tuan}/${nam} · nợ đến ${ddmm(ngayChot)}`;
};
