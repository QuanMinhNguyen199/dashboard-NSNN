import type { KyQ } from "@/data/qldn";
import {
  DON_VI_KT, PHONG_KT, binhQuan, soLieuKT, tyLeDonDoc, tyLeHT,
  type ChiSoKT, type DonViKT, type PhamViKT,
} from "@/data/kiemTra";

/*
  Xuất Word "Báo cáo kết quả kiểm tra" (03/11/2026) theo mẫu "Báo cáo tuần bc
  Trưởng Thuế TP (11.09.2026) - BC AI.doc" của thư mục 03-11.

  Mẫu là văn bản LỜI VĂN của Phòng Kiểm tra số 1 gửi Trưởng Thuế TP, không
  phải bảng: phần I.1 kết quả chung, I.2 kết quả đích danh; mỗi phần nói
  toàn ngành, Khối VP, Khối Thuế cơ sở rồi "Nhận xét chung" nêu đơn vị cao
  nhất / thấp nhất. Bảng chi tiết là "Phụ lục 1" — chính tệp Excel của bảng.

  ĐỊNH DẠNG chép từ tệp mẫu: A4, lề trên 709 / phải 1152 / dưới 993 / trái
  1440 twip; Times New Roman 14; đoạn canh đều, thụt dòng đầu 720 twip, cách
  trước / sau 6pt; trang đầu không số trang, trang sau số trang giữa đầu
  trang.

  Hai chỗ KHÁC mẫu, có chủ đích:
  - Mẫu so "với tuần trước"; dữ liệu demo chốt theo tháng nên so "với tháng
    trước" (tháng 1 thì bỏ vế so sánh).
  - Mẫu ghi "Dữ liệu kết xuất trên hệ thống WebTTR ngày …"; số ở đây là mô
    phỏng, nên dòng nguồn và chân trang nói đúng như vậy.
*/

const tyDong = (trieu: number) => trieu / 1000;
/** "4.549 tỷ" khi từ 1.000 tỷ, "285,5 tỷ" khi nhỏ hơn — như mẫu. */
const soTy = (trieu: number) => {
  const t = tyDong(trieu);
  return Math.abs(t) >= 1000 ? Math.round(t).toLocaleString("vi-VN") : t.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
};
const phanTram = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);
const so = (x: number) => x.toLocaleString("vi-VN");
/** Bình quân / cuộc: "1,27 tỷ đồng/cuộc" từ 1 tỷ, "335,5 trđồng/cuộc" dưới 1 tỷ. */
const bqCuoc = (trieu: number | null) => (trieu === null ? "—" : trieu >= 1000
  ? `${(trieu / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ đồng/cuộc`
  : `${trieu.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} trđồng/cuộc`);
const tongXuLy = (c: ChiSoKT) => c.thuNay + c.giamKT + c.giamLo;
const tangGiam = (nay: number, truoc: number | null, donVi: string, dinhDang: (x: number) => string) =>
  truoc === null ? "" : `, ${nay >= truoc ? "tăng" : "giảm"} ${dinhDang(Math.abs(nay - truoc))} ${donVi} so với tháng trước`;

type Phan = "chung" | "dichDanh";

export async function xuatWordKiemTra(ky: KyQ, actor: string) {
  const d = await import("docx");
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, LevelFormat, Header, Footer, PageNumber } = d;

  const ngay = new Date(2026, ky.thang, 0);
  const dd = String(ngay.getDate()).padStart(2, "0"), mm = String(ky.thang).padStart(2, "0");
  const lay = (id: PhamViKT, phan: Phan, thang = ky.thang) => soLieuKT(id, thang)[phan];
  const truoc = (id: PhamViKT, phan: Phan) => (ky.thang > 1 ? lay(id, phan, ky.thang - 1) : null);

  /* ---------- Khuôn đoạn ---------- */
  type Chu = string | { t: string; b?: boolean; i?: boolean };
  const run = (c: Chu, goc: { b?: boolean; i?: boolean } = {}) => typeof c === "string"
    ? new TextRun({ text: c, bold: goc.b, italics: goc.i })
    : new TextRun({ text: c.t, bold: c.b ?? goc.b, italics: c.i ?? goc.i });
  const doan = (chu: Chu[], o: { b?: boolean; i?: boolean; thut?: number; giua?: boolean; phai?: boolean; cach?: boolean } = {}) => new Paragraph({
    alignment: o.giua ? AlignmentType.CENTER : o.phai ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
    indent: o.giua || o.phai ? undefined : { firstLine: o.thut ?? 720 },
    spacing: o.cach === false ? { before: 0, after: 0 } : { before: 120, after: 120 },
    children: chu.map((c) => run(c, o)),
  });
  const cham = (chu: Chu[]) => new Paragraph({ numbering: { reference: "cham", level: 0 }, alignment: AlignmentType.JUSTIFIED, children: chu.map((c) => run(c, { b: true })) });
  /* Vạch ngắn dưới tên cơ quan và quốc hiệu, như mẫu: đoạn rỗng có viền dưới, thu hẹp bằng thụt hai bên. */
  const vach = (thut: number) => new Paragraph({ indent: { left: thut, right: thut }, spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } }, children: [] });
  const KHONG = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

  /* ---------- Câu chữ của một khối ---------- */
  const hoanThanh = (ten: string, id: PhamViKT, phan: Phan, chuGiao: string) => {
    const c = lay(id, phan), t = truoc(id, phan);
    return doan([{ t: `- Lũy kế đến thời điểm báo cáo, ${ten} hoàn thành:`, i: true },
      ` ${so(c.htNay)} cuộc kiểm tra${tangGiam(c.htNay, t?.htNay ?? null, "cuộc", so)}, đạt ${phanTram(tyLeHT(c))} so với ${chuGiao}.`]);
  };
  const ketQua = (id: PhamViKT, phan: Phan) => {
    const c = lay(id, phan), t = truoc(id, phan);
    return doan([{ t: "- Tổng kết quả xử lý qua kiểm tra thực hiện:", i: true },
      ` ${soTy(tongXuLy(c))} tỷ đồng${tangGiam(tyDong(tongXuLy(c)), t ? tyDong(tongXuLy(t)) : null, "tỷ đồng", (x) => soTy(x * 1000))}; trong đó: Tổng thuế truy thu, truy hoàn và phạt: ${soTy(c.thuNay)} tỷ; Giảm khấu trừ: ${soTy(c.giamKT)} tỷ; Giảm lỗ: ${soTy(c.giamLo)} tỷ; Bình quân thực hiện ${bqCuoc(binhQuan(c))}. Tỷ lệ đôn đốc vào NSNN sau kiểm tra: ${phanTram(tyLeDonDoc(c))}.`]);
  };

  /* ---------- Nhận xét: cao nhất / thấp nhất ---------- */
  const xep = (ds: DonViKT[], phan: Phan, gia: (c: ChiSoKT) => number | null) =>
    ds.map((x) => ({ x, c: lay(x.id, phan), g: gia(lay(x.id, phan)) })).filter((r) => r.g !== null).sort((a, b) => b.g! - a.g!);
  const TCS = DON_VI_KT.filter((x) => x.khoi === "TCS");
  const lietKe = (ds: { x: DonViKT; c: ChiSoKT }[], mo: (c: ChiSoKT) => string) => ds.map((r) => `${r.x.ten} (${mo(r.c)})`).join("; ");
  const dat = (chuGiao: string) => (c: ChiSoKT) => `${so(c.htNay)} cuộc, đạt ${phanTram(tyLeHT(c))} so với ${chuGiao}`;
  const bq = (c: ChiSoKT) => bqCuoc(binhQuan(c));
  const nhan = (t: string) => doan([t], { b: true, i: true });
  const y = (t: string) => doan([t]);

  const khoi = (phan: Phan) => {
    const dichDanh = phan === "dichDanh";
    const chuGiao = dichDanh ? "kế hoạch giao đích danh" : "chỉ tiêu nhiệm vụ giao năm 2026";
    const tn = lay("TN", phan), vp = lay("VP", phan), tcs = lay("TCS", phan);
    const out: InstanceType<typeof Paragraph>[] = [
      doan([dichDanh ? "2. Kết quả kiểm tra đích danh năm 2026" : "1. Kết quả thực hiện công tác kiểm tra năm 2026"], { b: true, thut: 567, cach: false }),
      doan([`(Dữ liệu mô phỏng, lũy kế đến ngày `, { t: `${dd}/${mm}/2026`, b: true }, ")"], { thut: 567, cach: false }),
      cham(["Toàn ngành: ", { t: "(Chi tiết theo Phụ lục 1)", i: true }]),
      doan([dichDanh
        ? `Kế hoạch giao đích danh toàn ngành năm 2026 là ${so(tn.giao)} DN; trong đó: Khối Văn phòng Thuế Thành phố Hà Nội: ${so(vp.giao)} DN; Khối Thuế cơ sở: ${so(tcs.giao)} DN.`
        : `Nhiệm vụ Cục Thuế giao năm 2026: Toàn ngành: ${so(tn.giao)} DN, trong đó: Khối Văn phòng Thuế Hà Nội: ${so(vp.giao)} DN; Khối Thuế cơ sở: ${so(tcs.giao)} DN.`]),
      doan([{ t: "- Lũy kế đến thời điểm báo cáo toàn ngành hoàn thành:", i: true },
        ` ${so(tn.htNay)} cuộc kiểm tra${tangGiam(tn.htNay, truoc("TN", phan)?.htNay ?? null, "cuộc kiểm tra", so)}, đạt ${phanTram(tyLeHT(tn))} so với ${chuGiao}. Trong đó: Khối VP Thuế Hà Nội hoàn thành ${so(vp.htNay)} cuộc; Khối Thuế cơ sở hoàn thành ${so(tcs.htNay)} cuộc.`]),
      ketQua("TN", phan),
      cham(["Khối VP Thuế Hà Nội:"]),
      hoanThanh("khối VP Thuế Hà Nội", "VP", phan, chuGiao),
      ketQua("VP", phan),
    ];
    /* Nhận xét về năm Phòng Kiểm tra: mẫu chỉ có ở phần đích danh. */
    if (dichDanh) {
      const ht = xep(PHONG_KT, phan, tyLeHT), b = xep(PHONG_KT, phan, binhQuan);
      out.push(nhan("Nhận xét chung:"), nhan("- Tỷ lệ hoàn thành so với kế hoạch giao đích danh:"),
        y(`+ Phòng Kiểm tra có tỷ lệ hoàn thành cao nhất là: ${lietKe(ht.slice(0, 1), dat(chuGiao))}`),
        y(`+ Phòng Kiểm tra có tỷ lệ hoàn thành thấp nhất là: ${lietKe(ht.slice(-1), dat(chuGiao))}`),
        nhan("- Số truy thu bình quân/ cuộc:"),
        y(`+ Phòng Kiểm tra có số thu bình quân/cuộc cao nhất là: ${lietKe(b.slice(0, 1), bq)}`),
        y(`+ Phòng Kiểm tra có số thu bình quân/cuộc thấp nhất là: ${lietKe(b.slice(-1), bq)}`));
    }
    const ht = xep(TCS, phan, tyLeHT), b = xep(TCS, phan, binhQuan);
    const tyLe = (c: ChiSoKT) => `đạt ${phanTram(tyLeHT(c))}${dichDanh ? " so với kế hoạch giao đích danh" : ""}`;
    out.push(cham(["Khối Thuế cơ sở:"]),
      hoanThanh("khối Thuế cơ sở", "TCS", phan, chuGiao),
      ketQua("TCS", phan),
      nhan("Nhận xét chung:"), nhan(`- Tỷ lệ hoàn thành so với ${chuGiao}:`),
      ...(dichDanh ? [y(`+ Thuế cơ sở có tỷ lệ hoàn thành cao nhất là: ${lietKe(ht.slice(0, 3), tyLe)}.`)] : []),
      y(`+ Thuế cơ sở có tỷ lệ hoàn thành thấp nhất là: ${lietKe(ht.slice(-3).reverse(), tyLe)}.`),
      nhan("- Số truy thu bình quân/ cuộc:"),
      y(`+ Thuế cơ sở có bình quân/1 cuộc thấp nhất là: ${lietKe(b.slice(-3).reverse(), bq)}.`),
      ...(dichDanh ? [y(`+ Thuế cơ sở có bình quân/1 cuộc cao nhất là: ${lietKe(b.slice(0, 3), bq)}.`)] : []));
    return out;
  };

  /* ---------- Đầu văn bản: hai cột không viền, chữ 13 như mẫu ---------- */
  const dong13 = (t: string, gach = false) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: t, bold: true, size: 26, underline: gach ? {} : undefined })] });
  const o = (children: InstanceType<typeof Paragraph>[], rong: number) => new TableCell({ width: { size: rong, type: WidthType.DXA }, borders: { top: KHONG, bottom: KHONG, left: KHONG, right: KHONG }, children });
  const dau = new Table({
    width: { size: 9600, type: WidthType.DXA }, columnWidths: [3700, 5900], indent: { size: -300, type: WidthType.DXA },
    borders: { top: KHONG, bottom: KHONG, left: KHONG, right: KHONG, insideHorizontal: KHONG, insideVertical: KHONG },
    rows: [new TableRow({ children: [
      o([dong13("THUẾ THÀNH PHỐ HÀ NỘI"), dong13("Phòng Kiểm tra số 1"), vach(1150)], 3700),
      o([dong13("CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM"), dong13("Độc lập - Tự do - Hạnh phúc"), vach(1450)], 5900),
    ] })],
  });

  const doc = new Document({
    creator: actor, title: `Báo cáo kết quả kiểm tra đến ngày ${dd}/${mm}/2026`,
    styles: { default: { document: { run: { font: "Times New Roman", size: 28 } } } },
    numbering: { config: [{ reference: "cham", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] }] },
    sections: [{
      properties: {
        titlePage: true,
        page: { size: { width: 11909, height: 16834 }, margin: { top: 709, right: 1152, bottom: 993, left: 1440, header: 720, footer: 300 } },
      },
      headers: {
        first: new Header({ children: [] }),
        default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 24 })] })] }),
      },
      footers: {
        first: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DỮ LIỆU MÔ PHỎNG – Không sử dụng làm báo cáo chính thức.", size: 20, italics: true })] })] }),
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DỮ LIỆU MÔ PHỎNG – Không sử dụng làm báo cáo chính thức.", size: 20, italics: true })] })] }),
      },
      children: [
        dau,
        new Paragraph({ children: [] }),
        doan([`Hà Nội, ngày ${dd} tháng ${mm} năm 2026`], { i: true, phai: true, cach: false }),
        new Paragraph({ children: [] }),
        doan([`BÁO CÁO KẾT QUẢ KIỂM TRA ĐẾN NGÀY ${dd}/${mm}/2026`], { b: true, giua: true }),
        doan(["I- Công tác kiểm tra toàn ngành:"], { b: true, thut: 567, cach: false }),
        ...khoi("chung"),
        new Paragraph({ children: [] }),
        ...khoi("dichDanh"),
        new Paragraph({ children: [] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, indent: { right: 400 }, children: [new TextRun({ text: "PHÒNG KIỂM TRA SỐ 1.", bold: true })] }),
      ],
    }],
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `bao-cao-ket-qua-kiem-tra_2026-${mm}-${dd}.docx`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
