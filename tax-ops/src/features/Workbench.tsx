import { Badge, Button, FigureLine, Icon, PageIntro, Panel } from "@/components/ui";
import { useDuyet } from "@/state/DuyetContext";
import { KY_QL1 } from "@/data/ql1";
import { KY_QL3 } from "@/data/ql3";
import { sourceBatches, workItems } from "@/data/mock";
import type { Phong, Tone, VaiTro, ViewId } from "@/domain/types";

const workTone = { DUE: "warning", OVERDUE: "critical", BLOCKED: "critical", DONE: "positive" } as const;
const workLabel = { DUE: "Sắp đến hạn", OVERDUE: "Quá hạn", BLOCKED: "Cần bổ sung dữ liệu", DONE: "Hoàn thành" } as const;
const batchTone = { READY: "positive", WARNING: "warning", PROCESSING: "info", MISSING: "critical" } as const;

/** Việc quá hạn hoặc đang vướng đầu tiên — đích của hành động chính. */
/* Việc về danh bạ nay mở màn Tình trạng dữ liệu, mục "Gắn về phòng". */
const moduleView = (module: string): ViewId =>
  module.includes("Nợ") ? "debt" : module.includes("Danh bạ") ? "tinhtrang" : "risk";

export function Workbench({ onNavigate, vaiTro, phong }: { onNavigate: (view: ViewId) => void; vaiTro: VaiTro; phong: Phong }) {
  const { layBanGhi } = useDuyet();
  const tasks = workItems.filter(item => {
    if (item.module === "Danh bạ quản lý") return vaiTro === "CV";
    if (!phong || !(item.assignee.includes(phong) || item.assignee.includes(phong.replace("QL", "QLDN")))) return false;
    if (/Duyệt|Chốt/.test(item.title)) return vaiTro === "TP";
    return true;
  });
  const reportView = phong === "QL1" ? "debt" : "risk";
  const periods = phong === "QL1" ? KY_QL1 : KY_QL3;
  const pending = periods.filter(k => layBanGhi(`${phong}|${k.id}`).trangThai === "REVIEWED").length;
  const chuaDu = sourceBatches.filter((batch) => batch.status === "MISSING");

  return <div className="page-stack workbench-page">
    <PageIntro title="Công việc theo kỳ" actions={<Button onClick={() => onNavigate(reportView)}>Mở báo cáo của phòng</Button>}/>

    <FigureLine items={[
      { label: "Việc cần xử lý", value: tasks.length, tone: "warning" },
      { label: "Báo cáo chờ duyệt", value: pending, tone: "info" },
      { label: "Nguồn dữ liệu còn thiếu", value: chuaDu.length, tone: "critical" },
    ]}/>

    <div className="workbench-grid">
      <Panel title="Công việc ưu tiên">
        {tasks.length === 0 && <div className="empty-state"><strong>Không có công việc ưu tiên cho tài khoản này.</strong></div>}
        <div className="task-list">{tasks.map((item) => <button className="task-row" type="button" key={item.id} onClick={() => onNavigate(moduleView(item.module))}>
          <span className="task-copy"><strong>{item.title}</strong><small>{item.module} – {item.assignee}</small></span>
          <span className="task-meta"><Badge tone={workTone[item.status] as Tone}>{workLabel[item.status]}</Badge><small>{item.due}</small></span>
          <Icon name="arrow" size={17}/>
        </button>)}</div>
      </Panel>

      <Panel title="Tình trạng nguồn dữ liệu" actions={vaiTro === "CV" && <Button kind="quiet" onClick={() => onNavigate("tinhtrang")}>Xem tình trạng dữ liệu</Button>}>
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
