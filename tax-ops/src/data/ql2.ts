import { DAY_TCS, maCuaTCS, nhanTCS, phongVPCua } from "@/data/danhMuc";
import { NGANH_NGHE, hatCua, mstGia, nguyen, prng, tenCanBoGia, tenNNTGia } from "@/data/ngauNhien";
import type { MucKy } from "@/components/BoLoc";

/*
  Dữ liệu mẫu của phân hệ QL2 — rủi ro hóa đơn (`design_ql2ql4` §4).

  Danh mục đơn vị GIỐNG QL3: năm phòng QLHTDN ở khối Văn phòng cộng 25 Thuế cơ
  sở (§4.1) [F]. Lấy từ `danhMuc.ts` chứ không khai lại — xem ghi chú đầu tệp
  ấy về chuyện hai bản danh mục đã lệch nhau thật một lần.

  Mỗi báo cáo một NHỊP KỲ RIÊNG, nên mỗi báo cáo một danh mục kỳ (G13). Đây là
  khác biệt lớn nhất so với QL1 và QL3, nơi cả phân hệ dùng chung một danh mục.
*/

export interface DonViQL2 {
  id: string;
  ten: string;
  nhom: "VP" | "TCS";
  ma: string;
  stt: number;
}

const VP = phongVPCua("QL2");

export const DON_VI_QL2: DonViQL2[] = [
  ...VP.map((p) => ({ id: p.id, ten: p.ten, nhom: "VP" as const, ma: p.ma, stt: p.thuTu })),
  ...DAY_TCS.map((so) => ({
    id: `T${so}`,
    ten: nhanTCS(so),
    nhom: "TCS" as const,
    ma: maCuaTCS(so).map((c) => c.ma).join("+"),
    stt: so + VP.length,
  })),
];

/* ── Kỳ của từng báo cáo ────────────────────────────────────────────────── */

export interface KyQL2 extends MucKy { hat: number; ngayChot: string }

/*
  QL2-01 chạy theo THÁNG NGHIỆP VỤ nhưng số trên báo cáo là LŨY KẾ từ đầu năm
  (§4.1) [F]. Nhãn vì thế phải nói cả hai: chọn kỳ tháng nào, và số gộp từ đâu
  tới đó. Mẫu ghi "Từ kỳ báo cáo tháng 1/2026 đến kỳ báo cáo tháng 05/2026".
*/
export const KY_QL2_01: KyQL2[] = [9, 8, 7, 6, 5].map((m) => ({
  id: `q201-m${String(m).padStart(2, "0")}`,
  loai: "THANG" as const,
  ngayChot: `${new Date(2026, m, 0).getDate()}/${String(m).padStart(2, "0")}/2026`,
  nhan: `Tháng ${String(m).padStart(2, "0")}/2026 · lũy kế từ tháng 01`,
  hat: 2100 + m,
}));

/** Nhãn lũy kế nguyên văn theo mẫu; năm lấy theo kỳ đang lọc, không ghi cứng (Q-97). */
export const nhanLuyKe = (ky: KyQL2) => {
  const [, thang, nam] = ky.ngayChot.split("/");
  return `Từ kỳ báo cáo tháng 1/${nam} đến kỳ báo cáo tháng ${thang}/${nam}`;
};

/*
  QL2-02 có BA nhịp: ngày (mặc định hôm qua), tuần, tháng (§4.1). Ngày là nhịp
  chính — G18 xếp nó cùng nhóm với tổng đài: duyệt được trong vài phút.
*/
const NGAY_QL2_02 = ["26/09/2026", "25/09/2026", "24/09/2026", "23/09/2026", "22/09/2026"];

export const KY_QL2_02: KyQL2[] = [
  ...NGAY_QL2_02.map((d, i) => ({
    id: `q202-d${d.slice(0, 2)}${d.slice(3, 5)}`,
    loai: "NGAY" as const,
    ngayChot: d,
    nhan: `Ngày ${d}`,
    hat: 2200 + i,
  })),
  ...[39, 38, 37, 36].map((w, i) => ({
    id: `q202-w${w}`,
    loai: "TUAN" as const,
    ngayChot: NGAY_QL2_02[0],
    nhan: `Tuần ${w}/2026`,
    hat: 2240 + i,
  })),
  ...[9, 8, 7].map((m) => ({
    id: `q202-m${String(m).padStart(2, "0")}`,
    loai: "THANG" as const,
    ngayChot: `${new Date(2026, m, 0).getDate()}/${String(m).padStart(2, "0")}/2026`,
    nhan: `Tháng ${String(m).padStart(2, "0")}/2026`,
    hat: 2260 + m,
  })),
];

/** QL2-04: tuần đến ngày báo cáo, hoặc tháng (§4.1). */
export const KY_QL2_04: KyQL2[] = [
  ...[39, 38, 37, 36].map((w, i) => ({
    id: `q204-w${w}`,
    loai: "TUAN" as const,
    ngayChot: ["26/09/2026", "19/09/2026", "12/09/2026", "05/09/2026"][i],
    nhan: `Tuần ${w}/2026 · đến ${["26/09", "19/09", "12/09", "05/09"][i]}`,
    hat: 2400 + i,
  })),
  ...[9, 8, 7].map((m) => ({
    id: `q204-m${String(m).padStart(2, "0")}`,
    loai: "THANG" as const,
    ngayChot: `${new Date(2026, m, 0).getDate()}/${String(m).padStart(2, "0")}/2026`,
    nhan: `Tháng ${String(m).padStart(2, "0")}/2026`,
    hat: 2430 + m,
  })),
];

export const KY_CUA_BAO_CAO: Record<string, KyQL2[]> = {
  "QL2-01": KY_QL2_01,
  "QL2-02": KY_QL2_02,
  "QL2-04": KY_QL2_04,
};

/* Khối Văn phòng quản lý doanh nghiệp lớn nên khối lượng lớn hơn Thuế cơ sở. */
const quyMo = (dv: DonViQL2) => (dv.nhom === "VP" ? 2.6 : 1);

/* ── QL2-01 · Chênh lệch tờ khai – HĐĐT ─────────────────────────────────── */

export type LoaiTK = "01" | "0304";

/*
  Một dòng = một đơn vị × một loại tờ khai, đúng cột (4) "Loại tờ khai" của mẫu.
  Số thuế tính bằng TRIỆU ĐỒNG — mẫu ghi "(trđ)" ở góc bảng [F].

  Hai chiều đầu ra / đầu vào sinh ĐỘC LẬP rồi mới cộng, vì bảng đòi tách chúng
  ở cả bốn nhóm cột: số đầu năm, kết quả ứng dụng, lũy kế cần rà soát, và chưa
  có kết quả. Sinh một con số rồi chia đôi thì bốn nhóm ấy khớp nhau giả tạo.
*/
export interface ChieuQL2_01 {
  /** (5)/(7) — NNT mang sang từ năm trước. */
  dauNam_NNT: number;
  /** (6)/(8) — số thuế mang sang. */
  dauNam_Thue: number;
  /** (9)/(11) — ứng dụng phát hiện trong kỳ. */
  ungDung_NNT: number;
  /** (10)/(12) */
  ungDung_Thue: number;
  /** Trong số (14)/(16) đã có kết quả: điều chỉnh. */
  dieuChinh_NNT: number;
  dieuChinh_Thue: number;
  /** Đã có kết quả nhưng không phải điều chỉnh — xem `KHAC_QL2_01`. */
  khac: number[];
}

/** Năm nhóm kết quả không phải điều chỉnh, cột (23)–(27) của mẫu [F]. */
export const KHAC_QL2_01 = [
  { id: "tt06", nhan: "NNT ở trạng thái 06" },
  { id: "tt05", nhan: "NNT ở trạng thái 05" },
  { id: "dung", nhan: "NNT đã dừng hoạt động" },
  { id: "congan", nhan: "Đã chuyển Cơ quan Công an" },
  { id: "khongcl", nhan: "Không có chênh lệch" },
] as const;

export interface HangQL2_01 {
  dv: DonViQL2;
  loaiTK: LoaiTK;
  /** Chiều đầu ra — NNT khai thiếu. */
  ra: ChieuQL2_01;
  /** Chiều đầu vào — NNT khai thừa. */
  vao: ChieuQL2_01;
  /** (13)/(18) — NNT không nộp tờ khai GTGT trong kỳ. */
  khongNopTK: number;
}

const chieu = (hat: number, heSo: number, thueMoiNNT: number): ChieuQL2_01 => {
  const r = prng(hat);
  const dauNam_NNT = nguyen(r, 0, Math.round(14 * heSo));
  const ungDung_NNT = nguyen(r, 2, Math.round(60 * heSo));
  const can = dauNam_NNT + ungDung_NNT;
  /* "Đã có kết quả" không bao giờ vượt số cần rà soát — vượt thì cột (28)–(31)
     ra số âm, và một bảng có số âm ở ô "chưa có kết quả" là bảng người đọc mất
     lòng tin ngay ở dòng đầu. */
  const daXuLy = Math.min(can, nguyen(r, 0, Math.round(can * 0.8)));
  const dieuChinh_NNT = Math.round(daXuLy * (0.4 + r() * 0.4));
  const conLai = daXuLy - dieuChinh_NNT;
  const khac = KHAC_QL2_01.map(() => 0);
  for (let i = 0; i < conLai; i++) khac[nguyen(r, 0, khac.length - 1)]++;
  return {
    dauNam_NNT,
    dauNam_Thue: Math.round(dauNam_NNT * thueMoiNNT * (0.6 + r() * 0.8) * 10) / 10,
    ungDung_NNT,
    ungDung_Thue: Math.round(ungDung_NNT * thueMoiNNT * (0.6 + r() * 0.8) * 10) / 10,
    dieuChinh_NNT,
    dieuChinh_Thue: Math.round(dieuChinh_NNT * thueMoiNNT * (0.5 + r() * 0.7) * 10) / 10,
    khac,
  };
};

export const bangQL2_01 = (hatKy: number, loaiTK: LoaiTK): HangQL2_01[] =>
  DON_VI_QL2.map((dv) => {
    const heSo = quyMo(dv) * (loaiTK === "01" ? 1 : 0.35);
    const r = prng(hatCua(hatKy, dv.id, loaiTK, "khac"));
    return {
      dv,
      loaiTK,
      ra: chieu(hatCua(hatKy, dv.id, loaiTK, "ra"), heSo, 42),
      vao: chieu(hatCua(hatKy, dv.id, loaiTK, "vao"), heSo, 31),
      khongNopTK: nguyen(r, 0, Math.round(18 * heSo)),
    };
  });

/** (14)=(5)+(9) và các cột lũy kế cùng nhóm. */
export const canRaSoat = (c: ChieuQL2_01) => ({
  nnt: c.dauNam_NNT + c.ungDung_NNT,
  thue: Math.round((c.dauNam_Thue + c.ungDung_Thue) * 10) / 10,
});

export const daXuLyChieu = (c: ChieuQL2_01) => c.dieuChinh_NNT + c.khac.reduce((t, x) => t + x, 0);

/** (28)–(31) — chưa có kết quả đến thời điểm báo cáo. */
export const chuaCoKetQua = (c: ChieuQL2_01) => {
  const can = canRaSoat(c);
  const nnt = Math.max(0, can.nnt - daXuLyChieu(c));
  return { nnt, thue: can.nnt === 0 ? 0 : Math.round(((can.thue * nnt) / can.nnt) * 10) / 10 };
};

/* ── QL2-01 tab 3 · Danh sách NNT chênh lệch ────────────────────────────── */

export const CHIEU_CHENH = [
  { id: "ra", nhan: "01/GTGT · Đầu ra" },
  { id: "vao", nhan: "01/GTGT · Đầu vào" },
  { id: "t03", nhan: "03/GTGT" },
  { id: "t04", nhan: "04/GTGT" },
] as const;

export type ChieuChenh = (typeof CHIEU_CHENH)[number]["id"];

export const KET_QUA_PRS03 = ["Chưa có kết quả", "Đã điều chỉnh", "Không có chênh lệch", "Đã chuyển Công an", "Khác"] as const;
export type KetQuaPRS03 = (typeof KET_QUA_PRS03)[number];

export interface NNTChenhLech {
  mst: string;
  ten: string;
  dv: DonViQL2;
  chieu: ChieuChenh;
  /** Triệu đồng. */
  chenhLech: number;
  khongNopTK: boolean;
  ketQua: KetQuaPRS03;
  /** Mã phiếu PRS-03 đã giao; rỗng nếu chưa giao. */
  phieu: string;
  han: string;
}

export const danhSachChenhLech = (hatKy: number, soDong = 240): NNTChenhLech[] => {
  const r = prng(hatCua(hatKy, "ds-chenh"));
  return Array.from({ length: soDong }, (_, i) => {
    const dv = DON_VI_QL2[nguyen(r, 0, DON_VI_QL2.length - 1)];
    const ketQua = KET_QUA_PRS03[Math.min(KET_QUA_PRS03.length - 1, Math.floor(r() * r() * KET_QUA_PRS03.length * 1.4))];
    const daGiao = ketQua !== "Chưa có kết quả" || r() < 0.45;
    return {
      mst: mstGia(i),
      ten: tenNNTGia(i),
      dv,
      chieu: CHIEU_CHENH[nguyen(r, 0, CHIEU_CHENH.length - 1)].id,
      chenhLech: Math.round(nguyen(r, 4, 1800) / 10) / 10,
      khongNopTK: r() < 0.08,
      ketQua,
      phieu: daGiao ? `PRS-03/${String(2600 + (i % 40)).padStart(4, "0")}` : "",
      han: daGiao ? "25/09/2026" : "",
    };
  });
};

/* ── QL2-02 · Cảnh báo hệ số K ───────────────────────────────────────────── */

export interface HangHeSoK {
  dv: DonViQL2;
  tonDau: number;
  phatSinh: number;
  daXuLy: number;
}

export const bangHeSoK = (hatKy: number): HangHeSoK[] =>
  DON_VI_QL2.map((dv) => {
    const r = prng(hatCua(hatKy, dv.id, "k"));
    const heSo = quyMo(dv);
    const tonDau = nguyen(r, 0, Math.round(40 * heSo));
    const phatSinh = nguyen(r, 0, Math.round(26 * heSo));
    return { dv, tonDau, phatSinh, daXuLy: nguyen(r, 0, tonDau + phatSinh) };
  });

export const tonCuoiK = (h: HangHeSoK) => h.tonDau + h.phatSinh - h.daXuLy;

export const TRANG_THAI_K = ["Chưa phân công", "Đang giải trình", "Đã giải trình", "Đã xử lý", "Chuyển kiểm tra"] as const;
export type TrangThaiK = (typeof TRANG_THAI_K)[number];

/** Nhóm được coi là "đã xử lý". Q-98 chưa trả lời — đây là giả định tạm thời. */
export const NHOM_DA_XU_LY: readonly TrangThaiK[] = ["Đã xử lý", "Chuyển kiểm tra"];

export interface LuotK {
  mst: string;
  ten: string;
  nganhNghe: string;
  canBo: string;
  dv: DonViQL2;
  muaVao: number;
  banRa: number;
  tonKho: number;
  /** Ngưỡng ngành đang áp. */
  kMacDinh: number;
  /** Hệ số K do hệ thống ghi nhận. */
  kHeThong: number;
  trangThai: TrangThaiK;
  soNgayTon: number;
}

/** K = bán ra lũy kế / (mua vào lũy kế + tồn kho). Mẫu số ≤ 0 → `null` (Q-14). */
export const kTinhLai = (l: LuotK) => {
  const mau = l.muaVao + l.tonKho;
  return mau <= 0 ? null : Math.round((l.banRa / mau) * 1000) / 1000;
};

/*
  Cờ kiểm tra K — GẮN CỜ, KHÔNG LOẠI DÒNG [R].

  Lệch giữa K tính lại và K hệ thống có thể do nguồn, có thể do công thức, và
  bản mẫu không có thẩm quyền quyết định bên nào đúng. Loại dòng đi thì báo
  cáo thiếu số mà không ai biết; để nguyên và gắn cờ thì người làm số nhìn
  thấy đúng chỗ cần hỏi lại.
*/
export const coCoK = (l: LuotK) => {
  const k = kTinhLai(l);
  return k === null || Math.abs(k - l.kHeThong) > 0.01;
};

export const danhSachK = (hatKy: number, soDong = 180): LuotK[] => {
  const r = prng(hatCua(hatKy, "ds-k"));
  return Array.from({ length: soDong }, (_, i) => {
    const dv = DON_VI_QL2[nguyen(r, 0, DON_VI_QL2.length - 1)];
    const muaVao = nguyen(r, 200, 48_000) / 10;
    const tonKho = nguyen(r, 0, 9_000) / 10;
    const banRa = Math.round((muaVao + tonKho) * (0.7 + r() * 2.1) * 10) / 10;
    const kThat = muaVao + tonKho <= 0 ? 0 : banRa / (muaVao + tonKho);
    /* Một phần nhỏ số dòng cố ý LỆCH so với K tính lại, để cờ kiểm tra có việc
       thật mà làm — nguồn thật cũng lệch, đó là lý do cờ tồn tại. */
    const lech = r() < 0.12 ? (r() - 0.5) * 0.4 : 0;
    return {
      mst: mstGia(500 + i),
      ten: tenNNTGia(500 + i),
      nganhNghe: NGANH_NGHE[nguyen(r, 0, NGANH_NGHE.length - 1)],
      canBo: tenCanBoGia(nguyen(r, 0, 40)),
      dv,
      muaVao,
      banRa,
      tonKho,
      kMacDinh: [1.0, 1.2, 1.5, 2.0][nguyen(r, 0, 3)],
      kHeThong: Math.round((kThat + lech) * 1000) / 1000,
      trangThai: TRANG_THAI_K[Math.min(TRANG_THAI_K.length - 1, Math.floor(r() * r() * TRANG_THAI_K.length * 1.5))],
      soNgayTon: nguyen(r, 0, 96),
    };
  });
};

/* ── QL2-04 · Xác minh hóa đơn ───────────────────────────────────────────── */

/*
  Sáu trạng thái được GIỮ theo BR-22, BR-23: 6 nhận, 7 phân công, 8 gửi lãnh
  đạo, 9 duyệt, 10 từ chối, 14 đã trả kết quả. "Đã hủy" và "thay thế" bị loại
  khỏi mọi phép đếm.

  Trạng thái 10 tính vào đâu còn chờ Q-16. Bản mẫu xếp nó vào TỒN: yêu cầu bị
  từ chối thì bên hỏi vẫn chưa nhận được kết quả, nên việc chưa xong.
*/
export const TRANG_THAI_XM = [
  { ma: 6, nhan: "Nhận" },
  { ma: 7, nhan: "Phân công" },
  { ma: 8, nhan: "Gửi lãnh đạo" },
  { ma: 9, nhan: "Duyệt" },
  { ma: 10, nhan: "Từ chối" },
  { ma: 14, nhan: "Đã trả kết quả" },
] as const;

export interface HangXM {
  dv: DonViQL2;
  /** Đếm theo đúng thứ tự `TRANG_THAI_XM`. */
  theoTrangThai: number[];
  /** Trong phần tồn: số yêu cầu đã quá hạn so với ngày báo cáo (BR-24). */
  quaHan: number;
}

export const bangXM = (hatKy: number): HangXM[] =>
  DON_VI_QL2.map((dv) => {
    const r = prng(hatCua(hatKy, dv.id, "xm"));
    const heSo = quyMo(dv);
    const theoTrangThai = TRANG_THAI_XM.map((t) =>
      t.ma === 14 ? nguyen(r, 40, Math.round(900 * heSo)) : nguyen(r, 0, Math.round(26 * heSo)));
    const ton = theoTrangThai.reduce((t, x, i) => t + (TRANG_THAI_XM[i].ma === 14 ? 0 : x), 0);
    return { dv, theoTrangThai, quaHan: nguyen(r, 0, ton) };
  });

export const I_DA_TRA = TRANG_THAI_XM.findIndex((t) => t.ma === 14);
export const tongXM = (h: HangXM) => h.theoTrangThai.reduce((t, x) => t + x, 0);
export const daTraXM = (h: HangXM) => h.theoTrangThai[I_DA_TRA];
export const tonXM = (h: HangXM) => tongXM(h) - daTraXM(h);

export interface YeuCauXM {
  so: string;
  ngayGui: string;
  hanXuLy: string;
  dv: DonViQL2;
  canBo: string;
  mstBan: string;
  tenBan: string;
  trangThai: number;
  /** Dương = đã quá hạn bấy nhiêu ngày; âm = còn lại bấy nhiêu ngày. */
  soNgayQuaHan: number;
}

export const danhSachXM = (hatKy: number, soDong = 150): YeuCauXM[] => {
  const r = prng(hatCua(hatKy, "ds-xm"));
  return Array.from({ length: soDong }, (_, i) => {
    const dv = DON_VI_QL2[nguyen(r, 0, DON_VI_QL2.length - 1)];
    const ngay = nguyen(r, 1, 26);
    return {
      so: `XM/${String(7100 + i).padStart(5, "0")}`,
      ngayGui: `${String(ngay).padStart(2, "0")}/09/2026`,
      hanXuLy: `${String(Math.min(30, ngay + 7)).padStart(2, "0")}/09/2026`,
      dv,
      canBo: tenCanBoGia(nguyen(r, 0, 40)),
      mstBan: mstGia(900 + i),
      tenBan: tenNNTGia(900 + i),
      trangThai: TRANG_THAI_XM[nguyen(r, 0, TRANG_THAI_XM.length - 2)].ma,
      soNgayQuaHan: nguyen(r, -2, 21),
    };
  });
};
