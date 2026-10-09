import { useMemo, useState } from "react";
import { Badge, DetailGrid, Pager, Panel, SearchField, Segmented, TableWrap, money } from "@/components/ui";
import { CaseLayout } from "@/components/CaseLayout";
import { ONhan, useChonHang } from "@/components/ChonHang";
import { theoDonVi, useBoLoc } from "@/components/BoLoc";
import { useThamSo, useThamSoSo } from "@/state/diaChi";
import { rutGonTenDonVi } from "@/data/danhMuc";
import {
  TRANG_THAI_XM, bangXM, daTraXM, danhSachXM, tonXM, tongXM, type HangXM, type KyQL2, type YeuCauXM,
} from "@/data/ql2";

/* §4.6: đếm dòng hóa đơn; trạng thái 10 thuộc tồn, không có trạng thái 9 trên mẫu. */

const MOI_TRANG = 12;
const hienTyLe = (x: number | null) => (x === null ? "—" : `${(x * 100).toFixed(2).replace(".", ",")}%`);

const tenTrangThai = (ma: number) => TRANG_THAI_XM.find((t) => t.ma === ma)?.nhan ?? String(ma);

/*
  Thứ tự cột ĐỌC được, không phải thứ tự của tệp nguồn.

  Mẫu xếp năm trạng thái theo 10 · 14 · 6 · 7 · 8, và bảng cũ chép đúng thứ tự
  ấy. Người đọc nhận về một hàng số không nói được điều gì gom với điều gì,
  trong khi chính chú thích bên dưới lại bảo "Tồn = 6 + 7 + 8 + 10". Bốn trạng
  thái cộng thành tồn thì phải đứng cạnh nhau dưới một tiêu đề nhóm, còn trạng
  thái đã xong đứng riêng — lúc đó công thức không cần viết ra nữa, bảng tự nói.

  Mã số lùi vào `title`: nó là khóa để đối chiếu với tệp nguồn, không phải thứ
  người đọc cần thấy trên mỗi tiêu đề cột.
*/
const CON_TON = [6, 7, 8, 10] as const;
const DA_TRA = 14;

/*
  Lọc theo KHỐI — Văn phòng Thuế TP Hà Nội và Thuế cơ sở.

  Bảng vẫn xếp Văn phòng trước, Thuế cơ sở sau, nhưng xếp không thay được lọc:
  khối Thuế cơ sở có 25 đơn vị, nên muốn chỉ đọc năm phòng Văn phòng thì phải
  bỏ qua hai mươi lăm dòng bằng mắt. Thanh lọc chung chọn được từng đơn vị,
  không chọn được cả khối — tick đủ 25 ô là một việc khác hẳn.

  Đây là chiều phân nhóm có sẵn trong danh mục đơn vị, không phải một cách
  chia bản mẫu tự nghĩ ra: nó chính là hai dòng khối của báo cáo QL4-01.
*/
const KHOI = [
  { id: "", nhan: "Tất cả" },
  { id: "VP", nhan: "Khối Văn phòng Thuế TP Hà Nội" },
  { id: "TCS", nhan: "Khối Thuế cơ sở" },
] as const;

type MaKhoi = (typeof KHOI)[number]["id"];

function OChonKhoi({ khoi, datKhoi }: { khoi: MaKhoi; datKhoi: (v: MaKhoi) => void }) {
  return <label className="compact-field"><span>Khối</span>
    <select value={khoi} onChange={(e) => datKhoi(e.target.value as MaKhoi)}>
      {KHOI.map((k) => <option key={k.id} value={k.id}>{k.nhan}</option>)}
    </select>
  </label>;
}

export function BangXacMinh({ ky }: { ky: KyQL2 }) {
  const { chon } = useBoLoc();
  const [khoi, datKhoi] = useThamSo<MaKhoi>("khoi", "", ["", "VP", "TCS"]);
  const tatCa = useMemo(() => bangXM(ky.hat), [ky.hat]);
  const hang = theoDonVi(tatCa, chon, (h) => h.dv.ten).filter((h) => !khoi || h.dv.nhom === khoi);

  const cong = hang.reduce((t, h) => {
    TRANG_THAI_XM.forEach((_, i) => { t.theoTrangThai[i] += h.theoTrangThai[i]; });
    t.quaHan += h.quaHan;
    return t;
  }, { dv: hang[0]?.dv, theoTrangThai: TRANG_THAI_XM.map(() => 0), quaHan: 0 } as HangXM);

  const dem = (h: HangXM, ma: number) => h.theoTrangThai[TRANG_THAI_XM.findIndex((t) => t.ma === ma)];

  const dong = (nhan: string, h: HangXM, lop?: string) => <tr key={nhan} className={lop}>
    <th scope="row" className="dv-cot" title={nhan}>{nhan}</th>
    {CON_TON.map((ma) => <td key={ma} className="num">{money(dem(h, ma))}</td>)}
    <td className="num">{money(tonXM(h))}</td>
    <td className="num">{money(daTraXM(h))}</td>
    <td className="num">{money(tongXM(h))}</td>
    <td className="num">{hienTyLe(tongXM(h) === 0 ? null : daTraXM(h) / tongXM(h))}</td>
  </tr>;

  return <Panel chinh
    title="Xác minh hóa đơn · theo đơn vị"
    subtitle={`${ky.nhan} · nguồn: csdlnnt, kéo thứ Năm · lũy kế từ 2022 · đếm theo dòng hóa đơn`}
    actions={<div className="inline-controls"><OChonKhoi khoi={khoi} datKhoi={datKhoi}/></div>}
  >
    <p className="ql2-note">Mỗi con số là một dòng hóa đơn, đếm theo trạng thái đang đứng trên csdlnnt. Tỷ lệ hoàn thành là phần đã trả kết quả trên tổng cộng. Dữ liệu mô phỏng; nguồn chi tiết TCS và khóa loại trùng còn chờ Q-104, Q-17.</p>
    <TableWrap label="xác minh hóa đơn theo đơn vị">
      <table className="ql1-table" style={{ minWidth: 1140 }}>
        <colgroup>
          {[210, 96, 112, 130, 104, 104, 140, 112, 132].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="dv-cot" rowSpan={2}>Tên cơ quan thuế</th>
            <th scope="colgroup" className="nhom" colSpan={5}>Còn tồn</th>
            <th scope="col" className="num" rowSpan={2} title="Trạng thái 14 trên mẫu">Đã trả kết quả</th>
            <th scope="col" className="num" rowSpan={2}>Tổng cộng</th>
            <th scope="col" className="num" rowSpan={2}>Tỷ lệ hoàn thành</th>
          </tr>
          <tr>
            {CON_TON.map((ma) => <th key={ma} scope="col" className="num" title={`Trạng thái ${ma} trên mẫu`}>{tenTrangThai(ma)}</th>)}
            <th scope="col" className="num">Cộng tồn</th>
          </tr>
        </thead>
        <tbody>
          {/* Dòng tổng cộng thì tổng của ĐANG XEM, không phải của toàn ngành:
              lọc còn một khối mà dòng tổng vẫn cộng cả hai thì mọi phép so
              dòng-với-tổng trên màn đều sai. */}
          {dong(khoi ? `Cộng ${KHOI.find((k) => k.id === khoi)?.nhan}` : "Tổng cộng", cong, "is-tong")}
          {hang.filter((h) => h.dv.nhom === "VP").map((h) => dong(rutGonTenDonVi(h.dv.ten), h))}
          {hang.filter((h) => h.dv.nhom === "TCS").map((h) => dong(h.dv.ten, h))}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}

export function TonQuaHanXM({ ky }: { ky: KyQL2 }) {
  const { chon } = useBoLoc();
  const [pham, datPham] = useThamSo<"tatca" | "quahan" | "sapden">("loc", "tatca", ["tatca", "quahan", "sapden"]);
  const [trang, datTrang] = useThamSoSo("trang", 1);
  const [tim, datTim] = useState("");
  const [khoi, datKhoi] = useThamSo<MaKhoi>("khoi", "", ["", "VP", "TCS"]);
  const { dangMo, datDangMo, dong, hang } = useChonHang();

  const tatCa = useMemo(() => danhSachXM(ky.hat), [ky.hat]);
  const loc = useMemo(() => {
    const q = tim.trim().toLowerCase();
    return theoDonVi(tatCa, chon, (r) => r.dv.ten)
      .filter((r) => !khoi || r.dv.nhom === khoi)
      .filter((r) => r.trangThai !== DA_TRA)
      /* "Sắp đến hạn" là bộ lọc tiện ích ≤ 2 ngày lịch, không phải quy tắc nghiệp vụ đã chốt — tức số ngày quá hạn
         còn âm nhưng không quá hai. */
      .filter((r) => (pham === "tatca" ? true : pham === "quahan" ? r.soNgayQuaHan > 0 : r.soNgayQuaHan <= 0 && r.soNgayQuaHan >= -2))
      .filter((r) => !q || r.soHoaDon.toLowerCase().includes(q) || r.so.toLowerCase().includes(q) || r.canBo.toLowerCase().includes(q) || r.mstBan.includes(q))
      .slice()
      .sort((a, b) => b.soNgayQuaHan - a.soNgayQuaHan);
  }, [tatCa, chon, khoi, pham, tim]);

  const soTrang = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const t = Math.min(trang, soTrang);
  const hien = loc.slice((t - 1) * MOI_TRANG, t * MOI_TRANG);
  const yeuCau = useMemo(() => loc.find((r) => r.soHoaDon === dangMo) ?? null, [loc, dangMo]);

  return <CaseLayout
    presentation="drawer"
    label={yeuCau ? `Hóa đơn ${yeuCau.soHoaDon}` : "Chi tiết yêu cầu xác minh"}
    mobileOpen={Boolean(yeuCau)}
    onClose={dong}
    detail={yeuCau ? <ChiTietXM r={yeuCau}/> : null}
  >
    <Panel chinh
      title="Hóa đơn còn tồn xác minh"
      subtitle={`${ky.nhan} · ${money(loc.length)} dòng hóa đơn · theo cán bộ xử lý`}
      actions={<div className="inline-controls">
        <OChonKhoi khoi={khoi} datKhoi={(v) => { datKhoi(v); datTrang(1); datDangMo(""); }}/>
        <Segmented
          label="Phạm vi"
          value={pham}
          onChange={(v) => { datPham(v); datTrang(1); datDangMo(""); }}
          options={[{ value: "tatca" as const, label: "Tất cả còn tồn" }, { value: "quahan" as const, label: "Quá hạn" }, { value: "sapden" as const, label: "Sắp đến hạn" }]}
        />
        <SearchField value={tim} onChange={(v) => { datTim(v); datTrang(1); datDangMo(""); }} placeholder="Tìm số yêu cầu, cán bộ, MST"/>
      </div>}
    >
      {/*
        Sáu cột đủ để CHỌN ra yêu cầu cần đòi: ai đang giữ, ở đơn vị nào, đang
        dừng ở trạng thái nào và quá hạn bao lâu. Bên bán, ngày gửi và hạn xử
        lý là thứ đọc khi đã chọn — bày cả mười cột thì bảng rộng 1.550px trong
        khung 1.146px, mà bốn cột thừa ra không đổi được quyết định nào.
      */}
      <TableWrap label="yêu cầu xác minh tồn quá hạn">
        <table className="ql1-ds-table" style={{ minWidth: 966 }}>
          <colgroup>
            {[150, 140, 206, 160, 160, 150].map((w, i) => <col key={i} style={{ width: w }}/>)}
          </colgroup>
          <thead><tr>
            <th scope="col">Số hóa đơn</th>
            <th scope="col">Số yêu cầu</th>
            <th scope="col">Đơn vị</th>
            <th scope="col">Cán bộ xử lý</th>
            <th scope="col">Trạng thái</th>
            <th scope="col" className="num">Ngày quá hạn</th>
          </tr></thead>
          <tbody>
            {hien.map((r) => <tr key={r.soHoaDon} {...hang(r.soHoaDon)}>
              <ONhan id={r.soHoaDon} dangMo={dangMo}>{r.soHoaDon}</ONhan>
              <td>{r.so}</td>
              <td title={r.dv.ten}>{rutGonTenDonVi(r.dv.ten)}</td>
              <td>{r.canBo}</td>
              <td title={`Trạng thái ${r.trangThai} trên mẫu`}>{tenTrangThai(r.trangThai)}</td>
              <td className="num">
                {r.soNgayQuaHan > 0
                  ? <Badge tone="critical">quá {r.soNgayQuaHan} ngày</Badge>
                  : <Badge tone="warning">còn {Math.abs(r.soNgayQuaHan)} ngày</Badge>}
              </td>
            </tr>)}
            {hien.length === 0 && <tr><td className="table-empty" colSpan={6}>Không có hóa đơn nào khớp bộ lọc.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
      <Pager trang={t} soTrang={soTrang} onChange={(v) => { datTrang(v); datDangMo(""); }}/>
    </Panel>
  </CaseLayout>;
}

function ChiTietXM({ r }: { r: YeuCauXM }) {
  return <div className="ql3-chitiet">
    <p className="ql3-chitiet-ten"><strong>Yêu cầu {r.so}</strong><span>Hóa đơn {r.soHoaDon} · {rutGonTenDonVi(r.dv.ten)}</span></p>
    <DetailGrid items={[
      { label: "Trạng thái", value: tenTrangThai(r.trangThai) },
      { label: "Cán bộ xử lý", value: r.canBo },
      { label: "Ngày gửi", value: r.ngayGui },
      { label: "Hạn xử lý", value: r.hanXuLy },
      {
        label: "Ngày quá hạn",
        value: r.soNgayQuaHan > 0
          ? <Badge tone="critical">quá {r.soNgayQuaHan} ngày</Badge>
          : <Badge tone="warning">còn {Math.abs(r.soNgayQuaHan)} ngày</Badge>,
      },
    ]}/>

    <h3 className="ql3-chitiet-de">Bên bán trên hóa đơn</h3>
    <DetailGrid items={[
      { label: "MST bên bán", value: r.mstBan },
      { label: "Tên bên bán", value: r.tenBan },
    ]}/>
  </div>;
}
