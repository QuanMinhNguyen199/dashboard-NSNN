import { useMemo, useState } from "react";
import { Badge, Button, Panel, TableWrap, money } from "@/components/ui";
import { useAction } from "@/state/ActionContext";
import { usePhieu } from "@/state/PhieuContext";
import { rutGonTenDonVi } from "@/data/danhMuc";
import { CAU_HINH, dsPhieu, kiemTraLoi, type DongPhieu, type LoaiPhieu } from "@/data/phieu";

/*
  Nhập kết quả phiếu rà soát — §6 `design_ql2ql4`, nhánh "phòng tự tổng hợp".

  BẢN TRƯỚC của khối này là một màn riêng của vai "Cán bộ đơn vị": đơn vị tự
  đăng nhập và điền. Vai ấy mang nhãn [R] và treo ở Q-95 — "Phòng, TCS có đăng
  nhập xem hồ sơ và nhập kết quả rà soát vênh không" — nên nó đã được gỡ.

  Cập nhật 06/10, Q-96 đã rõ: QL2 lấy kết quả từ hddtbaocao r31.
  PRS-03 chỉ dự phòng khi thiếu r31 theo kỳ/đơn vị; nơi gọi truyền
  donViChoPhep để giới hạn dữ liệu. Quy trình PRS-05 của QL4 giữ nguyên.
  Nhập lại phản hồi tại phòng là hành vi demo đang có, không phải kết nối r31.

  Ba thứ vòng cũ làm tệ vẫn phải giữ, vì chúng không phụ thuộc vào ai gõ:

  1. BIẾT CÒN BAO NHIÊU VÀ HẠN NÀO. Sắp theo hạn, quá hạn lên trước.
  2. ĐIỀN NHANH CHO NHIỀU DÒNG. Một đơn vị thường trả cùng một kết quả cho cả
     loạt; gõ lại từng ô là lý do vòng cũ chậm.
  3. KHÔNG SỬA ĐƯỢC CỘT HỆ THỐNG. MST, tên, chi tiết khóa cứng, nền riêng —
     G17 đòi phân biệt số máy tính với số do người nhập.

  G17 còn đòi thêm một thứ mà bản trước không cần: ở đây NGƯỜI GÕ KHÔNG PHẢI
  NGƯỜI TRẢ LỜI, nên mỗi ô điền tay phải nói nó đến từ phản hồi của đơn vị nào.
  Cột "Đơn vị" vì thế là cột bắt buộc, không phải tiện ích lọc.
*/
export function NhapKetQuaPhieu({ loai, hatKy, donViChoPhep }: { loai: LoaiPhieu; hatKy: number; donViChoPhep?: string[] }) {
  const notify = useAction();
  const { layTraLoi, ghiNhieu } = usePhieu();
  const [donVi, datDonVi] = useState("");
  const [chon, datChon] = useState<string[]>([]);
  const [nhap, datNhap] = useState({ ketQua: "", soTien: "", lyDo: "", ghiChu: "" });
  const [loi, datLoi] = useState("");

  const ch = CAU_HINH[loai];
  const tatCa = useMemo(
    () => dsPhieu(loai, hatKy).filter((d) => !donViChoPhep || donViChoPhep.includes(d.donVi)).sort((a, b) => b.quaHan - a.quaHan),
    [loai, hatKy, donViChoPhep],
  );
  const dsDonVi = useMemo(() => [...new Set(tatCa.map((d) => d.donVi))], [tatCa]);
  const dong = donVi ? tatCa.filter((d) => d.donVi === donVi) : tatCa;

  const chuaTraLoi = dong.filter((d) => !layTraLoi(d.id));

  const dien = () => {
    const batLoi = kiemTraLoi(ch, nhap);
    if (batLoi) { datLoi(batLoi); return; }
    if (!chon.length) { datLoi("Chọn ít nhất một dòng để điền."); return; }
    ghiNhieu(chon, nhap);
    notify(`Đã ghi phản hồi cho ${money(chon.length)} dòng. Bản demo chưa đẩy sang cột kết quả của báo cáo.`);
    datChon([]);
    datNhap({ ketQua: "", soTien: "", lyDo: "", ghiChu: "" });
    datLoi("");
  };

  const batDong = (d: DongPhieu) => datChon((t) => t.includes(d.id) ? t.filter((x) => x !== d.id) : [...t, d.id]);

  /* Cột Hạn chứa ngày CỘNG một chip "quá/còn N ngày", cột Kết quả chứa cả
     gợi ý kỳ trước — hai cột này dài hơn vẻ ngoài của tên cột. */
  const rong = loai === "PRS-03"
    ? [56, 230, 160, 136, 210, 160, 230, 220, 180, 170]
    : [56, 230, 160, 136, 210, 250, 230, 220, 240, 170];

  return <Panel
    title={`Nhập kết quả phiếu ${ch.loai}`}
    subtitle={`${money(chuaTraLoi.length)}/${money(dong.length)} dòng chưa có kết quả · sắp theo hạn, quá hạn lên trước`}
    actions={<Button
      kind="secondary"
      icon="file"
      onClick={() => notify("Bản demo chưa đọc được tệp phản hồi. Tệp thật giữ nguyên cột hệ thống và báo đúng dòng lỗi khi tải lên.")}
    >Tải tệp phản hồi của đơn vị</Button>}
  >
    {/*
      Khối điền hàng loạt đứng TRƯỚC bảng vì nó thao tác trên những dòng đang
      chọn trong bảng — đặt dưới thì chọn xong phải cuộn đi tìm chỗ nhập.

      Ô "Đơn vị" ở đây vừa lọc bảng vừa nói ô điền tay thuộc phản hồi của ai,
      nên nó đứng cùng hàng với các ô nhập chứ không nằm trên thanh lọc chung.
    */}
    <div className="phieu-dien">
      <div className="phieu-dien-o">
        <label>Đơn vị phản hồi
          <select value={donVi} onChange={(e) => { datDonVi(e.target.value); datChon([]); datLoi(""); }}>
            <option value="">Tất cả đơn vị</option>
            {dsDonVi.map((d) => <option key={d} value={d}>{rutGonTenDonVi(d)}</option>)}
          </select>
        </label>
        <label>Kết quả
          <select value={nhap.ketQua} onChange={(e) => { datNhap((t) => ({ ...t, ketQua: e.target.value })); datLoi(""); }}>
            <option value="">— chọn —</option>
            {ch.ketQua.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        {ch.batBuocSoTien && <label>Số thuế điều chỉnh (đồng)
          <input
            inputMode="numeric"
            value={nhap.soTien}
            placeholder={nhap.ketQua === ch.batBuocSoTien ? "bắt buộc" : "nếu có"}
            onChange={(e) => { datNhap((t) => ({ ...t, soTien: e.target.value })); datLoi(""); }}
          />
        </label>}
        <label>Lý do
          <input
            maxLength={200}
            value={nhap.lyDo}
            placeholder={ch.batBuocLyDo && nhap.ketQua === ch.batBuocLyDo ? "bắt buộc" : "nếu có"}
            onChange={(e) => { datNhap((t) => ({ ...t, lyDo: e.target.value })); datLoi(""); }}
          />
        </label>
        <label>Ghi chú
          <input maxLength={200} value={nhap.ghiChu} onChange={(e) => datNhap((t) => ({ ...t, ghiChu: e.target.value }))}/>
        </label>
      </div>
      <div className="phieu-dien-nut">
        <span>{chon.length ? `Đang chọn ${money(chon.length)} dòng` : "Chưa chọn dòng nào"}</span>
        <Button kind="primary" disabled={chon.length === 0} onClick={dien}>Điền cho dòng đã chọn</Button>
      </div>
      {loi && <p role="alert" className="quality-note">{loi}</p>}
    </div>

    <TableWrap label={`kết quả phiếu ${ch.loai}`}>
      <table className="ql1-ds-table phieu-bang" style={{ minWidth: rong.reduce((a, b) => a + b, 0) }}>
        <colgroup>{rong.map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
        <thead><tr>
          <th scope="col" className="center">Chọn</th>
          <th scope="col">Đơn vị</th>
          <th scope="col">Mã phiếu</th>
          <th scope="col">MST</th>
          <th scope="col">Tên người nộp thuế</th>
          <th scope="col">{ch.nhanChiTiet}</th>
          <th scope="col">Hạn</th>
          <th scope="col">Kết quả</th>
          <th scope="col">{ch.batBuocSoTien ? "Số thuế điều chỉnh" : "Lý do"}</th>
          <th scope="col">Trạng thái</th>
        </tr></thead>
        <tbody>
          {dong.map((d) => {
            const t = layTraLoi(d.id);
            return <tr
              key={d.id}
              className={chon.includes(d.id) ? "is-selected" : undefined}
              onClick={(e) => { if (!(e.target instanceof HTMLInputElement)) batDong(d); }}
            >
              <td className="center">
                <label className="o-chon">
                  <input type="checkbox" aria-label={`Chọn ${d.mst}`} checked={chon.includes(d.id)} onChange={() => batDong(d)}/>
                  <span aria-hidden="true"/>
                </label>
              </td>
              {/* Năm cột hệ thống mang nền riêng và không sửa được — G17. */}
              <td className="o-he-thong" title={d.donVi}>{rutGonTenDonVi(d.donVi)}</td>
              <td className="o-he-thong">{d.maPhieu}</td>
              <td className="o-he-thong">{d.mst}</td>
              <td className="o-he-thong">{d.tenNNT}</td>
              <td className="o-he-thong">{d.chiTiet}</td>
              <td>
                {d.han}{" "}
                {d.quaHan > 0
                  ? <Badge tone="critical">quá {d.quaHan} ngày</Badge>
                  : <Badge tone="positive">còn {Math.abs(d.quaHan)} ngày</Badge>}
              </td>
              <td>
                {t?.ketQua ?? (d.goiY
                  ? <span className="phieu-goiy" title="Phản hồi của kỳ trước cho cùng MST">{d.goiY} · kỳ trước</span>
                  : <span className="cell-empty">chưa có</span>)}
              </td>
              <td>{(ch.batBuocSoTien ? t?.soTien : t?.lyDo) || <span className="cell-empty">—</span>}</td>
              <td>
                {t
                  ? <Badge tone="positive">Đã nhập</Badge>
                  : <Badge tone={d.quaHan > 0 ? "critical" : "warning"}>Chưa có phản hồi</Badge>}
              </td>
            </tr>;
          })}
          {dong.length === 0 && <tr><td className="table-empty" colSpan={rong.length}>Chưa giao phiếu {ch.loai} nào cho đơn vị này.</td></tr>}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}
