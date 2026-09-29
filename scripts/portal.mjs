import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const mode = process.argv[2] ?? "dev";
if (!["dev", "build", "preview"].includes(mode)) throw new Error(`Unknown portal mode: ${mode}`);
const base = `/${(process.env.VITE_BASE ?? "/").split("/").filter(Boolean).join("/")}/`;
const env = { ...process.env, VITE_PORTAL: "true", VITE_BASE: base };
// Both applications are served by Tax Ops. NSNN assets use a relative URL on
// the same origin, so sharing port 5174 also shares the demo login session.
function vite(app, args, extraEnv = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [resolve(root, app, "node_modules/vite/bin/vite.js"), ...args], {
      cwd: resolve(root, app), env: { ...env, ...extraEnv }, stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolveRun() : reject(new Error(`${app}: Vite exited ${code}`)));
    for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => child.kill(signal));
  });
}
if (mode !== "preview") {
  await vite("web", ["build", "--outDir", "../tax-ops/public/nsnn", "--emptyOutDir"], { VITE_BASE: `${base}nsnn/` });
}
await vite("tax-ops", mode === "build" ? ["build"] : [
  ...(mode === "preview" ? ["preview"] : []),
  "--host", "0.0.0.0", "--port", "5174", "--strictPort",
]);
