import type { DashboardDataProvider } from "@/domain/types";
import { JsonDashboardProvider } from "./providers/http";
import { MockDashboardProvider } from "./providers/mock";

/**
 * ĐIỂM THAY NGUỒN DỮ LIỆU.
 *
 * Toàn bộ giao diện chỉ biết tới `DashboardDataProvider` (xem `@/domain/types`),
 * không biết dữ liệu đến từ đâu. Thay API nghĩa là đổi đúng file này, không phải
 * đi sửa từng widget.
 *
 * Ba cách, theo thứ tự công sức từ ít tới nhiều:
 *
 * 1. **Giữ nguyên hợp đồng, đổi endpoint.** Backend trả đúng envelope ở
 *    `@/domain/types`: sửa đường dẫn trong `createProvider` bên dưới và chạy với
 *    `VITE_DASHBOARD_PROVIDER=api`.
 *
 * 2. **Backend có sẵn, hình dạng khác.** Viết một lớp mới trong `providers/`
 *    implement `DashboardDataProvider`, nắn dữ liệu về đúng kiểu ở
 *    `@/domain/types`, rồi đăng ký ở đây. Không đụng tới `features/`.
 *
 * 3. **Đổi luôn cả hợp đồng.** Sửa `@/domain/types` trước, TypeScript sẽ chỉ ra
 *    mọi chỗ cần theo.
 *
 * Dữ liệu từ ngoài LUÔN đi qua `validate.ts` trước khi tới giao diện — đừng bỏ
 * bước đó kể cả khi backend là của mình.
 */
export function createProvider(): DashboardDataProvider {
  const mode = import.meta.env.VITE_DASHBOARD_PROVIDER;
  if (mode === "api") return new JsonDashboardProvider("/api/dashboard", "api");
  if (mode === "mcp") return new JsonDashboardProvider("/mcp/dashboard", "mcp");
  return new MockDashboardProvider();
}

export const provider = createProvider();

export { NoDataError, sanitizeNavigation } from "./validate";
