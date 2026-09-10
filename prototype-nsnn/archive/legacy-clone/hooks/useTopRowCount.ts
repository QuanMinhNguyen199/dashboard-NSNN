import { useEffect, useState } from "react";

/** `x1` — số dòng của các danh sách Top: 5 dưới 1100px, 10 từ 1100px. */
export function useTopRowCount(): number {
  const query = "(max-width: 1100px)";
  const [count, setCount] = useState(() => (window.matchMedia(query).matches ? 5 : 10));

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setCount(mql.matches ? 5 : 10);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return count;
}
