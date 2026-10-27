import { Fragment, useEffect, useMemo, useState } from "react";
import { useThamSo } from "@/state/diaChi";
import { Badge, Button, Icon, PageIntro, Pager, Panel, SearchField, TableWrap, integer } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import type { DemoUser } from "@/auth/demoAuth";
import type { Tone } from "@/domain/types";
import { exportExcel } from "@/domain/reportFiles";
import {
  DAU_VIEC, NHAN_MUC, TRANG_THAI_VIEC, mucCua, nhanPhamVi, soNgay, viecPhamVi,
  type DauViecId, type MucCanhBao, type PhamVi, type TrangThaiViec, type ViecQ,
} from "@/data/qldn";
import { NHAN_GOC, chiTietViec } from "@/data/hoSoQLDN";
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
  /* Bộ lọc nằm trên ĐỊA CHỈ: "quá hạn của Phòng QLHT DN 4, đầu việc hoàn
     thuế" là một liên kết gửi được cho người khác, và ô "việc quá hạn" ở màn
     Kết quả công tác mở thẳng vào đúng chỗ này. */
  const [muc, datMuc] = useThamSo<MucCanhBao | "">("muc", "", ["", ...MUC]);
  const [dauViec, datDauViec] = useThamSo<DauViecId | "">("nhom", "", ["", ...DAU_VIEC.map((d) => d.id)]);
  const [donVi, datDonVi] = useThamSo<string>("donvi", "");
  const [tim, datTim] = useThamSo<string>("loc", "");
  const [ttViec, datTtViec] = useThamSo<TrangThaiViec | "">("tt", "", ["", ...TRANG_THAI_VIEC.map((t) => t.id)]);
  /* Dòng đang mở nằm trong địa chỉ — gửi liên kết là người nhận thấy đúng hồ sơ ấy. */
  const [mo, datMo] = useThamSo<string>("so", "");
  const [trang, datTrang] = useState(1);
  useEffect(() => { datTrang(1); datMo(""); }, [muc, dauViec, donVi, tim, ttViec, baoTruoc, pv]);
  useEffect(() => { if (donVi && !pv?.donVi.some((d) => d.id === donVi)) datDonVi(""); }, [pv, donVi]);
  const tatCa = useMemo(() => (pv ? canhBaoCua(pv, baoTruoc) : []), [pv, baoTruoc]);
  if (!pv) return <NgoaiPhamVi/>;

  const datBaoTruoc = (n: number) => { datBaoTruocNoi(n); ghiBaoTruoc(user.username, n); };
  const theoDV = donVi ? tatCa.filter((v) => v.dvId === donVi) : tatCa;
  const q = tim.trim().toLowerCase();
  const loc = theoDV.filter((v) => (!muc || v.muc === muc) && (!dauViec || v.dauViec === dauViec) && (!ttViec || v.trangThai === ttViec) && (!q || v.nnt.toLowerCase().includes(q) || v.mst.includes(q)));
  const so = dem(theoDV);
  const nhieuDV = pv.donVi.length > 1;
  const laCanBo = Boolean(pv.canBo);
  const cot = 5 + (nhieuDV ? 1 : 0) + (laCanBo ? 0 : 1);
  const coTrang = 12;
  const soTrang = Math.max(1, Math.ceil(loc.length / coTrang));
  const trangHien = Math.min(trang, soTrang);
  const trongTrang = DAU_VIEC.flatMap((d) => loc.filter((v) => v.dauViec === d.id)).slice((trangHien - 1) * coTrang, trangHien * coTrang);
  /* Lãnh đạo chưa chọn đơn vị VÀ chưa chọn đầu việc thì chỉ có hai bảng tổng
     hợp; chọn một trong hai là mở danh sách — §7 "theo từng đơn vị, rồi theo
     từng đầu việc", cả hai lối đều dẫn tới danh sách. */
  const tongHop = (pv.vai === "LD" || nhieuDV) && !donVi && !dauViec && nhieuDV;
  const boLoc = Boolean(muc || dauViec || tim || ttViec);
  const xoaLoc = () => { datMuc(""); datDauViec(""); datTim(""); datTtViec(""); };
  /* "Không phát sinh" là KHÔNG CÓ VIỆC trong phạm vi, không phải bị bộ lọc giấu. */
  const khongPhatSinh = DAU_VIEC.filter((d) => (!dauViec || d.id === dauViec) && !theoDV.some((v) => v.dauViec === d.id));

  const xuat = () => exportExcel([{
    name: "Canh_bao", title: "DANH SÁCH CẢNH BÁO NHẮC VIỆC",
    headers: ["Mức", "Đầu việc", "Trạng thái xử lý", "MST", "Người nộp thuế", "Nội dung", "Thời hạn", "Đơn vị", "Cán bộ", "Mã hồ sơ", "Nội dung hồ sơ", "Hồ sơ đi kèm"],
    rows: loc.map((v) => {
      const ct = chiTietViec(v);
      return [NHAN_MUC[v.muc], DAU_VIEC.find((d) => d.id === v.dauViec)!.ten, nhanTT(v.trangThai), v.mst, v.nnt, v.noiDung, ngayVN(v.han), v.donVi, v.canBo, ct.maHoSo, ct.noiDung, v.hoSo.join("; ") || "—"];
    }),
  }], { period: `Ngày ${ngayVN(new Date())} · báo trước ${baoTruoc} ngày`, scope: nhanPhamVi(pv), actor: user.name, status: "DRAFT" }, "canh-bao-nhac-viec.xlsx");

  return <div className="page-stack qd-page qd-alert-page">
    <PageIntro title="Cảnh báo nhắc việc"/>
    <ThanhPhamVi pv={pv} kyChu={`Hôm nay, ${ngayVN(new Date())}`}/>

    {/*
      Bốn thẻ LÀ bộ lọc mức (chốt 12/10/2026): bấm thẻ nào thì danh sách bên
      dưới chỉ còn việc của mức ấy, và thẻ đang chọn được đánh dấu. Bộ nút
      phân đoạn "Tất cả / quá hạn / hôm nay / sắp đến" trong khối danh sách đã
      gỡ — hai điều khiển cho cùng một lựa chọn thì người dùng phải dừng lại
      hỏi chúng có khác nhau không.
    */}
    <section className="qd-alert-summary" aria-label="Tình hình thời hạn">
    {/* Tiêu đề nhìn thấy không phải heading: trang đã có H1 cùng tên, và một
        H2 trùng chữ đọc ra hai lần cùng một tên cho trình đọc màn hình. */}
    <div className="qd-alert-summary-head"><strong className="qd-alert-title" aria-hidden="true">Cảnh báo nhắc việc</strong><label className="qd-bao-truoc"><span className="bo-loc-nhan">Báo trước</span>
      <select className="bo-loc-select" value={baoTruoc} onChange={(e) => datBaoTruoc(Number(e.target.value))}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} ngày</option>)}
      </select>
    </label></div>
    <div className="qd-the-loc" role="group" aria-label="Lọc theo mức cảnh báo">
      <TheLoc chon={muc === ""} onChon={() => datMuc("")} nhan="Tất cả" so={theoDV.length} ghi={laCanBo ? "Việc của tôi" : pv.vai === "LD" ? "Toàn bộ đơn vị đã chọn" : nhieuDV ? "Khối thuế cơ sở" : pv.phongGoc ? `Việc của ${pv.donVi[0].ngan}` : "Việc của phòng"}/>
      {MUC.map((m) => <TheLoc key={m} tone={TONE[m]} chon={muc === m} onChon={() => datMuc(m)} nhan={NHAN_MUC[m]} so={so[m]}
        ghi={m === "SAP_DEN" ? `trong ${baoTruoc} ngày tới` : m === "HOM_NAY" ? "xong trước khi hết ngày" : "phải xử lý ngay"}/>)}
    </div>
    </section>

    <div className={tongHop ? "qd-alert-overview" : "qd-alert-results"} data-motion="content" data-motion-key={`${muc}-${donVi}-${baoTruoc}-${dauViec}-${trangHien}`}>
    {(pv.vai === "LD" || nhieuDV) && <TheoDonVi ds={muc ? tatCa.filter((v) => v.muc === muc) : tatCa} donVi={pv.donVi} chon={donVi} datChon={datDonVi}/>}

    {/* Lãnh đạo xem theo đơn vị rồi theo đầu việc (§7): chưa chọn đơn vị thì
        chỉ có bảng tổng hợp theo đầu việc — danh sách việc của 30 đơn vị là
        hàng nghìn dòng mà không ai đọc hết. */}
    {tongHop ? <TheoDauViec ds={muc ? tatCa.filter((v) => v.muc === muc) : tatCa} chon={datDauViec}/> : <Panel chinh title={muc ? `Danh sách cảnh báo · ${NHAN_MUC[muc].toLowerCase()}` : "Danh sách cảnh báo"} subtitle={`${donVi ? `${tatCa.find((v) => v.dvId === donVi)?.donVi ?? "Đơn vị đã chọn"} · ` : ""}Chọn người nộp thuế để xem hồ sơ`} actions={<ExportButton onExport={xuat}>Xuất Excel</ExportButton>}>
      <div className="qd-loc-cb">
      <select className="bo-loc-select" aria-label="Đầu việc" value={dauViec} onChange={(e) => datDauViec(e.target.value as DauViecId | "")}>
        <option value="">Tất cả 10 đầu việc</option>
        {DAU_VIEC.map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}
      </select>
      <select className="bo-loc-select qd-loc-tt-viec" aria-label="Trạng thái xử lý" value={ttViec} onChange={(e) => datTtViec(e.target.value as TrangThaiViec | "")}>
        <option value="">Mọi trạng thái xử lý</option>
        {TRANG_THAI_VIEC.map((t) => <option key={t.id} value={t.id}>{t.ten}</option>)}
      </select>
      <SearchField value={tim} onChange={datTim} placeholder="Tìm NNT hoặc MST"/>
      {boLoc && <Button kind="quiet" onClick={xoaLoc}>Xóa bộ lọc</Button>}
      <span className="qd-alert-count" role="status">{integer(loc.length)} việc phù hợp</span>
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
            {/*
              Chỉ dựng nhóm CÓ việc khớp bộ lọc (chốt 12/10/2026). Đầu việc
              không phát sinh gom trong phần có thể mở ở cuối danh sách;
              vẫn giữ đủ tên đầu việc, không chen các hàng trống vào bảng.
            */}
            {DAU_VIEC.filter((d) => trongTrang.some((v) => v.dauViec === d.id)).map((d) => {
              const nhom = trongTrang.filter((v) => v.dauViec === d.id);
              return <Fragment key={d.id}>
                <tr className="is-khoi">
                  <th scope="rowgroup" colSpan={cot}>
                    <span className="qd-nhom-ten">{d.ten}</span>
                    <span className="qd-alert-group-count">{demNhom(loc.filter((v) => v.dauViec === d.id))}</span>
                  </th>
                </tr>
                {nhom.map((v) => <Fragment key={v.id}>
                    <tr className={mo === v.id ? "is-selected qd-viec" : "qd-viec"} onClick={() => datMo(mo === v.id ? "" : v.id)}>
                      <td className="qd-alert-level"><Badge tone={TONE[v.muc]}>{NHAN_MUC[v.muc]}</Badge></td>
                      <td className="qd-alert-taxpayer"><button type="button" className="row-select" aria-expanded={mo === v.id} aria-controls={mo === v.id ? `hoso-${v.id}` : undefined}><strong>{v.nnt}</strong><small>MST {v.mst}</small></button></td>
                      <td className="qd-alert-task">{v.noiDung}<small className={`qd-tt-viec is-${v.trangThai.toLowerCase()}`}><i aria-hidden="true"/>{nhanTT(v.trangThai)}</small></td>
                      <td className="qd-alert-deadline"><strong>{ngayVN(v.han)}</strong><small className={`tone-${TONE[v.muc]}`}>{conLai(v.han)}</small></td>
                      {nhieuDV && <td className="qd-alert-assignee" data-label="Đơn vị">{v.donVi}</td>}
                      {!laCanBo && <td className="qd-alert-assignee" data-label="Cán bộ">{v.canBo}</td>}
                      <td className="num qd-alert-files"><span><Icon name="file" size={15}/>{v.hoSo.length} <span className="qd-alert-file-label">hồ sơ</span><Icon name={mo === v.id ? "chevronDown" : "arrow"} size={14}/></span></td>
                    </tr>
                    {mo === v.id && <tr className="qd-ho-so" id={`hoso-${v.id}`}><td colSpan={cot} data-motion="detail">
                      <ChiTietHoSo v={v}/>
                    </td></tr>}
                  </Fragment>)}
              </Fragment>;
            })}
            {loc.length === 0 && <tr className="qd-trong"><td colSpan={cot}><div className="qd-alert-empty"><Icon name="search" size={24}/><strong>{boLoc ? "Không có việc khớp bộ lọc" : "Không có cảnh báo trong phạm vi này"}</strong><span>{boLoc ? "Thử đổi đầu việc hoặc tìm theo mã số thuế." : `Đang theo dõi các việc quá hạn, hôm nay và ${baoTruoc} ngày tới.`}</span>{boLoc && <Button kind="quiet" onClick={xoaLoc}>Xóa bộ lọc</Button>}</div></td></tr>}
          </tbody>
        </table>
      </TableWrap>
      <div className="table-footer"><span>{soTrang > 1 ? `Dòng ${(trangHien - 1) * coTrang + 1}–${Math.min(trangHien * coTrang, loc.length)}` : "Nhóm theo đầu việc"}</span>{soTrang > 1 && <Pager trang={trangHien} soTrang={soTrang} onChange={(n) => { datTrang(n); datMo(""); }}/>}</div>
      {khongPhatSinh.length > 0 && <details className="qd-alert-inactive"><summary><Icon name="check" size={16}/><span>{khongPhatSinh.length} đầu việc không phát sinh trong ngày</span><Icon name="chevronDown" size={16}/></summary><ul>{khongPhatSinh.map((d) => <li key={d.id}>{d.ten}</li>)}</ul></details>}
    </Panel>}
    </div>
  </div>;
}

const nhanTT = (t: TrangThaiViec) => TRANG_THAI_VIEC.find((x) => x.id === t)!.ten;

/* Đầu nhóm nói số việc và số việc CHƯA ai đụng tới — thứ trưởng phòng hỏi
   đầu tiên khi nhìn một đầu việc. */
function demNhom(ds: CanhBao[]) {
  const chua = ds.filter((v) => v.trangThai === "CHUA").length;
  return `${ds.length} việc${chua ? ` · ${chua} chưa xử lý` : ""}`;
}

/*
  Chi tiết hồ sơ của một cảnh báo (biên bản 22/10/2026: "khi ấn vào hồ sơ thì
  cần ra chi tiết hồ sơ thủ tục đã nộp, nội dung là gì"). Mở NGAY DƯỚI dòng,
  trong luồng bảng — như bản trước, chỉ đầy đủ hơn.

  Ba phần theo thứ tự cán bộ đọc: hồ sơ này là gì (thủ tục, nội dung, gốc,
  kênh) → đang ở bước nào → văn bản đã có. Việc phát sinh trên hệ thống
  (cưỡng chế đến hạn, tờ khai tồn…) không có hồ sơ NNT nộp, và khối nói đúng
  như vậy thay vì gọi nó là "thủ tục đã nộp".
*/
function ChiTietHoSo({ v }: { v: CanhBao }) {
  const ct = chiTietViec(v);
  const laNNT = ct.goc === "NNT";
  return <div className="qd-hs">
    <section className="qd-hs-dau" aria-label="Hồ sơ">
      <p className="qd-hs-noi-dung"><span>{laNNT ? "Nội dung đề nghị" : "Nội dung phát sinh"}</span><strong>{ct.noiDung}</strong></p>
      <dl className="qd-hs-the">
        <div><dt>{laNNT ? "Thủ tục đã nộp" : "Nguồn phát sinh"}</dt><dd>{ct.thuTuc}</dd></div>
        <div><dt>Mã hồ sơ</dt><dd><code>{ct.maHoSo}</code></dd></div>
        <div><dt>{laNNT ? "Ngày nộp" : "Ngày phát sinh"}</dt><dd>{ngayVN(ct.ngayNhan)}</dd></div>
        <div><dt>{laNNT ? "Kênh nộp" : "Hệ thống"}</dt><dd>{ct.kenh}<small>{NHAN_GOC[ct.goc]}</small></dd></div>
      </dl>
    </section>
    <section className="qd-hs-buoc" aria-label="Tiến trình xử lý">
      <h4>Tiến trình xử lý</h4>
      <ol>{ct.buoc.map((b) => <li key={b.ten} className={`is-${b.trang.toLowerCase()}`} aria-current={b.trang === "DANG" ? "step" : undefined}>
        <i aria-hidden="true">{b.trang === "XONG" && <Icon name="check" size={12}/>}</i>
        <span>{b.ten}</span>
        <small>{b.trang === "XONG" ? ngayVN(b.ngay!) : b.trang === "DANG" ? "Đang ở bước này" : "Chưa tới"}</small>
      </li>)}</ol>
    </section>
    <section className="qd-hs-vb" aria-label="Hồ sơ, văn bản đi kèm">
      <h4>Hồ sơ, văn bản đi kèm</h4>
      {ct.vanBan.length
        ? <ul>{ct.vanBan.map((b) => <li key={b.so}><Icon name="file" size={15}/><span>{b.ten}</span><small>Số {b.so} · {ngayVN(b.ngay)}</small></li>)}</ul>
        : <p className="qd-hs-trong">Chưa có văn bản nào gắn với việc này.</p>}
    </section>
    <p className="qd-ho-so-ghi">Điều kiện phát sinh và chấm dứt của cảnh báo do bộ phận nghiệp vụ phân tích. Hệ thống chỉ nhắc việc, chưa thao tác trên TMS. Số liệu mô phỏng.</p>
  </div>;
}

/* Một thẻ lọc — cả thẻ là nút (The Whole Row Rule), `aria-pressed` nói thẻ
   nào đang lọc. Màu của mức đi kèm nhãn chữ, không đứng một mình. */
function TheLoc({ nhan, so, ghi, tone, chon, onChon }: { nhan: string; so: number; ghi: string; tone?: Tone; chon: boolean; onChon: () => void }) {
  return <button type="button" className={`qd-the-loc-o${tone ? ` tone-${tone}` : ""}${chon ? " is-chon" : ""}`} aria-pressed={chon} onClick={onChon}>
    <span className="qd-the-loc-nhan">{tone && <i aria-hidden="true"/>}{nhan}<span className="qd-alert-selected" aria-hidden="true"><Icon name="check" size={15}/></span></span>
    <strong>{integer(so)}</strong>
    <small>{ghi}</small>
  </button>;
}

function TheoDauViec({ ds, chon }: { ds: CanhBao[]; chon: (id: DauViecId) => void }) {
  return <Panel chinh title="Theo đầu việc" subtitle="Bấm một đầu việc để xem việc của mọi đơn vị đã chọn, hoặc chọn một đơn vị ở bảng trên">
    <TableWrap label="cảnh báo theo đầu việc">
      <table className="qd-bang">
        <thead><tr><th scope="col">Đầu việc</th>{MUC.map((m) => <th key={m} scope="col" className="num">{NHAN_MUC[m]}</th>)}<th scope="col" className="num">Tổng</th><th scope="col" className="num">Trong đó chưa xử lý</th></tr></thead>
        <tbody>{DAU_VIEC.map((d) => {
          const cua = ds.filter((v) => v.dauViec === d.id);
          const s = dem(cua);
          const tong = s.QUA_HAN + s.HOM_NAY + s.SAP_DEN;
          const chua = cua.filter((v) => v.trangThai === "CHUA").length;
          return <tr key={d.id} className={tong ? "qd-viec" : undefined} onClick={tong ? () => chon(d.id) : undefined}>
            <td>{tong ? <button type="button" className="row-select">{d.ten}</button> : d.ten}</td>
            {MUC.map((m) => <td key={m} className="num">{s[m] ? <span className={`qd-so-muc tone-${TONE[m]}`}>{s[m]}</span> : <span className="cell-empty">0</span>}</td>)}
            <td className="num">{tong ? <strong>{tong}</strong> : <span className="qd-trong-chu">Không phát sinh trong ngày</span>}</td>
            <td className="num">{chua ? chua : <span className="cell-empty">0</span>}</td>
          </tr>;
        })}</tbody>
      </table>
    </TableWrap>
  </Panel>;
}

/* Lãnh đạo Thuế TP xem theo từng đơn vị rồi theo từng đầu việc (§7). */
function TheoDonVi({ ds, donVi, chon, datChon }: { ds: CanhBao[]; donVi: PhamVi["donVi"]; chon: string; datChon: (id: string) => void }) {
  const nhom = donVi.map(({ id, ngan }) => ({ id, ten: ngan, s: dem(ds.filter((v) => v.dvId === id)) }))
    .sort((a, b) => b.s.QUA_HAN - a.s.QUA_HAN || b.s.HOM_NAY - a.s.HOM_NAY);
  /* Mười đơn vị nhiều việc quá hạn nhất là thứ lãnh đạo cần nhìn trước; đủ
     30 dòng thì chỉ mở khi họ hỏi. Đơn vị đang chọn luôn có mặt. */
  const [du, datDu] = useState(false);
  const [doi, datDoi] = useState(false);
  const GIOI_HAN = 10;
  const hien = du ? nhom : nhom.filter((n, i) => i < GIOI_HAN || n.id === chon);
  if (chon && !doi) return <div className="qd-alert-unit"><Icon name="users"/><div><span>Đơn vị đang xem</span><strong>{donVi.find((d) => d.id === chon)?.ngan}</strong></div><Button kind="quiet" onClick={() => datDoi(true)}>Đổi đơn vị</Button><Button kind="quiet" onClick={() => datChon("")}>Bỏ lọc đơn vị</Button></div>;
  return <Panel title="Theo đơn vị" subtitle={`Xếp theo số việc quá hạn${du || nhom.length <= GIOI_HAN ? "" : ` · ${GIOI_HAN} đơn vị đầu`} · bấm một đơn vị để lọc danh sách bên dưới`} actions={<div className="inline-controls">
    {chon && <Button kind="quiet" onClick={() => datChon("")}>Bỏ lọc đơn vị</Button>}
    {/* Hai nhãn xếp chồng cùng một ô: nút rộng bằng nhãn dài nhất và không
        co giãn khi đổi nhãn. Tập nhãn ĐÓNG — số đơn vị nằm ở dòng phụ. */}
    {nhom.length > GIOI_HAN && <Button kind="quiet" aria-expanded={du} onClick={() => datDu(!du)}>
      <span className="qd-nhan-on"><span aria-hidden={du}>Xem đủ danh sách</span><span aria-hidden={!du}>Thu gọn</span></span>
    </Button>}
  </div>}>
    <TableWrap label="cảnh báo theo đơn vị">
      <table className="qd-bang">
        <thead><tr><th scope="col">Đơn vị</th>{MUC.map((m) => <th key={m} scope="col" className="num">{NHAN_MUC[m]}</th>)}<th scope="col" className="num">Tổng</th></tr></thead>
        <tbody>{hien.map((n) => <tr key={n.id} className={n.id === chon ? "is-selected qd-viec" : "qd-viec"} onClick={() => { datChon(n.id === chon ? "" : n.id); datDoi(false); }}>
          <td><button type="button" className="row-select" aria-pressed={n.id === chon}>{n.ten}</button></td>
          {MUC.map((m) => <td key={m} className="num">{n.s[m] ? <span className={`qd-so-muc tone-${TONE[m]}`}>{n.s[m]}</span> : <span className="cell-empty">0</span>}</td>)}
          <td className="num"><strong>{n.s.QUA_HAN + n.s.HOM_NAY + n.s.SAP_DEN}</strong></td>
        </tr>)}</tbody>
      </table>
    </TableWrap>
  </Panel>;
}
