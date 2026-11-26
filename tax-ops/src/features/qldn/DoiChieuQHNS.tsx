import { useMemo, useState } from "react";
import { Button, Icon, NhomNut, SelectMenu, TableWrap, type IconName } from "@/components/ui";
import { GhiChu } from "@/components/GhiChu";
import { ExportButton } from "@/components/ExportButton";
import type { DongDN } from "@/data/qldn";
import {
  CUA_SO, NGUONG_LECH, NHAN_CACH, dauCap, doiChieuQHNS, giaTri, laHaNoi, nhanBoSung, ngayDoiChieu,
  type Cap, type DongSoi, type KetQuaDoiChieu,
} from "@/data/doiChieuQHNS";
import { moTaGD } from "@/data/danhMucTMS";
import { xuatThongBaoDoiChieu } from "@/domain/thongBaoDoiChieuWord";
import { xuatExcelDoiChieu } from "@/domain/doiChieuExcel";

/*
  Đối chiếu nghĩa vụ từ khi thành lập — Biểu QHNS. Đứng ngay dưới bảng Quan
  hệ ngân sách của năm: bảng trên trả lời "năm nay còn nợ, thừa bao nhiêu",
  khối này trả lời "con số ấy có đúng không, khoản lệch từ đâu ra".

  Bổ sung 16/11/2026 theo biên bản 11/11 và demo 13/11 (folder 16-11):
  • Ký hiệu giao dịch TMS (TK, C2, P4, DP, HC…) trên từng dòng, chú giải theo
    danh mục map_KHGD — góp ý "thêm giải thích cho ký hiệu".
  • Cột cơ quan thuế (mã cạnh tên) và cảnh báo chứng từ phân bổ: thừa ở tỉnh
    này, nợ ở Hà Nội.
  • Hai nhãn cảnh báo theo sheet TS của công cụ VBA: thiếu chứng từ nộp /
    thiếu phát sinh.
  • Đối chiếu hai bước: bước 1 danh sách dòng còn lệch; bước 2 xoay theo
    tiểu mục × cơ quan thuế để soi phân bổ và nộp nhầm.
  • Gợi ý chỗ tìm thành các bước theo thứ tự (eDoc → tờ khai treo → mời DN)
    và một dòng "đọc nhanh" khi biên bản đã nói rõ cách đọc.
  • Chỉ báo lũy kế: Tổng quan TMS so với cộng từ chi tiết (sheet HETHONG).

  Bổ sung 20/11/2026 theo biên bản 18/11 (folder 20-11):
  • Bắt cặp theo công cụ VBA: cắt lũy kế, vòng 1 lệch dưới 100.000 đồng rồi
    cặp cùng số tiền, "treo", từ vòng 2 chỉ C2 và TK — xem `data/doiChieuQHNS`.
  • Năm bước tìm nguyên nhân thay ba bước cũ; bước tự tìm được ghi ngay
    trên dòng.
  • Xuất Excel kết quả: dòng còn lệch tô đỏ, kèm gợi ý và nguyên nhân.
*/

type XuLy = "CHUA" | "GIAI_THICH" | "HOI_NNT";
type Buoc = "DS" | "XOAY";
const dong = (x: number) => x.toLocaleString("vi-VN");
const LOAI: Record<DongSoi["loai"], { nhan: string; day: string; icon: IconName }> = {
  /* Nhãn: sheet TS của công cụ RSNT_GTGT_CUC. Giải nghĩa: biên bản 13/11/2026 §2.2 (Cảnh báo). */
  NO: { nhan: "Thiếu khoản đã nộp", day: "Có tờ khai nhưng không có chứng từ tương ứng", icon: "arrowUp" },
  THUA: { nhan: "Thiếu phát sinh phải nộp", day: "Có chứng từ nhưng không có tờ khai", icon: "arrowDown" },
  CHUYEN_DOI: { nhan: "Chuyển đổi", day: "Số dư chuyển đổi trước TMS chưa tách được", icon: "layers" },
};
const tenCQT = (x: { cqt: string; tenCQT: string }) => (x.cqt ? `${x.cqt} · ${x.tenCQT}` : x.tenCQT);

/** Ký hiệu giao dịch: chữ in đậm nhỏ, mô tả TMS trong `title` và cho trình đọc màn hình. */
function Ma({ ma }: { ma: string }) {
  return <abbr className="qd-dc-ma" title={moTaGD(ma)}>{ma}<span className="sr-only"> ({moTaGD(ma)})</span></abbr>;
}

/*
  Lọc theo năm hạn nộp (26/11/2026, người dùng: "sổ phải scroll dài"). Một năm
  một lần xem, mặc định năm mới nhất; "Tất cả các năm" giữ cách xem liền như
  trước. Ô chọn thay hàng nút: DN lập từ 2015 có hơn chục năm, hàng nút vỡ
  dòng trong ngăn 760px. Chưa lọc theo ký hiệu / số tiền — biên bản chưa nói
  cán bộ tra sổ theo các tiêu chí ấy.
*/
const TAT_CA = "tat-ca";
const tenNam = (n: number) => (n === 2014 ? "Trước 2015 · số dư chuyển đổi" : String(n));

/*
  Sắp xếp theo cột (26/11/2026, người dùng: "increment / decrement ở tiêu đề
  bảng"). Cùng kiểu `.qd-th-xep` với danh sách DN ở Tổng quan đối tượng. Bấm
  một cột: giảm dần; bấm lại: đảo chiều (không có lần 3 — người dùng 26/11).
  Về thứ tự bắt cặp và năm mới nhất bằng nút đặt lại cạnh ô lọc. Xếp TRONG từng năm — xem "Tất cả các năm" thì nhóm năm vẫn giữ.
  Cột Nghĩa vụ là chữ mô tả, không xếp.
*/
type CotSo = "han" | "nop" | "tien";
const COT_SO: { id: CotSo; nhan: string; so?: boolean }[] = [{ id: "han", nhan: "Hạn nộp" }, { id: "nop", nhan: "Ngày nộp" }, { id: "tien", nhan: "Số tiền", so: true }];
const tienCap = (c: Cap) => (c.pn.length ? c.pn.reduce((a, x) => a + x.soTien, 0) : c.dn.reduce((a, x) => a + Math.abs(x.soTien), 0) / 2);
const ngayNopCap = (c: Cap) => (c.dn.length ? Math.min(...c.dn.map((x) => x.ngay.getTime())) : null);
const giaCot = (c: Cap, cot: CotSo) => (cot === "han" ? dauCap(c).getTime() : cot === "nop" ? ngayNopCap(c) : tienCap(c));

function SoDaGhep({ cap }: { cap: Cap[] }) {
  const tatCaNam = useMemo(() => {
    const m = new Map<number, Cap[]>();
    for (const c of cap) { const n = dauCap(c).getFullYear(); m.set(n, [...(m.get(n) ?? []), c]); }
    return [...m.entries()].sort((a, b) => b[0] - a[0]);
  }, [cap]);
  const [nam, datNam] = useState<string>(() => (tatCaNam[0] ? String(tatCaNam[0][0]) : TAT_CA));
  const [xep, datXep] = useState<{ cot: CotSo; giam: boolean } | null>(null);
  const motNam = nam !== TAT_CA;
  const loc = motNam ? tatCaNam.filter(([n]) => String(n) === nam) : tatCaNam;
  /* Dòng chưa có ngày nộp luôn nằm cuối, dù xếp chiều nào. */
  const theoNam = !xep ? loc : loc.map(([n, ds]) => [n, ds.toSorted((a, b) => {
    const x = giaCot(a, xep.cot), y = giaCot(b, xep.cot);
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
    return (x - y) * (xep.giam ? -1 : 1);
  })] as const);
  const doiXep = (cot: CotSo) => datXep((x) => (!x || x.cot !== cot ? { cot, giam: true } : { cot, giam: !x.giam }));
  const namMoi = tatCaNam[0] ? String(tatCaNam[0][0]) : TAT_CA;
  const macDinh = nam === namMoi && !xep;
  const datLai = () => { datNam(namMoi); datXep(null); };
  const thXep = (c: (typeof COT_SO)[number]) => {
    const dang = xep?.cot === c.id;
    return <th scope="col" className={c.so ? "num" : undefined} aria-sort={dang ? (xep!.giam ? "descending" : "ascending") : "none"}>
      <button type="button" className={`qd-th-xep${dang ? " is-dang" : ""}`} onClick={() => doiXep(c.id)}>{c.nhan}<Icon name="chevronDown" size={13}/></button>
    </th>;
  };
  return <>
  <div className="qd-dc-so-loc">
    <SelectMenu className="compact-field" kieu="o" hienNhan label="Năm hạn nộp" value={nam} onChange={datNam}
      options={[...tatCaNam.map(([n]) => ({ value: String(n), label: tenNam(n) })), { value: TAT_CA, label: "Tất cả các năm" }]}/>
    {/* Ô cố định: luôn đứng cạnh ô lọc, mờ khi đang ở mặc định (năm mới nhất, thứ tự bắt cặp). */}
    <Button kind="secondary" icon="reset" className="qd-dc-dat-lai" disabled={macDinh} aria-label="Đặt lại: năm mới nhất, thứ tự bắt cặp" title="Đặt lại: năm mới nhất, thứ tự bắt cặp" onClick={datLai}/>
  </div>
  <TableWrap label="sổ phải nộp và đã nộp đã bắt cặp">
    <table className="qd-bang qd-dn-bang qd-dc-so-bang">
      <thead><tr>
        {thXep(COT_SO[0])}
        <th scope="col">Nghĩa vụ</th>
        {thXep(COT_SO[1])}
        {thXep(COT_SO[2])}
      </tr></thead>
      {theoNam.map(([namBang, ds]) => <tbody key={namBang}>
        {/* Đang lọc một năm: ô chọn đã nói năm và số nhóm — không lặp dòng tiêu đề năm. */}
        {!motNam && <tr className="qd-dc-nam"><th scope="rowgroup" colSpan={4}>{tenNam(namBang)}<small>{ds.length} nhóm</small></th></tr>}
        {ds.map((c, i) => {
          const dau = c.pn[0] ?? c.dn[0];
          const tien = tienCap(c);
          const nop = ngayNopCap(c);
          return <tr key={`${dau.id}-${i}`} title={`Vòng ${c.vong}: ${NHAN_CACH[c.cach]}`}>
            <td>{ngayDoiChieu(dau.ngay)}{dau.hanGoc && <small className="qd-dc-gh">hạn nộp {ngayDoiChieu(dau.hanGoc)}</small>}</td>
            <th scope="row">{dau.moTa}{c.pn.length > 1 && ` + ${c.pn.length - 1} khoản`}
              <small className="qd-dc-ma-day">{[...c.pn, ...c.dn].map((x, j) => <Ma key={j} ma={x.ma}/>)}</small>
            </th>
            <td>{nop !== null ? ngayDoiChieu(new Date(nop)) : "—"}</td>
            <td className="num">{dong(tien)}{c.lech !== 0 && <small className="qd-dc-lech">lệch {dong(c.lech)}</small>}</td>
          </tr>;
        })}
      </tbody>)}
    </table>
  </TableWrap>
  </>;
}

/*
  Bước 2 — xoay: tiểu mục ở hàng, cơ quan thuế ở cột, ô là số còn lệch sau
  bước 1 (dương: thiếu chứng từ nộp; âm: thiếu phát sinh). Một hàng có cả
  dương lẫn âm ở hai CQT là dấu hiệu chứng từ phân bổ; hai hàng một âm một
  dương cùng số là dấu hiệu nộp nhầm tiểu mục.
*/
function BangXoay({ ds }: { ds: DongSoi[] }) {
  const cot = [...new Map(ds.map((x) => [tenCQT(x), x])).values()].sort((a, b) => Number(laHaNoi(b)) - Number(laHaNoi(a)));
  const hang = [...new Map(ds.map((x) => [x.tieuMuc, x.tenTieuMuc])).entries()];
  const o = (tm: string, c?: DongSoi) => ds.filter((x) => x.tieuMuc === tm && (!c || tenCQT(x) === tenCQT(c))).reduce((a, x) => a + giaTri(x), 0);
  const so = (v: number) => !v ? <span className="cell-empty">0</span>
    : <span className={v > 0 ? "qd-dc-xoay-no" : "qd-dc-xoay-thua"}>{v > 0 ? "+" : "−"}{dong(Math.abs(v))}</span>;
  return <TableWrap label="dòng còn lệch theo tiểu mục và cơ quan thuế">
    <table className="qd-bang qd-dn-bang qd-dc-xoay">
      <thead><tr>
        <th scope="col">Tiểu mục</th>
        {cot.map((c) => <th key={tenCQT(c)} scope="col" className="num">{c.cqt ? <>{c.cqt}<small>{c.tenCQT}</small></> : c.tenCQT}</th>)}
        <th scope="col" className="num">Cộng</th>
      </tr></thead>
      <tbody>{hang.map(([tm, ten]) => <tr key={tm}>
        <th scope="row">{tm}<small>{ten}</small></th>
        {cot.map((c) => <td key={tenCQT(c)} className="num">{so(o(tm, c))}</td>)}
        <td className="num"><strong>{so(o(tm))}</strong></td>
      </tr>)}</tbody>
    </table>
  </TableWrap>;
}

export function DoiChieuQHNS({ d, kq: coSan }: { d: DongDN; kq?: KetQuaDoiChieu }) {
  const kq = useMemo(() => coSan ?? doiChieuQHNS(d), [d, coSan]);
  const [xuLy, datXuLy] = useState<Record<string, XuLy>>({});
  const [moSo, datMoSo] = useState(false);
  const [buoc, datBuoc] = useState<Buoc>("DS");
  const [dangXuat, datDangXuat] = useState(false);
  const cuaDong = (id: string) => xuLy[id] ?? "CHUA";
  const lat = (id: string, v: XuLy) => datXuLy((s) => ({ ...s, [id]: (s[id] ?? "CHUA") === v ? "CHUA" : v }));
  const hoiNNT = kq.canSoi.filter((x) => cuaDong(x.id) === "HOI_NNT");
  const conLai = kq.canSoi.filter((x) => cuaDong(x.id) === "CHUA").length;
  const thua = kq.conPhaiNop < 0;
  const soDongGhep = kq.capDaGhep.reduce((a, c) => a + c.pn.length + c.dn.length, 0);
  const lechLK = kq.luyKe.filter((x) => x.tms !== x.file);
  /* Bước tìm nguyên nhân giống nhau cho mọi dòng thừa/thiếu → một ⓘ ở tiêu đề. Tiểu mục, CQT giống nhau ở mọi dòng → nói một lần. */
  const buocChung = kq.canSoi.find((x) => x.loai !== "CHUYEN_DOI")?.buoc;
  const chungTM = new Set(kq.canSoi.map((x) => x.tieuMuc)).size === 1 ? kq.canSoi[0]?.tieuMuc : null;
  const chungCQT = new Set(kq.canSoi.map((x) => tenCQT(x))).size === 1 && kq.canSoi[0] ? (kq.canSoi[0].cqt ? `CQT ${kq.canSoi[0].cqt}` : kq.canSoi[0].tenCQT) : null;

  const xuat = async () => {
    datDangXuat(true);
    try { await xuatThongBaoDoiChieu(d, hoiNNT, d.canBo); } finally { datDangXuat(false); }
  };

  return <section className="qd-dn-khoi qd-dc" id="qd-dc-khoi" aria-labelledby="qd-dc">
    <h3 id="qd-dc"><span>Đối chiếu nghĩa vụ<GhiChu tieuDe="Cách đọc">
      {/* Biên bản 11/11/2026 §3 điểm 5; biên bản 18/11/2026 §2.2. */}
      <p>Bung toàn bộ giao dịch theo tiểu mục, âm/dương giữ nguyên, cộng trừ; sắp theo hạn nộp, có ngày gia hạn thì lấy ngày gia hạn.</p>
      <p>Tại điểm lũy kế bằng 0 thì đoạn trước đã khớp, cắt bỏ để giảm số dòng.</p>
      <p>Vòng 1: ghép các dòng liền kề, nếu tổng lệch dưới {dong(NGUONG_LECH)} đồng thì coi là bù trừ được. Nếu không bù được: tìm cặp dòng âm – dương cùng số tiền; vẫn không ghép được thì đặt trạng thái "treo".</p>
      <p>Từ vòng 2: ghép riêng cặp C2 (chứng từ nộp) và TK (tờ khai), tối đa {CUA_SO} dòng liền kề, tổng bằng 0 thì coi là bù được. Các dòng còn lại được tô đỏ.</p>
      {/* Một ⓘ cho cả khối (23/11/2026): hai ⓘ liền nhau ở tiêu đề là chú thích chồng chú thích. */}
      <strong className="qd-dc-ghi-tieu">Ký hiệu giao dịch</strong>
      <dl className="qd-dc-ky-hieu">{kq.kyHieu.map((m) => <div key={m}><dt>{m}</dt><dd>{moTaGD(m)}</dd></div>)}</dl>
    </GhiChu></span><small>đồng</small></h3>

    <dl className="qd-dc-ba">
      <div><dt>Phải nộp</dt><dd>{dong(kq.phaiNop)}</dd></div>
      <div><dt>Đã nộp</dt><dd>{dong(kq.daNop)}</dd></div>
      <div className={kq.conPhaiNop > 0 && kq.canSoi.length ? "is-xau" : undefined}><dt>{thua ? "Nộp thừa" : "Còn phải nộp"}</dt><dd>{dong(Math.abs(kq.conPhaiNop))}</dd></div>
    </dl>

    <p className="qd-dc-trang-thai">
      <span className={`qd-dc-ghep${kq.canSoi.length ? " is-con" : ""}`} title={`Bắt cặp tự động ${dong(soDongGhep)}/${dong(kq.soDong)} dòng sau ${kq.soVong} vòng${kq.dongLuyKe ? `; lũy kế cắt ${dong(kq.dongLuyKe)} dòng` : ""}${kq.capTheoNguong ? `; ${kq.capTheoNguong} nhóm lệch dưới ${dong(NGUONG_LECH)} đ` : ""}${kq.soTreo ? `; ${dong(kq.soTreo)} dòng treo sau vòng 1` : ""}${kq.soGiaHan ? `; ${kq.soGiaHan} kỳ gia hạn` : ""}; ${kq.nhomNhieu} nhóm ghép từ 3 khoản trở lên`}>
        <Icon name={kq.canSoi.length ? "alert" : "check"} size={14}/>Bắt cặp {dong(soDongGhep)}/{dong(kq.soDong)} dòng · {kq.soVong} vòng
      </span>
      {/* Cột của sheet HETHONG (công cụ RSNT_GTGT_CUC): Lũy kế TQ, Lũy kế File, KHỚP. */}
      {lechLK.length > 0 && <span className="qd-dc-ghep is-con"
        title={kq.luyKe.map((x) => `${x.tieuMuc} · Lũy kế TQ ${dong(x.tms)} · Lũy kế File ${dong(x.file)}`).join("; ")}>
        <Icon name="alert" size={14}/>Lũy kế TQ – File: lệch {lechLK.map((x) => x.tieuMuc).join(", ")}
      </span>}
    </p>

    {kq.phanBo.map((p) => <p key={p.tinh} className="qd-dc-phan-bo" role="note">
      <Icon name="alert" size={15}/>
      {/* Biên bản 13/11/2026 §2.2: "thừa ở tỉnh này nhưng nợ ở Hà Nội … chứng từ phân bổ chưa hạch toán hoặc chuyển sai". */}
      <span>Thừa {dong(p.thua)} tại {p.tinh}{p.no > 0 && <>, nợ {dong(p.no)} tại {p.cqtNo ? `${p.cqtNo} · ${p.tenNo}` : p.tenNo}</>}: chứng từ phân bổ chưa hạch toán hoặc chuyển sai.</span>
    </p>)}

    {kq.canSoi.length > 0 && <>
      <div className="qd-dc-soi-dau">
        <h4>Dòng cần soi
          {buocChung && <GhiChu tieuDe="Các bước tìm nguyên nhân"><ol className="qd-dc-buoc-tra">{buocChung.map((b) => <li key={b}>{b}</li>)}</ol></GhiChu>}</h4>
        <NhomNut<Buoc> className="qd-dc-buoc" label="Cách xem dòng cần soi" value={buoc} onChange={datBuoc}
          options={[
            /* Nguyên văn biên bản 13/11/2026 §2.2 (Đối chiếu nhiều bước). */
            { value: "DS", label: "Bước 1", title: "Lọc các tờ khai và số nộp khớp nhau, tách các tờ khai lệch chưa có chứng từ" },
            { value: "XOAY", label: "Bước 2", title: "Xoay lại cột và hàng để xem chứng từ phân bổ, nộp nhầm và các nguyên nhân khác" },
          ]}/>
        {/* Phần chung của mọi dòng nói một lần; số "chưa xử lý" chỉ khi đã xử lý một phần. */}
        <span className="qd-dc-soi-con">{[chungTM && `TM ${chungTM}`, chungCQT, conLai === kq.canSoi.length ? "" : conLai ? `${conLai} chưa xử lý` : "đã xử lý hết"].filter(Boolean).join(" · ")}</span>
      </div>
      <div className="qd-dc-buoc-noi" key={buoc}>
        {buoc === "XOAY" ? <BangXoay ds={kq.canSoi}/> : <ol className="qd-dc-soi">{kq.canSoi.map((x) => {
          const v = cuaDong(x.id);
          const l = LOAI[x.loai];
          return <li key={x.id} className={`is-${v.toLowerCase()}`}>
            <span className="qd-dn-ngay">{ngayDoiChieu(x.ngay)}{x.hanGoc && <small className="qd-dc-gh">gia hạn</small>}</span>
            <span className="qd-dc-noi">
              <strong><span className={`qd-dc-loai is-${x.loai.toLowerCase()}`} title={l.day} aria-hidden="true"><Icon name={l.icon} size={13}/></span>{l.nhan}<span className="sr-only">: {l.day}</span>
                {x.loai === "CHUYEN_DOI" && <GhiChu tieuDe="Các bước tìm nguyên nhân"><ol className="qd-dc-buoc-tra">{x.buoc.map((b) => <li key={b}>{b}</li>)}</ol></GhiChu>}</strong>
              <small><Ma ma={x.ma}/> {x.moTa}{!chungTM && ` · TM ${x.tieuMuc}`}{!chungCQT && ` · CQT ${tenCQT(x)}`}</small>
              {x.boSung && <small>{nhanBoSung(x.boSung)}</small>}
              {x.docNhanh && <small className={`qd-dc-doc is-${x.docNhanh.muc}`}><Icon name={x.docNhanh.muc === "cao" ? "alert" : "check"} size={12}/>{x.docNhanh.buoc ? `Bước ${x.docNhanh.buoc}: ` : ""}{x.docNhanh.nhan}</small>}
            </span>
            <span className="qd-dc-cot-phai">
              <span className={`qd-dc-tien ${x.chieu === "PN" ? "is-pn" : "is-dn"}`}>{dong(x.soTien)}</span>
              <span className="qd-dc-xu-ly" role="group" aria-label={`Xử lý khoản ${dong(x.soTien)} đồng`}>
                <button type="button" className="qd-dc-nut is-giai-thich" aria-pressed={v === "GIAI_THICH"} title="Đã giải thích" aria-label="Đã giải thích" onClick={() => lat(x.id, "GIAI_THICH")}><Icon name="check" size={15}/></button>
                <button type="button" className="qd-dc-nut is-hoi" aria-pressed={v === "HOI_NNT"} title="Hỏi NNT — đưa vào thông báo" aria-label="Hỏi NNT" onClick={() => lat(x.id, "HOI_NNT")}><Icon name="mail" size={15}/></button>
              </span>
            </span>
          </li>;
        })}</ol>}
      </div>

      <div className="qd-dc-thao-tac">
        <div className="qd-dc-o">
          <Button kind="primary" icon="file" disabled={!hoiNNT.length || dangXuat} aria-busy={dangXuat} title={hoiNNT.length ? undefined : "Chọn Hỏi NNT ở khoản cần hỏi để đưa vào thông báo"} onClick={xuat}>Xuất thông báo gửi NNT</Button>
        </div>
        {/* Biên bản 18/11/2026 §2.3: "file Excel highlight các dòng còn lệch kèm gợi ý và nguyên nhân". */}
        <div className="qd-dc-o">
          <ExportButton onExport={() => xuatExcelDoiChieu(d, kq)}>Xuất Excel kết quả</ExportButton>
        </div>
        <span className="qd-dc-o-ghi" aria-live="polite">{hoiNNT.length ? <><Icon name="mail" size={13}/>{hoiNNT.length} khoản sẽ vào thông báo</> : null}</span>
      </div>
    </>}

    <div className={`qd-dc-so${moSo ? " is-mo" : ""}`}>
      <button type="button" className="qd-dc-so-nut" aria-expanded={moSo} aria-controls="qd-dc-so-noi" onClick={() => datMoSo((m) => !m)}>
        <span>Sổ đã bắt cặp</span><small>{dong(kq.capDaGhep.length)} nhóm</small><Icon name="chevronDown" size={16}/>
      </button>
      <div id="qd-dc-so-noi" className="qd-dc-so-noi" hidden={!moSo}>{moSo && <SoDaGhep cap={kq.capDaGhep}/>}</div>
    </div>
  </section>;
}

