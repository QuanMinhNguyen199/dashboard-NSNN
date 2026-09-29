import { useRef, useState } from "react";
import { Badge, Button, DetailGrid, FigureLine, PageIntro, Panel, TableWrap, integer } from "@/components/ui";
import { CaseLayout, useCaseSelection } from "@/components/CaseLayout";
import { batchFiles } from "@/data/catalog";
import { sourceBatches } from "@/data/mock";
import type { Tone } from "@/domain/types";

const loTone = { READY: "positive", WARNING: "warning", PROCESSING: "info", MISSING: "critical" } as const;
const loText = { READY: "Sẵn sàng", WARNING: "Cần kiểm tra", PROCESSING: "Đang xử lý", MISSING: "Thiếu dữ liệu" } as const;

const fileTone: Record<string, Tone> = { OK: "positive", COLUMN_DRIFT: "warning", HAND_EDITED: "warning", MISSING: "critical" };
const fileText: Record<string, string> = { OK: "Đạt", COLUMN_DRIFT: "Lệch cột", HAND_EDITED: "Nghi chỉnh tay", MISSING: "Thiếu file" };

export function Batches() {
  const cases = useCaseSelection(sourceBatches[0]?.id ?? "");
  const [daNhan, setDaNhan] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const lo = sourceBatches.find((b) => b.id === cases.selectedId) ?? sourceBatches[0];

  const loi = batchFiles.filter((f) => f.issue !== "OK");
  const thieu = batchFiles.filter((f) => f.issue === "MISSING");
  const fileMau = [...batchFiles].sort((a, b) => Number(a.issue === "OK") - Number(b.issue === "OK"));
  const coChiTietFile = lo?.id === "TTR-2026-09";
  const detail = lo && <Panel
    title={`Chi tiết lô ${lo.source} – ${lo.period}`}
    source={lo.source}
  >
    <DetailGrid items={[
      { label: "File", value: `${lo.received}/${lo.expected}` },
      { label: "Số dòng", value: integer(lo.rows) },
      { label: "Chất lượng", value: `${lo.quality.toLocaleString("vi-VN")}%` },
      { label: "Trạng thái", value: <Badge tone={loTone[lo.status]}>{loText[lo.status]}</Badge> },
    ]}/>
    {daNhan?.startsWith("Đã lập nhắc") && <div className="notice positive" role="status"><span>{daNhan}</span></div>}
    {coChiTietFile ? <>
      {loi.length > 0 && <div className="notice warning"><strong>{loi.length} file cần xem lại{thieu.length > 0 ? `, trong đó ${thieu.length} đơn vị chưa gửi` : ""}</strong><span>Chưa tính báo cáo cho tới khi cấu trúc được xác nhận hoặc đơn vị gửi lại bản kết xuất gốc.</span>{coChiTietFile && thieu.length > 0 && coChiTietFile && thieu.length > 0 && <Button kind="quiet" onClick={() => setDaNhan(`Đã lập nhắc gửi tới ${thieu.length} đơn vị: ${thieu.map((f) => f.unit).join(", ")}. Bản demo chưa gửi thật.`)}>Nhắc đơn vị chưa nộp</Button>}</div>}
      <div className="batch-file-list" aria-label="File minh họa trong lô TTR">{fileMau.map((f) => <div key={f.id}>
        <div><strong>{f.unit}</strong><Badge tone={fileTone[f.issue]}>{fileText[f.issue]}</Badge></div>
        <code>{f.name === "—" ? "Chưa nhận file" : f.name}</code>
        <small>{f.note}{f.rows > 0 ? ` – ${integer(f.rows)} dòng` : ""}</small>
      </div>)}</div>
      <p className="case-source-note">8 file minh họa trong lô; kiểm tra tại bàn dự kiến 35 file vì năm Thuế cơ sở tách hai địa bàn.</p>
    </> : <div className="empty-state"><strong>Chưa có danh sách file chi tiết cho lô này trong bản mô phỏng</strong></div>}
  </Panel>;

  return <div className="page-stack">
    <PageIntro
      title="Lô dữ liệu"
      actions={<Button kind="primary" icon="upload" onClick={() => input.current?.click()}>Nhập lô dữ liệu</Button>}
    />
    {/* Nút "Nhập lô dữ liệu" phía trên đã là control thật; ô này chỉ là cơ chế,
        nên đưa nó ra khỏi luồng Tab và khỏi cây trợ năng. */}
    <input ref={input} className="sr-only" type="file" multiple accept=".xlsx,.xls,.zip,.csv" tabIndex={-1} aria-hidden="true"
      onChange={(e) => setDaNhan(e.target.files?.length ? `Đã chọn ${e.target.files.length} file. Bản demo chưa gửi dữ liệu lên máy chủ.` : null)}/>
    {daNhan?.startsWith("Đã chọn") && <div className="notice positive" role="status"><strong>Đã tiếp nhận lựa chọn</strong><span>{daNhan}</span><Button kind="quiet" onClick={() => setDaNhan(null)}>Đóng</Button></div>}

    <FigureLine items={[
      { label: "Dòng dữ liệu đã nhận", value: integer(615_807) },
      { label: "File đã nhận trong kỳ", value: "67/93", tone: "warning" },
      { label: "Lỗi chất lượng đang mở", value: loi.length, tone: "critical" },
      { label: "Lô chưa đủ file", value: sourceBatches.filter((b) => b.status === "MISSING").length, tone: "critical" },
    ]}/>

    <CaseLayout label="Chi tiết lô dữ liệu" detail={detail} mobileOpen={cases.mobileOpen} onClose={cases.close}>
    <Panel
      title="Nhật ký lô dữ liệu"
      source="TMS – TTR – HĐĐT – XMHĐ – Viettel"
    >
      <TableWrap label="nhật ký lô dữ liệu"><table>
        <thead><tr><th scope="col">Mã lô</th><th scope="col">Nguồn / kỳ</th><th scope="col" className="num">File</th><th scope="col" className="num">Số dòng</th><th scope="col" className="num">Chất lượng</th><th scope="col">Cập nhật</th><th scope="col">Trạng thái</th></tr></thead>
        <tbody>{sourceBatches.map((b) => <tr key={b.id} onClick={(e) => cases.select(b.id, e)} className={b.id === lo?.id ? "is-selected" : undefined}>
          {/* Cả hàng bấm được cho chuột; nút ở ô đầu là đích bàn phím. Đặt
              role="button" lên <tr> thì mất ngữ nghĩa bảng, nên không làm thế. */}
          <td><button type="button" className="row-select" aria-pressed={b.id === lo?.id} onClick={(e) => { e.stopPropagation(); cases.select(b.id, e); }}><code>{b.id}</code></button></td>
          <td><strong>{b.source}</strong><small>{b.period}</small></td>
          <td className="num">{b.received}/{b.expected}</td>
          <td className="num">{integer(b.rows)}</td>
          <td className="num">{b.quality.toLocaleString("vi-VN")}%</td>
          <td>{b.updatedAt}</td>
          <td><Badge tone={loTone[b.status]}>{loText[b.status]}</Badge></td>
        </tr>)}</tbody>
      </table></TableWrap>
    </Panel>
    </CaseLayout>
  </div>;
}
