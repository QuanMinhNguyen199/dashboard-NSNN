import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge, Icon, type IconName } from "@/components/ui";
import { TaxLogo } from "@/components/TaxLogo";
import type { UserRole, ViewId } from "@/domain/types";
import type { DemoUser } from "@/auth/demoAuth";

/*
  Màn hình mở theo VAI, không theo phòng.

  Đây là chặn ở mức MÀN HÌNH. Nó chưa phải chặn ở mức dòng dữ liệu — khảo sát
  nói cán bộ xem hồ sơ được giao và phòng xem đơn vị mình, tức lọc DÒNG. Với bản
  demo thì chặn màn là đủ; khi nối dữ liệu thật thì lọc dòng phải làm ở máy chủ,
  không làm ở đây.

  `OFFICER` mở toàn bộ: khảo sát cho thấy chính cán bộ là người tải file, làm
  sạch, ánh xạ và chạy báo cáo — không có vai nào khác làm những việc đó.

  `TAX_LEADER` chỉ mở Trang công việc và Báo cáo: phạm vi xem của lãnh đạo chưa
  được định nghĩa, nên chừa chỗ chứ không đoán nội dung.

  `STATE_LEADER` không có mục nào. Đây là tài khoản của Dashboard Thu NSNN; họ
  không có việc gì trong hệ tác nghiệp.
*/
export const NAV: { id: ViewId; label: string; short: string; icon: IconName; group: "work" | "business" | "data"; roles: UserRole[] }[] = [
  { id: "workbench", label: "Trang công việc", short: "Công việc", icon: "home", group: "work", roles: ["OFFICER", "TAX_LEADER"] },
  { id: "debt", label: "Nợ và cưỡng chế", short: "Nợ", icon: "debt", group: "business", roles: ["OFFICER"] },
  { id: "risk", label: "Kiểm tra và rủi ro", short: "Kiểm tra", icon: "risk", group: "business", roles: ["OFFICER"] },
  { id: "refund", label: "Hoàn thuế và hỗ trợ", short: "Hoàn thuế", icon: "refund", group: "business", roles: ["OFFICER"] },
  { id: "reports", label: "Báo cáo", short: "Báo cáo", icon: "report", group: "business", roles: ["OFFICER", "TAX_LEADER"] },
  { id: "batches", label: "Lô dữ liệu", short: "Lô dữ liệu", icon: "database", group: "data", roles: ["OFFICER"] },
  { id: "mapping", label: "Ánh xạ quản lý", short: "Ánh xạ", icon: "users", group: "data", roles: ["OFFICER"] },
  { id: "rules", label: "Quy tắc nghiệp vụ", short: "Quy tắc", icon: "file", group: "data", roles: ["OFFICER"] },
];

/** Màn hình vai này được mở. Khi nối Keycloak, thay bằng client role trong token. */
export const navFor = (role: UserRole) => NAV.filter((item) => item.roles.includes(role));

const roleLabels = { OFFICER: "Cán bộ thuế", TAX_LEADER: "Lãnh đạo Thuế", STATE_LEADER: "Lãnh đạo nhà nước" } as const;

const NSNN_URL =
  import.meta.env.VITE_PORTAL === "true" ? "/nsnn/" :
  import.meta.env.VITE_NSNN_URL ??
  (import.meta.env.DEV ? "http://localhost:5173/" : "/dashboard-NSNN/");
/* Mang theo `from=tax-ops` để Dashboard biết người dùng đến từ đâu. Với mô hình
   ba vai thì chỉ màn từ chối quyền dùng liên kết này: không vai nào vào được
   Web quản lý mà đồng thời có `NSNN_VIEW`. */
export const NSNN_LINK = (() => {
  const url = new URL(NSNN_URL, window.location.origin);
  url.searchParams.set("from", "tax-ops");
  return url.href;
})();

export function Shell({ view, user, onView, onLogout, children }: { view: ViewId; user: DemoUser; onView: (view: ViewId) => void; onLogout: () => void; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const duoc = navFor(user.role);
  useEffect(() => setMenuOpen(false), [view]);
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      lastTrigger.current?.focus();
    };
  }, [menuOpen]);

  const openMenu = (trigger: HTMLButtonElement) => {
    lastTrigger.current = trigger;
    setMenuOpen(true);
  };
  const onDrawerKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setMenuOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...(drawerRef.current?.querySelectorAll<HTMLElement>('button,[href],select,input,[tabindex]:not([tabindex="-1"])') ?? [])].filter((item) => !item.hasAttribute("disabled"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const nav = <>
    <div className="brand"><TaxLogo/><div><strong>Quản lý nghiệp vụ Thuế</strong><span>Thuế TP Hà Nội</span></div></div>
    <nav className="side-nav" aria-label="Nghiệp vụ chính">
      {([["work", "Điều hành"], ["business", "Nghiệp vụ"], ["data", "Dữ liệu"]] as const).map(([nhom, nhan]) => {
        const muc = duoc.filter((item) => item.group === nhom);
        if (!muc.length) return null;
        return <div className="nav-section" role="group" aria-label={nhan} key={nhom}>
          <span className="nav-group" aria-hidden="true">{nhan}</span>
          {muc.map((item) => <NavItem key={item.id} item={item} active={view === item.id} onView={onView}/>)}
        </div>;
      })}
    </nav>
    <div className="sidebar-user">
      <strong>{user.name}</strong><small>{roleLabels[user.role]} · {user.unit}</small>
      <button className="logout-button" type="button" onClick={onLogout}><Icon name="logout" size={16}/><span>Đăng xuất</span></button>
    </div>
  </>;

  /*
    `inert` cắt hẳn nhánh nền khỏi cây trợ năng khi drawer mở. Bẫy Tab bằng JS đã
    có, nhưng nó không chặn tìm-trong-trang hay rotor của trình đọc màn hình.
    React 18 chưa khai báo thuộc tính này nên phải spread qua một object.
  */
  const chan = menuOpen ? ({ inert: "" } as Record<string, string>) : {};

  return <div className="ops-app">
    {/* Điều hướng có 8 mục cộng nút đăng xuất, nên không có lối tắt thì mỗi lần
        đổi màn là chín lần Tab trước khi chạm nội dung. */}
    <a className="skip-link" href="#workspace">Bỏ qua điều hướng, tới nội dung</a>
    <aside className="sidebar" {...chan}>{nav}</aside>
    <header className="topbar" {...chan}>
      <button className="menu-button" type="button" onClick={(event) => openMenu(event.currentTarget)} aria-label="Mở điều hướng" aria-expanded={menuOpen} aria-haspopup="dialog"><Icon name="menu"/></button>
      <div className="topbar-context"><span>Tháng 9/2026</span><span>Thuế TP Hà Nội</span></div>
      <Badge tone="warning" mock>Mô phỏng</Badge>
    </header>
    <main className="workspace" id="workspace" {...chan}><div key={view} className="workspace-view">{children}</div></main>
    {/* Thanh đáy lấy năm mục ĐẦU TIÊN CỦA VAI, không cắt cứng năm mục đầu bảng:
        vai Quản trị dữ liệu không mở ba màn nghiệp vụ, cắt cứng sẽ cho họ năm nút
        dẫn tới bốn màn họ không vào được. Phần dư nằm trong "Thêm". */}
    <nav className="mobile-nav" aria-label="Điều hướng nhanh" {...chan} style={{ gridTemplateColumns: `repeat(${Math.min(duoc.length, 5) + (duoc.length > 5 ? 1 : 0)}, 1fr)` }}>
      {duoc.slice(0, 5).map((item) => <button key={item.id} type="button" className={view === item.id ? "is-active" : undefined} aria-label={item.label} aria-current={view === item.id ? "page" : undefined} onClick={() => onView(item.id)}><Icon name={item.icon}/><span>{item.short}</span></button>)}
      {duoc.length > 5 && <button type="button" className={duoc.slice(5).some((i) => i.id === view) ? "is-active" : undefined} aria-expanded={menuOpen} aria-haspopup="dialog" onClick={(event) => openMenu(event.currentTarget)}><Icon name="menu"/><span>Thêm</span></button>}
    </nav>
    {menuOpen && <div className="nav-scrim" onClick={() => setMenuOpen(false)}><aside ref={drawerRef} className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Điều hướng nghiệp vụ" onKeyDown={onDrawerKeyDown} onClick={(event) => event.stopPropagation()}><button ref={closeRef} type="button" className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Đóng điều hướng"><Icon name="close"/></button>{nav}</aside></div>}
  </div>;
}

function NavItem({ item, active, onView }: { item: (typeof NAV)[number]; active: boolean; onView: (view: ViewId) => void }) {
  return <button type="button" className={`nav-item${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => onView(item.id)}><span>{item.label}</span></button>;
}
