import type { DongDN } from "@/data/qldn";
import { NHAN_CACH, nhanBoSung, ngayDoiChieu, type DongSo, type DongSoi, type KetQuaDoiChieu } from "@/data/doiChieuQHNS";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportValue } from "@/domain/reportExport";

/*
  Kết quả đối chiếu nghĩa vụ ra Excel — biên bản 18/11/2026 §2.3: "file Excel
  highlight các dòng còn lệch kèm gợi ý và nguyên nhân".

  Một sheet, mọi giao dịch của sổ, xếp theo tiểu mục rồi ngày đối chiếu như
  bảng cán bộ đang làm trên công cụ VBA. Dòng đã bắt cặp ghi vòng và cách
  ghép; dòng còn lệch tô đỏ, ghi nguyên nhân bước 1–2 tự tìm được và các bước
  còn phải tra tay. CHƯA CÓ MẪU cột của phòng — cột đặt theo nội dung biên bản.
*/
const LOAI_LECH: Record<DongSoi["loai"], string> = {
  NO: "Còn lệch: thiếu khoản đã nộp",
  THUA: "Còn lệch: thiếu phát sinh phải nộp",
  CHUYEN_DOI: "Còn lệch: dữ liệu chuyển đổi",
};

export async function xuatExcelDoiChieu(d: DongDN, kq: KetQuaDoiChieu) {
  type Hang = { x: DongSo; ketQua: string; soi?: DongSoi };
  const hang: Hang[] = [
    ...kq.capDaGhep.flatMap((c) => [...c.pn, ...c.dn].map((x) => ({ x, ketQua: `Vòng ${c.vong}: ${NHAN_CACH[c.cach]}` }))),
    ...kq.canSoi.map((x) => ({ x, ketQua: LOAI_LECH[x.loai], soi: x })),
  ].sort((a, b) => a.x.tieuMuc.localeCompare(b.x.tieuMuc) || a.x.ngay.getTime() - b.x.ngay.getTime());

  const toDo: number[] = [];
  const rows: ReportValue[][] = hang.map(({ x, ketQua, soi }, i) => {
    if (soi) toDo.push(i);
    const goiY = soi?.docNhanh ? `${soi.docNhanh.buoc ? `Bước ${soi.docNhanh.buoc}: ` : ""}${soi.docNhanh.nhan}` : soi ? "Chưa tìm được tự động" : "";
    /* Bước 1–2 máy đã chạy; chưa ra nguyên nhân thì cán bộ tra tiếp từ bước 3. */
    const traTiep = !soi ? "" : soi.loai === "CHUYEN_DOI" ? soi.buoc.join(" ") : soi.docNhanh?.buoc ? "" : soi.buoc.slice(2).map((b, j) => `${j + 3}. ${b}`).join("\n");
    return [
      i + 1, ngayDoiChieu(x.ngay), x.ma, x.moTa, x.boSung ? nhanBoSung(x.boSung) : "",
      `${x.tieuMuc} · ${x.tenTieuMuc}`, x.cqt ? `${x.cqt} · ${x.tenCQT}` : x.tenCQT,
      x.chieu === "PN" ? x.soTien : null, x.chieu === "DN" ? x.soTien : null,
      ketQua, goiY, traTiep,
    ];
  });

  await exportExcel([{
    name: "DOI_CHIEU", title: `KẾT QUẢ ĐỐI CHIẾU NGHĨA VỤ · ${d.ten} · MST ${d.mst}`, unit: "đồng",
    headers: ["STT", "Ngày đối chiếu", "Ký hiệu", "Nội dung", "Điều chỉnh tờ khai", "Tiểu mục", "Cơ quan thuế", "Phải nộp", "Đã nộp", "Kết quả bắt cặp", "Gợi ý, nguyên nhân", "Tra tiếp"],
    rows, toDo,
    rongCot: [7, 14, 9, 40, 30, 36, 30, 18, 18, 34, 48, 60],
  }], { period: `Từ ${kq.tuNam} đến 31/10/2026`, scope: `${d.ten} · ${d.donVi}`, actor: d.canBo, status: "DRAFT" }, `doi-chieu-nghia-vu_${d.mst}.xlsx`);
}
