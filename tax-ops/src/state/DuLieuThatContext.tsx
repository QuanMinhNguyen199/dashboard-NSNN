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
  /*
    Mặc định là DỮ LIỆU GIẢ.

    Brief thiết kế §1.2 và mục bảo mật S5 yêu cầu mockup chỉ dùng dữ liệu giả,
    không dùng file thật của phòng: mọi ảnh chụp màn hình đều có thể bị chuyển
    tiếp, và màn hình này có mã số thuế, tên người nộp thuế và số nợ.

    Lớp nạp dữ liệu thật vẫn còn nguyên, chỉ không tự bật. Thêm `?du-lieu-that=1`
    vào đường dẫn khi cần trình bày nội bộ trên máy đã sinh sẵn tệp JSON.
  */
  useEffect(() => {
    const bat = new URLSearchParams(window.location.search).get("du-lieu-that") === "1";
    if (!bat) { setTrang({ that: null, dangNap: false }); return; }
    let con = true;
    napTongHop().then((t) => { if (con) setTrang({ that: t, dangNap: false }); });
    return () => { con = false; };
  }, []);
  return <Boi.Provider value={trang}>{children}</Boi.Provider>;
}

export function useDuLieuThat() { return useContext(Boi); }
