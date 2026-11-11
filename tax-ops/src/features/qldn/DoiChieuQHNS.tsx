import { useMemo, useState } from "react";
import { Button, Icon, TableWrap, type IconName } from "@/components/ui";
import { GhiChu } from "@/components/GhiChu";
import type { DongDN } from "@/data/qldn";
import { NGUONG_LECH, NHAN_NGUON, doiChieuQHNS, ngayDoiChieu, type Cap, type DongSoi, type KetQuaDoiChieu } from "@/data/doiChieuQHNS";
import { xuatThongBaoDoiChieu } from "@/domain/thongBaoDoiChieuWord";

/*
  Đối chiếu nghĩa vụ từ khi thành lập — Biểu QHNS, giai đoạn 1 của biên bản
  09/11/2026 (general_data/09-11). Đứng ngay dưới bảng Quan hệ ngân sách của
  năm: bảng trên trả lời "năm nay còn nợ, thừa bao nhiêu", khối này trả lời
  "con số ấy có đúng không, khoản lệch từ đâu ra".

  Gọn chữ 11/11/2026 (người dùng: "nhiều text, thay bằng icon, indicator"):
  • Loại dòng: icon chiều tiền + nhãn ngắn (Thiếu chứng từ / Thừa / Chuyển đổi).
  • Gợi ý chỗ tìm: vào ⓘ của từng dòng.
  • Xử lý: hai nút icon ✓ / ✉ (bấm lại để bỏ). Chưa bấm = chưa xử lý —
    viền trái của dòng đã nói trạng thái.
  • Bắt cặp: một chỉ báo "✓ 218/221 · 3 vòng"; ngưỡng lệch trong `title`.
  • Giả định và giai đoạn 2: ⓘ cạnh tên khối.
  • Sổ: bỏ cột Vòng, vòng nằm trong `title` của dòng.
*/

type XuLy = "CHUA" | "GIAI_THICH" | "HOI_NNT";
const dong = (x: number) => x.toLocaleString("vi-VN");
const LOAI: Record<DongSoi["loai"], { nhan: string; day: string; icon: IconName }> = {
  NO: { nhan: "Thiếu chứng từ", day: "Phải nộp, chưa có chứng từ nộp đối ứng", icon: "arrowUp" },
  THUA: { nhan: "Thừa", day: "Đã nộp, không có nghĩa vụ đối ứng", icon: "arrowDown" },
  CHUYEN_DOI: { nhan: "Chuyển đổi", day: "Số dư chuyển đổi trước TMS chưa tách được", icon: "layers" },
};

function SoDaGhep({ cap }: { cap: Cap[] }) {
  const theoNam = useMemo(() => {
    const m = new Map<number, Cap[]>();
    for (const c of cap) { const n = c.pn.ngay.getFullYear(); m.set(n, [...(m.get(n) ?? []), c]); }
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
        <tr className="qd-dc-nam"><th scope="rowgroup" colSpan={4}>{nam === 2014 ? "Trước 2015 · số dư chuyển đổi" : nam}<small>{ds.length} cặp</small></th></tr>
        {ds.map((c) => <tr key={c.pn.id} title={`Ghép ở vòng ${c.vong}`}>
          <td>{ngayDoiChieu(c.pn.ngay)}</td>
          <th scope="row">{c.pn.moTa}<small>{c.pn.tenTieuMuc}{c.dn.nguon === "CT_NK" ? " · nộp nơi khác" : ""}</small></th>
          <td>{ngayDoiChieu(c.dn.ngay)}</td>
          <td className="num">{dong(c.pn.soTien)}{c.lech !== 0 && <small className="qd-dc-lech" title={`Nộp ${dong(c.dn.soTien)} đồng`}>lệch {dong(c.lech)}</small>}</td>
        </tr>)}
      </tbody>)}
    </table>
  </TableWrap>;
}

export function DoiChieuQHNS({ d, kq: coSan }: { d: DongDN; kq?: KetQuaDoiChieu }) {
  const tinh = useMemo(() => coSan ?? doiChieuQHNS(d), [d, coSan]);
  const kq = tinh;
  const [xuLy, datXuLy] = useState<Record<string, XuLy>>({});
  const [moSo, datMoSo] = useState(false);
  const [dangXuat, datDangXuat] = useState(false);
  const cuaDong = (id: string) => xuLy[id] ?? "CHUA";
  const lat = (id: string, v: XuLy) => datXuLy((s) => ({ ...s, [id]: (s[id] ?? "CHUA") === v ? "CHUA" : v }));
  const hoiNNT = kq.canSoi.filter((x) => cuaDong(x.id) === "HOI_NNT");
  const conLai = kq.canSoi.filter((x) => cuaDong(x.id) === "CHUA").length;
  const thua = kq.conPhaiNop < 0;
  const ghep = kq.capDaGhep.length * 2;

  const xuat = async () => {
    datDangXuat(true);
    try { await xuatThongBaoDoiChieu(d, hoiNNT, d.canBo); } finally { datDangXuat(false); }
  };

  return <section className="qd-dn-khoi qd-dc" id="qd-dc-khoi" aria-labelledby="qd-dc">
    <h3 id="qd-dc"><span>Đối chiếu nghĩa vụ<GhiChu tieuDe="Đối chiếu nghĩa vụ · giả định">
      <p>Sổ phải nộp – đã nộp từ {kq.coChuyenDoi ? "số dư chuyển đổi trước 2015" : kq.tuNam} đến 31/10/2026, bắt cặp tự động thay công cụ VBA (biên bản 09/11/2026).</p>
      <p>Giả định tạm, chờ tài liệu nghiệp vụ (việc 1): chỉ ghép trong cùng tiểu mục; vòng thứ k xét các dòng cách nhau tối đa k vị trí; ngưỡng lệch {dong(NGUONG_LECH)} đồng.</p>
      <p>Giai đoạn 2 — khoảng 10 kiểm tra từ kinh nghiệm chuyên gia — chờ phía Thuế gửi danh sách (việc 5).</p>
    </GhiChu></span><small>đồng</small></h3>

    <dl className="qd-dc-ba">
      <div><dt>Phải nộp</dt><dd>{dong(kq.phaiNop)}</dd></div>
      <div><dt>Đã nộp</dt><dd>{dong(kq.daNop)}</dd></div>
      <div className={kq.conPhaiNop > 0 && kq.canSoi.length ? "is-xau" : undefined}><dt>{thua ? "Nộp thừa" : "Còn phải nộp"}</dt><dd>{dong(Math.abs(kq.conPhaiNop))}</dd></div>
    </dl>

    <p className="qd-dc-trang-thai">
      <span className={`qd-dc-ghep${kq.canSoi.length ? " is-con" : ""}`} title={`Bắt cặp tự động ${dong(ghep)}/${dong(kq.soDong)} dòng sau ${kq.soVong} vòng`}>
        <Icon name={kq.canSoi.length ? "alert" : "check"} size={14}/>Bắt cặp {dong(ghep)}/{dong(kq.soDong)} dòng · {kq.soVong} vòng
      </span>
      {kq.capTheoNguong > 0 && <span className="qd-dc-ghep is-phu" title={`${kq.capTheoNguong} cặp ghép theo ngưỡng lệch ${dong(NGUONG_LECH)} đồng; còn chênh ${dong(kq.tongLech)} đồng`}>±{dong(NGUONG_LECH)} đ · {kq.capTheoNguong} cặp</span>}
    </p>

    {kq.canSoi.length > 0 && <>
      <div className="qd-dc-soi-dau">
        <h4>Dòng cần soi <span className="qd-dc-dem">{kq.canSoi.length}</span></h4>
        <span>{conLai ? `${conLai} chưa xử lý` : "đã xử lý hết"}</span>
      </div>
      <ol className="qd-dc-soi">{kq.canSoi.map((x) => {
        const v = cuaDong(x.id);
        const l = LOAI[x.loai];
        return <li key={x.id} className={`is-${v.toLowerCase()}`}>
          <span className="qd-dn-ngay">{ngayDoiChieu(x.ngay)}</span>
          <span className="qd-dc-noi">
            <strong><span className={`qd-dc-loai is-${x.loai.toLowerCase()}`} title={l.day} aria-hidden="true"><Icon name={l.icon} size={13}/></span>{l.nhan}<span className="sr-only">: {l.day}</span>
              <GhiChu tieuDe="Gợi ý chỗ tìm">{x.goiY}</GhiChu></strong>
            <small>{NHAN_NGUON[x.nguon]}: {x.moTa} · {x.tieuMuc} {x.tenTieuMuc}</small>
          </span>
          <span className="qd-dc-cot-phai">
            <span className={`qd-dc-tien ${x.chieu === "PN" ? "is-pn" : "is-dn"}`}>{dong(x.soTien)}</span>
            <span className="qd-dc-xu-ly" role="group" aria-label={`Xử lý khoản ${dong(x.soTien)} đồng`}>
              <button type="button" className="qd-dc-nut is-giai-thich" aria-pressed={v === "GIAI_THICH"} title="Đã giải thích" aria-label="Đã giải thích" onClick={() => lat(x.id, "GIAI_THICH")}><Icon name="check" size={15}/></button>
              <button type="button" className="qd-dc-nut is-hoi" aria-pressed={v === "HOI_NNT"} title="Hỏi NNT — đưa vào thông báo" aria-label="Hỏi NNT" onClick={() => lat(x.id, "HOI_NNT")}><Icon name="mail" size={15}/></button>
            </span>
          </span>
        </li>;
      })}</ol>

      <div className="qd-dc-thao-tac">
        <div className="qd-dc-o">
          <Button kind="primary" icon="file" disabled={!hoiNNT.length || dangXuat} aria-busy={dangXuat} title={hoiNNT.length ? undefined : "Chọn Hỏi NNT ở khoản cần hỏi để đưa vào thông báo"} onClick={xuat}>Xuất thông báo gửi NNT</Button>
        </div>
        <span className="qd-dc-o-ghi" aria-live="polite">{hoiNNT.length ? <><Icon name="mail" size={13}/>{hoiNNT.length} khoản sẽ vào thông báo</> : <>Chọn <Icon name="mail" size={13}/> ở khoản cần hỏi NNT</>}</span>
      </div>
    </>}

    <div className={`qd-dc-so${moSo ? " is-mo" : ""}`}>
      <button type="button" className="qd-dc-so-nut" aria-expanded={moSo} aria-controls="qd-dc-so-noi" onClick={() => datMoSo((m) => !m)}>
        <span>Sổ đã bắt cặp</span><small>{dong(kq.capDaGhep.length)} cặp</small><Icon name="chevronDown" size={16}/>
      </button>
      <div id="qd-dc-so-noi" className="qd-dc-so-noi" hidden={!moSo}>{moSo && <SoDaGhep cap={kq.capDaGhep}/>}</div>
    </div>
  </section>;
}
