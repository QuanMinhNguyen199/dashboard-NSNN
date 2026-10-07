import { useEffect, useState } from "react";
import { NSNN_LINK, Shell } from "@/components/Shell";
import { NAV, navCho } from "@/components/nav";
import { TaxLogo } from "@/components/TaxLogo";
import { GiamSat } from "@/features/GiamSat";
import { DebtQL1 } from "@/features/DebtQL1";
import { RiskQL3 } from "@/features/RiskQL3";
import { Workbench } from "@/features/Workbench";
import { TinhTrangDuLieu } from "@/features/TinhTrangDuLieu";
import type { ViewId } from "@/domain/types";
import { ActionProvider } from "@/state/ActionContext";
import { BoLocProvider } from "@/components/BoLoc";
import { HoaDonQL2 } from "@/features/HoaDonQL2";
import { HoanQL4 } from "@/features/HoanQL4";
import { PhieuProvider } from "@/state/PhieuContext";
import { xoaThamSoMan } from "@/state/diaChi";
import { DuyetProvider } from "@/state/DuyetContext";
import { LoginScreen } from "@/auth/LoginScreen";
import { readDemoSession, writeDemoSession, type DemoUser } from "@/auth/demoAuth";

/* Danh sách này là bản sao thứ hai của NAV và đã một lần lệch khỏi nó: thêm
   màn mới vào NAV mà quên chỗ này thì đường dẫn im lặng rơi về Trang công
   việc, và không cổng kiểm nào bắt được vì trang vẫn có tiêu đề hợp lệ. */
const views: ViewId[] = NAV.map((item) => item.id);
const dashboardLogin = import.meta.env.VITE_PORTAL === "true" && window.location.pathname === `${import.meta.env.BASE_URL}nsnn/dang-nhap/`;

/*
  Phân hệ của từng phòng, để biết "tổng quan của phòng mình" là màn nào.
*/
const PHAN_HE_CUA: Record<string, ViewId> = { QL1: "debt", QL2: "hoadon", QL3: "risk", QL4: "hoan" };

/*
  Trang mặc định sau đăng nhập KHÁC NHAU theo vai — §3 của cả hai bản thiết kế
  ghi thành một dòng riêng trong ma trận quyền:

    CV QL1, QL3  → "Danh sách việc / dữ liệu kỳ"
    CV QL2       → "Danh sách việc"
    CV QL4       → "Báo cáo tổng đài hôm qua"
    TP mọi phòng → "Tổng quan QL1 / QL2 / QL3 / QL4"

  Trước đây mọi vai đều rơi về Trang công việc. Với trưởng phòng đó là một màn
  liệt kê việc cần LÀM, trong khi việc của họ là đọc số rồi quyết — nên họ phải
  bấm thêm một lần ở mọi lần đăng nhập để tới chỗ mình thật sự làm việc.
*/
function manMacDinh(user: Pick<DemoUser, "phong" | "vaiTro"> | null): ViewId {
  if (!user?.phong) return "workbench";
  const phanHe = PHAN_HE_CUA[user.phong];
  if (user.vaiTro === "TP") return phanHe ?? "workbench";
  /* CV QL4 mở thẳng báo cáo tổng đài: nó ra số hằng ngày và có hạn vài giờ
     (G18), nên nó là việc đầu tiên trong ngày chứ không phải một mục để tìm. */
  if (user.vaiTro === "CV" && user.phong === "QL4") return "hoan";
  return "workbench";
}

function readView(): ViewId {
  const value = new URLSearchParams(window.location.search).get("view");
  if (value === "risk" && new URLSearchParams(window.location.search).get("muc") === "ketqua") return "tonghopql3";
  if (value === "reports") return readDemoSession()?.phong === "QL3" ? "risk" : "debt";
  if (views.includes(value as ViewId)) return value as ViewId;
  return manMacDinh(readDemoSession());
}

export function App() {
  const [view, setViewState] = useState<ViewId>(readView);
  const [user, setUser] = useState<DemoUser | null>(readDemoSession);
  const setView = (next: ViewId) => {
    if (next === view) return;
    /* Tham số của màn cũ không có nghĩa ở màn mới — `muc=cc` của báo cáo nợ
       mà còn lại ở màn tình trạng dữ liệu thì địa chỉ mô tả một trạng thái
       không tồn tại. Dọn trước, rồi mới ghi màn mới. */
    xoaThamSoMan();
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
    else if (user && dashboardLogin) window.location.replace(`${import.meta.env.BASE_URL}quan-ly/`);
  }, [user]);

  useEffect(() => {
    const onPop = () => setViewState(readView());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!user) {
      document.title = dashboardLogin ? "Đăng nhập – Dashboard Thu NSNN" : "Đăng nhập – Quản lý nghiệp vụ Thuế";
      return;
    }
    const title: Record<ViewId, string> = { workbench: "Công việc theo kỳ", debt: "Báo cáo công tác nợ", risk: "Kiểm tra tại bàn", tonghopql3: "Kết quả tổng hợp", hoadon: "Rủi ro hóa đơn", hoan: "Hoàn thuế TNCN và tổng đài", tinhtrang: "Tình trạng dữ liệu", giamsat: "Giám sát dữ liệu" };
    document.title = `${title[view]} – Quản lý nghiệp vụ Thuế`;
  }, [user, view]);

  const login = (next: DemoUser) => {
    writeDemoSession(next);
    setUser(next);
    /* Đăng nhập xong thì đi thẳng tới trang mặc định của vai, và ghi nó vào
       địa chỉ — người dùng gửi lại liên kết ấy phải mở ra đúng chỗ họ đang
       nhìn, không phải chỗ hệ chọn hộ lần sau. */
    const dau = manMacDinh(next);
    if (dau !== "workbench") {
      const q = new URLSearchParams(window.location.search);
      q.set("view", dau);
      if (next.vaiTro === "CV" && next.phong === "QL4") q.set("muc", "goi");
      window.history.replaceState({}, "", `${window.location.pathname}?${q}`);
      setViewState(dau);
    }
    if (new URLSearchParams(window.location.search).get("view") === "reports") {
      setViewState(next.phong === "QL3" ? "risk" : "debt");
    }
  };
  const logout = () => {
    writeDemoSession(null);
    setUser(null);
  };

  if (!user) return <LoginScreen onLogin={login} dashboard={dashboardLogin}/>;

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

  return <ActionProvider><BoLocProvider><DuyetProvider user={user}><PhieuProvider nguoiDung={user.name}>
    <Shell view={moDuoc} user={user} onView={setView} onLogout={logout}>
    {moDuoc === "workbench" && <Workbench onNavigate={setView} vaiTro={user.vaiTro} phong={user.phong}/>}
    {moDuoc === "debt" && <DebtQL1 actor={user.name}/>}
    {moDuoc === "risk" && <RiskQL3 actor={user.name}/>}
    {moDuoc === "tonghopql3" && <RiskQL3 actor={user.name} ketQua/>}
    {moDuoc === "hoadon" && <HoaDonQL2 actor={user.name} vaiTro={user.vaiTro}/>}
    {moDuoc === "hoan" && <HoanQL4 actor={user.name} vaiTro={user.vaiTro}/>}
    {moDuoc === "tinhtrang" && <TinhTrangDuLieu vaiTro={user.vaiTro}/>}
    {moDuoc === "giamsat" && <GiamSat/>}
    </Shell>
  </PhieuProvider></DuyetProvider></BoLocProvider></ActionProvider>;
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
