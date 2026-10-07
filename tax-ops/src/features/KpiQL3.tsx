import { useMemo, useState } from "react";
import { Badge, Button, Panel, TableWrap, money } from "@/components/ui";
import { useAction } from "@/state/ActionContext";
import { useKpi } from "@/state/KpiContext";
import { rutGonTenDonVi } from "@/data/danhMuc";
import { KY_QL3, danhGiaQL3, type DonViQL3, type KyQL3 } from "@/data/ql3";
import type { VaiTro } from "@/domain/types";

/*
  KPI tháng do đơn vị tự đăng ký — M-Q3-02 của `SPec/QLDN3`.

  Màn này thay mục "Đối chiếu báo cáo thủ công". Đối chiếu bằng tay là việc
  của giai đoạn chuyển đổi — mở tệp của phòng cạnh báo cáo hệ thống và soi
  từng chỉ tiêu; nó không nằm trong bộ chỉ tiêu nào của mẫu báo cáo. KPI thì
  ngược lại: nó là CỘT (7) của mẫu, và cột (8) "tỷ lệ hoàn thành/KPI" chia cho
  nó. §6 còn xếp "nhập KPI" vào nhóm **vẫn thủ công sau khi có hệ thống**, tức
  nó phải có màn riêng chứ không thể chờ một nguồn nào kéo về.

  Ba phép kiểm của M-Q3-02 được áp đúng như tài liệu ghi — "Số nguyên ≥ 0; đủ
  30 đơn vị; không nhỏ hơn tháng trước":

  • Số nguyên ≥ 0 và không nhỏ hơn tháng trước: chặn ngay lúc lưu, kèm tên đơn
    vị sai, vì một bảng ba mươi dòng mà chỉ báo "có lỗi" thì người nhập phải
    tự dò.
  • Đủ 30 đơn vị: KHÔNG chặn lưu. Đơn vị đăng ký rải rác trước ngày 25, nên
    chặn lưu tới khi đủ ba mươi nghĩa là không ai lưu được gì cho tới đơn vị
    cuối cùng. Nó hiện thành một con số đếm ở đầu khối.

  Chỉ CHUYÊN VIÊN nhập. Trưởng phòng đọc và duyệt — cùng lằn ranh đã áp cho
  phiếu rà soát bên QL2 và QL4.
*/

const SO_COT = [230, 150, 170, 150, 150, 160];
const RONG = SO_COT.reduce((a, b) => a + b, 0);

/** Kỳ ngay trước kỳ đang mở; `null` nếu đây là kỳ đầu tiên của danh sách. */
function kyTruoc(ky: KyQL3): KyQL3 | null {
  const i = KY_QL3.findIndex((k) => k.id === ky.id);
  return i >= 0 && i + 1 < KY_QL3.length ? KY_QL3[i + 1] : null;
}

export function KpiQL3({ trongPhamVi, ky, vaiTro }: {
  trongPhamVi: DonViQL3[];
  ky: KyQL3;
  vaiTro: VaiTro;
}) {
  const notify = useAction();
  const { layKpi, ghiKpi, daDangKy } = useKpi();
  const [nhap, datNhap] = useState<Record<string, string>>({});
  const [loi, datLoi] = useState("");

  const truoc = kyTruoc(ky);
  const suaDuoc = vaiTro === "CV";

  const hang = useMemo(() => trongPhamVi.map((dv) => {
    const o = danhGiaQL3(ky.hat, dv);
    return {
      dv,
      daHoanThanh: o.daHoanThanh,
      /* Số đã đăng ký trên hệ thống; nếu chưa ai nhập thì lấy số sinh sẵn của
         kỳ, để bảng tổng hợp không có ô trống ở cột (7). */
      kpi: layKpi(ky.id, dv.id) ?? o.kpiDangKy,
      daNhap: layKpi(ky.id, dv.id) !== null,
      kpiTruoc: truoc ? (layKpi(truoc.id, dv.id) ?? danhGiaQL3(truoc.hat, dv).kpiDangKy) : null,
    };
  }), [trongPhamVi, ky, truoc, layKpi]);

  const soDaDangKy = daDangKy(ky.id, trongPhamVi.map((dv) => dv.id));
  const coSua = Object.keys(nhap).length > 0;

  const luu = () => {
    const ra: Record<string, number> = {};
    for (const h of hang) {
      const v = nhap[h.dv.id];
      if (v === undefined) continue;
      const t = v.trim();
      if (t === "") { datLoi(`${rutGonTenDonVi(h.dv.ten)}: chưa nhập số DN đăng ký.`); return; }
      const so = Number(t);
      if (!Number.isInteger(so) || so < 0) {
        datLoi(`${rutGonTenDonVi(h.dv.ten)}: KPI phải là số nguyên không âm.`);
        return;
      }
      /* Lũy kế thì không đi lùi: đăng ký tháng 8 nhỏ hơn tháng 7 nghĩa là đơn
         vị vừa rút bớt cam kết của chính mình mà không ai thấy. */
      if (h.kpiTruoc !== null && so < h.kpiTruoc) {
        datLoi(`${rutGonTenDonVi(h.dv.ten)}: KPI lũy kế ${money(so)} nhỏ hơn ${ky.thangKPI === KY_QL3[0].thangKPI ? "tháng trước" : "kỳ trước"} (${money(h.kpiTruoc)}).`);
        return;
      }
      ra[h.dv.id] = so;
    }
    if (!Object.keys(ra).length) { datLoi("Chưa sửa ô nào."); return; }
    ghiKpi(ky.id, ra);
    notify(`Đã ghi KPI ${ky.thangKPI} cho ${money(Object.keys(ra).length)} đơn vị. Bản demo chưa gửi về đơn vị.`);
    datNhap({});
    datLoi("");
  };

  return <Panel
    title={`KPI đăng ký · ${ky.thangKPI}`}
    subtitle={`${money(soDaDangKy)}/${money(trongPhamVi.length)} đơn vị đã đăng ký trên hệ thống · hạn trước ngày 25`}
    actions={suaDuoc ? <div className="inline-controls">
      {coSua && <Button kind="quiet" onClick={() => { datNhap({}); datLoi(""); }}>Hoàn tác</Button>}
      <Button kind="primary" disabled={!coSua} onClick={luu}>Lưu KPI đã nhập</Button>
    </div> : undefined}
  >
    <TableWrap label={`KPI đăng ký ${ky.thangKPI}`}>
      <table className="ql1-ds-table" style={{ minWidth: RONG }}>
        <colgroup>{SO_COT.map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
        <thead><tr>
          <th scope="col">Đơn vị</th>
          <th scope="col" className="num">{truoc ? `KPI ${truoc.thangKPI}` : "KPI kỳ trước"}</th>
          <th scope="col" className="num">KPI {ky.thangKPI}</th>
          <th scope="col" className="num">Đã hoàn thành</th>
          <th scope="col" className="num">Tỷ lệ hoàn thành</th>
          <th scope="col">Tình trạng</th>
        </tr></thead>
        <tbody>
          {hang.map((h) => {
            const dang = nhap[h.dv.id];
            const so = dang === undefined ? h.kpi : Number(dang.trim() || 0);
            return <tr key={h.dv.id} className={dang !== undefined ? "is-selected" : undefined}>
              <td title={h.dv.ten}>{rutGonTenDonVi(h.dv.ten)}</td>
              <td className="num">{h.kpiTruoc === null ? <span className="cell-empty">—</span> : money(h.kpiTruoc)}</td>
              <td className="num">
                {suaDuoc
                  ? <input
                      className="o-so"
                      inputMode="numeric"
                      aria-label={`KPI ${ky.thangKPI} của ${rutGonTenDonVi(h.dv.ten)}`}
                      value={dang ?? String(h.kpi)}
                      onChange={(e) => { datNhap((t) => ({ ...t, [h.dv.id]: e.target.value })); datLoi(""); }}
                    />
                  : money(h.kpi)}
              </td>
              <td className="num">{money(h.daHoanThanh)}</td>
              <td className="num">{so > 0 ? `${Math.round((h.daHoanThanh / so) * 1000) / 10}%` : <span className="cell-empty">—</span>}</td>
              <td>{h.daNhap
                ? <Badge tone="positive">Đã đăng ký</Badge>
                : <Badge tone="warning">Chưa đăng ký</Badge>}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </TableWrap>
    {loi && <p role="alert" className="quality-note">{loi}</p>}
  </Panel>;
}
