import { useState } from "react";
import { Badge, Button, FigureLine, PageIntro, Panel, TableWrap, integer } from "@/components/ui";
import { KhoiTaiTep } from "@/components/TaiTep";
import { dataRuns, sourceBatches } from "@/data/mock";
import { Runs } from "@/features/Runs";
import type { SourceBatch, Tone, VaiTro } from "@/domain/types";

/*
  Màn "Tình trạng dữ liệu" — tên lấy nguyên văn §1.2 bản thiết kế.

  MỘT màn, không có tab con. `design_ql1ql3:58` gọi đích danh một màn trong
  khung chung; không chỗ nào trong hai bản thiết kế liệt kê tab con cho nó
  (§4.2 và §5.2 chỉ liệt kê tab cho các phân hệ).

  Màn trả lời đúng một câu hỏi, và dòng 48 nói rõ cần gì để trả lời: "lần kéo
  gần nhất và lần kéo tới; nguồn nào đủ, nguồn nào thiếu hay lệch ngày; số
  dòng nguồn so với số dòng vào kho". Ba khối dưới đây là ba vế của câu ấy,
  xếp từ kết luận xuống chi tiết — đọc tới đâu đủ thì dừng ở đó.

  CÒN THIẾU so với tài liệu: lưới 31 ô đủ/thiếu/lỗi theo cơ quan thuế
  (`design_ql2ql4` §4.7). Chưa dựng.
*/

const SAC_NGUON: Record<SourceBatch["status"], Tone> = {
  READY: "positive", WARNING: "warning", MISSING: "critical", PROCESSING: "info",
};
const CHU_NGUON: Record<SourceBatch["status"], string> = {
  READY: "Đủ", WARNING: "Cần xem lại", MISSING: "Thiếu file", PROCESSING: "Đang xử lý",
};

export function TinhTrangDuLieu({ vaiTro }: { vaiTro: VaiTro }) {
  const [nhapMo, setNhapMo] = useState(false);

  /*
    G12: "Tải tay chỉ là dự phòng… nút chỉ hiện khi nguồn thiếu". Nút gắn vào
    điều kiện thật — có nguồn nào đang thiếu dữ liệu hay không — chứ không
    đứng sẵn ở măng sét mọi lúc.
  */
  const nguonThieu = sourceBatches.filter((b) => b.status === "MISSING");
  const canXem = sourceBatches.filter((b) => b.status !== "READY");
  const loiDangMo = dataRuns.filter((r) => r.status === "FAILED" || r.status === "MISMATCH").length;
  const dongLech = dataRuns.reduce((t, r) => t + Math.abs(r.rowsSource === null ? 0 : r.rowsSource - r.rowsStore), 0);
  const tuDong = new Set(dataRuns.filter((r) => r.mode === "AUTO").map((r) => r.source)).size;
  const soNguon = new Set(dataRuns.map((r) => r.source)).size;

  return <div className="page-stack">
    <PageIntro title="Tình trạng dữ liệu"/>

    {vaiTro === "CV" && nhapMo && <KhoiTaiTep onDong={() => setNhapMo(false)}/>}

    <Panel title="Tổng quan" subtitle={`Số liệu đến ${dataRuns[0]?.startedAt ?? "—"} · nguồn: nhật ký thu thập`}>
      <FigureLine items={[
        { label: "Lượt chạy trong ngày", value: dataRuns.length },
        { label: "Nguồn thu thập tự động", value: `${tuDong}/${soNguon}`, note: "TTR cần nhập tệp thủ công" },
        { label: "Lượt thu thập cần xử lý", value: loiDangMo, tone: loiDangMo ? "critical" : "positive" },
        { label: "Dòng lệch khi đối soát", value: integer(dongLech), tone: dongLech ? "warning" : "positive", note: "Nguồn so với kho" },
      ]}/>
    </Panel>

    {/*
      Bảng nguồn là vế thứ hai: dải số trên nói CÓ vấn đề hay không, bảng này
      nói vấn đề nằm ở nguồn nào. Thiếu nó thì người dùng đọc được "2 lượt cần
      xử lý" rồi phải mở nhật ký ra dò từng dòng.
    */}
    {/* Nút tải tệp đứng ngay trên bảng nói nguồn nào thiếu — G12: "tải tay chỉ
        là dự phòng, nút chỉ hiện khi nguồn thiếu". Trước đây nó ở măng sét,
        tức hiện ở mọi màn và mọi lúc, đúng điều tài liệu dặn đừng làm. */}
    <Panel
      title="Nguồn dữ liệu của kỳ"
      subtitle={canXem.length > 0 ? `${canXem.length}/${sourceBatches.length} nguồn cần xem lại` : "Mọi nguồn đã về đủ"}
      actions={vaiTro === "CV" && nguonThieu.length > 0 ? <Button kind="secondary" icon="upload" onClick={() => setNhapMo(true)}>Tải tệp bổ sung</Button> : undefined}
    >
      <TableWrap label="nguồn dữ liệu của kỳ">
        <table className="ql1-ds-table" style={{ minWidth: 980 }}>
          <colgroup>{[150, 210, 150, 160, 160, 150].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
          <thead><tr>
            <th scope="col">Nguồn</th>
            <th scope="col">Kỳ</th>
            <th scope="col" className="num">File đã nhận</th>
            <th scope="col" className="num">Số dòng</th>
            <th scope="col">Cập nhật</th>
            <th scope="col">Trạng thái</th>
          </tr></thead>
          <tbody>
            {sourceBatches.map((b) => <tr key={b.id} className={b.status === "MISSING" ? "is-co" : undefined}>
              <td>{b.source}</td>
              <td>{b.period}</td>
              <td className="num">{b.received}/{b.expected}</td>
              <td className="num">{integer(b.rows)}</td>
              <td>{b.updatedAt}</td>
              <td><Badge tone={SAC_NGUON[b.status]}>{CHU_NGUON[b.status]}</Badge></td>
            </tr>)}
          </tbody>
        </table>
      </TableWrap>
    </Panel>

    {/* Vế thứ ba: từng lượt kéo, để đi tìm nguyên nhân khi hai vế trên nói
        "chưa đủ". Bấm một hàng mở chi tiết tham số và số dòng đối soát. */}
    <Runs readOnly={vaiTro !== "CV"}/>
  </div>;
}
