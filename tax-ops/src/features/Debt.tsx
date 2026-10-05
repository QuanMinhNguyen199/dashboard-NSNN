import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, PageIntro, Pager, Panel, SearchField, Segmented, TableWrap, integer } from "@/components/ui";
import { BoLocChung, theoDonVi, useBoLoc } from "@/components/BoLoc";
import { DebtQL1 } from "@/features/DebtQL1";
import { napDanhSach, type HangChiTiet, type HangThucHien, type TongHopThat } from "@/data/duLieuThat";
import { useDuLieuThat } from "@/state/DuLieuThatContext";
import { useAction } from "@/state/ActionContext";



/*
  Tên đơn vị trong bộ thật dài tới 40 ký tự ("Phòng Quản lý, Hỗ trợ doanh nghiệp
  số 1"). Để nguyên thì cột đơn vị nuốt mất bề ngang của cột tên doanh nghiệp.
  Tên đầy đủ vẫn nằm trong khối chi tiết, nên đây là rút gọn hiển thị chứ không
  mất dữ liệu.
*/
const rutGonDonVi = (ten: string) => ten
  .replace(/^Phòng Quản lý,\s*Hỗ trợ doanh nghiệp số\s*/i, "Phòng QLHT DN ")
  .replace(/^Phòng Quản lý các khoản thu từ đất$/i, "Phòng QL thu từ đất")
  .replace(/^Phòng Thuế cá nhân, hộ kinh doanh và thu khác$/i, "Phòng Thuế cá nhân – HKD");

/** Đồng sang tỷ đồng. Mọi danh sách chi tiết ghi bằng đồng. */
const tyTuDong = (d: number | null | undefined) => d === null || d === undefined ? "—" : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(d / 1e9);
/** Bảng nợ theo đơn vị ghi bằng TRIỆU đồng — theo tiêu đề sheet gốc. */
const tyTuTrieu = (t: number | null | undefined) => t === null || t === undefined ? "—" : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(t / 1000);
const phanTram = (x: number | null | undefined) => x === null || x === undefined ? "—" : `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(x * 100)}%`;

/* ────────────────────────────────────────────────────────────────────────
   Bốn mục báo cáo nợ của Phòng QL1.

   Bốn mục này không phải bốn màn: chúng dùng chung bộ lọc, chung khuôn "bảng
   tổng hợp theo đơn vị + danh sách chi tiết", và cán bộ đọc liên tiếp cả bốn
   trong MỘT lần lập báo cáo tuần. Tách thành bốn mục điều hướng thì bắt họ đi
   ra đi vào bốn lần cho một việc.

   Mỗi mục khai bảng tổng hợp lấy ở đâu, cột nào, và danh sách chi tiết đi kèm,
   thay vì dựng bốn khối giao diện song song phải nuôi riêng.
   ──────────────────────────────────────────────────────────────────────── */
type TabId = "no" | "cc" | "th" | "t06";

interface CauHinh {
  id: TabId;
  nhan: string;
  dauTomTat: { nhan: string; num?: boolean }[];
  bangTomTat: (t: TongHopThat) => { donVi: string; laTong: boolean; o: ReactNode[] }[];
  tep: string;
  tieuDeDs: string;
  /* Các cột CÓ THỂ lọc. Ô chọn chỉ được dựng khi cột đó có từ hai giá trị trở
     lên trong dữ liệu thật — xem ghi chú ở `locDungDuoc`. */
  locUngVien: { khoa: keyof HangChiTiet; nhan: string }[];
  dauDs: { nhan: string; num?: boolean }[];
  oDs: ((r: HangChiTiet) => ReactNode)[];
}

const oTien = (v: number | null | undefined) => <><strong>{tyTuDong(v)}</strong><small>tỷ đồng</small></>;
const oNNT = (v: number | null | undefined) => <><strong>{v === null || v === undefined ? "—" : integer(v)}</strong><small>người nộp thuế</small></>;

/* Cưỡng chế và tạm hoãn XC dùng chung khuôn tám cột, nên dùng chung hàm dựng. */
const bangThucHien = (ds: HangThucHien[]) => ds.map((r) => ({
  donVi: rutGonDonVi(r.donVi),
  laTong: /tổng/i.test(r.donVi),
  o: [oNNT(r.phaiNNT), oTien(r.phaiTien), oNNT(r.daNNT), oNNT(r.chuaNNT), oTien(r.chuaTien), <strong>{phanTram(r.tyLe)}</strong>],
}));
const dauThucHien = [
  { nhan: "Phải thực hiện", num: true }, { nhan: "Số tiền phải", num: true },
  { nhan: "Đã thực hiện", num: true }, { nhan: "Chưa thực hiện", num: true },
  { nhan: "Số tiền chưa", num: true }, { nhan: "Tỷ lệ đã làm", num: true },
];
const cotChung = [{ nhan: "Người nộp thuế" }, { nhan: "Mã số thuế" }, { nhan: "Đơn vị quản lý" }];

const CAU_HINH: CauHinh[] = [
  {
    id: "no",
    nhan: "Tình hình nợ",
    dauTomTat: [{ nhan: "Tổng cộng", num: true }, { nhan: "Nợ khả năng thu", num: true }, { nhan: "Khó thu", num: true }, { nhan: "Đang xử lý", num: true }, { nhan: "So với đầu năm", num: true }],
    bangTomTat: (t) => t.noTheoDonVi.map((r) => ({
      donVi: rutGonDonVi(r.ten),
      laTong: r.laTongHop,
      o: [
        <><strong>{tyTuTrieu(r.hienTai.tongCong)}</strong><small>tỷ đồng</small></>,
        <><strong>{tyTuTrieu(r.hienTai.noKNT)}</strong><small>tỷ đồng</small></>,
        <><strong>{tyTuTrieu(r.hienTai.khoThu)}</strong><small>tỷ đồng</small></>,
        <><strong>{tyTuTrieu(r.hienTai.dangXuLy)}</strong><small>tỷ đồng</small></>,
        <strong className={(r.soVoiDauNamPhanTram.tongCong ?? 0) > 0 ? "tone-critical" : "tone-positive"}>{phanTram(r.soVoiDauNamPhanTram.tongCong)}</strong>,
      ],
    })),
    tep: "no-tang-500.json",
    tieuDeDs: "Doanh nghiệp tăng nợ khả năng thu từ 500 triệu đồng",
    locUngVien: [{ khoa: "donVi", nhan: "Đơn vị" }, { khoa: "maCQT", nhan: "Mã CQT" }, { khoa: "loaiNNT", nhan: "Loại NNT" }] as { khoa: keyof HangChiTiet; nhan: string }[],
    dauDs: [...cotChung, { nhan: "Nợ hiện tại", num: true }, { nhan: "Tăng từ đầu năm", num: true }],
    oDs: [
      (r) => <strong>{r.ten ?? "—"}</strong>,
      (r) => <code>{r.mst ?? "—"}</code>,
      (r) => <span>{r.donVi ? rutGonDonVi(r.donVi) : "—"}</span>,
      (r) => oTien(r.noHienTai),
      (r) => oTien(r.tangGiam),
    ],
  },
  {
    id: "cc",
    nhan: "Cưỡng chế nợ thuế",
    dauTomTat: dauThucHien,
    bangTomTat: (t) => bangThucHien(t.cuongChe),
    tep: "chua-cuong-che.json",
    tieuDeDs: "Người nộp thuế chưa cưỡng chế",
    locUngVien: [{ khoa: "donVi", nhan: "Đơn vị" }, { khoa: "maCQT", nhan: "Mã CQT" }, { khoa: "chuong", nhan: "Chương" }, { khoa: "loaiNNT", nhan: "Loại NNT" }] as { khoa: keyof HangChiTiet; nhan: string }[],
    dauDs: [...cotChung, { nhan: "Nợ đánh giá", num: true }, { nhan: "Nợ quá hạn", num: true }],
    oDs: [
      (r) => <strong>{r.ten ?? "—"}</strong>,
      (r) => <code>{r.mst ?? "—"}</code>,
      (r) => <span>{r.donVi ? rutGonDonVi(r.donVi) : "—"}</span>,
      (r) => oTien(r.tongNoDanhGia),
      (r) => <><strong>{tyTuDong(r.noNgay)}</strong><small>&gt; 90 ngày</small></>,
    ],
  },
  {
    id: "th",
    nhan: "Tạm hoãn XC từ 500 triệu",
    dauTomTat: dauThucHien,
    bangTomTat: (t) => bangThucHien(t.tamHoanXuatCanh),
    tep: "chua-thxc.json",
    tieuDeDs: "Người nộp thuế nợ từ 500 triệu chưa tạm hoãn xuất cảnh",
    locUngVien: [{ khoa: "donVi", nhan: "Đơn vị" }, { khoa: "maCQT", nhan: "Mã CQT" }, { khoa: "chuong", nhan: "Chương" }, { khoa: "loaiNNT", nhan: "Loại NNT" }] as { khoa: keyof HangChiTiet; nhan: string }[],
    dauDs: [...cotChung, { nhan: "Nợ đánh giá", num: true }, { nhan: "Nợ quá hạn", num: true }],
    oDs: [
      (r) => <strong>{r.ten ?? "—"}</strong>,
      (r) => <code>{r.mst ?? "—"}</code>,
      (r) => <span>{r.donVi ? rutGonDonVi(r.donVi) : "—"}</span>,
      (r) => oTien(r.tongNoDanhGia),
      (r) => <><strong>{tyTuDong(r.noNgay)}</strong><small>&gt; 120 ngày</small></>,
    ],
  },
  {
    id: "t06",
    nhan: "Tạm hoãn XC trạng thái 06",
    dauTomTat: [{ nhan: "Trạng thái 06", num: true }, { nhan: "Nợ KCHĐ", num: true }, { nhan: "Đã tạm hoãn", num: true }, { nhan: "Chưa tạm hoãn", num: true }, { nhan: "Số tiền chưa", num: true }, { nhan: "Tỷ lệ đã làm", num: true }],
    bangTomTat: (t) => t.tamHoanTongHop.map((r) => ({
      donVi: rutGonDonVi(r.donVi),
      laTong: /tổng/i.test(r.donVi),
      o: [oNNT(r.nntTrangThai06), oTien(r.tongNoKhongHoatDong), oNNT(r.daTamHoanNNT), oNNT(r.chuaTamHoanNNT), oTien(r.chuaTamHoanTien), <strong>{phanTram(r.tyLeDaTamHoan)}</strong>],
    })),
    tep: "chua-tam-hoan.json",
    tieuDeDs: "Người nộp thuế trạng thái 06 chưa tạm hoãn xuất cảnh",
    locUngVien: [{ khoa: "donVi", nhan: "Đơn vị" }, { khoa: "maCQT", nhan: "Mã CQT" }, { khoa: "chuong", nhan: "Chương" }, { khoa: "loaiNNT", nhan: "Loại NNT" }, { khoa: "nhomXuLy", nhan: "Nhóm xử lý" }] as { khoa: keyof HangChiTiet; nhan: string }[],
    dauDs: [...cotChung, { nhan: "Nợ KCHĐ", num: true }, { nhan: "Nhóm xử lý" }],
    oDs: [
      (r) => <strong>{r.ten ?? "—"}</strong>,
      (r) => <code>{r.mst ?? "—"}</code>,
      (r) => <span>{r.donVi ? rutGonDonVi(r.donVi) : "—"}</span>,
      (r) => oTien(r.tongNoKhongHoatDong),
      (r) => <span>{r.nhomXuLy ?? "—"}</span>,
    ],
  },
];

/* Mười dòng một trang, không cuộn trong khung — xem The Long List Gets Pages
   Rule trong DESIGN.md. */
const MOI_TRANG = 10;

/*
  Hai đường dựng cho cùng một màn, và đó là CÓ CHỦ Ý, không phải nợ kỹ thuật.

  `DebtQL1` là màn của bản demo: bốn mục báo cáo đúng cấu trúc tài liệu QL1,
  chạy trên dữ liệu giả, không cần tệp nào ngoài mã nguồn. `DebtThat` chỉ dựng
  khi có tệp thật được bật bằng `?du-lieu-that=1` — nó đọc JSON sinh từ tệp
  Excel gốc, nên không chạy được ở nơi không có tệp đó.

  Gộp hai đường thành một sẽ phải chọn: hoặc bản demo gãy khi thiếu tệp, hoặc
  màn dữ liệu thật phải giả lập những cột nó không có.
*/
export function Debt({ actor }: { actor: string }) {
  const { that } = useDuLieuThat();
  return that ? <DebtThat that={that}/> : <DebtQL1 actor={actor}/>;
}

function DebtThat({ that }: { that: TongHopThat }) {
  const notify = useAction();
  const { chon } = useBoLoc();
  const [tab, setTab] = useState<TabId>("no");
  const [search, setSearch] = useState("");
  const [loc, setLoc] = useState<Record<string, string>>({});
  const [trang, setTrang] = useState(1);
  const [kho, setKho] = useState<Record<string, HangChiTiet[] | null>>({});

  const cau = CAU_HINH.find((c) => c.id === tab)!;
  const boDs = kho[cau.tep] ?? null;

  /* Chỉ nạp danh sách của mục ĐANG mở. Nạp cả bốn một lượt là 6,7 MB cho một
     màn mà người dùng chỉ đọc một mục tại một thời điểm. */
  useEffect(() => {
    if (cau.tep in kho) return;
    let con = true;
    napDanhSach(cau.tep).then((d) => { if (con) setKho((truoc) => ({ ...truoc, [cau.tep]: d })); });
    return () => { con = false; };
  }, [cau.tep, kho]);

  /* Đổi mục thì bộ lọc của mục cũ không còn nghĩa: danh sách giá trị khác hẳn. */
  useEffect(() => { setLoc({}); setSearch(""); }, [tab]);
  useEffect(() => { setTrang(1); }, [tab, search, loc, boDs]);

  const tomTatDay = useMemo(() => cau.bangTomTat(that), [cau, that]);
  /* Danh mục đơn vị lấy từ chính bảng tổng hợp: nó có đủ mọi đơn vị của kỳ,
     kể cả đơn vị không có dòng nào trong danh sách chi tiết. Dòng tổng không
     phải một đơn vị nên không vào danh mục. */
  const donViCo = useMemo(() => tomTatDay.filter((r) => !r.laTong).map((r) => r.donVi), [tomTatDay]);
  /* Dòng tổng giữ lại khi lọc: nó là mốc để đọc tỷ trọng của phần đang lọc. */
  const tomTat = useMemo(
    () => chon.donVi.length === 0 ? tomTatDay : tomTatDay.filter((r) => r.laTong || chon.donVi.includes(r.donVi)),
    [tomTatDay, chon],
  );

  /*
    Ô chọn chỉ được dựng cho cột CÓ TỪ HAI giá trị trở lên.

    Bộ dữ liệu thật có những cột hằng số: "Loại NNT" ở danh sách chưa cưỡng chế
    chỉ có đúng "Doanh nghiệp, tổ chức" trên cả 2.455 dòng, "Nhóm xử lý" ở
    trạng thái 06 chỉ có một giá trị. Dựng ô chọn cho chúng là dựng một control
    bấm vào không đổi được gì. Đếm ngay trên dữ liệu thay vì khai cứng, nên khi
    kỳ sau có thêm giá trị thì ô lọc tự xuất hiện.
  */
  const locDungDuoc = useMemo(() => cau.locUngVien.map((u) => {
    const giaTri = [...new Set((boDs ?? []).map((r) => r[u.khoa]).filter((v) => v !== null && v !== undefined).map(String))]
      .sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
    return { ...u, giaTri };
  }).filter((u) => u.giaTri.length >= 2), [cau, boDs]);

  const locDay = useMemo(() => theoDonVi(boDs ?? [], chon, (r) => r.donVi).filter((r) => {
    if (!`${r.ten ?? ""} ${r.mst ?? ""} ${r.donVi ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return Object.entries(loc).every(([khoa, v]) => !v || String(r[khoa as keyof HangChiTiet] ?? "") === v);
  }), [boDs, search, loc, chon]);

  const soTrang = Math.max(1, Math.ceil(locDay.length / MOI_TRANG));
  const trangHienTai = Math.min(trang, soTrang);
  const tu = (trangHienTai - 1) * MOI_TRANG;
  const rows = locDay.slice(tu, tu + MOI_TRANG);
  const coLoc = search !== "" || Object.values(loc).some(Boolean);

  return <div className="page-stack">
    {/*
      Kỳ hiện dưới dạng CHỮ, không phải ô chọn: bộ dữ liệu hiện có đúng một kỳ.
      Hai mốc ngày khác nhau là có thật trong tệp gốc — bảng tổng hợp chốt
      31/07, danh sách chi tiết chốt 22/07 — nên nói cả hai thay vì chọn bừa.
    */}
    <PageIntro title="Nợ và cưỡng chế"/>

    {/* Thanh lọc đứng TRÊN cụm tab, vì nó áp cho cả bốn mục. Đặt dưới tab sẽ
        đọc thành "lọc của mục này", đúng thứ G1 yêu cầu không được hiểu nhầm. */}
    <BoLocChung ky={`Nợ đến 31/07/2026 · chi tiết chốt ${that.ngayBaoCao ?? "—"}`} donViCo={donViCo} rutGon={rutGonDonVi}/>

    <Segmented label="Mục báo cáo nợ" value={tab} onChange={setTab} options={CAU_HINH.map((c) => ({ value: c.id, label: c.nhan }))}/>

    <Panel title="Tổng hợp theo đơn vị">
      <TableWrap label={`tổng hợp ${cau.nhan} theo đơn vị`}><table className="tomtat-table">
        <thead><tr>
          <th scope="col">Phòng / Thuế cơ sở</th>
          {cau.dauTomTat.map((d) => <th key={d.nhan} scope="col" className={d.num ? "num" : undefined}>{d.nhan}</th>)}
        </tr></thead>
        <tbody>{tomTat.map((r) => <tr key={r.donVi} className={r.laTong ? "is-tong" : undefined}>
          <td><span>{r.donVi}</span></td>
          {r.o.map((o, i) => <td key={i} className={cau.dauTomTat[i]?.num ? "num" : undefined}>{o}</td>)}
        </tr>)}</tbody>
      </table></TableWrap>
    </Panel>

    {/*
      Không còn cột chi tiết bên phải. Bốn mục này là BÁO CÁO để đọc và kết
      xuất, không phải hàng đợi xử lý từng hồ sơ: mọi trường của một dòng đã
      nằm trên chính dòng đó, nên một khối chi tiết chỉ lặp lại chúng và lấy
      mất 30% bề ngang của bảng.
    */}
    <Panel
      title={cau.tieuDeDs}
      actions={<div className="inline-controls">
        <SearchField value={search} onChange={setSearch} placeholder="Tìm MST, tên hoặc đơn vị"/>
        {locDungDuoc.map((u) => <label className="compact-field" key={String(u.khoa)}><span>{u.nhan}</span>
          <select value={loc[u.khoa] ?? ""} onChange={(e) => setLoc((t) => ({ ...t, [u.khoa]: e.target.value }))}>
            <option value="">Tất cả</option>
            {u.giaTri.map((v) => <option key={v} value={v}>{u.khoa === "donVi" ? rutGonDonVi(v) : v}</option>)}
          </select>
        </label>)}
        {coLoc && <Button kind="quiet" onClick={() => { setLoc({}); setSearch(""); }}>Đặt lại</Button>}
      </div>}
    >
      <TableWrap label={cau.tieuDeDs}><table className="debt-table">
        <thead><tr>{cau.dauDs.map((d) => <th key={d.nhan} scope="col" className={d.num ? "num" : undefined}>{d.nhan}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => <tr key={`${row.mst}-${row.stt}-${i}`}>
            {cau.oDs.map((o, j) => <td key={j} className={cau.dauDs[j]?.num ? "num" : undefined}>{o(row)}</td>)}
          </tr>)}
          {boDs === null && <tr><td className="table-empty" colSpan={cau.dauDs.length}>Đang nạp danh sách…</td></tr>}
          {boDs !== null && locDay.length === 0 && <tr><td className="table-empty" colSpan={cau.dauDs.length}>Không có bản ghi nào khớp bộ lọc.</td></tr>}
        </tbody>
      </table></TableWrap>
      <footer className="table-footer">
        <Pager trang={trangHienTai} soTrang={soTrang} onChange={setTrang}/>
        <Button kind="secondary" onClick={() => notify(`Có ${integer(locDay.length)} bản ghi đang lọc. Bản demo chưa hỗ trợ tải file.`)}>Xuất danh sách đang lọc</Button>
      </footer>
    </Panel>
  </div>;
}
