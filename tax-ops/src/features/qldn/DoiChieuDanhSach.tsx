import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, NhomNut, Pager, Panel, TableWrap, integer } from "@/components/ui";
import { CaseLayout } from "@/components/CaseLayout";
import { ExportButton } from "@/components/ExportButton";
import { GhiChu } from "@/components/GhiChu";
import { exportExcel } from "@/domain/reportFiles";
import { useThamSo } from "@/state/diaChi";
import { nhanPhamVi, type KyQ, type PhamVi } from "@/data/qldn";
import { NGUONG_MAU, NHAN_NGUYEN_NHAN, SAC_THUE, danhSachDoiChieu, type DongDC, type NguyenNhan, type SacThue } from "@/data/danhSachDoiChieu";
import { tenCQTCua } from "@/data/doiChieuQHNS";
import { HoSoDN } from "@/features/qldn/HoSoDN";

/*
  Đối chiếu nghĩa vụ — danh sách theo phòng, theo cán bộ (biên bản 11/11/2026
  §1, §3; folder 16-11). Trả lời ba câu theo thứ tự:
    1. Ai đang có bao nhiêu DN thừa, thiếu (bảng theo cán bộ hoặc đơn vị —
       bấm một dòng để mở danh sách trong ngăn bên phải, The Whole Row Rule).
    2. DN nào, nguyên nhân dự kiến gì, cần làm việc với ai (danh sách).
    3. Vì sao (bấm DN mở hồ sơ, khối Đối chiếu nghĩa vụ có từng dòng).

  Mẫu: DN nộp thừa trên 500 triệu theo sổ S1 của tab Nộp thừa, lớn nhất trước;
  sắc thuế GTGT mặc định vì là sắc thuế làm trước. Cán bộ chỉ thấy DN của mình.
*/

const CO_TRANG = 10;
const trieu = (dong: number) => (dong ? integer(Math.round(dong / 1e6)) : <span className="cell-empty">0</span>);
/* Hai nhóm của danh sách nộp thừa đã có (biên bản 11/11 §3): trên 500 triệu (mặc định, cả mẫu) và trên 1 tỷ. */
type Nhom = "" | "ty";
const CAN_MOI: NguyenNhan[] = ["PHAN_BO", "NHAM_TM", "THIEU_PS", "THIEU_CT"];

export function DoiChieuDanhSach({ pv, ky, actor }: { pv: PhamVi; ky: KyQ; actor: string }) {
  const [sac, datSac] = useThamSo<SacThue>("sac", "GTGT", ["GTGT", "TNCN", "TNDN"]);
  const [nhom, datNhom] = useThamSo<Nhom>("mau", "", ["", "ty"]);
  const [chon, datChon] = useThamSo<string>("so", "");
  const [trang, datTrang] = useState(1);
  const [mo, datMo] = useThamSo<string>("nnt", "");
  const noiBam = useRef<HTMLButtonElement | null>(null);
  const nutDN = useRef<HTMLButtonElement | null>(null);
  const nutVe = useRef<HTMLButtonElement | null>(null);
  const cuonDanhSach = useRef(0);

  const tatCa = useMemo(() => danhSachDoiChieu(pv, ky.thang, sac), [pv, ky.thang, sac]);
  const theoCanBo = pv.donVi.length === 1;
  const khoaNhom = (x: DongDC) => (theoCanBo ? x.canBo.id : x.la.dvId);
  const tenNhom = (x: DongDC) => (theoCanBo ? x.canBo.ten : pv.donVi.find((d) => d.id === x.la.dvId)?.ngan ?? x.la.nhan);

  const nhomDong = useMemo(() => {
    const m = new Map<string, { ten: string; ds: DongDC[] }>();
    for (const x of tatCa) { const k = khoaNhom(x); const v = m.get(k) ?? { ten: tenNhom(x), ds: [] }; v.ds.push(x); m.set(k, v); }
    return [...m.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.ds.length - a.ds.length || a.ten.localeCompare(b.ten, "vi"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tatCa, theoCanBo]);

  const dangMo = mo ? tatCa.find((x) => x.d.mst === mo) ?? null : null;
  const nhomChon = nhomDong.find((n) => n.id === (chon || (dangMo ? khoaNhom(dangMo) : "")));
  const tenChon = nhomChon?.ten;
  const ds = (pv.canBo ? tatCa : nhomChon?.ds ?? [])
    .filter((x) => !nhom || x.thuaS1 > NGUONG_MAU.ty);
  const soTrang = Math.max(1, Math.ceil(ds.length / CO_TRANG));
  const tr = Math.min(trang, soTrang);

  useEffect(() => {
    if (dangMo) nutVe.current?.focus();
  }, [dangMo]);

  const sacNhan = SAC_THUE.find((s) => s.id === sac)!.nhan;

  const tong = (xs: DongDC[]) => ({
    so: xs.length,
    s1: xs.reduce((a, x) => a + x.thuaS1, 0),
    thua: xs.reduce((a, x) => a + x.thua, 0),
    thieu: xs.reduce((a, x) => a + x.thieu, 0),
    moi: xs.filter((x) => CAN_MOI.includes(x.nguyenNhan)).length,
  });

  const xuat = () => exportExcel([
    {
      name: theoCanBo ? "Theo_can_bo" : "Theo_don_vi", title: `ĐỐI CHIẾU NGHĨA VỤ · ${sacNhan} · THÁNG ${ky.thang}/2026`, unit: "đồng",
      headers: [theoCanBo ? "Cán bộ" : "Đơn vị", "Số DN", "Thừa theo sổ S1", "Thiếu phát sinh phải nộp", "Thiếu khoản đã nộp", "Cần mời lên làm việc"],
      rows: nhomDong.map((n) => { const t = tong(n.ds); return [n.ten, t.so, t.s1, t.thua, t.thieu, t.moi]; }),
    },
    {
      name: "Danh_sach", title: `DOANH NGHIỆP ĐANG THỪA/THIẾU · ${sacNhan}`, unit: "đồng",
      headers: ["Mã CQT", "Tên CQT", "Mã số thuế", "Tên NNT", "Cán bộ", "Thừa theo sổ S1", "Thiếu phát sinh phải nộp", "Thiếu khoản đã nộp", "Nguyên nhân dự kiến", "Đơn vị cần mời lên làm việc"],
      rows: tatCa.map((x) => [x.la.cqt, tenCQTCua(x.la.cqt), x.d.mst, x.d.ten, x.canBo.ten, x.thuaS1, x.thua, x.thieu, NHAN_NGUYEN_NHAN[x.nguyenNhan].nhan, NHAN_NGUYEN_NHAN[x.nguyenNhan].moi(x)]),
    },
  ], { period: `Tháng ${ky.thang}/2026`, scope: nhanPhamVi(pv), actor, status: "DRAFT" }, `doi-chieu-nghia-vu_${sac}_${ky.id}.xlsx`);

  const dong = () => {
    datMo(""); datChon("");
    requestAnimationFrame(() => (pv.canBo ? nutDN : noiBam).current?.focus({ preventScroll: true }));
  };
  const veDanhSach = () => {
    const mst = mo;
    if (!pv.canBo && nhomChon) datChon(nhomChon.id);
    const viTri = ds.findIndex((x) => x.d.mst === mst);
    if (viTri >= 0) datTrang(Math.floor(viTri / CO_TRANG) + 1);
    datMo("");
    requestAnimationFrame(() => {
      const nut = nutDN.current ?? [...document.querySelectorAll<HTMLButtonElement>("[data-dc-mst]")].find((n) => n.dataset.dcMst === mst);
      const ngan = nut?.closest(".case-drawer");
      if (ngan) ngan.scrollTop = cuonDanhSach.current;
      nut?.focus({ preventScroll: true });
    });
  };
  const tc = tong(tatCa);
  const danhSach = (
    <Panel className="dc-list-panel" title={pv.canBo ? "Doanh nghiệp cần đối chiếu" : `${integer(ds.length)} doanh nghiệp`}
      subtitle={`${pv.canBo ? `${integer(ds.length)} doanh nghiệp · ` : ""}${sacNhan} · Triệu đồng`}
      actions={<div className="inline-controls kt-dieu-khien">
        {pv.canBo && <NhomNut<SacThue> label="Sắc thuế" value={sac} onChange={(v) => { datSac(v); datTrang(1); }}
          options={SAC_THUE.map((s) => ({ value: s.id, label: s.id, title: s.nhan }))}/>}
        <NhomNut<Nhom> label="Nhóm mẫu" value={nhom} onChange={(v) => { datNhom(v); datTrang(1); }}
          options={[{ value: "", label: "Trên 500 triệu" }, { value: "ty", label: "Trên 1 tỷ" }]}/>
      </div>}>
      {ds.length ? <TableWrap label="Doanh nghiệp đang thừa/thiếu">
        <table className="qd-bang kt-bang dc-dn-bang">
          <thead><tr>
            <th scope="col">Người nộp thuế</th>
            <th scope="col">Cơ quan thuế</th>
            {!pv.canBo && !theoCanBo && <th scope="col">Cán bộ</th>}
            <th scope="col" className="num">Thừa theo S1</th>
            <th scope="col" className="num">Thiếu phát sinh phải nộp</th>
            <th scope="col" className="num">Thiếu khoản đã nộp</th>
            <th scope="col">Nguyên nhân dự kiến</th>
            <th scope="col">Đơn vị cần mời lên làm việc</th>
          </tr></thead>
          <tbody>{ds.slice((tr - 1) * CO_TRANG, tr * CO_TRANG).map((x) => {
            const nn = NHAN_NGUYEN_NHAN[x.nguyenNhan];
            return <tr key={x.d.mst} className={`qd-viec${mo === x.d.mst ? " is-selected" : ""}`} onClick={(e) => { nutDN.current = e.currentTarget.querySelector("button"); cuonDanhSach.current = e.currentTarget.closest(".case-drawer")?.scrollTop ?? 0; if (!pv.canBo && nhomChon) datChon(nhomChon.id); datMo(x.d.mst); }}>
              <th scope="row"><button type="button" className="row-select" data-dc-mst={x.d.mst}>{x.d.ten}</button><small className="kt-ma">{x.d.mst}</small></th>
              <td>{x.la.cqt}<small className="kt-ma">{tenCQTCua(x.la.cqt)}</small></td>
              {!pv.canBo && !theoCanBo && <td>{x.canBo.ten}</td>}
              <td className="num"><strong>{trieu(x.thuaS1)}</strong></td>
              <td className="num">{trieu(x.thua)}</td>
              <td className="num">{trieu(x.thieu)}</td>
              <td>{nn.nhan ? <span className={`dc-nn is-${nn.muc}`}>{nn.nhan}</span> : <span className="cell-empty">—</span>}</td>
              <td>{nn.moi(x) || <span className="cell-empty">—</span>}</td>
            </tr>;
          })}</tbody>
        </table>
      </TableWrap> : <p className="table-empty">{tatCa.length ? "Không có NNT nào khớp bộ lọc." : "Không có NNT nào."}</p>}
      <div className="table-footer">
        <Pager trang={tr} soTrang={soTrang} onChange={datTrang}/>
      </div>
    </Panel>
  );
  const chiTiet = <div className="dc-drawer-content">
    <div hidden={Boolean(dangMo)}>{!pv.canBo && danhSach}</div>
    {dangMo && <div className="qd-nnt-ho-so">
      <button ref={nutVe} type="button" className="qd-nnt-ve" onClick={veDanhSach}>
        <Icon name="chevronLeft" size={16}/>Danh sách doanh nghiệp{tenChon ? ` của ${tenChon}` : " của tôi"}
      </button>
      <HoSoDN key={dangMo.d.khoa} d={dangMo.d} thang={ky.thang}/>
    </div>}
  </div>;

  return <CaseLayout presentation="drawer"
    label={dangMo ? `Hồ sơ NNT · ${dangMo.d.ten}` : `Doanh nghiệp cần đối chiếu · ${tenChon ?? ""}`}
    tieuDeHien={dangMo ? "Hồ sơ NNT" : undefined}
    mobileOpen={Boolean(dangMo || (!pv.canBo && nhomChon))} onClose={dong} detail={chiTiet}>
    {pv.canBo ? danhSach : <>
    <Panel chinh title={`Đối chiếu nghĩa vụ theo ${theoCanBo ? "cán bộ" : "đơn vị"}`}
      subtitle="Triệu đồng · Chọn cán bộ hoặc đơn vị để xem danh sách doanh nghiệp"
      tieuDeKem={<GhiChu tieuDe="Biên bản 11/11/2026">
        <p>Sắc thuế ưu tiên: GTGT (tiểu mục 1701) làm trước, tiếp theo TNCN, TNDN. Tạm chưa làm phí, lệ phí.</p>
        <p>Chọn mẫu: lấy doanh nghiệp lớn, nộp thừa lớn nhất trước, từ danh sách nộp thừa đã có (nhóm trên 1 tỷ và trên 500 triệu đồng).</p>
        <p>Dữ liệu: chạy thử trên TMS (2015–nay) trước, coi giao dịch CD là số dư đầu kỳ.</p>
      </GhiChu>}
      actions={<div className="inline-controls kt-dieu-khien">
        <NhomNut<SacThue> label="Sắc thuế" value={sac} onChange={(v) => { datSac(v); datChon(""); datTrang(1); }}
          options={SAC_THUE.map((s) => ({ value: s.id, label: s.id, title: s.nhan }))}/>
        <ExportButton onExport={xuat}>Xuất Excel</ExportButton>
      </div>}>
      <TableWrap label={`Đối chiếu nghĩa vụ theo ${theoCanBo ? "cán bộ" : "đơn vị"}`}>
        <table className="qd-bang kt-bang dc-ds-bang">
          <thead><tr>
            <th scope="col">{theoCanBo ? "Cán bộ" : "Đơn vị"}</th>
            <th scope="col" className="num">Số DN</th>
            <th scope="col" className="num">Thừa theo sổ S1</th>
            <th scope="col" className="num">Thiếu phát sinh phải nộp</th>
            <th scope="col" className="num">Thiếu khoản đã nộp</th>
            <th scope="col" className="num">Cần mời lên làm việc</th>
          </tr></thead>
          <tbody>
            <tr className="is-tong">
              <th scope="row">Tổng cộng</th>
              <td className="num"><strong>{integer(tc.so)}</strong></td><td className="num">{trieu(tc.s1)}</td>
              <td className="num">{trieu(tc.thua)}</td><td className="num">{trieu(tc.thieu)}</td><td className="num"><strong>{integer(tc.moi)}</strong></td>
            </tr>
            {nhomDong.map((n) => { const t = tong(n.ds); return <tr key={n.id} className={`qd-viec${nhomChon?.id === n.id ? " is-selected" : ""}`}
              onClick={(e) => { noiBam.current = e.currentTarget.querySelector("button"); noiBam.current?.focus({ preventScroll: true }); datChon(n.id); datMo(""); datTrang(1); }}>
              <th scope="row"><button type="button" className="row-select kt-dv" aria-haspopup="dialog" aria-expanded={nhomChon?.id === n.id}>{n.ten}</button></th>
              <td className="num">{integer(t.so)}</td><td className="num">{trieu(t.s1)}</td>
              <td className="num">{trieu(t.thua)}</td><td className="num">{trieu(t.thieu)}</td>
              <td className="num">{t.moi ? <strong>{integer(t.moi)}</strong> : <span className="cell-empty">0</span>}</td>
            </tr>; })}
          </tbody>
        </table>
      </TableWrap>
      {!nhomDong.length && <p className="table-empty">Không có NNT nào.</p>}
    </Panel>

    </>}
  </CaseLayout>;
}
