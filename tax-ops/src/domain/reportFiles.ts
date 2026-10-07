import type { Cell, SheetData } from "write-excel-file/browser";
import { statusLabel, type ReportMeta, type ReportSheet } from "@/domain/reportExport";

const timestamp = () => new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
function metaLines(meta: ReportMeta) {
  return [`Kỳ báo cáo: ${meta.period} · Trạng thái: ${statusLabel[meta.status]}`, `Phạm vi: ${meta.scope}`, `Người xuất: ${meta.actor} · Thời điểm: ${timestamp()} · DỮ LIỆU MÔ PHỎNG`];
}
export async function exportExcel(sheets: ReportSheet[], meta: ReportMeta, filename: string) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const workbook = sheets.map(s => {
    const merged = (value: string): Cell[] => [{ value, columnSpan: s.headers.length, wrap: true, height: 28 }, ...s.headers.slice(1).map(() => null)];
    /* Sheet mang khuôn riêng ghi thẳng khuôn ấy — xem ghi chú ở `ReportSheet`. */
    const data: SheetData = s.khuon ?? [merged(`${s.title}${s.unit ? ` (${s.unit})` : ""}`), ...metaLines(meta).map(merged), s.headers.map(value => ({ value, fontWeight: "bold", backgroundColor: "#E4DEDC", wrap: true, height: 60 }))];
    const columnName = (index: number) => {
      let result = "", n = index + 1;
      while (n > 0) { n--; result = String.fromCharCode(65 + n % 26) + result; n = Math.floor(n / 26); }
      return result;
    };
    if (!s.khuon) for (let ri = 0; ri < s.rows.length; ri++) data.push(s.rows[ri].map((value, ci): Cell => {
      const additive = typeof value === "number" && !s.percent?.includes(ci) && !(ci === 0 && s.headers[0] === "STT");
      if (additive && s.bold?.includes(ri)) {
        const end = ri === 0 ? s.rows.length : s.bold.find(i => i > ri) ?? s.rows.length;
        const refs = s.rows.map((_, i) => i).filter(i => i > ri && i < end && !s.bold?.includes(i)).map(i => `${columnName(ci)}${i + 6}`);
        if (refs.length) return { value: `SUM(${refs.join(",")})`, type: "Formula", format: "#,##0.########", fontWeight: "bold" };
      }
      return { value: value ?? "—", type: typeof value === "number" ? Number : String, format: typeof value === "number" ? (s.percent?.includes(ci) ? "0.0%" : "#,##0.########") : undefined, fontWeight: s.bold?.includes(ri) ? "bold" : undefined, wrap: true };
    }));
    return {
      sheet: s.name,
      data,
      columns: s.rongCot
        ? s.rongCot.map(width => ({ width }))
        : s.headers.map((h, i) => ({ width: i === 0 && h !== "STT" ? 44 : h === "STT" ? 7 : /Tên|Phòng|Địa bàn|Giá trị/.test(h) ? 38 : 22 })),
      stickyRowsCount: s.dongDinh ?? 5,
      stickyColumnsCount: s.headers[0] === "STT" ? 2 : 1,
    };
  });
  await writeExcelFile(workbook, { fontFamily: "Times New Roman", fontSize: 11 }).toFile(filename);
}
export async function exportWord(sheets: ReportSheet[], meta: ReportMeta, filename: string) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, Footer } = await import("docx");
  const paragraph = (text: string, bold = false) => new Paragraph({ children: [new TextRun({ text, bold, font: "Times New Roman", size: 24 })], spacing: { after: 160 } });
  const sections = [
    { sheet: sheets[0], title: "I. Đánh giá tình hình nợ", indices: [1, 2, 3, 4, 5] },
    { sheet: sheets[2], title: "II. Kết quả cưỡng chế nợ thuế", indices: [0, 2, 4, 6, 7] },
    { sheet: sheets[3], title: "III. Tạm hoãn xuất cảnh", indices: [0, 2, 4, 6, 7] },
    { sheet: sheets[7], title: "IV. Tạm hoãn xuất cảnh đối với NNT trạng thái 06", indices: [0, 2, 4, 7, 5] },
  ];
  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [
    paragraph("THUẾ THÀNH PHỐ HÀ NỘI – PHÒNG QL1", true),
    paragraph("BÁO CÁO ĐÁNH GIÁ CÔNG TÁC NỢ VÀ CƯỠNG CHẾ NỢ THUẾ", true),
    paragraph("KHỐI DOANH NGHIỆP, TỔ CHỨC", true), ...metaLines(meta).map(t => paragraph(t)),
  ];
  for (const { sheet, title, indices } of sections) {
    children.push(paragraph(title, true), paragraph("Đơn vị tính số tiền: triệu đồng."));
    const rows = [indices.map(i => sheet.headers[i]), ...sheet.rows.map(row => indices.map(i => {
      const v = row[i]; return typeof v === "number" ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1, style: sheet.percent?.includes(i) ? "percent" : "decimal" }).format(v) : v ?? "—";
    }))];
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map((row, i) => new TableRow({ tableHeader: i === 0, children: row.map(value => new TableCell({ children: [paragraph(String(value), i === 0)] })) })) }));
  }
  children.push(paragraph("Nhận xét, nguyên nhân và kiến nghị", true), paragraph("Chưa có nội dung nhận xét được phê duyệt cho kỳ này. Không tự suy diễn nguyên nhân từ số liệu mô phỏng."));
  const doc = new Document({ creator: meta.actor, title: "Báo cáo công tác nợ", sections: [{ footers: { default: new Footer({ children: [paragraph("DỮ LIỆU MÔ PHỎNG – Không sử dụng làm báo cáo chính thức.")] }) }, children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
