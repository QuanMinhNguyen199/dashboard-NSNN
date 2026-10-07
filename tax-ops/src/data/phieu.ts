import { hatCua, mstGia, nguyen, prng, tenNNTGia } from "@/data/ngauNhien";
import { DON_VI_QL2 } from "@/data/ql2";
import { DON_VI_QL4 } from "@/data/ql4";

/*
  Phiếu rà soát — §6 `design_ql2ql4`.

  Một cấu trúc dùng cho CẢ HAI loại phiếu, vì hai loại chỉ khác nhau ở cột
  phản hồi và ở phép kiểm bắt buộc. Dựng hai màn riêng thì mọi thứ còn lại —
  giao phiếu, tách theo đơn vị, đặt hạn, bảng tiến độ, lưới điền, nhắc — phải
  nuôi hai lần, và hai bản sẽ lệch nhau ở lần sửa thứ ba.

  §6 còn ghi "sau này dùng lại cho phiếu của QL1 (Q-83)", nên cấu trúc này
  phải chịu được loại thứ ba mà không phải mở lại.
*/

export type LoaiPhieu = "PRS-03" | "PRS-05";

export interface CauHinhPhieu {
  loai: LoaiPhieu;
  ten: string;
  /** Phòng giao phiếu này. */
  phong: "QL2" | "QL4";
  /** Mục trong phân hệ mà phiếu sinh ra từ đó. */
  tuMuc: string;
  /** Các lựa chọn của cột "Kết quả". */
  ketQua: readonly string[];
  /** Kết quả nào bắt buộc kèm số tiền; `null` nếu loại phiếu không có cột tiền. */
  batBuocSoTien: string | null;
  /** Kết quả nào bắt buộc kèm lý do. */
  batBuocLyDo: string | null;
  /** Nhãn cột mô tả dòng, lấy theo nghiệp vụ của từng loại. */
  nhanChiTiet: string;
}

export const CAU_HINH: Record<LoaiPhieu, CauHinhPhieu> = {
  "PRS-03": {
    loai: "PRS-03",
    ten: "NNT có chênh lệch chưa có kết quả",
    phong: "QL2",
    tuMuc: "DS NNT chênh lệch",
    ketQua: ["Đã điều chỉnh", "Không có chênh lệch", "Đã chuyển Công an", "Khác"],
    /* §6: "Số thuế bắt buộc khi Đã điều chỉnh". Không có số thì dòng ấy nói
       đã điều chỉnh mà không nói điều chỉnh bao nhiêu — vô dụng cho cột (20)
       và (22) của QL2-01. */
    batBuocSoTien: "Đã điều chỉnh",
    batBuocLyDo: null,
    nhanChiTiet: "Chênh lệch (trđ)",
  },
  "PRS-05": {
    loai: "PRS-05",
    ten: "Hồ sơ hoàn thuế TNCN vênh giữa 1.5.1 và 6.29.1",
    phong: "QL4",
    tuMuc: "Hồ sơ vênh 1.5.1 – 6.29.1",
    ketQua: ["Đã xử lý trên TMS", "Không phải xử lý"],
    batBuocSoTien: null,
    /* §6: "Lý do bắt buộc khi Không phải xử lý" — đây là câu trả lời duy nhất
       đóng một hồ sơ vênh mà không ai động vào TMS, nên nó phải giải thích. */
    batBuocLyDo: "Không phải xử lý",
    nhanChiTiet: "Loại vênh",
  },
};

export interface DongPhieu {
  id: string;
  /** Mã phiếu; nhiều dòng cùng một mã khi chúng cùng đơn vị và cùng đợt giao. */
  maPhieu: string;
  loai: LoaiPhieu;
  donVi: string;
  han: string;
  /** Số ngày quá hạn; âm là còn hạn. */
  quaHan: number;
  /* ── Cột hệ thống: khóa, không sửa được ── */
  mst: string;
  tenNNT: string;
  chiTiet: string;
  /* Phản hồi của kỳ trước cho cùng MST, nếu có — §6 "Gợi ý kỳ trước" [R]. */
  goiY: string | null;
}

const LOAI_VENH = ["Kỳ hoàn ≤ 2020 – không tự sinh", "Tờ khai bổ sung từ 2021", "Khác"];

/*
  Phiếu sinh TẤT ĐỊNH từ hạt giống của kỳ, như mọi dữ liệu mẫu khác: mở lại
  đúng kỳ ấy là thấy lại đúng những dòng ấy.
*/
/*
  Số dòng lấy theo DANH SÁCH NGUỒN mà phiếu sinh ra từ đó: PRS-03 từ 240 dòng
  NNT chênh lệch, PRS-05 từ 120 hồ sơ vênh. Sinh ít hơn thì mỗi đơn vị chỉ
  nhận một hai dòng, và màn của cán bộ đơn vị không còn việc gì để thử — trong
  khi chính việc điền cho NHIỀU dòng một lúc là thứ §6 sinh ra để thay.
*/
const SO_DONG: Record<LoaiPhieu, number> = { "PRS-03": 240, "PRS-05": 120 };

export function dsPhieu(loai: LoaiPhieu, hatKy: number, soDong = SO_DONG[loai]): DongPhieu[] {
  const r = prng(hatCua(hatKy, "phieu", loai));
  const don = (loai === "PRS-03" ? DON_VI_QL2 : DON_VI_QL4).map((d) => d.ten);
  return Array.from({ length: soDong }, (_, i) => {
    const donVi = don[nguyen(r, 0, don.length - 1)];
    const quaHan = nguyen(r, -9, 7);
    const ngay = Math.min(30, Math.max(1, 25 - quaHan));
    return {
      id: `${loai}-${i}`,
      /* Một mã phiếu cho mỗi đơn vị: §6 nói giao phiếu "tự tách theo đơn vị",
         nên mã phải gom được các dòng cùng đơn vị lại. */
      maPhieu: `${loai}/${String(2600 + don.indexOf(donVi)).padStart(4, "0")}`,
      loai,
      donVi,
      han: `${String(ngay).padStart(2, "0")}/09/2026`,
      quaHan,
      mst: mstGia(4000 + i),
      tenNNT: loai === "PRS-03" ? tenNNTGia(4000 + i) : `Nguyễn Văn ${String.fromCharCode(65 + (i % 26))}`,
      chiTiet: loai === "PRS-03"
        ? String(Math.round(nguyen(r, 40, 18_000) / 10) / 10)
        : LOAI_VENH[nguyen(r, 0, LOAI_VENH.length - 1)],
      goiY: r() < 0.18 ? CAU_HINH[loai].ketQua[nguyen(r, 0, CAU_HINH[loai].ketQua.length - 1)] : null,
    };
  });
}

/** Phản hồi của một dòng. Trống nghĩa là đơn vị chưa trả lời. */
export interface TraLoi {
  ketQua: string;
  soTien: string;
  lyDo: string;
  ghiChu: string;
  luc: string;
  boi: string;
}

/**
 * Phép kiểm của §6. Trả về câu báo lỗi, hoặc `null` khi dòng hợp lệ.
 *
 * Kiểm ở ĐÂY chứ không ở chỗ dựng giao diện: cùng một luật phải áp cho cả ô
 * điền tay lẫn tệp Excel tải lên, và hai nơi ấy không được phép hiểu khác nhau.
 */
export function kiemTraLoi(ch: CauHinhPhieu, t: Partial<TraLoi>): string | null {
  if (!t.ketQua) return "Chưa chọn kết quả.";
  if (!ch.ketQua.includes(t.ketQua)) return `Kết quả "${t.ketQua}" không có trong danh sách của ${ch.loai}.`;
  if (ch.batBuocSoTien && t.ketQua === ch.batBuocSoTien && !String(t.soTien ?? "").trim()) {
    return `Chọn "${ch.batBuocSoTien}" thì phải nhập số thuế điều chỉnh.`;
  }
  if (ch.batBuocLyDo && t.ketQua === ch.batBuocLyDo && !String(t.lyDo ?? "").trim()) {
    return `Chọn "${ch.batBuocLyDo}" thì phải nhập lý do.`;
  }
  return null;
}
