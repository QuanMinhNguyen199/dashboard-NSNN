import { useState, type FormEvent } from "react";
import { DEMO_ACCOUNTS, authenticate, type DemoUser } from "@/auth/demoAuth";
import { TaxLogo } from "@/components/TaxLogo";

export function LoginScreen({ onLogin }: { onLogin: (user: DemoUser) => void }) {
  /* Mở sẵn tài khoản Cán bộ thuế: đây là vai duy nhất thấy đủ tám màn, nên là
     điểm vào đúng cho người xem demo. Tìm theo tên tài khoản chứ không theo chỉ
     số mảng — danh sách vai đã đổi một lần và chỉ số im lặng trỏ sai vai. */
  const macDinh = DEMO_ACCOUNTS.find((item) => item.role === "OFFICER") ?? DEMO_ACCOUNTS[0];
  const [username, setUsername] = useState(macDinh.username);
  const [password, setPassword] = useState(macDinh.password);
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const user = authenticate(username, password);
    if (!user) {
      setError("Tài khoản hoặc mật khẩu không đúng. Hãy dùng một tài khoản mẫu bên dưới.");
      return;
    }
    setError("");
    onLogin(user);
  };

  const useAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setUsername(account.username);
    setPassword(account.password);
    setError("");
  };

  return <main className="login-page">
    <section className="login-context" aria-labelledby="login-product">
      <div className="login-brand"><TaxLogo/><div><strong id="login-product">Quản lý nghiệp vụ Thuế</strong><small>Thuế TP Hà Nội</small></div></div>
      <div className="login-context-copy">
        {/* Không có eyebrow. "Môi trường trình diễn" nằm trên tiêu đề là đúng
            thứ duy nhất sàn thủ công cấm tuyệt đối, và cùng lúc app này đã xoá
            nó khỏi thanh trên cùng — cấm ở màn hai mà dùng ở màn một thì không
            còn là một hệ. Nội dung không mất: nó đã được nói rõ hơn ở dòng ghi
            chú dữ liệu mô phỏng phía dưới. */}
        <h1>Đăng nhập theo đúng vai trò nghiệp vụ</h1>
        <p>Ba vai dùng chung một lần đăng nhập. Cán bộ thuế và Lãnh đạo Thuế làm việc trên hệ này; Lãnh đạo nhà nước chỉ đọc Dashboard Thu NSNN.</p>
      </div>
      <p className="login-data-note">Dữ liệu và danh tính trên màn hình này đều là mô phỏng.</p>
    </section>

    <section className="login-panel" aria-labelledby="login-title">
      <div className="login-form-wrap">
        <div className="login-heading"><h2 id="login-title">Đăng nhập Web QL Thuế</h2><p>Nhập thông tin hoặc chọn nhanh một tài khoản mẫu.</p></div>
        <form className="login-form" onSubmit={submit} noValidate>
          <label><span>Tài khoản</span><input name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label><span>Mật khẩu</span><input name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="login-error" id="login-error" role="alert">{error}</p>}
          <button className="login-submit" type="submit">Đăng nhập</button>
        </form>

        <div className="demo-accounts">
          <div className="demo-accounts-head"><h3>Tài khoản mẫu</h3><span>Mật khẩu chung: <strong>demo123</strong></span></div>
          <div className="demo-account-list">
            {DEMO_ACCOUNTS.map((account) => <button key={account.username} type="button" className={username === account.username ? "is-selected" : undefined} onClick={() => useAccount(account)} aria-pressed={username === account.username}>
              <span><strong>{account.roleLabel}</strong><small>{account.unit}</small><em>{account.permissions.includes("TAX_OPS_VIEW") ? "Web quản lý" : "Chỉ Dashboard NSNN"}</em></span>
              <code>{account.username}</code>
            </button>)}
          </div>
        </div>
      </div>
    </section>
  </main>;
}
