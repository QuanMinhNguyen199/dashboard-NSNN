import { useMemo, useState } from "react";
import { FigureLine, PageIntro, Pager, Panel, TableWrap, integer } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import type { DemoUser } from "@/auth/demoAuth";
import { exportExcel } from "@/domain/reportFiles";
import { useThamSo } from "@/state/diaChi";
import {
  NAM_THANH_LAP, QUY_MO_VON, SAC_THUE, TRANG_THAI_DN, doiTuongPhamVi, nhanPhamVi, trangDN,
  type PhamVi, type TrangThaiDN,
} from "@/data/qldn";
import { NgoaiPhamVi, ThanhPhamVi, usePhamVi } from "@/features/qldn/PhamViQLDN";

/*
  Mô-đun 1 — Tổng quan quản lý đối tượng (biên bản 09/10/2026 §5).

  Câu hỏi của màn: "đơn vị hoặc cán bộ đang quản lý bao nhiêu người nộp thuế
  và họ đang ở tình trạng nào". Bố cục theo mẫu dashboard trưởng phòng đã gửi
  (infographic "Module 1"): số lượng đối tượng → trạng thái DN → số năm thành
  lập, quy mô vốn → số thu và cơ cấu thu → kê khai → nợ tổng thể.

  Tổng quan và chi tiết là HAI TAB (§2.2). Bấm một trạng thái DN mở tab danh
  sách đã lọc theo trạng thái ấy.

  Mốc thời gian là số đến hết tháng 9/2026 — danh bạ NNT không có kỳ lũy kế
  như số thu, nên màn này không có ô Kỳ.
*/

type Tab = "tongquan" | "danhsach";
const TAB: { id: Tab; nhan: string }[] = [{ id: "tongquan", nhan: "Tổng quan" }, { id: "danhsach", nhan: "Danh sách doanh nghiệp" }];
const TRANG_THAI_ID = TRANG_THAI_DN.map((t) => t.id);

/*
  Năm màu sắc thuế là bộ PHÂN LOẠI — đã chạy `validate_palette.js`: đạt tách
  màu cho người mù màu và người nhìn thường. Cam dưới tương phản 3:1 nên chú
  giải luôn mang số phần trăm, không để màu nói một mình.
*/
const MAU_SAC_THUE = ["#1657a8", "#e08a2c", "#2f9e8f", "#8a5cc2", "#d1495b"];

const phanTram = (x: number, tong: number) => tong ? `${((x / tong) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%` : "—";
const tyDong = (x: number) => x.toLocaleString("vi-VN", { maximumFractionDigits: 1 });

export function TongQuanDoiTuong({ user }: { user: DemoUser }) {
  const { pv } = usePhamVi(user);
  const [tab, datTab] = useThamSo<Tab>("muc", "tongquan", ["tongquan", "danhsach"]);
  const [loc, datLoc] = useThamSo<TrangThaiDN | "">("loc", "", ["", ...TRANG_THAI_ID]);
  if (!pv) return <NgoaiPhamVi/>;

  const moDanhSach = (tt: TrangThaiDN | "") => { datLoc(tt); datTab("danhsach"); };

  return <div className="page-stack qd-page">
    <PageIntro title="Tổng quan đối tượng"/>
    <nav className="thanh-muc" aria-label="Mục của tổng quan đối tượng">
      <div className="thanh-muc-hang">{TAB.map((t) => <button key={t.id} type="button" className={`muc-tab${tab === t.id ? " is-active" : ""}`} aria-current={tab === t.id ? "page" : undefined} onClick={() => datTab(t.id)}><span>{t.nhan}</span></button>)}</div>
    </nav>
    <ThanhPhamVi pv={pv} coKy={false} them={<div className="bo-loc-muc"><span className="bo-loc-nhan">Số liệu</span><strong className="bo-loc-ky">Đến 30/09/2026</strong></div>}/>
    {tab === "tongquan" ? <TongQuan pv={pv} moDanhSach={moDanhSach}/> : <DanhSach pv={pv} loc={loc} datLoc={datLoc} actor={user.name}/>}
  </div>;
}

function TongQuan({ pv, moDanhSach }: { pv: PhamVi; moDanhSach: (tt: TrangThaiDN | "") => void }) {
  const o = useMemo(() => doiTuongPhamVi(pv), [pv]);
  const tongTT = o.soDN;
  const maxTT = Math.max(...TRANG_THAI_DN.map((t) => o.trangThai[t.id]));
  const tongKK = o.keKhai.dungHan + o.keKhai.muon + o.keKhai.chua;
  const ngoaiHKD = o.soHKD === null;

  return <>
    {/* Bốn ô cố định ở mọi vai. Phạm vi chỉ có phòng QLDN thì hộ kinh doanh
        và cá nhân không thuộc phạm vi — ô vẫn đứng đó và nói điều ấy. */}
    <FigureLine items={[
      { label: pv.canBo ? "Doanh nghiệp được phân công" : "Doanh nghiệp, tổ chức", value: integer(o.soDN), note: "Bấm để mở danh sách", onSelect: () => moDanhSach("") },
      { label: pv.canBo ? "Cán bộ quản lý" : "Cán bộ đang quản lý", value: pv.canBo ? "1" : integer(o.soCanBo), note: pv.canBo ? pv.canBo.ten : "theo phân công TMS 2.4.2" },
      { label: "Hộ kinh doanh", value: ngoaiHKD ? "—" : integer(o.soHKD!), note: ngoaiHKD ? "Chỉ thuế cơ sở quản lý nhóm này" : "do thuế cơ sở quản lý" },
      { label: "Cá nhân nhận tiền lương, tiền công", value: o.soCaNhan === null ? "—" : integer(o.soCaNhan), note: o.soCaNhan === null ? "Chỉ thuế cơ sở quản lý nhóm này" : "do thuế cơ sở quản lý" },
    ]}/>

    <div className="qd-luoi-2">
      <Panel title="Trạng thái doanh nghiệp" subtitle={`${integer(tongTT)} doanh nghiệp · bấm một dòng để mở danh sách`}>
        <ul className="qd-thanh-ds">
          {TRANG_THAI_DN.map((t) => <li key={t.id}>
            <button type="button" onClick={() => moDanhSach(t.id)}>
              <span className="qd-thanh-ten">{t.ten}</span>
              <span className="qd-thanh-ray"><i style={{ width: `${(o.trangThai[t.id] / maxTT) * 100}%` }}/></span>
              <span className="qd-thanh-so"><b>{integer(o.trangThai[t.id])}</b><small>{phanTram(o.trangThai[t.id], tongTT)}</small></span>
            </button>
          </li>)}
        </ul>
      </Panel>

      <Panel title="Số thu NSNN qua các năm" subtitle="Tỷ đồng · năm 2026 lũy kế 9 tháng">
        <Cot du={o.thuNam}/>
      </Panel>

      <Panel title="Theo số năm thành lập" subtitle="Số doanh nghiệp">
        <ThanhNgang nhan={NAM_THANH_LAP} so={o.namThanhLap}/>
      </Panel>

      <Panel title="Theo quy mô vốn điều lệ" subtitle="Số doanh nghiệp">
        <ThanhNgang nhan={QUY_MO_VON} so={o.quyMoVon}/>
      </Panel>

      <Panel title="Cơ cấu thu theo sắc thuế" subtitle="Tỷ trọng trên số thu 9 tháng 2026">
        <DonutSacThue phan={o.sacThue}/>
      </Panel>

      <Panel title="Tình hình kê khai" subtitle={`Doanh nghiệp đang hoạt động · kỳ kê khai tháng 9/2026 · ${integer(tongKK)} DN`}>
        <div className="qd-chong" aria-hidden="true">
          <i className="is-tot" style={{ width: phanTram(o.keKhai.dungHan, tongKK).replace(",", ".") }}/>
          <i className="is-vang" style={{ width: phanTram(o.keKhai.muon, tongKK).replace(",", ".") }}/>
          <i className="is-do" style={{ width: phanTram(o.keKhai.chua, tongKK).replace(",", ".") }}/>
        </div>
        <ul className="qd-chu-giai">
          <li><i className="is-tot"/><span>Nộp đúng hạn</span><b>{integer(o.keKhai.dungHan)}</b><small>{phanTram(o.keKhai.dungHan, tongKK)}</small></li>
          <li><i className="is-vang"/><span>Nộp muộn</span><b>{integer(o.keKhai.muon)}</b><small>{phanTram(o.keKhai.muon, tongKK)}</small></li>
          <li><i className="is-do"/><span>Chưa nộp</span><b>{integer(o.keKhai.chua)}</b><small>{phanTram(o.keKhai.chua, tongKK)}</small></li>
        </ul>
      </Panel>
    </div>

    <Panel title="Tình hình nợ thuế" subtitle="Nợ tổng thể của nhóm đối tượng · chi tiết ở Kết quả công tác, tab Nợ thuế">
      <div className="qd-o-so">
        <div><span>Doanh nghiệp đang nợ thuế</span><strong>{integer(o.no.soDN)}</strong><small>{phanTram(o.no.soDN, o.soDN)} số DN</small></div>
        <div><span>Tổng số nợ</span><strong>{tyDong(o.no.tongNo)}</strong><small>tỷ đồng</small></div>
        <div><span>Đã cưỡng chế nợ thuế</span><strong>{integer(o.no.cuongChe)}</strong><small>người nộp thuế</small></div>
        <div><span>Đã tạm hoãn xuất cảnh</span><strong>{integer(o.no.thxc)}</strong><small>người nộp thuế</small></div>
      </div>
    </Panel>
  </>;
}

/* Cột đứng cho số thu theo năm: một màu; năm 2026 (chưa trọn năm) nhạt hơn
   để không bị đọc như một năm giảm thu. */
function Cot({ du }: { du: { nam: string; so: number }[] }) {
  const max = Math.max(...du.map((d) => d.so));
  return <div className="qd-cot" role="img" aria-label={du.map((d) => `${d.nam}: ${tyDong(d.so)} tỷ đồng`).join("; ")}>
    {du.map((d, i) => <div key={d.nam} className="qd-cot-muc" title={`${d.nam}: ${tyDong(d.so)} tỷ đồng`}>
      <b>{integer(d.so)}</b>
      <span className="qd-cot-ray"><i className={i === du.length - 1 ? "is-do-dang" : undefined} style={{ height: `${(d.so / max) * 100}%` }}/></span>
      <small>{d.nam}</small>
    </div>)}
  </div>;
}

function ThanhNgang({ nhan, so }: { nhan: string[]; so: number[] }) {
  const max = Math.max(...so), tong = so.reduce((a, b) => a + b, 0);
  return <ul className="qd-thanh-ds is-tinh">{nhan.map((n, i) => <li key={n} title={`${n}: ${integer(so[i])} DN`}>
    <span className="qd-thanh-ten">{n}</span>
    <span className="qd-thanh-ray"><i style={{ width: `${(so[i] / max) * 100}%` }}/></span>
    <span className="qd-thanh-so"><b>{integer(so[i])}</b><small>{phanTram(so[i], tong)}</small></span>
  </li>)}</ul>;
}

function DonutSacThue({ phan }: { phan: number[] }) {
  const [tro, datTro] = useState<number | null>(null);
  const tong = phan.reduce((a, b) => a + b, 0);
  const R = 62, C = 2 * Math.PI * R, KHE = 2;
  let dau = 0;
  return <div className="qd-donut">
    <svg viewBox="0 0 160 160" role="img" aria-label={SAC_THUE.map((s, i) => `${s} ${phanTram(phan[i], tong)}`).join(", ")}>
      <g transform="rotate(-90 80 80)">{phan.map((p, i) => {
        const dai = (C * p) / tong;
        const cung = <circle key={i} cx="80" cy="80" r={R} fill="none" stroke={MAU_SAC_THUE[i]} strokeWidth={tro === i ? 22 : 18}
          strokeDasharray={`${Math.max(dai - KHE, 0.5)} ${C}`} strokeDashoffset={-dau}
          onPointerEnter={() => datTro(i)} onPointerLeave={() => datTro(null)}><title>{`${SAC_THUE[i]}: ${phanTram(p, tong)}`}</title></circle>;
        dau += dai;
        return cung;
      })}</g>
      <text x="80" y="78" textAnchor="middle" className="qd-donut-so">{tro === null ? phanTram(phan[0], tong) : phanTram(phan[tro], tong)}</text>
      <text x="80" y="96" textAnchor="middle" className="qd-donut-phu">{tro === null ? SAC_THUE[0] : SAC_THUE[tro]}</text>
    </svg>
    <ul className="qd-chu-giai">{SAC_THUE.map((s, i) => <li key={s} className={tro === i ? "is-tro" : undefined} onPointerEnter={() => datTro(i)} onPointerLeave={() => datTro(null)}>
      <i style={{ background: MAU_SAC_THUE[i] }}/><span>{s}</span><b>{phanTram(phan[i], tong)}</b>
    </li>)}</ul>
  </div>;
}

/* ---------- Tầng chi tiết: danh sách doanh nghiệp ---------- */

const CO_TRANG = 25;

function DanhSach({ pv, loc, datLoc, actor }: { pv: PhamVi; loc: TrangThaiDN | ""; datLoc: (x: TrangThaiDN | "") => void; actor: string }) {
  const [trang, datTrang] = useState(1);
  const { tong, dong } = useMemo(() => trangDN(pv, loc || null, trang, CO_TRANG), [pv, loc, trang]);
  const soTrang = Math.max(1, Math.ceil(tong / CO_TRANG));
  const nhieuDV = pv.donVi.length > 1;
  const nhanTT = (id: TrangThaiDN) => TRANG_THAI_DN.find((t) => t.id === id)!.ten;

  /* Xuất tối đa 2.000 dòng của bộ lọc đang chọn — bản demo không dựng cả
     danh bạ hàng chục nghìn dòng vào một tệp. */
  const xuat = async () => {
    const { dong: tat } = trangDN(pv, loc || null, 1, 2000);
    await exportExcel([{
      name: "Danh_sach_DN", title: `DANH SÁCH DOANH NGHIỆP${loc ? ` — ${nhanTT(loc).toUpperCase()}` : ""}`,
      headers: ["MST", "Tên người nộp thuế", "Đơn vị quản lý", "Cán bộ quản lý", "Trạng thái", "Năm thành lập", "Vốn điều lệ (tỷ đồng)", "Thu NSNN 2026 (tỷ đồng)", "Nợ thuế (tỷ đồng)"],
      rows: tat.map((d) => [d.mst, d.ten, d.donVi, d.canBo, nhanTT(d.trangThai), d.namThanhLap, d.von, d.thu2026, d.no]),
    }], { period: "Đến 30/09/2026", scope: nhanPhamVi(pv), actor, status: "DRAFT" }, "danh-sach-doanh-nghiep.xlsx");
  };

  return <Panel chinh title="Danh sách doanh nghiệp" subtitle={`${integer(tong)} doanh nghiệp${loc ? ` · ${nhanTT(loc).toLowerCase()}` : ""}`} actions={<div className="inline-controls">
    <label className="compact-field"><span className="bo-loc-nhan">Trạng thái</span>
      <select className="bo-loc-select" value={loc} onChange={(e) => { datLoc(e.target.value as TrangThaiDN | ""); datTrang(1); }}>
        <option value="">Tất cả trạng thái</option>
        {TRANG_THAI_DN.map((t) => <option key={t.id} value={t.id}>{t.ten}</option>)}
      </select>
    </label>
    <ExportButton onExport={xuat}>Xuất Excel</ExportButton>
  </div>}>
    <TableWrap label="danh sách doanh nghiệp">
      <table className="qd-bang">
        <thead><tr>
          <th scope="col">MST</th>
          <th scope="col">Tên người nộp thuế</th>
          {nhieuDV && <th scope="col">Đơn vị</th>}
          {!pv.canBo && <th scope="col">Cán bộ quản lý</th>}
          <th scope="col">Trạng thái</th>
          <th scope="col" className="num">Năm thành lập</th>
          <th scope="col" className="num">Vốn điều lệ</th>
          <th scope="col" className="num">Thu 2026</th>
          <th scope="col" className="num">Nợ thuế</th>
        </tr></thead>
        <tbody>{dong.map((d) => <tr key={d.mst}>
          <td><code>{d.mst}</code></td>
          <td>{d.ten}</td>
          {nhieuDV && <td>{d.donVi}</td>}
          {!pv.canBo && <td>{d.canBo}</td>}
          <td>{nhanTT(d.trangThai)}</td>
          <td className="num">{d.namThanhLap}</td>
          <td className="num">{tyDong(d.von)}</td>
          <td className="num">{d.thu2026 ? tyDong(d.thu2026) : <span className="cell-empty">—</span>}</td>
          <td className="num">{d.no ? tyDong(d.no) : <span className="cell-empty">—</span>}</td>
        </tr>)}</tbody>
      </table>
    </TableWrap>
    <div className="table-footer"><span>Tỷ đồng · số liệu mô phỏng</span><Pager trang={trang} soTrang={soTrang} onChange={datTrang}/></div>
  </Panel>;
}
