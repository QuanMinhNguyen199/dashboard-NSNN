import { useMemo, useState } from "react";
import { Badge, Button, DetailGrid, Pager, Panel, SearchField, Segmented, TableWrap, money } from "@/components/ui";
import { CaseLayout } from "@/components/CaseLayout";
import { ONhan, useChonHang } from "@/components/ChonHang";
import { useThamSo, useThamSoSo } from "@/state/diaChi";
import { rutGonTenDonVi } from "@/data/danhMuc";
import {
  CHUA_XAC_DINH, DON_VI_TONG_DAI, danhSachCuocGoi, danhSachPhieu,
  thoiGianTB, tongDen, tongDi, tyLeNho, type HangCuocGoi, type KyQL4, type PhieuGhi,
} from "@/data/ql4";

/*
  QL4-02 — Báo cáo tổng đài hỗ trợ người nộp thuế (§5.5).

  Báo cáo này khác mọi báo cáo khác trong hệ ở nhịp: hệ kéo lúc 18:00, gửi
  email bản nháp trước 19:00, sáng hôm sau chuyên viên rà soát rồi gửi duyệt
  (BR-42). G18 vì thế đòi "duyệt được trong vài phút": việc cần xử lý nằm đầu
  trang, nút duyệt không phải cuộn mới thấy.

  Dòng "Chưa xác định đơn vị" là dòng THẬT chứ không phải lỗi hiển thị — file
  mẫu hiện đang có `#N/A` [F]. G15 bắt gom chúng vào một dòng riêng cuối bảng,
  màu cảnh báo, kèm nút gán. Hiện `#N/A` hoặc âm thầm bỏ dòng đều làm số tổng
  sai mà không ai biết.
*/

const MOI_TRANG = 12;
const hienTyLe = (x: number | null) => (x === null ? "—" : `${(x * 100).toFixed(2).replace(".", ",")}%`);
const giay = (x: number | null) => (x === null ? "—" : `${money(x)} s`);

/* ── Thanh trạng thái ngày (G11, G18) ────────────────────────────────────── */

export function ThanhNgay({ ky, chuaGan }: { ky: KyQL4; chuaGan: number }) {
  return <div className={chuaGan > 0 ? "notice warning" : "notice info"}>
    <strong>Kéo lúc 18:00 · Email nháp gửi lúc 18:12 · Chờ chuyên viên rà soát</strong>
    <span>
      Số liệu ngày {ky.ngayChot}.
      {chuaGan > 0
        ? ` Còn ${money(chuaGan)} tài khoản tổng đài chưa gán đơn vị — số của chúng đang nằm ở dòng "${CHUA_XAC_DINH}" và chưa vào đơn vị nào.`
        : " Mọi tài khoản tổng đài đều đã gán đơn vị."}
    </span>
  </div>;
}

/* ── Tab 6 · Cuộc gọi ────────────────────────────────────────────────────── */

interface GopDonVi {
  donVi: string;
  soTaiKhoan: number;
  diTraLoi: number;
  diKhongTraLoi: number;
  diThoiGian: number;
  denTraLoi: number;
  denKhongTraLoi: number;
  denThoiGian: number;
  noiBo: number;
}

const gopTheoDonVi = (ds: HangCuocGoi[]): GopDonVi[] => {
  const bo = new Map<string, GopDonVi>();
  for (const h of ds) {
    const cu = bo.get(h.donVi) ?? { donVi: h.donVi, soTaiKhoan: 0, diTraLoi: 0, diKhongTraLoi: 0, diThoiGian: 0, denTraLoi: 0, denKhongTraLoi: 0, denThoiGian: 0, noiBo: 0 };
    bo.set(h.donVi, {
      donVi: h.donVi,
      soTaiKhoan: cu.soTaiKhoan + 1,
      diTraLoi: cu.diTraLoi + h.diTraLoi,
      diKhongTraLoi: cu.diKhongTraLoi + h.diKhongTraLoi,
      diThoiGian: cu.diThoiGian + h.diThoiGian,
      denTraLoi: cu.denTraLoi + h.denTraLoi,
      denKhongTraLoi: cu.denKhongTraLoi + h.denKhongTraLoi,
      denThoiGian: cu.denThoiGian + h.denThoiGian,
      noiBo: cu.noiBo + h.noiBo,
    });
  }
  /* Dòng chưa xác định luôn ở CUỐI, không xếp theo chữ cái như các dòng khác
     — nó là việc phải xử lý, và chỗ của việc phải xử lý là nơi mắt dừng lại
     sau khi đọc hết bảng. */
  const ra = [...bo.values()].filter((x) => x.donVi !== CHUA_XAC_DINH)
    .sort((a, b) => DON_VI_TONG_DAI.indexOf(a.donVi) - DON_VI_TONG_DAI.indexOf(b.donVi));
  const lac = bo.get(CHUA_XAC_DINH);
  return lac ? [...ra, lac] : ra;
};

export function CuocGoi({ ky, onGan }: { ky: KyQL4; onGan: () => void }) {
  const [mo, datMo] = useThamSo<"donvi" | "taikhoan">("gop", "donvi", ["donvi", "taikhoan"]);
  const ds = useMemo(() => danhSachCuocGoi(ky.hat), [ky.hat]);
  const gop = useMemo(() => gopTheoDonVi(ds), [ds]);

  const cong = gop.reduce((t, g) => ({
    ...t,
    diTraLoi: t.diTraLoi + g.diTraLoi, diKhongTraLoi: t.diKhongTraLoi + g.diKhongTraLoi, diThoiGian: t.diThoiGian + g.diThoiGian,
    denTraLoi: t.denTraLoi + g.denTraLoi, denKhongTraLoi: t.denKhongTraLoi + g.denKhongTraLoi, denThoiGian: t.denThoiGian + g.denThoiGian,
    noiBo: t.noiBo + g.noiBo,
  }), { donVi: "Tổng cộng", soTaiKhoan: ds.length, diTraLoi: 0, diKhongTraLoi: 0, diThoiGian: 0, denTraLoi: 0, denKhongTraLoi: 0, denThoiGian: 0, noiBo: 0 });

  const o = (g: GopDonVi | HangCuocGoi) => <>
    <td className="num">{money(g.diTraLoi)}</td>
    <td className="num">{money(g.diKhongTraLoi)}</td>
    <td className="num">{money(tongDi(g as HangCuocGoi))}</td>
    <td className="num">{money(g.diThoiGian)}</td>
    <td className="num">{money(g.denTraLoi)}</td>
    <td className="num">{money(g.denKhongTraLoi)}</td>
    <td className="num">{money(tongDen(g as HangCuocGoi))}</td>
    <td className="num">{money(g.denThoiGian)}</td>
    <td className="num">{hienTyLe(tyLeNho(g as HangCuocGoi))}</td>
    <td className="num">{giay(thoiGianTB(g as HangCuocGoi))}</td>
    <td className="num">{money(g.noiBo)}</td>
  </>;

  const rong = [260, 130, 140, 150, 110, 150, 140, 150, 110, 160, 124, 190, 120];

  return <Panel chinh
    title="Báo cáo sản lượng cuộc gọi"
    subtitle={`${ky.nhan} · nguồn: Viettel, kéo 18:00 · gộp theo đơn vị qua danh mục tài khoản`}
    actions={<Segmented
      label="Mức gộp"
      value={mo}
      onChange={datMo}
      options={[{ value: "donvi" as const, label: "Theo đơn vị" }, { value: "taikhoan" as const, label: "Theo tài khoản" }]}
    />}
  >
    <TableWrap label="sản lượng cuộc gọi">
      <table className="ql1-table" style={{ minWidth: rong.reduce((a, b) => a + b, 0) }}>
        <colgroup>{rong.map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
        <thead>
          <tr>
            <th scope="col" className="dv-cot" rowSpan={2}>{mo === "donvi" ? "Đơn vị" : "Nhân viên"}</th>
            <th scope="col" rowSpan={2} className="num">Số tài khoản</th>
            <th scope="colgroup" className="nhom" colSpan={4}>Gọi đi</th>
            <th scope="colgroup" className="nhom" colSpan={4}>Gọi đến</th>
            <th scope="col" rowSpan={2} className="num">Tỉ lệ nhỡ</th>
            <th scope="col" rowSpan={2} className="num">Thời gian gọi trung bình</th>
            <th scope="col" rowSpan={2} className="num">Gọi nội bộ</th>
          </tr>
          <tr>
            <th scope="col" className="num">Trả lời</th>
            <th scope="col" className="num">Không trả lời</th>
            <th scope="col" className="num">Tổng</th>
            <th scope="col" className="num">Thời gian (giây)</th>
            <th scope="col" className="num">Trả lời</th>
            <th scope="col" className="num">Không trả lời</th>
            <th scope="col" className="num">Tổng</th>
            <th scope="col" className="num">Thời gian (giây)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="is-tong">
            <th scope="row" className="dv-cot">Tổng cộng</th>
            <td className="num">{money(ds.length)}</td>
            {o(cong)}
          </tr>
          {mo === "donvi"
            ? gop.map((g) => <tr key={g.donVi} className={g.donVi === CHUA_XAC_DINH ? "is-chua-gan" : undefined}>
                <th scope="row" className="dv-cot" title={g.donVi}>
                  {g.donVi === CHUA_XAC_DINH
                    ? <span className="chua-gan-ten">{g.donVi}<Button kind="quiet" onClick={onGan}>Gán đơn vị</Button></span>
                    : rutGonTenDonVi(g.donVi)}
                </th>
                <td className="num">{money(g.soTaiKhoan)}</td>
                {o(g)}
              </tr>)
            : ds.map((h) => <tr key={h.user} className={h.donVi === CHUA_XAC_DINH ? "is-chua-gan" : undefined}>
                <th scope="row" className="dv-cot">{h.nhanVien} <small>{h.user}</small></th>
                <td className="num">1</td>
                {o(h)}
              </tr>)}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}

/* ── Tab 7 · Phiếu ghi ───────────────────────────────────────────────────── */

export function PhieuGhiMaTran({ ky }: { ky: KyQL4 }) {
  const ds = useMemo(() => danhSachPhieu(ky.hat), [ky.hat]);

  const donVi = [...new Set(ds.map((p) => p.donVi))]
    .filter((d) => d !== CHUA_XAC_DINH)
    .sort((a, b) => DON_VI_TONG_DAI.indexOf(a) - DON_VI_TONG_DAI.indexOf(b));
  if (ds.some((p) => p.donVi === CHUA_XAC_DINH)) donVi.push(CHUA_XAC_DINH);

  const dem = (d: string, trangThai: string, hetHan: boolean | null) =>
    ds.filter((p) => p.donVi === d && p.trangThai === trangThai && (hetHan === null || p.hetHan === hetHan)).length;

  const tongO = (trangThai: string, hetHan: boolean | null) =>
    ds.filter((p) => p.trangThai === trangThai && (hetHan === null || p.hetHan === hetHan)).length;

  return <Panel chinh
    title="Phiếu ghi theo đơn vị"
    subtitle={`${ky.nhan} · ${money(ds.length)} phiếu · nguồn: Viettel, kéo 18:00`}
  >
    {/*
      Ô "Đang xử lý – Hết hạn" là ô NỔI NHẤT bảng (§5.2 tab 7): đó là phiếu
      vừa chưa xong vừa đã trễ, tức việc duy nhất trong bảng này cần ai đó làm
      ngay hôm nay. Ba ô còn lại là bối cảnh.
    */}
    <TableWrap label="ma trận phiếu ghi">
      <table className="ql1-table" style={{ minWidth: 1060 }}>
        <colgroup>{[300, 170, 190, 170, 110, 120].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
        <thead>
          <tr>
            <th scope="col" className="dv-cot" rowSpan={2}>Đơn vị</th>
            <th scope="colgroup" className="nhom" colSpan={2}>Đang xử lý</th>
            <th scope="col" rowSpan={2} className="num">Hoàn thành</th>
            <th scope="col" rowSpan={2} className="num">Sai hạn</th>
            <th scope="col" rowSpan={2} className="num">Tổng</th>
          </tr>
          <tr>
            <th scope="col" className="num">Trong hạn</th>
            <th scope="col" className="num">Hết hạn</th>
          </tr>
        </thead>
        <tbody>
          <tr className="is-tong">
            <th scope="row" className="dv-cot">Tổng cộng</th>
            <td className="num">{money(tongO("Đang xử lý", false))}</td>
            <td className="num o-nong">{money(tongO("Đang xử lý", true))}</td>
            <td className="num">{money(tongO("Hoàn thành", null))}</td>
            <td className="num">{money(ds.filter((p) => p.saiHan).length)}</td>
            <td className="num">{money(ds.length)}</td>
          </tr>
          {donVi.map((d) => {
            const hetHan = dem(d, "Đang xử lý", true);
            return <tr key={d} className={d === CHUA_XAC_DINH ? "is-chua-gan" : undefined}>
              <th scope="row" className="dv-cot" title={d}>{d === CHUA_XAC_DINH ? d : rutGonTenDonVi(d)}</th>
              <td className="num">{money(dem(d, "Đang xử lý", false))}</td>
              <td className={hetHan > 0 ? "num o-nong" : "num"}>{money(hetHan)}</td>
              <td className="num">{money(dem(d, "Hoàn thành", null))}</td>
              <td className="num">{money(ds.filter((p) => p.donVi === d && p.saiHan).length)}</td>
              <td className="num">{money(ds.filter((p) => p.donVi === d).length)}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}

/* ── Tab 8 · Sai hạn ─────────────────────────────────────────────────────── */

export function SaiHan({ ky }: { ky: KyQL4 }) {
  const ds = useMemo(() => danhSachPhieu(ky.hat), [ky.hat]);
  const sai = ds.filter((p) => p.saiHan);
  const theoDv = [...new Set(sai.map((p) => p.donVi))]
    .map((d) => ({ donVi: d, so: sai.filter((p) => p.donVi === d).length }))
    .sort((a, b) => b.so - a.so);

  return <>
    <Panel chinh title="Phiếu có hạn xử lý không đúng quy trình" subtitle={`${ky.nhan} · ${money(sai.length)} phiếu`}>
      {sai.length === 0
        ? <div className="empty-state"><strong>Không có phiếu nào sai hạn trong kỳ</strong></div>
        : <TableWrap label="sai hạn theo đơn vị">
            <table className="ql1-ds-table" style={{ minWidth: 620 }}>
              <colgroup>{[420, 200].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
              <thead><tr>
                <th scope="col">Đơn vị</th>
                <th scope="col" className="num">Số phiếu sai hạn</th>
              </tr></thead>
              <tbody>
                {theoDv.map((x) => <tr key={x.donVi}>
                  <td title={x.donVi}>{x.donVi === CHUA_XAC_DINH ? x.donVi : rutGonTenDonVi(x.donVi)}</td>
                  <td className="num">{money(x.so)}</td>
                </tr>)}
              </tbody>
            </table>
          </TableWrap>}
    </Panel>

    {sai.length > 0 && <Panel title="Danh sách phiếu sai hạn" subtitle="Để đối chiếu lại với nguồn Viettel">
      <TableWrap label="danh sách phiếu sai hạn">
        <table className="ql1-ds-table" style={{ minWidth: 1070 }}>
          <colgroup>{[150, 190, 160, 260, 150, 160].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
          <thead><tr>
            <th scope="col">ID</th>
            <th scope="col">Ngày tạo</th>
            <th scope="col">Trạng thái</th>
            <th scope="col">Đơn vị xử lý</th>
            <th scope="col">Hạn xử lý</th>
            <th scope="col">Chuyên viên tiếp nhận</th>
          </tr></thead>
          <tbody>
            {sai.slice(0, 20).map((p) => <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.ngayTao}</td>
              <td>{p.trangThai}</td>
              <td title={p.donVi}>{p.donVi === CHUA_XAC_DINH ? p.donVi : rutGonTenDonVi(p.donVi)}</td>
              <td>{p.hanXuLy}</td>
              <td>{p.chuyenVien}</td>
            </tr>)}
          </tbody>
        </table>
      </TableWrap>
    </Panel>}
  </>;
}

/* ── Tab 9 · Danh sách phiếu ─────────────────────────────────────────────── */

export function DanhSachPhieu({ ky }: { ky: KyQL4 }) {
  const [trang, datTrang] = useThamSoSo("trang", 1);
  const [tim, datTim] = useState("");
  const { dangMo, datDangMo, dong, hang } = useChonHang();

  const ds = useMemo(() => danhSachPhieu(ky.hat), [ky.hat]);
  const loc = useMemo(() => {
    const q = tim.trim().toLowerCase();
    return ds.filter((p) => !q || p.id.toLowerCase().includes(q) || p.chuDe.toLowerCase().includes(q));
  }, [ds, tim]);

  const soTrang = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const t = Math.min(trang, soTrang);
  const hien = loc.slice((t - 1) * MOI_TRANG, t * MOI_TRANG);
  const phieu = useMemo(() => loc.find((p) => p.id === dangMo) ?? null, [loc, dangMo]);

  return <CaseLayout
    presentation="drawer"
    label={phieu ? `Phiếu ${phieu.id}` : "Chi tiết phiếu ghi"}
    mobileOpen={Boolean(phieu)}
    onClose={dong}
    detail={phieu ? <ChiTietPhieu p={phieu}/> : null}
  >
    <Panel chinh
      title="Danh sách phiếu ghi"
      subtitle={`${ky.nhan} · ${money(loc.length)} phiếu · 14 cột gốc Viettel`}
      actions={<SearchField value={tim} onChange={(v) => { datTim(v); datTrang(1); datDangMo(""); }} placeholder="Tìm ID hoặc chủ đề"/>}
    >
      {/*
        Sáu cột đủ để chọn ra phiếu cần xem; mười cột gốc rộng 1.748px trong
        khung 1.146px.

        Cột "Mô tả" là văn bản tự do chứa họ tên, địa chỉ, số điện thoại, CCCD
        của người nộp thuế (S6). Trước đây nó là một cột cắt còn hai dòng, mở
        ra một khối dưới bảng. Nay nó chỉ nằm trong ngăn chi tiết — tức chỉ
        hiện khi có người chủ động mở một phiếu, không còn phơi hai dòng đầu
        của mười hai hồ sơ cho bất cứ ai đi ngang màn hình. Nó vẫn không bao
        giờ đi vào thẻ số, biểu đồ hay email.

        Nhãn `expirationDate` của nguồn đổi thành "Hạn xử lý" trên màn hình;
        tệp xuất ra giữ tên gốc để ghép lại với dữ liệu Viettel vẫn khớp.
      */}
      <TableWrap label="danh sách phiếu ghi">
        <table className="ql1-ds-table" style={{ minWidth: 1038 }}>
          <colgroup>{[150, 150, 150, 240, 212, 136].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
          <thead><tr>
            <th scope="col">ID</th>
            <th scope="col">Ngày tạo</th>
            <th scope="col">Trạng thái</th>
            <th scope="col">Chủ đề</th>
            <th scope="col">Đơn vị xử lý</th>
            <th scope="col">Tiến độ</th>
          </tr></thead>
          <tbody>
            {hien.map((p) => <tr key={p.id} {...hang(p.id)}>
              <ONhan id={p.id} dangMo={dangMo}>{p.id}</ONhan>
              <td>{p.ngayTao}</td>
              <td>{p.trangThai}</td>
              <td title={p.chuDe}>{p.chuDe}</td>
              <td title={p.donVi}>{p.donVi === CHUA_XAC_DINH ? p.donVi : rutGonTenDonVi(p.donVi)}</td>
              <td>{p.hetHan ? <Badge tone="critical">Hết hạn</Badge> : <Badge tone="positive">Trong hạn</Badge>}</td>
            </tr>)}
            {hien.length === 0 && <tr><td className="table-empty" colSpan={6}>Không có phiếu nào khớp bộ lọc.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
      <Pager trang={t} soTrang={soTrang} onChange={(v) => { datTrang(v); datDangMo(""); }}/>
    </Panel>
  </CaseLayout>;
}

function ChiTietPhieu({ p }: { p: PhieuGhi }) {
  return <div className="ql3-chitiet">
    <p className="ql3-chitiet-ten"><strong>{p.chuDe}</strong><span>{p.id} · {p.donVi === CHUA_XAC_DINH ? p.donVi : rutGonTenDonVi(p.donVi)}</span></p>
    <DetailGrid items={[
      { label: "Trạng thái", value: p.trangThai },
      { label: "Phân loại", value: p.phanLoai },
      { label: "Ngày tạo", value: p.ngayTao },
      { label: "Hạn xử lý", value: p.hanXuLy },
      { label: "Tiến độ", value: p.hetHan ? <Badge tone="critical">Hết hạn</Badge> : <Badge tone="positive">Trong hạn</Badge> },
      { label: "Hạn đúng quy trình", value: p.saiHan ? "Không" : "Có" },
      { label: "Chuyên viên tiếp nhận", value: p.chuyenVien },
      { label: "Tạo bởi", value: p.taoBoi },
    ]}/>

    <h3 className="ql3-chitiet-de">Mô tả</h3>
    <p className="mota-day">{p.moTa}</p>
  </div>;
}
