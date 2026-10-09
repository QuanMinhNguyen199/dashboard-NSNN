import { useQL2 } from "@/state/QL2Context";
import type { VaiTro } from "@/domain/types";
import { useMemo, useState } from "react";
import { Badge, Button, DetailGrid, Pager, Panel, SearchField, Segmented, TableWrap, money } from "@/components/ui";
import { CaseLayout } from "@/components/CaseLayout";
import { ONhan, useChonHang } from "@/components/ChonHang";
import { theoDonVi, useBoLoc } from "@/components/BoLoc";
import { useThamSo, useThamSoSo } from "@/state/diaChi";
import { rutGonTenDonVi } from "@/data/danhMuc";
import { bangHeSoK, ngayTonDauK, coCoK, danhSachK, kTinhLai, type HangHeSoK, type KyQL2, type LuotK } from "@/data/ql2";

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

export function BangHeSoK({ ky }: { ky: KyQL2 }) {
  const { chon } = useBoLoc();
  const { vuongMac } = useQL2();
  const [mau, datMau] = useState("noibo");
  const tatCa = useMemo(() => bangHeSoK(ky.hat, vuongMac[ky.id] ?? []), [ky, vuongMac]);
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

  return <Panel chinh={mau === "noibo"}
    title="Cảnh báo hệ số K · theo đơn vị"
    subtitle={`${ky.nhan} · nguồn: hddtcbt, kéo 18:00 hằng ngày`}
    actions={<Segmented label="Mẫu báo cáo K" value={mau} onChange={datMau} options={[{ value: "noibo", label: "Báo cáo nội bộ" }, { value: "qltt3", label: "Mẫu Cục Thuế QLTT3" }]}/>}
  >
    {mau === "qltt3" ? <p className="ql2-note">Mẫu QLTT3 có 35 cột, gồm sheet tháng, 6 tháng, lũy kế và tỷ lệ. Chưa có tệp “2.3. BC_QLTT3…(he so k).xlsx” để đối chiếu tên cột. Ánh xạ cột (15)–(20), (25)–(29) còn chờ Q-102; chưa xuất số theo mẫu này.</p> : <>
    <p className="ql2-note">Ngày giám sát phát sinh lệch 1 ngày so với ngày chốt. “Chờ phê duyệt”, “Lưu tạm” còn chờ Q-98; dữ liệu mô phỏng chỉ dùng hai nhóm đã xác định.</p>
    <TableWrap label="hệ số K theo đơn vị">
      <table className="ql1-table" style={{ minWidth: 1136 }}>
        <colgroup>
          {[260, 160, 150, 150, 160, 128, 128].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead><tr>
          <th scope="col" className="dv-cot">Tên cơ quan thuế</th>
          <th scope="col" className="num">Số lượt cảnh báo tồn đầu kỳ<small>Số liệu ngày {ngayTonDauK(ky)}</small></th>
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

    </>}
  </Panel>;
}

export function DanhSachK({ ky, vaiTro }: { ky: KyQL2; vaiTro: VaiTro }) {
  const { vuongMac, danhDau } = useQL2();
  const [nhom, datNhom] = useThamSo<string>("nhomk", "ton", ["ton", "vuong"]);
  const { chon } = useBoLoc();
  const [chiCo, datChiCo] = useThamSo<"tatca" | "co">("loc", "tatca", ["tatca", "co"]);
  const [trang, datTrang] = useThamSoSo("trang", 1);
  const [tim, datTim] = useState("");
  /* Khóa là MST vì một kỳ chỉ có một lượt cho mỗi MST. */
  const { dangMo, datDangMo, dong, hang } = useChonHang();

  const tatCa = useMemo(() => danhSachK(ky.hat), [ky.hat]);
  const loc = useMemo(() => {
    const q = tim.trim().toLowerCase();
    return theoDonVi(tatCa, chon, (r) => r.dv.ten)
      .filter((r) => r.trangThai === "Chưa xử lý")
      .filter((r) => nhom === "vuong" ? (vuongMac[ky.id] ?? []).includes(r.mst) : !(vuongMac[ky.id] ?? []).includes(r.mst))
      .filter((r) => (chiCo === "tatca" ? true : coCoK(r)))
      .filter((r) => !q || r.mst.includes(q) || r.ten.toLowerCase().includes(q))
      /* Mặc định SỐ NGÀY TỒN giảm dần (§4.5): việc tồn lâu nhất là việc cần
         nhìn trước, không phải việc có mã số thuế nhỏ nhất. */
      .slice()
      .sort((a, b) => b.soNgayTon - a.soNgayTon);
  }, [tatCa, chon, chiCo, tim, nhom, vuongMac, ky.id]);

  const soTrang = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const t = Math.min(trang, soTrang);
  const hien = loc.slice((t - 1) * MOI_TRANG, t * MOI_TRANG);
  const soCo = loc.filter(coCoK).length;
  const luot = useMemo(() => loc.find((r) => r.mst === dangMo) ?? null, [loc, dangMo]);

  return <CaseLayout
    presentation="drawer"
    label={luot ? `Lượt cảnh báo ${luot.mst}` : "Chi tiết lượt cảnh báo"}
    mobileOpen={Boolean(luot)}
    onClose={dong}
    detail={luot ? <ChiTietK r={luot} ky={ky} vaiTro={vaiTro} nhom={nhom} onDanhDau={() => danhDau(ky.id, luot.mst)}/> : null}
  >
    <Panel chinh
    title={nhom === "vuong" ? "Vướng mắc gửi QLRR" : "Lượt cảnh báo còn tồn"}
    subtitle={`${ky.nhan} · ${money(loc.length)} lượt · sắp theo số ngày tồn giảm dần`}
    actions={<div className="inline-controls">
      <Segmented label="Nhóm lượt" value={nhom} onChange={(v) => { datNhom(v); datTrang(1); }} options={[{value:"ton",label:"Lượt còn tồn"},{value:"vuong",label:"Vướng mắc gửi QLRR"}]}/>
      <Segmented
        label="Lọc cờ kiểm tra"
        value={chiCo}
        onChange={(v) => { datChiCo(v); datTrang(1); }}
        options={[{ value: "tatca" as const, label: "Tất cả" }, { value: "co" as const, label: "Chỉ dòng có cờ" }]}
      />
      <SearchField value={tim} onChange={(v) => { datTim(v); datTrang(1); }} placeholder="Tìm MST hoặc tên NNT"/>
    </div>}
  >
    {nhom === "vuong" && <p className="ql2-note">Các lượt gửi QLRR không tính vào tồn cuối kỳ. Đánh dấu được lưu trong phiên demo.</p>}
    {soCo > 0 && <div className="notice warning">
      <strong>{money(soCo)} lượt có cờ kiểm tra</strong>
      {/* Cùng một quy tắc cờ còn xuất hiện trong ngăn chi tiết; hai nơi phải
          nói bằng một câu, nếu không người đọc tưởng là hai quy tắc khác nhau. */}
      <span>K tính lại lệch K hệ thống quá 0,01, hệ số K mặc định không khớp ngưỡng bảng ngành, hoặc mẫu số không lớn hơn 0. Dòng có cờ vẫn giữ nguyên trong báo cáo. Biên so sánh 0,01 chờ Q-15; cách xử lý mẫu số không lớn hơn 0 chờ Q-14.</span>
    </div>}

    {/*
      Bảng GỌN: sáu cột đủ để chọn ra lượt cần xử lý, phần còn lại nằm trong
      ngăn trượt.

      Bản trước bày cả mười ba cột — 2.116px trong khung 1.146px, tức gần một
      nghìn pixel ngoài tầm nhìn. Nhưng việc trên màn này là TRIAGE: tìm lượt
      tồn lâu, có cờ, của cán bộ nào, rồi quyết xử lý hay gửi QLRR. Giá trị
      mua vào, bán ra, tồn kho và ba hệ số K là thứ để đọc KHI đã chọn một
      lượt, không phải thứ để quét qua mười hai dòng.

      Bề rộng cột khai tường minh vì bảng dùng `table-layout: fixed`: không
      khai thì mã số thuế mười chữ số bị cắt thành "010000…".
    */}
    <TableWrap label="lượt cảnh báo hệ số K">
      <table className="ql1-ds-table" style={{ minWidth: vaiTro === "CV" ? 1116 : 916 }}>
        <colgroup>
          {[136, 200, 160, 160, 120, 140, ...(vaiTro === "CV" ? [200] : [])].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead><tr>
          <th scope="col">MST</th>
          <th scope="col">Tên NNT</th>
          <th scope="col">Tên cán bộ quản lý</th>
          <th scope="col">Trạng thái xử lý</th>
          <th scope="col" className="num">Số ngày tồn</th>
          <th scope="col" className="num">K tính lại</th>
          {vaiTro === "CV" && <th scope="col">Vướng mắc QLRR</th>}
        </tr></thead>
        <tbody>
          {hien.map((r) => {
            const k = kTinhLai(r);
            return <tr
              key={r.mst}
              {...hang(r.mst)}
              className={`${coCoK(r) ? "is-co" : ""}${r.mst === dangMo ? " is-selected" : ""}`.trim() || undefined}
            >
              <ONhan id={r.mst} dangMo={dangMo}>{r.mst}</ONhan>
              <td title={r.ten}>{r.ten}</td>
              <td>{r.canBo}</td>
              <td>{r.trangThai}</td>
              <td className="num">{money(r.soNgayTon)}</td>
              <td className="num">
                {k === null ? <span className="cell-empty" title="Chưa tính được K: mua vào lũy kế cộng hàng tồn kho không lớn hơn 0, chờ Q-14">—</span> : k.toFixed(3).replace(".", ",")}
                {coCoK(r) && <> <Badge tone="warning">Cờ</Badge></>}
              </td>
              {vaiTro === "CV" && <td><Button kind="quiet" onClick={(e) => { e.stopPropagation(); danhDau(ky.id, r.mst); }}>{nhom === "vuong" ? "Gỡ đánh dấu" : "Đánh dấu gửi QLRR"}</Button></td>}
            </tr>;
          })}
          {hien.length === 0 && <tr><td className="table-empty" colSpan={vaiTro === "CV" ? 7 : 6}>Không có lượt nào khớp bộ lọc.</td></tr>}
        </tbody>
      </table>
    </TableWrap>
    <Pager trang={t} soTrang={soTrang} onChange={(v) => { datTrang(v); datDangMo(""); }}/>
  </Panel></CaseLayout>;
}

/*
  Chi tiết một lượt cảnh báo — bày ĐỦ mười ba trường của nguồn J21, kể cả
  những trường bảng gọn đã bỏ.

  Ba hệ số K đứng cạnh nhau vì chúng chỉ có nghĩa khi so với nhau: K hệ thống
  là số ứng dụng trả về, K tính lại là số dựng lại từ ba giá trị ngay trên, và
  K mặc định là ngưỡng ngành. Cờ kiểm tra sinh ra từ chính phép so ấy.
*/
/*
  Điều nào đã bật cờ — đọc ngược đúng ba nhánh của `coCoK`.

  Một lượt có thể dính nhiều nhánh cùng lúc, nên trả về danh sách chứ không trả
  về nhánh đầu tiên: nói thiếu một lý do thì người xử lý sửa xong một chỗ, thấy
  cờ vẫn còn và không hiểu vì sao.
*/
function lyDoCo(r: LuotK): string[] {
  const k = kTinhLai(r);
  const ly: string[] = [];
  if (k === null) ly.push("mẫu số không lớn hơn 0 nên chưa tính được K (chờ Q-14)");
  else if (Math.abs(k - r.kHeThong) > 0.01) ly.push("K tính lại lệch K hệ thống quá 0,01");
  if (r.kMacDinh !== r.nguongNganh) ly.push("hệ số K mặc định không khớp ngưỡng bảng ngành");
  return ly;
}

function ChiTietK({ r, ky, vaiTro, nhom, onDanhDau }: {
  r: LuotK;
  ky: KyQL2;
  vaiTro: VaiTro;
  nhom: string;
  onDanhDau: () => void;
}) {
  const k = kTinhLai(r);
  return <div className="ql3-chitiet">
    <p className="ql3-chitiet-ten"><strong>{r.ten}</strong><span>{r.mst} · {rutGonTenDonVi(r.dv.ten)}</span></p>
    <DetailGrid items={[
      { label: "Tên ngành nghề chính", value: r.nganhNghe },
      { label: "Tên cán bộ quản lý", value: r.canBo },
      { label: "Trạng thái xử lý", value: r.trangThai },
      { label: "Số ngày tồn", value: money(r.soNgayTon) },
      { label: "Ngày giám sát", value: ngayTonDauK(ky) },
    ]}/>

    <h3 className="ql3-chitiet-de">Giá trị lũy kế</h3>
    <DetailGrid items={[
      { label: "Giá trị mua vào lũy kế (đồng)", value: <strong>{money(r.muaVao)}</strong> },
      { label: "Giá trị bán ra lũy kế (đồng)", value: <strong>{money(r.banRa)}</strong> },
      { label: "Giá trị hàng tồn kho (đồng)", value: <strong>{money(r.tonKho)}</strong> },
    ]}/>

    <h3 className="ql3-chitiet-de">Hệ số K</h3>
    <DetailGrid items={[
      { label: "Hệ số K mặc định", value: `${r.kMacDinh.toFixed(2).replace(".", ",")} · ngành ${r.nguongNganh} · hiệu lực ${r.ngayHieuLuc}` },
      { label: "Hệ số K hệ thống", value: r.kHeThong.toFixed(3).replace(".", ",") },
      { label: "K tính lại", value: k === null ? "Chưa tính được · mẫu số không lớn hơn 0, chờ Q-14" : k.toFixed(3).replace(".", ",") },
      {
        label: "Cờ kiểm tra",
        /* Lý do bám vào cờ, không nằm trong một đoạn chú thích cuối ngăn: lượt
           sạch thì không có chữ nào, lượt có cờ thì đọc đúng điều đã bật nó —
           thay vì đọc cả ba điều kiện rồi tự đoán điều nào rơi vào mình. */
        value: coCoK(r)
          ? <><Badge tone="warning">Có cờ</Badge><span className="ql3-chitiet-vi">{lyDoCo(r).join("; ")}.</span></>
          : "Không",
      },
    ]}/>

    {vaiTro === "CV" && <div className="duyet-lydo-nut">
      <Button onClick={onDanhDau}>{nhom === "vuong" ? "Gỡ đánh dấu gửi QLRR" : "Đánh dấu gửi QLRR"}</Button>
    </div>}
  </div>;
}
