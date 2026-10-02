import { runProcess, ProcessStopped } from "./run-process.mjs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { networkInterfaces } from "node:os";
import { existsSync } from "node:fs";

const root = fileURLToPath(new URL("../", import.meta.url));
const mode = process.argv[2] ?? "dev";
if (!["dev", "build", "preview"].includes(mode)) throw new Error(`Unknown portal mode: ${mode}`);
const basePath = (process.env.VITE_BASE ?? "/").split("/").filter(Boolean).join("/");
const base = basePath ? `/${basePath}/` : "/";
const env = { ...process.env, VITE_PORTAL: "true", VITE_BASE: base };
// Both applications are served by Tax Ops. NSNN assets use a relative URL on
// the same origin, so sharing port 5174 also shares the demo login session.
function vite(app, args, extraEnv = {}) {
  return runProcess(`${app}: Vite`, process.execPath, [resolve(root, app, "node_modules/vite/bin/vite.js"), ...args], {
      cwd: resolve(root, app), env: { ...env, ...extraEnv }, stdio: "inherit",
    });
}
/*
  In sẵn địa chỉ trong mạng nội bộ khi chạy `preview`.

  Bản dựng này là cách chia sẻ hợp lệ duy nhất khi có dữ liệu thật: nó ở lại
  trong mạng của cơ quan, không đi qua bất kỳ dịch vụ trung gian nào. Vite đã
  lắng nghe trên 0.0.0.0 sẵn, nhưng không ai nhớ IP máy mình, nên chỗ nào phải
  tra tay thì chỗ đó không được dùng.
*/
function inDiaChiNoiBo() {
  const dia = Object.values(networkInterfaces()).flat()
    .filter((n) => n && n.family === "IPv4" && !n.internal)
    .map((n) => n.address);
  if (!dia.length) return;
  const coDuLieuThat = existsSync(resolve(root, "tax-ops/dist/du-lieu-that/tong-hop.json"));
  console.log("");
  console.log("  Chia sẻ trong mạng nội bộ:");
  for (const d of dia) {
    console.log(`    Web quản lý: http://${d}:5174${base}quan-ly/`);
    console.log(`    Dashboard NSNN: http://${d}:5174${base}nsnn/`);
  }
  console.log(coDuLieuThat
    ? "  Bản dựng này CÓ dữ liệu thật. Chỉ chia sẻ trong mạng cơ quan; không đưa qua ngrok, tunnel hay dịch vụ lưu trữ ngoài."
    : "  Bản dựng này chạy dữ liệu mô phỏng. Chạy `python tax-ops/scripts/nap-du-lieu-that.py` rồi dựng lại nếu cần dữ liệu thật.");
  console.log("");
}

let addressTimer;
try {
if (mode === "build") {
  await vite("tax-ops", ["build"]);
  await vite("web", ["build", "--outDir", "../tax-ops/dist/nsnn", "--emptyOutDir"], { VITE_BASE: `${base}nsnn/` });
} else {
  if (mode === "dev") {
    await vite("web", ["build", "--outDir", "../tax-ops/public/nsnn", "--emptyOutDir"], { VITE_BASE: `${base}nsnn/` });
  }
  if (mode === "preview") addressTimer = setTimeout(inDiaChiNoiBo, 1200);
  await vite("tax-ops", [
    ...(mode === "preview" ? ["preview"] : []),
    "--host", "0.0.0.0", "--port", "5174", "--strictPort",
  ]);
}
} catch (error) {
  if (!(error instanceof ProcessStopped && error.requested)) console.error(error.message);
  process.exitCode = error instanceof ProcessStopped ? error.exitCode : 1;
} finally {
  clearTimeout(addressTimer);
}
