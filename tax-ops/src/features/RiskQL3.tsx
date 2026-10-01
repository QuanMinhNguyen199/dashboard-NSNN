import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, PageIntro, Panel, Segmented, TableWrap, integer, money } from "@/components/ui";
import { BoLocChung, useBoLoc } from "@/components/BoLoc";
import { useAction } from "@/state/ActionContext";
import {
  DON_VI_QL3, KY_QL3, KY_QL3_THEO_ID, congQL3, danhGiaQL3,
  type DonViQL3, type ODanhGiaQL3,
} from "@/data/ql3";
import { NGUON_QL3 } from "@/data/nguonDuLieu";
import { DuLieuGoc } from "@/features/DuLieuGoc";

/* Bốn tab của §5.2 bản thiết kế. */
type TabQL3 = "tongquan" | "ketqua" | "nguon" | "doichieu";

/*
  Kết quả kiểm tra tại bàn theo kế hoạch năm — BR-QL3-01.

  Bản trước dựng màn này thành một bảng sáu cột liệt kê từng doanh nghiệp kèm
  hệ số K. Hệ số K là việc của QL2 (BR-QL2-02), không phải QL3; và QL3 không
  đọc màn này theo từng doanh nghiệp mà theo ĐƠN VỊ — ai đạt kế hoạch, ai tụt.

  Cấu trúc lấy đúng file kết xuất: 17 cột chia bốn cụm, kỳ lũy kế từ đầu năm,
  dòng tổng toàn ngành rồi hai khối.
*/

const pt = (x: number) => Number.isFinite(x) && x >= 0 ? `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(x * 100)}%` : "—";

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
      { nhan: "Tỷ lệ / kế hoạch", o: (t) => <TyLe x={t.daHoanThanh / t.keHoach}/>, rong: 116 },
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

export function RiskQL3() {
  const notify = useAction();
  const { chon, datDonVi } = useBoLoc();
  const [tab, setTab] = useState<TabQL3>("tongquan");
  const ky = KY_QL3_THEO_ID[chon.ky] ?? KY_QL3[0];

  const oCua = useMemo(
    () => new Map(DON_VI_QL3.map((dv) => [dv.id, danhGiaQL3(ky.hat, dv)])),
    [ky],
  );

  const dangChon = chon.donVi.length ? new Set(chon.donVi) : null;
  const trongPhamVi = DON_VI_QL3.filter((dv) => !dangChon || dangChon.has(dv.ten));
  const khoi = (g: "VP" | "TCS") => trongPhamVi.filter((dv) => dv.nhom === g);

  const toan = useMemo(() => congQL3(trongPhamVi.map((dv) => oCua.get(dv.id)!)), [trongPhamVi, oCua]);
  const nhomCot = NHOM_COT(ky.thangKPI, ky.denNgay.slice(-4));
  const cotPhang = nhomCot.flatMap((n) => n.cot);

  /* Dòng tiêu đề thứ hai dính ở đáy dòng thứ nhất — cùng lý do đã ghi ở
     DebtQL1: khai cứng chiều cao thì nhãn nhóm xuống dòng là hở một dải. */
  const dauRef = useRef<HTMLTableSectionElement>(null);
  const [caoDau, setCaoDau] = useState(34);
  useLayoutEffect(() => {
    const dong = dauRef.current?.rows[0];
    if (!dong) return;
    const do_ = () => setCaoDau(dong.getBoundingClientRect().height);
    do_();
    const ro = new ResizeObserver(do_);
    ro.observe(dong);
    return () => ro.disconnect();
  }, [trongPhamVi.length]);

  const chonDonVi = (dv: DonViQL3) => {
    datDonVi([dv.ten]);
    notify(`Đã lọc về ${dv.ten}. Bỏ lọc ở thanh đầu trang để xem lại toàn ngành.`);
  };

  const hangDonVi = (dv: DonViQL3) => <tr key={dv.id}>
    <th scope="row"><button type="button" className="dv-nut" onClick={() => chonDonVi(dv)}><span>{dv.ten}</span></button></th>
    {cotPhang.map((c, i) => <td key={i}>{c.o(oCua.get(dv.id)!)}</td>)}
  </tr>;

  const hangGop = (nhan: string, o: ODanhGiaQL3, lop: string) => <tr className={lop}>
    <th scope="row"><span>{nhan}</span></th>
    {cotPhang.map((c, i) => <td key={i}>{c.o(o)}</td>)}
  </tr>;

  return <div className="page-stack ql1-page">
    <PageIntro
      title="Kiểm tra tại bàn · Phòng QL3"
      description="Kết quả kiểm tra hồ sơ khai thuế tại trụ sở cơ quan thuế, đối với doanh nghiệp trong kế hoạch năm. Số liệu trong bản demo là dữ liệu giả."
    />

    {/*
      Kỳ của QL3 là LŨY KẾ từ 01/01, không phải tuần hay tháng rời như QL1,
      nên thanh lọc chỉ nhận một danh sách kỳ phẳng — không có công tắc loại kỳ.
    */}
    <BoLocChung
      kyCo={KY_QL3.map((k) => ({ id: k.id, nhan: k.nhan, loai: "THANG" as const }))}
      donViCo={DON_VI_QL3.map((d) => d.ten)}
      phuChu={`${trongPhamVi.length}/${DON_VI_QL3.length} đơn vị trong phạm vi`}
    />

    <Segmented
      label="Mục báo cáo kiểm tra tại bàn"
      value={tab}
      onChange={setTab}
      options={[
        { value: "tongquan" as TabQL3, label: "Tổng quan" },
        { value: "ketqua" as TabQL3, label: "Kết quả tổng hợp" },
        { value: "nguon" as TabQL3, label: "Dữ liệu gốc" },
        { value: "doichieu" as TabQL3, label: "Đối chiếu bản làm tay" },
      ]}
    />

    {tab === "tongquan" && <TongQuanQL3 toan={toan} trongPhamVi={trongPhamVi} oCua={oCua} ky={ky}/>}

    {tab === "nguon" && <DuLieuGoc nguon={NGUON_QL3} ngayBaoCao={ky.denNgay}/>}

    {/*
      Tab đối chiếu bản làm tay được bản thiết kế đánh dấu [R] — thí điểm, chưa
      chốt. Nên nó nói thẳng mình chưa có dữ liệu thay vì dựng một bảng rỗng
      trông như đã chạy; xem Blocked State trong DESIGN.md.
    */}
    {tab === "doichieu" && <Panel title="Đối chiếu với bản làm tay của phòng">
      <div className="blocked-head">
        <strong>Chưa có bản làm tay nào được tải lên cho kỳ này</strong>
        <p>
          Đối chiếu cần hai phía. Số hệ thống của kỳ lũy kế đến {ky.denNgay} đã có; bản phòng tự lập
          chưa nhận được, nên chưa so được ô nào.
        </p>
      </div>
      <ol className="blocker-list">
        <li>
          <span className="blocker-so">0/1</span>
          <span className="blocker-noi">
            <strong>Chưa nhận bản làm tay của kỳ</strong>
            <small>Tiêu chí nghiệm thu NT-01 đòi chạy song song tối thiểu hai kỳ, nên bước này phải có bản phòng lập mới bắt đầu được.</small>
          </span>
          <Button kind="secondary" onClick={() => notify("Bản demo chưa dựng chức năng tải lên. Bản thật nhận file Excel phòng tự lập rồi so từng ô.")}>Tải bản làm tay lên</Button>
        </li>
      </ol>
      <p className="blocked-done">Đã đạt: số hệ thống của kỳ đã chốt · danh mục đơn vị đã khớp giữa hai bên.</p>
    </Panel>}

    {tab === "ketqua" && <Panel title="Tổng hợp kết quả theo đơn vị" subtitle={`Lũy kế đến ${ky.denNgay}`}>
      {trongPhamVi.length === 0
        ? <div className="empty-state"><strong>Không có đơn vị nào trong phạm vi lọc</strong></div>
        : <TableWrap label="tổng hợp kết quả kiểm tra tại bàn theo đơn vị"><table
            className="ql1-table ql3-table"
            style={{ minWidth: RONG_DV + cotPhang.reduce((t, c) => t + c.rong, 0), ["--cao-dau" as string]: `${caoDau}px` }}
          >
            <colgroup><col style={{ width: RONG_DV }}/>{cotPhang.map((c, i) => <col key={i} style={{ width: c.rong }}/>)}</colgroup>
            <thead ref={dauRef}>
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
          Đã hoàn thành không tính hồ sơ chờ giải trình, nên nó luôn nhỏ hơn đã thực hiện.
          Tỷ lệ theo KPI vượt 100% là bình thường vì KPI do đơn vị tự đăng ký theo tháng.
        </p>
        <Button kind="secondary" onClick={() => notify(`Bản demo chưa hỗ trợ tải file. Bản thật kết xuất đúng 17 cột của mẫu đã duyệt.`)}>Xuất Excel theo mẫu</Button>
      </footer>
    </Panel>}
  </div>;
}

const pt2 = (x: number) => Number.isFinite(x) ? `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(x * 100)}%` : "—";

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
    return <Panel title="Tổng quan"><div className="empty-state"><strong>Không có đơn vị nào trong phạm vi lọc</strong></div></Panel>;
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
    <Panel title="Tiến độ kế hoạch năm" subtitle={`Lũy kế đến ${ky.denNgay} · số lấy từ mục Kết quả tổng hợp`}>
      <div className="the-luoi">
        <div className="the-so"><span className="the-nhan">Trong kế hoạch</span><strong className="the-gia">{integer(toan.keHoach)}</strong><span className="the-dvt">doanh nghiệp</span></div>
        <div className="the-so"><span className="the-nhan">Đã thực hiện</span><strong className="the-gia">{integer(toan.daThucHien)}</strong><span className="the-dvt">{pt2(toan.daThucHien / toan.keHoach)} kế hoạch</span></div>
        <div className="the-so"><span className="the-nhan">Đã hoàn thành</span><strong className="the-gia">{integer(toan.daHoanThanh)}</strong><span className="the-dvt">không tính chờ giải trình</span></div>
        <div className="the-so"><span className="the-nhan">Tỷ lệ / kế hoạch</span><strong className="the-gia">{pt2(toan.daHoanThanh / toan.keHoach)}</strong><span className="the-dvt">theo số doanh nghiệp</span></div>
        <div className="the-so"><span className="the-nhan">Tỷ lệ / KPI {ky.thangKPI}</span><strong className="the-gia">{pt2(toan.daHoanThanh / toan.kpiDangKy)}</strong><span className="the-dvt">KPI đơn vị tự đăng ký</span></div>
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

    <Panel title="Đơn vị có tỷ lệ hoàn thành thấp nhất" subtitle="So với kế hoạch năm · tối đa 10 đơn vị; đơn vị chưa đạt KPI đăng ký được đánh dấu">
      <ol className="xep-hang">{xep.map((x) => <li key={x.dv.id}>
        <span className="xh-ten">{x.dv.ten}{x.duoiKPI && <em className="xh-co"> dưới KPI</em>}</span>
        <span className="xh-so">{pt2(x.x)}</span>
        <span className="xh-thanh"><i className={x.duoiKPI ? "is-canh-bao" : undefined} style={{ width: `${Math.max(2, x.x * 100)}%` }}/></span>
      </li>)}</ol>
    </Panel>
  </>;
}
