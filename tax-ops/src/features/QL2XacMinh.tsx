import { useMemo, useState } from "react";
import { Badge, Pager, Panel, SearchField, Segmented, TableWrap, money } from "@/components/ui";
import { theoDonVi, useBoLoc } from "@/components/BoLoc";
import { useThamSo, useThamSoSo } from "@/state/diaChi";
import { rutGonTenDonVi } from "@/data/danhMuc";
import {
  I_DA_TRA, TRANG_THAI_XM, bangXM, daTraXM, danhSachXM, tonXM, tongXM, type HangXM, type KyQL2,
} from "@/data/ql2";

/*
  QL2-04 — Xác minh hóa đơn (§4.6). Khung: chỉ tiêu đã rõ, mẫu chưa về.

  Thanh xếp chồng theo trạng thái là lý do màn này tồn tại chứ không phải trang
  trí [R]. Một con số "tồn 142" không cho biết phải gỡ ở đâu; cùng số ấy tách
  thành 6 nhận / 7 phân công / 8 gửi lãnh đạo / 9 duyệt / 10 từ chối thì nói
  thẳng hồ sơ đang kẹt ở bước nào, và mỗi bước có một người khác nhau xử lý.

  Trạng thái 10 (từ chối) tính vào TỒN, không tính vào đã trả kết quả — bên hỏi
  chưa nhận được gì thì việc chưa xong. Q-16 chưa trả lời; đây là giả định.
*/

const MOI_TRANG = 12;
const hienTyLe = (x: number | null) => (x === null ? "—" : `${(x * 100).toFixed(2).replace(".", ",")}%`);

/* Sáu bậc một tông, đậm dần theo bước — không phải sáu màu rời. Màu rời làm
   người đọc tìm chú thích; một tông đậm dần tự nói "càng về cuối càng xong". */
const SAC_BUOC = ["#cfe0f5", "#a9c8ec", "#7fabe0", "#5a8fd2", "#b3352f", "#187044"];

function ThanhTrangThai({ h }: { h: HangXM }) {
  const tong = tongXM(h);
  if (tong === 0) return <span className="cell-empty">—</span>;
  return <span className="xm-thanh" role="img" aria-label={TRANG_THAI_XM.map((t, i) => `${t.nhan}: ${h.theoTrangThai[i]}`).join(", ")}>
    {TRANG_THAI_XM.map((t, i) => h.theoTrangThai[i] > 0 && <i
      key={t.ma}
      style={{ width: `${(h.theoTrangThai[i] / tong) * 100}%`, background: SAC_BUOC[i] }}
      title={`${t.ma} ${t.nhan}: ${money(h.theoTrangThai[i])}`}
    />)}
  </span>;
}

export function BangXacMinh({ ky }: { ky: KyQL2 }) {
  const { chon } = useBoLoc();
  const tatCa = useMemo(() => bangXM(ky.hat), [ky.hat]);
  const hang = theoDonVi(tatCa, chon, (h) => h.dv.ten);

  const cong = hang.reduce((t, h) => {
    TRANG_THAI_XM.forEach((_, i) => { t.theoTrangThai[i] += h.theoTrangThai[i]; });
    t.quaHan += h.quaHan;
    return t;
  }, { dv: hang[0]?.dv, theoTrangThai: TRANG_THAI_XM.map(() => 0), quaHan: 0 } as HangXM);

  const dong = (nhan: string, h: HangXM, lop?: string) => <tr key={nhan} className={lop}>
    <th scope="row" className="dv-cot" title={nhan}>{nhan}</th>
    <td className="num">{money(tongXM(h))}</td>
    <td className="num">{money(daTraXM(h))}</td>
    <td className="num">{money(tonXM(h))}</td>
    <td className="num">{money(Math.max(0, tonXM(h) - h.quaHan))}</td>
    <td className="num">{money(h.quaHan)}</td>
    {TRANG_THAI_XM.filter((_, i) => i !== I_DA_TRA).map((t, i) => <td key={t.ma} className="num">{money(h.theoTrangThai[i])}</td>)}
    <td className="num">{hienTyLe(tongXM(h) === 0 ? null : daTraXM(h) / tongXM(h))}</td>
    <td><ThanhTrangThai h={h}/></td>
  </tr>;

  return <Panel
    title="Xác minh hóa đơn · theo đơn vị"
    subtitle={`${ky.nhan} · nguồn: csdlnnt, kéo thứ Năm · giữ trạng thái 6–10 và 14 (BR-22, BR-23)`}
  >
    <div className="notice warning">
      <strong>Khung – chờ mẫu báo cáo</strong>
      <span>
        Chỉ tiêu và quy tắc lọc đã có trong §4.6, nhưng phòng chưa gửi mẫu nên thứ tự
        và cách gộp cột còn có thể đổi. Trạng thái 10 (từ chối) đang tính vào Tồn — chờ Q-16.
      </span>
    </div>

    <TableWrap label="xác minh hóa đơn theo đơn vị">
      <table className="ql1-table" style={{ minWidth: 1710 }}>
        <colgroup>
          {[236, 104, 124, 100, 124, 124, 96, 110, 118, 96, 104, 130, 144].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead><tr>
          <th scope="col" className="dv-cot">Tên cơ quan thuế</th>
          <th scope="col" className="num">Tổng</th>
          <th scope="col" className="num">Đã trả kết quả</th>
          <th scope="col" className="num">Tồn</th>
          <th scope="col" className="num">Tồn · trong hạn</th>
          <th scope="col" className="num">Tồn · quá hạn</th>
          {TRANG_THAI_XM.filter((_, i) => i !== I_DA_TRA).map((t) => <th key={t.ma} scope="col" className="num">{t.ma} {t.nhan}</th>)}
          <th scope="col" className="num">Tỷ lệ hoàn thành</th>
          <th scope="col">Đang kẹt ở bước nào</th>
        </tr></thead>
        <tbody>
          {dong("Tổng cộng", cong, "is-tong")}
          {hang.filter((h) => h.dv.nhom === "VP").map((h) => dong(rutGonTenDonVi(h.dv.ten), h))}
          {hang.filter((h) => h.dv.nhom === "TCS").map((h) => dong(h.dv.ten, h))}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}

export function TonQuaHanXM({ ky }: { ky: KyQL2 }) {
  const { chon } = useBoLoc();
  const [pham, datPham] = useThamSo<"quahan" | "sapden">("loc", "quahan", ["quahan", "sapden"]);
  const [trang, datTrang] = useThamSoSo("trang", 1);
  const [tim, datTim] = useState("");

  const tatCa = useMemo(() => danhSachXM(ky.hat), [ky.hat]);
  const loc = useMemo(() => {
    const q = tim.trim().toLowerCase();
    return theoDonVi(tatCa, chon, (r) => r.dv.ten)
      /* "Sắp đến hạn" là ≤ 2 ngày làm việc (§4.2 tab 7) — tức số ngày quá hạn
         còn âm nhưng không quá hai. */
      .filter((r) => (pham === "quahan" ? r.soNgayQuaHan > 0 : r.soNgayQuaHan <= 0 && r.soNgayQuaHan >= -2))
      .filter((r) => !q || r.so.toLowerCase().includes(q) || r.canBo.toLowerCase().includes(q) || r.mstBan.includes(q))
      .slice()
      .sort((a, b) => b.soNgayQuaHan - a.soNgayQuaHan);
  }, [tatCa, chon, pham, tim]);

  const soTrang = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const t = Math.min(trang, soTrang);
  const hien = loc.slice((t - 1) * MOI_TRANG, t * MOI_TRANG);

  return <Panel
    title="Yêu cầu xác minh tồn quá hạn"
    subtitle={`${ky.nhan} · ${money(loc.length)} yêu cầu · theo cán bộ xử lý`}
    actions={<div className="inline-controls">
      <Segmented
        label="Phạm vi"
        value={pham}
        onChange={(v) => { datPham(v); datTrang(1); }}
        options={[{ value: "quahan" as const, label: "Quá hạn" }, { value: "sapden" as const, label: "Sắp đến hạn" }]}
      />
      <SearchField value={tim} onChange={(v) => { datTim(v); datTrang(1); }} placeholder="Tìm số yêu cầu, cán bộ, MST"/>
    </div>}
  >
    <TableWrap label="yêu cầu xác minh tồn quá hạn">
      <table className="ql1-ds-table" style={{ minWidth: 1410 }}>
        <colgroup>
          {[140, 116, 116, 206, 160, 140, 210, 170, 152].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead><tr>
          <th scope="col">Số yêu cầu</th>
          <th scope="col">Ngày gửi</th>
          <th scope="col">Hạn xử lý</th>
          <th scope="col">Đơn vị</th>
          <th scope="col">Cán bộ xử lý</th>
          <th scope="col">MST bên bán</th>
          <th scope="col">Tên bên bán</th>
          <th scope="col">Trạng thái</th>
          <th scope="col" className="num">Ngày quá hạn</th>
        </tr></thead>
        <tbody>
          {hien.map((r) => <tr key={r.so}>
            <td>{r.so}</td>
            <td>{r.ngayGui}</td>
            <td>{r.hanXuLy}</td>
            <td title={r.dv.ten}>{rutGonTenDonVi(r.dv.ten)}</td>
            <td>{r.canBo}</td>
            <td>{r.mstBan}</td>
            <td>{r.tenBan}</td>
            <td>{r.trangThai} {TRANG_THAI_XM.find((t) => t.ma === r.trangThai)?.nhan}</td>
            <td className="num">
              {r.soNgayQuaHan > 0
                ? <Badge tone="critical">quá {r.soNgayQuaHan} ngày</Badge>
                : <Badge tone="warning">còn {Math.abs(r.soNgayQuaHan)} ngày</Badge>}
            </td>
          </tr>)}
          {hien.length === 0 && <tr><td className="table-empty" colSpan={9}>Không có yêu cầu nào khớp bộ lọc.</td></tr>}
        </tbody>
      </table>
    </TableWrap>
    <Pager trang={t} soTrang={soTrang} onChange={datTrang}/>
  </Panel>;
}
