import { type ReactNode } from "react";
import { DetailGrid, Panel, Segmented, TableWrap, money } from "@/components/ui";
import { CaseLayout } from "@/components/CaseLayout";
import { useChonHang } from "@/components/ChonHang";
import { useBoLoc } from "@/components/BoLoc";
import { useThamSo } from "@/state/diaChi";
import {
  COT_KQ_TPR, KET_QUA_CA, bangCongAn, bangTPR, daRaSoatTPR, daXuLyCA, locTPR, thangCuaKy,
  type DongTPR, type HangCA, type KyQL2, type SoCA,
} from "@/data/ql2";
import { rutGonTenDonVi } from "@/data/danhMuc";

const hienTyLe = (x: number | null) => (x === null ? "—" : `${(x * 100).toFixed(2).replace(".", ",")}%`);
const chia = (tu: number, mau: number) => (mau ? tu / mau : null);
const hai = (n: number) => String(n).padStart(2, "0");

/*
  Hai màn dưới đây CHỈ XEM: số đến từ dữ liệu nguồn (bản demo: mô phỏng), không
  nhập tay. Xuất, xem trước và gửi duyệt đi qua thanh duyệt và nút xuất chung
  của phân hệ — cùng bộ sheet trong `ql2Workbook`, nên bảng trên màn, bản xem
  trước và tệp Excel không thể lệch nhau.
*/

/* ── QL2-03 · Rủi ro hóa đơn TPR ─────────────────────────────────────────── */

/*
  Theo "Mẫu 1 kỳ" và "TH" (MoM 15/10). Văn phòng về một dòng 8501, tách ra năm
  phòng QLHTDN và Phòng HKD/Cá nhân KD ở các dòng "Trong đó" — số của chúng đã
  nằm trong 8501, nên dòng tổng chỉ cộng 8501 với Thuế cơ sở.

  Kỳ tháng có đúng HAI cách xem, khớp hai sheet của báo cáo: riêng kỳ đánh giá
  và lũy kế từ tháng 01. Quý cần hai bảng: lũy kế và riêng trong quý.
*/
export function TPRQL2({ ky }: { ky: KyQL2 }) {
  const { tu, den } = thangCuaKy(ky);
  const nam = ky.ngayChot.slice(6);
  const [cach, datCach] = useThamSo<"ky" | "luyke">("tprxem", "ky", ["ky", "luyke"]);

  if (ky.loai === "QUY") return <>
    <BangTPR ky={ky} tienTo="lk" tu={1} den={den} tieuDe={`Lũy kế từ tháng 01 đến tháng ${hai(den)}/${nam}`}/>
    <BangTPR ky={ky} tienTo="tq" phu tu={tu} den={den} tieuDe={`Trong ${ky.nhan} · tháng ${hai(tu)} đến ${hai(den)}/${nam}`}/>
  </>;

  if (ky.loai !== "THANG") return <BangTPR ky={ky} tu={tu} den={den} tieuDe={`Lũy kế tháng ${hai(tu)} đến tháng ${hai(den)}/${nam}`}/>;

  return <BangTPR ky={ky} tu={cach === "ky" ? den : 1} den={den}
    tieuDe={cach === "ky" ? `Kỳ đánh giá ${hai(den)}/${nam}` : `Lũy kế từ tháng 01 đến tháng ${hai(den)}/${nam}`}
    chonCach={<Segmented label="Cách xem TPR" value={cach} onChange={datCach} options={[
      { value: "ky" as const, label: "Kỳ đánh giá" },
      { value: "luyke" as const, label: "Lũy kế từ tháng 01" },
    ]}/>}
  />;
}

/*
  BẢNG GỌN + NGĂN CHI TIẾT, cùng cách các danh sách K và xác minh đã dùng.

  Bảng đủ 16 cột rộng 1.830px trong khung 1.146px: chín cột kết quả nằm ngoài
  tầm nhìn, trong khi việc trên màn là TRIAGE — đơn vị nào rà soát chậm. Bảng
  chỉ giữ tiến độ (phải, đã, chưa, tỷ lệ so với bình quân); chín loại kết quả
  đọc trong ngăn khi đã chọn một đơn vị. Tệp báo cáo vẫn đủ 16 cột theo mẫu.

  `tienTo` tách hai bảng của kỳ quý: cả hai cùng ghi đơn vị đang mở vào một
  tham số địa chỉ, nên mã dòng phải nói nó thuộc bảng nào. Bảng `phu` (bảng
  thứ hai của quý) không mang nút xuất chung, để một màn không có hai nút xuất
  cùng ra một tệp.
*/
function BangTPR({ ky, tu, den, tieuDe, chonCach, phu = false, tienTo = "tpr" }: { ky: KyQL2; tu: number; den: number; tieuDe: string; chonCach?: ReactNode; phu?: boolean; tienTo?: string }) {
  const { chon } = useBoLoc();
  const { dangMo, dong: dongNgan, hang } = useChonHang();
  /* Dòng tổng là tổng của ĐANG XEM; tên vẫn là "Tổng cộng" — phạm vi đã hiện
     ở bộ lọc Đơn vị ngay trên (người dùng chốt 19/10). */
  const { tong, vp, phong, tcs } = locTPR(bangTPR(tu, den), chon.donVi);

  const binhQuan = chia(daRaSoatTPR(tong.so), tong.so.phai);
  const tatCa: { d: DongTPR; nhan: string }[] = [
    { d: tong, nhan: tong.ten },
    ...(vp ? [{ d: vp, nhan: "8501 · Văn phòng Thuế TP" }, ...phong.map((p) => ({ d: p, nhan: `Trong đó: ${rutGonTenDonVi(p.ten)}` }))] : []),
    ...tcs.map((d) => ({ d, nhan: d.ten })),
  ];
  const moId = dangMo.startsWith(`${tienTo}-`) ? dangMo.slice(tienTo.length + 1) : "";
  const dangXem = tatCa.find((x) => x.d.id === moId) ?? null;

  const dong = (d: DongTPR, nhan: string, lop?: string) => {
    const da = daRaSoatTPR(d.so);
    const tl = chia(da, d.so.phai);
    const id = `${tienTo}-${d.id}`;
    const chonHang = hang(id);
    return <tr key={id} {...chonHang} className={[lop, chonHang.className].filter(Boolean).join(" ") || undefined}>
      <th scope="row" className="dv-cot" title={d.ten}>
        <button type="button" className="row-select" aria-expanded={id === dangMo}>{nhan}</button>
      </th>
      <td>{d.ma}</td>
      <td className="num">{money(d.so.phai)}</td>
      <td className="num">{money(da)}</td>
      <td className="num">{money(d.so.phai - da)}</td>
      <td>{tl === null ? <span className="cell-empty">—</span> : <span className="so-sanh-o">
        <span className="so-sanh-thanh">
          <i className={binhQuan !== null && tl < binhQuan ? "is-duoi" : undefined} style={{ transform: `scaleX(${Math.min(100, tl * 100) / 100})` }}/>
          {binhQuan !== null && <b style={{ transform: `translateX(${Math.min(100, binhQuan * 100)}%)` }} title={`Bình quân ${hienTyLe(binhQuan)}`}/>}
        </span>
        <em>{hienTyLe(tl)}</em>
      </span>}</td>
    </tr>;
  };

  return <CaseLayout
    presentation="drawer"
    label={dangXem ? `TPR · ${dangXem.d.ten}` : "Chi tiết TPR theo đơn vị"}
    mobileOpen={Boolean(dangXem)}
    onClose={dongNgan}
    detail={dangXem ? <ChiTietTPR d={dangXem.d} tieuDe={tieuDe} vp={dangXem.d.id === "8501"}/> : null}
  >
  <Panel chinh={!phu}
    title={`Rủi ro hóa đơn TPR · ${tieuDe}`}
    subtitle={`${ky.nhan} · nguồn: webtpr · 9 tiêu chí rủi ro · dữ liệu mô phỏng`}
    actions={chonCach}
  >
    {!phu && <p className="ql2-note">Đã rà soát = kiểm tra tại bàn + bổ sung kiểm tra tại trụ sở + giải thể. Số liệu lũy kế vì một NNT đi qua giải trình tối đa 2 lần, xác minh địa chỉ rồi mới có thể chuyển kiểm tra tại trụ sở. Các dòng “Trong đó” đã nằm trong dòng 8501, không cộng lần nữa. Bấm vào một đơn vị để xem chín loại kết quả và mã kqrr tương ứng.</p>}
    <TableWrap label="TPR theo đơn vị">
      <table className="ql1-table" style={{ minWidth: 980 }}>
        <colgroup>
          {[300, 90, 150, 130, 130, 260].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead><tr>
          <th scope="col" className="dv-cot">Tên cơ quan thuế</th>
          <th scope="col">Mã CQT</th>
          <th scope="col" className="num" title="Cột (6) của mẫu">NNT rủi ro cao phải rà soát</th>
          <th scope="col" className="num" title="(7) + (8) + (14)">Đã rà soát</th>
          <th scope="col" className="num">Chưa rà soát</th>
          <th scope="col">Tỷ lệ đã rà soát<small>Vạch là bình quân của các đơn vị đang xem</small></th>
        </tr></thead>
        <tbody>
          {tatCa.map(({ d, nhan }, i) => dong(d, nhan, i === 0 ? "is-tong" : d.id === "8501" ? "is-khoi" : undefined))}
        </tbody>
      </table>
    </TableWrap>
  </Panel></CaseLayout>;
}

/*
  Ngăn chi tiết một đơn vị: đủ các cột của mẫu mà bảng gọn đã bỏ, chia hai
  nhóm như mẫu — tiến độ rà soát, rồi chín loại kết quả kèm mã kqrr để đối
  chiếu với hệ thống.
*/
function ChiTietTPR({ d, tieuDe, vp }: { d: DongTPR; tieuDe: string; vp: boolean }) {
  const da = daRaSoatTPR(d.so);
  return <div className="ql3-chitiet">
    <p className="ql3-chitiet-ten"><strong>{d.ten}</strong><span>{[d.ma && `Mã CQT ${d.ma}`, tieuDe].filter(Boolean).join(" · ")}</span></p>
    <DetailGrid items={[
      { label: "Số lượng NNT quản lý", value: money(d.nntQL) },
      { label: "NNT rủi ro cao phải rà soát", value: <strong>{money(d.so.phai)}</strong> },
      { label: "Đã rà soát · (7) + (8) + (14)", value: <strong>{money(da)}</strong> },
      /* Tỷ lệ đứng NGAY SAU số đã rà soát, và ô chưa rà soát chỉ mang số NNT:
         đặt "0 · 0,00%" ở ô chưa rà soát thì người đọc thấy 0% trong ngăn và
         100% trên bảng, tưởng hai nơi lệch nhau (người dùng báo 19/10). */
      { label: "Tỷ lệ đã rà soát", value: <strong>{hienTyLe(chia(da, d.so.phai))}</strong> },
      { label: "Chưa rà soát", value: `${money(d.so.phai - da)} NNT` },
    ]}/>
    <h3 className="ql3-chitiet-de">Kết quả rà soát kiểm tra</h3>
    <DetailGrid items={COT_KQ_TPR.map((c) => ({
      label: `${c.nhan} · ${c.maKq}`,
      value: c.id === "tienXuLy" ? d.so[c.id].toLocaleString("vi-VN") : `${money(d.so[c.id])} NNT`,
    }))}/>
    {vp && <p className="ql3-chitiet-vi">Gồm năm phòng QLHTDN và Phòng HKD/Cá nhân KD ở các dòng “Trong đó”.</p>}
  </div>;
}

/* ── QL2-06 · Gói rủi ro hóa đơn Công an ─────────────────────────────────── */

/*
  Theo mẫu "BC gói hđ CA" (MoM 15/10), chỉ xem. Bảng đủ cột như mẫu vì cả bảng
  là một phép cân: phải thực hiện = bốn loại kết quả + còn phải xử lý, tính
  song song theo số DN và số hóa đơn. Tách bốn loại vào ngăn chi tiết thì
  người đọc mất đúng phép cân ấy.
*/
export function CongAnQL2({ ky }: { ky: KyQL2 }) {
  const { chon } = useBoLoc();
  const ds = bangCongAn(ky.hat).filter((h) => !chon.donVi.length || chon.donVi.includes(h.dv.ten));
  const vp = ds.filter((h) => h.dv.nhom === "VP");
  const tcs = ds.filter((h) => h.dv.nhom === "TCS");

  const cong = (rows: HangCA[]): Pick<HangCA, "phai" | "ketQua"> => ({
    phai: { dn: rows.reduce((t, h) => t + h.phai.dn, 0), hd: rows.reduce((t, h) => t + h.phai.hd, 0) },
    ketQua: KET_QUA_CA.map((_, i) => ({ dn: rows.reduce((t, h) => t + h.ketQua[i].dn, 0), hd: rows.reduce((t, h) => t + h.ketQua[i].hd, 0) })),
  });

  const cap = (k: string, s: SoCA) => [<td key={`${k}dn`} className="num">{money(s.dn)}</td>, <td key={`${k}hd`} className="num">{money(s.hd)}</td>];
  const dong = (key: string, nhan: string, h: Pick<HangCA, "phai" | "ketQua">, lop?: string, ten?: string) => {
    const da = daXuLyCA(h);
    return <tr key={key} className={lop}>
      <th scope="row" className="dv-cot" title={ten ?? nhan}>{nhan}</th>
      {cap("phai", h.phai)}{cap("da", da)}
      {h.ketQua.flatMap((k, i) => cap(`kq${i}`, k))}
      {cap("con", { dn: h.phai.dn - da.dn, hd: h.phai.hd - da.hd })}
      <td className="num">{hienTyLe(chia(da.dn, h.phai.dn))}</td>
    </tr>;
  };

  const nhanCot = ["Tổng phải thực hiện", "Tổng đã rà soát, xử lý", ...KET_QUA_CA.map((k) => k.nhan), "Số còn phải xử lý"];

  return <Panel chinh title="Gói rủi ro hóa đơn Công an" subtitle={`${ky.nhan} · công văn cảnh báo DN trạng thái 06, DN có kết luận của Công an · dữ liệu mô phỏng`}>
    <p className="ql2-note">Đã xử lý = tổng bốn loại kết quả; còn phải xử lý = phải thực hiện − đã xử lý; tỷ lệ tính theo số DN. Nguồn tải số liệu của gói chưa được xác nhận với QLDN2.</p>
    <TableWrap label="gói rủi ro Công an">
      <table className="ql1-table" style={{ minWidth: 1740 }}>
        <colgroup>
          {[240, ...Array(14).fill(100), 100].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="dv-cot" rowSpan={2}>Phòng / Đội</th>
            {nhanCot.map((n) => <th key={n} scope="colgroup" className="nhom" colSpan={2}>{n}</th>)}
            <th scope="col" className="num" rowSpan={2}>Tỷ lệ % thực hiện</th>
          </tr>
          <tr>{nhanCot.flatMap((n) => [<th key={`${n}DN`} scope="col" className="num">Số DN</th>, <th key={`${n}HD`} scope="col" className="num">Số HĐ</th>])}</tr>
        </thead>
        <tbody>
          {ds.length > 0 && dong("tong", "A. Tổng cộng (= I + II)", cong(ds), "is-tong")}
          {vp.length > 0 && dong("vp", "I. Văn phòng", cong(vp), "is-khoi")}
          {vp.map((h) => dong(h.dv.id, rutGonTenDonVi(h.dv.ten), h, undefined, h.dv.ten))}
          {tcs.length > 0 && dong("tcs", "II. Các Thuế cơ sở", cong(tcs), "is-khoi")}
          {tcs.map((h) => dong(h.dv.id, h.dv.ten, h))}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}
