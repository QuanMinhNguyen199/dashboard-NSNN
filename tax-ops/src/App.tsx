import { useEffect, useState } from "react";
import { NSNN_LINK, Shell } from "@/components/Shell";
import { NAV, navCho } from "@/components/nav";
import { TaxLogo } from "@/components/TaxLogo";
import { GiamSat } from "@/features/GiamSat";
import { Debt } from "@/features/Debt";
import { Risk } from "@/features/Risk";
import { Workbench } from "@/features/Workbench";
import { TinhTrangDuLieu } from "@/features/TinhTrangDuLieu";
import type { ViewId } from "@/domain/types";
import { ActionProvider } from "@/state/ActionContext";
import { DuLieuThatProvider } from "@/state/DuLieuThatContext";
import { BoLocProvider } from "@/components/BoLoc";
import { DuyetProvider } from "@/state/DuyetContext";
import { LoginScreen } from "@/auth/LoginScreen";
import { readDemoSession, writeDemoSession, type DemoUser } from "@/auth/demoAuth";

/* Danh sách này là bản sao thứ hai của NAV và đã một lần lệch khỏi nó: thêm
   màn mới vào NAV mà quên chỗ này thì đường dẫn im lặng rơi về Trang công
   việc, và không cổng kiểm nào bắt được vì trang vẫn có tiêu đề hợp lệ. */
const views: ViewId[] = NAV.map((item) => item.id);

function readView(): ViewId {
  const value = new URLSearchParams(window.location.search).get("view");
  if (value === "reports") return readDemoSession()?.phong === "QL3" ? "risk" : "debt";
  return views.includes(value as ViewId) ? value as ViewId : "workbench";
}

export function App() {
  const [view, setViewState] = useState<ViewId>(readView);
  const [user, setUser] = useState<DemoUser | null>(readDemoSession);
  const setView = (next: ViewId) => {
    if (next === view) return;
    const query = new URLSearchParams(window.location.search);
    query.set("view", next);
    window.history.pushState({}, "", `${window.location.pathname}?${query}`);
    setViewState(next);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  /*
    Lãnh đạo nhà nước được đưa thẳng sang Dashboard Thu NSNN. Đây là quyết định
    đã có kiểm thử trong `scripts/acceptance.mjs`, và nó đúng trong bản portal
    nơi Dashboard nằm ở `/nsnn/`.

    Khối `NoAccess` bên dưới là màn giữ chỗ trong lúc chuyển, đồng thời là lối
    thoát khi chuyển hướng KHÔNG tới nơi — chạy tax-ops độc lập thì `/nsnn/`
    không tồn tại, và một dòng "Đang mở…" vĩnh viễn không cho họ cả đường đăng
    xuất.
  */
  useEffect(() => {
    if (user?.vaiTro === "LANH_DAO_NN") window.location.replace(NSNN_LINK);
  }, [user]);

  useEffect(() => {
    const onPop = () => setViewState(readView());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!user) {
      document.title = "Đăng nhập – Quản lý nghiệp vụ Thuế";
      return;
    }
    const title: Record<ViewId, string> = { workbench: "Công việc theo kỳ", debt: "Báo cáo công tác nợ", risk: "Kiểm tra tại bàn", tinhtrang: "Tình trạng dữ liệu", giamsat: "Giám sát dữ liệu" };
    document.title = `${title[view]} – Quản lý nghiệp vụ Thuế`;
  }, [user, view]);

  const login = (next: DemoUser) => {
    writeDemoSession(next);
    setUser(next);
    if (new URLSearchParams(window.location.search).get("view") === "reports") {
      setViewState(next.phong === "QL3" ? "risk" : "debt");
    }
  };
  const logout = () => {
    writeDemoSession(null);
    setUser(null);
  };

  if (!user) return <LoginScreen onLogin={login}/>;

  /*
    Vai không mở được màn đang yêu cầu thì rơi về màn đầu tiên của vai đó, không
    hiện trang trắng. Đường dẫn dán tay cũng đi qua đúng luật này.
  */
  const duoc = navCho(user);

  /*
    Vai không có màn nào trong hệ này thì nói thẳng và chỉ đường, không hiện một
    shell rỗng. Lãnh đạo nhà nước là tài khoản của Dashboard Thu NSNN; đưa họ vào
    đây rồi để trống là làm họ tưởng hệ thống hỏng.
  */
  if (!duoc.length) return <NoAccess user={user} onLogout={logout}/>;

  const moDuoc = duoc.some((item) => item.id === view) ? view : duoc[0].id;

  return <DuLieuThatProvider><ActionProvider><BoLocProvider><DuyetProvider user={user}>
    <Shell view={moDuoc} user={user} onView={setView} onLogout={logout}>
    {moDuoc === "workbench" && <Workbench onNavigate={setView} vaiTro={user.vaiTro} phong={user.phong}/>}
    {moDuoc === "debt" && <Debt actor={user.name} vaiTro={user.vaiTro}/>}
    {moDuoc === "risk" && <Risk actor={user.name} vaiTro={user.vaiTro}/>}
    {moDuoc === "tinhtrang" && <TinhTrangDuLieu vaiTro={user.vaiTro}/>}
    {moDuoc === "giamsat" && <GiamSat/>}
    </Shell>
  </DuyetProvider></BoLocProvider></ActionProvider></DuLieuThatProvider>;
}

/*
  Màn giữ chỗ trong lúc chuyển sang Dashboard, và là lối thoát nếu chuyển hướng
  không tới nơi. Nó nói ai đang đăng nhập, vì sao vai này không thuộc hệ tác
  nghiệp, và để lại hai đường đi: sang Dashboard hoặc đăng xuất.
*/
function NoAccess({ user, onLogout }: { user: DemoUser; onLogout: () => void }) {
  return <main className="no-access">
    <div>
      {/* Màn này nằm ngoài Shell nên không thừa hưởng khối nhận diện. Thiếu nó
          thì màn không cho biết hệ nào đang từ chối, trong khi đây là màn dễ bị
          chụp gửi đi nhất. */}
      <div className="no-access-brand">
        <TaxLogo/>
        <div><strong>Quản lý nghiệp vụ Thuế</strong><small>Thuế TP Hà Nội</small></div>
      </div>
      <p className="no-access-status" role="status">Đang mở Dashboard Thu NSNN…</p>
      <h1>Tài khoản này không dùng Web quản lý nghiệp vụ</h1>
      <p>
        <strong>{user.name}</strong> đăng nhập với vai <strong>Lãnh đạo nhà nước</strong>.
        Vai này đọc số liệu tổng hợp trên Dashboard Thu NSNN, không tham gia xử lý
        hồ sơ, ánh xạ dữ liệu hay duyệt báo cáo nghiệp vụ.
      </p>
      <p className="no-access-note">
        Hai hệ thống dùng chung một lần đăng nhập nhưng quyền tách riêng: vai ở hệ
        này không có hiệu lực ở hệ kia.
      </p>
      <div className="no-access-actions">
        <a className="button is-primary" href={NSNN_LINK}>Mở Dashboard Thu NSNN</a>
        <button type="button" className="button is-secondary" onClick={onLogout}>Đăng xuất</button>
      </div>
    </div>
  </main>;
}
