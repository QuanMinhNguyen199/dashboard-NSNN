import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DemoUser } from "@/auth/demoAuth";
import { canChangeApproval, type ApprovalAction } from "@/domain/approval";
import type { ReportStatus, VaiTro } from "@/domain/types";

/*
  Trạng thái duyệt của MỘT KỲ trên MỘT PHÂN HỆ.

  Mục 3 bản thiết kế vẽ luồng duyệt đi thẳng trên phân hệ: hệ sinh bản nháp →
  chuyên viên xử lý cảnh báo và đối chiếu dữ liệu gốc → gửi duyệt → trưởng
  phòng duyệt hoặc trả lại kèm lý do → đã chốt, khóa số. Không có bước nào rời
  khỏi bảng số liệu, nên trạng thái cũng không nên sống ở một màn khác.

  Khóa là `phân hệ + kỳ`: cùng một phòng, hai kỳ khác nhau duyệt độc lập, và
  đổi kỳ ở thanh lọc là thấy ngay kỳ ấy đang ở bước nào.

  Lưu trong `sessionStorage` của tab để hai tài khoản demo đi hết được luồng
  lập → duyệt mà không cần máy chủ.
*/

export interface BanGhiDuyet {
  trangThai: ReportStatus;
  guiBoi: string | null;
  guiLuc: string | null;
  chotBoi: string | null;
  chotLuc: string | null;
  /** Lý do trưởng phòng trả lại; `null` khi chưa từng bị trả lại. */
  lyDoTraLai: string | null;
}

const RONG: BanGhiDuyet = { trangThai: "DRAFT", guiBoi: null, guiLuc: null, chotBoi: null, chotLuc: null, lyDoTraLai: null };
const KHOA = "tax-ops-duyet";

type Kho = Record<string, BanGhiDuyet>;

const Ngu = createContext<{
  layBanGhi: (khoa: string) => BanGhiDuyet;
  guiDuyet: (khoa: string) => boolean;
  chotSo: (khoa: string) => boolean;
  traLai: (khoa: string, lyDo: string) => boolean;
} | null>(null);

const dauThoiGian = () => {
  const t = new Date();
  const hai = (n: number) => String(n).padStart(2, "0");
  return `${hai(t.getDate())}/${hai(t.getMonth() + 1)} lúc ${hai(t.getHours())}:${hai(t.getMinutes())}`;
};

export function DuyetProvider({ children, user }: { children: ReactNode; user: DemoUser }) {
  const [kho, setKho] = useState<Kho>(() => {
    try { return JSON.parse(sessionStorage.getItem(KHOA) ?? "{}") as Kho; } catch { return {}; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(KHOA, JSON.stringify(kho)); } catch { /* phiên riêng tư: luồng vẫn chạy, chỉ không nhớ qua lần tải sau */ }
  }, [kho]);

  const current = useRef(kho);
  const sua = useCallback((khoa: string, action: ApprovalAction, lyDo = "") => {
    const b = current.current[khoa] ?? RONG;
    if (!canChangeApproval(user, khoa, b.trangThai, action) || (action === "return" && !lyDo.trim())) return false;
    const next: BanGhiDuyet = action === "send"
      ? { ...b, trangThai: "PENDING", guiBoi: user.name, guiLuc: dauThoiGian() }
      : action === "approve"
        ? { ...b, trangThai: "FINAL", chotBoi: user.name, chotLuc: dauThoiGian() }
        : { ...b, trangThai: "DRAFT", guiBoi: null, guiLuc: null, lyDoTraLai: lyDo.trim() };
    current.current = { ...current.current, [khoa]: next };
    setKho(current.current);
    return true;
  }, [user]);

  const gia = useMemo(() => ({
    layBanGhi: (khoa: string) => kho[khoa] ?? RONG,
    guiDuyet: (khoa: string) => sua(khoa, "send"),
    chotSo: (khoa: string) => sua(khoa, "approve"),
    traLai: (khoa: string, lyDo: string) => sua(khoa, "return", lyDo),
  }), [kho, sua]);

  return <Ngu.Provider value={gia}>{children}</Ngu.Provider>;
}

export function useDuyet() {
  const gia = useContext(Ngu);
  if (!gia) throw new Error("useDuyet phải nằm trong DuyetProvider.");
  return gia;
}

/** Ai được làm gì ở bước nào. Quyền nằm ở dữ liệu, không nằm ở việc ẩn nút. */
export const duocGui = (b: BanGhiDuyet, vaiTro: VaiTro) => vaiTro === "CV" && b.trangThai === "DRAFT";
export const duocChot = (b: BanGhiDuyet, vaiTro: VaiTro) => vaiTro === "TP" && b.trangThai === "PENDING";
export const duocTraLai = (b: BanGhiDuyet, vaiTro: VaiTro) => vaiTro === "TP" && b.trangThai === "PENDING";
