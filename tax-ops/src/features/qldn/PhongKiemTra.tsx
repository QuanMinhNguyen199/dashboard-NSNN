import { useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { GhiChu } from "@/components/GhiChu";
import { FieldError, Input, Label, TextArea, TextField } from "react-aria-components";
import { Badge, Button, Pager, Panel, SearchField, Segmented, SelectMenu, TableWrap, integer } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportSheet } from "@/domain/reportExport";
import { useThamSo } from "@/state/diaChi";
import { useAction } from "@/state/ActionContext";
import type { KyQ } from "@/data/qldn";
import {
  DOT_XUAT, LOAI_CUOC, NHAN_TIEN_DO, PHONG_DS, bangDoiSoat, luuCuoc, maMoi, nhanLoai, tenPhongDS, tienDo, useCuocKT,
  type BieuDS, type CuocKT, type DongDS, type LoaiCuoc, type TienDo,
} from "@/data/cuocKT";

/*
  Hai tab bổ sung cho Phòng kiểm tra theo ghi chú folder PKT (03/11/2026):
  - Cuộc kiểm tra — đoàn kiểm tra nhập tay từng cuộc (mục 4);
  - Đối soát — báo cáo đối soát công tác kiểm tra theo mẫu Module 2 – Mục 3 (mục 5).
  Tab "Nhập dữ liệu" (mục 3) đã gỡ ngày 05/11/2026 theo yêu cầu người dùng.
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
  /*
    Tên doanh nghiệp theo Danh sách đích danh (MoM 04/11/2026 §3.2b): MST là
    khoá; tên trong danh bạ TMS hay trong bộ file QLRR có thể khác (chi nhánh,
    đổi tên, mất dấu) nên tên trên Quyết định của Cục được ưu tiên và khoá lại.
    MST ngoài danh sách là cuộc phát sinh ngoài kế hoạch: đoàn nhập tay tên.
    Bản demo lấy danh sách từ các cuộc KH2026 mô phỏng trong kho.
  */
  const dichDanh = useMemo(() => new Map(ds.filter((c) => c.loai === "kh").map((c) => [c.mst, c.tenDN])), [ds]);
  const tenDD = dichDanh.get(phieu.mst.trim());

  const mo = (c: CuocKT) => { datPhieu(structuredClone(c)); datLoi({}); if (window.matchMedia("(max-width: 1199px)").matches) phieuRef.current?.scrollIntoView({ block: "start" }); };
  const moMoi = () => { datPhieu(MOI()); datLoi({}); };
  const dat = <K extends keyof CuocKT>(k: K, v: CuocKT[K]) => { datPhieu((p) => ({ ...p, [k]: v })); datLoi((l) => { const { [k as string]: _, ...con } = l; return con; }); };
  /* Gõ MST có trong danh sách đích danh: điền tên theo danh sách. Rời khỏi MST ấy
     thì bỏ tên đã tự điền (tên người dùng tự gõ thì giữ) — tránh MST một nơi, tên một nẻo. */
  const datMST = (v: string) => {
    const tenCu = dichDanh.get(phieu.mst.trim());
    dat("mst", v);
    const ten = dichDanh.get(v.trim());
    if (ten) { dat("tenDN", ten); dat("loai", "kh"); }
    else if (tenCu && phieu.tenDN === tenCu) dat("tenDN", "");
  };

  const luu = (e: FormEvent) => {
    e.preventDefault();
    const l: Record<string, string> = {};
    if (!/^\d{10}(-\d{3})?$/.test(phieu.mst.trim())) l.mst = "MST gồm 10 chữ số, hoặc 10 chữ số-3 chữ số.";
    if (!phieu.tenDN.trim()) l.tenDN = "Nhập tên doanh nghiệp.";
    if (phieu.loai === "kh" && /^\d{10}(-\d{3})?$/.test(phieu.mst.trim()) && !tenDD) l.loai = "MST không có trong Danh sách đích danh 2026. Chọn loại kiểm tra đột xuất phù hợp.";
    if (!phieu.truongDoan.trim()) l.truongDoan = "Nhập tên trưởng đoàn.";
    if (phieu.dkHT && phieu.dkBH && phieu.dkHT < phieu.dkBH) l.dkHT = "Tháng đăng ký hoàn thành không được trước tháng đăng ký ban hành.";
    if (phieu.dsHT && !phieu.dsBH) l.dsHT = "Chưa đối soát ban hành thì chưa đối soát hoàn thành được.";
    if (phieu.thu !== null && phieu.thu < 0) l.thu = "Số tiền không được âm.";
    datLoi(l);
    if (Object.keys(l).length) { phieuRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(l)[0]}"]`)?.focus(); return; }
    const c = { ...phieu, mst: phieu.mst.trim(), tenDN: tenDD ?? phieu.tenDN, id: phieu.id || maMoi() };
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
    <Panel title="Cuộc kiểm tra" subtitle={`${integer(loc.length)} / ${integer(ds.length)} cuộc · dữ liệu mô phỏng`}
      actions={<div className="inline-controls"><Button kind="secondary" icon="file" onClick={moMoi}>Thêm cuộc mới</Button><ExportButton onExport={xuat}>Xuất Excel</ExportButton></div>}>
      <div className="pkt-loc">
        <SearchField value={q} onChange={(v) => doiLoc(() => datQ(v))} placeholder="Tìm MST, tên doanh nghiệp"/>
        {/* Một hàng lọc: tên bộ lọc nằm trong lựa chọn đầu ("Mọi phòng"), nhãn đọc màn hình ở aria-label. */}
        <SelectMenu label="Phòng" value={phong} onChange={(v) => doiLoc(() => datPhong(v))} options={[{ value: "", label: "Mọi phòng" }, ...PHONG_DS.map((p) => ({ value: p.id, label: p.ten }))]}/>
        <SelectMenu<LoaiCuoc | ""> label="Loại hình" value={loai} onChange={(v) => doiLoc(() => datLoai(v))} options={[{ value: "", label: "Mọi loại hình" }, ...LOAI_CUOC.map((l) => ({ value: l.id, label: l.ngan }))]}/>
        <SelectMenu<TienDo | ""> label="Tiến độ" value={td} onChange={(v) => doiLoc(() => datTd(v))} options={[{ value: "", label: "Mọi tiến độ" }, ...(Object.keys(NHAN_TIEN_DO) as TienDo[]).map((k) => ({ value: k, label: NHAN_TIEN_DO[k] }))]}/>
      </div>
      {loc.length ? <TableWrap label="Danh sách cuộc kiểm tra">
        <table className="qd-bang pkt-bang-cuoc">
          <thead><tr><th scope="col">Doanh nghiệp</th><th scope="col" className="pkt-an-dt">Loại hình</th><th scope="col">Tiến độ</th><th scope="col" className="num pkt-an-dt">Truy thu · tr.đ</th></tr></thead>
          <tbody>{loc.slice((tr - 1) * MOI_TRANG, tr * MOI_TRANG).map((c) => <tr key={c.id} className={`pkt-dong${phieu.id === c.id ? " is-chon" : ""}`} onClick={() => mo(c)}>
            <th scope="row"><button type="button" className="row-select" aria-pressed={phieu.id === c.id} onClick={(e) => { e.stopPropagation(); mo(c); }}>
              <span className="pkt-dn">{c.tenDN}</span><small>{c.mst} · {tenPhongDS(c.phong).replace("Phòng Kiểm tra số ", "PKT ")} · {c.truongDoan}</small>
              <small className="pkt-dt">{nhanLoai(c.loai)}{c.thu !== null ? ` · truy thu ${integer(c.thu)} tr.đ` : ""}</small>
            </button></th>
            <td className="pkt-an-dt">{nhanLoai(c.loai)}</td>
            <td><Badge tone={TONE_TIEN_DO[tienDo(c)]}>{NHAN_TIEN_DO[tienDo(c)]}</Badge></td>
            <td className="num pkt-an-dt">{c.thu === null ? <span className="cell-empty">—</span> : integer(c.thu)}</td>
          </tr>)}</tbody>
        </table>
      </TableWrap> : <p className="pkt-trong">Không có cuộc nào khớp bộ lọc. <Button kind="quiet" onClick={() => { datQ(""); datPhong(""); datLoai(""); datTd(""); }}>Xoá bộ lọc</Button></p>}
      <Pager trang={tr} soTrang={soTrang} onChange={datTrang}/>
    </Panel>

    <form ref={phieuRef} className="panel pkt-phieu" onSubmit={luu} noValidate aria-labelledby="pkt-phieu-ten">
      <header className="panel-head"><div><h2 id="pkt-phieu-ten">{sua ? "Sửa cuộc kiểm tra" : "Thêm cuộc kiểm tra"}</h2><p>{sua ? `${phieu.mst} · ${NHAN_TIEN_DO[tienDo(phieu)]}` : "Đoàn nhập khi đăng ký; cập nhật mốc khi đối soát."}</p></div></header>
      <div className="pkt-phieu-than">
        <NhomO ten="Thông tin chung">
          <O nhan="Phòng KT / Thuế cơ sở" chon><SelectMenu kieu="o" name="phong" label="Phòng KT / Thuế cơ sở" value={phieu.phong} onChange={(v) => dat("phong", v)} options={PHONG_DS.map((p) => ({ value: p.id, label: p.ten }))}/></O>
          <OChu nhan="Trưởng đoàn" loi={loi.truongDoan} value={phieu.truongDoan} onChange={(v) => dat("truongDoan", v)}><Input name="truongDoan" placeholder="Họ và tên"/></OChu>
          <OChu nhan="MST" loi={loi.mst} value={phieu.mst} onChange={datMST}><Input name="mst" inputMode="numeric" placeholder="0123456789"/></OChu>
          <OChu nhan="Tên doanh nghiệp" loi={loi.tenDN} value={tenDD ?? phieu.tenDN} onChange={(v) => dat("tenDN", v)} ghi={tenDD ? "Theo Danh sách đích danh 2026 · khoá theo MST" : phieu.mst.trim() ? "Ngoài danh sách đích danh · nhập tay" : undefined}><Input name="tenDN" readOnly={Boolean(tenDD)}/></OChu>
          <O nhan="Loại hình" loi={loi.loai} chon><SelectMenu<LoaiCuoc> kieu="o" name="loai" label="Loại hình" value={phieu.loai} onChange={(v) => dat("loai", v)} options={LOAI_CUOC.map((l) => ({ value: l.id, label: l.nhan }))}/></O>
          <OChu nhan="Thời kỳ TTKT" value={phieu.thoiKy} onChange={(v) => dat("thoiKy", v)}><Input name="thoiKy" placeholder="2022 – 2024"/></OChu>
          <OChu nhan="Ngành nghề kinh doanh chính" rong value={phieu.nganh} onChange={(v) => dat("nganh", v)}><Input name="nganh" placeholder="Ví dụ: xây lắp, thương mại, sản xuất nhựa…"/></OChu>
        </NhomO>
        <NhomO ten="Doanh thu · triệu đồng" ba>
          {[2022, 2023, 2024].map((nam, i) => <OChu key={nam} nhan={String(nam)} value={String(phieu.dt[i] ?? "")} onChange={(v) => { const dt = [...phieu.dt] as CuocKT["dt"]; dt[i] = v === "" ? null : Number(v); dat("dt", dt); }}><Input name={`dt${nam}`} type="number" min={0} inputMode="numeric"/></OChu>)}
        </NhomO>
        <NhomO ten="Mốc tiến độ · năm 2026">
          {([["dkBH", "Đăng ký ban hành"], ["dkHT", "Đăng ký hoàn thành"], ["dsBH", "Đối soát ban hành"], ["dsHT", "Đối soát hoàn thành"]] as const).map(([k, nhan]) => <O key={k} nhan={nhan} loi={loi[k]} chon>
            <SelectMenu kieu="o" name={k} label={nhan} value={phieu[k] === null ? "" : String(phieu[k])} onChange={(v) => dat(k, v ? Number(v) : null)} options={[{ value: "", label: "Chưa có" }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: thangChu(i + 1) }))]}/>
          </O>)}
        </NhomO>
        <NhomO ten="Quyết định">
          <OChu nhan="QĐ kiểm tra · số" value={phieu.qdKT.so} onChange={(v) => dat("qdKT", { ...phieu.qdKT, so: v })}><Input name="qdKTSo"/></OChu>
          <OChu nhan="QĐ kiểm tra · ngày" value={phieu.qdKT.ngay} onChange={(v) => dat("qdKT", { ...phieu.qdKT, ngay: v })}><Input name="qdKTNgay" placeholder="dd/mm/yyyy"/></OChu>
          <OChu nhan="QĐ xử lý · số" value={phieu.qdXL.so} onChange={(v) => dat("qdXL", { ...phieu.qdXL, so: v })}><Input name="qdXLSo"/></OChu>
          <OChu nhan="QĐ xử lý · ngày" value={phieu.qdXL.ngay} onChange={(v) => dat("qdXL", { ...phieu.qdXL, ngay: v })}><Input name="qdXLNgay" placeholder="dd/mm/yyyy"/></OChu>
        </NhomO>
        <NhomO ten="Kết quả">
          <OChu nhan="Tổng truy thu, phạt, truy hoàn · tr.đ" loi={loi.thu} value={String(phieu.thu ?? "")} onChange={(v) => dat("thu", v === "" ? null : Number(v))}><Input name="thu" type="number" min={0} inputMode="decimal"/></OChu>
          <O nhan="Tiến độ thực hiện"><output className="pkt-tien-do"><Badge tone={TONE_TIEN_DO[tienDo(phieu)]}>{NHAN_TIEN_DO[tienDo(phieu)]}</Badge><small>tự tính từ bốn mốc</small></output></O>
          <OChu nhan="Ghi chú" rong value={phieu.ghiChu} onChange={(v) => dat("ghiChu", v)}><TextArea name="ghiChu" rows={2}/></OChu>
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
/* `chon`: ô chứa SelectMenu (nút, không phải trường nhập) nên khung là `div`; tên đọc màn hình đi qua `label` của SelectMenu. */
function O({ nhan, loi, rong, chon, children }: { nhan: string; loi?: string; rong?: boolean; chon?: boolean; children: ReactNode }) {
  const Khung = chon ? "div" : "label";
  return <Khung className={`pkt-o${rong ? " is-rong" : ""}${loi ? " is-loi" : ""}`}><span>{nhan}</span>{children}{loi && <small role="alert">{loi}</small>}</Khung>;
}

/* Ô chữ (React Aria TextField): nhãn, ô và dòng lỗi nối với nhau — ô sai mang
   aria-invalid và đọc lỗi khi Tab quay lại, không chỉ lúc lỗi vừa hiện. */
function OChu({ nhan, loi, rong, value, onChange, ghi, children }: { nhan: string; loi?: string; rong?: boolean; value: string; onChange: (v: string) => void; ghi?: string; children: ReactNode }) {
  const idGhi = useId();
  return <TextField className={`pkt-o${rong ? " is-rong" : ""}${loi ? " is-loi" : ""}`} value={value} onChange={onChange} isInvalid={Boolean(loi)} aria-describedby={ghi && !loi ? idGhi : undefined}>
    <Label>{nhan}</Label>{children}{ghi && !loi && <span id={idGhi} className="pkt-o-ghi">{ghi}</span>}{loi && <FieldError className="pkt-o-loi"><span role="alert">{loi}</span></FieldError>}
  </TextField>;
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
function cotBieu(b: BieuDS): { nhan: string; ngan?: string; ma: string; o: (d: DongDS) => ReactNode; xuat: (d: DongDS) => number | string | null; nhom?: true }[] {
  if (b === "dkBH" || b === "dkHT") return [
    { nhan: b === "dkBH" ? "Tổng đăng ký ban hành" : "Tổng đăng ký hoàn thành", ma: "(1) = (1.1) + (1.2)", o: (d) => so0(d.tong), xuat: (d) => d.tong },
    { nhan: "Trong đó KH2026", ma: "(1.1)", o: (d) => so0(d.theoLoai.kh), xuat: (d) => d.theoLoai.kh },
    { nhan: "Tổng cộng", ma: "(1.2) = (2.1) + … + (2.9)", nhom: true, o: (d) => so0(d.tong - d.theoLoai.kh), xuat: (d) => d.tong - d.theoLoai.kh },
    ...DOT_XUAT.map((l, i) => ({ nhan: l.nhan, ngan: l.ngan, ma: `(2.${i + 1})`, nhom: true as const, o: (d: DongDS) => so0(d.theoLoai[l.id]), xuat: (d: DongDS) => d.theoLoai[l.id] })),
  ];
  const ht = b === "dsHT";
  return [
    { nhan: ht ? "Tổng đăng ký hoàn thành" : "Tổng đăng ký ban hành", ma: "(1)", o: (d) => so0(d.tong), xuat: (d) => d.tong },
    { nhan: ht ? "Tổng SL QĐ hoàn thành" : "Tổng SL đã ban hành", ma: "(2) = (2.1) + … + (2.10)", nhom: true, o: (d) => so0(d.daLam), xuat: (d) => d.daLam },
    ...LOAI_CUOC.map((l, i) => ({ nhan: l.nhan, ngan: l.ngan, ma: `(2.${i + 1})`, nhom: true as const, o: (d: DongDS) => so0(d.theoLoai[l.id]), xuat: (d: DongDS) => d.theoLoai[l.id] })),
    { nhan: ht ? "Tỷ lệ hoàn thành" : "Tỷ lệ ban hành", ma: "(2) / (1)", o: (d) => <strong>{pt0(d.daLam, d.tong)}</strong>, xuat: (d) => (d.tong ? d.daLam / d.tong : null) },
    ...(ht ? [{ nhan: "Tổng truy thu và phạt hoàn thành · tỷ đồng", ngan: "Truy thu và phạt · tỷ đồng", ma: "(3)", o: (d: DongDS) => ty1(d.thu), xuat: (d: DongDS) => d.thu / 1000 }] : []),
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
    tieuDeKem={<GhiChu tieuDe="Cách tổng hợp">Tổng hợp từ dữ liệu các đoàn kiểm tra nhập ở tab Cuộc kiểm tra (dữ liệu mô phỏng). Đối soát đếm trong số cuộc đã đăng ký của tháng những cuộc ban hành / hoàn thành ngay trong tháng đó; cuộc trễ sang tháng sau không tính là đúng hẹn (giả định cách đếm, chờ Phòng Kiểm tra xác nhận).</GhiChu>}
    subtitle={tomTat(b, thang, dong, tong)}
    actions={<ExportButton onExport={xuat}>Xuất Excel</ExportButton>}>
    <div className="pkt-bieu-chon"><Segmented label="Biểu" value={b} onChange={datB} options={BIEU.map((x) => ({ value: x.id, label: x.nhan }))}/></div>
    <TableWrap label={`${bieu.nhan} tháng ${thang}/2026`}>
      <table className="qd-bang pkt-bang-ds">
        <thead>
          <tr>
            <th scope="col" rowSpan={2} className="pkt-ds-phong">Phòng</th>
            {cot.map((c, i) => (c.nhom ? (i === dauNhom ? <th key="nhom" scope="colgroup" colSpan={daiNhom} className="pkt-ds-nhom">{nhanNhom}</th> : null) : <th key={i} scope="col" rowSpan={2} className="num" title={c.nhan}><span>{c.ngan ?? c.nhan}</span><small>{c.ma}</small></th>))}
          </tr>
          <tr>{cot.filter((c) => c.nhom).map((c, i) => <th key={i} scope="col" className={`num${c.ma.includes("=") ? " is-tong" : ""}`} title={c.nhan}><span>{c.ngan ?? c.nhan}</span><small>{c.ma}</small></th>)}</tr>
        </thead>
        <tbody>
          {dong.map((d) => <tr key={d.phong}><th scope="row">{tenPhongDS(d.phong)}</th>{cot.map((c, i) => <td key={i} className={`num${c.nhom && c.ma.includes("=") ? " is-tong" : ""}`}>{c.o(d)}</td>)}</tr>)}
        </tbody>
        <tfoot><tr><th scope="row">Tổng cộng</th>{cot.map((c, i) => <td key={i} className="num">{c.o(tong)}</td>)}</tr></tfoot>
      </table>
    </TableWrap>
  </Panel>;
}
