import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Tone } from "@/domain/types";

export type IconName =
  | "home" | "debt" | "risk" | "refund" | "report" | "data"
  | "clock" | "alert" | "check" | "file" | "search" | "upload"
  | "arrow" | "chevronDown" | "menu" | "close" | "users" | "database" | "external" | "logout" | "key";

const paths: Record<IconName, ReactNode> = {
  chevronDown: <polyline points="6 9 12 15 18 9"/>,
  home: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  debt: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h5M8 16h3"/></>,
  risk: <><path d="M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></>,
  refund: <><path d="M4 7h12a4 4 0 0 1 0 8H8"/><path d="m8 11-4 4 4 4"/></>,
  report: <><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></>,
  data: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  alert: <><path d="m12 3 9 16H3L12 3Z"/><path d="M12 9v4M12 16.5v.1"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  file: <><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v5h16v-5"/></>,
  arrow: <path d="m9 5 7 7-7 7"/>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 4a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 4v2"/></>,
  database: <><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6"/></>,
  external: <><path d="M14 5h5v5"/><path d="m19 5-8 8"/><path d="M19 13v6H5V5h6"/></>,
  logout: <><path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4M18 12H9"/></>,
  key: <><circle cx="8" cy="15" r="4.2"/><path d="m11 12 8.5-8.5M16.5 6.5 19 9M14 9l2.5 2.5"/></>,
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function Button({ kind = "secondary", icon, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "primary" | "secondary" | "quiet"; icon?: IconName }) {
  return <button className={`button is-${kind}${className ? ` ${className}` : ""}`} {...props}>{icon && <Icon name={icon} size={17}/>}<span>{children}</span></button>;
}

/**
 * Dòng tổng hợp — MỘT hàng, không phải bốn thẻ.
 *
 * Bốn ô "số to, nhãn nhỏ, dòng phụ, màu nhấn" xếp ngang là khuôn mẫu mà sàn
 * thủ công từ chối, và cũng đúng là thứ mở màn mọi bản dựng máy sinh. Ở Trang
 * công việc, bốn con số này là đếm hàng đợi chứ không phải kết luận, nên chúng
 * đọc như một dòng cộng đặt ngay dưới mô tả trang — vẫn đủ thông tin, không
 * chiếm mất vị trí của việc cần làm.
 */
export function FigureLine({ items }: { items: { label: string; value: ReactNode; note?: ReactNode; tone?: Tone; onSelect?: () => void }[] }) {
  return <div className="figure-line">{items.map((item) => {
    /* Dòng phụ được giữ lại: ở màn nghiệp vụ nó mang thông tin thật ("3.812
       người nộp thuế", "33,7% danh sách đang theo dõi"), bỏ đi là mất dữ liệu
       chứ không phải làm gọn. Thứ bị bỏ là CÁI THẺ, không phải nội dung. */
    const body = <><span>{item.label}</span><strong className={`tone-${item.tone ?? "neutral"}`}>{item.value}</strong>{item.note && <small>{item.note}</small>}</>;
    return item.onSelect
      ? <button key={item.label} type="button" onClick={item.onSelect}>{body}</button>
      : <div key={item.label}>{body}</div>;
  })}</div>;
}

export function KpiStrip({ children }: { children: ReactNode }) {
  return <section className="kpi-strip">{children}</section>;
}

export function Kpi({ label, value, note, tone = "neutral" }: { label: string; value: ReactNode; note?: ReactNode; tone?: Tone }) {
  return <div className={`kpi tone-${tone}`}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

export function Panel({ title, subtitle, actions, children, className = "" }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`.trim()}>
    <header className="panel-head">
      <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      {actions && <div className="panel-actions">{actions}</div>}
    </header>
    <div className="panel-body">{children}</div>
  </section>;
}

/*
  Vùng cuộn nhận `tabIndex={0}` để bàn phím cuộn được bảng rộng. Đã là điểm dừng
  Tab thì phải có tên, nếu không người dùng màn hình đọc gặp tám điểm dừng câm.
*/
export function TableWrap({ children, label }: { children: ReactNode; label?: string }) {
  const vung = useRef<HTMLDivElement>(null);
  const [tran, datTran] = useState(false);

  /*
    Gợi ý cuộn bám THỰC TẾ TRÀN, không bám điểm ngắt.

    Trước đây nó chỉ hiện từ 900px xuống. Nhưng tràn ngang không đi theo bề
    rộng màn hình — nó đi theo hiệu số giữa bảng và khung chứa. Ở 1440px bảng
    nhập kết quả PRS-03 rộng 1752px trong khung 1146px: 606px, khoảng 35%,
    khuất hẳn — và cột khuất đúng là cột `Kết quả`, tức cột mà cả màn sinh ra
    để đọc. Người dùng không có một dấu hiệu nào.

    Ngược lại, ở 390px một bảng bốn cột hẹp thì gợi ý cũ vẫn hiện dù không có
    gì để cuộn. Cùng một phép đo sai, hai hướng.

    `ResizeObserver` theo dõi cả khung lẫn con của nó: khung đổi khi cửa sổ
    hoặc thanh bên đổi, con đổi khi sang trang hay đổi bộ lọc — và lần đổi thứ
    hai không kéo theo lần đổi thứ nhất.
  */
  useEffect(() => {
    const el = vung.current;
    if (!el) return;
    const do_ = () => datTran(el.scrollWidth - el.clientWidth > 1);
    do_();
    const theoDoi = new ResizeObserver(do_);
    theoDoi.observe(el);
    for (const con of Array.from(el.children)) theoDoi.observe(con);
    return () => theoDoi.disconnect();
  }, [children]);

  const ten = label ? `Bảng ${label}` : "Bảng dữ liệu";
  return <div className="table-shell">
    {/* Dải gợi ý là THỊ GIÁC; phần khuất được nói cho trình đọc màn hình ngay
        trong tên vùng, vì ở đó nó đến đúng lúc người dùng bước vào vùng. */}
    {tran && <div className="scroll-hint" aria-hidden="true"><span>Bảng rộng hơn khung · cuộn ngang để xem hết cột</span><Icon name="arrow" size={15}/></div>}
    <div
      ref={vung}
      className="table-wrap"
      tabIndex={0}
      role="region"
      aria-label={tran ? `${ten}, cuộn ngang để xem hết cột` : ten}
    >{children}</div>
  </div>;
}

/*
  Chi tiết của bản ghi đang chọn. Ba màn nghiệp vụ trước đây là bảng chỉ đọc:
  bấm một hàng không dẫn tới đâu, và nửa dưới viewport bỏ trống. Khối này là nơi
  hàng dẫn tới.

  Nó KHÔNG phát minh ra quy trình xử lý. Biên bản khảo sát chưa mô tả luồng xử
  lý nợ hay hoàn thuế, nên ở đây chỉ trình bày dữ liệu đã có và chỉ đúng quy tắc
  đang chi phối bản ghi. Dựng một nút "Chuyển xử lý" lúc này là bịa nghiệp vụ.
*/
export function DetailGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return <dl className="detail-grid">{items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}

/*
  Tên màn đã nằm ở mục điều hướng đang mở, nên tiêu đề chỉ còn tồn tại cho trình
  đọc màn hình. Hệ quả: nếu trang không có dòng dẫn, khối này rỗng — và một nút
  hành động đứng một mình giữa hàng trống là thứ người dùng gọi là "bơ vơ".

  Nút cấp trang từng được bắn lên măng sét bằng portal khi màn đủ rộng. Măng
  sét bỏ rồi, nên nút nằm trong luồng nội dung ở MỌI khổ — đúng chỗ nó vẫn
  đứng ở khổ hẹp từ trước, nên người dùng không phải học lại.
*/
export function PageIntro({ title, actions }: { title: string; actions?: ReactNode }) {
  return <>
    <h1 className="sr-only">{title}</h1>
    {actions && <div className="page-actions">{actions}</div>}
  </>;
}

/*
  Dưới 900px măng sét đã chật vì có nút mở điều hướng, kỳ làm việc và nhãn mô
  phỏng; nhét thêm một nút hành động vào đó làm nó gãy thành ba hàng. Ở khổ đó
  nút quay về nằm trong luồng nội dung, nơi nó trải hết bề ngang như trước.
*/
export function useRongToiThieu(truyVan: string) {
  const [khop, setKhop] = useState(() => typeof window !== "undefined" && window.matchMedia(truyVan).matches);
  useEffect(() => {
    const mq = window.matchMedia(truyVan);
    const dong = () => setKhop(mq.matches);
    dong();
    mq.addEventListener("change", dong);
    return () => mq.removeEventListener("change", dong);
  }, [truyVan]);
  return khop;
}


export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <><div className="segmented" role="group" aria-label={label}>{options.map((item) => <button key={item.value} type="button" className={value === item.value ? "is-active" : undefined} aria-pressed={value === item.value} onClick={() => onChange(item.value)}>{item.label}</button>)}</div><label className="segmented-mobile"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></>;
}

export function SearchField({ value, onChange, placeholder = "Tìm kiếm" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="search-field"><span className="sr-only">{placeholder}</span><Icon name="search" size={17}/><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}/></label>;
}

/*
  Phân trang cho bảng dài.

  Cuộn trong một khung cao cố định đọc được với vài chục dòng, nhưng với 2.455
  dòng thì người dùng mất mốc: không biết đang ở đâu, không quay lại được chỗ
  cũ, và thanh cuộn nhỏ tới mức kéo một pixel là nhảy mấy chục hàng. Trang cho
  lại hai thứ đó — một vị trí đọc được và một bước nhảy xác định.

  Không dựng khi chỉ có một trang: một cụm điều hướng luôn vô hiệu là nhiễu.
*/
export function Pager({ trang, soTrang, onChange }: { trang: number; soTrang: number; onChange: (trang: number) => void }) {
  if (soTrang <= 1) return null;
  const di = (muon: number) => onChange(Math.min(Math.max(1, muon), soTrang));
  return <nav className="pager" aria-label="Phân trang danh sách">
    <button type="button" className="pager-nut truoc" onClick={() => di(trang - 1)} disabled={trang === 1} aria-label="Trang trước"><Icon name="arrow" size={16}/></button>
    {/* `role="status"` để người dùng trình đọc màn hình nghe được vị trí mới
        sau khi bấm, thay vì phải tự đi tìm xem mình đang ở trang nào. */}
    <span className="pager-vi-tri" role="status">Trang <strong>{trang}</strong>/{soTrang}</span>
    <button type="button" className="pager-nut" onClick={() => di(trang + 1)} disabled={trang === soTrang} aria-label="Trang sau"><Icon name="arrow" size={16}/></button>
  </nav>;
}

export function money(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value);
}

export function integer(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}
