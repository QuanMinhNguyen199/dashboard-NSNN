import type { DongDN } from "@/data/qldn";
import { NHAN_NGUON, ngayDoiChieu, type DongSoi } from "@/data/doiChieuQHNS";

/*
  Thông báo đề nghị NNT giải trình khoản chưa đối chiếu được — bước 4 của quy
  trình mục tiêu (biên bản 09/11/2026 §3.7): "khoản không giải thích được thì
  xuất thông báo gửi NNT".

  CHƯA CÓ MẪU. Biên bản không gửi mẫu thông báo, nên văn bản này là bản nháp
  tạm: một đoạn mở, bảng các khoản, hạn phản hồi để trống cho cán bộ điền.
  Định dạng chữ theo văn bản hành chính (Times New Roman 14) như các tệp
  Word khác của bản mẫu. Có mẫu thì chỉ thay phần nội dung, không thay chỗ
  nút trên màn.
*/
export async function xuatThongBaoDoiChieu(d: DongDN, dong: DongSoi[], canBo: string) {
  const x = await import("docx");
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = x;
  const so = (v: number) => v.toLocaleString("vi-VN");
  const doan = (text: string, o: { b?: boolean; giua?: boolean; i?: boolean } = {}) => new Paragraph({
    alignment: o.giua ? AlignmentType.CENTER : AlignmentType.JUSTIFIED, spacing: { before: 120, after: 120 },
    children: [new TextRun({ text, bold: o.b, italics: o.i })],
  });
  const o = (text: string, b = false, phai = false) => new TableCell({
    children: [new Paragraph({ alignment: phai ? AlignmentType.RIGHT : AlignmentType.LEFT, children: [new TextRun({ text, bold: b, size: 24 })] })],
  });
  const tong = dong.reduce((a, v) => a + (v.chieu === "PN" ? v.soTien : -v.soTien), 0);
  const homNay = new Date();

  const doc = new Document({
    styles: { default: { document: { run: { font: "Times New Roman", size: 28 } } } },
    sections: [{
      properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1701 } } },
      children: [
        doan("THUẾ THÀNH PHỐ HÀ NỘI", { b: true }),
        doan(`Hà Nội, ngày ${homNay.getDate()} tháng ${homNay.getMonth() + 1} năm ${homNay.getFullYear()}`, { i: true }),
        doan("THÔNG BÁO", { b: true, giua: true }),
        doan("Về việc đề nghị giải trình các khoản chưa đối chiếu được với nghĩa vụ thuế", { b: true, giua: true }),
        doan(`Kính gửi: ${d.ten} (MST ${d.mst})`),
        doan("Qua đối chiếu số phải nộp, đã nộp và còn phải nộp của đơn vị trên hệ thống quản lý thuế, cơ quan thuế chưa xác định được nguồn gốc các khoản dưới đây. Đề nghị đơn vị giải trình và gửi kèm chứng từ liên quan."),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ tableHeader: true, children: [o("STT", true), o("Ngày", true), o("Loại khoản", true), o("Tiểu mục", true), o("Số tiền (đồng)", true, true)] }),
            ...dong.map((v, i) => new TableRow({ children: [
              o(String(i + 1)), o(ngayDoiChieu(v.ngay)),
              o(`${v.chieu === "DN" ? "Đã nộp, chưa có nghĩa vụ đối ứng" : "Phải nộp, chưa có chứng từ nộp"} — ${NHAN_NGUON[v.nguon]}: ${v.moTa}`),
              o(`${v.tieuMuc} ${v.tenTieuMuc}`), o(so(v.soTien), false, true),
            ] })),
          ],
        }),
        doan(`Chênh lệch thuần của các khoản trên: ${so(Math.abs(tong))} đồng ${tong >= 0 ? "phải nộp" : "đã nộp"} chưa đối chiếu được.`),
        doan("Thời hạn phản hồi: ……… ngày kể từ ngày nhận thông báo.", { i: true }),
        doan(`Cán bộ quản lý: ${canBo}`),
        doan("Bản nháp tạo từ bản mẫu Quản lý Thuế — số liệu mô phỏng, mẫu thông báo chưa được phía Thuế chốt.", { i: true }),
      ],
    }],
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `thong-bao-doi-chieu_${d.mst}.docx`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
