import { CHI_TIEU_Q, capCua, type CanBoQ, type ChiTieuQ, type TheId } from "@/data/qldn";
import { BO_TIEU_CHI } from "@/data/boTieuChi";
import { hatCua, prng } from "@/data/ngauNhien";

/*
  Bảng chấm theo bộ tiêu chí — dựng theo sheet "II. Khối QLDN" của file chấm
  điểm (chốt 15/10/2026).

  Trang kết quả từng chỉ hiện con số kết quả, nên người đọc không biết nó từ
  đâu ra, dù bộ tiêu chí ghi rõ cách tính. Ở đây mỗi tiêu chí là một CỤM CỘT:
  các số gốc đúng như công thức của bộ tiêu chí, rồi đến cột kết quả — đọc từ
  trái sang phải là đọc lại phép tính.

  Số gốc đều suy từ cặp tử/mẫu sẵn có (`capCua`), để kết quả ở đây khớp từng
  chữ số với thẻ và bảng xếp hạng. Phần công thức tách tử số thành nhiều thành
  phần ("đã cưỡng chế + nộp dần + đã đôn đốc nộp") hoặc cần một số chưa có
  trong dữ liệu mô phỏng (ước thu tháng, nợ khả năng thu, nợ thuế phí) được
  chia theo tỷ lệ cố định của từng đơn vị — số ĐẶT RA, như mọi số khác của bản
  mẫu, nhưng cộng lại luôn đúng bằng tử số.
*/

export interface CotGoc { nhan: string; dvt: string }

export interface TieuChiBang {
  stt: number;
  the: TheId;
  /** Tên cụm cột — theo tiêu đề sheet II, rút gọn khi quá dài. */
  ten: string;
  nguon: CotGoc[];
  /** "TANG" = tốc độ tăng (a − b) / b; còn lại là thương tử / mẫu. */
  phep: "CHIA" | "TANG";
  /** Mốc cố định ghi ở sheet II thay cho bình quân ("Chỉ tiêu Cục giao 8%"). */
  moc?: string;
  /** Cần quyền xem nợ/thu NSNN (cột R–Z của file Excel). */
  noTrenThu?: boolean;
  lay: (dvId: string, thang: number, cb?: CanBoQ) => number[];
}

const C = (id: string) => CHI_TIEU_Q.find((c) => c.id === id) as ChiTieuQ;
const cap = (id: string, dv: string, t: number, cb?: CanBoQ, nam = 2026) => capCua(C(id), dv, t, nam, cb);
/** Tỷ lệ cố định của một đơn vị cho một khóa, trong [a, b]. */
const phan = (dv: string, khoa: string, a: number, b: number) => a + prng(hatCua(43, khoa, dv))() * (b - a);
const tien = (x: number) => Math.round(x * 10) / 10;

/** Tách `tong` thành các phần theo tỷ trọng; phần cuối nhận phần dư để cộng đúng. */
function tach(tong: number, ty: number[], tron: (x: number) => number) {
  const ra = ty.map((t) => tron(tong * t));
  ra[ra.length - 1] = tron(tong - ra.slice(0, -1).reduce((s, x) => s + x, 0));
  return ra;
}

/* Hai mẫu dùng nhiều: tử / mẫu thẳng của một chỉ tiêu sẵn có. */
const thang_ = (id: string): TieuChiBang["lay"] => (dv, t, cb) => { const c = cap(id, dv, t, cb); return [c.tu, c.mau]; };

const NNT = "NNT", TY = "tỷ đồng", HS = "hồ sơ";

export const TIEU_CHI_BANG: TieuChiBang[] = [
  /* ---- Thu NSNN ---- */
  { stt: 1, the: "thu", ten: "Tỷ lệ số thực thu NSNN", phep: "CHIA",
    nguon: [{ nhan: "Số thực thu lũy kế", dvt: TY }, { nhan: "Số DTPL", dvt: TY }], lay: thang_("thu") },
  { stt: 2, the: "thu", ten: "Thực thu tháng / ước thu tháng", phep: "CHIA",
    nguon: [{ nhan: "Số thực thu tháng", dvt: TY }, { nhan: "Số ước thu tháng", dvt: TY }],
    lay: (dv, t, cb) => {
      const thang = tien(cap("thu", dv, t, cb).tu - (t > 1 ? cap("thu", dv, t - 1, cb).tu : 0));
      return [thang, tien(thang * phan(dv, `uoc${t}`, 0.86, 1.14))];
    } },
  { stt: 3, the: "thu", ten: "Thu NSNN so với cùng kỳ", phep: "CHIA",
    nguon: [{ nhan: "Số thu lũy kế tháng báo cáo", dvt: TY }, { nhan: "Số thu lũy kế cùng kỳ", dvt: TY }],
    lay: (dv, t, cb) => [cap("thu", dv, t, cb).tu, cap("thu", dv, t, cb, 2025).tu] },

  /* ---- Quản lý nợ ---- */
  { stt: 4, the: "no", ten: "Nợ tăng/giảm so với đầu năm", phep: "TANG",
    nguon: [{ nhan: "Tổng nợ kỳ báo cáo", dvt: TY }, { nhan: "Tổng nợ đầu năm", dvt: TY }], lay: thang_("no") },
  { stt: 5, the: "no", ten: "Nợ tăng/giảm so với tháng trước", phep: "TANG",
    nguon: [{ nhan: "Tổng nợ kỳ báo cáo", dvt: TY }, { nhan: "Tổng nợ tháng trước", dvt: TY }],
    lay: (dv, t, cb) => [cap("no", dv, t, cb).tu, cap("no", dv, Math.max(1, t - 1), cb).tu] },
  { stt: 6, the: "no", ten: "Tổng nợ / dự toán thu NSNN", phep: "CHIA", moc: "Cục giao 8%", noTrenThu: true,
    nguon: [{ nhan: "Tổng nợ kỳ báo cáo", dvt: TY }, { nhan: "Dự toán thu NSNN", dvt: TY }],
    lay: (dv, t, cb) => [cap("no", dv, t, cb).tu, cap("thu", dv, t, cb).mau] },
  { stt: 7, the: "no", ten: "Nợ khả năng thu / dự toán thu NSNN", phep: "CHIA", moc: "Cục giao 5%", noTrenThu: true,
    nguon: [{ nhan: "Nợ khả năng thu kỳ báo cáo", dvt: TY }, { nhan: "Dự toán thu NSNN", dvt: TY }],
    lay: (dv, t, cb) => [tien(cap("no", dv, t, cb).tu * phan(dv, "knt", 0.45, 0.7)), cap("thu", dv, t, cb).mau] },
  { stt: 8, the: "no", ten: "Nợ thuế, phí / dự toán thu NSNN", phep: "CHIA", moc: "Cục giao 5%", noTrenThu: true,
    nguon: [{ nhan: "Nợ thuế phí kỳ báo cáo", dvt: TY }, { nhan: "Dự toán thu NSNN", dvt: TY }],
    lay: (dv, t, cb) => [tien(cap("no", dv, t, cb).tu * phan(dv, "thuephi", 0.5, 0.78)), cap("thu", dv, t, cb).mau] },

  /* ---- Cưỡng chế: tử số = đã cưỡng chế + nộp dần + đã đôn đốc nộp ---- */
  { stt: 9, the: "cc", ten: "Cưỡng chế theo số lượng NNT", phep: "CHIA",
    nguon: [{ nhan: "Số lượng NNT đã cưỡng chế", dvt: NNT }, { nhan: "Nộp dần", dvt: NNT }, { nhan: "Đã đôn đốc nộp", dvt: NNT }, { nhan: "Số lượng NNT phải thực hiện cưỡng chế", dvt: NNT }],
    lay: (dv, t, cb) => { const c = cap("cc-n", dv, t, cb); return [...tach(c.tu, [phan(dv, "cc1", 0.55, 0.7), phan(dv, "cc2", 0.1, 0.2), 0], Math.round), c.mau]; } },
  { stt: 10, the: "cc", ten: "Cưỡng chế theo số tiền", phep: "CHIA",
    nguon: [{ nhan: "Số tiền thuế nợ quá 90N đã cưỡng chế", dvt: TY }, { nhan: "Nộp dần", dvt: TY }, { nhan: "Đã đôn đốc nộp", dvt: TY }, { nhan: "Số tiền thuế nợ quá 90N phải thực hiện cưỡng chế", dvt: TY }],
    lay: (dv, t, cb) => { const c = cap("cc-t", dv, t, cb); return [...tach(c.tu, [phan(dv, "cct1", 0.6, 0.75), phan(dv, "cct2", 0.08, 0.18), 0], tien), c.mau]; } },

  /* ---- Tạm hoãn xuất cảnh: tử số = đã THXC + đã đôn đốc nộp ---- */
  { stt: 11, the: "thxc", ten: "THXC theo số lượng NNT", phep: "CHIA",
    nguon: [{ nhan: "Số lượng NNT đã THXC", dvt: NNT }, { nhan: "Đã đôn đốc nộp", dvt: NNT }, { nhan: "Số lượng NNT phải thực hiện THXC", dvt: NNT }],
    lay: (dv, t, cb) => { const c = cap("thxc-n", dv, t, cb); return [...tach(c.tu, [phan(dv, "th1", 0.65, 0.85), 0], Math.round), c.mau]; } },
  { stt: 12, the: "thxc", ten: "THXC theo số tiền", phep: "CHIA",
    nguon: [{ nhan: "Số tiền nợ đã THXC", dvt: TY }, { nhan: "Đã đôn đốc nộp", dvt: TY }, { nhan: "Số tiền phải thực hiện THXC", dvt: TY }],
    lay: (dv, t, cb) => { const c = cap("thxc-t", dv, t, cb); return [...tach(c.tu, [phan(dv, "tht1", 0.7, 0.88), 0], tien), c.mau]; } },
  { stt: 13, the: "thxc", ten: "THXC số tiền của DN, tổ chức", phep: "CHIA",
    nguon: [{ nhan: "Số tiền nợ đã THXC (DN/TC)", dvt: TY }, { nhan: "Đã đôn đốc nộp", dvt: TY }, { nhan: "Số tiền phải thực hiện THXC (DN/TC)", dvt: TY }],
    lay: (dv, t, cb) => {
      const c = cap("thxc-t", dv, t, cb), s = phan(dv, "dntc", 0.6, 0.85);
      return [...tach(tien(c.tu * s), [phan(dv, "dntc1", 0.7, 0.88), 0], tien), tien(c.mau * s)];
    } },

  /* ---- Thủ tục hành chính ---- */
  { stt: 14, the: "tthc", ten: "TTHC tồn quá hạn theo tháng", phep: "CHIA",
    nguon: [{ nhan: "Số TTHC tồn quá hạn", dvt: HS }, { nhan: "Số TTHC đã thực hiện", dvt: HS }], lay: thang_("tthc") },
  { stt: 15, the: "tthc", ten: "TTHC tồn quá hạn theo tuần", phep: "CHIA",
    nguon: [{ nhan: "Số TTHC tồn quá hạn", dvt: HS }, { nhan: "Số TTHC tồn", dvt: HS }],
    lay: (dv, t, cb) => { const c = cap("tthc", dv, t, cb); const ton = Math.max(1, Math.round(c.mau * phan(dv, "ton", 0.08, 0.14))); return [Math.min(ton, Math.round(c.tu * phan(dv, "tonqh", 0.25, 0.45))), ton]; } },

  /* ---- Quản lý, hỗ trợ DN ---- */
  { stt: 17, the: "hd", ten: "Rà soát TPR", phep: "CHIA",
    nguon: [{ nhan: "NNT đã thực hiện rà soát", dvt: NNT }, { nhan: "Tổng số NNT phải thực hiện rà soát", dvt: NNT }], lay: thang_("tpr") },
  { stt: 18, the: "hd", ten: "Xác minh hóa đơn", phep: "CHIA",
    nguon: [{ nhan: "HĐ đã thực hiện xác minh", dvt: "hóa đơn" }, { nhan: "Tổng số HĐ phải thực hiện xác minh", dvt: "hóa đơn" }], lay: thang_("xmhd") },
  { stt: 19, the: "k", ten: "Hệ số K", phep: "CHIA",
    nguon: [{ nhan: "NNT đã thực hiện rà soát", dvt: NNT }, { nhan: "Tổng số NNT phải thực hiện rà soát", dvt: NNT }], lay: thang_("k") },
  { stt: 20, the: "xp", ten: "Xử phạt VPHC", phep: "CHIA",
    nguon: [{ nhan: "Số đã xử phạt", dvt: "quyết định" }, { nhan: "Tổng số phải xử phạt", dvt: "quyết định" }], lay: thang_("xp") },
  { stt: 21, the: "gt", ten: "Đóng mã giải thể theo gói của Phòng QLDN3", phep: "CHIA",
    nguon: [{ nhan: "Số đã thực hiện", dvt: NNT }, { nhan: "Tổng số lượng giao", dvt: NNT }], lay: thang_("gt-goi") },
  { stt: 22, the: "gt", ten: "Đóng mã giải thể phát sinh mới", phep: "CHIA",
    nguon: [{ nhan: "Số tồn quá hạn", dvt: HS }, { nhan: "Tổng số hồ sơ phải xử lý", dvt: HS }], lay: thang_("gt-moi") },
  { stt: 24, the: "kttb", ten: "Kiểm tra tại bàn", phep: "CHIA",
    nguon: [{ nhan: "Số HS đã thực hiện", dvt: HS }, { nhan: "Tổng số HS", dvt: HS }], lay: thang_("kttb") },
  { stt: 25, the: "hoan", ten: "Hoàn TNCN", phep: "CHIA",
    nguon: [{ nhan: "Số tồn quá hạn", dvt: HS }, { nhan: "Tổng số hồ sơ tồn", dvt: HS }], lay: thang_("hoan-tncn") },
  { stt: 26, the: "hoan", ten: "Hoàn trước GTGT", phep: "CHIA",
    nguon: [{ nhan: "Số tồn quá hạn", dvt: HS }, { nhan: "Tổng số hồ sơ tồn", dvt: HS }], lay: thang_("hoan-gtgt") },
];

/** Kết quả từ các số gốc: tử số là tổng mọi cột trừ cột cuối (mẫu số). */
export function ketQuaGoc(tc: TieuChiBang, v: number[]): number | null {
  const mau = v[v.length - 1];
  const tu = v.slice(0, -1).reduce((s, x) => s + x, 0);
  if (!mau) return null;
  return tc.phep === "TANG" ? (tu - mau) / mau : tu / mau;
}

/** Tiêu chí của một nhóm nhỏ, theo thứ tự STT của bộ tiêu chí. */
export const tieuChiCuaThe = (the: TheId) => TIEU_CHI_BANG.filter((t) => t.the === the);

/*
  Công thức RÚT GỌN cho dòng chữ nhỏ dưới tiêu đề cột (chốt 15/10/2026): chỉ
  "A / B", giữ chữ của bộ tiêu chí nhưng bỏ phần lặp ("kỳ báo cáo", "số
  lượng", "phải thực hiện"). Nguyên văn đầy đủ vẫn ở `congThucSTT` — hiện khi
  trỏ chuột và ở tab Bộ tiêu chí.
*/
const NGAN: Record<number, string> = {
  1: "Số thực thu lũy kế / Số DTPL",
  2: "Số thực thu tháng / Số ước thu tháng",
  3: "Số thu lũy kế / Số thu lũy kế cùng kỳ",
  4: "(Tổng nợ − Tổng nợ đầu năm) / Tổng nợ đầu năm",
  5: "(Tổng nợ − Tổng nợ tháng trước) / Tổng nợ tháng trước",
  6: "Tổng nợ / Dự toán thu NSNN",
  7: "Nợ khả năng thu / Dự toán thu NSNN",
  8: "Nợ thuế phí / Dự toán thu NSNN",
  9: "(Đã cưỡng chế + nộp dần + đôn đốc nộp) / Phải cưỡng chế",
  10: "(Đã cưỡng chế + nộp dần + đôn đốc nộp) / Phải cưỡng chế",
  11: "(Đã THXC + đôn đốc nộp) / Phải THXC",
  12: "(Đã THXC + đôn đốc nộp) / Phải THXC",
  13: "(Đã THXC + đôn đốc nộp) / Phải THXC",
  14: "Tồn quá hạn / Đã thực hiện",
  15: "Tồn quá hạn / Tồn",
  17: "Đã rà soát / Phải rà soát",
  18: "Đã xác minh / Phải xác minh",
  19: "Đã rà soát / Phải rà soát",
  20: "Đã xử phạt / Phải xử phạt",
  21: "Đã thực hiện / Số lượng giao",
  22: "Tồn quá hạn / Phải xử lý",
  24: "Số HS đã thực hiện / Tổng số HS",
  25: "Tồn quá hạn / Tổng hồ sơ tồn",
  26: "Tồn quá hạn / Tổng hồ sơ tồn",
};
export const congThucNgan = (stt: number) => NGAN[stt] ?? congThucSTT(stt);

/** Tên chỉ tiêu nguyên văn của bộ tiêu chí cho một STT — tiêu đề cụm cột dùng tên này, không dùng `ten` rút gọn. */
export const tenSTT = (stt: number) => BO_TIEU_CHI.find((t) => t.stt === stt)?.ten.trim() ?? "";

/** Công thức nguyên văn của bộ tiêu chí cho một STT. */
export const congThucSTT = (stt: number) => {
  const goc = BO_TIEU_CHI.find((t) => t.stt === stt)?.congThuc ?? "";
  return goc.replace(/^Tỷ lệ (\(%\) )?/, "").replace(/\s*\/\s*/g, " / ").replace(/ - /g, " − ").replace(/^./, (c) => c.toUpperCase());
};
