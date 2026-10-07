import { useMemo, useState } from "react";
import { Badge, Pager, Panel, SearchField, Segmented, TableWrap, money } from "@/components/ui";
import { theoDonVi, useBoLoc } from "@/components/BoLoc";
import { useThamSo, useThamSoSo } from "@/state/diaChi";
import { rutGonTenDonVi } from "@/data/danhMuc";
import { bangHeSoK, coCoK, danhSachK, kTinhLai, type HangHeSoK, type KyQL2 } from "@/data/ql2";

/*
  QL2-02 — Cảnh báo hệ số K (§4.5).

  Bảng là một LUỒNG XỬ LÝ chứ không phải một ảnh chụp: tồn đầu kỳ, phát sinh
  trong kỳ, đã xử lý trong kỳ, tồn cuối kỳ. Bốn cột ấy phải cân —
  tồn cuối = tồn đầu + phát sinh − đã xử lý — và màn hình kiểm phép cân ấy
  thay vì tin vào nguồn, vì đây đúng là chỗ một kỳ bị kéo sai sẽ lộ ra.

  Tiêu đề hai cột tồn CHỨA NGÀY ("Số liệu ngày 22/09/2026") [F], nên nhãn phải
  đổi theo kỳ lọc chứ không viết cứng.
*/

const MOI_TRANG = 12;

const tyLe = (tu: number, mau: number) => (mau <= 0 ? null : tu / mau);
const hienTyLe = (x: number | null) => (x === null ? "—" : `${(x * 100).toFixed(2).replace(".", ",")}%`);

/** Ngày đầu kỳ hiện trên tiêu đề cột tồn đầu — lùi một nhịp so với ngày chốt. */
const ngayDauKy = (ky: KyQL2) => {
  const [d, m, y] = ky.ngayChot.split("/").map(Number);
  const t = new Date(y, m - 1, d);
  t.setDate(t.getDate() - (ky.loai === "NGAY" ? 1 : ky.loai === "TUAN" ? 7 : 30));
  const hai = (n: number) => String(n).padStart(2, "0");
  return `${hai(t.getDate())}/${hai(t.getMonth() + 1)}/${t.getFullYear()}`;
};

export function BangHeSoK({ ky }: { ky: KyQL2 }) {
  const { chon } = useBoLoc();
  const tatCa = useMemo(() => bangHeSoK(ky.hat), [ky.hat]);
  const hang = theoDonVi(tatCa, chon, (h) => h.dv.ten);

  const vp = hang.filter((h) => h.dv.nhom === "VP");
  const tcs = hang.filter((h) => h.dv.nhom === "TCS");

  const congNhom = (ds: HangHeSoK[]) => ds.reduce(
    (t, h) => ({ tonDau: t.tonDau + h.tonDau, phatSinh: t.phatSinh + h.phatSinh, daXuLy: t.daXuLy + h.daXuLy }),
    { tonDau: 0, phatSinh: 0, daXuLy: 0 },
  );

  const o = (h: { tonDau: number; phatSinh: number; daXuLy: number }) => {
    const mau = h.tonDau + h.phatSinh;
    return <>
      <td className="num">{money(h.tonDau)}</td>
      <td className="num">{money(h.phatSinh)}</td>
      <td className="num">{money(h.daXuLy)}</td>
      <td className="num">{money(h.tonDau + h.phatSinh - h.daXuLy)}</td>
      <td className="num">{hienTyLe(tyLe(h.daXuLy, mau))}</td>
      <td className="num">{hienTyLe(mau <= 0 ? null : 1 - h.daXuLy / mau)}</td>
    </>;
  };

  return <Panel
    title="Cảnh báo hệ số K · theo đơn vị"
    subtitle={`${ky.nhan} · nguồn: hddtcbt, kéo 18:00 hằng ngày`}
  >
    <TableWrap label="hệ số K theo đơn vị">
      <table className="ql1-table" style={{ minWidth: 1136 }}>
        <colgroup>
          {[260, 160, 150, 150, 160, 128, 128].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead><tr>
          <th scope="col" className="dv-cot">Tên cơ quan thuế</th>
          <th scope="col" className="num">Số lượt cảnh báo tồn đầu kỳ<small>Số liệu ngày {ngayDauKy(ky)}</small></th>
          <th scope="col" className="num">Số lượt cảnh báo phát sinh trong kỳ</th>
          <th scope="col" className="num">Số lượt cảnh báo đã xử lý trong kỳ</th>
          <th scope="col" className="num">Số lượt cảnh báo tồn cuối kỳ<small>Số liệu ngày {ky.ngayChot}</small></th>
          <th scope="col" className="num">Tỉ lệ đã xử lý trong kỳ</th>
          <th scope="col" className="num">Tỷ lệ chưa xử lý trong kỳ</th>
        </tr></thead>
        <tbody>
          <tr className="is-tong">
            <th scope="row" className="dv-cot">Tổng Cộng CCT</th>
            {o(congNhom(hang))}
          </tr>
          {vp.length > 0 && <tr className="is-khoi"><th scope="row" className="dv-cot">VP CCT</th>{o(congNhom(vp))}</tr>}
          {vp.map((h) => <tr key={h.dv.id}>
            <th scope="row" className="dv-cot" title={h.dv.ten}>{rutGonTenDonVi(h.dv.ten)}</th>
            {o(h)}
          </tr>)}
          {tcs.length > 0 && <tr className="is-khoi"><th scope="row" className="dv-cot">Các Thuế cơ sở</th>{o(congNhom(tcs))}</tr>}
          {tcs.map((h) => <tr key={h.dv.id}>
            <th scope="row" className="dv-cot">{h.dv.ten}</th>
            {o(h)}
          </tr>)}
        </tbody>
      </table>
    </TableWrap>

    {/* Phép cân của bảng, nói thẳng thay vì để người đọc tự cộng lại. */}
  </Panel>;
}

export function DanhSachK({ ky }: { ky: KyQL2 }) {
  const { chon } = useBoLoc();
  const [chiCo, datChiCo] = useThamSo<"tatca" | "co">("loc", "tatca", ["tatca", "co"]);
  const [trang, datTrang] = useThamSoSo("trang", 1);
  const [tim, datTim] = useState("");

  const tatCa = useMemo(() => danhSachK(ky.hat), [ky.hat]);
  const loc = useMemo(() => {
    const q = tim.trim().toLowerCase();
    return theoDonVi(tatCa, chon, (r) => r.dv.ten)
      .filter((r) => (chiCo === "tatca" ? true : coCoK(r)))
      .filter((r) => !q || r.mst.includes(q) || r.ten.toLowerCase().includes(q))
      /* Mặc định SỐ NGÀY TỒN giảm dần (§4.5): việc tồn lâu nhất là việc cần
         nhìn trước, không phải việc có mã số thuế nhỏ nhất. */
      .slice()
      .sort((a, b) => b.soNgayTon - a.soNgayTon);
  }, [tatCa, chon, chiCo, tim]);

  const soTrang = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const t = Math.min(trang, soTrang);
  const hien = loc.slice((t - 1) * MOI_TRANG, t * MOI_TRANG);
  const soCo = loc.filter(coCoK).length;

  return <Panel
    title="Lượt cảnh báo còn tồn"
    subtitle={`${ky.nhan} · ${money(loc.length)} lượt · sắp theo số ngày tồn giảm dần`}
    actions={<div className="inline-controls">
      <Segmented
        label="Lọc cờ kiểm tra"
        value={chiCo}
        onChange={(v) => { datChiCo(v); datTrang(1); }}
        options={[{ value: "tatca" as const, label: "Tất cả" }, { value: "co" as const, label: "Chỉ dòng có cờ" }]}
      />
      <SearchField value={tim} onChange={(v) => { datTim(v); datTrang(1); }} placeholder="Tìm MST hoặc tên NNT"/>
    </div>}
  >
    {soCo > 0 && <div className="notice warning">
      <strong>{money(soCo)} lượt có cờ kiểm tra</strong>
      <span>K tính lại lệch K hệ thống quá 0,01, hoặc mẫu số bằng 0. Dòng vẫn giữ nguyên trong báo cáo. Biên so sánh chờ Q-15, mẫu số ≤ 0 chờ Q-14.</span>
    </div>}

    {/*
      Bề rộng cột khai tường minh vì bảng dùng `table-layout: fixed`: không khai
      thì 12 cột chia đều 1150px và mã số thuế mười chữ số bị cắt thành
      "010000…". Cột chữ rộng theo chữ dài nhất nó phải chứa, cột số theo con
      số dài nhất — chứ không phải chia đều cho đẹp.
    */}
    <TableWrap label="lượt cảnh báo hệ số K">
      <table className="ql1-ds-table" style={{ minWidth: 1916 }}>
        <colgroup>
          {[136, 180, 284, 150, 152, 152, 152, 140, 150, 140, 160, 120].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead><tr>
          <th scope="col">MST</th>
          <th scope="col">Tên NNT</th>
          <th scope="col">Tên ngành nghề chính</th>
          <th scope="col">Tên cán bộ quản lý</th>
          <th scope="col" className="num">Giá trị mua vào lũy kế</th>
          <th scope="col" className="num">Giá trị bán ra lũy kế</th>
          <th scope="col" className="num">Giá trị hàng tồn kho</th>
          <th scope="col" className="num">Hệ số K mặc định</th>
          <th scope="col" className="num">Hệ số K hệ thống</th>
          <th scope="col" className="num">K tính lại</th>
          <th scope="col">Trạng thái xử lý</th>
          <th scope="col" className="num">Số ngày tồn</th>
        </tr></thead>
        <tbody>
          {hien.map((r) => {
            const k = kTinhLai(r);
            return <tr key={r.mst} className={coCoK(r) ? "is-co" : undefined}>
              <td>{r.mst}</td>
              <td>{r.ten}</td>
              <td>{r.nganhNghe}</td>
              <td>{r.canBo}</td>
              <td className="num">{money(r.muaVao)}</td>
              <td className="num">{money(r.banRa)}</td>
              <td className="num">{money(r.tonKho)}</td>
              <td className="num">{r.kMacDinh.toFixed(2).replace(".", ",")}</td>
              <td className="num">{r.kHeThong.toFixed(3).replace(".", ",")}</td>
              <td className="num">
                {k === null ? <span className="cell-empty" title="Mẫu số bằng 0 — chờ Q-14">—</span> : k.toFixed(3).replace(".", ",")}
                {coCoK(r) && <> <Badge tone="warning">Cờ</Badge></>}
              </td>
              <td>{r.trangThai}</td>
              <td className="num">{money(r.soNgayTon)}</td>
            </tr>;
          })}
          {hien.length === 0 && <tr><td className="table-empty" colSpan={12}>Không có lượt nào khớp bộ lọc.</td></tr>}
        </tbody>
      </table>
    </TableWrap>
    <Pager trang={t} soTrang={soTrang} onChange={datTrang}/>
  </Panel>;
}
