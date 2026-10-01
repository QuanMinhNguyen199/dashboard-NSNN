import { useMemo, useState } from "react";
import { Badge, Button, FigureLine, Icon, PageIntro, Panel, SearchField, TableWrap } from "@/components/ui";
import { mappingIssues } from "@/data/mock";
import { useAction } from "@/state/ActionContext";

export function Mapping() {
  const notify = useAction();
  const [daXuLy, setDaXuLy] = useState<string[]>([]);
  const [tim, setTim] = useState("");
  const [lichSu, setLichSu] = useState<{ id: string; ten: string; donVi: string }[]>([]);

  const hangCho = useMemo(
    () => mappingIssues.filter((m) => !daXuLy.includes(m.id)
      && `${m.maskedTaxId} ${m.taxpayer} ${m.reason}`.toLowerCase().includes(tim.toLowerCase())),
    [daXuLy, tim],
  );

  const xacNhan = (id: string, ten: string, donVi: string) => {
    setDaXuLy((c) => [...c, id]);
    setLichSu((c) => [{ id, ten, donVi }, ...c]);
    notify(`Đã gán “${ten}” về ${donVi}. Thay đổi được ghi vào lịch sử ánh xạ.`);
  };

  return <div className="page-stack">
    <PageIntro
      title="Ánh xạ quản lý"
    />

    <FigureLine items={[
      { label: "Đang chờ xác nhận", value: hangCho.length, tone: hangCho.length ? "warning" : "positive" },
      { label: "Đã xác nhận trong phiên", value: lichSu.length, tone: "positive" },
      { label: "Bản ghi trong danh bạ", value: "3.812" },
      { label: "Nguồn ánh xạ", value: "TMS 2.2.7" },
    ]}/>

    {/*
      Ánh xạ có THỜI GIAN HIỆU LỰC. Một dòng ở đây không phải "sửa cho đúng" mà
      là "gán từ thời điểm nào", vì phân công đổi ngay trong kỳ báo cáo. Bản demo
      chưa có ô chọn ngày, nhưng câu chữ phải nói đúng bản chất ngay từ đầu.
    */}
    <Panel
      title="Hàng chờ xác nhận"
      actions={<SearchField value={tim} onChange={setTim} placeholder="Tìm mã số thuế hoặc lý do"/>}
    >
      <TableWrap label="hàng chờ xác nhận ánh xạ"><table className="mapping-table">
        <thead><tr><th scope="col">Người nộp thuế</th><th scope="col">Đơn vị hiện tại</th><th scope="col">Đề xuất</th><th scope="col">Lý do chưa khớp</th><th scope="col"><span className="sr-only">Hành động</span></th></tr></thead>
        <tbody>{hangCho.map((m) => <tr key={m.id}>
          <td><strong>{m.taxpayer}</strong><small>{m.maskedTaxId}</small></td>
          <td>{m.currentUnit ?? <Badge tone="critical">Chưa xác định</Badge>}</td>
          <td>{m.suggestedUnit ?? "—"}</td>
          <td><small>{m.reason}</small></td>
          <td><Button kind="secondary" disabled={!m.suggestedUnit}
            onClick={() => xacNhan(m.id, m.taxpayer, m.suggestedUnit!)}>Xác nhận</Button></td>
        </tr>)}</tbody>
      </table></TableWrap>
      {hangCho.length === 0 && <div className="empty-state">
        <Icon name="check" size={26}/>
        <strong>Không còn trường hợp chờ trong danh sách đang xem</strong>
        <span>Báo cáo của kỳ này không còn phần chưa xác định đơn vị quản lý.</span>
      </div>}
    </Panel>

    <Panel title="Lịch sử thay đổi trong phiên">
      {lichSu.length === 0
        ? <div className="empty-state"><strong>Chưa có thay đổi nào trong phiên</strong></div>
        : <div className="rank-list">{lichSu.map((h, i) => <div key={h.id}>
            <span>{i + 1}</span>
            <strong>{h.ten}</strong>
            <b>{h.donVi}</b>
          </div>)}</div>}
    </Panel>
  </div>;
}
