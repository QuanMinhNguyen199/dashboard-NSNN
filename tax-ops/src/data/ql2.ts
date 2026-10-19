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

/*
  QL2-03 · TPR — MoM 15/10: QLDN2 mô tả đủ kỳ tháng, quý, 6 tháng. Số TPR là
  lũy kế nên mỗi kỳ là một KHOẢNG THÁNG: tháng thì cộng từ tháng chọn ở màn đến
  tháng báo cáo, quý và 6 tháng thì có sẵn khoảng của chính nó.
*/
export const KY_QL2_03: KyQL2[] = [
  ...[9, 8, 7, 6, 5].map((m) => ({
    id: `q203-m${String(m).padStart(2, "0")}`,
    loai: "THANG" as const,
    ngayChot: `${new Date(2026, m, 0).getDate()}/${String(m).padStart(2, "0")}/2026`,
    nhan: `Tháng ${String(m).padStart(2, "0")}/2026`,
    hat: 2100 + m,
  })),
  { id: "q203-q3", loai: "QUY" as const, ngayDau: "01/07/2026", ngayChot: "30/09/2026", nhan: "Quý III/2026", hat: 2393 },
  { id: "q203-q2", loai: "QUY" as const, ngayDau: "01/04/2026", ngayChot: "30/06/2026", nhan: "Quý II/2026", hat: 2392 },
  { id: "q203-h1", loai: "SAUTHANG" as const, ngayDau: "01/01/2026", ngayChot: "30/06/2026", nhan: "6 tháng đầu năm 2026", hat: 2396 },
];

export const KY_CUA_BAO_CAO: Record<string, KyQL2[]> = {
  "QL2-01": KY_QL2_01,
  "QL2-02": KY_QL2_02,
  "QL2-04": KY_QL2_04,
  "QL2-03": KY_QL2_03,
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
  /* MoM 15/10: "Từ kỳ này, tồn đầu kỳ tính bằng 0". Cột (5)–(8) vẫn giữ trên
     mẫu nhưng mang số 0. Vẫn rút số ngẫu nhiên để các cột sau không đổi hạt. */
  nguyen(r, 0, Math.round(14 * heSo));
  const dauNam_NNT = 0;
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
    dauNam_Thue: (r(), 0),
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
  /** Cán bộ quản lý theo danh bạ phân công TMS 2.4.2 — MoM 15/10 yêu cầu lập danh sách theo cán bộ. */
  canBo: string;
  chieu: ChieuChenh;
  /** Triệu đồng; luôn ≥ 1 vì danh sách chỉ lấy chênh lệch từ 1 triệu đồng trở lên (MoM 15/10). */
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
        /* Cán bộ gắn theo MST, không rút ngẫu nhiên: cùng một NNT ở mọi dòng
           và mọi kỳ phải về đúng một người quản lý. */
        canBo: tenCanBoGia((i * 7 + DON_VI_QL2.indexOf(dv)) % 41),
        chieu,
        chenhLech: Math.round(nguyen(r, 100, 1800) / 10) / 10,
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
    const tonCuoi = ds.filter((r) => conTonK(r) && !vuongMac.includes(r.mst)).length;
    return { dv, tonDau, phatSinh, daXuLy: tonDau + phatSinh - tonCuoi };
  });
};

export const tonCuoiK = (h: HangHeSoK) => h.tonDau + h.phatSinh - h.daXuLy;

/* "Lưu tạm" đứng giữa vì nó vẫn là việc chưa xong — MoM 15/10 trả lời Q-98:
   cảnh báo đang lưu tạm tính vào tồn. "Chờ phê duyệt" chưa được nhắc nên
   chưa đưa vào dữ liệu mô phỏng. */
export const TRANG_THAI_K = ["Chưa xử lý", "Lưu tạm", "Đã xử lý"] as const;
export type TrangThaiK = (typeof TRANG_THAI_K)[number];

export const NHOM_DA_XU_LY: readonly TrangThaiK[] = ["Đã xử lý"];
export const conTonK = (l: { trangThai: TrangThaiK }) => !NHOM_DA_XU_LY.includes(l.trangThai);

/** Mốc tồn hệ số K: ngày sáp nhập ngành thuế (MoM 15/10). */
export const MOC_TON_K = "17/03/2025";

/** Trạng thái mã số thuế lấy từ TMS — MoM 15/10 yêu cầu thêm vào danh sách K. */
export const TRANG_THAI_MST = [
  "00 · Đang hoạt động",
  "05 · Tạm ngừng kinh doanh",
  "06 · Không hoạt động tại địa chỉ đăng ký",
  "03 · Ngừng hoạt động, chưa hoàn thành thủ tục",
] as const;

export interface LuotK {
  mst: string;
  ten: string;
  nganhNghe: string;
  canBo: string;
  dv: DonViQL2;
  trangThaiMST: (typeof TRANG_THAI_MST)[number];
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
      /* Hạt riêng theo MST: trạng thái là thuộc tính của doanh nghiệp, giống
         nhau ở mọi kỳ, và không làm xê dịch các trường rút từ `r`. */
      trangThaiMST: (() => {
        const x = prng(hatCua(500 + i, "tt-mst"))();
        return TRANG_THAI_MST[x < 0.82 ? 0 : x < 0.9 ? 1 : x < 0.96 ? 2 : 3];
      })(),
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

/*
  Mẫu XMHD_BC TUAN có 10, 14, 6, 7, 8. MoM 15/10 bổ sung trạng thái 9 (đã
  duyệt, đang chờ cấp số) và chốt 9 tính là ĐÃ TRẢ KẾT QUẢ cùng 14; 6 và 8 là
  tồn. 7 và 10 MoM không nhắc, giữ trong tồn như mẫu.
*/
export const TRANG_THAI_XM = [
  { ma: 10, nhan: "Từ chối" },
  { ma: 14, nhan: "Đã trả kết quả" },
  { ma: 9, nhan: "Đã duyệt, chờ cấp số" },
  { ma: 6, nhan: "Nhận" },
  { ma: 7, nhan: "Phân công" },
  { ma: 8, nhan: "Gửi lãnh đạo" },
] as const;

export const MA_DA_TRA_XM: readonly number[] = [9, 14];
export const daTraMaXM = (ma: number) => MA_DA_TRA_XM.includes(ma);

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
    return { dv, theoTrangThai: TRANG_THAI_XM.map((t) => ds.filter((r) => r.trangThai === t.ma).length), quaHan: ds.filter((r) => !daTraMaXM(r.trangThai) && r.soNgayQuaHan > 0).length };
  });
};

/** Cộng số theo các mã đã trả (9 + 14) từ một mảng đếm cùng thứ tự `TRANG_THAI_XM`. */
export const daTraTheo = (theo: readonly number[]) => TRANG_THAI_XM.reduce((t, s, i) => t + (daTraMaXM(s.ma) ? theo[i] : 0), 0);
export const tongXM = (h: HangXM) => h.theoTrangThai.reduce((t, x) => t + x, 0);
export const daTraXM = (h: HangXM) => daTraTheo(h.theoTrangThai);
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

/* ── QL2-03 · Rủi ro hóa đơn TPR ─────────────────────────────────────────── */

/*
  Mười chỉ tiêu đếm của "Mẫu 1 kỳ" và "TH" [F]. `so` là số cột in trên mẫu,
  giữ để đối chiếu với tệp; (6) và (16) là tỷ lệ, tính ra chứ không lưu.

  Bảng mã kqrr (MoM 15/10) quy về các cột này: 1 → (15), 2 → (7), 3 → (13),
  4 và 5 → (12), 6 → (11), 7 → (8), 8 → (9) và (10), 9 → (14).
*/
export interface SoTPR {
  phai: number;
  ktBan: number;
  boSung: number;
  saiPham: number;
  tienXuLy: number;
  congAn: number;
  tt0609: number;
  tt05: number;
  giaiThe: number;
  khongRR: number;
}

export const COT_KQ_TPR: readonly { id: keyof SoTPR; so: number; nhan: string; maKq: string }[] = [
  { id: "ktBan", so: 7, nhan: "Kiểm tra tại bàn", maKq: "Mã 2" },
  { id: "boSung", so: 8, nhan: "Bổ sung vào KT tại trụ sở NNT", maKq: "Mã 7" },
  { id: "saiPham", so: 9, nhan: "Phát hiện sai phạm", maKq: "Mã 8" },
  { id: "tienXuLy", so: 10, nhan: "Tổng số tiền xử lý vi phạm", maKq: "Mã 8" },
  { id: "congAn", so: 11, nhan: "Chuyển hồ sơ CA", maKq: "Mã 6" },
  { id: "tt0609", so: 12, nhan: "Chuyển trạng thái 06 + 09", maKq: "Mã 4, 5" },
  { id: "tt05", so: 13, nhan: "Tạm dừng hoạt động (05)", maKq: "Mã 3" },
  { id: "giaiThe", so: 14, nhan: "Giải thể (hoàn thành + đang làm thủ tục)", maKq: "Mã 9" },
  { id: "khongRR", so: 15, nhan: "Không có rủi ro", maKq: "Mã 1" },
];

/** Công thức của mẫu: đã rà soát = (7) + (8) + (14). */
export const daRaSoatTPR = (s: SoTPR) => s.ktBan + s.boSung + s.giaiThe;

const RONG_TPR: SoTPR = { phai: 0, ktBan: 0, boSung: 0, saiPham: 0, tienXuLy: 0, congAn: 0, tt0609: 0, tt05: 0, giaiThe: 0, khongRR: 0 };

export const congTPR = (ds: SoTPR[]): SoTPR => ds.reduce((t, s) => {
  const ra = { ...t };
  (Object.keys(ra) as (keyof SoTPR)[]).forEach((k) => { ra[k] = Math.round((ra[k] + s[k]) * 10) / 10; });
  return ra;
}, RONG_TPR);

/*
  Một tháng đánh giá của một đơn vị. Hạt theo THÁNG + ĐƠN VỊ, không theo kỳ
  lọc: số lũy kế quý III phải đúng bằng tổng ba tháng 7, 8, 9 đọc riêng.
*/
const thangTPR = (id: string, thang: number, heSo: number): SoTPR => {
  const r = prng(hatCua(2300 + thang, id, "tpr"));
  const phai = nguyen(r, 1, Math.max(2, Math.round(9 * heSo)));
  const da = Math.min(phai, Math.round(phai * (0.55 + r() * 0.45)));
  const giaiThe = Math.min(da, r() < 0.15 ? 1 : 0);
  const boSung = Math.min(da - giaiThe, r() < 0.18 ? 1 : 0);
  const ktBan = da - giaiThe - boSung;
  const saiPham = Math.min(ktBan, r() < 0.25 ? nguyen(r, 1, 2) : 0);
  return {
    phai, ktBan, boSung, giaiThe, saiPham,
    tienXuLy: saiPham ? Math.round(saiPham * (4 + r() * 30) * 10) / 10 : 0,
    congAn: Math.min(ktBan, r() < 0.2 ? 1 : 0),
    tt0609: Math.min(ktBan, r() < 0.3 ? nguyen(r, 1, 2) : 0),
    tt05: Math.min(ktBan, r() < 0.12 ? 1 : 0),
    khongRR: Math.round(ktBan * (0.2 + r() * 0.5)),
  };
};

const luyKeTPR = (id: string, heSo: number, tu: number, den: number) =>
  congTPR(Array.from({ length: Math.max(0, den - tu + 1) }, (_, i) => thangTPR(id, tu + i, heSo)));

const nntQuanLy = (id: string, min: number, max: number) => nguyen(prng(hatCua(1, id, "nnt-ql")), min, max);

export interface DongTPR { id: string; ma: string; ten: string; so: SoTPR; nntQL: number }

/** Phòng HKD/Cá nhân KD đứng trong khối Văn phòng của mẫu, sau năm phòng QLHTDN. */
const PHONG_HKD = { id: "HKD", ten: "Phòng HKD/Cá nhân KD" };

export const thangCuaKy = (ky: KyQL2) => ({
  tu: ky.ngayDau ? Number(ky.ngayDau.slice(3, 5)) : 1,
  den: Number(ky.ngayChot.slice(3, 5)),
});

/*
  Dòng 8501 là CỘNG của các dòng "Trong đó" — mẫu tính ngược lại (tải 8501
  rồi tách tay), nhưng hướng nào thì hai bên cũng phải khớp, và dựng từ phần
  tách thì không thể lệch.
*/
export const bangTPR = (tu: number, den: number) => {
  const phong: DongTPR[] = [...VP.map((p) => ({ id: p.id, ten: p.ten })), PHONG_HKD].map((p) => ({
    id: p.id, ma: "", ten: p.ten, so: luyKeTPR(p.id, 0.35, tu, den), nntQL: nntQuanLy(p.id, 1500, 4200),
  }));
  const vp: DongTPR = { id: "8501", ma: "8501", ten: "Văn phòng Thuế TP Hà Nội", so: congTPR(phong.map((p) => p.so)), nntQL: phong.reduce((t, p) => t + p.nntQL, 0) };
  const tcs: DongTPR[] = DON_VI_QL2.filter((d) => d.nhom === "TCS").map((d) => ({
    id: d.id, ma: d.ma, ten: d.ten, so: luyKeTPR(d.id, 1, tu, den), nntQL: nntQuanLy(d.id, 1300, 15000),
  }));
  return { vp, phong, tcs, tong: { ...vp, id: "tong", ma: "", ten: "Tổng cộng", so: congTPR([vp.so, ...tcs.map((t) => t.so)]), nntQL: vp.nntQL + tcs.reduce((t, x) => t + x.nntQL, 0) } };
};

/** Tỷ lệ chấm điểm TPR theo đơn vị QL2 (lũy kế từ tháng 1 đến tháng của kỳ). */
export const tyLeTPRTheoDonVi = (den: number) => {
  const b = bangTPR(1, den);
  const ds = [...b.phong, ...b.tcs];
  const ra = new Map<string, number | null>(ds.map((d) => [d.id, d.so.phai ? daRaSoatTPR(d.so) / d.so.phai : null]));
  return { theo: ra, binhQuan: b.tong.so.phai ? daRaSoatTPR(b.tong.so) / b.tong.so.phai : 0 };
};

/** Lọc bảng TPR theo đơn vị đang chọn — dùng chung cho màn hình và tệp báo cáo. */
export const locTPR = (bang: ReturnType<typeof bangTPR>, donVi: readonly string[]) => {
  const coDV = (ten: string) => !donVi.length || donVi.includes(ten);
  /* Phòng HKD không có trong danh mục đơn vị của bộ lọc: nó chỉ hiện khi đang
     xem đủ năm phòng Văn phòng, tức khi đang xem cả khối. */
  const phong = bang.phong.filter((p) => p.id === "HKD" ? VP.every((d) => coDV(d.ten)) : coDV(p.ten));
  const vp = !donVi.length || phong.length > 0 ? bang.vp : null;
  const tcs = bang.tcs.filter((d) => coDV(d.ten));
  const tong: DongTPR = {
    id: "tong", ma: "", ten: "Tổng cộng",
    so: congTPR([...(vp ? [vp.so] : []), ...tcs.map((t) => t.so)]),
    nntQL: (vp?.nntQL ?? 0) + tcs.reduce((t, x) => t + x.nntQL, 0),
  };
  return { tong, vp, phong: vp ? phong : [], tcs };
};

/* ── QL2-06 · Gói rủi ro hóa đơn Công an ─────────────────────────────────── */

/*
  Theo mẫu "BC gói hđ CA" (MoM 15/10): bốn loại kết quả, mỗi loại tính cả số
  DN và số hóa đơn. Đã xử lý không lưu — nó là tổng bốn loại.

  Nguồn dữ liệu của gói CHƯA được xác nhận (MoM không nêu hệ thống tải); số
  dưới đây là mô phỏng để duyệt giao diện và luồng báo cáo.
*/
export const KET_QUA_CA = [
  { id: "tuLoai", nhan: "Tự loại trước khi có KL của CQĐT" },
  { id: "khongSD", nhan: "Không sử dụng HĐ, không hạch toán chi phí" },
  { id: "xuPhat", nhan: "Lập biên bản, ban hành QĐ xử phạt" },
  { id: "camKet", nhan: "Xin cam kết không điều chỉnh giảm" },
] as const;

export interface SoCA { dn: number; hd: number }
export interface HangCA { dv: DonViQL2; phai: SoCA; ketQua: SoCA[] }

export const daXuLyCA = (h: { ketQua: SoCA[] }): SoCA =>
  h.ketQua.reduce((t, k) => ({ dn: t.dn + k.dn, hd: t.hd + k.hd }), { dn: 0, hd: 0 });

/** Chia `tong` thành `n` phần nguyên không âm, cộng lại đúng bằng `tong`. */
const chiaPhan = (r: () => number, tong: number, n: number) => {
  const w = Array.from({ length: n }, () => r() + 0.05);
  const s = w.reduce((t, x) => t + x, 0);
  const ra = w.map((x) => Math.floor((x / s) * tong));
  ra[0] += tong - ra.reduce((t, x) => t + x, 0);
  return ra;
};

export const bangCongAn = (hatKy: number): HangCA[] => DON_VI_QL2.map((dv) => {
  const r = prng(hatCua(hatKy, dv.id, "congan"));
  const dn = nguyen(r, 6, Math.round(70 * (dv.nhom === "VP" ? 1.8 : 1)));
  const hd = Math.round(dn * (2 + r() * 12));
  /* Gói Công an chạy lũy kế và gần xong — mẫu tháng 7 đạt 92–100% theo DN. */
  const daDN = Math.min(dn, Math.round(dn * (0.9 + r() * 0.1)));
  const daHD = Math.min(hd, Math.round(hd * (0.86 + r() * 0.14)));
  const phanDN = chiaPhan(r, daDN, KET_QUA_CA.length);
  const phanHD = chiaPhan(r, daHD, KET_QUA_CA.length);
  return { dv, phai: { dn, hd }, ketQua: KET_QUA_CA.map((_, i) => ({ dn: phanDN[i], hd: phanHD[i] })) };
});
