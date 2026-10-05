import { useEffect, useRef, useState } from "react";
import { Badge, Button, Icon, Segmented, TableWrap, money } from "@/components/ui";
import { statusLabel, type ReportMeta, type ReportSheet, type ReportValue } from "@/domain/reportExport";

/*
  Xem trước bộ báo cáo sẽ nộp — phần còn thiếu của MH-04.

  Người duyệt trước đây chỉ có hai nút Duyệt và Trả lại, mà thứ họ sắp duyệt
  thì nằm rải trên bảy mục của màn và chỉ xem được đầy đủ sau khi TẢI FILE VỀ.
  Duyệt một bộ báo cáo mình chưa nhìn thấy nguyên hình là ký vào thứ mình chưa
  đọc; tải về rồi mở Excel rồi quay lại bấm Duyệt thì bước duyệt rơi ra ngoài
  hệ, đúng cái hệ sinh ra để thay.

  Màn này dựng đúng những sheet mà `reportExport` sẽ ghi ra file, không dựng
  lại từ nguồn khác — nên thứ người duyệt nhìn và thứ được nộp đi là một.

  Chỉ hiện SỐ DÒNG ĐẦU của mỗi sheet: danh sách chi tiết tới vài nghìn dòng,
  và người duyệt đọc số tổng hợp chứ không đọc từng người nộp thuế. Bảng đầy
  đủ nằm trong file kết xuất.
*/

const MOI_SHEET = 12;

/*
  Bề rộng từng cột tính từ NỘI DUNG của chính cột đó.

  Bản trước khai theo VỊ TRÍ — cột 1 là số thứ tự 60px, cột 2 là tên đơn vị
  230px, còn lại chia đều. Giả định ấy chỉ đúng với một sheet duy nhất. Tám
  sheet kia có hình dạng khác: `QuyTac_Nguon` cột đầu là "Nội dung" bị bóp còn
  60px; `Bao_cao_tong_hop` mở đầu bằng "Phòng/Thuế cơ sở" cũng 60px; các sheet
  danh sách thì cột 2 là mã số thuế, không phải tên.

  Mười sheet là mười hình dạng, nên không có công thức theo vị trí nào đúng cả
  — phải đo chữ thật trong cột.
*/
const PX_MOI_CHU = 7.4;

/*
  Chuỗi sẽ HIỆN trong ô. Đo bề rộng và vẽ ô đều gọi hàm này.

  Lần trước tôi đo độ dài của số THÔ (`3026500000`, 10 ký tự) nhưng màn vẽ ra
  số đã chấm nghìn (`3.026.500.000`, 13 ký tự), nên mọi cột tiền hụt đúng phần
  dấu chấm. Một hàm dùng chung thì cái sai ấy không quay lại được.
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

export function XemTruocBaoCao({ sheets, meta, ten }: { sheets: ReportSheet[]; meta: ReportMeta; ten: string }) {
  const hop = useRef<HTMLDialogElement>(null);
  const [chon, setChon] = useState(0);

  /* Đổi kỳ hoặc đổi phạm vi lọc thì bộ sheet đổi theo; quay về sheet đầu để
     không trỏ vào một sheet không còn tồn tại. */
  useEffect(() => { setChon(0); }, [sheets.length, meta.period, meta.scope]);

  const s = sheets[Math.min(chon, sheets.length - 1)];
  const phanTram = new Set(s?.percent ?? []);
  const dam = new Set(s?.bold ?? []);

  /* Đo trên đúng những dòng được dựng ra, không đo cả sheet: bảng chỉ cần vừa
     thứ nó đang hiện, và danh sách chi tiết có tới hàng nghìn dòng. */
  const hienThi = s ? s.rows.slice(0, MOI_SHEET) : [];
  const rong = s ? s.headers.map((h, i) => rongCot(h, hienThi.map((r) => r[i]), phanTram.has(i))) : [];

  return <>
    <Button icon="search" onClick={() => hop.current?.showModal()}>Xem trước báo cáo</Button>

    <dialog ref={hop} className="xem-truoc" aria-labelledby="xem-truoc-title">
      <header className="xt-dau">
        <div>
          <h2 id="xem-truoc-title">{ten}</h2>
          <p>{meta.period} · {meta.scope} · <Badge tone={meta.status === "APPROVED" ? "positive" : "neutral"}>{statusLabel[meta.status]}</Badge></p>
        </div>
        <button type="button" className="case-detail-close" onClick={() => hop.current?.close()} aria-label="Đóng xem trước"><Icon name="close" size={20}/></button>
      </header>

      {sheets.length > 1 && <Segmented
        label="Sheet trong bộ báo cáo"
        value={String(Math.min(chon, sheets.length - 1))}
        onChange={(v) => setChon(Number(v))}
        options={sheets.map((x, i) => ({ value: String(i), label: x.name }))}
      />}

      {s && <section className="xt-sheet">
        <div className="xt-ten">
          <strong>{s.title}</strong>
          {s.unit && <small>{s.unit}</small>}
        </div>
        <TableWrap label={`xem trước sheet ${s.name}`}><table
          className="xt-bang"
          style={{ minWidth: rong.reduce((t, x) => t + x, 0) }}
        >
          <colgroup>{rong.map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
          <thead><tr>{s.headers.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
          <tbody>{hienThi.map((r, i) => <tr key={i} className={dam.has(i) ? "is-tong" : undefined}>
            {r.map((v, j) => <td key={j} className={typeof v === "number" ? "num" : undefined}>{oGiaTri(v, phanTram.has(j))}</td>)}
          </tr>)}</tbody>
        </table></TableWrap>
      </section>}
    </dialog>
  </>;
}
