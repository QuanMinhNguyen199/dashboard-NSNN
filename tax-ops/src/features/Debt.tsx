import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge, Button, DetailGrid, Kpi, KpiStrip, PageIntro, Panel, SearchField, TableWrap, integer, money } from "@/components/ui";
import { CaseLayout, useCaseSelection } from "@/components/CaseLayout";
import { debtRows } from "@/data/mock";
import { napChuaCuongChe, timDonVi, type HangChuaCuongChe } from "@/data/duLieuThat";
import { useDuLieuThat } from "@/state/DuLieuThatContext";
import type { Tone, ViewId } from "@/domain/types";
import { useAction } from "@/state/ActionContext";

const actionText = { MONITOR: "Theo dõi", ENFORCE: "Đủ điều kiện cưỡng chế", EXIT_SUSPENSION: "Rà tạm hoãn xuất cảnh", REVIEW: "Cần phân loại" } as const;
const actionTone: Record<keyof typeof actionText, Tone> = { MONITOR: "neutral", ENFORCE: "warning", EXIT_SUSPENSION: "critical", REVIEW: "info" };

/** Phân tuổi nợ theo quy tắc đã chốt: 1-30, 31-60, 61-90, trên 90 ngày. */
const bacTuoi = (ngay: number) => ngay <= 30 ? "1–30 ngày" : ngay <= 60 ? "31–60 ngày" : ngay <= 90 ? "61–90 ngày" : "Trên 90 ngày";

/*
  Hai nguồn, MỘT khuôn hàng.

  Bảng này phải dựng được từ bộ mô phỏng lẫn bộ dữ liệu thật, và hai bộ có cột
  khác nhau: bộ mô phỏng có tuổi nợ và cán bộ quản lý, bộ thật không có nhưng
  lại có ngưỡng, biện pháp cưỡng chế và kết luận. Rẽ nhánh ở chỗ DỰNG giao diện
  thì một màn thành hai màn phải nuôi song song. Rẽ ở chỗ ĐỌC dữ liệu thì chỉ
  còn một đường dựng.
*/
interface HangNo {
  id: string;
  ten: string;
  ma: string;
  donVi: string;
  donViPhu: string;
  soChinh: ReactNode;
  soPhu: ReactNode;
  nhan: string;
  tone: Tone;
  timTheo: string;
  chiTiet: { label: string; value: ReactNode }[];
}

/*
  Tên đơn vị trong bộ thật dài tới 40 ký tự ("Phòng Quản lý, Hỗ trợ doanh nghiệp
  số 1"). Để nguyên thì cột đơn vị nuốt mất bề ngang của cột tên doanh nghiệp,
  tên bị đẩy xuống ba dòng và chiều cao hàng lệch tới 26px. Tên đầy đủ vẫn nằm
  nguyên trong khối chi tiết, nên đây là rút gọn hiển thị chứ không mất dữ liệu.
*/
const rutGonDonVi = (ten: string) => ten
  .replace(/^Phòng Quản lý,\s*Hỗ trợ doanh nghiệp số\s*/i, "Phòng QLHT DN ")
  .replace(/^Phòng Quản lý các khoản thu từ đất$/i, "Phòng QL thu từ đất");

/** Đồng sang tỷ đồng. Bộ thật ghi bằng đồng, bộ mô phỏng ghi sẵn bằng tỷ. */
const tyDong = (d: number | null) => d === null ? "—" : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(d / 1e9);

const toneKetLuan = (ketLuan: string | null): Tone =>
  !ketLuan ? "neutral" : /chưa/i.test(ketLuan) ? "critical" : /đã/i.test(ketLuan) ? "positive" : "warning";

function tuBoThat(r: HangChuaCuongChe, i: number): HangNo {
  return {
    id: `${r.mst ?? "x"}-${i}`,
    ten: r.ten ?? "Không có tên",
    ma: r.mst ?? "—",
    donVi: r.donVi ? rutGonDonVi(r.donVi) : "—",
    donViPhu: r.loaiNNT ?? "",
    soChinh: <><strong>{tyDong(r.tongNoDanhGia)}</strong><small>tỷ đồng</small></>,
    soPhu: <><strong>{tyDong(r.noNgay)}</strong><small>&gt; 90 ngày</small></>,
    nhan: r.ketLuan ?? "Chưa phân loại",
    tone: toneKetLuan(r.ketLuan),
    timTheo: `${r.ten ?? ""} ${r.mst ?? ""} ${r.donVi ?? ""}`.toLowerCase(),
    chiTiet: [
      { label: "Mã số thuế", value: <code>{r.mst ?? "—"}</code> },
      { label: "Đơn vị quản lý", value: r.donVi ?? "—" },
      { label: "Loại người nộp thuế", value: <>{r.loaiNNT ?? "—"} {r.chuong !== null && <small>chương {r.chuong}</small>}</> },
      { label: "Nợ theo tháng", value: <>{tyDong(r.noThang)} <small>tỷ đồng</small></> },
      { label: "Nợ dùng đánh giá", value: <>{tyDong(r.noDanhGia)} <small>tỷ đồng</small></> },
      { label: "Ngưỡng cưỡng chế", value: r.nguong === null ? "—" : <>{integer(r.nguong)} <small>đồng</small></> },
      { label: "Tình trạng cưỡng chế", value: r.tinhTrang ?? "—" },
      { label: "Biện pháp hiệu lực", value: r.bienPhap ?? <span className="cell-empty">Chưa có</span> },
    ],
  };
}

function tuBoMoPhong(r: (typeof debtRows)[number]): HangNo {
  return {
    id: r.id,
    ten: r.taxpayer,
    ma: r.maskedTaxId,
    donVi: r.unit,
    donViPhu: r.officer,
    soChinh: <><strong>{money(r.debt)}</strong><small>tỷ đồng</small></>,
    soPhu: <><strong>{r.age}</strong><small>ngày</small></>,
    nhan: actionText[r.action],
    tone: actionTone[r.action],
    timTheo: `${r.taxpayer} ${r.maskedTaxId} ${r.unit}`.toLowerCase(),
    chiTiet: [
      { label: "Số nợ", value: <>{money(r.debt)} <small>tỷ đồng</small></> },
      { label: "Tuổi nợ", value: <>{r.age} ngày <small>{bacTuoi(r.age)}</small></> },
      { label: "Đề xuất xử lý", value: <Badge tone={actionTone[r.action]}>{actionText[r.action]}</Badge> },
      { label: "Cán bộ quản lý", value: <>{r.officer} <small>{r.unit}</small></> },
    ],
  };
}

/*
  Bộ thật có 2.457 dòng. Dựng hết một lúc thì trình duyệt phải bố trí từng ấy ô
  cho một màn chỉ nhìn thấy vài chục hàng. Cắt ở 200 dòng nợ lớn nhất và nói rõ
  là đang cắt — im lặng cắt thì người dùng tưởng danh sách chỉ có thế.
*/
const TRAN_HANG = 200;

export function Debt({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const notify = useAction();
  const { that } = useDuLieuThat();
  const [search, setSearch] = useState("");
  const [donViLoc, setDonViLoc] = useState("ALL");
  const [boThat, setBoThat] = useState<HangChuaCuongChe[] | null>(null);

  useEffect(() => {
    if (!that) return;
    let con = true;
    napChuaCuongChe().then((d) => { if (con) setBoThat(d); });
    return () => { con = false; };
  }, [that]);

  const tatCa = useMemo<HangNo[]>(() => boThat
    ? [...boThat].sort((a, b) => (b.tongNoDanhGia ?? 0) - (a.tongNoDanhGia ?? 0)).map(tuBoThat)
    : debtRows.map(tuBoMoPhong), [boThat]);

  const danhSachDonVi = useMemo(
    () => [...new Set(tatCa.map((r) => r.donVi))].sort((a, b) => a.localeCompare(b, "vi")),
    [tatCa],
  );

  const locDay = useMemo(
    () => tatCa.filter((r) => r.timTheo.includes(search.toLowerCase()) && (donViLoc === "ALL" || r.donVi === donViLoc)),
    [tatCa, search, donViLoc],
  );
  const rows = locDay.slice(0, TRAN_HANG);

  const cases = useCaseSelection(rows[0]?.id ?? "");
  const hoSo = rows.find((row) => row.id === cases.selectedId) ?? rows[0];

  const toanNganh = that ? timDonVi(that.noTheoDonVi, "TỔNG TOÀN NGÀNH") : null;
  const ccTong = that?.cuongChe.find((c) => /tổng cộng/i.test(c.donVi)) ?? null;
  const thxcTong = that?.tamHoanXuatCanh.find((c) => /tổng cộng/i.test(c.donVi)) ?? null;

  /*
    Khối chi tiết không nhắc lại các trường đã hiện trên hàng đang chọn bên
    trái; xem The Row Already Said It Rule trong DESIGN.md.
  */
  const detail = hoSo && <Panel title={`Hồ sơ – ${hoSo.ten}`}>
    <DetailGrid items={hoSo.chiTiet}/>
    <div className="notice warning">
      <strong>Hệ thống chưa tự kết luận được cho hồ sơ này</strong>
      <span>Phân tuổi nợ đã có quy tắc hiệu lực, nhưng ngưỡng cưỡng chế và ngưỡng tạm hoãn xuất cảnh còn ghi khác nhau giữa các nguồn. Cần văn bản căn cứ và ngày hiệu lực trước khi cảnh báo được bật.</span>
      {/* Nút nằm cạnh chính cảnh báo mà nó trả lời. Để ở đầu khối thì đầu khối
          cao thấp khác nhau tuỳ bản ghi có hành động hay không. */}
      <Button kind="quiet" icon="file" onClick={() => onNavigate("rules")}>Xem quy tắc áp dụng</Button>
    </div>
  </Panel>;

  return <div className="page-stack">
    <PageIntro title="Nợ và cưỡng chế"/>

    <KpiStrip>
      {that && toanNganh ? <>
        <Kpi label="Tổng nợ toàn ngành" value={<>{money((toanNganh.hienTai.tongCong ?? 0) / 1000)} <em>tỷ đồng</em></>} note={`Đến ngày ${that.ngayBaoCao ?? "—"}`}/>
        <Kpi label="Nợ khả năng thu" value={<>{money((toanNganh.hienTai.noKNT ?? 0) / 1000)} <em>tỷ đồng</em></>} note={`Tăng ${money((toanNganh.soVoiDauNamPhanTram.noKNT ?? 0) * 100)}% so với đầu năm`} tone="warning"/>
        <Kpi label="Chưa cưỡng chế" value={integer(ccTong?.chuaNNT ?? 0)} note={`${money((ccTong?.chuaTien ?? 0) / 1e9)} tỷ đồng`} tone="warning"/>
        <Kpi label="Chưa tạm hoãn xuất cảnh" value={integer(thxcTong?.chuaNNT ?? 0)} note={`${money((thxcTong?.chuaTien ?? 0) / 1e9)} tỷ đồng`} tone="critical"/>
      </> : <>
        <Kpi label="Tổng số nợ trong phạm vi" value={<>{money(12_486)} <em>tỷ đồng</em></>} note="3.812 người nộp thuế"/>
        <Kpi label="Nợ trên 90 ngày" value="1.286" note="33,7% danh sách đang theo dõi" tone="warning"/>
        <Kpi label="Cần rà cưỡng chế" value="742" note="Trên 90 ngày và trên ngưỡng" tone="warning"/>
        <Kpi label="Cần rà tạm hoãn xuất cảnh" value="64" note="Chưa phải quyết định nghiệp vụ" tone="critical"/>
      </>}
    </KpiStrip>

    <CaseLayout label="Chi tiết hồ sơ nợ" detail={detail} mobileOpen={cases.mobileOpen} onClose={cases.close}>
      <Panel
        title="Danh sách cần xử lý"
        actions={<div className="inline-controls">
          <SearchField value={search} onChange={setSearch} placeholder="Tìm MST, tên hoặc đơn vị"/>
          <label className="compact-field"><span>Đơn vị</span>
            <select value={donViLoc} onChange={(event) => setDonViLoc(event.target.value)}>
              <option value="ALL">Tất cả</option>
              {danhSachDonVi.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>}
      >
        <TableWrap label="danh sách nợ cần xử lý"><table>
          <thead><tr>
            <th scope="col">Người nộp thuế</th>
            <th scope="col">Mã số thuế</th>
            <th scope="col">Đơn vị quản lý</th>
            <th scope="col" className="num">{that ? "Nợ đánh giá" : "Số nợ"}</th>
            <th scope="col" className="num">{that ? "Nợ quá hạn" : "Tuổi nợ"}</th>
            <th scope="col">{that ? "Kết luận" : "Đề xuất xử lý"}</th>
          </tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} onClick={(e) => cases.select(row.id, e)} className={row.id === hoSo?.id ? "is-selected" : undefined}>
            <td><button type="button" className="row-select" aria-pressed={row.id === hoSo?.id} onClick={(e) => { e.stopPropagation(); cases.select(row.id, e); }}><strong>{row.ten}</strong></button></td>
            <td><code>{row.ma}</code></td>
            <td><span>{row.donVi}</span><small>{row.donViPhu}</small></td>
            <td className="num">{row.soChinh}</td>
            <td className="num">{row.soPhu}</td>
            <td><Badge tone={row.tone}>{row.nhan}</Badge></td>
          </tr>)}</tbody>
        </table></TableWrap>
        <footer className="table-footer">
          <span>Hiển thị {integer(rows.length)}/{integer(locDay.length)} bản ghi{locDay.length > TRAN_HANG ? ` – cắt ở ${TRAN_HANG} dòng nợ lớn nhất, dùng ô tìm hoặc bộ lọc đơn vị để thu hẹp` : ""}</span>
          <Button kind="secondary" onClick={() => notify(`Có ${integer(locDay.length)} bản ghi đang lọc. Bản demo chưa hỗ trợ tải file.`)}>Xuất danh sách đang lọc</Button>
        </footer>
      </Panel>
    </CaseLayout>
  </div>;
}
