import { useMemo, useState } from "react";
import { Badge, Button, Pager, Panel, SearchField, Segmented, TableWrap, money } from "@/components/ui";
import { theoDonVi, useBoLoc } from "@/components/BoLoc";
import { useAction } from "@/state/ActionContext";
import { useThamSo, useThamSoSo } from "@/state/diaChi";
import { rutGonTenDonVi } from "@/data/danhMuc";
import type { VaiTro } from "@/domain/types";
import {
  CHIEU_CHENH, KET_QUA_PRS03, KHAC_QL2_01, bangQL2_01, canRaSoat, chuaCoKetQua,
  danhSachChenhLech, nhanLuyKe, type ChieuQL2_01, type HangQL2_01, type KyQL2, type LoaiTK,
} from "@/data/ql2";

/*
  QL2-01 — Chênh lệch tờ khai GTGT và hóa đơn điện tử (§4.4).

  Bảng gốc có 32 cột ở sheet 01GTGT và 21 cột ở sheet 03,04GTGT, chia SÁU nhóm.
  Tên cột giữ nguyên văn theo G4; số thứ tự cột của mẫu hiện thành một dòng
  riêng dưới tiêu đề, kèm công thức ở những cột cộng — "(14)=(5)+(9)" là thứ
  người đối chiếu với file Excel cần thấy, và nó cũng là lời giải thích vì sao
  hai cột cạnh nhau không bằng nhau.

  Khác biệt giữa hai sheet KHÔNG phải số cột mà là ĐƠN VỊ ĐO: sheet 01 đo bằng
  số thuế đầu ra / đầu vào, sheet 03,04 đo bằng chênh lệch doanh thu và số thuế
  thiếu [F]. Vì thế nhãn nhóm đổi theo loại tờ khai thay vì dùng chung một tên.
*/

const MOI_TRANG = 12;

const RONG_TEN = 236;
const RONG_MA = 104;
const RONG_LOAI = 116;
/* Cột tiền rộng hơn cột đếm: "138.892,4" dài hơn "426" và bảng dùng
   `table-layout: fixed`, nên cột nào cũng phải khai đủ chỗ cho chữ dài nhất
   của chính nó — không khai thì con số bị cắt giữa phần nghìn. */
const RONG_SO = 104;
const RONG_TIEN = 128;

interface Cot {
  so: number;
  nhan: string;
  /** Công thức của mẫu, hiện dưới số cột. */
  ct?: string;
  lay: (h: HangQL2_01) => number;
  /** Cột tiền hiện theo triệu đồng với một chữ số thập phân. */
  tien?: boolean;
}

interface NhomCot {
  nhan: string;
  cot: Cot[];
}

const tong = (c: ChieuQL2_01) => canRaSoat(c);

/*
  Sáu nhóm cột, dựng từ loại tờ khai.

  `nhanThue` đổi theo sheet: 01/GTGT nói "số thuế khai thiếu / khai thừa",
  03,04/GTGT nói "chênh lệch doanh thu / số thuế thiếu". Gộp hai nhãn thành
  một tên chung sẽ đúng ngữ pháp và sai nghiệp vụ.
*/
const nhomCot = (loaiTK: LoaiTK): NhomCot[] => {
  const raThue = loaiTK === "01" ? "Số thuế khai thiếu" : "Chênh lệch doanh thu";
  const vaoThue = loaiTK === "01" ? "Số thuế khai thừa" : "Số thuế thiếu";
  const n = (so: number, nhan: string, lay: Cot["lay"], tien?: boolean, ct?: string): Cot =>
    ({ so, nhan, lay, tien, ct });

  return [
    {
      nhan: "Số đầu năm · NNT có chênh lệch chưa có kết quả mang sang",
      cot: [
        n(5, "Số NNT khai thiếu", (h) => h.ra.dauNam_NNT),
        n(6, raThue, (h) => h.ra.dauNam_Thue, true),
        n(7, "Số NNT khai thừa", (h) => h.vao.dauNam_NNT),
        n(8, vaoThue, (h) => h.vao.dauNam_Thue, true),
      ],
    },
    {
      nhan: "Kết quả đối chiếu từ Ứng dụng · từ 01/01 đến cuối kỳ",
      cot: [
        n(9, "Số NNT khai thiếu", (h) => h.ra.ungDung_NNT),
        n(10, raThue, (h) => h.ra.ungDung_Thue, true),
        n(11, "Số NNT khai thừa", (h) => h.vao.ungDung_NNT),
        n(12, vaoThue, (h) => h.vao.ungDung_Thue, true),
        n(13, "Tổng số NNT không nộp tờ khai thuế GTGT trong kỳ", (h) => h.khongNopTK),
      ],
    },
    {
      nhan: "Tổng số NNT có chênh lệch cần thực hiện rà soát · lũy kế",
      cot: [
        n(14, "Số NNT khai thiếu", (h) => tong(h.ra).nnt, false, "(14)=(5)+(9)"),
        n(15, raThue, (h) => tong(h.ra).thue, true, "(15)=(6)+(10)"),
        n(16, "Số NNT khai thừa", (h) => tong(h.vao).nnt, false, "(16)=(7)+(11)"),
        n(17, vaoThue, (h) => tong(h.vao).thue, true, "(17)=(8)+(12)"),
        n(18, "Không nộp tờ khai", (h) => h.khongNopTK, false, "(18)=(13)"),
      ],
    },
    {
      nhan: "Kết quả xử lý",
      cot: [
        n(19, "Điều chỉnh tăng · số NNT", (h) => h.ra.dieuChinh_NNT),
        n(20, "Điều chỉnh tăng · số thuế", (h) => h.ra.dieuChinh_Thue, true),
        n(21, "Điều chỉnh giảm · số NNT", (h) => h.vao.dieuChinh_NNT),
        n(22, "Điều chỉnh giảm · số thuế", (h) => h.vao.dieuChinh_Thue, true),
        ...KHAC_QL2_01.map((k, i) => n(23 + i, k.nhan, (h) => h.ra.khac[i] + h.vao.khac[i])),
      ],
    },
    {
      nhan: "Chưa có kết quả đến thời điểm báo cáo",
      cot: [
        n(28, "Số NNT khai thiếu", (h) => chuaCoKetQua(h.ra).nnt),
        n(29, raThue, (h) => chuaCoKetQua(h.ra).thue, true),
        n(30, "Số NNT khai thừa", (h) => chuaCoKetQua(h.vao).nnt),
        n(31, vaoThue, (h) => chuaCoKetQua(h.vao).thue, true),
      ],
    },
  ];
};

const rongCua = (c: Cot) => (c.tien ? RONG_TIEN : RONG_SO);

const soO = (c: Cot, h: HangQL2_01) => {
  const v = c.lay(h);
  return c.tien ? money(Math.round(v * 10) / 10) : money(v);
};

/* ── Bảng tổng hợp theo đơn vị ───────────────────────────────────────────── */

export function BangQL2_01({ ky, loaiTK, onMoDanhSach }: {
  ky: KyQL2;
  loaiTK: LoaiTK;
  /** Bấm một ô số mở danh sách đã lọc sẵn theo đơn vị (G3). */
  onMoDanhSach: (maDonVi: string) => void;
}) {
  const { chon } = useBoLoc();
  const nhom = useMemo(() => nhomCot(loaiTK), [loaiTK]);
  const tatCa = useMemo(() => bangQL2_01(ky.hat, loaiTK), [ky.hat, loaiTK]);
  const hang = theoDonVi(tatCa, chon, (h) => h.dv.ten);

  const vp = hang.filter((h) => h.dv.nhom === "VP");
  const tcs = hang.filter((h) => h.dv.nhom === "TCS");
  const cong = (ds: HangQL2_01[], c: Cot) => Math.round(ds.reduce((t, h) => t + c.lay(h), 0) * 10) / 10;

  const dongTong = (nhanDong: string, ds: HangQL2_01[], lop: string) => <tr className={lop} key={nhanDong}>
    <th scope="row" className="dv-cot">{nhanDong}</th>
    <td>—</td>
    <td>{loaiTK === "01" ? "01/GTGT" : "03, 04/GTGT"}</td>
    {nhom.flatMap((n) => n.cot).map((c) => <td key={c.so} className="num">{c.tien ? money(cong(ds, c)) : money(cong(ds, c))}</td>)}
  </tr>;

  const cotPhang = nhom.flatMap((n) => n.cot);
  const rongBang = RONG_TEN + RONG_MA + RONG_LOAI + cotPhang.reduce((t, c) => t + rongCua(c), 0);

  /* Cả `thead` dính thành một khối (xem `styles.css`), nên không cần đo chiều
     cao từng hàng tiêu đề nữa. */
  return <Panel
    title={`Tổng hợp ${loaiTK === "01" ? "01GTGT" : "03, 04GTGT"}`}
    subtitle={`${nhanLuyKe(ky)} · đơn vị tiền: triệu đồng · nguồn: hddtbaocao`}
  >
    <TableWrap label={`tổng hợp ${loaiTK}`}>
      <table
        className="ql1-table ql2-01-table"
        style={{ minWidth: rongBang }}
      >
        <colgroup>
          <col style={{ width: RONG_TEN }}/>
          <col style={{ width: RONG_MA }}/>
          <col style={{ width: RONG_LOAI }}/>
          {cotPhang.map((c) => <col key={c.so} style={{ width: rongCua(c) }}/>)}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="dv-cot" rowSpan={2}>Tên cơ quan thuế</th>
            <th scope="col" rowSpan={2}>Mã cơ quan thuế</th>
            <th scope="col" rowSpan={2}>Loại tờ khai</th>
            {nhom.map((n) => <th key={n.nhan} scope="colgroup" className="nhom" colSpan={n.cot.length}>{n.nhan}</th>)}
          </tr>
          <tr>
            {cotPhang.map((c) => <th key={c.so} scope="col" className="num">{c.nhan}</th>)}
          </tr>
          {/*
            Dòng SỐ CỘT của mẫu, không phải dòng trang trí. Người đối chiếu với
            file Excel tìm theo "(14)" chứ không theo tên cột, và công thức ghi
            ngay dưới số là lời giải thích vì sao hai cột cạnh nhau lệch nhau.

            Ba số đầu là (3), (2), (4) chứ không phải (1), (2), (3): mẫu xếp
            STT · Mã · Tên · Loại, còn màn hình đưa TÊN lên đầu để nó làm cột
            dính khi cuộn ngang. Số cột giữ theo mẫu để đối chiếu được; tệp
            xuất ra vẫn theo đúng thứ tự của mẫu.
          */}
          <tr className="cot-so">
            <th scope="col" className="dv-cot">(3)</th>
            <th scope="col">(2)</th>
            <th scope="col">(4)</th>
            {cotPhang.map((c) => <th key={c.so} scope="col" title={c.ct}>{c.ct ?? `(${c.so})`}</th>)}
          </tr>
        </thead>
        <tbody>
          {dongTong("A. Tổng cộng", hang, "is-tong")}
          {vp.length > 0 && dongTong("I. Khối Văn phòng Thuế TP Hà Nội", vp, "is-khoi")}
          {vp.map((h) => <tr key={h.dv.id}>
            <th scope="row" className="dv-cot">
              <button type="button" className="dv-nut" title={h.dv.ten} onClick={() => onMoDanhSach(h.dv.id)}>{rutGonTenDonVi(h.dv.ten)}</button>
            </th>
            <td>{h.dv.ma}</td>
            <td>{loaiTK === "01" ? "01/GTGT" : "03, 04/GTGT"}</td>
            {cotPhang.map((c) => <td key={c.so} className="num">{soO(c, h)}</td>)}
          </tr>)}
          {tcs.length > 0 && dongTong("II. Khối Thuế cơ sở", tcs, "is-khoi")}
          {tcs.map((h) => <tr key={h.dv.id}>
            <th scope="row" className="dv-cot">
              <button type="button" className="dv-nut" title={h.dv.ten} onClick={() => onMoDanhSach(h.dv.id)}>{h.dv.ten}</button>
            </th>
            <td>{h.dv.ma}</td>
            <td>{loaiTK === "01" ? "01/GTGT" : "03, 04/GTGT"}</td>
            {cotPhang.map((c) => <td key={c.so} className="num">{soO(c, h)}</td>)}
          </tr>)}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}

/* ── Danh sách NNT chênh lệch ────────────────────────────────────────────── */

export function DanhSachChenhLech({ ky, vaiTro }: { ky: KyQL2; vaiTro: VaiTro }) {
  const { chon } = useBoLoc();
  const notify = useAction();
  const [chuaCo, datChuaCo] = useThamSo<"tatca" | "chuaco">("loc", "tatca", ["tatca", "chuaco"]);
  const [trang, datTrang] = useThamSoSo("trang", 1);
  const [tim, datTim] = useState("");
  const [daChon, datDaChon] = useState<string[]>([]);

  const tatCa = useMemo(() => danhSachChenhLech(ky.hat), [ky.hat]);
  const loc = useMemo(() => {
    const q = tim.trim().toLowerCase();
    return theoDonVi(tatCa, chon, (r) => r.dv.ten)
      .filter((r) => (chuaCo === "tatca" ? true : r.ketQua === "Chưa có kết quả"))
      .filter((r) => !q || r.mst.includes(q) || r.ten.toLowerCase().includes(q));
  }, [tatCa, chon, chuaCo, tim]);

  const soTrang = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const t = Math.min(trang, soTrang);
  const hien = loc.slice((t - 1) * MOI_TRANG, t * MOI_TRANG);

  const chuaGiao = loc.filter((r) => r.ketQua === "Chưa có kết quả" && !r.phieu);
  const giaoDuoc = daChon.length > 0 ? daChon.length : chuaGiao.length;

  return <Panel
    title="Danh sách NNT có chênh lệch"
    subtitle={`${nhanLuyKe(ky)} · ${money(loc.length)} dòng · 1 dòng = MST × loại tờ khai × kỳ`}
    actions={<div className="inline-controls">
      <Segmented
        label="Lọc kết quả"
        value={chuaCo}
        onChange={(v) => { datChuaCo(v); datTrang(1); }}
        options={[{ value: "tatca" as const, label: "Tất cả" }, { value: "chuaco" as const, label: "Chưa có kết quả" }]}
      />
      <SearchField value={tim} onChange={(v) => { datTim(v); datTrang(1); }} placeholder="Tìm MST hoặc tên NNT"/>
    </div>}
  >
    {/*
      Giao phiếu chỉ dành cho CHUYÊN VIÊN. Ma trận §3 ghi "Giao phiếu rà soát
      cho đơn vị | ● (PRS-03) | ✗" — trưởng phòng đọc và duyệt, không giao
      việc xuống đơn vị. Ẩn hẳn chứ không làm mờ, theo mục S1.

      Giao phiếu PRS-03 đứng ngay trên bảng vì nó thao tác trên chính những
      dòng bảng đang hiện. Số trên nút là số dòng SẼ được giao, không phải số
      dòng đang chọn — chưa chọn gì thì giao cả phần chưa có kết quả, và người
      dùng phải đọc được điều đó trước khi bấm, không phải sau.
    */}
    {vaiTro === "CV" && <div className="prs-thanh">
      <span>
        {money(chuaGiao.length)} NNT chưa có kết quả và chưa được giao phiếu.
        {daChon.length > 0 && ` Đang chọn ${money(daChon.length)} dòng.`}
      </span>
      <Button
        icon="upload"
        disabled={giaoDuoc === 0}
        onClick={() => {
          notify(`Đã giao ${money(giaoDuoc)} dòng thành phiếu PRS-03, tách theo đơn vị, hạn phản hồi 25/09/2026. Bản demo chưa gửi tới đơn vị.`);
          datDaChon([]);
        }}
      >Giao phiếu PRS-03 · {money(giaoDuoc)} dòng</Button>
    </div>}

    <TableWrap label="danh sách NNT chênh lệch">
      <table className="ql1-ds-table" style={{ minWidth: 1254 }}>
        <colgroup>
          {[56, 136, 210, 212, 160, 140, 180, 160].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead><tr>
          <th scope="col" className="center">Chọn</th>
          <th scope="col">MST</th>
          <th scope="col">Tên người nộp thuế</th>
          <th scope="col">Đơn vị quản lý</th>
          <th scope="col">Loại tờ khai</th>
          <th scope="col" className="num">Chênh lệch (trđ)</th>
          <th scope="col">Kết quả rà soát</th>
          <th scope="col">Phiếu PRS-03</th>
        </tr></thead>
        <tbody>
          {/*
            CẢ HÀNG bấm được, không riêng ô vuông 16px — quy ước đã đặt cho mọi
            thiết kế trong hệ. Ô tích vẫn là control thật cho bàn phím và cho
            trình đọc màn hình; cú bấm trên hàng chỉ là đường tắt cho chuột,
            nên nó bỏ qua khi người dùng bấm thẳng vào chính ô tích.
          */}
          {hien.map((r) => {
            const bat = () => datDaChon((truoc) => truoc.includes(r.mst) ? truoc.filter((x) => x !== r.mst) : [...truoc, r.mst]);
            return <tr
              key={`${r.mst}-${r.chieu}`}
              className={daChon.includes(r.mst) ? "is-selected" : undefined}
              onClick={(e) => { if (!(e.target instanceof HTMLInputElement)) bat(); }}
            >
            <td className="center">
              {/* Ô tích THẬT nằm dưới, trong suốt và trải hết ô; hình vuông
                  nhìn thấy do `<span>` vẽ. Nhờ thế vùng bấm bằng cả ô (≥44px ở
                  khổ chạm) mà vẫn là một `<input type="checkbox">` cho bàn
                  phím và cho trình đọc màn hình. */}
              <label className="o-chon">
                <input type="checkbox" aria-label={`Chọn ${r.mst}`} checked={daChon.includes(r.mst)} onChange={bat}/>
                <span aria-hidden="true"/>
              </label>
            </td>
            <td>{r.mst}</td>
            <td>{r.ten}{r.khongNopTK && <> <Badge tone="warning">Không nộp TK</Badge></>}</td>
            <td title={r.dv.ten}>{rutGonTenDonVi(r.dv.ten)}</td>
            <td>{CHIEU_CHENH.find((c) => c.id === r.chieu)?.nhan}</td>
            <td className="num">{money(r.chenhLech)}</td>
            <td>
              <Badge tone={r.ketQua === "Chưa có kết quả" ? "warning" : r.ketQua === "Đã chuyển Công an" ? "critical" : "positive"}>
                {r.ketQua}
              </Badge>
            </td>
            <td>{r.phieu || <span className="cell-empty">chưa giao</span>}</td>
          </tr>;
          })}
          {hien.length === 0 && <tr><td className="table-empty" colSpan={8}>Không có dòng nào khớp bộ lọc.</td></tr>}
        </tbody>
      </table>
    </TableWrap>
    <Pager trang={t} soTrang={soTrang} onChange={datTrang}/>
  </Panel>;
}

export const NHAN_KET_QUA = KET_QUA_PRS03;

