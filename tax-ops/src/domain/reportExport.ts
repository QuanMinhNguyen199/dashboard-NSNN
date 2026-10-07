import { danhSachQL1, donViCuaTab, tongHopCuaTab, type BoNo, type DonViQL1, type HangQL1, type KyQL1, type OTongHopNo, type OTongHopXuLy, type OTongHop06, type TabQL1 } from "@/data/ql1";
import { congQL3, danhGiaQL3, type DonViQL3, type KyQL3, type ODanhGiaQL3 } from "@/data/ql3";
import { NGUONG, ruleItems, trieu } from "@/data/thamSo";
import { NGUON_QL1 } from "@/data/nguonDuLieu";
import {
  TRANG_THAI_KDT, bangQL4_01, canCapSo, chuaCapSo, dangXuLy, danhSachCuocGoi, danhSachPhieu,
  thoiGianTB, tongDen, tongDi, tongTiepNhan, tyLeNho, tyLeQuaHan, tyLeTuDong, type KyQL4,
} from "@/data/ql4";
import {
  I_DA_TRA, KHAC_QL2_01, TRANG_THAI_XM, bangHeSoK, bangQL2_01, bangXM, canRaSoat, chuaCoKetQua,
  daTraXM, tonCuoiK, tonXM, tongXM, type KyQL2,
} from "@/data/ql2";
import type { ReportStatus } from "@/domain/types";
import type { Cell, SheetData } from "write-excel-file/browser";
import type { DongKTTB } from "@/data/ql3";

export type ReportValue = string | number | null;
/*
  `khuon` là ĐƯỜNG THOÁT cho những sheet phải giống hệt bản gốc của phòng.

  Khuôn chung — tiêu đề, ba dòng siêu dữ liệu, một hàng đầu cột — đúng cho
  báo cáo do hệ thống sinh ra. Nhưng sheet `Data` của QL3 là bản kết xuất TTR
  mà phòng dùng hằng ngày: nó có măng sét cơ quan, dòng tổng nằm TRÊN tiêu
  đề, khối mô tả bộ lọc, rồi tiêu đề hai tầng có ô gộp. Người đối chiếu mở hai
  tệp cạnh nhau, nên khác một dòng là họ phải dò lại từ đầu.

  Khi `khuon` có mặt, `exportExcel` ghi thẳng nó và bỏ qua `headers`/`rows` —
  hai trường ấy vẫn giữ để bản Word và các chỗ đọc chung không phải phân nhánh.
*/
export interface ReportSheet { name: string; title: string; headers: string[]; rows: ReportValue[][]; percent?: number[]; bold?: number[]; unit?: string; khuon?: SheetData; rongCot?: number[]; dongDinh?: number }
export interface ReportMeta { period: string; scope: string; actor: string; status: ReportStatus }
export const statusLabel: Record<ReportStatus, string> = { DRAFT: "Nháp", REVIEWED: "Đã rà soát", APPROVED: "Đã duyệt", AMEND: "Đang điều chỉnh", BLOCKED: "Chưa đủ dữ liệu" };
const ratio = (a: number, b: number) => b ? a / b : null;
const round = (n: number) => Math.round(n * 10) / 10;

export function inReportList(tab: TabQL1, r: HangQL1) {
  if (tab === "no") return r.noNgay - r.noDauNam >= trieu(NGUONG.tangNoKNT);
  if (tab === "cc") return r.tinhTrang !== "Đã cưỡng chế";
  return r.tinhTrang !== "Đã tạm hoãn" && (tab !== "th" || r.tongDanhGia > r.nguong);
}
function sum<T extends object>(rows: T[]): T {
  const out: Record<string, unknown> = {};
  for (const r of rows) for (const [k, v] of Object.entries(r)) {
    if (typeof v === "number") out[k] = round(Number(out[k] ?? 0) + v);
    else if (v && typeof v === "object") out[k] = sum([out[k] ?? {}, v]);
  }
  return out as T;
}
function groups<T extends object>(units: DonViQL1[], get: (d: DonViQL1) => T, values: (o: T) => ReportValue[], stt: boolean) {
  const rows: ReportValue[][] = [];
  const bold: number[] = [];
  const append = (label: string, o: T, index: number | null, total: boolean) => {
    if (total) bold.push(rows.length);
    rows.push([...(stt ? [index] : []), label, ...values(o)]);
  };
  if (!units.length) return { rows, bold };
  append("Tổng cộng", sum(units.map(get)), null, true);
  for (const [g, label] of [["VP", "I. Khối Văn phòng Thuế TP Hà Nội"], ["TCS", "II. Khối Thuế cơ sở"]]) {
    const subset = units.filter(d => d.nhom === g);
    if (!subset.length) continue;
    append(label, sum(subset.map(get)), null, true);
    subset.forEach(d => append(d.ten, get(d), d.stt, false));
  }
  return { rows, bold };
}
const indicators: (keyof BoNo)[] = ["B", "C", "D", "E"];
const indicatorNames = ["Tổng cộng (B)", "Nợ KNT (C)", "Khó thu (D)", "Đang xử lý (E)"];
export function ql1Summary(ky: KyQL1, selected: string[], tab: TabQL1): ReportSheet {
  const units = donViCuaTab(tab).filter(d => !selected.length || selected.includes(d.ten));
  if (tab === "no") {
    const headers = ["STT", "Phòng/TCS", ...indicatorNames.map(n => `Nợ đến ${ky.ngayChot} – ${n}`)];
    const percent: number[] = [];
    for (const m of ["đầu năm", "tháng trước", "tuần trước"]) {
      headers.push(...indicatorNames.map(n => `Tăng giảm so với ${m} – Số tuyệt đối – ${n}`));
      percent.push(...[0, 1, 2, 3].map(i => headers.length + i));
      headers.push(...indicatorNames.map(n => `Tăng giảm so với ${m} – Số tương đối (%) – ${n}`));
    }
    return { name: "So_Sanh_No", title: "BÁO CÁO ĐÁNH GIÁ NỢ", headers, percent, unit: "Triệu đồng", ...groups(units, d => tongHopCuaTab.no(ky.hat, d), (o: OTongHopNo) => [
      ...indicators.map(k => o.cur[k]), ...(["dauNam", "thangTruoc", "tuanTruoc"] as const).flatMap(m => [
        ...indicators.map(k => round(o.cur[k] - o[m][k])), ...indicators.map(k => ratio(o.cur[k] - o[m][k], o[m][k])),
      ]),
    ], true) };
  }
  if (tab === "t06") return { name: "Bao_cao_tong_hop", title: "BÁO CÁO TẠM HOÃN XUẤT CẢNH TRẠNG THÁI 06", unit: "Số tiền: triệu đồng", headers: ["Phòng/Thuế cơ sở", "NNT trạng thái 06", "Tổng nợ không hoạt động tại địa chỉ đăng ký", "Số NNT đã tạm hoãn", "Số nợ đã tạm hoãn", "Tỷ lệ tạm hoãn về số tiền", "Số NNT chưa tạm hoãn", "Số tiền chưa tạm hoãn", "Tỷ lệ chưa tạm hoãn về số tiền"], percent: [5, 8], ...groups(units, d => tongHopCuaTab.t06(ky.hat, d), (o: OTongHop06) => [o.nnt06, o.tongNo, o.daN, o.daT, ratio(o.daT, o.tongNo), o.chuaN, o.chuaT, ratio(o.chuaT, o.tongNo)], false) };
  const name = tab === "cc" ? "cưỡng chế" : "tạm hoãn xuất cảnh";
  return { name: tab === "cc" ? "Danh gia Ket qua cuong che" : "Danh gia Tam hoan XC", title: `TỔNG HỢP ${name.toUpperCase()}`, unit: "Số tiền: triệu đồng", headers: ["Địa bàn", `Phải ${name} – NNT`, `Phải ${name} – Số tiền`, `Đã ${name} – NNT`, `Đã ${name} – Số tiền`, `Chưa ${name} – NNT`, `Chưa ${name} – Số tiền`, `Tỷ lệ đã ${name}`], percent: [7], ...groups(units, d => tongHopCuaTab[tab](ky.hat, d), (o: OTongHopXuLy) => [o.phaiN, o.phaiT, o.daN, o.daT, o.chuaN, o.chuaT, ratio(o.daT, o.phaiT)], false) };
}
export function ql1Details(tab: TabQL1, rows: HangQL1[]): ReportSheet {
  const names = { no: "DS_DN_TangnoTren500tr", cc: "DS NNT chua cuong che", th: "DS tren 500tr chua Hoan XC", t06: "DS_chua_tam_hoan" };
  let headers: string[];
  let values: (r: HangQL1, i: number) => ReportValue[];
  const money = (n: number) => Math.round(n * 1e6);
  if (tab === "no") {
    headers = ["STT", "MST", "Tên NNT", "Nợ KNT ngày báo cáo", "Nợ KNT đầu năm", "Tăng/giảm", "Phòng/TCS", "Mã CQT", "Loại NNT"];
    values = (r, i) => [i + 1, r.mst, r.ten, money(r.noNgay), money(r.noDauNam), money(round(r.noNgay - r.noDauNam)), r.donVi, r.maCQT, r.loaiNNT];
  } else if (tab === "t06") {
    headers = ["STT", "MST", "Tên NNT", "Cơ quan thuế", "Chương", "Tổng nợ KCHĐ theo MST", "Nhóm xử lý", "Tình trạng tạm hoãn", "Ngày tạm hoãn", "Map Phòng/Thuế cơ sở", "Loại NNT"];
    values = (r, i) => [i + 1, r.mst, r.ten, r.maCQT, r.chuong, money(r.noDanhGia), r.nhomXuLy, r.tinhTrang, r.ngayThucHien, r.donVi, r.loaiNNT];
  } else {
    const days = tab === "cc" ? NGUONG.cuongCheNgay : NGUONG.thxcNgay;
    headers = ["STT", "MST", "Tên NNT", "CQT", "Phòng/TCS", "Loại NNT", "Chương", `Nợ >${days} ngày - Nợ tháng`, `Nợ >${days} ngày - Nợ ngày`, "Nợ dùng đánh giá tại đơn vị", "Tổng nợ dùng đánh giá MST+CQT", tab === "cc" ? "Ngưỡng" : "Ngưỡng theo loại NNT", ...(tab === "cc" ? ["Tình trạng cưỡng chế", "Biện pháp hiệu lực", "Số quyết định hiệu lực"] : ["Tình trạng tạm hoãn", "Ngày tạm hoãn"]), "Kết luận", "Ghi chú"];
    values = (r, i) => [i + 1, r.mst, r.ten, r.maCQT, r.donVi, r.loaiNNT, r.chuong, money(r.noThang), money(r.noNgay), money(r.noDanhGia), money(r.tongDanhGia), money(r.nguong), r.tinhTrang, ...(tab === "cc" ? [r.bienPhap, r.soQuyetDinh] : [r.ngayThucHien]), r.ketLuan, r.ghiChu];
  }
  return { name: names[tab], title: names[tab].replace(/_/g, " "), headers, rows: rows.map(values), unit: "Đồng" };
}
export function ql1Workbook(ky: KyQL1, units: string[]): ReportSheet[] {
  const summaries = (["no", "cc", "th", "t06"] as const).map(tab => ql1Summary(ky, units, tab));
  const details = (["no", "cc", "th", "t06"] as const).map(tab => ql1Details(tab, danhSachQL1(ky.hat, tab).filter(r => (!units.length || units.includes(r.donVi)) && inReportList(tab, r))));
  const rules: ReportSheet = { name: "QuyTac_Nguon", title: "QUY TẮC VÀ NGUỒN", headers: ["Nội dung", "Giá trị/Nguyên tắc"], rows: [
    ["Ngày báo cáo", ky.ngayChot], ["Phạm vi", units.join("; ") || "Toàn ngành"],
    ...NGUON_QL1.map(n => [n.ten, `${n.heThong}; ngày chốt ${n.ngayChot}`]),
    ...ruleItems.filter(r => r.scope === "Nợ và cưỡng chế").map(r => [r.name, `${r.value}; hiệu lực: ${r.effectiveFrom ?? "chưa xác nhận"}`]),
  ] };
  return [summaries[0], details[0], summaries[1], summaries[2], details[1], details[2], rules, summaries[3], details[3]];
}
/* ── QL2 ─────────────────────────────────────────────────────────────────

  Mỗi BÁO CÁO một bộ sheet, không phải mỗi phân hệ một bộ. Xuất "cả bộ của
  QL2" là xuất sáu báo cáo khác kỳ vào một tệp — người nhận không có cách nào
  biết cột nào thuộc kỳ nào.

  Sheet giữ ĐÚNG thứ tự cột và tên cột của mẫu (G4, G7); thứ tự dòng theo khung
  đơn vị chuẩn chứ không theo chữ cái (G16).
*/
const dongQL2 = <T extends { dv: { ten: string; ma: string; nhom: string; stt: number } }>(
  rows: T[], gia: (r: T) => ReportValue[], congGia: (rows: T[]) => ReportValue[],
) => {
  const out: ReportValue[][] = [];
  const bold: number[] = [];
  const them = (nhan: string, ma: ReportValue, v: ReportValue[], dam: boolean) => {
    if (dam) bold.push(out.length);
    out.push([out.length + 1, ma, nhan, ...v]);
  };
  if (!rows.length) return { rows: out, bold };
  them("A. Tổng cộng", "—", congGia(rows), true);
  for (const [g, nhan] of [["VP", "I. Khối Văn phòng Thuế TP Hà Nội"], ["TCS", "II. Khối Thuế cơ sở"]]) {
    const phan = rows.filter((r) => r.dv.nhom === g);
    if (!phan.length) continue;
    them(nhan, "—", congGia(phan), true);
    for (const r of phan) them(r.dv.ten, r.dv.ma, gia(r), false);
  }
  return { rows: out, bold };
};

export function ql2Workbook(baoCao: string, ky: KyQL2, donVi: string[]): ReportSheet[] {
  const loc = <T extends { dv: { ten: string } }>(rows: T[]) => rows.filter((r) => !donVi.length || donVi.includes(r.dv.ten));

  if (baoCao === "QL2-01") {
    return (["01", "0304"] as const).map((loaiTK) => {
      const rows = loc(bangQL2_01(ky.hat, loaiTK));
      const raThue = loaiTK === "01" ? "Số thuế khai thiếu" : "Chênh lệch doanh thu";
      const vaoThue = loaiTK === "01" ? "Số thuế khai thừa" : "Số thuế thiếu";
      const gia = (r: typeof rows[number]): ReportValue[] => [
        loaiTK === "01" ? "01/GTGT" : "03, 04/GTGT",
        r.ra.dauNam_NNT, r.ra.dauNam_Thue, r.vao.dauNam_NNT, r.vao.dauNam_Thue,
        r.ra.ungDung_NNT, r.ra.ungDung_Thue, r.vao.ungDung_NNT, r.vao.ungDung_Thue, r.khongNopTK,
        canRaSoat(r.ra).nnt, canRaSoat(r.ra).thue, canRaSoat(r.vao).nnt, canRaSoat(r.vao).thue, r.khongNopTK,
        r.ra.dieuChinh_NNT, r.ra.dieuChinh_Thue, r.vao.dieuChinh_NNT, r.vao.dieuChinh_Thue,
        ...KHAC_QL2_01.map((_, i) => r.ra.khac[i] + r.vao.khac[i]),
        chuaCoKetQua(r.ra).nnt, chuaCoKetQua(r.ra).thue, chuaCoKetQua(r.vao).nnt, chuaCoKetQua(r.vao).thue,
        "",
      ];
      const congGia = (ds: typeof rows): ReportValue[] => {
        const so = ds.map(gia).map((v) => v.slice(1, -1) as number[]);
        const cong = so.reduce((t, v) => t.map((x, i) => Math.round((x + v[i]) * 10) / 10), so[0]?.map(() => 0) ?? []);
        return [loaiTK === "01" ? "01/GTGT" : "03, 04/GTGT", ...cong, ""];
      };
      const { rows: r2, bold } = dongQL2(rows, gia, congGia);
      return {
        name: loaiTK === "01" ? "Tong hop 01GTGT" : "Tong hop 03,04GTGT",
        title: "BÁO CÁO KẾT QUẢ THỰC HIỆN ĐỐI CHIẾU DỮ LIỆU TỜ KHAI THUẾ GTGT VÀ HÓA ĐƠN ĐIỆN TỬ",
        unit: "Đơn vị tiền: triệu đồng",
        headers: [
          /* Thứ tự theo MẪU: STT · Mã · Tên · Loại. Màn hình đưa Tên lên đầu
             để nó làm cột dính khi cuộn ngang, nhưng tệp xuất ra phải mở được
             cạnh file của phòng mà không phải đổi chỗ cột nào. */
          "STT", "Mã cơ quan thuế", "Tên cơ quan thuế", "Loại tờ khai",
          "Số đầu năm – Số NNT khai thiếu", `Số đầu năm – ${raThue}`, "Số đầu năm – Số NNT khai thừa", `Số đầu năm – ${vaoThue}`,
          "Ứng dụng – Số NNT khai thiếu", `Ứng dụng – ${raThue}`, "Ứng dụng – Số NNT khai thừa", `Ứng dụng – ${vaoThue}`, "Ứng dụng – Không nộp tờ khai",
          "Cần rà soát – Số NNT khai thiếu", `Cần rà soát – ${raThue}`, "Cần rà soát – Số NNT khai thừa", `Cần rà soát – ${vaoThue}`, "Cần rà soát – Không nộp tờ khai",
          "Kết quả xử lý – Điều chỉnh tăng số NNT", "Kết quả xử lý – Điều chỉnh tăng số thuế",
          "Kết quả xử lý – Điều chỉnh giảm số NNT", "Kết quả xử lý – Điều chỉnh giảm số thuế",
          ...KHAC_QL2_01.map((k) => `Kết quả xử lý – ${k.nhan}`),
          "Chưa có kết quả – Số NNT khai thiếu", `Chưa có kết quả – ${raThue}`,
          "Chưa có kết quả – Số NNT khai thừa", `Chưa có kết quả – ${vaoThue}`,
          "Ghi chú",
        ],
        rows: r2,
        bold,
      };
    });
  }

  if (baoCao === "QL2-02") {
    const rows = loc(bangHeSoK(ky.hat));
    const gia = (r: typeof rows[number]): ReportValue[] => {
      const mau = r.tonDau + r.phatSinh;
      return [r.tonDau, r.phatSinh, r.daXuLy, tonCuoiK(r), ratio(r.daXuLy, mau), mau ? 1 - r.daXuLy / mau : null];
    };
    const congGia = (ds: typeof rows): ReportValue[] => {
      const tonDau = ds.reduce((t, r) => t + r.tonDau, 0);
      const phatSinh = ds.reduce((t, r) => t + r.phatSinh, 0);
      const daXuLy = ds.reduce((t, r) => t + r.daXuLy, 0);
      const mau = tonDau + phatSinh;
      return [tonDau, phatSinh, daXuLy, tonDau + phatSinh - daXuLy, ratio(daXuLy, mau), mau ? 1 - daXuLy / mau : null];
    };
    const { rows: r2, bold } = dongQL2(rows, gia, congGia);
    return [{
      name: "He so K",
      title: `BÁO CÁO CẢNH BÁO HỆ SỐ K – ${ky.nhan.toUpperCase()}`,
      headers: [
        "STT", "Mã cơ quan thuế", "Tên cơ quan thuế",
        `Số lượt cảnh báo tồn đầu kỳ`, "Số lượt cảnh báo phát sinh trong kỳ",
        "Số lượt cảnh báo đã xử lý trong kỳ", `Số lượt cảnh báo tồn cuối kỳ (Số liệu ngày ${ky.ngayChot})`,
        "Tỉ lệ đã xử lý trong kỳ", "Tỷ lệ chưa xử lý trong kỳ",
      ],
      rows: r2,
      bold,
      percent: [7, 8],
    }];
  }

  const rows = loc(bangXM(ky.hat));
  const gia = (r: typeof rows[number]): ReportValue[] => [
    tongXM(r), daTraXM(r), tonXM(r), Math.max(0, tonXM(r) - r.quaHan), r.quaHan,
    ...TRANG_THAI_XM.map((_, i) => r.theoTrangThai[i]),
    ratio(daTraXM(r), tongXM(r)),
  ];
  const congGia = (ds: typeof rows): ReportValue[] => {
    const theo = TRANG_THAI_XM.map((_, i) => ds.reduce((t, r) => t + r.theoTrangThai[i], 0));
    const tong = theo.reduce((t, x) => t + x, 0);
    const daTra = theo[I_DA_TRA];
    const quaHan = ds.reduce((t, r) => t + r.quaHan, 0);
    return [tong, daTra, tong - daTra, Math.max(0, tong - daTra - quaHan), quaHan, ...theo, ratio(daTra, tong)];
  };
  const { rows: r2, bold } = dongQL2(rows, gia, congGia);
  return [{
    name: "Xac minh hoa don",
    title: `TỔNG HỢP XÁC MINH HÓA ĐƠN – ${ky.nhan.toUpperCase()}`,
    headers: [
      "STT", "Mã cơ quan thuế", "Tên cơ quan thuế",
      "Tổng", "Đã trả kết quả", "Tồn", "Tồn trong hạn", "Tồn quá hạn",
      ...TRANG_THAI_XM.map((t) => `Trạng thái ${t.ma} – ${t.nhan}`),
      "Tỷ lệ hoàn thành",
    ],
    rows: r2,
    bold,
    percent: [8 + TRANG_THAI_XM.length + 1],
  }];
}

/* ── QL4 ───────────────────────────────────────────────────────────────

  QL4-01 xuất MỘT sheet giữ nguyên 30 cột và cách đánh số của mẫu, kể cả chỗ
  mẫu đánh trùng 8, 9, 10 (Q-88): tệp này để mở cạnh file của phòng, nên nó
  phải khớp từng cột chứ không phải đúng theo cách màn hình sắp lại.

  QL4-02 xuất ba sheet đúng ba sheet của file hiện tại (Q-93 chưa trả lời về
  bản gửi lãnh đạo, nên tạm giữ đúng cấu trúc đang dùng).
*/
export function ql4Workbook(baoCao: string, ky: KyQL4, donVi: string[]): ReportSheet[] {
  if (baoCao === "QL4-01") {
    const rows = bangQL4_01(ky.hat).filter((r) => !donVi.length || donVi.includes(r.dv.ten));
    const gia = (h: typeof rows[number]): ReportValue[] => [
      tongTiepNhan(h), h.tuDongCoRaSoat, h.tuDong, h.thuCong,
      dangXuLy(h), h.dangXuLyTrongHan, h.dangXuLyQuaHan,
      ...h.kdtThuCong, ...h.kdtTuDong,
      canCapSo(h), h.daCapSo, chuaCapSo(h),
      tyLeQuaHan(h), tyLeTuDong(h), h.hoSoVenh,
    ];
    const out: ReportValue[][] = [];
    const bold: number[] = [];
    const cong = (ds: typeof rows): ReportValue[] => {
      const so = ds.map(gia);
      return so[0]?.map((_, i) => {
        /* Hai cột tỷ lệ KHÔNG cộng được — cộng phần trăm của 31 đơn vị ra một
           số vô nghĩa. Chúng tính lại từ tử số và mẫu số của cả nhóm. */
        if (i === 22) { const m = ds.reduce((t, h) => t + dangXuLy(h), 0); return m ? ds.reduce((t, h) => t + h.dangXuLyQuaHan, 0) / m : null; }
        if (i === 23) { const m = ds.reduce((t, h) => t + tongTiepNhan(h), 0); return m ? ds.reduce((t, h) => t + h.tuDongCoRaSoat + h.tuDong, 0) / m : null; }
        return ds.reduce((t, h) => t + Number(gia(h)[i] ?? 0), 0);
      }) ?? [];
    };
    const them = (nhan: string, ma: ReportValue, v: ReportValue[], dam: boolean) => {
      if (dam) bold.push(out.length);
      out.push([nhan, ma, ...v]);
    };
    them("Tổng địa bàn Hà Nội", "—", cong(rows), true);
    for (const [g, nhan] of [["VP", "Khối Văn phòng Thuế TP Hà Nội"], ["TCS", "Khối Thuế cơ sở"]]) {
      const phan = rows.filter((r) => r.dv.nhom === g);
      if (!phan.length) continue;
      them(nhan, "—", cong(phan), true);
      for (const r of phan) them(r.dv.ten, r.dv.ma, gia(r), false);
    }
    return [{
      name: "BAOCAOTUANCHUAN",
      title: `TIẾN ĐỘ GIẢI QUYẾT HỒ SƠ HOÀN THUẾ THU NHẬP CÁ NHÂN NĂM ${ky.ngayChot.slice(6)}`,
      unit: ky.nhan,
      headers: [
        "Tên cơ quan thuế", "Mã cơ quan thuế",
        "Tổng số hồ sơ tiếp nhận – Cộng", "Tổng số hồ sơ tiếp nhận – Tự động có rà soát", "Tổng số hồ sơ tiếp nhận – Tự động",
        "Tổng số hồ sơ giải quyết – Thủ công",
        "Đang xử lý – Cộng", "Đang xử lý – Trong hạn", "Đang xử lý – Quá hạn",
        ...TRANG_THAI_KDT.map((t) => `Thủ công – ${t}`),
        ...TRANG_THAI_KDT.map((t) => `Tự động – ${t}`),
        "Tổng hồ sơ cần cấp số", "Đã cấp số", "Chưa cấp số",
        "Tỷ lệ hồ sơ quá hạn", "Tỷ lệ hồ sơ tiếp nhận và xử lý tự động",
        "Hồ sơ vênh 1.5.1 – 6.29.1",
      ],
      rows: out,
      bold,
      percent: [22 + 2, 23 + 2],
    }];
  }

  const goi = danhSachCuocGoi(ky.hat);
  const phieu = danhSachPhieu(ky.hat);
  const donViPhieu = [...new Set(phieu.map((p) => p.donVi))];
  return [
    {
      name: "BAO CAO CUOC GOI",
      title: `BÁO CÁO SẢN LƯỢNG THEO NHÂN VIÊN – ${ky.nhan.toUpperCase()}`,
      headers: ["STT", "Nhân viên", "Tên đơn vị", "Gọi đi – Trả lời", "Gọi đi – Không trả lời", "Gọi đi – Tổng", "Gọi đi – Thời gian (giây)", "Gọi đến – Trả lời", "Gọi đến – Không trả lời", "Gọi đến – Tổng", "Gọi đến – Thời gian (giây)", "Tỉ lệ nhỡ (%)", "Thời gian gọi trung bình (giây)", "Gọi nội bộ"],
      rows: goi.map((h, i) => [
        i + 1, h.nhanVien, h.donVi,
        h.diTraLoi, h.diKhongTraLoi, tongDi(h), h.diThoiGian,
        h.denTraLoi, h.denKhongTraLoi, tongDen(h), h.denThoiGian,
        tyLeNho(h), thoiGianTB(h), h.noiBo,
      ]),
      percent: [11],
    },
    {
      name: "Sheet3",
      title: "PHIẾU GHI THEO ĐƠN VỊ",
      headers: ["Đơn vị", "Đang xử lý – Trong hạn", "Đang xử lý – Hết hạn", "Hoàn thành", "Grand Total"],
      rows: donViPhieu.map((d) => [
        d,
        phieu.filter((p) => p.donVi === d && p.trangThai === "Đang xử lý" && !p.hetHan).length,
        phieu.filter((p) => p.donVi === d && p.trangThai === "Đang xử lý" && p.hetHan).length,
        phieu.filter((p) => p.donVi === d && p.trangThai === "Hoàn thành").length,
        phieu.filter((p) => p.donVi === d).length,
      ]),
    },
    {
      name: "Sai han",
      title: "PHIẾU CÓ HẠN XỬ LÝ KHÔNG ĐÚNG QUY TRÌNH",
      headers: ["Đơn vị", "Count of Hạn xử lý không đúng quy trình"],
      rows: donViPhieu
        .map((d) => [d, phieu.filter((p) => p.donVi === d && p.saiHan).length] as ReportValue[])
        .filter((r) => Number(r[1]) > 0),
    },
  ];
}

/*
  `kpi` là số ĐÃ ĐĂNG KÝ trên hệ thống, truyền từ màn vào.

  Không có nó thì bản xuất lấy số sinh sẵn, còn màn hình lấy số người dùng vừa
  nhập — hai con số cho cùng một ô (7), và ô (8) chia cho hai mẫu số khác
  nhau. Người mở tệp cạnh màn sẽ thấy lệch mà không hiểu vì sao.
*/
export function ql3Workbook(ky: KyQL3, units: DonViQL3[], kpi?: (dvId: string) => number | null): ReportSheet[] {
  const o1 = (d: DonViQL3): ODanhGiaQL3 => {
    const o = danhGiaQL3(ky.hat, d);
    const dk = kpi?.(d.id);
    return dk === undefined || dk === null ? o : { ...o, kpiDangKy: dk };
  };
  const value = (o: ODanhGiaQL3): ReportValue[] => [o.keHoach, o.daThucHien, ratio(o.daThucHien, o.keHoach), o.daHoanThanh, ratio(o.daHoanThanh, o.keHoach), o.kpiDangKy, ratio(o.daHoanThanh, o.kpiDangKy), o.chapNhan, o.choGiaiTrinh, o.dieuChinh, o.deNghiKiemTra, o.tangThu, o.giamKhauTru, o.giamLo, o.tienPhat, o.nopCham];
  const rows: ReportValue[][] = [], bold: number[] = [];
  const append = (name: string, list: DonViQL3[], total: boolean) => { if (total) bold.push(rows.length); rows.push([name, ...value(congQL3(list.map(o1)))]); };
  if (units.length) append("Tổng cộng toàn ngành", units, true);
  for (const g of ["VP", "TCS"] as const) { const list = units.filter(d => d.nhom === g); if (list.length) append(g === "VP" ? "I. Khối Văn phòng" : "II. Khối Thuế cơ sở", list, true); list.forEach(d => append(d.ten, [d], false)); }
  return [{ name: "TH DN trong ke hoach nam", title: "TỔNG HỢP KẾT QUẢ KIỂM TRA TẠI TRỤ SỞ CQT", headers: ["Cơ quan Thuế thực hiện", `Số DN trong Kế hoạch năm ${ky.denNgay.slice(-4)} (theo NNT)`, "Số DN đã thực hiện (theo NNT)", "Tỷ lệ thực hiện (theo NNT)", "Số DN đã hoàn thành (ko tính hồ sơ chờ giải trình)", "Tỷ lệ hoàn thành/kế hoạch năm", `KPI tháng ${ky.thangKPI} theo các đơn vị tự đăng ký`, "Tỷ lệ hoàn thành/KPI đăng ký", "Số DN chấp nhận", "Số DN chờ giải trình", "Số DN điều chỉnh thuế", "Số DN đề nghị kiểm tra tại DN", "KQ điều chỉnh thuế: Tổng số thuế tăng thu", "KQ điều chỉnh thuế: Giảm khấu trừ", "KQ điều chỉnh thuế: Giảm lỗ", "KQ điều chỉnh thuế: Số tiền phạt", "KQ điều chỉnh thuế: Tiền nộp chậm"], rows, bold, percent: [3, 5, 7], unit: "Số tiền: đồng" }];
}

/* ── Sheet `Data` của QL3, dựng theo đúng bản kết xuất TTR của phòng ──────── */

/*
  Khuôn lấy từ chính tệp `1_QL3_4_TH (03092026).xls`, sheet `Data`:

    dòng 1   Thuế Thành phố Hà Nội … (cột Q) Mẫu số 09/QTKT
    dòng 2   tên cơ quan thuế của bản kết xuất
    dòng 3   trống
    dòng 4   DÒNG TỔNG — đếm với cột chữ, cộng với cột số
    dòng 5   BÁO CÁO CHI TIẾT KẾT QUẢ KIỂM TRA HỒ SƠ KHAI THUẾ TẠI CƠ QUAN THUẾ
    dòng 6   Loại hồ sơ khai thuế: [Tất cả]
    dòng 7   Từ tháng … đến tháng …
    dòng 8–9 tiêu đề hai tầng, ô gộp ở hai nhóm "điều chỉnh tăng/giảm" và
             "miễn giảm tăng/giảm"
    dòng 10+ dữ liệu

  Dòng tổng nằm TRÊN tiêu đề — đọc thì ngược, nhưng tệp gốc để vậy và người
  đối chiếu mở hai tệp cạnh nhau. Khác một dòng là họ phải dò lại từ đầu, nên
  thứ tự giữ nguyên.

  MỘT DÒNG THÊM so với bản gốc: dòng mô phỏng. PRODUCT.md buộc mọi số của bản
  demo mang nhãn mô phỏng, và một tệp giống hệt bản kết xuất thật mà không nói
  nó là dữ liệu giả thì đúng là thứ sẽ bị dùng nhầm làm báo cáo. Nó đứng ngay
  dưới khối mô tả bộ lọc, nơi người đọc còn chưa bước vào bảng số.
*/

/** 30 cột của sheet, đúng thứ tự. `nhom` gộp hai cột dưới một ô tầng trên. */
const COT_KTTB: { nhan: string; nhom?: string; rong: number; so?: boolean; dem?: boolean }[] = [
  { nhan: "STT", rong: 6 },
  { nhan: "Cơ quan quản lý thuế (Phòng/Thuế cơ sở thực hiện)", rong: 34, dem: true },
  { nhan: "Tên NNT", rong: 32, dem: true },
  { nhan: "MST", rong: 14, dem: true },
  { nhan: "Cơ quan quản lý thuế (Phòng/Thuế cơ sở thực hiện)", rong: 34, dem: true },
  { nhan: "Tổng số hồ sơ năm trước liền kề chuyển sang", rong: 16, dem: true },
  { nhan: "Kế hoạch đầu năm/tháng", rong: 13, dem: true },
  { nhan: "Loại thuế", rong: 26, dem: true },
  { nhan: "Kỳ kê khai", rong: 13, dem: true },
  { nhan: "Số QĐ phạt", rong: 14, dem: true },
  { nhan: "Ngày quyết định", rong: 13, dem: true },
  { nhan: "Hồ sơ chấp nhận", rong: 12, so: true },
  { nhan: "Hồ sơ chờ giải trình", rong: 12, so: true },
  { nhan: "Hồ sơ điều chỉnh", rong: 12, so: true },
  { nhan: "Hồ sơ ấn định", rong: 11, so: true },
  { nhan: "Hồ sơ đề nghị kiểm tra tại DN", rong: 14, so: true },
  { nhan: "Tăng", nhom: "Tổng số tiền thuế phải nộp điều chỉnh tăng, giảm", rong: 18, so: true },
  { nhan: "Giảm", nhom: "Tổng số tiền thuế phải nộp điều chỉnh tăng, giảm", rong: 18, so: true },
  { nhan: "Ấn định", rong: 14, so: true },
  { nhan: "Tổng số thuế tăng thu", rong: 18, so: true },
  { nhan: "Giảm khấu trừ", rong: 16, so: true },
  { nhan: "Tăng khấu trừ", rong: 16, so: true },
  { nhan: "Giảm lỗ", rong: 16, so: true },
  { nhan: "Tăng lỗ", rong: 16, so: true },
  { nhan: "Tăng", nhom: "Số tiền thuế được miễn giảm", rong: 15, so: true },
  { nhan: "Giảm", nhom: "Số tiền thuế được miễn giảm", rong: 15, so: true },
  { nhan: "Số tiền phạt", rong: 15, so: true },
  { nhan: "Tiền nộp chậm", rong: 15, so: true },
  { nhan: "Có trong kế hoạch năm theo QĐ phê duyệt lần đầu (Tích 1)", rong: 18, so: true },
  { nhan: "Ngoài kế hoạch năm", rong: 14, so: true },
];

const SO_COT = COT_KTTB.length;
const TRONG = (tu: number) => Array.from({ length: SO_COT - tu }, () => null);

/** Giá trị của một dòng dữ liệu, đúng thứ tự 30 cột. */
function oKTTB(d: DongKTTB, stt: number): (string | number)[] {
  return [
    stt, d.donVi, d.tenNNT, d.mst, d.donVi,
    d.hoSoChuyenSang, d.keHoachDauNam, d.loaiThue, d.kyKeKhai, d.soQDPhat, d.ngayQuyetDinh,
    d.chapNhan, d.choGiaiTrinh, d.dieuChinh, d.anDinh, d.deNghiKiemTra,
    d.dieuChinhTang, d.dieuChinhGiam, d.anDinhTien, d.tangThu,
    d.giamKhauTru, d.tangKhauTru, d.giamLo, d.tangLo,
    d.mienGiamTang, d.mienGiamGiam, d.tienPhat, d.nopCham,
    d.trongKeHoach, d.ngoaiKeHoach,
  ];
}

export function sheetKTTB(dong: DongKTTB[], meta: ReportMeta, ky: KyQL3): ReportSheet {
  const vien = { borderColor: "#9A9A9A", borderStyle: "thin" } as const;
  const dauCot = { fontWeight: "bold", backgroundColor: "#E4DEDC", align: "center", alignVertical: "center", wrap: true, ...vien } as const;

  /*
    Dòng tổng của tệp gốc ĐẾM với cột chữ và CỘNG với cột số — cột "Tên NNT"
    hiện 6.144 vì đó là số dòng, không phải một phép cộng vô nghĩa. Giữ đúng
    cách ấy, nếu không người đối chiếu thấy ô trống ở nơi tệp của họ có số.
  */
  const tong: (number | null)[] = COT_KTTB.map((c, i) => {
    if (c.dem) return dong.length;
    if (c.so) return dong.reduce((t, d) => t + Number(oKTTB(d, 0)[i] || 0), 0);
    return null;
  });

  const nhomTren: (Cell | null)[] = [];
  const tangGiam: (Cell | null)[] = [];
  for (let i = 0; i < SO_COT; i++) {
    const c = COT_KTTB[i];
    if (!c.nhom) {
      /* Cột không thuộc nhóm nào trải xuống cả hai tầng — ô gộp dọc, đúng như
         tệp gốc, để tầng dưới không có một ô trống câm dưới mỗi tên cột. */
      nhomTren.push({ value: c.nhan, rowSpan: 2, ...dauCot });
      tangGiam.push(null);
      continue;
    }
    const moNhom = i === 0 || COT_KTTB[i - 1].nhom !== c.nhom;
    nhomTren.push(moNhom ? { value: c.nhom, columnSpan: 2, ...dauCot } : null);
    tangGiam.push({ value: c.nhan, ...dauCot });
  }

  const khuon: SheetData = [
    [{ value: "Thuế Thành phố Hà Nội", fontWeight: "bold" }, ...TRONG(1).slice(0, 15), { value: "Mẫu số 09/QTKT", align: "right" }, ...TRONG(17)],
    [{ value: meta.scope.toUpperCase() }, ...TRONG(1)],
    [],
    tong.map((v, i): Cell | null => v === null
      ? null
      : { value: v, type: Number, format: "#,##0.########", fontWeight: "bold", backgroundColor: "#F2F2F2", ...(i === 0 ? {} : {}) }),
    [{ value: "BÁO CÁO CHI TIẾT KẾT QUẢ KIỂM TRA HỒ SƠ KHAI THUẾ TẠI CƠ QUAN THUẾ", columnSpan: 26, align: "center", fontWeight: "bold", fontSize: 13, height: 24 }, ...TRONG(26)],
    [{ value: "Loại hồ sơ khai thuế: [Tất cả]", columnSpan: 26 }, ...TRONG(26)],
    [{ value: `Lũy kế từ 01/01 đến ${ky.denNgay}`, columnSpan: 26 }, ...TRONG(26)],
    [{ value: `DỮ LIỆU MÔ PHỎNG – không dùng làm báo cáo chính thức · Phạm vi: ${meta.scope} · Trạng thái: ${statusLabel[meta.status]} · Người xuất: ${meta.actor}`, columnSpan: 26, textColor: "#7A5A12", backgroundColor: "#FDF5DD", wrap: true, height: 26 }, ...TRONG(26)],
    nhomTren,
    tangGiam,
  ];

  for (let i = 0; i < dong.length; i++) {
    khuon.push(oKTTB(dong[i], i + 1).map((v, ci): Cell => typeof v === "number"
      ? { value: v, type: Number, format: "#,##0.########", align: "right", ...vien }
      /* MST giữ KIỂU CHỮ: để Excel tự nhận là số thì "0100000001" rụng mất số
         0 đầu, và cột mã số thuế hỏng ngay ở ô đầu tiên. */
      : { value: v, type: String, wrap: ci === 1 || ci === 2 || ci === 4, ...vien }));
  }

  return {
    name: "Data",
    title: "BÁO CÁO CHI TIẾT KẾT QUẢ KIỂM TRA HỒ SƠ KHAI THUẾ TẠI CƠ QUAN THUẾ",
    unit: "Đồng",
    headers: COT_KTTB.map((c) => (c.nhom ? `${c.nhom} – ${c.nhan}` : c.nhan)),
    rows: dong.map((d, i) => oKTTB(d, i + 1)),
    khuon,
    rongCot: COT_KTTB.map((c) => c.rong),
    /* Dính tới hết hai tầng tiêu đề: cuộn xuống dòng 3.000 vẫn phải biết cột
       nào là "Giảm lỗ" và cột nào là "Tăng lỗ". */
    dongDinh: 10,
  };
}
