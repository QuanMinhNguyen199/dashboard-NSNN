import { readDemoSession, writeDemoSession } from "../../../tax-ops/src/auth/demoAuth";

export const isPortal = import.meta.env.VITE_PORTAL === "true";
const portalHome = new URL("../quan-ly/", new URL(import.meta.env.BASE_URL, window.location.origin)).pathname;
const dashboardLogin = `${import.meta.env.BASE_URL}dang-nhap/`;

export function canOpenDashboard() {
  if (!isPortal) return true;
  const user = readDemoSession();
  if (user?.permissions.includes("NSNN_VIEW")) return true;
  window.location.replace(user ? portalHome : dashboardLogin);
  return false;
}

export function logoutPortal() {
  writeDemoSession(null);
  window.location.replace(dashboardLogin);
}
