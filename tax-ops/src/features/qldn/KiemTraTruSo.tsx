import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { useThamSo, useThamSoSo } from "@/state/diaChi";
import { Button, Icon, Pager, Panel, Segmented, TableWrap, integer } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportSheet, ReportValue } from "@/domain/reportExport";
import type { KyQ } from "@/data/qldn";
import {
  DON_VI_KT, LOAI_HINH, NHAN_KHOI_KT, PHONG_KT, binhQuan, binhQuanTruoc, noDong, soLieuKT, ssCungKySo, ssCungKyThu, tenPhamViKT, tyLeDonDoc, tyLeHT,
  type ChiSoKT, type DonViKT, type KhoiKT, type PhamViKT,
} from "@/data/kiemTra";

/*
  Mục "Phòng kiểm tra" › tab "Tổng quan" (30/10/2026; tên cũ "Kiểm tra tại
  trụ sở", đổi và chuyển sang trái "Kiểm tra tại bàn" ngày 02/11/2026).

  Khối chính là BẢNG của mẫu "Đầu ra - Biểu excel báo cáo", sheet Chi tiết
  TTKT — người dùng chỉ định nó là bảng quan trọng nhất. Ba khối hỗ trợ lấy
  từ tài liệu "Xây dựng ứng dụng AI phục vụ báo cáo công tác kiểm tra" và
  biên bản 20/10/2026: bốn ô chỉ số (§3.1 "Dashboard mong muốn"), đánh giá
  đơn vị cao nhất / thấp nhất, số cuộc theo loại hình.

  Mẫu có hai phần cột — chung và kế hoạch đích danh KH2026 — nên đó là MỘT
  lựa chọn "Tất cả các cuộc | Kế hoạch đích danh" của bảng, không phải hai
  bảng. Trên màn mỗi phần bỏ các cột năm trước (chúng xuống dòng phụ của ô
  "So cùng kỳ") và cột chỉ tiêu sau điều chỉnh (mẫu để trống); tệp Excel đủ
  32 cột (The Wide Report Shows One Comparison Rule).

  Bảng không theo phạm vi phòng QLDN: đây là báo cáo toàn ngành của khối
  kiểm tra. Bấm một dòng để bốn ô phía trên đọc số của đơn vị hay khối ấy.
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
  const [chon, datChon] = useThamSo<string>("dvkt", "TN", ["TN", "VP", "TCS", ...DON_VI_KT.map((d) => d.id)]);
  return <>
    {/* Trên điện thoại hàng tab không còn chỗ: ô "Số liệu" đứng đầu nội dung. Mỗi khổ chỉ hiện MỘT ô. */}
    <OSoLieuKT dd={dd} dat={datLoai} lop="kt-loai-dt"/>
    <ChiSoChinh ky={ky} chon={chon} boChon={() => datChon("TN")}/>
    <XepHang ky={ky} dd={dd}/>
    <BangChiTiet ky={ky} dd={dd} chon={chon} datChon={datChon} actor={actor}/>
    <TheoLoaiHinh ky={ky} chon={chon}/>
  </>;
}

/** Ô "Số liệu" — điều khiển cả xếp hạng lẫn bảng chi tiết. */
export function OSoLieuKT({ dd, dat, lop }: { dd: boolean; dat: (l: Loai) => void; lop: string }) {
  return <div className={`bo-loc-muc kt-o-loai ${lop}`}>
    <span className="bo-loc-nhan" id={`${lop}-nhan`}>Số liệu</span>
    <div className="bo-loc-seg" role="group" aria-labelledby={`${lop}-nhan`}>
      <button type="button" aria-pressed={!dd} onClick={() => dat("")}>Tất cả các cuộc</button>
      <button type="button" aria-pressed={dd} onClick={() => dat("dd")}>Đích danh</button>
    </div>
  </div>;
}

/* =====================================================================
   Bốn ô chỉ số (biên bản 20/10/2026 §3.1)
   ===================================================================== */

/*
  Tỷ lệ hoàn thành, tỷ lệ đích danh, chỉ tiêu nhiệm vụ, truy thu bình quân /
  cuộc. Số to là tỷ lệ (The Rate Leads The Tile Rule); số tuyệt đối xuống
  hàng hai. Phòng QLHKD không có chỉ tiêu nên hai ô tỷ lệ nói thẳng điều đó.
*/
function ChiSoChinh({ ky, chon, boChon }: { ky: KyQ; chon: PhamViKT; boChon: () => void }) {
  const s = soLieuKT(chon, ky.thang);
  const so = s.chung, soDD = s.dichDanh;
  const x = tyLeHT(so), xdd = tyLeHT(soDD);
  const bq = binhQuan(so), bqTruoc = binhQuanTruoc(so);
  return <Panel title={`Chỉ số chính · ${tenPhamViKT(chon)}`} subtitle={`Lũy kế đến ${ngayCuoi(ky)} · chọn một dòng ở bảng chi tiết để xem đơn vị`}
    actions={chon !== "TN" ? <Button kind="quiet" onClick={boChon}>Về toàn ngành</Button> : undefined}>
    <div className="kt-o-so">
      <OChiSo ten="Tỷ lệ hoàn thành chỉ tiêu" to={pt(x)} cachTinh="QĐ hoàn thành / chỉ tiêu nhiệm vụ giao" thanh={x}
        phu={so.giao ? <><b>{integer(so.htNay)}</b> / {integer(so.giao)} cuộc</> : <>Không có chỉ tiêu giao · <b>{integer(so.htNay)}</b> cuộc</>}
        moc={<SoCungKy ty={ssCungKySo(so)} truoc={`${integer(so.htTruoc)} cuộc`}/>}/>
      <OChiSo ten="Tỷ lệ hoàn thành đích danh" to={pt(xdd)} cachTinh="cuộc đích danh hoàn thành / kế hoạch giao" thanh={xdd}
        phu={soDD.giao ? <><b>{integer(soDD.htNay)}</b> / {integer(soDD.giao)} cuộc đích danh</> : <>Không có kế hoạch đích danh</>}
        moc={<SoCungKy ty={ssCungKySo(soDD)} truoc={`${integer(soDD.htTruoc)} cuộc`}/>}/>
      <OChiSo ten="Chỉ tiêu nhiệm vụ" to={so.giao ? integer(so.giao) : "—"} donVi={so.giao ? "cuộc" : undefined} cachTinh="chỉ tiêu nhiệm vụ giao cả năm 2026"
        phu={so.giao ? <>Còn <b>{integer(Math.max(0, so.giao - so.htNay))}</b> cuộc phải hoàn thành</> : <>Đơn vị không có chỉ tiêu giao</>}
        moc={<span className="kt-moc"><em>Dở dang</em><span>{integer(so.doDang)} cuộc</span></span>}/>
      <OChiSo ten="Truy thu bình quân / cuộc" to={tyBQ(bq)} donVi="tỷ đồng" cachTinh="tổng truy thu, truy hoàn, phạt / QĐ hoàn thành"
        phu={<>Tổng <b>{ty(so.thuNay)}</b> tỷ đồng</>}
        moc={<SoCungKy ty={bq !== null && bqTruoc ? bq / bqTruoc : null} truoc={`${tyBQ(bqTruoc)} tỷ đồng`}/>}/>
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

/* Cột trên màn. `ma` là cột của mẫu, lùi vào `title` (The Group Header Says The Formula Rule). */
interface Cot { nhan: string; ma: string; dau?: boolean; o: (c: ChiSoKT, d?: DonViKT) => ReactNode }
const so = (x: number) => (x ? integer(x) : <span className="cell-empty">0</span>);
const ssO = (t: number | null, truoc: string) => <>{pt(t)}<small>2025: {truoc}</small></>;

const NHOM_CHUNG: { nhan: string; cot: Cot[] }[] = [
  { nhan: "Số cuộc hoàn thành", cot: [
    { nhan: "Chỉ tiêu nhiệm vụ giao", ma: "D", dau: true, o: (c) => (c.giao ? integer(c.giao) : <span className="cell-empty">—</span>) },
    { nhan: "QĐ hoàn thành 2026", ma: "G", o: (c) => <strong>{integer(c.htNay)}</strong> },
    { nhan: "So cùng kỳ", ma: "I = G/F", o: (c) => ssO(ssCungKySo(c), integer(c.htTruoc)) },
    { nhan: "Tỷ lệ hoàn thành", ma: "J = G/D", o: (c) => <strong>{pt(tyLeHT(c))}</strong> },
    { nhan: "Có số truy thu, xử phạt", ma: "H", o: (c) => so(c.coTruyThu) },
  ] },
  { nhan: "Kết quả sau TTKT · tỷ đồng", cot: [
    { nhan: "Truy thu, truy hoàn và phạt 2026", ma: "L", dau: true, o: (c) => ty(c.thuNay) },
    { nhan: "So cùng kỳ", ma: "P = L/K", o: (c) => ssO(ssCungKyThu(c), ty(c.thuTruoc)) },
    { nhan: "Giảm thuế GTGT còn khấu trừ", ma: "M", o: (c) => ty(c.giamKT) },
    { nhan: "Giảm lỗ", ma: "N", o: (c) => ty(c.giamLo) },
    { nhan: "Bình quân / cuộc", ma: "O = L/G", o: (c) => tyBQ(binhQuan(c)) },
  ] },
  { nhan: "Sau kiểm tra · tỷ đồng", cot: [
    { nhan: "Số nộp", ma: "Q", dau: true, o: (c) => ty(c.nop) },
    { nhan: "Nợ đọng", ma: "R = L − Q", o: (c) => ty(noDong(c)) },
    { nhan: "Tỷ lệ đôn đốc", ma: "S = Q/L", o: (c) => pt(tyLeDonDoc(c)) },
  ] },
];
const NHOM_DD: { nhan: string; cot: Cot[] }[] = [
  { nhan: "Kế hoạch đích danh KH2026", cot: [
    { nhan: "Kế hoạch giao", ma: "T", dau: true, o: (c) => integer(c.giao) },
    { nhan: "Số lượng hoàn thành", ma: "V", o: (c) => <strong>{integer(c.htNay)}</strong> },
    { nhan: "So cùng kỳ", ma: "AC = V/AA", o: (c) => ssO(ssCungKySo(c), integer(c.htTruoc)) },
    { nhan: "Tỷ lệ đích danh", ma: "Z = V/T", o: (c) => <strong>{pt(tyLeHT(c))}</strong> },
  ] },
  { nhan: "Kết quả · tỷ đồng", cot: [
    { nhan: "Truy thu, thu hồi hoàn và phạt", ma: "W", dau: true, o: (c) => ty(c.thuNay) },
    { nhan: "Giảm thuế GTGT còn khấu trừ", ma: "X", o: (c) => ty(c.giamKT) },
    { nhan: "Giảm lỗ", ma: "Y", o: (c) => ty(c.giamLo) },
    { nhan: "Bình quân / cuộc", ma: "AB = W/V", o: (c) => tyBQ(binhQuan(c)) },
  ] },
  { nhan: "Sau kiểm tra · tỷ đồng", cot: [
    { nhan: "Số nộp", ma: "AD", dau: true, o: (c) => ty(c.nop) },
    { nhan: "Nợ đọng", ma: "AE", o: (c) => ty(noDong(c)) },
    { nhan: "Tỷ lệ đôn đốc", ma: "AF = AD/W", o: (c) => pt(tyLeDonDoc(c)) },
  ] },
];

/*
  Bảng dài 33 dòng chia TRANG 10 dòng (The Long List Gets Pages Rule). Dòng
  cộng của phạm vi đang xem (Toàn ngành, hoặc dòng khối khi lọc một khối)
  ĐỨNG YÊN đầu bảng ở mọi trang — người đọc lật trang vẫn có mốc so. Ô "Hiển
  thị" cạnh nút Xuất Excel chọn tất cả hay riêng một khối; đổi lọc hoặc đổi
  "Số liệu" là về trang 1. Tệp Excel vẫn xuất đủ mẫu, không theo bộ lọc.
*/
type LocKhoi = "" | KhoiKT;
const CO_TRANG = 10;

function BangChiTiet({ ky, dd, chon, datChon, actor }: { ky: KyQ; dd: boolean; chon: PhamViKT; datChon: (id: string) => void; actor: string }) {
  const [loc, datLoc] = useThamSo<LocKhoi>("khoi", "", ["", "VP", "TCS"]);
  const [trang, datTrang] = useThamSoSo("trang", 1);
  /* Đổi "Số liệu" (trên thanh phạm vi) là về trang 1 — bỏ qua lần dựng đầu để liên kết có `trang` vẫn mở đúng trang. */
  const lanDau = useRef(true);
  useEffect(() => { if (lanDau.current) { lanDau.current = false; return; } datTrang(1); }, [dd]);
  const nhom = dd ? NHOM_DD : NHOM_CHUNG;
  const cot = nhom.flatMap((n) => n.cot);
  const lay = (id: PhamViKT) => (dd ? soLieuKT(id, ky.thang).dichDanh : soLieuKT(id, ky.thang).chung);
  /* Cả hàng bấm được (The Whole Row Rule); bấm lại dòng đang chọn là bỏ chọn. */
  const dong = (id: PhamViKT, ten: ReactNode, lop: string, d?: DonViKT) => {
    const c = lay(id);
    const trong = d && dd && !d.coChiTieu;
    return <tr key={id} className={`qd-viec ${lop}${chon === id ? " is-selected" : ""}`} onClick={() => datChon(chon === id ? "TN" : id)}>
      <th scope="row" className="qd-goc-dv">
        <button type="button" className="row-select kt-dv" aria-pressed={chon === id}>{ten}</button>
        {d && <small className="kt-ma">{d.ma}</small>}
      </th>
      {cot.map((k, i) => <td key={i} className={`num${k.dau ? " qd-goc-dau" : ""}`}>{trong ? <span className="cell-empty">—</span> : k.o(c, d)}</td>)}
    </tr>;
  };
  /* Dòng ghim và danh sách được chia trang. Với "Tất cả", dòng khối nằm trong
     danh sách theo đúng thứ tự mẫu, nên một trang có thể bắt đầu giữa khối. */
  const ghim = loc ? dong(loc, NHAN_KHOI_KT[loc], "kt-khoi") : dong("TN", "Toàn ngành", "is-tong");
  const muc: { id: PhamViKT; ve: () => ReactNode }[] = (loc ? [loc] : (["VP", "TCS"] as KhoiKT[])).flatMap((k) => [
    ...(loc ? [] : [{ id: k as PhamViKT, ve: () => dong(k, NHAN_KHOI_KT[k], "kt-khoi") }]),
    ...DON_VI_KT.filter((d) => d.khoi === k).map((d) => ({ id: d.id as PhamViKT, ve: () => dong(d.id, d.ten, "kt-con", d) })),
  ]);
  const soTrang = Math.max(1, Math.ceil(muc.length / CO_TRANG));
  const tr = Math.min(trang, soTrang);
  const doiLoc = (k: LocKhoi) => { datLoc(k); datTrang(1); };
  return <Panel chinh title="Chi tiết theo đơn vị" subtitle={`Kiểm tra tại trụ sở NNT · mẫu Chi tiết TTKT · ${dd ? "kế hoạch đích danh" : "tất cả các cuộc"} · lũy kế đến ${ngayCuoi(ky)} · so với cùng kỳ 2025`}
    actions={<div className="inline-controls kt-dieu-khien">
      <label className="kt-loc-khoi"><span className="sr-only">Hiển thị đơn vị</span>
        <select className="bo-loc-select" value={loc} onChange={(e) => doiLoc(e.target.value as LocKhoi)}>
          <option value="">Tất cả đơn vị</option>
          <option value="VP">{NHAN_KHOI_KT.VP}</option>
          <option value="TCS">{NHAN_KHOI_KT.TCS}</option>
        </select>
      </label>
      <ExportButton onExport={() => xuatExcel(ky, actor)}>Xuất Excel</ExportButton>
    </div>}>
    <TableWrap label="Kết quả kiểm tra tại trụ sở theo đơn vị">
      <table className="qd-bang qd-bang-goc kt-bang">
        <thead>
          <tr>
            <th scope="col" rowSpan={2} className="qd-goc-dv">Đơn vị</th>
            {nhom.map((n) => <th key={n.nhan} scope="colgroup" colSpan={n.cot.length} className="qd-goc-nhom qd-goc-dau">{n.nhan}</th>)}
          </tr>
          <tr>{cot.map((k) => <th key={k.ma} scope="col" className={`num${k.dau ? " qd-goc-dau" : ""}`} title={`Cột ${k.ma} của mẫu`}>{k.nhan}</th>)}</tr>
        </thead>
        <tbody>
          {ghim}
          {muc.slice((tr - 1) * CO_TRANG, tr * CO_TRANG).map((m) => <Fragment key={m.id}>{m.ve()}</Fragment>)}
        </tbody>
      </table>
    </TableWrap>
    <div className="table-footer">
      <Pager trang={tr} soTrang={soTrang} onChange={datTrang}/>
      <span>Thứ tự dòng theo mẫu. Tệp Excel đủ 32 cột và mọi đơn vị. Phòng QLHKD không có chỉ tiêu và kế hoạch đích danh.</span>
    </div>
  </Panel>;
}

/* =====================================================================
   Xếp hạng đơn vị — thanh ngang, cao nhất trên đầu (30/10/2026)
   ===================================================================== */

/*
  Đứng NGAY DƯỚI bốn ô, trên bảng chi tiết (người dùng chốt 30/10/2026): câu
  hỏi thứ hai của người mở màn là "đơn vị nào cao nhất, thấp nhất" — biên bản
  20/10 §3.1 — và câu trả lời không được nằm dưới một bảng 33 dòng.

  "Xếp theo" chọn tiêu chí (tỷ lệ hoàn thành — mặc định, theo biên bản; số
  cuộc; bình quân / cuộc). Thanh là tiêu chí ấy, xếp từ cao xuống thấp; hai
  tiêu chí còn lại đứng ở cột bên, ô cao nhất / thấp nhất mang nhãn có biểu
  tượng. Khi "Số liệu" là đích danh, tỷ lệ hoàn thành thành tỷ lệ đích danh —
  đúng tiêu chí phía Thuế đang dùng để xếp hạng.

  Thang: tỷ lệ 0–100% (vượt 100% thì thanh đầy, số vẫn nói đúng); số cuộc và
  bình quân theo giá trị lớn nhất của nhóm. Một chuỗi số, một màu `--data`.
*/
type XepTheo = "" | "so" | "bq";

function XepHang({ ky, dd }: { ky: KyQ; dd: boolean }) {
  const [nhom, datNhom] = useThamSo<"" | "tcs">("nhomk", "", ["", "tcs"]);
  const [xep, datXep] = useThamSo<XepTheo>("xep", "", ["", "so", "bq"]);
  const dv = nhom === "tcs" ? DON_VI_KT.filter((d) => d.khoi === "TCS") : PHONG_KT;
  const nhanTyLe = dd ? "Tỷ lệ đích danh" : "Tỷ lệ hoàn thành";
  const tieuChi: Record<XepTheo, { nhan: string; gia: (c: ChiSoKT) => number | null; hien: (c: ChiSoKT) => string }> = {
    "": { nhan: nhanTyLe, gia: tyLeHT, hien: (c) => pt(tyLeHT(c)) },
    so: { nhan: dd ? "Cuộc đích danh hoàn thành" : "Số cuộc hoàn thành", gia: (c) => c.htNay, hien: (c) => integer(c.htNay) },
    bq: { nhan: "Bình quân / cuộc · tỷ đồng", gia: binhQuan, hien: (c) => tyBQ(binhQuan(c)) },
  };
  const chinh = tieuChi[xep];
  const ds = dv.map((d) => ({ d, c: dd ? soLieuKT(d.id, ky.thang).dichDanh : soLieuKT(d.id, ky.thang).chung }))
    .sort((a, b) => (chinh.gia(b.c) ?? -1) - (chinh.gia(a.c) ?? -1));
  const thang = xep === "" ? 1 : Math.max(1e-9, ...ds.map((x) => chinh.gia(x.c) ?? 0));
  const phu = (["", "so", "bq"] as XepTheo[]).filter((k) => k !== xep);
  /* Cao nhất / thấp nhất của hai tiêu chí bên, tính trên CẢ nhóm. */
  const cucTri = Object.fromEntries(phu.map((k) => {
    const xepK = ds.filter((x) => tieuChi[k].gia(x.c) !== null).sort((a, b) => tieuChi[k].gia(b.c)! - tieuChi[k].gia(a.c)!);
    return [k, { cao: xepK[0]?.d.id, thap: xepK[xepK.length - 1]?.d.id }];
  })) as Record<XepTheo, { cao?: string; thap?: string }>;
  const nhan = (k: XepTheo, id: string) => cucTri[k]?.cao === id
    ? <em className="kt-cuc is-cao"><Icon name="chevronUp" size={12}/>Cao nhất</em>
    : cucTri[k]?.thap === id ? <em className="kt-cuc is-thap"><Icon name="chevronDown" size={12}/>Thấp nhất</em> : null;

  return <Panel title="Xếp hạng đơn vị" subtitle={`${chinh.nhan}, cao nhất trên đầu · ${dd ? "kế hoạch đích danh" : "tất cả các cuộc"} · lũy kế đến ${ngayCuoi(ky)}`}
    actions={<div className="inline-controls kt-dieu-khien">
      <label className="kt-loc-khoi kt-xep-theo"><span className="sr-only">Xếp theo</span>
        <select className="bo-loc-select" value={xep} onChange={(e) => datXep(e.target.value as XepTheo)}>
          <option value="">Xếp theo {nhanTyLe.toLowerCase()}</option>
          <option value="so">Xếp theo số cuộc</option>
          <option value="bq">Xếp theo bình quân / cuộc</option>
        </select>
      </label>
      <Segmented label="So trong" value={nhom} onChange={datNhom} options={[{ value: "", label: "5 Phòng Kiểm tra" }, { value: "tcs", label: "25 Thuế cơ sở" }]}/>
    </div>}>
    <TableWrap label={`Xếp hạng đơn vị theo ${chinh.nhan.toLowerCase()}`}>
      <table className="qd-bang kt-dg-bang">
        <thead><tr>
          <th scope="col" className="num kt-dg-hang">Hạng</th>
          <th scope="col">Đơn vị</th>
          <th scope="col" className="kt-dg-cot-thanh">{chinh.nhan}</th>
          {phu.map((k) => <th key={k} scope="col" className="num">{tieuChi[k].nhan}</th>)}
        </tr></thead>
        <tbody>{ds.map((x, i) => <tr key={x.d.id}>
          <td className="num kt-dg-hang">{i + 1}</td>
          <th scope="row">{x.d.ten}</th>
          <td className="kt-dg-cot-thanh">
            <span className="kt-dg-thanh">
              <span className="kt-thanh is-ngang" aria-hidden="true"><i style={{ transform: `scaleX(${Math.min(1, Math.max(0, (chinh.gia(x.c) ?? 0) / thang))})` }}/></span>
              <b>{chinh.hien(x.c)}</b>
            </span>
          </td>
          {phu.map((k) => <td key={k} className="num"><span className="kt-dg-o">{nhan(k, x.d.id)}{tieuChi[k].hien(x.c)}</span></td>)}
        </tr>)}</tbody>
      </table>
    </TableWrap>
  </Panel>;
}

/* =====================================================================
   Số cuộc hoàn thành theo loại hình (tài liệu 30-10, Bảng 4)
   ===================================================================== */

function TheoLoaiHinh({ ky, chon }: { ky: KyQ; chon: PhamViKT }) {
  const dong = PHONG_KT.map((p) => ({ id: p.id, ten: p.ten, s: soLieuKT(p.id, ky.thang) }));
  const vp = { s: { loai: LOAI_HINH.reduce((a, l) => ({ ...a, [l.id]: dong.reduce((s, d) => s + d.s.loai[l.id], 0) }), {} as Record<string, number>) } };
  const tong = (loai: Record<string, number>) => LOAI_HINH.reduce((a, l) => a + loai[l.id], 0);
  const max = Math.max(...dong.map((d) => tong(d.s.loai)));
  return <Panel title="Số cuộc hoàn thành theo loại hình" subtitle={`Năm Phòng Kiểm tra · lũy kế đến ${ngayCuoi(ky)}`}>
    <TableWrap label="Số cuộc hoàn thành theo loại hình">
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
    </TableWrap>
  </Panel>;
}

/* =====================================================================
   Xuất Excel — đủ 32 cột của sheet Chi tiết TTKT
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

async function xuatExcel(ky: KyQ, actor: string) {
  const rows: ReportValue[][] = [hang32("A", "", "Toàn ngành", "TN", ky.thang, true)];
  (["VP", "TCS"] as KhoiKT[]).forEach((k, i) => {
    rows.push(hang32(i ? "II" : "I", "", NHAN_KHOI_KT[k], k, ky.thang, true));
    DON_VI_KT.filter((d) => d.khoi === k).forEach((d, j) => rows.push(hang32(String(j + 1), d.ma, d.ten, d.id, ky.thang, d.coChiTieu)));
  });
  const loai: ReportSheet = {
    name: "Loai_hinh", title: "SỐ LƯỢNG HOÀN THÀNH THEO LOẠI HÌNH", headers: ["Phòng kiểm tra", ...LOAI_HINH.map((l) => l.nhan), "Tổng"],
    rows: PHONG_KT.map((p) => { const s = soLieuKT(p.id, ky.thang); return [p.ten, ...LOAI_HINH.map((l) => s.loai[l.id]), LOAI_HINH.reduce((a, l) => a + s.loai[l.id], 0)]; }),
  };
  await exportExcel([
    { name: "Chi_tiet_TTKT", title: `KẾT QUẢ THỰC HIỆN CÔNG TÁC KIỂM TRA TẠI TRỤ SỞ NNT TOÀN NGÀNH · LŨY KẾ ĐẾN ${ngayCuoi(ky)}`, unit: "số tiền: triệu đồng", headers: DAU_32, rows, percent: PHAN_TRAM_32 },
    loai,
  ], { period: `Lũy kế từ 01/01 đến ${ngayCuoi(ky)}`, scope: "Toàn ngành · Phòng Kiểm tra và Thuế cơ sở", actor, status: "DRAFT" }, `kiem-tra-tai-tru-so_2026-${String(ky.thang).padStart(2, "0")}.xlsx`);
}
