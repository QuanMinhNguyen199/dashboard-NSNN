import { useEffect, useMemo, type ReactNode } from "react";
import { PageIntro, Panel, TableWrap, integer, money } from "@/components/ui";
import { BoLocChung, useBoLoc } from "@/components/BoLoc";
import { ExportButton } from "@/components/ExportButton";
import { XuatProvider } from "@/components/ui";
import { useDuyet } from "@/state/DuyetContext";
import { ql3Workbook, type ReportMeta } from "@/domain/reportExport";
import { exportExcel } from "@/domain/reportFiles";
import { useAction } from "@/state/ActionContext";
import { hienTyLe } from "@/data/thamSo";
import {
  DON_VI_QL3, KY_QL3, KY_QL3_THEO_ID, congQL3, danhGiaQL3,
  type DonViQL3, type ODanhGiaQL3,
} from "@/data/ql3";
import { ThanhDuyet, useChoXemTruoc } from "@/features/ThanhDuyet";
import { KhoiXemTruoc, NutXemTruoc } from "@/features/XemTruocBaoCao";
import { useThamSo } from "@/state/diaChi";
import { useKpi } from "@/state/KpiContext";
import type { VaiTro } from "@/domain/types";
import { useMucPhanHe } from "@/components/MucPhanHe";
import { DanhSachDNQL3 } from "@/features/DanhSachDNQL3";

import { KpiQL3 } from "@/features/KpiQL3";

/*
  Kết quả kiểm tra tại bàn theo kế hoạch năm — BR-QL3-01.

  Bản trước dựng màn này thành một bảng sáu cột liệt kê từng doanh nghiệp kèm
  hệ số K. Hệ số K là việc của QL2 (BR-QL2-02), không phải QL3; và QL3 không
  đọc màn này theo từng doanh nghiệp mà theo ĐƠN VỊ — ai đạt kế hoạch, ai tụt.

  Cấu trúc lấy đúng file kết xuất: 17 cột chia bốn cụm, kỳ lũy kế từ đầu năm,
  dòng tổng toàn ngành rồi hai khối.
*/

/* Tỷ lệ theo BC-10 của FRS: hai chữ số thập phân, mẫu số bằng 0 thì để trống.
   Dùng chung `hienTyLe` để bốn màn không mỗi màn một cách làm tròn. */
const pt = (x: number) => hienTyLe(Number.isFinite(x) && x >= 0 ? x : null);

function TyLe({ x, nguong = 1 }: { x: number; nguong?: number }) {
  const w = Math.max(0, Math.min(1, Number.isFinite(x) ? x / nguong : 0)) * 100;
  return <span className="ty-le"><b>{pt(x)}</b><i><span style={{ width: `${w}%` }}/></i></span>;
}

const SO = (v: number) => <span className="num">{integer(v)}</span>;
/* Năm cột kết quả ghi bằng ĐỒNG trong file gốc nhưng quy về triệu để đọc được:
   "9.063.048.043" bắt người đọc đếm chữ số mới biết là chín tỷ. */
const TIEN = (v: number) => <span className="num">{v === 0 ? <span className="cell-empty">—</span> : money(v / 1e6)}</span>;

interface NhomCot { nhan: string; cot: { nhan: string; o: (t: ODanhGiaQL3) => ReactNode; rong: number }[] }

const NHOM_COT = (thangKPI: string, nam: string): NhomCot[] => [
  {
    nhan: "Kế hoạch năm và tiến độ",
    cot: [
      { nhan: `Số DN kế hoạch ${nam}`, o: (t) => SO(t.keHoach), rong: 120 },
      { nhan: "Đã thực hiện", o: (t) => SO(t.daThucHien), rong: 108 },
      { nhan: "Tỷ lệ thực hiện", o: (t) => <TyLe x={t.daThucHien / t.keHoach}/>, rong: 112 },
      { nhan: "Đã hoàn thành", o: (t) => SO(t.daHoanThanh), rong: 112 },
      { nhan: "Tỷ lệ hoàn thành/kế hoạch", o: (t) => <TyLe x={t.daHoanThanh / t.keHoach}/>, rong: 116 },
    ],
  },
  {
    /* KPI do chính đơn vị tự đăng ký theo tháng, nên tỷ lệ ở đây vượt 100% là
       bình thường — thanh phải đo theo mốc 100% chứ không co về vừa khít. */
    nhan: `KPI ${thangKPI} đơn vị tự đăng ký`,
    cot: [
      { nhan: "KPI đăng ký", o: (t) => SO(t.kpiDangKy), rong: 108 },
      { nhan: "Tỷ lệ hoàn thành", o: (t) => <TyLe x={t.daHoanThanh / t.kpiDangKy}/>, rong: 124 },
    ],
  },
  {
    nhan: "Kết quả theo trạng thái (số DN)",
    cot: [
      { nhan: "Chấp nhận", o: (t) => SO(t.chapNhan), rong: 100 },
      { nhan: "Chờ giải trình", o: (t) => SO(t.choGiaiTrinh), rong: 112 },
      { nhan: "Điều chỉnh thuế", o: (t) => SO(t.dieuChinh), rong: 116 },
      { nhan: "Đề nghị kiểm tra tại DN", o: (t) => SO(t.deNghiKiemTra), rong: 132 },
    ],
  },
  {
    nhan: "Kết quả điều chỉnh thuế · triệu đồng",
    cot: [
      { nhan: "Tổng tăng thu", o: (t) => TIEN(t.tangThu), rong: 118 },
      { nhan: "Giảm khấu trừ", o: (t) => TIEN(t.giamKhauTru), rong: 118 },
      { nhan: "Giảm lỗ", o: (t) => TIEN(t.giamLo), rong: 112 },
      { nhan: "Tiền phạt", o: (t) => TIEN(t.tienPhat), rong: 108 },
      { nhan: "Tiền nộp chậm", o: (t) => TIEN(t.nopCham), rong: 118 },
    ],
  },
];

const RONG_DV = 196;

export function RiskQL3({ actor, vaiTro, ketQua = false }: { actor: string; vaiTro: VaiTro; ketQua?: boolean }) {
  const notify = useAction();
  const { layBanGhi } = useDuyet();
  const { chon, datDonVi } = useBoLoc();
  /* Mục lấy từ cụm trong THANH BÊN, giống QL1 và QL2 — xem ghi chú ở
     `components/MucPhanHe.tsx` về vì sao dải mục trên trang đã bỏ. Bản xem
     trước vẫn nằm trong địa chỉ như cũ. */
  const { muc } = useMucPhanHe();
  const { layKpi } = useKpi();
  const tab = ketQua ? "ketqua" : muc;
  const [xem, datXem] = useThamSo<string>("xem", "");
  const ky = KY_QL3_THEO_ID[chon.ky] ?? KY_QL3[0];

  /*
    Bảng tổng hợp đọc KPI ĐÃ ĐĂNG KÝ, không đọc số sinh sẵn.

    Cột (7) của mẫu là số đơn vị tự đăng ký, và cột (8) chia cho nó. Nếu màn
    KPI cho sửa mà bảng này vẫn giữ số cũ thì sửa xong không thấy gì đổi — và
    người dùng kết luận nút Lưu không chạy.
  */
  const oCua = useMemo(
    () => new Map(DON_VI_QL3.map((dv) => {
      const o = danhGiaQL3(ky.hat, dv);
      const dk = layKpi(ky.id, dv.id);
      return [dv.id, dk === null ? o : { ...o, kpiDangKy: dk }] as const;
    })),
    [ky, layKpi],
  );

  const dangChon = chon.donVi.length ? new Set(chon.donVi) : null;
  const trongPhamVi = DON_VI_QL3.filter((dv) => !dangChon || dangChon.has(dv.ten));
  const khoi = (g: "VP" | "TCS") => trongPhamVi.filter((dv) => dv.nhom === g);

  const toan = useMemo(() => congQL3(trongPhamVi.map((dv) => oCua.get(dv.id)!)), [trongPhamVi, oCua]);
  const nhomCot = NHOM_COT(ky.thangKPI, ky.denNgay.slice(-4));
  const cotPhang = nhomCot.flatMap((n) => n.cot);

  /* Không còn đo chiều cao hàng tiêu đề: cả `thead` dính thành một khối, xem
     ghi chú cuối `styles.css`. */
  const chonDonVi = (dv: DonViQL3) => {
    datDonVi([dv.ten]);
    notify(`Đã lọc về ${dv.ten}. Bấm Đặt lại ở thanh đầu trang để xem lại toàn ngành.`);
  };

  const hangDonVi = (dv: DonViQL3) => <tr key={dv.id}>
    <th scope="row"><button type="button" className="dv-nut" onClick={() => chonDonVi(dv)}><span>{dv.ten}</span></button></th>
    {cotPhang.map((c, i) => <td key={i}>{c.o(oCua.get(dv.id)!)}</td>)}
  </tr>;

  const hangGop = (nhan: string, o: ODanhGiaQL3, lop: string) => <tr className={lop}>
    <th scope="row"><span>{nhan}</span></th>
    {cotPhang.map((c, i) => <td key={i}>{c.o(o)}</td>)}
  </tr>;

  const boSheet = useMemo(() => ql3Workbook(ky, trongPhamVi, (id) => layKpi(ky.id, id)), [ky, trongPhamVi, layKpi]);
  /* Hết lượt thì khối xem trước đóng lại VÀ địa chỉ sạch theo. Để lại `?xem=`
     là để lại một liên kết mở ra đúng thứ người nhận không được xem. */
  const choXem = useChoXemTruoc(`QL3|${ky.id}`);
  useEffect(() => { if (!choXem && xem !== "") datXem(""); }, [choXem, xem, datXem]);
  const moMoXemTruoc = choXem && xem !== "" && boSheet.some((x) => x.name === xem);
  const reportMeta: ReportMeta = { period: ky.nhan, scope: chon.donVi.join("; ") || "Toàn ngành", actor, status: layBanGhi(`QL3|${ky.id}`).trangThai };
  const exportReport = () => exportExcel(ql3Workbook(ky, trongPhamVi, (id) => layKpi(ky.id, id)), reportMeta, `QL3_${ky.id}_${reportMeta.status}_mo-phong.xlsx`);
  return <XuatProvider nut={<ExportButton onExport={exportReport}>Xuất Excel</ExportButton>}><div className="page-stack ql1-page">
    <PageIntro title={ketQua ? "Kết quả tổng hợp · Phòng QL3" : "Kiểm tra tại bàn · Phòng QL3"}/>

    <ThanhDuyet
      khoa={`QL3|${ky.id}`}
      nhanKy={`Báo cáo ${ky.nhan.toLowerCase()}`}
      xemTruoc={<NutXemTruoc mo={moMoXemTruoc} onToggle={() => datXem(moMoXemTruoc ? "" : boSheet[0]?.name ?? "")}/>}
      tomTat={[["Bộ sheet sẽ gửi", `${boSheet.length} sheet`], ["Phạm vi", reportMeta.scope]]}
    />

    {/* Khối xem trước nằm NGAY SAU thanh duyệt, trong luồng trang. */}
    {moMoXemTruoc && <KhoiXemTruoc
      sheets={boSheet}
      meta={reportMeta}
      ten="Kết quả kiểm tra tại bàn · Phòng QL3"
      sheet={xem}
      onChonSheet={datXem}
    />}

    {/*
      Kỳ của QL3 là LŨY KẾ từ 01/01, không phải tuần hay tháng rời như QL1,
      nên thanh lọc chỉ nhận một danh sách kỳ phẳng — không có công tắc loại kỳ.
    */}
    <BoLocChung
      kyCo={KY_QL3.map((k) => ({ id: k.id, nhan: k.nhan, loai: "THANG" as const }))}
      donViCo={DON_VI_QL3.map((d) => ({ id: d.id, ten: d.ten }))}
      phuChu={`${trongPhamVi.length}/${DON_VI_QL3.length} đơn vị trong phạm vi`}
    />

    {tab === "tongquan" && <TongQuanQL3 toan={toan} trongPhamVi={trongPhamVi} oCua={oCua} ky={ky}/>}

    {tab === "dsnnt" && <DanhSachDNQL3
      trongPhamVi={trongPhamVi}
      hatKy={ky.hat}
      ky={ky}
      meta={reportMeta}
      tenTep={`QL3_${ky.id}`}
    />}

    {tab === "kpi" && <KpiQL3 trongPhamVi={trongPhamVi} ky={ky} vaiTro={vaiTro}/>}
    {tab === "ketqua" && <Panel chinh title="Tổng hợp kết quả theo đơn vị" subtitle={`Lũy kế đến ${ky.denNgay}`}>
      {trongPhamVi.length === 0
        ? <div className="empty-state"><strong>Không có đơn vị nào trong phạm vi lọc</strong></div>
        : <TableWrap label="tổng hợp kết quả kiểm tra tại bàn theo đơn vị"><table
            className="ql1-table ql3-table"
            style={{ minWidth: RONG_DV + cotPhang.reduce((t, c) => t + c.rong, 0) }}
          >
            <colgroup><col style={{ width: RONG_DV }}/>{cotPhang.map((c, i) => <col key={i} style={{ width: c.rong }}/>)}</colgroup>
            <thead>
              <tr>
                <th scope="col" rowSpan={2} className="dv-cot">Cơ quan Thuế thực hiện</th>
                {nhomCot.map((n) => <th key={n.nhan} scope="colgroup" colSpan={n.cot.length} className="nhom">{n.nhan}</th>)}
              </tr>
              <tr>{nhomCot.flatMap((n) => n.cot.map((c) => <th key={`${n.nhan}-${c.nhan}`} scope="col" className="num">{c.nhan}</th>))}</tr>
            </thead>
            <tbody>
              {hangGop("Tổng cộng toàn ngành", toan, "is-tong")}
              {khoi("VP").length > 0 && <>
                {hangGop("I. Khối VP Thuế TP Hà Nội", congQL3(khoi("VP").map((dv) => oCua.get(dv.id)!)), "is-khoi")}
                {khoi("VP").map(hangDonVi)}
              </>}
              {khoi("TCS").length > 0 && <>
                {hangGop("II. Khối các Thuế cơ sở", congQL3(khoi("TCS").map((dv) => oCua.get(dv.id)!)), "is-khoi")}
                {khoi("TCS").map(hangDonVi)}
              </>}
            </tbody>
          </table></TableWrap>}
      <footer className="table-footer">
        <p className="bang-ghi-chu">
          Cột "đã hoàn thành" không tính hồ sơ đang chờ giải trình, nên luôn nhỏ hơn "đã thực hiện".
          Tỷ lệ theo KPI vượt 100% là bình thường, vì KPI do từng đơn vị tự đăng ký theo tháng.
        </p>
      </footer>
    </Panel>}
  </div></XuatProvider>;
}

const pt2 = pt;

/*
  Tab Tổng quan của QL3 — §5.3.

  Cùng ràng buộc với tổng quan QL1: mọi số ở đây đã có trong tab Kết quả tổng
  hợp, không sinh chỉ tiêu mới. Khối xếp hạng tô riêng đơn vị dưới KPI, vì đó
  là nhóm cần đôn đốc chứ không phải nhóm xếp cuối bảng.
*/
function TongQuanQL3({ toan, trongPhamVi, oCua, ky }: {
  toan: ODanhGiaQL3;
  trongPhamVi: DonViQL3[];
  oCua: Map<string, ODanhGiaQL3>;
  ky: { denNgay: string; thangKPI: string };
}) {
  if (trongPhamVi.length === 0) {
    return <Panel chinh title="Tổng quan"><div className="empty-state"><strong>Không có đơn vị nào trong phạm vi lọc</strong></div></Panel>;
  }
  const xep = trongPhamVi
    .map((dv) => { const o = oCua.get(dv.id)!; return { dv, x: o.keHoach ? o.daHoanThanh / o.keHoach : 0, duoiKPI: o.kpiDangKy > 0 && o.daHoanThanh < o.kpiDangKy }; })
    .sort((a, b) => a.x - b.x)
    .slice(0, 10);
  const trangThai = [
    { nhan: "Chấp nhận", v: toan.chapNhan },
    { nhan: "Chờ giải trình", v: toan.choGiaiTrinh },
    { nhan: "Điều chỉnh thuế", v: toan.dieuChinh },
    { nhan: "Đề nghị kiểm tra tại DN", v: toan.deNghiKiemTra },
  ];
  const tongTT = trangThai.reduce((t, x) => t + x.v, 0);

  return <>
    <Panel chinh title="Tiến độ kế hoạch năm" subtitle={`Lũy kế đến ${ky.denNgay}`}>
      <div className="the-luoi">
        <div className="the-so"><span className="the-nhan">Trong kế hoạch</span><strong className="the-gia">{integer(toan.keHoach)}</strong><span className="the-dvt">doanh nghiệp</span></div>
        <div className="the-so"><span className="the-nhan">Đã thực hiện</span><strong className="the-gia">{integer(toan.daThucHien)}</strong><span className="the-dvt">doanh nghiệp</span></div>
        <div className="the-so"><span className="the-nhan">Đã hoàn thành</span><strong className="the-gia">{integer(toan.daHoanThanh)}</strong><span className="the-dvt">doanh nghiệp</span></div>
        <div className="the-so"><span className="the-nhan">Tỷ lệ hoàn thành/kế hoạch</span><strong className="the-gia">{pt2(toan.daHoanThanh / toan.keHoach)}</strong><span className="the-dvt">theo số doanh nghiệp</span></div>
        <div className="the-so"><span className="the-nhan">Tỷ lệ hoàn thành/KPI {ky.thangKPI}</span><strong className="the-gia">{pt2(toan.daHoanThanh / toan.kpiDangKy)}</strong><span className="the-dvt">theo số doanh nghiệp</span></div>
      </div>
    </Panel>

    <div className="tq-doi">
      <Panel title="Kết quả điều chỉnh thuế" subtitle="Triệu đồng">
        <div className="the-luoi is-hep">
          <div className="the-so"><span className="the-nhan">Tổng tăng thu</span><strong className="the-gia">{money(toan.tangThu / 1e6)}</strong><span className="the-dvt">triệu đồng</span></div>
          <div className="the-so"><span className="the-nhan">Tiền phạt</span><strong className="the-gia">{money(toan.tienPhat / 1e6)}</strong><span className="the-dvt">triệu đồng</span></div>
          <div className="the-so"><span className="the-nhan">Tiền nộp chậm</span><strong className="the-gia">{money(toan.nopCham / 1e6)}</strong><span className="the-dvt">triệu đồng</span></div>
        </div>
      </Panel>

      <Panel title="Phân bổ doanh nghiệp đã thực hiện" subtitle="Theo trạng thái xử lý">
        <ol className="xep-hang">{trangThai.map((x) => <li key={x.nhan}>
          <span className="xh-ten">{x.nhan}</span>
          <span className="xh-so">{integer(x.v)} · {pt2(tongTT ? x.v / tongTT : 0)}</span>
          <span className="xh-thanh"><i style={{ width: `${tongTT ? Math.max(1, (x.v / tongTT) * 100) : 0}%` }}/></span>
        </li>)}</ol>
      </Panel>
    </div>

    <Panel title="Đơn vị có tỷ lệ hoàn thành thấp nhất" subtitle="So với kế hoạch năm">
      <ol className="xep-hang">{xep.map((x) => <li key={x.dv.id}>
        <span className="xh-ten">{x.dv.ten}{x.duoiKPI && <em className="xh-co"> dưới KPI</em>}</span>
        <span className="xh-so">{pt2(x.x)}</span>
        <span className="xh-thanh"><i className={x.duoiKPI ? "is-canh-bao" : undefined} style={{ width: `${Math.max(2, x.x * 100)}%` }}/></span>
      </li>)}</ol>
    </Panel>
  </>;
}
