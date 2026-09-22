import { LEVEL_BY_ID, LOCAL_LEVELS, type ManagementLevelFilter } from "@/domain/tms";

/** Tầng trên: trung ương và địa phương. Mọi Chương đều tra được cấp. */
const TOP_OPTIONS: { value: ManagementLevelFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "trung-uong", label: "Trung ương" },
  { value: "dia-phuong", label: "Địa phương" },
];

/** Hai cấp bên trong địa phương; chỉ hiện khi đang đứng trong nhánh địa phương. */
const LOCAL_OPTIONS: { value: ManagementLevelFilter; label: string }[] = [
  { value: "dia-phuong", label: "Tất cả địa phương" },
  ...LOCAL_LEVELS.map((id) => ({ value: id as ManagementLevelFilter, label: LEVEL_BY_ID[id].name })),
];

const isLocalBranch = (value: ManagementLevelFilter) =>
  value === "dia-phuong" || (LOCAL_LEVELS as string[]).includes(value);

/**
 * Hai hàng chứ không phải một hàng sáu nút.
 *
 * Các cấp không ngang hàng: thành phố và phường/xã đều nằm trong địa phương.
 * Bày chúng thành một hàng năm nút là nói rằng chọn "Phường/xã" và chọn "Trung
 * ương" là hai thao tác cùng loại, trong khi cái thứ nhất là đi sâu vào một
 * nhánh của cái thứ hai. Hàng thứ hai chỉ hiện khi đang ở trong nhánh địa
 * phương.
 */
export function LevelFilter({
  value,
  onChange,
}: {
  value: ManagementLevelFilter;
  onChange: (value: ManagementLevelFilter) => void;
}) {
  const local = isLocalBranch(value);
  return (
    <div className="dtms-levelbar">
      <div className="dtms-levelbar-label">
        <span>Cấp quản lý của Chương</span>
        {/* Câu này phải trả lời chiều đang gây nhầm. Bản cũ nói "đổi cấp thì địa
            bàn không đổi" — đúng nhưng không ai hỏi điều đó. Câu người dùng thật
            sự hỏi là ngược lại: đã chọn một phường rồi thì sao vẫn bấm được
            Trung ương. Phụ lục trả lời thẳng, nên mượn nguyên ý của nó. */}
        <small>
          Cấp của Chương trên chứng từ, không phải cấp của địa bàn: một phường vẫn có giao dịch mang Chương
          trung ương hoặc tỉnh.
        </small>
      </div>
      <div className="dtms-levelbar-controls">
        <div className="dseg" role="group" aria-label="Cấp quản lý của Chương">
          {TOP_OPTIONS.map((option) => {
            const active = option.value === "dia-phuong" ? local : value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                className={active ? "is-active" : undefined}
                onClick={() => onChange(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {local && (
          <div className="dseg is-sub" role="group" aria-label="Cấp bên trong địa phương">
            {LOCAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={value === option.value}
                className={value === option.value ? "is-active" : undefined}
                onClick={() => onChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
