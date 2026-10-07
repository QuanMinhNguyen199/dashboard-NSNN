import { useRef, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";

/** Pilot theo MoM 24/9: dùng bản phòng lập để rà soát tổng và từng nhóm.
 * Chưa có mẫu nhập và ngưỡng Q-01: chọn tệp không đồng nghĩa đã đọc/đối chiếu.
 */
export function DoiChieuQL3({ ngay, phamVi, onExport }: {
  ngay: string; phamVi: string; onExport: () => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [tep, datTep] = useState<File | null>(null);
  const [loi, datLoi] = useState("");
  return <section className="ql3-doichieu" aria-label="Đối chiếu báo cáo">
    <header className="ql3-doichieu-heading">
      <span><strong>Đối chiếu với báo cáo của phòng</strong><small>Kiểm tra kết quả tổng hợp trong giai đoạn chạy thử</small></span>
      <Badge>Phục vụ chạy thử</Badge>
    </header>
    <div className="ql3-doichieu-body">
      <p>So sánh báo cáo hệ thống với bản do phòng QL3 lập, cùng kỳ chốt và phạm vi đơn vị. Rà soát tổng toàn ngành và từng nhóm trước khi xác nhận kết quả chạy thử.</p>
      <dl className="ql3-doichieu-context">
        <div><dt>Kỳ chốt</dt><dd>Lũy kế từ 01/01/{ngay.slice(-4)} đến {ngay}</dd></div>
        <div><dt>Phạm vi đối chiếu</dt><dd>{phamVi}</dd></div>
      </dl>
      <div className="ql3-doichieu-sources">
        <section aria-label="Báo cáo hệ thống">
          <h3>Báo cáo hệ thống</h3>
          <p>Kết quả kiểm tra tại bàn theo đơn vị, theo bộ lọc đang chọn.</p>
          <Badge>Dữ liệu mô phỏng</Badge>
          <ExportButton onExport={onExport}>Xuất báo cáo hệ thống</ExportButton>
        </section>
        <section aria-label="Báo cáo của phòng QL3">
          <h3>Báo cáo của phòng QL3</h3>
          <p>{tep ? tep.name : "Chưa chọn tệp báo cáo của phòng cho kỳ này."}</p>
          <input ref={input} type="file" hidden accept=".xlsx,.xls" aria-label="Chọn báo cáo của phòng QL3" onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (!/\.xlsx?$/i.test(file.name) || file.size === 0) {
              datLoi("Chọn tệp Excel .xlsx hoặc .xls có nội dung.");
              return;
            }
            datLoi(""); datTep(file);
          }}/>
          <div className="ql3-doichieu-actions">
            <Button icon="upload" onClick={() => input.current?.click()}>{tep ? "Chọn tệp khác" : "Chọn tệp báo cáo của phòng"}</Button>
            {tep && <Button kind="quiet" onClick={() => { datTep(null); datLoi(""); }}>Bỏ tệp</Button>}
          </div>
          <small>Tệp Excel chỉ được chọn trong phiên xem này, chưa tải lên hoặc đọc số liệu. Đổi kỳ hoặc phạm vi cần chọn lại tệp.</small>
          {loi && <p role="alert">{loi}</p>}
        </section>
      </div>
      <div className="ql3-doichieu-status" role="status">
        <strong>{tep ? "Đã chọn tệp tham chiếu · Chưa đối chiếu số liệu" : "Chưa có kết quả đối chiếu"}</strong>
        <p>{tep ? "Mở tệp của phòng và báo cáo hệ thống đã xuất để rà soát cùng kỳ, cùng đơn vị và từng chỉ tiêu." : "Chuẩn bị báo cáo của phòng và xuất báo cáo hệ thống để rà soát song song."} Bản mô phỏng chưa hỗ trợ đọc và so sánh tệp tự động.</p>
      </div>
      <p className="ql3-doichieu-note">Ngưỡng chênh lệch chấp nhận đang chờ thống nhất với phòng nghiệp vụ. Kết quả đối chiếu phục vụ chạy thử, không thay đổi trạng thái duyệt báo cáo.</p>
    </div>
  </section>;
}
