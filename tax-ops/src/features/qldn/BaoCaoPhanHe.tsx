import type { DemoUser } from "@/auth/demoAuth";
import { NhungProvider } from "@/components/ui";
import { MucPhanHeProvider } from "@/components/MucPhanHe";
import { DebtQL1, HoaDonQL2, HoanQL4, RiskQL3 } from "@/features/phanHeLazy";
import type { ViewId } from "@/domain/types";
import { donViCuaPhong, type TheId } from "@/data/qldn";
import { PhongBaoCaoProvider } from "@/state/DuyetContext";
import { KhoaDonVi } from "@/components/BoLoc";

/*
  Báo cáo của bốn phân hệ cũ, NHÚNG vào nhóm chỉ tiêu (chốt 13/10/2026).

  Biên bản yêu cầu khối QLDN không còn phân hệ theo phòng: "không chia theo
  kiểu phòng 1 làm nợ, phòng 3 làm kiểm tra". Báo cáo của QL1–QL4 vì thế đi
  theo CHỈ TIÊU nó đo, không theo phòng làm nó. Mỗi nhóm nhỏ có công tắc
  "Kết quả | Báo cáo"; báo cáo giữ nguyên toàn bộ luồng của phân hệ — gửi
  duyệt, chốt số, xuất Excel/Word, mục con — vì đó là việc đã được nghiệm thu,
  chỉ đổi chỗ đứng.

  Ghép theo nội dung báo cáo (người dùng xác nhận 13/10/2026):
  • Tổng đài hỗ trợ NNT (QL4-02) từng ở Thủ tục hành chính; từ 28/10/2026 nó
    là nhóm riêng, đúng cách chia tab phía Thuế.
  • Báo cáo hóa đơn QL2 tách theo tab của Quản lý hóa đơn (28/10/2026):
    QL2-03, 05, 06 (rủi ro) ở Rà soát TPR; QL2-04 ở Xác minh hóa đơn; QL2-02
    ở Hệ số K; QL2-01 (chênh lệch tờ khai – HĐĐT) ở Chênh lệch tờ khai.
  • Tab "Tổng quan" riêng của từng phân hệ BỎ: màn tổng quan chung đã thay.
*/
export interface BaoCaoNhung { phanHe: Extract<ViewId, "debt" | "hoadon" | "risk" | "hoan">; muc: readonly string[]; nhan: string }

export const BAO_CAO_CUA_THE: Partial<Record<TheId, BaoCaoNhung>> = {
  no: { phanHe: "debt", muc: ["no"], nhan: "Đánh giá nợ" },
  cc: { phanHe: "debt", muc: ["cc"], nhan: "Đánh giá kết quả cưỡng chế" },
  thxc: { phanHe: "debt", muc: ["th", "t06"], nhan: "Tạm hoãn xuất cảnh" },
  tongdai: { phanHe: "hoan", muc: ["goi", "phieu", "saihan", "dsphieu"], nhan: "Tổng đài hỗ trợ NNT" },
  tpr: { phanHe: "hoadon", muc: ["tpr", "cbrr", "congan"], nhan: "Rủi ro TPR" },
  xmhd: { phanHe: "hoadon", muc: ["xm", "xmqh"], nhan: "Xác minh hóa đơn" },
  cltk: { phanHe: "hoadon", muc: ["th01", "th0304", "dschenh"], nhan: "Chênh lệch TK – HĐĐT" },
  k: { phanHe: "hoadon", muc: ["kbc", "kton"], nhan: "Cảnh báo hệ số K" },
  kttb: { phanHe: "risk", muc: ["dsnnt", "kpi", "ketqua"], nhan: "Báo cáo kiểm tra tại bàn" },
  hoan: { phanHe: "hoan", muc: ["tuan", "dxtcs", "dxvp", "venh", "diem"], nhan: "Hoàn thuế TNCN" },
};

/** Vai được mở báo cáo nhúng: báo cáo phân hệ chỉ có luồng cho chuyên viên và trưởng phòng. */
export const coBaoCao = (user: DemoUser) => user.vaiTro === "CV" || user.vaiTro === "TP";

export function BaoCaoPhanHe({ bc, user, donViId, muc, datMuc }: { bc: BaoCaoNhung; user: DemoUser; donViId?: string; muc: string; datMuc: (muc: string) => void }) {
  /* Năm phòng làm cùng việc, khác số liệu: báo cáo nhúng khóa đơn vị theo
     phòng đang xem (mã P1…P5) — mặc định phòng của người xem, hoặc phòng
     trưởng phòng chọn ở ô Phạm vi — và khóa duyệt theo phòng CỦA BẢN báo cáo:
     phòng khác thì chỉ xem. Xem `KhoaDonVi`, `PhongBaoCaoProvider`. */
  const cuaToi = donViCuaPhong(user.phong)?.id ?? null;
  const id = donViId ?? cuaToi;
  return <NhungProvider><PhongBaoCaoProvider phong={id ? (`QL${id.slice(1)}` as DemoUser["phong"]) : user.phong}><KhoaDonVi id={id} cuaToi={id === cuaToi}>
    <MucPhanHeProvider key={`${bc.phanHe}-${bc.muc.join(",")}`} view={bc.phanHe} choPhep={bc.muc} dieuKhien={{ muc, datMuc }}>
      {bc.phanHe === "debt" && <DebtQL1 actor={user.name}/>}
      {bc.phanHe === "hoadon" && <HoaDonQL2 actor={user.name} vaiTro={user.vaiTro}/>}
      {bc.phanHe === "risk" && <RiskQL3 actor={user.name} vaiTro={user.vaiTro}/>}
      {bc.phanHe === "hoan" && <HoanQL4 actor={user.name} vaiTro={user.vaiTro}/>}
    </MucPhanHeProvider>
  </KhoaDonVi></PhongBaoCaoProvider></NhungProvider>;
}
