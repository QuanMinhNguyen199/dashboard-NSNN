import { createContext, useContext, type ReactNode } from "react";
import { useThamSo } from "@/state/diaChi";
import type { ViewId } from "@/domain/types";

/*
  Cụm mục của một phân hệ, đặt trong thanh bên ngay dưới tên phân hệ.

  ── Vì sao có THÊM một tầng ─────────────────────────────────────────────────

  QL1 và QL3 mỗi phòng một bộ báo cáo, một loại kỳ, nên bảy mục xếp phẳng là
  đủ. QL2 có SÁU báo cáo độc lập và QL4 có HAI, mỗi báo cáo một nhịp riêng
  (`design_ql2ql4` §1.1) — xếp phẳng thì "Hệ số K – Báo cáo" và "Tổng hợp
  01GTGT" nằm cạnh nhau như hai tab ngang hàng, trong khi chúng thuộc hai báo
  cáo khác kỳ, khác vòng duyệt, chốt số độc lập.

  G13 gọi tầng này là "tầng chọn báo cáo". Nó KHÔNG thành một thanh tab ngang
  thứ hai trên trang: thanh bên đã là nơi người dùng tìm mục, và thêm một hàng
  tab nữa trên trang là hai nơi điều hướng cho cùng một việc.

  Mục chung của phòng — Tổng quan, Dữ liệu gốc — nằm ở nhóm KHÔNG có nhãn, đầu
  và cuối cụm. Chúng không thuộc báo cáo nào: tổng quan đọc số của mọi báo cáo,
  còn dữ liệu gốc là đường vào nguồn chung.
*/

export type LoaiKy = "NGAY" | "TUAN" | "THANG" | "NAM" | "LUYKE";

export const NHAN_LOAI_KY: Record<LoaiKy, string> = {
  NGAY: "Ngày", TUAN: "Tuần", THANG: "Tháng", NAM: "Năm", LUYKE: "Lũy kế từ 01/01",
};

export interface MucPhanHe {
  id: string;
  nhan: string;
}

export interface NhomMuc {
  /** Mã báo cáo (QL2-01…). `null` = mục chung của phòng, không thuộc báo cáo nào. */
  baoCao: string | null;
  /** Nhãn nhóm trong thanh bên. `null` với nhóm chung — nhóm một tầng không cần tên. */
  nhan: string | null;
  /** Báo cáo chưa có mẫu từ phòng: màn dựng khung, bố cục cột còn đổi. */
  khung?: boolean;
  muc: readonly MucPhanHe[];
}

/*
  QL1 giữ nguyên bảy mục phẳng của bản trước — một nhóm không nhãn. Đổi nó
  thành có nhãn là đổi thiết kế một phân hệ đang chạy, không nằm trong phạm vi
  việc thêm QL2 và QL4.
*/
const QL1: readonly NhomMuc[] = [{
  baoCao: null, nhan: null, muc: [
    { id: "tongquan", nhan: "Tổng quan" },
    { id: "no", nhan: "So sánh nợ" },
    { id: "cc", nhan: "Kết quả cưỡng chế" },
    { id: "th", nhan: "Tạm hoãn xuất cảnh" },
    { id: "t06", nhan: "Tạm hoãn XC · trạng thái 06" },
    { id: "quytac", nhan: "Quy tắc và nguồn" },
    { id: "nguon", nhan: "Dữ liệu gốc" },
  ],
}];

/*
  QL3 cũng một nhóm phẳng như QL1: một báo cáo, một loại kỳ, bốn mục.

  Trước đây bốn mục này là một dải `Segmented` NẰM TRÊN TRANG, trong khi QL1
  đặt mục của mình trong thanh bên. Hai phân hệ cùng một hệ, cùng một loại
  việc, mà người dùng phải tìm mục ở hai chỗ khác nhau — và chuyển giữa hai
  phòng là phải học lại chỗ bấm. Dải trên trang còn ăn một dòng ngang quý
  đúng ở nơi bảng cần bề rộng nhất.
*/
const QL3: readonly NhomMuc[] = [{
  baoCao: null, nhan: null, muc: [
    { id: "tongquan", nhan: "Tổng quan" },
    { id: "doichieu", nhan: "Đối chiếu báo cáo" },
    { id: "nguon", nhan: "Dữ liệu gốc" },
  ],
}];

/* Thứ tự nhóm theo §4.2: hai báo cáo có mẫu đầy đủ trước, bốn báo cáo khung
   sau — người dùng gặp thứ dùng được hằng ngày trước thứ còn chờ mẫu. */
const QL2: readonly NhomMuc[] = [
  { baoCao: null, nhan: null, muc: [{ id: "tongquan", nhan: "Tổng quan" }] },
  { baoCao: "QL2-01", nhan: "QL2-01 · Chênh lệch TK – HĐĐT", muc: [
    { id: "th01", nhan: "Tổng hợp 01GTGT" },
    { id: "th0304", nhan: "Tổng hợp 03, 04GTGT" },
    { id: "dschenh", nhan: "DS NNT chênh lệch" },
  ] },
  { baoCao: "QL2-02", nhan: "QL2-02 · Cảnh báo hệ số K", muc: [
    { id: "kbc", nhan: "Hệ số K – Báo cáo" },
    { id: "kton", nhan: "Hệ số K – Lượt còn tồn" },
  ] },
  { baoCao: "QL2-04", nhan: "QL2-04 · Xác minh hóa đơn", khung: true, muc: [
    { id: "xm", nhan: "Xác minh hóa đơn" },
    { id: "xmqh", nhan: "XMHD tồn quá hạn" },
  ] },
  { baoCao: "QL2-03", nhan: "QL2-03 · Rủi ro TPR", khung: true, muc: [{ id: "tpr", nhan: "Rủi ro TPR" }] },
  { baoCao: "QL2-05", nhan: "QL2-05 · Cảnh báo rủi ro", khung: true, muc: [{ id: "cbrr", nhan: "Cảnh báo rủi ro" }] },
  { baoCao: "QL2-06", nhan: "QL2-06 · Gói rủi ro Công an", khung: true, muc: [{ id: "congan", nhan: "Gói rủi ro Công an" }] },
  { baoCao: null, nhan: null, muc: [{ id: "nguon", nhan: "Dữ liệu gốc" }] },
];

/* QL4 đảo thứ tự so với §5.2: tổng đài đứng TRƯỚC hoàn thuế trong cụm, vì nó
   ra số hằng ngày và có hạn vài giờ (G18), còn hoàn thuế chạy theo tuần. §5.3
   cũng đặt khối tổng đài lên trên ở tab Tổng quan với đúng lý do ấy. */
const QL4: readonly NhomMuc[] = [
  { baoCao: null, nhan: null, muc: [{ id: "tongquan", nhan: "Tổng quan" }] },
  { baoCao: "QL4-02", nhan: "QL4-02 · Tổng đài hỗ trợ NNT", muc: [
    { id: "goi", nhan: "Cuộc gọi" },
    { id: "phieu", nhan: "Phiếu ghi" },
    { id: "saihan", nhan: "Sai hạn" },
    { id: "dsphieu", nhan: "Danh sách phiếu" },
  ] },
  { baoCao: "QL4-01", nhan: "QL4-01 · Hoàn thuế TNCN", muc: [
    { id: "tuan", nhan: "Báo cáo tuần chuẩn" },
    { id: "dxtcs", nhan: "Đang xử lý – Thuế cơ sở" },
    { id: "dxvp", nhan: "Đang xử lý – Văn phòng" },
    { id: "venh", nhan: "Hồ sơ vênh 1.5.1 – 6.29.1" },
    { id: "diem", nhan: "Chấm điểm" },
  ] },
  { baoCao: null, nhan: null, muc: [{ id: "nguon", nhan: "Dữ liệu gốc" }] },
];

/*
  Tình trạng dữ liệu KHÔNG có cụm mục, và đó là theo tài liệu chứ không phải
  bỏ sót.

  `design_ql1ql3:58` gọi đích danh MỘT màn trong khung chung, và không chỗ nào
  trong hai bản thiết kế liệt kê tab con cho nó — §4.2 và §5.2 chỉ liệt kê tab
  cho các phân hệ. Có lúc đã dựng hai mục "Tổng quan" và "Nhật ký thu thập" ở
  đây cho cụm trong thanh bên khỏi trống; đó là chữa cái trống chứ không phải
  theo tài liệu, nên đã gỡ. Toàn bộ nội dung nằm trên một màn.
*/
export const CUM_MUC: Partial<Record<ViewId, readonly NhomMuc[]>> = { debt: QL1, hoadon: QL2, risk: QL3, hoan: QL4 };

/* Nhãn trợ năng của cụm phải NÓI RÕ PHÂN HỆ. Một nhãn chung "Mục của phân hệ"
   nghe thì gọn, nhưng người dùng trình đọc màn hình nhảy giữa các vùng sẽ
   nghe đúng một câu ấy ở mọi màn và không biết mình đang ở phân hệ nào. */
export const NHAN_CUM: Partial<Record<ViewId, string>> = {
  debt: "Mục của báo cáo nợ",
  hoadon: "Mục của rủi ro hóa đơn",
  risk: "Mục của báo cáo kiểm tra tại bàn",
  hoan: "Mục của hoàn thuế TNCN và tổng đài",
};

const phang = (view: ViewId) => (CUM_MUC[view] ?? []).flatMap((n) => n.muc);

/** Mã báo cáo chứa mục này, hoặc `null` nếu nó là mục chung của phòng. */
export const baoCaoCuaMuc = (view: ViewId, muc: string) =>
  (CUM_MUC[view] ?? []).find((n) => n.muc.some((m) => m.id === muc))?.baoCao ?? null;

export const nhomCuaMuc = (view: ViewId, muc: string) =>
  (CUM_MUC[view] ?? []).find((n) => n.muc.some((m) => m.id === muc)) ?? null;

interface GiaTri {
  muc: string;
  datMuc: (muc: string) => void;
}

const Ngu = createContext<GiaTri | null>(null);

/*
  Provider PHẢI được dựng lại khi đổi màn (`key={view}` ở nơi gọi).

  `useThamSo` đọc địa chỉ đúng một lần lúc dựng và lọc theo danh sách mã hợp
  lệ của màn ấy. Giữ nguyên instance qua hai màn thì mục `th01` của QL2 còn
  sống khi đã sang QL4, và nó không có trong danh sách hợp lệ nào cả.
*/
export function MucPhanHeProvider({ view, children }: { view: ViewId; children: ReactNode }) {
  const ds = phang(view);
  const [muc, datMuc] = useThamSo<string>("muc", ds[0]?.id ?? "tongquan", ds.map((m) => m.id));
  return <Ngu.Provider value={{ muc, datMuc }}>{children}</Ngu.Provider>;
}

export function useMucPhanHe() {
  const gia = useContext(Ngu);
  if (!gia) throw new Error("MucPhanHeProvider is missing.");
  return gia;
}

export function MucSidebar({ view, visible, onNavigate }: { view: ViewId; visible: boolean; onNavigate: () => void }) {
  const { muc, datMuc } = useMucPhanHe();
  const cum = CUM_MUC[view];
  if (!visible || !cum) return null;

  return <div className="ql1-nav-items" role="group" aria-label={NHAN_CUM[view] ?? "Mục của phân hệ"}>
    {cum.map((nhom, i) => <div key={nhom.baoCao ?? `chung-${i}`} className="muc-nhom">
      {nhom.nhan && <span className="muc-nhom-nhan">
        {nhom.nhan}
        {/* Nhãn "Khung" nói thẳng bố cục còn đổi, thay vì để người dùng tự
            phát hiện qua một bảng trống không giải thích. */}
        {nhom.khung && <em>Khung</em>}
      </span>}
      {nhom.muc.map((m) => <button
        key={m.id}
        type="button"
        className={`ql1-nav-item${muc === m.id ? " is-active" : ""}`}
        aria-current={muc === m.id ? "page" : undefined}
        onClick={() => { datMuc(m.id); onNavigate(); }}
      >{m.nhan}</button>)}
    </div>)}
  </div>;
}
