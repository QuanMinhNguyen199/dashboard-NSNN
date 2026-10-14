import { useMemo, useState, type ReactNode } from "react";
import { Icon, PageIntro, Pager, Panel, TableWrap, integer } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import type { DemoUser } from "@/auth/demoAuth";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportSheet, ReportValue } from "@/domain/reportExport";
import { useThamSo } from "@/state/diaChi";
import {
  CHI_TIEU_Q, DON_VI_Q, KY_Q, NHAN_KHOI, NHAN_NHIP, NHOM_Q, THE_Q, capCua, chiTieuCuaThe, duocXem, ketQuaChiTieu,
  nhanPhamVi, nhomCuaThe, theoCanBo, theoDonVi, tyLeCua, uocThu, xepHang,
  type Cap, type ChiTieuQ, type KetQuaChiTieu, type Khoi, type KyQ, type NhipUoc, type NhomId, type PhamVi, type TheId,
} from "@/data/qldn";
import { NgoaiPhamVi, ThanhPhamVi, usePhamVi } from "@/features/qldn/PhamViQLDN";
import { HangTab } from "@/components/MucPhanHe";
import { BAO_CAO_CUA_THE, BaoCaoPhanHe, coBaoCao } from "@/features/qldn/BaoCaoPhanHe";

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
const pt = (x: number | null, dau = false) => x === null ? "—"
  : `${x < 0 ? "−" : dau && x > 0 ? "+" : ""}${(Math.abs(x) * 100).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
/* Chênh lệch dưới 0,05 điểm phần trăm làm tròn ra "0,0": nó là NGANG mốc,
   không được mang dấu hay màu — "−0,0 đpt" tô đỏ là báo một tin xấu không có. */
const NGUONG = 0.0005;
const dpt = (d: number) => Math.abs(d) < NGUONG ? "0,0 đpt"
  : `${d < 0 ? "−" : "+"}${(Math.abs(d) * 100).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} đpt`;
const chenhSo = (d: number, dvt: string) => `${d < 0 ? "−" : "+"}${so(Math.abs(d), dvt)}`;
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
    {t === false && <Icon name="alert" size={10}/>}{children}<span className="sr-only">, {nghiaChenh(ct, d)}</span>
  </span>;
}

/* ---------- So sánh ba mốc ---------- */

/* `dem` = mốc là một PHÉP ĐẾM, không phải chênh lệch (xem ô BQ toàn TP). */
interface MocSoSanh { nhan: string; ngan: string; gia: string | null; chenh: number; ghi: string; dem?: boolean }

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
    ra.push({ nhan: "Số đơn vị kém hơn bình quân toàn thuế", ngan: "Dưới BQ", gia: `${kem} trên ${DON_VI_Q.length} đơn vị`, chenh: 0, ghi: `${kem}/${DON_VI_Q.length}`, dem: true });
  } else if (duocXem(pv.vai, "binhQuan")) {
    const bq = tl(kq.binhQuan);
    ra.push({ nhan: "Bình quân toàn thuế", ngan: "BQ", gia: pt(bq, ct.kieu === "TANG"), chenh: tl(kq.nay) - bq, ghi: dpt(tl(kq.nay) - bq) });
  }
  const truoc = KY_Q.find((k) => k.thang === ky.thang - 1)?.nhan.split(" ·")[0] ?? `Tháng ${ky.thang - 1}/2026`;
  const tTruoc = truoc.replace("Tháng ", "T").replace("/2026", "");
  for (const [nhan, ngan, c] of [[`Tháng trước (${truoc.replace("Tháng ", "T")})`, tTruoc, kq.thangTruoc], ["Cùng kỳ 2025", "CK", kq.cungKy]] as const) {
    if (coTyLe) ra.push({ nhan, ngan, gia: pt(tl(c), ct.kieu === "TANG"), chenh: tl(kq.nay) - tl(c), ghi: dpt(tl(kq.nay) - tl(c)) });
    else ra.push({ nhan, ngan, gia: `${so(c.tu, ct.dvt)} ${ct.dvt}`, chenh: kq.nay.tu - c.tu, ghi: chenhSo(kq.nay.tu - c.tu, ct.dvt) });
  }
  return ra;
}

/* Thanh tỷ lệ với vạch bình quân. Chỉ tiêu "thấp là tốt" có tỷ lệ nhỏ, nên
   thang của nó co theo số lớn nhất để thanh không dẹt về 0. */
function ThanhTyLe({ ct, x, bq }: { ct: ChiTieuQ; x: number; bq: number | null }) {
  const tran = ct.kieu === "CAO" ? 1 : Math.max(x, bq ?? 0, 0.01) * 1.3;
  const w = (v: number) => `${Math.min(Math.max(v / tran, 0), 1) * 100}%`;
  return <span className="qd-thanh" aria-hidden="true">
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
type Xem = "" | "baocao";
export function KetQuaCongTac({ user, nhom: nhomId, moNhom, moCanhBao }: {
  user: DemoUser;
  nhom?: NhomId;
  moNhom?: (nhom: NhomId, the: TheId) => void;
  moCanhBao?: (dvId: string) => void;
}) {
  const { pv, ky, datKy } = usePhamVi(user);
  const [theURL, datThe] = useThamSo<TheId | "">("nhom", "", ["", ...THE_HOP_LE]);
  /* Tham số `bc`, KHÔNG phải `xem`: các phân hệ đã dùng `xem` cho bản xem
     trước báo cáo và tự xoá nó khi dựng — dùng chung tên thì báo cáo nhúng
     xoá luôn trạng thái "đang mở Báo cáo", tải lại trang là rơi về Kết quả. */
  const [xem, datXem] = useThamSo<Xem>("bc", "", ["", "baocao"]);
  if (!pv) return <NgoaiPhamVi/>;

  const nhom = nhomId ? NHOM_Q.find((n) => n.id === nhomId)! : null;
  /* Nhóm nhỏ trong địa chỉ chỉ có nghĩa khi nó thuộc nhóm lớn đang mở. */
  const the = nhom ? (theURL && nhom.the.includes(theURL) ? theURL : nhom.the[0]) : null;
  /* Báo cáo là bản của PHÒNG (phòng gửi, phòng duyệt): đang xem khối thuế cơ
     sở thì không có công tắc Báo cáo, tránh mở nhầm bản của phòng mình dưới
     tiêu đề thuế cơ sở. */
  const bc = the && coBaoCao(user) && !pv.phongGoc ? BAO_CAO_CUA_THE[the] ?? null : null;
  const moBaoCao = Boolean(bc && xem === "baocao");
  const moThe = (t: TheId) => moNhom?.(nhomCuaThe(t).id, t);

  return <div className="page-stack qd-page">
    <PageIntro title={nhom ? nhom.ten : "Tổng quan kết quả công tác"}/>
    {nhom && <nav className="thanh-muc" aria-label={`Nhóm chỉ tiêu của ${nhom.ten.toLowerCase()}`}>
      {/* Nhóm nhỏ là hàng tab CHÍNH của màn nhóm. Nhóm chỉ có một nhóm nhỏ
          (Thu NSNN, TTHC) không dựng hàng tab: một hàng luôn đúng một nút là
          một hàng không bấm được gì. */}
      {nhom.the.length > 1 && <HangTab lop="thanh-muc-hang" khoaMo={the ?? ""}>
        {nhom.the.map((t) => <button
          key={t} type="button"
          className={`muc-tab${the === t ? " is-active" : ""}`}
          data-mo={the === t ? "1" : undefined}
          aria-current={the === t && !bc ? "page" : undefined}
          onClick={() => { datThe(t); datXem(""); }}
        ><span>{THE_Q.find((x) => x.id === t)!.ngan}</span></button>)}
      </HangTab>}
      {bc && <HangTab lop={`thanh-muc-hang is-con${nhom.the.length > 1 ? "" : " is-don"}`} khoaMo={xem}>
        <button type="button" className={`muc-tab-con${!moBaoCao ? " is-active" : ""}`} data-mo={!moBaoCao ? "1" : undefined} aria-current={!moBaoCao ? "page" : undefined} onClick={() => datXem("")}>Kết quả</button>
        <button type="button" className={`muc-tab-con${moBaoCao ? " is-active" : ""}`} data-mo={moBaoCao ? "1" : undefined} aria-current={moBaoCao ? "page" : undefined} onClick={() => datXem("baocao")}>Báo cáo: {bc.nhan}</button>
      </HangTab>}
    </nav>}
    {/* Báo cáo phân hệ có thanh lọc kỳ và đơn vị của riêng nó (mỗi báo cáo
        một nhịp kỳ), nên thanh phạm vi của khối QLDN chỉ đứng với "Kết quả". */}
    {!moBaoCao && <ThanhPhamVi pv={pv} ky={ky} datKy={datKy}/>}
    <div className="qd-results" data-motion="content" data-motion-key={`${nhomId ?? "tq"}-${the}-${xem}-${ky.id}-${pv.donVi.map((d) => d.id).join(",")}`}>
      {!the ? <TongQuan pv={pv} ky={ky} actor={user.name} moThe={moThe}/>
        : moBaoCao ? <BaoCaoPhanHe bc={bc!} user={user}/>
        : <ChiTietThe key={the} the={the} pv={pv} ky={ky} actor={user.name} moCanhBao={moCanhBao}/>}
    </div>
  </div>;
}
/* ---------- Tổng quan: các thẻ chỉ tiêu ---------- */

function TongQuan({ pv, ky, actor, moThe }: { pv: PhamVi; ky: KyQ; actor: string; moThe: (t: TheId) => void }) {
  const coTyLe = duocXem(pv.vai, "tyLe");
  const coBQ = duocXem(pv.vai, "binhQuan");
  const ds = useMemo(() => THE_Q.map((t) => ({ the: t, kq: ketQuaChiTieu(chiTieuCuaThe(t.id)[0], pv, ky) })), [pv, ky]);
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
    <div className="qd-overview-guide"><span>Bấm một ô để xem chi tiết</span><span>{coBQ && "BQ: bình quân toàn thuế · "}T{ky.thang - 1}: tháng trước · CK: cùng kỳ 2025 <b>{coChenh ? "Chênh lệch: điểm phần trăm" : "Chênh lệch: số tuyệt đối"}</b></span></div>
    <div className="qd-kq">
      {NHOM_Q.map((n) => <section key={n.id} className={`qd-kq-nhom is-${n.id}`} aria-labelledby={`qd-kq-${n.id}`} style={{ ["--o" as string]: n.the.length }}>
        {/* Tên nhóm luôn là tên đầy đủ ("Công tác thu NSNN"): tên ngắn trùng
            đúng tên ô duy nhất bên trong, đọc ra một nhãn lặp hai lần. */}
        <h3 className="qd-kq-tieu-de" id={`qd-kq-${n.id}`} title={n.ten}>{n.ten}{n.the.length > 1 && <small>{n.the.length} chỉ tiêu</small>}</h3>
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
              <strong className="qd-kq-so"><b key={ky.id}>{so(kq.nay.tu, ct.dvt)}</b><small>{ct.dvt} · {thuong(ct.nhanTu)}</small></strong>
              {/* Ô cố định: có tỷ lệ thì là tỷ lệ, cán bộ thì là mẫu số tuyệt đối. */}
              <span className="qd-kq-tl">
                {coTyLe && x !== null
                  ? <><b key={ky.id}>{pt(x, ct.kieu === "TANG")}</b>{ct.kieu === "TANG" ? <small>so với đầu năm</small>
                      /* Chỉ tiêu "thấp là tốt" (tồn quá hạn) KHÔNG có thanh: thang
                         0–100% làm 5,8% dẹt về 0, còn thang co theo số lớn nhất
                         làm 5,8% trông đầy gần bằng 84,8% của ô bên cạnh. Ô nói
                         thẳng chiều tốt của nó thay cho một hình vẽ đánh lừa. */
                      : ct.kieu === "THAP" ? <small>thấp hơn là tốt</small> : <ThanhMoc ct={ct} x={x} bq={bq}/>}</>
                  : duocXem(pv.vai, "soGiao") || ct.the !== "thu"
                    ? <><b>{so(kq.nay.mau, ct.dvt)}</b><small>{thuong(ct.nhanMau)}</small></>
                    /* Mẫu số của thu là SỐ GIAO — cán bộ không có số giao (§4). */
                    : <small className="qd-khong-co">Không có số giao</small>}
              </span>
              <span className="qd-kq-moc" style={{ gridTemplateColumns: `repeat(${coBQ ? 3 : 2}, auto)` }}>{moc.map((m) => <span key={m.nhan}><em>{m.ngan}</em><Moc ct={ct} m={m}/></span>)}</span>
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
  return <span className="qd-sc-thanh" aria-hidden="true">
    <i style={{ transform: `scaleX(${f(x)})` }}/>
    {bq !== null && <span className="qd-sc-bq" style={{ transform: `translateX(${f(bq) * 100}%)` }}><b/></span>}
  </span>;
}

/* ---------- Chi tiết một thẻ ---------- */

type Theo = "DONVI" | "CANBO";

/*
  MỘT khối cho một nhóm nhỏ (chốt 12/10/2026). Nhóm nhỏ có hai chỉ tiêu — số
  NNT và số tiền, gói và phát sinh mới — dùng một công tắc thay vì hai bảng
  xếp chồng: với lãnh đạo, hai bảng 30 đơn vị là gần bốn màn cuộn để so hai
  con số mà người đọc vốn chỉ xem từng cái một. Tệp Excel vẫn xuất đủ cả hai.
*/
function ChiTietThe({ the, pv, ky, actor, moCanhBao }: { the: TheId; pv: PhamVi; ky: KyQ; actor: string; moCanhBao?: (dvId: string) => void }) {
  const [theo, datTheo] = useState<Theo>("DONVI");
  const ds = chiTieuCuaThe(the);
  const [ctId, datCtId] = useState(ds[0].id);
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
        {!pv.canBo && <div className="bo-loc-seg" role="group" aria-label="Xem theo">
          <button type="button" aria-pressed={theo === "DONVI" || !motDonVi} onClick={() => datTheo("DONVI")}>Theo đơn vị</button>
          <button type="button" aria-pressed={theo === "CANBO" && motDonVi} disabled={!motDonVi} title={motDonVi ? undefined : "Chọn một đơn vị để xem theo cán bộ"} onClick={() => datTheo("CANBO")}>Theo cán bộ</button>
        </div>}
        <ExportButton onExport={xuat}>Xuất Excel</ExportButton>
      </div>}
    >
      {ds.length > 1 && <div className="qd-cong-tac">
        <div className="bo-loc-seg" role="group" aria-label="Chỉ tiêu">
          {ds.map((x) => <button key={x.id} type="button" aria-pressed={x.id === ct.id} onClick={() => datCtId(x.id)}>{x.ngan ?? x.ten}</button>)}
        </div>
      </div>}
      <TomTatMoc ct={ct} pv={pv} ky={ky}/>
      {ct.ghiChu && <div className="notice info qd-ghi"><strong>Chờ chốt</strong><span>{ct.ghiChu}. Số hồ sơ hiển thị để theo dõi, chưa dùng để đánh giá.</span></div>}
      {/* Hai việc đang chờ của biên bản demo 09/10 gom thành MỘT dòng. */}
      {the === "no" && <p className="qd-ghi-mot">
        <b>Chưa bóc nợ đất, chưa loại trường hợp đặc thù.</b> Nợ đất đang cộng vào nợ các phòng QLDN; bảo lãnh, nộp theo quyết định, tạm hoãn xuất cảnh vẫn nằm trong số nợ. Chờ bài toán bóc tách và file loại trừ của phòng đầu mối.
      </p>}
      {pv.canBo
        ? <BangTheoThang key={ct.id} ct={ct} pv={pv} ky={ky}/>
        : <BangXepHang key={`${ct.id}-${theo}`} ct={ct} pv={pv} ky={ky} theo={motDonVi ? theo : "DONVI"} moCanhBao={moCanhBao}/>}
    </Panel>
  </>;
}

function TomTatMoc({ ct, pv, ky }: { ct: ChiTieuQ; pv: PhamVi; ky: KyQ }) {
  const kq = ketQuaChiTieu(ct, pv, ky);
  const x = tyLeCua(ct, kq.nay);
  return <div className="qd-tom-tat">
    <div><span>{ct.nhanTu}</span><strong>{so(kq.nay.tu, ct.dvt)}</strong><small>{ct.dvt}</small></div>
    {duocXem(pv.vai, "soGiao") && <div><span>{ct.nhanMau}</span><strong>{so(kq.nay.mau, ct.dvt)}</strong><small>{ct.dvt}</small></div>}
    {duocXem(pv.vai, "tyLe") && <div><span>Tỷ lệ</span><strong>{pt(x, ct.kieu === "TANG")}</strong><small>{ct.kieu === "TANG" ? "so với đầu năm" : `so với ${thuong(ct.nhanMau)}`}</small></div>}
    {mocCua(kq, pv, ky).map((m) => <div key={m.nhan}><span>{m.nhan}</span><strong>{m.dem ? <span className="qd-chenh is-dem">{m.ghi}</span> : <Chenh ct={ct} d={m.chenh}>{m.ghi}</Chenh>}</strong><small>{m.gia}</small></div>)}
  </div>;
}

/** Đơn vị được xếp hạng cùng nhau: lãnh đạo — phần của khối đang chọn trong phạm vi; các vai khác — cả khối của đơn vị mình. */
function khoiXepHang(pv: PhamVi, khoi: Khoi) {
  if (pv.vai !== "LD") return DON_VI_Q.filter((d) => d.khoi === pv.donVi[0].khoi);
  const cua = pv.donVi.filter((d) => d.khoi === khoi);
  return cua.length ? cua : pv.donVi;
}

/* Bảng đơn vị hoặc cán bộ, xếp theo tỷ lệ. Cột hiện theo ma trận quyền. */
function BangXepHang({ ct, pv, ky, theo, moCanhBao }: { ct: ChiTieuQ; pv: PhamVi; ky: KyQ; theo: Theo; moCanhBao?: (dvId: string) => void }) {
  const coHang = duocXem(pv.vai, "thuHang");
  const coGiao = duocXem(pv.vai, "soGiao");
  const coTyLe = duocXem(pv.vai, "tyLe");
  const coBQ = duocXem(pv.vai, "binhQuan");
  /* Đang xem khối thuế cơ sở thì không có dòng nào là "đơn vị của tôi". */
  const cuaToi = pv.vai === "LD" || pv.phongGoc ? null : pv.donVi[0].id;

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

  /* Mười dòng một trang: bảng 30 đơn vị của lãnh đạo dài hơn hai màn. Bảng
     của phòng (5 phòng, ≤18 cán bộ) thường vừa một hoặc hai trang. */
  const [trang, datTrang] = useState(1);
  const CO = 10;
  const soTrang = Math.max(1, Math.ceil(hang.length / CO));
  const trongTrang = hang.slice((trang - 1) * CO, trang * CO);

  return <>
  {haiKhoi && theo === "DONVI" && <div className="qd-khoi-xep">
    <span className="bo-loc-nhan">Xếp hạng trong</span>
    <div className="bo-loc-seg" role="group" aria-label="Khối xếp hạng">
      {(["VP", "TCS"] as Khoi[]).map((k) => <button key={k} type="button" aria-pressed={khoiXem === k} onClick={() => { datKhoiXem(k); datTrang(1); }}>
        {NHAN_KHOI[k]} · {pv.donVi.filter((d) => d.khoi === k).length}
      </button>)}
    </div>
  </div>}
  <TableWrap label={`${ct.ten} theo ${theo === "CANBO" ? "cán bộ" : "đơn vị"}`}>
    <table className="qd-bang">
      <thead><tr>
        {coHang && <th scope="col" className="num">Hạng</th>}
        <th scope="col">{theo === "CANBO" ? "Cán bộ" : "Đơn vị"}</th>
        <th scope="col" className="num">{ct.nhanTu}</th>
        {coGiao && <th scope="col" className="num">{ct.nhanMau}</th>}
        {coTyLe && <th scope="col" className="num">Tỷ lệ</th>}
        {coBQ && <th scope="col" className="num">So bình quân</th>}
        {theo === "DONVI" && <th scope="col" className="num">So tháng trước</th>}
        {coNoThu && <th scope="col" className="num">Nợ / thu NSNN</th>}
        <th scope="col" className="num">Việc quá hạn</th>
      </tr></thead>
      <tbody>
        {trongTrang.map((h) => {
          const t = truoc.get(h.id);
          const tlTruoc = t ? tyLeCua(ct, t) : null;
          return <tr key={h.id} className={h.id === cuaToi ? "is-selected" : undefined}>
            {coHang && <td className="num">{h.hang}</td>}
            <td>{h.ten}{h.id === cuaToi && <span className="qd-cua-toi"> · đơn vị của tôi</span>}</td>
            <td className="num"><strong>{so(h.cap.tu, ct.dvt)}</strong></td>
            {coGiao && <td className="num">{so(h.cap.mau, ct.dvt)}</td>}
            {coTyLe && <td className="num"><span className="qd-o-thanh">{ct.kieu === "CAO" && <ThanhTyLe ct={ct} x={h.tyLe ?? 0} bq={tlBQ}/>}<span>{pt(h.tyLe, ct.kieu === "TANG")}</span></span></td>}
            {coBQ && <td className="num">{h.tyLe !== null && tlBQ !== null ? <Chenh ct={ct} d={h.tyLe - tlBQ}>{dpt(h.tyLe - tlBQ)}</Chenh> : "—"}</td>}
            {theo === "DONVI" && <td className="num">{coTyLe
              ? (h.tyLe !== null && tlTruoc !== null ? <Chenh ct={ct} d={h.tyLe - tlTruoc}>{dpt(h.tyLe - tlTruoc)}</Chenh> : "—")
              : (t ? <Chenh ct={ct} d={h.cap.tu - t.tu}>{chenhSo(h.cap.tu - t.tu, ct.dvt)}</Chenh> : "—")}</td>}
            {coNoThu && (() => { const thu = capCua(CHI_TIEU_Q[0], h.id, ky.thang).tu; const r = thu ? h.cap.tu / thu : null;
              return <td className="num"><span className={r !== null && r > 0.08 ? "qd-chenh is-xau" : "qd-chenh is-tot"}>{pt(r)}</span><small>Cục giao 8%</small></td>; })()}
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
          {theo === "DONVI" && <td/>}
          {coNoThu && <td/>}
          <td className="num">{integer(bq.quaHan)}</td>
        </tr>}
      </tbody>
    </table>
  </TableWrap>
  <div className="table-footer">
    <div className="qd-chan-trai">
      <div className="bo-loc-seg" role="group" aria-label="Thứ tự xếp hạng">
        <button type="button" aria-pressed={!kemTruoc} onClick={() => { datKemTruoc(false); datTrang(1); }}>Tốt nhất trước</button>
        <button type="button" aria-pressed={kemTruoc} onClick={() => { datKemTruoc(true); datTrang(1); }}>Kém nhất trước</button>
      </div>
      <span>{integer(hang.length)} {theo === "CANBO" ? "cán bộ" : "đơn vị"} · xếp theo tỷ lệ</span>
    </div>
    {soTrang > 1 && <Pager trang={trang} soTrang={soTrang} onChange={datTrang}/>}
  </div>
  </>;
}

/* Cán bộ: không có số giao, tỷ lệ, bình quân — chỉ số tuyệt đối theo tháng. */
function BangTheoThang({ ct, pv, ky }: { ct: ChiTieuQ; pv: PhamVi; ky: KyQ }) {
  const thang = Array.from({ length: ky.thang }, (_, i) => i + 1);
  const cap = thang.map((t) => capCua(ct, pv.donVi[0].id, t, 2026, pv.canBo!));
  return <TableWrap label={`${ct.ten} theo tháng`}>
    <table className="qd-bang">
      <thead><tr>
        <th scope="col">Tháng</th>
        <th scope="col" className="num">{ct.nhanTu} lũy kế</th>
        <th scope="col" className="num">Phát sinh trong tháng</th>
        <th scope="col" className="num">Cùng kỳ 2025</th>
      </tr></thead>
      <tbody>{thang.slice().reverse().map((t) => {
        const i = t - 1;
        const ck = capCua(ct, pv.donVi[0].id, t, 2025, pv.canBo!);
        return <tr key={t}>
          <td>Tháng {t}/2026</td>
          <td className="num"><strong>{so(cap[i].tu, ct.dvt)}</strong></td>
          <td className="num">{i === 0 ? so(cap[0].tu, ct.dvt) : chenhSo(cap[i].tu - cap[i - 1].tu, ct.dvt)}</td>
          <td className="num">{so(ck.tu, ct.dvt)}</td>
        </tr>;
      })}</tbody>
    </table>
  </TableWrap>;
}

function UocThu({ pv }: { pv: PhamVi }) {
  const [nhip, datNhip] = useState<NhipUoc>("NGAY");
  const u = uocThu(pv, nhip);
  const tl = u.uoc ? u.thuc / u.uoc : 0;
  const coTyLe = duocXem(pv.vai, "tyLe") || pv.vai === "CB";
  return <Panel title="Ước thu" subtitle="Số ước đặt đầu tháng 10/2026 · cách chia ước tháng ra ngày và tuần chờ nghiệp vụ xác nhận" actions={
    <div className="bo-loc-seg" role="group" aria-label="Nhịp ước thu">
      {(["NGAY", "TUAN", "THANG"] as NhipUoc[]).map((n) => <button key={n} type="button" aria-pressed={nhip === n} onClick={() => datNhip(n)}>{NHAN_NHIP[n]}</button>)}
    </div>}>
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
  const headers = ["Chỉ tiêu", "Đơn vị tính", "Số tuyệt đối", ...(coGiao ? ["Mẫu số / số giao"] : []), ...(coTyLe ? ["Tỷ lệ"] : []), ...(coBQ ? ["Bình quân toàn thuế"] : []), coTyLe ? "Tháng trước (tỷ lệ)" : "Tháng trước", coTyLe ? "Cùng kỳ 2025 (tỷ lệ)" : "Cùng kỳ 2025"];
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
    return { name: ten, title: ct.ten.toUpperCase(), headers: ["Tháng", `${ct.nhanTu} lũy kế (${ct.dvt})`], rows };
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

