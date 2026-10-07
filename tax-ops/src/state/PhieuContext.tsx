import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { TraLoi } from "@/data/phieu";

/*
  Phản hồi phiếu rà soát, lưu theo ID dòng.

  Cùng lý do đã ghi ở `DuyetContext`: `localStorage` chứ không `sessionStorage`,
  vì cán bộ đơn vị điền ở một tab còn chuyên viên của phòng xem tiến độ ở tab
  khác — đó chính là vòng mà §6 sinh ra để thay cho email và Zalo. Bản thật
  phải giữ ở máy chủ; `localStorage` chỉ sống trên CÙNG một máy, không qua hai
  người.
*/

const KHOA = "tax-ops-phieu";

type Kho = Record<string, TraLoi>;

const Ngu = createContext<{
  layTraLoi: (id: string) => TraLoi | null;
  ghi: (id: string, t: Omit<TraLoi, "luc" | "boi">) => void;
  ghiNhieu: (ids: string[], t: Omit<TraLoi, "luc" | "boi">) => void;
  daTraLoi: (ids: string[]) => number;
} | null>(null);

const dauThoiGian = () => {
  const t = new Date();
  const hai = (n: number) => String(n).padStart(2, "0");
  return `${hai(t.getDate())}/${hai(t.getMonth() + 1)} lúc ${hai(t.getHours())}:${hai(t.getMinutes())}`;
};

export function PhieuProvider({ children, nguoiDung }: { children: ReactNode; nguoiDung: string }) {
  const [kho, setKho] = useState<Kho>(() => {
    try { return JSON.parse(localStorage.getItem(KHOA) ?? "{}") as Kho; } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem(KHOA, JSON.stringify(kho)); } catch { /* chế độ riêng tư */ }
  }, [kho]);

  const ghiNhieu = useCallback((ids: string[], t: Omit<TraLoi, "luc" | "boi">) => {
    setKho((truoc) => {
      const moi = { ...truoc };
      for (const id of ids) moi[id] = { ...t, luc: dauThoiGian(), boi: nguoiDung };
      return moi;
    });
  }, [nguoiDung]);

  const gia = useMemo(() => ({
    layTraLoi: (id: string) => kho[id] ?? null,
    ghi: (id: string, t: Omit<TraLoi, "luc" | "boi">) => ghiNhieu([id], t),
    ghiNhieu,
    daTraLoi: (ids: string[]) => ids.filter((id) => kho[id]).length,
  }), [kho, ghiNhieu]);

  return <Ngu.Provider value={gia}>{children}</Ngu.Provider>;
}

export function usePhieu() {
  const gia = useContext(Ngu);
  if (!gia) throw new Error("usePhieu phải nằm trong PhieuProvider.");
  return gia;
}
