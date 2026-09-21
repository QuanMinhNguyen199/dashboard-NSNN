import { useId, useRef, useState } from "react";

export interface AutocompleteOption {
  value: string;
  label: string;
  search?: string;
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
}: {
  id: string;
  label: string;
  value: string;
  options: AutocompleteOption[];
  onChange: (value: string) => void;
  placeholder: string;
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
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
          value={open ? query : (selected?.label ?? "")}
          placeholder={placeholder}
          onFocus={() => { setOpen(true); setQuery(""); setActive(0); }}
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
      {open && (
        <div id={listId} className="dautocomplete-list" role="listbox" aria-label={label}>
          {matches.length ? matches.map((option, index) => (
            <button
              id={`${listId}-${index}`}
              key={option.value}
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
          )) : <p>Không tìm thấy kết quả phù hợp.</p>}
        </div>
      )}
    </div>
  );
}
