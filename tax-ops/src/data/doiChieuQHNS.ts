import { hatCua, nguyen, prng } from "@/data/ngauNhien";
import { quanHeNganSach } from "@/data/hoSoQLDN";
import type { DongDN } from "@/data/qldn";

/*
  Đối chiếu nghĩa vụ của một NNT từ khi thành lập — biên bản 09/11/2026 "Họp
  dựng Biểu quan hệ ngân sách" (thư mục general_data/09-11).

  Biểu QHNS là "sao kê ngân hàng" của NNT, 3 cột: phải nộp, đã nộp, còn phải
  nộp. Giai đoạn 1 của biên bản: dựng lại sổ và BẮT CẶP TỰ ĐỘNG thay công cụ
  VBA phía Thuế đang dùng (§3.4):
    1. Dàn mọi dòng phải nộp và đã nộp ra một bảng, xếp theo hạn nộp.
    2. Dòng phải nộp và đã nộp đối ứng nhau thì loại khỏi bảng.
    3. Lặp nhiều vòng; mỗi vòng loại các cặp gần nhau nhất, dòng còn lại dồn
       sát nhau và tạo được cặp mới (thường 5–7 vòng).
    4. Dòng không tìm được cặp là điểm cần soi.
  Ngưỡng lệch cho phép khi ghép (§3.5, "ví dụ 1.000 đồng") để số lẻ khi nộp
  tại ngân hàng, kho bạc vẫn ghép được.

  GIẢ ĐỊNH (chờ tài liệu nghiệp vụ của anh Hòa, việc 1):
  - Chỉ ghép trong cùng tiểu mục, một dòng phải nộp với một dòng đã nộp.
  - "Gần nhau" đọc là khoảng cách trong bảng đã dồn: vòng thứ k xét các dòng
    cách nhau tối đa k vị trí, gần nhất trước. Công cụ VBA chưa được gửi.
  - Ngưỡng 1.000 đồng lấy đúng ví dụ trong họp, chưa phải con số chốt.

  Sổ là SỐ ĐẶT RA, gieo theo DN (hạt 95). Dòng không ghép được dựng khớp với
  bảng Quan hệ ngân sách của cùng hồ sơ: tổng nợ treo = cột "Còn nợ", tổng
  nộp không đối ứng = cột "Nộp thừa" — để hai khối không nói hai số khác.
*/

export const NGUONG_LECH = 1000;
/** TMS chạy từ 2015; trước đó chỉ có "một cục" số dư chuyển đổi (§3.3, §3.5). */
const NAM_TMS = 2015;
/** Dòng phải nộp có hạn đến hết ngày này mới vào sổ. */
const CHOT = new Date(2026, 9, 31);

export type Chieu = "PN" | "DN";
export type NguonDong =
  | "TK" | "KL" | "QD_TT" | "QD_XP" | "CD"   // phải nộp
  | "CT" | "CT_NK";                          // đã nộp
export const NHAN_NGUON: Record<NguonDong, string> = {
  TK: "Tờ khai", KL: "Kết luận thanh tra, kiểm tra", QD_TT: "Quyết định truy thu", QD_XP: "Quyết định xử phạt",
  CD: "Số dư chuyển đổi", CT: "Chứng từ nộp", CT_NK: "Chứng từ nộp nơi khác chuyển về",
};

export interface DongSo {
  id: string;
  chieu: Chieu;
  nguon: NguonDong;
  moTa: string;
  tieuMuc: string;
  tenTieuMuc: string;
  /** Phải nộp: hạn nộp. Đã nộp: ngày nộp. */
  ngay: Date;
  /** Đồng. */
  soTien: number;
}

export interface Cap { pn: DongSo; dn: DongSo; vong: number; lech: number }

export type LoaiSoi = "THUA" | "NO" | "CHUYEN_DOI";
export interface DongSoi extends DongSo { loai: LoaiSoi; goiY: string }

export interface KetQuaDoiChieu {
  phaiNop: number; daNop: number; conPhaiNop: number;
  soDong: number; capDaGhep: Cap[]; soVong: number;
  /** Cặp chỉ ghép được nhờ ngưỡng lệch, và tổng phần lệch còn lại. */
  capTheoNguong: number; tongLech: number;
  canSoi: DongSoi[];
  tuNam: number; coChuyenDoi: boolean;
}

const thangNam = (d: Date) => `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
const ngayVN = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

/* Ba gợi ý chỗ tìm, chép từ cách cán bộ đang dò (§3.6) — không suy thêm. */
function goiYCua(x: DongSo, loai: LoaiSoi) {
  if (loai === "CHUYEN_DOI") return "Số dư chuyển từ ứng dụng trước TMS chỉ là một cục, không có chi tiết từng năm — coi là nguồn gốc sơ khai. Cần dữ liệu ứng dụng trước TMS và bảng map tiểu mục cũ – mới để tách.";
  if (loai === "THUA") return `Tiền nộp không có nghĩa vụ đối ứng. Quay lại tháng ${thangNam(x.ngay)}: tìm trên TMS tờ khai treo (chưa hạch toán) hoặc tờ khai chính lệch phụ lục; tìm trên eDoc theo MST quyết định truy thu, xử phạt, kết luận thanh tra, kiểm toán chưa được nhập.`;
  return "Nghĩa vụ chưa có chứng từ nộp đối ứng. Kiểm tra chứng từ nộp nơi khác, bù trừ, điều chỉnh chưa chuyển về; không có thì đây là khoản NNT còn nợ.";
}

/*
  Bắt cặp nhiều vòng. Mỗi tiểu mục một bảng riêng, xếp theo ngày. Vòng k:
  với mỗi dòng còn lại, tìm dòng chiều ngược lại trong cửa sổ k vị trí, số
  tiền lệch không quá ngưỡng, gần nhất trước. Hết vòng thì dồn bảng. Dừng khi
  một vòng (cửa sổ đã từ 3 trở lên) không ghép thêm được cặp nào.
*/
function batCap(dong: DongSo[]) {
  const theoTM = new Map<string, DongSo[]>();
  for (const x of dong) theoTM.set(x.tieuMuc, [...(theoTM.get(x.tieuMuc) ?? []), x]);
  const cap: Cap[] = [];
  let soVong = 0;
  const conLai: DongSo[] = [];
  for (const ds of theoTM.values()) {
    let bang = [...ds].sort((a, b) => a.ngay.getTime() - b.ngay.getTime() || (a.chieu === "PN" ? -1 : 1));
    for (let k = 1; k <= 12 && bang.length > 1; k++) {
      const da = new Set<number>();
      for (let i = 0; i < bang.length; i++) {
        if (da.has(i)) continue;
        let tot = -1;
        for (let d = 1; d <= k && tot < 0; d++) {
          for (const j of [i + d, i - d]) {
            if (j < 0 || j >= bang.length || da.has(j)) continue;
            if (bang[j].chieu !== bang[i].chieu && Math.abs(bang[j].soTien - bang[i].soTien) <= NGUONG_LECH) { tot = j; break; }
          }
        }
        if (tot < 0) continue;
        da.add(i); da.add(tot);
        const [pn, dn] = bang[i].chieu === "PN" ? [bang[i], bang[tot]] : [bang[tot], bang[i]];
        cap.push({ pn, dn, vong: k, lech: pn.soTien - dn.soTien });
      }
      if (da.size) soVong = Math.max(soVong, k);
      bang = bang.filter((_, i) => !da.has(i));
      if (!da.size && k >= 3) break;
    }
    conLai.push(...bang);
  }
  return { cap, soVong, conLai };
}

export function doiChieuQHNS(d: DongDN): KetQuaDoiChieu {
  const r = prng(hatCua(95, "qhns-so", d.khoa));
  const ns = quanHeNganSach(d);
  const tw = ns.reduce((a, x) => a + Math.max(x.daNop, 1), 0);
  const tuNam = Math.max(d.namThanhLap, NAM_TMS);
  const coChuyenDoi = d.namThanhLap < NAM_TMS;
  const dong: DongSo[] = [];
  let n = 0;
  const them = (x: Omit<DongSo, "id">) => { const v = { ...x, id: `${x.tieuMuc}-${++n}` }; dong.push(v); return v; };
  /* Một năm của DN cỡ này nộp chừng `thu2026` tỷ; năm cũ nhỏ hơn. */
  const quyMo = (nam: number) => d.thu2026 * 1e9 * Math.pow(0.9, 2026 - nam);

  for (const tm of ns) {
    const ty = Math.max(tm.daNop, 1) / tw;
    const goc = { tieuMuc: tm.tieuMuc, tenTieuMuc: tm.ten };
    const noTreo = tm.conNo * 1e6;
    const thua = tm.thua * 1e6;
    /* Nợ treo nằm ở số dư chuyển đổi (DN cũ, đôi khi) hoặc ở nghĩa vụ gần nhất. */
    const noOChuyenDoi = noTreo > 0 && coChuyenDoi && r() < 0.4;
    const tra = (pn: DongSo, treSau = 0) => {
      const ngay = new Date(pn.ngay);
      ngay.setDate(ngay.getDate() - nguyen(r, 0, 6) + treSau);
      /* Số lẻ (§3.5): nộp tròn nghìn, để lại chênh vài trăm đồng. */
      const le = r() < 0.12;
      const soTien = le ? Math.floor(pn.soTien / 1000) * 1000 : pn.soTien;
      const nk = r() < 0.08;
      them({ ...goc, chieu: "DN", nguon: nk ? "CT_NK" : "CT", ngay, soTien, moTa: nk ? "Nộp tại nơi khác, chuyển về trụ sở" : `Nộp cho ${pn.moTa.toLowerCase()}` });
    };

    if (coChuyenDoi) {
      const soDu = noOChuyenDoi ? noTreo : Math.round(quyMo(2014) * ty * (0.05 + r() * 0.2));
      const pn = them({ ...goc, chieu: "PN", nguon: "CD", ngay: new Date(2014, 11, 31), soTien: soDu, moTa: "Số dư nợ chuyển từ ứng dụng trước TMS" });
      if (!noOChuyenDoi) tra(pn, nguyen(r, 20, 200));
    }

    const cacPN: DongSo[] = [];
    for (let nam = tuNam; nam <= 2026; nam++) {
      const tren = quyMo(nam) * ty;
      /* Thuế TNDN quyết toán năm; các tiểu mục khác khai theo quý. */
      const ky = tm.tieuMuc === "1052"
        ? [{ moTa: `Tờ khai quyết toán năm ${nam}`, han: new Date(nam + 1, 2, 31), w: 1 }]
        : [1, 2, 3, 4].map((q) => ({ moTa: `Tờ khai quý ${q}/${nam}`, han: new Date(nam, q * 3 + 1, 0), w: 0.25 }));
      for (const k of ky) {
        if (k.han > CHOT) continue;
        cacPN.push(them({ ...goc, chieu: "PN", nguon: "TK", ngay: k.han, soTien: Math.round(tren * k.w * (0.75 + r() * 0.5)) + nguyen(r, 0, 999), moTa: k.moTa }));
      }
      /* Thỉnh thoảng một kết luận hoặc quyết định của cơ quan thuế. */
      if (r() < 0.1) {
        const nguon = (["KL", "QD_TT", "QD_XP"] as const)[nguyen(r, 0, 2)];
        const han = new Date(nam, nguyen(r, 1, 10), nguyen(r, 1, 28));
        if (han <= CHOT) cacPN.push(them({ ...goc, chieu: "PN", nguon, ngay: han, soTien: Math.round(tren * (0.02 + r() * 0.08) / 1000) * 1000, moTa: `${NHAN_NGUON[nguon]} số ${nguyen(r, 10, 980)}/QĐ-${nam}` }));
      }
    }
    cacPN.sort((a, b) => a.ngay.getTime() - b.ngay.getTime());

    /* Nghĩa vụ gần nhất mang khoản nợ treo, không có chứng từ đối ứng. */
    const pnNo = noTreo > 0 && !noOChuyenDoi ? cacPN[cacPN.length - 1] : null;
    if (pnNo) pnNo.soTien = noTreo;
    for (const pn of cacPN) {
      if (pn === pnNo) continue;
      /* Khoảng một phần năm nộp chậm, sau cả hạn kỳ kế — để cần nhiều vòng. */
      tra(pn, r() < 0.2 ? nguyen(r, 60, 150) : 0);
    }

    /* Khoản nộp không có nghĩa vụ đối ứng = cột "Nộp thừa". */
    if (thua > 0) {
      const nam = Math.max(tuNam, 2026 - nguyen(r, 1, 6));
      them({ ...goc, chieu: "DN", nguon: "CT", ngay: new Date(nam, nguyen(r, 0, 11), nguyen(r, 1, 28)), soTien: thua, moTa: "Chứng từ nộp tiền" });
    }
  }

  const { cap, soVong, conLai } = batCap(dong);
  const phaiNop = dong.filter((x) => x.chieu === "PN").reduce((a, x) => a + x.soTien, 0);
  const daNop = dong.filter((x) => x.chieu === "DN").reduce((a, x) => a + x.soTien, 0);
  const theoNguong = cap.filter((c) => c.lech !== 0);
  const canSoi: DongSoi[] = conLai
    .map((x) => {
      const loai: LoaiSoi = x.nguon === "CD" ? "CHUYEN_DOI" : x.chieu === "DN" ? "THUA" : "NO";
      return { ...x, loai, goiY: goiYCua(x, loai) };
    })
    .sort((a, b) => b.soTien - a.soTien);
  return {
    phaiNop, daNop, conPhaiNop: phaiNop - daNop,
    soDong: dong.length, capDaGhep: cap.sort((a, b) => a.pn.ngay.getTime() - b.pn.ngay.getTime()), soVong,
    capTheoNguong: theoNguong.length, tongLech: theoNguong.reduce((a, c) => a + c.lech, 0),
    canSoi, tuNam, coChuyenDoi,
  };
}

export { ngayVN as ngayDoiChieu };
