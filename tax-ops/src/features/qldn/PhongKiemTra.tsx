import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type DragEvent, type FormEvent, type ReactNode } from "react";
import { Badge, Button, Icon, Pager, Panel, SearchField, Segmented, TableWrap, integer } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportSheet } from "@/domain/reportExport";
import { useThamSo } from "@/state/diaChi";
import { useAction } from "@/state/ActionContext";
import type { DemoUser } from "@/auth/demoAuth";
import type { KyQ } from "@/data/qldn";
import { DON_VI_KT } from "@/data/kiemTra";
import {
  DOT_XUAT, LOAI_CUOC, NHAN_TIEN_DO, PHONG_DS, bangDoiSoat, luuCuoc, maMoi, nhanLoai, tenPhongDS, tienDo, useCuocKT,
  type BieuDS, type CuocKT, type DongDS, type LoaiCuoc, type TienDo,
} from "@/data/cuocKT";
import { docXlsx } from "@/domain/docXlsx";
import { MAU_NHAP, kiemTep, type KetQuaKT, type LoaiNhap } from "@/domain/nhapPKT";

/*
  Ba tab bổ sung cho Phòng kiểm tra theo ghi chú folder PKT (03/11/2026):
  - Cuộc kiểm tra — đoàn kiểm tra nhập tay từng cuộc (mục 4);
  - Đối soát — báo cáo đối soát công tác kiểm tra theo mẫu Module 2 – Mục 3 (mục 5);
  - Nhập dữ liệu — nhập chuyên đề, chỉ tiêu, kế hoạch đích danh từ tệp mẫu (mục 3).
  Đối soát đọc đúng kho mà tab Cuộc kiểm tra ghi, nên một cuộc vừa lưu hiện
  ngay trong báo cáo cùng phiên.
*/

const TONE_TIEN_DO: Record<TienDo, "neutral" | "info" | "warning" | "positive"> = { chuaDK: "neutral", dkBH: "neutral", dangKT: "info", dkHT: "warning", hoanThanh: "positive" };
const thangChu = (t: number | null) => (t ? `Tháng ${String(t).padStart(2, "0")}` : "—");
const so0 = (x: number) => (x ? integer(x) : <span className="cell-empty">–</span>);

/* =====================================================================
   Tab Cuộc kiểm tra — danh sách bên trái, phiếu nhập bên phải
   ===================================================================== */

const MOI = (): CuocKT => ({
  id: "", phong: "KT1", mst: "", tenDN: "", truongDoan: "", loai: "kh", nganh: "", thoiKy: "",
  dt: [null, null, null], dkBH: null, dkHT: null, dsBH: null, dsHT: null,
  qdKT: { so: "", ngay: "" }, qdXL: { so: "", ngay: "" }, thu: null, ghiChu: "",
});
const MOI_TRANG = 12;

export function CuocKiemTra({ actor }: { actor: string }) {
  const ds = useCuocKT();
  const notify = useAction();
  const [q, datQ] = useState("");
  const [phong, datPhong] = useState("");
  const [loai, datLoai] = useState<LoaiCuoc | "">("");
  const [td, datTd] = useState<TienDo | "">("");
  const [trang, datTrang] = useState(1);
  const [phieu, datPhieu] = useState<CuocKT>(MOI);
  const [loi, datLoi] = useState<Record<string, string>>({});
  const phieuRef = useRef<HTMLFormElement>(null);

  const loc = useMemo(() => {
    const k = q.trim().toLowerCase();
    return ds.filter((c) => (!phong || c.phong === phong) && (!loai || c.loai === loai) && (!td || tienDo(c) === td)
      && (!k || c.mst.includes(k) || c.tenDN.toLowerCase().includes(k))).slice().reverse();
  }, [ds, q, phong, loai, td]);
  const soTrang = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const tr = Math.min(trang, soTrang);
  const doiLoc = (f: () => void) => { f(); datTrang(1); };

  const mo = (c: CuocKT) => { datPhieu(structuredClone(c)); datLoi({}); if (window.matchMedia("(max-width: 1199px)").matches) phieuRef.current?.scrollIntoView({ block: "start" }); };
  const moMoi = () => { datPhieu(MOI()); datLoi({}); };
  const dat = <K extends keyof CuocKT>(k: K, v: CuocKT[K]) => { datPhieu((p) => ({ ...p, [k]: v })); datLoi((l) => { const { [k as string]: _, ...con } = l; return con; }); };

  const luu = (e: FormEvent) => {
    e.preventDefault();
    const l: Record<string, string> = {};
    if (!/^\d{10}(-\d{3})?$/.test(phieu.mst.trim())) l.mst = "MST gồm 10 chữ số, hoặc 10 chữ số-3 chữ số.";
    if (!phieu.tenDN.trim()) l.tenDN = "Nhập tên doanh nghiệp.";
    if (!phieu.truongDoan.trim()) l.truongDoan = "Nhập tên trưởng đoàn.";
    if (phieu.dkHT && phieu.dkBH && phieu.dkHT < phieu.dkBH) l.dkHT = "Tháng đăng ký hoàn thành không được trước tháng đăng ký ban hành.";
    if (phieu.dsHT && !phieu.dsBH) l.dsHT = "Chưa đối soát ban hành thì chưa đối soát hoàn thành được.";
    if (phieu.thu !== null && phieu.thu < 0) l.thu = "Số tiền không được âm.";
    datLoi(l);
    if (Object.keys(l).length) { phieuRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(l)[0]}"]`)?.focus(); return; }
    const c = { ...phieu, mst: phieu.mst.trim(), id: phieu.id || maMoi() };
    luuCuoc(c);
    datPhieu(c);
    notify(`Đã lưu cuộc kiểm tra ${c.mst} · ${c.tenDN}.`);
  };

  const xuat = () => exportExcel([{
    name: "Cuoc_kiem_tra", title: "DANH SÁCH CUỘC KIỂM TRA DO ĐOÀN NHẬP", unit: "doanh thu, số thuế: triệu đồng",
    headers: ["TT", "Phòng KT / Thuế cơ sở", "MST", "Tên doanh nghiệp", "Trưởng đoàn", "Loại hình", "Ngành nghề kinh doanh chính", "Thời kỳ TTKT", "Doanh thu 2022", "Doanh thu 2023", "Doanh thu 2024", "Đăng ký ban hành", "Đăng ký hoàn thành", "Đối soát ban hành", "Đối soát hoàn thành", "QĐ KT số", "QĐ KT ngày", "QĐ xử lý số", "QĐ xử lý ngày", "Tổng truy thu, phạt, truy hoàn", "Tiến độ", "Ghi chú"],
    rows: loc.map((c, i) => [i + 1, tenPhongDS(c.phong), c.mst, c.tenDN, c.truongDoan, nhanLoai(c.loai), c.nganh, c.thoiKy, ...c.dt, thangChu(c.dkBH), thangChu(c.dkHT), thangChu(c.dsBH), thangChu(c.dsHT), c.qdKT.so, c.qdKT.ngay, c.qdXL.so, c.qdXL.ngay, c.thu, NHAN_TIEN_DO[tienDo(c)], c.ghiChu]),
  }], { period: "Năm 2026", scope: phong ? tenPhongDS(phong) : "Các Phòng Kiểm tra", actor, status: "DRAFT" }, "cuoc-kiem-tra_2026.xlsx");

  const sua = Boolean(phieu.id);
  return <div className="pkt-cuoc">
    <Panel title="Cuộc kiểm tra" subtitle={`${integer(loc.length)} / ${integer(ds.length)} cuộc · dữ liệu mô phỏng · bấm một dòng để sửa`}
      actions={<div className="inline-controls"><Button kind="secondary" icon="file" onClick={moMoi}>Thêm cuộc mới</Button><ExportButton onExport={xuat}>Xuất Excel</ExportButton></div>}>
      <div className="pkt-loc">
        <SearchField value={q} onChange={(v) => doiLoc(() => datQ(v))} placeholder="Tìm MST, tên doanh nghiệp"/>
        <label className="compact-field"><span>Phòng</span><select value={phong} onChange={(e) => doiLoc(() => datPhong(e.target.value))}><option value="">Tất cả</option>{PHONG_DS.map((p) => <option key={p.id} value={p.id}>{p.ten}</option>)}</select></label>
        <label className="compact-field"><span>Loại hình</span><select value={loai} onChange={(e) => doiLoc(() => datLoai(e.target.value as LoaiCuoc | ""))}><option value="">Tất cả</option>{LOAI_CUOC.map((l) => <option key={l.id} value={l.id}>{l.ngan}</option>)}</select></label>
        <label className="compact-field"><span>Tiến độ</span><select value={td} onChange={(e) => doiLoc(() => datTd(e.target.value as TienDo | ""))}><option value="">Tất cả</option>{(Object.keys(NHAN_TIEN_DO) as TienDo[]).map((k) => <option key={k} value={k}>{NHAN_TIEN_DO[k]}</option>)}</select></label>
      </div>
      {loc.length ? <TableWrap label="Danh sách cuộc kiểm tra">
        <table className="qd-bang pkt-bang-cuoc">
          <thead><tr><th scope="col">Doanh nghiệp</th><th scope="col">Loại hình</th><th scope="col">Tiến độ</th><th scope="col" className="num">Truy thu · tr.đ</th></tr></thead>
          <tbody>{loc.slice((tr - 1) * MOI_TRANG, tr * MOI_TRANG).map((c) => <tr key={c.id} className={`pkt-dong${phieu.id === c.id ? " is-chon" : ""}`} onClick={() => mo(c)}>
            <th scope="row"><button type="button" className="row-select" aria-pressed={phieu.id === c.id} onClick={(e) => { e.stopPropagation(); mo(c); }}>
              <span className="pkt-dn">{c.tenDN}</span><small>{c.mst} · {tenPhongDS(c.phong).replace("Phòng Kiểm tra số ", "PKT ")} · {c.truongDoan}</small>
            </button></th>
            <td>{nhanLoai(c.loai)}</td>
            <td><Badge tone={TONE_TIEN_DO[tienDo(c)]}>{NHAN_TIEN_DO[tienDo(c)]}</Badge></td>
            <td className="num">{c.thu === null ? <span className="cell-empty">—</span> : integer(c.thu)}</td>
          </tr>)}</tbody>
        </table>
      </TableWrap> : <p className="pkt-trong">Không có cuộc nào khớp bộ lọc. <Button kind="quiet" onClick={() => { datQ(""); datPhong(""); datLoai(""); datTd(""); }}>Xoá bộ lọc</Button></p>}
      <Pager trang={tr} soTrang={soTrang} onChange={datTrang}/>
    </Panel>

    <form ref={phieuRef} className="panel pkt-phieu" onSubmit={luu} noValidate aria-labelledby="pkt-phieu-ten">
      <header className="panel-head"><div><h2 id="pkt-phieu-ten">{sua ? "Sửa cuộc kiểm tra" : "Thêm cuộc kiểm tra"}</h2><p>{sua ? `${phieu.mst} · ${NHAN_TIEN_DO[tienDo(phieu)]}` : "Đoàn nhập khi đăng ký; cập nhật mốc khi đối soát."}</p></div></header>
      <div className="pkt-phieu-than">
        <NhomO ten="Thông tin chung">
          <O nhan="Phòng KT / Thuế cơ sở"><select name="phong" value={phieu.phong} onChange={(e) => dat("phong", e.target.value)}>{PHONG_DS.map((p) => <option key={p.id} value={p.id}>{p.ten}</option>)}</select></O>
          <O nhan="Trưởng đoàn" loi={loi.truongDoan}><input name="truongDoan" value={phieu.truongDoan} onChange={(e) => dat("truongDoan", e.target.value)} placeholder="Họ và tên"/></O>
          <O nhan="MST" loi={loi.mst}><input name="mst" inputMode="numeric" value={phieu.mst} onChange={(e) => dat("mst", e.target.value)} placeholder="0123456789"/></O>
          <O nhan="Tên doanh nghiệp" loi={loi.tenDN}><input name="tenDN" value={phieu.tenDN} onChange={(e) => dat("tenDN", e.target.value)}/></O>
          <O nhan="Loại hình"><select name="loai" value={phieu.loai} onChange={(e) => dat("loai", e.target.value as LoaiCuoc)}>{LOAI_CUOC.map((l) => <option key={l.id} value={l.id}>{l.nhan}</option>)}</select></O>
          <O nhan="Thời kỳ TTKT"><input name="thoiKy" value={phieu.thoiKy} onChange={(e) => dat("thoiKy", e.target.value)} placeholder="2022 – 2024"/></O>
          <O nhan="Ngành nghề kinh doanh chính" rong><input name="nganh" value={phieu.nganh} onChange={(e) => dat("nganh", e.target.value)} placeholder="Ví dụ: xây lắp, thương mại, sản xuất nhựa…"/></O>
        </NhomO>
        <NhomO ten="Doanh thu · triệu đồng" ba>
          {[2022, 2023, 2024].map((nam, i) => <O key={nam} nhan={String(nam)}><input name={`dt${nam}`} type="number" min={0} inputMode="numeric" value={phieu.dt[i] ?? ""} onChange={(e) => { const dt = [...phieu.dt] as CuocKT["dt"]; dt[i] = e.target.value === "" ? null : Number(e.target.value); dat("dt", dt); }}/></O>)}
        </NhomO>
        <NhomO ten="Mốc tiến độ · năm 2026">
          {([["dkBH", "Đăng ký ban hành"], ["dkHT", "Đăng ký hoàn thành"], ["dsBH", "Đối soát ban hành"], ["dsHT", "Đối soát hoàn thành"]] as const).map(([k, nhan]) => <O key={k} nhan={nhan} loi={loi[k]}>
            <select name={k} value={phieu[k] ?? ""} onChange={(e) => dat(k, e.target.value ? Number(e.target.value) : null)}><option value="">Chưa có</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{thangChu(i + 1)}</option>)}</select>
          </O>)}
        </NhomO>
        <NhomO ten="Quyết định">
          <O nhan="QĐ kiểm tra · số"><input name="qdKTSo" value={phieu.qdKT.so} onChange={(e) => dat("qdKT", { ...phieu.qdKT, so: e.target.value })}/></O>
          <O nhan="QĐ kiểm tra · ngày"><input name="qdKTNgay" value={phieu.qdKT.ngay} onChange={(e) => dat("qdKT", { ...phieu.qdKT, ngay: e.target.value })} placeholder="dd/mm/yyyy"/></O>
          <O nhan="QĐ xử lý · số"><input name="qdXLSo" value={phieu.qdXL.so} onChange={(e) => dat("qdXL", { ...phieu.qdXL, so: e.target.value })}/></O>
          <O nhan="QĐ xử lý · ngày"><input name="qdXLNgay" value={phieu.qdXL.ngay} onChange={(e) => dat("qdXL", { ...phieu.qdXL, ngay: e.target.value })} placeholder="dd/mm/yyyy"/></O>
        </NhomO>
        <NhomO ten="Kết quả">
          <O nhan="Tổng truy thu, phạt, truy hoàn · tr.đ" loi={loi.thu}><input name="thu" type="number" min={0} inputMode="decimal" value={phieu.thu ?? ""} onChange={(e) => dat("thu", e.target.value === "" ? null : Number(e.target.value))}/></O>
          <O nhan="Tiến độ thực hiện"><output className="pkt-tien-do"><Badge tone={TONE_TIEN_DO[tienDo(phieu)]}>{NHAN_TIEN_DO[tienDo(phieu)]}</Badge><small>tự tính từ bốn mốc</small></output></O>
          <O nhan="Ghi chú" rong><textarea name="ghiChu" rows={2} value={phieu.ghiChu} onChange={(e) => dat("ghiChu", e.target.value)}/></O>
        </NhomO>
      </div>
      <footer className="pkt-phieu-nut">
        <Button kind="secondary" type="button" onClick={moMoi}>{sua ? "Bỏ chọn" : "Xoá phiếu"}</Button>
        <Button kind="primary" type="submit">{sua ? "Lưu thay đổi" : "Lưu cuộc kiểm tra"}</Button>
      </footer>
    </form>
  </div>;
}

function NhomO({ ten, ba, children }: { ten: string; ba?: boolean; children: ReactNode }) {
  return <fieldset className="pkt-nhom"><legend>{ten}</legend><div className={`pkt-nhom-o${ba ? " is-ba" : ""}`}>{children}</div></fieldset>;
}
function O({ nhan, loi, rong, children }: { nhan: string; loi?: string; rong?: boolean; children: ReactNode }) {
  return <label className={`pkt-o${rong ? " is-rong" : ""}${loi ? " is-loi" : ""}`}><span>{nhan}</span>{children}{loi && <small role="alert">{loi}</small>}</label>;
}

/* =====================================================================
   Tab Đối soát — mẫu Module 2 – Mục 3
   ===================================================================== */

const BIEU: { id: BieuDS; nhan: string; tieuDe: string }[] = [
  { id: "dsBH", nhan: "Đối soát ban hành", tieuDe: "ĐỐI SOÁT BAN HÀNH QUYẾT ĐỊNH" },
  { id: "dsHT", nhan: "Đối soát hoàn thành", tieuDe: "ĐỐI SOÁT HOÀN THÀNH" },
  { id: "dkBH", nhan: "Đăng ký ban hành", tieuDe: "ĐĂNG KÝ BAN HÀNH" },
  { id: "dkHT", nhan: "Đăng ký hoàn thành", tieuDe: "ĐĂNG KÝ HOÀN THÀNH" },
];
const pt0 = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");
const ty1 = (trieu: number) => (trieu ? (trieu / 1000).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "–");

/** Cột của một biểu, theo đúng thứ tự và ký hiệu (1), (2.1)… của mẫu. */
function cotBieu(b: BieuDS): { nhan: string; ma: string; o: (d: DongDS) => ReactNode; xuat: (d: DongDS) => number | string | null; nhom?: true }[] {
  if (b === "dkBH" || b === "dkHT") return [
    { nhan: b === "dkBH" ? "Tổng đăng ký ban hành" : "Tổng đăng ký hoàn thành", ma: "(1) = (1.1) + (1.2)", o: (d) => so0(d.tong), xuat: (d) => d.tong },
    { nhan: "Trong đó KH2026", ma: "(1.1)", o: (d) => so0(d.theoLoai.kh), xuat: (d) => d.theoLoai.kh },
    { nhan: "Tổng cộng", ma: "(1.2) = (2.1) + … + (2.9)", nhom: true, o: (d) => so0(d.tong - d.theoLoai.kh), xuat: (d) => d.tong - d.theoLoai.kh },
    ...DOT_XUAT.map((l, i) => ({ nhan: l.nhan, ma: `(2.${i + 1})`, nhom: true as const, o: (d: DongDS) => so0(d.theoLoai[l.id]), xuat: (d: DongDS) => d.theoLoai[l.id] })),
  ];
  const ht = b === "dsHT";
  return [
    { nhan: ht ? "Tổng đăng ký hoàn thành" : "Tổng đăng ký ban hành", ma: "(1)", o: (d) => so0(d.tong), xuat: (d) => d.tong },
    { nhan: ht ? "Tổng SL QĐ hoàn thành" : "Tổng SL đã ban hành", ma: "(2) = (2.1) + … + (2.10)", nhom: true, o: (d) => so0(d.daLam), xuat: (d) => d.daLam },
    ...LOAI_CUOC.map((l, i) => ({ nhan: l.nhan, ma: `(2.${i + 1})`, nhom: true as const, o: (d: DongDS) => so0(d.theoLoai[l.id]), xuat: (d: DongDS) => d.theoLoai[l.id] })),
    { nhan: ht ? "Tỷ lệ hoàn thành" : "Tỷ lệ ban hành", ma: "(2) / (1)", o: (d) => <strong>{pt0(d.daLam, d.tong)}</strong>, xuat: (d) => (d.tong ? d.daLam / d.tong : null) },
    ...(ht ? [{ nhan: "Tổng truy thu và phạt hoàn thành · tỷ đồng", ma: "(3)", o: (d: DongDS) => ty1(d.thu), xuat: (d: DongDS) => d.thu / 1000 }] : []),
  ];
}

/*
  Tóm tắt một câu trên đầu biểu — chỗ ảnh mẫu đặt dòng "AI". Câu ở đây do
  quy tắc dựng từ chính các số trong bảng (không gọi mô hình), nên nó không
  bao giờ nói khác bảng.
*/
function tomTat(b: BieuDS, thang: number, dong: DongDS[], tong: DongDS) {
  const t = `Tháng ${String(thang).padStart(2, "0")}/2026`;
  const chua = dong.filter((d) => !d.tong).map((d) => tenPhongDS(d.phong));
  const nhieu = [...dong].sort((a, c) => c.tong - a.tong)[0];
  if (b === "dkBH" || b === "dkHT") {
    const dx = DOT_XUAT.filter((l) => tong.theoLoai[l.id]).map((l) => `${l.ngan} ${tong.theoLoai[l.id]}`);
    if (!tong.tong) return `${t}: chưa có cuộc nào đăng ký ${b === "dkBH" ? "ban hành" : "hoàn thành"}.`;
    return `${t}: tổng đăng ký ${b === "dkBH" ? "ban hành" : "hoàn thành"} ${tong.tong} cuộc, trong đó ${tong.theoLoai.kh} cuộc KH2026 và ${tong.tong - tong.theoLoai.kh} cuộc đột xuất${dx.length ? ` (${dx.join("; ")})` : ""}. ${tenPhongDS(nhieu.phong)} nhiều nhất (${nhieu.tong} cuộc)${chua.length ? `; ${chua.join(", ")} chưa đăng ký` : ""}.`;
  }
  if (!tong.tong) return `${t}: chưa có cuộc nào đăng ký để đối soát.`;
  const viec = b === "dsBH" ? "ban hành quyết định" : "hoàn thành";
  const thap = dong.filter((d) => d.tong).sort((a, c) => a.daLam / a.tong - c.daLam / c.tong)[0];
  return `${t}: ${viec} đúng hẹn ${tong.daLam}/${tong.tong} cuộc đăng ký (${pt0(tong.daLam, tong.tong)}). Thấp nhất: ${tenPhongDS(thap.phong)} (${thap.daLam}/${thap.tong} · ${pt0(thap.daLam, thap.tong)})${b === "dsHT" && tong.thu ? `. Truy thu và phạt của các cuộc hoàn thành: ${ty1(tong.thu)} tỷ đồng` : ""}.`;
}

export function DoiSoatKT({ ky, actor }: { ky: KyQ; actor: string }) {
  const ds = useCuocKT();
  const [b, datB] = useThamSo<BieuDS>("bieu", "dsBH", BIEU.map((x) => x.id));
  const thang = ky.thang;
  const bieu = BIEU.find((x) => x.id === b)!;
  const { dong, tong } = bangDoiSoat(ds, b, thang);
  const cot = cotBieu(b);
  const daiNhom = cot.filter((c) => c.nhom).length;
  const dauNhom = cot.findIndex((c) => c.nhom);
  const nhanNhom = b === "dkBH" || b === "dkHT" ? "Kiểm tra đột xuất" : b === "dsBH" ? "SL đã ban hành" : "QĐ hoàn thành";

  const xuat = () => exportExcel(BIEU.map((x): ReportSheet => {
    const r = bangDoiSoat(ds, x.id, thang), c = cotBieu(x.id);
    return {
      name: x.nhan.replace(/\s/g, "_"), title: `${x.tieuDe} THÁNG ${String(thang).padStart(2, "0")} NĂM 2026`,
      headers: ["Phòng", ...c.map((k) => `${k.nhan} ${k.ma}`)],
      rows: [...r.dong.map((d) => [PHONG_DS.find((p) => p.id === d.phong)!.mau, ...c.map((k) => k.xuat(d))]), ["Grand Total", ...c.map((k) => k.xuat(r.tong))]],
      percent: c.map((k, i) => (k.ma === "(2) / (1)" ? i + 1 : -1)).filter((i) => i > 0),
      bold: [r.dong.length],
    };
  }), { period: `Tháng ${thang}/2026`, scope: "Các Phòng Kiểm tra", actor, status: "DRAFT" }, `doi-soat-kiem-tra_2026-${String(thang).padStart(2, "0")}.xlsx`);

  return <Panel title={`${bieu.tieuDe[0]}${bieu.tieuDe.slice(1).toLowerCase()} tháng ${String(thang).padStart(2, "0")}/2026`}
    subtitle="Tổng hợp từ dữ liệu các đoàn kiểm tra đã nhập ở tab Cuộc kiểm tra · dữ liệu mô phỏng"
    actions={<ExportButton onExport={xuat}>Xuất Excel</ExportButton>}>
    <div className="pkt-bieu-chon"><Segmented label="Biểu" value={b} onChange={datB} options={BIEU.map((x) => ({ value: x.id, label: x.nhan }))}/></div>
    <p className="pkt-tom-tat"><Icon name="report" size={16}/><span><b>Tóm tắt</b> {tomTat(b, thang, dong, tong)}</span></p>
    <TableWrap label={`${bieu.nhan} tháng ${thang}/2026`}>
      <table className="qd-bang pkt-bang-ds">
        <thead>
          <tr>
            <th scope="col" rowSpan={2} className="pkt-ds-phong">Phòng</th>
            {cot.map((c, i) => (c.nhom ? (i === dauNhom ? <th key="nhom" scope="colgroup" colSpan={daiNhom} className="pkt-ds-nhom">{nhanNhom}</th> : null) : <th key={i} scope="col" rowSpan={2} className="num"><span>{c.nhan}</span><small>{c.ma}</small></th>))}
          </tr>
          <tr>{cot.filter((c) => c.nhom).map((c, i) => <th key={i} scope="col" className={`num${c.ma.includes("=") ? " is-tong" : ""}`}><span>{c.nhan}</span><small>{c.ma}</small></th>)}</tr>
        </thead>
        <tbody>
          {dong.map((d) => <tr key={d.phong}><th scope="row">{tenPhongDS(d.phong)}</th>{cot.map((c, i) => <td key={i} className={`num${c.nhom && c.ma.includes("=") ? " is-tong" : ""}`}>{c.o(d)}</td>)}</tr>)}
        </tbody>
        <tfoot><tr><th scope="row">Tổng cộng</th>{cot.map((c, i) => <td key={i} className="num">{c.o(tong)}</td>)}</tr></tfoot>
      </table>
    </TableWrap>
    <p className="pkt-chu-thich">Đối soát đếm trong số cuộc đã đăng ký của tháng những cuộc ban hành / hoàn thành ngay trong tháng đó; cuộc trễ sang tháng sau không tính là đúng hẹn (giả định cách đếm, chờ Phòng Kiểm tra xác nhận).</p>
  </Panel>;
}

/* =====================================================================
   Tab Nhập dữ liệu — mục 3 của ghi chú PKT
   ===================================================================== */

interface LanNhap { luc: string; taiKhoan: string; loai: LoaiNhap; choDV: string; tep: string; soDong: number; canhBao: number }
let lichSu: LanNhap[] = [];
const ngheLS = new Set<() => void>();
const useLichSu = () => useSyncExternalStore((f) => { ngheLS.add(f); return () => ngheLS.delete(f); }, () => lichSu);
const ghiLS = (l: LanNhap) => { lichSu = [l, ...lichSu]; ngheLS.forEach((f) => f()); };

/* Biên bản: Trưởng phòng / Lãnh đạo chọn nhập cho Thuế cơ sở hay Phòng Kiểm tra nào. */
const CHON_DV = ["TP", "LD_TP"];
const DV_NHAP = DON_VI_KT.filter((d) => d.coChiTieu);

type Buoc = { kieu: "cho" } | { kieu: "doc"; tep: string } | { kieu: "kq"; tep: string; kq: KetQuaKT } | { kieu: "xong"; tep: string; soDong: number } | { kieu: "hong"; tep: string; loi: string };

export function NhapDuLieuKT({ user }: { user: DemoUser }) {
  const [loai, datLoai] = useThamSo<LoaiNhap>("mau", "chuyenDe", MAU_NHAP.map((m) => m.id));
  const ls = useLichSu();
  const mau = MAU_NHAP.find((m) => m.id === loai)!;
  const duocChon = CHON_DV.includes(user.vaiTro);
  const [choDV, datChoDV] = useState("");
  const [buoc, datBuoc] = useState<Buoc>({ kieu: "cho" });
  const [keo, datKeo] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const notify = useAction();
  useEffect(() => { datBuoc({ kieu: "cho" }); }, [loai]);

  const tenDV = duocChon ? (choDV ? DV_NHAP.find((d) => d.id === choDV)!.ten : "Tất cả Phòng Kiểm tra và Thuế cơ sở") : user.unit;
  const doc = async (f: File | undefined) => {
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) { datBuoc({ kieu: "hong", tep: f.name, loi: "Chỉ nhận tệp Excel .xlsx theo mẫu. Tệp .xls hoặc .csv hãy mở bằng Excel rồi lưu lại dạng .xlsx." }); return; }
    datBuoc({ kieu: "doc", tep: f.name });
    try { datBuoc({ kieu: "kq", tep: f.name, kq: kiemTep(loai, await docXlsx(f), f.name) }); }
    catch (e) { datBuoc({ kieu: "hong", tep: f.name, loi: e instanceof Error ? e.message : "Không đọc được tệp." }); }
  };
  const nhap = () => {
    if (buoc.kieu !== "kq") return;
    ghiLS({ luc: new Date().toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }), taiKhoan: user.username, loai, choDV: tenDV, tep: buoc.tep, soDong: buoc.kq.hopLe, canhBao: buoc.kq.van.filter((v) => v.muc === "canhBao").length });
    notify(`Đã nhập ${buoc.kq.hopLe} dòng ${mau.ten.toLowerCase()} cho ${tenDV}. Bản demo chưa gửi lên máy chủ.`);
    datBuoc({ kieu: "xong", tep: buoc.tep, soDong: buoc.kq.hopLe });
  };
  const tha = (e: DragEvent) => { e.preventDefault(); datKeo(false); doc(e.dataTransfer.files[0]); };
  const soBuoc = buoc.kieu === "cho" || buoc.kieu === "hong" ? 1 : buoc.kieu === "xong" ? 3 : 2;

  return <div className="pkt-nhap">
    <div className="pkt-nhap-trai">
      <Panel title="Loại dữ liệu" subtitle="Mỗi loại một tệp mẫu riêng">
        <ul className="pkt-mau" role="list">{MAU_NHAP.map((m) => {
          const lan = ls.find((l) => l.loai === m.id);
          return <li key={m.id}><button type="button" className={`pkt-mau-o${loai === m.id ? " is-chon" : ""}`} aria-pressed={loai === m.id} onClick={() => datLoai(m.id)}>
            <span className="pkt-mau-ten">{m.ten}{!m.tep ? <em className="pkt-the is-cho">Chờ file mẫu</em> : lan ? <em className="pkt-the is-xong">Đã nhập {lan.luc.split(" ")[0]}</em> : <em className="pkt-the">Chưa nhập</em>}</span>
            <small>{m.moTa}</small>
          </button></li>;
        })}</ul>
      </Panel>
    </div>

    <Panel title={`Nhập ${mau.ten.toLowerCase()}`} subtitle={mau.tep ? `Bước ${soBuoc}/3 · ${["", "Chọn tệp", "Kiểm tra dữ liệu", "Đã nhập"][soBuoc]}` : "Chưa có tệp mẫu"} className="pkt-nhap-phai"
      actions={mau.tep ? <a className="button is-secondary" href={`${import.meta.env.BASE_URL}mau/${mau.tep}`} download={mau.tep}><Icon name="file" size={16}/><span>Tải file mẫu</span></a> : undefined}>
      {!mau.tep ? <div className="pkt-trong-lon">
        <strong>Chưa có tệp mẫu danh mục đoàn kiểm tra</strong>
        <p>Ghi chú PKT ngày 03/11/2026 thay mục "Dữ liệu kỳ trước" bằng mục này nhưng chưa kèm tệp. Khi Phòng Kiểm tra gửi mẫu, mục này mở nhập như ba mục còn lại.</p>
      </div> : <>
        <div className="pkt-cho-dv">
          {duocChon ? <label className="compact-field"><span>Nhập cho</span>
            <select value={choDV} onChange={(e) => datChoDV(e.target.value)}>
              <option value="">Tất cả Phòng Kiểm tra và Thuế cơ sở</option>
              <optgroup label="Phòng Kiểm tra">{DV_NHAP.filter((d) => d.khoi === "VP").map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}</optgroup>
              <optgroup label="Thuế cơ sở">{DV_NHAP.filter((d) => d.khoi === "TCS").map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}</optgroup>
            </select>
          </label> : <p><span>Nhập cho</span><b>{user.unit}</b><small>Chỉ Trưởng phòng và Lãnh đạo chọn được đơn vị khác.</small></p>}
        </div>

        {(buoc.kieu === "cho" || buoc.kieu === "hong") && <>
          <label className={`pkt-tha${keo ? " is-keo" : ""}`} onDragOver={(e) => { e.preventDefault(); datKeo(true); }} onDragLeave={() => datKeo(false)} onDrop={tha}>
            <Icon name="upload" size={22}/>
            <strong>Kéo thả tệp Excel vào đây, hoặc <span className="pkt-tha-nut">chọn tệp</span></strong>
            <small>Tên tệp: {mau.tienTo}_&lt;YYYYMMDD&gt;.xlsx · chỉ nhận .xlsx theo mẫu</small>
            <input ref={input} className="sr-only" type="file" accept=".xlsx" onChange={(e) => { doc(e.target.files?.[0]); e.target.value = ""; }}/>
          </label>
          {buoc.kieu === "hong" && <p className="quality-note" role="alert">{buoc.tep}: {buoc.loi}</p>}
        </>}
        {buoc.kieu === "doc" && <p className="pkt-dang-doc" role="status">Đang đọc {buoc.tep}…</p>}
        {buoc.kieu === "kq" && <KetQuaNhap tep={buoc.tep} kq={buoc.kq} huy={() => datBuoc({ kieu: "cho" })} nhap={nhap}/>}
        {buoc.kieu === "xong" && <div className="pkt-xong" role="status">
          <Icon name="check" size={20}/>
          <div><strong>Đã nhập {integer(buoc.soDong)} dòng từ {buoc.tep}</strong><small>Cho {tenDV}. Hệ thống dùng tệp có ngày mới nhất.</small></div>
          <Button kind="secondary" onClick={() => datBuoc({ kieu: "cho" })}>Nhập tệp khác</Button>
        </div>}
      </>}
    </Panel>

    <Panel title="Lịch sử nhập" subtitle="Các lần nhập trong phiên làm việc này" className="pkt-nhap-ls">
      {ls.length ? <TableWrap label="Lịch sử nhập dữ liệu">
        <table className="qd-bang">
          <thead><tr><th scope="col">Thời gian</th><th scope="col">Tài khoản</th><th scope="col">Loại dữ liệu</th><th scope="col">Nhập cho</th><th scope="col">Tệp</th><th scope="col" className="num">Số dòng</th><th scope="col">Trạng thái</th></tr></thead>
          <tbody>{ls.map((l, i) => <tr key={i}><td>{l.luc}</td><td>{l.taiKhoan}</td><td>{MAU_NHAP.find((m) => m.id === l.loai)!.ten}</td><td>{l.choDV}</td><td className="pkt-tep">{l.tep}</td><td className="num">{integer(l.soDong)}</td><td><Badge tone={l.canhBao ? "warning" : "positive"}>{l.canhBao ? `Đã nhập · ${l.canhBao} cảnh báo` : "Thành công"}</Badge></td></tr>)}</tbody>
        </table>
      </TableWrap> : <p className="pkt-trong">Chưa có lần nhập nào. Tải file mẫu, điền theo sheet HUONG_DAN rồi kéo tệp vào ô bên trên.</p>}
    </Panel>
  </div>;
}

function KetQuaNhap({ tep, kq, huy, nhap }: { tep: string; kq: KetQuaKT; huy: () => void; nhap: () => void }) {
  const loi = kq.van.filter((v) => v.muc === "loi"), cb = kq.van.filter((v) => v.muc === "canhBao");
  return <div className="pkt-kq">
    <p className="pkt-kq-tep"><b>{tep}</b>{kq.tomTat && <span>{kq.tomTat}</span>}</p>
    <ul className="pkt-dem" role="list">
      <li className="is-ok"><b>{integer(kq.hopLe)}</b> dòng hợp lệ</li>
      <li className={cb.length ? "is-cb" : undefined}><b>{cb.length}</b> cảnh báo</li>
      <li className={loi.length ? "is-loi" : undefined}><b>{loi.length}</b> lỗi</li>
    </ul>
    {kq.van.length > 0 && <TableWrap label="Lỗi và cảnh báo của tệp">
      <table className="qd-bang pkt-bang-loi">
        <thead><tr><th scope="col">Vị trí</th><th scope="col">Nội dung</th></tr></thead>
        <tbody>{kq.van.map((v, i) => <Fragment key={i}><tr className={v.muc === "loi" ? "is-loi" : undefined}>
          <td className="pkt-vi-tri">{v.sheet && <small>{v.sheet}</small>}{v.dong ? `Dòng ${v.dong} · ${v.cot}` : v.cot.length <= 3 ? `Cột ${v.cot}` : v.cot}</td>
          <td><em className={`pkt-muc${v.muc === "loi" ? " is-loi" : ""}`}>{v.muc === "loi" ? "Lỗi" : "Cảnh báo"}</em>{v.noiDung}</td>
        </tr></Fragment>)}</tbody>
      </table>
    </TableWrap>}
    <div className="pkt-kq-nut">
      <Button kind="secondary" onClick={huy}>Chọn tệp khác</Button>
      <Button kind="primary" icon="upload" disabled={kq.chan} onClick={nhap} title={kq.chan ? "Sửa các lỗi ở phần đầu tệp rồi chọn lại" : undefined}>
        {kq.chan ? "Chưa nhập được" : `Nhập ${integer(kq.hopLe)} dòng hợp lệ`}
      </Button>
    </div>
  </div>;
}
