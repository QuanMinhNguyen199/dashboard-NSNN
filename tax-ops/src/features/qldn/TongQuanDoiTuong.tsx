import { Fragment, useMemo, useRef, useState } from "react";
import { FigureLine, Icon, PageIntro, Pager, Panel, SearchField, TableWrap, integer } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import type { DemoUser } from "@/auth/demoAuth";
import { exportExcel } from "@/domain/reportFiles";
import { useThamSo } from "@/state/diaChi";
import {
  CHI_TIEU_Q, KY_Q, NAM_THANH_LAP, NHOM_Q, QUY_MO_VON, SAC_THUE, THE_Q, TRANG_THAI_DN, dnTheoKhoa, duocXem, doiTuongPhamVi, ketQuaChiTieu, nhanPhamVi, nhomCuaThe, trangDN,
  type NhomId, type PhamVi, type TheId, type TrangThaiDN,
} from "@/data/qldn";
import { BO_TIEU_CHI } from "@/data/boTieuChi";
import { NgoaiPhamVi, ThanhPhamVi, usePhamVi } from "@/features/qldn/PhamViQLDN";
import { HangTab } from "@/components/MucPhanHe";
import { CaseLayout } from "@/components/CaseLayout";
import { MUC_RUI_RO, bienPhapPhamVi, cuongCheDN, ruiRoPhamVi } from "@/data/hoSoQLDN";
import { HoSoDN } from "@/features/qldn/HoSoDN";

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

/* "Bộ tiêu chí đánh giá" (chốt 13/10/2026): các chỉ tiêu của file Excel trong
   thư mục MOM, để người dùng tra chỉ tiêu nào đang được theo dõi ở đâu. */
type Tab = "tongquan" | "danhsach" | "tieuchi";
const TAB: { id: Tab; nhan: string }[] = [{ id: "tongquan", nhan: "Tổng quan" }, { id: "danhsach", nhan: "Danh sách doanh nghiệp" }, { id: "tieuchi", nhan: "Bộ tiêu chí đánh giá" }];
const TRANG_THAI_ID = TRANG_THAI_DN.map((t) => t.id);

/*
  Năm màu sắc thuế là bộ PHÂN LOẠI — đã chạy `validate_palette.js`: đạt tách
  màu cho người mù màu và người nhìn thường. Cam dưới tương phản 3:1 nên chú
  giải luôn mang số phần trăm, không để màu nói một mình.
*/
const MAU_SAC_THUE = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)"];

const phanTram = (x: number, tong: number) => tong ? `${((x / tong) * 100).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : "—";
const tyDong = (x: number) => x.toLocaleString("vi-VN", { maximumFractionDigits: 1 });

export function TongQuanDoiTuong({ user, moNhom }: { user: DemoUser; moNhom?: (nhom: NhomId, the: TheId, stt?: number) => void }) {
  const { pv } = usePhamVi(user);
  const [tab, datTab] = useThamSo<Tab>("muc", "tongquan", ["tongquan", "danhsach", "tieuchi"]);
  const [loc, datLoc] = useThamSo<TrangThaiDN | "">("loc", "", ["", ...TRANG_THAI_ID]);
  if (!pv) return <NgoaiPhamVi/>;

  const moDanhSach = (tt: TrangThaiDN | "") => { datLoc(tt); datTab("danhsach"); };

  return <div className="page-stack qd-page">
    <PageIntro title="Tổng quan đối tượng"/>
    {/* Thanh phạm vi là khối đầu tiên ở mọi màn (critique 27/10/2026). Bộ tiêu
        chí là định nghĩa chung của cơ quan: ô vẫn đứng đó, nói bằng chữ. */}
    {tab === "tieuchi"
      ? <ThanhPhamVi pv={pv} kyChu="Bộ tiêu chí tháng 10/2026" phamViChu="Chung cho mọi đơn vị"/>
      : <ThanhPhamVi pv={pv} kyChu="Đến 30/09/2026"/>}
    <nav className="thanh-muc" aria-label="Mục của tổng quan đối tượng">
      <HangTab lop="thanh-muc-hang" khoaMo={tab}>{TAB.map((t) => <button key={t.id} type="button" className={`muc-tab${tab === t.id ? " is-active" : ""}`} data-mo={tab === t.id ? "1" : undefined} aria-current={tab === t.id ? "page" : undefined} onClick={() => datTab(t.id)}><span>{t.nhan}</span></button>)}</HangTab>
    </nav>
    {tab === "tongquan" ? <TongQuan pv={pv} moDanhSach={moDanhSach} moNhom={moNhom}/>
      : tab === "danhsach" ? <DanhSach pv={pv} loc={loc} datLoc={datLoc} actor={user.name}/>
      : <BoTieuChi moNhom={moNhom} actor={user.name} pv={pv}/>}
  </div>;
}

function TongQuan({ pv, moDanhSach, moNhom }: { pv: PhamVi; moDanhSach: (tt: TrangThaiDN | "") => void; moNhom?: (nhom: NhomId, the: TheId) => void }) {
  const o = useMemo(() => doiTuongPhamVi(pv), [pv]);
  /* Thu NSNN lũy kế của tháng gần nhất, cùng nguồn với thẻ Thu NSNN ở Quản trị
     công việc — hai chỗ không được ra hai con số. */
  const thu = useMemo(() => ketQuaChiTieu(CHI_TIEU_Q[0], pv, KY_Q[0]).nay, [pv]);
  const tongTT = o.soDN;
  const maxTT = Math.max(...TRANG_THAI_DN.map((t) => o.trangThai[t.id]));
  const tongKK = o.keKhai.dungHan + o.keKhai.muon + o.keKhai.chua;
  const ngoaiHKD = o.soHKD === null;

  return <>
    {/* Bốn ô cố định ở mọi vai và mọi đơn vị: năm phòng QLDN và 25 thuế cơ sở
        đọc cùng một dải, chỉ khác số (chốt 14/10/2026). */}
    <FigureLine items={[
      { label: pv.canBo ? "Doanh nghiệp được phân công" : "Doanh nghiệp, tổ chức", value: integer(o.soDN), note: "Bấm để mở danh sách", onSelect: () => moDanhSach("") },
      { label: pv.canBo ? "Cán bộ quản lý" : "Cán bộ đang quản lý", value: pv.canBo ? "1" : integer(o.soCanBo), note: pv.canBo ? pv.canBo.ten : "theo phân công TMS 2.4.2" },
      /* Ô 3: phòng QLDN không quản lý hộ kinh doanh (đã có phòng HKD riêng),
         nên ô ấy mang số thu NSNN của phòng. "DN đang hoạt động" và "DN mới
         thành lập" từng đứng đây — gỡ 14/10/2026 vì khối Trạng thái doanh
         nghiệp ngay dưới đã nói đúng hai số ấy. */
      ngoaiHKD
        ? { label: "Thu NSNN 9 tháng", value: `${integer(thu.tu)} tỷ`, note: duocXem(pv.vai, "tyLe") ? `đạt ${phanTram(thu.tu, thu.mau)} ${CHI_TIEU_Q[0].nhanMau} · lũy kế đến 30/09` : "lũy kế đến 30/09/2026", onSelect: moNhom ? () => moNhom("thu", "thu") : undefined }
        : { label: "Hộ kinh doanh", value: integer(o.soHKD!), note: "do thuế cơ sở quản lý" },
      { label: "Cá nhân nhận tiền lương, tiền công", value: integer(o.soCaNhan ?? 0), note: ngoaiHKD ? "làm công tại các DN đang quản lý" : "theo danh bạ người nộp thuế" },
    ]}/>

    <div className="qd-luoi-2">
      <Panel title="Trạng thái doanh nghiệp" subtitle={`${integer(tongTT)} doanh nghiệp · bấm một dòng để mở danh sách`}>
        <ul className="qd-thanh-ds">
          {TRANG_THAI_DN.map((t) => <li key={t.id}>
            <button type="button" onClick={() => moDanhSach(t.id)}>
              <span className="qd-thanh-ten">{t.ten}</span>
              <span className="qd-thanh-ray"><i style={{ width: `${(o.trangThai[t.id] / maxTT) * 100}%` }}/></span>
              <span className="qd-thanh-so"><b>{integer(o.trangThai[t.id])}</b><small>{phanTram(o.trangThai[t.id], tongTT)}</small></span>
              <Icon name="arrow" size={14}/>
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
        <div><span>Tổng số nợ</span><strong>{tyDong(o.no.tongNo)}</strong><small>tỷ đồng · <span className={o.no.tongNo > o.no.tongNoDauNam ? "qd-chenh is-xau" : "qd-chenh is-tot"}><i className="qd-cham" aria-hidden="true"/>{o.no.tongNo > o.no.tongNoDauNam ? "tăng" : "giảm"} {phanTram(Math.abs(o.no.tongNo - o.no.tongNoDauNam), o.no.tongNoDauNam)}</span> so với đầu năm</small></div>
        <div><span>Đã cưỡng chế nợ thuế</span><strong>{integer(o.no.cuongChe)}</strong><small>người nộp thuế</small></div>
        <div><span>Đã tạm hoãn xuất cảnh</span><strong>{integer(o.no.thxc)}</strong><small>người nộp thuế</small></div>
      </div>
      <BienPhapCuongChe pv={pv}/>
    </Panel>

    <PhanTichRuiRo pv={pv}/>
  </>;
}

/*
  Biện pháp cưỡng chế (biên bản 22/10/2026): mỗi biện pháp một dòng, kèm số
  NNT đang chịu — KHÔNG gộp thành "đã cưỡng chế: Có/Không". Một NNT chịu
  nhiều biện pháp nên các dòng cộng lại lớn hơn số NNT; dòng đầu khối nói
  thẳng điều đó để không ai cộng tay rồi tưởng số sai.
*/
function BienPhapCuongChe({ pv }: { pv: PhamVi }) {
  const bp = useMemo(() => bienPhapPhamVi(pv), [pv]);
  const max = Math.max(...bp.ds.map((b) => b.soNNT), 1);
  return <section className="qd-bp" aria-labelledby="qd-bp-de">
    <div className="qd-bp-dau">
      <h3 id="qd-bp-de">Biện pháp cưỡng chế đang áp dụng</h3>
      <span>{integer(bp.nhieuBienPhap)} NNT chịu từ 2 biện pháp trở lên, nên các dòng cộng lại lớn hơn {integer(bp.soNNT)} NNT bị cưỡng chế</span>
    </div>
    <ul className="qd-thanh-ds is-tinh qd-bp-ds">
      {bp.ds.map((b) => <li key={b.id} title={`${b.ten}: ${integer(b.soNNT)} NNT, ${integer(b.dangHieuLuc)} còn hiệu lực`}>
        <span className="qd-thanh-ten">{b.ten}</span>
        <span className="qd-thanh-ray"><i style={{ width: `${(b.soNNT / max) * 100}%` }}/></span>
        <span className="qd-thanh-so"><b>{integer(b.soNNT)}</b><small>{integer(b.dangHieuLuc)} còn hiệu lực</small></span>
      </li>)}
    </ul>
  </section>;
}

/*
  Phân tích rủi ro (biên bản 22/10/2026: "Tổng quan đối tượng: thêm phân tích
  rủi ro"). Cách hiển thị là việc số 4 của biên bản, CHƯA có người phụ trách
  chốt — khối này là đề xuất: ba mức theo thang ba mức của đề án DN360, cộng
  các dấu hiệu rủi ro thường gặp. Ghi chú cuối khối nói rõ điều đó.

  Dải chồng ba mức dùng lại `.qd-chong` của khối Tình hình kê khai: cùng một
  câu hỏi "bao nhiêu phần của tổng", nên cùng một hình.
*/
function PhanTichRuiRo({ pv }: { pv: PhamVi }) {
  const rr = useMemo(() => ruiRoPhamVi(pv), [pv]);
  const lop = { CAO: "is-do", TB: "is-vang", THAP: "is-tot" } as const;
  const maxDH = Math.max(...rr.dauHieu.map((x) => x.so), 1);
  return <Panel title="Phân tích rủi ro" subtitle={`${integer(rr.tong)} doanh nghiệp đang hoạt động · phân loại theo ba mức rủi ro`}>
    <p className="qd-ghi-mot">Bản đề xuất, chờ chốt nội dung hiển thị (biên bản 22/10/2026, việc số 4). Một doanh nghiệp có thể mang nhiều dấu hiệu. Số liệu mô phỏng.</p>
    <div className="qd-rr">
      <div className="qd-rr-muc">
        <div className="qd-chong" aria-hidden="true">
          {/* Cùng thứ tự với dải Kê khai: tốt bên trái, xấu bên phải. */}
          {[...MUC_RUI_RO].reverse().map((m) => <i key={m.id} className={lop[m.id]} style={{ width: phanTram(rr.muc[m.id], rr.tong).replace(",", ".") }}/>)}
        </div>
        <ul className="qd-chu-giai">
          {[...MUC_RUI_RO].reverse().map((m) => <li key={m.id}><i className={lop[m.id]}/><span>{m.ten}</span><b>{integer(rr.muc[m.id])}</b><small>{phanTram(rr.muc[m.id], rr.tong)}</small></li>)}
        </ul>
      </div>
      <div className="qd-rr-dh">
        <h3>Dấu hiệu rủi ro thường gặp<small>số doanh nghiệp có dấu hiệu</small></h3>
        <ul className="qd-thanh-ds is-tinh">{rr.dauHieu.map((x) => <li key={x.ten} title={`${x.ten}: ${integer(x.so)} DN`}>
          <span className="qd-thanh-ten">{x.ten}</span>
          <span className="qd-thanh-ray"><i style={{ width: `${(x.so / maxDH) * 100}%` }}/></span>
          <span className="qd-thanh-so"><b>{integer(x.so)}</b><small>{phanTram(x.so, rr.tong)}</small></span>
        </li>)}</ul>
      </div>
    </div>
  </Panel>;
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
        const cung = <circle key={i} cx="80" cy="80" r={R} fill="none" style={{ stroke: MAU_SAC_THUE[i] }} strokeWidth={tro === i ? 22 : 18}
          strokeDasharray={`${Math.max(dai - KHE, 0.5)} ${C}`} strokeDashoffset={-dau}
          onPointerEnter={() => datTro(i)} onPointerLeave={() => datTro(null)}><title>{`${SAC_THUE[i]}: ${phanTram(p, tong)}`}</title></circle>;
        dau += dai;
        return cung;
      })}</g>
      <text x="80" y="78" textAnchor="middle" className="qd-donut-so">{tro === null ? phanTram(phan[0], tong) : phanTram(phan[tro], tong)}</text>
      <text x="80" y="96" textAnchor="middle" className="qd-donut-phu">{tro === null ? SAC_THUE[0] : SAC_THUE[tro]}</text>
    </svg>
    <ul className="qd-chu-giai">{SAC_THUE.map((s, i) => <li key={s} className={tro === i ? "is-tro" : undefined} tabIndex={0} onPointerEnter={() => datTro(i)} onPointerLeave={() => datTro(null)} onFocus={() => datTro(i)} onBlur={() => datTro(null)}>
      <i style={{ background: MAU_SAC_THUE[i] }}/><span>{s}</span><b>{phanTram(phan[i], tong)}</b>
    </li>)}</ul>
  </div>;
}

/* ---------- Tầng chi tiết: danh sách doanh nghiệp ---------- */

const CO_TRANG = 25;
/* Tìm và sắp xếp cần dựng CẢ danh sách của bộ lọc. Phòng QLDN có vài nghìn
   DN — dựng được; toàn thành phố hơn hai trăm nghìn — không dựng trên máy
   trạm. Quá ngưỡng thì màn nói thẳng cần thu hẹp phạm vi. */
const GIOI_HAN_TIM = 20000;

type CotXep = "nam" | "von" | "thu2026" | "no";
const COT_XEP: { id: CotXep; nhan: string }[] = [
  { id: "nam", nhan: "Năm thành lập" }, { id: "von", nhan: "Vốn điều lệ" }, { id: "thu2026", nhan: "Thu 2026" }, { id: "no", nhan: "Nợ thuế" },
];

function DanhSach({ pv, loc, datLoc, actor }: { pv: PhamVi; loc: TrangThaiDN | ""; datLoc: (x: TrangThaiDN | "") => void; actor: string }) {
  const [trang, datTrang] = useState(1);
  const [tim, datTim] = useState("");
  const [xep, datXep] = useState<{ cot: CotXep; giam: boolean } | null>(null);
  /* Doanh nghiệp đang mở hồ sơ nằm trong ĐỊA CHỈ (`so=`) — The URL Is The
     State Rule; khóa dựng lại được dòng dù trang chứa nó không còn mở. */
  const [dangMo, datDangMo] = useThamSo<string>("so", "");
  const noiBam = useRef<HTMLButtonElement | null>(null);
  const chon = useMemo(() => (dangMo ? dnTheoKhoa(pv, dangMo) : null), [pv, dangMo]);
  const dong = () => { datDangMo(""); requestAnimationFrame(() => noiBam.current?.focus()); };
  const tongLoc = useMemo(() => trangDN(pv, loc || null, 1, 0).tong, [pv, loc]);
  const q = tim.trim().toLowerCase();
  const canDung = Boolean(q || xep);
  const vuot = canDung && tongLoc > GIOI_HAN_TIM;

  const { tong, dong: dongTrang } = useMemo(() => {
    if (!canDung || vuot) return trangDN(pv, loc || null, trang, CO_TRANG);
    let tat = trangDN(pv, loc || null, 1, tongLoc).dong;
    if (q) tat = tat.filter((d) => d.mst.includes(q) || d.ten.toLowerCase().includes(q));
    if (xep) {
      const lay = (d: (typeof tat)[number]) => xep.cot === "nam" ? d.namThanhLap : d[xep.cot];
      tat = [...tat].sort((a, b) => (lay(a) - lay(b)) * (xep.giam ? -1 : 1));
    }
    return { tong: tat.length, dong: tat.slice((trang - 1) * CO_TRANG, trang * CO_TRANG) };
  }, [pv, loc, trang, q, xep, canDung, vuot, tongLoc]);
  const soTrang = Math.max(1, Math.ceil(tong / CO_TRANG));
  const nhieuDV = pv.donVi.length > 1;
  const nhanTT = (id: TrangThaiDN) => TRANG_THAI_DN.find((t) => t.id === id)!.ten;
  const doiXep = (cot: CotXep) => { datTrang(1); datXep((x) => !x || x.cot !== cot ? { cot, giam: true } : x.giam ? { cot, giam: false } : null); };
  const thXep = (cot: CotXep) => {
    const dang = xep?.cot === cot;
    return <th key={cot} scope="col" className="num" aria-sort={dang ? (xep!.giam ? "descending" : "ascending") : "none"}>
      <button type="button" className={`qd-th-xep${dang ? " is-dang" : ""}`} onClick={() => doiXep(cot)}>
        {COT_XEP.find((c) => c.id === cot)!.nhan}<Icon name="chevronDown" size={13}/>
      </button>
    </th>;
  };

  /* Xuất tối đa 2.000 dòng của bộ lọc đang chọn — bản demo không dựng cả
     danh bạ hàng chục nghìn dòng vào một tệp. */
  const xuat = async () => {
    const { dong: tat } = trangDN(pv, loc || null, 1, 2000);
    await exportExcel([{
      name: "Danh_sach_DN", title: `DANH SÁCH DOANH NGHIỆP${loc ? `: ${nhanTT(loc).toUpperCase()}` : ""}`,
      headers: ["MST", "Tên người nộp thuế", "Đơn vị quản lý", "Cán bộ quản lý", "Trạng thái", "Năm thành lập", "Vốn điều lệ (tỷ đồng)", "Thu NSNN 2026 (tỷ đồng)", "Nợ thuế (tỷ đồng)", "Biện pháp cưỡng chế"],
      rows: tat.map((d) => [d.mst, d.ten, d.donVi, d.canBo, nhanTT(d.trangThai), d.namThanhLap, d.von, d.thu2026, d.no, cuongCheDN(d).map((c) => `${c.bienPhap} (${c.conHieuLuc ? "đang hiệu lực" : "đã chấm dứt"})`).join("; ")]),
    }], { period: "Đến 30/09/2026", scope: nhanPhamVi(pv), actor, status: "DRAFT" }, "danh-sach-doanh-nghiep.xlsx");
  };

  const soCot = 6 + (loc ? 0 : 1) + (nhieuDV ? 1 : 0) + (pv.canBo ? 0 : 1);
  return <CaseLayout
    presentation="drawer"
    label={chon ? `Hồ sơ doanh nghiệp ${chon.mst}` : "Hồ sơ doanh nghiệp"}
    mobileOpen={Boolean(chon)}
    onClose={dong}
    detail={chon ? <HoSoDN d={chon}/> : null}
  >
  <Panel chinh title="Danh sách doanh nghiệp" subtitle={`${integer(tong)} doanh nghiệp${loc ? ` · ${nhanTT(loc).toLowerCase()}` : ""} · số tiền tính bằng tỷ đồng · bấm một dòng để mở hồ sơ`} actions={<ExportButton onExport={xuat}>Xuất Excel</ExportButton>}>
    <div className="qd-loc-cb">
      <label className="compact-field qd-loc-tt"><span className="bo-loc-nhan">Trạng thái</span>
        <select className="bo-loc-select" value={loc} onChange={(e) => { datLoc(e.target.value as TrangThaiDN | ""); datTrang(1); datDangMo(""); }}>
          <option value="">Tất cả trạng thái</option>
          {TRANG_THAI_DN.map((t) => <option key={t.id} value={t.id}>{t.ten}</option>)}
        </select>
      </label>
      <SearchField value={tim} onChange={(v) => { datTim(v); datTrang(1); }} placeholder="Tìm theo MST hoặc tên"/>
    </div>
    {vuot && <div className="notice info qd-ghi"><strong>Phạm vi quá rộng để tìm và sắp xếp</strong><span>{integer(tongLoc)} doanh nghiệp. Chọn một trạng thái hoặc thu hẹp ô Phạm vi xuống dưới {integer(GIOI_HAN_TIM)} doanh nghiệp; danh sách bên dưới vẫn theo thứ tự gốc.</span></div>}
    <TableWrap label="danh sách doanh nghiệp">
      <table className="qd-bang">
        <thead><tr>
          <th scope="col">MST</th>
          <th scope="col">Tên người nộp thuế</th>
          {nhieuDV && <th scope="col">Đơn vị</th>}
          {!pv.canBo && <th scope="col">Cán bộ quản lý</th>}
          {/* Đã lọc một trạng thái thì cột này lặp một giá trị ở mọi dòng — tiêu đề khối đã nói nó. */}
          {!loc && <th scope="col">Trạng thái</th>}
          {COT_XEP.map((c) => thXep(c.id))}
          <th scope="col">Cưỡng chế</th>
        </tr></thead>
        <tbody>{dongTrang.map((d) => {
          const cc = cuongCheDN(d);
          return <tr key={d.khoa} className={`qd-viec${d.khoa === dangMo ? " is-selected" : ""}`} onClick={(e) => {
            noiBam.current = e.currentTarget.querySelector<HTMLButtonElement>(".row-select");
            datDangMo(d.khoa === dangMo ? "" : d.khoa);
          }}>
          <td><code>{d.mst}</code></td>
          {/* Cả hàng bấm được; nút phủ ô tên để bàn phím mở được hồ sơ — The Whole Row Rule. */}
          <td><button type="button" className="row-select" aria-expanded={d.khoa === dangMo}>{d.ten}</button></td>
          {nhieuDV && <td>{d.donVi}</td>}
          {!pv.canBo && <td>{d.canBo}</td>}
          {!loc && <td>{nhanTT(d.trangThai)}</td>}
          <td className="num">{d.namThanhLap}</td>
          <td className="num">{tyDong(d.von)}</td>
          <td className="num">{d.thu2026 ? tyDong(d.thu2026) : <span className="cell-empty">0</span>}</td>
          <td className="num">{d.no ? tyDong(d.no) : <span className="cell-empty">0</span>}</td>
          {/* Tên từng biện pháp, không Có/Không (biên bản 22/10/2026). */}
          <td className="qd-cc-o">{cc.length ? cc.map((c) => <span key={c.soQD} className={c.conHieuLuc ? undefined : "is-tat"} title={`${c.bienPhap} · ${c.conHieuLuc ? "đang hiệu lực" : "đã chấm dứt"}`}>{c.ngan}{!c.conHieuLuc && " (đã chấm dứt)"}</span>) : <span className="cell-empty">—</span>}</td>
        </tr>;
        })}
        {dongTrang.length === 0 && <tr><td colSpan={soCot} className="table-empty">Không có doanh nghiệp khớp “{tim}”. Thử tìm theo đủ 10 số MST hoặc một phần tên.</td></tr>}
        </tbody>
      </table>
    </TableWrap>
    <div className="table-footer"><span>Số liệu mô phỏng</span><Pager trang={trang} soTrang={soTrang} onChange={(n) => { datTrang(n); datDangMo(""); }}/></div>
  </Panel>
  </CaseLayout>;
}

/* ---------- Bộ tiêu chí đánh giá ---------- */

/*
  Ba trạng thái theo dõi của một chỉ tiêu, nói bằng chữ (không chỉ bằng màu):
  • Đang theo dõi — có trong Quản trị công việc; bấm để mở đúng nhóm nhỏ.
  • Đã bỏ — chỉ tiêu đánh giá sự hài lòng, biên bản 09/10/2026 §4.
  • Chưa có trong khối QLDN — chỉ tiêu của hộ kinh doanh, khối kiểm tra, gói
    nhiều nguồn: đo đơn vị khác, không thuộc không gian này.
  Cách tính điểm dài nhiều dòng nên nằm trong dòng mở rộng, không thành cột.
*/
function BoTieuChi({ moNhom, actor, pv }: { moNhom?: (nhom: NhomId, the: TheId, stt?: number) => void; actor: string; pv: PhamVi }) {
  const [mo, datMo] = useState<number | null>(null);
  const [chiTheoDoi, datChiTheoDoi] = useState(false);
  const ds = BO_TIEU_CHI.filter((t) => !chiTheoDoi || (t.the && !t.bo));
  const linhVuc = [...new Set(ds.map((t) => t.linhVuc))];
  const soTheoDoi = BO_TIEU_CHI.filter((t) => t.the && !t.bo).length;
  const nhanNhom = (the: TheId) => `${NHOM_Q.find((n) => n.id === nhomCuaThe(the).id)!.ngan} › ${THE_Q.find((x) => x.id === the)!.ngan}`;

  const xuat = () => exportExcel([{
    name: "Bo_tieu_chi", title: "BỘ TIÊU CHÍ ĐÁNH GIÁ CÁC CHỈ TIÊU",
    headers: ["STT", "Lĩnh vực", "Chỉ tiêu", "Phòng đánh giá", "Công thức", "Kỳ báo cáo", "Tính điểm", "Đơn vị được đánh giá", "Ghi chú", "Theo dõi trên hệ thống"],
    rows: BO_TIEU_CHI.map((t) => [t.stt, t.linhVuc, t.ten, t.phong, t.congThuc, t.ky, t.tinhDiem, t.doiTuong, t.ghiChu, t.bo ? "Đã bỏ" : t.the ? nhanNhom(t.the) : "Chưa có trong khối QLDN"]),
  }], { period: "Tháng 10/2026", scope: nhanPhamVi(pv), actor, status: "DRAFT" }, "bo-tieu-chi-danh-gia.xlsx");

  return <Panel chinh title="Bộ tiêu chí đánh giá các chỉ tiêu" subtitle={`${BO_TIEU_CHI.length} chỉ tiêu theo file chấm điểm tháng 10 · ${soTheoDoi} đang theo dõi trên Quản trị công việc · bấm một dòng để xem cách tính điểm`} actions={<ExportButton onExport={xuat}>Xuất Excel</ExportButton>}>
    <div className="qd-loc-cb">
      <div className="bo-loc-seg" role="group" aria-label="Lọc chỉ tiêu">
        <button type="button" aria-pressed={!chiTheoDoi} onClick={() => datChiTheoDoi(false)}>Tất cả</button>
        <button type="button" aria-pressed={chiTheoDoi} onClick={() => datChiTheoDoi(true)}>Đang theo dõi</button>
      </div>
    </div>
    <TableWrap label="bộ tiêu chí đánh giá">
      <table className="qd-bang qd-bang-tc">
        <thead><tr>
          <th scope="col" className="num">STT</th>
          <th scope="col">Chỉ tiêu</th>
          <th scope="col">Kỳ báo cáo</th>
          <th scope="col">Phòng đánh giá</th>
          <th scope="col">Theo dõi trên hệ thống</th>
        </tr></thead>
        <tbody>{linhVuc.map((lv) => <Fragment key={lv}>
          <tr className="is-khoi"><th scope="rowgroup" colSpan={5}>{lv}</th></tr>
          {ds.filter((t) => t.linhVuc === lv).map((t, i) => {
            const khoa = t.stt ?? 1000 + i;
            return <Fragment key={khoa}>
              <tr className={`qd-viec${mo === khoa ? " is-selected" : ""}${t.bo ? " is-bo" : ""}`} onClick={() => datMo(mo === khoa ? null : khoa)}>
                <td className="num">{t.stt ?? ""}</td>
                <td className="qd-tc-ten"><button type="button" className="row-select" aria-expanded={mo === khoa}><strong>{t.ten}</strong>{t.congThuc && <small>{t.congThuc}</small>}</button></td>
                <td>{t.ky}</td>
                <td>{t.phong}</td>
                <td onClick={(e) => e.stopPropagation()}>{t.bo
                  ? <span className="qd-tc-trang is-bo">Đã bỏ · biên bản 09/10</span>
                  : t.the && moNhom
                    ? <button type="button" className="qd-lien-ket qd-tc-mo" onClick={() => moNhom(nhomCuaThe(t.the!).id, t.the!, t.stt ?? undefined)}>{nhanNhom(t.the)}<Icon name="arrow" size={13}/></button>
                    : <span className="qd-tc-trang">Chưa có trong khối QLDN</span>}</td>
              </tr>
              {mo === khoa && <tr className="qd-ho-so"><td colSpan={5}>
                <dl className="qd-tc-chi-tiet">
                  <div><dt>Cách tính điểm</dt><dd>{t.tinhDiem ?? "Chưa có"}</dd></div>
                  <div><dt>Đơn vị được đánh giá</dt><dd>{t.doiTuong ?? "Chưa có"}</dd></div>
                  {t.ghiChu && <div><dt>Ghi chú</dt><dd>{t.ghiChu}</dd></div>}
                </dl>
              </td></tr>}
            </Fragment>;
          })}
        </Fragment>)}</tbody>
      </table>
    </TableWrap>
  </Panel>;
}