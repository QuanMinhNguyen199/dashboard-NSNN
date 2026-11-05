import { Fragment, useMemo, useState, type ReactNode } from "react";
import { useThamSo, useThamSoSo } from "@/state/diaChi";
import { Button, integer, NhomNut, Pager, Panel, SelectMenu, TableWrap } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportSheet, ReportValue } from "@/domain/reportExport";
import { DON_VI_Q, NHAN_KHOI, nhanPhamVi, type DonViQ, type Khoi, type KyQ, type PhamVi } from "@/data/qldn";
import {
  LA, NHAN_NGAY_KEO_TK, NHAN_NX, TRANG_THAI_TK, congDM, congNT, congXP, daXP, danhSachNT, fNT, gNT, hNT, laCua, nhanXetNT, soNTLa,
  toKhaiTon, tonDM, tyLeDM, xongDM, xongNNT,
  type NNTThua, type NhanXet, type NhanhNT, type SoDM, type SoNT, type SoXP, type ToKhaiTon, type TrangThaiTK,
} from "@/data/ql5";

/*
  Quản lý kê khai — các báo cáo của Phòng QLDN5 (folder 02-11, 02/11/2026).

  Hai tab cũ (Xử phạt VPHC, Đóng mã giải thể) thêm BẢNG THEO MẪU dưới phần
  chỉ tiêu; hai tab mới (Tờ khai tồn trục, Nộp thừa) là bảng theo đơn vị →
  danh sách để xử lý. Không có dải ô tóm tắt: dòng Tổng cộng ghim đầu bảng
  đã nói đủ các số ấy (gọn 02/11/2026). Bấm một dòng đơn vị lọc danh sách bên dưới
  (The Whole Row Rule).
*/

const pt = (x: number | null) => (x === null ? "—" : `${(x * 100).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`);
const so = (x: number) => (x ? integer(x) : <span className="cell-empty">0</span>);
const trieu = (dong: number) => integer(Math.round(dong / 1e6));
const ngay = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const ngayCuoi = (ky: KyQ) => ngay(new Date(2026, ky.thang, 0));
const CO_TRANG = 10;

/* =====================================================================
   Bảng theo đơn vị — khung dòng của mẫu QL5
   ===================================================================== */

/*
  Đơn vị trên bảng như bảng chênh lệch tờ khai: lãnh đạo thấy phạm vi đang
  chọn, cán bộ thấy phòng mình, các vai khác thấy cả khối của đơn vị mình.
  Khung dòng theo mẫu: Tổng cộng → khối phòng QLDN → năm phòng → khối thuế
  cơ sở → 25 Thuế cơ sở. Dòng tổng ĐỨNG YÊN đầu bảng, phần còn lại chia trang
  10 dòng; "Hiển thị" chọn một khối (như bảng Chi tiết của Phòng kiểm tra).
*/
const dongCua = (pv: PhamVi): DonViQ[] => (pv.canBo || pv.vai === "LD" ? pv.donVi : DON_VI_Q.filter((d) => d.khoi === pv.donVi[0].khoi));

interface Cot<T> { nhan: string; ma: string; dau?: boolean; o: (s: T) => ReactNode }
interface NhomCot<T> { nhan?: string; cot: Cot<T>[] }

function BangDonVi<T>({ pv, title, subtitle, label, nhom, gia, chon, datChon, onXuat, ghiChu }: {
  pv: PhamVi; title: string; subtitle: string; label: string;
  nhom: NhomCot<T>[]; gia: (ids: string[]) => T;
  chon?: string; datChon?: (id: string) => void;
  onXuat: () => Promise<void>; ghiChu: ReactNode;
}) {
  const [loc, datLoc] = useThamSo<"" | Khoi>("khoi", "", ["", "VP", "TCS"]);
  const [trang, datTrang] = useThamSoSo("trang", 1);
  const dsDV = dongCua(pv);
  const cuaToi = pv.vai === "LD" ? null : (pv.phongGoc ?? pv.donVi[0]).id;
  const khoi = (["VP", "TCS"] as Khoi[]).filter((k) => dsDV.some((d) => d.khoi === k));
  const haiKhoi = khoi.length === 2;
  const locKhoi = haiKhoi && loc ? loc : "";
  const cot = nhom.flatMap((n) => n.cot);
  const coNhom = nhom.some((n) => n.nhan);

  const dong = (id: string, ids: string[], ten: ReactNode, lop: string, d?: DonViQ) => {
    const s = gia(ids);
    const bam = Boolean(datChon && d);
    return <tr key={id} className={[bam ? "qd-viec" : "", lop, chon === id ? "is-selected" : ""].filter(Boolean).join(" ") || undefined}
      onClick={bam ? () => datChon!(chon === id ? "" : id) : undefined}>
      <th scope="row" className="qd-goc-dv">
        {bam ? <button type="button" className="row-select kt-dv" aria-pressed={chon === id}>{ten}</button> : ten}
        {d?.id === cuaToi && <span className="qd-cua-toi"><span className="sr-only">, </span>Đơn vị của tôi</span>}
      </th>
      {cot.map((k, i) => <td key={i} className={`num${k.dau ? " qd-goc-dau" : ""}`}>{k.o(s)}</td>)}
    </tr>;
  };
  /* "Cộng khối phòng QLDN": chỉ hạ chữ đầu — `toLowerCase` cả cụm làm hỏng "QLDN". */
  const cong = (k: Khoi) => `Cộng ${NHAN_KHOI[k][0].toLowerCase()}${NHAN_KHOI[k].slice(1)}`;
  const idsKhoi = (k: Khoi) => dsDV.filter((d) => d.khoi === k).map((d) => d.id);
  const ghim = dsDV.length < 2 ? null
    : locKhoi ? dong(locKhoi, idsKhoi(locKhoi), cong(locKhoi), "is-tong")
    : dong("TC", dsDV.map((d) => d.id), haiKhoi ? "Tổng cộng" : cong(khoi[0]), "is-tong");
  const muc: { id: string; ve: () => ReactNode }[] = (locKhoi ? [locKhoi] : khoi).flatMap((k) => [
    ...(haiKhoi && !locKhoi ? [{ id: `k-${k}`, ve: () => dong(`k-${k}`, idsKhoi(k), NHAN_KHOI[k], "kt-khoi") }] : []),
    ...dsDV.filter((d) => d.khoi === k).map((d) => ({ id: d.id, ve: () => dong(d.id, [d.id], d.ngan, haiKhoi ? "kt-con" : "", d) })),
  ]);
  const soTrang = Math.max(1, Math.ceil(muc.length / CO_TRANG));
  const tr = Math.min(trang, soTrang);

  return <Panel chinh title={title} subtitle={subtitle}
    actions={<div className="inline-controls kt-dieu-khien">
      {haiKhoi && <SelectMenu<"" | Khoi> className="kt-loc-khoi" label="Hiển thị đơn vị" value={locKhoi} onChange={(v) => { datLoc(v); datTrang(1); }}
        options={[{ value: "", label: "Tất cả đơn vị" }, { value: "VP", label: NHAN_KHOI.VP }, { value: "TCS", label: NHAN_KHOI.TCS }]}/>}
      <ExportButton onExport={onXuat}>Xuất Excel</ExportButton>
    </div>}>
    <TableWrap label={label}>
      <table className="qd-bang qd-bang-goc kt-bang">
        <thead>
          {coNhom && <tr>
            <th scope="col" rowSpan={2} className="qd-goc-dv">Đơn vị</th>
            {nhom.map((n, i) => n.nhan
              ? <th key={i} scope="colgroup" colSpan={n.cot.length} className="qd-goc-nhom qd-goc-dau">{n.nhan}</th>
              : n.cot.map((k) => <th key={k.ma} scope="col" rowSpan={2} className={`num${k.dau ? " qd-goc-dau" : ""}`} title={`Cột ${k.ma} của mẫu`}>{k.nhan}</th>))}
          </tr>}
          <tr>
            {!coNhom && <th scope="col" className="qd-goc-dv">Đơn vị</th>}
            {nhom.filter((n) => n.nhan || !coNhom).flatMap((n) => n.cot).map((k) => <th key={k.ma} scope="col" className={`num${k.dau ? " qd-goc-dau" : ""}`} title={`Cột ${k.ma} của mẫu`}>{k.nhan}</th>)}
          </tr>
        </thead>
        <tbody>
          {ghim}
          {muc.slice((tr - 1) * CO_TRANG, tr * CO_TRANG).map((m) => <Fragment key={m.id}>{m.ve()}</Fragment>)}
        </tbody>
      </table>
    </TableWrap>
    <div className="table-footer">
      <Pager trang={tr} soTrang={soTrang} onChange={datTrang}/>
      <span>{ghiChu}</span>
    </div>
  </Panel>;
}

/** Dòng Excel theo khung mẫu: A tổng, I khối phòng, 1–5, II khối thuế cơ sở, 1–25. */
function hangMau(pv: PhamVi, o: (ids: string[]) => ReportValue[]): ReportValue[][] {
  const dsDV = dongCua(pv);
  const khoi = (["VP", "TCS"] as Khoi[]).filter((k) => dsDV.some((d) => d.khoi === k));
  const rows: ReportValue[][] = [];
  if (dsDV.length > 1) rows.push(["A", "Tổng cộng CCT (=I+II)", ...o(dsDV.map((d) => d.id))]);
  khoi.forEach((k, i) => {
    const ds = dsDV.filter((d) => d.khoi === k);
    if (khoi.length === 2) rows.push([i ? "II" : "I", k === "VP" ? "VP CCT" : "Các Thuế cơ sở", ...o(ds.map((d) => d.id))]);
    ds.forEach((d, j) => rows.push([String(j + 1), d.ten, ...o([d.id])]));
  });
  return rows;
}

/* =====================================================================
   Tab Xử phạt VPHC — mẫu TONG HOP BAO CAO XPVPHC
   ===================================================================== */

/*
  Cột theo sheet TONG HOP: C số tờ khai phải xử phạt, E đã xử phạt = H quyết
  định phạt + I quyết định cảnh cáo, F tỷ lệ = E / C. Cột D "Không xử phạt"
  và J "Không phạt phí" của mẫu để trống, chưa có quy tắc nguồn — không dựng
  trên màn. Số C và E là tử, mẫu của chỉ tiêu 20 ở bảng phía trên.
*/
export function XuPhatDonVi({ pv, ky, actor }: { pv: PhamVi; ky: KyQ; actor: string }) {
  const g = (ids: string[]) => congXP(ids, ky.thang);
  const nhom: NhomCot<SoXP>[] = [
    { cot: [{ nhan: "Số TK phải xử phạt", ma: "C", o: (s) => integer(s.phai) }] },
    { nhan: "Đã xử phạt", cot: [
      { nhan: "Quyết định phạt", ma: "H", dau: true, o: (s) => so(s.qd) },
      { nhan: "Phạt cảnh cáo", ma: "I", o: (s) => so(s.canhCao) },
      { nhan: "Cộng", ma: "E = H + I", o: (s) => <strong>{integer(daXP(s))}</strong> },
    ] },
    { cot: [{ nhan: "Tỷ lệ", ma: "F = E / C", dau: true, o: (s) => <strong>{pt(s.phai ? daXP(s) / s.phai : null)}</strong> }] },
  ];
  const xuat = () => exportExcel([{
    name: "TONG_HOP", title: `BÁO CÁO QUYẾT ĐỊNH VPHC · LŨY KẾ ĐẾN ${ngayCuoi(ky)}`,
    headers: ["STT", "Phòng/cán bộ", "Số TK phải xử phạt", "Không xử phạt", "Đã xử phạt", "Tỷ lệ", "QĐ phạt", "Cảnh cáo", "Không phạt phí"],
    rows: hangMau(pv, (ids) => { const s = g(ids); return [s.phai, null, daXP(s), s.phai ? daXP(s) / s.phai : null, s.qd, s.canhCao, null]; }),
    percent: [5],
  }], { period: `Lũy kế từ 01/01 đến ${ngayCuoi(ky)}`, scope: nhanPhamVi(pv), actor, status: "DRAFT" }, `xu-phat-vphc_${ky.id}.xlsx`);
  return <BangDonVi pv={pv} title="Kết quả xử phạt theo đơn vị" subtitle={`Mẫu TONG HOP báo cáo quyết định VPHC · tờ khai nộp quá hạn · lũy kế đến ${ngayCuoi(ky)}`}
    label="Kết quả xử phạt vi phạm hành chính theo đơn vị" nhom={nhom} gia={g} onXuat={xuat}
    ghiChu="Có quyết định phạt hoặc cảnh cáo là đã xử phạt."/>;
}

/* =====================================================================
   Tab Đóng mã, giải thể — mẫu BC dong MST
   ===================================================================== */

/*
  Cột theo mẫu: C tồn đến thời điểm báo cáo (D CQT, E NNT = C − D); F hoàn
  thành (G TT01, H TT 03–07, I CQT, J NNT = F − I); L tỷ lệ = I / (I + D).
  Cột K "Còn phải thực hiện" của mẫu bằng đúng C — có trong tệp Excel, không
  lặp trên màn. Dòng A của mẫu dùng công thức khác (F / (F + C)); bảng dùng
  một công thức cho mọi dòng và ghi điều này để chốt.
*/
export function DongMSTDonVi({ pv, ky, actor }: { pv: PhamVi; ky: KyQ; actor: string }) {
  const g = (ids: string[]) => congDM(ids, ky.thang);
  const nhom: NhomCot<SoDM>[] = [
    { nhan: "Tồn đến thời điểm báo cáo", cot: [
      { nhan: "Số lượng", ma: "C", dau: true, o: (s) => <strong>{integer(tonDM(s))}</strong> },
      { nhan: "CQT", ma: "D", o: (s) => so(s.tonCQT) },
      { nhan: "NNT", ma: "E = C − D", o: (s) => so(s.tonNNT) },
    ] },
    { nhan: "Hoàn thành đến thời điểm báo cáo", cot: [
      { nhan: "Số lượng", ma: "F = G + H", dau: true, o: (s) => <strong>{integer(xongDM(s))}</strong> },
      { nhan: "TT01", ma: "G", o: (s) => so(s.tt01) },
      { nhan: "TT 03–07", ma: "H", o: (s) => so(s.tt0307) },
      { nhan: "CQT", ma: "I", o: (s) => so(s.xongCQT) },
      { nhan: "NNT", ma: "J = F − I", o: (s) => so(xongNNT(s)) },
    ] },
    { cot: [{ nhan: "Tỷ lệ thực hiện đóng mã", ma: "L = I / (I + D)", dau: true, o: (s) => <strong>{pt(tyLeDM(s))}</strong> }] },
  ];
  const xuat = () => exportExcel([{
    name: "Dong_MST", title: `BÁO CÁO GIẢI THỂ, ĐÓNG MÃ SỐ THUẾ · TỪ 01/04/2026 ĐẾN ${ngayCuoi(ky)}`,
    headers: ["STT", "Phòng/cán bộ", "SL tồn đến thời điểm BC", "Tồn – CQT", "Tồn – NNT", "SL hoàn thành đến thời điểm BC", "TT01", "TT (03-07)", "Hoàn thành – CQT", "Hoàn thành – NNT", "Còn phải thực hiện", "Tỷ lệ thực hiện đóng mã"],
    rows: hangMau(pv, (ids) => { const s = g(ids); return [tonDM(s), s.tonCQT, s.tonNNT, xongDM(s), s.tt01, s.tt0307, s.xongCQT, xongNNT(s), tonDM(s), tyLeDM(s)]; }),
    percent: [11],
  }], { period: `Từ 01/04/2026 đến ${ngayCuoi(ky)}`, scope: nhanPhamVi(pv), actor, status: "DRAFT" }, `dong-mst_${ky.id}.xlsx`);
  return <BangDonVi pv={pv} title="Giải thể, đóng mã số thuế theo đơn vị" subtitle={`Mẫu BC đóng MST · từ 01/04/2026 đến ${ngayCuoi(ky)}`}
    label="Giải thể, đóng mã số thuế theo đơn vị" nhom={nhom} gia={g} onXuat={xuat}
    ghiChu="Tồn + hoàn thành = hồ sơ phải xử lý của chỉ tiêu phát sinh mới."/>;
}

/* =====================================================================
   Tab Tờ khai tồn trục — RS-QL5-06
   ===================================================================== */

/*
  Không có mẫu Excel (tài liệu §6): bảng đơn vị đếm theo bốn trạng thái CQT
  cần xử lý, danh sách xếp tờ khai tồn lâu nhất lên đầu. Đây là ảnh chụp
  của lần kéo gần nhất, không lũy kế theo tháng — thanh phạm vi nói ngày kéo
  thay cho ô Kỳ. Chưa có ngưỡng số ngày tồn nào được chốt, nên không tô màu
  theo tuổi.
*/
type LocTT = "" | TrangThaiTK;

export function ToKhaiTonTruc({ pv, actor }: { pv: PhamVi; actor: string }) {
  const [chon, datChon] = useState("");
  const [loc, datLoc] = useState<LocTT>("");
  const [trang, datTrang] = useState(1);
  const dsDV = dongCua(pv);
  const tatCa = useMemo(() => { const ids = new Set(dsDV.map((d) => d.id)); return toKhaiTon().filter((t) => ids.has(t.la.dvId)); }, [dsDV.map((d) => d.id).join(",")]);
  const cua = (ids: string[]) => tatCa.filter((t) => ids.includes(t.la.dvId));
  const dem = (ds: ToKhaiTon[], tt: TrangThaiTK) => ds.filter((t) => t.trangThai === tt).length;
  const lauNhat = (ds: ToKhaiTon[]) => ds.reduce<ToKhaiTon | null>((a, t) => (!a || t.soNgay > a.soNgay ? t : a), null);

  const nhom: NhomCot<ToKhaiTon[]>[] = [
    { nhan: "Theo trạng thái", cot: TRANG_THAI_TK.map((t, i) => ({ nhan: `${t.id} · ${t.nhan}`, ma: t.id, dau: i === 0, o: (ds: ToKhaiTon[]) => so(dem(ds, t.id)) })) },
    { cot: [
      { nhan: "Cộng", ma: "Cộng", dau: true, o: (ds) => <strong>{integer(ds.length)}</strong> },
      /* Chỉ tờ khai nhận từ 10/2017: 7B nào cũng tồn hơn 3.000 ngày, tính cả thì cột chỉ còn đọc ra "có 7B". */
      { nhan: "Tồn lâu nhất từ 10/2017 (ngày)", ma: "so_ngay_ton", o: (ds) => { const t = lauNhat(ds.filter((x) => x.trangThai !== "7B")); return t ? integer(t.soNgay) : <span className="cell-empty">—</span>; } },
    ] },
  ];
  const dvChon = DON_VI_Q.find((d) => d.id === chon);
  const ds = (chon ? cua([chon]) : tatCa).filter((t) => !loc || t.trangThai === loc).sort((a, b) => b.soNgay - a.soNgay);
  const soTrang = Math.max(1, Math.ceil(ds.length / CO_TRANG));
  const tr = Math.min(trang, soTrang);

  const xuat = () => exportExcel([
    { name: "Theo_don_vi", title: `TỜ KHAI TỒN TRỤC · LẦN KÉO ${NHAN_NGAY_KEO_TK}`, headers: ["STT", "Đơn vị", ...TRANG_THAI_TK.map((t) => `${t.id} – ${t.nhan}`), "Cộng", "Tồn lâu nhất từ 10/2017 (ngày)"],
      rows: hangMau(pv, (ids) => { const x = cua(ids); return [...TRANG_THAI_TK.map((t) => dem(x, t.id)), x.length, lauNhat(x.filter((t) => t.trangThai !== "7B"))?.soNgay ?? null]; }) },
    { name: "Danh_sach", title: "DANH SÁCH TỜ KHAI CẦN XỬ LÝ", headers: ["Đơn vị", "Mã CQT", "Mã số thuế", "Tên NNT", "Mẫu tờ khai", "Kỳ", "Ngày nhận", "Trạng thái", "Nguồn", "Số ngày tồn"],
      rows: [...tatCa].sort((a, b) => b.soNgay - a.soNgay).map((t) => [t.la.nhan, t.la.cqt, t.mst, t.ten, t.mau, t.ky, ngay(t.ngayNhan), t.trangThai, TRANG_THAI_TK.find((x) => x.id === t.trangThai)!.nguon, t.soNgay]) },
  ], { period: `Lần kéo ${NHAN_NGAY_KEO_TK}`, scope: nhanPhamVi(pv), actor, status: "DRAFT" }, "to-khai-ton-truc.xlsx");

  return <>
    <BangDonVi pv={pv} title="Tờ khai tồn trục theo đơn vị" subtitle={`Lần kéo ${NHAN_NGAY_KEO_TK}`}
      label="Tờ khai tồn trục theo đơn vị" nhom={nhom} gia={cua} chon={chon} datChon={(id) => { datChon(id); datTrang(1); }} onXuat={xuat}
      ghiChu="Nghĩa của 4B, 5B, 5G chờ nghiệp vụ xác nhận."/>
    <Panel title={`Danh sách tờ khai${dvChon ? ` · ${dvChon.ngan}` : ""}`} subtitle={`${integer(ds.length)} tờ khai · tồn lâu nhất trên đầu`}
      actions={<div className="inline-controls kt-dieu-khien">
        {dvChon && <Button kind="quiet" onClick={() => { datChon(""); datTrang(1); }}>Bỏ lọc đơn vị</Button>}
        <SelectMenu<LocTT> className="kt-loc-khoi kt-xep-theo" label="Trạng thái" value={loc} onChange={(v) => { datLoc(v); datTrang(1); }}
          options={[{ value: "", label: "Mọi trạng thái" }, ...TRANG_THAI_TK.map((t) => ({ value: t.id, label: `${t.id} · ${t.nhan}` }))]}/>
      </div>}>
      {ds.length ? <TableWrap label="Danh sách tờ khai cần xử lý">
        <table className="qd-bang kt-bang">
          <thead><tr>
            <th scope="col">Mã số thuế</th><th scope="col">Tên NNT</th><th scope="col">Đơn vị</th><th scope="col">Tờ khai</th>
            <th scope="col">Ngày nhận</th><th scope="col">Trạng thái</th><th scope="col" className="num">Số ngày tồn</th>
          </tr></thead>
          <tbody>{ds.slice((tr - 1) * CO_TRANG, tr * CO_TRANG).map((t) => <tr key={t.id}>
            <td className="kt-so-mst">{t.mst}</td>
            <td>{t.ten}</td>
            <td>{t.la.nhan}<small className="kt-ma">CQT {t.la.cqt}</small></td>
            <td>{t.mau}<small className="kt-ma">{t.ky}</small></td>
            <td>{ngay(t.ngayNhan)}</td>
            <td><span className="kk-tt">{t.trangThai}</span> {TRANG_THAI_TK.find((x) => x.id === t.trangThai)!.nhan}</td>
            <td className="num"><strong>{integer(t.soNgay)}</strong></td>
          </tr>)}</tbody>
        </table>
      </TableWrap> : <p className="table-empty">Không có tờ khai nào khớp bộ lọc.</p>}
      <div className="table-footer"><Pager trang={tr} soTrang={soTrang} onChange={datTrang}/></div>
    </Panel>
  </>;
}

/* =====================================================================
   Tab Nộp thừa — TMS 8.5.2, sổ thuế S1/KTT
   ===================================================================== */

/*
  Hai câu theo thứ tự: bao nhiêu tiền thừa trên 1 tỷ đang phải rà soát và đã
  rà được bao nhiêu (bảng trung gian) → NNT nào, mới hay còn từ tháng trước
  (danh sách, số khoản mỗi nhận xét nằm trong ô lọc). Danh sách >10 triệu dùng
  chung bảng, không có nhận xét (tài liệu §1: nhánh >10 triệu không có file
  trung gian hay nhận xét riêng).
*/
type LocNX = "" | NhanXet;

export function NopThua({ pv, ky, actor }: { pv: PhamVi; ky: KyQ; actor: string }) {
  const [chon, datChon] = useState("");
  const [nhanh, datNhanh] = useState<NhanhNT>("ty");
  const [locNX, datLocNX] = useState<LocNX>("");
  const [trang, datTrang] = useState(1);
  const dsDV = dongCua(pv);
  const ids = dsDV.map((d) => d.id);
  const g = (x: string[]) => congNT(x, ky.thang);
  const nx = nhanXetNT(ky.thang, laCua(ids));
  const truoc = `T${ky.thang - 1}`;

  const nhom: NhomCot<SoNT>[] = [
    { cot: [{ nhan: "Số thừa theo kỳ khóa sổ", ma: "C", o: (s) => <strong>{integer(s.c)}</strong> }] },
    { nhan: "Đã thực hiện trong kỳ", cot: [
      { nhan: "Xác nhận thừa đúng", ma: "D", dau: true, o: (s) => so(s.d) },
      { nhan: "Nợ sai đã điều chỉnh", ma: "E", o: (s) => so(s.e) },
      { nhan: "Tổng đã thực hiện", ma: "F = D + E", o: (s) => integer(fNT(s)) },
    ] },
    { cot: [
      { nhan: "Còn phải rà soát", ma: "G = C − F", dau: true, o: (s) => integer(gNT(s)) },
      { nhan: "Tỷ lệ thực hiện", ma: "H = F / C", o: (s) => <strong>{pt(hNT(s))}</strong> },
    ] },
  ];

  const laChon = chon ? laCua([chon]) : laCua(ids);
  const dvChon = DON_VI_Q.find((d) => d.id === chon);
  const nxLoc = nhanh === "ty" ? locNX : "";
  const goc: NNTThua[] = nxLoc === "COMPLETED"
    ? nx.daXong.filter((n) => laChon.includes(n.la))
    : danhSachNT(ky.thang, nhanh, laChon).filter((n) => !nxLoc || nx.cua(n)?.nx === nxLoc);
  const ds = [...goc].sort((a, b) => b.tong - a.tong);
  const soTrang = Math.max(1, Math.ceil(ds.length / CO_TRANG));
  const tr = Math.min(trang, soTrang);
  const ve = (n: NNTThua) => {
    if (nxLoc === "COMPLETED") return <>{NHAN_NX.COMPLETED}<small className="kt-ma">Không còn trên 1 tỷ</small></>;
    const x = nx.cua(n);
    if (!x) return <span className="cell-empty">—</span>;
    return <>{NHAN_NX[x.nx]}{x.chenh !== null && <small className="kt-ma">{x.chenh >= 0 ? "+" : "−"}{trieu(Math.abs(x.chenh))} trđ so {truoc}</small>}</>;
  };

  const xuat = () => {
    const meta = { period: `Tháng ${ky.thang}/2026`, scope: nhanPhamVi(pv), actor, status: "DRAFT" as const };
    const trungGian: ReportSheet = {
      name: "Trung_gian", title: `BÁO CÁO THÁNG KK ${ky.thang} · ĐỐI CHIẾU NỘP THỪA`, unit: "triệu đồng",
      headers: ["STT", "Chỉ tiêu", "Số thừa theo kỳ khóa sổ tháng liền kề", "Xác nhận thừa đúng", "Nợ sai đã điều chỉnh", "Tổng số đã thực hiện", "Số còn phải rà soát", "Tỷ lệ thực hiện"],
      rows: hangMau(pv, (x) => { const s = g(x); return [s.c, s.d, s.e, fNT(s), gNT(s), hNT(s)]; })
        /* Mẫu có dòng riêng cho từng CQT lá của Thuế cơ sở 18–22. */
        .flatMap((r) => {
          const d = DON_VI_Q.find((x) => x.ten === r[1]);
          const la = d ? LA.filter((l) => l.dvId === d.id) : [];
          return la.length > 1 ? la.map((l, i) => { const s = soNTLa(l, ky.thang); return [i ? "" : r[0], l.nhan, s.c, s.d, s.e, fNT(s), gNT(s), hNT(s)] as ReportValue[]; }) : [r];
        }),
      percent: [7],
    };
    const chiTiet = (n: NhanhNT): ReportSheet => {
      const rows: ReportValue[][] = [];
      danhSachNT(ky.thang, n, laCua(ids)).forEach((x, i) => x.dong.forEach((d, j) => rows.push([j ? 0 : i + 1, x.mst, x.ten, d.chuong, d.tieuMuc, d.phaiNop, d.nopThua, d.duocHoan, d.thua, j ? null : x.tong])));
      return { name: n === "ty" ? "Chi_tiet_1_ty" : "Chi_tiet_10_trieu", title: `DANH SÁCH CHI TIẾT NỘP THỪA ${n === "ty" ? ">1 TỶ" : ">10 TRIỆU"} · THÁNG ${ky.thang}/2026`, unit: "đồng",
        headers: ["", "Mã số thuế", "Tên NNT", "Chương", "Nội dung kinh tế (Tiểu mục)", "Dư cuối kỳ: Phải nộp (12)", "Dư cuối kỳ: Nộp thừa / Tạm nộp (13)", "Dư cuối kỳ: Được hoàn (14)", "Thừa", "Tổng"], rows };
    };
    const nhanXet: ReportSheet = {
      name: "Nhan_xet", title: `NHẬN XÉT NỘP THỪA >1 TỶ · THÁNG ${ky.thang} SO VỚI THÁNG ${ky.thang - 1}/2026`,
      headers: ["Mã CQT", "Mã số thuế", "Tên NNT", `Thừa tháng ${ky.thang - 1}`, `Thừa tháng ${ky.thang}`, "Chênh lệch", "Nhận xét"],
      rows: [
        ...danhSachNT(ky.thang, "ty", laCua(ids)).map((x) => { const c = nx.cua(x)!; return [x.la.cqt, x.mst, x.ten, c.chenh === null ? null : x.tong - c.chenh, x.tong, c.chenh, NHAN_NX[c.nx]] as ReportValue[]; }),
        ...nx.daXong.map((x) => [x.la.cqt, x.mst, x.ten, x.tong, null, null, NHAN_NX.COMPLETED] as ReportValue[]),
      ],
    };
    return exportExcel([trungGian, chiTiet("ty"), chiTiet("muoiTrieu"), nhanXet], meta, `nop-thua_${ky.id}.xlsx`);
  };

  return <>
    <BangDonVi pv={pv} title="Đối chiếu nộp thừa theo đơn vị" subtitle={`Mẫu báo cáo trung gian · triệu đồng · tháng ${ky.thang}/2026`}
      label="Đối chiếu nộp thừa theo đơn vị" nhom={nhom} gia={g} chon={chon} datChon={(id) => { datChon(id); datTrang(1); }} onXuat={xuat}
      ghiChu="D, E do bên Thuế nhập."/>
    <Panel title={`Danh sách NNT nộp thừa${dvChon ? ` · ${dvChon.ngan}` : ""}`} subtitle={`${integer(ds.length)} NNT · tổng thừa lớn nhất trên đầu · triệu đồng`}
      actions={<div className="inline-controls kt-dieu-khien">
        {dvChon && <Button kind="quiet" onClick={() => { datChon(""); datTrang(1); }}>Bỏ lọc đơn vị</Button>}
        <NhomNut label="Ngưỡng" value={nhanh} onChange={(v) => { datNhanh(v); datTrang(1); }} options={[{ value: "ty", label: "Trên 1 tỷ" }, { value: "muoiTrieu", label: "Trên 10 triệu" }]}/>
        <SelectMenu<LocNX> className="kt-loc-khoi" label="Nhận xét" value={nxLoc} disabled={nhanh !== "ty"} title={nhanh !== "ty" ? "Nhận xét chỉ có ở danh sách trên 1 tỷ" : undefined}
          onChange={(v) => { datLocNX(v); datTrang(1); }}
          options={[{ value: "", label: "Mọi nhận xét" }, ...(["NEW", "UNFINISHED", "COMPLETED"] as NhanXet[]).map((k) => ({ value: k, label: `${NHAN_NX[k]} (${nx.dem[k]})` }))]}/>
      </div>}>
      {ds.length ? <TableWrap label="Danh sách NNT nộp thừa">
        <table className="qd-bang kt-bang">
          <thead><tr>
            <th scope="col">Mã số thuế</th><th scope="col">Tên NNT</th><th scope="col">Đơn vị</th>
            <th scope="col" className="num">{nxLoc === "COMPLETED" ? `Tổng thừa ${truoc}` : "Tổng thừa"}</th>
            {nhanh === "ty" && <th scope="col">Nhận xét</th>}
          </tr></thead>
          <tbody>{ds.slice((tr - 1) * CO_TRANG, tr * CO_TRANG).map((n) => <tr key={`${n.la.id}-${n.mst}`}>
            <td className="kt-so-mst">{n.mst}</td>
            <td>{n.ten}</td>
            <td>{n.la.nhan}<small className="kt-ma">CQT {n.la.cqt}</small></td>
            <td className="num"><strong>{trieu(n.tong)}</strong></td>
            {nhanh === "ty" && <td>{ve(n)}</td>}
          </tr>)}</tbody>
        </table>
      </TableWrap> : <p className="table-empty">Không có NNT nào khớp bộ lọc.</p>}
      <div className="table-footer">
        <Pager trang={tr} soTrang={soTrang} onChange={datTrang}/>
        <span>"Đã hoàn thành" là không còn trên 1 tỷ ở tháng này, chưa chứng minh đã hoàn tiền.</span>
      </div>
    </Panel>
  </>;
}
