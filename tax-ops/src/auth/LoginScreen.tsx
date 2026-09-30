import { useState, type FormEvent } from "react";
import { authenticate, type DemoUser } from "@/auth/demoAuth";
import { Icon } from "@/components/ui";
import { TaxLogo } from "@/components/TaxLogo";

/*
  Màn đăng nhập KHÔNG còn danh sách tài khoản mẫu.

  Danh sách đó là một bảng điều khiển của bản trình diễn, không phải một bộ
  phận của sản phẩm: nó in tên đăng nhập và mật khẩu chung ngay cạnh ô nhập.
  Giữ nó thì màn đầu tiên người xem nhìn thấy đã tự khai mình là đồ giả, và
  mọi nhận xét về sau đều bị đặt trong khung đó. Tài khoản demo vẫn còn nguyên
  trong `demoAuth`; chỉ lối vào nhanh bị gỡ, nên ai biết tài khoản vẫn gõ vào
  bình thường.

  Hệ quả phải chịu: ô nhập bắt đầu RỖNG. Điền sẵn thì màn lại tự khai là demo
  theo cách khác, chỉ kín đáo hơn.

  Hai cột chia việc DỨT KHOÁT: trái là nhận diện, phải là nội dung. Bản trước
  đặt "Đăng nhập theo vai trò nghiệp vụ" bên trái và "Đăng nhập" bên phải —
  cùng một câu nói hai lần, cách nhau nửa màn hình, và người đọc phải tự đoán
  câu nào mới là tiêu đề thật. Bên trái nay không mang chữ nào của luồng đăng
  nhập; toàn bộ tiêu đề, ô nhập và phần giải thích nằm một chỗ bên phải.
*/
export function LoginScreen({ onLogin }: { onLogin: (user: DemoUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hien, setHien] = useState(false);
  const [error, setError] = useState("");
  const [sso, setSso] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    /* Thiếu ô và sai thông tin là hai lỗi khác nhau; gộp làm một thì người
       dùng không biết nên gõ tiếp hay gõ lại. */
    if (!username.trim() || !password) {
      setError("Nhập đủ tài khoản và mật khẩu.");
      return;
    }
    const user = authenticate(username, password);
    if (!user) {
      setError("Tài khoản hoặc mật khẩu không đúng.");
      return;
    }
    setError("");
    onLogin(user);
  };

  return <main className="login-page">
    {/* Cột nhận diện. Một khối duy nhất: con dấu, tên hệ, vạch vàng, tên cơ
        quan — đặt ở giữa chiều cao. Không tiêu đề, không nút, không đường dẫn.
        Vạch vàng là lần dùng sắc vàng con dấu duy nhất trên màn này. */}
    <section className="login-context" aria-label="Nhận diện hệ thống">
      <div className="login-mark">
        <TaxLogo/>
        <strong>Quản lý nghiệp vụ Thuế</strong>
        <span className="login-rule" aria-hidden="true"/>
        <small>Thuế thành phố Hà Nội</small>
      </div>
    </section>

    <section className="login-panel">
      <div className="login-form-wrap">
        <div className="login-heading"><h1>Đăng nhập</h1><p>Dùng tài khoản do Thuế TP Hà Nội cấp.</p></div>

        <form className="login-form" onSubmit={submit} noValidate>
          <label>
            <span>Tài khoản</span>
            <input name="username" autoComplete="username" autoFocus value={username}
              aria-invalid={error ? true : undefined} aria-describedby={error ? "login-error" : undefined}
              onChange={(event) => { setUsername(event.target.value); setError(""); }}/>
          </label>
          <label>
            <span>Mật khẩu</span>
            {/* Nút hiện/ẩn là chức năng thật, không phải trang trí: mật khẩu gõ
                sai trên bàn phím có dấu là lỗi thường gặp, và không có cách nào
                tự kiểm tra nếu ô luôn che. Ô rỗng thì nút không có gì để hiện,
                nên lúc đó nó không được dựng. */}
            <span className="password-field">
              <input name="password" type={hien ? "text" : "password"} autoComplete="current-password" value={password}
                aria-invalid={error ? true : undefined} aria-describedby={error ? "login-error" : undefined}
                onChange={(event) => { setPassword(event.target.value); setError(""); }}/>
              {password !== "" && <button type="button" onClick={() => setHien((truoc) => !truoc)} aria-pressed={hien}>{hien ? "Ẩn" : "Hiện"}</button>}
            </span>
          </label>
          {error && <p className="login-error" id="login-error" role="alert">{error}</p>}
          <button className="login-submit" type="submit">Đăng nhập</button>
        </form>

        {/*
          Lối đăng nhập một lần. Nút này là TƯỢNG TRƯNG: Keycloak là hướng đã
          chọn cho xác thực tập trung nhưng chưa nối trong bản demo, nên nó nói
          thẳng điều đó thay vì giả vờ chuyển hướng rồi quay về. Dựng một nút
          trông như chạy được mà không chạy là thứ khiến người xem tin nhầm hệ
          đã có SSO.
        */}
        <div className="login-or"><span>hoặc</span></div>
        <button type="button" className="button is-secondary login-sso" onClick={() => setSso(true)} aria-describedby={sso ? "login-sso-note" : undefined}>
          <Icon name="key" size={17}/><span>Đăng nhập bằng Keycloak</span>
        </button>
        {sso && <p className="login-sso-note" id="login-sso-note" role="status">Bản demo chưa nối Keycloak. Dùng tài khoản do Thuế TP Hà Nội cấp ở ô phía trên.</p>}
      </div>
    </section>
  </main>;
}
