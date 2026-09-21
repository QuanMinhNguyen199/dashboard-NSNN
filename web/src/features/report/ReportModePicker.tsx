import { useNarrow } from "@/components/useNarrow";
import type { ReportMode } from "@/domain/types";

export const REPORT_MODES: { id: ReportMode; label: string; question: string }[] = [
  {
    id: "nsnn",
    label: "Thu NSNN",
    question: "Số thu chia theo địa bàn, cơ quan thuế hoặc ngành nghề thế nào?",
  },
  {
    id: "budget",
    label: "Dự toán & dự báo",
    question: "Thực hiện đang ở đâu so với dự toán, và dự báo cuối kỳ ra sao?",
  },
  {
    id: "taxpayer",
    label: "Quản lý thu",
    question: "Số thu phân theo ngành nghề, cơ quan thuế và địa bàn như thế nào?",
  },
  {
    id: "inspection",
    label: "Kết quả kiểm tra",
    question: "Đã kiểm tra bao nhiêu cuộc, xử lý và thu về bao nhiêu?",
  },
];

/**
 * Bộ chọn loại báo cáo.
 *
 * **Một** điều khiển ở mỗi khổ màn hình, không phải hai cái cùng điều khiển một
 * state rồi ẩn một cái bằng CSS. Hai control cùng tồn tại trong DOM nghĩa là hai
 * điểm dừng Tab, hai chỗ phải giữ đồng bộ, và hai nơi có thể trôi khỏi nhau —
 * đúng lỗi mà bộ chọn cơ quan thuế và ô cấp quản lý đã mắc trước đó.
 *
 * Khổ rộng dùng thanh phân đoạn vì bốn nhãn hiện hết cùng lúc thì người dùng
 * thấy ngay có những loại báo cáo nào. Khổ hẹp dùng `select` vì bốn nhãn tiếng
 * Việt dài sẽ vỡ thành bốn dòng nút, chiếm gần nửa màn hình đầu tiên.
 */
export function ReportModePicker({
  value,
  onChange,
}: {
  value: ReportMode;
  onChange: (mode: ReportMode) => void;
}) {
  const narrow = useNarrow();
  if (narrow)
    return (
      <label className="dfield dreport-mode">
        <span>Loại báo cáo</span>
        <select value={value} onChange={(event) => onChange(event.target.value as ReportMode)}>
          {REPORT_MODES.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.label}
            </option>
          ))}
        </select>
      </label>
    );

  return (
    <div className="dfield dreport-mode">
      <span id="report-mode-label">Loại báo cáo</span>
      <div className="dseg" role="group" aria-labelledby="report-mode-label">
        {REPORT_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={value === mode.id ? "is-active" : undefined}
            aria-pressed={value === mode.id}
            title={mode.question}
            onClick={() => onChange(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
