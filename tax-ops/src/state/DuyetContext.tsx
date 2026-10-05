import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DemoUser } from "@/auth/demoAuth";
import { buocDen, canChangeApproval, type ApprovalAction } from "@/domain/approval";
import type { ReportStatus } from "@/domain/types";

/*
  Trạng thái duyệt của MỘT KỲ trên MỘT PHÂN HỆ.

  Mục 3 bản thiết kế vẽ luồng duyệt đi thẳng trên phân hệ: hệ sinh bản nháp →
  chuyên viên xử lý cảnh báo và đối chiếu dữ liệu gốc → gửi rà soát → người
  duyệt duyệt hoặc trả lại kèm lý do → đã duyệt, khóa kỳ. Không có bước nào
  rời khỏi bảng số liệu, nên trạng thái cũng không nên sống ở một màn khác.

  Khóa là `phân hệ + kỳ`: cùng một phòng, hai kỳ khác nhau duyệt độc lập, và
  đổi kỳ ở thanh lọc là thấy ngay kỳ ấy đang ở bước nào.

  Lưu trong `sessionStorage` của tab để hai tài khoản demo đi hết được luồng
  lập → duyệt mà không cần máy chủ.
*/

export interface BanGhiDuyet {
  trangThai: ReportStatus;
  guiBoi: string | null;
  guiLuc: string | null;
  duyetBoi: string | null;
  duyetLuc: string | null;
  /** Lý do trả lại; `null` khi chưa từng bị trả lại. */
  lyDoTraLai: string | null;
  /** Lý do mở bản điều chỉnh — 13.2 đòi ghi lại. */
  lyDoDieuChinh: string | null;
  /** Số lần bản này đã được duyệt rồi mở điều chỉnh. Bản thứ hai trở đi là bản thay thế. */
  soBanDaDuyet: number;
}

const RONG: BanGhiDuyet = {
  trangThai: "DRAFT", guiBoi: null, guiLuc: null, duyetBoi: null, duyetLuc: null,
  lyDoTraLai: null, lyDoDieuChinh: null, soBanDaDuyet: 0,
};
const KHOA = "tax-ops-duyet";

type Kho = Record<string, BanGhiDuyet>;

const Ngu = createContext<{
  layBanGhi: (khoa: string) => BanGhiDuyet;
  duoc: (khoa: string, action: ApprovalAction) => boolean;
  guiRaSoat: (khoa: string) => boolean;
  duyet: (khoa: string) => boolean;
  traLai: (khoa: string, lyDo: string) => boolean;
  moDieuChinh: (khoa: string, lyDo: string) => boolean;
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
  current.current = kho;

  const sua = useCallback((khoa: string, action: ApprovalAction, lyDo = "") => {
    const b = current.current[khoa] ?? RONG;
    if (!canChangeApproval(user, khoa, { status: b.trangThai, guiBoi: b.guiBoi }, action)) return false;
    /* Hai hành động bắt buộc có lý do: trả lại (sơ đồ luồng) và mở điều chỉnh
       (13.2 — "VT-02 mở, ghi lý do"). */
    if ((action === "return" || action === "amend") && !lyDo.trim()) return false;

    const den = buocDen(action);
    const luc = dauThoiGian();
    const next: BanGhiDuyet =
      action === "send" ? { ...b, trangThai: den, guiBoi: user.name, guiLuc: luc }
      : action === "approve" ? { ...b, trangThai: den, duyetBoi: user.name, duyetLuc: luc, soBanDaDuyet: b.soBanDaDuyet + 1 }
      : action === "return" ? { ...b, trangThai: den, guiBoi: null, guiLuc: null, lyDoTraLai: lyDo.trim() }
      /* Mở điều chỉnh xóa dấu vết gửi của vòng trước để vòng mới bắt đầu sạch,
         nhưng GIỮ `soBanDaDuyet` — đó là thứ cho biết bản đang làm sẽ thay thế
         một bản đã trình, không phải bản đầu tiên. */
      : { ...b, trangThai: den, guiBoi: null, guiLuc: null, lyDoTraLai: null, lyDoDieuChinh: lyDo.trim() };

    setKho({ ...current.current, [khoa]: next });
    return true;
  }, [user]);

  const gia = useMemo(() => ({
    layBanGhi: (khoa: string) => kho[khoa] ?? RONG,
    duoc: (khoa: string, action: ApprovalAction) => {
      const b = kho[khoa] ?? RONG;
      return canChangeApproval(user, khoa, { status: b.trangThai, guiBoi: b.guiBoi }, action);
    },
    guiRaSoat: (khoa: string) => sua(khoa, "send"),
    duyet: (khoa: string) => sua(khoa, "approve"),
    traLai: (khoa: string, lyDo: string) => sua(khoa, "return", lyDo),
    moDieuChinh: (khoa: string, lyDo: string) => sua(khoa, "amend", lyDo),
  }), [kho, sua, user]);

  return <Ngu.Provider value={gia}>{children}</Ngu.Provider>;
}

export function useDuyet() {
  const gia = useContext(Ngu);
  if (!gia) throw new Error("useDuyet phải nằm trong DuyetProvider.");
  return gia;
}
