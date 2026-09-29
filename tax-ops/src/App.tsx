import { useEffect, useState } from "react";
import { NAV, NSNN_LINK, Shell, navFor } from "@/components/Shell";
import { TaxLogo } from "@/components/TaxLogo";
import { Badge } from "@/components/ui";
import { Batches } from "@/features/Batches";
import { Mapping } from "@/features/Mapping";
import { Rules } from "@/features/Rules";
import { Debt } from "@/features/Debt";
import { Refund } from "@/features/Refund";
import { Reports } from "@/features/Reports";
import { Runs } from "@/features/Runs";
import { Risk } from "@/features/Risk";
import { Workbench } from "@/features/Workbench";
import type { ViewId } from "@/domain/types";
import { ActionProvider } from "@/state/ActionContext";
import { LoginScreen } from "@/auth/LoginScreen";
import { readDemoSession, writeDemoSession, type DemoUser } from "@/auth/demoAuth";

/* Danh sách này là bản sao thứ hai của NAV và đã một lần lệch khỏi nó: thêm
   màn mới vào NAV mà quên chỗ này thì đường dẫn im lặng rơi về Trang công
   việc, và không cổng kiểm nào bắt được vì trang vẫn có tiêu đề hợp lệ. */
const views: ViewId[] = NAV.map((item) => item.id);

function readView(): ViewId {
  const value = new URLSearchParams(window.location.search).get("view");
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

  const openReports = () => {
    setView("reports");
    const url = new URL(window.location.href);
    url.searchParams.set("create", "1");
    window.history.replaceState({}, "", url);
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
    if (user?.role === "STATE_LEADER") window.location.replace(NSNN_LINK);
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
    const title = { workbench: "Tổng quan", debt: "Nợ và cưỡng chế", risk: "Kiểm tra và rủi ro", refund: "Hoàn thuế và hỗ trợ", reports: "Báo cáo", runs: "Lượt chạy dữ liệu", batches: "Lô dữ liệu", mapping: "Ánh xạ quản lý", rules: "Quy tắc nghiệp vụ" }[view];
    document.title = `${title} – Quản lý nghiệp vụ Thuế`;
  }, [user, view]);

  const login = (next: DemoUser) => {
    writeDemoSession(next);
    setUser(next);
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
  const duoc = navFor(user.role);

  /*
    Vai không có màn nào trong hệ này thì nói thẳng và chỉ đường, không hiện một
    shell rỗng. Lãnh đạo nhà nước là tài khoản của Dashboard Thu NSNN; đưa họ vào
    đây rồi để trống là làm họ tưởng hệ thống hỏng.
  */
  if (!duoc.length) return <NoAccess user={user} onLogout={logout}/>;

  const moDuoc = duoc.some((item) => item.id === view) ? view : duoc[0].id;

  return <ActionProvider><Shell view={moDuoc} user={user} onView={setView} onLogout={logout}>
    {moDuoc === "workbench" && <Workbench onNavigate={setView} role={user.role}/>}
    {moDuoc === "debt" && <Debt onNavigate={setView} onCreateReport={openReports}/>}
    {moDuoc === "risk" && <Risk onCreateReport={openReports}/>}
    {moDuoc === "refund" && <Refund onCreateReport={openReports}/>}
    {moDuoc === "reports" && <Reports actor={user.name} owner={user.unit} role={user.role}/>}
    {moDuoc === "runs" && <Runs/>}
    {moDuoc === "batches" && <Batches/>}
    {moDuoc === "mapping" && <Mapping/>}
    {moDuoc === "rules" && <Rules/>}
  </Shell></ActionProvider>;
}

/*
  Màn giữ chỗ trong lúc chuyển sang Dashboard, và là lối thoát nếu chuyển hướng
  không tới nơi. Nó nói ai đang đăng nhập, vì sao vai này không thuộc hệ tác
  nghiệp, và để lại hai đường đi: sang Dashboard hoặc đăng xuất.
*/
function NoAccess({ user, onLogout }: { user: DemoUser; onLogout: () => void }) {
  return <main className="no-access">
    <div>
      {/* Màn này nằm ngoài Shell nên không thừa hưởng badge "Mô phỏng" lẫn khối
          nhận diện. Thiếu cả hai thì nó vừa không cho biết hệ nào từ chối, vừa
          nêu đích danh một con người và một cơ quan mà không nói đó là dữ liệu
          mô phỏng — và đây là màn dễ bị chụp gửi đi nhất. */}
      <div className="no-access-brand">
        <TaxLogo/>
        <div><strong>Quản lý nghiệp vụ Thuế</strong><small>Thuế TP Hà Nội</small></div>
        <Badge tone="warning" mock>Mô phỏng</Badge>
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
        này không có hiệu lực ở hệ kia. Dữ liệu và danh tính trên màn hình này đều
        là mô phỏng.
      </p>
      <div className="no-access-actions">
        <a className="button is-primary" href={NSNN_LINK}>Mở Dashboard Thu NSNN</a>
        <button type="button" className="button is-secondary" onClick={onLogout}>Đăng xuất</button>
      </div>
    </div>
  </main>;
}
