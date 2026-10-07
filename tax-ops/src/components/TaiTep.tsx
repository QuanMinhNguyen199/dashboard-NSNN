import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Icon, Panel } from "@/components/ui";
import { useAction } from "@/state/ActionContext";

/*
  Một cửa duy nhất cho tệp vào hệ.

  Trước đây hộp thoại hỏi loại tệp: phiếu khai cách lấy dữ liệu, hay file dữ
  liệu từ nguồn. Nhánh "phiếu khai" tồn tại để nuôi màn Cách lấy dữ liệu, mà
  màn đó đã bị gỡ vì không có epic nào trong BRD cần tới. Còn đúng một loại —
  file kết xuất từ hệ nguồn theo FT-00.1 — nên câu hỏi phân loại cũng biến mất
  thay vì để lại một nhóm chọn chỉ có một lựa chọn.

  ── Vì sao KHÔNG phải hộp thoại ─────────────────────────────────────────────

  Cùng ba lý do đã bỏ hộp xem trước (ghi ở đầu `features/XemTruocBaoCao.tsx`),
  cộng một lý do riêng của màn này: nút "Tải tệp bổ sung" chỉ hiện khi CÓ lô
  đang thiếu dữ liệu, và danh sách những lô ấy nằm ngay dưới trên cùng màn.
  Hộp thoại phủ lên trang che mất đúng cái danh sách cho người dùng biết mình
  đang phải bù tệp nào.
*/
const DINH_DANG = ".xlsx,.xls,.csv,.zip";

export function KhoiTaiTep({ onDong }: { onDong: () => void }) {
  const khoi = useRef<HTMLElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [ten, setTen] = useState<string[]>([]);
  const [loi, setLoi] = useState("");
  const notify = useAction();

  /* Khối mới hiện ra thì con trỏ phải tới đó: không còn bẫy focus của
     `<dialog>` làm việc ấy thay. */
  useEffect(() => { khoi.current?.focus(); }, []);

  const dong = () => { setLoi(""); setTen([]); onDong(); };

  const nhap = (event: FormEvent) => {
    event.preventDefault();
    if (!ten.length) {
      setLoi("Chọn ít nhất một tệp trước khi nhập.");
      return;
    }
    notify(`Đã tiếp nhận ${ten.length} tệp: ${ten.join(", ")}. Bản demo chưa gửi tệp lên máy chủ.`);
    dong();
  };

  return <section
    ref={khoi}
    tabIndex={-1}
    className="khoi-tai-tep"
    aria-label="Tải tay tệp bổ sung"
    onKeyDown={(e) => { if (e.key === "Escape") dong(); }}
  >
    <Panel
      title="Tải tay (dự phòng)"
      subtitle="Dùng khi hệ thống chưa kéo được nguồn về. Nhận bản kết xuất từ TMS, TTR, ứng dụng hóa đơn điện tử, ứng dụng xác minh hóa đơn hoặc tổng đài. Nộp được cả file nén gồm nhiều đơn vị của cùng một kỳ."
      actions={<Button kind="quiet" onClick={dong}><Icon name="close" size={16}/><span>Đóng</span></Button>}
    >
      <form onSubmit={nhap} className="tai-tep-form">
        {/* Ô chọn tệp gốc của trình duyệt in nhãn theo ngôn ngữ trình duyệt
            ("Choose Files / No file chosen") và không đổi được. Ở một màn hoàn
            toàn tiếng Việt thì đó là hai chữ lạc; nên ô gốc bị ẩn khỏi cả luồng
            Tab lẫn cây trợ năng, còn nút tiếng Việt bên dưới là control thật. */}
        <div className="file-field">
          <span id="file-field-label">File kết xuất <small>Excel, CSV hoặc ZIP</small></span>
          <div className="file-pick">
            <Button kind="secondary" type="button" icon="file" aria-describedby="file-field-label" onClick={() => file.current?.click()}>Chọn file</Button>
            <span>{ten.length ? `Đã chọn ${ten.length} file` : "Chưa chọn file nào"}</span>
          </div>
          <input ref={file} className="sr-only" type="file" multiple accept={DINH_DANG} tabIndex={-1} aria-hidden="true"
            onChange={(e) => { setTen([...(e.target.files ?? [])].map((f) => f.name)); setLoi(""); }}/>
        </div>
        {ten.length > 0 && <p className="file-chosen" role="status">{ten.join(", ")}</p>}
        {loi && <p className="quality-note" role="alert">{loi}</p>}

        <div className="tai-tep-nut">
          <Button kind="secondary" type="button" onClick={dong}>Hủy</Button>
          <Button kind="primary" type="submit" icon="upload">Nhập</Button>
        </div>
      </form>
    </Panel>
  </section>;
}
