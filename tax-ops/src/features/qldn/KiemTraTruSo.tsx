import { Fragment, useState, type ReactNode } from "react";
import { Button as AriaButton, Disclosure, DisclosurePanel } from "react-aria-components";
import { useThamSo } from "@/state/diaChi";
import { Button, Checkbox, Icon, integer, MenuPop, NhomNut, Panel, SelectMenu, TableWrap } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { exportExcel } from "@/domain/reportFiles";
import { xuatWordKiemTra } from "@/domain/baoCaoKiemTraWord";
import { xepHangGiaTri } from "@/domain/xepHangKiemTra";
import type { ReportSheet, ReportValue } from "@/domain/reportExport";
import type { KyQ } from "@/data/qldn";
import {
  DON_VI_KT, LOAI_HINH, NHAN_CUM_KT, NHAN_KHOI_KT, PHONG_KT, binhQuan, laCum, laKhoi, noDong, soLieuKT, ssCungKySo, ssCungKyThu, tenPhamViKT, tyLeDonDoc, tyLeHT,
  type ChiSoKT, type CumKT, type DonViKT, type KhoiKT, type LoaiHinh, type PhamViKT, type SoLieuKT,
} from "@/data/kiemTra";

/*
  Mục "Phòng kiểm tra" › tab "Kiểm tra tại trụ sở NNT" (30/10/2026). Tab
  "Tổng quan" dựng ngày 02/11/2026 đã bỏ ngày 03/11/2026; mọi khối của nó
  chuyển về đây.

  Khối chính là BẢNG của mẫu "Đầu ra - Biểu excel báo cáo", sheet Chi tiết
  TTKT — người dùng chỉ định nó là bảng quan trọng nhất. Ba khối hỗ trợ lấy
  từ tài liệu "Xây dựng ứng dụng AI phục vụ báo cáo công tác kiểm tra" và
  biên bản 20/10/2026: bốn ô chỉ số, xếp hạng đơn vị, số cuộc theo loại hình.

  Biên bản họp Phòng Kiểm tra 02/11/2026 (thư mục 03-11) bổ sung:
  - bốn ô và cột mặc định của bảng là các chỉ số TRỌNG TÂM: tỷ lệ hoàn thành
    nhiệm vụ, tỷ lệ đích danh, tổng số thu và bình quân thu / cuộc, tỷ lệ đôn
    đốc; cột còn lại người xem tích chọn để hiện;
  - Thuế cơ sở tách cụm nội thành / ngoại thành để so tương đồng; xếp hạng từ
    cao xuống thấp và bôi đỏ các đơn vị cuối bảng;
  - bảng chi tiết thu gọn mặc định, đóng / mở theo từng cấp;
  - biểu đồ tròn chia số cuộc hoàn thành theo loại hình.

  Mẫu có hai phần cột — chung và kế hoạch đích danh KH2026 — nên đó là MỘT
  lựa chọn "Tất cả các cuộc | Kế hoạch đích danh" của bảng, không phải hai
  bảng. Báo cáo xuất theo các cột được chọn của phần đang xem.

  Bảng không theo phạm vi phòng QLDN: đây là báo cáo toàn ngành của khối
  kiểm tra. Bấm một dòng để bốn ô và biểu đồ loại hình đọc số của dòng ấy.
*/

type Loai = "" | "dd";
const pt = (x: number | null) => (x === null ? "—" : `${(x * 100).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`);
/** Triệu đồng → tỷ đồng, một chữ số thập phân. */
const ty = (trieu: number) => (trieu / 1000).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const tyBQ = (trieu: number | null) => (trieu === null ? "—" : (trieu / 1000).toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const ngayCuoi = (ky: KyQ) => new Date(2026, ky.thang, 0).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

/*
  THỨ TỰ theo tầm quan trọng (người dùng chốt 30/10/2026): bốn ô trả lời "toàn
  ngành đạt bao nhiêu" → xếp hạng trả lời "ai cao nhất, thấp nhất" → bảng chi
  tiết theo mẫu để đối chiếu và xuất → loại hình là chi tiết phụ.
*/
export function KiemTraTruSo({ ky, actor, dd, datLoai }: { ky: KyQ; actor: string; dd: boolean; datLoai: (l: Loai) => void }) {
  const [chon, datChon] = useThamSo<string>("dvkt", "TN", ["TN", "VP", "TCS", "NT", "NGT", ...DON_VI_KT.map((d) => d.id)]);
  return <>
    {/* Trên điện thoại hàng tab không còn chỗ: ô "Số liệu" đứng đầu nội dung. Mỗi khổ chỉ hiện MỘT ô. */}
    <OSoLieuKT dd={dd} dat={datLoai} lop="kt-loai-dt"/>
    <ChiSoChinh ky={ky} dd={dd} chon={chon} boChon={() => datChon("TN")}/>
    <XepHang ky={ky} dd={dd}/>
    <BangChiTiet ky={ky} dd={dd} chon={chon} datChon={datChon} actor={actor}/>
    {!dd && <TheoLoaiHinh ky={ky} chon={chon}/>}
  </>;
}

/** Ô "Số liệu" — điều khiển cả xếp hạng lẫn bảng chi tiết. */
export function OSoLieuKT({ dd, dat, lop }: { dd: boolean; dat: (l: Loai) => void; lop: string }) {
  return <div className={`bo-loc-muc kt-o-loai ${lop}`}>
    <span className="bo-loc-nhan" id={`${lop}-nhan`}>Số liệu</span>
    <NhomNut labelledBy={`${lop}-nhan`} value={dd ? "dd" : ""} onChange={(v) => dat(v as Loai)} options={[{ value: "", label: "Toàn ngành" }, { value: "dd", label: "Đích danh" }]}/>
  </div>;
}

/* =====================================================================
   Bốn ô chỉ số trọng tâm (biên bản 02/11/2026 §2.1)
   ===================================================================== */

/*
  Bốn ô theo mẫu người dùng chốt 03/11/2026: tỷ lệ hoàn thành (nhiệm vụ hoặc
  đích danh, theo ô "Số liệu") → tổng truy thu, truy hoàn và phạt → bình quân
  / cuộc kèm số cuộc còn phải làm và dở dang → tỷ lệ đôn đốc. Cả bốn ô đọc
  cùng bộ số với ô "Số liệu", như xếp hạng và bảng chi tiết.
*/
function ChiSoChinh({ ky, dd, chon, boChon }: { ky: KyQ; dd: boolean; chon: PhamViKT; boChon: () => void }) {
  const s = soLieuKT(chon, ky.thang);
  const so = dd ? s.dichDanh : s.chung;
  const x = tyLeHT(so), don = tyLeDonDoc(so), bq = binhQuan(so);
  const cuoc = dd ? "cuộc đích danh" : "cuộc";
  return <Panel title={`Chỉ số trọng tâm · ${tenPhamViKT(chon)}`} subtitle={`Lũy kế đến ${ngayCuoi(ky)}`}
    actions={chon !== "TN" ? <Button kind="quiet" onClick={boChon}>Về toàn ngành</Button> : undefined}>
    <div className="kt-o-so">
      <OChiSo ten={dd ? "Tỷ lệ hoàn thành đích danh" : "Tỷ lệ hoàn thành nhiệm vụ"} to={pt(x)} thanh={x}
        cachTinh={dd ? "cuộc đích danh hoàn thành / kế hoạch giao" : "QĐ hoàn thành / chỉ tiêu nhiệm vụ giao"}
        phu={so.giao ? <><b>{integer(so.htNay)}</b> / {integer(so.giao)} {cuoc}</> : <>{dd ? "Không có kế hoạch đích danh" : "Không có chỉ tiêu giao"} · <b>{integer(so.htNay)}</b> {cuoc}</>}
        moc={<SoCungKy ty={ssCungKySo(so)} truoc={`${integer(so.htTruoc)} cuộc`}/>}/>
      <OChiSo ten="Truy thu, truy hoàn và phạt" to={ty(so.thuNay)} donVi="tỷ đồng" cachTinh="lũy kế năm 2026, sau kiểm tra"
        phu={<><b>{integer(so.coTruyThu)}</b> cuộc có số truy thu, xử phạt</>}
        moc={<SoCungKy ty={ssCungKyThu(so)} truoc={`${ty(so.thuTruoc)} tỷ đồng`}/>}/>
      <OChiSo ten="Bình quân thu / cuộc" to={tyBQ(bq)} donVi="tỷ đồng" cachTinh="tổng truy thu, truy hoàn, phạt / QĐ hoàn thành"
        phu={so.giao ? <>Còn <b>{integer(Math.max(0, so.giao - so.htNay))}</b> cuộc phải hoàn thành</> : <>Không có chỉ tiêu giao</>}
        moc={<span className="kt-moc"><em>Dở dang</em><span>{integer(so.doDang)} cuộc</span></span>}/>
      <OChiSo ten="Tỷ lệ đôn đốc" to={pt(don)} cachTinh="số nộp sau kiểm tra / tổng truy thu, truy hoàn, phạt" thanh={don}
        phu={<>Tổng <b>{ty(so.thuNay)}</b> tỷ đồng</>}
        moc={<span className="kt-moc"><em>Nợ đọng sau kiểm tra</em><span>{ty(noDong(so))} tỷ đồng</span></span>}/>
    </div>
  </Panel>;
}

function OChiSo({ ten, to, donVi, cachTinh, thanh, phu, moc }: { ten: string; to: string; donVi?: string; cachTinh: string; thanh?: number | null; phu: ReactNode; moc: ReactNode }) {
  return <div className="kt-o">
    <span className="kt-o-ten">{ten}</span>
    <strong className="kt-o-to">{to}{donVi && <small> {donVi}</small>}</strong>
    <small className="kt-o-cach">{cachTinh}</small>
    {/* Rãnh thanh có ở MỌI ô, trong suốt ở ô không có tỷ lệ — bốn ô thẳng hàng (Fixed Slots). */}
    <span className={`kt-thanh${thanh === undefined ? " is-trong" : ""}`} aria-hidden="true">{thanh !== undefined && <i style={{ transform: `scaleX(${Math.min(1, Math.max(0, thanh ?? 0))})` }}/>}</span>
    <span className="kt-o-phu">{phu}</span>
    {moc}
  </div>;
}

/** "So cùng kỳ" theo cách tính của mẫu: năm nay / năm trước, dạng %. */
function SoCungKy({ ty: t, truoc }: { ty: number | null; truoc: string }) {
  return <span className="kt-moc"><em>So cùng kỳ 2025</em><span className={`kt-ss${t === null ? "" : t >= 1 ? " is-tang" : " is-giam"}`}>{t !== null && <Icon name={t >= 1 ? "chevronUp" : "chevronDown"} size={13}/>}{pt(t)}</span><small>2025: {truoc}</small></span>;
}

/* =====================================================================
   Bảng chính — sheet "Chi tiết TTKT"
   ===================================================================== */

/*
  Cột trên màn. `ma` là cột của mẫu, lùi vào `title` (The Group Header Says
  The Formula Rule). `tt` là cột trọng tâm của biên bản 02/11 — hiện mặc
  định; cột khác người xem tích ở "Chọn cột". Phần chung có thêm cột "Tỷ lệ
  đích danh" (Z của phần đích danh) vì biên bản xếp nó vào nhóm trọng tâm.
  `dvt` là đơn vị của CỘT, không của nhóm (05/11/2026): một nhóm trộn cột
  tiền với cột tỷ lệ, nên nhóm ghi "tỷ đồng" thì cột tỷ lệ đứng dưới thành sai.
*/
interface Cot { nhan: string; ma: string; dvt?: string; tt?: boolean; o: (c: ChiSoKT, s: SoLieuKT) => ReactNode }
interface NhomCot { nhan: string; cot: Cot[] }
const so = (x: number) => (x ? integer(x) : <span className="cell-empty">0</span>);
const ssO = (t: number | null, truoc: string) => <>{pt(t)}<small>2025: {truoc}</small></>;

const NHOM_CHUNG: NhomCot[] = [
  { nhan: "Số cuộc hoàn thành", cot: [
    { nhan: "Chỉ tiêu nhiệm vụ giao", ma: "D", o: (c) => (c.giao ? integer(c.giao) : <span className="cell-empty">—</span>) },
    { nhan: "QĐ hoàn thành 2026", ma: "G", o: (c) => <strong>{integer(c.htNay)}</strong> },
    { nhan: "So cùng kỳ", ma: "I = G/F", o: (c) => ssO(ssCungKySo(c), integer(c.htTruoc)) },
    { nhan: "Tỷ lệ hoàn thành", ma: "J = G/D", tt: true, o: (c) => <strong>{pt(tyLeHT(c))}</strong> },
    { nhan: "Tỷ lệ đích danh", ma: "Z = V/T", tt: true, o: (_c, s) => <strong>{pt(tyLeHT(s.dichDanh))}</strong> },
    { nhan: "Có số truy thu, xử phạt", ma: "H", o: (c) => so(c.coTruyThu) },
  ] },
  { nhan: "Kết quả sau TTKT", cot: [
    { nhan: "Truy thu, truy hoàn và phạt 2026", ma: "L", dvt: "tỷ đồng", tt: true, o: (c) => ty(c.thuNay) },
    { nhan: "So cùng kỳ", ma: "P = L/K", o: (c) => ssO(ssCungKyThu(c), ty(c.thuTruoc)) },
    { nhan: "Giảm thuế GTGT còn khấu trừ", ma: "M", dvt: "tỷ đồng", o: (c) => ty(c.giamKT) },
    { nhan: "Giảm lỗ", ma: "N", dvt: "tỷ đồng", o: (c) => ty(c.giamLo) },
    { nhan: "Bình quân / cuộc", ma: "O = L/G", dvt: "tỷ đồng", tt: true, o: (c) => tyBQ(binhQuan(c)) },
  ] },
  { nhan: "Sau kiểm tra", cot: [
    { nhan: "Số nộp", ma: "Q", dvt: "tỷ đồng", o: (c) => ty(c.nop) },
    { nhan: "Nợ đọng", ma: "R = L − Q", dvt: "tỷ đồng", o: (c) => ty(noDong(c)) },
    { nhan: "Tỷ lệ đôn đốc", ma: "S = Q/L", tt: true, o: (c) => pt(tyLeDonDoc(c)) },
  ] },
];
const NHOM_DD: NhomCot[] = [
  { nhan: "Kế hoạch đích danh KH2026", cot: [
    { nhan: "Kế hoạch giao", ma: "T", o: (c) => integer(c.giao) },
    { nhan: "Số lượng hoàn thành", ma: "V", o: (c) => <strong>{integer(c.htNay)}</strong> },
    { nhan: "So cùng kỳ", ma: "AC = V/AA", o: (c) => ssO(ssCungKySo(c), integer(c.htTruoc)) },
    { nhan: "Tỷ lệ đích danh", ma: "Z = V/T", tt: true, o: (c) => <strong>{pt(tyLeHT(c))}</strong> },
  ] },
  { nhan: "Kết quả", cot: [
    { nhan: "Truy thu, thu hồi hoàn và phạt", ma: "W", dvt: "tỷ đồng", tt: true, o: (c) => ty(c.thuNay) },
    { nhan: "Giảm thuế GTGT còn khấu trừ", ma: "X", dvt: "tỷ đồng", o: (c) => ty(c.giamKT) },
    { nhan: "Giảm lỗ", ma: "Y", dvt: "tỷ đồng", o: (c) => ty(c.giamLo) },
    { nhan: "Bình quân / cuộc", ma: "AB = W/V", dvt: "tỷ đồng", tt: true, o: (c) => tyBQ(binhQuan(c)) },
  ] },
  { nhan: "Sau kiểm tra", cot: [
    { nhan: "Số nộp", ma: "AD", dvt: "tỷ đồng", o: (c) => ty(c.nop) },
    { nhan: "Nợ đọng", ma: "AE", dvt: "tỷ đồng", o: (c) => ty(noDong(c)) },
    { nhan: "Tỷ lệ đôn đốc", ma: "AF = AD/W", tt: true, o: (c) => pt(tyLeDonDoc(c)) },
  ] },
];
/* Khóa cột mang phần ("c:" / "d:") — hai phần có chung mã Z. */
const khoaCot = (dd: boolean, k: Cot) => `${dd ? "d" : "c"}:${k.ma}`;
const COT_TRONG_TAM = [...NHOM_CHUNG.flatMap((n) => n.cot.filter((k) => k.tt).map((k) => khoaCot(false, k))), ...NHOM_DD.flatMap((n) => n.cot.filter((k) => k.tt).map((k) => khoaCot(true, k)))];

/*
  Cây dòng thu gọn theo cấp (biên bản 02/11 §2.1 "Tối ưu hiển thị"):
  Toàn ngành › Khối VP Thuế TP › đơn vị; Toàn ngành › Khối Thuế cơ sở › cụm
  nội thành / ngoại thành › đơn vị. Mặc định chỉ hiện Toàn ngành và hai
  khối. Bấm dòng khối hay cụm là MỞ nó và chọn nó cho bốn ô (một thao tác,
  cả hàng — The Whole Row Rule); bấm lại là thu gọn. Thay cho phân trang và
  ô lọc khối của bản 30/10: cây đã làm việc của cả hai.
*/
type Nhanh = KhoiKT | CumKT;
const MOI_NHANH: Nhanh[] = ["VP", "TCS", "NT", "NGT"];

function BangChiTiet({ ky, dd, chon, datChon, actor }: { ky: KyQ; dd: boolean; chon: PhamViKT; datChon: (id: string) => void; actor: string }) {
  const [mo, datMo] = useState<Set<Nhanh>>(() => new Set());
  const [hien, datHien] = useState<Set<string>>(() => new Set(COT_TRONG_TAM));
  const nhomGoc = dd ? NHOM_DD : NHOM_CHUNG;
  const nhom = nhomGoc.map((n) => ({ nhan: n.nhan, cot: n.cot.filter((k) => hien.has(khoaCot(dd, k))) })).filter((n) => n.cot.length);
  /* Vạch đầu nhóm theo cột ĐANG HIỆN đầu tiên của nhóm, không theo cột đầu của mẫu. */
  const cot = nhom.flatMap((n) => n.cot.map((k, i) => ({ k, dau: i === 0 })));
  const lay = (id: PhamViKT) => soLieuKT(id, ky.thang);
  const thuoc = (id: PhamViKT, nh: Nhanh) => {
    if (id === nh) return true;
    const d = DON_VI_KT.find((x) => x.id === id);
    return nh === "TCS" ? id === "NT" || id === "NGT" || d?.khoi === "TCS" : laCum(nh) ? d?.cum === nh : d?.khoi === nh;
  };
  const bamNhanh = (nh: Nhanh) => {
    const dangMo = mo.has(nh);
    const moi = new Set(mo);
    if (dangMo) { moi.delete(nh); if (thuoc(chon, nh)) datChon("TN"); }
    else { moi.add(nh); datChon(nh); }
    datMo(moi);
  };
  const moHet = MOI_NHANH.every((n) => mo.has(n)) && nhomGoc.every((n) => n.cot.every((k) => hien.has(khoaCot(dd, k))));
  const doiMoHet = () => {
    datMo(moHet ? new Set() : new Set(MOI_NHANH));
    const moi = new Set([...hien].filter((x) => !x.startsWith(dd ? "d:" : "c:")));
    nhomGoc.flatMap((n) => n.cot).filter((k) => !moHet || k.tt).forEach((k) => moi.add(khoaCot(dd, k)));
    datHien(moi);
    if (moHet) datChon("TN");
  };
  const baoCao = () => bangXuat(ky, dd, nhom);

  const dong = (id: PhamViKT, ten: ReactNode, cap: number, d?: DonViKT) => {
    const s = lay(id);
    const c = dd ? s.dichDanh : s.chung;
    const trong = d && dd && !d.coChiTieu;
    const nhanh = laKhoi(id) || laCum(id) ? id : null;
    const lop = id === "TN" ? "is-tong" : nhanh ? `kt-khoi kt-cap-${cap}` : `kt-con kt-cap-${cap}`;
    return <tr key={id} className={`qd-viec ${lop}${chon === id ? " is-selected" : ""}`} onClick={() => (nhanh ? bamNhanh(nhanh) : datChon(chon === id ? "TN" : id))}>
      <th scope="row" className="qd-goc-dv">
        {nhanh
          ? <button type="button" className="row-select kt-dv kt-nhanh" aria-expanded={mo.has(nhanh)}><Icon name="chevronDown" size={14}/>{ten}</button>
          : <button type="button" className="row-select kt-dv" aria-pressed={chon === id}>{ten}</button>}
        {d && <small className="kt-ma">{d.ma}</small>}
      </th>
      {cot.map(({ k, dau }) => <td key={k.ma} className={`num${dau ? " qd-goc-dau" : ""}`}>{trong ? <span className="cell-empty">—</span> : k.o(c, s)}</td>)}
    </tr>;
  };
  const donVi = (loc: (d: DonViKT) => boolean, cap: number) => DON_VI_KT.filter(loc).map((d) => dong(d.id, d.ten, cap, d));

  return <Panel chinh title="Chi tiết theo đơn vị" subtitle={`Kiểm tra tại trụ sở NNT · mẫu Chi tiết TTKT · ${dd ? "kế hoạch đích danh" : "tất cả các cuộc"} · lũy kế đến ${ngayCuoi(ky)} · so với cùng kỳ 2025`}
    actions={<div className="inline-controls kt-dieu-khien">
      <ChonCot nhom={nhomGoc} dd={dd} hien={hien} datHien={datHien}/>
      <Button kind="secondary" className="kt-mo-het" onClick={doiMoHet}>{moHet ? "Thu gọn tất cả" : "Mở tất cả"}</Button>
      <ExportButton onExport={() => xuatExcel(ky, actor, baoCao())}>Xuất Excel</ExportButton>
      {/* Báo cáo lời văn theo mẫu "Báo cáo tuần bc Trưởng Thuế TP" (thư mục 03-11); bảng Excel là Phụ lục 1 của nó. */}
      <ExportButton dinhDang="word" onExport={() => xuatWordKiemTra(ky, actor, baoCao())}>Xuất Word</ExportButton>
    </div>}>
    <TableWrap label="Kết quả kiểm tra tại trụ sở theo đơn vị">
      <table className="qd-bang qd-bang-goc kt-bang">
        <thead>
          <tr>
            <th scope="col" rowSpan={2} className="qd-goc-dv">Đơn vị</th>
            {nhom.map((n) => <th key={n.nhan} scope="colgroup" colSpan={n.cot.length} className="qd-goc-nhom qd-goc-dau">{n.nhan}</th>)}
          </tr>
          <tr>{cot.map(({ k, dau }) => <th key={k.ma} scope="col" className={`num${dau ? " qd-goc-dau" : ""}`} title={`Cột ${k.ma} của mẫu`}><span>{k.nhan}</span>{k.dvt && <small className="qd-ct">{k.dvt}</small>}</th>)}</tr>
        </thead>
        <tbody>
          {dong("TN", "Toàn ngành", 0)}
          {dong("VP", NHAN_KHOI_KT.VP, 1)}
          {mo.has("VP") && donVi((d) => d.khoi === "VP", 2)}
          {dong("TCS", NHAN_KHOI_KT.TCS, 1)}
          {mo.has("TCS") && (["NT", "NGT"] as CumKT[]).map((cum) => <Fragment key={cum}>
            {dong(cum, NHAN_CUM_KT[cum], 2)}
            {mo.has(cum) && donVi((d) => d.cum === cum, 3)}
          </Fragment>)}
        </tbody>
      </table>
    </TableWrap>
    <div className="table-footer">
      <span>Bấm một khối hoặc cụm để mở đơn vị bên trong. Cụm nội thành / ngoại thành chia tạm theo quận / huyện, chờ danh mục của Phòng Kiểm tra. Báo cáo xuất theo các cột đã chọn và gồm mọi đơn vị. Phòng QLHKD không có chỉ tiêu và kế hoạch đích danh.</span>
    </div>
  </Panel>;
}

/*
  "Chọn cột" (biên bản 02/11: cột ngoài nhóm trọng tâm "biểu thị dưới dạng
  flex, tích chọn hiển thị"). Danh sách theo phần "Số liệu" đang xem. Hộp
  nổi của React Aria (`MenuPop`): đóng khi bấm ra ngoài hoặc Esc, tiêu điểm
  về nút mở.
*/
function ChonCot({ nhom, dd, hien, datHien }: { nhom: NhomCot[]; dd: boolean; hien: Set<string>; datHien: (s: Set<string>) => void }) {
  const tat = nhom.flatMap((n) => n.cot);
  const dem = tat.filter((k) => hien.has(khoaCot(dd, k))).length;
  const bat = (k: Cot) => {
    const moi = new Set(hien);
    const khoa = khoaCot(dd, k);
    if (moi.has(khoa)) { if (dem > 1) moi.delete(khoa); } else moi.add(khoa);
    datHien(moi);
  };
  const veTrongTam = () => {
    const moi = new Set([...hien].filter((x) => !x.startsWith(dd ? "d:" : "c:")));
    tat.filter((k) => k.tt).forEach((k) => moi.add(khoaCot(dd, k)));
    datHien(moi);
  };
  return <MenuPop className="kt-chon-cot" menuClassName="kt-menu-cot" placement="bottom end" ten="Cột hiển thị trong bảng"
    nut={<><span>Chọn cột</span><small className="kt-dem-cot">{dem}/{tat.length}</small></>}>
    {nhom.map((n) => <fieldset key={n.nhan}>
      <legend>{n.nhan}</legend>
      {n.cot.map((k) => <Checkbox key={k.ma} checked={hien.has(khoaCot(dd, k))} disabled={dem === 1 && hien.has(khoaCot(dd, k))} onChange={() => bat(k)}>
        <span>{k.nhan}</span>{k.tt && <em className="kt-tt">Trọng tâm</em>}
      </Checkbox>)}
    </fieldset>)}
    <Button kind="quiet" onClick={veTrongTam}>Chỉ hiện cột trọng tâm</Button>
  </MenuPop>;
}

/* =====================================================================
   Xếp hạng đơn vị — thanh ngang, hàng theo hạng của tiêu chí đang chọn
   ===================================================================== */

/*
  Đứng NGAY DƯỚI bốn ô, trên bảng chi tiết (người dùng chốt 30/10/2026).

  "So trong" (biên bản 02/11 §2.1): năm Phòng Kiểm tra là một nhóm; Thuế cơ
  sở tách cụm nội thành và cụm ngoại thành để so đơn vị tương đồng — không xếp
  25 đơn vị chung một bảng. "Xếp theo" thêm tỷ lệ đôn đốc (sheet 3 của mẫu xếp
  theo tỷ lệ hoàn thành và tỷ lệ đôn đốc). Ghi chú PKT 03/11/2026 thêm xếp theo
  truy thu, truy hoàn và phạt.

  HẠNG CUỐI bôi đỏ để lãnh đạo nhận ra khi giao ban: một đơn vị hạng cuối với
  năm Phòng Kiểm tra, ba đơn vị với mỗi cụm (12–13 đơn vị). Số đơn vị bôi đỏ
  là GIẢ ĐỊNH, chờ Phòng Kiểm tra xác nhận. Màu không nói một mình: dòng có
  nhãn chữ "Hạng cuối". Hàng sắp từ hạng cao xuống thấp theo tiêu chí đang chọn.
*/
type XepTheo = "" | "so" | "thu" | "bq" | "dondoc";
type NhomXH = "" | "tcs" | "nt" | "ngt";
/* "tcs" = cả 25 Thuế cơ sở (gộp hai cụm, người dùng yêu cầu 04/11/2026): bôi
   đỏ 6 = 3 + 3 của hai cụm — GIẢ ĐỊNH, chờ Phòng Kiểm tra xác nhận. */
const SO_CUOI: Record<NhomXH, number> = { "": 1, tcs: 6, nt: 3, ngt: 3 };

function XepHang({ ky, dd }: { ky: KyQ; dd: boolean }) {
  const [nhom, datNhom] = useThamSo<NhomXH>("nhomk", "", ["", "tcs", "nt", "ngt"]);
  const [xep, datXep] = useThamSo<XepTheo>("xep", "", ["", "so", "thu", "bq", "dondoc"]);
  const dv = nhom === "" ? PHONG_KT : nhom === "tcs" ? DON_VI_KT.filter((d) => d.khoi === "TCS") : DON_VI_KT.filter((d) => d.cum === (nhom === "nt" ? "NT" : "NGT"));
  const nhanTyLe = dd ? "Tỷ lệ đích danh" : "Tỷ lệ hoàn thành";
  const tieuChi: Record<XepTheo, { nhan: string; gia: (c: ChiSoKT) => number | null; hien: (c: ChiSoKT) => string }> = {
    "": { nhan: nhanTyLe, gia: tyLeHT, hien: (c) => pt(tyLeHT(c)) },
    so: { nhan: dd ? "Cuộc đích danh hoàn thành" : "Số cuộc hoàn thành", gia: (c) => c.htNay, hien: (c) => integer(c.htNay) },
    thu: { nhan: "Truy thu, truy hoàn và phạt · tỷ đồng", gia: (c) => c.thuNay, hien: (c) => ty(c.thuNay) },
    bq: { nhan: "Bình quân / cuộc · tỷ đồng", gia: binhQuan, hien: (c) => tyBQ(binhQuan(c)) },
    dondoc: { nhan: "Tỷ lệ đôn đốc", gia: tyLeDonDoc, hien: (c) => pt(tyLeDonDoc(c)) },
  };
  const chinh = tieuChi[xep];
  /* Khi đồng hạng, giữ thứ tự số phòng / Thuế cơ sở để vị trí ổn định. */
  const soTCS = (ten: string) => Number(ten.match(/Thuế cơ sở (\d+)/)?.[1] ?? 0);
  const ds = [...dv].sort((a, b) => (a.so ?? soTCS(a.ten)) - (b.so ?? soTCS(b.ten)))
    .map((d) => ({ d, c: dd ? soLieuKT(d.id, ky.thang).dichDanh : soLieuKT(d.id, ky.thang).chung }));
  const soCuoi = SO_CUOI[nhom];
  const xepHang = (k: XepTheo) => xepHangGiaTri(ds.map((x) => ({ id: x.d.id, gia: tieuChi[k].gia(x.c) })), soCuoi);
  const hangChinh = xepHang(xep);
  const dongXepHang = [...ds].sort((a, b) =>
    (hangChinh.hang.get(a.d.id) ?? Infinity) - (hangChinh.hang.get(b.d.id) ?? Infinity));
  const thang = xep === "" || xep === "dondoc" ? 1 : Math.max(1e-9, ...ds.map((x) => chinh.gia(x.c) ?? 0));
  const phu = (["", "so", "thu", "bq", "dondoc"] as XepTheo[]).filter((k) => k !== xep);
  /* Cao nhất / thấp nhất của các tiêu chí bên, tính trên CẢ nhóm. */
  const cucTri = Object.fromEntries(phu.map((k) => [k, xepHang(k)])) as Record<XepTheo, ReturnType<typeof xepHangGiaTri>>;
  const nhan = (k: XepTheo, id: string) => {
    const { cao, thap } = cucTri[k];
    if (cao.has(id) && thap.has(id)) return <em className="kt-cuc" title="Các đơn vị có số liệu đều bằng nhau ở chỉ số này">Bằng nhau</em>;
    const muc = cao.has(id) ? "Cao nhất" : thap.has(id) ? "Thấp nhất" : null;
    return muc ? <em className={`kt-cuc ${cao.has(id) ? "is-cao" : "is-thap"}`} title={`${muc} trong nhóm về ${tieuChi[k].nhan.toLowerCase()}`}>{muc}<span className="sr-only"> trong nhóm về {tieuChi[k].nhan.toLowerCase()}</span></em> : null;
  };
  const tenNhom = nhom === "" ? "5 Phòng Kiểm tra" : nhom === "tcs" ? `Nội thành và ngoại thành · ${dv.length} Thuế cơ sở` : `${NHAN_CUM_KT[nhom === "nt" ? "NT" : "NGT"]} · ${dv.length} Thuế cơ sở`;

  return <Panel title="Xếp hạng đơn vị" subtitle={`${tenNhom} · hạng theo ${chinh.nhan.toLowerCase()}, từ cao xuống thấp · ${dd ? "kế hoạch đích danh" : "tất cả các cuộc"} · lũy kế đến ${ngayCuoi(ky)}`}
    actions={<div className="inline-controls kt-dieu-khien">
      <SelectMenu label="Xếp hạng theo" className="kt-loc-khoi kt-xep-theo" value={xep} onChange={datXep} options={[
        { value: "", label: `Xếp hạng theo ${nhanTyLe.toLowerCase()}` },
        { value: "so", label: "Xếp hạng theo số cuộc" },
        { value: "thu", label: "Xếp hạng theo truy thu, truy hoàn và phạt" },
        { value: "bq", label: "Xếp hạng theo bình quân / cuộc" },
        { value: "dondoc", label: "Xếp hạng theo tỷ lệ đôn đốc" },
      ]}/>
      {/* Phạm vi so (04/11/2026): "Thuế cơ sở" chọn được (tổng hai cụm); hai
          cụm thụt lề bên dưới, ô đóng ghi đủ "Thuế cơ sở · Nội thành". */}
      <SelectMenu label="Phạm vi" className="kt-loc-khoi kt-xh-pham-vi" value={nhom} onChange={datNhom} options={[
        { value: "", label: "Phòng kiểm tra" },
        { value: "tcs", label: "Thuế cơ sở" },
        { value: "nt", label: "Nội thành", nhanDong: "Thuế cơ sở · Nội thành", cap: 1 },
        { value: "ngt", label: "Ngoại thành", nhanDong: "Thuế cơ sở · Ngoại thành", cap: 1 },
      ]}/>
    </div>}>
    <TableWrap label={`Xếp hạng đơn vị theo ${chinh.nhan.toLowerCase()}`}>
      <table className="qd-bang kt-dg-bang">
        <thead><tr>
          <th scope="col" className="num kt-dg-hang">Hạng</th>
          <th scope="col">Đơn vị</th>
          <th scope="col" className="kt-dg-cot-thanh">{chinh.nhan}</th>
          {phu.map((k) => <th key={k} scope="col" className="num">{tieuChi[k].nhan}</th>)}
        </tr></thead>
        <tbody>{dongXepHang.map((x) => {
          const hang = hangChinh.hang.get(x.d.id);
          const cuoi = hangChinh.cuoi.has(x.d.id);
          return <tr key={x.d.id} className={cuoi ? "is-cuoi" : undefined}>
            <td className="num kt-dg-hang" title={hang === undefined ? "Chưa tính được chỉ số, không xếp hạng" : `Hạng ${hang} theo ${chinh.nhan.toLowerCase()}`}>{hang ?? "—"}</td>
            <th scope="row"><span className="kt-dg-ten">{x.d.ten}{cuoi && <em className="kt-cuoi" title={`Thuộc nhóm thấp nhất theo ${chinh.nhan.toLowerCase()}`}>{soCuoi === 1 ? "Hạng cuối" : "Nhóm cuối"}</em>}</span></th>
            <td className="kt-dg-cot-thanh">
              <span className="kt-dg-thanh">
                <span className="kt-thanh is-ngang" aria-hidden="true"><i style={{ transform: `scaleX(${Math.min(1, Math.max(0, (chinh.gia(x.c) ?? 0) / thang))})` }}/></span>
                <b>{chinh.hien(x.c)}</b>
              </span>
            </td>
            {phu.map((k) => <td key={k} className="num"><span className="kt-dg-o"><span>{tieuChi[k].hien(x.c)}</span><span className="kt-dg-nhan">{nhan(k, x.d.id)}</span></span></td>)}
          </tr>;
        })}</tbody>
      </table>
    </TableWrap>
    <div className="table-footer"><span>
      Hạng 1 đứng đầu; các dòng sắp từ cao xuống thấp theo tiêu chí đang chọn, không phải điểm tổng hợp.
      {" "}Nhãn “Cao nhất / Thấp nhất” so riêng từng cột trong nhóm đang xem.
      {" "}Đồng giá trị cùng hạng (1, 1, 3); xếp theo số chưa làm tròn. Giá trị “—” không xếp hạng.
      {" "}Tô đỏ {hangChinh.cuoi.size} đơn vị thuộc nhóm cuối theo tiêu chí đang chọn, gồm cả đồng hạng ở ngưỡng cuối.
    </span></div>
  </Panel>;
}

/* =====================================================================
   Số cuộc hoàn thành theo loại hình
   ===================================================================== */

/*
  Biểu đồ tròn (biên bản 02/11 §2.1 "Trực quan hóa"), theo dòng đang chọn ở
  bảng chi tiết. Năm phần theo cách phân loại của biên bản §2.2: kế hoạch
  (đích danh, chuyên đề) và đột xuất (giải thể / đóng mã, hoàn thuế, khác).
  Trước hoàn và sau hoàn gộp một phần "Hoàn thuế" trên biểu đồ — năm màu
  phân loại đã kiểm cho người mù màu; bảng theo phòng vẫn tách hai cột.
  Bảng theo phòng thu gọn mặc định (biên bản: thu gọn các bảng chi tiết).
*/
const PHAN_LOAI: { nhan: string; loai: LoaiHinh[]; mau: string }[] = [
  { nhan: "Kế hoạch đích danh", loai: ["dichDanh"], mau: "var(--cat-1)" },
  { nhan: "Chuyên đề", loai: ["chuyenDe"], mau: "var(--cat-2)" },
  { nhan: "Giải thể, chuyển địa điểm", loai: ["giaiThe"], mau: "var(--cat-3)" },
  { nhan: "Hoàn thuế (trước và sau hoàn)", loai: ["truocHoan", "sauHoan"], mau: "var(--cat-4)" },
  { nhan: "Đột xuất khác", loai: ["khac"], mau: "var(--cat-5)" },
];
const phanTram = (a: number, tong: number) => (tong ? `${((a / tong) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%` : "—");

function TheoLoaiHinh({ ky, chon }: { ky: KyQ; chon: PhamViKT }) {
  const [moBang, datMoBang] = useState(false);
  const loai = soLieuKT(chon, ky.thang).loai;
  const phan = PHAN_LOAI.map((p) => p.loai.reduce((a, l) => a + loai[l], 0));
  /* Disclosure bọc cả khối: nút ở đầu khối, bảng ở thân khối — thư viện nối hai bên. */
  return <Disclosure className="kt-loai-mo-rong" isExpanded={moBang} onExpandedChange={datMoBang}><Panel title="Số cuộc hoàn thành theo loại hình" subtitle={`${tenPhamViKT(chon)} · lũy kế đến ${ngayCuoi(ky)}`}
    actions={<AriaButton slot="trigger" className="button is-quiet kt-mo-bang">
      <span>{moBang ? "Ẩn bảng theo phòng" : "Xem bảng theo phòng"}</span><Icon name={moBang ? "chevronUp" : "chevronDown"} size={16}/>
    </AriaButton>}>
    <DonutLoaiHinh phan={phan}/>
    <DisclosurePanel>{moBang && <div id="kt-bang-loai" className="kt-bang-loai-mo"><BangLoaiHinh ky={ky} chon={chon}/></div>}</DisclosurePanel>
  </Panel></Disclosure>;
}

function DonutLoaiHinh({ phan }: { phan: number[] }) {
  const [tro, datTro] = useState<number | null>(null);
  const tong = phan.reduce((a, b) => a + b, 0);
  if (!tong) return <p className="kt-trong">Chưa có cuộc kiểm tra hoàn thành trong kỳ này.</p>;
  const R = 62, C = 2 * Math.PI * R, KHE = 2;
  let dau = 0;
  return <div className="qd-donut kt-donut">
    <svg viewBox="0 0 160 160" role="img" aria-label={PHAN_LOAI.map((p, i) => `${p.nhan} ${integer(phan[i])} cuộc, ${phanTram(phan[i], tong)}`).join("; ")}>
      <g transform="rotate(-90 80 80)">{phan.map((p, i) => {
        const dai = (C * p) / tong;
        const cung = <circle key={i} cx="80" cy="80" r={R} fill="none" style={{ stroke: PHAN_LOAI[i].mau }} strokeWidth={tro === i ? 22 : 18}
          strokeDasharray={`${p ? Math.max(dai - KHE, 0.5) : 0} ${C}`} strokeDashoffset={-dau}
          onPointerEnter={() => datTro(i)} onPointerLeave={() => datTro(null)}><title>{`${PHAN_LOAI[i].nhan}: ${integer(p)} cuộc, ${phanTram(p, tong)}`}</title></circle>;
        dau += dai;
        return cung;
      })}</g>
      <text x="80" y="78" textAnchor="middle" className="qd-donut-so">{tro === null ? integer(tong) : phanTram(phan[tro], tong)}</text>
      <text x="80" y="96" textAnchor="middle" className="qd-donut-phu">{tro === null ? "cuộc hoàn thành" : `${integer(phan[tro])} cuộc`}</text>
    </svg>
    <ul className="qd-chu-giai">{PHAN_LOAI.map((p, i) => <li key={p.nhan} className={tro === i ? "is-tro" : undefined} tabIndex={0} onPointerEnter={() => datTro(i)} onPointerLeave={() => datTro(null)} onFocus={() => datTro(i)} onBlur={() => datTro(null)}>
      <i style={{ background: p.mau }}/><span>{p.nhan}</span>
      {/* Thanh tỷ trọng mảnh lấp phần còn lại của khối — cùng màu với cung trên vòng. */}
      <span className="kt-cg-thanh" aria-hidden="true"><span style={{ width: `${(phan[i] / Math.max(...phan)) * 100}%`, background: p.mau }}/></span>
      <b>{integer(phan[i])}</b><small>{phanTram(phan[i], tong)}</small>
    </li>)}</ul>
  </div>;
}

function BangLoaiHinh({ ky, chon }: { ky: KyQ; chon: PhamViKT }) {
  const dong = PHONG_KT.map((p) => ({ id: p.id, ten: p.ten, s: soLieuKT(p.id, ky.thang) }));
  const vp = { s: { loai: LOAI_HINH.reduce((a, l) => ({ ...a, [l.id]: dong.reduce((s, d) => s + d.s.loai[l.id], 0) }), {} as Record<string, number>) } };
  const tong = (loai: Record<string, number>) => LOAI_HINH.reduce((a, l) => a + loai[l.id], 0);
  const max = Math.max(...dong.map((d) => tong(d.s.loai)));
  return <TableWrap label="Số cuộc hoàn thành theo loại hình của năm Phòng Kiểm tra">
    <table className="qd-bang qd-bang-goc kt-bang kt-bang-loai">
      <thead>
        <tr>
          <th scope="col" rowSpan={2} className="qd-goc-dv">Phòng Kiểm tra</th>
          <th scope="colgroup" colSpan={LOAI_HINH.length + 1} className="qd-goc-nhom qd-goc-dau">Số lượng hoàn thành</th>
        </tr>
        <tr>
          {LOAI_HINH.map((l, i) => <th key={l.id} scope="col" className={`num${i === 0 ? " qd-goc-dau" : ""}`}>{l.nhan}</th>)}
          <th scope="col" className="num qd-goc-dau">Tổng</th>
        </tr>
      </thead>
      <tbody>
        {dong.map((d) => <tr key={d.id} className={d.id === chon ? "is-selected" : undefined}>
          <th scope="row" className="qd-goc-dv">{d.ten}</th>
          {LOAI_HINH.map((l, i) => <td key={l.id} className={`num${i === 0 ? " qd-goc-dau" : ""}`}>{so(d.s.loai[l.id])}</td>)}
          <td className="num qd-goc-dau"><span className="kt-ty-le"><span className="kt-thanh is-nho" aria-hidden="true"><i style={{ transform: `scaleX(${tong(d.s.loai) / max})` }}/></span><strong>{integer(tong(d.s.loai))}</strong></span></td>
        </tr>)}
        <tr className="is-tong">
          <th scope="row" className="qd-goc-dv">Cộng 5 Phòng Kiểm tra</th>
          {LOAI_HINH.map((l, i) => <td key={l.id} className={`num${i === 0 ? " qd-goc-dau" : ""}`}>{integer(vp.s.loai[l.id])}</td>)}
          <td className="num qd-goc-dau"><strong>{integer(tong(vp.s.loai))}</strong></td>
        </tr>
      </tbody>
    </table>
  </TableWrap>;
}

/* =====================================================================
   Xuất báo cáo — chọn từ 32 cột nguồn theo các cột đang hiển thị
   ===================================================================== */

const DAU_32 = [
  "STT", "Mã CQT", "Chỉ tiêu",
  "Chỉ tiêu nhiệm vụ giao", "Chỉ tiêu nhiệm vụ sau điều chỉnh", "QĐ hoàn thành 2025", "QĐ hoàn thành 2026",
  "Số cuộc KT có số thuế truy thu, xử phạt", "SS cùng kỳ", "Tỷ lệ hoàn thành",
  "Kết quả sau TTKT – Truy thu, truy hoàn và phạt 2025", "Kết quả sau TTKT – Tổng số truy thu, truy hoàn và phạt 2026",
  "Kết quả sau TTKT – Giảm thuế GTGT còn được khấu trừ", "Kết quả sau TTKT – Giảm lỗ", "Kết quả sau TTKT – BQ/1 cuộc", "Kết quả sau TTKT – SS cùng kỳ",
  "Số nộp sau kiểm tra", "Nợ đọng sau kiểm tra", "Tỷ lệ đôn đốc",
  "KH2026 – Kế hoạch giao đích danh", "KH2026 – Kế hoạch giao đích danh sau điều chỉnh", "KH2026 – SL hoàn thành",
  "KH2026 – Tổng số truy thu, thu hồi hoàn và phạt", "KH2026 – Giảm thuế GTGT còn được khấu trừ", "KH2026 – Giảm lỗ", "KH2026 – Tỷ lệ đích danh",
  "KH2026 – SL hoàn thành 2025 đích danh", "KH2026 – BQ/1 cuộc", "KH2026 – So sánh cùng kỳ",
  "KH2026 – Số nộp sau kiểm tra", "KH2026 – Nợ đọng sau kiểm tra", "KH2026 – Tỷ lệ đôn đốc",
];
const PHAN_TRAM_32 = [8, 9, 15, 18, 25, 28, 31];

function hang32(stt: string, ma: string, ten: string, id: PhamViKT, thang: number, coDD: boolean): ReportValue[] {
  const { chung: c, dichDanh: d } = soLieuKT(id, thang);
  const r = (x: number) => Math.round(x * 10) / 10;
  const n = (x: number | null) => (x === null ? null : r(x));
  return [
    stt, ma, ten,
    c.giao || null, null, c.htTruoc, c.htNay, c.coTruyThu, ssCungKySo(c), tyLeHT(c),
    r(c.thuTruoc), r(c.thuNay), r(c.giamKT), r(c.giamLo), n(binhQuan(c)), ssCungKyThu(c),
    r(c.nop), r(noDong(c)), tyLeDonDoc(c),
    ...(coDD ? [d.giao, null, d.htNay, r(d.thuNay), r(d.giamKT), r(d.giamLo), tyLeHT(d), d.htTruoc, n(binhQuan(d)), ssCungKySo(d), r(d.nop), r(noDong(d)), tyLeDonDoc(d)] : Array(13).fill(null)),
  ];
}

function bangXuat(ky: KyQ, dd: boolean, nhom: NhomCot[]): ReportSheet {
  const rows: ReportValue[][] = [hang32("A", "", "Toàn ngành", "TN", ky.thang, true)];
  (["VP", "TCS"] as KhoiKT[]).forEach((k, i) => {
    rows.push(hang32(i ? "II" : "I", "", NHAN_KHOI_KT[k], k, ky.thang, true));
    DON_VI_KT.filter((d) => d.khoi === k).forEach((d, j) => rows.push(hang32(String(j + 1), d.ma, d.ten, d.id, ky.thang, d.coChiTieu)));
  });
  const cot = nhom.flatMap((n) => n.cot.map((k) => {
    const ma = k.ma.split(" ")[0];
    const index = [...ma].reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0) - 1;
    return { index, nhan: `${n.nhan} – ${k.nhan}${k.dvt ? ` (${k.dvt})` : ""}`, tien: Boolean(k.dvt) };
  }));
  return {
    name: "Chi_tiet_TTKT", title: `KẾT QUẢ KIỂM TRA TẠI TRỤ SỞ NNT · ${dd ? "ĐÍCH DANH" : "TOÀN NGÀNH"} · LŨY KẾ ĐẾN ${ngayCuoi(ky)}`,
    unit: "số tiền: tỷ đồng", headers: [...DAU_32.slice(0, 3), ...cot.map((k) => k.nhan)],
    rows: rows.map((row) => [...row.slice(0, 3), ...cot.map((k) => {
      const value = row[k.index];
      return k.tien && typeof value === "number" ? value / 1000 : value;
    })]),
    percent: cot.flatMap((k, i) => PHAN_TRAM_32.includes(k.index) ? [i + 3] : []),
  };
}

async function xuatExcel(ky: KyQ, actor: string, bang: ReportSheet) {
  await exportExcel([bang], { period: `Lũy kế từ 01/01 đến ${ngayCuoi(ky)}`, scope: "Toàn ngành · Phòng Kiểm tra và Thuế cơ sở", actor, status: "DRAFT" }, `kiem-tra-tai-tru-so_2026-${String(ky.thang).padStart(2, "0")}.xlsx`);
}
