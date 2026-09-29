import { Badge, Button, FigureLine, Icon, PageIntro, Panel } from "@/components/ui";
import { DATA_AS_OF, sourceBatches, workItems } from "@/data/mock";
import type { Tone, UserRole, ViewId } from "@/domain/types";

const workTone = { DUE: "warning", OVERDUE: "critical", BLOCKED: "critical", DONE: "positive" } as const;
const workLabel = { DUE: "Sắp đến hạn", OVERDUE: "Quá hạn", BLOCKED: "Đang vướng", DONE: "Hoàn thành" } as const;
const batchTone = { READY: "positive", WARNING: "warning", PROCESSING: "info", MISSING: "critical" } as const;

/** Việc quá hạn hoặc đang vướng đầu tiên — đích của hành động chính. */
const moduleView = (module: string): ViewId =>
  module.includes("Nợ") ? "debt" : module.includes("Danh bạ") ? "mapping" : module.includes("Hoàn") ? "refund" : "risk";

export function Workbench({ onNavigate, role }: { onNavigate: (view: ViewId) => void; role: UserRole }) {
  const chuaDu = sourceBatches.filter((batch) => batch.status === "MISSING");

  return <div className="page-stack workbench-page">
    <PageIntro
      title="Tổng quan"
      description={`Dữ liệu đến ${DATA_AS_OF}`}
    />

    <FigureLine items={[
      { label: "Việc cần xử lý", value: workItems.length, tone: "warning" },
      { label: "Báo cáo chờ duyệt", value: 1, tone: "info" },
      { label: "Lô dữ liệu chưa đủ", value: chuaDu.length, tone: "critical" },
      { label: "Ngoại lệ ánh xạ", value: 18, tone: "warning", onSelect: role === "OFFICER" ? () => onNavigate("mapping") : undefined },
    ]}/>

    <div className="workbench-grid">
      <Panel title="Công việc ưu tiên">
        <div className="task-list">{workItems.map((item) => <button className="task-row" type="button" key={item.id} onClick={() => onNavigate(moduleView(item.module))}>
          <span className="task-copy"><strong>{item.title}</strong><small>{item.module} – {item.assignee}</small></span>
          <span className="task-meta"><Badge tone={workTone[item.status] as Tone}>{workLabel[item.status]}</Badge><small>{item.due}</small></span>
          <Icon name="arrow" size={17}/>
        </button>)}</div>
      </Panel>

      <Panel title="Tình trạng nguồn dữ liệu" actions={role === "OFFICER" && <Button kind="quiet" onClick={() => onNavigate("batches")}>Xem lô dữ liệu</Button>}>
        <div className="source-list">{sourceBatches.map((batch) => <div className="source-row" key={batch.id}>
          <span className="source-name"><strong>{batch.source}</strong><small>{batch.period}</small></span>
          <span className="source-files"><b>{batch.received}/{batch.expected}</b><small>file đã nhận</small></span>
          <span className="source-quality"><div><span>Chất lượng</span><b>{batch.quality.toLocaleString("vi-VN")}%</b></div></span>
          <Badge tone={batchTone[batch.status]}>{batch.status === "READY" ? "Sẵn sàng" : batch.status === "MISSING" ? "Thiếu dữ liệu" : batch.status === "WARNING" ? "Cần kiểm tra" : "Đang xử lý"}</Badge>
        </div>)}</div>
      </Panel>
    </div>

  </div>;
}
