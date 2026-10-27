import { useEffect, useState } from "react";
import { animate } from "motion/mini";
import { installWebMotion } from "../../shared/webMotion";
import { NSNN_LINK, Shell } from "@/components/Shell";
import { NAV, navCho } from "@/components/nav";
import { TaxLogo } from "@/components/TaxLogo";
import { GiamSat } from "@/features/GiamSat";
import { DebtQL1, HoaDonQL2, HoanQL4, RiskQL3 } from "@/features/phanHeLazy";
import { KetQuaCongTac } from "@/features/qldn/KetQuaCongTac";
import { TongQuanDoiTuong } from "@/features/qldn/TongQuanDoiTuong";
import { CanhBaoNhacViec } from "@/features/qldn/CanhBaoNhacViec";
import { PhamViProvider } from "@/features/qldn/PhamViQLDN";
import type { NhomId } from "@/data/qldn";
import { TinhTrangDuLieu } from "@/features/TinhTrangDuLieu";
import type { ViewId } from "@/domain/types";
import { ActionProvider } from "@/state/ActionContext";
import { BoLocProvider } from "@/components/BoLoc";
import { PhieuProvider } from "@/state/PhieuContext";
import { KpiProvider } from "@/state/KpiContext";
import { xoaThamSoMan , datThamSo} from "@/state/diaChi";
import { DuyetProvider } from "@/state/DuyetContext";
import { LoginScreen } from "@/auth/LoginScreen";
import { readDemoSession, writeDemoSession, type DemoUser } from "@/auth/demoAuth";

/* Danh sách này là bản sao thứ hai của NAV và đã một lần lệch khỏi nó: thêm
   màn mới vào NAV mà quên chỗ này thì đường dẫn im lặng rơi về Trang công
   việc, và không cổng kiểm nào bắt được vì trang vẫn có tiêu đề hợp lệ. */
const views: ViewId[] = NAV.map((item) => item.id);
const dashboardLogin = import.meta.env.VITE_PORTAL === "true" && window.location.pathname === `${import.meta.env.BASE_URL}nsnn/dang-nhap/`;

/*
  Trang mặc định sau đăng nhập KHÁC NHAU theo vai — §3 của cả hai bản thiết kế
  ghi thành một dòng riêng trong ma trận quyền:

    CV mọi phòng → Cảnh báo nhắc việc (thay "Danh sách việc / dữ liệu kỳ")
    TP mọi phòng → Tổng quan quản trị (phân hệ theo phòng đã gỡ 13/10/2026)

  Từ 13/10/2026 năm phòng QLDN làm cùng một việc, nên trang mặc định chỉ còn
  theo VAI, không theo phòng. Ngoại lệ cũ "chuyên viên QL4 vào thẳng tổng đài"
  đã gỡ: tổng đài không còn là việc riêng của QL4.

  Màn "Công việc theo kỳ" đã gỡ ngày 12/10/2026: biên bản yêu cầu không gian
  làm việc khối QLDN thay nó bằng Cảnh báo nhắc việc, và hai khối còn lại của
  nó (báo cáo chờ duyệt, nguồn dữ liệu) đã có trên thanh duyệt của từng phân
  hệ và màn Tình trạng dữ liệu.

  Trước đây mọi vai đều rơi về Trang công việc. Với trưởng phòng đó là một màn
  liệt kê việc cần LÀM, trong khi việc của họ là đọc số rồi quyết — nên họ phải
  bấm thêm một lần ở mọi lần đăng nhập để tới chỗ mình thật sự làm việc.
*/
/* Bốn nhóm lớn của Quản trị công việc là bốn mục thanh bên, mỗi mục một màn. */
const NHOM_CUA_VIEW: Partial<Record<ViewId, NhomId>> = { "kq-thu": "thu", "kq-no": "no", "kq-tthc": "tthc", "kq-qlht": "qlht", "kq-kttb": "kttb", "kq-hoan": "hoan" };
const VIEW_CUA_NHOM: Record<NhomId, ViewId> = { thu: "kq-thu", no: "kq-no", tthc: "kq-tthc", qlht: "kq-qlht", kttb: "kq-kttb", hoan: "kq-hoan" };

function manMacDinh(user: Pick<DemoUser, "phong" | "vaiTro"> | null): ViewId {
  /* Phó phòng và lãnh đạo Thuế TP chỉ có các màn khối QLDN; việc của họ là đọc
     kết quả, nên vào thẳng màn kết quả công tác. */
  if (user?.vaiTro === "PP" || user?.vaiTro === "LD_TP") return "dieuhanh";
  if (user?.vaiTro === "VAN_HANH") return "giamsat";
  if (!user?.phong) return "canhbao";
  if (user.vaiTro === "TP") return "dieuhanh";
  return "canhbao";
}

function readView(): ViewId {
  const value = new URLSearchParams(window.location.search).get("view");
  if (value === "reports") return readDemoSession()?.phong === "QL3" ? "risk" : "debt";
  if (views.includes(value as ViewId)) return value as ViewId;
  return manMacDinh(readDemoSession());
}

export function App() {
  useEffect(() => installWebMotion(document.getElementById("root")!, animate), []);
  const [view, setViewState] = useState<ViewId>(readView);
  const [user, setUser] = useState<DemoUser | null>(readDemoSession);
  /*
    `muc` đi kèm vì một mục trên thanh bên nay có thể trỏ thẳng vào một báo
    cáo của phân hệ khác: QL2 không còn mục mang tên phân hệ, nên "Cảnh báo
    hệ số K" vừa đổi màn vừa chọn mục. Đổi màn rồi mới đặt mục trong một lần
    bấm thứ hai là một khung hình hiện mục cũ.
  */
  const setView = (next: ViewId, muc?: string) => {
    if (next === view) {
      if (muc) datThamSo({ muc });
      return;
    }
    /* Tham số của màn cũ không có nghĩa ở màn mới — `muc=cc` của báo cáo nợ
       mà còn lại ở màn tình trạng dữ liệu thì địa chỉ mô tả một trạng thái
       không tồn tại. Dọn trước, rồi mới ghi màn mới. */
    xoaThamSoMan();
    const query = new URLSearchParams(window.location.search);
    query.set("view", next);
    if (muc) query.set("muc", muc);
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
    const title: Record<ViewId, string> = { doituong: "Tổng quan đối tượng", dieuhanh: "Tổng quan quản trị", "kq-thu": "Thu NSNN", "kq-no": "Quản lý nợ", "kq-tthc": "Thủ tục hành chính", "kq-qlht": "Quản lý, hỗ trợ doanh nghiệp", "kq-kttb": "Kiểm tra tại bàn", "kq-hoan": "Hoàn thuế", canhbao: "Cảnh báo nhắc việc", debt: "Báo cáo công tác nợ", risk: "Kiểm tra tại bàn", hoadon: "Rủi ro hóa đơn", hoan: "Hoàn thuế TNCN và tổng đài", tinhtrang: "Tình trạng dữ liệu", giamsat: "Giám sát dữ liệu" };
    document.title = `${title[view]} – Quản lý nghiệp vụ Thuế`;
  }, [user, view]);

  const login = (next: DemoUser) => {
    writeDemoSession(next);
    setUser(next);
    /* Đăng nhập xong thì đi thẳng tới trang mặc định của vai, và ghi nó vào
       địa chỉ — người dùng gửi lại liên kết ấy phải mở ra đúng chỗ họ đang
       nhìn, không phải chỗ hệ chọn hộ lần sau. */
    const dau = manMacDinh(next);
    {
      const q = new URLSearchParams(window.location.search);
      q.set("view", dau);

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

  return <ActionProvider><BoLocProvider><PhamViProvider><DuyetProvider user={user}><PhieuProvider nguoiDung={user.name}><KpiProvider>
    <Shell view={moDuoc} user={user} onView={setView} onLogout={logout}>
    {moDuoc === "doituong" && <TongQuanDoiTuong user={user} moNhom={(nhom, the, stt) => { setView(VIEW_CUA_NHOM[nhom]); datThamSo({ nhom: the, tc: stt ? String(stt) : null }); }}/>}
    {/* "Việc quá hạn" ở bảng kết quả mở thẳng cảnh báo quá hạn của đơn vị ấy. */}
    {(moDuoc === "dieuhanh" || NHOM_CUA_VIEW[moDuoc]) && <KetQuaCongTac
      key={moDuoc}
      user={user}
      nhom={NHOM_CUA_VIEW[moDuoc]}
      moNhom={(nhom, the, stt) => { setView(VIEW_CUA_NHOM[nhom]); datThamSo({ nhom: the, tc: stt ? String(stt) : null }); }}
      moCanhBao={(dvId) => { setView("canhbao"); datThamSo({ donvi: dvId, muc: "QUA_HAN" }); }}
    />}
    {moDuoc === "canhbao" && <CanhBaoNhacViec user={user}/>}
    {/* Tuyến phân hệ cũ (đường dẫn trực tiếp) KHÔNG khóa đơn vị: không còn lối
        nào trên giao diện dẫn tới nó, và nó giữ lại để liên kết cũ cùng các chốt
        kiểm toàn ngành (lọc khối, cộng khối, đi xuống đơn vị) vẫn chạy. Lối thật
        của người dùng là công tắc Báo cáo trong nhóm chỉ tiêu — chỗ ấy khóa theo
        phòng, xem `BaoCaoPhanHe`. */}
    {moDuoc === "debt" && <DebtQL1 actor={user.name}/>}
    {moDuoc === "risk" && <RiskQL3 actor={user.name} vaiTro={user.vaiTro}/>}
    {moDuoc === "hoadon" && <HoaDonQL2 actor={user.name} vaiTro={user.vaiTro}/>}
    {moDuoc === "hoan" && <HoanQL4 actor={user.name} vaiTro={user.vaiTro}/>}
    {moDuoc === "tinhtrang" && <TinhTrangDuLieu vaiTro={user.vaiTro}/>}
    {moDuoc === "giamsat" && <GiamSat/>}
    </Shell>
  </KpiProvider></PhieuProvider></DuyetProvider></PhamViProvider></BoLocProvider></ActionProvider>;
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
