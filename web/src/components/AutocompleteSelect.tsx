import { Fragment, useId, useRef, useState } from "react";

export interface AutocompleteOption {
  value: string;
  label: string;
  search?: string;
  /**
   * Tên phân nhóm; các lựa chọn cùng `group` phải nằm liền nhau trong mảng.
   *
   * Cần vì ô `Phạm vi` trộn ba loại đối tượng khác hẳn nhau — toàn thành phố,
   * 28 cơ quan thuế, 126 phường/xã — vào một danh sách 155 dòng. Không có tiêu
   * đề nhóm thì "Thuế cơ sở 1" và "Ba Đình" nằm cạnh nhau như hai thứ cùng loại,
   * và người dùng không biết mình đang chọn một đơn vị thu hay một địa bàn.
   */
  group?: string;
}

const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLocaleLowerCase("vi");

/** Ô chọn có tìm kiếm cho danh mục dài; chỉ đổi giá trị khi chọn một gợi ý. */
export function AutocompleteSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  options: AutocompleteOption[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const selected = options.find((option) => option.value === value);
  const needle = fold(query.trim());
  const matches = needle
    ? options.filter((option) => fold(`${option.label} ${option.search ?? ""}`).includes(needle))
    : options;

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
    input.current?.blur();
  };

  return (
    <div className="dautocomplete">
      <label htmlFor={id}>{label}</label>
      <div className="dautocomplete-control">
        <input
          ref={input}
          id={id}
          type="text"
          disabled={disabled}
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
          value={open ? query : (selected?.label ?? "")}
          placeholder={placeholder}
          onFocus={() => { if (!disabled) { setOpen(true); setQuery(""); setActive(0); } }}
          onBlur={() => { setOpen(false); setQuery(""); }}
          onChange={(event) => { setQuery(event.target.value); setActive(0); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { event.preventDefault(); setOpen(false); input.current?.blur(); }
            else if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive((index) => Math.min(index + 1, matches.length - 1)); }
            else if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => Math.max(0, index - 1)); }
            else if (event.key === "Enter" && open && matches[active]) { event.preventDefault(); choose(matches[active].value); }
          }}
        />
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <circle cx="8.6" cy="8.6" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="m12.7 12.7 4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      {open && !disabled && (
        <div
          id={listId}
          className="dautocomplete-list"
          role="listbox"
          aria-label={label}
          /*
            `tabIndex={-1}` để danh sách không thành một điểm dừng của Tab.

            Chrome tự cho một vùng cuộn được nhận tiêu điểm bàn phím khi vùng đó
            không có con nào focus được — mà ở đây mọi lựa chọn đều mang
            `tabIndex={-1}` vì chúng được điều khiển bằng phím mũi tên. Hệ quả:
            Tab từ ô nhập rơi vào chính cái khung cuộn, `blur` của ô nhập đóng
            danh sách, khung vừa nhận tiêu điểm biến mất, và tiêu điểm rơi về
            `<body>` — vẽ viền 3px quanh cả trang. Phải nhấn Tab lần nữa mới tới
            được ô kế tiếp.
          */
          tabIndex={-1}
        >
          {matches.length ? matches.map((option, index) => (
            <Fragment key={option.value}>
              {/* Tiêu đề nhóm chỉ in khi nhóm ĐỔI, nên nó không lặp lại ở từng
                  dòng và vẫn bám đúng vị trí khi danh sách bị lọc ngắn lại. */}
              {option.group && option.group !== matches[index - 1]?.group && (
                <p className="dautocomplete-group" role="presentation">{option.group}</p>
              )}
            <button
              id={`${listId}-${index}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              data-value={option.value}
              className={index === active ? "is-active" : undefined}
              tabIndex={-1}
              onPointerDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(option.value)}
            >{option.label}</button>
            </Fragment>
          )) : <p>Không tìm thấy kết quả phù hợp.</p>}
        </div>
      )}
    </div>
  );
}
