import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, FigureLine, PageIntro, Panel, SearchField, TableWrap, integer } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import type { DemoUser } from "@/auth/demoAuth";
import type { Tone, ViewId } from "@/domain/types";
import { exportExcel } from "@/domain/reportFiles";
import {
  DAU_VIEC, NHAN_MUC, mucCua, nhanPhamVi, soNgay, vaiQ, viecPhamVi,
  type DauViecId, type MucCanhBao, type PhamVi, type ViecQ,
} from "@/data/qldn";
import { NgoaiPhamVi, ThanhPhamVi, usePhamVi } from "@/features/qldn/PhamViQLDN";

/*
  Mô-đun 3 — Cảnh báo nhắc việc (biên bản 09/10/2026 §7).

  Ba mức, màu theo yêu cầu: đỏ quá hạn, vàng hết hạn hôm nay, xanh sắp đến
  hạn. "Sắp đến hạn" là N ngày báo trước do MỖI NGƯỜI tự đặt — nên N là cài
  đặt của người dùng, lưu trên máy của họ, không phải tham số của màn.

  Mười đầu việc luôn có mặt; đầu việc không có việc ghi "Không phát sinh
  trong ngày". Mỗi cảnh báo ghi tên NNT, nội dung, thời hạn, và hồ sơ đi kèm
  (§7 "Bổ sung: quản lý hồ sơ, văn bản cần thiết đi kèm từng cảnh báo").

  Hệ thống CHỈ hiển thị và nhắc (§2.5): không có nút xử lý việc trên TMS.
*/

const TONE: Record<MucCanhBao, Tone> = { QUA_HAN: "critical", HOM_NAY: "warning", SAP_DEN: "positive" };
const MUC: MucCanhBao[] = ["QUA_HAN", "HOM_NAY", "SAP_DEN"];

const khoaBaoTruoc = (u: string) => `qldn-bao-truoc:${u}`;
function docBaoTruoc(u: string) {
  try { const n = Number(localStorage.getItem(khoaBaoTruoc(u))); return n >= 1 && n <= 10 ? n : 3; } catch { return 3; }
}
function ghiBaoTruoc(u: string, n: number) {
  try { localStorage.setItem(khoaBaoTruoc(u), String(n)); } catch { /* chế độ riêng tư: chỉ giữ trong phiên */ }
}

const ngayVN = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const conLai = (d: Date) => { const n = soNgay(d); return n < 0 ? `quá ${-n} ngày` : n === 0 ? "hôm nay" : `còn ${n} ngày`; };

interface CanhBao extends ViecQ { muc: MucCanhBao }
function canhBaoCua(pv: PhamVi, baoTruoc: number): CanhBao[] {
  return viecPhamVi(pv)
    .map((v) => ({ ...v, muc: mucCua(v, baoTruoc) }))
    .filter((v): v is CanhBao => v.muc !== null)
    .sort((a, b) => a.han.getTime() - b.han.getTime());
}
const dem = (ds: CanhBao[]) => Object.fromEntries(MUC.map((m) => [m, ds.filter((v) => v.muc === m).length])) as Record<MucCanhBao, number>;

export function CanhBaoNhacViec({ user }: { user: DemoUser }) {
  const { pv } = usePhamVi(user);
  const [baoTruoc, datBaoTruocNoi] = useState(() => docBaoTruoc(user.username));
  const [muc, datMuc] = useState<MucCanhBao | "">("");
  const [dauViec, datDauViec] = useState<DauViecId | "">("");
  const [donVi, datDonVi] = useState("");
  const [tim, datTim] = useState("");
  const [mo, datMo] = useState("");
  const tatCa = useMemo(() => (pv ? canhBaoCua(pv, baoTruoc) : []), [pv, baoTruoc]);
  if (!pv) return <NgoaiPhamVi/>;

  const datBaoTruoc = (n: number) => { datBaoTruocNoi(n); ghiBaoTruoc(user.username, n); };
  const theoDV = donVi ? tatCa.filter((v) => v.dvId === donVi) : tatCa;
  const q = tim.trim().toLowerCase();
  const loc = theoDV.filter((v) => (!muc || v.muc === muc) && (!dauViec || v.dauViec === dauViec) && (!q || v.nnt.toLowerCase().includes(q) || v.mst.includes(q)));
  const so = dem(theoDV);
  const nhieuDV = pv.donVi.length > 1;
  const laCanBo = Boolean(pv.canBo);

  const xuat = () => exportExcel([{
    name: "Canh_bao", title: "DANH SÁCH CẢNH BÁO NHẮC VIỆC",
    headers: ["Mức", "Đầu việc", "MST", "Người nộp thuế", "Nội dung", "Thời hạn", "Đơn vị", "Cán bộ", "Hồ sơ đi kèm"],
    rows: loc.map((v) => [NHAN_MUC[v.muc], DAU_VIEC.find((d) => d.id === v.dauViec)!.ten, v.mst, v.nnt, v.noiDung, ngayVN(v.han), v.donVi, v.canBo, v.hoSo.join("; ") || "—"]),
  }], { period: `Ngày ${ngayVN(new Date())} · báo trước ${baoTruoc} ngày`, scope: nhanPhamVi(pv), actor: user.name, status: "DRAFT" }, "canh-bao-nhac-viec.xlsx");

  return <div className="page-stack qd-page">
    <PageIntro title="Cảnh báo nhắc việc"/>
    <ThanhPhamVi pv={pv} coKy={false} them={<div className="bo-loc-muc">
      <span className="bo-loc-nhan" id="qd-bao-truoc">Báo trước</span>
      <select className="bo-loc-select" aria-labelledby="qd-bao-truoc" value={baoTruoc} onChange={(e) => datBaoTruoc(Number(e.target.value))}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} ngày</option>)}
      </select>
    </div>}/>

    <FigureLine items={[
      { label: "Tổng cảnh báo", value: integer(theoDV.length), note: muc ? "Bấm để bỏ lọc mức" : `${laCanBo ? "Việc của tôi" : pv.vai === "LD" ? "Toàn bộ đơn vị đã chọn" : "Việc của phòng"}`, onSelect: () => datMuc("") },
      ...MUC.map((m) => ({ label: NHAN_MUC[m], value: integer(so[m]), tone: TONE[m], note: m === "SAP_DEN" ? `trong ${baoTruoc} ngày tới` : m === "HOM_NAY" ? "xong trước khi hết ngày" : "phải xử lý ngay", onSelect: () => datMuc(muc === m ? "" : m) })),
    ]}/>

    {pv.vai === "LD" && <TheoDonVi ds={tatCa} chon={donVi} datChon={datDonVi}/>}

    {/* Lãnh đạo xem theo đơn vị rồi theo đầu việc (§7): chưa chọn đơn vị thì
        chỉ có bảng tổng hợp theo đầu việc — danh sách việc của 30 đơn vị là
        hàng nghìn dòng mà không ai đọc hết. */}
    {pv.vai === "LD" && !donVi && pv.donVi.length > 1 ? <TheoDauViec ds={tatCa}/> : <Panel chinh title="Danh sách cảnh báo" subtitle={`${integer(loc.length)} việc${donVi ? ` · ${tatCa.find((v) => v.dvId === donVi)?.donVi}` : ""}${muc ? ` · ${NHAN_MUC[muc].toLowerCase()}` : ""} · bấm một việc để xem hồ sơ đi kèm`} actions={<ExportButton onExport={xuat}>Xuất Excel</ExportButton>}>
      <div className="qd-loc-cb">
      <div className="bo-loc-seg" role="group" aria-label="Mức cảnh báo">
        <button type="button" aria-pressed={muc === ""} onClick={() => datMuc("")}>Tất cả</button>
        {MUC.map((m) => <button key={m} type="button" aria-pressed={muc === m} onClick={() => datMuc(m)}>{NHAN_MUC[m]}</button>)}
      </div>
      <select className="bo-loc-select" aria-label="Đầu việc" value={dauViec} onChange={(e) => datDauViec(e.target.value as DauViecId | "")}>
        <option value="">Tất cả 10 đầu việc</option>
        {DAU_VIEC.map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}
      </select>
      <SearchField value={tim} onChange={datTim} placeholder="Tìm NNT hoặc MST"/>
      </div>
      <TableWrap label="danh sách cảnh báo">
        <table className="qd-bang qd-bang-cb">
          <thead><tr>
            <th scope="col">Mức</th>
            <th scope="col">Người nộp thuế</th>
            <th scope="col">Nội dung việc</th>
            <th scope="col">Thời hạn</th>
            {nhieuDV && <th scope="col">Đơn vị</th>}
            {!laCanBo && <th scope="col">Cán bộ</th>}
            <th scope="col" className="num">Hồ sơ</th>
          </tr></thead>
          <tbody>
            {DAU_VIEC.filter((d) => !dauViec || d.id === dauViec).map((d) => {
              const nhom = loc.filter((v) => v.dauViec === d.id);
              const s = dem(theoDV.filter((v) => v.dauViec === d.id));
              const cot = 5 + (nhieuDV ? 1 : 0) + (laCanBo ? 0 : 1);
              return <Fragment key={d.id}>
                <tr className="is-khoi">
                  <th scope="rowgroup" colSpan={cot}>
                    <span className="qd-nhom-ten">{d.ten}</span>
                    <span className="qd-nhom-dem">{MUC.filter((m) => s[m]).map((m) => <Badge key={m} tone={TONE[m]}>{s[m]} {NHAN_MUC[m].toLowerCase()}</Badge>)}</span>
                  </th>
                </tr>
                {nhom.length === 0
                  ? <tr className="qd-trong"><td colSpan={cot}>{s.QUA_HAN + s.HOM_NAY + s.SAP_DEN ? "Không có việc khớp bộ lọc" : "Không phát sinh trong ngày"}</td></tr>
                  : nhom.map((v) => <Fragment key={v.id}>
                    <tr className={mo === v.id ? "is-selected qd-viec" : "qd-viec"} onClick={() => datMo(mo === v.id ? "" : v.id)}>
                      <td><Badge tone={TONE[v.muc]}>{NHAN_MUC[v.muc]}</Badge></td>
                      <td><button type="button" className="row-select" aria-expanded={mo === v.id}><strong>{v.nnt}</strong><small>{v.mst}</small></button></td>
                      <td>{v.noiDung}</td>
                      <td><strong>{ngayVN(v.han)}</strong><small>{conLai(v.han)}</small></td>
                      {nhieuDV && <td>{v.donVi}</td>}
                      {!laCanBo && <td>{v.canBo}</td>}
                      <td className="num">{v.hoSo.length || <span className="cell-empty">0</span>}</td>
                    </tr>
                    {mo === v.id && <tr className="qd-ho-so"><td colSpan={cot}>
                      <strong>Hồ sơ, văn bản đi kèm</strong>
                      {v.hoSo.length
                        ? <ul>{v.hoSo.map((h) => <li key={h}>{h} — {v.nnt}</li>)}</ul>
                        : <p>Chưa có hồ sơ đi kèm cảnh báo này.</p>}
                      <p className="qd-ho-so-ghi">Điều kiện phát sinh và chấm dứt của cảnh báo do bộ phận nghiệp vụ phân tích. Hệ thống chỉ nhắc việc, chưa thao tác trên TMS.</p>
                    </td></tr>}
                  </Fragment>)}
              </Fragment>;
            })}
          </tbody>
        </table>
      </TableWrap>
    </Panel>}
  </div>;
}

function TheoDauViec({ ds }: { ds: CanhBao[] }) {
  return <Panel chinh title="Theo đầu việc" subtitle="Toàn bộ đơn vị đã chọn · chọn một đơn vị ở bảng trên để mở danh sách việc">
    <TableWrap label="cảnh báo theo đầu việc">
      <table className="qd-bang">
        <thead><tr><th scope="col">Đầu việc</th>{MUC.map((m) => <th key={m} scope="col" className="num">{NHAN_MUC[m]}</th>)}<th scope="col" className="num">Tổng</th></tr></thead>
        <tbody>{DAU_VIEC.map((d) => {
          const s = dem(ds.filter((v) => v.dauViec === d.id));
          const tong = s.QUA_HAN + s.HOM_NAY + s.SAP_DEN;
          return <tr key={d.id}>
            <td>{d.ten}</td>
            {MUC.map((m) => <td key={m} className="num">{s[m] ? <span className={`qd-so-muc tone-${TONE[m]}`}>{s[m]}</span> : <span className="cell-empty">0</span>}</td>)}
            <td className="num">{tong ? <strong>{tong}</strong> : <span className="qd-trong-chu">Không phát sinh trong ngày</span>}</td>
          </tr>;
        })}</tbody>
      </table>
    </TableWrap>
  </Panel>;
}

/* Lãnh đạo Thuế TP xem theo từng đơn vị rồi theo từng đầu việc (§7). */
function TheoDonVi({ ds, chon, datChon }: { ds: CanhBao[]; chon: string; datChon: (id: string) => void }) {
  const nhom = [...new Map(ds.map((v) => [v.dvId, v.donVi])).entries()]
    .map(([id, ten]) => ({ id, ten, s: dem(ds.filter((v) => v.dvId === id)) }))
    .sort((a, b) => b.s.QUA_HAN - a.s.QUA_HAN || b.s.HOM_NAY - a.s.HOM_NAY);
  return <Panel title="Theo đơn vị" subtitle="Xếp theo số việc quá hạn · bấm một đơn vị để lọc danh sách bên dưới" actions={chon ? <Button kind="quiet" onClick={() => datChon("")}>Bỏ lọc đơn vị</Button> : undefined}>
    <TableWrap label="cảnh báo theo đơn vị">
      <table className="qd-bang">
        <thead><tr><th scope="col">Đơn vị</th>{MUC.map((m) => <th key={m} scope="col" className="num">{NHAN_MUC[m]}</th>)}<th scope="col" className="num">Tổng</th></tr></thead>
        <tbody>{nhom.map((n) => <tr key={n.id} className={n.id === chon ? "is-selected qd-viec" : "qd-viec"} onClick={() => datChon(n.id === chon ? "" : n.id)}>
          <td><button type="button" className="row-select" aria-pressed={n.id === chon}>{n.ten}</button></td>
          {MUC.map((m) => <td key={m} className="num">{n.s[m] ? <span className={`qd-so-muc tone-${TONE[m]}`}>{n.s[m]}</span> : <span className="cell-empty">0</span>}</td>)}
          <td className="num"><strong>{n.s.QUA_HAN + n.s.HOM_NAY + n.s.SAP_DEN}</strong></td>
        </tr>)}</tbody>
      </table>
    </TableWrap>
  </Panel>;
}

/*
  Pop-up "danh sách việc có thời hạn" của §3 mục 3: tự mở MỘT LẦN mỗi phiên
  đăng nhập, ngay khi vào hệ. Mở mỗi lần đổi màn là làm phiền; không tự mở
  thì nó không còn là nhắc việc.
*/
export function PopupCanhBao({ user, dangXem, onMo }: { user: DemoUser; dangXem: ViewId; onMo: () => void }) {
  const { pv } = usePhamVi(user);
  const hop = useRef<HTMLDialogElement>(null);
  const khoa = `qldn-canh-bao-da-xem:${user.username}`;
  const [daXem, datDaXem] = useState(() => { try { return sessionStorage.getItem(khoa) === "1"; } catch { return false; } });
  const ds = useMemo(() => (pv ? canhBaoCua(pv, docBaoTruoc(user.username)) : []), [pv, user.username]);
  /* Chỉ tự mở trong không gian khối QLDN. Bật một hộp modal đè lên phân hệ
     của phòng — nơi người dùng đang làm một việc khác — là chặn tay họ giữa
     chừng; phó phòng và lãnh đạo vào thẳng màn kết quả nên vẫn thấy ngay. */
  const hien = Boolean(vaiQ(user.vaiTro)) && !daXem && (dangXem === "doituong" || dangXem === "dieuhanh") && ds.length > 0;

  useEffect(() => {
    const d = hop.current;
    if (hien && d && !d.open) d.showModal();
  }, [hien]);

  const dong = () => {
    try { sessionStorage.setItem(khoa, "1"); } catch { /* bỏ qua */ }
    datDaXem(true);
    hop.current?.close();
  };
  if (!hien) return null;
  const s = dem(ds);
  const theoViec = DAU_VIEC.map((d) => ({ d, n: ds.filter((v) => v.dauViec === d.id).length })).filter((x) => x.n > 0);

  return <dialog ref={hop} className="qd-popup" aria-labelledby="qd-popup-tieu-de" onCancel={dong}>
    <header><h2 id="qd-popup-tieu-de">Việc cần xử lý hôm nay</h2><button type="button" className="drawer-close" aria-label="Đóng" onClick={dong}>×</button></header>
    <p className="qd-popup-pham-vi">{pv ? nhanPhamVi(pv) : ""} · {ngayVN(new Date())}</p>
    <div className="qd-popup-muc">{MUC.map((m) => <div key={m} className={`tone-${TONE[m]}`}><strong>{s[m]}</strong><span>{NHAN_MUC[m]}</span></div>)}</div>
    <ul className="qd-popup-ds">{theoViec.map(({ d, n }) => <li key={d.id}><span>{d.ten}</span><b>{n}</b></li>)}</ul>
    <footer>
      <Button kind="quiet" onClick={dong}>Để sau</Button>
      <Button kind="primary" onClick={() => { dong(); onMo(); }}>Mở cảnh báo nhắc việc</Button>
    </footer>
  </dialog>;
}
