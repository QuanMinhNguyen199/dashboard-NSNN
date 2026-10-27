import { lazy, Suspense, type ComponentProps, type ComponentType } from "react";

/*
  Bốn phân hệ báo cáo (QL1–QL4) tải KHI MỞ, không nằm trong gói đầu (audit
  27/10/2026: gói chính 549 kB). Người vào màn khối QLDN — màn mặc định của
  mọi vai — không phải tải mã của bốn báo cáo họ có thể không mở trong phiên.

  App và báo cáo nhúng trong Quản trị công việc cùng dùng các bản lười ở đây,
  để hai chỗ không kéo bản tĩnh vào gói đầu.
*/
function luoi<T extends ComponentType<any>>(nap: () => Promise<{ default: T }>) {
  const C = lazy(nap);
  return (props: ComponentProps<T>) => <Suspense fallback={<div className="phan-he-dang-tai" role="status">Đang tải báo cáo…</div>}><C {...props}/></Suspense>;
}

export const DebtQL1 = luoi(() => import("@/features/DebtQL1").then((m) => ({ default: m.DebtQL1 })));
export const HoaDonQL2 = luoi(() => import("@/features/HoaDonQL2").then((m) => ({ default: m.HoaDonQL2 })));
export const RiskQL3 = luoi(() => import("@/features/RiskQL3").then((m) => ({ default: m.RiskQL3 })));
export const HoanQL4 = luoi(() => import("@/features/HoanQL4").then((m) => ({ default: m.HoanQL4 })));
