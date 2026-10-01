import { useState } from "react";
import { Badge, DetailGrid, Kpi, KpiStrip, PageIntro, Panel, Segmented, TableWrap, integer } from "@/components/ui";
import { CaseLayout, useCaseSelection } from "@/components/CaseLayout";
import { refundRows } from "@/data/mock";
import type { Tone } from "@/domain/types";

type Mode = "REFUND" | "CALLCENTER";
const statusText = { IN_TIME: "Trong hạn", OVERDUE: "Quá hạn", DONE: "Đã xử lý", MISMATCH: "Vênh nguồn" } as const;
const statusTone: Record<keyof typeof statusText, Tone> = { IN_TIME: "info", OVERDUE: "critical", DONE: "positive", MISMATCH: "warning" };

export function Refund() {
  const [mode, setMode] = useState<Mode>("REFUND");
  return <div className="page-stack">
    <PageIntro title="Hoàn thuế và hỗ trợ"/>
    <Segmented label="Nghiệp vụ hoàn thuế và hỗ trợ" value={mode} onChange={setMode} options={[{ value: "REFUND", label: "Hoàn thuế" }, { value: "CALLCENTER", label: "Tổng đài hỗ trợ" }]}/>
    {mode === "REFUND" ? <RefundView/> : <CallCenterView/>}
  </div>;
}

function RefundView() {
  const cases = useCaseSelection(refundRows[0]?.id ?? "");
  const hoSo = refundRows.find((row) => row.id === cases.selectedId) ?? refundRows[0];
  const detail = hoSo && <Panel
    title={`Hồ sơ – ${hoSo.code}`}
  >
    <DetailGrid items={[
      { label: "Có ở chức năng 1.5.1", value: hoSo.source151 ? "Có" : <>Thiếu <small>chưa thấy đầu hồ sơ</small></> },
      { label: "Có ở chức năng 6.29.1", value: hoSo.source6291 ? "Có" : <>Thiếu <small>chưa thấy trong danh sách xử lý</small></> },
      { label: "Số ngày mở", value: <>{hoSo.daysOpen} <small>tính đến ngày báo cáo</small></> },
      { label: "Trạng thái", value: <Badge tone={statusTone[hoSo.status]}>{statusText[hoSo.status]}</Badge> },
    ]}/>
    {hoSo.source151 !== hoSo.source6291 && <div className="notice critical">
      <strong>Hồ sơ vênh giữa hai nguồn</strong>
      <span>Một chức năng có hồ sơ này, chức năng kia không. Đối chiếu lại kết xuất gốc của cùng kỳ trước khi đưa vào số tổng hợp.</span>
    </div>}
  </Panel>;
  return <>
    <KpiStrip><Kpi label="Tồn đầu kỳ" value="312" note="Hồ sơ chuyển từ kỳ trước"/><Kpi label="Phát sinh trong kỳ" value="284" note="Theo ngày nhận hồ sơ"/><Kpi label="Đã xử lý" value="168" note="59,2% phát sinh" tone="positive"/><Kpi label="Tồn cuối kỳ" value="428" note="34 hồ sơ quá hạn" tone="warning"/></KpiStrip>
    <CaseLayout label="Chi tiết hồ sơ hoàn thuế" detail={detail} mobileOpen={cases.mobileOpen} onClose={cases.close}>
    <Panel title="Đối chiếu hồ sơ hoàn thuế">
      <TableWrap label="đối chiếu hồ sơ hoàn thuế"><table className="refund-table"><thead><tr><th scope="col">Hồ sơ</th><th scope="col">Ngày nhận</th><th scope="col">Đơn vị xử lý</th><th scope="col" className="center">1.5.1</th><th scope="col" className="center">6.29.1</th><th scope="col" className="num">Số ngày mở</th><th scope="col">Trạng thái</th></tr></thead><tbody>{refundRows.map((row) => <tr key={row.id} onClick={(e) => cases.select(row.id, e)} className={row.id === hoSo?.id ? "is-selected" : undefined}><td><button type="button" className="row-select" aria-pressed={row.id === hoSo?.id} onClick={(e) => { e.stopPropagation(); cases.select(row.id, e); }}><strong>{row.code}</strong></button></td><td>{row.receivedAt}</td><td>{row.unit}</td><td className="center"><SourceMark ok={row.source151}/></td><td className="center"><SourceMark ok={row.source6291}/></td><td className="num">{row.daysOpen}</td><td><Badge tone={statusTone[row.status]}>{statusText[row.status]}</Badge></td></tr>)}</tbody></table></TableWrap>
    </Panel>
    </CaseLayout>
  </>;
}

function CallCenterView() {
  return <>
    <KpiStrip><Kpi label="Cuộc gọi tiếp nhận" value={integer(684)} note="Ngày 27/09/2026"/><Kpi label="Ticket phát sinh" value={integer(218)} note="31,9% số cuộc gọi"/><Kpi label="Đã xử lý" value={integer(196)} note="89,9% ticket" tone="positive"/><Kpi label="Chờ xử lý" value="22" note="4 ticket sắp quá hạn" tone="warning"/></KpiStrip>
    <div className="two-column"><Panel title="Theo chuyên viên"><div className="rank-list">{[["Nguyễn Minh A", 52], ["Trần Thu B", 47], ["Lê Quang C", 39], ["Phạm Lan D", 32], ["Vũ Hải E", 26]].map(([name, value], index) => <div key={String(name)}><span>{index + 1}</span><strong>{name}</strong><b>{value}</b></div>)}</div></Panel><Panel title="Tiến độ báo cáo ngày"><div className="timeline"><Step done time="18:03" title="Đã nhận dữ liệu Viettel"/><Step done time="18:06" title="Đã tạo bảng tổng hợp"/><Step done={false} time="08:30" title="Chờ cán bộ rà soát"/><Step done={false} time="10:00" title="Chờ phát hành"/></div></Panel></div>
  </>;
}

/* Dùng chính hệ badge, không dựng họ chip thứ tư: chấm 6px cộng nhãn chữ, và
   riêng "Thiếu" giữ chip vì tone-critical là một trong hai ngoại lệ đã ghi.
   `aria-label` cũ chỉ lặp lại chữ đang hiện, và đặt trên <span> trần thì trình
   đọc màn hình cũng không chắc đọc ra. */
function SourceMark({ ok }: { ok: boolean }) { return <Badge tone={ok ? "positive" : "critical"}>{ok ? "Có" : "Thiếu"}</Badge>; }
function Step({ done, time, title }: { done: boolean; time: string; title: string }) { return <div className={`timeline-step ${done ? "is-done" : ""}`}><i/><span>{time}</span><strong>{title}</strong></div>; }
