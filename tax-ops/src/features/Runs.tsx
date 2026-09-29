import { useMemo, useState } from "react";
import { CaseLayout, useCaseSelection } from "@/components/CaseLayout";
import { Badge, Button, DetailGrid, FigureLine, PageIntro, Panel, SearchField, TableWrap, integer } from "@/components/ui";
import { dataRuns } from "@/data/mock";
import type { DataRun, Tone } from "@/domain/types";
import { useAction } from "@/state/ActionContext";

const trangThaiText = { OK: "Đạt", MISMATCH: "Lệch số dòng", FAILED: "Lỗi", RUNNING: "Đang chạy" } as const;
const trangThaiTone: Record<DataRun["status"], Tone> = { OK: "positive", MISMATCH: "warning", FAILED: "critical", RUNNING: "info" };
const cachChayText = { AUTO: "Tự động", MANUAL: "Tải tay" } as const;

/** Chênh lệch giữa số dòng ở nguồn và số dòng vào kho. Không đo được thì null. */
const lech = (r: DataRun) => r.rowsSource === null ? null : r.rowsSource - r.rowsStore;

export function Runs() {
  const notify = useAction();
  const [search, setSearch] = useState("");
  const cases = useCaseSelection(dataRuns[0]?.id ?? "");

  const rows = useMemo(
    () => dataRuns.filter((r) => `${r.id} ${r.source} ${r.period} ${r.scope}`.toLowerCase().includes(search.toLowerCase())),
    [search],
  );
  const luot = rows.find((r) => r.id === cases.selectedId) ?? rows[0];

  const tuDong = new Set(dataRuns.filter((r) => r.mode === "AUTO").map((r) => r.source)).size;
  const loiDangMo = dataRuns.filter((r) => r.status === "FAILED" || r.status === "MISMATCH").length;
  const dongLech = dataRuns.reduce((t, r) => t + Math.abs(lech(r) ?? 0), 0);

  /*
    Chi tiết một lượt trả lời đúng ba câu mà FT-05.4 đặt ra: kéo bằng tham số
    nào, số dòng ở nguồn có khớp số dòng vào kho không, và bản này là phiên bản
    thứ mấy của cùng nguồn + kỳ.
  */
  const detail = luot && <Panel
    title={`Lượt ${luot.id} – ${luot.source}`}
    source={luot.source}
  >
    <DetailGrid items={[
      { label: "Tham số kỳ", value: luot.period },
      { label: "Phạm vi kéo", value: luot.scope },
      { label: "Cách chạy", value: <>{cachChayText[luot.mode]} <small>bắt đầu {luot.startedAt}</small></> },
      { label: "Phiên bản vùng thô", value: <>v{luot.version} <small>không ghi đè bản trước</small></> },
      { label: "Số dòng ở nguồn", value: luot.rowsSource === null ? <>Chưa đếm được <small>lượt chưa hoàn tất</small></> : integer(luot.rowsSource) },
      { label: "Số dòng vào kho", value: integer(luot.rowsStore) },
      { label: "Chênh lệch đối soát", value: lech(luot) === null ? "—" : lech(luot) === 0 ? <>0 <small>khớp</small></> : <>{integer(Math.abs(lech(luot)!))} <small>dòng chưa vào kho</small></> },
      { label: "Kết quả", value: <Badge tone={trangThaiTone[luot.status]}>{trangThaiText[luot.status]}</Badge> },
    ]}/>
    <div className={`notice ${luot.status === "OK" ? "positive" : luot.status === "RUNNING" ? "info" : luot.status === "FAILED" ? "critical" : "warning"}`}>
      <strong>{luot.status === "OK" ? "Lượt chạy đạt đối soát" : luot.status === "RUNNING" ? "Lượt đang chạy" : luot.status === "FAILED" ? "Lượt chạy hỏng" : "Số dòng không khớp"}</strong>
      <span>{luot.note}</span>
      {/* Nút nằm cạnh chính dải báo kết quả mà nó trả lời; để ở đầu khối thì
          đầu khối cao thấp khác nhau tuỳ lượt có lỗi hay không. */}
      {luot.status !== "OK" && luot.status !== "RUNNING" && (
        <Button kind="quiet" icon="upload" onClick={() => notify(`Đã mở kênh tải tay thay cho lượt ${luot.id}. Bản tải tay sẽ thành phiên bản v${luot.version + 1}, không ghi đè bản cũ.`)}>Tải file tay thay lượt này</Button>
      )}
    </div>
  </Panel>;

  return <div className="page-stack">
    <PageIntro
      title="Lượt chạy dữ liệu"
      description="Mỗi lần kéo dữ liệu về vùng thô là một lượt có tham số, số dòng đối soát và phiên bản riêng."
      actions={<Button kind="primary" icon="upload" onClick={() => notify("Bản demo chưa nối hệ nguồn nên chưa chạy thật được.")}>Chạy lại theo tham số cũ</Button>}
    />

    {/*
      Nói thẳng phần chưa có: kéo tự động phụ thuộc một quyết định chưa chốt.
      Không nói thì màn này trông như đã nối xong hệ nguồn.
    */}
    <div className="notice warning">
      <strong>Kéo tự động chưa được phép cho mọi nguồn</strong>
      <span>Thuế TP chưa chốt việc cho tool kéo trực tiếp và dùng tài khoản nào (Q-73, Q-75). TTR vẫn phải tải tay vì chạy trên IE cũ. Nguồn chưa tự động được thì tải file tay vào cùng vùng thô.</span>
    </div>

    <FigureLine items={[
      { label: "Lượt chạy trong ngày", value: dataRuns.length },
      { label: "Nguồn kéo được tự động", value: `${tuDong}/5`, note: "TTR còn phải tải tay" },
      { label: "Lượt lỗi đang mở", value: loiDangMo, tone: loiDangMo ? "critical" : "positive" },
      { label: "Dòng lệch khi đối soát", value: integer(dongLech), tone: dongLech ? "warning" : "positive", note: "Nguồn so với kho" },
    ]}/>

    <CaseLayout detail={detail} mobileOpen={cases.mobileOpen} onClose={cases.close} label="Chi tiết lượt chạy">
      <Panel
        title="Nhật ký lượt chạy"
        source="Vùng dữ liệu thô"
        actions={<SearchField value={search} onChange={setSearch} placeholder="Tìm mã lượt, nguồn hoặc kỳ"/>}
      >
        <TableWrap label="nhật ký lượt chạy"><table>
          <thead><tr>
            <th scope="col">Mã lượt</th><th scope="col">Nguồn / kỳ</th><th scope="col">Cách chạy</th>
            <th scope="col" className="num">Dòng ở nguồn</th><th scope="col" className="num">Dòng vào kho</th>
            <th scope="col" className="num">Bản</th><th scope="col">Kết quả</th>
          </tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id} onClick={(e) => cases.select(r.id, e)} className={r.id === cases.selectedId ? "is-selected" : undefined}>
            <td><button type="button" className="row-select" aria-pressed={r.id === cases.selectedId} onClick={(e) => { e.stopPropagation(); cases.select(r.id, e); }}><code>{r.id}</code></button></td>
            <td><strong>{r.source}</strong><small>{r.period}</small></td>
            <td>{cachChayText[r.mode]}<small>{r.startedAt}</small></td>
            <td className="num">{r.rowsSource === null ? "—" : integer(r.rowsSource)}</td>
            <td className="num">{integer(r.rowsStore)}</td>
            <td className="num">v{r.version}</td>
            <td><Badge tone={trangThaiTone[r.status]}>{trangThaiText[r.status]}</Badge></td>
          </tr>)}</tbody>
        </table></TableWrap>
        <footer className="table-footer">
          <span>Hiển thị {rows.length}/{dataRuns.length} lượt mô phỏng – vùng thô giữ mọi phiên bản, không ghi đè</span>
        </footer>
      </Panel>
    </CaseLayout>
  </div>;
}
