import { createContext, useContext, useRef, useState, type ReactNode } from "react";

/** `Oz` / `Dw` — đếm số tác vụ tài nguyên đang tải (danh mục, bản đồ). */
interface GlobalLoading {
  isLoading: boolean;
  start: () => void;
  end: () => void;
}

const Ctx = createContext<GlobalLoading | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const count = useRef(0);
  const [isLoading, setLoading] = useState(false);

  const start = () => {
    count.current++;
    if (count.current === 1) setLoading(true);
  };
  const end = () => {
    count.current = Math.max(0, count.current - 1);
    if (count.current === 0) setLoading(false);
  };

  return <Ctx.Provider value={{ isLoading, start, end }}>{children}</Ctx.Provider>;
}

export function useGlobalLoading(): GlobalLoading {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGlobalLoading() phải gọi trong <LoadingProvider>");
  return ctx;
}
