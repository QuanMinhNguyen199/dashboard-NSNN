import { hatCua, nguyen, prng } from "@/data/ngauNhien";
import { dnTuDanhSach } from "@/data/hoSoQLDN";
import { danhSachNT, laCua, type La } from "@/data/ql5";
import { canBoCua, type CanBoQ, type DongDN, type PhamVi } from "@/data/qldn";
import { doiChieuQHNS, laHaNoi, type DongSoi, type KetQuaDoiChieu } from "@/data/doiChieuQHNS";

/*
  Danh sách đối chiếu nghĩa vụ theo phòng, theo cán bộ — "đích đến" của biên
  bản 11/11/2026 §1: hằng tháng công cụ tự liệt kê những doanh nghiệp đang
  thừa hoặc thiếu, nguyên nhân dự kiến và đơn vị cần mời lên làm việc.

  Theo các điểm đã thống nhất (§3):
  • Sắc thuế: GTGT (tiểu mục 1701) trước, rồi TNCN, TNDN; chưa làm phí, lệ phí.
  • Đối tượng: doanh nghiệp.
  • Chọn mẫu: doanh nghiệp nộp thừa lớn nhất trước, lấy từ danh sách nộp
    thừa đã có (sổ S1, tab Nộp thừa), nhóm trên 1 tỷ và trên 500 triệu.

  Mỗi DN mang đúng số thừa của sổ S1 sang hồ sơ (`thuaS1`), nên số trên danh
  sách, bảng Quan hệ ngân sách và khối Đối chiếu nghĩa vụ là một.
*/

export type SacThue = "GTGT" | "TNCN" | "TNDN";
export const SAC_THUE: { id: SacThue; nhan: string; tm: string[] }[] = [
  { id: "GTGT", nhan: "GTGT · 1701", tm: ["1701"] },
  { id: "TNCN", nhan: "TNCN · 1001–1015", tm: Array.from({ length: 15 }, (_, i) => String(1001 + i)) },
  { id: "TNDN", nhan: "TNDN · 1052, 1053", tm: ["1052", "1053"] },
];
export const NGUONG_MAU = { ty: 1_000_000_000, namTram: 500_000_000 } as const;

/*
  Nguyên nhân dự kiến — NGUYÊN VĂN biên bản 11/11/2026 §2.1, §2.6 và demo
  13/11/2026 §2.2. "Đơn vị cần mời lên làm việc" (§1): doanh nghiệp; trường
  hợp phân bổ thêm tỉnh liên quan (13/11: "cần làm việc với doanh nghiệp, tỉnh
  nào"). Chứng từ nơi khác "thừa thường là đúng" và giao dịch CD không có ai
  để mời — ô để trống.
*/
export type NguyenNhan = "PHAN_BO" | "NHAM_TM" | "THIEU_PS" | "NOI_KHAC" | "THIEU_CT" | "CHUYEN_DOI" | "KHOP";
export const NHAN_NGUYEN_NHAN: Record<NguyenNhan, { nhan: string; moi: (x: DongDC) => string; muc: "cao" | "vua" | "thap" }> = {
  PHAN_BO: { nhan: "Chứng từ phân bổ chưa hạch toán hoặc chuyển sai", moi: (x) => `Doanh nghiệp, ${x.tinh}`, muc: "cao" },
  NHAM_TM: { nhan: "Nộp nhầm tiểu mục hoặc sắc thuế", moi: () => "Doanh nghiệp", muc: "cao" },
  THIEU_PS: { nhan: "Thiếu tờ khai, hoặc nhập thiếu quyết định", moi: () => "Doanh nghiệp", muc: "cao" },
  NOI_KHAC: { nhan: "Chứng từ nơi khác chuyển về", moi: () => "", muc: "thap" },
  THIEU_CT: { nhan: "Chưa nộp", moi: () => "Doanh nghiệp", muc: "vua" },
  CHUYEN_DOI: { nhan: "Giao dịch CD (số dư đầu kỳ)", moi: () => "", muc: "thap" },
  KHOP: { nhan: "", moi: () => "", muc: "thap" },
};

export interface DongDC {
  d: DongDN; la: La; canBo: CanBoQ;
  /** Tổng thừa theo sổ S1 của sắc thuế đang xem, đồng. */
  thuaS1: number;
  /** Sau đối chiếu, trong sắc thuế đang xem: phần thiếu phát sinh và thiếu chứng từ, đồng. */
  thua: number; thieu: number;
  soDong: number;
  nguyenNhan: NguyenNhan;
  tinh: string;
  kq: KetQuaDoiChieu;
}

const boNho = new Map<string, DongDC[]>();

/** Mọi DN trong mẫu của một tháng, trong phạm vi đơn vị đang xem. */
export function danhSachDoiChieu(pv: PhamVi, thang: number, sac: SacThue): DongDC[] {
  const ids = pv.donVi.map((d) => d.id);
  const khoa = `${thang}|${sac}|${ids.join(",")}|${pv.canBo?.id ?? ""}`;
  const co = boNho.get(khoa);
  if (co) return co;
  const tm = new Set(SAC_THUE.find((s) => s.id === sac)!.tm);
  const ds = danhSachNT(thang, "muoiTrieu", laCua(ids))
    .filter((n) => n.dong.some((x) => tm.has(x.tieuMuc) && x.thua > 0))
    .map((n): DongDC | null => {
      const thuaS1 = n.dong.filter((x) => tm.has(x.tieuMuc)).reduce((a, x) => a + x.thua, 0);
      if (thuaS1 <= NGUONG_MAU.namTram) return null;
      const dsCB = canBoCua(n.la.dvId);
      const r = prng(hatCua(97, "dc-cb", n.mst));
      const canBo = dsCB[nguyen(r, 0, dsCB.length - 1)];
      const goc = dnTuDanhSach({ mst: n.mst, ten: n.ten, donVi: n.la.nhan, canBo: canBo.ten });
      const d: DongDN = { ...goc, khoa: `dc.${n.mst}`, cqt: n.la.cqt, thuaS1: n.dong.filter((x) => x.thua > 0).map((x) => ({ tieuMuc: x.tieuMuc, thua: x.thua })) };
      const kq = doiChieuQHNS(d);
      const trong = kq.canSoi.filter((x) => tm.has(x.tieuMuc));
      const tong = (l: DongSoi["loai"]) => trong.filter((x) => x.loai === l).reduce((a, x) => a + Math.abs(x.soTien), 0);
      const pb = trong.find((x) => x.loai === "THUA" && !laHaNoi(x));
      const nguyenNhan: NguyenNhan = pb ? "PHAN_BO"
        : trong.some((x) => x.docNhanh?.nhamTM) ? "NHAM_TM"
        : trong.some((x) => x.loai === "THUA" && x.ma !== "P4") ? "THIEU_PS"
        : trong.some((x) => x.loai === "THUA") ? "NOI_KHAC"
        : trong.some((x) => x.loai === "NO") ? "THIEU_CT"
        : trong.length ? "CHUYEN_DOI" : "KHOP";
      return { d, la: n.la, canBo, thuaS1, thua: tong("THUA"), thieu: tong("NO") + tong("CHUYEN_DOI"), soDong: trong.length, nguyenNhan, tinh: pb?.tenCQT ?? "", kq };
    })
    .filter((x): x is DongDC => Boolean(x))
    .filter((x) => !pv.canBo || x.canBo.id === pv.canBo.id)
    .sort((a, b) => b.thuaS1 - a.thuaS1);
  boNho.set(khoa, ds);
  return ds;
}
