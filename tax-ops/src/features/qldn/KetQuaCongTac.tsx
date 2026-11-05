import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button as AriaButton, Disclosure, DisclosurePanel } from "react-aria-components";
import { XepHangCanBo } from "@/features/qldn/XepHangCanBo";
import { NNTCanBo } from "@/features/qldn/NNTCanBo";
import { CaseLayout } from "@/components/CaseLayout";
import { soNNTCanBo } from "@/data/hoSoQLDN";
import { DIEM_QLDN, KY_XEP_HANG, NHOM_DIEM, PHONG_XEP, type NhomDiem } from "@/data/xepHangQLDN";
import { congThucNgan, congThucSTT, ketQuaGoc, tenSTT, tieuChiCuaThe } from "@/data/tieuChiQLDN";
import { Icon, integer, NhomNut, PageIntro, Pager, Panel, TableWrap } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import type { DemoUser } from "@/auth/demoAuth";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportSheet, ReportValue } from "@/domain/reportExport";
import { datThamSo, useThamSo } from "@/state/diaChi";
import {
  CHI_TIEU_Q, DON_VI_Q, KY_Q, canBoCua, NHAN_KHOI, NHAN_NHIP, NHOM_Q, THE_Q, capCua, chiTieuCuaThe, duocXem, ketQuaChiTieu,
  congThucCua, nhanPhamVi, nhomCuaThe, theoCanBo, theoDonVi, tyLeCua, uocThu, xepHang,
  type Cap, type ChiTieuQ, type KetQuaChiTieu, type Khoi, type KyQ, type NhipUoc, type NhomId, type PhamVi, type TheId,
} from "@/data/qldn";
import { NgoaiPhamVi, NutThuGon, PhuVai, ThanhPhamVi, useDatXemPhong, usePhamVi } from "@/features/qldn/PhamViQLDN";
import { HangTab, mucNhung } from "@/components/MucPhanHe";
import { ODatBoLoc } from "@/components/BoLoc";
import { BAO_CAO_CUA_THE, BaoCaoPhanHe, coBaoCao } from "@/features/qldn/BaoCaoPhanHe";
import { KiemTraTruSo, OSoLieuKT } from "@/features/qldn/KiemTraTruSo";
import { CuocKiemTra, DoiSoatKT } from "@/features/qldn/PhongKiemTra";
import { HoanGTGT, OHanHoan } from "@/features/qldn/HoanGTGT";
import { DongMSTDonVi, NopThua, ToKhaiTonTruc, XuPhatDonVi } from "@/features/qldn/QuanLyKeKhai";
import { NHAN_NGAY_KEO_TK } from "@/data/ql5";
import { ChenhLechTK, kyQL2Cua } from "@/features/qldn/ChenhLechTK";
import { KY_QL2_01 } from "@/data/ql2";

/*
  Mô-đun 2 — Quản trị công việc và kết quả thực hiện (biên bản 09/10/2026 §6).

  "Tổng quan và chi tiết tách riêng. Hai tab khác nhau, không chung một trang.
  Từ tổng quan, click vào chỉ tiêu để mở tab chi tiết tương ứng." (§2.2)

  Hàng tab là Tổng quan + BỐN NHÓM LỚN của file chấm điểm (chốt 12/10/2026).
  Bản trước có một tab cho mỗi thẻ — mười hai tab, đọc như một danh sách phẳng
  không thứ bậc, trong khi file Excel người dùng đang quen chia nhóm nhỏ bên
  trong nhóm lớn. Nhóm nhỏ nay là hàng tab con của nhóm lớn đang mở; thẻ ở
  tổng quan mở đúng nhóm lớn VÀ chọn sẵn nhóm nhỏ của nó.

  Mỗi thẻ hiện: số tuyệt đối; tỷ lệ so số giao (từ cấp phòng); chênh lệch so
  bình quân chung toàn thuế; tăng/giảm so cùng kỳ năm trước và tháng trước.
  Cán bộ chỉ có số tuyệt đối (§4), nên so sánh của cán bộ là CHÊNH LỆCH SỐ
  TUYỆT ĐỐI, không phải điểm phần trăm.

  Thang điểm cộng/trừ của file chấm điểm KHÔNG còn ở đây: biên bản yêu cầu
  không nhắc tới điểm, và xếp hạng theo tỷ lệ (§6, chờ chốt).
*/

const THE_HOP_LE: TheId[] = THE_Q.map((t) => t.id);

/* ---------- Định dạng ---------- */

const so = (x: number, dvt: string) => dvt === "tỷ đồng"
  ? x.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  : integer(Math.round(x));
const NGUONG = 0.0005;
/* Tỷ lệ làm tròn ra 0,0% thì in "0,0%" trơn — "−0,0%" là một dấu không có thật. */
const pt = (x: number | null, dau = false) => x === null ? "—"
  : Math.abs(x) < NGUONG ? "0,0%"
  : `${x < 0 ? "−" : dau && x > 0 ? "+" : ""}${(Math.abs(x) * 100).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
/* Chênh lệch dưới 0,05 điểm phần trăm làm tròn ra "0,0": nó là NGANG mốc,
   không được mang dấu hay màu — "−0,0 đpt" tô đỏ là báo một tin xấu không có. */
const dpt = (d: number) => Math.abs(d) < NGUONG ? "0,0 đpt"
  : `${d < 0 ? "−" : "+"}${(Math.abs(d) * 100).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} đpt`;
const chenhSo = (d: number, dvt: string) => so(Math.abs(d), dvt).replace(/[0,.]/g, "") === "" ? so(0, dvt) : `${d < 0 ? "−" : "+"}${so(Math.abs(d), dvt)}`;
/* Viết thường chữ đầu, trừ chữ viết tắt ("NNT", "TTHC") — viết thường cả
   cụm thì ra "nnt phải cưỡng chế". */
const thuong = (s: string) => /^[A-ZĐ]{2,}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);

/* Tốt hay xấu đi theo CHIỀU của chỉ tiêu, không theo dấu: nợ tăng là dấu
   cộng nhưng là tin xấu. */
const tot = (ct: ChiTieuQ, d: number) => Math.abs(d) < NGUONG ? null : ct.kieu === "CAO" ? d > 0 : d < 0;
const lopChenh = (ct: ChiTieuQ, d: number) => { const t = tot(ct, d); return t === null ? "qd-chenh" : t ? "qd-chenh is-tot" : "qd-chenh is-xau"; };
const nghiaChenh = (ct: ChiTieuQ, d: number) => { const t = tot(ct, d); return t === null ? "ngang mốc" : t ? "tốt hơn" : "kém hơn"; };

/*
  Một chênh lệch — tốt/xấu KHÔNG chỉ nằm ở màu (PRODUCT.md, WCAG 1.4.1). Chỉ
  tiêu "thấp là tốt" có dấu + là tin xấu, nên màu từng là nguồn nghĩa duy
  nhất. Nay: chênh lệch xấu mang thêm biểu tượng cảnh báo, và trình đọc màn
  hình nghe "tốt hơn / kém hơn / ngang mốc" ngay sau con số.
*/
function Chenh({ ct, d, children, title }: { ct: ChiTieuQ; d: number; children: ReactNode; title?: string }) {
  const t = tot(ct, d);
  return <span className={lopChenh(ct, d)} title={title}>
    {t !== null && <i className="qd-cham" aria-hidden="true"/>}{children}<span className="sr-only">, {nghiaChenh(ct, d)}</span>
  </span>;
}

/* ---------- So sánh ba mốc ---------- */

/* `dem` = mốc là một PHÉP ĐẾM, không phải chênh lệch (xem ô BQ toàn TP). */
interface MocSoSanh { nhan: string; ngan: string; viet: string; gia: string | null; chenh: number; ghi: string; dem?: boolean }

/** Ba mốc so sánh của §2.4, đã lọc theo quyền của vai. */
function mocCua(kq: KetQuaChiTieu, pv: PhamVi, ky: KyQ): MocSoSanh[] {
  const { ct } = kq;
  const coTyLe = duocXem(pv.vai, "tyLe");
  const ra: MocSoSanh[] = [];
  const tl = (c: Cap) => tyLeCua(ct, c) ?? 0;
  /*
    Lãnh đạo xem TOÀN THÀNH PHỐ thì phạm vi chính là bình quân: so với nó
    luôn ra +0,0 ở cả mười một ô — mốc quan trọng nhất thành vô nghĩa ngay
    khung nhìn đầu tiên. Ô BQ giữ nguyên vị trí (Fixed Slots Rule) nhưng đổi
    nội dung thành câu lãnh đạo thật sự hỏi: bao nhiêu đơn vị kém hơn bình quân.
  */
  if (duocXem(pv.vai, "binhQuan") && pv.vai === "LD" && pv.donVi.length === DON_VI_Q.length) {
    const bq = tl(kq.binhQuan);
    const kem = theoDonVi(ct, DON_VI_Q, ky.thang).filter((d) => tot(ct, tl(d.cap) - bq) === false).length;
    ra.push({ nhan: "Số đơn vị kém hơn bình quân toàn thuế", ngan: "Bình quân", viet: "BQ", gia: `${kem} trên ${DON_VI_Q.length} đơn vị`, chenh: 0, ghi: `${kem}/${DON_VI_Q.length}`, dem: true });
  } else if (duocXem(pv.vai, "binhQuan")) {
    const bq = tl(kq.binhQuan);
    ra.push({ nhan: "Bình quân toàn thuế", ngan: "Bình quân", viet: "BQ", gia: pt(bq, ct.kieu === "TANG"), chenh: tl(kq.nay) - bq, ghi: dpt(tl(kq.nay) - bq) });
  }
  const truoc = KY_Q.find((k) => k.thang === ky.thang - 1)?.nhan.split(" ·")[0] ?? `Tháng ${ky.thang - 1}/2026`;
  const tTruoc = truoc.replace("/2026", "");
  for (const [nhan, ngan, viet, c] of [[`Tháng trước (${truoc.replace("Tháng ", "T")})`, tTruoc, tTruoc.replace("Tháng ", "T"), kq.thangTruoc], ["Cùng kỳ 2025", "Cùng kỳ", "CK", kq.cungKy]] as const) {
    if (coTyLe) ra.push({ nhan, ngan, viet, gia: pt(tl(c), ct.kieu === "TANG"), chenh: tl(kq.nay) - tl(c), ghi: dpt(tl(kq.nay) - tl(c)) });
    else ra.push({ nhan, ngan, viet, gia: `${so(c.tu, ct.dvt)} ${ct.dvt}`, chenh: kq.nay.tu - c.tu, ghi: chenhSo(kq.nay.tu - c.tu, ct.dvt) });
  }
  return ra;
}

/* Thanh tỷ lệ với vạch bình quân. Chỉ tiêu "thấp là tốt" có tỷ lệ nhỏ, nên
   thang của nó co theo số lớn nhất để thanh không dẹt về 0. */
function ThanhTyLe({ ct, x, bq }: { ct: ChiTieuQ; x: number; bq: number | null }) {
  const tran = ct.kieu === "CAO" ? 1 : Math.max(x, bq ?? 0, 0.01) * 1.3;
  const w = (v: number) => `${Math.min(Math.max(v / tran, 0), 1) * 100}%`;
  /* Vạch là bình quân toàn thuế — nói bằng `title` khi rê chuột; quá 100% thì
     thanh mang vạch chặn ở đầu, không lặng lẽ cắt bằng 100%. */
  return <span className={`qd-thanh${x > tran ? " is-vuot" : ""}`} aria-hidden="true" title={bq !== null ? `Vạch: bình quân toàn thuế ${pt(bq, ct.kieu === "TANG")}` : undefined}>
    <i style={{ width: w(x) }}/>
    {bq !== null && <b style={{ left: w(bq) }}/>}
  </span>;
}

/* ---------- Màn ---------- */

/*
  Một component, hai kiểu màn (chốt 13/10/2026):
  • KHÔNG có `nhom` — màn "Tổng quan kết quả": mười một ô chỉ tiêu theo bốn
    nhóm. Bấm một ô mở màn của nhóm ấy trên thanh bên, chọn sẵn nhóm nhỏ.
  • CÓ `nhom` — một trong bốn nhóm lớn, giờ là mục THANH BÊN chứ không còn là
    tab trên trang. Hàng tab trên trang là các nhóm nhỏ; dưới nó là công tắc
    "Kết quả | Báo cáo" khi nhóm nhỏ có báo cáo phân hệ đi kèm.
*/
/*
  Màn tổng quan (đổi tên "Tổng quan quản trị" 22/10/2026) có hai tab: "Kết
  quả công tác" giữ nguyên nội dung cũ, "Xếp hạng" là điểm của năm phòng
  QLDN theo file chấm điểm BCGB tháng 10. Tab Xếp hạng chỉ có với vai được
  xem thứ hạng — cán bộ không thấy cả hàng tab (một hàng một nút là một hàng
  không bấm được gì).
*/
type Xem = "" | "baocao";
type TabTQ = "" | "xephang" | "canbo";
export function KetQuaCongTac({ user, nhom: nhomId, moNhom, moCanhBao }: {
  user: DemoUser;
  nhom?: NhomId;
  moNhom?: (nhom: NhomId, the: TheId, stt?: number) => void;
  moCanhBao?: (dvId: string) => void;
}) {
  const { pv, ky, datKy } = usePhamVi(user);
  const [theURL, datThe] = useThamSo<TheId | "">("nhom", "", ["", ...THE_HOP_LE]);
  /* Tham số `bc`, KHÔNG phải `xem`: các phân hệ đã dùng `xem` cho bản xem
     trước báo cáo và tự xoá nó khi dựng — dùng chung tên thì báo cáo nhúng
     xoá luôn trạng thái "đang mở Báo cáo", tải lại trang là rơi về Kết quả. */
  const [xem, datXem] = useThamSo<Xem>("bc", "", ["", "baocao"]);
  const [tabURL, datTab] = useThamSo<TabTQ>("tq", "", ["", "xephang", "canbo"]);
  /* Mục của báo cáo nhúng (`muc=`) nằm ở đây, không trong phân hệ: hàng
     "Chỉ tiêu | mục báo cáo…" là một hàng của nhóm (29/10/2026). */
  const [mucURL, datMucURL] = useThamSo<string>("muc", "");
  /* "Số liệu: tất cả các cuộc | đích danh" của tab Kiểm tra tại trụ sở NNT (Phòng kiểm tra) điều khiển
     CẢ xếp hạng lẫn bảng chi tiết, nên nó đứng trên thanh phạm vi và trạng thái
     sống ở đây — một điều khiển, một nguồn. */
  const [loaiKT, datLoaiKT] = useThamSo<"" | "dd">("loai", "", ["", "dd"]);
  /* Ô của thanh phạm vi, nơi thanh lọc báo cáo nhúng vẽ vào. */
  const [oLoc, datOLoc] = useState<HTMLDivElement | null>(null);
  const datXemPhong = useDatXemPhong();
  if (!pv) return <NgoaiPhamVi/>;

  const nhom = nhomId ? NHOM_Q.find((n) => n.id === nhomId)! : null;
  /* Nhóm nhỏ trong địa chỉ chỉ có nghĩa khi nó thuộc nhóm lớn đang mở. */
  const the = nhom ? (theURL && nhom.the.includes(theURL) ? theURL : nhom.the[0]) : null;
  /* Báo cáo là bản của MỘT PHÒNG (phòng gửi, phòng duyệt): có công tắc Báo
     cáo khi phạm vi đang xem là đúng một phòng QLDN — của mình, hoặc phòng
     khác (chỉ xem). Khối thuế cơ sở thì không có bản báo cáo phòng nào. */
  const motPhong = pv.donVi.length === 1 && pv.donVi[0].khoi === "VP";
  const bc = the && coBaoCao(user) && motPhong ? BAO_CAO_CUA_THE[the] ?? null : null;
  const moBaoCao = Boolean(bc && xem === "baocao");
  const dsMuc = bc ? mucNhung(bc.phanHe, bc.muc) : [];
  const muc = dsMuc.some((m) => m.id === mucURL) ? mucURL : dsMuc[0]?.id ?? "";
  const moMuc = (id: string) => { datMucURL(id === dsMuc[0]?.id ? "" : id); datXem("baocao"); };
  /* Chênh lệch tờ khai: dòng một phòng ở bảng tổng hợp mở Báo cáo › DS NNT
     chênh lệch của phòng ấy, ĐÚNG KỲ lũy kế của tháng đang xem — số trên dòng
     là số dòng người dùng sẽ thấy. Phòng khác thì đổi phạm vi (chỉ xem). */
  const moDSChenh = (dvId: string) => {
    const goc = (pv.phongGoc ?? pv.donVi[0]).id;
    if (dvId !== pv.donVi[0].id) datXemPhong(dvId === goc ? "" : dvId);
    const k = kyQL2Cua(ky).id;
    datThamSo({ ky: k === KY_QL2_01[0].id ? null : k });
    moMuc("dschenh");
  };
  const moThe = (t: TheId) => moNhom?.(nhomCuaThe(t).id, t);
  const coXepHang = !nhom && duocXem(pv.vai, "thuHang");
  const tab: TabTQ = coXepHang ? tabURL : "";
  /* Hai tab xếp hạng cùng giấu thanh phạm vi: cả hai là bảng của một kỳ cố định. */
  const moXepHang = tab === "xephang" || tab === "canbo";

  return <div className="page-stack qd-page">
    <PageIntro title={nhom ? nhom.ten : "Tổng quan quản trị"}/>
    {/* Thanh phạm vi đứng ĐẦU, trên mọi hàng tab, ở mọi chế độ (critique
        27/10/2026). Xếp hạng phòng chấm một kỳ cố định cho cả khối phòng;
        báo cáo phân hệ có kỳ riêng chọn ở thanh lọc của nó — ô vẫn đứng đó và
        nói giá trị đang áp dụng, không biến mất. */}
    {tab === "xephang" && !the ? <ThanhPhamVi pv={pv} kyChu="Giao ban tháng 10/2026 · cố định" phamViChu="Khối phòng QLDN"/>
      /* Báo cáo nhúng: ô thanh phạm vi giữ nguyên chỗ và khung, nội dung là
         thanh lọc của báo cáo (Loại kỳ · Kỳ · Phạm vi) — một thanh, không hai. */
      : moBaoCao ? <div ref={datOLoc} className="bo-loc-chung qd-pham-vi is-bao-cao"><NutThuGon/><PhuVai pv={pv} lop="is-vai"/></div>
      /* Kiểm tra tại trụ sở NNT là báo cáo toàn ngành của khối kiểm tra, không
         theo phòng QLDN: ô phạm vi vẫn đứng đó và nói giá trị bằng chữ. */
      : the === "ktnnt" ? <ThanhPhamVi pv={pv} ky={ky} datKy={datKy} phamViChu="Toàn ngành"/>
      /* Ba tab PKT: đối soát theo tháng đang chọn; danh sách cuộc và nhập
         dữ liệu không theo kỳ — ô Kỳ nói giá trị đang áp dụng bằng chữ. */
      : the === "ktdoisoat" ? <ThanhPhamVi pv={pv} ky={ky} datKy={datKy} phamViChu="Các Phòng Kiểm tra"/>
      : the === "ktcuoc" ? <ThanhPhamVi pv={pv} kyChu="Năm 2026" phamViChu="Các Phòng Kiểm tra"/>
      /* Hoàn GTGT là báo cáo toàn ngành theo tháng của ngày quyết định hoàn. */
      : the === "hoangtgt" ? <ThanhPhamVi pv={pv} ky={ky} datKy={datKy} phamViChu="Toàn ngành"/>
      /* Tờ khai tồn trục là ảnh chụp lần kéo gần nhất, không theo tháng: ô Kỳ nói ngày kéo. */
      : the === "tktt" ? <ThanhPhamVi pv={pv} kyChu={`Lần kéo gần nhất · ${NHAN_NGAY_KEO_TK}`}/>
      : <ThanhPhamVi pv={pv} ky={ky} datKy={datKy}/>}
    {coXepHang && <nav className="thanh-muc" aria-label="Nội dung tổng quan quản trị">
      <HangTab lop="thanh-muc-hang" khoaMo={tab}>
        {([["", "Kết quả công tác"], ["xephang", "Xếp hạng phòng"], ["canbo", "Xếp hạng cán bộ"]] as const).map(([id, nhan]) => <button
          key={id} type="button"
          className={`muc-tab${tab === id ? " is-active" : ""}`}
          data-mo={tab === id ? "1" : undefined}
          aria-current={tab === id ? "page" : undefined}
          onClick={() => datTab(id)}
        ><span>{nhan}</span></button>)}
      </HangTab>
    </nav>}
    {nhom && <nav className={`thanh-muc${the === "ktnnt" || the === "hoangtgt" ? " co-phai" : ""}`} aria-label={`Nhóm chỉ tiêu của ${nhom.ten.toLowerCase()}`}>
      {/* Nhóm nhỏ là hàng tab CHÍNH của màn nhóm. Nhóm chỉ có một nhóm nhỏ
          (Thu NSNN, TTHC) không dựng hàng tab: một hàng luôn đúng một nút là
          một hàng không bấm được gì. */}
      {nhom.the.length > 1 && <HangTab lop="thanh-muc-hang" khoaMo={the ?? ""}>
        {nhom.the.map((t) => <button
          key={t} type="button"
          className={`muc-tab${the === t ? " is-active" : ""}`}
          data-mo={the === t ? "1" : undefined}
          aria-current={the === t && !bc ? "page" : undefined}
          onClick={() => { datThe(t); datXem(""); datMucURL(""); }}
        ><span>{THE_Q.find((x) => x.id === t)!.ngan}</span></button>)}
      </HangTab>}
      {/* "Số liệu" của tab trụ sở đứng ở đầu phải hàng tab — hàng ấy luôn cao
          38px, nên thanh phạm vi và mọi khối bên dưới giữ nguyên chỗ khi đổi
          tab (Fixed Slots; đặt trên thanh phạm vi làm thanh cao thêm 28px). */}
      {the === "ktnnt" && <OSoLieuKT dd={loaiKT === "dd"} dat={datLoaiKT} lop="kt-loai-tab"/>}
      {the === "hoangtgt" && <OHanHoan lop="kt-loai-tab"/>}
      {/* MỘT hàng con cho cả hai chế độ (29/10/2026): "Chỉ tiêu", rồi từng mục
          của báo cáo phân hệ. Trước đây là hai hàng — "Chỉ tiêu | Báo cáo: …"
          rồi hàng tab của phân hệ bên dưới — với ba kiểu tab chồng nhau. Hàng
          giống hệt nhau ở hai chế độ, chỉ nút sáng đổi chỗ (Fixed Slots). */}
      {bc && <HangTab lop={`thanh-muc-hang is-con${nhom.the.length > 1 ? "" : " is-don"}`} khoaMo={moBaoCao ? muc : ""}>
        <button type="button" className={`muc-tab-con${!moBaoCao ? " is-active" : ""}`} data-mo={!moBaoCao ? "1" : undefined} aria-current={!moBaoCao ? "page" : undefined} onClick={() => datXem("")}>Chỉ tiêu</button>
        <span className="muc-tab-nhom" aria-hidden="true">Báo cáo</span>
        {dsMuc.map((m) => <button key={m.id} type="button" className={`muc-tab-con${moBaoCao && muc === m.id ? " is-active" : ""}`} data-mo={moBaoCao && muc === m.id ? "1" : undefined} aria-current={moBaoCao && muc === m.id ? "page" : undefined} aria-label={`Báo cáo: ${m.nhan}${m.khung ? ", khung chờ mẫu" : ""}`} onClick={() => moMuc(m.id)}>
          {m.nhan}{m.khung && <em className="nav-khung">Khung</em>}
        </button>)}
      </HangTab>}
    </nav>}
    <div className="qd-results" data-motion="content" data-motion-key={`${nhomId ?? "tq"}-${tab}-${the}-${xem}-${moBaoCao ? muc : ""}-${ky.id}-${pv.donVi.map((d) => d.id).join(",")}`}>
      {!the ? (tab === "canbo" ? <XepHangCanBo pv={pv} ky={ky} actor={user.name}/> : moXepHang ? <XepHangPhong pv={pv} actor={user.name}/> : <TongQuan pv={pv} ky={ky} actor={user.name} moThe={moThe}/>)
        : moBaoCao ? <ODatBoLoc.Provider value={oLoc}><BaoCaoPhanHe bc={bc!} user={user} donViId={pv.donVi[0].id} muc={muc} datMuc={moMuc}/></ODatBoLoc.Provider>
        : the === "ktnnt" ? <KiemTraTruSo ky={ky} actor={user.name} dd={loaiKT === "dd"} datLoai={datLoaiKT}/>
        : the === "ktcuoc" ? <CuocKiemTra actor={user.name}/>
        : the === "ktdoisoat" ? <DoiSoatKT ky={ky} actor={user.name}/>
        : the === "hoangtgt" ? <HoanGTGT ky={ky} actor={user.name}/>
        : the === "tktt" ? <ToKhaiTonTruc pv={pv} actor={user.name}/>
        : the === "nopthua" ? <NopThua pv={pv} ky={ky} actor={user.name}/>
        : the === "cltk" ? <ChenhLechTK pv={pv} ky={ky} actor={user.name} moDanhSach={bc ? moDSChenh : undefined}/>
        : !chiTieuCuaThe(the).length ? <ChuaCoChiTieu coBaoCao={Boolean(bc)}/>
        : <>
          <ChiTietThe key={the} the={the} pv={pv} ky={ky} actor={user.name} moCanhBao={moCanhBao}/>
          {/* Bảng theo mẫu QL5 dưới phần chỉ tiêu (02/11/2026) — cùng tử, mẫu với chỉ tiêu.
              Cán bộ không có: phạm vi của họ là DN được phân công, còn mẫu là số cả phòng. */}
          {the === "xp" && !pv.canBo && <XuPhatDonVi pv={pv} ky={ky} actor={user.name}/>}
          {the === "gt" && !pv.canBo && <DongMSTDonVi pv={pv} ky={ky} actor={user.name}/>}
        </>}
    </div>
  </div>;
}
/* ---------- Tổng quan: các thẻ chỉ tiêu ---------- */

/*
  Thứ tự nhóm trên lưới tổng quan (chia lại 28/10/2026). Lưới sáu cột, hai
  hàng kín: Thu (1) · Quản lý nợ (3) · KT tại bàn (1) · Hoàn thuế (1); rồi
  Quản lý kê khai (3) · Quản lý hóa đơn (3). Thứ tự DOM đúng thứ tự nhìn, để
  trình đọc màn hình đọc như mắt đọc. Tổng đài chưa có chỉ tiêu nên không có ô.
*/
const THU_TU_TQ: NhomId[] = ["thu", "no", "kttb", "hoan", "kekhai", "hoadon", "tongdai"];

function TongQuan({ pv, ky, actor, moThe }: { pv: PhamVi; ky: KyQ; actor: string; moThe: (t: TheId) => void }) {
  const coTyLe = duocXem(pv.vai, "tyLe");
  const coBQ = duocXem(pv.vai, "binhQuan");
  /* Thẻ chưa có chỉ tiêu (Chênh lệch tờ khai, Tổng đài) không có ô ở tổng quan. */
  const ds = useMemo(() => THE_Q.filter((t) => chiTieuCuaThe(t.id).length).map((t) => ({ the: t, kq: ketQuaChiTieu(chiTieuCuaThe(t.id)[0], pv, ky) })), [pv, ky]);
  const uoc = duocXem(pv.vai, "uocThu") ? uocThu(pv, "THANG") : null;
  const no = duocXem(pv.vai, "noTrenThu") ? ketQuaChiTieu(CHI_TIEU_Q[0], pv, ky) : null;

  const xuat = () => exportExcel([sheetTongQuan(pv, ky)], meta(pv, ky, actor), `ket-qua-cong-tac_tong-quan_${ky.id}.xlsx`);

  /*
    MỖI NHÓM LỚN MỘT KHUNG CHIA Ô (chốt 12/10/2026) — cùng kiểu với dải bốn
    mức của Cảnh báo nhắc việc: một khung, các ô đứng cạnh nhau, ngăn bằng kẻ
    mảnh. Thay cho bảng dòng: người dùng muốn đọc chỉ tiêu theo ô như dải
    cảnh báo, không theo danh sách liệt kê.

    Mỗi ô có các vị trí CỐ ĐỊNH theo thứ tự đọc: tên → số thực hiện → tỷ lệ
    (cán bộ: mẫu số) → ba mốc → ghi chú. Ô cùng hàng cao bằng nhau nên số của
    mọi ô thẳng một đường ngang.

    Chuyển động có MỘT việc: đổi kỳ thì thanh và vạch bình quân TRƯỢT từ số
    cũ sang số mới — thấy ngay chỉ tiêu nào vừa tiến hay lùi so với bình quân.
  */
  const coChenh = coTyLe || coBQ;
  let thuTu = 0;
  return <Panel chinh title="Kết quả các mặt công tác" subtitle={nhanPhamVi(pv)} actions={<ExportButton onExport={xuat}>Xuất Excel</ExportButton>}>
    {/* Nhãn mốc trên ô ghi bằng chữ ("Bình quân", "Tháng 8", "Cùng kỳ"), không
        viết tắt (29/10/2026) — dòng này chỉ còn nói đơn vị của chênh lệch. */}
    <div className="qd-overview-guide is-chu-giai"><span>{coBQ ? (pv.vai === "LD" && pv.donVi.length === DON_VI_Q.length ? "Bình quân (BQ): số đơn vị dưới bình quân toàn thuế · tháng trước (T" + (ky.thang - 1) + ") · cùng kỳ 2025 (CK)" : "So với bình quân toàn thuế (BQ), tháng trước (T" + (ky.thang - 1) + ") và cùng kỳ 2025 (CK)") : "So với tháng trước (T" + (ky.thang - 1) + ") và cùng kỳ 2025 (CK)"} · <b>{coChenh ? "chênh lệch tính bằng điểm phần trăm" : "chênh lệch tính bằng số tuyệt đối"}</b></span></div>
    <div className="qd-kq">
      {THU_TU_TQ.map((id) => NHOM_Q.find((n) => n.id === id)!).map((n) => ({ n, so: ds.filter((x) => n.the.includes(x.the.id)).length })).filter((x) => x.so).map(({ n, so: soO }) => <section key={n.id} className={`qd-kq-nhom is-${n.id}`} aria-labelledby={`qd-kq-${n.id}`} style={{ ["--o" as string]: soO }}>
        {/* Tên nhóm luôn là tên đầy đủ ("Công tác thu NSNN"): tên ngắn trùng
            đúng tên ô duy nhất bên trong, đọc ra một nhãn lặp hai lần. */}
        <h3 className="qd-kq-tieu-de" id={`qd-kq-${n.id}`} title={n.ten}>{n.ten}{soO > 1 && <small>{soO} chỉ tiêu</small>}</h3>
        <div className="qd-kq-khung">
          {ds.filter((x) => n.the.includes(x.the.id)).map(({ the, kq }) => {
            const { ct } = kq;
            const x = tyLeCua(ct, kq.nay);
            const bq = coBQ ? tyLeCua(ct, kq.binhQuan) : null;
            const i = thuTu++;
            const ghi = the.id === "thu" && uoc ? `Ước thu tháng 10: đã thu ${pt(uoc.uoc ? uoc.thuc / uoc.uoc : 0)} số ước`
              : the.id === "no" && no ? `Nợ / thu NSNN ${pt(kq.nay.tu / Math.max(no.nay.tu, 1))} · Cục giao 8%`
              : ct.ghiChu ? "KPI chờ thống nhất cách tính" : null;
            const moc = mocCua(kq, pv, ky);
            /* Tên đọc của ô là MỘT câu có nghĩa, không phải chuỗi ghép mọi con
               chữ trong ô: trình đọc màn hình nghe số, tỷ lệ và từng mốc kèm
               "tốt hơn / kém hơn". */
            const docTo = [
              `${the.ten}: ${so(kq.nay.tu, ct.dvt)} ${ct.dvt} ${thuong(ct.nhanTu)}`,
              coTyLe && x !== null ? `tỷ lệ ${pt(x, ct.kieu === "TANG")} ${ct.kieu === "TANG" ? "so với đầu năm" : `so với ${thuong(ct.nhanMau)}`}` : null,
              ...moc.map((m) => m.dem ? `${m.nhan}: ${m.gia}` : `${m.nhan} ${m.ghi}, ${nghiaChenh(ct, m.chenh)}`),
              ghi, "mở chi tiết",
            ].filter(Boolean).join("; ");
            return <button key={the.id} type="button" className="qd-kq-o" style={{ ["--i" as string]: i }} aria-label={docTo} onClick={() => moThe(the.id)}>
              <span className="qd-kq-ten">{the.ten}<Icon name="arrow" size={15}/></span>
              {/*
                Ô TO là TỶ LỆ (phương án 2, 29/10/2026): thứ trưởng phòng hỏi
                trước là "phòng mình đạt bao nhiêu, hơn hay kém bình quân" — số
                tuyệt đối 15.779,0 không so được giữa các ô. Thanh và vạch bình
                quân đứng ngay dưới tỷ lệ; số tuyệt đối xuống hàng hai, cỡ nhỏ.
                Vai không có tỷ lệ (cán bộ) giữ số tuyệt đối ở ô to, mẫu số ở
                hàng hai — vị trí ô không đổi, nội dung đổi theo vai.
              */}
              {coTyLe && x !== null
                ? <strong className="qd-kq-so">
                    <b key={ky.id}>{pt(x, ct.kieu === "TANG")}</b>
                    <small>{ct.kieu === "TANG" ? "tỷ lệ so với đầu năm" : ct.kieu === "THAP" ? `${congThucNgan(ct.stt)} · thấp hơn là tốt` : congThucNgan(ct.stt)}</small>
                    {/* Chỉ tiêu "thấp là tốt" và "tăng/giảm" KHÔNG có thanh: thang
                        0–100% làm 5,8% dẹt về 0 và đánh lừa khi đặt cạnh 84,8%. */}
                    {ct.kieu === "CAO" && <ThanhMoc ct={ct} x={x} bq={bq}/>}
                  </strong>
                : <strong className="qd-kq-so"><b key={ky.id}>{so(kq.nay.tu, ct.dvt)}</b><small>{ct.dvt} · {thuong(ct.nhanTu)}</small></strong>}
              <span className="qd-kq-tl">
                {coTyLe && x !== null
                  ? <><b key={ky.id}>{so(kq.nay.tu, ct.dvt)}</b><small>{ct.dvt} · {thuong(ct.nhanTu)}</small></>
                  : duocXem(pv.vai, "soGiao") || ct.the !== "thu"
                    ? <><b>{so(kq.nay.mau, ct.dvt)}</b><small>{thuong(ct.nhanMau)}</small></>
                    /* Mẫu số của thu là SỐ GIAO — cán bộ không có số giao (§4). */
                    : <small className="qd-khong-co">Không có {thuong(ct.nhanMau)}</small>}
              </span>
              <span className="qd-kq-moc" style={{ gridTemplateColumns: `repeat(${coBQ ? 3 : 2}, auto)` }}>{moc.map((m) => <span key={m.nhan}><em><span className="qd-moc-dai">{m.ngan}</span><span className="qd-moc-ngan" aria-hidden="true">{m.viet}</span></em><Moc ct={ct} m={m}/></span>)}</span>
              <span className={`qd-kq-ghi${ct.ghiChu ? " is-cho" : ""}`}>{ghi}</span>
            </button>;
          })}
        </div>
      </section>)}
    </div>
  </Panel>;
}
function Moc({ ct, m }: { ct: ChiTieuQ; m: MocSoSanh | undefined }) {
  if (!m) return <span className="cell-empty">—</span>;
  if (m.dem) return <span className="qd-chenh is-dem" title={`${m.nhan}: ${m.gia ?? ""}`}>{m.ghi}</span>;
  return <Chenh ct={ct} d={m.chenh} title={`${m.nhan}: ${m.gia ?? ""}`}>{m.ghi.replace(" đpt", "")}</Chenh>;
}

/* Thanh tỷ lệ của bảng chỉ tiêu: thanh và vạch bình quân đều chạy bằng
   transform, nên đổi kỳ là một chuyển động trượt chứ không phải bố cục tính
   lại. Chỉ tiêu "thấp là tốt" co thang theo số lớn nhất như `ThanhTyLe`. */
function ThanhMoc({ ct, x, bq }: { ct: ChiTieuQ; x: number; bq: number | null }) {
  const tran = ct.kieu === "CAO" ? 1 : Math.max(x, bq ?? 0, 0.01) * 1.3;
  const f = (v: number) => Math.min(Math.max(v / tran, 0), 1);
  return <span className={`qd-sc-thanh${x > tran ? " is-vuot" : ""}`} aria-hidden="true" title={bq !== null ? `Vạch: bình quân toàn thuế ${pt(bq, ct.kieu === "TANG")}` : undefined}>
    <i style={{ transform: `scaleX(${f(x)})` }}/>
    {bq !== null && <span className="qd-sc-bq" style={{ transform: `translateX(${f(bq) * 100}%)` }}><b/></span>}
  </span>;
}

/* ---------- Xếp hạng các phòng theo file chấm điểm ---------- */

type KhoaXep = "tong" | NhomDiem;

/* Điểm bốn chữ số như file Excel; dấu luôn hiện, nên tốt/xấu không chỉ nằm ở màu. */
const diemSo = (x: number) => x === 0 ? "0,0000"
  : `${x < 0 ? "−" : "+"}${Math.abs(x).toLocaleString("vi-VN", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
const lopDiem = (x: number) => x > 0 ? "xhp-diem is-tot" : x < 0 ? "xhp-diem is-xau" : "xhp-diem";
/* "Phòng QLHT DN 1" → "QLHT DN 1": trong card hẹp, chữ "Phòng" lặp năm lần không nói thêm gì. */
const tenNgan = (ten: string) => ten.replace(/^Phòng\s+/, "");

/*
  Thanh phân kỳ quanh 0: cộng mọc sang phải, trừ mọc sang trái. Đó là hình
  của chính thang điểm (−1 … +1), nên nhìn dọc một card là thấy phòng nào kéo
  điểm xuống mà không phải đọc dấu từng dòng. `tran` = điểm tối đa: 1 với điểm
  nhóm, 4 với tổng điểm.
*/
function ThanhDiem({ x, tran }: { x: number; tran: number }) {
  const f = Math.min(Math.abs(x) / tran, 1);
  return <span className="xhp-thanh" aria-hidden="true">
    {x !== 0 && <i className={x > 0 ? "is-tot" : "is-xau"} style={{ ["--f" as string]: f }}/>}
  </span>;
}

/*
  Xếp hạng năm phòng QLDN theo file chấm điểm — dạng CARD THEO CHỦ ĐỀ (phòng
  thuế không muốn đọc dạng bảng, 22/10/2026). Cùng kiểu khung nhóm với tab
  Kết quả công tác: tên nhóm ở trên, khung viền mảnh chia ô bên dưới.

  • Hàng đầu: Tổng điểm — năm ô, mỗi ô một phòng theo thứ hạng. Đây là câu
    hỏi đầu tiên của cuộc họp giao ban, nên nó đứng trước và to nhất.
  • Bên dưới: bốn card chủ đề, mỗi card TỰ XẾP năm phòng theo điểm của chủ đề
    ấy. Không còn ô "Xếp theo" — mỗi chủ đề đã có thứ tự của riêng nó.

  Theo một phòng qua các chủ đề: bấm một phòng ở bất kỳ đâu thì phòng ấy sáng
  lên ở cả năm khung (bấm lại để bỏ), và phần chỉ tiêu mở rộng của mọi card
  nói giá trị của chính phòng ấy. Mặc định là phòng của người xem. Chuyển
  động: nền dòng chuyển màu khi đổi phòng đang theo; thanh điểm mọc từ vạch 0
  khi mở tab — một lần, đúng lúc người dùng vừa bấm vào tab.
*/
function XepHangPhong({ pv, actor }: { pv: PhamVi; actor: string }) {
  const cuaToi = pv.vai === "LD" ? null : (pv.phongGoc ?? pv.donVi[0]).id;
  const [theo, datTheo] = useState<string | null>(cuaToi);

  const dong = useMemo(() => DIEM_QLDN.map((d, i) => ({
    ...d, thuTu: i, ten: DON_VI_Q.find((x) => x.id === d.donVi)?.ngan ?? d.donVi,
  })), []);
  type Dong = (typeof dong)[number];
  const giaTri = (d: Dong, k: KhoaXep) => k === "tong" ? d.tong : d.diem[k];
  /*
    Hạng KHÔNG trùng số (người dùng yêu cầu 22/10/2026) — lệch RANK của file
    Excel, nơi đồng điểm cùng hạng (1, 1, 3). Đồng điểm trong một chủ đề thì
    phòng có tổng điểm cao hơn xếp trên; vẫn bằng thì theo thứ tự phòng.
    Quy tắc phá hòa này là GIẢ ĐỊNH, chờ phòng thuế xác nhận.
  */
  const xepTheo = (k: KhoaXep) => [...dong].sort((a, b) => giaTri(b, k) - giaTri(a, k) || b.tong - a.tong || a.thuTu - b.thuTu);
  const hangCua = (d: Dong, k: KhoaXep) => xepTheo(k).indexOf(d) + 1;
  const tenTheo = theo ? tenNgan(dong.find((d) => d.donVi === theo)?.ten ?? "") : null;

  const bam = (id: string) => datTheo((cu) => cu === id ? null : id);
  const docDong = (d: Dong, k: KhoaXep, nhom: string) =>
    `${d.ten}${d.donVi === cuaToi ? ", đơn vị của tôi" : ""}: hạng ${hangCua(d, k)} ${nhom}, ${diemSo(giaTri(d, k))} điểm`;

  const xuat = () => exportExcel([{
    name: "Xep_hang", title: `XẾP HẠNG CÁC PHÒNG QLDN · ${KY_XEP_HANG.toUpperCase()}`,
    headers: ["Hạng", "Phòng", ...NHOM_DIEM.map((n) => n.ten), "Tổng điểm"],
    rows: xepTheo("tong").map((d) => [hangCua(d, "tong"), d.ten, ...NHOM_DIEM.map((n) => d.diem[n.id]), d.tong]),
  }], { period: KY_XEP_HANG, scope: "Khối phòng QLDN", actor, status: "DRAFT" as const }, "xep-hang-phong-qldn_bcgb-thang-10.xlsx");

  return <Panel chinh title="Xếp hạng các phòng QLDN" subtitle={`${KY_XEP_HANG} · theo bộ tiêu chí đánh giá các chỉ tiêu`} actions={<ExportButton onExport={xuat}>Xuất Excel</ExportButton>}>
    <div className="qd-overview-guide xhp-guide"><span>Bấm một phòng để theo phòng đó qua các chủ đề</span><span>{tenTheo ? <>Đang theo: <b>{tenTheo}</b></> : "Chưa chọn phòng"}</span></div>
    <p className="qd-ghi-mot xhp-nguon">
      <b>Số của file chấm điểm, không phải số mô phỏng.</b> Lấy từ sheet “II. Khối QLDN”. Điểm mỗi chỉ tiêu từ −1 đến +1. Điểm nhóm là trung bình điểm các chỉ tiêu trong nhóm. Bốn nhóm theo file chấm: Kiểm tra tại bàn và Hoàn thuế nằm trong nhóm Quản lý, hỗ trợ DN. Đồng điểm thì phòng có tổng điểm cao hơn xếp trên, nên không có hai phòng cùng hạng. Giữ đúng như file: TTHC vẫn tính tỷ lệ hài lòng dù biên bản 09/10 đã bỏ.
    </p>
    <div className="xhp">
      <section className="xhp-tong" aria-labelledby="xhp-tong">
        <h3 className="qd-kq-tieu-de" id="xhp-tong">Tổng điểm<small>cộng 4 nhóm · điểm tối đa 4</small></h3>
        <ol className="xhp-tong-khung">
          {xepTheo("tong").map((d) => <li key={d.donVi}>
            <button type="button" className={`xhp-tong-o${theo === d.donVi ? " is-theo" : ""}`} aria-pressed={theo === d.donVi} aria-label={docDong(d, "tong", "tổng điểm")} onClick={() => bam(d.donVi)}>
              <span className="xhp-tong-hang">{hangCua(d, "tong")}</span>
              <span className="xhp-tong-ten">{tenNgan(d.ten)}{d.donVi === cuaToi && <small>của tôi</small>}</span>
              <b className={lopDiem(d.tong)}>{diemSo(d.tong)}</b>
              <ThanhDiem x={d.tong} tran={4}/>
            </button>
          </li>)}
        </ol>
      </section>
      <div className="xhp-luoi">
        {NHOM_DIEM.map((n) => <section key={n.id} className="xhp-nhom" aria-labelledby={`xhp-${n.id}`}>
          <h3 className="qd-kq-tieu-de" id={`xhp-${n.id}`} title={n.ten}>{n.ten}<small>trung bình {n.chiTieu.length} chỉ tiêu</small></h3>
          <ol className="xhp-khung">
            {xepTheo(n.id).map((d) => <li key={d.donVi}>
              <button type="button" className={`xhp-dong${theo === d.donVi ? " is-theo" : ""}`} aria-pressed={theo === d.donVi} aria-label={docDong(d, n.id, n.ten)} onClick={() => bam(d.donVi)}>
                <span className="xhp-dong-hang">{hangCua(d, n.id)}</span>
                {/* Không gắn "của tôi" ở đây: card bốn cột hẹp, thêm chữ là cắt
                    tên phòng thành "QLHT DN 1…". Phòng của người xem đã sáng
                    sẵn (mặc định đang theo) và được ghi rõ ở hàng Tổng điểm. */}
                <span className="xhp-dong-ten">{tenNgan(d.ten)}</span>
                <ThanhDiem x={d.diem[n.id]} tran={1}/>
                <b className={lopDiem(d.diem[n.id])}>{diemSo(d.diem[n.id])}</b>
              </button>
            </li>)}
          </ol>
          <ChiTieuNhom nhom={n} theo={theo} tenCua={(id) => tenNgan(dong.find((d) => d.donVi === id)?.ten ?? id)}/>
        </section>)}
      </div>
    </div>
  </Panel>;
}

/* Điểm chỉ tiêu dạng ngắn cho ô điểm: "+1", "+0,5", "0", "−0,5", "−1". */
const diemNgan = (x: number) => x === 0 ? "0" : `${x < 0 ? "−" : "+"}${Math.abs(x).toLocaleString("vi-VN")}`;

/*
  Chỉ tiêu bên trong một chủ đề (22/10/2026) — MỞ KHI CẦN, ngay trong card,
  không hộp thoại (The No-Overlay Rule). Điểm nhóm là trung bình của 2–9 chỉ
  tiêu nên che mất lý do; phần này trả lời "phòng kém ở đâu".

  Mỗi chỉ tiêu: STT và tên theo file, mốc so sánh, giá trị của PHÒNG ĐANG
  THEO, rồi điểm của cả năm phòng. Năm ô điểm đứng theo THỨ TỰ PHÒNG CỐ ĐỊNH
  (1 → 5, như dòng của sheet), không theo hạng: ô thứ hai luôn là QLHT DN 2, nên
  dò một phòng dọc xuống chín chỉ tiêu là đi thẳng một cột (Fixed Slots Rule).

  Hiển thị nguyên như file, kể cả những ô đã ghi nhận là chấm lệch.
*/
function ChiTieuNhom({ nhom, theo, tenCua }: { nhom: (typeof NHOM_DIEM)[number]; theo: string | null; tenCua: (id: string) => string }) {
  const [mo, datMo] = useState(false);
  const iTheo = theo ? PHONG_XEP.indexOf(theo) : -1;
  const id = `xhp-ct-${nhom.id}`;
  /* Disclosure của React Aria: nút nối với vùng (aria-controls/expanded), Enter/Space do thư viện lo. */
  return <Disclosure className="xhp-ct" isExpanded={mo} onExpandedChange={datMo}>
    <AriaButton slot="trigger" className="xhp-mo">
      <span>{mo ? "Ẩn" : "Xem"} {nhom.chiTieu.length} chỉ tiêu</span><Icon name="chevronDown" size={15}/>
    </AriaButton>
    <DisclosurePanel>{mo && <div id={id} className="xhp-ct-than" data-motion="detail">
      <div className="xhp-ct-dau" aria-hidden="true">
        <span>{iTheo >= 0 ? `Giá trị của ${tenCua(theo!)}` : "Bấm một phòng để xem giá trị"}</span>
        <span className="xhp-o-hang">{PHONG_XEP.map((p, i) => <em key={p} className={i === iTheo ? "is-theo" : undefined} title={tenCua(p)}>{i + 1}</em>)}</span>
      </div>
      <ol className="xhp-ct-ds">
        {nhom.chiTieu.map((c) => <li key={c.stt}>
          <p className="xhp-ct-ten"><span>STT {c.stt}</span> {c.ten}</p>
          <div className="xhp-ct-so">
            <span className="xhp-ct-gt">
              {iTheo >= 0 && <b className={lopDiem(c.diem[iTheo])}>{c.giaTri[iTheo]}</b>}
              <small>{c.moc}</small>
            </span>
            <ol className="xhp-o-hang" aria-label="Điểm năm phòng">
              {PHONG_XEP.map((p, i) => <li key={p} className={`xhp-o ${c.diem[i] > 0 ? "is-tot" : c.diem[i] < 0 ? "is-xau" : "is-khong"}${i === iTheo ? " is-theo" : ""}`}>
                <span className="sr-only">{tenCua(p)}: </span>{diemNgan(c.diem[i])}
              </li>)}
            </ol>
          </div>
          {c.ghi && <small className="xhp-ct-ghi">{c.ghi}</small>}
        </li>)}
      </ol>
    </div>}</DisclosurePanel>
  </Disclosure>;
}

/* ---------- Chi tiết một thẻ ---------- */

type Theo = "DONVI" | "CANBO";

/*
  MỘT khối cho một nhóm nhỏ (chốt 12/10/2026). Nhóm nhỏ có hai chỉ tiêu — số
  NNT và số tiền, gói và phát sinh mới — dùng một công tắc thay vì hai bảng
  xếp chồng: với lãnh đạo, hai bảng 30 đơn vị là gần bốn màn cuộn để so hai
  con số mà người đọc vốn chỉ xem từng cái một. Tệp Excel vẫn xuất đủ cả hai.
*/
/*
  Tab CHƯA CÓ chỉ tiêu trong bộ tiêu chí (28/10/2026): Tổng đài hỗ trợ NNT
  chưa có chỉ tiêu nào. Không tự đặt công thức — màn nói thẳng đang chờ gì và
  chỉ sang Báo cáo nếu có. Chênh lệch tờ khai cũng chưa có chỉ tiêu nhưng đã
  có số theo dõi — xem `ChenhLechTK`.
*/
function ChuaCoChiTieu({ coBaoCao }: { coBaoCao: boolean }) {
  return <Panel chinh title="Tổng đài hỗ trợ NNT" subtitle="Chưa có chỉ tiêu đánh giá">
    <div className="qd-chua-ct">
      <Icon name="clock" size={18}/>
      <p><strong>Chưa có chỉ tiêu trong bộ tiêu chí đánh giá</strong>
        <span>Bộ tiêu chí 26 chỉ tiêu chưa có chỉ tiêu nào cho tổng đài hỗ trợ NNT. Khi Thuế xác nhận chỉ tiêu, tab này hiện kết quả như các tab khác.
        {coBaoCao ? " Số liệu hiện có nằm ở tab Báo cáo." : ""}</span></p>
    </div>
  </Panel>;
}

function ChiTietThe({ the, pv, ky, actor, moCanhBao }: { the: TheId; pv: PhamVi; ky: KyQ; actor: string; moCanhBao?: (dvId: string) => void }) {
  /* Liên kết mang `so=` của một cán bộ (ngăn NNT đang mở) thì vào thẳng "Theo cán bộ". */
  const [soURL] = useThamSo<string>("so", "");
  const [theo, datTheo] = useState<Theo>(() => the === "thu" && soURL && pv.donVi.length === 1 && canBoCua(pv.donVi[0].id).some((c) => c.id === soURL) ? "CANBO" : "DONVI");
  const ds = chiTieuCuaThe(the);
  /* Đi từ Bộ tiêu chí sang (`tc=`) thì mở đúng chỉ tiêu ấy. */
  const [tcURL] = useThamSo<string>("tc", "");
  const [ctId, datCtId] = useState(() => ds.find((x) => String(x.stt) === tcURL)?.id ?? ds[0].id);
  const ct = ds.find((x) => x.id === ctId) ?? ds[0];
  const info = THE_Q.find((t) => t.id === the)!;
  /* "Theo cán bộ" chỉ có nghĩa khi đang xem MỘT đơn vị. */
  const motDonVi = pv.donVi.length === 1 && !pv.canBo;

  const xuat = () => exportExcel(ds.map((x) => sheetChiTiet(x, pv, ky, theo)), meta(pv, ky, actor), `ket-qua-cong-tac_${the}_${ky.id}.xlsx`);

  return <>
    {the === "thu" && duocXem(pv.vai, "uocThu") && <UocThu pv={pv}/>}
    <Panel
      chinh
      title={ct.ten}
      /* Lý do "Theo cán bộ" bị tắt nói bằng chữ trên màn, không chỉ trong
         `title` — chú thích trỏ chuột không tới được bằng bàn phím hay cảm ứng. */
      subtitle={pv.canBo ? `DN được phân công · ${ct.dvt}` : `${info.ten} · ${ct.dvt}${motDonVi ? "" : " · Theo cán bộ: chọn một đơn vị ở ô Phạm vi"}`}
      actions={<div className="inline-controls">
        {!pv.canBo && <NhomNut label="Xem theo" value={theo === "CANBO" && motDonVi ? "CANBO" : "DONVI"} onChange={datTheo} options={[
          { value: "DONVI", label: "Theo đơn vị" },
          { value: "CANBO", label: "Theo cán bộ", disabled: !motDonVi, title: motDonVi ? undefined : "Chọn một đơn vị để xem theo cán bộ" },
        ]}/>}
        <ExportButton onExport={xuat}>Xuất Excel</ExportButton>
      </div>}
    >
      {ds.length > 1 && <div className="qd-cong-tac">
        <NhomNut label="Chỉ tiêu" value={ct.id} onChange={datCtId} options={ds.map((x) => ({ value: x.id, label: x.ngan ?? x.ten }))}/>
      </div>}
      {/* Dải số tóm tắt CHỈ cho lãnh đạo (gọn 28/10/2026): bảng của lãnh đạo
          là các đơn vị con, không có dòng nào là số của cả phạm vi đang chọn.
          Vai khác đã có dòng của mình (hoặc bảng theo tháng của cán bộ) mang
          đủ các số ấy — dải ô chỉ lặp lại. */}
      {pv.vai === "LD" && <TomTatMoc ct={ct} pv={pv} ky={ky}/>}
      {ct.ghiChu && <div className="notice info qd-ghi"><strong>Chờ chốt</strong><span>{ct.ghiChu}. Số hồ sơ hiển thị để theo dõi, chưa dùng để đánh giá.</span></div>}
      {/* Hai việc đang chờ của biên bản demo 09/10 gom thành MỘT dòng. */}
      {the === "no" && <p className="qd-ghi-mot">
        <b>Chưa bóc nợ đất, chưa loại trường hợp đặc thù.</b> Nợ đất đang cộng vào nợ các phòng QLDN; bảo lãnh, nộp theo quyết định, tạm hoãn xuất cảnh vẫn nằm trong số nợ. Chờ bài toán bóc tách và file loại trừ của phòng đầu mối.
      </p>}
      {pv.canBo
        ? <BangTheoThang key={ct.id} ct={ct} pv={pv} ky={ky}/>
        : <BangXepHang key={`${ct.id}-${theo}`} ct={ct} pv={pv} ky={ky} theo={motDonVi ? theo : "DONVI"} moCanhBao={moCanhBao}/>}
    </Panel>
    {/* Bảng theo bộ tiêu chí chỉ hiện khi nhóm có tiêu chí CHƯA có ở bảng
        trên (Thu: tiêu chí 2, 3; Nợ: 5–8; THXC: 13; TTHC: 15). Nhóm mà mọi
        tiêu chí đều là chỉ tiêu ở trên thì bảng này lặp nguyên số (gọn
        28/10/2026). */}
    {tieuChiCuaThe(the).some((t) => !ds.some((x) => x.stt === t.stt)) && <BangTieuChi the={the} pv={pv} ky={ky}/>}
  </>;
}

/*
  Bảng chấm theo bộ tiêu chí, dựng theo sheet "II. Khối QLDN" (chốt 15/10/2026):
  mỗi tiêu chí của nhóm là một cụm cột — các số gốc đúng như công thức của bộ
  tiêu chí, rồi đến cột kết quả. Đọc từ trái sang phải là đọc lại phép tính,
  nên người đi từ Bộ tiêu chí sang thấy con số kết quả từ đâu ra.

  Đơn vị trong bảng đi theo bảng xếp hạng phía trên: cả khối của phạm vi đang
  xem (lãnh đạo: khối đang chọn). Cán bộ chỉ một dòng — DN của mình. Dòng toàn
  thuế cộng SỐ GỐC của cả 30 đơn vị rồi mới tính, đúng định nghĩa bình quân.
*/
/*
  LỌC THEO TIÊU CHÍ (người dùng đề xuất 19/10/2026). Mỗi tiêu chí là một cụm
  ba, bốn cột, nên nhóm Nợ với năm tiêu chí ra một bảng phải cuộn ngang rất
  xa — và người đi từ Bộ tiêu chí sang chỉ cần đúng một cụm. Bộ lọc dùng chính
  tham số `tc` mà Bộ tiêu chí đã ghi: đi từ đó sang thì bảng đã lọc sẵn, gửi
  liên kết thì người nhận thấy đúng cụm ấy. "Tất cả" giữ nguyên bảng đủ cụm
  để so ngang nhiều tiêu chí.
*/
function BangTieuChi({ the, pv, ky }: { the: TheId; pv: PhamVi; ky: KyQ }) {
  const [tc, datTc] = useThamSo<string>("tc", "");
  const [khoiXem] = useThamSo<Khoi>("khoi", "VP", ["VP", "TCS"]);
  const [trang, datTrang] = useState(1);
  const hop = useRef<HTMLDivElement>(null);
  const cuaNhom = tieuChiCuaThe(the).filter((t) => !t.noTrenThu || duocXem(pv.vai, "noTrenThu"));
  /* `tc` của nhóm khác (liên kết cũ, đổi tab) không lọc mất cả bảng. */
  const dangLoc = cuaNhom.find((t) => String(t.stt) === tc) ?? null;
  const ds = dangLoc ? [dangLoc] : cuaNhom;

  /* Đi từ Bộ tiêu chí sang: đưa bảng vào tầm nhìn. Bảng đã lọc còn một cụm
     nên không còn phải cuộn ngang tìm cột. */
  useEffect(() => {
    if (!dangLoc) return;
    hop.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [dangLoc]);

  if (!cuaNhom.length) return null;
  const cuaToi = pv.vai === "LD" ? null : (pv.phongGoc ?? pv.donVi[0]).id;
  const dong = pv.canBo
    ? [{ id: pv.donVi[0].id, ten: "DN được phân công", cb: pv.canBo }]
    : khoiXepHang(pv, khoiXem).map((d) => ({ id: d.id, ten: d.ngan, cb: undefined }));
  const CO = 10;
  const soTrang = Math.max(1, Math.ceil(dong.length / CO));
  const trongTrang = dong.slice((trang - 1) * CO, trang * CO);
  const coTong = duocXem(pv.vai, "binhQuan");
  const tong = (t: (typeof ds)[number]) => DON_VI_Q.reduce<number[]>((s, d) => {
    const v = t.lay(d.id, ky.thang);
    return s.length ? s.map((x, i) => x + v[i]) : v;
  }, []);
  const lop = (_t: (typeof ds)[number], i: number) => (i === 0 ? "qd-goc-dau" : undefined);
  const o = (t: (typeof ds)[number], v: number[]) => <>
    {v.map((x, i) => <td key={i} className={["num", lop(t, i)].join(" ").trim()}>{so(x, t.nguon[i].dvt)}</td>)}
    <td className="num qd-goc-kq"><strong>{pt(ketQuaGoc(t, v), t.phep === "TANG")}</strong></td>
  </>;

  return <Panel title="Theo bộ tiêu chí đánh giá" subtitle={`Cấu trúc sheet II. Khối QLDN · số gốc ở trước, kết quả ở cột cuối mỗi cụm · lũy kế đến hết tháng ${ky.thang}/2026`}>
    <div ref={hop}>
      {cuaNhom.length > 1 && <div className="qd-cong-tac">
        <NhomNut className="qd-loc-tc" label="Lọc theo tiêu chí" value={dangLoc ? String(dangLoc.stt) : ""} onChange={datTc} options={[
          { value: "", label: `Tất cả ${cuaNhom.length} tiêu chí` },
          ...cuaNhom.map((t) => ({ value: String(t.stt), label: t.ten, title: `Tiêu chí ${t.stt} · ${tenSTT(t.stt)}` })),
        ]}/>
      </div>}
      <div data-motion="content" data-motion-key={`${the}-${dangLoc?.stt ?? "all"}`}>
      <TableWrap label={`số gốc theo bộ tiêu chí · ${THE_Q.find((x) => x.id === the)?.ten ?? ""}`}>
        <table className="qd-bang qd-bang-goc">
          <thead>
            <tr>
              <th scope="col" rowSpan={2} className="qd-goc-dv">{pv.canBo ? "Phạm vi" : "Đơn vị"}</th>
              {ds.map((t) => <th key={t.stt} scope="colgroup" colSpan={t.nguon.length + 1} data-stt={t.stt} className="qd-goc-nhom qd-goc-dau">
                <span>{tenSTT(t.stt)}</span>
              </th>)}
            </tr>
            <tr>
              {ds.flatMap((t) => [
                ...t.nguon.map((n, i) => <th key={`${t.stt}-${i}`} scope="col" className={["num", lop(t, i)].join(" ").trim()}><span>{n.nhan}</span><small className="qd-ct">{n.dvt}</small></th>),
                <th key={`${t.stt}-kq`} scope="col" className="num qd-goc-kq qd-th-rong">
                  <span>Kết quả</span><small className="qd-ct" title={congThucSTT(t.stt)}>{congThucNgan(t.stt)}{t.moc ? ` · ${t.moc}` : ""}</small>
                </th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {trongTrang.map((d) => <tr key={d.id} className={d.id === cuaToi && !pv.canBo ? "is-selected" : undefined}>
              <th scope="row" className="qd-goc-dv">{d.ten}{d.id === cuaToi && !pv.canBo && <span className="qd-cua-toi"> · đơn vị của tôi</span>}</th>
              {ds.map((t) => <Fragment key={t.stt}>{o(t, t.lay(d.id, ky.thang, d.cb))}</Fragment>)}
            </tr>)}
            {coTong && <tr className="is-tong">
              <th scope="row" className="qd-goc-dv">Toàn thuế (cộng 30 đơn vị)</th>
              {ds.map((t) => <Fragment key={t.stt}>{o(t, tong(t))}</Fragment>)}
            </tr>}
          </tbody>
        </table>
      </TableWrap>
      </div>
      {soTrang > 1 && <div className="table-footer"><span>{dong.length} đơn vị</span><Pager trang={trang} soTrang={soTrang} onChange={datTrang}/></div>}
    </div>
  </Panel>;
}


function TomTatMoc({ ct, pv, ky }: { ct: ChiTieuQ; pv: PhamVi; ky: KyQ }) {
  const kq = ketQuaChiTieu(ct, pv, ky);
  const x = tyLeCua(ct, kq.nay);
  return <div className="qd-tom-tat">
    <div><span>{ct.nhanTu}</span><strong>{so(kq.nay.tu, ct.dvt)}</strong><small>{ct.dvt}</small></div>
    {duocXem(pv.vai, "soGiao") && <div><span>{ct.nhanMau}</span><strong>{so(kq.nay.mau, ct.dvt)}</strong><small>{ct.dvt}</small></div>}
    {duocXem(pv.vai, "tyLe") && <div><span>Tỷ lệ</span><strong>{pt(x, ct.kieu === "TANG")}</strong><small title={congThucCua(ct)}>{congThucNgan(ct.stt)}</small></div>}
    {mocCua(kq, pv, ky).map((m) => <div key={m.nhan}><span>{m.nhan}</span><strong>{m.dem ? <span className="qd-chenh is-dem">{m.ghi}</span> : <Chenh ct={ct} d={m.chenh}>{m.ghi}</Chenh>}</strong><small>{m.gia}</small></div>)}
  </div>;
}

/** Đơn vị được xếp hạng cùng nhau: lãnh đạo — phần của khối đang chọn trong phạm vi; các vai khác — cả khối của đơn vị mình. */
function khoiXepHang(pv: PhamVi, khoi: Khoi) {
  if (pv.vai !== "LD") return DON_VI_Q.filter((d) => d.khoi === pv.donVi[0].khoi);
  const cua = pv.donVi.filter((d) => d.khoi === khoi);
  return cua.length ? cua : pv.donVi;
}

/*
  Tiêu đề cột CHỈ mang tên (audit 27/10/2026). Công thức từng đứng dưới tên,
  nên hàng tiêu đề cao tới sáu dòng và đẩy cột cuối ra ngoài khung ở 1280px.
  Công thức nay nằm trong khối "Cách tính" ngay dưới bảng — vẫn đọc được trên
  màn, không giấu trong tooltip; tiêu đề giữ `title` cho người rê chuột.
*/
interface CotCt { nhan: string; ct?: string; day?: string }
function ThCt({ nhan, ct, day }: CotCt) {
  /* `<span>`: luật `.qd-bang thead th > span` cho tên dài xuống dòng — thiếu
     nó tên nằm một dòng và bảng tràn khỏi khung 1280px. */
  return <th scope="col" className="num" title={day ?? ct}><span>{nhan}</span></th>;
}
/* Cách tính: MỘT dòng chữ nhỏ dưới bảng (gọn 28/10/2026) — đọc được trên
   màn, không chiếm một khối riêng phía trên bảng. */
function CachTinh({ cot }: { cot: (CotCt | false | null | undefined)[] }) {
  const co = cot.filter((c): c is CotCt => Boolean(c && c.ct));
  if (!co.length) return null;
  return <p className="qd-cach-tinh"><b>Cách tính.</b> {co.map((c, i) => <Fragment key={c.nhan}>{i ? "; " : ""}<span><i>{c.nhan}</i> = {c.day ?? c.ct}</span></Fragment>)}.</p>;
}

/* Bảng đơn vị hoặc cán bộ, xếp theo tỷ lệ. Cột hiện theo ma trận quyền. */
function BangXepHang({ ct, pv, ky, theo, moCanhBao }: { ct: ChiTieuQ; pv: PhamVi; ky: KyQ; theo: Theo; moCanhBao?: (dvId: string) => void }) {
  const coHang = duocXem(pv.vai, "thuHang");
  const coGiao = duocXem(pv.vai, "soGiao");
  const coTyLe = duocXem(pv.vai, "tyLe");
  const coBQ = duocXem(pv.vai, "binhQuan");
  /* Đang xem khối thuế cơ sở thì không có dòng nào là "đơn vị của tôi". */
  /* Phòng của người xem vẫn được đánh dấu khi họ đang xem phòng khác. */
  const cuaToi = pv.vai === "LD" ? null : (pv.phongGoc ?? pv.donVi[0]).id;

  /* Trưởng phòng "thấy phòng mình đứng ở đâu so với các phòng khác" (§3):
     bảng đơn vị của trưởng/phó phòng là cả khối của phòng, chứ không chỉ
     một dòng của chính phòng. */
  /* Xếp hạng TRONG TỪNG KHỐI, như file chấm điểm: sheet "I. Khối TCS" xếp
     1–25, sheet "II. Khối QLDN" xếp 1–5. Phòng QLDN quản lý ít DN nhưng DN
     lớn, nên trộn 30 đơn vị vào một bảng hạng là so hai loại đơn vị khác quy
     mô. Bình quân thì vẫn chung 30 đơn vị — hai sheet ghi cùng một số. */
  const [khoiXem, datKhoiXem] = useThamSo<Khoi>("khoi", "VP", ["VP", "TCS"]);
  const haiKhoi = pv.vai === "LD" && pv.donVi.some((d) => d.khoi === "VP") && pv.donVi.some((d) => d.khoi === "TCS");
  const dsDonVi = khoiXepHang(pv, khoiXem);
  const dong = theo === "CANBO" ? theoCanBo(ct, pv.donVi[0].id, ky.thang) : theoDonVi(ct, dsDonVi, ky.thang);
  /* "Kém nhất trước": lãnh đạo chuẩn bị họp cần đơn vị kéo tụt trước tiên,
     không phải sang trang 3. Hạng giữ nguyên — chỉ đổi chiều đọc. */
  const [kemTruoc, datKemTruoc] = useState(false);
  const xep = xepHang(ct, dong);
  const hang = kemTruoc ? [...xep].reverse() : xep;
  /* Ô "việc quá hạn" mở danh sách cảnh báo của chính đơn vị ấy — chỉ với
     đơn vị nằm trong phạm vi cảnh báo của người xem. */
  const moDuoc = (id: string) => Boolean(moCanhBao) && theo === "DONVI" && pv.donVi.some((d) => d.id === id);
  const bq = ketQuaChiTieu(ct, pv, ky).binhQuan;
  const tlBQ = tyLeCua(ct, bq);
  const truoc = new Map(dong.map((d) => [d.id, theo === "CANBO" ? null : capCua(ct, d.id, ky.thang - 1)]));
  /* Bảng biến động nợ riêng đã gộp vào đây: cột nợ/thu NSNN đứng cạnh tổng
     nợ của chính bảng này, cho vai được xem cột R–Z của file Excel. */
  const coNoThu = ct.kieu === "TANG" && theo === "DONVI" && duocXem(pv.vai, "noTrenThu");

  /*
    Tiêu đề cột mang công thức VIẾT BẰNG CHỮ, dạng rút gọn "A / B" (chốt
    15/10/2026; nguyên văn hiện khi trỏ chuột): người đọc lần
    ra được mỗi con số từ đâu mà không cần hỏi ai. Công thức tỷ lệ là nguyên
    văn cột "Cách tính" của bộ tiêu chí (`congThucCua`); tên các cột so sánh
    theo sheet "II. Khối QLDN" ("Bình quân toàn ngành", "Tăng/giảm so với
    tháng trước", "Tổng nợ/Tổng thu NSNN"). Có thêm cột tỷ lệ tháng trước để
    "So tháng trước" là một phép trừ nhìn thấy được.
  */
  /* Cột "Tỷ lệ T8" bỏ (gọn 28/10/2026): "So tháng trước" đã là phép trừ
     ấy. Cột "So cùng kỳ" thay dải ô tóm tắt — mốc thứ ba của §2.4, nay có
     cho từng đơn vị chứ không chỉ cho phạm vi. */
  const tTruoc = `T${ky.thang - 1}`;
  const cungKy = new Map(dong.map((d) => [d.id, theo === "CANBO" ? null : capCua(ct, d.id, ky.thang, 2025)]));

  /* Mười dòng một trang: bảng 30 đơn vị của lãnh đạo dài hơn hai màn. Bảng
     của phòng (5 phòng, ≤18 cán bộ) thường vừa một hoặc hai trang. */
  const [trang, datTrang] = useState(1);
  const cotCt = [
    coTyLe && { nhan: "Tỷ lệ", ct: congThucNgan(ct.stt), day: congThucCua(ct) },
    coBQ && { nhan: "So bình quân", ct: `Tỷ lệ − tỷ lệ bình quân toàn thuế (${pt(tlBQ, ct.kieu === "TANG")})` },
    theo === "DONVI" && { nhan: "So tháng trước", ct: coTyLe ? `Tỷ lệ − tỷ lệ lũy kế đến hết ${tTruoc}` : `Tháng này − ${tTruoc}` },
    theo === "DONVI" && { nhan: "So cùng kỳ", ct: coTyLe ? "Tỷ lệ − tỷ lệ cùng kỳ 2025" : "Tháng này − cùng kỳ 2025" },
    coNoThu && { nhan: "Nợ / thu NSNN", ct: "Tổng nợ / Tổng thu NSNN · mức Cục giao: 8%" },
  ];
  const CO = 10;
  const soTrang = Math.max(1, Math.ceil(hang.length / CO));
  const trongTrang = hang.slice((trang - 1) * CO, trang * CO);

  /*
    Thu NSNN · Theo cán bộ: mỗi dòng cán bộ mở NGĂN TRƯỢT danh sách NNT của
    người ấy, và từ đó mở hồ sơ từng NNT (người dùng chốt 28/10/2026) — xem
    `NNTCanBo`. Cán bộ đang mở ở `so=`, NNT đang mở ở `nnt=`. Chỉ nhóm Thu:
    số thu cộng được theo NNT; chỉ tiêu tỷ lệ của nhóm khác thì chưa.
  */
  const coNNT = theo === "CANBO" && ct.the === "thu";
  const dvId = pv.donVi[0].id;
  const dsCB = useMemo(() => coNNT ? canBoCua(dvId) : [], [coNNT, dvId]);
  const [soMo, datSoMo] = useThamSo<string>("so", "");
  const [nntMo, datNntMo] = useThamSo<string>("nnt", "");
  const cbMo = coNNT ? dsCB.find((c) => c.id === soMo) ?? null : null;
  const jNNT = nntMo === "" ? null : Number.parseInt(nntMo, 10);
  const noiBam = useRef<HTMLButtonElement | null>(null);
  const dongNgan = () => { datNntMo(""); datSoMo(""); requestAnimationFrame(() => noiBam.current?.focus()); };
  const moCB = (id: string, nut: HTMLButtonElement | null) => { noiBam.current = nut; datNntMo(""); datSoMo(soMo === id ? "" : id); };

  /* Điều khiển của bảng đứng NGAY TRÊN bảng nó điều khiển (critique
     27/10/2026): bản trước để "Tốt nhất / Kém nhất trước" dưới chân bảng, sau
     cả khối Cách tính. */
  return <CaseLayout
    presentation="drawer"
    label={cbMo ? `Người nộp thuế · ${cbMo.ten}` : "Người nộp thuế của cán bộ"}
    mobileOpen={Boolean(cbMo)}
    onClose={dongNgan}
    detail={cbMo ? <NNTCanBo key={cbMo.id} ct={ct} dvId={dvId} donVi={pv.donVi[0].ngan} cb={cbMo} ky={ky}
      nnt={jNNT !== null && Number.isFinite(jNNT) && jNNT >= 0 ? jNNT : null}
      moNNT={(j) => datNntMo(j === null ? "" : String(j))}/> : null}
  >
  <div className="qd-khoi-xep">
    {haiKhoi && theo === "DONVI" && <>
      <span className="bo-loc-nhan">Xếp hạng trong</span>
      <NhomNut label="Khối xếp hạng" value={khoiXem} onChange={(k) => { datKhoiXem(k); datTrang(1); }}
        options={(["VP", "TCS"] as Khoi[]).map((k) => ({ value: k, label: `${NHAN_KHOI[k]} · ${pv.donVi.filter((d) => d.khoi === k).length}` }))}/>
    </>}
    <span className="bo-loc-nhan">Thứ tự</span>
    <NhomNut label="Thứ tự xếp hạng" value={kemTruoc ? "kem" : "tot"} onChange={(v) => { datKemTruoc(v === "kem"); datTrang(1); }} options={[{ value: "tot", label: "Tốt nhất trước" }, { value: "kem", label: "Kém nhất trước" }]}/>
    <span className="qd-khoi-dem">{integer(hang.length)} {theo === "CANBO" ? "cán bộ" : "đơn vị"} · xếp theo tỷ lệ{coNNT ? " · bấm một cán bộ để xem NNT" : ""}</span>
  </div>
  <TableWrap label={`${ct.ten} theo ${theo === "CANBO" ? "cán bộ" : "đơn vị"}`}>
    <table className="qd-bang">
      <thead><tr>
        {coHang && <th scope="col" className="num">Hạng</th>}
        <th scope="col">{theo === "CANBO" ? "Cán bộ" : "Đơn vị"}</th>
        <ThCt nhan={ct.nhanTu}/>
        {coGiao && <ThCt nhan={ct.nhanMau}/>}
        {cotCt.map((c) => c && <ThCt key={c.nhan} {...c}/>)}
        <th scope="col" className="num">Việc quá hạn</th>
      </tr></thead>
      <tbody>
        {trongTrang.map((h) => {
          const t = truoc.get(h.id);
          const tlTruoc = t ? tyLeCua(ct, t) : null;
          const cb = coNNT ? dsCB.find((c) => c.id === h.id) : undefined;
          return <tr key={h.id} className={cb ? `qd-viec${h.id === soMo ? " is-selected" : ""}` : h.id === cuaToi ? "is-selected" : undefined}
            onClick={cb ? (e) => moCB(h.id, e.currentTarget.querySelector<HTMLButtonElement>(".row-select")) : undefined}>
            {coHang && <td className="num">{h.hang}</td>}
            {cb
              /* Cả hàng bấm được; nút ở ô tên cho bàn phím — The Whole Row Rule. */
              ? <td><button type="button" className="row-select qd-cb-mo" aria-haspopup="dialog">{h.ten}<span className="qd-cb-nnt"> · {integer(soNNTCanBo(dvId, cb))} NNT</span><Icon name="chevronDown" size={14}/></button></td>
              : <td>{h.ten}{h.id === cuaToi && <span className="qd-cua-toi"><span className="sr-only">, </span>Đơn vị của tôi</span>}</td>}
            <td className="num"><strong>{so(h.cap.tu, ct.dvt)}</strong></td>
            {coGiao && <td className="num">{so(h.cap.mau, ct.dvt)}</td>}
            {coTyLe && <td className="num"><span className="qd-o-thanh">{ct.kieu === "CAO" && <ThanhTyLe ct={ct} x={h.tyLe ?? 0} bq={tlBQ}/>}<span>{pt(h.tyLe, ct.kieu === "TANG")}</span></span></td>}
            {coBQ && <td className="num">{h.tyLe !== null && tlBQ !== null ? <Chenh ct={ct} d={h.tyLe - tlBQ}>{dpt(h.tyLe - tlBQ)}</Chenh> : "—"}</td>}
            {theo === "DONVI" && <td className="num">{coTyLe
              ? (h.tyLe !== null && tlTruoc !== null ? <Chenh ct={ct} d={h.tyLe - tlTruoc}>{dpt(h.tyLe - tlTruoc)}</Chenh> : "—")
              : (t ? <Chenh ct={ct} d={h.cap.tu - t.tu}>{chenhSo(h.cap.tu - t.tu, ct.dvt)}</Chenh> : "—")}</td>}
            {theo === "DONVI" && (() => { const c = cungKy.get(h.id); const tlCk = c ? tyLeCua(ct, c) : null;
              return <td className="num">{coTyLe
                ? (h.tyLe !== null && tlCk !== null ? <Chenh ct={ct} d={h.tyLe - tlCk}>{dpt(h.tyLe - tlCk)}</Chenh> : "—")
                : (c ? <Chenh ct={ct} d={h.cap.tu - c.tu}>{chenhSo(h.cap.tu - c.tu, ct.dvt)}</Chenh> : "—")}</td>; })()}
            {coNoThu && (() => { const thu = capCua(CHI_TIEU_Q[0], h.id, ky.thang).tu; const r = thu ? h.cap.tu / thu : null;
              return <td className="num"><span className={r !== null && r > 0.08 ? "qd-chenh is-xau" : "qd-chenh is-tot"}><i className="qd-cham" aria-hidden="true"/>{pt(r)}<span className="sr-only">{r !== null && r > 0.08 ? ", vượt mức Cục giao 8%" : ", trong mức Cục giao 8%"}</span></span></td>; })()}
            <td className="num">{moDuoc(h.id) && h.cap.quaHan
              ? <button type="button" className="qd-lien-ket" onClick={() => moCanhBao!(h.id)} aria-label={`${integer(h.cap.quaHan)} việc quá hạn của ${h.ten}, mở cảnh báo nhắc việc`}>{integer(h.cap.quaHan)}<Icon name="arrow" size={13}/></button>
              : h.cap.quaHan ? integer(h.cap.quaHan) : <span className="cell-empty">0</span>}</td>
          </tr>;
        })}
        {coBQ && <tr className="is-tong">
          {coHang && <td/>}
          {/* Số tuyệt đối của dòng này là TỔNG 30 đơn vị, còn tỷ lệ là Σtử/Σmẫu —
              tức bình quân chung theo đúng định nghĩa §6. Nhãn cũ "Bình quân"
              đặt trên một con số tổng là thứ dễ bị trích nhầm vào báo cáo họp. */}
          <th scope="row">Toàn thuế (cộng 30 đơn vị) · tỷ lệ chung</th>
          <td className="num">{so(bq.tu, ct.dvt)}</td>
          {coGiao && <td className="num">{so(bq.mau, ct.dvt)}</td>}
          {coTyLe && <td className="num">{pt(tlBQ, ct.kieu === "TANG")}</td>}
          <td/>
          {theo === "DONVI" && <><td/><td/></>}
          {coNoThu && <td/>}
          <td className="num">{integer(bq.quaHan)}</td>
        </tr>}
      </tbody>
    </table>
  </TableWrap>
  {soTrang > 1 && <div className="table-footer"><span/><Pager trang={trang} soTrang={soTrang} onChange={datTrang}/></div>}
  <CachTinh cot={cotCt}/>
  </CaseLayout>;
}

/* Cán bộ: số của DN mình theo tháng. Có số giao và tỷ lệ (15/10/2026) — cột
   chia đứng ngay cạnh tỷ lệ để đọc ra được phép chia; không có bình quân. */
function BangTheoThang({ ct, pv, ky }: { ct: ChiTieuQ; pv: PhamVi; ky: KyQ }) {
  const thang = Array.from({ length: ky.thang }, (_, i) => i + 1);
  const cap = thang.map((t) => capCua(ct, pv.donVi[0].id, t, 2026, pv.canBo!));
  const coGiao = duocXem(pv.vai, "soGiao"), coTyLe = duocXem(pv.vai, "tyLe");
  const cotCt: CotCt[] = [
    ...(coTyLe ? [{ nhan: "Tỷ lệ", ct: congThucNgan(ct.stt), day: congThucCua(ct) }] : []),
    { nhan: "Phát sinh trong tháng", ct: "Lũy kế − Lũy kế tháng trước" },
    { nhan: "Cùng kỳ 2025", ct: "Lũy kế cùng tháng năm 2025" },
  ];
  return <><TableWrap label={`${ct.ten} theo tháng`}>
    <table className="qd-bang">
      <thead><tr>
        <th scope="col">Tháng</th>
        {/* Cột lũy kế tháng trước đứng ngay cạnh để phát sinh trong tháng là
            một phép trừ đọc được trên cùng dòng (chốt 15/10/2026). */}
        <ThCt nhan={ct.nhanTu}/>
        {coGiao && <ThCt nhan={ct.nhanMau}/>}
        {coTyLe && <ThCt {...cotCt[0]}/>}
        <ThCt nhan="Lũy kế tháng trước"/>
        <ThCt {...cotCt[cotCt.length - 2]}/>
        <ThCt {...cotCt[cotCt.length - 1]}/>
      </tr></thead>
      <tbody>{thang.slice().reverse().map((t) => {
        const i = t - 1;
        const ck = capCua(ct, pv.donVi[0].id, t, 2025, pv.canBo!);
        return <tr key={t}>
          <td>Tháng {t}/2026</td>
          <td className="num"><strong>{so(cap[i].tu, ct.dvt)}</strong></td>
          {coGiao && <td className="num">{so(cap[i].mau, ct.dvt)}</td>}
          {coTyLe && <td className="num"><strong>{pt(tyLeCua(ct, cap[i]), ct.kieu === "TANG")}</strong></td>}
          <td className="num qd-o-phu">{i === 0 ? so(0, ct.dvt) : so(cap[i - 1].tu, ct.dvt)}</td>
          <td className="num">{i === 0 ? so(cap[0].tu, ct.dvt) : chenhSo(cap[i].tu - cap[i - 1].tu, ct.dvt)}</td>
          <td className="num">{so(ck.tu, ct.dvt)}</td>
        </tr>;
      })}</tbody>
    </table>
  </TableWrap><CachTinh cot={cotCt}/></>;
}

function UocThu({ pv }: { pv: PhamVi }) {
  const [nhip, datNhip] = useState<NhipUoc>("NGAY");
  const u = uocThu(pv, nhip);
  const tl = u.uoc ? u.thuc / u.uoc : 0;
  const coTyLe = duocXem(pv.vai, "tyLe") || pv.vai === "CB";
  return <Panel title="Ước thu" subtitle="Số ước đặt đầu tháng 10/2026 · cách chia ước tháng ra ngày và tuần chờ nghiệp vụ xác nhận" actions={
    <NhomNut label="Nhịp ước thu" value={nhip} onChange={datNhip} options={(["NGAY", "TUAN", "THANG"] as NhipUoc[]).map((n) => ({ value: n, label: NHAN_NHIP[n] }))}/>}>
    <div className="qd-uoc">
      <div><span>Ước thu {NHAN_NHIP[nhip].toLowerCase()}</span><strong>{so(u.uoc, "tỷ đồng")}</strong><small>tỷ đồng</small></div>
      <div><span>Đã thu</span><strong>{so(u.thuc, "tỷ đồng")}</strong><small>tỷ đồng</small></div>
      {coTyLe && <div className="qd-uoc-tl"><span>Đạt so với ước</span><strong>{pt(tl)}</strong><span className="qd-thanh is-lon" aria-hidden="true"><i style={{ width: `${Math.min(tl, 1) * 100}%` }}/></span></div>}
    </div>
  </Panel>;
}

/* ---------- Xuất Excel — đúng những cột vai đang được xem ---------- */

function meta(pv: PhamVi, ky: KyQ, actor: string) {
  return { period: ky.nhan, scope: nhanPhamVi(pv), actor, status: "DRAFT" as const };
}

function sheetTongQuan(pv: PhamVi, ky: KyQ): ReportSheet {
  const coTyLe = duocXem(pv.vai, "tyLe"), coGiao = duocXem(pv.vai, "soGiao"), coBQ = duocXem(pv.vai, "binhQuan");
  const headers = ["Chỉ tiêu", "Đơn vị tính", "Số tuyệt đối", ...(coGiao ? ["Mẫu số"] : []), ...(coTyLe ? ["Tỷ lệ"] : []), ...(coBQ ? ["Bình quân toàn thuế"] : []), coTyLe ? "Tháng trước (tỷ lệ)" : "Tháng trước", coTyLe ? "Cùng kỳ 2025 (tỷ lệ)" : "Cùng kỳ 2025"];
  const rows: ReportValue[][] = CHI_TIEU_Q.map((ct) => {
    const kq = ketQuaChiTieu(ct, pv, ky);
    const tl = (c: Cap) => tyLeCua(ct, c);
    return [ct.ten, ct.dvt, kq.nay.tu, ...(coGiao ? [kq.nay.mau] : []), ...(coTyLe ? [tl(kq.nay)] : []), ...(coBQ ? [tl(kq.binhQuan)] : []),
      coTyLe ? tl(kq.thangTruoc) : kq.thangTruoc.tu, coTyLe ? tl(kq.cungKy) : kq.cungKy.tu];
  });
  const percent = headers.map((h, i) => (/Tỷ lệ|tỷ lệ|Bình quân/.test(h) ? i : -1)).filter((i) => i >= 0);
  return { name: "Tong_quan", title: "KẾT QUẢ CÁC MẶT CÔNG TÁC", headers, rows, percent };
}

function sheetChiTiet(ct: ChiTieuQ, pv: PhamVi, ky: KyQ, theo: Theo): ReportSheet {
  const ten = ct.id.replace(/[^a-z0-9]/gi, "_").slice(0, 28);
  if (pv.canBo) {
    const rows: ReportValue[][] = Array.from({ length: ky.thang }, (_, i) => [`Tháng ${i + 1}/2026`, capCua(ct, pv.donVi[0].id, i + 1, 2026, pv.canBo!).tu]);
    return { name: ten, title: ct.ten.toUpperCase(), headers: ["Tháng", `${ct.nhanTu} (${ct.dvt})`], rows };
  }
  const coHang = duocXem(pv.vai, "thuHang"), coGiao = duocXem(pv.vai, "soGiao"), coTyLe = duocXem(pv.vai, "tyLe");
  const motDonVi = pv.donVi.length === 1;
  /* Tệp xuất xếp hạng riêng từng khối, như hai sheet của file chấm điểm. */
  const khoiCo = (["VP", "TCS"] as Khoi[]).filter((k) => pv.vai === "LD" ? pv.donVi.some((d) => d.khoi === k) : k === pv.donVi[0].khoi);
  const hai = theo !== "CANBO" && khoiCo.length > 1;
  const xep = theo === "CANBO" && motDonVi
    ? xepHang(ct, theoCanBo(ct, pv.donVi[0].id, ky.thang)).map((h) => ({ h, khoi: "" }))
    : khoiCo.flatMap((k) => xepHang(ct, theoDonVi(ct, khoiXepHang(pv, k), ky.thang)).map((h) => ({ h, khoi: NHAN_KHOI[k] })));
  const headers = [...(coHang ? ["Hạng"] : []), ...(hai ? ["Khối"] : []), "Đơn vị / cán bộ", `${ct.nhanTu} (${ct.dvt})`, ...(coGiao ? [`${ct.nhanMau} (${ct.dvt})`] : []), ...(coTyLe ? ["Tỷ lệ"] : []), "Việc quá hạn"];
  const rows: ReportValue[][] = xep.map(({ h, khoi }) => [...(coHang ? [h.hang] : []), ...(hai ? [khoi] : []), h.ten, h.cap.tu, ...(coGiao ? [h.cap.mau] : []), ...(coTyLe ? [h.tyLe] : []), h.cap.quaHan]);
  const percent = coTyLe ? [headers.indexOf("Tỷ lệ")] : [];
  return { name: ten, title: ct.ten.toUpperCase(), headers, rows, percent };
}

