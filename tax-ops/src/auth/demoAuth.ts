import type { UserRole } from "../domain/types";

export interface DemoUser {
  username: string;
  name: string;
  unit: string;
  role: UserRole;
  permissions: readonly DemoPermission[];
}

export type DemoPermission = "TAX_OPS_VIEW" | "NSNN_VIEW";

export interface DemoAccount extends DemoUser {
  password: string;
  roleLabel: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { username: "canbo.thue", password: "demo123", name: "Nguyễn Minh Anh", unit: "Phòng Quản lý thuế 1", role: "OFFICER", roleLabel: "Cán bộ thuế", permissions: ["TAX_OPS_VIEW"] },
  { username: "lanhdao.thue", password: "demo123", name: "Lê Thu Hà", unit: "Thuế TP Hà Nội", role: "TAX_LEADER", roleLabel: "Lãnh đạo Thuế", permissions: ["TAX_OPS_VIEW"] },
  /* Lãnh đạo nhà nước KHÔNG có `TAX_OPS_VIEW`: đây là tài khoản của Dashboard
     Thu NSNN. Để nó trong danh sách demo để chứng minh được sự phân tách, không
     phải để nó vào được. */
  { username: "lanhdao.nhanuoc", password: "demo123", name: "Vũ Quang Đạt", unit: "Ủy ban nhân dân TP Hà Nội", role: "STATE_LEADER", roleLabel: "Lãnh đạo nhà nước", permissions: ["NSNN_VIEW"] },
];

const SESSION_KEY = "tax-ops-demo-user";

export function authenticate(username: string, password: string): DemoUser | null {
  const normalized = username.trim().toLowerCase();
  const account = DEMO_ACCOUNTS.find((item) => item.username === normalized && item.password === password);
  if (!account) return null;
  const { password: _password, roleLabel: _roleLabel, ...user } = account;
  return user;
}

export function readDemoSession(): DemoUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<DemoUser>;
    const account = DEMO_ACCOUNTS.find((item) => item.username === value.username && item.role === value.role);
    if (!account) return null;
    const { password: _password, roleLabel: _roleLabel, ...user } = account;
    return user;
  } catch {
    return null;
  }
}

export function writeDemoSession(user: DemoUser | null) {
  if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(SESSION_KEY);
}
