import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui";
import { CUM_MUC, MucPhanHeProvider, MucSidebar } from "@/components/MucPhanHe";
import { TaxLogo } from "@/components/TaxLogo";
import type { ViewId } from "@/domain/types";
import { NAV, NHAN_VAI, NHOM, navCho } from "@/components/nav";
import { rutGonTenDonVi } from "@/data/danhMuc";
import type { DemoUser } from "@/auth/demoAuth";


const NSNN_URL =
  import.meta.env.VITE_PORTAL === "true" ? `${import.meta.env.BASE_URL}nsnn/` :
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
  const duoc = navCho(user);
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
      {NHOM.map(({ id: nhom, nhan }) => {
        const muc = duoc.filter((item) => item.nhom === nhom);
        if (!muc.length) return null;
        return <div className="nav-section" role="group" aria-label={nhan} key={nhom}>
          <span className="nav-group" aria-hidden="true">{nhan}</span>
          {muc.map((item) => <Fragment key={item.id}>
            <NavItem item={item} active={view === item.id} onView={onView}/>
            {/* Cụm mục chỉ hiện dưới phân hệ ĐANG MỞ. Dựng nó dưới mọi phân
                hệ thì thanh bên thành một mục lục ba chục dòng, và người dùng
                phải đọc mục của phòng khác để tìm mục của mình. */}
            {CUM_MUC[item.id] && <MucSidebar view={item.id} visible={view === item.id} onNavigate={() => setMenuOpen(false)}/>}
          </Fragment>)}
        </div>;
      })}
    </nav>
    <div className="sidebar-user">
      <strong>{user.name}</strong><small title={`${NHAN_VAI[user.vaiTro]}${user.phong ? ` ${user.phong}` : ""} – ${user.unit}`}>{NHAN_VAI[user.vaiTro]}{user.phong ? ` ${user.phong}` : ""} · {rutGonTenDonVi(user.unit)}</small>
      <button className="logout-button" type="button" onClick={onLogout}><Icon name="logout" size={16}/><span>Đăng xuất</span></button>
    </div>
  </>;

  /*
    `inert` cắt hẳn nhánh nền khỏi cây trợ năng khi drawer mở. Bẫy Tab bằng JS đã
    có, nhưng nó không chặn tìm-trong-trang hay rotor của trình đọc màn hình.
    React 18 chưa khai báo thuộc tính này nên phải spread qua một object.
  */
  const chan = menuOpen ? ({ inert: "" } as Record<string, string>) : {};

  /*
    Măng sét không còn nút cấp hệ thống nào.

    "Tạo báo cáo" đi cùng màn Báo cáo đã gỡ: luồng duyệt nay chạy trên chính
    phân hệ, và bản nháp của kỳ do hệ sinh tự động chứ không do người bấm tạo
    — mục 3 bản thiết kế vẽ đúng thế ("Hệ thống kéo + xử lý tự động → Sinh báo
    cáo mẫu bản nháp").

  /* `key={view}`: xem ghi chú ở `MucPhanHeProvider` về vì sao nó phải dựng lại. */
  return <MucPhanHeProvider key={view} view={view}><div className="ops-app">
    {/* Điều hướng cộng nút đăng xuất đứng trước nội dung, nên không có lối tắt
        thì mỗi lần đổi màn là mấy lần Tab trước khi chạm nội dung. */}
    <a className="skip-link" href="#workspace">Bỏ qua điều hướng, tới nội dung</a>
    <aside className="sidebar" {...chan}>{nav}</aside>
    {/*
      KHÔNG CÒN MĂNG SÉT.

      Nó từng mang bốn thứ: nút mở điều hướng ở khổ hẹp, dải bối cảnh "Tháng
      9/2026 · Thuế TP Hà Nội", ô cắm cho nút cấp trang, và một ô cắm thứ hai
      cho nút cấp hệ thống vốn đã rỗng từ lâu (`hanhDongChung = null`).

      Ba thứ đầu đi đâu:
      • Nút mở điều hướng xuống thanh điều hướng đáy — xem ghi chú ở đó. Đây
        là thứ BẮT BUỘC phải chuyển: dưới 900px thanh bên ẩn, nên nếu không có
        nút ấy thì MỤC CỦA PHÂN HỆ không còn lối nào để mở.
      • Dải bối cảnh bỏ hẳn: kỳ đang xem đã nằm trong thanh lọc chung ngay dòng
        đầu nội dung, còn tên cơ quan thì lặp lại ở mọi màn mà không ai cần.
      • Nút cấp trang quay về nằm trong luồng nội dung — đúng chỗ nó vẫn đứng ở
        khổ hẹp từ trước tới nay, nên không phải học lại gì.

      Hệ quả về bố cục: thanh lọc chung nay dính thẳng lên mép trên khung nhìn
      thay vì dính dưới măng sét, và `--topbar-h` không còn.
    */}
    <main className="workspace" id="workspace" {...chan}><div key={view} className="workspace-view">{children}</div></main>
    {/* Thanh đáy lấy năm mục ĐẦU TIÊN CỦA VAI, không cắt cứng năm mục đầu bảng:
        vai Quản trị dữ liệu không mở ba màn nghiệp vụ, cắt cứng sẽ cho họ năm nút
        dẫn tới bốn màn họ không vào được. Phần dư nằm trong "Thêm". */}
    <nav className="mobile-nav" aria-label="Điều hướng nhanh" {...chan} style={{ gridTemplateColumns: `repeat(${Math.min(duoc.length, 4) + 1}, 1fr)` }}>
      {duoc.slice(0, 4).map((item) => <button key={item.id} type="button" className={view === item.id ? "is-active" : undefined} aria-label={item.label} aria-current={view === item.id ? "page" : undefined} onClick={() => onView(item.id)}><Icon name={item.icon}/><span>{item.short}</span></button>)}
      {/*
        Nút mở ngăn điều hướng LUÔN có mặt, không chỉ khi thừa đích đến.

        Trước đây nó chỉ hiện khi vai có hơn năm màn, vì măng sét đã có một nút
        mở riêng. Măng sét bỏ rồi, nên nếu giữ điều kiện cũ thì một vai có bốn
        màn — như chuyên viên QL3 — sẽ không còn cách nào mở ngăn, mà MỤC CỦA
        PHÂN HỆ (Tổng quan, Danh sách NNT, KPI đăng ký) chỉ nằm trong ngăn ấy.
      */}
      <button type="button" aria-label="Mở điều hướng" className={`menu-button${duoc.slice(4).some((i) => i.id === view) ? " is-active" : ""}`} aria-expanded={menuOpen} aria-haspopup="dialog" onClick={(event) => openMenu(event.currentTarget)}><Icon name="menu"/><span>Thêm</span></button>
    </nav>
    {menuOpen && <div className="nav-scrim" onClick={() => setMenuOpen(false)}><aside ref={drawerRef} className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Điều hướng nghiệp vụ" onKeyDown={onDrawerKeyDown} onClick={(event) => event.stopPropagation()}><button ref={closeRef} type="button" className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Đóng điều hướng"><Icon name="close"/></button>{nav}</aside></div>}
  </div></MucPhanHeProvider>;
}

function NavItem({ item, active, onView }: { item: (typeof NAV)[number]; active: boolean; onView: (view: ViewId) => void }) {
  return <button type="button" className={`nav-item${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => onView(item.id)}><span>{item.label}</span></button>;
}
