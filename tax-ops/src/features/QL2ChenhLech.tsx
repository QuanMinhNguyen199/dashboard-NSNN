import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Pager, Panel, SearchField, Segmented, TableWrap, money } from "@/components/ui";
import { theoDonVi, useBoLoc } from "@/components/BoLoc";
import { useAction } from "@/state/ActionContext";
import { useThamSo, useThamSoSo } from "@/state/diaChi";
import { ExportButton } from "@/components/ExportButton";
import { exportExcel } from "@/domain/reportFiles";
import type { ReportMeta } from "@/domain/reportExport";
import { TienDoPhieu } from "@/features/TienDoPhieu";
import { NhapKetQuaPhieu } from "@/features/NhapKetQuaPhieu";
import { rutGonTenDonVi } from "@/data/danhMuc";
import type { VaiTro } from "@/domain/types";
import {
  CHIEU_CHENH, CO_CHENH, KET_QUA_PRS03, KHAC_QL2_01, bangQL2_01, canRaSoat, chuaCoKetQua,
  danhSachChenhLech, donViThieuR31, DON_VI_QL2, nhanLuyKe, type ChieuQL2_01, type HangQL2_01, type KyQL2, type LoaiTK,
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

/*
  Bảng 27 cột số không vừa bất kỳ màn nào — đo được: 3.504px trong khung
  1.146px ở khổ 1440, tức 67% nằm ngoài tầm nhìn; ngay cả màn 1920 cũng chỉ
  thấy 44%. Cuộn ngang qua hai nghìn pixel để đọc một dòng là việc không ai
  làm nhanh được.

  Cách rút: LỌC THEO NHÓM CHỈ TIÊU, không bỏ cột nào. Mẫu báo cáo vốn đã chia
  27 cột thành năm nhóm bằng tiêu đề hai tầng, nên lọc theo nhóm là đọc bảng
  đúng cách bảng tự tổ chức. Bốn trong năm nhóm vừa khít khung; nhóm "Kết quả
  xử lý" (9 cột) còn thừa chừng 300px thay vì 2.358px.

  "Tóm tắt" là mặc định và CHỈ GỒM CỘT CÓ SẴN TRONG MẪU — (14)–(17) tổng cần
  rà soát, (28) và (30) chưa có kết quả. Không thêm cột dẫn xuất nào: một con
  số không có trong mẫu là một con số người đối chiếu không tìm thấy ở đâu.

  Bản xuất Excel vẫn ra đủ 27 cột; đây chỉ là cách đọc trên màn.
*/
const NHOM_TOM_TAT = [14, 15, 16, 17, 28, 30];

export function BangQL2_01({ ky, loaiTK, onMoDanhSach }: {
  ky: KyQL2;
  loaiTK: LoaiTK;
  /** Bấm một ô số mở danh sách đã lọc sẵn theo đơn vị (G3). */
  onMoDanhSach: (maDonVi: string, co?: string, loc?: string, loai?: string, ketqua?: string) => void;
}) {
  const { chon } = useBoLoc();
  const nhomDay = useMemo(() => nhomCot(loaiTK), [loaiTK]);
  const chonNhom = useMemo(
    () => ["tomtat", ...nhomDay.map((_, i) => `n${i}`), "tatca"],
    [nhomDay],
  );
  const [nhomMo, datNhomMo] = useThamSo<string>("nhom", "tomtat", chonNhom);
  const cotTatCa = nhomDay.reduce((t, n) => t + n.cot.length, 0);

  /* Lọc giữ NGUYÊN cấu trúc nhóm, không duỗi thành một dãy phẳng: tiêu đề hai
     tầng của mẫu phải còn nguyên, nếu không người đối chiếu mất mốc. */
  const nhom = useMemo(() => {
    if (nhomMo === "tatca") return nhomDay;
    if (nhomMo === "tomtat") {
      /*
        GIỮ HAI NHÓM, không gộp làm một.

        Tóm tắt lấy (14)–(17) từ "Tổng cần rà soát" và (28), (30) từ "Chưa có
        kết quả" — và hai nhóm ấy có cột TRÙNG TÊN: "Số NNT khai thiếu" xuất
        hiện ở cả hai. Gộp vào một tiêu đề thì hai cột cùng tên nằm cạnh nhau
        và không ai biết cái nào là cần rà soát, cái nào là còn tồn. Tiêu đề
        hai tầng của mẫu vốn sinh ra để phân biệt đúng chuyện này.
      */
      const loc = (i: number) => nhomDay[i].cot.filter((c) => NHOM_TOM_TAT.includes(c.so));
      return [
        { nhan: nhomDay[2].nhan, cot: loc(2) },
        { nhan: nhomDay[4].nhan, cot: loc(4) },
      ];
    }
    const i = Number(nhomMo.slice(1));
    return nhomDay[i] ? [nhomDay[i]] : nhomDay;
  }, [nhomDay, nhomMo]);
  const tatCa = useMemo(() => bangQL2_01(ky.hat, loaiTK), [ky.hat, loaiTK]);
  const hang = theoDonVi(tatCa, chon, (h) => h.dv.ten);

  const vp = hang.filter((h) => h.dv.nhom === "VP");
  const tcs = hang.filter((h) => h.dv.nhom === "TCS");
  const cong = (ds: HangQL2_01[], c: Cot) => Math.round(ds.reduce((t, h) => t + c.lay(h), 0) * 10) / 10;

  const dongTong = (nhanDong: string, ds: HangQL2_01[], lop: string) => <tr className={lop} key={nhanDong}>
    <th scope="row" className="dv-cot">{nhanDong}</th>
    <td>—</td>
    {nhom.flatMap((n) => n.cot).map((c) => <td key={c.so} className="num">{c.so >= 9 && c.so <= 31
      ? <button type="button" className="dv-nut" aria-label={`${c.nhan} · ${nhanDong}`} onClick={() => moChiTiet(ds, c)}>{money(cong(ds, c))}</button>
      : money(cong(ds, c))}</td>)}
  </tr>;

  const moChiTiet = (h: HangQL2_01 | HangQL2_01[], c?: Cot) => {
    const so = c?.so ?? 0;
    const co = [13, 18].includes(so) ? "khongnop"
      : [9, 10, 14, 15, 19, 20, 28, 29].includes(so) ? "thieu"
      : [11, 12, 16, 17, 21, 22, 30, 31].includes(so) ? "thua" : "";
    const ketqua = so >= 19 && so <= 22 ? "Đã điều chỉnh"
      : ({ 23: "Trạng thái 06", 24: "Trạng thái 05", 25: "Đã dừng hoạt động", 26: "Đã chuyển Công an", 27: "Không có chênh lệch" } as Record<number, string>)[so] ?? "";
    onMoDanhSach((Array.isArray(h) ? h : [h]).map((r) => r.dv.id).join(","), co, so >= 28 ? "chuaco" : "tatca", loaiTK, ketqua);
  };
  const oSo = (c: Cot, h: HangQL2_01) => c.so >= 9 && c.so <= 31
    ? <button type="button" className="dv-nut" aria-label={`${c.nhan} · ${h.dv.ten}`} onClick={() => moChiTiet(h, c)}>{soO(c, h)}</button>
    : soO(c, h);

  const cotPhang = nhom.flatMap((n) => n.cot);
  const rongBang = RONG_TEN + RONG_MA + cotPhang.reduce((t, c) => t + rongCua(c), 0);

  /* Cả `thead` dính thành một khối (xem `styles.css`), nên không cần đo chiều
     cao từng hàng tiêu đề nữa. */
  return <Panel chinh
    title={`Tổng hợp ${loaiTK === "01" ? "01GTGT" : "03, 04GTGT"}`}
    subtitle={`${nhanLuyKe(ky)} · tờ khai ${loaiTK === "01" ? "01/GTGT" : "03, 04/GTGT"} · đơn vị tiền: triệu đồng · nguồn: hddtbaocao`}
    actions={<label className="compact-field"><span>Nhóm chỉ tiêu</span>
      <select value={nhomMo} onChange={(e) => datNhomMo(e.target.value)}>
        <option value="tomtat">Tóm tắt</option>
        {nhomDay.map((n, i) => <option key={n.nhan} value={`n${i}`}>{n.nhan}</option>)}
        <option value="tatca">Tất cả {cotTatCa} chỉ tiêu</option>
      </select>
    </label>}
  >
    <TableWrap label={`tổng hợp ${loaiTK}`}>
      <table
        className="ql1-table ql2-01-table"
        style={{ minWidth: rongBang }}
      >
        <colgroup>
          <col style={{ width: RONG_TEN }}/>
          <col style={{ width: RONG_MA }}/>
          {cotPhang.map((c) => <col key={c.so} style={{ width: rongCua(c) }}/>)}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="dv-cot" rowSpan={2}>Tên cơ quan thuế</th>
            <th scope="col" rowSpan={2}>Mã cơ quan thuế</th>
            {nhom.map((n) => <th key={n.nhan} scope="colgroup" className="nhom" colSpan={n.cot.length}>{n.nhan}</th>)}
          </tr>
          <tr>
            {/*
              Số cột của mẫu và công thức nằm trong `title` của tên cột, không
              còn là một HÀNG riêng.

              Hàng ấy từng đứng ngay trên "A. Tổng cộng" và đọc ra như một
              dòng dữ liệu đầu tiên toàn số trong ngoặc. Nó còn nói dối khi
              lọc theo nhóm: "(14)=(5)+(9)" dẫn tới hai cột không có trên màn.
              Người đối chiếu với mẫu Excel vẫn tra được bằng cách trỏ vào tên
              cột, và tệp xuất ra vẫn theo đúng thứ tự của mẫu.
            */}
            {cotPhang.map((c) => <th key={c.so} scope="col" className="num" title={c.ct ?? `Cột (${c.so}) của mẫu`}>{c.nhan}</th>)}
          </tr>
        </thead>
        <tbody>
          {dongTong("A. Tổng cộng", hang, "is-tong")}
          {vp.length > 0 && dongTong("I. Khối Văn phòng Thuế TP Hà Nội", vp, "is-khoi")}
          {vp.map((h) => <tr key={h.dv.id}>
            <th scope="row" className="dv-cot">
              <button type="button" className="dv-nut" title={h.dv.ten} onClick={() => moChiTiet(h)}>{rutGonTenDonVi(h.dv.ten)}</button>
            </th>
            <td>{h.dv.ma}</td>
            {cotPhang.map((c) => <td key={c.so} className="num">{oSo(c, h)}</td>)}
          </tr>)}
          {tcs.length > 0 && dongTong("II. Khối Thuế cơ sở", tcs, "is-khoi")}
          {tcs.map((h) => <tr key={h.dv.id}>
            <th scope="row" className="dv-cot">
              <button type="button" className="dv-nut" title={h.dv.ten} onClick={() => moChiTiet(h)}>{h.dv.ten}</button>
            </th>
            <td>{h.dv.ma}</td>
            {cotPhang.map((c) => <td key={c.so} className="num">{oSo(c, h)}</td>)}
          </tr>)}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}

/* ── Danh sách NNT chênh lệch ────────────────────────────────────────────── */

export function DanhSachChenhLech({ ky, vaiTro, meta }: { ky: KyQL2; vaiTro: VaiTro; meta: ReportMeta }) {
  const { chon } = useBoLoc();
  const notify = useAction();
  const [chuaCo, datChuaCo] = useThamSo<"tatca" | "chuaco">("loc", "tatca", ["tatca", "chuaco"]);
  /*
    Lọc theo CỜ — §4.2 tab 3 liệt kê ba cờ (khai thiếu · khai thừa · không
    nộp TK) như một phần của dòng. Trước đây chúng chỉ ĐỌC được: khai
    thiếu/khai thừa suy từ cột Loại tờ khai, không nộp TK là một chip cạnh
    tên. Suy ra được nhưng không lọc được, trong khi cả ba đều là thứ cán bộ
    lọc trước khi giao phiếu.
  */
  const [co, datCo] = useThamSo<string>("co", "", ["", ...CO_CHENH.map((c) => c.id)]);
  const [trang, datTrang] = useThamSoSo("trang", 1);
  const [loai, datLoai] = useThamSo<string>("loaitk", "", ["", "01", "0304"]);
  const [ketqua, datKetQua] = useThamSo<string>("ketqua", "", ["", ...KET_QUA_PRS03, "Trạng thái 06", "Trạng thái 05", "Đã dừng hoạt động"]);
  const [moDuPhong, datMoDuPhong] = useState(false);
  const thieuR31 = useMemo(() => donViThieuR31(ky.hat), [ky.hat]);
  const donViThieu = DON_VI_QL2.filter((d) => thieuR31.includes(d.id) && (!chon.donVi.length || chon.donVi.includes(d.ten)));
  const duPhong = donViThieu.length > 0;
  const choGiao = duPhong && vaiTro === "CV";
  const [tim, datTim] = useState("");
  const [daChon, datDaChon] = useState<string[]>([]);

  const tatCa = useMemo(() => danhSachChenhLech(ky.hat), [ky.hat]);
  const loc = useMemo(() => {
    const q = tim.trim().toLowerCase();
    return theoDonVi(tatCa, chon, (r) => r.dv.ten)
      .filter((r) => chuaCo === "tatca" || (!thieuR31.includes(r.dv.id) && r.ketQua === "Chưa có kết quả"))
      .filter((r) => !ketqua || (!thieuR31.includes(r.dv.id) && r.ketQua === ketqua))
      .filter((r) => !loai || (loai === "01" ? ["ra", "vao"].includes(r.chieu) : ["t03", "t04"].includes(r.chieu)))
      .filter((r) => !co || (CO_CHENH.find((c) => c.id === co)?.hop(r) ?? true))
      .filter((r) => !q || r.mst.includes(q) || r.ten.toLowerCase().includes(q));
  }, [tatCa, chon, chuaCo, co, tim, loai, ketqua, thieuR31]);

  // Đổi phạm vi lọc thì bỏ lựa chọn cũ; chuyển trang vẫn giữ lựa chọn.
  useEffect(() => { datDaChon([]); datMoDuPhong(false); }, [ky.hat, chon, chuaCo, co, tim, loai, ketqua]);

  const soTrang = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const t = Math.min(trang, soTrang);
  const hien = loc.slice((t - 1) * MOI_TRANG, t * MOI_TRANG);

  const chuaGiao = loc.filter((r) => thieuR31.includes(r.dv.id) && r.ketQua === "Chưa có kết quả" && !r.phieu);
  const khoaDong = (r: (typeof tatCa)[number]) => `${ky.hat}-${r.mst}-${r.chieu}`;
  const giaoDuoc = chuaGiao.filter((r) => daChon.includes(khoaDong(r))).length;

  return <><Panel className="ql2-chenh-list"
    title="Danh sách NNT có chênh lệch"
    /* HAI con số: một MST có thể có tới bốn dòng, nên số dòng khác số doanh
       nghiệp — và người đọc phải thấy cả hai để không đếm nhầm. */
    subtitle={`${nhanLuyKe(ky)} · ${money(loc.length)} dòng / ${money(new Set(loc.map((r) => r.mst)).size)} NNT`}
    actions={<div className="inline-controls">
      <ExportButton onExport={() => exportExcel([{
        name: "DS NNT chenh lech", title: "Danh sách NNT có chênh lệch", unit: "triệu đồng",
        headers: ["MST", "Tên NNT", "Đơn vị", "Loại tờ khai", "Chênh lệch", "Kết quả rà soát", "Nguồn kết quả"],
        rows: loc.map((r) => [r.mst, r.ten, r.dv.ten, CHIEU_CHENH.find((c) => c.id === r.chieu)!.nhan, r.chenhLech,
          thieuR31.includes(r.dv.id) ? "Thiếu dữ liệu r31" : r.ketQua, thieuR31.includes(r.dv.id) ? "Chưa nhận r31" : "hddtbaocao r31 (mô phỏng)"]),
      }], meta, `QL2_DS_chenhlech_${ky.id}.xlsx`)}>Xuất Excel</ExportButton>
      <Segmented
        label="Lọc kết quả"
        value={chuaCo}
        onChange={(v) => { datChuaCo(v); datTrang(1); }}
        options={[{ value: "tatca" as const, label: "Tất cả" }, { value: "chuaco" as const, label: "Chưa có kết quả" }]}
      />
      <label className="compact-field"><span>Cờ</span>
        <select value={co} onChange={(e) => { datCo(e.target.value); datTrang(1); }}>
          <option value="">Tất cả</option>
          {CO_CHENH.map((c) => <option key={c.id} value={c.id}>{c.nhan}</option>)}
        </select>
      </label>
      <label className="compact-field"><span>Loại tờ khai</span><select value={loai} onChange={(e) => { datLoai(e.target.value); datTrang(1); }}>
        <option value="">Tất cả</option><option value="01">01/GTGT</option><option value="0304">03, 04/GTGT</option>
      </select></label>
      {ketqua && <Button kind="quiet" onClick={() => datKetQua("")}>Bỏ lọc: {ketqua}</Button>}
      <SearchField value={tim} onChange={(v) => { datTim(v); datTrang(1); }} placeholder="Tìm MST hoặc tên NNT"/>
    </div>}
  >
    {/*
      Giao phiếu chỉ dành cho CHUYÊN VIÊN. Ma trận §3 ghi "Giao phiếu rà soát
      cho đơn vị | ● (PRS-03) | ✗" — trưởng phòng đọc và duyệt, không giao
      việc xuống đơn vị. Ẩn hẳn chứ không làm mờ, theo mục S1.

      Giao phiếu PRS-03 đứng ngay trên bảng vì nó thao tác trên chính những
      dòng đã chọn, chưa có kết quả và chưa được giao phiếu.
    */}
    <div className="prs-thanh"><span>Kết quả rà soát: hddtbaocao r31 · dữ liệu mô phỏng.
      {duPhong && ` Thiếu r31 kỳ ${ky.nhan} tại ${donViThieu.map((d) => rutGonTenDonVi(d.ten)).join(", ")}. Phiếu PRS-03 chỉ dùng dự phòng cho phần thiếu.`}
    </span>{choGiao && <Button kind="quiet" onClick={() => datMoDuPhong(!moDuPhong)}>{moDuPhong ? "Đóng xử lý dự phòng" : "Theo dõi phiếu dự phòng"}</Button>}</div>
    {choGiao && <div className="prs-thanh">
      <span>
        {money(chuaGiao.length)} dòng thiếu nguồn r31, chưa có kết quả dự phòng và chưa được giao phiếu.
        {giaoDuoc > 0 ? ` Đang chọn ${money(giaoDuoc)} dòng.` : " Chọn dòng để giao phiếu."}
      </span>
      <Button
        icon="upload"
        disabled={giaoDuoc === 0}
        onClick={() => {
          if (giaoDuoc === 0) return;
          notify(`Đã giao ${money(giaoDuoc)} dòng thành phiếu PRS-03, tách theo đơn vị, thuộc phạm vi thiếu r31. Bản demo chưa gửi tới đơn vị.`);
          datDaChon([]);
        }}
      >Giao phiếu PRS-03 · {money(giaoDuoc)} dòng</Button>
    </div>}

    <TableWrap label="danh sách NNT chênh lệch">
      {/* Tổng 1.145px: vừa khung 1.146px ở khổ 1440. Bản trước 1.254px nên
          tràn 108px — phải cuộn ngang cho một bảng chỉ tám cột, trong khi chỗ
          dư nằm ở hai cột tên vốn chứa chuỗi ngắn hơn nhiều. */}
      <table className="ql1-ds-table" style={{ minWidth: duPhong ? 1145 : 959 }}>
        <colgroup>
          {[...(choGiao ? [56] : []), 136, 188, 180, 150, 130, 175, ...(duPhong ? [130] : [])].map((w, i) => <col key={i} style={{ width: w }}/>)}
        </colgroup>
        <thead><tr>
          {choGiao && <th scope="col" className="center">Chọn</th>}
          <th scope="col">MST</th>
          <th scope="col">Tên người nộp thuế</th>
          <th scope="col">Đơn vị quản lý</th>
          <th scope="col">Loại tờ khai</th>
          <th scope="col" className="num">Chênh lệch (trđ)</th>
          <th scope="col">Kết quả rà soát</th>
          {duPhong && <th scope="col">Phiếu PRS-03</th>}
        </tr></thead>
        <tbody>
          {/*
            CẢ HÀNG bấm được, không riêng ô vuông 16px — quy ước đã đặt cho mọi
            thiết kế trong hệ. Ô tích vẫn là control thật cho bàn phím và cho
            trình đọc màn hình; cú bấm trên hàng chỉ là đường tắt cho chuột,
            nên nó bỏ qua khi người dùng bấm thẳng vào chính ô tích.
          */}
          {hien.map((r) => {
            const khoa = khoaDong(r);
            const choChon = choGiao && thieuR31.includes(r.dv.id) && r.ketQua === "Chưa có kết quả" && !r.phieu;
            const bat = () => {
              if (!choChon) return;
              datDaChon((truoc) => truoc.includes(khoa) ? truoc.filter((x) => x !== khoa) : [...truoc, khoa]);
            };
            return <tr
              key={khoa}
              className={daChon.includes(khoa) ? "is-selected" : undefined}
              onClick={(e) => { if (!(e.target instanceof Element && e.target.closest(".o-chon"))) bat(); }}
            >
            {choGiao && <td className="center">
              {/* Ô tích THẬT nằm dưới, trong suốt và trải hết ô; hình vuông
                  nhìn thấy do `<span>` vẽ. Nhờ thế vùng bấm bằng cả ô (≥44px ở
                  khổ chạm) mà vẫn là một `<input type="checkbox">` cho bàn
                  phím và cho trình đọc màn hình. */}
              <label className="o-chon">
                <input type="checkbox" aria-label={`Chọn ${r.mst} · ${CHIEU_CHENH.find((c) => c.id === r.chieu)?.nhan}`} disabled={!choChon} checked={daChon.includes(khoa)} onChange={bat}/>
                <span aria-hidden="true"/>
              </label>
            </td>}
            <td>{r.mst}</td>
            <td>{r.ten}{r.khongNopTK && <> <Badge tone="warning">Không nộp TK</Badge></>}</td>
            <td title={r.dv.ten}>{rutGonTenDonVi(r.dv.ten)}</td>
            <td>{CHIEU_CHENH.find((c) => c.id === r.chieu)?.nhan}</td>
            <td className="num">{money(r.chenhLech)}</td>
            <td>
              {thieuR31.includes(r.dv.id) ? <Badge tone="warning">Thiếu dữ liệu r31</Badge> : <Badge tone={r.ketQua === "Chưa có kết quả" ? "warning" : r.ketQua === "Đã chuyển Công an" ? "critical" : "positive"}>
                {r.ketQua}
              </Badge>}
            </td>
            {duPhong && <td>{thieuR31.includes(r.dv.id) ? r.phieu || <span className="cell-empty">chưa giao</span> : "—"}</td>}
          </tr>;
          })}
          {hien.length === 0 && <tr><td className="table-empty" colSpan={6 + Number(choGiao) + Number(duPhong)}>Không có dòng nào khớp bộ lọc.</td></tr>}
        </tbody>
      </table>
    </TableWrap>
    <Pager trang={t} soTrang={soTrang} onChange={datTrang}/>
  </Panel>
  {choGiao && moDuPhong && <>
    <TienDoPhieu loai="PRS-03" hatKy={ky.hat} donViChoPhep={donViThieu.map((d) => d.ten)}/>
    <NhapKetQuaPhieu key={`${ky.id}-${donViThieu.map((d) => d.id).join(",")}`} loai="PRS-03" hatKy={ky.hat} donViChoPhep={donViThieu.map((d) => d.ten)}/>
  </>}</>;
}

export const NHAN_KET_QUA = KET_QUA_PRS03;

