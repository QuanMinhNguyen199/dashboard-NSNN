import { Fragment, useMemo, useState, type ReactNode } from "react";
import { GhiChu } from "@/components/GhiChu";
import { Badge, integer, NhomNut, Pager, Panel, Segmented, SelectMenu, TableWrap } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportValue } from "@/domain/reportExport";
import { useThamSo } from "@/state/diaChi";
import type { KyQ } from "@/data/qldn";
import {
  CACH_TINH, DON_VI_HOAN, cham, conLai, hoSoHoan, lechTien, ngayXuLy, tenDonViHoan,
  type CauHinhHan, type HoSoHoan,
} from "@/data/hoanGTGT";

/*
  Tab Hoàn GTGT — đặc tả "Hoàn GTGT" và biên bản 28/10/2026 (folder HoanGTGT).

  Phạm vi theo kết luận 7: CHỈ hồ sơ hoàn trước – kiểm sau do khối quản lý
  xử lý; hồ sơ kiểm trước bị lọc ra và chỉ được đếm ở dòng trạng thái. Báo
  cáo tháng trả lời ba câu: hoàn bao nhiêu hồ sơ, bao nhiêu tiền, bao nhiêu
  hồ sơ ra quyết định chậm — cộng hồ sơ lệch tiền (đặc tả mục 6). Số phải
  hoàn tạm gác (kết luận 6), nên bảng đơn vị không có cột số đề nghị đang xử lý.

  Kỳ báo cáo là tháng của NGÀY QUYẾT ĐỊNH HOÀN (giả định Q3 của đặc tả).
*/

const ty = (trieu: number) => (trieu / 1000).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pt = (a: number, b: number) => (b ? `${((a / b) * 100).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : "—");
const ngay = (d: Date | null) => (d ? d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");
const so0 = (x: number) => (x ? integer(x) : <span className="cell-empty">–</span>);
const homNay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

type Pham = "thang" | "luyKe";
interface DongDV { tiepNhan: number; deNghi: number; hoanThanh: number; deNghiHT: number; daHoan: number; htCham: number; dangXL: number; dangXLQuaHan: number }

function tongHop(ds: HoSoHoan[], ch: CauHinhHan, tu: Date, den: Date, hn: Date): DongDV {
  const trong = (d: Date | null) => d !== null && d >= tu && d <= den;
  const nhan = ds.filter((h) => trong(h.ngayNhan));
  const ht = ds.filter((h) => trong(h.ngayQD));
  /* Đang xử lý tính tại cuối kỳ: đã nhận, chưa có quyết định đến ngày đó. */
  const moc = den < hn ? den : hn;
  const dang = ds.filter((h) => h.ngayNhan <= moc && (!h.ngayQD || h.ngayQD > moc));
  return {
    tiepNhan: nhan.length, deNghi: nhan.reduce((a, h) => a + h.deNghi, 0),
    hoanThanh: ht.length, deNghiHT: ht.reduce((a, h) => a + h.deNghi, 0), daHoan: ht.reduce((a, h) => a + (h.duocHoan ?? 0), 0),
    htCham: ht.filter((h) => cham(h, ch)).length,
    dangXL: dang.length, dangXLQuaHan: dang.filter((h) => (conLai(h, ch, moc) ?? 1) <= 0).length,
  };
}

/*
  Cột theo Phụ lục 02, gom ba nhóm (tiếp nhận · hoàn thành · đang xử lý) để
  tiêu đề con ngắn lại và bảng vừa 1440px không cuộn ngang. `nhan` là tên
  đầy đủ cho Excel. Đỏ chỉ ở "quá hạn" — việc còn phải xử lý; số chậm đã
  xong để màu mực (đỏ là tín hiệu, không phải nền của cả cột).
*/
type NhomCot = "tn" | "ht" | "dx";
const NHOM_COT: { id: NhomCot; nhan: string }[] = [{ id: "tn", nhan: "Tiếp nhận" }, { id: "ht", nhan: "Hoàn thành" }, { id: "dx", nhan: "Đang xử lý" }];
const COT: { nhom: NhomCot; ngan: string; nhan: string; o: (d: DongDV) => ReactNode; x: (d: DongDV) => ReportValue }[] = [
  { nhom: "tn", ngan: "Hồ sơ", nhan: "HS tiếp nhận", o: (d) => so0(d.tiepNhan), x: (d) => d.tiepNhan },
  { nhom: "tn", ngan: "Đề nghị", nhan: "Số đề nghị hoàn", o: (d) => so0(Math.round(d.deNghi)), x: (d) => Math.round(d.deNghi) },
  { nhom: "ht", ngan: "Hồ sơ", nhan: "HS hoàn thành", o: (d) => so0(d.hoanThanh), x: (d) => d.hoanThanh },
  { nhom: "ht", ngan: "Đề nghị", nhan: "Số đề nghị (HS hoàn thành)", o: (d) => so0(Math.round(d.deNghiHT)), x: (d) => Math.round(d.deNghiHT) },
  { nhom: "ht", ngan: "Đã hoàn", nhan: "Số thuế đã hoàn", o: (d) => <strong>{so0(Math.round(d.daHoan))}</strong>, x: (d) => Math.round(d.daHoan) },
  { nhom: "ht", ngan: "Tỷ lệ", nhan: "Tỷ lệ hoàn thành", o: (d) => (d.hoanThanh + d.dangXL ? pt(d.hoanThanh, d.hoanThanh + d.dangXL) : <span className="cell-empty">–</span>), x: (d) => (d.hoanThanh + d.dangXL ? d.hoanThanh / (d.hoanThanh + d.dangXL) : null) },
  { nhom: "ht", ngan: "Chậm", nhan: "HS hoàn thành chậm", o: (d) => so0(d.htCham), x: (d) => d.htCham },
  { nhom: "dx", ngan: "Hồ sơ", nhan: "HS đang xử lý", o: (d) => so0(d.dangXL), x: (d) => d.dangXL },
  { nhom: "dx", ngan: "Quá hạn", nhan: "HS đang xử lý quá hạn", o: (d) => (d.dangXLQuaHan ? <span className="hg-do">{integer(d.dangXLQuaHan)}</span> : so0(0)), x: (d) => d.dangXLQuaHan },
];
const dauNhom = (i: number) => i > 0 && COT[i].nhom !== COT[i - 1].nhom;

/*
  Ô "Hạn xử lý" — đổi cách tính chậm cho cả màn. Đứng ở đầu phải hàng tab như
  ô "Số liệu" của tab Kiểm tra tại trụ sở NNT (cùng chỗ, cùng khuôn); trên
  điện thoại đứng đầu nội dung. Hai ngưỡng là tham số, chưa chốt (Q1, Q2).
*/
export function OHanHoan({ lop }: { lop: string }) {
  const [cachId, datCach] = useThamSo<string>("han", "tt", CACH_TINH.map((c) => c.id));
  return <div className={`bo-loc-muc kt-o-loai ${lop}`}>
    <span className="bo-loc-nhan" id={`${lop}-han`}>Hạn xử lý</span>
    <NhomNut labelledBy={`${lop}-han`} value={cachId} onChange={datCach} options={CACH_TINH.map((c) => ({ value: c.id, label: c.ngan, title: c.nhan }))}/>
  </div>;
}

export function HoanGTGT({ ky, actor }: { ky: KyQ; actor: string }) {
  const [cachId] = useThamSo<string>("han", "tt", CACH_TINH.map((c) => c.id));
  const cach = CACH_TINH.find((c) => c.id === cachId)!;
  const ch = cach.ch;
  const tatCa = hoSoHoan();
  const ds = useMemo(() => tatCa.filter((h) => h.phanLoai === "truoc"), [tatCa]);
  const hn = homNay();
  const dauThang = new Date(2026, ky.thang - 1, 1), cuoiThang = new Date(2026, ky.thang, 0), dauNam = new Date(2026, 0, 1);
  const trongThang = (d: Date | null) => d !== null && d >= dauThang && d <= cuoiThang;
  const daHoan = ds.filter((h) => trongThang(h.ngayQD));
  const tienHoan = daHoan.reduce((a, h) => a + (h.duocHoan ?? 0), 0);
  const deNghi = daHoan.reduce((a, h) => a + h.deNghi, 0);
  const chamT = daHoan.filter((h) => cham(h, ch));
  const lech = daHoan.filter(lechTien);
  const lk = ds.filter((h) => h.ngayQD && h.ngayQD >= dauNam && h.ngayQD <= cuoiThang);
  const thangChu = `${String(ky.thang).padStart(2, "0")}/2026`;
  const tenMoc = ch.moc === "nhan" ? "ngày nhận hồ sơ" : "ngày thông báo chấp nhận";
  /* Câu phát hiện của tháng — đứng ngay dưới tiêu đề khối, nơi được đọc trước. */
  const chamTheoDV = DON_VI_HOAN.map((d) => ({ d, n: chamT.filter((h) => h.donVi === d.id).length })).sort((a, b) => b.n - a.n)[0];
  const hetHan = ds.filter((h) => !h.ngayQD && (conLai(h, ch, hn) ?? 1) <= 0).length;
  const phatHien = [
    chamT.length ? `${integer(chamT.length)}/${integer(daHoan.length)} hồ sơ ra quyết định chậm, nhiều nhất ${chamTheoDV.d.ten} (${chamTheoDV.n})` : `Không hồ sơ nào ra quyết định chậm trong ${integer(daHoan.length)} hồ sơ đã hoàn`,
    hetHan ? `${hetHan} hồ sơ đang xử lý đã hết hạn` : "chưa hồ sơ đang xử lý nào hết hạn",
  ].join(" · ");

  const xuat = () => {
    const dong = (tu: Date) => DON_VI_HOAN.map((d) => [d.ten, ...COT.map((c) => c.x(tongHop(ds.filter((h) => h.donVi === d.id), ch, tu, cuoiThang, hn)))]);
    const tong = (tu: Date) => ["TỔNG", ...COT.map((c) => c.x(tongHop(ds, ch, tu, cuoiThang, hn)))];
    return exportExcel([
      { name: "Theo_don_vi_thang", title: `HỒ SƠ HOÀN TRƯỚC – KIỂM TRA SAU THUẾ GTGT · THÁNG ${thangChu}`, unit: "hồ sơ; triệu đồng", headers: ["Phòng / Thuế cơ sở", ...COT.map((c) => c.nhan)], rows: [tong(dauThang), ...dong(dauThang)], percent: [6], bold: [0] },
      { name: "Theo_don_vi_luy_ke", title: `HỒ SƠ HOÀN TRƯỚC – KIỂM TRA SAU THUẾ GTGT · LŨY KẾ 01/01 – ${ngay(cuoiThang)}`, unit: "hồ sơ; triệu đồng", headers: ["Phòng / Thuế cơ sở", ...COT.map((c) => c.nhan)], rows: [tong(dauNam), ...dong(dauNam)], percent: [6], bold: [0] },
      { name: "Ho_so_da_hoan", title: `HỒ SƠ ĐÃ CÓ QUYẾT ĐỊNH HOÀN TRONG THÁNG ${thangChu}`, unit: "triệu đồng",
        headers: ["Mã hồ sơ", "MST", "Tên NNT", "Đơn vị quản lý", "Ngày nhận", "Ngày TB chấp nhận", "Ngày quyết định hoàn", "Ngày lệnh hoàn", `Ngày làm việc (từ ${tenMoc})`, "Chậm", "Số đề nghị", "Số được hoàn", "Số hoàn trực tiếp", "Lệch tiền", "Hoàn kiêm bù trừ"],
        rows: daHoan.map((h) => [h.id, h.mst, h.tenNNT, tenDonViHoan(h.donVi), ngay(h.ngayNhan), ngay(h.ngayTBCN), ngay(h.ngayQD), ngay(h.ngayLenh), ngayXuLy(h, ch), cham(h, ch) ? "Có" : "", h.deNghi, h.duocHoan, h.hoanTrucTiep, lechTien(h) ? "Có" : "", h.buTru ? "Có" : ""]) },
    ], { period: `Tháng ${thangChu}`, scope: `Hoàn trước – kiểm sau · ${cach.nhan}`, actor, status: "DRAFT" }, `hoan-gtgt_2026-${String(ky.thang).padStart(2, "0")}.xlsx`);
  };

  return <>
    <OHanHoan lop="kt-loai-dt"/>
    <Panel title={`Hoàn trước – kiểm sau · tháng ${thangChu}`} subtitle={phatHien}
      tieuDeKem={<GhiChu tieuDe="Cách tính hạn và nguồn"><p>Hạn: {cach.nhan}, ngày làm việc bỏ thứ Bảy, Chủ nhật, kết thúc ở ngày quyết định hoàn (không phải lệnh hoàn) · kỳ theo tháng của ngày quyết định hoàn · nguồn TMS chức năng 6.2 · lọc hoàn trước – kiểm sau theo "Phân loại nhận xét hồ sơ hoàn thuế" · đã loại {integer(tatCa.length - ds.length)} hồ sơ kiểm trước – hoàn sau · không dùng trường "trạng thái" và "số ngày quá hạn" của TMS · ngày lễ chưa trừ · dữ liệu mô phỏng</p></GhiChu>}
      actions={<ExportButton onExport={xuat}>Xuất Excel</ExportButton>}>
      <div className="kt-o-so">
        <OHg ten="Số hồ sơ đã hoàn" to={integer(daHoan.length)} donVi="hồ sơ" cachTinh="có quyết định hoàn trong tháng"
          phu={<>Lũy kế từ 01/01: <b>{integer(lk.length)}</b> hồ sơ</>}
          moc={<span className="kt-moc"><em>Đang xử lý cuối tháng</em><span>{integer(tongHop(ds, ch, dauThang, cuoiThang, hn).dangXL)} hồ sơ</span></span>}/>
        <OHg ten="Số tiền đã hoàn" to={ty(tienHoan)} donVi="tỷ đồng" cachTinh="số được hoàn ghi trên quyết định hoàn"
          phu={<>Đề nghị <b>{ty(deNghi)}</b> · không được hoàn {ty(deNghi - tienHoan)} tỷ</>}
          moc={<span className="kt-moc"><em>Lũy kế từ 01/01</em><span>{ty(lk.reduce((a, h) => a + (h.duocHoan ?? 0), 0))} tỷ đồng</span></span>}/>
        <OHg ten="Số hồ sơ chậm" to={integer(chamT.length)} donVi="hồ sơ" tone={chamT.length ? "do" : undefined} cachTinh={`quá ${ch.nguong} ngày làm việc từ ${tenMoc}`} thanh={daHoan.length ? chamT.length / daHoan.length : 0}
          phu={<><b>{pt(chamT.length, daHoan.length)}</b> số hồ sơ đã hoàn trong tháng</>}
          moc={<span className="kt-moc"><em>Lũy kế từ 01/01</em><span>{integer(lk.filter((h) => cham(h, ch)).length)} hồ sơ</span></span>}/>
        <OHg ten="Hồ sơ lệch tiền" to={integer(lech.length)} donVi="hồ sơ" cachTinh="số được hoàn khác số hoàn trực tiếp"
          phu={<>Trong đó <b>{integer(lech.filter((h) => h.buTru).length)}</b> hồ sơ hoàn kiêm bù trừ</>}
          moc={<span className="kt-moc"><em>Tổng chênh lệch</em><span>{ty(lech.reduce((a, h) => a + (h.duocHoan! - h.hoanTrucTiep!), 0))} tỷ đồng</span></span>}/>
      </div>
    </Panel>

    {/* Danh sách nhắc hạn là việc làm hằng ngày — đứng TRƯỚC bảng dài theo đơn vị. */}
    <HoSoCanXem ds={ds} daHoan={daHoan} chamT={chamT} lech={lech} ch={ch} hn={hn} tenMoc={tenMoc}/>
    <BangDonVi ds={ds} ch={ch} dauThang={dauThang} cuoiThang={cuoiThang} hn={hn} thangChu={thangChu}/>

  </>;
}

function OHg({ ten, to, donVi, cachTinh, thanh, phu, moc, tone }: { ten: string; to: string; donVi?: string; cachTinh: string; thanh?: number; phu: ReactNode; moc: ReactNode; tone?: "do" }) {
  return <div className="kt-o">
    <span className="kt-o-ten">{ten}</span>
    <strong className={`kt-o-to${tone === "do" ? " hg-do" : ""}`}>{to}{donVi && <small> {donVi}</small>}</strong>
    <small className="kt-o-cach">{cachTinh}</small>
    <span className={`kt-thanh${thanh === undefined ? " is-trong" : ""}${tone === "do" ? " hg-thanh-do" : ""}`} aria-hidden="true">{thanh !== undefined && <i style={{ transform: `scaleX(${Math.min(1, Math.max(0, thanh))})` }}/>}</span>
    <span className="kt-o-phu">{phu}</span>
    {moc}
  </div>;
}

/*
  Bảng theo đơn vị — cột theo Phụ lục 02 của báo cáo giao ban T9/2026, bỏ cột
  "số đề nghị (đang xử lý)" vì số phải hoàn đang tạm gác. Thuế cơ sở phần lớn
  không phát sinh hồ sơ hoàn trước: các dòng toàn số 0 gom lại sau một nút.
*/
function BangDonVi({ ds, ch, dauThang, cuoiThang, hn, thangChu }: { ds: HoSoHoan[]; ch: CauHinhHan; dauThang: Date; cuoiThang: Date; hn: Date; thangChu: string }) {
  const [pham, datPham] = useState<Pham>("luyKe");
  const [moRong, datMoRong] = useState(false);
  const tu = pham === "thang" ? dauThang : new Date(2026, 0, 1);
  const th = (l: HoSoHoan[]) => tongHop(l, ch, tu, cuoiThang, hn);
  const dong = DON_VI_HOAN.map((d) => ({ d, s: th(ds.filter((h) => h.donVi === d.id)) }));
  const rong = (s: DongDV) => !s.tiepNhan && !s.hoanThanh && !s.dangXL;
  const tcs = dong.filter((x) => x.d.khoi === "TCS");
  const tcsHien = moRong ? tcs : tcs.filter((x) => !rong(x.s));
  const soAn = tcs.length - tcsHien.length;
  const khoi = (k: "VP" | "TCS") => th(ds.filter((h) => DON_VI_HOAN.find((d) => d.id === h.donVi)?.khoi === k));
  const Hang = ({ ten, s, lop, cap }: { ten: string; s: DongDV; lop?: string; cap?: boolean }) => <tr className={lop}>
    <th scope="row" className={cap ? "hg-cap" : undefined}>{ten}</th>{COT.map((c, i) => <td key={i} className={`num${dauNhom(i) ? " hg-dau-nhom" : ""}`}>{c.o(s)}</td>)}
  </tr>;
  return <Panel title="Theo đơn vị quản lý" subtitle={`${pham === "thang" ? `Tháng ${thangChu}` : `Lũy kế 01/01 – ${ngay(cuoiThang)}`} · hồ sơ hoàn trước – kiểm sau · số tiền triệu đồng`}
    actions={<Segmented label="Phạm vi số liệu" value={pham} onChange={datPham} options={[{ value: "thang", label: "Tháng" }, { value: "luyKe", label: "Lũy kế" }]}/>}>
    <TableWrap label="Hồ sơ hoàn trước theo đơn vị quản lý">
      <table className="qd-bang hg-bang">
        <thead>
          <tr><th scope="col" rowSpan={2} className="hg-dv">Phòng / Thuế cơ sở</th>{NHOM_COT.map((n) => <th key={n.id} scope="colgroup" colSpan={COT.filter((c) => c.nhom === n.id).length} className="hg-nhom">{n.nhan}</th>)}</tr>
          <tr>{COT.map((c, i) => <th key={c.nhan} scope="col" className={`num${dauNhom(i) ? " hg-dau-nhom" : ""}`} title={c.nhan}>{c.ngan}</th>)}</tr>
        </thead>
        <tbody>
          <Hang ten="Tổng" s={th(ds)} lop="hg-tong"/>
          <Hang ten="Khối VP Thuế TP" s={khoi("VP")} lop="hg-khoi"/>
          {dong.filter((x) => x.d.khoi === "VP").map((x) => <Hang key={x.d.id} ten={x.d.ten} s={x.s} cap/>)}
          <Hang ten="Khối Thuế cơ sở" s={khoi("TCS")} lop="hg-khoi"/>
          {tcsHien.map((x) => <Hang key={x.d.id} ten={x.d.ten} s={x.s} cap/>)}
          {(soAn > 0 || moRong) && <tr className="hg-an"><td colSpan={COT.length + 1}>
            <button type="button" className="hg-nut-an" aria-expanded={moRong} onClick={() => datMoRong(!moRong)}>{moRong ? "Ẩn các Thuế cơ sở không phát sinh" : `Hiện ${soAn} Thuế cơ sở không phát sinh hồ sơ`}</button>
          </td></tr>}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}

/*
  Ba danh sách cần cán bộ xem, gộp thành tab kèm số lượng. "Sắp hết hạn" là
  chức năng NHẮC NGHIỆP VỤ (kết luận 4): hồ sơ chưa có quyết định hoàn, xếp
  theo số ngày còn lại tăng dần, đếm tới hôm nay — không đưa vào báo cáo tháng.
*/
type DS = "nhac" | "cham" | "lech";
const MOI_TRANG = 8;
function HoSoCanXem({ ds, daHoan, chamT, lech, ch, hn, tenMoc }: { ds: HoSoHoan[]; daHoan: HoSoHoan[]; chamT: HoSoHoan[]; lech: HoSoHoan[]; ch: CauHinhHan; hn: Date; tenMoc: string }) {
  const [tab, datTab] = useState<DS>("nhac");
  const [trang, datTrang] = useState(1);
  const dang = useMemo(() => ds.filter((h) => !h.ngayQD).map((h) => ({ h, con: conLai(h, ch, hn) })).sort((a, b) => (a.con ?? 99) - (b.con ?? 99)), [ds, ch, hn]);
  const hetHan = dang.filter((x) => x.con !== null && x.con <= 0).length;
  const dem: Record<DS, number> = { nhac: dang.length, cham: chamT.length, lech: lech.length };
  const nhan: Record<DS, string> = { nhac: "Đang xử lý · nhắc hạn", cham: "Đã hoàn chậm", lech: "Lệch tiền" };
  const doiTab = (t: DS) => { datTab(t); datTrang(1); };
  const tong = dem[tab];
  const soTrang = Math.max(1, Math.ceil(tong / MOI_TRANG));
  const cat = <T,>(l: T[]) => l.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);
  /* Dưới 640px bảng thành danh sách hai dòng: cột chính (hạn, số ngày, chênh lệch) ở lại bên phải,
     các trường khác xuống dòng phụ `.hg-dt` — chuyển chỗ, không bỏ. */
  const ttDN = (h: HoSoHoan, dt: string) => <><span className="pkt-dn">{h.tenNNT}</span><small>{h.mst} · {h.id} · {tenDonViHoan(h.donVi)}</small><small className="hg-dt">{dt}</small></>;

  return <Panel title="Hồ sơ cần xem" subtitle={tab === "nhac" ? `Chưa có quyết định hoàn, đếm tới hôm nay ${ngay(hn)} · ${hetHan ? `${hetHan} hồ sơ đã hết hạn` : "chưa hồ sơ nào hết hạn"}` : tab === "cham" ? `Quyết định hoàn trong tháng, quá ${ch.nguong} ngày làm việc từ ${tenMoc}` : "Quyết định hoàn trong tháng · số được hoàn khác số hoàn trực tiếp · đánh dấu để xem, không tự sửa số"}
    actions={/* Dropdown ngang tiêu đề panel (04/11/2026), như Xếp hạng đơn vị của Phòng kiểm tra; số lượng giữ trong tên lựa chọn. */
      <SelectMenu label="Danh sách hồ sơ cần xem" className="kt-loc-khoi kt-xep-theo" value={tab} onChange={doiTab}
        options={(["nhac", "cham", "lech"] as DS[]).map((t) => ({ value: t, label: nhan[t] }))}/>}>
    {!tong ? <p className="pkt-trong">{tab === "nhac" ? "Không có hồ sơ hoàn trước nào đang chờ quyết định." : tab === "cham" ? "Không có hồ sơ nào ra quyết định chậm trong tháng." : `Không có hồ sơ lệch tiền trong ${integer(daHoan.length)} hồ sơ đã hoàn của tháng.`}</p>
      : <TableWrap label={nhan[tab]}>
        <table className="qd-bang hg-ds">
          {tab === "nhac" && <>
            <thead><tr><th scope="col">Hồ sơ</th><th scope="col" className="hg-an-dt">Ngày nhận</th><th scope="col" className="hg-an-dt">TB chấp nhận</th><th scope="col" className="num hg-an-dt">Số đề nghị · tr.đ</th><th scope="col">Hạn</th></tr></thead>
            <tbody>{cat(dang).map(({ h, con }) => <tr key={h.id}>
              <th scope="row">{ttDN(h, `Nhận ${ngay(h.ngayNhan)} · TB chấp nhận ${ngay(h.ngayTBCN)} · đề nghị ${integer(h.deNghi)} tr.đ`)}</th><td className="hg-an-dt">{ngay(h.ngayNhan)}</td><td className="hg-an-dt">{ngay(h.ngayTBCN)}</td><td className="num hg-an-dt">{integer(h.deNghi)}</td>
              <td>{con === null ? <Badge tone="neutral">Chờ thông báo chấp nhận</Badge> : con <= 0 ? <Badge tone="critical">{con < 0 ? `Quá hạn ${-con} ngày` : "Hết hạn hôm nay"}</Badge> : <Badge tone={con <= 2 ? "warning" : "neutral"}>Còn {con} ngày</Badge>}</td>
            </tr>)}</tbody>
          </>}
          {tab === "cham" && <>
            <thead><tr><th scope="col">Hồ sơ</th><th scope="col" className="hg-an-dt">Ngày nhận</th><th scope="col" className="hg-an-dt">TB chấp nhận</th><th scope="col" className="hg-an-dt">Quyết định hoàn</th><th scope="col" className="num">Ngày làm việc</th><th scope="col" className="num hg-an-dt">Số được hoàn · tr.đ</th></tr></thead>
            <tbody>{cat(chamT).map((h) => <tr key={h.id}>
              <th scope="row">{ttDN(h, `Nhận ${ngay(h.ngayNhan)} · quyết định ${ngay(h.ngayQD)} · được hoàn ${integer(h.duocHoan ?? 0)} tr.đ`)}</th><td className="hg-an-dt">{ngay(h.ngayNhan)}</td><td className="hg-an-dt">{ngay(h.ngayTBCN)}</td><td className="hg-an-dt">{ngay(h.ngayQD)}</td>
              <td className="num"><span className="hg-do">{ngayXuLy(h, ch)}</span><small className="hg-nguong"> / {ch.nguong}</small></td><td className="num hg-an-dt">{integer(h.duocHoan ?? 0)}</td>
            </tr>)}</tbody>
          </>}
          {tab === "lech" && <>
            <thead><tr><th scope="col">Hồ sơ</th><th scope="col" className="num hg-an-dt">Đề nghị · tr.đ</th><th scope="col" className="num hg-an-dt">Được hoàn · tr.đ</th><th scope="col" className="num hg-an-dt">Hoàn trực tiếp · tr.đ</th><th scope="col" className="num">Chênh lệch</th><th scope="col" className="hg-an-dt">Ghi chú</th></tr></thead>
            <tbody>{cat(lech).map((h) => <Fragment key={h.id}><tr>
              <th scope="row">{ttDN(h, `Được hoàn ${integer(h.duocHoan!)} · trực tiếp ${integer(h.hoanTrucTiep!)} tr.đ · ${h.buTru ? "hoàn kiêm bù trừ" : "chờ nghiệp vụ ghi lý do"}`)}</th><td className="num hg-an-dt">{integer(h.deNghi)}</td><td className="num hg-an-dt">{integer(h.duocHoan!)}</td><td className="num hg-an-dt">{integer(h.hoanTrucTiep!)}</td>
              <td className="num"><strong>{integer(h.duocHoan! - h.hoanTrucTiep!)}</strong></td>
              <td className="hg-an-dt">{h.buTru ? <Badge tone="info">Hoàn kiêm bù trừ</Badge> : <Badge tone="warning">Chờ nghiệp vụ ghi lý do</Badge>}</td>
            </tr></Fragment>)}</tbody>
          </>}
        </table>
      </TableWrap>}
    <Pager trang={trang} soTrang={soTrang} onChange={datTrang}/>
  </Panel>;
}
