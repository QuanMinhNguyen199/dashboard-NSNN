import { useMemo, useState } from "react";
import { Badge, DetailGrid, Pager, Panel, SearchField, Segmented, TableWrap, money } from "@/components/ui";
import { CaseLayout } from "@/components/CaseLayout";
import { ONhan, useChonHang } from "@/components/ChonHang";
import { theoDonVi, useBoLoc } from "@/components/BoLoc";
import { useThamSo, useThamSoSo } from "@/state/diaChi";
import { rutGonTenDonVi } from "@/data/danhMuc";
import type { VaiTro } from "@/domain/types";
import {
  BAC_DIEM, COT_KIEM_TRA, KET_QUA_PRS05, LOAI_VENH, TRANG_THAI_KDT,
  bacCua, bangQL4_01, binhQuanQuaHan, canCapSo, chuaCapSo, dangXuLy, danhSachHoSo, danhSachVenh,
  tongTiepNhan, tyLeQuaHan, tyLeTuDong, type HangQL4_01, type HoSoHoan, type HoSoVenh, type KyQL4,
} from "@/data/ql4";

/*
  QL4-01 — Tiến độ giải quyết hồ sơ hoàn thuế TNCN (§5.4).

  Mẫu có 30 cột trên BỐN tầng tiêu đề, trong đó 12 cột là trạng thái ký điện
  tử chia hai nhóm (thủ công và tự động). Hiện cả 30 cột cùng lúc thì sáu cột
  người dùng thật sự theo dõi hằng tuần — tiếp nhận, đang xử lý, cấp số, tỷ
  lệ, xếp hạng, điểm — chìm giữa mười hai cột họ chỉ mở khi có hồ sơ kẹt.

  Nên hai nhóm KĐT THU GỌN mặc định (§5.4). Thu gọn không phải ẩn: cột gộp
  vẫn hiện tổng của nhóm, và bấm là mở ra sáu cột chi tiết.

  Mẫu còn đánh SỐ CỘT TRÙNG — 8, 9, 10 xuất hiện hai lần — và có hai cột tỷ lệ
  chưa rõ nghĩa [F]. Màn hình đánh mã cột duy nhất và gắn chú thích; tệp xuất
  ra giữ nguyên cách đánh số của mẫu để mở cạnh file của phòng vẫn khớp.
*/

const MOI_TRANG = 12;
const hienTyLe = (x: number | null) => (x === null ? "—" : `${(x * 100).toFixed(2).replace(".", ",")}%`);

/* ── Tab 1 · Báo cáo tuần chuẩn ──────────────────────────────────────────── */

export function BangQL4_01({ ky, onMoChiTiet }: { ky: KyQL4; onMoChiTiet: (muc: string) => void }) {
  const { chon } = useBoLoc();
  const [cot, datCot] = useThamSo<"gon" | "day">("cot", "gon", ["gon", "day"]);
  const tatCa = useMemo(() => bangQL4_01(ky.hat), [ky.hat]);
  const hang = theoDonVi(tatCa, chon, (h) => h.dv.ten);

  const bq = binhQuanQuaHan(hang);
  const vp = hang.filter((h) => h.dv.nhom === "VP");
  const tcs = hang.filter((h) => h.dv.nhom === "TCS");

  /* Xếp hạng tính TRONG TỪNG KHỐI (§5.4): một phòng Văn phòng xử lý gấp mười
     lần một Thuế cơ sở, xếp chung một bảng thì thứ hạng nói về quy mô chứ
     không nói về tiến độ. */
  const hangCua = (h: HangQL4_01) => {
    const khoi = (h.dv.nhom === "VP" ? vp : tcs)
      .slice()
      .sort((a, b) => (tyLeQuaHan(a) ?? 1) - (tyLeQuaHan(b) ?? 1));
    return khoi.findIndex((x) => x.dv.id === h.dv.id) + 1;
  };

  const diemCua = (h: HangQL4_01) => {
    const t = tyLeQuaHan(h);
    return t === null || bq === null ? null : bacCua(t - bq);
  };

  const congNhom = (ds: HangQL4_01[]): HangQL4_01 => ({
    dv: ds[0]?.dv ?? hang[0].dv,
    tuDongCoRaSoat: ds.reduce((t, h) => t + h.tuDongCoRaSoat, 0),
    tuDong: ds.reduce((t, h) => t + h.tuDong, 0),
    thuCong: ds.reduce((t, h) => t + h.thuCong, 0),
    dangXuLyTrongHan: ds.reduce((t, h) => t + h.dangXuLyTrongHan, 0),
    dangXuLyQuaHan: ds.reduce((t, h) => t + h.dangXuLyQuaHan, 0),
    kdtThuCong: TRANG_THAI_KDT.map((_, i) => ds.reduce((t, h) => t + h.kdtThuCong[i], 0)),
    kdtTuDong: TRANG_THAI_KDT.map((_, i) => ds.reduce((t, h) => t + h.kdtTuDong[i], 0)),
    daCapSo: ds.reduce((t, h) => t + h.daCapSo, 0),
    hoSoVenh: ds.reduce((t, h) => t + h.hoSoVenh, 0),
  });

  const oSo = (h: HangQL4_01, xep: number | null) => {
    const bac = diemCua(h);
    const duoiBQ = bq !== null && (tyLeQuaHan(h) ?? 0) > bq;
    return <>
      <td className="num">{money(tongTiepNhan(h))}</td>
      <td className="num">{money(h.tuDongCoRaSoat)}</td>
      <td className="num">{money(h.tuDong)}</td>
      <td className="num">{money(h.thuCong)}</td>
      <td className="num"><button type="button" className="o-so" onClick={() => onMoChiTiet(h.dv.nhom === "VP" ? "dxvp" : "dxtcs")}>{money(dangXuLy(h))}</button></td>
      <td className="num">{money(h.dangXuLyTrongHan)}</td>
      <td className="num">{money(h.dangXuLyQuaHan)}</td>
      {cot === "gon"
        ? <>
            <td className="num">{money(h.kdtThuCong.reduce((t, x) => t + x, 0))}</td>
            <td className="num">{money(h.kdtTuDong.reduce((t, x) => t + x, 0))}</td>
          </>
        : <>
            {h.kdtThuCong.map((x, i) => <td key={`tc${i}`} className="num">{money(x)}</td>)}
            {h.kdtTuDong.map((x, i) => <td key={`td${i}`} className="num">{money(x)}</td>)}
          </>}
      <td className="num">{money(canCapSo(h))}</td>
      <td className="num">{money(h.daCapSo)}</td>
      <td className="num">{money(chuaCapSo(h))}</td>
      <td className="num">
        {/* Đơn vị kém hơn bình quân được đánh dấu bằng CHIP, không chỉ bằng
            màu nền — màu một mình không đọc được với người mù màu và biến
            mất khi in đen trắng [R]. */}
        {hienTyLe(tyLeQuaHan(h))}
        {duoiBQ && <> <Badge tone="critical">trên BQ</Badge></>}
      </td>
      <td className="num">{hienTyLe(tyLeTuDong(h))}</td>
      <td className="num"><button type="button" className="o-so" onClick={() => onMoChiTiet("venh")}>{money(h.hoSoVenh)}</button></td>
      <td className="num">{xep === null ? "—" : xep}</td>
      <td className="num" title={bac?.nhan}>{bac === null ? "—" : bac.diem.toFixed(1).replace(".", ",")}</td>
    </>;
  };

  const soCotKDT = cot === "gon" ? 2 : 12;
  const rong = [240, 112, 118, 128, 112, 124, 118, 118,
    ...(cot === "gon" ? [150, 150] : Array.from({ length: 12 }, () => 268)),
    126, 112, 118, 150, 150, 120, 96, 96];

  return <Panel chinh
    title="Tiến độ giải quyết hồ sơ hoàn thuế TNCN"
    subtitle={`${ky.nhan} · nguồn: TMS 1.5.1 và 6.29.1, kéo thứ Năm`}
    actions={<Segmented
      label="Nhóm cột ký điện tử"
      value={cot}
      onChange={datCot}
      options={[{ value: "gon" as const, label: "Thu gọn KĐT" }, { value: "day" as const, label: "Mở 12 cột KĐT" }]}
    />}
  >
    <TableWrap label="tiến độ giải quyết hồ sơ hoàn thuế TNCN">
      <table
        className="ql1-table ql2-01-table"
        style={{ minWidth: rong.reduce((t, x) => t + x, 0) }}
      >
        <colgroup>{rong.map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
        <thead>
          <tr>
            <th scope="col" className="dv-cot" rowSpan={2}>Tên cơ quan thuế</th>
            <th scope="colgroup" className="nhom" colSpan={4}>Tổng số hồ sơ tiếp nhận</th>
            <th scope="colgroup" className="nhom" colSpan={3}>Đang xử lý</th>
            <th scope="colgroup" className="nhom" colSpan={soCotKDT}>Trạng thái ký điện tử</th>
            <th scope="colgroup" className="nhom" colSpan={3}>Cấp số</th>
            <th scope="colgroup" className="nhom" colSpan={3}>Tỷ lệ và hồ sơ vênh</th>
            <th scope="colgroup" className="nhom" colSpan={2}>Đánh giá</th>
          </tr>
          <tr>
            <th scope="col" className="num">Cộng</th>
            <th scope="col" className="num">Tự động có rà soát</th>
            <th scope="col" className="num">Tự động</th>
            <th scope="col" className="num">Thủ công</th>
            <th scope="col" className="num">Cộng</th>
            <th scope="col" className="num">Trong hạn</th>
            <th scope="col" className="num">Quá hạn</th>
            {cot === "gon"
              ? <>
                  <th scope="col" className="num">Nhóm thủ công</th>
                  <th scope="col" className="num">Nhóm tự động</th>
                </>
              : <>
                  {TRANG_THAI_KDT.map((t) => <th key={`tc-${t}`} scope="col" className="num">Thủ công · {t}</th>)}
                  {TRANG_THAI_KDT.map((t) => <th key={`td-${t}`} scope="col" className="num">Tự động · {t}</th>)}
                </>}
            <th scope="col" className="num">Tổng hồ sơ cần cấp số</th>
            <th scope="col" className="num">Đã cấp số</th>
            <th scope="col" className="num">Chưa cấp số</th>
            <th scope="col" className="num">Tỷ lệ hồ sơ quá hạn</th>
            <th scope="col" className="num">Tỷ lệ tiếp nhận và xử lý tự động</th>
            <th scope="col" className="num">Hồ sơ vênh 1.5.1 – 6.29.1</th>
            <th scope="col" className="num">Xếp hạng</th>
            <th scope="col" className="num">Chấm điểm</th>
          </tr>
          {/*
            Số cột theo mẫu. Mẫu đánh TRÙNG 8, 9, 10 ở hai nhóm khác nhau và
            có hai cột tỷ lệ chưa rõ nghĩa (Q-88); ở đây mỗi cột mang một mã
            duy nhất, còn tệp xuất ra giữ nguyên cách đánh số của mẫu.
          */}
          <tr className="cot-so">
            <th scope="col" className="dv-cot">Mã cột</th>
            <th scope="col" title="(1) = (2) + (3) + thủ công">(1)</th>
            <th scope="col">(2)</th>
            <th scope="col">(3)</th>
            <th scope="col">(4)</th>
            <th scope="col" title="(5) = (6) + (7)">(5)</th>
            <th scope="col">(6)</th>
            <th scope="col">(7)</th>
            {cot === "gon"
              ? <><th scope="col">(8–13)</th><th scope="col">(14–19)</th></>
              : <>
                  {TRANG_THAI_KDT.map((_, i) => <th key={`n-tc${i}`} scope="col">({8 + i})</th>)}
                  {TRANG_THAI_KDT.map((_, i) => <th key={`n-td${i}`} scope="col">({14 + i})</th>)}
                </>}
            <th scope="col" title="Mẫu đánh số 8 lần thứ hai (Q-88)">(C1)</th>
            <th scope="col" title="Mẫu đánh số 9 lần thứ hai">(C2)</th>
            <th scope="col" title="Mẫu đánh số 10 lần thứ hai">(C3)</th>
            <th scope="col">(20)</th>
            <th scope="col">(23)</th>
            <th scope="col">(V)</th>
            <th scope="col">(AC)</th>
            <th scope="col">(AD)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="is-tong">
            <th scope="row" className="dv-cot">Tổng địa bàn Hà Nội</th>
            {oSo(congNhom(hang), null)}
          </tr>
          {vp.length > 0 && <tr className="is-khoi">
            <th scope="row" className="dv-cot">Khối Văn phòng Thuế TP Hà Nội (0101)</th>
            {oSo(congNhom(vp), null)}
          </tr>}
          {vp.map((h) => <tr key={h.dv.id}>
            <th scope="row" className="dv-cot" title={h.dv.ten}>{rutGonTenDonVi(h.dv.ten)}</th>
            {oSo(h, hangCua(h))}
          </tr>)}
          {tcs.length > 0 && <tr className="is-khoi">
            <th scope="row" className="dv-cot">Khối Thuế cơ sở</th>
            {oSo(congNhom(tcs), null)}
          </tr>}
          {tcs.map((h) => <tr key={h.dv.id}>
            <th scope="row" className="dv-cot">{h.dv.ten}</th>
            {oSo(h, hangCua(h))}
          </tr>)}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}

/* ── Tab 2, 3 · Hồ sơ đang xử lý ─────────────────────────────────────────── */

export function DangXuLy({ ky, nhom }: { ky: KyQL4; nhom: "VP" | "TCS" }) {
  const { chon } = useBoLoc();
  const [kiemTra, datKiemTra] = useThamSo<"an" | "hien">("kt", "an", ["an", "hien"]);
  const [trang, datTrang] = useThamSoSo("trang", 1);
  const [tim, datTim] = useState("");
  const { dangMo, datDangMo, dong, hang } = useChonHang();

  const tatCa = useMemo(() => danhSachHoSo(ky.hat, nhom), [ky.hat, nhom]);
  const loc = useMemo(() => {
    const q = tim.trim().toLowerCase();
    return theoDonVi(tatCa, chon, (r) => r.dv.ten)
      .filter((r) => !q || r.mst.includes(q) || r.so.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => b.soNgayQuaHan - a.soNgayQuaHan);
  }, [tatCa, chon, tim]);

  const soTrang = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const t = Math.min(trang, soTrang);
  const hien = loc.slice((t - 1) * MOI_TRANG, t * MOI_TRANG);
  const hoSo = useMemo(() => loc.find((r) => r.so === dangMo) ?? null, [loc, dangMo]);
  const rong = kiemTra === "hien"
    ? [150, 136, 230, 180, 160, 130, ...COT_KIEM_TRA.map(() => 180)]
    : [150, 136, 230, 180, 160, 130];

  return <CaseLayout
    presentation="drawer"
    label={hoSo ? `Hồ sơ ${hoSo.so}` : "Chi tiết hồ sơ hoàn thuế"}
    mobileOpen={Boolean(hoSo)}
    onClose={dong}
    detail={hoSo ? <ChiTietHoSo r={hoSo}/> : null}
  >
    <Panel chinh
      title={`Hồ sơ đang xử lý · khối ${nhom === "VP" ? "Văn phòng" : "Thuế cơ sở"}`}
      subtitle={`${ky.nhan} · ${money(loc.length)} hồ sơ · nguồn: TMS 6.29.1, 63 cột · sắp theo số ngày quá hạn`}
      actions={<div className="inline-controls">
        <Segmented
          label="Nhóm cột kiểm tra tự động"
          value={kiemTra}
          onChange={(v) => { datKiemTra(v); datDangMo(""); }}
          options={[{ value: "an" as const, label: "Ẩn cột kiểm tra" }, { value: "hien" as const, label: "Hiện cột kiểm tra" }]}
        />
        <SearchField value={tim} onChange={(v) => { datTim(v); datTrang(1); datDangMo(""); }} placeholder="Tìm số hồ sơ hoặc MST"/>
      </div>}
    >
      {/*
        6.29.1 có 63 cột. Bảng giữ SÁU cột đủ để chọn ra hồ sơ cần xử lý — là
        ai, ở đơn vị nào, đang ở trạng thái nào và quá hạn bao lâu; ngày nhận,
        hạn xử lý, trạng thái ký điện tử, hình thức xử lý và bốn cột kiểm tra
        tự động đọc trong ngăn chi tiết. Mười cột của bản trước rộng 1.750px
        trong khung 1.146px.

        Nhóm "Kiểm tra tự động" vẫn bật ra thành cột được (§5.4): nó là thứ
        người dùng quét theo CHIỀU DỌC — tìm xem cả trang có mấy hồ sơ trượt
        cùng một phép kiểm — mà ngăn chi tiết mỗi lần chỉ mở một hồ sơ nên
        không làm thay được.

        Cột Số CMND/Căn cước của nguồn KHÔNG có mặt ở đây, kể cả trong ngăn
        chi tiết — mục S7 bắt ẩn mặc định, và bản mẫu không có lý do nào để
        mở nó ra.
      */}
      <TableWrap label={`hồ sơ đang xử lý khối ${nhom}`}>
        <table className="ql1-ds-table" style={{ minWidth: rong.reduce((a, b) => a + b, 0) }}>
          <colgroup>{rong.map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
          <thead><tr>
            <th scope="col">Số hồ sơ</th>
            <th scope="col">MST</th>
            <th scope="col">Tên người nộp thuế</th>
            <th scope="col">Cơ quan thuế</th>
            <th scope="col">Trạng thái hồ sơ</th>
            <th scope="col" className="num">Số ngày quá hạn</th>
            {kiemTra === "hien" && COT_KIEM_TRA.map((c) => <th key={c} scope="col" className="center">{c}</th>)}
          </tr></thead>
          <tbody>
            {hien.map((r) => <tr key={r.so} {...hang(r.so)}>
              <ONhan id={r.so} dangMo={dangMo}>{r.so}</ONhan>
              <td>{r.mst}</td>
              <td>{r.tenNNT}</td>
              <td title={r.dv.ten}>{rutGonTenDonVi(r.dv.ten)}</td>
              <td>{r.trangThai}</td>
              <td className="num">
                {r.soNgayQuaHan > 0
                  ? <Badge tone="critical">quá {r.soNgayQuaHan}</Badge>
                  : <Badge tone="positive">còn {Math.abs(r.soNgayQuaHan)}</Badge>}
              </td>
              {kiemTra === "hien" && r.kiemTra.map((ok, i) => <td key={i} className="center">
                <span className={ok ? "kt-dat" : "kt-khong"} title={ok ? "Đạt" : "Không đạt"}>{ok ? "✓" : "✕"}</span>
              </td>)}
            </tr>)}
            {hien.length === 0 && <tr><td className="table-empty" colSpan={rong.length}>Không có hồ sơ nào khớp bộ lọc.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
      <Pager trang={t} soTrang={soTrang} onChange={(v) => { datTrang(v); datDangMo(""); }}/>
    </Panel>
  </CaseLayout>;
}

function ChiTietHoSo({ r }: { r: HoSoHoan }) {
  return <div className="ql3-chitiet">
    <p className="ql3-chitiet-ten"><strong>{r.tenNNT}</strong><span>{r.so} · {r.mst} · {rutGonTenDonVi(r.dv.ten)}</span></p>
    <DetailGrid items={[
      { label: "Trạng thái hồ sơ", value: r.trangThai },
      { label: "Hình thức xử lý", value: r.hinhThuc },
      { label: "Ngày nhận", value: r.ngayNhan },
      { label: "Hạn xử lý", value: r.hanXuLy },
      {
        label: "Số ngày quá hạn",
        value: r.soNgayQuaHan > 0
          ? <Badge tone="critical">quá {r.soNgayQuaHan} ngày</Badge>
          : <Badge tone="positive">còn {Math.abs(r.soNgayQuaHan)} ngày</Badge>,
      },
      { label: "Trạng thái ký điện tử", value: r.trangThaiKDT },
      { label: "Phòng xử lý", value: r.phongXuLy },
    ]}/>

    {/* Bốn phép kiểm của 6.29.1 đọc theo CẶP tên–kết quả, không phải một hàng
        tích chéo không nhãn như khi chúng là cột. */}
    <h3 className="ql3-chitiet-de">Kiểm tra tự động</h3>
    <DetailGrid items={COT_KIEM_TRA.map((c, i) => ({
      label: c,
      value: r.kiemTra[i] ? "Đạt" : <Badge tone="warning">Không đạt</Badge>,
    }))}/>
  </div>;
}

/* ── Tab 4 · Hồ sơ vênh ──────────────────────────────────────────────────── */

export function HoSoVenhBang({ ky, vaiTro, onGiaoPhieu }: { ky: KyQL4; vaiTro: VaiTro; onGiaoPhieu: (so: number) => void }) {
  const { chon } = useBoLoc();
  const [loc1, datLoc] = useThamSo<"tatca" | "chuaco">("loc", "tatca", ["tatca", "chuaco"]);
  const [trang, datTrang] = useThamSoSo("trang", 1);
  const { dangMo, datDangMo, dong, hang } = useChonHang();

  const tatCa = useMemo(() => danhSachVenh(ky.hat), [ky.hat]);
  const loc = useMemo(() => theoDonVi(tatCa, chon, (r) => r.dv.ten)
    .filter((r) => (loc1 === "tatca" ? true : r.ketQua === "Chưa có kết quả")), [tatCa, chon, loc1]);

  const soTrang = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const t = Math.min(trang, soTrang);
  const hien = loc.slice((t - 1) * MOI_TRANG, t * MOI_TRANG);
  const chuaGiao = loc.filter((r) => r.ketQua === "Chưa có kết quả" && !r.phieu);
  const venh = useMemo(() => loc.find((r) => r.so === dangMo) ?? null, [loc, dangMo]);

  return <CaseLayout
    presentation="drawer"
    label={venh ? `Hồ sơ vênh ${venh.so}` : "Chi tiết hồ sơ vênh"}
    mobileOpen={Boolean(venh)}
    onClose={dong}
    detail={venh ? <ChiTietVenh r={venh}/> : null}
  >
    <Panel chinh
    title="Hồ sơ vênh giữa TMS 1.5.1 và 6.29.1"
    subtitle={`${ky.nhan} · ${money(loc.length)} hồ sơ · ba loại vênh theo BR-40`}
    actions={<Segmented
      label="Lọc kết quả"
      value={loc1}
      onChange={(v) => { datLoc(v); datTrang(1); datDangMo(""); }}
      options={[{ value: "tatca" as const, label: "Tất cả" }, { value: "chuaco" as const, label: "Chưa có kết quả" }]}
    />}
  >
    {/* Giao phiếu chỉ dành cho chuyên viên — ma trận §3, dòng "Giao phiếu rà
        soát cho đơn vị". */}
    {vaiTro === "CV" && <div className="prs-thanh">
      <span>{money(chuaGiao.length)} hồ sơ chưa rà soát và chưa được giao phiếu PRS-05.</span>
      <button
        type="button"
        className="button is-secondary"
        disabled={chuaGiao.length === 0}
        onClick={() => onGiaoPhieu(chuaGiao.length)}
      >Giao phiếu PRS-05 · {money(chuaGiao.length)} hồ sơ</button>
    </div>}

    {/* Sáu cột đủ để chọn: hồ sơ nào, của ai, vênh kiểu gì, đã rà soát chưa
        và đã có phiếu chưa. MST với chiều vênh đọc trong ngăn chi tiết — tám
        cột của bản trước rộng 1.510px trong khung 1.146px. */}
    <TableWrap label="hồ sơ vênh">
      <table className="ql1-ds-table" style={{ minWidth: 1140 }}>
        <colgroup>{[150, 210, 170, 240, 220, 150].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
        <thead><tr>
          <th scope="col">Số hồ sơ</th>
          <th scope="col">Tên người nộp thuế</th>
          <th scope="col">Cơ quan thuế</th>
          <th scope="col">Loại vênh</th>
          <th scope="col">Kết quả rà soát</th>
          <th scope="col">Phiếu PRS-05</th>
        </tr></thead>
        <tbody>
          {hien.map((r) => <tr key={r.so} {...hang(r.so)}>
            <ONhan id={r.so} dangMo={dangMo}>{r.so}</ONhan>
            <td>{r.tenNNT}</td>
            <td title={r.dv.ten}>{rutGonTenDonVi(r.dv.ten)}</td>
            <td title={r.loai === LOAI_VENH[2] ? "Loại chưa có cách giải thích sẵn — đây là thứ phiếu PRS-05 sinh ra để hỏi" : undefined}>{r.loai}</td>
            <td className="o-xuong-dong">
              <Badge tone={r.ketQua === KET_QUA_PRS05[0] ? "warning" : "positive"}>{r.ketQua}</Badge>
              {r.lyDo && <small>{r.lyDo}</small>}
            </td>
            <td>{r.phieu || <span className="cell-empty">chưa giao</span>}</td>
          </tr>)}
          {hien.length === 0 && <tr><td className="table-empty" colSpan={6}>Không có hồ sơ vênh nào khớp bộ lọc.</td></tr>}
        </tbody>
      </table>
    </TableWrap>
    <Pager trang={t} soTrang={soTrang} onChange={(v) => { datTrang(v); datDangMo(""); }}/>
    </Panel>
  </CaseLayout>;
}

function ChiTietVenh({ r }: { r: HoSoVenh }) {
  return <div className="ql3-chitiet">
    <p className="ql3-chitiet-ten"><strong>{r.tenNNT}</strong><span>{r.so} · {r.mst} · {rutGonTenDonVi(r.dv.ten)}</span></p>
    <DetailGrid items={[
      { label: "Chiều vênh", value: r.chieu },
      { label: "Loại vênh", value: r.loai },
      { label: "Kết quả rà soát", value: <Badge tone={r.ketQua === KET_QUA_PRS05[0] ? "warning" : "positive"}>{r.ketQua}</Badge> },
      { label: "Lý do", value: r.lyDo || <span className="cell-empty">—</span> },
      { label: "Phiếu PRS-05", value: r.phieu || <span className="cell-empty">chưa giao</span> },
    ]}/>
  </div>;
}

/* ── Tab 5 · Chấm điểm ───────────────────────────────────────────────────── */

export function ChamDiem({ ky }: { ky: KyQL4 }) {
  const { chon } = useBoLoc();
  const tatCa = useMemo(() => bangQL4_01(ky.hat), [ky.hat]);
  const hang = theoDonVi(tatCa, chon, (h) => h.dv.ten);
  const bq = binhQuanQuaHan(hang);

  return <>
    <Panel chinh
      title="Quy tắc chấm điểm đang áp"
      subtitle="Nạp từ sheet CHẤM ĐIỂM · chỉ xem; trưởng phòng sửa ở Danh mục của phòng"
    >
      <TableWrap label="bậc chấm điểm">
        <table className="ql1-ds-table" style={{ minWidth: 760 }}>
          <colgroup>{[420, 180, 160].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
          <thead><tr>
            <th scope="col">Bậc so với bình quân chung</th>
            <th scope="col" className="num">Điểm</th>
            <th scope="col" className="num">Số đơn vị đang ở bậc</th>
          </tr></thead>
          <tbody>
            {BAC_DIEM.map((b) => {
              const dem = hang.filter((h) => {
                const t = tyLeQuaHan(h);
                return t !== null && bq !== null && bacCua(t - bq).nhan === b.nhan;
              }).length;
              return <tr key={b.nhan}>
                <td>{b.nhan}</td>
                <td className="num">{b.diem > 0 ? `Cộng ${b.diem.toFixed(1).replace(".", ",")}` : `Trừ ${Math.abs(b.diem).toFixed(1).replace(".", ",")}`}</td>
                <td className="num">{money(dem)}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </TableWrap>
    </Panel>

    <Panel title="Điểm từng đơn vị" subtitle="Xếp trong từng khối · đơn vị trên bình quân bị trừ điểm">
      <TableWrap label="điểm từng đơn vị">
        <table className="ql1-ds-table" style={{ minWidth: 1010 }}>
          <colgroup>{[280, 150, 170, 290, 120].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
          <thead><tr>
            <th scope="col">Tên cơ quan thuế</th>
            <th scope="col">Khối</th>
            <th scope="col" className="num">Tỷ lệ hồ sơ quá hạn</th>
            <th scope="col">Bậc đang áp</th>
            <th scope="col" className="num">Điểm</th>
          </tr></thead>
          <tbody>
            {hang.map((h) => {
              const t = tyLeQuaHan(h);
              const bac = t === null || bq === null ? null : bacCua(t - bq);
              return <tr key={h.dv.id}>
                <td title={h.dv.ten}>{rutGonTenDonVi(h.dv.ten)}</td>
                <td>{h.dv.nhom === "VP" ? "Văn phòng" : "Thuế cơ sở"}</td>
                <td className="num">{hienTyLe(t)}</td>
                <td>{bac?.nhan ?? "—"}</td>
                <td className="num">{bac === null ? "—" : bac.diem.toFixed(1).replace(".", ",")}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </TableWrap>
    </Panel>
  </>;
}
