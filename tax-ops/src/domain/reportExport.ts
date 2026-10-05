import { danhSachQL1, donViCuaTab, tongHopCuaTab, type BoNo, type DonViQL1, type HangQL1, type KyQL1, type OTongHopNo, type OTongHopXuLy, type OTongHop06, type TabQL1 } from "@/data/ql1";
import { congQL3, danhGiaQL3, type DonViQL3, type KyQL3, type ODanhGiaQL3 } from "@/data/ql3";
import { NGUONG, ruleItems, trieu } from "@/data/thamSo";
import { NGUON_QL1 } from "@/data/nguonDuLieu";
import type { ReportStatus } from "@/domain/types";

export type ReportValue = string | number | null;
export interface ReportSheet { name: string; title: string; headers: string[]; rows: ReportValue[][]; percent?: number[]; bold?: number[]; unit?: string }
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
export function ql3Workbook(ky: KyQL3, units: DonViQL3[]): ReportSheet[] {
  const value = (o: ODanhGiaQL3): ReportValue[] => [o.keHoach, o.daThucHien, ratio(o.daThucHien, o.keHoach), o.daHoanThanh, ratio(o.daHoanThanh, o.keHoach), o.kpiDangKy, ratio(o.daHoanThanh, o.kpiDangKy), o.chapNhan, o.choGiaiTrinh, o.dieuChinh, o.deNghiKiemTra, o.tangThu, o.giamKhauTru, o.giamLo, o.tienPhat, o.nopCham];
  const rows: ReportValue[][] = [], bold: number[] = [];
  const append = (name: string, list: DonViQL3[], total: boolean) => { if (total) bold.push(rows.length); rows.push([name, ...value(congQL3(list.map(d => danhGiaQL3(ky.hat, d))))]); };
  if (units.length) append("Tổng cộng toàn ngành", units, true);
  for (const g of ["VP", "TCS"] as const) { const list = units.filter(d => d.nhom === g); if (list.length) append(g === "VP" ? "I. Khối Văn phòng" : "II. Khối Thuế cơ sở", list, true); list.forEach(d => append(d.ten, [d], false)); }
  return [{ name: "TH DN trong ke hoach nam", title: "TỔNG HỢP KẾT QUẢ KIỂM TRA TẠI TRỤ SỞ CQT", headers: ["Cơ quan Thuế thực hiện", `Số DN trong Kế hoạch năm ${ky.denNgay.slice(-4)} (theo NNT)`, "Số DN đã thực hiện (theo NNT)", "Tỷ lệ thực hiện (theo NNT)", "Số DN đã hoàn thành (ko tính hồ sơ chờ giải trình)", "Tỷ lệ hoàn thành/kế hoạch năm", `KPI tháng ${ky.thangKPI} theo các đơn vị tự đăng ký`, "Tỷ lệ hoàn thành/KPI đăng ký", "Số DN chấp nhận", "Số DN chờ giải trình", "Số DN điều chỉnh thuế", "Số DN đề nghị kiểm tra tại DN", "KQ điều chỉnh thuế: Tổng số thuế tăng thu", "KQ điều chỉnh thuế: Giảm khấu trừ", "KQ điều chỉnh thuế: Giảm lỗ", "KQ điều chỉnh thuế: Số tiền phạt", "KQ điều chỉnh thuế: Tiền nộp chậm"], rows, bold, percent: [3, 5, 7], unit: "Số tiền: đồng" }];
}
