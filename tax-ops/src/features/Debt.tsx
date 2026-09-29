import { useMemo, useState } from "react";
import { Badge, Button, DetailGrid, Kpi, KpiStrip, PageIntro, Panel, SearchField, TableWrap, money } from "@/components/ui";
import { CaseLayout, useCaseSelection } from "@/components/CaseLayout";
import { debtRows } from "@/data/mock";
import type { Tone, ViewId } from "@/domain/types";
import { useAction } from "@/state/ActionContext";

const actionText = { MONITOR: "Theo dõi", ENFORCE: "Đủ điều kiện cưỡng chế", EXIT_SUSPENSION: "Rà tạm hoãn xuất cảnh", REVIEW: "Cần phân loại" } as const;
const actionTone: Record<keyof typeof actionText, Tone> = { MONITOR: "neutral", ENFORCE: "warning", EXIT_SUSPENSION: "critical", REVIEW: "info" };

/** Phân tuổi nợ theo quy tắc đã chốt: 1-30, 31-60, 61-90, trên 90 ngày. */
const bacTuoi = (ngay: number) => ngay <= 30 ? "1–30 ngày" : ngay <= 60 ? "31–60 ngày" : ngay <= 90 ? "61–90 ngày" : "Trên 90 ngày";

export function Debt({ onNavigate, onCreateReport }: { onNavigate: (view: ViewId) => void; onCreateReport: () => void }) {
  const notify = useAction();
  const [search, setSearch] = useState("");
  const [age, setAge] = useState("ALL");
  const cases = useCaseSelection(debtRows[0]?.id ?? "");
  const rows = useMemo(() => debtRows.filter((row) => {
    const match = `${row.taxpayer} ${row.maskedTaxId} ${row.unit}`.toLowerCase().includes(search.toLowerCase());
    const matchAge = age === "ALL" || (age === "90" ? row.age > 90 : age === "60" ? row.age > 60 && row.age <= 90 : row.age <= 60);
    return match && matchAge;
  }), [age, search]);
  const hoSo = rows.find((row) => row.id === cases.selectedId) ?? rows[0];
  /*
    Panel chi tiết không có dòng phụ. Mã số thuế, đơn vị và cán bộ quản lý đều
    đã nằm trên hàng đang chọn ngay bên trái; nhắc lại ở đầu panel là đọc hai
    lần cùng một thứ, và nó đẩy đầu hai cột lệch nhau. Luật này áp cho cả bốn
    panel chi tiết: Nợ, Hoàn thuế, Báo cáo và Lô dữ liệu.
  */
  const detail = hoSo && <Panel
    title={`Hồ sơ – ${hoSo.taxpayer}`}
    source="TMS 9.4.16.1"
  >
    <DetailGrid items={[
      { label: "Số nợ", value: <>{money(hoSo.debt)} <small>tỷ đồng</small></> },
      { label: "Tuổi nợ", value: <>{hoSo.age} ngày <small>{bacTuoi(hoSo.age)}</small></> },
      { label: "Đề xuất xử lý", value: <Badge tone={actionTone[hoSo.action]}>{actionText[hoSo.action]}</Badge> },
      { label: "Cán bộ quản lý", value: <>{hoSo.officer} <small>{hoSo.unit}</small></> },
    ]}/>
    <div className="notice warning">
      <strong>Hệ thống chưa tự kết luận được cho hồ sơ này</strong>
      <span>Phân tuổi nợ đã có quy tắc hiệu lực, nhưng ngưỡng cưỡng chế và ngưỡng tạm hoãn xuất cảnh còn ghi khác nhau giữa các nguồn. Cần văn bản căn cứ và ngày hiệu lực trước khi cảnh báo được bật.</span>
        {/* Nút nằm cạnh chính cảnh báo mà nó trả lời. Để ở đầu khối thì đầu
            khối cao thấp khác nhau tuỳ bản ghi có hành động hay không. */}
        <Button kind="quiet" icon="file" onClick={() => onNavigate("rules")}>Xem quy tắc áp dụng</Button>
    </div>
  </Panel>;

  return <div className="page-stack">
    <PageIntro title="Nợ và cưỡng chế" actions={<Button kind="primary" onClick={onCreateReport}>Tạo báo cáo tuần</Button>}/>
    <div className="notice warning"><strong>Quy tắc mô phỏng</strong><span>Ngưỡng cưỡng chế và tạm hoãn xuất cảnh phải được xác nhận bằng văn bản có hiệu lực trước khi dùng để ra quyết định.</span></div>
    <KpiStrip>
      <Kpi label="Tổng số nợ trong phạm vi" value={<>{money(12_486)} <em>tỷ đồng</em></>} note="3.812 người nộp thuế"/>
      <Kpi label="Nợ trên 90 ngày" value="1.286" note="33,7% danh sách đang theo dõi" tone="warning"/>
      <Kpi label="Cần rà cưỡng chế" value="742" note="Trên 90 ngày và trên ngưỡng" tone="warning"/>
      <Kpi label="Cần rà tạm hoãn xuất cảnh" value="64" note="Chưa phải quyết định nghiệp vụ" tone="critical"/>
    </KpiStrip>
    <CaseLayout label="Chi tiết hồ sơ nợ" detail={detail} mobileOpen={cases.mobileOpen} onClose={cases.close}>
    <Panel title="Danh sách cần xử lý" source="TMS 9.4.16.1" actions={<div className="inline-controls"><SearchField value={search} onChange={setSearch} placeholder="Tìm MST, tên hoặc đơn vị"/><label className="compact-field"><span>Tuổi nợ</span><select value={age} onChange={(event) => setAge(event.target.value)}><option value="ALL">Tất cả</option><option value="30">Đến 60 ngày</option><option value="60">61–90 ngày</option><option value="90">Trên 90 ngày</option></select></label></div>}>
      <TableWrap label="danh sách nợ cần xử lý"><table><thead><tr><th scope="col">Người nộp thuế</th><th scope="col">Đơn vị / cán bộ</th><th scope="col" className="num">Số nợ</th><th scope="col" className="num">Tuổi nợ</th><th scope="col">Đề xuất xử lý</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} onClick={(e) => cases.select(row.id, e)} className={row.id === hoSo?.id ? "is-selected" : undefined}><td><button type="button" className="row-select" aria-pressed={row.id === hoSo?.id} onClick={(e) => { e.stopPropagation(); cases.select(row.id, e); }}><strong>{row.taxpayer}</strong><small>{row.maskedTaxId}</small></button></td><td><span>{row.unit}</span><small>{row.officer}</small></td><td className="num"><strong>{money(row.debt)}</strong><small>tỷ đồng</small></td><td className="num"><strong>{row.age}</strong><small>ngày</small></td><td><Badge tone={actionTone[row.action]}>{actionText[row.action]}</Badge></td></tr>)}</tbody></table></TableWrap>
      <footer className="table-footer"><span>Hiển thị {rows.length}/{debtRows.length} bản ghi mô phỏng</span><Button kind="secondary" onClick={() => notify(`Có ${rows.length} bản ghi đang lọc. Bản demo chưa hỗ trợ tải file.`)}>Xuất danh sách đang lọc</Button></footer>
    </Panel>
    </CaseLayout>
  </div>;
}
