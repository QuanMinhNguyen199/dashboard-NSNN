import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { napTongHop, type TongHopThat } from "@/data/duLieuThat";

/*
  Một nơi duy nhất trả lời câu "app đang chạy dữ liệu thật hay dữ liệu mô phỏng".

  Hỏi ở mỗi màn thì mỗi màn tự gọi fetch một lần, và trong lúc chờ mỗi màn lại
  tự quyết lấy nên hiện gì — sáu màn sẽ ra sáu cách xử lý trạng thái chờ.
*/
interface TrangThai {
  that: TongHopThat | null;
  dangNap: boolean;
}

const Boi = createContext<TrangThai>({ that: null, dangNap: true });

export function DuLieuThatProvider({ children }: { children: ReactNode }) {
  const [trang, setTrang] = useState<TrangThai>({ that: null, dangNap: true });
  useEffect(() => {
    let con = true;
    napTongHop().then((t) => { if (con) setTrang({ that: t, dangNap: false }); });
    return () => { con = false; };
  }, []);
  return <Boi.Provider value={trang}>{children}</Boi.Provider>;
}

export function useDuLieuThat() { return useContext(Boi); }
