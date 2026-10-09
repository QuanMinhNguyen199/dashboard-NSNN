import { createContext, useContext, useState, type ReactNode } from "react";

const Context = createContext<{ vuongMac: Record<string, string[]>; danhDau: (ky: string, mst: string) => void } | null>(null);
export function QL2Provider({ children }: { children: ReactNode }) {
  const [vuongMac, set] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(sessionStorage.getItem("ql2-vuongmac-demo") ?? "{}"); } catch { return {}; }
  });
  const danhDau = (ky: string, mst: string) => set((old) => {
    const ds = old[ky] ?? [];
    const next = { ...old, [ky]: ds.includes(mst) ? ds.filter((m) => m !== mst) : [...ds, mst] };
    sessionStorage.setItem("ql2-vuongmac-demo", JSON.stringify(next));
    return next;
  });
  return <Context.Provider value={{ vuongMac, danhDau }}>{children}</Context.Provider>;
}
export function useQL2() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing QL2Provider");
  return value;
}
