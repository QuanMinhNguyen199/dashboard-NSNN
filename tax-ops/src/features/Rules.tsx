import { Badge, Button, FigureLine, PageIntro, Panel, TableWrap } from "@/components/ui";
import { ruleItems } from "@/data/catalog";
import type { Tone } from "@/domain/types";
import { useAction } from "@/state/ActionContext";

const tone: Record<string, Tone> = { ACTIVE: "positive", PENDING: "warning", CONFLICT: "critical" };
const text: Record<string, string> = { ACTIVE: "Đang áp dụng", PENDING: "Chờ văn bản", CONFLICT: "Đang mâu thuẫn" };

export function Rules() {
  const notify = useAction();
  const chuaBat = ruleItems.filter((r) => r.status !== "ACTIVE");

  return <div className="page-stack">
    <PageIntro
      title="Quy tắc nghiệp vụ"
    />

    <FigureLine items={[
      { label: "Đang áp dụng", value: ruleItems.length - chuaBat.length, tone: "positive" },
      { label: "Chờ văn bản căn cứ", value: ruleItems.filter((r) => r.status === "PENDING").length, tone: "warning" },
      { label: "Đang mâu thuẫn", value: ruleItems.filter((r) => r.status === "CONFLICT").length, tone: "critical" },
      { label: "Phạm vi áp dụng", value: "Toàn ngành" },
    ]}/>

    <Panel title="Danh mục quy tắc">
      <TableWrap label="danh mục quy tắc nghiệp vụ"><table className="rules-table">
        <thead><tr><th scope="col">Quy tắc</th><th scope="col">Giá trị</th><th scope="col">Phạm vi</th><th scope="col">Hiệu lực từ</th><th scope="col">Văn bản căn cứ</th><th scope="col">Trạng thái</th><th scope="col"><span className="sr-only">Hành động</span></th></tr></thead>
        <tbody>{ruleItems.map((r) => <tr key={r.id}>
          <td><strong>{r.name}</strong></td>
          <td>{r.value}</td>
          <td><small>{r.scope}</small></td>
          <td>{r.effectiveFrom ?? <em>Chưa có</em>}</td>
          <td>{r.document ? <small>{r.document}</small> : <Badge tone="critical">Thiếu căn cứ</Badge>}</td>
          <td><Badge tone={tone[r.status]}>{text[r.status]}</Badge></td>
          <td><Button kind="quiet" onClick={() => notify(`Bản demo chưa có lịch sử phiên bản của “${r.name}”.`)}>Lịch sử</Button></td>
        </tr>)}</tbody>
      </table></TableWrap>
    </Panel>
  </div>;
}
