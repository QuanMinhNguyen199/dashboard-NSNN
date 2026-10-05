import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge, Button, Pager, PageIntro, Panel, SearchField, TableWrap, integer, money } from "@/components/ui";
import { useQL1Navigation } from "@/components/QL1Navigation";
import { BoLocChung, theoDonVi, useBoLoc } from "@/components/BoLoc";
import { ExportButton } from "@/components/ExportButton";
import { useDuyet } from "@/state/DuyetContext";
import { inReportList, ql1Summary, ql1Details, ql1Workbook, type ReportMeta } from "@/domain/reportExport";
import { exportExcel, exportWord } from "@/domain/reportFiles";
import { useAction } from "@/state/ActionContext";
import {
  DON_VI_QL1, KY_QL1, KY_THEO_ID, NHAN_MOC, danhSachQL1, donViCuaTab, tongHopCuaTab,
  type BoNo, type DonViQL1, type HangQL1, type MocSoSanh, type OTongHop06, type OTongHopNo, type OTongHopXuLy, type TabQL1,
} from "@/data/ql1";
import { NGUONG, ruleItems, trieu, hienTyLe } from "@/data/thamSo";
import { ThanhDuyet } from "@/features/ThanhDuyet";
import { NGUON_QL1 } from "@/data/nguonDuLieu";
import { DuLieuGoc } from "@/features/DuLieuGoc";
import { TongQuanQL1 } from "@/features/TongQuanQL1";

/*
  Báo cáo nợ của phòng QL1: BỐN mục của tài liệu QL1, không phải một danh sách
  nợ chung.

  Bản trước dựng màn này thành một bảng "Danh sách cần xử lý" sáu cột. Nó không
  sai về mặt dữ liệu, nhưng nó trả lời sai câu hỏi: QL1 không ngồi xử lý từng
  hồ sơ trên màn này, họ LẬP BÁO CÁO KỲ cho bốn mục và nộp lên trưởng phòng.
  Vì thế mỗi mục ở đây có hai tầng — bảng tổng hợp theo đơn vị để đọc, rồi danh
  sách chi tiết để đối chiếu và kết xuất — chứ không phải một hàng đợi.

  Mọi số trong màn là số GIẢ sinh từ hạt giống cố định; xem đầu `data/ql1.ts`.
*/

const MOI_TRANG = 10;

/*
  Bảy tab, phủ đủ mười một tab của §4.2 bản thiết kế.

  Bản thiết kế tách bảng tổng hợp và danh sách chi tiết của cùng một nghiệp vụ
  thành hai tab (1 và 2, 3 và 5, 4 và 6, 7 và 8). Ở đây mỗi cặp ấy nằm chung
  MỘT tab, tổng hợp trên và chi tiết dưới: người dùng đọc số tổng rồi muốn
  biết nó gồm những ai — tách sang tab khác là bắt họ nhớ số rồi đi tìm, và
  đánh mất đúng mối liên hệ mà họ đang theo.

  Ba tab còn lại không ghép được vào đâu nên đứng riêng: Tổng quan (§4.3),
  Quy tắc & nguồn (tab 9) và Dữ liệu gốc (§4.4).
*/
const rutGon = (ten: string) => ten
  .replace(/^Phòng Quản lý,\s*Hỗ trợ doanh nghiệp số\s*/i, "Phòng QLHT DN ")
  .replace(/^Phòng Quản lý các khoản thu từ đất$/i, "Phòng QL thu từ đất")
  .replace(/^Phòng Thuế cá nhân, hộ kinh doanh và thu khác$/i, "Phòng Thuế cá nhân – HKD");

/*
  Chỉ cột đơn vị khai bề rộng; các cột số CHIA ĐỀU phần còn lại.

  Khai px cho mọi cột làm bảng rộng 1.292px ở mục Tình hình nợ — rộng hơn khung
  làm việc, nên phải cuộn ngang mới đọc hết một hàng, trong khi chỗ trống thì
  vẫn còn. Để các cột số không khai bề rộng thì chúng nở vừa khít khung, và
  khung vẫn đứng yên qua mọi trang vì số cột chỉ phụ thuộc MỤC đang mở, không
  phụ thuộc dữ liệu — đúng điều kiện mà luật khung cố định cần.

  `RONG_O_TOI_THIEU` là sàn, đo theo chuỗi dài nhất thật sự xuất hiện —
  "1.121.644,5" ở dòng tổng toàn ngành. Dưới sàn ấy thì số bị cắt mất đuôi,
  và một con số cụt nguy hiểm hơn một bảng phải cuộn.
*/
const RONG_STT = 46;
const RONG_DV = 204;
const RONG_O_TOI_THIEU = 118;

/* Tỷ lệ theo BC-10 của FRS: hai chữ số thập phân, mẫu số bằng 0 thì để trống.
   Dùng chung `hienTyLe` để bốn màn không mỗi màn một cách làm tròn. */
const pt = (x: number) => hienTyLe(Number.isFinite(x) ? x : null);

/* ---------- mô tả cột ---------- */

/** Một nhóm cột của bảng tổng hợp: một ô gộp ở dòng tiêu đề trên, n cột dưới. */
interface NhomCot<O> { nhan: string; cot: { nhan: string; o: (t: O) => ReactNode }[] }

interface CotDs { khoa: keyof HangQL1; nhan: string; kieu?: "tien" | "ma" | "ghi" }

/*
  Bề rộng từng cột, đơn vị px, khai theo TÊN CỘT chứ không theo vị trí.

  Toàn hệ dùng `table-layout: fixed` để khung bảng đứng yên qua mọi trang —
  `auto` tính bề rộng theo nội dung của riêng trang đang xem, nên sang trang là
  cột nhảy. Nhưng `fixed` mà không khai bề rộng thì mọi cột chia đều, và mười
  ba cột chia đều nghĩa là cột tên đè lên cột bên cạnh.

  Bốn mục có số cột khác nhau, nên khai bằng CSS `nth-child` sẽ phải viết bốn
  bộ và sửa cả bốn mỗi lần đổi một cột. Khai ở đây rồi dựng `<colgroup>` thì
  bề rộng đi theo đúng cột, dù mục nào bật.
*/
const RONG: Partial<Record<keyof HangQL1, number>> = {
  mst: 120, ten: 232, donVi: 212, maCQT: 96, chuong: 84, loaiNNT: 196, nhomXuLy: 190,
  noNgay: 150, noDauNam: 140, noThang: 150, noDanhGia: 160, tongDanhGia: 148, nguong: 142,
  tinhTrang: 164, bienPhap: 212, soQuyetDinh: 140, ngayThucHien: 124, ketLuan: 204, ghiChu: 196,
};
const rongCot = (c: CotDs) => RONG[c.khoa] ?? 140;

interface CauHinhTab {
  id: TabQL1;
  nhan: string;
  tieuDeDs: string;
  /** Cột nào của danh sách chi tiết được dựng thành ô lọc. */
  locUngVien: { khoa: keyof HangQL1; nhan: string }[];
  /*
    Điều kiện vào danh sách, khi tiêu đề của mục có nêu một điều kiện cụ thể.

    Tiêu đề "tăng nợ từ 500 triệu đồng" là một LỜI HỨA về nội dung bảng. Để
    tiêu đề nói một đằng và bảng hiện một nẻo là lỗi nặng hơn mọi lỗi bố cục
    trên màn này: người đọc không có cách nào biết mình đang nhìn tập nào.
  */
  cotDs: CotDs[];
}

const TIEN = (v: number) => <span className="num">{money(v)}</span>;

export type DangSo = "abs" | "rel";

/*
  Tăng giảm vẽ bằng mũi tên + màu, không chỉ bằng dấu âm: cột này được quét
  theo chiều dọc để tìm đơn vị đang xấu đi, và mắt bắt hình nhanh hơn bắt dấu.

  Kỳ gốc bằng 0 thì phần trăm không tính được. Mẫu Excel để ô trống ở đó, còn
  một chỗ khác trong chính file ấy lại ghi -1 (tức -100%) — con số đó sai, vì
  từ 0 không giảm đi đâu được. Bản demo ghi "—" và nói rõ lý do qua title.
*/
function TangGiam({ nay, truoc, dang }: { nay: number; truoc: number; dang: DangSo }) {
  const d = Math.round((nay - truoc) * 10) / 10;
  if (d === 0) return <span className="num">0</span>;
  if (dang === "rel" && truoc === 0) return <span className="num cell-empty" title="Kỳ gốc bằng 0 nên không tính được số tương đối">—</span>;
  const hien = dang === "abs"
    ? money(Math.abs(d))
    : `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(Math.abs(d / truoc) * 100)}%`;
  return <span className={`num delta ${d > 0 ? "is-up" : "is-down"}`}>{d > 0 ? "▲" : "▼"} {hien}</span>;
}

function TyLe({ x }: { x: number }) {
  const w = Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0)) * 100;
  return <span className="ty-le"><b>{pt(x)}</b><i><span style={{ width: `${w}%` }}/></i></span>;
}

/*
  ── Thứ tự cột của danh sách chi tiết ───────────────────────────────────────

  Bốn mục dùng CHUNG một thứ tự cho phần giống nhau, phần khác nhau đẩy sang
  phải. Bố cục là bốn khối, luôn theo đúng thứ tự này:

    1. Định danh   mst · ten · donVi · maCQT · loaiNNT · chuong
    2. Tiền        các cột số của riêng mục
    3. Xử lý       tình trạng và những gì đi kèm nó
    4. Chữ tự do   kết luận · ghi chú

  Vì sao phải đặt luật: ba sheet Excel gốc tự chúng đã xếp khác nhau. Sheet
  cưỡng chế để "Phòng/TCS" ở cột 5, sheet trạng thái 06 để nó ở cột 10 dưới
  tên "Map Phòng/Thuế cơ sở". Bê nguyên từng sheet lên màn thì người dùng đổi
  mục là phải dò lại từ đầu xem cột đơn vị nằm đâu — mà đổi mục là thao tác họ
  làm liên tục.

  Điều này KHÔNG trái G4 ("giữ đúng tên chỉ tiêu nguyên văn"): tên cột giữ
  nguyên, chỉ thứ tự trên màn là thống nhất. Bản kết xuất Excel vẫn dựng đúng
  thứ tự của từng mẫu sheet — xem `domain/reportExport.ts`.

  Một chỗ tên bị đổi có chủ ý: cột mã cơ quan thuế. Sheet cưỡng chế gọi "CQT",
  sheet trạng thái 06 gọi "Cơ quan thuế" — hai tên cho cùng một thứ. Màn hình
  chọn một tên, "Mã CQT", vì ô chứa một mã bốn chữ số.
*/

/** Khối định danh — giống hệt nhau ở mọi mục, nên nó đứng đầu và không đổi. */
const COT_DINH_DANH: CotDs[] = [
  { khoa: "mst", nhan: "MST", kieu: "ma" },
  { khoa: "ten", nhan: "Tên NNT" },
  { khoa: "donVi", nhan: "Phòng / Thuế cơ sở" },
  { khoa: "maCQT", nhan: "Mã CQT", kieu: "ma" },
  { khoa: "loaiNNT", nhan: "Loại NNT" },
];

/** Chương chỉ có ở ba mục; nó đứng cuối khối định danh để năm cột đầu luôn khớp. */
const COT_CHUONG: CotDs = { khoa: "chuong", nhan: "Chương" };

/** Khối chữ tự do luôn ở cuối cùng, vì nó dài và không ai căn thẳng nó. */
const COT_CHU: CotDs[] = [
  { khoa: "ketLuan", nhan: "Kết luận" },
  { khoa: "ghiChu", nhan: "Ghi chú", kieu: "ghi" },
];

const CAU_HINH: CauHinhTab[] = [
  {
    id: "no", nhan: "So sánh nợ",
    /* Cả tiêu đề lẫn điều kiện đọc CÙNG một con số từ bảng tham số. Gõ "500
       triệu" vào tiêu đề rồi lọc bằng một hằng khác là cách tiêu đề bắt đầu
       nói dối mà không ai phát hiện. */
    tieuDeDs: `Doanh nghiệp, tổ chức tăng nợ có khả năng thu từ ${money(trieu(NGUONG.tangNoKNT))} triệu đồng`,
    locUngVien: [{ khoa: "maCQT", nhan: "Mã CQT" }, { khoa: "loaiNNT", nhan: "Loại NNT" }],
    cotDs: [
      ...COT_DINH_DANH,
      { khoa: "noNgay", nhan: "Nợ KNT ngày báo cáo", kieu: "tien" },
      { khoa: "noDauNam", nhan: "Nợ KNT đầu năm", kieu: "tien" },
    ],
  },
  {
    id: "cc", nhan: "Kết quả cưỡng chế",
    tieuDeDs: "Danh sách NNT chưa cưỡng chế",
    locUngVien: [{ khoa: "maCQT", nhan: "Mã CQT" }, { khoa: "chuong", nhan: "Chương" }, { khoa: "tinhTrang", nhan: "Tình trạng" }],
    cotDs: [
      ...COT_DINH_DANH, COT_CHUONG,
      { khoa: "noThang", nhan: "Nợ >90 ngày – nợ tháng", kieu: "tien" },
      { khoa: "noNgay", nhan: "Nợ >90 ngày – nợ ngày", kieu: "tien" },
      { khoa: "tongDanhGia", nhan: "Tổng nợ đánh giá", kieu: "tien" },
      { khoa: "tinhTrang", nhan: "Tình trạng cưỡng chế" },
      { khoa: "bienPhap", nhan: "Biện pháp hiệu lực" },
      { khoa: "soQuyetDinh", nhan: "Số quyết định", kieu: "ma" },
      ...COT_CHU,
    ],
  },
  {
    id: "th", nhan: "Tạm hoãn xuất cảnh",
    tieuDeDs: "Danh sách NNT trên ngưỡng chưa tạm hoãn xuất cảnh",
    locUngVien: [{ khoa: "maCQT", nhan: "Mã CQT" }, { khoa: "chuong", nhan: "Chương" }, { khoa: "tinhTrang", nhan: "Tình trạng" }],
    cotDs: [
      ...COT_DINH_DANH, COT_CHUONG,
      { khoa: "noThang", nhan: "Nợ >120 ngày – nợ tháng", kieu: "tien" },
      { khoa: "noNgay", nhan: "Nợ >120 ngày – nợ ngày", kieu: "tien" },
      { khoa: "tongDanhGia", nhan: "Tổng nợ đánh giá", kieu: "tien" },
      /* Ngưỡng là cột riêng của mục này, nên nó nằm SAU ba cột tiền dùng chung
         với mục cưỡng chế — đúng luật "phần khác nhau đẩy sang phải". */
      { khoa: "nguong", nhan: "Ngưỡng theo loại NNT", kieu: "tien" },
      { khoa: "tinhTrang", nhan: "Tình trạng tạm hoãn" },
      { khoa: "ngayThucHien", nhan: "Ngày tạm hoãn" },
      ...COT_CHU,
    ],
  },
  {
    id: "t06", nhan: "Tạm hoãn XC · trạng thái 06",
    tieuDeDs: "Danh sách NNT trạng thái 06 chưa tạm hoãn xuất cảnh",
    locUngVien: [{ khoa: "maCQT", nhan: "Mã CQT" }, { khoa: "nhomXuLy", nhan: "Nhóm xử lý" }, { khoa: "chuong", nhan: "Chương" }],
    cotDs: [
      ...COT_DINH_DANH, COT_CHUONG,
      { khoa: "noDanhGia", nhan: "Tổng nợ KCHĐ theo MST", kieu: "tien" },
      { khoa: "nhomXuLy", nhan: "Nhóm xử lý" },
      { khoa: "tinhTrang", nhan: "Tình trạng tạm hoãn" },
      { khoa: "ngayThucHien", nhan: "Ngày tạm hoãn" },
    ],
  },
];

/* ---------- nhóm cột của bảng tổng hợp, theo từng mục ---------- */

const CHI_TIEU = [["B", "Tổng cộng (B)"], ["C", "Nợ KNT (C)"], ["D", "Khó thu (D)"], ["E", "Đang xử lý (E)"]] as const;

/*
  Mẫu Excel có 28 cột số: 4 cột hiện trạng cộng ba nhóm "tăng giảm so với"
  (đầu năm, tháng trước, tuần trước), mỗi nhóm chia số tuyệt đối và số tương
  đối. 28 cột không vừa một màn và cũng không đáng vừa: người đọc so với MỘT
  mốc tại một thời điểm, rồi mới đổi mốc.

  Nên màn hình dựng 8 cột — hiện trạng cộng mốc đang chọn — và hai control
  ngay trên bảng quyết định đang xem mốc nào, dạng nào. Bản kết xuất Excel vẫn
  dựng đủ 28 cột.
*/
const COT_NO = (ngay: string, moc: MocSoSanh, dang: DangSo): NhomCot<OTongHopNo>[] => [
  { nhan: `Nợ đến ngày báo cáo (${ngay}) · triệu đồng`, cot: CHI_TIEU.map(([k, l]) => ({ nhan: l, o: (t: OTongHopNo) => TIEN(t.cur[k]) })) },
  {
    nhan: `Tăng giảm so với ${NHAN_MOC[moc]} · ${dang === "abs" ? "số tiền, triệu đồng" : "phần trăm"}`,
    cot: CHI_TIEU.map(([k, l]) => ({ nhan: l, o: (t: OTongHopNo) => <TangGiam nay={t.cur[k]} truoc={(t[moc] as BoNo)[k]} dang={dang}/> })),
  },
];

const COT_XU_LY = (tab: "cc" | "th"): NhomCot<OTongHopXuLy>[] => {
  const w = tab === "cc"
    ? ["Phải cưỡng chế", "Đã cưỡng chế", "Chưa thực hiện cưỡng chế", "Tỷ lệ đã cưỡng chế"]
    : ["Phải tạm hoãn XC", "Đã tạm hoãn XC", "Chưa tạm hoãn", "Tỷ lệ đã tạm hoãn"];
  const cap = (n: "phai" | "da" | "chua") => [
    { nhan: "NNT", o: (t: OTongHopXuLy) => <span className="num">{integer(t[`${n}N`])}</span> },
    { nhan: "Số tiền (tr.đ)", o: (t: OTongHopXuLy) => TIEN(t[`${n}T`]) },
  ];
  return [
    { nhan: w[0], cot: cap("phai") },
    { nhan: w[1], cot: cap("da") },
    { nhan: w[2], cot: cap("chua") },
    { nhan: w[3], cot: [{ nhan: "theo số tiền", o: (t) => <TyLe x={t.daT / t.phaiT}/> }] },
  ];
};

const COT_06: NhomCot<OTongHop06>[] = [
  { nhan: "NNT trạng thái 06", cot: [{ nhan: "NNT", o: (t) => <span className="num">{integer(t.nnt06)}</span> }] },
  { nhan: "Tổng nợ KCHĐ · triệu đồng", cot: [{ nhan: "Số tiền", o: (t) => TIEN(t.tongNo) }] },
  { nhan: "Đã tạm hoãn", cot: [{ nhan: "NNT", o: (t) => <span className="num">{integer(t.daN)}</span> }, { nhan: "Số tiền", o: (t) => TIEN(t.daT) }] },
  { nhan: "Chưa tạm hoãn", cot: [{ nhan: "NNT", o: (t) => <span className="num">{integer(t.chuaN)}</span> }, { nhan: "Số tiền", o: (t) => TIEN(t.chuaT) }] },
  { nhan: "Tỷ lệ tạm hoãn", cot: [{ nhan: "theo số tiền", o: (t) => <TyLe x={t.daT / t.tongNo}/> }] },
];

/* Cộng hai ô tổng hợp cùng kiểu. Dòng tổng và dòng khối đều dựng bằng hàm này
   thay vì sinh riêng, nên tổng LUÔN bằng tổng các dòng đang hiện — không có
   đường nào để hai con số rời nhau. */
function cong<O extends object>(bo: O[]): O {
  const ra = {} as Record<string, unknown>;
  for (const o of bo) {
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "number") ra[k] = Math.round((((ra[k] as number) ?? 0) + v) * 10) / 10;
      else if (v && typeof v === "object") {
        const cu = (ra[k] ?? {}) as Record<string, number>;
        for (const [k2, v2] of Object.entries(v as Record<string, number>)) cu[k2] = Math.round(((cu[k2] ?? 0) + v2) * 10) / 10;
        ra[k] = cu;
      }
    }
  }
  return ra as O;
}

/* ---------- màn ---------- */

export function DebtQL1({ actor }: { actor: string }) {
  const notify = useAction();
  const { layBanGhi } = useDuyet();
  const { chon, datDonVi } = useBoLoc();
  const { activeSection: tab, setActiveSection: setTab } = useQL1Navigation();
  const [moc, setMoc] = useState<MocSoSanh>("tuanTruoc");
  const [dang, setDang] = useState<DangSo>("abs");
  const [search, setSearch] = useState("");
  const [loc, setLoc] = useState<Partial<Record<keyof HangQL1, string>>>({});
  const [trang, setTrang] = useState(1);

  const cau = CAU_HINH.find((c) => c.id === tab) ?? CAU_HINH[0];
  /* Ba tab phụ không có bảng tổng hợp theo đơn vị nên chúng đi đường riêng;
     `cau` chỉ dùng cho bốn mục nghiệp vụ. */
  const laNghiepVu = CAU_HINH.some((c) => c.id === tab);
  /* Thu hẹp kiểu một lần ở đây thay vì ép kiểu rải rác: mọi phép tính của bốn
     mục nghiệp vụ đều cần một `TabQL1` thật, còn ba tab phụ không chạm tới
     chúng. Khi đang ở tab phụ, giá trị này chỉ là chỗ dựa để hook không đổi
     số lần gọi giữa các lần dựng. */
  const tabNV: TabQL1 = laNghiepVu ? (tab as TabQL1) : "no";
  const ky = KY_THEO_ID[chon.ky] ?? KY_QL1[0];
  const dsDonVi = useMemo(() => donViCuaTab(tabNV), [tabNV]);

  /* Đổi mục thì bộ lọc của mục cũ không còn nghĩa; đổi kỳ hay đơn vị thì nó
     vẫn đúng, nên hai thứ đó chỉ đưa về trang 1. */
  useEffect(() => { setLoc({}); setSearch(""); }, [tab]);
  /* Kỳ tháng mà vẫn so với "tuần trước" là một câu vô nghĩa, nên đổi loại kỳ
     thì mốc nhảy về mốc gần nhất CÓ nghĩa của loại ấy. */
  useEffect(() => { setMoc(ky.loai === "THANG" ? "thangTruoc" : "tuanTruoc"); }, [ky.loai]);
  useEffect(() => { setTrang(1); }, [tab, search, loc, chon]);

  /* ----- bảng tổng hợp ----- */
  const oCua = useMemo(() => {
    const lay = tongHopCuaTab[tabNV] as (hat: number, dv: DonViQL1) => object;
    return new Map(dsDonVi.map((dv) => [dv.id, lay(ky.hat, dv)]));
  }, [tabNV, ky, dsDonVi]);

  const dangChon = chon.donVi.length ? new Set(chon.donVi) : null;
  const trongPhamVi = dsDonVi.filter((dv) => !dangChon || dangChon.has(dv.ten));

  const nhomCot = (tabNV === "no" ? COT_NO(ky.ngayChot, moc, dang)
    : tabNV === "t06" ? COT_06
    : COT_XU_LY(tabNV)) as NhomCot<object>[];
  const cotPhang = nhomCot.flatMap((n) => n.cot);

  const khoi = (g: "VP" | "TCS") => trongPhamVi.filter((dv) => dv.nhom === g);
  const oKhoi = (g: "VP" | "TCS") => cong(khoi(g).map((dv) => oCua.get(dv.id)!));

  /* ----- danh sách chi tiết ----- */
  const toanBo = useMemo(() => {
    const ds = danhSachQL1(ky.hat, tabNV);
    return ds.filter(r => inReportList(tabNV, r));
  }, [ky, tabNV, cau]);
  const locDay = useMemo(() => theoDonVi(toanBo, chon, (r) => r.donVi).filter((r) => {
    if (!`${r.ten} ${r.mst} ${r.donVi}`.toLowerCase().includes(search.toLowerCase())) return false;
    return Object.entries(loc).every(([khoa, v]) => !v || String(r[khoa as keyof HangQL1]) === v);
  }), [toanBo, chon, search, loc]);

  /*
    Ô chọn chỉ dựng cho cột CÓ TỪ HAI giá trị trở lên trong chính tập đang xem.
    Một ô lọc một lựa chọn là control bấm vào không đổi được gì — luật này đã
    áp cho bảng nợ dữ liệu thật, và nó đúng y như vậy ở đây.
  */
  const locDungDuoc = useMemo(() => cau.locUngVien.map((u) => ({
    ...u,
    giaTri: [...new Set(theoDonVi(toanBo, chon, (r) => r.donVi).map((r) => String(r[u.khoa])))]
      .sort((a, b) => a.localeCompare(b, "vi", { numeric: true })),
  })).filter((u) => u.giaTri.length >= 2), [cau, toanBo, chon]);

  const soTrang = Math.max(1, Math.ceil(locDay.length / MOI_TRANG));
  const trangHienTai = Math.min(trang, soTrang);
  const rows = locDay.slice((trangHienTai - 1) * MOI_TRANG, (trangHienTai - 1) * MOI_TRANG + MOI_TRANG);
  const coLoc = search !== "" || Object.values(loc).some(Boolean);

  const oDs = (row: HangQL1, c: CotDs) => {
    const v = row[c.khoa];
    if (c.kieu === "tien") return <span className="num">{money(v as number)}</span>;
    if (c.kieu === "ma") return <code>{v}</code>;
    if (c.khoa === "donVi") return rutGon(String(v));
    if (c.kieu === "ghi") return v === "—" ? <span className="cell-empty">—</span> : <small className="quality-note">{v}</small>;
    if (c.khoa === "tinhTrang") return <Badge tone={String(v).startsWith("Đã") ? "positive" : String(v).startsWith("Chưa") ? "warning" : "info"}>{v}</Badge>;
    return String(v);
  };

  /* G3: bấm tên một đơn vị trên bảng tổng hợp là lọc cả màn về đơn vị đó —
     cùng một thao tác với việc chọn nó trong thanh lọc, nên không sinh ra một
     trạng thái lọc thứ hai chạy song song. */
  const chonDonVi = (dv: DonViQL1) => {
    datDonVi([dv.ten]);
    notify(`Đã lọc cả báo cáo về ${rutGon(dv.ten)}. Bấm Đặt lại ở thanh đầu trang để xem lại toàn ngành.`);
  };

  const hangDonVi = (dv: DonViQL1) => <tr key={dv.id}>
    <td className="stt-o">{dv.stt}</td>
    <th scope="row"><button type="button" className="dv-nut" onClick={() => chonDonVi(dv)}>
      <span>{rutGon(dv.ten)}</span><small>{dv.ma}</small>
    </button></th>
    {cotPhang.map((c, i) => <td key={i} className="num">{c.o(oCua.get(dv.id)!)}</td>)}
  </tr>;

  /* Dòng tổng và dòng khối KHÔNG có số thứ tự: mẫu Excel đánh STT cho đơn vị,
     còn dòng cộng là phép tính trên chúng, không phải một đơn vị thứ 33. */
  const hangGop = (nhan: string, o: object, lop: string) => <tr className={lop}>
    <td className="stt-o"/>
    <th scope="row"><span>{nhan}</span></th>
    {cotPhang.map((c, i) => <td key={i} className="num">{c.o(o)}</td>)}
  </tr>;

  const reportMeta: ReportMeta = { period: ky.nhan, scope: chon.donVi.join("; ") || "Toàn ngành", actor, status: layBanGhi(`QL1|${ky.id}`).trangThai };
  const filename = `QL1_${ky.id}_${reportMeta.status}_mo-phong`;
  return <div className="page-stack ql1-page">
    <PageIntro title="Báo cáo công tác nợ · Phòng QL1" actions={<>
      <ExportButton onExport={() => exportExcel(ql1Workbook(ky, chon.donVi), reportMeta, `${filename}.xlsx`)}>Xuất cả bộ báo cáo</ExportButton>
      <ExportButton onExport={() => exportWord(ql1Workbook(ky, chon.donVi), reportMeta, `${filename}.docx`)}>Xuất báo cáo Word</ExportButton>
    </>}/>

    <ThanhDuyet khoa={`QL1|${ky.id}`} nhanKy={`Báo cáo ${ky.nhan.toLowerCase()}`}/>

    {/* Thanh lọc đứng TRÊN cụm tab vì nó áp cho cả bốn mục. */}
    <BoLocChung
      kyCo={KY_QL1.map((k) => ({ id: k.id, nhan: k.nhan, loai: k.loai }))}
      donViCo={dsDonVi.map((d) => d.ten)}
      rutGon={rutGon}
    />

    {tab === "tongquan" && <TongQuanQL1 ky={ky} trongPhamVi={trongPhamVi}/>}

    {tab === "quytac" && <Panel title="Quy tắc và tham số" actions={<Button kind="quiet" onClick={() => setTab("nguon")}>Xem nguồn dữ liệu</Button>}>
      <TableWrap label="quy tắc và tham số đang áp dụng"><table className="rules-table">
        <thead><tr><th scope="col">Quy tắc</th><th scope="col">Giá trị</th><th scope="col">Phạm vi</th><th scope="col">Hiệu lực từ</th><th scope="col">Tài liệu tham chiếu</th><th scope="col">Trạng thái</th></tr></thead>
        <tbody>{ruleItems.filter((r) => r.scope === "Nợ và cưỡng chế" || r.scope === "Toàn ngành").map((r) => <tr key={r.id}>
          <td><strong>{r.name}</strong></td>
          <td>{r.value}</td>
          <td><small>{r.scope}</small></td>
          <td>{r.effectiveFrom ?? <em>Chưa xác nhận</em>}</td>
          <td>{r.document ? <small>{r.document}</small> : <Badge tone="critical">Thiếu căn cứ</Badge>}</td>
          <td><Badge tone={r.status === "ACTIVE" ? "positive" : r.status === "PENDING" ? "warning" : "critical"}>{r.status === "ACTIVE" ? "Đang áp dụng" : r.status === "PENDING" ? "Chờ xác nhận" : "Cần đối chiếu"}</Badge></td>
        </tr>)}</tbody>
      </table></TableWrap>
    </Panel>}

    {tab === "nguon" && <DuLieuGoc nguon={NGUON_QL1} ngayBaoCao={ky.ngayChot}/>}

    {laNghiepVu && <Panel
      title="Tổng hợp theo đơn vị"
      actions={<div className="inline-controls">
        <ExportButton onExport={() => exportExcel([ql1Summary(ky, chon.donVi, tabNV)], reportMeta, `${filename}_${tabNV}.xlsx`)}>Xuất Excel</ExportButton>
        {tab === "no" && <>
        <label className="compact-field"><span>So với kỳ</span>
          <select value={moc} onChange={(e) => setMoc(e.target.value as MocSoSanh)}>
            <option value="dauNam">Đầu năm</option>
            <option value="thangTruoc">Tháng trước</option>
            {ky.loai === "TUAN" && <option value="tuanTruoc">Tuần trước</option>}
          </select>
        </label>
        <div className="bo-loc-seg" role="group" aria-label="Cách hiện số tăng giảm">
          <button type="button" aria-pressed={dang === "abs"} onClick={() => setDang("abs")}>Số tiền</button>
          <button type="button" aria-pressed={dang === "rel"} onClick={() => setDang("rel")}>Phần trăm</button>
        </div>
        </>}
      </div>}
    >
      {trongPhamVi.length === 0
        ? <div className="empty-state"><strong>Không có đơn vị nào trong phạm vi lọc</strong></div>
        : <TableWrap label={`tổng hợp ${cau.nhan.toLowerCase()} theo đơn vị`}><table
            className="ql1-table co-stt"
            style={{ minWidth: RONG_STT + RONG_DV + cotPhang.length * RONG_O_TOI_THIEU }}
          >
            <colgroup><col style={{ width: RONG_STT }}/><col style={{ width: RONG_DV }}/>{cotPhang.map((_, i) => <col key={i}/>)}</colgroup>
            {/*
              Hai dòng tiêu đề, ô gộp ở dòng trên. Cột đơn vị `rowSpan={2}` và
              dính trái khi cuộn ngang — mục G5: bảng rộng tới mười mấy cột thì
              không có cột đơn vị trong tầm mắt là đọc một hàng số vô danh.
            */}
            <thead>
              <tr>
                <th scope="col" rowSpan={2} className="stt-cot">STT</th>
                <th scope="col" rowSpan={2} className="dv-cot">Phòng / Thuế cơ sở</th>
                {nhomCot.map((n) => <th key={n.nhan} scope="colgroup" colSpan={n.cot.length} className="nhom">{n.nhan}</th>)}
              </tr>
              <tr>{nhomCot.flatMap((n) => n.cot.map((c) => <th key={`${n.nhan}-${c.nhan}`} scope="col" className="num">{c.nhan}</th>))}</tr>
            </thead>
            <tbody>
              {hangGop("Tổng cộng", cong(trongPhamVi.map((dv) => oCua.get(dv.id)!)), "is-tong")}
              {khoi("VP").length > 0 && <>
                {hangGop("I. Khối Văn phòng Thuế TP Hà Nội", oKhoi("VP"), "is-khoi")}
                {khoi("VP").map(hangDonVi)}
              </>}
              {khoi("TCS").length > 0 && <>
                {hangGop("II. Khối Thuế cơ sở", oKhoi("TCS"), "is-khoi")}
                {khoi("TCS").map(hangDonVi)}
              </>}
            </tbody>
          </table></TableWrap>}
    </Panel>}

    {laNghiepVu && <Panel
      title={cau.tieuDeDs}
      actions={<div className="inline-controls">
        <SearchField value={search} onChange={setSearch} placeholder="Tìm MST, tên hoặc đơn vị"/>
        {locDungDuoc.map((u) => <label className="compact-field" key={String(u.khoa)}><span>{u.nhan}</span>
          <select value={loc[u.khoa] ?? ""} onChange={(e) => setLoc((t) => ({ ...t, [u.khoa]: e.target.value }))}>
            <option value="">Tất cả</option>
            {u.giaTri.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>)}
        {coLoc && <Button kind="quiet" onClick={() => { setLoc({}); setSearch(""); }}>Đặt lại</Button>}
      </div>}
    >
      <TableWrap label={cau.tieuDeDs}><table className="ql1-ds-table" style={{ minWidth: cau.cotDs.reduce((t, c) => t + rongCot(c), 0) }}>
        <colgroup>{cau.cotDs.map((c) => <col key={c.khoa} style={{ width: rongCot(c) }}/>)}</colgroup>
        <thead><tr>{cau.cotDs.map((c) => <th key={c.khoa} scope="col" className={c.kieu === "tien" ? "num" : undefined}>{c.nhan}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => <tr key={row.id}>{cau.cotDs.map((c) => <td key={c.khoa} className={c.kieu === "tien" ? "num" : undefined}>{oDs(row, c)}</td>)}</tr>)}
          {locDay.length === 0 && <tr><td className="table-empty" colSpan={cau.cotDs.length}>Không có người nộp thuế nào khớp bộ lọc đang đặt.</td></tr>}
        </tbody>
      </table></TableWrap>
      <footer className="table-footer">
        <Pager trang={trangHienTai} soTrang={soTrang} onChange={setTrang}/>
        <ExportButton onExport={() => exportExcel([ql1Details(tabNV, locDay)], { ...reportMeta, scope: `${reportMeta.scope}; ${locDay.length} NNT phù hợp với bộ lọc` }, `${filename}_${tabNV}_danh-sach.xlsx`)}>Xuất danh sách đang lọc</ExportButton>
      </footer>
    </Panel>}
  </div>;
}

export { DON_VI_QL1 };
