import { useMemo, useState } from "react";
import { PageIntro, Panel, TableWrap, integer } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import type { DemoUser } from "@/auth/demoAuth";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportSheet, ReportValue } from "@/domain/reportExport";
import { useThamSo } from "@/state/diaChi";
import {
  CHI_TIEU_Q, DON_VI_Q, KY_Q, NHAN_NHIP, THE_Q, bienDongNo, capCua, chiTieuCuaThe, duocXem, ketQuaChiTieu,
  nhanPhamVi, theoCanBo, theoDonVi, tyLeCua, uocThu, xepHang,
  type Cap, type ChiTieuQ, type KetQuaChiTieu, type KyQ, type NhipUoc, type PhamVi, type TheId,
} from "@/data/qldn";
import { NgoaiPhamVi, ThanhPhamVi, usePhamVi } from "@/features/qldn/PhamViQLDN";

/*
  Mô-đun 2 — Quản trị công việc và kết quả thực hiện (biên bản 09/10/2026 §6).

  "Tổng quan và chi tiết tách riêng. Hai tab khác nhau, không chung một trang.
  Từ tổng quan, click vào chỉ tiêu để mở tab chi tiết tương ứng." (§2.2) Nên
  hàng tab là Tổng quan + một tab cho mỗi thẻ, và thẻ là nút mở tab của nó.

  Mỗi thẻ hiện: số tuyệt đối; tỷ lệ so số giao (từ cấp phòng); chênh lệch so
  bình quân chung toàn thuế; tăng/giảm so cùng kỳ năm trước và tháng trước.
  Cán bộ chỉ có số tuyệt đối (§4), nên so sánh của cán bộ là CHÊNH LỆCH SỐ
  TUYỆT ĐỐI, không phải điểm phần trăm.

  Thang điểm cộng/trừ của file chấm điểm KHÔNG còn ở đây: biên bản yêu cầu
  không nhắc tới điểm, và xếp hạng theo tỷ lệ (§6, chờ chốt).
*/

type Tab = "tongquan" | TheId;
const TAB_HOP_LE: Tab[] = ["tongquan", ...THE_Q.map((t) => t.id)];

/* ---------- Định dạng ---------- */

const so = (x: number, dvt: string) => dvt === "tỷ đồng"
  ? x.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  : integer(Math.round(x));
const pt = (x: number | null, dau = false) => x === null ? "—"
  : `${x < 0 ? "−" : dau && x > 0 ? "+" : ""}${(Math.abs(x) * 100).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const dpt = (d: number) => `${d < 0 ? "−" : "+"}${(Math.abs(d) * 100).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} đpt`;
const chenhSo = (d: number, dvt: string) => `${d < 0 ? "−" : "+"}${so(Math.abs(d), dvt)}`;
/* Viết thường chữ đầu, trừ chữ viết tắt ("NNT", "TTHC") — viết thường cả
   cụm thì ra "nnt phải cưỡng chế". */
const thuong = (s: string) => /^[A-ZĐ]{2,}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);

/* Tốt hay xấu đi theo CHIỀU của chỉ tiêu, không theo dấu: nợ tăng là dấu
   cộng nhưng là tin xấu. */
const tot = (ct: ChiTieuQ, d: number) => d === 0 ? null : ct.kieu === "CAO" ? d > 0 : d < 0;
const lopChenh = (ct: ChiTieuQ, d: number) => { const t = tot(ct, d); return t === null ? "qd-chenh" : t ? "qd-chenh is-tot" : "qd-chenh is-xau"; };

/* ---------- So sánh ba mốc ---------- */

interface MocSoSanh { nhan: string; gia: string | null; chenh: number; ghi: string }

/** Ba mốc so sánh của §2.4, đã lọc theo quyền của vai. */
function mocCua(kq: KetQuaChiTieu, pv: PhamVi, ky: KyQ): MocSoSanh[] {
  const { ct } = kq;
  const coTyLe = duocXem(pv.vai, "tyLe");
  const ra: MocSoSanh[] = [];
  const tl = (c: Cap) => tyLeCua(ct, c) ?? 0;
  if (duocXem(pv.vai, "binhQuan")) {
    const bq = tl(kq.binhQuan);
    ra.push({ nhan: "Bình quân toàn thuế", gia: pt(bq, ct.kieu === "TANG"), chenh: tl(kq.nay) - bq, ghi: dpt(tl(kq.nay) - bq) });
  }
  const truoc = KY_Q.find((k) => k.thang === ky.thang - 1)?.nhan.split(" ·")[0] ?? `Tháng ${ky.thang - 1}/2026`;
  for (const [nhan, c] of [[`Tháng trước (${truoc.replace("Tháng ", "T")})`, kq.thangTruoc], ["Cùng kỳ 2025", kq.cungKy]] as const) {
    if (coTyLe) ra.push({ nhan, gia: pt(tl(c), ct.kieu === "TANG"), chenh: tl(kq.nay) - tl(c), ghi: dpt(tl(kq.nay) - tl(c)) });
    else ra.push({ nhan, gia: `${so(c.tu, ct.dvt)} ${ct.dvt}`, chenh: kq.nay.tu - c.tu, ghi: chenhSo(kq.nay.tu - c.tu, ct.dvt) });
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

export function KetQuaCongTac({ user }: { user: DemoUser }) {
  const { pv, ky, datKy } = usePhamVi(user);
  const [tab, datTab] = useThamSo<Tab>("muc", "tongquan", TAB_HOP_LE);
  if (!pv) return <NgoaiPhamVi/>;

  return <div className="page-stack qd-page">
    <PageIntro title="Kết quả công tác"/>
    <nav className="thanh-muc" aria-label="Mục của kết quả công tác">
      <div className="thanh-muc-hang">
        {TAB_HOP_LE.map((t) => <button
          key={t} type="button"
          className={`muc-tab${tab === t ? " is-active" : ""}`}
          aria-current={tab === t ? "page" : undefined}
          onClick={() => datTab(t)}
        ><span>{t === "tongquan" ? "Tổng quan" : THE_Q.find((x) => x.id === t)!.ngan}</span></button>)}
      </div>
    </nav>
    <ThanhPhamVi pv={pv} ky={ky} datKy={datKy}/>
    {tab === "tongquan"
      ? <TongQuan pv={pv} ky={ky} actor={user.name} moThe={datTab}/>
      : <ChiTietThe key={tab} the={tab} pv={pv} ky={ky} actor={user.name}/>}
  </div>;
}

/* ---------- Tổng quan: các thẻ chỉ tiêu ---------- */

function TongQuan({ pv, ky, actor, moThe }: { pv: PhamVi; ky: KyQ; actor: string; moThe: (t: Tab) => void }) {
  const coTyLe = duocXem(pv.vai, "tyLe");
  const coBQ = duocXem(pv.vai, "binhQuan");
  const ds = useMemo(() => THE_Q.map((t) => ({ the: t, kq: ketQuaChiTieu(chiTieuCuaThe(t.id)[0], pv, ky) })), [pv, ky]);
  const uoc = duocXem(pv.vai, "uocThu") ? uocThu(pv, "THANG") : null;
  const no = duocXem(pv.vai, "noTrenThu") ? ketQuaChiTieu(CHI_TIEU_Q[0], pv, ky) : null;

  const xuat = () => exportExcel([sheetTongQuan(pv, ky)], meta(pv, ky, actor), `ket-qua-cong-tac_tong-quan_${ky.id}.xlsx`);

  return <Panel chinh title="Kết quả các mặt công tác" subtitle={`${nhanPhamVi(pv)} · bấm một thẻ để mở chi tiết`} actions={<ExportButton onExport={xuat}>Xuất Excel</ExportButton>}>
    <div className="qd-the-luoi">
      {ds.map(({ the, kq }) => {
        const { ct } = kq;
        const x = tyLeCua(ct, kq.nay);
        const bq = coBQ ? tyLeCua(ct, kq.binhQuan) : null;
        return <button key={the.id} type="button" className="qd-the" onClick={() => moThe(the.id)}>
          <span className="qd-the-dau"><span className="qd-the-ten">{the.ten}</span></span>
          <strong className="qd-the-so">{so(kq.nay.tu, ct.dvt)}<small>{ct.dvt} · {thuong(ct.nhanTu)}</small></strong>
          {/* Ô tỷ lệ là ô cố định của thẻ: cán bộ thấy ô ấy mang số mẫu
              tuyệt đối thay vì tỷ lệ, để mọi thẻ cao bằng nhau ở mọi vai. */}
          <span className="qd-the-tl">
            {coTyLe && x !== null
              ? <><b>{pt(x, ct.kieu === "TANG")}</b><small>{ct.kieu === "TANG" ? "so với đầu năm" : `so với ${thuong(ct.nhanMau)}`}</small>{ct.kieu !== "TANG" && <ThanhTyLe ct={ct} x={x} bq={bq}/>}</>
              : duocXem(pv.vai, "soGiao") || ct.the !== "thu"
                ? <><b>{so(kq.nay.mau, ct.dvt)}</b><small>{thuong(ct.nhanMau)} ({ct.dvt})</small></>
                /* Mẫu số của thu là SỐ GIAO — cán bộ không có số giao (§4). */
                : <small className="qd-khong-co">Cán bộ không có số giao</small>}
          </span>
          <dl className="qd-the-moc">{mocCua(kq, pv, ky).map((m) => <div key={m.nhan}>
            <dt>{m.nhan}</dt>
            <dd><span className={lopChenh(ct, m.chenh)}>{m.ghi}</span></dd>
          </div>)}</dl>
          {the.id === "thu" && uoc && <span className="qd-the-phu">Ước thu tháng 10: đã thu {pt(uoc.uoc ? uoc.thuc / uoc.uoc : 0)} số ước</span>}
          {the.id === "no" && no && <span className="qd-the-phu">Nợ / thu NSNN: {pt(kq.nay.tu / Math.max(no.nay.tu, 1))} · Cục giao 8%</span>}
          {ct.ghiChu && <span className="qd-the-phu is-cho">KPI chờ thống nhất cách tính</span>}
        </button>;
      })}
    </div>
  </Panel>;
}

/* ---------- Chi tiết một thẻ ---------- */

type Theo = "DONVI" | "CANBO";

function ChiTietThe({ the, pv, ky, actor }: { the: TheId; pv: PhamVi; ky: KyQ; actor: string }) {
  const [theo, datTheo] = useState<Theo>("DONVI");
  const ds = chiTieuCuaThe(the);
  const info = THE_Q.find((t) => t.id === the)!;
  /* "Theo cán bộ" chỉ có nghĩa khi đang xem MỘT đơn vị. */
  const motDonVi = pv.donVi.length === 1 && !pv.canBo;

  const xuat = () => exportExcel(ds.map((ct) => sheetChiTiet(ct, pv, ky, theo)), meta(pv, ky, actor), `ket-qua-cong-tac_${the}_${ky.id}.xlsx`);

  return <>
    {the === "thu" && duocXem(pv.vai, "uocThu") && <UocThu pv={pv}/>}
    {ds.map((ct, i) => <Panel
      key={ct.id}
      chinh={i === 0}
      title={ct.ten}
      subtitle={pv.canBo ? `DN được phân công · ${ct.dvt}` : `${info.ten} · ${ct.dvt}`}
      actions={i === 0 ? <div className="inline-controls">
        {!pv.canBo && <div className="bo-loc-seg" role="group" aria-label="Xem theo">
          <button type="button" aria-pressed={theo === "DONVI" || !motDonVi} onClick={() => datTheo("DONVI")}>Theo đơn vị</button>
          <button type="button" aria-pressed={theo === "CANBO" && motDonVi} disabled={!motDonVi} title={motDonVi ? undefined : "Chọn một đơn vị để xem theo cán bộ"} onClick={() => datTheo("CANBO")}>Theo cán bộ</button>
        </div>}
        <ExportButton onExport={xuat}>Xuất Excel</ExportButton>
      </div> : undefined}
    >
      <TomTatMoc ct={ct} pv={pv} ky={ky}/>
      {ct.ghiChu && <div className="notice info qd-ghi"><strong>Chờ chốt</strong><span>{ct.ghiChu}. Số hồ sơ hiển thị để theo dõi, chưa dùng để đánh giá.</span></div>}
      {pv.canBo
        ? <BangTheoThang ct={ct} pv={pv} ky={ky}/>
        : <BangXepHang ct={ct} pv={pv} ky={ky} theo={motDonVi ? theo : "DONVI"}/>}
    </Panel>)}
    {the === "no" && <BienDongNo pv={pv} ky={ky}/>}
  </>;
}

function TomTatMoc({ ct, pv, ky }: { ct: ChiTieuQ; pv: PhamVi; ky: KyQ }) {
  const kq = ketQuaChiTieu(ct, pv, ky);
  const x = tyLeCua(ct, kq.nay);
  return <div className="qd-tom-tat">
    <div><span>{ct.nhanTu}</span><strong>{so(kq.nay.tu, ct.dvt)}</strong><small>{ct.dvt}</small></div>
    {duocXem(pv.vai, "soGiao") && <div><span>{ct.nhanMau}</span><strong>{so(kq.nay.mau, ct.dvt)}</strong><small>{ct.dvt}</small></div>}
    {duocXem(pv.vai, "tyLe") && <div><span>Tỷ lệ</span><strong>{pt(x, ct.kieu === "TANG")}</strong><small>{ct.kieu === "TANG" ? "so với đầu năm" : `so với ${thuong(ct.nhanMau)}`}</small></div>}
    {mocCua(kq, pv, ky).map((m) => <div key={m.nhan}><span>{m.nhan}</span><strong className={lopChenh(ct, m.chenh)}>{m.ghi}</strong><small>{m.gia}</small></div>)}
  </div>;
}

/* Bảng đơn vị hoặc cán bộ, xếp theo tỷ lệ. Cột hiện theo ma trận quyền. */
function BangXepHang({ ct, pv, ky, theo }: { ct: ChiTieuQ; pv: PhamVi; ky: KyQ; theo: Theo }) {
  const coHang = duocXem(pv.vai, "thuHang");
  const coGiao = duocXem(pv.vai, "soGiao");
  const coTyLe = duocXem(pv.vai, "tyLe");
  const coBQ = duocXem(pv.vai, "binhQuan");
  const cuaToi = pv.vai === "LD" ? null : pv.donVi[0].id;

  /* Trưởng phòng "thấy phòng mình đứng ở đâu so với các phòng khác" (§3):
     bảng đơn vị của trưởng/phó phòng là cả khối của phòng, chứ không chỉ
     một dòng của chính phòng. */
  const dsDonVi = pv.vai === "LD" ? pv.donVi : DON_VI_Q.filter((d) => d.khoi === pv.donVi[0].khoi);
  const dong = theo === "CANBO" ? theoCanBo(ct, pv.donVi[0].id, ky.thang) : theoDonVi(ct, dsDonVi, ky.thang);
  const hang = xepHang(ct, dong);
  const bq = ketQuaChiTieu(ct, pv, ky).binhQuan;
  const tlBQ = tyLeCua(ct, bq);
  const truoc = new Map(dong.map((d) => [d.id, theo === "CANBO" ? null : capCua(ct, d.id, ky.thang - 1)]));

  return <TableWrap label={`${ct.ten} theo ${theo === "CANBO" ? "cán bộ" : "đơn vị"}`}>
    <table className="qd-bang">
      <thead><tr>
        {coHang && <th scope="col" className="num">Hạng</th>}
        <th scope="col">{theo === "CANBO" ? "Cán bộ" : "Đơn vị"}</th>
        <th scope="col" className="num">{ct.nhanTu}</th>
        {coGiao && <th scope="col" className="num">{ct.nhanMau}</th>}
        {coTyLe && <th scope="col" className="num">Tỷ lệ</th>}
        {coBQ && <th scope="col" className="num">So bình quân</th>}
        {theo === "DONVI" && <th scope="col" className="num">So tháng trước</th>}
        <th scope="col" className="num">Việc quá hạn</th>
      </tr></thead>
      <tbody>
        {hang.map((h) => {
          const t = truoc.get(h.id);
          const tlTruoc = t ? tyLeCua(ct, t) : null;
          return <tr key={h.id} className={h.id === cuaToi ? "is-selected" : undefined}>
            {coHang && <td className="num">{h.hang}</td>}
            <td>{h.ten}{h.id === cuaToi && <span className="qd-cua-toi"> · đơn vị của tôi</span>}</td>
            <td className="num"><strong>{so(h.cap.tu, ct.dvt)}</strong></td>
            {coGiao && <td className="num">{so(h.cap.mau, ct.dvt)}</td>}
            {coTyLe && <td className="num"><span className="qd-o-thanh">{ct.kieu !== "TANG" && <ThanhTyLe ct={ct} x={h.tyLe ?? 0} bq={tlBQ}/>}<span>{pt(h.tyLe, ct.kieu === "TANG")}</span></span></td>}
            {coBQ && <td className="num">{h.tyLe !== null && tlBQ !== null ? <span className={lopChenh(ct, h.tyLe - tlBQ)}>{dpt(h.tyLe - tlBQ)}</span> : "—"}</td>}
            {theo === "DONVI" && <td className="num">{coTyLe
              ? (h.tyLe !== null && tlTruoc !== null ? <span className={lopChenh(ct, h.tyLe - tlTruoc)}>{dpt(h.tyLe - tlTruoc)}</span> : "—")
              : (t ? <span className={lopChenh(ct, h.cap.tu - t.tu)}>{chenhSo(h.cap.tu - t.tu, ct.dvt)}</span> : "—")}</td>}
            <td className="num">{h.cap.quaHan ? integer(h.cap.quaHan) : <span className="cell-empty">0</span>}</td>
          </tr>;
        })}
        {coBQ && <tr className="is-tong">
          {coHang && <td/>}
          <th scope="row">Bình quân chung toàn thuế (30 đơn vị)</th>
          <td className="num">{so(bq.tu, ct.dvt)}</td>
          {coGiao && <td className="num">{so(bq.mau, ct.dvt)}</td>}
          {coTyLe && <td className="num">{pt(tlBQ, ct.kieu === "TANG")}</td>}
          <td/>
          {theo === "DONVI" && <td/>}
          <td className="num">{integer(bq.quaHan)}</td>
        </tr>}
      </tbody>
    </table>
  </TableWrap>;
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

/* Biến động nợ theo đơn vị — biên bản demo 09/10 mục 2. */
function BienDongNo({ pv, ky }: { pv: PhamVi; ky: KyQ }) {
  if (pv.canBo) return null;
  const coNoThu = duocXem(pv.vai, "noTrenThu");
  const ds = pv.vai === "LD" ? pv.donVi : DON_VI_Q.filter((d) => d.khoi === pv.donVi[0].khoi);
  const hang = bienDongNo(ds, ky);
  const ct = CHI_TIEU_Q[1];
  return <Panel title="Biến động nợ theo đơn vị" subtitle="Tỷ đồng · so với đầu năm, tháng trước và tỷ trọng nợ trên thu NSNN">
    <div className="qd-ghi-doi">
      <div className="notice warning"><strong>Chưa bóc nợ đất</strong><span>Nợ đất đang cộng vào nợ của các phòng QLDN; chờ bài toán bóc tách theo tiểu mục về Phòng Quản lý đất.</span></div>
      <div className="notice warning"><strong>Chưa loại trường hợp đặc thù</strong><span>Bảo lãnh, nộp theo quyết định, tạm hoãn xuất cảnh; chờ file danh sách loại trừ từ phòng đầu mối.</span></div>
    </div>
    <TableWrap label="biến động nợ theo đơn vị">
      <table className="qd-bang">
        <thead><tr>
          <th scope="col">Đơn vị</th>
          <th scope="col" className="num">Tổng nợ</th>
          <th scope="col" className="num">So với đầu năm</th>
          <th scope="col" className="num">So với tháng trước</th>
          {coNoThu && <th scope="col" className="num">Nợ / thu NSNN</th>}
        </tr></thead>
        <tbody>{hang.map((h) => <tr key={h.dv.id} className={pv.vai !== "LD" && h.dv.id === pv.donVi[0].id ? "is-selected" : undefined}>
          <td>{h.dv.ngan}</td>
          <td className="num"><strong>{so(h.no, ct.dvt)}</strong></td>
          <td className="num"><span className={lopChenh(ct, h.no - h.dauNam)}>{chenhSo(h.no - h.dauNam, ct.dvt)}</span><small>{pt((h.no - h.dauNam) / h.dauNam, true)}</small></td>
          <td className="num"><span className={lopChenh(ct, h.no - h.thangTruoc)}>{chenhSo(h.no - h.thangTruoc, ct.dvt)}</span><small>{pt((h.no - h.thangTruoc) / h.thangTruoc, true)}</small></td>
          {coNoThu && <td className="num"><span className={h.noTrenThu !== null && h.noTrenThu > 0.08 ? "qd-chenh is-xau" : "qd-chenh is-tot"}>{pt(h.noTrenThu)}</span><small>Cục giao 8%</small></td>}
        </tr>)}</tbody>
      </table>
    </TableWrap>
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
  const ds = pv.vai === "LD" ? pv.donVi : DON_VI_Q.filter((d) => d.khoi === pv.donVi[0].khoi);
  const dong = theo === "CANBO" && motDonVi ? theoCanBo(ct, pv.donVi[0].id, ky.thang) : theoDonVi(ct, ds, ky.thang);
  const headers = [...(coHang ? ["Hạng"] : []), "Đơn vị / cán bộ", `${ct.nhanTu} (${ct.dvt})`, ...(coGiao ? [`${ct.nhanMau} (${ct.dvt})`] : []), ...(coTyLe ? ["Tỷ lệ"] : []), "Việc quá hạn"];
  const rows: ReportValue[][] = xepHang(ct, dong).map((h) => [...(coHang ? [h.hang] : []), h.ten, h.cap.tu, ...(coGiao ? [h.cap.mau] : []), ...(coTyLe ? [h.tyLe] : []), h.cap.quaHan]);
  const percent = coTyLe ? [headers.indexOf("Tỷ lệ")] : [];
  return { name: ten, title: ct.ten.toUpperCase(), headers, rows, percent };
}

