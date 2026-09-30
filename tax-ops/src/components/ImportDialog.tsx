import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { useAction } from "@/state/ActionContext";

/*
  Một cửa duy nhất cho tệp vào hệ.

  Trước đây hộp thoại hỏi loại tệp: phiếu khai cách lấy dữ liệu, hay file dữ
  liệu từ nguồn. Nhánh "phiếu khai" tồn tại để nuôi màn Cách lấy dữ liệu, mà
  màn đó đã bị gỡ vì không có epic nào trong BRD cần tới. Còn đúng một loại —
  file kết xuất từ hệ nguồn theo FT-00.1 — nên câu hỏi phân loại cũng biến mất
  thay vì để lại một nhóm chọn chỉ có một lựa chọn.
*/
const DINH_DANG = ".xlsx,.xls,.csv,.zip";

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [ten, setTen] = useState<string[]>([]);
  const [loi, setLoi] = useState("");
  const notify = useAction();

  /* `showModal` phải gọi trên phần tử đã có trong DOM, nên hộp thoại luôn được
     dựng và chỉ đóng/mở bằng lệnh, không dựng theo điều kiện. */
  if (dialog.current) {
    if (open && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current.open) dialog.current.close();
  }

  const dong = () => { setLoi(""); setTen([]); onClose(); };

  const nhap = (event: FormEvent) => {
    event.preventDefault();
    if (!ten.length) {
      setLoi("Chọn ít nhất một tệp trước khi nhập.");
      return;
    }
    notify(`Đã tiếp nhận ${ten.length} tệp: ${ten.join(", ")}. Bản demo chưa gửi tệp lên máy chủ.`);
    dong();
  };

  return <dialog ref={dialog} className="report-dialog import-dialog" aria-labelledby="import-title" onClose={dong} onKeyDown={(event) => {
    if (event.key === "Escape") { event.preventDefault(); dong(); return; }
    if (event.key !== "Tab") return;
    /* Bẫy Tab giống hộp thoại tạo báo cáo: `<dialog>` modal đã chặn phần nền,
       nhưng Safari vẫn cho Tab chạy ra thanh công cụ trình duyệt. */
    const dieuKhien = [...event.currentTarget.querySelectorAll<HTMLElement>('input:not([tabindex="-1"]), select, button:not(:disabled)')];
    const dau = dieuKhien[0];
    const cuoi = dieuKhien[dieuKhien.length - 1];
    if (event.shiftKey && document.activeElement === dau) { event.preventDefault(); cuoi?.focus(); }
    if (!event.shiftKey && document.activeElement === cuoi) { event.preventDefault(); dau?.focus(); }
  }}>
    <form onSubmit={nhap} className="report-form">
      <h2 id="import-title">Nhập dữ liệu</h2>
      <p>Nhận bản kết xuất từ TMS, TTR, ứng dụng HĐĐT, ứng dụng xác minh hóa đơn hoặc tổng đài Viettel. Nộp được cả file nén của nhiều đơn vị trong một kỳ.</p>


      {/* Ô chọn tệp gốc của trình duyệt in nhãn theo ngôn ngữ trình duyệt
          ("Choose Files / No file chosen") và không đổi được. Ở một màn hoàn
          toàn tiếng Việt thì đó là hai chữ lạc; nên ô gốc bị ẩn khỏi cả luồng
          Tab lẫn cây trợ năng, còn nút tiếng Việt bên dưới là control thật. */}
      <div className="file-field">
        <span id="file-field-label">Tệp nộp <small>Excel, CSV hoặc ZIP</small></span>
        <div className="file-pick">
          <Button kind="secondary" type="button" icon="file" aria-describedby="file-field-label" onClick={() => file.current?.click()}>Chọn tệp</Button>
          <span>{ten.length ? `${ten.length} tệp đã chọn` : "Chưa chọn tệp nào"}</span>
        </div>
        <input ref={file} className="sr-only" type="file" multiple accept={DINH_DANG} tabIndex={-1} aria-hidden="true"
          onChange={(e) => { setTen([...(e.target.files ?? [])].map((f) => f.name)); setLoi(""); }}/>
      </div>
      {ten.length > 0 && <p className="file-chosen" role="status">{ten.join(", ")}</p>}
      {loi && <p className="quality-note" role="alert">{loi}</p>}

      <div className="report-form-actions">
        <Button kind="secondary" type="button" onClick={dong}>Hủy</Button>
        <Button kind="primary" type="submit" icon="upload">Nhập</Button>
      </div>
    </form>
  </dialog>;
}
