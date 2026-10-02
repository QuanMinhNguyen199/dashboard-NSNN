import { useState } from "react";
import { authenticate, DEMO_ACCOUNTS, type DemoUser } from "@/auth/demoAuth";
import { Icon } from "@/components/ui";
import { TaxLogo } from "@/components/TaxLogo";

/*
  Màn đăng nhập của bản demo có ĐÚNG HAI thứ: lối Keycloak tượng trưng, và sáu
  tài khoản bấm vào là vào thẳng.

  Ô tài khoản/mật khẩu đã gỡ. Trong một bản demo nó không kiểm được gì: mật
  khẩu chung là `demo123` và nó được in ngay bên dưới, nên "xác thực" ở đây chỉ
  là bắt người xem gõ lại một chuỗi họ vừa đọc. Gỡ nó đi thì màn nói đúng thứ
  nó đang làm — chọn vai để xem — thay vì diễn lại một thủ tục không có thật.

  Hệ quả phải nhận: không còn lối ẩn danh sách tài khoản. Nút "Ẩn" của bản
  trước nay sẽ khoá hẳn mọi người ở ngoài, vì không còn ô nào để gõ tay. Một
  công tắc đưa sản phẩm vào trạng thái không thoát ra được thì không phải lựa
  chọn, nên nó bị gỡ cùng với cái form.

  Hai cột chia việc DỨT KHOÁT: trái là nhận diện, phải là nội dung. Bên trái
  không mang chữ nào của luồng đăng nhập.
*/
export function LoginScreen({ onLogin, dashboard = false }: { onLogin: (user: DemoUser) => void; dashboard?: boolean }) {
  const [sso, setSso] = useState(false);
  const portal = import.meta.env.VITE_PORTAL === "true";
  const accounts = portal ? DEMO_ACCOUNTS.filter(tk => tk.permissions.includes(dashboard ? "NSNN_VIEW" : "TAX_OPS_VIEW")) : DEMO_ACCOUNTS;

  /* Bấm là vào thẳng. Vẫn đi qua `authenticate` chứ không dựng thẳng đối tượng
     người dùng: đó là chỗ duy nhất quyết định một phiên hợp lệ trông thế nào,
     và khi nối Keycloak thật thì chỉ một chỗ ấy phải đổi. */
  const vao = (tenDangNhap: string, matKhau: string) => {
    const user = authenticate(tenDangNhap, matKhau);
    if (user) onLogin(user);
  };

  return <main className="login-page">
    {/* Cột nhận diện. Một khối duy nhất: con dấu, tên hệ, vạch vàng, tên cơ
        quan — đặt ở giữa chiều cao. Không tiêu đề, không nút, không đường dẫn.
        Vạch vàng là lần dùng sắc vàng con dấu duy nhất trên màn này. */}
    <section className="login-context" aria-label="Nhận diện hệ thống">
      <div className="login-mark">
        <TaxLogo/>
        <strong>{dashboard ? "Dashboard Thu NSNN" : "Quản lý nghiệp vụ Thuế"}</strong>
        <span className="login-rule" aria-hidden="true"/>
        <small>Thuế thành phố Hà Nội</small>
      </div>
    </section>

    <section className="login-panel">
      <div className="login-form-wrap">
        <div className="login-heading"><h1>Đăng nhập</h1><p>Bản demo. Chọn một vai để xem phần màn hình của vai đó.</p></div>

        {/*
          Lối đăng nhập một lần. Nút này là TƯỢNG TRƯNG: Keycloak là hướng đã
          chọn cho xác thực tập trung nhưng chưa nối trong bản demo, nên nó nói
          thẳng điều đó thay vì giả vờ chuyển hướng rồi quay về. Dựng một nút
          trông như chạy được mà không chạy là thứ khiến người xem tin nhầm hệ
          đã có SSO.
        */}
        <button type="button" className="button is-secondary login-sso" onClick={() => setSso(true)} aria-describedby={sso ? "login-sso-note" : undefined}>
          <Icon name="key" size={17}/><span>Đăng nhập bằng Keycloak</span>
        </button>
        {sso && <p className="login-sso-note" id="login-sso-note" role="status">Bản demo chưa nối Keycloak. Dùng một trong các vai bên dưới.</p>}

        <div className="login-or"><span>hoặc chọn vai để xem</span></div>

        {/*
          Lưới hai cột, xếp theo CẶP: mỗi phòng một hàng với chuyên viên bên
          trái và trưởng phòng bên phải. Một cột dọc sáu dòng bắt người đọc dò
          từ trên xuống để tìm ra hai dòng nào thuộc cùng một phòng; xếp cặp
          thì quan hệ ấy đọc được bằng vị trí, không cần đọc chữ.
        */}
        <ul className="demo-accounts-list" aria-label="Tài khoản trình diễn">
          {accounts.map((tk) => <li key={tk.username}>
            <button type="button" onClick={() => vao(tk.username, tk.password)}>
              <span className="demo-vai">{tk.vaiTroLabel}</span>
              <small>{tk.unit}</small>
              <code>{tk.username}</code>
            </button>
          </li>)}
        </ul>
        {portal && <a className="button is-secondary" href={`${import.meta.env.BASE_URL}${dashboard ? "quan-ly/" : "nsnn/"}`}>
          {dashboard ? "Mở web quản lý" : "Mở Dashboard NSNN"}
        </a>}
      </div>
    </section>
  </main>;
}
