import { useMemo, useRef, useState } from "react";
import { Badge, Button, DetailGrid, Pager, Panel, SearchField, TableWrap, money } from "@/components/ui";
import { CaseLayout } from "@/components/CaseLayout";
import { ExportButton } from "@/components/ExportButton";
import { rutGonTenDonVi } from "@/data/danhMuc";
import { duocDem, dsKTTBCuaDonVi, type DongKTTB, type DonViQL3 } from "@/data/ql3";
import { exportExcel } from "@/domain/reportFiles";
import { sheetKTTB } from "@/domain/reportExport";
import { useThamSo } from "@/state/diaChi";
import type { KyQL3 } from "@/data/ql3";
import type { ReportMeta } from "@/domain/reportExport";

/*
  Danh sách NNT của QL3 — dựng theo sheet `Data` của tệp thật
  `1_QL3_4_TH (03092026).xls`: 6.158 dòng × 30 cột, một dòng là MỘT HỒ SƠ KHAI
  THUẾ × KỲ, không phải một doanh nghiệp.

  Màn này thay mục "Dữ liệu gốc" cũ. Dữ liệu gốc liệt kê các nguồn kéo về —
  việc của vai Vận hành dữ liệu, vai ấy đã có màn riêng. Thứ cán bộ QL3 làm
  việc trên đó cả tháng là chính sheet này: `SPec/QLDN3` §4.1 đặt nó làm bảng
  KTTB_CHI_TIẾT, và mọi ô của mẫu báo cáo đều đếm hoặc cộng từ đây đi lên.

  ── BẢNG NGẮN, CHI TIẾT TRONG NGĂN TRƯỢT ───────────────────────────────

  Bản đầu bày đủ 27 cột của sheet. Trung thực, nhưng rộng 3.700px trong khung
  1.146px: hai phần ba bảng nằm ngoài tầm nhìn, và cuộn ngang qua mười ba cột
  tiền chỉ để đọc tên một doanh nghiệp là việc không ai làm nhanh được.

  Nay bảng giữ ĐÚNG NĂM CỘT nhận dạng — đủ để tìm ra dòng cần — còn toàn bộ
  cột tiền nằm trong ngăn trượt mở từ mép phải khi bấm vào một dòng. Không cột
  nào của sheet bị mất: ngăn trượt bày đủ, và bản xuất Excel vẫn ra 27 cột
  cộng cột CQT.

  Ngăn trượt dùng lại `CaseLayout presentation="drawer"`, không dựng cái thứ
  hai. Bản trước của màn này từng đặt chi tiết thành CỘT CỐ ĐỊNH bên phải;
  chính chú thích đầu `CaseLayout` đã ghi vì sao cột cố định thua ngăn trượt:
  nó ăn 30% bề ngang suốt thời gian kể cả khi người dùng chỉ đang đọc bảng, và
  nó luôn hiện sẵn một bản ghi chưa ai chọn.

  Đây là NGOẠI LỆ ĐÃ ĐƯỢC NGƯỜI DÙNG CHỐT của The No-Overlay Rule — xem mục
  "Địa chỉ và lớp phủ" trong DESIGN.md. Cái giá nặng nhất của lớp phủ được trả
  lại bằng địa chỉ: dòng đang mở nằm ở `so=`, nên vẫn gửi được liên kết mở
  thẳng hồ sơ đang bàn, và nạp lại trang thì ngăn trượt mở lại đúng hồ sơ ấy.
*/

const MOI_TRANG = 12;

/*
  Năm cột của bảng: đủ để NHẬN RA dòng, không hơn.

  Loại thuế hiện mã ngắn (TNDN, GTGT, TNCN) thay vì tên đầy đủ: ở cột hẹp thì
  "Thuế thu nhập doanh nghiệp" bị cắt, mà cắt một tên thuế là cắt đúng chỗ
  phân biệt nó với tên thuế khác. Tên đầy đủ nằm trong ngăn trượt và trong
  `title` của ô.
*/
const MA_THUE: Record<string, string> = {
  "Thuế thu nhập doanh nghiệp": "TNDN",
  "Thuế giá trị gia tăng": "GTGT",
  "Thuế thu nhập cá nhân": "TNCN",
};

/*
  Tổng 695px: vừa khung ở 768×1024 — khổ máy tính bảng dọc, nơi thanh bên đã
  ẩn — mà không phải cuộn ngang.

  Hai bề rộng dưới đây do `soat` ĐO chứ không do ước lượng. Kỳ kê khai cần
  134 vì "Tháng 07/2026" tràn 5px ở 125. MST cần 124 vì ở khổ 390 ô bảng cao
  44px và đệm rộng hơn, nên "0100000003" tràn 8px ở 110 — cùng một cột vừa ở
  desktop vẫn có thể chật ở điện thoại. Loại thuế bù lại được vì nó chỉ hiện
  mã bốn chữ (TNDN), và bề rộng của nó do TIÊU ĐỀ quyết định chứ không do giá
  trị.
*/
const RONG_COT = [160, 124, 92, 134, 185];
const RONG = RONG_COT.reduce((a, b) => a + b, 0);

const TRANG_THAI = [
  { khoa: "chapNhan", nhan: "Chấp nhận", sac: "positive" },
  { khoa: "choGiaiTrinh", nhan: "Chờ giải trình", sac: "warning" },
  { khoa: "dieuChinh", nhan: "Điều chỉnh", sac: "info" },
  { khoa: "anDinh", nhan: "Ấn định", sac: "critical" },
  { khoa: "deNghiKiemTra", nhan: "Đề nghị kiểm tra tại DN", sac: "critical" },
] as const;

const trangThaiCua = (d: DongKTTB) =>
  TRANG_THAI.find((t) => (d as unknown as Record<string, number>)[t.khoa] === 1) ?? null;

/* Đủ 27 cột của sheet cho bản xuất và cho ngăn trượt — bảng trên màn chỉ bày
   năm cột, nhưng tệp rời khỏi màn thì phải ra nguyên sheet. */
type Cot = { khoa: keyof DongKTTB; nhan: string; kieu?: "tien" | "co" };
const COT_SHEET: Cot[] = [
  { khoa: "tenNNT", nhan: "Tên NNT" },
  { khoa: "mst", nhan: "MST" },
  { khoa: "hoSoChuyenSang", nhan: "Hồ sơ năm trước chuyển sang", kieu: "co" },
  { khoa: "keHoachDauNam", nhan: "Kế hoạch đầu năm/tháng" },
  { khoa: "loaiThue", nhan: "Loại thuế" },
  { khoa: "kyKeKhai", nhan: "Kỳ kê khai" },
  { khoa: "soQDPhat", nhan: "Số QĐ phạt" },
  { khoa: "ngayQuyetDinh", nhan: "Ngày quyết định" },
  { khoa: "chapNhan", nhan: "Hồ sơ chấp nhận", kieu: "co" },
  { khoa: "choGiaiTrinh", nhan: "Hồ sơ chờ giải trình", kieu: "co" },
  { khoa: "dieuChinh", nhan: "Hồ sơ điều chỉnh", kieu: "co" },
  { khoa: "anDinh", nhan: "Hồ sơ ấn định", kieu: "co" },
  { khoa: "deNghiKiemTra", nhan: "Hồ sơ đề nghị kiểm tra tại DN", kieu: "co" },
  { khoa: "dieuChinhTang", nhan: "Tiền thuế điều chỉnh tăng", kieu: "tien" },
  { khoa: "dieuChinhGiam", nhan: "Tiền thuế điều chỉnh giảm", kieu: "tien" },
  { khoa: "anDinhTien", nhan: "Ấn định", kieu: "tien" },
  { khoa: "tangThu", nhan: "Tổng số thuế tăng thu", kieu: "tien" },
  { khoa: "giamKhauTru", nhan: "Giảm khấu trừ", kieu: "tien" },
  { khoa: "tangKhauTru", nhan: "Tăng khấu trừ", kieu: "tien" },
  { khoa: "giamLo", nhan: "Giảm lỗ", kieu: "tien" },
  { khoa: "tangLo", nhan: "Tăng lỗ", kieu: "tien" },
  { khoa: "mienGiamTang", nhan: "Miễn giảm tăng", kieu: "tien" },
  { khoa: "mienGiamGiam", nhan: "Miễn giảm giảm", kieu: "tien" },
  { khoa: "tienPhat", nhan: "Số tiền phạt", kieu: "tien" },
  { khoa: "nopCham", nhan: "Tiền nộp chậm", kieu: "tien" },
  { khoa: "trongKeHoach", nhan: "Trong kế hoạch năm (Tích 1)", kieu: "co" },
  { khoa: "ngoaiKeHoach", nhan: "Ngoài kế hoạch năm", kieu: "co" },
];

const COT_TIEN = COT_SHEET.filter((c) => c.kieu === "tien");

export function DanhSachDNQL3({ trongPhamVi, hatKy, ky, meta, tenTep }: {
  trongPhamVi: DonViQL3[];
  hatKy: number;
  ky: KyQL3;
  meta: ReportMeta;
  tenTep: string;
}) {
  const [tim, datTim] = useState("");
  const [cqt, datCqt] = useState("");
  const [keHoach, datKeHoach] = useState<"co" | "khong" | "">("co");
  const [trangThai, datTrangThai] = useState("");
  const [trang, datTrang] = useState(1);
  /* Dòng đang mở nằm trong ĐỊA CHỈ — The URL Is The State Rule. Nó chỉ mô tả
     thứ đang xem, không thực hiện hành động nào. */
  const [dangMo, datDangMo] = useThamSo<string>("so", "");
  /* Nhớ nơi vừa bấm để trả focus về đúng hàng khi đóng ngăn trượt — người
     dùng bàn phím không bị ném về đầu bảng sau mỗi lần xem chi tiết. */
  const noiBam = useRef<HTMLButtonElement | null>(null);

  const tatCa = useMemo(
    () => trongPhamVi.flatMap((dv) => dsKTTBCuaDonVi(hatKy, dv)),
    [trongPhamVi, hatKy],
  );

  const loc = useMemo(() => {
    const t = tim.trim().toLowerCase();
    return tatCa.filter((d) => {
      if (cqt && d.donViId !== cqt) return false;
      if (keHoach === "co" && d.trongKeHoach !== 1) return false;
      if (keHoach === "khong" && d.trongKeHoach === 1) return false;
      if (trangThai && (d as unknown as Record<string, number>)[trangThai] !== 1) return false;
      if (!t) return true;
      return d.mst.includes(t) || d.tenNNT.toLowerCase().includes(t);
    });
  }, [tatCa, tim, cqt, keHoach, trangThai]);

  /*
    HAI con số, không một.

    Số dòng là số HỒ SƠ; cột (3) của mẫu báo cáo đếm DOANH NGHIỆP, và chỉ đếm
    tờ khai được đếm — TNDN của năm trước. In một con số rồi để người đọc tự
    đoán nó ứng với ô nào trên báo cáo là cách chắc nhất khiến họ kết luận bản
    mẫu sai, trong khi hai con số đang trả lời hai câu hỏi khác nhau.
  */
  const soDN = useMemo(() => new Set(loc.filter(duocDem).map((d) => d.mst)).size, [loc]);

  const chon = useMemo(() => loc.find((d) => d.id === dangMo) ?? null, [loc, dangMo]);

  const soTrang = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const trangHienTai = Math.min(trang, soTrang);
  const hang = loc.slice((trangHienTai - 1) * MOI_TRANG, trangHienTai * MOI_TRANG);
  const coLoc = tim !== "" || cqt !== "" || keHoach !== "co" || trangThai !== "";

  const doiLoc = (f: () => void) => { f(); datTrang(1); datDangMo(""); };
  const dong = () => {
    datDangMo("");
    requestAnimationFrame(() => noiBam.current?.focus());
  };

  return <CaseLayout
    presentation="drawer"
    label={chon ? `Hồ sơ ${chon.mst}` : "Chi tiết hồ sơ"}
    mobileOpen={Boolean(chon)}
    onClose={dong}
    detail={chon ? <ChiTiet d={chon}/> : null}
  >
    <Panel chinh
      title="Danh sách NNT đã kiểm tra tại bàn"
      subtitle={`${money(loc.length)} hồ sơ khai thuế · ${money(soDN)} doanh nghiệp được đếm vào báo cáo`}
      actions={<div className="inline-controls">
        <SearchField value={tim} onChange={(v) => doiLoc(() => datTim(v))} placeholder="Tìm MST hoặc tên NNT"/>
        {/*
          CQT là BỘ LỌC, không phải cột. Nó đứng đầu hàng điều khiển vì nó thu
          hẹp mạnh nhất: một đơn vị vài trăm dòng, toàn ngành vài nghìn.
        */}
        <label className="compact-field"><span>CQT</span>
          <select value={cqt} onChange={(e) => doiLoc(() => datCqt(e.target.value))}>
            <option value="">Tất cả đơn vị</option>
            {trongPhamVi.map((dv) => <option key={dv.id} value={dv.id}>{rutGonTenDonVi(dv.ten)}</option>)}
          </select>
        </label>
        <label className="compact-field"><span>Trong kế hoạch</span>
          <select value={keHoach} onChange={(e) => doiLoc(() => datKeHoach(e.target.value as "co" | "khong" | ""))}>
            <option value="co">Có</option>
            <option value="khong">Không</option>
            <option value="">Tất cả</option>
          </select>
        </label>
        <label className="compact-field"><span>Trạng thái</span>
          <select value={trangThai} onChange={(e) => doiLoc(() => datTrangThai(e.target.value))}>
            <option value="">Tất cả</option>
            {TRANG_THAI.map((t) => <option key={t.khoa} value={t.khoa}>{t.nhan}</option>)}
          </select>
        </label>
        {coLoc && <Button kind="quiet" onClick={() => doiLoc(() => { datTim(""); datCqt(""); datKeHoach("co"); datTrangThai(""); })}>Đặt lại</Button>}
      </div>}
    >
      <TableWrap label="danh sách hồ sơ khai thuế đã kiểm tra tại bàn">
        <table className="ql1-ds-table" style={{ minWidth: RONG }}>
          <colgroup>{RONG_COT.map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
          <thead><tr>
            <th scope="col">Tên NNT</th>
            <th scope="col">MST</th>
            <th scope="col">Loại thuế</th>
            <th scope="col">Kỳ kê khai</th>
            <th scope="col">Trạng thái hồ sơ</th>
          </tr></thead>
          <tbody>
            {hang.map((d) => {
              const tt = trangThaiCua(d);
              return <tr
                key={d.id}
                className={d.id === dangMo ? "is-selected" : undefined}
                onClick={(e) => {
                  noiBam.current = e.currentTarget.querySelector<HTMLButtonElement>(".row-select");
                  datDangMo(d.id === dangMo ? "" : d.id);
                }}
              >
                {/* Cả hàng bấm được, và nút phủ hết ô đầu để bàn phím cũng mở
                    được dòng — The Whole Row Rule. */}
                <td><button type="button" className="row-select" aria-expanded={d.id === dangMo} title={d.tenNNT}>{d.tenNNT}</button></td>
                <td>{d.mst}</td>
                <td title={d.loaiThue}>{MA_THUE[d.loaiThue] ?? d.loaiThue}</td>
                <td>{d.kyKeKhai}</td>
                <td>{tt ? <Badge tone={tt.sac}>{tt.nhan}</Badge> : <span className="cell-empty">—</span>}</td>
              </tr>;
            })}
            {loc.length === 0 && <tr><td className="table-empty" colSpan={RONG_COT.length}>Không có hồ sơ nào khớp bộ lọc đang đặt.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
      <footer className="table-footer">
        <Pager trang={trangHienTai} soTrang={soTrang} onChange={(t) => { datTrang(t); datDangMo(""); }}/>
        {/* Tệp ra GIỐNG HỆT sheet `Data` của phòng — xem `sheetKTTB`. Phạm vi
            không nhét thêm số dòng vào `scope`: khuôn gốc có chỗ riêng cho nó,
            và `scope` là thứ in ra dòng tên cơ quan ở đầu sheet. */}
        <ExportButton onExport={() => exportExcel(
          [sheetKTTB(loc, meta, ky)],
          meta,
          `${tenTep}_danh-sach-nnt.xlsx`,
        )}>Xuất danh sách đang lọc</ExportButton>
      </footer>
    </Panel>
  </CaseLayout>;
}

function ChiTiet({ d }: { d: DongKTTB }) {
  return <div className="ql3-chitiet">
    <p className="ql3-chitiet-ten"><strong>{d.tenNNT}</strong><span>{rutGonTenDonVi(d.donVi)}</span></p>
    <DetailGrid items={[
      { label: "Loại thuế", value: d.loaiThue },
      { label: "Kỳ kê khai", value: d.kyKeKhai },
      { label: "Trạng thái hồ sơ", value: trangThaiCua(d)?.nhan ?? "—" },
      { label: "Được đếm vào báo cáo", value: duocDem(d) ? "Có" : "Không" },
      { label: "Trong kế hoạch năm (Tích 1)", value: d.trongKeHoach === 1 ? "Có" : "Không" },
      { label: "Hồ sơ năm trước chuyển sang", value: d.hoSoChuyenSang === 1 ? "Có" : "Không" },
      { label: "Kế hoạch đầu năm/tháng", value: d.keHoachDauNam || "—" },
      { label: "Số QĐ phạt", value: d.soQDPhat || "—" },
      { label: "Ngày quyết định", value: d.ngayQuyetDinh || "—" },
    ]}/>
    {/*
      Cột tiền của sheet, đủ mười hai cột, không rút gọn.

      Sheet KTTB KHÔNG có cột doanh thu — nó là báo cáo kết quả kiểm tra hồ sơ
      khai thuế, nên thứ nó ghi là số thuế điều chỉnh, truy thu, khấu trừ, lỗ,
      phạt và nộp chậm. Doanh thu nằm ở báo cáo của phòng QL2 (chênh lệch tờ
      khai – hóa đơn), không nằm ở đây.
    */}
    <h3 className="ql3-chitiet-de">Số tiền theo hồ sơ</h3>
    <DetailGrid items={COT_TIEN.map((c) => ({
      label: c.nhan,
      value: Number(d[c.khoa]) > 0
        ? <strong>{money(Number(d[c.khoa]))}</strong>
        : <span className="cell-empty">—</span>,
    }))}/>
    <p className="quality-note">Đơn vị: đồng. Dấu gạch nghĩa là hồ sơ không phát sinh khoản đó, không phải bằng không.</p>
  </div>;
}
