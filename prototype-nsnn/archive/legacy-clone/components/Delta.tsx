import { pct1 } from "../lib/format";

/** `oR` — phần trăm thay đổi, 1 số lẻ theo vi-VN, màu up/down. */
export function Delta({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  const up = pct >= 0;
  return (
    <span className={up ? "text-up" : "text-down"}>
      {up ? "+" : ""}
      {pct1(pct)}%
    </span>
  );
}
