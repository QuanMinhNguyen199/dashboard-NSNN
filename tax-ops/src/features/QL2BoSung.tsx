import { useState } from "react";
import { Button, Panel, TableWrap, money } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { useBoLoc } from "@/components/BoLoc";
import { DON_VI_QL2, type KyQL2 } from "@/data/ql2";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportMeta, ReportSheet } from "@/domain/reportExport";
import type { VaiTro } from "@/domain/types";
import { rutGonTenDonVi } from "@/data/danhMuc";

/** Chỉ dựng các chỉ tiêu được nêu rõ trong tài liệu; không tự đặt 16 tên cột TPR. */
export function TPRQL2({ ky }: { ky: KyQL2 }) {
  const { chon } = useBoLoc();
  const [tuKy, datTuKy] = useState(ky.ngayChot.slice(3));
  const vp = DON_VI_QL2.filter((d) => d.nhom === "VP");
  const ds = DON_VI_QL2.filter((d) => !chon.donVi.length || chon.donVi.includes(d.ten));
  const phong = ds.filter((d) => d.nhom === "VP");
  const rows = [
    ...(!chon.donVi.length || phong.length ? [{ id: "8501", ten: "8501 · Văn phòng", trongDo: false }] : []),
    ...phong.map((d) => ({ ...d, trongDo: true })),
    ...(!chon.donVi.length || vp.every((d) => chon.donVi.includes(d.ten)) ? [{ id: "HKD", ten: "Phòng HKD", trongDo: true }] : []),
    ...ds.filter((d) => d.nhom === "TCS").map((d) => ({ ...d, trongDo: false })),
  ];
  return <Panel title="Rủi ro TPR · theo kỳ đánh giá" subtitle={`${ky.nhan} · webtpr 6.5`} actions={
    <label className="compact-field"><span>Lũy kế từ kỳ</span><select value={tuKy} onChange={(e) => datTuKy(e.target.value)}>
      {Array.from({ length: Number(ky.ngayChot.slice(3, 5)) }, (_, i) => `${String(i + 1).padStart(2, "0")}/${ky.ngayChot.slice(6)}`).map((k) => <option key={k}>{k}</option>)}
    </select></label>
  }>
    <p className="ql2-note">Mẫu TPR đã được xác nhận ngày 06/10. Chưa nạp “Báo cáo TPR 01.10.xlsx” để đối chiếu đủ 16 cột. File chi tiết tách Văn phòng còn chờ Q-104; ô chưa có nguồn để trống, không ghi số 0.</p>
    <p>Lũy kế từ {tuKy} đến {ky.ngayChot.slice(3)}. Các dòng “Trong đó” thuộc Văn phòng, không cộng lần nữa vào tổng ngành.</p>
    <TableWrap label="TPR theo đơn vị"><table className="ql1-table" style={{ minWidth: 850 }}>
      <thead><tr><th>Đơn vị</th><th>Số NNT rủi ro</th><th>Đã rà soát</th><th>Chưa rà soát</th></tr></thead>
      <tbody>{rows.map((d) => <tr key={d.id}><th scope="row">{d.trongDo ? "Trong đó: " : ""}{rutGonTenDonVi(d.ten)}</th>{[0, 1, 2].map((i) => <td key={i} className="cell-empty" title="Chưa có dữ liệu nguồn">—</td>)}</tr>)}</tbody>
    </table></TableWrap>
  </Panel>;
}

type SoLieu = { phaiDN: string; phaiHD: string; daDN: string; daHD: string; nguon: string; nguoi: string; luc: string };
const rong: SoLieu = { phaiDN: "", phaiHD: "", daDN: "", daHD: "", nguon: "", nguoi: "", luc: "" };
const fields = ["phaiDN", "phaiHD", "daDN", "daHD"] as const;
const labels = ["Phải thực hiện · số DN", "Phải thực hiện · số HĐ", "Đã xử lý · số DN", "Đã xử lý · số HĐ"];
const valid = (r: SoLieu) => fields.every((f) => /^\d+$/.test(r[f]) && Number.isSafeInteger(Number(r[f]))) && Number(r.daDN) <= Number(r.phaiDN) && Number(r.daHD) <= Number(r.phaiHD) && Boolean(r.nguon.trim());
export function CongAnQL2({ ky, vaiTro, meta }: { ky: KyQL2; vaiTro: VaiTro; meta: ReportMeta }) {
  const { chon } = useBoLoc();
  const storage = `ql2-congan-demo-${ky.id}`;
  const [saved, setSaved] = useState<Record<string, SoLieu>>(() => { try { return JSON.parse(sessionStorage.getItem(storage) ?? "{}"); } catch { return {}; } });
  const [draft, setDraft] = useState(saved);
  const [loi, datLoi] = useState("");
  const ds = DON_VI_QL2.filter((d) => !chon.donVi.length || chon.donVi.includes(d.ten));
  const luu = (id: string) => {
    const row = draft[id] ?? rong;
    if (!valid(row)) { datLoi("Nhập đủ bốn số nguyên không âm và nguồn số liệu; số đã xử lý không được vượt số phải thực hiện."); return; }
    const next = { ...saved, [id]: { ...row, nguoi: meta.actor, luc: new Date().toISOString() } };
    sessionStorage.setItem(storage, JSON.stringify(next)); setSaved(next); setDraft((old) => ({ ...old, [id]: next[id] })); datLoi("");
  };
  const sheet: ReportSheet = {
    name: "Goi Cong an", title: `Gói rủi ro Công an · ${ky.nhan} · chỉ tiêu tổng hợp đã nhập`,
    headers: ["Đơn vị", ...labels, "Còn phải xử lý · số DN", "Còn phải xử lý · số HĐ", "Tỷ lệ theo số DN", "Nguồn số liệu", "Người nhập", "Thời điểm"],
    rows: ds.map((d) => { const r = saved[d.id]; return [d.ten, ...fields.map((f) => r ? Number(r[f]) : null), r ? Number(r.phaiDN) - Number(r.daDN) : null, r ? Number(r.phaiHD) - Number(r.daHD) : null, r && Number(r.phaiDN) ? Number(r.daDN) / Number(r.phaiDN) : null, r?.nguon ?? null, r?.nguoi ?? null, r?.luc ?? null]; }), percent: [7],
  };
  return <Panel title="Gói rủi ro Công an · nhập số tổng hợp" subtitle={`${ky.nhan} · số liệu nhập tay · lưu trong phiên demo`} actions={<ExportButton onExport={() => exportExcel([sheet], meta, `QL2_CongAn_${ky.id}.xlsx`)}>Xuất số đã lưu</ExportButton>}>
    <p className="ql2-note">Đã có mẫu theo xác nhận 06/10. Chưa nạp tệp “BC gói hđ CA 3007.xls” để đối chiếu tên bốn hình thức xử lý. Phần dưới nhập các chỉ tiêu tổng hợp đã rõ; chưa phát hành báo cáo đầy đủ theo mẫu.</p>
    {loi && <p role="alert" className="quality-note">{loi}</p>}
    <TableWrap label="số liệu gói Công an"><table className="ql1-ds-table" style={{ minWidth: 1450 }}>
      <thead><tr><th>Đơn vị</th>{labels.map((l) => <th key={l}>{l}</th>)}<th>Còn · số DN</th><th>Còn · số HĐ</th><th>Tỷ lệ theo DN</th><th>Nguồn số liệu</th>{vaiTro === "CV" && <th>Lưu</th>}</tr></thead>
      <tbody>{ds.map((d) => { const r = draft[d.id] ?? rong; const s = saved[d.id]; return <tr key={d.id}>
        <th scope="row" title={s ? `${s.nguoi} · ${s.luc} · ${s.nguon}` : "Chưa nhập số liệu"}>{rutGonTenDonVi(d.ten)}</th>
        {fields.map((f, i) => <td key={f}>{vaiTro === "CV" ? <input className="ql2-manual" type="number" min="0" step="1" aria-label={`${labels[i]} · ${d.ten}`} value={r[f]} onChange={(e) => setDraft((old) => ({ ...old, [d.id]: { ...(old[d.id] ?? rong), [f]: e.target.value } }))}/> : s ? money(Number(s[f])) : "—"}</td>)}
        <td>{s ? money(Number(s.phaiDN) - Number(s.daDN)) : "—"}</td><td>{s ? money(Number(s.phaiHD) - Number(s.daHD)) : "—"}</td>
        <td>{s && Number(s.phaiDN) ? `${(Number(s.daDN) / Number(s.phaiDN) * 100).toFixed(2).replace(".", ",")}%` : "—"}</td>
        <td>{vaiTro === "CV" ? <input className="ql2-manual" aria-label={`Nguồn số liệu · ${d.ten}`} value={r.nguon} onChange={(e) => setDraft((old) => ({ ...old, [d.id]: { ...(old[d.id] ?? rong), nguon: e.target.value } }))}/> : s?.nguon ?? "—"}</td>
        {vaiTro === "CV" && <td><Button kind="quiet" onClick={() => luu(d.id)}>Lưu dòng</Button></td>}
      </tr>; })}</tbody>
    </table></TableWrap>
  </Panel>;
}
