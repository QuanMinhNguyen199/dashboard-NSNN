import fs from "node:fs";
import path from "node:path";
import type { Connect, Plugin, ViteDevServer, PreviewServer } from "vite";

/**
 * Replay các phản hồi API đã khảo sát trong reference-nsnn/api.
 *
 * Khoá của manifest là URL đã chuẩn hoá theo đúng cách bundle gốc dựng URL
 * (hàm `e2` trong app-readable.js): bỏ query rỗng, sort key, encode bằng
 * URLSearchParams (dấu cách thành `+`). Middleware chuẩn hoá y hệt trước khi tra.
 *
 * Không có fixture:
 *   - NSNN_PROXY=1  -> gọi https://dev-nsnn.thehegeo.com và cache vào .api-cache/
 *   - mặc định      -> trả 502 để ứng dụng hiện đúng trạng thái lỗi của bản gốc
 */

const UPSTREAM = process.env.NSNN_UPSTREAM ?? "https://dev-nsnn.thehegeo.com";
const USE_PROXY = process.env.NSNN_PROXY === "1";

type ManifestEntry = { file: string; status: number; bytes: number };

function resolveRefDir(root: string): string {
  const fromEnv = process.env.NSNN_REFERENCE;
  const candidates = [
    fromEnv && path.resolve(root, fromEnv),
    path.resolve(root, "../reference-nsnn"),
    path.resolve(root, "reference-nsnn"),
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "api", "manifest.json"))) return dir;
  }
  return candidates[candidates.length - 1];
}

/** Bản sao của `e2(path, params)` trong bundle gốc. */
function normalize(rawUrl: string): string {
  const [pathname, search = ""] = rawUrl.split("?");
  const incoming = new URLSearchParams(search);
  const out = new URLSearchParams();
  for (const key of [...incoming.keys()].sort()) {
    const value = incoming.get(key);
    if (value) out.set(key, value);
  }
  return out.toString() ? `${pathname}?${out}` : pathname;
}

export function nsnnApi(): Plugin {
  let refDir = "";
  let manifest: Record<string, ManifestEntry> = {};
  let cacheDir = "";
  let announced = false;

  const load = (root: string) => {
    refDir = resolveRefDir(root);
    cacheDir = path.resolve(root, ".api-cache");
    const manifestPath = path.join(refDir, "api", "manifest.json");
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch {
      manifest = {};
    }
    if (!announced) {
      announced = true;
      const n = Object.keys(manifest).length;
      if (n === 0) {
        console.warn(
          `[nsnn-api] Không đọc được ${manifestPath}. Đặt NSNN_REFERENCE trỏ tới thư mục reference-nsnn.`,
        );
      } else {
        console.log(
          `[nsnn-api] ${n} fixture từ ${path.relative(root, refDir) || refDir}` +
            (USE_PROXY ? ` · proxy dự phòng: ${UPSTREAM}` : " · proxy tắt (NSNN_PROXY=1 để bật)"),
        );
      }
    }
  };

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const raw = req.url ?? "";
    if (!raw.startsWith("/api/")) return next();

    const key = normalize(raw);
    const hit = manifest[key];

    if (hit) {
      const file = path.join(refDir, "api", hit.file);
      try {
        const body = fs.readFileSync(file);
        res.statusCode = hit.status;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.setHeader("x-nsnn-source", "fixture");
        res.end(body);
        return;
      } catch {
        /* rơi xuống nhánh dưới */
      }
    }

    const cached = path.join(cacheDir, encodeURIComponent(key) + ".json");
    if (fs.existsSync(cached)) {
      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.setHeader("x-nsnn-source", "cache");
      res.end(fs.readFileSync(cached));
      return;
    }

    if (!USE_PROXY) {
      res.statusCode = 502;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.setHeader("x-nsnn-source", "missing");
      res.end(
        JSON.stringify({
          error: "Chưa có fixture cho tổ hợp filter này.",
          normalized: key,
          hint: "Chạy lại với NSNN_PROXY=1 để lấy từ API gốc.",
        }),
      );
      return;
    }

    (async () => {
      const upstream = await fetch(UPSTREAM + key, {
        headers: { accept: "application/json" },
      });
      const text = await upstream.text();
      if (upstream.ok && upstream.headers.get("content-type")?.includes("application/json")) {
        fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(cached, text);
      }
      res.statusCode = upstream.status;
      res.setHeader(
        "content-type",
        upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
      );
      res.setHeader("x-nsnn-source", "upstream");
      res.end(text);
    })().catch((err) => {
      res.statusCode = 502;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: String(err), normalized: key }));
    });
  };

  return {
    name: "nsnn-api",
    configureServer(server: ViteDevServer) {
      load(server.config.root);
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server: PreviewServer) {
      load(server.config.root);
      server.middlewares.use(middleware);
    },
  };
}
