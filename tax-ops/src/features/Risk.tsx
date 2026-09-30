import { useMemo, useState } from "react";
import { Badge, Icon, Kpi, KpiStrip, PageIntro, Panel, SearchField, Segmented, TableWrap, money } from "@/components/ui";
import { riskRows } from "@/data/mock";
import type { Tone } from "@/domain/types";

type RiskMode = "DESK" | "INVOICE" | "VERIFY";
const stateText = { ACCEPTED: "Chấp nhận", EXPLANATION: "Chờ giải trình", ADJUSTED: "Điều chỉnh", ASSESSED: "Ấn định", INSPECTION: "Đề nghị kiểm tra" } as const;
const stateTone: Record<keyof typeof stateText, Tone> = { ACCEPTED: "positive", EXPLANATION: "warning", ADJUSTED: "info", ASSESSED: "critical", INSPECTION: "critical" };

export function Risk() {
  const [mode, setMode] = useState<RiskMode>("DESK");
  const [search, setSearch] = useState("");
  const rows = useMemo(() => riskRows.filter((row) => `${row.taxpayer} ${row.maskedTaxId} ${row.unit}`.toLowerCase().includes(search.toLowerCase())), [search]);

  return <div className="page-stack">
    <PageIntro title="Kiểm tra và rủi ro"/>
    <Segmented label="Nhóm nghiệp vụ kiểm tra" value={mode} onChange={setMode} options={[{ value: "DESK", label: "Kiểm tra tại bàn" }, { value: "INVOICE", label: "Tờ khai & hóa đơn" }, { value: "VERIFY", label: "Xác minh hóa đơn" }]}/>
    {mode === "DESK" && <DeskAudit search={search} setSearch={setSearch} rows={rows}/>} 
    {mode === "INVOICE" && <InvoiceVariance/>}
    {mode === "VERIFY" && <InvoiceVerification/>}
  </div>;
}

function DeskAudit({ search, setSearch, rows }: { search: string; setSearch: (value: string) => void; rows: typeof riskRows }) {
  return <>
    <KpiStrip><Kpi label="Doanh nghiệp trong kế hoạch" value="13.842" note="Từ danh sách rủi ro sau loại trừ"/><Kpi label="Đã xử lý trong kỳ" value="8.416" note="60,8% kế hoạch" tone="positive"/><Kpi label="Chờ giải trình" value="2.138" note="Cần theo dõi hạn trả lời" tone="warning"/><Kpi label="Đề nghị kiểm tra" value="684" note="Chờ phê duyệt bước tiếp theo" tone="critical"/></KpiStrip>
    <Panel title="Kết quả kiểm tra tại bàn" actions={<SearchField value={search} onChange={setSearch} placeholder="Tìm doanh nghiệp hoặc đơn vị"/>}>
      <TableWrap label="kết quả kiểm tra tại bàn"><table><thead><tr><th scope="col">Người nộp thuế</th><th scope="col">Đơn vị quản lý</th><th scope="col" className="num">Tờ khai</th><th scope="col" className="num">Chênh lệch</th><th scope="col" className="num">Hệ số K</th><th scope="col">Trạng thái</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.taxpayer}</strong><small>{row.maskedTaxId}</small></td><td>{row.unit}</td><td className="num">{row.declarations}</td><td className="num">{row.variance.toLocaleString("vi-VN")}%</td><td className="num">{row.kFactor === null ? <><span>Chưa tính</span><small>Thiếu dữ liệu</small></> : row.kFactor.toLocaleString("vi-VN")}</td><td><Badge tone={stateTone[row.state]}>{stateText[row.state]}</Badge></td></tr>)}{rows.length === 0 && <tr><td className="table-empty" colSpan={6}>Không tìm thấy doanh nghiệp hoặc đơn vị phù hợp.</td></tr>}</tbody></table></TableWrap>
    </Panel>
  </>;
}

function InvoiceVariance() {
  return <>
    <KpiStrip><Kpi label="File bán ra" value="26/26" note="Đã kiểm tra cấu trúc" tone="positive"/><Kpi label="File mua vào" value="0/26" note="Chưa được cung cấp" tone="critical"/><Kpi label="Dòng bán ra" value="428.905" note="Đang chờ ghép chiều mua vào"/><Kpi label="Cảnh báo hệ số K" value="—" note="Chưa tính khi dữ liệu chưa đủ"/></KpiStrip>
    <Panel title="Điều kiện chạy đối chiếu"><div className="checklist"><Check done label="Đủ 26 file bán ra"/><Check done={false} label="Đủ 26 file mua vào"/><Check done label="Mã đơn vị nguồn hợp lệ"/><Check done={false} label="Mẫu báo cáo cùng kỳ đã được xác nhận"/></div></Panel>
  </>;
}

function InvoiceVerification() {
  const states = [{ name: "Đã nhận", value: 384, tone: "info" }, { name: "Đã phân công", value: 276, tone: "info" }, { name: "Chờ lãnh đạo duyệt", value: 126, tone: "warning" }, { name: "Đã trả kết quả", value: 1_842, tone: "positive" }, { name: "Quá hạn", value: 126, tone: "critical" }] as const;
  return <><KpiStrip><Kpi label="Yêu cầu phát sinh" value="2.628" note="Không gồm đã hủy và thay thế"/><Kpi label="Đã trả kết quả" value="1.842" note="70,1% tổng yêu cầu" tone="positive"/><Kpi label="Đang xử lý" value="786" note="Mọi trạng thái trừ đã trả kết quả" tone="warning"/><Kpi label="Quá hạn" value="126" note="Theo hạn xử lý đến ngày báo cáo" tone="critical"/></KpiStrip><Panel title="Luồng xử lý xác minh"><div className="status-flow">{states.map((item) => <div key={item.name}><Badge tone={item.tone}>{item.name}</Badge><strong>{money(item.value)}</strong><small>yêu cầu</small></div>)}</div></Panel></>;
}

function Check({ done, label }: { done: boolean; label: string }) {
  return <div className={`check-item ${done ? "is-done" : ""}`}><span>{done && <Icon name="check" size={15}/>}</span><strong>{label}</strong><Badge tone={done ? "positive" : "critical"}>{done ? "Đạt" : "Còn thiếu"}</Badge></div>;
}
