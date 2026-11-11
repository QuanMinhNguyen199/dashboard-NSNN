import { useMemo, useRef } from "react";
import { GoiYCachTinh } from "@/components/GoiYCachTinh";
import { DetailGrid, SelectMenu, TableWrap, Panel, integer } from "@/components/ui";
import { CaseLayout } from "@/components/CaseLayout";
import { ExportButton } from "@/components/ExportButton";
import { exportExcel } from "@/domain/reportFiles";
import { useThamSo } from "@/state/diaChi";
import { THE_Q, type KyQ, type PhamVi } from "@/data/qldn";
import { NGUONG_CB, xepHangCanBo, type DiemChiTieuCB, type HangCanBo } from "@/data/hoSoQLDN";

/*
  Xếp hạng cán bộ theo phòng quản lý (biên bản 22/10/2026 §3.2).

  Đứng cạnh "Xếp hạng phòng" trên màn Tổng quan quản trị, cùng quyền xem thứ
  hạng (ma trận §4: trưởng phòng, lãnh đạo; phó phòng đang chờ chốt).

  CHUYÊN VIÊN (09/11/2026, người dùng chốt) cũng có tab này: xếp hạng các
  chuyên viên trong phòng mình, gồm cả bản thân, ĐỦ TÊN. Cùng một bảng, cùng
  cột (Fixed Slots); khác ở ba chỗ: câu "Bạn đứng hạng X / N" đứng đầu, dòng
  của mình tô nền và gắn nhãn "Bạn", và chỉ dòng của mình mở được ngăn chi
  tiết — chi tiết từng chỉ tiêu của đồng nghiệp là việc của trưởng phòng.

  Năm phòng QLDN làm cùng việc, chỉ chia số DN (chốt 15/10/2026), nên bảng
  xếp hạng CÙNG một hình cho cả năm phòng; ô chọn phòng chỉ đổi số. Mặc định
  là phòng của người xem.

  CÁCH TÍNH LÀ TẠM — các phòng chưa gửi chỉ tiêu đánh giá cán bộ (việc số 2).
  Nhãn Tạm tính luôn hiện; cách tính mở tại chỗ để không lấn nội dung bảng.
  Xem `xepHangCanBo`.

  Chi tiết từng chỉ tiêu của một cán bộ mở trong NGĂN TRƯỢT bên phải (người
  dùng chốt 27/10/2026), không bung dưới dòng: bung dưới dòng chèn 15 hàng
  chỉ tiêu vào giữa bảng xếp hạng và đẩy 17 cán bộ còn lại khỏi màn, nên mất
  đúng thứ đang xem là thứ hạng. Ngăn trượt giữ bảng nguyên vẹn, bấm dòng khác
  là đổi người trong ngăn. Cùng một đường dựng với hồ sơ doanh nghiệp
  (`CaseLayout presentation="drawer"`), có địa chỉ `so=` — ngoại lệ thứ ba của
  The No-Overlay Rule.
*/

const diemSo = (x: number) => x === 0 ? "0,00"
  : `${x < 0 ? "−" : "+"}${Math.abs(x).toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const lopDiem = (x: number) => x > 0 ? "xhp-diem is-tot" : x < 0 ? "xhp-diem is-xau" : "xhp-diem";
const pt = (x: number | null) => x === null ? "—" : `${(x * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
const dpt = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} dpt`;
const tenChiTieu = (c: DiemChiTieuCB) => `${THE_Q.find((t) => t.id === c.ct.the)!.ten}${c.ct.ngan ? ` · ${c.ct.ngan}` : ""}`;

/*
  Kỳ và đơn vị đi theo THANH PHẠM VI ở đầu màn (critique 27/10/2026): bản trước
  khoá cứng tháng 9 và có ô "Phòng" riêng trong đầu khối — hai lựa chọn phạm
  vi trên một màn. Nay trưởng phòng đổi phòng ở ô Phạm vi như mọi màn khác; chỉ
  khi phạm vi gồm nhiều đơn vị (khối thuế cơ sở, lãnh đạo) mới có ô chọn MỘT
  đơn vị để xếp cán bộ của đơn vị ấy.
*/
export function XepHangCanBo({ pv, ky, actor }: { pv: PhamVi; ky: KyQ; actor: string }) {
  const KY = ky;
  const DS_DV = pv.donVi;
  const cuaToi = pv.vai === "LD" ? null : (pv.phongGoc ?? pv.donVi[0]);
  const [phongURL, datPhong] = useThamSo<string>("phong", "", ["", ...DS_DV.map((p) => p.id)]);
  const phong = phongURL || DS_DV[0].id;
  /* Cán bộ đang mở nằm trong ĐỊA CHỈ — The URL Is The State Rule. */
  const [dangMo, datDangMo] = useThamSo<string>("so", "");
  const noiBam = useRef<HTMLButtonElement | null>(null);
  const ds = useMemo(() => xepHangCanBo(phong, KY.thang), [phong, KY.thang]);
  /* Chuyên viên: dòng của mình mang tên theo tài khoản, không theo tên mô phỏng. */
  const toi = pv.canBo;
  const laToi = (id: string) => toi?.id === id;
  const tenDong = (d: HangCanBo) => (toi && laToi(d.id) ? toi.ten : d.ten);
  const cuaMinh = toi ? ds.find((d) => laToi(d.id)) ?? null : null;
  const moDuoc = (id: string) => !toi || laToi(id);
  const chon = ds.find((d) => d.id === dangMo && moDuoc(d.id)) ?? null;
  const ten = DS_DV.find((p) => p.id === phong)!.ngan;
  const dong = () => { datDangMo(""); requestAnimationFrame(() => noiBam.current?.focus()); };

  const xuat = () => exportExcel([{
    name: "Xep_hang_can_bo", title: `XẾP HẠNG CÁN BỘ · ${ten.toUpperCase()}`,
    headers: ["Hạng", "Cán bộ", "Điểm (tạm tính)", "Số chỉ tiêu cao hơn mức phòng", "Số chỉ tiêu thấp hơn mức phòng"],
    rows: ds.map((d) => [d.hang, tenDong(d), Math.round(d.diem * 100) / 100, d.tren, d.duoi]),
  }], { period: KY.nhan, scope: ten, actor, status: "DRAFT" as const }, `xep-hang-can-bo_${phong}_${KY.id}.xlsx`);

  return <CaseLayout
    presentation="drawer"
    label={chon ? `${tenDong(chon)} · hạng ${chon.hang}/${ds.length}` : "Chi tiết cán bộ"}
    mobileOpen={Boolean(chon)}
    onClose={dong}
    detail={chon ? <ChiTietCanBo d={chon} tong={ds.length}/> : null}
  >
  <Panel chinh title="Xếp hạng cán bộ" tieuDeKem={<>
      {/* ⓘ VÀNG ngay sau tên khối (09/11/2026, người dùng chốt chỉ icon): màu
          vàng nói "số đang tính tạm"; tiêu đề tooltip và tên đọc nói bằng chữ.
          Rê chuột/focus để xem cách tính, bấm không làm gì. */}
      <GoiYCachTinh nhan="Tạm tính, xem cách tính" tieuDe="Tạm tính · cách tính" kieu="icon" className="is-tam-tinh">
            <p>Chờ các phòng gửi chỉ tiêu đánh giá chính thức.</p>
            <p>So với mức phòng: tốt hơn quá {NGUONG_CB * 100} điểm phần trăm được <b>+1</b>, kém hơn quá {NGUONG_CB * 100} điểm phần trăm được <b>−1</b>, còn lại <b>0</b>. Chỉ tiêu “thấp hơn là tốt” được so theo chiều ngược lại.</p>
            <p>Điểm là trung bình các chỉ tiêu, từ −1 đến +1. Không tính Thu NSNN vì cán bộ không có số giao thu.</p>
            <small>Biên bản 22/10/2026, việc số 2 · Số liệu mô phỏng</small>
      </GoiYCachTinh>
  </>} subtitle={`${ten} · ${KY.nhan} · ${integer(ds.length)} cán bộ`} actions={<div className="inline-controls">
    {DS_DV.length > 1 && <SelectMenu className="compact-field" hienNhan kieu="o" label="Đơn vị" value={phong} onChange={(v) => { datPhong(v === DS_DV[0].id ? "" : v); datDangMo(""); }}
      options={DS_DV.map((p) => ({ value: p.id, label: `${p.ngan}${p.id === cuaToi?.id ? " (của tôi)" : ""}` }))}/>}
    <ExportButton onExport={xuat}>Xuất Excel</ExportButton>
  </div>}>
    {cuaMinh && <div className="xhc-summary">
      <p className="xhc-toi" aria-label="Xếp hạng của bạn">
        <span><b>{cuaMinh.hang}/{ds.length}</b> trong phòng</span>
        <span><b className={lopDiem(cuaMinh.diem)}>{diemSo(cuaMinh.diem)}</b> điểm</span>
        <span><b>{cuaMinh.duoi}</b> chỉ tiêu dưới mức phòng</span>
      </p>
    </div>}
    <TableWrap label={`xếp hạng cán bộ ${ten}`}>
      <table className="qd-bang xhc-bang" data-motion="content" data-motion-key={phong}>
        <thead><tr>
          <th scope="col" className="num">Hạng</th>
          <th scope="col">Cán bộ</th>
          <th scope="col">Điểm</th>
          <th scope="col" className="num" title="Số chỉ tiêu cao hơn mức chung của phòng">Cao hơn phòng</th>
          <th scope="col" className="num" title="Số chỉ tiêu thấp hơn mức chung của phòng">Thấp hơn phòng</th>
        </tr></thead>
        <tbody>{ds.map((d) => {
          const mo = d.id === dangMo;
          const thanh = <td><span className="xhc-diem"><span className="xhp-thanh" aria-hidden="true">{d.diem !== 0 && <i className={d.diem > 0 ? "is-tot" : "is-xau"} style={{ ["--f" as string]: Math.min(Math.abs(d.diem), 1) }}/>}</span><b className={lopDiem(d.diem)}>{diemSo(d.diem)}</b></span></td>;
          /* Chuyên viên: dòng đồng nghiệp đủ tên, đủ số, nhưng là dòng tĩnh. */
          if (!moDuoc(d.id)) return <tr key={d.id}>
            <td className="num xhc-hang">{d.hang}</td>
            <td>{d.ten}</td>
            {thanh}
            <td className="num">{d.tren}</td>
            <td className="num">{d.duoi}</td>
          </tr>;
          /* Cả hàng bấm được; nút phủ ô tên để bàn phím mở được — The Whole Row Rule. */
          return <tr key={d.id} className={`qd-viec${mo ? " is-selected" : ""}${toi ? " is-toi" : ""}`} onClick={(e) => {
            noiBam.current = e.currentTarget.querySelector<HTMLButtonElement>(".row-select");
            datDangMo(mo ? "" : d.id);
          }}>
            <td className="num xhc-hang">{d.hang}</td>
            <td><button type="button" className="row-select" aria-expanded={mo}>{tenDong(d)}{toi && <em className="xhc-ban">Bạn</em>}</button></td>
            {thanh}
            <td className="num">{d.tren}</td>
            <td className="num">{d.duoi}</td>
          </tr>;
        })}</tbody>
      </table>
    </TableWrap>
  </Panel>
  </CaseLayout>;
}

/*
  Ngăn chi tiết: tóm tắt điểm, rồi chỉ tiêu CHIA NHÓM theo kết quả — "Thấp hơn
  mức phòng" đứng đầu, vì đó là chỗ trưởng phòng cần làm việc với cán bộ. Bản
  trước liệt kê theo thứ tự file, tốt xấu xen nhau. Mỗi nhóm đã nói kết quả,
  nên cột "So với phòng" nhường chỗ cho CHÊNH LỆCH thật bằng điểm phần trăm.
*/
const NHOM_KQ: { diem: -1 | 0 | 1; ten: string }[] = [
  { diem: -1, ten: "Thấp hơn mức phòng" },
  { diem: 0, ten: "Ngang mức phòng" },
  { diem: 1, ten: "Cao hơn mức phòng" },
];

function ChiTietCanBo({ d, tong }: { d: HangCanBo; tong: number }) {
  const ngang = d.chiTiet.length - d.tren - d.duoi;
  return <div className="xhc-ngan" data-motion="detail">
    <DetailGrid items={[
      { label: "Hạng", value: `${d.hang} / ${tong}` },
      { label: "Điểm tạm tính", value: <b className={lopDiem(d.diem)}>{diemSo(d.diem)}</b> },
      { label: "Thấp hơn mức phòng", value: `${d.duoi} chỉ tiêu` },
      { label: "Cao hơn mức phòng", value: `${d.tren} chỉ tiêu${ngang ? `, ${ngang} ngang` : ""}` },
    ]}/>
    {NHOM_KQ.map((n) => {
      const cua = d.chiTiet.filter((c) => c.diem === n.diem);
      if (!cua.length) return null;
      return <section key={n.diem} className="xhc-nhom" aria-labelledby={`xhc-nhom-${n.diem}`}>
        <h3 id={`xhc-nhom-${n.diem}`} className={`is-${n.diem > 0 ? "tot" : n.diem < 0 ? "xau" : "ngang"}`}><i aria-hidden="true"/>{n.ten}<small>{cua.length} chỉ tiêu</small></h3>
        <TableWrap label={n.ten}>
          <table className="xhc-ct">
            <thead><tr><th scope="col">Chỉ tiêu</th><th scope="col" className="num">Cán bộ</th><th scope="col" className="num">Chung của phòng</th><th scope="col" className="num">Chênh lệch</th></tr></thead>
            <tbody>{cua.map((c) => <tr key={c.ct.id}>
              {/* Gọn chữ 11/11/2026: "thấp hơn là tốt" thành dấu ↓ cạnh tên;
                  chênh lệch mang mũi tên và màu theo TỐT/XẤU, không theo dấu. */}
              <th scope="row">{tenChiTieu(c)}{c.ct.kieu !== "CAO" && <span className="xhc-chieu" title="Thấp hơn là tốt" role="img" aria-label="thấp hơn là tốt">↓</span>}</th>
              <td className="num">{pt(c.cb)}</td>
              <td className="num">{pt(c.phong)}</td>
              <td className="num">{c.cb !== null && c.phong !== null ? (() => {
                const h = c.cb - c.phong;
                if (!h) return dpt(h);
                const tot = c.ct.kieu === "CAO" ? h > 0 : h < 0;
                return <span className={`xhc-lech ${tot ? "is-tot" : "is-xau"}`}><span aria-hidden="true">{h > 0 ? "▲" : "▼"}</span>{dpt(h)}<span className="sr-only">, {tot ? "tốt hơn" : "kém hơn"} mức phòng</span></span>;
              })() : "—"}</td>
            </tr>)}</tbody>
          </table>
        </TableWrap>
      </section>;
    })}
  </div>;
}
