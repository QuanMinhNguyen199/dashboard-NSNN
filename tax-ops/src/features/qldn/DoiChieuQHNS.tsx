import { useMemo, useState } from "react";
import { Button, Icon, NhomNut, TableWrap, type IconName } from "@/components/ui";
import { GhiChu } from "@/components/GhiChu";
import type { DongDN } from "@/data/qldn";
import {
  CUA_SO, NGUONG_LECH, dauCap, doiChieuQHNS, giaTri, laHaNoi, ngayDoiChieu,
  type Cap, type DongSoi, type KetQuaDoiChieu,
} from "@/data/doiChieuQHNS";
import { moTaGD } from "@/data/danhMucTMS";
import { xuatThongBaoDoiChieu } from "@/domain/thongBaoDoiChieuWord";

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

function SoDaGhep({ cap }: { cap: Cap[] }) {
  const theoNam = useMemo(() => {
    const m = new Map<number, Cap[]>();
    for (const c of cap) { const n = dauCap(c).getFullYear(); m.set(n, [...(m.get(n) ?? []), c]); }
    return [...m.entries()].sort((a, b) => b[0] - a[0]);
  }, [cap]);
  return <TableWrap label="sổ phải nộp và đã nộp đã bắt cặp">
    <table className="qd-bang qd-dn-bang qd-dc-so-bang">
      <thead><tr>
        <th scope="col">Hạn nộp</th>
        <th scope="col">Nghĩa vụ</th>
        <th scope="col">Ngày nộp</th>
        <th scope="col" className="num">Số tiền</th>
      </tr></thead>
      {theoNam.map(([nam, ds]) => <tbody key={nam}>
        <tr className="qd-dc-nam"><th scope="rowgroup" colSpan={4}>{nam === 2014 ? "Trước 2015 · số dư chuyển đổi" : nam}<small>{ds.length} nhóm</small></th></tr>
        {ds.map((c, i) => {
          const dau = c.pn[0] ?? c.dn[0];
          const tien = c.pn.length ? c.pn.reduce((a, x) => a + x.soTien, 0) : c.dn.reduce((a, x) => a + Math.abs(x.soTien), 0) / 2;
          const nop = c.dn.map((x) => x.ngay.getTime());
          return <tr key={`${dau.id}-${i}`} title={`Ghép ở vòng ${c.vong}`}>
            <td>{ngayDoiChieu(dau.ngay)}{dau.hanGoc && <small className="qd-dc-gh">hạn nộp {ngayDoiChieu(dau.hanGoc)}</small>}</td>
            <th scope="row">{dau.moTa}{c.pn.length > 1 && ` + ${c.pn.length - 1} khoản`}
              <small className="qd-dc-ma-day">{[...c.pn, ...c.dn].map((x, j) => <Ma key={j} ma={x.ma}/>)}</small>
            </th>
            <td>{nop.length ? ngayDoiChieu(new Date(Math.min(...nop))) : "—"}</td>
            <td className="num">{dong(tien)}{c.lech !== 0 && <small className="qd-dc-lech">lệch {dong(c.lech)}</small>}</td>
          </tr>;
        })}
      </tbody>)}
    </table>
  </TableWrap>;
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

  const xuat = async () => {
    datDangXuat(true);
    try { await xuatThongBaoDoiChieu(d, hoiNNT, d.canBo); } finally { datDangXuat(false); }
  };

  return <section className="qd-dn-khoi qd-dc" id="qd-dc-khoi" aria-labelledby="qd-dc">
    <h3 id="qd-dc"><span>Đối chiếu nghĩa vụ<GhiChu tieuDe="Biên bản 11/11/2026">
      {/* Nguyên văn biên bản 11/11/2026: §3 điểm 5, §2.1 bước 3, §2.6. */}
      <p>Bung toàn bộ giao dịch theo tiểu mục, âm/dương giữ nguyên, cộng trừ; sắp theo hạn nộp, có ngày gia hạn thì lấy ngày gia hạn.</p>
      <p>Vòng 1: khoản nào khớp 1-1 thì nhấc ra. Vòng 2 trở đi: ghép 2–4 khoản gần nhau cộng lại, khớp thì nhấc tiếp.</p>
      <p>Công cụ VBA hiện có quét trong cửa sổ khoảng {CUA_SO} dòng, khớp cặp, loại dòng trùng rồi chạy lại nhiều vòng.</p>
    </GhiChu><GhiChu tieuDe="Ký hiệu giao dịch">
      <dl className="qd-dc-ky-hieu">{kq.kyHieu.map((m) => <div key={m}><dt>{m}</dt><dd>{moTaGD(m)}</dd></div>)}</dl>
    </GhiChu></span><small>đồng</small></h3>

    <dl className="qd-dc-ba">
      <div><dt>Phải nộp</dt><dd>{dong(kq.phaiNop)}</dd></div>
      <div><dt>Đã nộp</dt><dd>{dong(kq.daNop)}</dd></div>
      <div className={kq.conPhaiNop > 0 && kq.canSoi.length ? "is-xau" : undefined}><dt>{thua ? "Nộp thừa" : "Còn phải nộp"}</dt><dd>{dong(Math.abs(kq.conPhaiNop))}</dd></div>
    </dl>

    <p className="qd-dc-trang-thai">
      <span className={`qd-dc-ghep${kq.canSoi.length ? " is-con" : ""}`} title={`Bắt cặp tự động ${dong(soDongGhep)}/${dong(kq.soDong)} dòng sau ${kq.soVong} vòng; ${kq.nhomNhieu} nhóm ghép từ 3 khoản trở lên`}>
        <Icon name={kq.canSoi.length ? "alert" : "check"} size={14}/>Bắt cặp {dong(soDongGhep)}/{dong(kq.soDong)} dòng · {kq.soVong} vòng
      </span>
      {kq.capTheoNguong > 0 && <span className="qd-dc-ghep is-phu" title={`${kq.capTheoNguong} nhóm ghép theo ngưỡng lệch ${dong(NGUONG_LECH)} đồng; còn chênh ${dong(kq.tongLech)} đồng`}>±{dong(NGUONG_LECH)} đ · {kq.capTheoNguong} nhóm</span>}
      {kq.soGiaHan > 0 && <span className="qd-dc-ghep is-phu">{kq.soGiaHan} kỳ gia hạn</span>}
      {/* Cột của sheet HETHONG (công cụ RSNT_GTGT_CUC): Lũy kế TQ, Lũy kế File, KHỚP. */}
      <span className={`qd-dc-ghep ${lechLK.length ? "is-con" : "is-phu"}`}
        title={kq.luyKe.map((x) => `${x.tieuMuc} · Lũy kế TQ ${dong(x.tms)} · Lũy kế File ${dong(x.file)}`).join("; ")}>
        <Icon name={lechLK.length ? "alert" : "check"} size={14}/>{lechLK.length ? `Lũy kế TQ – File: lệch ${lechLK.map((x) => x.tieuMuc).join(", ")}` : "Lũy kế TQ – File: khớp"}
      </span>
    </p>

    {kq.phanBo.map((p) => <p key={p.tinh} className="qd-dc-phan-bo" role="note">
      <Icon name="alert" size={15}/>
      {/* Biên bản 13/11/2026 §2.2: "thừa ở tỉnh này nhưng nợ ở Hà Nội … chứng từ phân bổ chưa hạch toán hoặc chuyển sai". */}
      <span>Thừa {dong(p.thua)} tại {p.tinh}{p.no > 0 && <>, nợ {dong(p.no)} tại {p.cqtNo ? `${p.cqtNo} · ${p.tenNo}` : p.tenNo}</>}: chứng từ phân bổ chưa hạch toán hoặc chuyển sai.</span>
    </p>)}

    {kq.canSoi.length > 0 && <>
      <div className="qd-dc-soi-dau">
        <h4>Dòng cần soi <span className="qd-dc-dem">{kq.canSoi.length}</span></h4>
        <NhomNut<Buoc> className="qd-dc-buoc" label="Cách xem dòng cần soi" value={buoc} onChange={datBuoc}
          options={[
            /* Nguyên văn biên bản 13/11/2026 §2.2 (Đối chiếu nhiều bước). */
            { value: "DS", label: "Bước 1", title: "Lọc các tờ khai và số nộp khớp nhau, tách các tờ khai lệch chưa có chứng từ" },
            { value: "XOAY", label: "Bước 2", title: "Xoay lại cột và hàng để xem chứng từ phân bổ, nộp nhầm và các nguyên nhân khác" },
          ]}/>
        <span className="qd-dc-soi-con">{conLai ? `${conLai} chưa xử lý` : "đã xử lý hết"}</span>
      </div>
      <div className="qd-dc-buoc-noi" key={buoc}>
        {buoc === "XOAY" ? <BangXoay ds={kq.canSoi}/> : <ol className="qd-dc-soi">{kq.canSoi.map((x) => {
          const v = cuaDong(x.id);
          const l = LOAI[x.loai];
          return <li key={x.id} className={`is-${v.toLowerCase()}`}>
            <span className="qd-dn-ngay">{ngayDoiChieu(x.ngay)}{x.hanGoc && <small className="qd-dc-gh">gia hạn</small>}</span>
            <span className="qd-dc-noi">
              <strong><span className={`qd-dc-loai is-${x.loai.toLowerCase()}`} title={l.day} aria-hidden="true"><Icon name={l.icon} size={13}/></span>{l.nhan}<span className="sr-only">: {l.day}</span>
                <GhiChu tieuDe="Tra theo thứ tự"><ol className="qd-dc-buoc-tra">{x.buoc.map((b) => <li key={b}>{b}</li>)}</ol></GhiChu></strong>
              <small><Ma ma={x.ma}/> {x.moTa} · TM {x.tieuMuc} · CQT {tenCQT(x)}</small>
              {x.docNhanh && <small className={`qd-dc-doc is-${x.docNhanh.muc}`}><Icon name={x.docNhanh.muc === "cao" ? "alert" : "check"} size={12}/>{x.docNhanh.nhan}</small>}
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

