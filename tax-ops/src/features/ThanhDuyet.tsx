import { useRef, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { useAction } from "@/state/ActionContext";
import { duocChot, duocGui, duocTraLai, useDuyet } from "@/state/DuyetContext";
import type { ReportStatus, Tone, VaiTro } from "@/domain/types";

/*
  Thanh duyệt của kỳ, đặt ngay đầu phân hệ.

  Mục 3 bản thiết kế vẽ luồng duyệt chạy trên chính phân hệ, nên trạng thái và
  thao tác phải nằm cạnh bảng số liệu mà nó nói về. Đặt chúng ở một màn "Báo
  cáo" riêng thì trưởng phòng phải rời khỏi số vừa đọc để đi tìm nút duyệt, và
  lúc bấm thì không còn nhìn thấy thứ mình đang duyệt.

  G10 cho ba nhãn: Nháp → Chờ duyệt → Đã chốt. Một nhãn và một màu cho mỗi
  trạng thái, giống nhau với cả hai vai — cùng một kỳ mà chuyên viên gọi tên
  khác trưởng phòng thì hai người không đối chiếu được màn hình với nhau.
*/

const NHAN: Record<ReportStatus, string> = {
  DRAFT: "Nháp",
  PENDING: "Chờ duyệt",
  FINAL: "Đã chốt",
  BLOCKED: "Chưa đủ dữ liệu",
};
const SAC: Record<ReportStatus, Tone> = { DRAFT: "neutral", PENDING: "warning", FINAL: "positive", BLOCKED: "critical" };

const DIEN_GIAI: Record<ReportStatus, string> = {
  DRAFT: "Chưa gửi duyệt.",
  PENDING: "Đang chờ trưởng phòng xem xét.",
  FINAL: "Báo cáo đã được duyệt và chốt số liệu.",
  BLOCKED: "Chưa đủ dữ liệu để gửi duyệt. Kiểm tra mục Tình trạng dữ liệu.",
};

export function ThanhDuyet({ khoa, nhanKy, vaiTro }: {
  /** Khóa riêng cho từng phân hệ và từng kỳ. */
  khoa: string;
  nhanKy: string;
  actor: string;
  vaiTro: VaiTro;
}) {
  const { layBanGhi, guiDuyet, chotSo, traLai } = useDuyet();
  const notify = useAction();
  const hopTraLai = useRef<HTMLDialogElement>(null);
  const [lyDo, setLyDo] = useState("");
  const [loi, setLoi] = useState("");

  const b = layBanGhi(khoa);

  const xongTraLai = () => {
    if (!lyDo.trim()) { setLoi("Nhập lý do trả lại để chuyên viên biết cần sửa gì."); return; }
    if (!traLai(khoa, lyDo.trim())) { setLoi("Bạn không có quyền trả lại báo cáo ở trạng thái này."); return; }
    notify(`Đã trả ${nhanKy} về bản nháp kèm lý do. Chuyên viên lập báo cáo nhận lại để sửa.`);
    setLyDo(""); setLoi(""); hopTraLai.current?.close();
  };

  return <section className="thanh-duyet" aria-label="Trạng thái duyệt của kỳ">
    <div className="duyet-trai">
      <Badge tone={SAC[b.trangThai]}>{NHAN[b.trangThai]}</Badge>
      <div className="duyet-chu">
        <strong>{nhanKy}</strong>
        <span>{DIEN_GIAI[b.trangThai]}</span>
      </div>
    </div>

    {/* Dấu vết: ai gửi, ai chốt, lúc nào. Một dòng, không phải một bảng —
        đây là ngữ cảnh, không phải thứ cần đọc kỹ ở mỗi lần vào màn. */}
    <div className="duyet-vet">
      {b.guiLuc && <span>Gửi duyệt bởi {b.guiBoi} · {b.guiLuc}</span>}
      {b.chotLuc && <span>Chốt bởi {b.chotBoi} · {b.chotLuc}</span>}
      {b.lyDoTraLai && b.trangThai === "DRAFT" && <span className="duyet-tralai">Lý do trả lại: {b.lyDoTraLai}</span>}
    </div>

    <div className="duyet-nut">
      {duocTraLai(b, vaiTro) && <Button onClick={() => { setLoi(""); hopTraLai.current?.showModal(); }}>Trả lại</Button>}
      {duocGui(b, vaiTro) && <Button kind="primary" onClick={() => { if (!guiDuyet(khoa)) { notify("Không thể gửi duyệt báo cáo ở trạng thái này."); return; } notify(`Đã gửi ${nhanKy} lên trưởng phòng. Số liệu khóa lại cho tới khi có kết quả duyệt.`); }}>Gửi trưởng phòng duyệt</Button>}
      {duocChot(b, vaiTro) && <Button kind="primary" onClick={() => { if (!chotSo(khoa)) { notify("Bạn không có quyền duyệt báo cáo ở trạng thái này."); return; } notify(`Đã chốt ${nhanKy}. Số liệu đã khóa; muốn sửa phải chạy lại một phiên bản mới.`); }}>Duyệt và chốt số</Button>}
    </div>

    {/*
      Trả lại BẮT BUỘC có lý do. Bản thiết kế ghi "Trả lại + lý do" ngay trên
      sơ đồ luồng; trả lại không nói vì sao thì chuyên viên nhận về một bản
      nháp và không biết phải sửa gì, nên vòng duyệt thứ hai cũng hỏng như
      vòng thứ nhất.
    */}
    {vaiTro === "TP" && <dialog ref={hopTraLai} className="report-dialog" aria-labelledby="tralai-title">
      {/* `noValidate`: thông báo mặc định của trình duyệt là "Please fill out
          this field" — tiếng Anh, và không nói cần điền gì. Câu của hệ nói rõ
          lý do dùng để làm gì. */}
      <form className="report-form" noValidate onSubmit={(e) => { e.preventDefault(); xongTraLai(); }}>
        <h2 id="tralai-title">Trả lại báo cáo</h2>
        <p>Chuyên viên lập báo cáo sẽ thấy lý do này khi mở lại {nhanKy}.</p>
        <label>Lý do trả lại
          <input autoFocus maxLength={200} name="lyDoTraLai" value={lyDo} placeholder="Ví dụ: đề nghị làm rõ Thuế cơ sở 5 tăng nợ" onChange={(e) => { setLyDo(e.target.value); setLoi(""); }}/>
        </label>
        {loi && <p role="alert" className="quality-note">{loi}</p>}
        <div className="report-form-actions">
          <Button type="button" onClick={() => hopTraLai.current?.close()}>Hủy</Button>
          <Button type="submit" kind="primary">Trả lại cho chuyên viên</Button>
        </div>
      </form>
    </dialog>}
  </section>;
}
