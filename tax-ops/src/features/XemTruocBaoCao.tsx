import { Button, Panel, Segmented, TableWrap, money } from "@/components/ui";
import type { ReportMeta, ReportSheet, ReportValue } from "@/domain/reportExport";

/*
  Xem trước bộ báo cáo sẽ nộp — phần còn thiếu của MH-04.

  Người duyệt trước đây chỉ có hai nút Duyệt và Trả lại, mà thứ họ sắp duyệt
  thì nằm rải trên bảy mục của màn và chỉ xem được đầy đủ sau khi TẢI FILE VỀ.
  Duyệt một bộ báo cáo mình chưa nhìn thấy nguyên hình là ký vào thứ mình chưa
  đọc; tải về rồi mở Excel rồi quay lại bấm Duyệt thì bước duyệt rơi ra ngoài
  hệ, đúng cái hệ sinh ra để thay.

  Màn này dựng đúng những sheet mà `reportExport` sẽ ghi ra file, không dựng
  lại từ nguồn khác — nên thứ người duyệt nhìn và thứ được nộp đi là một.

  ── Vì sao KHÔNG phải hộp thoại ─────────────────────────────────────────────

  Bản đầu dùng `<dialog showModal()>`. Ba lý do phải bỏ:

  1. Nội dung trong lớp phủ KHÔNG lọt vào ảnh chụp toàn trang, bản xuất PDF
     hay bản bàn giao thiết kế. Với một bản mẫu sắp được dựng lại trên nền
     khác, bản xem trước sẽ đơn giản là vô hình trong mọi bản chụp tĩnh.
  2. `<dialog>`, `::backdrop`, bẫy focus và `z-index` là giả định về nền web.
     Một khối trong luồng trang thì nền nào dựng được `div` là chạy được.
  3. Hộp thoại không có địa chỉ. Trợ lý không thể gửi một liên kết mở thẳng
     bản xem trước ở đúng sheet cần bàn.

  Nên nó là một khối trong luồng trang, mở bằng `?xem=<tên sheet>`.

  Chỉ hiện SỐ DÒNG ĐẦU của mỗi sheet: danh sách chi tiết tới vài nghìn dòng,
  và người duyệt đọc số tổng hợp chứ không đọc từng người nộp thuế. Bảng đầy
  đủ nằm trong file kết xuất.
*/

const MOI_SHEET = 12;

/*
  Bề rộng từng cột tính từ NỘI DUNG của chính cột đó.

  Khai theo VỊ TRÍ — cột 1 là số thứ tự, cột 2 là tên đơn vị — chỉ đúng với
  một sheet duy nhất. `QuyTac_Nguon` mở đầu bằng "Nội dung", `Bao_cao_tong_hop`
  bằng "Phòng/Thuế cơ sở", các sheet danh sách thì cột 2 là mã số thuế. Mười
  sheet là mười hình dạng, nên phải đo chữ thật trong cột.
*/
const PX_MOI_CHU = 7.4;

/*
  Chuỗi sẽ HIỆN trong ô. Đo bề rộng và vẽ ô đều gọi hàm này — đo số thô
  (`3026500000`) rồi vẽ số đã chấm nghìn (`3.026.500.000`) là cách mọi cột
  tiền hụt đúng phần dấu chấm.
*/
const chuTrongO = (v: ReportValue, laPhanTram: boolean) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v !== "number") return String(v);
  return laPhanTram
    ? `${new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v * 100)}%`
    : money(v);
};

const rongCot = (tieuDe: string, o: ReportValue[], laPhanTram: boolean) => {
  if (tieuDe.trim().toUpperCase() === "STT") return 58;
  const laSo = o.length > 0 && o.every((v) => v === null || typeof v === "number");
  /* Tiêu đề được phép xuống dòng nên nó chỉ góp khoảng một nửa chiều dài; ô
     dữ liệu thì góp trọn, vì chữ trong ô mới là thứ không được cắt. */
  let dai = Math.max(tieuDe.length / 2, 4);
  for (const v of o) dai = Math.max(dai, chuTrongO(v, laPhanTram).length);
  const px = Math.round(dai * PX_MOI_CHU) + 26;
  return laSo ? Math.min(200, Math.max(112, px)) : Math.min(320, Math.max(150, px));
};

const oGiaTri = (v: ReportValue, laPhanTram: boolean) => {
  if (v === null || v === undefined || v === "") return <span className="cell-empty">—</span>;
  if (typeof v === "number") return <span className="num">{chuTrongO(v, laPhanTram)}</span>;
  return String(v);
};

/*
  Nút gạt, đặt trong thanh duyệt cạnh nút Duyệt.

  Nhãn là "Xem báo cáo", không phải "Xem trước báo cáo". Chữ "trước" chỉ có
  nghĩa khi có một cái "sau" — bản nộp đi khác bản đang nhìn. Ở đây không có:
  khối này dựng đúng những sheet mà `reportExport` ghi ra file. Giữ chữ ấy là
  hứa với người duyệt rằng thứ họ đang đọc chưa phải bản thật.
*/
export function NutXemTruoc({ mo, onToggle }: { mo: boolean; onToggle: () => void }) {
  return <Button icon={mo ? "close" : "search"} aria-expanded={mo} aria-controls="khoi-xem-truoc" onClick={onToggle}>
    {mo ? "Đóng báo cáo" : "Xem báo cáo"}
  </Button>;
}

export function KhoiXemTruoc({ sheets, meta, ten, sheet, onChonSheet }: {
  sheets: ReportSheet[];
  meta: ReportMeta;
  ten: string;
  /** Tên sheet đang xem; không khớp cái nào thì rơi về sheet đầu. */
  sheet: string;
  onChonSheet: (ten: string) => void;
}) {
  const i = Math.max(0, sheets.findIndex((x) => x.name === sheet));
  const s = sheets[i];
  if (!s) return null;

  const phanTram = new Set(s.percent ?? []);
  const dam = new Set(s.bold ?? []);
  /* Đo trên đúng những dòng được dựng ra, không đo cả sheet: bảng chỉ cần vừa
     thứ nó đang hiện, và danh sách chi tiết có tới hàng nghìn dòng. */
  const hienThi = s.rows.slice(0, MOI_SHEET);
  const rong = s.headers.map((h, j) => rongCot(h, hienThi.map((r) => r[j]), phanTram.has(j)));

  return <section id="khoi-xem-truoc" className="xem-truoc" aria-label={ten}>
    <Panel
      title={ten}
      subtitle={`${meta.period} · ${meta.scope}`}
      /* Không nút đóng và không chip trạng thái ở đây. Cả hai đã có trên
         thanh duyệt cách đó một trăm pixel: nút gạt "Đóng xem trước", và chip
         trạng thái của chính kỳ này. Nhắc lại chúng buộc người đọc dừng lại
         hỏi hai chỗ có nói cùng một thứ không. */
    >
      {sheets.length > 1 && <Segmented
        label="Sheet trong bộ báo cáo"
        value={s.name}
        onChange={onChonSheet}
        options={sheets.map((x) => ({ value: x.name, label: x.name }))}
      />}

      <div className="xt-ten">
        <strong>{s.title}</strong>
        {s.unit && <small>{s.unit}</small>}
      </div>

      <TableWrap label={`sheet ${s.name}`}><table
        className="xt-bang"
        style={{ minWidth: rong.reduce((t, x) => t + x, 0) }}
      >
        <colgroup>{rong.map((w, j) => <col key={j} style={{ width: w }}/>)}</colgroup>
        <thead><tr>{s.headers.map((h, j) => <th key={j} scope="col">{h}</th>)}</tr></thead>
        <tbody>{hienThi.map((r, j) => <tr key={j} className={dam.has(j) ? "is-tong" : undefined}>
          {r.map((v, k) => <td key={k} className={typeof v === "number" ? "num" : undefined}>{oGiaTri(v, phanTram.has(k))}</td>)}
        </tr>)}</tbody>
      </table></TableWrap>
    </Panel>
  </section>;
}
