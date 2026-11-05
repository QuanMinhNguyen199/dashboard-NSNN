import { useMemo } from "react";
import { Icon, Panel, TableWrap, integer } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportSheet, ReportValue } from "@/domain/reportExport";
import { DON_VI_Q, nhanPhamVi, type DonViQ, type KyQ, type PhamVi } from "@/data/qldn";
import { KY_QL2_01, danhSachChenhLech, nhanLuyKe, type KyQL2, type NNTChenhLech } from "@/data/ql2";

/*
  Tab "Chênh lệch tờ khai" của Quản lý hóa đơn — ô "Chỉ tiêu" (chưa có chỉ
  tiêu chấm điểm trong bộ tiêu chí, nên ô này là SỐ THEO DÕI).

  MỘT bảng: mỗi đơn vị một dòng, ba chiều lệch, mỗi chiều số NNT và số tiền.
  Danh sách NNT KHÔNG dựng ở đây (người dùng chốt 29/10/2026): nó đã có ở
  Báo cáo › DS NNT chênh lệch, cùng luồng giao phiếu PRS-03 và kết quả rà
  soát. Bản trước dựng thêm một danh sách theo tháng từ một bộ số khác, nên
  cùng một tab nói "157 DN bán ra khai thiếu tháng 9" ở trên và "7 NNT cả năm"
  ở dưới.

  Vì thế bảng ĐẾM TỪ CHÍNH danh sách ấy (`danhSachChenhLech`, cùng kỳ lũy kế
  QL2-01): số NNT là số MST khác nhau của chiều ấy, số tiền là tổng cột chênh
  lệch. Bấm một phòng mở danh sách của phòng đó — con số trên dòng là số dòng
  người dùng sẽ thấy.
*/

const CHIEU = [
  { id: "ra", nhan: "Bán ra khai thiếu", tien: "Số thuế", hop: (r: NNTChenhLech) => r.chieu === "ra" },
  { id: "vao", nhan: "Mua vào khai thừa", tien: "Số thuế", hop: (r: NNTChenhLech) => r.chieu === "vao" },
  { id: "0304", nhan: "03, 04/GTGT khai thiếu", tien: "Doanh thu", hop: (r: NNTChenhLech) => r.chieu === "t03" || r.chieu === "t04" },
] as const;

const trieu = (x: number) => x.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
const demNNT = (ds: NNTChenhLech[]) => new Set(ds.map((r) => r.mst)).size;
const cong = (ds: NNTChenhLech[]) => Math.round(ds.reduce((s, r) => s + r.chenhLech, 0) * 10) / 10;

/** Kỳ QL2-01 (lũy kế từ tháng 1) ứng với tháng đang xem; ngoài danh mục thì lấy kỳ mới nhất. */
export const kyQL2Cua = (ky: KyQ): KyQL2 =>
  KY_QL2_01.find((k) => k.id === `q201-m${String(ky.thang).padStart(2, "0")}`) ?? KY_QL2_01[0];

export function ChenhLechTK({ pv, ky, actor, moDanhSach }: {
  pv: PhamVi; ky: KyQ; actor: string;
  /** Mở Báo cáo › DS NNT chênh lệch của một phòng; không có khi vai không mở được báo cáo. */
  moDanhSach?: (dvId: string) => void;
}) {
  /* Đơn vị trên bảng như bảng xếp hạng: lãnh đạo thấy phạm vi đang chọn, các
     vai khác thấy cả khối của đơn vị mình. Danh sách nguồn không chia theo cán
     bộ, nên cán bộ thấy dòng của phòng mình chứ không phải "DN được phân công". */
  const dsDV: DonViQ[] = pv.canBo || pv.vai === "LD" ? pv.donVi : DON_VI_Q.filter((d) => d.khoi === pv.donVi[0].khoi);
  const cuaToi = pv.vai === "LD" ? null : (pv.phongGoc ?? pv.donVi[0]).id;
  const kyQ = kyQL2Cua(ky);

  const theoDV = useMemo(() => {
    const ds = danhSachChenhLech(kyQ.hat);
    return dsDV.map((d) => ({ d, ds: ds.filter((r) => r.dv.id === d.id) }));
  }, [kyQ.hat, dsDV.map((d) => d.id).join(",")]);
  const tatCa = theoDV.flatMap((x) => x.ds);
  /* Báo cáo là bản của MỘT PHÒNG: chỉ dòng phòng QLDN mở được danh sách. */
  const moDuoc = (d: DonViQ) => Boolean(moDanhSach) && d.khoi === "VP";

  const xuat = () => exportExcel([sheetTongHop(theoDV, kyQ)],
    { period: nhanLuyKe(kyQ), scope: nhanPhamVi(pv), actor, status: "DRAFT" }, `chenh-lech-to-khai_${kyQ.id}.xlsx`);

  return <Panel
    chinh
    title="Chênh lệch tờ khai – hóa đơn"
    subtitle={`${nhanLuyKe(kyQ)} · triệu đồng`}
    actions={<ExportButton onExport={xuat}>Xuất Excel</ExportButton>}
  >
    <TableWrap label="Chênh lệch tờ khai – hóa đơn theo đơn vị">
      <table className="qd-bang qd-bang-goc qd-cl-bang">
        <thead>
          <tr>
            <th scope="col" rowSpan={2} className="qd-goc-dv">Đơn vị</th>
            {CHIEU.map((c) => <th key={c.id} scope="colgroup" colSpan={2} className="qd-goc-nhom qd-goc-dau">{c.nhan}</th>)}
          </tr>
          <tr>
            {CHIEU.map((c) => [
              <th key={`${c.id}-n`} scope="col" className="num qd-goc-dau">Số NNT</th>,
              <th key={`${c.id}-t`} scope="col" className="num">{c.tien}</th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {theoDV.map(({ d, ds }) => {
            const mo = moDuoc(d);
            return <tr key={d.id} className={`${mo ? "qd-viec" : ""}${d.id === cuaToi ? " is-selected" : ""}`.trim() || undefined}
              onClick={mo ? () => moDanhSach!(d.id) : undefined}>
              <th scope="row" className="qd-goc-dv">
                {/* Cả hàng bấm được; nút ở ô tên cho bàn phím — The Whole Row Rule. */}
                {mo
                  ? <button type="button" className="row-select qd-cl-mo" aria-label={`${d.ngan}: mở danh sách NNT chênh lệch`}>{d.ngan}<Icon name="arrow" size={13}/></button>
                  : d.ngan}
                {d.id === cuaToi && <span className="qd-cua-toi"><span className="sr-only">, </span>Đơn vị của tôi</span>}
              </th>
              {CHIEU.map((c) => {
                const dong = ds.filter(c.hop);
                return [
                  <td key={`${c.id}-n`} className="num qd-goc-dau">{dong.length ? integer(demNNT(dong)) : <span className="cell-empty">0</span>}</td>,
                  <td key={`${c.id}-t`} className="num">{dong.length ? trieu(cong(dong)) : <span className="cell-empty">0</span>}</td>,
                ];
              })}
            </tr>;
          })}
          {theoDV.length > 1 && <tr className="is-tong">
            <th scope="row" className="qd-goc-dv">Cộng {theoDV.length} đơn vị</th>
            {CHIEU.map((c) => {
              const dong = tatCa.filter(c.hop);
              return [
                <td key={`${c.id}-n`} className="num qd-goc-dau">{integer(demNNT(dong))}</td>,
                <td key={`${c.id}-t`} className="num">{trieu(cong(dong))}</td>,
              ];
            })}
          </tr>}
        </tbody>
      </table>
    </TableWrap>
    <div className="table-footer"><span>
      {moDanhSach ? "Bấm một phòng để mở danh sách NNT của phòng đó ở tab Báo cáo. " : ""}
      Số NNT đếm mỗi MST một lần trong từng chiều; một NNT lệch cả bán ra lẫn mua vào nằm ở cả hai nhóm cột.
    </span></div>
    <p className="quality-note">Số liệu mô phỏng. Chưa nối nguồn đối chiếu tờ khai – hóa đơn điện tử.</p>
  </Panel>;
}

/* ---------- Xuất Excel ---------- */

function sheetTongHop(theoDV: { d: DonViQ; ds: NNTChenhLech[] }[], kyQ: KyQL2): ReportSheet {
  const headers = ["Đơn vị", ...CHIEU.flatMap((c) => [`${c.nhan} – Số NNT`, `${c.nhan} – ${c.tien} (triệu đồng)`])];
  const rows: ReportValue[][] = theoDV.map(({ d, ds }) => [d.ten, ...CHIEU.flatMap((c) => { const dong = ds.filter(c.hop); return [demNNT(dong), cong(dong)]; })]);
  return { name: "Tong_hop", title: `CHÊNH LỆCH TỜ KHAI – HÓA ĐƠN · ${nhanLuyKe(kyQ).toUpperCase()}`, headers, rows };
}
