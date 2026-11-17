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
    3. Vòng 1: khoản nào khớp 1–1 thì nhấc ra. Vòng 2 trở đi: ghép 2–4 khoản
       gần nhau cộng lại, khớp thì nhấc tiếp (§2.1). "Gần nhau" là trong cửa
       sổ khoảng 7 dòng như công cụ VBA đang quét (§2.6). Hết vòng thì dồn
       bảng và chạy lại.
    4. Khoản còn lại là điểm cần soi. Khoản dương (phải nộp chưa có chứng từ)
       tính tiền chậm nộp; khoản âm (đã nộp không có phát sinh) không tính.

  Nhãn của hai loại dòng còn lại lấy theo sheet TS của công cụ RSNT_GTGT_CUC:
  "thiếu khoản đã nộp (C2, ĐC…)" và "thiếu phát sinh phải nộp (TK, QT, QĐ…)".

  GIẢ ĐỊNH CÒN LẠI (chưa xác nhận):
  - Ngưỡng lệch 1.000 đồng: ví dụ trong họp 09/11, chưa phải con số chốt.
  - Ghép trong cùng tiểu mục và cùng CQT.
  - Chưa áp quy tắc hạch toán theo từng mốc thông tư (TT156 / TT80 / TT89:
    tờ khai GTGT 7 chỉ tiêu trước 2018, tờ khai bổ sung lấy số ở bảng kê, quyết
    toán TNCN trước/sau 2020) — chờ file quy tắc của anh Hòa (11/11, việc 4).
  - Trước 2015 vẫn là một giao dịch CD (số dư đầu kỳ) — chờ dữ liệu QLT
    1999–2014 của anh Tân (11/11, việc 5).

  Sổ là SỐ ĐẶT RA, gieo theo DN (hạt 95). Dòng không ghép được dựng khớp với
  bảng Quan hệ ngân sách của cùng hồ sơ: tổng nợ treo = cột "Còn nợ", tổng
  nộp không đối ứng = cột "Nộp thừa" — để hai khối không nói hai số khác.
*/

export const NGUONG_LECH = 1000;
/** Cửa sổ quét của công cụ VBA phía Thuế (biên bản 11/11 §2.6). */
export const CUA_SO = 7;
/** Một nhóm ghép tối đa: một khoản và 2–4 khoản đối ứng (§2.1). */
const NHOM_TOI_DA = 5;
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
  /** Đồng, giữ dấu của giao dịch: DP có thể âm, HC âm. */
  soTien: number;
}

/** Giá trị có dấu trong phép cộng trừ: phải nộp dương, đã nộp âm. */
export const giaTri = (x: DongSo) => (x.chieu === "PN" ? x.soTien : -x.soTien);
export const laHaNoi = (x: { cqt: string }) => x.cqt !== "";
/** "TK · TK tháng/quý/năm" — chú giải ký hiệu theo danh mục TMS. */
export const nhanMa = (ma: string) => `${ma} · ${moTaGD(ma)}`;

export interface Cap { pn: DongSo[]; dn: DongSo[]; vong: number; lech: number }
/** Ngày của nhóm: hạn của khoản phải nộp đầu; nhóm chỉ có chứng từ (C2 + HC) lấy ngày nộp. */
export const dauCap = (c: Cap) => (c.pn[0] ?? c.dn[0]).ngay;

/** NO: phải nộp, thiếu chứng từ nộp. THUA: đã nộp, thiếu phát sinh. */
export type LoaiSoi = "THUA" | "NO" | "CHUYEN_DOI";
export interface DocNhanh { muc: "cao" | "thap"; nhan: string; nhamTM?: true }
export interface DongSoi extends DongSo {
  loai: LoaiSoi;
  /** Các bước tra theo thứ tự cán bộ đề xuất (biên bản 11/11 §2.6). */
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
  /** Cặp chỉ ghép được nhờ ngưỡng lệch, và tổng phần lệch còn lại. */
  capTheoNguong: number; tongLech: number;
  /** Nhóm ghép từ 3 khoản trở lên (vòng 2 trở đi). */
  nhomNhieu: number;
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
  Bước tra — NGUYÊN VĂN biên bản 11/11/2026 (§2.1, §2.4, §2.6, §3), không
  viết thêm (người dùng chốt 16/11/2026: bám sát tài liệu).
*/
function buocCua(_x: DongSo, loai: LoaiSoi): string[] {
  if (loai === "CHUYEN_DOI") return [
    "Dữ liệu chuyển từ hệ thống cũ sang TMS nằm thành một giao dịch CD duy nhất (số dư đầu kỳ).",
    "Sau đó thay CD bằng dữ liệu chi tiết giai đoạn 1999–2014 từ anh Tân.",
  ];
  if (loai === "THUA") return [
    "Tra hệ thống quyết định (edoc) xem trong kỳ có quyết định phạt, truy thu hoặc quyết định khác chưa nhập không.",
    "Tra tờ khai bị treo, bị từ chối, hoặc doanh nghiệp chưa nộp lại sau khi bị từ chối; cảnh báo để đôn đốc.",
    "Cuối cùng mới mời doanh nghiệp lên làm việc.",
  ];
  return [
    "Khoản còn lại không có gì tương ứng thì yêu cầu doanh nghiệp giải trình.",
    "Khoản dương tính tiền chậm nộp, khoản âm không tính.",
  ];
}

/* ---------- Bắt cặp ---------- */

/** Mọi tổ hợp `k` phần tử của `ds`, theo thứ tự xuất hiện. */
function toHop<T>(ds: T[], k: number): T[][] {
  if (k === 0) return [[]];
  const ra: T[][] = [];
  for (let i = 0; i <= ds.length - k; i++) for (const c of toHop(ds.slice(i + 1), k - 1)) ra.push([ds[i], ...c]);
  return ra;
}

/*
  Mỗi (tiểu mục, CQT) một bảng, xếp theo ngày đối chiếu. Vòng k ghép nhóm tối
  đa k + 1 khoản (vòng 1: cặp 1–1; từ vòng 4: tới 5 khoản = một khoản và 4
  khoản đối ứng). Với mỗi dòng còn lại, xét các dòng trong cửa sổ 7 dòng tính
  từ nó: nhóm nào có cả khoản dương lẫn khoản âm và cộng lại bằng 0 (trong
  ngưỡng lệch) thì nhấc ra; nhóm nhỏ trước, khớp đúng trước khớp theo ngưỡng.
  Hết vòng thì dồn bảng. Dừng khi một vòng ở cỡ nhóm lớn nhất không nhấc
  thêm được gì.
*/
function batCap(dong: DongSo[]) {
  const theoBang = new Map<string, DongSo[]>();
  for (const x of dong) { const k = `${x.tieuMuc}|${x.cqt}|${x.tenCQT}`; theoBang.set(k, [...(theoBang.get(k) ?? []), x]); }
  const cap: Cap[] = [];
  let soVong = 0;
  const conLai: DongSo[] = [];
  for (const ds of theoBang.values()) {
    let bang = [...ds].sort((a, b) => a.ngay.getTime() - b.ngay.getTime() || (a.chieu === "PN" ? -1 : 1));
    for (let k = 1; k <= 10 && bang.length > 1; k++) {
      const coNhom = Math.min(k + 1, NHOM_TOI_DA);
      const da = new Set<number>();
      for (let i = 0; i < bang.length; i++) {
        if (da.has(i)) continue;
        const cuaSo: number[] = [];
        for (let j = i + 1; j < bang.length && cuaSo.length < CUA_SO - 1; j++) if (!da.has(j)) cuaSo.push(j);
        let tot: number[] | null = null;
        for (const chat of [true, false]) {
          for (let s = 2; s <= coNhom && !tot; s++) {
            for (const c of toHop(cuaSo, s - 1)) {
              const nhom = [i, ...c];
              const g = nhom.map((j) => giaTri(bang[j]));
              if (!g.some((v) => v > 0) || !g.some((v) => v < 0)) continue;
              const tong = g.reduce((a, b) => a + b, 0);
              if (chat ? tong === 0 : Math.abs(tong) <= NGUONG_LECH) { tot = nhom; break; }
            }
          }
          if (tot) break;
        }
        if (!tot) continue;
        for (const j of tot) da.add(j);
        const x = tot.map((j) => bang[j]);
        cap.push({ pn: x.filter((v) => v.chieu === "PN"), dn: x.filter((v) => v.chieu === "DN"), vong: k, lech: x.reduce((a, v) => a + giaTri(v), 0) });
      }
      if (da.size) soVong = Math.max(soVong, k);
      bang = bang.filter((_, i) => !da.has(i));
      if (!da.size && coNhom === NHOM_TOI_DA) break;
    }
    conLai.push(...bang);
  }
  return { cap, soVong, conLai };
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
    const pnNo = noTreo > 0 && !noOChuyenDoi ? cacPN.filter((x) => !dpCua.has(x)).at(-1) ?? null : null;
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
      const gop = { ...pn, soTien: pn.soTien + dp };
      /* Thỉnh thoảng một chứng từ nộp chung hai kỳ liền nhau. */
      const ke = cacPN[i + 1];
      if (ke && ke !== pnNo && !dpCua.has(ke) && r() < 0.06) {
        tra([gop, ke], 0, false); i++; continue;
      }
      /* Khoảng một phần năm nộp chậm, sau cả hạn kỳ kế — để cần nhiều vòng. */
      tra([gop], r() < 0.2 ? nguyen(r, 60, 150) : 0, !dp);
    }

    /* Khoản nộp không có nghĩa vụ đối ứng = cột "Nộp thừa". */
    if (thua > 0) {
      const nam = Math.max(tuNam, 2026 - nguyen(r, 1, 6));
      const nk = tm !== tmThua || !nhamTM ? r() < 0.3 : false;
      them({ ...goc, ma: nk ? "P4" : "C2", chieu: "DN", ngay: new Date(nam, nguyen(r, 0, 11), nguyen(r, 1, 28)), soTien: thua, moTa: moTaGD(nk ? "P4" : "C2") });
    }
    /* Chứng từ phân bổ chuyển sai: tiền vào CQT tỉnh khác, nợ cùng số vẫn treo ở Hà Nội. */
    if (phanBo > 0) {
      them({ ...goc, cqt: "", tenCQT: tm.phanBo!.tinh, ma: "P3", chieu: "DN", ngay: cong(CHOT, -nguyen(r, 20, 200)), soTien: phanBo, moTa: moTaGD("P3") });
    }
  }

  const { cap, soVong, conLai } = batCap(dong);
  const phaiNop = dong.filter((x) => x.chieu === "PN").reduce((a, x) => a + x.soTien, 0);
  const daNop = dong.filter((x) => x.chieu === "DN").reduce((a, x) => a + x.soTien, 0);
  const theoNguong = cap.filter((c) => c.lech !== 0);
  const soi = conLai.map((x) => {
    const loai: LoaiSoi = x.ma === "CD" ? "CHUYEN_DOI" : giaTri(x) < 0 ? "THUA" : "NO";
    return { ...x, loai, buoc: buocCua(x, loai) } as DongSoi;
  });
  /* Đọc nhanh — nguyên văn biên bản 11/11/2026 §2.6. Phân bổ liên tỉnh đã có
     dải cảnh báo ở đầu khối (biên bản 13/11), không lặp trên từng dòng. */
  for (const x of soi) {
    const nham = soi.some((y) => y !== x && y.tieuMuc !== x.tieuMuc && y.loai !== x.loai && y.loai !== "CHUYEN_DOI" && x.loai !== "CHUYEN_DOI" && Math.abs(y.soTien - x.soTien) <= NGUONG_LECH);
    if (nham) x.docNhanh = { muc: "cao", nhamTM: true, nhan: "Nộp nhầm tiểu mục hoặc sắc thuế; cùng một đơn vị có thể vừa thừa chỗ này, thiếu chỗ kia." };
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
    canSoi, tuNam, coChuyenDoi,
    soGiaHan: dong.filter((x) => x.hanGoc).length,
    luyKe, phanBo,
    kyHieu: [...new Set(dong.map((x) => x.ma))].sort(),
    ...noi,
  };
}

export { ngayVN as ngayDoiChieu };
