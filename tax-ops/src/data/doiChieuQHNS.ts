import { hatCua, nguyen, prng } from "@/data/ngauNhien";
import { quanHeNganSach } from "@/data/hoSoQLDN";
import { DANH_MUC_CQT } from "@/data/danhMuc";
import { DON_VI_Q, type DongDN } from "@/data/qldn";
import { LA } from "@/data/ql5";
import { moTaGD, tenTieuMucTMS } from "@/data/danhMucTMS";

/*
  Đối chiếu nghĩa vụ của một NNT từ khi thành lập.

  Nguồn: biên bản 09/11/2026 "Họp dựng Biểu quan hệ ngân sách" (folder 09-11)
  và biên bản 11/11/2026 "Cách xử lý dữ liệu đối chiếu nghĩa vụ người nộp
  thuế", demo 13/11/2026 (folder 16-11). Biểu QHNS là "sao kê ngân hàng" của
  NNT: phải nộp, đã nộp, còn phải nộp. Cách cán bộ đang làm tay (11/11 §2.1),
  máy làm lại y như vậy:

    1. Bung toàn bộ giao dịch theo tiểu mục ra một bảng, mỗi giao dịch một
       ký hiệu TMS (TK, TQ, C2, P4, DP, HC, CD…), ÂM LÀ ÂM, DƯƠNG LÀ DƯƠNG
       (§2.5) — điều chỉnh DP có thể âm, hủy chứng từ HC trừ lại khoản đã nộp.
    2. Xếp theo HẠN NỘP; có ngày gia hạn thì lấy ngày gia hạn (§2.2, điểm
       thống nhất 5).
    3. Bắt cặp theo công cụ VBA của phòng nghiệp vụ — biên bản 18/11/2026
       §2.2 (folder 20-11), thay cách mô tả của biên bản 11/11:
       • Cắt theo lũy kế: cộng dồn từ đầu bảng, tại điểm lũy kế bằng 0 thì
         đoạn trước đã khớp, cắt bỏ để giảm số dòng (yêu cầu cải thiện).
       • Vòng 1: ghép hai dòng liền kề, tổng lệch dưới 100.000 đồng thì coi
         là bù trừ được. Không bù được thì tìm cặp âm – dương cùng số tiền.
         Vẫn không ghép được thì đặt trạng thái "treo".
       • Từ vòng 2: chỉ ghép C2 (chứng từ nộp) với TK (tờ khai), tối đa 7
         dòng liền kề, tổng bằng 0 thì coi là bù được. Thường đến vòng 4 là
         hết cặp.
    4. Dòng còn lại được tô đỏ — là điểm cần soi, kèm các bước tìm nguyên
       nhân của biên bản 18/11 §2.3.

  Nhãn của hai loại dòng còn lại lấy theo sheet TS của công cụ RSNT_GTGT_CUC:
  "thiếu khoản đã nộp (C2, ĐC…)" và "thiếu phát sinh phải nộp (TK, QT, QĐ…)".

  DIỄN GIẢI (chưa xác nhận):
  - Vòng 1 "ghép các dòng liền kề": một đoạn từ 2 dòng liền kề trở lên (tối
    đa 7 như vòng 2), không chỉ một cặp — để bắt nhóm TK + QT + C2 nộp chung.
  - "Liền kề" ở vòng 2 tính trên dãy chỉ gồm dòng C2 và TK (ghép riêng hai
    loại này), không tính các dòng loại khác nằm xen giữa.
  - Tờ khai bổ sung giữ ký hiệu TK (danh mục KHGD không có ký hiệu riêng),
    ghi rõ điều chỉnh tăng hay giảm của tờ khai nào (§2.2, yêu cầu cải thiện).
  - "Cùng kỳ" ở bước 1 tìm nguyên nhân hiểu là cùng năm.

  GIẢ ĐỊNH CÒN LẠI (chưa xác nhận):
  - Ghép trong cùng tiểu mục và cùng CQT.
  - Chưa áp quy tắc hạch toán theo từng mốc thông tư (TT156 / TT80 / TT89:
    tờ khai GTGT 7 chỉ tiêu trước 2018, tờ khai bổ sung lấy số ở bảng kê, quyết
    toán TNCN trước/sau 2020) — chờ file quy tắc của anh Hòa (11/11, việc 4).
  - Trước 2015 vẫn là một giao dịch CD (số dư đầu kỳ) — chờ dữ liệu QLT
    1999–2014 của anh Tân (11/11, việc 5).

  Sổ là SỐ ĐẶT RA, gieo theo DN (hạt 95). Sổ dựng khớp với bảng Quan hệ ngân
  sách của cùng hồ sơ: phải nộp trừ đã nộp = cột "Còn nợ" trừ "Nộp thừa". Các
  quy tắc của công cụ VBA có trường hợp không bắt được (biên bản 18/11 §2.2),
  nên dòng tô đỏ có thể nhiều hơn khoản nợ, thừa thật.
*/

/** Vòng 1: hai dòng liền kề lệch dưới mức này coi là bù trừ được (biên bản 18/11 §2.2). */
export const NGUONG_LECH = 100_000;
/** Từ vòng 2: ghép tối đa 7 dòng C2/TK liền kề (biên bản 18/11 §2.2). */
export const CUA_SO = 7;
/** Từ vòng 2 chỉ ghép chứng từ nộp C2 với tờ khai TK. */
const laC2TK = (x: DongSo) => x.ma === "C2" || x.ma === "TK";
/** Giao dịch chuyển từ ứng dụng cũ sang TMS (biên bản 18/11 §2.2), trước 2021. */
const MA_CHUYEN_DOI = new Set(["CD", "RV", "NM", "TH"]);
/** TMS chạy từ 2015; trước đó chỉ có một giao dịch CD (§2.4). */
const NAM_TMS = 2015;
/** Dòng phải nộp có hạn đến hết ngày này mới vào sổ. */
const CHOT = new Date(2026, 9, 31);
const NGAY = 86_400_000;

export type Chieu = "PN" | "DN";

export interface DongSo {
  id: string;
  /** Ký hiệu giao dịch TMS — xem `KY_HIEU_GD`. */
  ma: string;
  chieu: Chieu;
  moTa: string;
  tieuMuc: string;
  tenTieuMuc: string;
  /** Mã CQT; rỗng khi là CQT ngoài Hà Nội (chưa có danh mục mã). */
  cqt: string;
  tenCQT: string;
  /** Ngày dùng để đối chiếu. Phải nộp: hạn nộp, hoặc ngày gia hạn nếu có. Đã nộp: ngày nộp. */
  ngay: Date;
  /** Phải nộp được gia hạn: hạn nộp gốc. */
  hanGoc?: Date;
  /** Đồng, giữ dấu của giao dịch: DP có thể âm, HC âm, tờ khai bổ sung giảm âm. */
  soTien: number;
  /** Tờ khai bổ sung: điều chỉnh tăng hay giảm, của tờ khai nào (biên bản 18/11 §2.2). */
  boSung?: { huong: "TANG" | "GIAM"; cua: string };
}

/** "Điều chỉnh giảm của Tờ khai quý 2/2023". */
export const nhanBoSung = (b: NonNullable<DongSo["boSung"]>) => `Điều chỉnh ${b.huong === "TANG" ? "tăng" : "giảm"} của ${b.cua}`;

/** Giá trị có dấu trong phép cộng trừ: phải nộp dương, đã nộp âm. */
export const giaTri = (x: DongSo) => (x.chieu === "PN" ? x.soTien : -x.soTien);
export const laHaNoi = (x: { cqt: string }) => x.cqt !== "";
/** "TK · TK tháng/quý/năm" — chú giải ký hiệu theo danh mục TMS. */
export const nhanMa = (ma: string) => `${ma} · ${moTaGD(ma)}`;

/** Cách một nhóm được nhấc ra — biên bản 18/11/2026 §2.2. */
export type CachGhep = "LUY_KE" | "LIEN_KE" | "CUNG_SO" | "C2_TK";
export const NHAN_CACH: Record<CachGhep, string> = {
  LUY_KE: "cắt tại điểm lũy kế bằng 0",
  LIEN_KE: "các dòng liền kề, lệch dưới 100.000 đồng",
  CUNG_SO: "cặp âm – dương cùng số tiền",
  C2_TK: "C2 và TK liền kề, tổng bằng 0",
};
export interface Cap { pn: DongSo[]; dn: DongSo[]; vong: number; cach: CachGhep; lech: number }
/** Ngày của nhóm: hạn của khoản phải nộp đầu; nhóm chỉ có chứng từ (C2 + HC) lấy ngày nộp. */
export const dauCap = (c: Cap) => (c.pn[0] ?? c.dn[0]).ngay;

/** NO: phải nộp, thiếu chứng từ nộp. THUA: đã nộp, thiếu phát sinh. */
export type LoaiSoi = "THUA" | "NO" | "CHUYEN_DOI";
/** `buoc`: số thứ tự bước tìm nguyên nhân đã tự tìm ra gợi ý này (biên bản 18/11 §2.3). */
export interface DocNhanh { muc: "cao" | "thap"; nhan: string; nhamTM?: true; buoc?: number }
export interface DongSoi extends DongSo {
  loai: LoaiSoi;
  /** Các bước tìm nguyên nhân theo thứ tự (biên bản 18/11 §2.3). */
  buoc: string[];
  docNhanh?: DocNhanh;
}

/** Lũy kế trên màn Tổng quan TMS so với lũy kế cộng từ chi tiết (sheet HETHONG). */
export interface LuyKe { tieuMuc: string; tenTieuMuc: string; tms: number; file: number }
/** Thừa ở tỉnh khác trong khi nợ treo ở Hà Nội (biên bản 13/11 §2.2). */
export interface PhanBo { tinh: string; thua: number; cqtNo: string; tenNo: string; no: number }

export interface KetQuaDoiChieu {
  phaiNop: number; daNop: number; conPhaiNop: number;
  soDong: number; capDaGhep: Cap[]; soVong: number;
  /** Cặp chỉ ghép được nhờ ngưỡng lệch (vòng 1), và tổng phần lệch còn lại. */
  capTheoNguong: number; tongLech: number;
  /** Nhóm ghép từ 3 khoản trở lên. */
  nhomNhieu: number;
  /** Đoạn cắt theo lũy kế bằng 0, và số dòng nằm trong các đoạn ấy. */
  doanLuyKe: number; dongLuyKe: number;
  /** Dòng ở trạng thái "treo" sau vòng 1 — chuyển sang vòng 2. */
  soTreo: number;
  canSoi: DongSoi[];
  tuNam: number; coChuyenDoi: boolean;
  soGiaHan: number;
  luyKe: LuyKe[];
  phanBo: PhanBo[];
  /** Các ký hiệu giao dịch có trong sổ — cho chú giải. */
  kyHieu: string[];
  cqt: string; tenCQT: string;
}

const ngayVN = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const cong = (d: Date, n: number) => new Date(d.getTime() + n * NGAY);

/** Tên CQT theo danh mục 31 mã. */
export const tenCQTCua = (ma: string) => {
  const c = DANH_MUC_CQT.find((x) => x.ma === ma);
  return !c ? ma : c.thuocTCS === null ? c.diaBan : `Thuế cơ sở ${String(c.thuocTCS).padStart(2, "0")} · ${c.diaBan}`;
};

/** Mã CQT của DN: có sẵn thì dùng, không thì lấy mã đầu của đơn vị quản lý. */
export function cqtCuaDN(d: DongDN) {
  if (d.cqt) return d.cqt;
  const dv = DON_VI_Q.find((x) => x.ngan === d.donVi || x.ten === d.donVi);
  return (dv && LA.find((l) => l.dvId === dv.id)?.cqt) ?? "0101";
}

/*
  Bước tìm nguyên nhân — NGUYÊN VĂN biên bản 18/11/2026 §2.3, thay ba bước
  của biên bản 11/11 (người dùng chốt 16/11/2026: bám sát tài liệu).
*/
const BUOC_TIM: string[] = [
  "Quét trên tổng quan xem trong cùng kỳ có phát sinh dương cùng số tiền ở sắc thuế, tiểu mục khác không (nộp nhầm tiểu mục).",
  "Kiểm tra tờ khai bổ sung, tờ khai chưa hạch toán (chức năng 3.2.6).",
  "Kiểm tra tờ khai lỗi, tồn trục chưa xử lý (chức năng 3.2.3.3).",
  "Tra eDoc xem có quyết định xử phạt, truy thu, kết luận kiểm toán chưa được nhập không.",
  "Liên hệ NNT.",
];
function buocCua(loai: LoaiSoi): string[] {
  if (loai === "CHUYEN_DOI") return [
    "Dữ liệu chuyển từ ứng dụng cũ sang TMS (giao dịch RV, NM, TH…, trước năm 2021) hoặc cán bộ nhập lại trên TMS — công cụ bắt cặp chưa bắt được (biên bản 18/11 §2.2).",
    "Số dư trước 2015 nằm thành một giao dịch CD; sẽ thay bằng dữ liệu chi tiết giai đoạn 1999–2014 từ anh Tân (biên bản 11/11).",
  ];
  return BUOC_TIM;
}

/* ---------- Bắt cặp (biên bản 18/11/2026 §2.2) ---------- */

type Nhac = (x: DongSo[], vong: number, cach: CachGhep) => void;

/** Cộng dồn từ đầu bảng; tại mỗi điểm lũy kế bằng 0, đoạn trước đã khớp — nhấc ra. */
function catLuyKe(bang: DongSo[], vong: number, nhac: Nhac): DongSo[] {
  let tong = 0, dau = 0;
  for (let i = 0; i < bang.length; i++) {
    tong += giaTri(bang[i]);
    if (tong === 0) { nhac(bang.slice(dau, i + 1), vong, "LUY_KE"); dau = i + 1; }
  }
  return bang.slice(dau);
}

/*
  Mỗi (tiểu mục, CQT) một bảng, xếp theo ngày đối chiếu.
  Vòng 1: (a) đoạn 2–7 dòng liền kề có cả dương lẫn âm, tổng lệch dưới
  100.000 đồng, đoạn ngắn trước;
  (b) dòng còn lại tìm cặp trái dấu cùng số tiền ở bất kỳ đâu trong bảng.
  Dòng vẫn chưa ghép được ở trạng thái "treo".
  Vòng 2 trở đi: trên dãy chỉ gồm C2 và TK, từ mỗi dòng xét đoạn 2–7 dòng
  liền kề, đoạn ngắn trước; tổng bằng 0 thì nhấc ra. Hết vòng thì dồn bảng
  (các dòng mới thành liền kề) và chạy tiếp; dừng khi một vòng không nhấc
  thêm được gì. Trước mỗi vòng cắt theo lũy kế.
*/
function batCap(dong: DongSo[]) {
  const theoBang = new Map<string, DongSo[]>();
  for (const x of dong) { const k = `${x.tieuMuc}|${x.cqt}|${x.tenCQT}`; theoBang.set(k, [...(theoBang.get(k) ?? []), x]); }
  const cap: Cap[] = [];
  let soVong = 0, soTreo = 0;
  const conLai: DongSo[] = [];
  const nhac: Nhac = (x, vong, cach) => {
    cap.push({ pn: x.filter((v) => v.chieu === "PN"), dn: x.filter((v) => v.chieu === "DN"), vong, cach, lech: x.reduce((a, v) => a + giaTri(v), 0) });
    soVong = Math.max(soVong, vong);
  };
  for (const ds of theoBang.values()) {
    let bang = catLuyKe(ds.toSorted((a, b) => a.ngay.getTime() - b.ngay.getTime() || (a.chieu === "PN" ? -1 : 1)), 1, nhac);

    /* Vòng 1 */
    const da = new Set<DongSo>();
    for (let i = 0; i < bang.length; i++) {
      for (let n = 2; n <= CUA_SO && i + n <= bang.length; n++) {
        const doan = bang.slice(i, i + n);
        const g = doan.map(giaTri);
        if (!g.some((v) => v > 0) || !g.some((v) => v < 0) || Math.abs(g.reduce((a, v) => a + v, 0)) >= NGUONG_LECH) continue;
        for (const x of doan) da.add(x);
        nhac(doan, 1, "LIEN_KE");
        i += n - 1;
        break;
      }
    }
    for (const a of bang) {
      if (da.has(a)) continue;
      const b = bang.find((y) => y !== a && !da.has(y) && giaTri(y) === -giaTri(a));
      if (b) { da.add(a); da.add(b); nhac(a.ngay <= b.ngay ? [a, b] : [b, a], 1, "CUNG_SO"); }
    }
    bang = bang.filter((x) => !da.has(x));
    soTreo += bang.length;

    /* Vòng 2 trở đi */
    for (let k = 2; k <= 10 && bang.length > 1; k++) {
      bang = catLuyKe(bang, k, nhac);
      const day = bang.filter(laC2TK);
      const nhacVong = new Set<DongSo>();
      for (let i = 0; i < day.length; i++) {
        for (let n = 2; n <= CUA_SO && i + n <= day.length; n++) {
          const doan = day.slice(i, i + n);
          if (doan.reduce((a, x) => a + giaTri(x), 0) !== 0) continue;
          for (const x of doan) nhacVong.add(x);
          nhac(doan, k, "C2_TK");
          i += n - 1;
          break;
        }
      }
      if (!nhacVong.size) break;
      bang = bang.filter((x) => !nhacVong.has(x));
    }
    conLai.push(...bang);
  }
  return { cap, soVong, soTreo, conLai };
}

/* ---------- Dựng sổ ---------- */

export function doiChieuQHNS(d: DongDN): KetQuaDoiChieu {
  const r = prng(hatCua(95, "qhns-so", d.khoa));
  const ns = quanHeNganSach(d);
  const tw = ns.reduce((a, x) => a + Math.max(x.daNop, 1), 0);
  const tuNam = Math.max(d.namThanhLap, NAM_TMS);
  const coChuyenDoi = d.namThanhLap < NAM_TMS;
  const cqt = cqtCuaDN(d);
  const noi = { cqt, tenCQT: tenCQTCua(cqt) };
  const dong: DongSo[] = [];
  let n = 0;
  const them = (x: Omit<DongSo, "id">) => { const v = { ...x, id: `${x.tieuMuc}-${++n}` }; dong.push(v); return v; };
  /* Một năm của DN cỡ này nộp chừng `thu2026` tỷ; năm cũ nhỏ hơn. */
  const quyMo = (nam: number) => Math.max(d.thu2026, 0.3) * 1e9 * Math.pow(0.9, 2026 - nam);
  /* Nộp nhầm tiểu mục (11/11 §2.6): tiền của tiểu mục có nợ nộp sang tiểu mục đang thừa. */
  const tmThua = ns.find((x) => x.thua > 0 && !x.phanBo);
  const tmNo = ns.find((x) => x.conNo > 0 && x !== tmThua && !x.phanBo);
  const nhamTM = tmThua && tmNo && tmThua.thua < tmNo.conNo && r() < 0.35 ? tmThua.thua * 1e6 : 0;

  for (const tm of ns) {
    const ty = Math.max(tm.daNop, 1) / tw;
    const goc = { tieuMuc: tm.tieuMuc, tenTieuMuc: tenTieuMucTMS(tm.tieuMuc), ...noi };
    const noTreo = tm.conNo * 1e6;
    const phanBo = tm.phanBo ? tm.phanBo.soTien * 1e6 : 0;
    const thua = tm.thua * 1e6 - phanBo;
    /* Nợ treo nằm ở số dư chuyển đổi (DN cũ, đôi khi) hoặc ở nghĩa vụ gần nhất. */
    const noOChuyenDoi = noTreo > 0 && coChuyenDoi && r() < 0.4;
    const ngayTra = (pn: DongSo, treSau = 0) => cong(pn.ngay, -nguyen(r, 0, 6) + treSau);
    /*
      Trả một nghĩa vụ: thường một giấy nộp tiền C2; đôi khi nộp làm hai, ba
      lần (cần ghép nhiều khoản), đôi khi nộp ở nơi khác rồi chuyển về trụ sở
      (P4), đôi khi nộp trùng rồi hủy một chứng từ (C2 + HC).
    */
    /* Chỉ tách nhiều lần nộp khi nghĩa vụ đứng một mình: nhóm ghép tối đa 5 khoản. */
    const tra = (pns: DongSo[], treSau = 0, tach = true) => {
      const tong = pns.reduce((a, x) => a + x.soTien, 0);
      const ngay = ngayTra(pns[pns.length - 1], treSau);
      const moTa = `Nộp cho ${pns.map((p) => p.moTa.toLowerCase()).join(", ")}`;
      const x = r();
      if (x < 0.07) { them({ ...goc, ma: "P4", chieu: "DN", ngay, soTien: tong, moTa: moTaGD("P4") }); return; }
      if (x < 0.2 && tach && pns.length === 1 && tong > 3e6) {
        const phan = nguyen(r, 2, 3);
        let con = tong;
        for (let i = 0; i < phan; i++) {
          const so = i === phan - 1 ? con : Math.round((tong / phan) * (0.6 + r() * 0.8) / 1000) * 1000;
          con -= so;
          them({ ...goc, ma: "C2", chieu: "DN", ngay: cong(ngay, i * nguyen(r, 3, 20)), soTien: so, moTa });
        }
        return;
      }
      /* Số lẻ (09/11 §3.5): nộp tròn nghìn, để lại chênh vài trăm đồng. */
      const le = r() < 0.12;
      const soTien = le ? Math.floor(tong / 1000) * 1000 : tong;
      them({ ...goc, ma: "C2", chieu: "DN", ngay, soTien, moTa });
      if (r() < 0.03) {
        them({ ...goc, ma: "C2", chieu: "DN", ngay: cong(ngay, 1), soTien, moTa });
        them({ ...goc, ma: "HC", chieu: "DN", ngay: cong(ngay, nguyen(r, 5, 40)), soTien: -soTien, moTa: moTaGD("HC") });
      }
    };

    if (coChuyenDoi) {
      const soDu = noOChuyenDoi ? noTreo : Math.round(quyMo(2014) * ty * (0.05 + r() * 0.2));
      const pn = them({ ...goc, ma: "CD", chieu: "PN", ngay: new Date(2014, 11, 31), soTien: soDu, moTa: "Số dư nợ chuyển từ ứng dụng trước TMS" });
      if (!noOChuyenDoi) tra([pn], nguyen(r, 20, 200));
    }

    const cacPN: DongSo[] = [];
    /* Phần DP đã tách khỏi tờ khai — chứng từ nộp vẫn trả đủ số gốc. */
    const dpCua = new Map<DongSo, number>();
    /* Tờ khai có bổ sung giảm: nộp theo số sau điều chỉnh, sau ngày khai bổ sung. */
    const giamCua = new Map<DongSo, { so: number; sau: number }>();
    const phat = tm.tieuMuc.startsWith("42");
    for (let nam = tuNam; nam <= 2026; nam++) {
      const tren = quyMo(nam) * ty;
      /* TNDN quyết toán năm (TQ); tiền phạt chỉ có quyết định; còn lại khai theo quý. */
      const ky = phat ? []
        : tm.tieuMuc === "1052"
          ? [{ ma: "TQ", moTa: `Tờ khai quyết toán năm ${nam}`, han: new Date(nam + 1, 2, 31), w: 1 }]
          : [1, 2, 3, 4].map((q) => ({ ma: "TK", moTa: `Tờ khai quý ${q}/${nam}`, han: new Date(nam, q * 3 + 1, 0), w: 0.25 }));
      for (const k of ky) {
        if (k.han > CHOT) continue;
        const so = Math.round(tren * k.w * (0.75 + r() * 0.5)) + nguyen(r, 0, 999);
        /* Gia hạn (11/11 §2.2: "không ít, năm nào cũng có"): đối chiếu theo ngày gia hạn. */
        const giaHan = nam >= 2020 && nam <= 2025 && r() < 0.18 ? cong(k.han, nguyen(r, 90, 180)) : null;
        const pn = them({ ...goc, ma: k.ma, chieu: "PN", ngay: giaHan ?? k.han, ...(giaHan ? { hanGoc: k.han } : {}), soTien: so, moTa: k.moTa });
        /* Tờ khai đã nộp nhưng hệ thống hạch toán thiếu; cán bộ điều chỉnh tăng bằng DP (11/11 §2.5). */
        if (r() < 0.04 && so > 2e6) {
          const thieu = Math.round(so * (0.1 + r() * 0.3));
          pn.soTien = so - thieu;
          cacPN.push(pn);
          them({ ...goc, ma: "DP", chieu: "PN", ngay: cong(pn.ngay, nguyen(r, 2, 25)), soTien: thieu, moTa: moTaGD("DP") });
          dpCua.set(pn, thieu);
          continue;
        }
        cacPN.push(pn);
        /* Tờ khai bổ sung (biên bản 18/11 §2.2): tăng thì nộp thêm phần tăng;
           giảm thì dòng âm, doanh nghiệp nộp theo số sau điều chỉnh. */
        if (k.ma === "TK" && so > 2e6 && r() < 0.06) {
          const lech = Math.round(so * (0.05 + r() * 0.2) / 1000) * 1000;
          const sau = nguyen(r, 20, 90);
          const tang = r() < 0.5;
          const bs = them({ ...goc, ma: "TK", chieu: "PN", ngay: cong(pn.ngay, sau), soTien: tang ? lech : -lech,
            moTa: k.moTa.replace("Tờ khai", "Tờ khai bổ sung"), boSung: { huong: tang ? "TANG" : "GIAM", cua: k.moTa } });
          if (tang) cacPN.push(bs);
          else giamCua.set(pn, { so: lech, sau });
        }
      }
      /* Thỉnh thoảng một biên bản kiểm tra hoặc quyết định của cơ quan thuế. */
      if (r() < (phat ? 0.35 : 0.1)) {
        const ma = phat ? "QP" : (["BB", "QT", "QP"] as const)[nguyen(r, 0, 2)];
        const han = new Date(nam, nguyen(r, 1, 10), nguyen(r, 1, 28));
        if (han <= CHOT) cacPN.push(them({ ...goc, ma, chieu: "PN", ngay: han, soTien: Math.max(1e6, Math.round(tren * (0.02 + r() * 0.08) / 1000) * 1000), moTa: `${moTaGD(ma)} số ${nguyen(r, 10, 980)}/QĐ-${nam}` }));
      }
    }
    cacPN.sort((a, b) => a.ngay.getTime() - b.ngay.getTime());

    /* Nghĩa vụ gần nhất mang khoản nợ treo, không có chứng từ đối ứng. Nộp
       nhầm tiểu mục thì nợ treo tách hai dòng: một dòng đúng bằng số đã nộp sang tiểu mục kia. */
    const pnNo = noTreo > 0 && !noOChuyenDoi ? cacPN.filter((x) => !dpCua.has(x) && !giamCua.has(x) && x.soTien > 0).at(-1) ?? null : null;
    if (pnNo) {
      pnNo.soTien = noTreo;
      if (tm === tmNo && nhamTM) {
        pnNo.soTien = noTreo - nhamTM;
        them({ ...goc, ma: pnNo.ma, chieu: "PN", ngay: cong(pnNo.ngay, -1), soTien: nhamTM, moTa: pnNo.moTa });
      }
    }
    for (let i = 0; i < cacPN.length; i++) {
      const pn = cacPN[i];
      if (pn === pnNo) continue;
      const dp = dpCua.get(pn) ?? 0;
      const giam = giamCua.get(pn);
      const gop = { ...pn, soTien: pn.soTien + dp - (giam?.so ?? 0) };
      if (giam) { tra([gop], giam.sau + nguyen(r, 3, 20), false); continue; }
      /* Thỉnh thoảng một chứng từ nộp chung hai kỳ liền nhau. */
      const ke = cacPN[i + 1];
      if (ke && ke !== pnNo && !dpCua.has(ke) && !giamCua.has(ke) && r() < 0.06) {
        tra([gop, ke], 0, false); i++; continue;
      }
      /* Khoảng một phần năm nộp chậm, sau cả hạn kỳ kế — để cần nhiều vòng. */
      tra([gop], r() < 0.2 ? nguyen(r, 60, 150) : 0, !dp && pn.ma === "TK");
    }

    /* Khoản nộp không có nghĩa vụ đối ứng = cột "Nộp thừa". */
    if (thua > 0) {
      const nham = tm === tmThua && nhamTM > 0;
      /* Nộp nhầm tiểu mục: tiền vào cùng năm với khoản nợ của tiểu mục kia (nợ treo ở kỳ gần nhất, năm 2026). */
      const ngay = nham ? new Date(2026, nguyen(r, 3, 8), nguyen(r, 1, 28)) : new Date(Math.max(tuNam, 2026 - nguyen(r, 1, 6)), nguyen(r, 0, 11), nguyen(r, 1, 28));
      const nk = !nham && r() < 0.3;
      them({ ...goc, ma: nk ? "P4" : "C2", chieu: "DN", ngay, soTien: thua, moTa: moTaGD(nk ? "P4" : "C2") });
    }
    /* Chứng từ phân bổ chuyển sai: tiền vào CQT tỉnh khác, nợ cùng số vẫn treo ở Hà Nội. */
    if (phanBo > 0) {
      them({ ...goc, cqt: "", tenCQT: tm.phanBo!.tinh, ma: "P3", chieu: "DN", ngay: cong(CHOT, -nguyen(r, 20, 200)), soTien: phanBo, moTa: moTaGD("P3") });
    }
  }

  const { cap, soVong, soTreo, conLai } = batCap(dong);
  const phaiNop = dong.filter((x) => x.chieu === "PN").reduce((a, x) => a + x.soTien, 0);
  const daNop = dong.filter((x) => x.chieu === "DN").reduce((a, x) => a + x.soTien, 0);
  const theoNguong = cap.filter((c) => c.lech !== 0);
  const luyKeCat = cap.filter((c) => c.cach === "LUY_KE");
  const soi = conLai.map((x) => {
    const loai: LoaiSoi = MA_CHUYEN_DOI.has(x.ma) && x.ngay.getFullYear() < 2021 ? "CHUYEN_DOI" : giaTri(x) < 0 ? "THUA" : "NO";
    return { ...x, loai, buoc: buocCua(loai) } as DongSoi;
  });
  /*
    Tự chạy các bước tìm nguyên nhân làm được trên dữ liệu đang có (biên bản
    18/11 §2.3, việc 4): bước 1 — cùng năm có khoản trái chiều cùng số tiền ở
    tiểu mục khác; bước 2 — dòng là tờ khai bổ sung. Bước 3–5 cần chức năng
    3.2.3.3, eDoc và liên hệ NNT, prototype chưa có nguồn nên để cán bộ tra.
    Hai nhận xét còn lại giữ nguyên văn biên bản 11/11 §2.6. Phân bổ liên tỉnh
    đã có dải cảnh báo ở đầu khối (biên bản 13/11), không lặp trên từng dòng.
  */
  for (const x of soi) {
    const nham = x.loai === "CHUYEN_DOI" ? undefined : soi.find((y) => y !== x && y.tieuMuc !== x.tieuMuc && y.loai !== "CHUYEN_DOI" && y.loai !== x.loai
      && y.ngay.getFullYear() === x.ngay.getFullYear() && Math.abs(y.soTien) === Math.abs(x.soTien));
    if (nham) x.docNhanh = { muc: "cao", nhamTM: true, buoc: 1, nhan: `Cùng năm có khoản ${nham.loai === "THUA" ? "nộp" : "phải nộp"} cùng số tiền ở tiểu mục ${nham.tieuMuc}: có thể nộp nhầm tiểu mục.` };
    else if (x.boSung) x.docNhanh = { muc: "cao", buoc: 2, nhan: `Tờ khai bổ sung — ${nhanBoSung(x.boSung).toLowerCase()} chưa có chứng từ tương ứng.` };
    else if (x.loai === "THUA" && x.ma === "P4") x.docNhanh = { muc: "thap", nhan: "Chứng từ nơi khác chuyển về: thừa thường là đúng." };
    else if (x.loai === "THUA" && x.ma === "C2" && laHaNoi(x)) x.docNhanh = { muc: "cao", nhan: "Chứng từ nộp tại Hà Nội mà thừa thì chắc chắn có vấn đề, vì doanh nghiệp không tự nộp thừa." };
  }
  const canSoi = soi.sort((a, b) => Math.abs(b.soTien) - Math.abs(a.soTien));

  /* Phân bổ: thừa ở CQT ngoài Hà Nội, nợ treo ở Hà Nội. */
  const noHN = canSoi.filter((x) => x.loai === "NO" && laHaNoi(x));
  const phanBo: PhanBo[] = canSoi.filter((x) => x.loai === "THUA" && !laHaNoi(x)).map((x) => {
    const no = noHN.find((y) => y.tieuMuc === x.tieuMuc) ?? noHN[0];
    return { tinh: x.tenCQT, thua: x.soTien, cqtNo: no?.cqt ?? cqt, tenNo: no?.tenCQT ?? noi.tenCQT, no: no?.soTien ?? 0 };
  });

  /*
    Lũy kế (sheet HETHONG: "Lũy kế TQ" so "Lũy kế File", cột KHỚP). Phần lớn
    khớp; đôi khi Tổng quan TMS có giao dịch chưa kéo về được — khi ấy kết quả
    bắt cặp của tiểu mục ấy chưa đáng tin.
  */
  const r3 = prng(hatCua(96, "qhns-lk", d.khoa));
  const lechTM = r3() < 0.12 ? ns[nguyen(r3, 0, ns.length - 1)]?.tieuMuc : undefined;
  const luyKe: LuyKe[] = ns.map((tm) => {
    const file = dong.filter((x) => x.tieuMuc === tm.tieuMuc).reduce((a, x) => a + giaTri(x), 0);
    const tms = tm.tieuMuc === lechTM ? file + Math.round(quyMo(2025) * 0.03 * (0.5 + r3()) / 1000) * 1000 : file;
    return { tieuMuc: tm.tieuMuc, tenTieuMuc: tenTieuMucTMS(tm.tieuMuc), tms, file };
  });

  return {
    phaiNop, daNop, conPhaiNop: phaiNop - daNop,
    soDong: dong.length, capDaGhep: cap.sort((a, b) => dauCap(a).getTime() - dauCap(b).getTime()), soVong,
    capTheoNguong: theoNguong.length, tongLech: theoNguong.reduce((a, c) => a + c.lech, 0),
    nhomNhieu: cap.filter((c) => c.pn.length + c.dn.length > 2).length,
    doanLuyKe: luyKeCat.length, dongLuyKe: luyKeCat.reduce((a, c) => a + c.pn.length + c.dn.length, 0),
    soTreo,
    canSoi, tuNam, coChuyenDoi,
    soGiaHan: dong.filter((x) => x.hanGoc).length,
    luyKe, phanBo,
    kyHieu: [...new Set(dong.map((x) => x.ma))].sort(),
    ...noi,
  };
}

export { ngayVN as ngayDoiChieu };
