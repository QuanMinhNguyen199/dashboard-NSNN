import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui";
import { MucPhanHeProvider } from "@/components/MucPhanHe";
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

/*
  THANH BÊN THU GỌN (28/10/2026). Từ 901px trở lên người dùng thu thanh bên
  về ĐÚNG MỘT nút panel ở góc trên trái — không còn rãnh icon (người dùng chốt
  28/10/2026, theo cách của Claude) — để bảng rộng gần trọn khung nhìn.

  • Nút panel đứng CỐ ĐỊNH ở góc trên trái, bên trái biểu trưng, ở cả ba
    trạng thái mở / thu gọn / hé — không nhảy chỗ khi đổi trạng thái; tên nút đổi theo hành động, đọc qua aria-label và hiện
    bằng nhãn nổi khi Tab tới.
  • HÉ THANH BÊN: đang thu gọn mà rê chuột vào nút thì thanh đầy đủ trượt ra
    ĐÈ lên nội dung, không đẩy bố cục; rời chuột khỏi thanh thì thu lại, Esc
    cũng đóng. Mở chờ 120ms để chuột lướt ngang không bật nhầm, đóng chờ
    220ms để chuột trượt lệch mép một chút không mất thanh. Khi hé, nút đứng
    yên dưới con trỏ; bấm nút là ghim mở hẳn. Chỉ máy có chuột (hover:
    hover); bàn phím bấm nút để mở như cũ.
  • Trạng thái là tiện ích của RIÊNG từng người, lưu trên máy họ — không vào
    địa chỉ: gửi liên kết cho người khác không được đổi thanh bên của họ.
  • Không animate bề rộng (đổi bố cục từng khung hình): đổi ngay, chỉ chữ hiện
    dần khi mở rộng, và chỉ ngay sau khi bấm — không phát lại mỗi lần đổi màn.
*/
const KHOA_THU_GON = "taxops-thanh-ben-thu-gon";
function docThuGon() { try { return localStorage.getItem(KHOA_THU_GON) === "1"; } catch { return false; } }
function ghiThuGon(v: boolean) { try { localStorage.setItem(KHOA_THU_GON, v ? "1" : "0"); } catch { /* chế độ riêng tư: chỉ giữ trong phiên */ } }

export function Shell({ view, user, onView, onLogout, children }: { view: ViewId; user: DemoUser; onView: (view: ViewId, muc?: string) => void; onLogout: () => void; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [thuGon, datThuGonNoi] = useState(docThuGon);
  const [vuaDoi, datVuaDoi] = useState(false);
  const [ngo, datNgo] = useState(false);
  const henNgo = useRef<number>();
  const [nhan, datNhan] = useState<{ chu: string; top: number; left?: number } | null>(null);
  const datThuGon = (v: boolean) => {
    datThuGonNoi(v); ghiThuGon(v); datNhan(null);
    window.clearTimeout(henNgo.current);
    /* Ghim từ lúc đang hé: chữ đã hiện sẵn, không cho hiện dần lần nữa. */
    if (!ngo) { datVuaDoi(true); window.setTimeout(() => datVuaDoi(false), 320); }
    datNgo(false);
  };
  const moNgo = () => {
    if (!thuGon || ngo || !window.matchMedia("(min-width: 901px) and (hover: hover)").matches) return;
    window.clearTimeout(henNgo.current);
    henNgo.current = window.setTimeout(() => { datNhan(null); datNgo(true); }, 120);
  };
  const huyHenNgo = () => window.clearTimeout(henNgo.current);
  const dongNgo = () => {
    window.clearTimeout(henNgo.current);
    if (ngo) henNgo.current = window.setTimeout(() => datNgo(false), 220);
  };
  /* Nhãn nổi chỉ dựng khi rãnh thu gọn thật sự đang hiện (≥ 901px). */
  const hienNhan = (chu: string, el: HTMLElement, luonHien = false) => {
    if (ngo || (!thuGon && !luonHien) || !window.matchMedia("(min-width: 901px)").matches) return;
    const r = el.getBoundingClientRect();
    datNhan({ chu, top: r.top + r.height / 2, left: luonHien ? r.right + 8 : undefined });
  };
  const anNhan = () => datNhan(null);
  const maPhong = user.phong ? ` ${user.phong}` : "";
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  /* Tuyến ẩn (bốn phân hệ cũ) không đứng trên thanh bên; khi đang mở một tuyến
     ấy thì mục nhóm chứa báo cáo của nó sáng lên. */
  const duoc = navCho(user).filter((item) => !item.an);
  const dangMo = NAV.find((item) => item.id === view)?.thuoc ?? view;
  useEffect(() => setMenuOpen(false), [view]);
  useEffect(() => { datNgo(false); }, [view]);
  useEffect(() => {
    if (!ngo) return;
    const phim = (e: KeyboardEvent) => { if (e.key === "Escape") datNgo(false); };
    document.addEventListener("keydown", phim);
    return () => document.removeEventListener("keydown", phim);
  }, [ngo]);
  useEffect(() => () => window.clearTimeout(henNgo.current), []);
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

  const nutThuGon = <>
    <button type="button" className="sidebar-toggle" aria-controls="thanh-ben" aria-expanded={!thuGon}
      aria-label={thuGon ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
      onClick={(e) => { const nut = e.currentTarget; datThuGon(!thuGon); if (e.detail === 0) requestAnimationFrame(() => hienNhan(thuGon ? "Thu gọn thanh bên" : "Mở rộng thanh bên", nut, true)); }}
      onPointerEnter={(e) => thuGon ? moNgo() : hienNhan("Thu gọn thanh bên", e.currentTarget, true)}
      onPointerLeave={() => { anNhan(); if (!ngo) huyHenNgo(); }}
      onFocus={(e) => hienNhan(thuGon ? "Mở rộng thanh bên" : "Thu gọn thanh bên", e.currentTarget, true)} onBlur={anNhan}
      ><Icon name="panel" size={20}/></button>
  </>;

  const nav = <>
    <div className="brand"><TaxLogo/><div><strong>Quản lý nghiệp vụ Thuế</strong><span>Thuế TP Hà Nội</span></div>{nutThuGon}</div>
    <nav className="side-nav" aria-label="Nghiệp vụ chính">
      {NHOM.map(({ id: nhom, nhan }) => {
        const muc = duoc.filter((item) => item.nhom === nhom);
        if (!muc.length) return null;
        return <div className="nav-section" role="group" aria-label={nhan} key={nhom}>
          <span className="nav-group" aria-hidden="true">{nhan}</span>
          {/*
            THANH BÊN MỘT TẦNG: mỗi phòng đúng một mục, không còn cây mục.

            Trước đây từng báo cáo của QL2 và QL4 lên thẳng cấp này, và mục con
            của nó nằm ngay dưới — thanh bên của một phòng dài hai chục dòng, và
            bốn phòng xếp cạnh nhau thì không còn đọc ra cấu trúc hệ thống nữa.
            Tài liệu thiết kế đổi ngày 09/10/2026: thanh bên nói CÓ NHỮNG PHÒNG
            NÀO, còn báo cáo và mục của phòng là việc bên trong phòng ấy, nằm
            trên nội dung dưới dạng hai hàng tab — xem `ThanhMuc`.
          */}
          {muc.map((item) => <NavItem key={item.id} item={item} active={dangMo === item.id} onView={onView} hienNhan={hienNhan} anNhan={anNhan}/>)}
        </div>;
      })}
    </nav>
    <div className="sidebar-user">
      <strong>{user.name}</strong><small title={`${NHAN_VAI[user.vaiTro]}${maPhong} – ${user.unit}`}>{NHAN_VAI[user.vaiTro]}{maPhong} · {rutGonTenDonVi(user.unit)}</small>
      <button className="logout-button" type="button" onClick={onLogout}
        onPointerEnter={(e) => hienNhan(`Đăng xuất · ${user.name}`, e.currentTarget)} onPointerLeave={anNhan}
        onFocus={(e) => hienNhan(`Đăng xuất · ${user.name}`, e.currentTarget)} onBlur={anNhan}><Icon name="logout" size={16}/><span>Đăng xuất</span></button>
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
  return <MucPhanHeProvider key={view} view={view}><div className={`ops-app${thuGon ? " is-thu-gon" : ""}${ngo ? " is-ngo" : ""}${vuaDoi ? " is-vua-doi" : ""}`}>
    {/* Điều hướng cộng nút đăng xuất đứng trước nội dung, nên không có lối tắt
        thì mỗi lần đổi màn là mấy lần Tab trước khi chạm nội dung. */}
    <a className="skip-link" href="#workspace">Bỏ qua điều hướng, tới nội dung</a>
    <aside className="sidebar" id="thanh-ben" aria-label="Thanh điều hướng" onPointerEnter={() => { if (ngo) huyHenNgo(); }} onPointerLeave={dongNgo} {...chan}>{nav}</aside>

    {nhan && <div className="nhan-noi" role="tooltip" style={{ top: nhan.top, left: nhan.left }}>{nhan.chu}</div>}
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
      {duoc.slice(0, 4).map((item) => <button key={item.id} type="button" className={dangMo === item.id ? "is-active" : undefined} aria-label={item.label} aria-current={dangMo === item.id ? "page" : undefined} onClick={() => onView(item.id)}><Icon name={item.icon}/><span>{item.short}</span></button>)}
      {/*
        Nút mở ngăn điều hướng LUÔN có mặt, không chỉ khi thừa đích đến.

        Trước đây nó chỉ hiện khi vai có hơn năm màn, vì măng sét đã có một nút
        mở riêng. Măng sét bỏ rồi, nên nếu giữ điều kiện cũ thì một vai có bốn
        màn — như chuyên viên QL3 — sẽ không còn cách nào mở ngăn, mà MỤC CỦA
        PHÂN HỆ (Tổng quan, Danh sách NNT, KPI đăng ký) chỉ nằm trong ngăn ấy.
      */}
      <button type="button" aria-label="Mở điều hướng" className={`menu-button${duoc.slice(4).some((i) => i.id === dangMo) ? " is-active" : ""}`} aria-expanded={menuOpen} aria-haspopup="dialog" onClick={(event) => openMenu(event.currentTarget)}><Icon name="menu"/><span>Thêm</span></button>
    </nav>
    {menuOpen && <div className="nav-scrim" onClick={() => setMenuOpen(false)}><aside ref={drawerRef} className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Điều hướng nghiệp vụ" onKeyDown={onDrawerKeyDown} onClick={(event) => event.stopPropagation()}><button ref={closeRef} type="button" className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Đóng điều hướng"><Icon name="close"/></button>{nav}</aside></div>}
  </div></MucPhanHeProvider>;
}

function NavItem({ item, active, onView, hienNhan, anNhan }: { item: (typeof NAV)[number]; active: boolean; onView: (view: ViewId, muc?: string) => void; hienNhan: (chu: string, el: HTMLElement) => void; anNhan: () => void }) {
  return <button type="button" className={`nav-item${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => onView(item.id)}
    onPointerEnter={(e) => hienNhan(item.label, e.currentTarget)} onPointerLeave={anNhan}
    onFocus={(e) => hienNhan(item.label, e.currentTarget)} onBlur={anNhan}>
    {/* Icon chỉ hiện ở rãnh thu gọn — thanh mở rộng vẫn là chữ làm điều hướng. */}
    <Icon name={item.icon} size={18}/><span>{item.label}</span>
  </button>;
}
