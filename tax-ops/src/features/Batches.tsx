import { useRef, useState } from "react";
import { Badge, Button, FigureLine, Icon, PageIntro, Panel, TableWrap, integer } from "@/components/ui";
import { batchFiles } from "@/data/catalog";
import { sourceBatches } from "@/data/mock";
import type { Tone } from "@/domain/types";

const loTone = { READY: "positive", WARNING: "warning", PROCESSING: "info", MISSING: "critical" } as const;
const loText = { READY: "Sẵn sàng", WARNING: "Cần kiểm tra", PROCESSING: "Đang xử lý", MISSING: "Thiếu dữ liệu" } as const;

const fileTone: Record<string, Tone> = { OK: "positive", COLUMN_DRIFT: "warning", HAND_EDITED: "warning", MISSING: "critical" };
const fileText: Record<string, string> = { OK: "Đạt", COLUMN_DRIFT: "Lệch cột", HAND_EDITED: "Nghi chỉnh tay", MISSING: "Thiếu file" };

export function Batches() {
  const [chon, setChon] = useState(sourceBatches[0]?.id ?? "");
  const [daNhan, setDaNhan] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const lo = sourceBatches.find((b) => b.id === chon) ?? sourceBatches[0];

  const loi = batchFiles.filter((f) => f.issue !== "OK");
  const thieu = batchFiles.filter((f) => f.issue === "MISSING");

  return <div className="page-stack">
    <PageIntro
      title="Lô dữ liệu"
      actions={<Button kind="primary" icon="upload" onClick={() => input.current?.click()}>Nhập lô dữ liệu</Button>}
    />
    {/* Nút "Nhập lô dữ liệu" phía trên đã là control thật; ô này chỉ là cơ chế,
        nên đưa nó ra khỏi luồng Tab và khỏi cây trợ năng. */}
    <input ref={input} className="sr-only" type="file" multiple accept=".xlsx,.xls,.zip,.csv" tabIndex={-1} aria-hidden="true"
      onChange={(e) => setDaNhan(e.target.files?.length ? `Đã chọn ${e.target.files.length} file. Bản demo chưa gửi dữ liệu lên máy chủ.` : null)}/>
    {daNhan && <div className="notice positive" role="status"><strong>Đã tiếp nhận lựa chọn</strong><span>{daNhan}</span><Button kind="quiet" onClick={() => setDaNhan(null)}>Đóng</Button></div>}

    <FigureLine items={[
      { label: "Dòng dữ liệu đã nhận", value: integer(615_807) },
      { label: "File đã nhận trong kỳ", value: "67/93", tone: "warning" },
      { label: "Lỗi chất lượng đang mở", value: loi.length, tone: "critical" },
      { label: "Lô chưa đủ file", value: sourceBatches.filter((b) => b.status === "MISSING").length, tone: "critical" },
    ]}/>

    <Panel
      title="Nhật ký lô dữ liệu"
      source="TMS · TTR · HĐĐT · XMHĐ · Viettel"
    >
      <TableWrap label="nhật ký lô dữ liệu"><table>
        <thead><tr><th scope="col">Mã lô</th><th scope="col">Nguồn / kỳ</th><th scope="col" className="num">File</th><th scope="col" className="num">Số dòng</th><th scope="col" className="num">Chất lượng</th><th scope="col">Cập nhật</th><th scope="col">Trạng thái</th></tr></thead>
        <tbody>{sourceBatches.map((b) => <tr key={b.id} onClick={() => setChon(b.id)} className={b.id === chon ? "is-selected" : undefined}>
          {/* Cả hàng bấm được cho chuột; nút ở ô đầu là đích bàn phím. Đặt
              role="button" lên <tr> thì mất ngữ nghĩa bảng, nên không làm thế. */}
          <td><button type="button" className="row-select" aria-pressed={b.id === chon} onClick={(e) => { e.stopPropagation(); setChon(b.id); }}><code>{b.id}</code></button></td>
          <td><strong>{b.source}</strong><small>{b.period}</small></td>
          <td className="num">{b.received}/{b.expected}</td>
          <td className="num">{integer(b.rows)}</td>
          <td className="num">{b.quality.toLocaleString("vi-VN")}%</td>
          <td>{b.updatedAt}</td>
          <td><Badge tone={loTone[b.status]}>{loText[b.status]}</Badge></td>
        </tr>)}</tbody>
      </table></TableWrap>
    </Panel>

    {/*
      Chi tiết lô là chỗ trả lời câu "thiếu cái gì" chứ không phải "thiếu bao
      nhiêu". Một con số 67/93 không giúp ai đi đòi file; tên đơn vị thì có.
    */}
    <Panel
      title={`Chi tiết lô ${lo.source} · ${lo.period}`}
      subtitle={`${thieu.length} đơn vị chưa gửi`}
      source="TTR"
    >
      {loi.length > 0 && <div className="notice warning">
        <strong>{loi.length} file cần xem lại</strong>
        <span>Chưa tính báo cáo cho tới khi cấu trúc được xác nhận hoặc đơn vị gửi lại bản kết xuất gốc.</span>
      </div>}
      <TableWrap label="chi tiết file trong lô"><table>
        <thead><tr><th scope="col">Tên file</th><th scope="col">Đơn vị nguồn</th><th scope="col" className="num">Số dòng</th><th scope="col" className="num">Số cột</th><th scope="col">Ghi chú</th><th scope="col">Kết quả kiểm</th></tr></thead>
        <tbody>{batchFiles.map((f) => <tr key={f.id}>
          <td>{f.name === "—" ? <em>Chưa nhận</em> : <code>{f.name}</code>}</td>
          <td><strong>{f.unit}</strong></td>
          <td className="num">{f.rows ? integer(f.rows) : "—"}</td>
          <td className="num">{f.columns || "—"}</td>
          <td><small>{f.note}</small></td>
          <td><Badge tone={fileTone[f.issue]}>{fileText[f.issue]}</Badge></td>
        </tr>)}</tbody>
      </table></TableWrap>
      <div className="table-footer">
        <span>Số file dự kiến của kiểm tra tại bàn là 35, không phải 30: năm Thuế cơ sở tách hai địa bàn.</span>
        <Button kind="secondary" icon="external" onClick={() => setDaNhan(thieu.length ? `Đã lập nhắc gửi tới ${thieu.length} đơn vị: ${thieu.map((f) => f.unit).join(", ")}. Bản demo chưa gửi thật.` : "Không còn đơn vị nào chưa nộp trong lô này.")}>Gửi nhắc đơn vị chưa nộp</Button>
      </div>
    </Panel>

    {thieu.length === 0 && <div className="empty-state"><Icon name="check" size={26}/><strong>Đã nhận đủ file của kỳ này</strong><span>Có thể chuyển sang bước ánh xạ.</span></div>}
  </div>;
}
