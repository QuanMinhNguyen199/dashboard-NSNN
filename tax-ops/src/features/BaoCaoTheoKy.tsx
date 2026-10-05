import { Badge, PageIntro, Panel, TableWrap } from "@/components/ui";
import { useDuyet } from "@/state/DuyetContext";
import { KY_QL1 } from "@/data/ql1";
import { KY_QL3 } from "@/data/ql3";
import type { Phong, ReportStatus, Tone, ViewId } from "@/domain/types";

/*
  MH-03 "Báo cáo theo kỳ" — QT-08 của FRS.

  FRS mô tả đúng một bảng: "báo cáo × kỳ hiện trạng thái (Chưa chạy, Nháp, Đã
  rà soát, Đã duyệt, Điều chỉnh) và hạn". Nó trả lời câu hỏi mà thanh duyệt ở
  đầu phân hệ KHÔNG trả lời được: thanh duyệt chỉ nói về kỳ đang mở, còn đây
  nói về cả loạt kỳ — kỳ nào chưa ai đụng vào, kỳ nào đang nằm chờ ai.

  Cột "Hạn" lấy theo lịch báo cáo hiện hành ở BRD mục 3.2: báo cáo tuần trình
  chiều thứ Sáu, báo cáo tháng gửi đầu mối ngày 28. Hạn là thông tin của kỳ,
  không phải của trạng thái, nên nó hiện cả khi kỳ đã duyệt xong.
*/

const NHAN: Record<ReportStatus | "NONE", string> = {
  NONE: "Chưa chạy",
  DRAFT: "Nháp",
  REVIEWED: "Đã rà soát",
  APPROVED: "Đã duyệt",
  AMEND: "Đang điều chỉnh",
  BLOCKED: "Chưa đủ dữ liệu",
};

const SAC: Record<ReportStatus | "NONE", Tone> = {
  NONE: "neutral", DRAFT: "neutral", REVIEWED: "warning", APPROVED: "positive", AMEND: "info", BLOCKED: "critical",
};

interface DongKy { id: string; nhan: string; loaiKy: string; han: string }

/* Hạn theo BRD mục 3.2. Báo cáo tuần: chiều thứ Sáu của tuần kế. Báo cáo
   tháng và báo cáo lũy kế: ngày 28 của tháng báo cáo. */
const hanCua = (loai: "TUAN" | "THANG") =>
  loai === "TUAN" ? "Chiều thứ Sáu tuần kế" : "Ngày 28 của tháng";

export function BaoCaoTheoKy({ phong, onNavigate }: { phong: Phong; onNavigate: (view: ViewId) => void }) {
  const { layBanGhi } = useDuyet();

  const laQL1 = phong === "QL1";
  const tenBaoCao = laQL1 ? "Đánh giá công tác nợ khối doanh nghiệp, tổ chức" : "Kết quả kiểm tra tại bàn theo kế hoạch năm";
  const maBaoCao = laQL1 ? "QL1-01" : "QL3-01";
  const manPhanHe: ViewId = laQL1 ? "debt" : "risk";

  const dong: DongKy[] = laQL1
    ? KY_QL1.map((k) => ({ id: k.id, nhan: k.nhan, loaiKy: k.loai === "TUAN" ? "Tuần" : "Tháng", han: hanCua(k.loai) }))
    : KY_QL3.map((k) => ({ id: k.id, nhan: k.nhan, loaiKy: "Lũy kế tháng", han: hanCua("THANG") }));

  if (!phong) {
    return <div className="page-stack">
      <PageIntro title="Báo cáo theo kỳ"/>
      <Panel title="Không có báo cáo kỳ">
        <div className="empty-state"><strong>Vai này không thuộc phòng nghiệp vụ nào nên không có báo cáo kỳ để theo dõi</strong></div>
      </Panel>
    </div>;
  }

  return <div className="page-stack">
    <PageIntro title="Báo cáo theo kỳ"/>

    <Panel title={tenBaoCao} subtitle={`Mã báo cáo ${maBaoCao} · phòng ${phong} · bấm một kỳ để mở báo cáo của kỳ đó`}>
      <TableWrap label="trạng thái báo cáo theo từng kỳ"><table className="ky-table">
        <colgroup><col style={{ width: 320 }}/><col style={{ width: 140 }}/><col style={{ width: 170 }}/><col style={{ width: 200 }}/><col/></colgroup>
        <thead><tr>
          <th scope="col">Kỳ báo cáo</th>
          <th scope="col">Loại kỳ</th>
          <th scope="col">Trạng thái</th>
          <th scope="col">Hạn</th>
          <th scope="col">Dấu vết gần nhất</th>
        </tr></thead>
        <tbody>{dong.map((k) => {
          const b = layBanGhi(`${phong}|${k.id}`);
          /*
            "Chưa chạy" khác "Nháp", và phân biệt được vì bản ghi duyệt chỉ
            sinh ra khi có người thao tác. Gộp hai thứ làm một thì cả loạt kỳ
            cũ đều hiện "Nháp" như thể ai đó đang làm dở.
          */
          const daDung = Boolean(b.guiLuc || b.duyetLuc || b.lyDoTraLai || b.lyDoDieuChinh || b.trangThai !== "DRAFT");
          const tt: ReportStatus | "NONE" = daDung ? b.trangThai : "NONE";
          return <tr key={k.id} onClick={() => onNavigate(manPhanHe)}>
            <td><button type="button" className="row-select" onClick={(e) => { e.stopPropagation(); onNavigate(manPhanHe); }}>
              <strong>{k.nhan}</strong>
            </button></td>
            <td>{k.loaiKy}</td>
            <td><Badge tone={SAC[tt]}>{NHAN[tt]}</Badge></td>
            <td>{k.han}</td>
            <td>
              {b.duyetLuc ? <small>Duyệt bởi {b.duyetBoi} · {b.duyetLuc}</small>
                : b.guiLuc ? <small>Gửi rà soát bởi {b.guiBoi} · {b.guiLuc}</small>
                : <span className="cell-empty">—</span>}
            </td>
          </tr>;
        })}</tbody>
      </table></TableWrap>
    </Panel>
  </div>;
}
