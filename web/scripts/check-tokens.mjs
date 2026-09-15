/**
 * Mọi `var(--x)` phải có một nơi đặt `--x`.
 *
 * Biến CSS không tồn tại KHÔNG báo lỗi: khai báo chứa nó trở thành invalid at
 * computed-value time và bị xoá im lặng. Trong một lượt rà soát, ba biến kiểu
 * này đã lần lượt xoá mất vòng focus của hai điều khiển, nền tooltip bản đồ,
 * nền khung xem thử, và nét vẽ của một chuỗi dữ liệu — không chỗ nào có dấu
 * hiệu nào trên console. Đây là phép kiểm rẻ nhất chặn được cả lớp lỗi đó.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const CSS = "src/styles/dashboard.css";
const css = readFileSync(CSS, "utf8");

const used = new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
const declared = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

/** Biến đặt từ JavaScript qua `style={{ "--x": … }}` cũng là một nơi đặt hợp lệ. */
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
for (const file of walk("src").filter((f) => /\.tsx?$/.test(f)))
  for (const m of readFileSync(file, "utf8").matchAll(/"(--[a-z0-9-]+)"\s*:/g)) declared.add(m[1]);

const missing = [...used].filter((v) => !declared.has(v)).sort();
if (missing.length) {
  console.error(`✗ ${missing.length} biến CSS được dùng nhưng không nơi nào đặt:\n`);
  for (const v of missing) {
    const lines = css.split("\n").flatMap((l, i) => (l.includes(`var(${v}`) ? [i + 1] : []));
    console.error(`  ${v}  →  ${CSS}:${lines.join(", ")}`);
  }
  process.exit(1);
}
console.log(`✓ ${used.size} biến CSS đều có nơi đặt.`);
