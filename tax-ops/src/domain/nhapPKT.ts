import { ngayTuO, type GiaTriO, type SheetDoc } from "@/domain/docXlsx";

/*
  Luật kiểm tra tệp nhập của Phòng Kiểm tra — chép từ sheet HUONG_DAN của
  chính ba tệp mẫu trong folder PKT (03/11/2026). Mỗi luật ở đây trỏ về một
  dòng hướng dẫn; không tự thêm luật nghiệp vụ mà mẫu không nói.

  "Lỗi" chặn dòng đó (hoặc cả tệp nếu nằm ở phần đầu). "Cảnh báo" vẫn cho
  nhập, chỉ nói điều người gửi nên xem lại.
*/

/* "Danh mục đoàn kiểm tra" bỏ (05/11/2026): mã phòng, mã và tên trưởng đoàn đã
   có sẵn trong bộ file gốc QLRR (MA_PHONG, MA_TRUONG_DOAN, TEN_TRUONG_DOAN). */
export type LoaiNhap = "boQLRR" | "chuyenDe" | "chiTieu" | "khDichDanh";
export type LoaiMau = Exclude<LoaiNhap, "boQLRR">;
export interface MauNhap { id: LoaiNhap; ten: string; moTa: string; tep?: string; tienTo?: string }
export const MAU_NHAP: MauNhap[] = [
  { id: "boQLRR", ten: "Bộ file gốc QLRR", moTa: "Bốn tệp Phòng QLRR kết xuất hằng tuần: đang thực hiện, kết luận, quyết định xử lý, số nộp sau kiểm tra." },
  { id: "chuyenDe", ten: "Chuyên đề", moTa: "Danh sách NNT theo từng chuyên đề kiểm tra, mỗi chuyên đề một sheet.", tep: "PKT_CHUYENDE.xlsx", tienTo: "CHUYENDE" },
  { id: "chiTieu", ten: "Chỉ tiêu", moTa: "Chỉ tiêu nhiệm vụ kiểm tra tại trụ sở NNT theo quyết định giao hoặc điều chỉnh.", tep: "PKT_CHITIEU.xlsx", tienTo: "CHITIEU" },
  { id: "khDichDanh", ten: "Kế hoạch đích danh", moTa: "Danh sách NNT trong kế hoạch kiểm tra đích danh năm.", tep: "PKT_KH_DICHDANH.xlsx", tienTo: "KH_DICHDANH" },
];

export interface Van { sheet: string; dong: number | null; cot: string; noiDung: string; muc: "loi" | "canhBao" }
export interface KetQuaKT { hopLe: number; van: Van[]; tomTat: string; chan: boolean }

const MST = /^\d{10}(-\d{3})?$/;
const chu = (x: GiaTriO | undefined) => (x === undefined ? "" : String(x).trim());
const ngayChu = (d: Date) => `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
const ngayTen = (d: Date) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;

/** Tên tệp `<TIỀN TỐ>_<YYYYMMDD>.xlsx` — mục 1 của mọi hướng dẫn. */
function kiemTen(tenTep: string, tienTo: string, ngay: Date | null, van: Van[]) {
  const m = tenTep.match(new RegExp(`^${tienTo}_(\\d{8})\\.xlsx$`, "i"));
  if (!m) van.push({ sheet: "", dong: null, cot: "Tên tệp", noiDung: `Tên tệp nên là ${tienTo}_<YYYYMMDD>.xlsx (đang là "${tenTep}").`, muc: "canhBao" });
  else if (ngay && m[1] !== ngayTen(ngay)) van.push({ sheet: "", dong: null, cot: "Tên tệp", noiDung: `Ngày trên tên tệp (${m[1]}) khác ngày quyết định / công văn (${ngayChu(ngay)}).`, muc: "canhBao" });
}

/** MST: 10 số hoặc 10 số-3 số, giữ số 0 đầu. Ô kiểu số là dấu hiệu đã mất số 0. */
function kiemMST(x: GiaTriO | undefined, sheet: string, dong: number, cot: string, van: Van[]): string | null {
  if (typeof x === "number") {
    const s = String(x);
    if (s.length === 9) { van.push({ sheet, dong, cot, noiDung: `MST ${s} bị lưu dạng số và đã mất số 0 đầu. Định dạng cột là Text rồi gõ lại.`, muc: "loi" }); return null; }
  }
  const s = chu(x);
  if (!MST.test(s)) { van.push({ sheet, dong, cot, noiDung: `MST "${s}" không đúng dạng 10 chữ số hoặc 10 chữ số-3 chữ số.`, muc: "loi" }); return null; }
  return s;
}

function kiemChiTieu(sheets: SheetDoc[], tenTep: string): KetQuaKT {
  const van: Van[] = [];
  const s = sheets.find((x) => x.ten === "CHI_TIEU");
  if (!s) return { hopLe: 0, van: [{ sheet: "", dong: null, cot: "Sheet", noiDung: "Không có sheet CHI_TIEU. Không đổi tên sheet của mẫu (hướng dẫn mục 6).", muc: "loi" }], tomTat: "", chan: true };
  const o = (r: string) => s.o.get(r);
  const nam = o("C2"), loai = chu(o("C3")), soQD = chu(o("C4")), ngay = ngayTuO(o("C5"));
  if (typeof nam !== "number" || nam < 2020 || nam > 2100) van.push({ sheet: s.ten, dong: 2, cot: "C", noiDung: "Năm chỉ tiêu phải là năm 4 chữ số, ví dụ 2026.", muc: "loi" });
  if (loai !== "Giao" && loai !== "Điều chỉnh") van.push({ sheet: s.ten, dong: 3, cot: "C", noiDung: 'Loại quyết định phải là "Giao" hoặc "Điều chỉnh".', muc: "loi" });
  if (!soQD) van.push({ sheet: s.ten, dong: 4, cot: "C", noiDung: "Thiếu số Quyết định.", muc: "loi" });
  if (!ngay) van.push({ sheet: s.ten, dong: 5, cot: "C", noiDung: "Ngày Quyết định trống hoặc không đúng dạng dd/mm/yyyy.", muc: "loi" });
  kiemTen(tenTep, "CHITIEU", ngay, van);
  const chan = van.some((v) => v.muc === "loi");
  /* Dòng đơn vị cố định của mẫu (mục 6: không thêm, xoá, đổi thứ tự dòng). */
  const dongDV = [...[10, 11, 12, 13, 14].map((r, i) => [r, `Phòng Kiểm tra số ${i + 1}`] as const), ...Array.from({ length: 25 }, (_, i) => [16 + i, `Thuế cơ sở số ${i + 1}`] as const)];
  let hopLe = 0, trong = 0;
  for (const [r, ten] of dongDV) {
    if (chu(o(`B${r}`)) !== ten) { van.push({ sheet: s.ten, dong: r, cot: "B", noiDung: `Tên đơn vị phải là "${ten}" (đang là "${chu(o(`B${r}`))}"). Không đổi tên, thứ tự dòng.`, muc: "loi" }); continue; }
    const x = o(`C${r}`);
    if (x === undefined || x === "") { trong++; continue; }
    if (typeof x !== "number" || !Number.isInteger(x) || x < 0) { van.push({ sheet: s.ten, dong: r, cot: "C", noiDung: `Chỉ tiêu của ${ten} phải là số cuộc, số nguyên ≥ 0.`, muc: "loi" }); continue; }
    hopLe++;
  }
  /* Mục 4: quyết định điều chỉnh để trống đơn vị không đổi; quyết định giao thì đơn vị nào cũng phải có số. */
  if (loai === "Giao" && trong) van.push({ sheet: s.ten, dong: null, cot: "C", noiDung: `Quyết định giao nhưng ${trong} đơn vị để trống chỉ tiêu.`, muc: "canhBao" });
  if (loai === "Điều chỉnh" && !hopLe && !chan) van.push({ sheet: s.ten, dong: null, cot: "C", noiDung: "Quyết định điều chỉnh nhưng chưa có đơn vị nào được điền số.", muc: "loi" });
  return { hopLe, van, chan: chan || !hopLe, tomTat: `Quyết định ${loai || "?"} số ${soQD || "?"}${ngay ? ` ngày ${ngayChu(ngay)}` : ""} · năm ${nam ?? "?"}` };
}

function kiemDanhSach(s: SheetDoc, dongDau: number, cotMST: string, cotTen: string, van: Van[]) {
  let hopLe = 0, cuoi = dongDau;
  for (const k of s.o.keys()) { const r = Number(k.replace(/^[A-Z]+/, "")); if (r > cuoi) cuoi = r; }
  const da = new Map<string, number>();
  for (let r = dongDau; r <= cuoi; r++) {
    const xM = s.o.get(`${cotMST}${r}`), ten = chu(s.o.get(`${cotTen}${r}`));
    if ((xM === undefined || chu(xM) === "") && !ten) continue;
    if (!ten) { van.push({ sheet: s.ten, dong: r, cot: cotTen, noiDung: "Thiếu tên người nộp thuế.", muc: "loi" }); continue; }
    const mst = kiemMST(xM, s.ten, r, cotMST, van);
    if (!mst) continue;
    if (da.has(mst)) { van.push({ sheet: s.ten, dong: r, cot: cotMST, noiDung: `MST ${mst} trùng với dòng ${da.get(mst)}; chỉ nhận dòng đầu.`, muc: "canhBao" }); continue; }
    da.set(mst, r);
    hopLe++;
  }
  return hopLe;
}

function kiemKHDichDanh(sheets: SheetDoc[], tenTep: string): KetQuaKT {
  const van: Van[] = [];
  const s = sheets.find((x) => x.ten === "KE_HOACH_DICH_DANH");
  if (!s) return { hopLe: 0, van: [{ sheet: "", dong: null, cot: "Sheet", noiDung: "Không có sheet KE_HOACH_DICH_DANH. Không đổi tên sheet của mẫu (hướng dẫn mục 5).", muc: "loi" }], tomTat: "", chan: true };
  const nam = s.o.get("C2"), soQD = chu(s.o.get("C3")), ngay = ngayTuO(s.o.get("C4"));
  if (typeof nam !== "number" || nam < 2020 || nam > 2100) van.push({ sheet: s.ten, dong: 2, cot: "C", noiDung: "Năm kế hoạch phải là năm 4 chữ số.", muc: "loi" });
  if (!soQD) van.push({ sheet: s.ten, dong: 3, cot: "C", noiDung: "Thiếu số Quyết định giao kế hoạch.", muc: "loi" });
  if (!ngay) van.push({ sheet: s.ten, dong: 4, cot: "C", noiDung: "Ngày Quyết định trống hoặc không đúng dạng dd/mm/yyyy.", muc: "loi" });
  if (chu(s.o.get("B6")) !== "TÊN NGƯỜI NỘP THUẾ" || chu(s.o.get("C6")) !== "MÃ SỐ THUẾ") van.push({ sheet: s.ten, dong: 6, cot: "B–C", noiDung: "Dòng tiêu đề cột đã bị đổi. Không đổi tên, thêm hoặc xoá cột (mục 5).", muc: "loi" });
  kiemTen(tenTep, "KH_DICHDANH", ngay, van);
  const chan = van.some((v) => v.muc === "loi");
  const hopLe = chan ? 0 : kiemDanhSach(s, 7, "C", "B", van);
  if (!chan && !hopLe) van.push({ sheet: s.ten, dong: 7, cot: "B–C", noiDung: "Danh sách trống: điền từ dòng 7 trở xuống.", muc: "loi" });
  return { hopLe, van, chan: chan || !hopLe, tomTat: `Quyết định số ${soQD || "?"}${ngay ? ` ngày ${ngayChu(ngay)}` : ""} · năm ${nam ?? "?"}` };
}

function kiemChuyenDe(sheets: SheetDoc[], tenTep: string): KetQuaKT {
  const van: Van[] = [];
  const ds = sheets.filter((x) => x.ten !== "HUONG_DAN");
  if (!ds.length) return { hopLe: 0, van: [{ sheet: "", dong: null, cot: "Sheet", noiDung: "Tệp không có sheet chuyên đề nào.", muc: "loi" }], tomTat: "", chan: true };
  let hopLe = 0, ngayMoi: Date | null = null;
  const tenCD = new Set<string>();
  for (const s of ds) {
    const ten = chu(s.o.get("B2")), ngay = ngayTuO(s.o.get("D3"));
    if (ngay && (!ngayMoi || ngay > ngayMoi)) ngayMoi = ngay;
    const truoc = van.length;
    if (!ten) van.push({ sheet: s.ten, dong: 2, cot: "B", noiDung: "Thiếu tên chuyên đề.", muc: "loi" });
    else if (tenCD.has(ten)) van.push({ sheet: s.ten, dong: 2, cot: "B", noiDung: `Tên chuyên đề "${ten}" trùng với sheet khác.`, muc: "loi" });
    if (!chu(s.o.get("B3"))) van.push({ sheet: s.ten, dong: 3, cot: "B", noiDung: "Thiếu số công văn.", muc: "canhBao" });
    if (!ngay) van.push({ sheet: s.ten, dong: 3, cot: "D", noiDung: "Ngày công văn trống hoặc không đúng dạng dd/mm/yyyy.", muc: "canhBao" });
    if (chu(s.o.get("B5")) !== "MÃ SỐ THUẾ" || chu(s.o.get("C5")) !== "TÊN NGƯỜI NỘP THUẾ") van.push({ sheet: s.ten, dong: 5, cot: "B–C", noiDung: "Dòng tiêu đề cột đã bị đổi. Không đổi tên, thêm hoặc xoá cột (mục 7).", muc: "loi" });
    if (van.slice(truoc).some((v) => v.muc === "loi")) continue;
    tenCD.add(ten);
    const n = kiemDanhSach(s, 6, "B", "C", van);
    if (!n) van.push({ sheet: s.ten, dong: 6, cot: "B–C", noiDung: `Chuyên đề "${ten}" chưa có người nộp thuế nào.`, muc: "canhBao" });
    hopLe += n;
  }
  kiemTen(tenTep, "CHUYENDE", ngayMoi, van);
  return { hopLe, van, chan: !hopLe, tomTat: `${tenCD.size} chuyên đề` };
}

export function kiemTep(loai: LoaiMau, sheets: SheetDoc[], tenTep: string): KetQuaKT {
  if (loai === "chiTieu") return kiemChiTieu(sheets, tenTep);
  if (loai === "khDichDanh") return kiemKHDichDanh(sheets, tenTep);
  return kiemChuyenDe(sheets, tenTep);
}
