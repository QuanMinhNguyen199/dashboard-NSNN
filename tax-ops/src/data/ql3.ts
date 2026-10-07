/*
  Dữ liệu GIẢ cho phân hệ Kiểm tra tại bàn của phòng QL3.

  Cấu trúc lấy từ file kết xuất thật `1_QL3_3_KQ tong hop cuoi cung.xls`:
  một sheet, 17 cột, một dòng tiêu đề, kỳ LŨY KẾ từ 01/01 đến ngày báo cáo.
  Mọi con số dưới đây do hàm sinh ra; mục S5 bản thiết kế: mockup chỉ dùng dữ
  liệu giả.
*/

import { DAY_TCS, nhanTCS, phongVPCua } from "@/data/danhMuc";
/* MST và tên NNT giả dùng CHUNG một nguồn với mọi phân hệ: cùng một khuôn số
   và cùng một kiểu tên, để không phân hệ nào trông như có dữ liệu thật hơn
   phân hệ khác. */
import { mstGia, tenNNTGia } from "@/data/ngauNhien";

export interface DonViQL3 {
  id: string;
  ten: string;
  nhom: "VP" | "TCS";
}

/*
  Danh mục đơn vị của QL3 KHÁC QL1, và khác ở hai chỗ cụ thể.

  Một: khối Văn phòng chỉ có năm phòng QLHTDN — không có Phòng Thuế cá nhân,
  hộ kinh doanh và cũng không có Phòng Quản lý các khoản thu từ đất, vì hai
  phòng ấy không làm kiểm tra tại bàn khối doanh nghiệp.

  Hai: thuế cơ sở ở đây mang MÃ CHỮ theo địa bàn — "Thuế cơ sở 01 (HKI)" —
  trong khi file QL1 chỉ ghi "Thuế cơ sở 1". Dùng chung một danh mục cho cả
  hai phân hệ sẽ sai ở một trong hai.
*/
/*
  Danh mục đọc từ `data/danhMuc.ts`, không khai lại ở đây.

  Bản khai tay trước đó sai mã viết tắt của Thuế cơ sở 18 đến 25 so với Phụ
  lục A của FRS, và gán mỗi Thuế cơ sở đúng một mã địa bàn — trong khi năm đơn
  vị (TCS 18, 19, 20, 21, 22) gồm hai địa bàn. Số liệu kéo theo mã địa bàn gom
  vào một mã duy nhất sẽ hụt mất một nửa mà không có dấu hiệu nào.
*/
export const DON_VI_QL3: DonViQL3[] = [
  ...phongVPCua("QL3").map((p) => ({ id: p.id, ten: `Phòng QLHTDN ${p.thuTu}`, nhom: "VP" as const })),
  ...DAY_TCS.map((so) => ({ id: `T${so}`, ten: nhanTCS(so), nhom: "TCS" as const })),
];

export interface KyQL3 {
  id: string;
  /** Lũy kế: luôn từ 01/01 của năm đến ngày này. */
  denNgay: string;
  nhan: string;
  thangKPI: string;
  hat: number;
}

export const KY_QL3: KyQL3[] = [
  { id: "q3-08", denNgay: "31/08/2026", nhan: "Lũy kế 01/01/2026 – 31/08/2026", thangKPI: "tháng 8/2026", hat: 2608 },
  { id: "q3-07", denNgay: "31/07/2026", nhan: "Lũy kế 01/01/2026 – 31/07/2026", thangKPI: "tháng 7/2026", hat: 2607 },
  { id: "q3-06", denNgay: "30/06/2026", nhan: "Lũy kế 01/01/2026 – 30/06/2026", thangKPI: "tháng 6/2026", hat: 2606 },
];

export const KY_QL3_MAC_DINH = KY_QL3[0].id;
export const KY_QL3_THEO_ID = Object.fromEntries(KY_QL3.map((k) => [k.id, k]));

function prng(hat: number) {
  let a = hat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hatCua = (hatKy: number, id: string) => {
  let h = hatKy;
  for (const k of id) h = (Math.imul(h, 31) + k.charCodeAt(0)) >>> 0;
  return h;
};

/** Một dòng của bảng — đúng 17 cột của sheet gốc, trừ cột tên đơn vị. */
export interface ODanhGiaQL3 {
  keHoach: number;
  daThucHien: number;
  daHoanThanh: number;
  kpiDangKy: number;
  chapNhan: number;
  choGiaiTrinh: number;
  dieuChinh: number;
  deNghiKiemTra: number;
  tangThu: number;
  giamKhauTru: number;
  giamLo: number;
  tienPhat: number;
  nopCham: number;
}

/*
  KPI là số đăng ký LŨY KẾ từ đầu năm, nên nó phải TĂNG theo tháng.

  Bản trước sinh nó từ hạt của kỳ: `keHoach * (0,1 + ngẫu nhiên)`. Mỗi kỳ một
  lần gieo, nên KPI tháng 8 có thể nhỏ hơn tháng 7 — và màn KPI đăng ký, nơi
  phép kiểm của M-Q3-02 ghi "không nhỏ hơn tháng trước", sẽ báo lỗi trên chính
  dữ liệu mẫu chưa ai đụng vào.

  Ở đây hạt KHÔNG mang tháng: mỗi đơn vị có một mức đăng ký hằng tháng ổn
  định, rồi nhân với số tháng lấy từ hai chữ số cuối của hạt kỳ (2606 → 6).
  Tăng đều theo tháng là đúng tính chất của một con số lũy kế.

  CHƯA SỬA, và cần người dùng quyết: `keHoach` và `daThucHien` vẫn gieo lại
  theo từng kỳ, nên "số DN trong kế hoạch NĂM" đổi giữa các kỳ lũy kế và "đã
  thực hiện" có thể đi lùi. Sửa đúng là viết lại cả bộ sinh của QL3, rộng hơn
  nhiều so với việc thêm một màn.
*/
function kpiLuyKe(hatKy: number, dv: DonViQL3, quyMo: number): number {
  const r = prng(hatCua(2600, `${dv.id}|kpi`));
  const nen = Math.round((180 + r() * 480) * quyMo);
  const moiThang = Math.max(1, Math.round(nen * (0.0125 + r() * 0.0325)));
  return moiThang * (hatKy % 100);
}

export function danhGiaQL3(hatKy: number, dv: DonViQL3): ODanhGiaQL3 {
  const r = prng(hatCua(hatKy, dv.id));
  const quyMo = dv.nhom === "VP" ? 1 : 1.6;
  const keHoach = Math.round((180 + r() * 480) * quyMo);
  const daThucHien = Math.round(keHoach * (0.18 + r() * 0.62));
  /*
    Đã hoàn thành KHÔNG tính hồ sơ chờ giải trình, nên nó luôn nhỏ hơn đã thực
    hiện — đúng định nghĩa cột trong file gốc. Sinh nó như một phần của đã
    thực hiện thay vì sinh độc lập, nếu không bảng sẽ có đơn vị hoàn thành
    nhiều hơn số đã làm.
  */
  const daHoanThanh = Math.round(daThucHien * (0.2 + r() * 0.6));
  const choGiaiTrinh = daThucHien - daHoanThanh;
  /* Bốn cột trạng thái cộng lại đúng bằng số đã thực hiện. */
  const dieuChinh = Math.round(daHoanThanh * (r() * 0.22));
  const deNghiKiemTra = Math.round(daHoanThanh * (r() * 0.18));
  const chapNhan = daHoanThanh - dieuChinh - deNghiKiemTra;
  const coDieuChinh = dieuChinh > 0;
  return {
    keHoach,
    daThucHien,
    daHoanThanh,
    kpiDangKy: kpiLuyKe(hatKy, dv, quyMo),
    chapNhan,
    choGiaiTrinh,
    dieuChinh,
    deNghiKiemTra,
    /* Không điều chỉnh thì không có số thu — để số dương ở đó là bảng tự mâu thuẫn. */
    tangThu: coDieuChinh ? Math.round(dieuChinh * (12_000_000 + r() * 90_000_000)) : 0,
    giamKhauTru: coDieuChinh && r() > 0.7 ? Math.round(dieuChinh * r() * 24_000_000) : 0,
    giamLo: coDieuChinh && r() > 0.5 ? Math.round(dieuChinh * r() * 160_000_000) : 0,
    tienPhat: coDieuChinh && r() > 0.6 ? Math.round(dieuChinh * r() * 9_000_000) : 0,
    nopCham: coDieuChinh && r() > 0.55 ? Math.round(dieuChinh * r() * 4_000_000) : 0,
  };
}

/** Cộng nhiều dòng thành một dòng tổng. Dòng khối và dòng toàn ngành đều dùng nó. */
export function congQL3(bo: ODanhGiaQL3[]): ODanhGiaQL3 {
  const ra = {} as Record<string, number>;
  for (const o of bo) for (const [k, v] of Object.entries(o)) ra[k] = (ra[k] ?? 0) + v;
  return ra as unknown as ODanhGiaQL3;
}

/*
  Bảng KTTB_CHI_TIẾT — dựng theo sheet `Data` của `1_QL3_4_TH (03092026).xls`.

  Đọc thẳng từ tệp thật: 6.158 dòng × 30 cột, tiêu đề nằm ở dòng 14 (dòng 1–7
  là măng sét báo cáo "BÁO CÁO CHI TIẾT KẾT QUẢ KIỂM TRA HỒ SƠ KHAI THUẾ TẠI
  CƠ QUAN THUẾ", mẫu 09/QTKT; dòng 8–13 là tiêu đề hai tầng đã gộp ô), dữ liệu
  bắt đầu ở dòng 15. Không dòng dữ liệu nào của tệp thật được đọc ra khỏi máy
  và không dòng nào vào bản mẫu — mục S5: mockup chỉ dùng dữ liệu giả.

  MỘT DÒNG = MỘT HỒ SƠ KHAI THUẾ × KỲ, không phải một doanh nghiệp. Đây là
  khác biệt quan trọng so với bản trước: cùng một MST có nhiều tờ khai, và
  bảng tổng hợp chỉ ĐẾM những tờ khai "được đếm" rồi gom theo MST (§4.1 bước
  2: Loại thuế = Thuế thu nhập doanh nghiệp và Kỳ kê khai = năm trước).

  Vì thế bộ sinh vẫn neo vào `danhGiaQL3`: mỗi doanh nghiệp được đếm phát ĐÚNG
  MỘT dòng TNDN của năm trước — đúng thực tế, vì một năm một tờ khai quyết
  toán — nên gom theo MST ra lại đúng con số của bảng tổng hợp. Các dòng còn
  lại (GTGT theo tháng, TNCN theo quý) là tờ khai thật của cùng doanh nghiệp
  nhưng KHÔNG được đếm, nên chúng không đụng tới ô nào của mẫu báo cáo.

  Hai cột CQT của sheet (cột 2 "CQT" lấy từ tên tệp và cột 5 "CQT quản lý" lấy
  từ kế hoạch) không còn là cột trên màn — chúng thành bộ lọc. Trong bản mẫu
  hai cột ấy luôn trùng nhau, nên giữ cả hai chỉ là hai cột giống hệt nhau
  chiếm chỗ của bảng vốn đã 27 cột.
*/

/** Kỳ kê khai được đếm vào báo cáo: TNDN của năm trước (§4.1 "Được đếm DN"). */
export const KY_KTTB_NAM = "Năm 2025";
export const LOAI_THUE_DEM = "Thuế thu nhập doanh nghiệp";

const LOAI_THUE_KHAC = ["Thuế giá trị gia tăng", "Thuế thu nhập cá nhân"];
const KY_KHAC = ["Tháng 06/2026", "Tháng 07/2026", "Quý 2/2026"];

export interface DongKTTB {
  id: string;
  /* CQT — nay là bộ lọc chứ không phải cột. */
  donViId: string;
  donVi: string;
  /* ── 27 cột còn lại của sheet, đúng thứ tự ── */
  tenNNT: string;
  mst: string;
  hoSoChuyenSang: number;
  keHoachDauNam: string;
  loaiThue: string;
  kyKeKhai: string;
  soQDPhat: string;
  ngayQuyetDinh: string;
  chapNhan: number;
  choGiaiTrinh: number;
  dieuChinh: number;
  anDinh: number;
  deNghiKiemTra: number;
  dieuChinhTang: number;
  dieuChinhGiam: number;
  anDinhTien: number;
  tangThu: number;
  giamKhauTru: number;
  tangKhauTru: number;
  giamLo: number;
  tangLo: number;
  mienGiamTang: number;
  mienGiamGiam: number;
  tienPhat: number;
  nopCham: number;
  trongKeHoach: number;
  ngoaiKeHoach: number;
}

/** §4.1 "Được đếm DN": chỉ tờ khai TNDN của năm trước mới vào báo cáo. */
export const duocDem = (d: DongKTTB) => d.loaiThue === LOAI_THUE_DEM && d.kyKeKhai === KY_KTTB_NAM;

/*
  Chia một tổng xuống `so` dòng sao cho cộng lại KHÔNG lệch một đồng.

  Cách dễ là mỗi dòng một số ngẫu nhiên rồi cộng lại — và tổng sẽ lệch với ô
  trên bảng tổng hợp. Ở đây mỗi dòng lấy một phần theo trọng số, dòng cuối
  nhận phần còn lại, nên sai số làm tròn không tích lũy.
*/
function chia(tong: number, so: number, r: () => number): number[] {
  if (so <= 0 || tong <= 0) return Array.from({ length: Math.max(0, so) }, () => 0);
  const trong = Array.from({ length: so }, () => 0.4 + r());
  const tongTrong = trong.reduce((a, b) => a + b, 0);
  const ra: number[] = [];
  let conLai = tong;
  for (let i = 0; i < so - 1; i++) {
    const phan = Math.round((tong * trong[i]) / tongTrong);
    ra.push(Math.min(phan, conLai));
    conLai -= ra[i];
    }
  ra.push(conLai);
  return ra;
}

const TRONG = ["chapNhan", "choGiaiTrinh", "dieuChinh", "deNghiKiemTra"] as const;

function dongTrong(r: () => number): Omit<DongKTTB,
  "id" | "donViId" | "donVi" | "tenNNT" | "mst" | "loaiThue" | "kyKeKhai" | "trongKeHoach" | "ngoaiKeHoach"> {
  return {
    /* Cột "Tổng số hồ sơ năm trước liền kề chuyển sang" của TTR: phần lớn
       dòng để trống, chỉ hồ sơ tồn mới có số. */
    hoSoChuyenSang: r() < 0.12 ? 1 : 0,
    /* TTR có cột "Kế hoạch đầu năm/tháng" nhưng §4.1 ghi rõ phòng KHÔNG dùng
       nó — họ dùng cột Tích 1 của file kế hoạch. Giữ cột cho đúng sheet, và
       để nó rỗng phần lớn dòng đúng như tệp thật. */
    keHoachDauNam: r() < 0.3 ? "X" : "",
    soQDPhat: "",
    ngayQuyetDinh: "",
    chapNhan: 0, choGiaiTrinh: 0, dieuChinh: 0, anDinh: 0, deNghiKiemTra: 0,
    dieuChinhTang: 0, dieuChinhGiam: 0, anDinhTien: 0,
    tangThu: 0, giamKhauTru: 0, tangKhauTru: 0, giamLo: 0, tangLo: 0,
    mienGiamTang: 0, mienGiamGiam: 0, tienPhat: 0, nopCham: 0,
  };
}

export function dsKTTBCuaDonVi(hatKy: number, dv: DonViQL3): DongKTTB[] {
  const o = danhGiaQL3(hatKy, dv);
  const r = prng(hatCua(hatKy, `${dv.id}|kttb`));
  const dong: DongKTTB[] = [];

  /*
    MỖI ĐƠN VỊ MỘT KHỐI MST RIÊNG.

    Trước đây hạt của MST chỉ gồm số thứ tự dòng và độ dài mã đơn vị, nên hai
    đơn vị khác nhau sinh ra gần như cùng một dãy MST. Đếm số dòng thì không
    lộ; nhưng mẫu báo cáo GOM THEO MST, và lúc gom thì 8.511 doanh nghiệp co
    lại còn 1.172. Chốt kiểm trong `acceptance.mjs` bắt đúng lỗi này.

    Khối 2.400 số cho mỗi đơn vị: đơn vị lớn nhất có khoảng 850 doanh nghiệp
    trong kế hoạch cộng chừng 250 ngoài kế hoạch, nên khối không tràn sang
    nhau; 30 đơn vị × 2.400 vẫn nằm trong dải 5 chữ số của `mstGia`.
  */
  const viTri = Math.max(0, DON_VI_QL3.findIndex((x) => x.id === dv.id));
  const goc = viTri * 2_400;

  const theoTrangThai: [(typeof TRONG)[number], number][] = [
    ["choGiaiTrinh", o.choGiaiTrinh],
    ["chapNhan", o.chapNhan],
    ["dieuChinh", o.dieuChinh],
    ["deNghiKiemTra", o.deNghiKiemTra],
  ];

  const tien = {
    tangThu: chia(o.tangThu, o.dieuChinh, r),
    giamKhauTru: chia(o.giamKhauTru, o.dieuChinh, r),
    giamLo: chia(o.giamLo, o.dieuChinh, r),
    tienPhat: chia(o.tienPhat, o.dieuChinh, r),
    nopCham: chia(o.nopCham, o.dieuChinh, r),
  };

  let soDieuChinh = 0;
  let i = 0;
  for (const [co, so] of theoTrangThai) {
    for (let k = 0; k < so; k++) {
      const mst = mstGia(goc + i);
      const tenNNT = tenNNTGia(goc + i);
      const nen = dongTrong(r);
      nen[co] = 1;
      if (co === "dieuChinh") {
        const j = soDieuChinh++;
        nen.tangThu = tien.tangThu[j];
        /* "Tổng số tiền thuế phải nộp điều chỉnh – Tăng" và "Tổng số thuế
           tăng thu" là hai cột khác nhau trên sheet, và §4.1 còn để ngỏ cột
           nào mới là nguồn của chỉ tiêu (13). Bản mẫu cho chúng bằng nhau và
           ghi lại điều chưa chốt ở đây, thay vì bịa ra một chênh lệch. */
        nen.dieuChinhTang = tien.tangThu[j];
        nen.giamKhauTru = tien.giamKhauTru[j];
        nen.giamLo = tien.giamLo[j];
        nen.tienPhat = tien.tienPhat[j];
        nen.nopCham = tien.nopCham[j];
        if (nen.tienPhat > 0) {
          nen.soQDPhat = `${1200 + (i % 700)}/QĐ-XPHC`;
          nen.ngayQuyetDinh = `${String(1 + (i % 28)).padStart(2, "0")}/0${1 + (i % 8)}/2026`;
        }
      }
      /* Dòng ĐƯỢC ĐẾM: TNDN của năm trước, một tờ khai quyết toán một năm. */
      dong.push({ id: `${dv.id}-${i}`, donViId: dv.id, donVi: dv.ten, tenNNT, mst, loaiThue: LOAI_THUE_DEM, kyKeKhai: KY_KTTB_NAM, trongKeHoach: 1, ngoaiKeHoach: 0, ...nen });

      /* Tờ khai khác của CÙNG doanh nghiệp: có thật trên sheet, nhưng không
         được đếm nên không đụng tới ô nào của mẫu báo cáo. */
      const them = r() < 0.45 ? 1 : 0;
      for (let t = 0; t < them; t++) {
        const phu = dongTrong(r);
        phu[TRONG[Math.floor(r() * TRONG.length)]] = 1;
        dong.push({
          id: `${dv.id}-${i}-p${t}`, donViId: dv.id, donVi: dv.ten, tenNNT, mst,
          loaiThue: LOAI_THUE_KHAC[Math.floor(r() * LOAI_THUE_KHAC.length)],
          kyKeKhai: KY_KHAC[Math.floor(r() * KY_KHAC.length)],
          trongKeHoach: 1, ngoaiKeHoach: 0, ...phu,
        });
      }
      i++;
    }
  }

  /* Doanh nghiệp NGOÀI kế hoạch: §1 có hẳn phần "Tổng kết quả chung" tính cả
     nhóm này, nhưng không ô nào của bảng "DN trong kế hoạch" đếm chúng — nên
     chúng phát rời, không rút từ tổng nào. */
  const soNgoai = Math.round(o.daThucHien * (0.08 + r() * 0.22));
  for (let k = 0; k < soNgoai; k++) {
    const nen = dongTrong(r);
    const co = TRONG[Math.floor(r() * TRONG.length)];
    nen[co] = 1;
    if (co === "dieuChinh") {
      nen.tangThu = Math.round(6_000_000 + r() * 70_000_000);
      nen.dieuChinhTang = nen.tangThu;
      nen.giamKhauTru = r() > 0.7 ? Math.round(r() * 20_000_000) : 0;
      nen.giamLo = r() > 0.6 ? Math.round(r() * 120_000_000) : 0;
    }
    dong.push({
      id: `${dv.id}-n${k}`, donViId: dv.id, donVi: dv.ten,
      mst: mstGia(goc + 1_800 + k),
      tenNNT: tenNNTGia(goc + 1_800 + k),
      loaiThue: r() < 0.6 ? LOAI_THUE_DEM : LOAI_THUE_KHAC[Math.floor(r() * LOAI_THUE_KHAC.length)],
      kyKeKhai: r() < 0.6 ? KY_KTTB_NAM : KY_KHAC[Math.floor(r() * KY_KHAC.length)],
      trongKeHoach: 0, ngoaiKeHoach: 1, ...nen,
    });
  }

  return dong;
}
