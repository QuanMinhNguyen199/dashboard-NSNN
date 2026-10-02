import { Badge, FigureLine, PageIntro, Panel, TableWrap, integer } from "@/components/ui";
import { dataRuns } from "@/data/mock";
import type { Tone } from "@/domain/types";

const trangThaiText = { OK: "Đạt", MISMATCH: "Lệch số dòng", FAILED: "Lỗi", RUNNING: "Đang chạy" } as const;
const trangThaiTone: Record<keyof typeof trangThaiText, Tone> = { OK: "positive", MISMATCH: "warning", FAILED: "critical", RUNNING: "info" };

/*
  Màn duy nhất của vai Vận hành dữ liệu.

  Bản thiết kế mục 3 đặt ra vai thứ năm, không thuộc phòng nào: theo dõi job
  kéo và xử lý, cho kéo lại, xử lý lỗi (Q-77). Phạm vi lần này đúng một màn.

  Khác màn Lượt chạy của phòng nghiệp vụ ở chỗ nó nhìn theo JOB chứ không theo
  kỳ báo cáo: cái gì đang chạy, cái gì hỏng, lệch bao nhiêu dòng. Người vận
  hành không đọc số liệu nghiệp vụ, nên màn này không có cột tiền.
*/
export function GiamSat() {
  const dangChay = dataRuns.filter((r) => r.status === "RUNNING").length;
  const hong = dataRuns.filter((r) => r.status === "FAILED").length;
  const lech = dataRuns.filter((r) => r.status === "MISMATCH").length;
  const tongLech = dataRuns.reduce((t, r) => t + Math.abs(r.rowsSource === null ? 0 : r.rowsSource - r.rowsStore), 0);

  return <div className="page-stack">
    <PageIntro title="Giám sát dữ liệu"/>

    <FigureLine items={[
      { label: "Lượt thu thập trong ngày", value: dataRuns.length },
      { label: "Đang chạy", value: dangChay, tone: dangChay ? "info" : "neutral" },
      { label: "Lượt thu thập bị lỗi", value: hong, tone: hong ? "critical" : "positive" },
      { label: "Dòng lệch khi đối soát", value: integer(tongLech), tone: lech ? "warning" : "positive", note: "Nguồn so với kho" },
    ]}/>

    <Panel title="Nhật ký thu thập dữ liệu">
      <TableWrap label="nhật ký thu thập dữ liệu"><table className="giamsat-table">
        <thead><tr>
          <th scope="col">Mã lượt</th><th scope="col">Nguồn</th><th scope="col">Cách chạy</th>
          <th scope="col">Bắt đầu</th><th scope="col" className="num">Dòng nguồn</th>
          <th scope="col" className="num">Dòng vào kho</th><th scope="col">Kết quả</th>
        </tr></thead>
        <tbody>{dataRuns.map((r) => <tr key={r.id}>
          <td><code>{r.id}</code></td>
          <td><span>{r.source}</span><small>{r.period}</small></td>
          <td>{r.mode === "AUTO" ? "Tự động" : "Thủ công"}</td>
          <td>{r.startedAt}</td>
          <td className="num">{r.rowsSource === null ? "—" : integer(r.rowsSource)}</td>
          <td className="num">{integer(r.rowsStore)}</td>
          <td><Badge tone={trangThaiTone[r.status]}>{trangThaiText[r.status]}</Badge></td>
        </tr>)}</tbody>
      </table></TableWrap>
    </Panel>
  </div>;
}
