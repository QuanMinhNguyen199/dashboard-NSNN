import { useRef, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { useAction } from "@/state/ActionContext";
import { useDuyet } from "@/state/DuyetContext";
import type { ReportStatus, Tone } from "@/domain/types";

/*
  Thanh duyệt của kỳ, đặt ngay đầu phân hệ.

  Mục 3 bản thiết kế vẽ luồng duyệt chạy trên chính phân hệ, nên trạng thái và
  thao tác phải nằm cạnh bảng số liệu mà nó nói về. Đặt chúng ở một màn "Báo
  cáo" riêng thì người duyệt phải rời khỏi số vừa đọc để đi tìm nút duyệt, và
  lúc bấm thì không còn nhìn thấy thứ mình đang duyệt.

  Tên trạng thái lấy theo BC-06 của FRS: **Nháp → Đã rà soát → Đã duyệt**, cộng
  **Điều chỉnh** mở từ bản đã duyệt. Trước đó bản demo dùng bộ tên của bản
  thiết kế ("Chờ duyệt", "Đã chốt"); FRS là tài liệu đặc tả chức năng nên nó
  chốt cách gọi, và hai tài liệu nói hai tên cho cùng một bước là thứ phải
  dừng ở đây chứ không mang sang lúc triển khai.

  Một nhãn và một màu cho mỗi trạng thái, giống nhau với mọi vai — cùng một kỳ
  mà chuyên viên gọi tên khác người duyệt thì hai người không đối chiếu được
  màn hình với nhau.
*/

const NHAN: Record<ReportStatus, string> = {
  DRAFT: "Nháp",
  REVIEWED: "Đã rà soát",
  APPROVED: "Đã duyệt",
  AMEND: "Đang điều chỉnh",
  BLOCKED: "Chưa đủ dữ liệu",
};

const SAC: Record<ReportStatus, Tone> = {
  DRAFT: "neutral", REVIEWED: "warning", APPROVED: "positive", AMEND: "info", BLOCKED: "critical",
};

const DIEN_GIAI: Record<ReportStatus, string> = {
  DRAFT: "Chuyên viên đang hoàn thiện số liệu. Chưa gửi rà soát.",
  REVIEWED: "Chuyên viên đã xác nhận số liệu, đang chờ duyệt.",
  APPROVED: "Số liệu kỳ này đã khóa. Muốn sửa phải mở một bản điều chỉnh.",
  AMEND: "Đang sửa để thay cho bản đã duyệt. Bản cũ vẫn giữ cho tới khi bản này được duyệt.",
  BLOCKED: "Chưa đủ dữ liệu để gửi rà soát. Xem mục Tình trạng dữ liệu.",
};

export function ThanhDuyet({ khoa, nhanKy }: { khoa: string; nhanKy: string }) {
  const { layBanGhi, duoc, guiRaSoat, duyet, traLai, moDieuChinh } = useDuyet();
  const notify = useAction();
  const hopLyDo = useRef<HTMLDialogElement>(null);
  const [viec, setViec] = useState<"return" | "amend">("return");
  const [lyDo, setLyDo] = useState("");
  const [loi, setLoi] = useState("");

  const b = layBanGhi(khoa);
  const moHop = (v: "return" | "amend") => { setViec(v); setLyDo(""); setLoi(""); hopLyDo.current?.showModal(); };

  const CHU = viec === "return"
    ? { tieuDe: "Trả lại báo cáo", dan: `Chuyên viên lập báo cáo sẽ thấy lý do này khi mở lại ${nhanKy}.`, nhan: "Lý do trả lại", goiY: "Ví dụ: đề nghị làm rõ Thuế cơ sở 5 tăng nợ", nut: "Trả lại cho chuyên viên" }
    : { tieuDe: "Mở bản điều chỉnh", dan: `Bản đã duyệt của ${nhanKy} vẫn được giữ, và chỉ bị đánh dấu đã thay thế khi bản điều chỉnh được duyệt.`, nhan: "Lý do điều chỉnh", goiY: "Ví dụ: nguồn 9.9.4.15 chốt lại ngày 03, số nợ khó thu thay đổi", nut: "Mở bản điều chỉnh" };

  const xong = () => {
    if (!lyDo.trim()) { setLoi(viec === "return" ? "Nhập lý do trả lại để chuyên viên biết cần sửa gì." : "Nhập lý do điều chỉnh để lưu vào nhật ký của kỳ."); return; }
    const ok = viec === "return" ? traLai(khoa, lyDo.trim()) : moDieuChinh(khoa, lyDo.trim());
    if (!ok) { setLoi("Bạn không có quyền thực hiện việc này ở trạng thái hiện tại."); return; }
    notify(viec === "return"
      ? `Đã trả ${nhanKy} về bản nháp kèm lý do. Chuyên viên lập báo cáo nhận lại để sửa.`
      : `Đã mở bản điều chỉnh cho ${nhanKy}. Bản đã duyệt trước đó vẫn tra cứu được.`);
    hopLyDo.current?.close();
  };

  return <section className="thanh-duyet" aria-label="Trạng thái duyệt của kỳ">
    <div className="duyet-trai">
      <Badge tone={SAC[b.trangThai]}>{NHAN[b.trangThai]}</Badge>
      <div className="duyet-chu">
        <strong>{nhanKy}{b.soBanDaDuyet > 0 && b.trangThai !== "APPROVED" ? " · bản thay thế" : ""}</strong>
        <span>{DIEN_GIAI[b.trangThai]}</span>
      </div>
    </div>

    {/* Dấu vết: ai gửi, ai duyệt, lúc nào. Một dòng, không phải một bảng —
        đây là ngữ cảnh, không phải thứ cần đọc kỹ ở mỗi lần vào màn. */}
    <div className="duyet-vet">
      {b.guiLuc && <span>Gửi rà soát bởi {b.guiBoi} · {b.guiLuc}</span>}
      {b.duyetLuc && <span>Duyệt bởi {b.duyetBoi} · {b.duyetLuc}</span>}
      {b.lyDoTraLai && b.trangThai === "DRAFT" && <span className="duyet-tralai">Lý do trả lại: {b.lyDoTraLai}</span>}
      {b.lyDoDieuChinh && b.trangThai === "AMEND" && <span className="duyet-tralai">Lý do điều chỉnh: {b.lyDoDieuChinh}</span>}
    </div>

    <div className="duyet-nut">
      {duoc(khoa, "return") && <Button onClick={() => moHop("return")}>Trả lại</Button>}
      {duoc(khoa, "amend") && <Button onClick={() => moHop("amend")}>Mở bản điều chỉnh</Button>}
      {duoc(khoa, "send") && <Button kind="primary" onClick={() => { if (!guiRaSoat(khoa)) { notify("Không gửi rà soát được ở trạng thái này."); return; } notify(`Đã gửi ${nhanKy} đi rà soát. Số liệu khóa lại cho tới khi có kết quả.`); }}>Gửi rà soát</Button>}
      {duoc(khoa, "approve") && <Button kind="primary" onClick={() => { if (!duyet(khoa)) { notify("Bạn không duyệt được bản báo cáo do chính mình gửi."); return; } notify(`Đã duyệt ${nhanKy}. Kỳ này khóa số; muốn sửa phải mở bản điều chỉnh.`); }}>Duyệt</Button>}
    </div>

    {/*
      Trả lại và mở điều chỉnh đều BẮT BUỘC có lý do, nên dùng chung một hộp.
      Trả lại không nói vì sao thì chuyên viên nhận về một bản nháp và không
      biết phải sửa gì; điều chỉnh không nói vì sao thì bản đã trình bị thay mà
      không ai giải thích được cho người đã nhận bản cũ.
    */}
    <dialog ref={hopLyDo} className="report-dialog" aria-labelledby="lydo-title">
      {/* `noValidate`: thông báo mặc định của trình duyệt là "Please fill out
          this field" — tiếng Anh, và không nói cần điền gì. */}
      <form className="report-form" noValidate onSubmit={(e) => { e.preventDefault(); xong(); }}>
        <h2 id="lydo-title">{CHU.tieuDe}</h2>
        <p>{CHU.dan}</p>
        <label>{CHU.nhan}
          <input autoFocus maxLength={200} name="lyDoTraLai" value={lyDo} placeholder={CHU.goiY} onChange={(e) => { setLyDo(e.target.value); setLoi(""); }}/>
        </label>
        {loi && <p role="alert" className="quality-note">{loi}</p>}
        <div className="report-form-actions">
          <Button type="button" onClick={() => hopLyDo.current?.close()}>Hủy</Button>
          <Button type="submit" kind="primary">{CHU.nut}</Button>
        </div>
      </form>
    </dialog>
  </section>;
}
