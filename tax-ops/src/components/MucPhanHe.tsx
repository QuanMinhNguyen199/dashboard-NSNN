import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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

export type LoaiKy = "NGAY" | "TUAN" | "THANG" | "NAM" | "LUYKE" | "TUYCHON";

export const NHAN_LOAI_KY: Record<LoaiKy, string> = {
  TUYCHON: "Tùy chọn", NGAY: "Ngày", TUAN: "Tuần", THANG: "Tháng", NAM: "Năm", LUYKE: "Lũy kế từ 01/01",
};

export interface MucPhanHe {
  id: string;
  nhan: string;
}

export interface NhomMuc {
  /** Mã báo cáo (QL2-01…). `null` = mục chung của phòng, không thuộc báo cáo nào. */
  baoCao: string | null;
  /**
   * Nhãn nhóm trong thanh bên — CHỈ TÊN CHỦ ĐỀ, không mang mã báo cáo.
   *
   * Mã `QL2-01` là mã nội bộ của bảng phân công báo cáo; nó có ích khi đối
   * chiếu với tài liệu, không có ích khi tìm đường trên thanh bên. Mã vẫn
   * nằm ở `baoCao` và vẫn hiện trên tiêu đề kỳ của thanh duyệt.
   *
   * `null` với nhóm chung — nhóm một tầng không cần tên.
   */
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
/*
  QL1 tách theo BÁO CÁO như QL2 và QL4, không còn một cụm phẳng bảy mục.

  Bản trước gộp cả phòng vào một nhóm vì nó dựng từ `design_ql1ql3`, tài liệu
  mô hình hóa QL1 là MỘT báo cáo mười một tab. `SPec/QLDN1` (bản mới) thì
  giao sáu báo cáo riêng, mỗi cái một kỳ và một đầu mối. Ba trong số đó đã
  dựng, và gộp chúng vào một vòng duyệt nghĩa là bấm "Gửi duyệt" một lần là
  gửi cả ba — dù chúng khác hạn.

  Tên mục lấy theo tên BÁO CÁO trong `SPec/QLDN1`, bỏ mã như mọi phân hệ khác.
  Hai mục con của RS-QL1-04 lấy tên theo điều phân biệt chúng ("trên ngưỡng
  nợ" với "trạng thái 06"), vì để một con trùng tên cha là lặp một chữ hai
  lần liền nhau — xem The Report Is The Tab Rule.

  Ba báo cáo còn thiếu so với spec (RS-QL1-02 Thu hồi nợ đọng, RS-QL1-05 Cảnh
  báo phân loại nợ, RS-QL1-06 TTHC về nợ) CHƯA dựng; đây mới là sửa mô hình
  của phần đã có.
*/
const QL1: readonly NhomMuc[] = [
  { baoCao: null, nhan: null, muc: [{ id: "tongquan", nhan: "Tổng quan" }] },
  { baoCao: "QL1-01", nhan: "Đánh giá nợ", muc: [{ id: "no", nhan: "So sánh nợ" }] },
  { baoCao: "QL1-03", nhan: "Đánh giá kết quả cưỡng chế", muc: [{ id: "cc", nhan: "Kết quả cưỡng chế" }] },
  { baoCao: "QL1-04", nhan: "Tạm hoãn xuất cảnh", muc: [
    { id: "th", nhan: "Trên ngưỡng nợ" },
    { id: "t06", nhan: "Trạng thái 06" },
  ] },
];

/*
  QL3 cũng một nhóm phẳng như QL1: một báo cáo, một loại kỳ, bốn mục.

  Trước đây bốn mục này là một dải `Segmented` NẰM TRÊN TRANG, trong khi QL1
  đặt mục của mình trong thanh bên. Hai phân hệ cùng một hệ, cùng một loại
  việc, mà người dùng phải tìm mục ở hai chỗ khác nhau — và chuyển giữa hai
  phòng là phải học lại chỗ bấm. Dải trên trang còn ăn một dòng ngang quý
  đúng ở nơi bảng cần bề rộng nhất.
*/
/*
  QL3 bỏ mục "Dữ liệu gốc", thay bằng "Danh sách NNT".

  Dữ liệu gốc liệt kê các nguồn kéo về — TTR, danh bạ, kế hoạch năm — tức thứ
  người VẬN HÀNH cần khi một lượt kéo hỏng. Vai ấy đã có màn riêng (Giám sát
  dữ liệu), còn cán bộ QL3 vào đây để làm nghiệp vụ.

  Thứ họ làm việc trên đó cả tháng là bảng KTTB_THEO_DN: `SPec/QLDN3` §4.1
  bước 2 đặt nó làm lớp giữa, và MỌI ô của mẫu báo cáo đều là một phép đếm
  hoặc phép cộng trên bảng ấy. Mục G3 "bấm số → xem chi tiết" cũng không có
  đích nào để tới nếu danh sách không có mặt trên màn.

  Danh sách đứng NGAY SAU Tổng quan, trước Đối chiếu: thứ tự đọc là tổng →
  chi tiết → đối chiếu với bản thủ công, đúng trình tự một kỳ làm việc.
*/
const QL3: readonly NhomMuc[] = [
  { baoCao: null, nhan: null, muc: [
    { id: "tongquan", nhan: "Tổng quan" },
    { id: "dsnnt", nhan: "Danh sách NNT" },
    /* Đối chiếu bằng tay là việc của giai đoạn chuyển đổi và không nằm
       trong bộ chỉ tiêu nào của mẫu. KPI đăng ký thì là CỘT (7) của mẫu, và
       §6 xếp "nhập KPI" vào nhóm vẫn thủ công sau khi có hệ thống — tức nó
       phải có màn riêng chứ không chờ nguồn nào kéo về. */
    { id: "kpi", nhan: "KPI đăng ký" },
  ] },
  /* "Kết quả tổng hợp" từng là một mục THANH BÊN riêng của QL3, tức phòng QL3
     có hai mục cấp ngoài trong khi ba phòng kia có một. Nó là một báo cáo của
     chính phòng ấy, nên nó về đúng chỗ của một báo cáo: một tab. */
  { baoCao: "QL3-TH", nhan: "Kết quả tổng hợp", muc: [{ id: "ketqua", nhan: "Kết quả tổng hợp" }] },
];

/* Thứ tự nhóm theo §4.2: hai báo cáo có mẫu đầy đủ trước, bốn báo cáo khung
   sau — người dùng gặp thứ dùng được hằng ngày trước thứ còn chờ mẫu. */
const QL2: readonly NhomMuc[] = [
  { baoCao: null, nhan: null, muc: [{ id: "tongquan", nhan: "Tổng quan" }] },
  { baoCao: "QL2-01", nhan: "Chênh lệch TK – HĐĐT", muc: [
    { id: "th01", nhan: "Tổng hợp 01GTGT" },
    { id: "th0304", nhan: "Tổng hợp 03, 04GTGT" },
    { id: "dschenh", nhan: "DS NNT chênh lệch" },
  ] },
  { baoCao: "QL2-02", nhan: "Cảnh báo hệ số K", muc: [
    { id: "kbc", nhan: "Hệ số K – Báo cáo" },
    { id: "kton", nhan: "Hệ số K – Lượt còn tồn" },
  ] },
  { baoCao: "QL2-04", nhan: "Xác minh hóa đơn", muc: [
    /* §4.2 gọi tab 6 đúng bằng tên báo cáo ("Xác minh hóa đơn"). Khi báo cáo
       lên làm mục cha thì cái tên ấy lặp lại ngay dưới chính nó, nên tab 6
       lấy tên theo NỘI DUNG của nó — §4.2 mô tả là bảng mẫu TCS 1–25 và
       Phòng QLDN 1–5 theo trạng thái — và nó thành song song với cách đặt tên
       của QL2-01 ngay trên. */
    { id: "xm", nhan: "Tổng hợp theo đơn vị" },
    { id: "xmqh", nhan: "Hóa đơn còn tồn" },
  ] },
  { baoCao: "QL2-03", nhan: "Rủi ro TPR", muc: [{ id: "tpr", nhan: "Rủi ro TPR" }] },
  { baoCao: "QL2-05", nhan: "Cảnh báo rủi ro", khung: true, muc: [{ id: "cbrr", nhan: "Cảnh báo rủi ro" }] },
  { baoCao: "QL2-06", nhan: "Gói rủi ro Công an", muc: [{ id: "congan", nhan: "Gói rủi ro Công an" }] },
];

/* QL4 đảo thứ tự so với §5.2: tổng đài đứng TRƯỚC hoàn thuế trong cụm, vì nó
   ra số hằng ngày và có hạn vài giờ (G18), còn hoàn thuế chạy theo tuần. §5.3
   cũng đặt khối tổng đài lên trên ở tab Tổng quan với đúng lý do ấy. */
const QL4: readonly NhomMuc[] = [
  { baoCao: null, nhan: null, muc: [{ id: "tongquan", nhan: "Tổng quan" }] },
  { baoCao: "QL4-02", nhan: "Tổng đài hỗ trợ NNT", muc: [
    { id: "goi", nhan: "Cuộc gọi" },
    { id: "phieu", nhan: "Phiếu ghi" },
    { id: "saihan", nhan: "Sai hạn" },
    { id: "dsphieu", nhan: "Danh sách phiếu" },
  ] },
  { baoCao: "QL4-01", nhan: "Hoàn thuế TNCN", muc: [
    { id: "tuan", nhan: "Báo cáo tuần chuẩn" },
    { id: "dxtcs", nhan: "Đang xử lý – Thuế cơ sở" },
    { id: "dxvp", nhan: "Đang xử lý – Văn phòng" },
    { id: "venh", nhan: "Hồ sơ vênh 1.5.1 – 6.29.1" },
    { id: "diem", nhan: "Chấm điểm" },
  ] },
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

/*
  ── THANH MỤC: hai hàng tab trên nội dung ───────────────────────────────────

  Trước ngày 09/10/2026 mục của phân hệ nằm trong THANH BÊN, và mỗi báo cáo là
  một mục cấp ngoài của thanh ấy. Tài liệu thiết kế đổi: bốn phòng không chia
  nhỏ trên thanh bên nữa, mỗi phòng là MỘT mục, còn báo cáo và mục con quay về
  nằm trên nội dung như bản dựng đầu tiên.

  Hai hàng, không một:

  • Hàng trên là BÁO CÁO. Nó là thứ quyết định danh mục kỳ, khóa duyệt và bộ
    sheet xuất ra — ba thứ đổi cùng lúc khi người dùng bấm sang báo cáo khác,
    nên nó phải là một chiều riêng chứ không trộn chung một danh sách phẳng.
  • Hàng dưới là MỤC của báo cáo đang mở, và chỉ dựng khi báo cáo ấy có từ hai
    mục. Một hàng tab luôn đúng một nút là một hàng không bấm được gì.

  Mục chung của phòng (Tổng quan) không thuộc báo cáo nào: nó là một tab hàng
  trên, không có hàng dưới.
*/
export function ThanhMuc({ view }: { view: ViewId }) {
  const { muc, datMuc } = useMucPhanHe();
  const nhom = CUM_MUC[view] ?? [];
  const dangNhom = nhom.find((n) => n.muc.some((m) => m.id === muc)) ?? nhom[0];
  const laLa = (dangNhom?.muc.length ?? 0) === 1;

  if (nhom.length === 0) return null;

  return <nav className="thanh-muc" aria-label={NHAN_CUM[view] ?? "Mục của phân hệ"}>
    <HangTab lop="thanh-muc-hang" khoaMo={dangNhom?.baoCao ?? dangNhom?.muc[0].id ?? ""}>
      {nhom.map((n, i) => {
        const mo = n === dangNhom;
        return <button
          key={n.baoCao ?? `chung-${i}`}
          type="button"
          className={`muc-tab${mo ? " is-active" : ""}`}
          data-mo={mo ? "1" : undefined}
          /* Tab báo cáo mang `aria-current="page"` CHỈ KHI nó không có hàng
             con: có con thì trang hiện tại là mục con, và hai nút cùng khai
             "page" thì trình đọc màn hình đọc ra hai trang đang mở. */
          aria-current={mo && n.muc.length === 1 ? "page" : undefined}
          onClick={() => datMuc(n.muc[0].id)}
        >
          <span>{n.nhan ?? n.muc[0].nhan}</span>
          {/*
            Nhãn "Khung" là một LỜI CẢNH BÁO — báo cáo chưa có mẫu từ phòng —
            nên nó mang màu chữ phụ, không mang xanh thương hiệu. Xanh ở hàng
            này đã có nghĩa "đang mở"; cho một cảnh báo mượn đúng màu ấy là
            bắt người đọc phân biệt hai thứ bằng vị trí.
          */}
          {n.khung && <em className="nav-khung">Khung</em>}
        </button>;
      })}
    </HangTab>

    {!laLa && <HangTab lop="thanh-muc-hang is-con" khoaMo={muc}>
      {dangNhom.muc.map((m) => <button
        key={m.id}
        type="button"
        className={`muc-tab-con${muc === m.id ? " is-active" : ""}`}
        data-mo={muc === m.id ? "1" : undefined}
        aria-current={muc === m.id ? "page" : undefined}
        onClick={() => datMuc(m.id)}
      >{m.nhan}</button>)}
    </HangTab>}
  </nav>;
}

/*
  Một hàng tab cuộn được, KHÔNG có thanh cuộn.

  Thanh cuộn ngang của một hàng tab cao 36px là một vật thể lạ: trên Windows nó
  vẽ hẳn một rãnh cộng hai mũi tên, chiếm đúng chỗ của tab cuối và hiện ngay cả
  khi không có gì để cuộn — `scrollbar-width: thin` vẫn chừa một pixel rãnh ở
  mọi khổ, đo được.

  Gỡ nó thì mất tín hiệu "còn tab bên phải", nên hai thứ thay vào, và cả hai
  bám PHÉP ĐO thật chứ không bám điểm ngắt:

  • Vệt mờ ở mép nào CÒN nội dung bên ngoài. Ở 390px hàng báo cáo của QL2 tràn
    562px — hơn một màn rưỡi — nên đây không phải lo xa.
  • Tab đang mở tự cuộn vào tầm nhìn khi đổi mục. Không có nó thì mở một báo
    cáo ở cuối hàng xong, hàng vẫn đứng ở đầu và không gì sáng trong tầm mắt.
*/
function HangTab({ children, lop, khoaMo }: { children: ReactNode; lop: string; khoaMo: string }) {
  const vung = useRef<HTMLDivElement>(null);
  const [mep, datMep] = useState<"khong" | "phai" | "trai" | "hai">("khong");

  useEffect(() => {
    const el = vung.current;
    if (!el) return;
    const do_ = () => {
      const du = el.scrollWidth - el.clientWidth;
      if (du <= 1) return datMep("khong");
      const traiCon = el.scrollLeft > 1;
      const phaiCon = el.scrollLeft < du - 1;
      datMep(traiCon && phaiCon ? "hai" : traiCon ? "trai" : "phai");
    };
    do_();
    const theoDoi = new ResizeObserver(do_);
    theoDoi.observe(el);
    for (const con of Array.from(el.children)) theoDoi.observe(con);
    el.addEventListener("scroll", do_, { passive: true });
    return () => { theoDoi.disconnect(); el.removeEventListener("scroll", do_); };
  }, [children]);

  /* Cuộn tab đang mở vào tầm nhìn — chỉ khi hàng thật sự tràn, để một hàng vừa
     khung không bị giật một khung hình vì không lý do gì. */
  useEffect(() => {
    const el = vung.current;
    const nut = el?.querySelector<HTMLElement>("[data-mo]");
    if (!el || !nut || el.scrollWidth - el.clientWidth <= 1) return;
    nut.scrollIntoView({ inline: "nearest", block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [khoaMo]);

  return <div ref={vung} className={lop} data-mep={mep}>{children}</div>;
}
