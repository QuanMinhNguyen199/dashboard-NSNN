import { DAY_TCS, maCuaTCS, nhanTCS, phongVPCua } from "@/data/danhMuc";
import { NGANH_NGHE, hatCua, mstGia, nguyen, prng, tenCanBoGia, tenNNTGia } from "@/data/ngauNhien";
import type { MucKy } from "@/components/BoLoc";
import { dauTuan, nhanTuan, nhanTuanDenNgay } from "@/data/nhanKy";

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

export interface KyQL2 extends MucKy { hat: number; ngayChot: string; ngayDau?: string }

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

/** §4.1: mặc định tuần thứ Sáu–thứ Năm; thêm tháng, ngày và khoảng ngày ở màn. */
const NGAY_QL2_02 = ["26/09/2026", "25/09/2026", "24/09/2026", "23/09/2026", "22/09/2026"];

export const KY_QL2_02: KyQL2[] = [
  ...[39, 38, 37, 36].map((w, i) => ({
    id: `q202-w${w}`, loai: "TUAN" as const,
    ngayDau: ["18/09/2026", "11/09/2026", "04/09/2026", "28/08/2026"][i],
    ngayChot: ["24/09/2026", "17/09/2026", "10/09/2026", "03/09/2026"][i],
    nhan: nhanTuan(["18/09/2026", "11/09/2026", "04/09/2026", "28/08/2026"][i], ["24/09/2026", "17/09/2026", "10/09/2026", "03/09/2026"][i]),
    hat: 2240 + i,
  })),
  ...[9, 8, 7].map((m) => ({
    id: `q202-m${String(m).padStart(2, "0")}`, loai: "THANG" as const,
    ngayDau: `01/${String(m).padStart(2, "0")}/2026`,
    ngayChot: `${new Date(2026, m, 0).getDate()}/${String(m).padStart(2, "0")}/2026`,
    nhan: `Tháng ${String(m).padStart(2, "0")}/2026`, hat: 2260 + m,
  })),
  ...NGAY_QL2_02.map((d, i) => ({ id: `q202-d${d.slice(0, 2)}${d.slice(3, 5)}`, loai: "NGAY" as const, ngayDau: d, ngayChot: d, nhan: `Ngày ${d}`, hat: 2200 + i })),
];

/** Mốc tồn đầu là ảnh chụp ngày trước ngày bắt đầu khoảng báo cáo. */
export const ngayTonDauK = (ky: KyQL2) => {
  const [d, m, y] = (ky.ngayDau ?? ky.ngayChot).split("/").map(Number);
  const date = new Date(y, m - 1, d - 1);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

/** QL2-04: tuần đến ngày báo cáo, hoặc tháng (§4.1). */
export const KY_QL2_04: KyQL2[] = [
  ...[39, 38, 37, 36].map((w, i) => {
    /* §4.1 gọi kỳ này là "tuần đến ngày báo cáo": bảy ngày kết thúc đúng ngày
       chốt. Nhãn vì thế nói đủ khoảng, không chỉ nói ngày cuối. */
    const chot = ["25/09/2026", "18/09/2026", "11/09/2026", "04/09/2026"][i];
    return {
      id: `q204-w${w}`,
      loai: "TUAN" as const,
      ngayDau: dauTuan(chot),
      ngayChot: chot,
      nhan: nhanTuanDenNgay(chot),
      hat: 2400 + i,
    };
  }),
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
  "QL2-03": KY_QL2_01.map((k) => ({ ...k, id: k.id.replace("q201", "q203"), nhan: k.nhan.split(" · ")[0] })),
  "QL2-06": KY_QL2_01.map((k) => ({ ...k, id: k.id.replace("q201", "q206"), nhan: k.nhan.split(" · ")[0] })),
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

/** Phạm vi thiếu r31 của dữ liệu MÔ PHỎNG, không suy từ kết quả rà soát.
 * Tháng 09 đầy đủ; tháng 08 thiếu T1 để kiểm tra nhánh dự phòng (§4.4).
 * Khi nối nguồn thật, thay bằng metadata tiếp nhận theo kỳ và đơn vị.
 */
export const donViThieuR31 = (hatKy: number): string[] => hatKy === 2108 ? ["T1"] : [];

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

/*
  MỘT DÒNG = MST × LOẠI TỜ KHAI × KỲ — đúng khóa mà §4.2 tab 3 đặt ra.

  Bản trước phát mỗi dòng một MST mới, nên 240 dòng ra 240 doanh nghiệp và
  chiều "× loại tờ khai" chỉ tồn tại trên phụ đề. Nó giấu mất tình huống
  nghiệp vụ mà màn phải xử lý được: cùng một NNT lệch cả đầu ra lẫn đầu vào,
  hai dòng, hai kết quả rà soát khác nhau — và người duyệt thiết kế không bao
  giờ gặp câu hỏi "giao phiếu theo dòng hay theo MST".

  Phần lớn NNT chỉ lệch một chiều; một phần lệch hai; rất ít lệch cả bốn.
*/
export const danhSachChenhLech = (hatKy: number, soDong = 240): NNTChenhLech[] => {
  const r = prng(hatCua(hatKy, "ds-chenh"));
  const ra: NNTChenhLech[] = [];

  for (let i = 0; ra.length < soDong; i++) {
    const dv = DON_VI_QL2[nguyen(r, 0, DON_VI_QL2.length - 1)];
    /* Không nộp tờ khai là tính chất của MST TRONG KỲ, không của từng loại —
       §4.4: "Có hóa đơn, Kê khai trống". Nên nó giống nhau ở mọi dòng của
       cùng một MST, không gieo lại từng dòng. */
    const khongNopTK = r() < 0.08;

    const x = r();
    const soLoai = x < 0.62 ? 1 : x < 0.9 ? 2 : x < 0.98 ? 3 : 4;
    /* Trộn Fisher–Yates: `sort` với bộ so sánh ngẫu nhiên cho phân phối lệch
       và còn phụ thuộc thuật toán sắp xếp của từng engine. */
    const loai = CHIEU_CHENH.map((c) => c.id);
    for (let k = loai.length - 1; k > 0; k--) {
      const j = nguyen(r, 0, k);
      [loai[k], loai[j]] = [loai[j], loai[k]];
    }

    for (const chieu of loai.slice(0, soLoai)) {
      if (ra.length >= soDong) break;
      const ketQua = KET_QUA_PRS03[Math.min(KET_QUA_PRS03.length - 1, Math.floor(r() * r() * KET_QUA_PRS03.length * 1.4))];
      const daGiao = ketQua !== "Chưa có kết quả" || r() < 0.45;
      ra.push({
        mst: mstGia(i),
        ten: tenNNTGia(i),
        dv,
        chieu,
        chenhLech: Math.round(nguyen(r, 4, 1800) / 10) / 10,
        khongNopTK,
        ketQua,
        /* Mã phiếu theo ĐƠN VỊ, không theo số thứ tự dòng: §6 ghi phiếu "tự
           tách theo đơn vị", nên hai dòng cùng đơn vị phải cùng một mã. */
        phieu: daGiao ? `PRS-03/${String(2600 + DON_VI_QL2.indexOf(dv)).padStart(4, "0")}` : "",
        han: daGiao ? "25/09/2026" : "",
      });
    }
  }
  return ra;
};

/** Cờ của một dòng — §4.2 tab 3 liệt kê ba cờ; hai cờ đầu suy từ loại tờ
 *  khai theo §4.4 (đầu ra → khai thiếu, đầu vào → khai thừa, 03/04 → khai
 *  thiếu doanh thu). */
export const CO_CHENH = [
  { id: "thieu", nhan: "Khai thiếu", hop: (r: NNTChenhLech) => r.chieu !== "vao" },
  { id: "thua", nhan: "Khai thừa", hop: (r: NNTChenhLech) => r.chieu === "vao" },
  { id: "khongnop", nhan: "Không nộp tờ khai", hop: (r: NNTChenhLech) => r.khongNopTK },
] as const;

/* ── QL2-02 · Cảnh báo hệ số K ───────────────────────────────────────────── */

export interface HangHeSoK {
  dv: DonViQL2;
  tonDau: number;
  phatSinh: number;
  daXuLy: number;
}

export const bangHeSoK = (hatKy: number, vuongMac: readonly string[] = []): HangHeSoK[] => {
  const rows = danhSachK(hatKy);
  return DON_VI_QL2.map((dv) => {
    const ds = rows.filter((r) => r.dv.id === dv.id);
    const tonDau = ds.filter((r) => !r.phatSinhTrongKy).length;
    const phatSinh = ds.filter((r) => r.phatSinhTrongKy).length;
    const tonCuoi = ds.filter((r) => r.trangThai === "Chưa xử lý" && !vuongMac.includes(r.mst)).length;
    return { dv, tonDau, phatSinh, daXuLy: tonDau + phatSinh - tonCuoi };
  });
};

export const tonCuoiK = (h: HangHeSoK) => h.tonDau + h.phatSinh - h.daXuLy;

export const TRANG_THAI_K = ["Chưa xử lý", "Đã xử lý"] as const;
export type TrangThaiK = (typeof TRANG_THAI_K)[number];

/** Fixture chỉ dùng hai nhóm đã xác định; không tự phân loại Chờ phê duyệt/Lưu tạm (Q-98). */
export const NHOM_DA_XU_LY: readonly TrangThaiK[] = ["Đã xử lý"];

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
  nguongNganh: number;
  ngayHieuLuc: string;
  phatSinhTrongKy: boolean;
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
  return k === null || Math.abs(k - l.kHeThong) > 0.01 || l.kMacDinh !== l.nguongNganh;
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
      kMacDinh: 2,
      nguongNganh: i % 9 === 0 ? 4 : 2,
      ngayHieuLuc: "01/01/2026",
      phatSinhTrongKy: i % 3 === 0,
      kHeThong: Math.round((kThat + lech) * 1000) / 1000,
      trangThai: TRANG_THAI_K[Math.min(TRANG_THAI_K.length - 1, Math.floor(r() * r() * TRANG_THAI_K.length * 1.5))],
      soNgayTon: nguyen(r, 0, 96),
    };
  });
};

/* ── QL2-04 · Xác minh hóa đơn ───────────────────────────────────────────── */

/** §4.6, cập nhật 06/10: mẫu gồm 10, 14, 6, 7, 8; 10 thuộc tồn. Không có cột 9. */
export const TRANG_THAI_XM = [
  { ma: 10, nhan: "Từ chối" },
  { ma: 14, nhan: "Đã trả kết quả" },
  { ma: 6, nhan: "Nhận" },
  { ma: 7, nhan: "Phân công" },
  { ma: 8, nhan: "Gửi lãnh đạo" },
] as const;

export interface HangXM {
  dv: DonViQL2;
  /** Đếm theo đúng thứ tự `TRANG_THAI_XM`. */
  theoTrangThai: number[];
  /** Trong phần tồn: số yêu cầu đã quá hạn so với ngày báo cáo (BR-24). */
  quaHan: number;
}

export const bangXM = (hatKy: number): HangXM[] => {
  const rows = danhSachXM(hatKy);
  return DON_VI_QL2.map((dv) => {
    const ds = rows.filter((r) => r.dv.id === dv.id);
    return { dv, theoTrangThai: TRANG_THAI_XM.map((t) => ds.filter((r) => r.trangThai === t.ma).length), quaHan: ds.filter((r) => r.trangThai !== 14 && r.soNgayQuaHan > 0).length };
  });
};

export const I_DA_TRA = TRANG_THAI_XM.findIndex((t) => t.ma === 14);
export const tongXM = (h: HangXM) => h.theoTrangThai.reduce((t, x) => t + x, 0);
export const daTraXM = (h: HangXM) => h.theoTrangThai[I_DA_TRA];
export const tonXM = (h: HangXM) => tongXM(h) - daTraXM(h);

export interface YeuCauXM {
  so: string;
  soHoaDon: string;
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
  const ky = KY_QL2_04.find((k) => k.hat === hatKy) ?? KY_QL2_04[0];
  const [d, m, y] = ky.ngayChot.split("/").map(Number);
  const chot = new Date(y, m - 1, d);
  const format = (date: Date) => `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  return Array.from({ length: soDong }, (_, i) => {
    const dv = DON_VI_QL2[nguyen(r, 0, DON_VI_QL2.length - 1)];
    const soNgayQuaHan = nguyen(r, -12, 21);
    const han = new Date(chot); han.setDate(han.getDate() - soNgayQuaHan);
    const gui = new Date(han); gui.setDate(gui.getDate() - 14);
    return {
      so: `XM/${String(7100 + Math.floor(i / 2)).padStart(5, "0")}`,
      soHoaDon: `HD${String(100000 + i)}`,
      ngayGui: format(gui),
      hanXuLy: format(han),
      dv,
      canBo: tenCanBoGia(nguyen(r, 0, 40)),
      mstBan: mstGia(900 + i),
      tenBan: tenNNTGia(900 + i),
      trangThai: TRANG_THAI_XM[nguyen(r, 0, TRANG_THAI_XM.length - 1)].ma,
      soNgayQuaHan,
    };
  });
};
