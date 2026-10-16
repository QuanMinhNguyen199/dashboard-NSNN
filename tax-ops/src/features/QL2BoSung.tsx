import { useState, type ReactNode } from "react";
import { Button, Panel, TableWrap, money } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { useBoLoc } from "@/components/BoLoc";
import {
  COT_KQ_TPR, DON_VI_QL2, bangTPR, congTPR, daRaSoatTPR, thangCuaKy,
  type DongTPR, type KyQL2,
} from "@/data/ql2";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportMeta, ReportSheet, ReportValue } from "@/domain/reportExport";
import type { VaiTro } from "@/domain/types";
import { rutGonTenDonVi } from "@/data/danhMuc";

const hienTyLe = (x: number | null) => (x === null ? "—" : `${(x * 100).toFixed(2).replace(".", ",")}%`);
const chia = (tu: number, mau: number) => (mau ? tu / mau : null);
const hai = (n: number) => String(n).padStart(2, "0");

/* ── QL2-03 · Rủi ro hóa đơn TPR ─────────────────────────────────────────── */

/*
  Theo "Mẫu 1 kỳ" và "TH" (MoM 15/10). Văn phòng về một dòng 8501, tách ra năm
  phòng QLHTDN và Phòng HKD/Cá nhân KD ở các dòng "Trong đó" — số của chúng đã
  nằm trong 8501, nên dòng tổng chỉ cộng 8501 với Thuế cơ sở.

  Quý cần HAI bảng (MoM 15/10): lũy kế từ đầu năm và riêng trong quý.
*/
export function TPRQL2({ ky, meta }: { ky: KyQL2; meta: ReportMeta }) {
  const { tu, den } = thangCuaKy(ky);
  const nam = ky.ngayChot.slice(6);
  const [tuThang, datTuThang] = useState(den);

  if (ky.loai === "QUY") return <>
    <BangTPR ky={ky} meta={meta} tu={1} den={den} tieuDe={`Lũy kế từ tháng 01 đến tháng ${hai(den)}/${nam}`}/>
    <BangTPR ky={ky} meta={meta} anGhiChu tu={tu} den={den} tieuDe={`Trong ${ky.nhan} · tháng ${hai(tu)} đến ${hai(den)}/${nam}`}/>
  </>;

  if (ky.loai !== "THANG") return <BangTPR ky={ky} meta={meta} tu={tu} den={den} tieuDe={`Lũy kế tháng ${hai(tu)} đến tháng ${hai(den)}/${nam}`}/>;

  return <BangTPR ky={ky} meta={meta} tu={tuThang} den={den}
    tieuDe={tuThang === den ? `Kỳ đánh giá ${hai(den)}/${nam}` : `Lũy kế ${hai(tuThang)}/${nam} đến ${hai(den)}/${nam}`}
    chonTu={<label className="compact-field"><span>Lũy kế từ kỳ</span>
      <select value={tuThang} onChange={(e) => datTuThang(Number(e.target.value))}>
        {Array.from({ length: den }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{hai(m)}/{nam}</option>)}
      </select>
    </label>}
  />;
}

function BangTPR({ ky, meta, tu, den, tieuDe, chonTu, anGhiChu = false }: { ky: KyQL2; meta: ReportMeta; tu: number; den: number; tieuDe: string; chonTu?: ReactNode; anGhiChu?: boolean }) {
  const { chon } = useBoLoc();
  const bang = bangTPR(tu, den);
  const coDV = (ten: string) => !chon.donVi.length || chon.donVi.includes(ten);
  const phongHien = bang.phong.filter((p) => p.id === "HKD" ? DON_VI_QL2.filter((d) => d.nhom === "VP").every((d) => coDV(d.ten)) : coDV(p.ten));
  const coVP = !chon.donVi.length || phongHien.length > 0;
  const tcs = bang.tcs.filter((d) => coDV(d.ten));
  /* Dòng tổng là tổng của ĐANG XEM: lọc còn vài đơn vị mà tổng vẫn cộng cả
     ngành thì mọi phép so dòng-với-tổng trên màn đều sai. */
  const tong: DongTPR = {
    id: "tong", ma: "", ten: chon.donVi.length ? "Cộng đơn vị đang xem" : "Tổng cộng",
    so: congTPR([...(coVP ? [bang.vp.so] : []), ...tcs.map((t) => t.so)]),
    nntQL: (coVP ? bang.vp.nntQL : 0) + tcs.reduce((t, x) => t + x.nntQL, 0),
  };

  const giaTri = (d: DongTPR): ReportValue[] => {
    const da = daRaSoatTPR(d.so);
    return [d.nntQL, d.so.phai, chia(da, d.so.phai), da, ...COT_KQ_TPR.map((c) => d.so[c.id]), d.so.phai - da, chia(d.so.phai - da, d.so.phai)];
  };

  const dong = (d: DongTPR, nhan: string, lop?: string) => {
    const da = daRaSoatTPR(d.so);
    return <tr key={`${lop ?? ""}${d.id}`} className={lop}>
      <th scope="row" className="dv-cot" title={d.ten}>{nhan}</th>
      <td>{d.ma}</td>
      <td className="num">{money(d.nntQL)}</td>
      <td className="num">{money(d.so.phai)}</td>
      <td className="num">{hienTyLe(chia(da, d.so.phai))}</td>
      <td className="num">{money(da)}</td>
      {COT_KQ_TPR.map((c) => <td key={c.id} className="num">{c.id === "tienXuLy" ? d.so[c.id].toLocaleString("vi-VN") : money(d.so[c.id])}</td>)}
      <td className="num">{money(d.so.phai - da)}</td>
      <td className="num">{hienTyLe(chia(d.so.phai - da, d.so.phai))}</td>
    </tr>;
  };

  const tieuDeCot = ["Số lượng NNT quản lý", "Tổng NNT RR cao đưa vào kế hoạch rà soát kiểm tra", "Tỷ lệ NNT đã rà soát / phải rà soát", "Số NNT đã thực hiện rà soát",
    ...COT_KQ_TPR.map((c) => `Số NNT ${c.nhan}`.replace("Số NNT Tổng số tiền", "Tổng số tiền")), "Số NNT chưa thực hiện rà soát", "Tỷ lệ NNT chưa rà soát / phải rà soát"];

  const sheet: ReportSheet = {
    name: "TPR", title: `TỔNG HỢP KẾT QUẢ TRIỂN KHAI ĐÁNH GIÁ NNT THEO PHÂN TÍCH RỦI RO HÓA ĐƠN – ${tieuDe.toUpperCase()}`,
    headers: ["Mã CQT", "Tên cơ quan thuế", ...tieuDeCot],
    rows: [
      ["", tong.ten, ...giaTri(tong)],
      ...(coVP ? [[bang.vp.ma, bang.vp.ten, ...giaTri(bang.vp)], ...phongHien.map((p) => ["", `Trong đó: ${p.ten}`, ...giaTri(p)])] : []),
      ...tcs.map((d) => [d.ma, d.ten, ...giaTri(d)]),
    ],
    /* Không đánh dấu dòng đậm: dòng đậm trong tệp xuất thành công thức SUM các
       dòng bên dưới, mà dưới 8501 là các dòng "Trong đó" đã nằm trong nó. */
    percent: [4, 16],
  };

  return <Panel chinh
    title={`Rủi ro hóa đơn TPR · ${tieuDe}`}
    subtitle={`${ky.nhan} · nguồn: webtpr · 9 tiêu chí rủi ro · dữ liệu mô phỏng`}
    actions={<div className="inline-controls">{chonTu}<ExportButton onExport={() => exportExcel([sheet], meta, `QL2_TPR_${ky.id}_${tu}-${den}.xlsx`)}>Xuất Excel</ExportButton></div>}
  >
    {!anGhiChu && <p className="ql2-note">Đã rà soát = kiểm tra tại bàn + bổ sung kiểm tra tại trụ sở + giải thể. Số liệu lũy kế vì một NNT đi qua giải trình tối đa 2 lần, xác minh địa chỉ rồi mới có thể chuyển kiểm tra tại trụ sở. Các dòng “Trong đó” đã nằm trong dòng 8501, không cộng lần nữa. Trỏ vào tên cột để xem mã kết quả kqrr tương ứng.</p>}
    <TableWrap label="TPR theo đơn vị">
      <table className="ql1-table" style={{ minWidth: 1830 }}>
        <colgroup>
          {[250, 76, 104, 120, 104, 104, ...COT_KQ_TPR.map(() => 104), 112, 112].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="dv-cot" rowSpan={2}>Tên cơ quan thuế</th>
            <th scope="col" rowSpan={2}>Mã CQT</th>
            <th scope="col" className="num" rowSpan={2} title="Cột (5) của mẫu">Số lượng NNT quản lý</th>
            <th scope="colgroup" className="nhom" colSpan={3}>Tiến độ rà soát</th>
            <th scope="colgroup" className="nhom" colSpan={COT_KQ_TPR.length}>Kết quả rà soát kiểm tra · số NNT</th>
            <th scope="colgroup" className="nhom" colSpan={2}>Chưa rà soát</th>
          </tr>
          <tr>
            <th scope="col" className="num" title="Cột (6) của mẫu">Tổng NNT rủi ro cao phải rà soát</th>
            <th scope="col" className="num">Tỷ lệ đã rà soát</th>
            <th scope="col" className="num" title="(7) + (8) + (14)">Đã rà soát</th>
            {COT_KQ_TPR.map((c) => <th key={c.id} scope="col" className="num" title={`Cột (${c.so}) của mẫu · ${c.maKq} trong kqrr`}>{c.nhan}</th>)}
            <th scope="col" className="num">Số NNT</th>
            <th scope="col" className="num">Tỷ lệ</th>
          </tr>
        </thead>
        <tbody>
          {dong(tong, tong.ten, "is-tong")}
          {coVP && dong(bang.vp, "8501 · Văn phòng Thuế TP", "is-khoi")}
          {coVP && phongHien.map((p) => dong(p, `Trong đó: ${rutGonTenDonVi(p.ten)}`))}
          {tcs.map((d) => dong(d, d.ten))}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}

/* ── QL2-06 · Gói rủi ro hóa đơn Công an ─────────────────────────────────── */

/*
  Theo mẫu "BC gói hđ CA" (MoM 15/10): bốn loại kết quả, mỗi loại tính cả số
  DN và số hóa đơn. Đã xử lý KHÔNG nhập — nó là tổng bốn loại, nên nhập riêng
  thì hai con số sẽ có ngày lệch nhau.
*/
const KET_QUA_CA = [
  { id: "tuLoai", nhan: "Tự loại trước khi có KL của CQĐT" },
  { id: "khongSD", nhan: "Không sử dụng HĐ, không hạch toán chi phí" },
  { id: "xuPhat", nhan: "Lập biên bản, ban hành QĐ xử phạt" },
  { id: "camKet", nhan: "Xin cam kết không điều chỉnh giảm" },
] as const;
type MaKQ = (typeof KET_QUA_CA)[number]["id"] | "phai";
const O_NHAP: { kq: MaKQ; loai: "DN" | "HD" }[] = [
  { kq: "phai", loai: "DN" }, { kq: "phai", loai: "HD" },
  ...KET_QUA_CA.flatMap((k) => [{ kq: k.id, loai: "DN" as const }, { kq: k.id, loai: "HD" as const }]),
];
const khoa = (o: { kq: MaKQ; loai: "DN" | "HD" }) => `${o.kq}${o.loai}`;

type SoLieu = Record<string, string> & { nguon: string; nguoi: string; luc: string };
const rong = (): SoLieu => ({ ...Object.fromEntries(O_NHAP.map((o) => [khoa(o), ""])), nguon: "", nguoi: "", luc: "" }) as SoLieu;

const so = (r: SoLieu | undefined, k: string) => Number(r?.[k] ?? 0) || 0;
const daXuLy = (r: SoLieu | undefined, loai: "DN" | "HD") => KET_QUA_CA.reduce((t, k) => t + so(r, `${k.id}${loai}`), 0);

const loiDong = (r: SoLieu) => {
  if (!O_NHAP.every((o) => /^\d+$/.test(r[khoa(o)] ?? ""))) return "Nhập đủ 10 ô bằng số nguyên không âm (ô không có thì ghi 0).";
  if (daXuLy(r, "DN") > so(r, "phaiDN") || daXuLy(r, "HD") > so(r, "phaiHD")) return "Tổng bốn loại kết quả không được vượt số phải thực hiện.";
  if (!r.nguon.trim()) return "Ghi nguồn số liệu trước khi lưu.";
  return "";
};

export function CongAnQL2({ ky, vaiTro, meta }: { ky: KyQL2; vaiTro: VaiTro; meta: ReportMeta }) {
  const { chon } = useBoLoc();
  /* Khóa mới vì cấu trúc dòng đã đổi theo mẫu 15/10 — bản lưu bốn ô cũ không
     đọc lại được thành mười ô. */
  const storage = `ql2-congan-v2-${ky.id}`;
  const [saved, setSaved] = useState<Record<string, SoLieu>>(() => { try { return JSON.parse(sessionStorage.getItem(storage) ?? "{}"); } catch { return {}; } });
  const [draft, setDraft] = useState(saved);
  const [loi, datLoi] = useState("");
  const ds = DON_VI_QL2.filter((d) => !chon.donVi.length || chon.donVi.includes(d.ten));
  const vp = ds.filter((d) => d.nhom === "VP");
  const tcs = ds.filter((d) => d.nhom === "TCS");
  const nhap = vaiTro === "CV";

  const luu = (id: string, ten: string) => {
    const row = draft[id] ?? rong();
    const l = loiDong(row);
    if (l) { datLoi(`${rutGonTenDonVi(ten)}: ${l}`); return; }
    const next = { ...saved, [id]: { ...row, nguoi: meta.actor, luc: new Date().toISOString() } };
    try { sessionStorage.setItem(storage, JSON.stringify(next)); } catch { /* phiên demo: không lưu được thì vẫn giữ trên màn */ }
    setSaved(next); setDraft((old) => ({ ...old, [id]: next[id] })); datLoi("");
  };

  /* Dòng cộng chỉ cộng đơn vị ĐÃ LƯU; đơn vị chưa nhập không phải là số 0. */
  const cong = (ids: string[]): SoLieu => {
    const co = ids.map((id) => saved[id]).filter(Boolean);
    const r = rong();
    O_NHAP.forEach((o) => { r[khoa(o)] = String(co.reduce((t, x) => t + so(x, khoa(o)), 0)); });
    return r;
  };

  const giaTri = (r: SoLieu | undefined): ReportValue[] => r ? [
    so(r, "phaiDN"), so(r, "phaiHD"), daXuLy(r, "DN"), daXuLy(r, "HD"),
    ...KET_QUA_CA.flatMap((k) => [so(r, `${k.id}DN`), so(r, `${k.id}HD`)]),
    so(r, "phaiDN") - daXuLy(r, "DN"), so(r, "phaiHD") - daXuLy(r, "HD"), chia(daXuLy(r, "DN"), so(r, "phaiDN")),
  ] : Array(15).fill(null);

  const nhanCot = ["Tổng phải thực hiện", "Tổng đã rà soát, xử lý", ...KET_QUA_CA.map((k) => k.nhan), "Số còn phải xử lý"];
  const sheet: ReportSheet = {
    name: "Goi Cong an", title: `CÁC GÓI RỦI RO HÓA ĐƠN CÔNG AN, VIỆN KIỂM SÁT – ${ky.nhan.toUpperCase()}`,
    headers: ["STT", "Phòng/Đội", ...nhanCot.flatMap((n) => [`${n} · Số DN`, `${n} · Số HĐ`]), "Tỷ lệ % thực hiện (theo DN)", "Nguồn số liệu", "Người nhập", "Thời điểm"],
    rows: [
      ["A", "Tổng cộng (= I + II)", ...giaTri(cong(ds.map((d) => d.id))), null, null, null],
      ["I", "Văn phòng", ...giaTri(cong(vp.map((d) => d.id))), null, null, null],
      ...vp.map((d, i) => [String(i + 1), d.ten, ...giaTri(saved[d.id]), saved[d.id]?.nguon ?? null, saved[d.id]?.nguoi ?? null, saved[d.id]?.luc ?? null]),
      ["II", "Các Thuế cơ sở", ...giaTri(cong(tcs.map((d) => d.id))), null, null, null],
      ...tcs.map((d, i) => [String(i + 1), d.ten, ...giaTri(saved[d.id]), saved[d.id]?.nguon ?? null, saved[d.id]?.nguoi ?? null, saved[d.id]?.luc ?? null]),
    ],
    bold: [0, 1, 2 + vp.length], percent: [16],
  };

  const oSo = (r: SoLieu | undefined, k: string) => r ? money(so(r, k)) : "—";
  const dongCong = (nhan: string, ids: string[], lop: string) => {
    const r = ids.some((id) => saved[id]) ? cong(ids) : undefined;
    return <tr key={nhan} className={lop}>
      <th scope="row" className="dv-cot">{nhan}</th>
      <td className="num">{oSo(r, "phaiDN")}</td><td className="num">{oSo(r, "phaiHD")}</td>
      <td className="num">{r ? money(daXuLy(r, "DN")) : "—"}</td><td className="num">{r ? money(daXuLy(r, "HD")) : "—"}</td>
      {KET_QUA_CA.flatMap((k) => [<td key={`${k.id}DN`} className="num">{oSo(r, `${k.id}DN`)}</td>, <td key={`${k.id}HD`} className="num">{oSo(r, `${k.id}HD`)}</td>])}
      <td className="num">{r ? money(so(r, "phaiDN") - daXuLy(r, "DN")) : "—"}</td><td className="num">{r ? money(so(r, "phaiHD") - daXuLy(r, "HD")) : "—"}</td>
      <td className="num">{r ? hienTyLe(chia(daXuLy(r, "DN"), so(r, "phaiDN"))) : "—"}</td>
      <td/>{nhap && <td/>}
    </tr>;
  };

  const oNhap = (id: string, ten: string, k: string, nhan: string) => {
    const r = draft[id] ?? rong();
    return <td key={k} className={nhap ? undefined : "num"}>{nhap
      ? <input className="ql2-manual" type="number" min="0" step="1" inputMode="numeric" aria-label={`${nhan} · ${ten}`} value={r[k] ?? ""} onChange={(e) => setDraft((old) => ({ ...old, [id]: { ...(old[id] ?? rong()), [k]: e.target.value } }))}/>
      : oSo(saved[id], k)}</td>;
  };

  const dongDV = (d: (typeof ds)[number]) => {
    const s = saved[d.id];
    return <tr key={d.id}>
      <th scope="row" className="dv-cot" title={s ? `${d.ten} · ${s.nguoi} · ${new Date(s.luc).toLocaleString("vi-VN")}` : `${d.ten} · chưa nhập số liệu`}>{rutGonTenDonVi(d.ten)}</th>
      {oNhap(d.id, d.ten, "phaiDN", "Phải thực hiện · số DN")}{oNhap(d.id, d.ten, "phaiHD", "Phải thực hiện · số HĐ")}
      <td className="num">{s ? money(daXuLy(s, "DN")) : "—"}</td><td className="num">{s ? money(daXuLy(s, "HD")) : "—"}</td>
      {KET_QUA_CA.flatMap((k) => [oNhap(d.id, d.ten, `${k.id}DN`, `${k.nhan} · số DN`), oNhap(d.id, d.ten, `${k.id}HD`, `${k.nhan} · số HĐ`)])}
      <td className="num">{s ? money(so(s, "phaiDN") - daXuLy(s, "DN")) : "—"}</td><td className="num">{s ? money(so(s, "phaiHD") - daXuLy(s, "HD")) : "—"}</td>
      <td className="num">{s ? hienTyLe(chia(daXuLy(s, "DN"), so(s, "phaiDN"))) : "—"}</td>
      <td>{nhap ? <input className="ql2-manual" aria-label={`Nguồn số liệu · ${d.ten}`} value={(draft[d.id] ?? rong()).nguon} onChange={(e) => setDraft((old) => ({ ...old, [d.id]: { ...(old[d.id] ?? rong()), nguon: e.target.value } }))}/> : s?.nguon ?? "—"}</td>
      {nhap && <td><Button kind="quiet" onClick={() => luu(d.id, d.ten)}>Lưu dòng</Button></td>}
    </tr>;
  };

  return <Panel chinh title="Gói rủi ro hóa đơn Công an" subtitle={`${ky.nhan} · số liệu nhập tay theo mẫu BC gói HĐ CA · lưu trong phiên demo`} actions={<ExportButton onExport={() => exportExcel([sheet], meta, `QL2_CongAn_${ky.id}.xlsx`)}>Xuất Excel</ExportButton>}>
    <p className="ql2-note">Đã xử lý = tổng bốn loại kết quả; còn phải xử lý = phải thực hiện − đã xử lý; tỷ lệ tính theo số DN. Dòng cộng chỉ cộng các đơn vị đã lưu.</p>
    {loi && <p role="alert" className="quality-note">{loi}</p>}
    <TableWrap label="số liệu gói Công an">
      <table className="ql1-table" style={{ minWidth: 2010 + (nhap ? 120 : 0) }}>
        <colgroup>
          {[240, ...Array(14).fill(100), 104, 166, ...(nhap ? [120] : [])].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="dv-cot" rowSpan={2}>Phòng / Đội</th>
            {nhanCot.map((n) => <th key={n} scope="colgroup" className="nhom" colSpan={2}>{n}</th>)}
            <th scope="col" className="num" rowSpan={2}>Tỷ lệ % thực hiện</th>
            <th scope="col" rowSpan={2}>Nguồn số liệu</th>
            {nhap && <th scope="col" rowSpan={2}>Lưu</th>}
          </tr>
          <tr>{nhanCot.flatMap((n) => [<th key={`${n}DN`} scope="col" className="num">Số DN</th>, <th key={`${n}HD`} scope="col" className="num">Số HĐ</th>])}</tr>
        </thead>
        <tbody>
          {dongCong("A. Tổng cộng (= I + II)", ds.map((d) => d.id), "is-tong")}
          {vp.length > 0 && dongCong("I. Văn phòng", vp.map((d) => d.id), "is-khoi")}
          {vp.map(dongDV)}
          {tcs.length > 0 && dongCong("II. Các Thuế cơ sở", tcs.map((d) => d.id), "is-khoi")}
          {tcs.map(dongDV)}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}
