import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Badge, Button, FigureLine, PageIntro, Panel, SearchField, Segmented, TableWrap } from "@/components/ui";
import { CaseLayout, useCaseSelection } from "@/components/CaseLayout";
import { reportVersions } from "@/data/catalog";
import { reportRuns } from "@/data/mock";
import type { ReportRun, ReportStatus, ReportVersion, Tone, UserRole } from "@/domain/types";
import { useAction } from "@/state/ActionContext";

type Cycle = "ALL" | "WEEK" | "MONTH" | "YEAR";
const statusText: Record<ReportStatus, string> = { DRAFT: "Bản nháp", REVIEW: "Chờ duyệt", APPROVED: "Đã duyệt", PUBLISHED: "Đã phát hành", BLOCKED: "Đang vướng" };
const statusTone: Record<ReportStatus, Tone> = { DRAFT: "neutral", REVIEW: "warning", APPROVED: "info", PUBLISHED: "positive", BLOCKED: "critical" };

/*
  Bốn bước của luồng phát hành, theo đúng thứ tự tài liệu đề xuất ghi:
  nháp → chờ duyệt → đã duyệt → phát hành. `BLOCKED` nằm ngoài chuỗi vì nó là
  trạng thái dữ liệu chưa đạt, không phải một bước duyệt.
*/
const CHUOI: ReportStatus[] = ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED"];
const BUOC = [
  { trang: "DRAFT", ten: "Bản nháp", mo: "Chạy dữ liệu và xử lý lỗi" },
  { trang: "REVIEW", ten: "Chờ duyệt", mo: "Khóa số và gửi người duyệt" },
  { trang: "APPROVED", ten: "Đã duyệt", mo: "Gắn người duyệt và thời điểm" },
  { trang: "PUBLISHED", ten: "Phát hành", mo: "Xuất đúng mẫu, lưu phiên bản" },
] as const;

/** Bước kế tiếp và nhãn của nút đẩy trạng thái. Không có nghĩa là hàng đó xong. */
const TIEP: Partial<Record<ReportStatus, { den: ReportStatus; nhan: string; role: UserRole }>> = {
  DRAFT: { den: "REVIEW", nhan: "Gửi duyệt", role: "OFFICER" },
  REVIEW: { den: "APPROVED", nhan: "Duyệt", role: "TAX_LEADER" },
  APPROVED: { den: "PUBLISHED", nhan: "Phát hành", role: "TAX_LEADER" },
};
const STORAGE_KEY = "tax-ops-reports:shared-demo";

const dauThoiGian = () => {
  const t = new Date();
  const hai = (n: number) => String(n).padStart(2, "0");
  return `${hai(t.getDate())}/${hai(t.getMonth() + 1)} – ${hai(t.getHours())}:${hai(t.getMinutes())}`;
};

export function Reports({ actor, owner, role, moTao, onDaMoTao }: { actor: string; owner: string; role: UserRole; moTao: boolean; onDaMoTao: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("");
  const [newCycle, setNewCycle] = useState<ReportRun["cycle"]>("MONTH");
  const [formError, setFormError] = useState("");
  const [saved] = useState(() => {
    try {
      const data = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
      return data && Array.isArray(data.runs) && Array.isArray(data.versions) ? data as { runs: ReportRun[]; versions: ReportVersion[] } : null;
    } catch { return null; }
  });
  const notify = useAction();
  const [cycle, setCycle] = useState<Cycle>("ALL");
  const [search, setSearch] = useState("");
  const cases = useCaseSelection(reportRuns[0]?.id ?? "");
  const chon = cases.selectedId;
  const setChon = cases.setSelectedId;

  // Chung một vùng lưu trong tab để hai tài khoản demo đi được hết luồng lập → duyệt.
  const [runs, setRuns] = useState<ReportRun[]>(saved?.runs ?? reportRuns);
  const [versions, setVersions] = useState<ReportVersion[]>(saved?.versions ?? reportVersions);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ runs, versions })); }
    catch { notify("Không lưu được thay đổi vào trình duyệt. Dữ liệu có thể mất khi rời trang."); }
  }, [runs, versions, notify]);

  const closeCreate = () => { dialog.current?.close(); document.getElementById("global-create-report")?.focus(); };
  const createDraft = (event: FormEvent) => {
    event.preventDefault();
    if (role !== "OFFICER") return;
    if (!name.trim() || !period.trim()) { setFormError("Nhập tên và kỳ báo cáo."); return; }
    const id = `draft-${crypto.randomUUID()}`;
    const timestamp = dauThoiGian();
    setRuns(current => [{ id, name: name.trim(), period: period.trim(), cycle: newCycle, owner, source: "Chưa chọn nguồn", status: "DRAFT", updatedAt: timestamp }, ...current]);
    setVersions(current => [{ id: `${id}-v1`, runId: id, version: "v1", createdAt: timestamp, createdBy: actor, approvedBy: null, note: "Tạo bản nháp; chưa chạy dữ liệu" }, ...current]);
    setChon(id); setCycle("ALL"); setSearch(""); setName(""); setPeriod(""); setFormError(""); closeCreate();
    notify("Đã tạo bản nháp và lưu trong phiên demo trên trình duyệt này.");
  };

  /*
    Nút "Tạo báo cáo" nằm trên măng sét nên nó bấm được cả khi ĐANG mở màn Báo
    cáo. Lúc đó không có lần dựng mới nào để một hiệu ứng "chạy khi mount" bám
    vào, nên yêu cầu mở form đi qua một cờ từ App rồi được trả lại ngay — bằng
    tham số đường dẫn thì lần bấm thứ hai trên cùng một màn im lặng không mở.
  */
  useEffect(() => {
    if (!moTao) return;
    if (role === "OFFICER") { setFormError(""); dialog.current?.showModal(); }
    onDaMoTao();
  }, [moTao, role, onDaMoTao]);

  /* Đường dẫn dán tay `?create=1` vẫn mở form, và tham số được dọn ngay sau đó
     để tải lại trang không mở lại hộp thoại. */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("create") === "1" && role === "OFFICER") {
      dialog.current?.showModal();
    }
    if (url.searchParams.has("create")) {
      url.searchParams.delete("create");
      window.history.replaceState({}, "", url);
    }
  }, [role]);

  const rows = useMemo(
    () => runs.filter((row) =>
      (role !== "TAX_LEADER" || ["REVIEW", "APPROVED", "PUBLISHED"].includes(row.status)) &&
      (cycle === "ALL" || row.cycle === cycle) &&
      `${row.name} ${row.owner} ${row.period}`.toLowerCase().includes(search.toLowerCase())
    ),
    [runs, role, cycle, search],
  );

  const dayTrangThai = (row: ReportRun) => {
    const buoc = TIEP[row.status];
    if (!buoc || buoc.role !== role) return;
    const luc = dauThoiGian();
    setChon(row.id);
    setRuns((truoc) => truoc.map((r) => r.id === row.id ? { ...r, status: buoc.den, updatedAt: luc } : r));
    if (buoc.den !== "REVIEW") setVersions((truoc) => {
      const cua = truoc.filter((v) => v.runId === row.id);
      if (buoc.den === "APPROVED") {
        /* Duyệt không tạo phiên bản mới — nó gắn người duyệt vào bản đang chờ. */
        const moiNhat = cua[0];
        if (!moiNhat) return truoc;
        return truoc.map((v) => v.id === moiNhat.id ? { ...v, approvedBy: actor } : v);
      }
      const so = cua.length + 1;
      return [{ id: `${row.id}-ph${so}`, runId: row.id, version: `v${so}`, createdAt: luc, createdBy: actor, approvedBy: actor, note: "Phát hành bản chính thức" }, ...truoc];
    });
    notify(buoc.den === "REVIEW"
      ? `Đã gửi “${row.name}” chờ Lãnh đạo Thuế duyệt trong bản demo. Chưa chạy hoặc kiểm tra dữ liệu thật.`
      : buoc.den === "APPROVED"
      ? `Đã duyệt “${row.name}” lúc ${luc}, người duyệt ${actor}.`
      : `Đã phát hành “${row.name}” lúc ${luc}. Phiên bản được lưu kèm người duyệt.`);
  };

  const dem = (trang: ReportStatus) => runs.filter((r) => r.status === trang).length;
  const bc = rows.find((r) => r.id === chon) ?? rows[0];
  const pb = bc ? versions.filter((v) => v.runId === bc.id) : [];
  const buocHienTai = bc ? CHUOI.indexOf(bc.status) : -1;
  const nextAction = bc && TIEP[bc.status]?.role === role ? TIEP[bc.status] : undefined;
  const nhanTrangThai = (trang: ReportStatus) => trang === "REVIEW"
    ? role === "TAX_LEADER" ? "Cần duyệt" : "Đã gửi duyệt"
    : statusText[trang];
  const detail = bc && <Panel
    title={`Phiên bản – ${bc.name}`}
    actions={nextAction && <Button kind="primary" onClick={() => dayTrangThai(bc)}>{nextAction.nhan}</Button>}
  >
    {pb.length === 0
      ? <div className="empty-state"><strong>Báo cáo này chưa có lần chạy nào được lưu</strong></div>
      : <div className="timeline">{pb.map((v) => <div key={v.id} className={`timeline-step${v.approvedBy ? " is-done" : ""}`}>
          <i/>
          <span>{v.version}</span>
          <div><strong>{v.createdAt} – {v.createdBy}</strong><span>{v.note}{v.approvedBy ? ` – duyệt bởi ${v.approvedBy}` : " – chưa duyệt"}</span></div>
        </div>)}</div>}
    <details className="workflow-details">
      <summary>Xem luồng phát hành</summary>
      <div className="approval-flow">{BUOC.map((b, i) => {
        const qua = buocHienTai > i;
        const dang = buocHienTai === i;
        return <div key={b.trang} className={dang ? "is-current" : qua ? "is-done" : undefined} aria-current={dang ? "step" : undefined}>
          <span>{i + 1}</span>
          <strong>{b.trang === "REVIEW" ? nhanTrangThai("REVIEW") : b.ten}{dang && <span className="sr-only"> — bước hiện tại</span>}{qua && <span className="sr-only"> — đã qua</span>}</strong>
          <small>{b.mo}</small>
        </div>;
      })}</div>
      {bc.status === "BLOCKED" && <div className="notice critical"><strong>Báo cáo đang vướng dữ liệu</strong><span>{bc.qualityNote ?? "Chưa đủ điều kiện để vào luồng duyệt."} Xử lý ở màn Lô dữ liệu trước khi khóa số.</span></div>}
    </details>
  </Panel>;

  return <div className="page-stack reports-page">
    <PageIntro title={role === "TAX_LEADER" ? "Duyệt báo cáo" : "Báo cáo"}/>
    <dialog ref={dialog} className="report-dialog" aria-labelledby="create-report-title" aria-describedby="create-report-note" onClose={() => document.getElementById("global-create-report")?.focus()} onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('input, select, button:not(:disabled)')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <form onSubmit={createDraft} className="report-form">
        <h2 id="create-report-title">Tạo bản nháp báo cáo</h2>
        <p id="create-report-note">Lưu trong phiên demo trên trình duyệt này. Chưa chạy dữ liệu hoặc gửi phê duyệt.</p>
        <label>Tên báo cáo<input autoFocus required maxLength={160} value={name} onChange={e => setName(e.target.value)} name="reportName" /></label>
        <label>Chu kỳ<select value={newCycle} onChange={e => setNewCycle(e.target.value as ReportRun["cycle"])} name="reportCycle"><option value="WEEK">Tuần</option><option value="MONTH">Tháng</option><option value="YEAR">Năm</option></select></label>
        <label>Kỳ báo cáo<input required maxLength={80} placeholder="Ví dụ: Tháng 9/2026" value={period} onChange={e => setPeriod(e.target.value)} name="reportPeriod" /></label>
        {formError && <p role="alert" className="quality-note">{formError}</p>}
        <div className="report-form-actions"><Button type="button" onClick={closeCreate}>Hủy</Button><Button type="submit" kind="primary">Tạo bản nháp</Button></div>
      </form>
    </dialog>
    {/* Một vai trò, một cách thể hiện: dải này từng là bản dựng thứ ba bằng div
        thô, xếp nhãn-trái/số-phải trên mobile trong khi FigureLine xếp
        nhãn-trên-số ở cùng breakpoint. Số đếm chạy theo trạng thái thật, nên
        duyệt một báo cáo là thấy nó dịch. */}
    <FigureLine items={role === "TAX_LEADER" ? [
      { label: "Cần duyệt", value: dem("REVIEW"), tone: dem("REVIEW") ? "warning" : "neutral" },
      { label: "Đã duyệt", value: dem("APPROVED"), tone: "info" },
      { label: "Đã phát hành", value: dem("PUBLISHED"), tone: "positive" },
    ] : [
      { label: "Bản nháp", value: dem("DRAFT") },
      { label: "Đã gửi duyệt", value: dem("REVIEW"), tone: "info" },
      { label: "Đang vướng", value: dem("BLOCKED"), tone: dem("BLOCKED") ? "critical" : "neutral" },
      { label: "Đã phát hành", value: dem("PUBLISHED"), tone: "positive" },
    ]}/>
    <CaseLayout label="Chi tiết phiên bản báo cáo" detail={detail} mobileOpen={cases.mobileOpen} onClose={cases.close}>
    <Panel title={role === "TAX_LEADER" ? "Báo cáo đã gửi" : "Danh sách báo cáo"} actions={<div className="inline-controls"><Segmented label="Chu kỳ báo cáo" value={cycle} onChange={setCycle} options={[{ value: "ALL", label: "Tất cả" }, { value: "WEEK", label: "Tuần" }, { value: "MONTH", label: "Tháng" }, { value: "YEAR", label: "Năm" }]}/><SearchField value={search} onChange={setSearch} placeholder="Tìm báo cáo hoặc đơn vị"/></div>}>
      <TableWrap label="danh sách báo cáo"><table>
        <thead><tr><th scope="col">Tên báo cáo</th><th scope="col">Kỳ báo cáo</th><th scope="col">Đơn vị / nguồn</th><th scope="col">Cập nhật</th><th scope="col">Cảnh báo dữ liệu</th><th scope="col">Trạng thái</th></tr></thead>
        <tbody>{rows.map((row) => {
          return <tr key={row.id} onClick={(e) => cases.select(row.id, e)} className={row.id === bc?.id ? "is-selected" : undefined}>
            {/*
              Cả hàng bấm được cho chuột, nhưng đích bàn phím phải là một control
              thật. Nút ở ô đầu giữ nguyên ngữ nghĩa bảng, thứ mà role="button"
              trên <tr> sẽ phá mất.
            */}
            {/*
              Ô tên chỉ còn MỘT dòng. Cảnh báo chất lượng trước đây nằm dưới tên
              dưới dạng dòng phụ có điều kiện, nên ba hàng có cảnh báo cao hơn ba
              hàng không có — mắt phải căn lại ở mỗi hàng, và bảng mất nhịp.
              Cảnh báo chuyển sang cột riêng bên phải, nơi hàng nào cũng có một
              ô và chiều cao hàng không còn phụ thuộc dữ liệu.
            */}
            <td><button type="button" className="row-select" aria-pressed={row.id === bc?.id} onClick={(e) => { e.stopPropagation(); cases.select(row.id, e); }}><strong>{row.name}</strong>{/* Dưới 901px bảng cuộn ngang nên cột Trạng thái nằm ngoài khung nhìn với
                  MỌI hàng, không riêng hàng chờ duyệt. Chip này vì thế dựng cho mọi
                  hàng: dựng có điều kiện thì vừa bỏ sót trạng thái của năm hàng kia,
                  vừa làm một hàng cao hơn phần còn lại. */}
              <span className="report-inline-status"><Badge tone={row.status === "REVIEW" && role === "OFFICER" ? "info" : statusTone[row.status]}>{nhanTrangThai(row.status)}</Badge></span></button></td>
            <td>{row.period}</td>
            {/*
              Nguồn gộp thành dòng phụ của đơn vị lập, đúng khuôn hai dòng mà
              các bảng khác đã dùng (Nợ: tên + MST; Lô dữ liệu: nguồn + kỳ).
              Khuôn này là cách bảng trong hệ giữ chiều cao hàng đều: MỌI hàng
              đều hai dòng, nên tên báo cáo dài xuống dòng cũng không làm hàng
              cao thêm. Nó còn trả lại một cột cho cảnh báo dữ liệu.
            */}
            <td><strong>{row.owner}</strong><small>{row.source}</small></td>
            <td>{row.updatedAt}</td>
            <td>{row.qualityNote ? <small className="quality-note">{row.qualityNote}</small> : <span className="cell-empty">—</span>}</td>
            <td><Badge tone={row.status === "REVIEW" && role === "OFFICER" ? "info" : statusTone[row.status]}>{nhanTrangThai(row.status)}</Badge></td>
          </tr>;
        })}{rows.length === 0 && <tr><td colSpan={6}>Không tìm thấy báo cáo. Hãy đổi từ khóa hoặc chu kỳ.</td></tr>}</tbody>
      </table></TableWrap>
    </Panel>
    </CaseLayout>
  </div>;
}
