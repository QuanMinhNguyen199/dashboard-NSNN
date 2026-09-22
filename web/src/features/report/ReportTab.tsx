import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useReportGrid } from "@/data/hooks";
import { provider } from "@/data";
import { useDashboardState } from "@/state/DashboardState";
import {
  DIMENSIONS,
  DIMENSION_BY_ID,
  REPORT_TEMPLATES,
  gridMembersOf,
  templateNoOf,
  subDimensionsFor,
  type ReportDimension,
} from "@/domain/report";
import { toDisplayNumber } from "@/domain/money";
import { locationDimensionAvailable, locationDimensionNote } from "@/domain/periods";
import type { DashboardFilters, ReportCell, ReportGridData, ReportRow } from "@/domain/types";
import { Card, inScale, LiveNotice, moneyScale, ResourceView, NhanOnDinh } from "@/components/primitives";
import { ReportSummary } from "./ReportSummary";
import { ReportModePicker } from "./ReportModePicker";
import { xuatTheoMauNganh } from "./nsnnTemplateExport";
import reportTree from "@/domain/report-tree.json";
import { useNarrow } from "@/components/useNarrow";
import { revealSection } from "@/components/sectionNavigation";

const BudgetForecastView = lazy(() =>
  import("@/features/budget-forecast/BudgetForecastView").then((module) => ({ default: module.BudgetForecastView })),
);
const EnterpriseManagementView = lazy(() =>
  import("@/features/enterprise-management/EnterpriseManagementView").then((module) => ({ default: module.EnterpriseManagementView })),
);
const InspectionReportView = lazy(() =>
  import("@/features/inspection/InspectionReportView").then((module) => ({ default: module.InspectionReportView })),
);

/**
 * Màn hình Báo cáo: tám mẫu, hai ô chọn.
 *
 * Đây là trục của sản phẩm. Hàng luôn là cây 113 chỉ tiêu; cột là chiều được
 * chọn. Tám mẫu không phải tám màn hình mà là tám cặp chiều, nên giao diện chỉ
 * có hai ô chọn chứ không có tám mục menu.
 *
 * Đổi ô chọn là gọi lại dữ liệu với `groupBy` và `subGroupBy` khác, không phải
 * tính lại ở máy khách. Đặc tả yêu cầu đổi thứ tự hai chiều trên cùng tập dữ
 * liệu phải giữ nguyên tổng của mỗi hàng, và điều đó chỉ kiểm được khi cả hai
 * lần đều do máy chủ cộng.
 */
/**
 * Vỏ chung của bốn loại báo cáo.
 *
 * Nó sở hữu bộ chọn loại, đọc/ghi tham số `report` trong URL rồi render đúng
 * view. Ba mảng mở theo biên bản 18/09 là CHẾ ĐỘ ở đây, không phải tab cấp cao:
 * thanh điều hướng giữ đúng sáu tab, và người không dùng ba mảng đó không phải
 * quét thêm ba nhãn mỗi lần tìm đường.
 */
export function ReportTab() {
  const { reportMode, setReportMode } = useDashboardState();
  return (
    <div className="dstack dreport-workspace" data-report-mode={reportMode}>
      <div className="dreport-modebar">
        <ReportModePicker value={reportMode} onChange={setReportMode} />
      </div>

      <Suspense fallback={<div className="dloading" role="status">Đang mở báo cáo…</div>}>
        {reportMode === "nsnn" && <NsnnReportView />}
        {reportMode === "budget" && <BudgetForecastView />}
        {reportMode === "taxpayer" && <EnterpriseManagementView />}
        {reportMode === "inspection" && <InspectionReportView />}
      </Suspense>
    </div>
  );
}

function NsnnReportView() {
  const { filters } = useDashboardState();
  const narrow = useNarrow();
  const [groupBy, setGroupBy] = useState<ReportDimension>("location");
  const [subGroupBy, setSubGroupBy] = useState<ReportDimension | null>(null);
  const [offset, setOffset] = useState(0);
  /**
   * Thành viên của chiều NGOÀI đang xem, chỉ dùng cho báo cáo hai chiều.
   *
   * Báo cáo hai chiều sinh ra tích Descartes: 14 ngành × 29 cột cơ quan thuế
   * (28 cơ quan + cột chưa xác định) = 406 cột, còn địa bàn × cơ quan thuế lên
   * tới hơn ba nghìn. Lật từng trang tám cột qua
   * ngần ấy là không dùng được, và tệ hơn: một trang có thể cắt ngang hai nhóm,
   * nên người đọc thấy nửa cuối của ngành này nối liền nửa đầu của ngành kia mà
   * không có gì ngăn cách.
   *
   * Chọn một thành viên ở ngoài rồi chỉ hiện các cột bên trong nó thì mỗi lần
   * nhìn là một nhóm trọn vẹn, và số cột phải lật giảm từ 462 xuống 33.
   */
  const [outerId, setOuterId] = useState<string | null>(null);
  const [mobileSection, setMobileSection] = useState<"summary" | "table">("summary");
  const [mobileDimensionsOpen, setMobileDimensionsOpen] = useState(false);
  const openMobileTable = () => {
    setMobileSection("table");
    revealSection("nsnn-report-table-title");
  };

  /**
   * Chiều địa bàn khoá lại ở kỳ chưa có dữ liệu địa bàn.
   *
   * Khoá chứ không ẩn: ẩn một lựa chọn thì người dùng tưởng nó không tồn tại,
   * còn khoá kèm lý do thì họ biết phải đổi kỳ. Nếu đang chọn địa bàn mà đổi
   * sang kỳ không dùng được, tự chuyển sang cơ quan thuế và nói rõ đã chuyển.
   */
  const locationOk = locationDimensionAvailable(filters);
  const locationNote = locationDimensionNote(filters);
  const [switched, setSwitched] = useState(false);
  useEffect(() => {
    if (locationOk) {
      setSwitched(false);
      return;
    }
    if (groupBy === "location" || subGroupBy === "location") {
      if (groupBy === "location") setGroupBy("taxOffice");
      if (subGroupBy === "location") setSubGroupBy(null);
      setOffset(0);
      setSwitched(true);
    }
  }, [locationOk, groupBy, subGroupBy]);

  // Khổ hẹp không đủ chỗ cho nhiều cột, và ép vào thì bảng cuộn ngang vô tận.
  const limit = narrow ? 3 : 8;
  /**
   * Cửa sổ cột gửi cho provider.
   *
   * Cột lá xếp theo nhóm ngoài trước, nên cột của thành viên thứ `i` nằm gọn
   * trong đoạn `[i * soTrong, (i + 1) * soTrong)`. Không phải tải hết cột về
   * rồi lọc: cả hai danh sách thành viên đều lấy từ `gridMembersOf`, cùng một
   * nguồn với lớp dựng lưới.
   */
  const thanhVienNgoai = useMemo(
    () => (subGroupBy ? gridMembersOf(groupBy) : []),
    [groupBy, subGroupBy],
  );
  const soTrong = useMemo(
    () => (subGroupBy ? gridMembersOf(subGroupBy).length : 0),
    [subGroupBy],
  );
  useEffect(() => {
    // Đổi chiều thì thành viên cũ không còn nghĩa; quay về thành viên đầu tiên.
    setOuterId(thanhVienNgoai[0]?.id ?? null);
    setOffset(0);
  }, [thanhVienNgoai]);

  const cuaSo = useMemo(() => {
    if (!subGroupBy) return { offset, limit };
    const i = Math.max(0, thanhVienNgoai.findIndex((m) => m.id === outerId));
    return { offset: i * soTrong + offset, limit };
  }, [subGroupBy, thanhVienNgoai, outerId, soTrong, offset, limit]);

  const { resource, retry, pending } = useReportGrid(filters, {
    groupBy,
    subGroupBy,
    columnOffset: cuaSo.offset,
    columnLimit: cuaSo.limit,
  });

  /**
   * Bảng cuối cùng đã dựng xong, giữ lại để không phải vẽ lại khung.
   *
   * Chỉ dùng khi thao tác vừa rồi là ĐỔI CỘT hoặc ĐỔI NHÓM. Với mọi thay đổi
   * khác — đổi kỳ, đổi cấp ngân sách, đổi chiều — cây chỉ tiêu và cả tập số
   * đều khác, nên giữ khung cũ là bày ra số của kỳ trước dưới nhãn của kỳ này.
   */
  const khungCu = useRef<ReportGridData | null>(null);
  const moc = useRef("");
  const mocNay = [
    filters.year, filters.periodType, filters.period, filters.accumulation,
    filters.indicator, filters.budgetLevel, groupBy, subGroupBy ?? "-",
  ].join("|");
  const giuKhung = khungCu.current !== null && moc.current === mocNay;
  const dangDoiCot = giuKhung && pending;
  useEffect(() => {
    if (resource.status !== "ready" && resource.status !== "partial") return;
    khungCu.current = resource.data;
    moc.current = mocNay;
  }, [resource, mocNay]);


  const changeGroup = (next: ReportDimension) => {
    setGroupBy(next);
    // Chiều chi tiết cũ có thể không còn hợp lệ với chiều chính mới; đặt lại
    // thay vì gửi một cặp mà chính giao diện không cho phép.
    if (next === subGroupBy || (subGroupBy && !subDimensionsFor(next).includes(subGroupBy)))
      setSubGroupBy(null);
    setOffset(0);
  };

  return (
    <>
      <button
        type="button"
        className="dreport-settings-toggle"
        aria-expanded={mobileDimensionsOpen}
        aria-controls="report-dimension-controls"
        onClick={() => setMobileDimensionsOpen((open) => !open)}
      >
        <span>Chiều báo cáo</span>
        <strong>
          {DIMENSION_BY_ID[groupBy].name}
          {subGroupBy ? ` · ${DIMENSION_BY_ID[subGroupBy].name}` : " · Không chi tiết"}
        </strong>
      </button>
      <div
        className="dreport-bar"
        id="report-dimension-controls"
        data-mobile-open={mobileDimensionsOpen}
      >
        <label>
          <span>Xem theo</span>
          <select
            data-field="groupBy"
            value={groupBy}
            onChange={(event) => changeGroup(event.target.value as ReportDimension)}
          >
            {DIMENSIONS.map((dimension) => (
              <option
                key={dimension.id}
                value={dimension.id}
                disabled={dimension.id === "location" && !locationOk}
              >
                {dimension.name}
                {dimension.id === "location" && !locationOk ? " (chưa có dữ liệu ở kỳ này)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Chi tiết theo</span>
          <select
            data-field="subGroupBy"
            value={subGroupBy ?? ""}
            onChange={(event) => {
              setSubGroupBy((event.target.value || null) as ReportDimension | null);
              setOffset(0);
            }}
          >
            <option value="">Không</option>
            {subDimensionsFor(groupBy).map((id) => (
              <option key={id} value={id} disabled={id === "location" && !locationOk}>
                {DIMENSION_BY_ID[id].name}
                {id === "location" && !locationOk ? " (chưa có dữ liệu ở kỳ này)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <LiveNotice>
        {locationNote ? `${switched ? "Đã chuyển sang nhóm theo Cơ quan thuế. " : ""}${locationNote}` : null}
      </LiveNotice>

      <div className="dreport-mobile-switch" role="group" aria-label="Nội dung báo cáo đang xem">
        <button
          type="button"
          className={mobileSection === "summary" ? "is-active" : undefined}
          aria-pressed={mobileSection === "summary"}
          onClick={() => setMobileSection("summary")}
        >
          Tóm tắt
        </button>
        <button
          type="button"
          className={mobileSection === "table" ? "is-active" : undefined}
          aria-pressed={mobileSection === "table"}
          onClick={openMobileTable}
        >
          Bảng báo cáo
        </button>
      </div>

      {/* Lớp tóm tắt đứng TRƯỚC bảng chéo: người đọc trả lời được bốn câu hỏi
          chính mà không phải tự quét hàng trăm ô. Nó gọi provider riêng nên số
          không đổi theo trang cột đang xem. */}
      <div className="dreport-summary-pane" data-mobile-active={mobileSection === "summary"}>
        <ReportSummary
          filters={filters}
          dimension={groupBy}
          onOpenTable={narrow ? openMobileTable : undefined}
        />
      </div>

      <div className="dreport-table-pane" data-mobile-active={mobileSection === "table"}>
        {/*
          Đổi trang cột hay đổi nhóm thì KHÔNG dựng lại cả bảng.
          Hai thao tác đó chỉ thay các ô số; cây chỉ tiêu, cột Tổng và toàn bộ
          nhãn đều giữ nguyên. Cho `ResourceView` hiện khung chờ ở đây là xoá
          sạch màn hình rồi vẽ lại y như cũ, và người dùng mất chỗ đang đọc.
          Đổi BỘ LỌC thì khác — lúc đó cây chỉ tiêu cũng đổi nên vẫn phải chờ.
        */}
        <ResourceView resource={resource} retry={retry} minHeight={420} pending={pending && !giuKhung}>
          {(data) => (
            <ReportBody
              data={dangDoiCot && khungCu.current ? khungCu.current : data}
              dangTaiSo={pending && giuKhung}
              filters={filters}
              limit={limit}
              onPage={(next) => setOffset(next)}
              trongNhom={subGroupBy ? soTrong : null}
              offsetTrongNhom={offset}
              thanhVienNgoai={thanhVienNgoai}
              outerId={outerId}
              onOuter={(id) => {
                setOuterId(id);
                setOffset(0);
              }}
            />
          )}
        </ResourceView>
      </div>
    </>
  );
}

/** Dòng nào đang nhìn thấy: mọi tổ tiên phải đang mở. */
function visibleRows(rows: ReportRow[], open: Set<string>): ReportRow[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return rows.filter((row) => {
    let parent = row.parent;
    while (parent) {
      if (!open.has(parent)) return false;
      parent = byId.get(parent)?.parent ?? null;
    }
    return true;
  });
}

const KIND_LABEL: Record<string, string> = {
  formula: "Công thức",
  direct: "Điều kiện trực tiếp",
  breakdown: "Dòng giải thích",
  ofWhich: "Trong đó",
  heading: "Tiêu đề",
};

function ReportBody({
  data,
  dangTaiSo,
  filters,
  limit,
  onPage,
  trongNhom,
  offsetTrongNhom,
  thanhVienNgoai,
  outerId,
  onOuter,
}: {
  data: ReportGridData;
  /** Đang chờ số của trang cột mới; khung giữ nguyên, chỉ vùng số mờ đi. */
  dangTaiSo: boolean;
  filters: DashboardFilters;
  limit: number;
  onPage: (offset: number) => void;
  /** Số cột bên trong một nhóm; `null` khi báo cáo chỉ có một chiều. */
  trongNhom: number | null;
  offsetTrongNhom: number;
  thanhVienNgoai: { id: string; name: string }[];
  outerId: string | null;
  onOuter: (id: string) => void;
}) {
  const hepKho = useNarrow();
  const hasChildren = useMemo(
    () => new Set(data.rows.map((row) => row.parent).filter((id): id is string => !!id)),
    [data.rows],
  );
  const [open, setOpen] = useState<Set<string>>(() => new Set(["A", "A.I", "A.I.2"]));
  const rows = useMemo(() => visibleRows(data.rows, open), [data.rows, open]);

  const cells = useMemo(() => {
    const map = new Map<string, ReportCell>();
    for (const cell of data.cells) map.set(`${cell.rowId}|${cell.columnId}`, cell);
    return map;
  }, [data.cells]);

  /**
   * Một thang tiền cho cả bảng, tính từ **ô** chứ không từ tổng hàng.
   *
   * Tổng hàng lớn hơn một ô hàng nghìn lần vì nó cộng cả nghìn cột. Lấy thang
   * theo tổng hàng thì cả bảng hiện "<1" và không còn đọc được gì.
   */
  const scale = useMemo(
    () => moneyScale(data.cells.map((cell) => toDisplayNumber(cell.value))),
    [data.cells],
  );
  /** Cột tổng dùng thang riêng vì nó ở bậc độ lớn khác hẳn các ô. */
  const totalScale = useMemo(
    () => moneyScale(data.rows.map((row) => toDisplayNumber(row.total))),
    [data.rows],
  );

  const groups = data.columns.filter((column) => column.parentId === null && data.subGroupBy);
  const leaves = data.columns.filter((column) => (data.subGroupBy ? column.parentId !== null : true));

  /**
   * Phân trang đếm TRONG nhóm đang chọn, không phải trên toàn bảng.
   *
   * Nói "41–48 trên 462 cột" khi người dùng đang xem một ngành là sai hai lần:
   * 462 là tổng của mọi ngành cộng lại, và 41 không phải cột thứ 41 của ngành
   * này. Người đọc không có cách nào biết mình đang ở đâu trong nhóm.
   */
  const total = trongNhom ?? data.columnPage.total;
  const offset = trongNhom === null ? data.columnPage.offset : offsetTrongNhom;
  const last = Math.min(offset + limit, total);

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <Card
        title="Bảng báo cáo"
        // Mốc tiêu điểm khi mở khung bảng ở khổ hẹp. Trước đây mốc này nằm trên
        // dòng "Mẫu N" phía trên; dòng đó đã bỏ nên mốc chuyển về tiêu đề thẻ,
        // chứ không bỏ theo — bỏ là trình đọc màn hình mất chỗ đáp xuống.
        titleId="nsnn-report-table-title"
        subtitle={`${DIMENSION_BY_ID[data.groupBy].source}. Ô theo ${scale.unit}, cột tổng theo ${totalScale.unit}.`}
        actions={
          <div className="dreport-actions">
            {/*
              Khổ hẹp: ô chọn nhóm lên thanh công cụ.

              Dưới 768px bảng xếp chồng thành thẻ và cả `thead` bị ẩn, nên ô chọn
              nằm trong đầu bảng biến mất — không còn đường nào đổi nhóm đang
              xem. Trên màn hình rộng nó vẫn ở nguyên trong đầu bảng: ở đó nó
              đứng ngay trên đúng dải cột mà nó điều khiển, gần hơn là đưa ra
              đây.
            */}
            {hepKho && thanhVienNgoai.length > 0 && (
              <label className="dreport-group-pick dreport-group-pick-ngoai">
                <span className="sr-only">
                  {DIMENSION_BY_ID[data.groupBy].name} đang xem, {thanhVienNgoai.length} nhóm
                </span>
                <select
                  data-field="outerMemberNgoai"
                  value={outerId ?? thanhVienNgoai[0]?.id}
                  onChange={(event) => onOuter(event.target.value)}
                >
                  {thanhVienNgoai.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <MauNganhButton
              filters={filters}
              groupBy={data.groupBy}
              subGroupBy={data.subGroupBy}
              periodLabel={data.meta.periodLabel}
              thanhVienNgoai={thanhVienNgoai}
            />
            <span className="dreport-page">
              <button type="button" className="dbtn" disabled={offset === 0} onClick={() => onPage(Math.max(0, offset - limit))}>
                Cột trước
              </button>
              <em role="status" aria-live="polite" aria-atomic="true">
                {offset + 1}–{last} trên {total} cột
              </em>
              <button type="button" className="dbtn" disabled={last >= total} onClick={() => onPage(offset + limit)}>
                Cột sau
              </button>
            </span>
          </div>
        }
      >
        <div className="dtable-wrap" id="nsnn-report-table" tabIndex={-1}>
          <table
            className="dtable dreport-table"
            data-loading={dangTaiSo || undefined}
            /*
              `key` đổi theo cửa sổ cột, nên React dựng lại `tbody` và hiệu ứng
              chạy lại mỗi lần sang trang. Không đổi `key` thì DOM giữ nguyên và
              animation chỉ chạy đúng một lần ở lần vẽ đầu tiên.
            */
            key={`${data.columnPage.offset}`}
          >
            <caption className="sr-only">
              Cây chỉ tiêu theo hàng, {DIMENSION_BY_ID[data.groupBy].name.toLowerCase()} theo cột
            </caption>
            <thead>
              {groups.length > 0 && (
                <tr>
                  <th scope="col" rowSpan={2}>
                    Chỉ tiêu
                  </th>
                  <th scope="col" rowSpan={2} className="is-num dreport-total">
                    Tổng {totalScale.short}
                  </th>
                  {/*
                    Ô nhóm là một Ô CHỌN, không phải một nhãn.
                    Bảng chỉ hiện đúng một nhóm mỗi lần, nên ô này vừa nói đang
                    xem nhóm nào vừa là chỗ đổi sang nhóm khác. Đặt ở ngoài
                    thanh công cụ thì người dùng phải rời mắt khỏi bảng để đổi
                    một thứ thuộc về chính bảng.
                  */}
                  {groups.map((group) => (
                    <th
                      key={group.id}
                      scope="colgroup"
                      colSpan={leaves.filter((leaf) => leaf.parentId === group.id).length}
                    >
                      {/* Ở khổ hẹp ô chọn đã lên thanh công cụ; dựng ở cả hai chỗ
                          là hai điều khiển cho cùng một thứ, và trình đọc màn
                          hình đọc lên cả hai. */}
                      {hepKho ? (
                        group.name
                      ) : (
                        <label className="dreport-group-pick">
                          <span className="sr-only">
                            Nhóm đang xem, {thanhVienNgoai.length} nhóm
                          </span>
                          <select
                            data-field="outerMember"
                            value={outerId ?? group.id}
                            onChange={(event) => onOuter(event.target.value)}
                          >
                            {thanhVienNgoai.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </th>
                  ))}
                </tr>
              )}
              <tr>
                {groups.length === 0 && <th scope="col">Chỉ tiêu</th>}
                {groups.length === 0 && (
                  <th scope="col" className="is-num dreport-total">
                    Tổng {totalScale.short}
                  </th>
                )}
                {leaves.map((column) => (
                  <th key={column.id} scope="col" className="is-num">
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const expandable = hasChildren.has(row.id);
                const expanded = open.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`is-${row.kind}${expanded ? " is-open" : ""}`}
                    data-depth={Math.min(row.depth, 4)}
                    data-revealed={row.parent ? "true" : undefined}
                  >
                    <th scope="row">
                      {expandable ? (
                        <button type="button" className="dtms-toggle" aria-expanded={expanded} onClick={() => toggle(row.id)}>
                          <span aria-hidden="true" className="dtms-caret" />
                          <span className="dtms-toggle-label">{row.name}</span>
                        </button>
                      ) : (
                        <span className="dreport-name">{row.name}</span>
                      )}
                      {/* Nhãn chỉ hiện ở dòng KHÔNG cộng vào cha. Gắn nhãn cho cả
                          113 dòng thì nó thành nhiễu và không ai đọc nữa; giữ ở
                          đúng ba loại thì nó trả lời được câu hỏi duy nhất người
                          đọc cần hỏi là dòng này có nằm trong tổng hay không. */}
                      {row.kind !== "direct" && row.kind !== "formula" && (
                        <em>{KIND_LABEL[row.kind]}</em>
                      )}
                    </th>
                    <td className="is-num dreport-total" data-label="Tổng">
                      {toDisplayNumber(row.total) === null
                        ? null
                        : inScale(toDisplayNumber(row.total), totalScale)}
                    </td>
                    {leaves.map((column) => {
                      const cell = cells.get(`${row.id}|${column.id}`);
                      const value = toDisplayNumber(cell?.value ?? null);
                      return (
                        <td key={column.id} className="is-num" data-label={column.name}>
                          {value === null ? null : inScale(value, scale)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

type WideReportExportRow = {
  row: ReportRow;
  values: Map<string, string | null>;
};

/**
 * Tải toàn bộ các trang cột rồi dựng bảng Excel dạng ma trận giống bảng báo cáo.
 * Mỗi chỉ tiêu là một dòng; mỗi topic của cặp chiều là một cột. Không dùng dữ
 * liệu của trang đang nhìn vì trang mobile chỉ có ba cột và desktop chỉ tám.
 */
async function prepareWideReportExport(
  filters: DashboardFilters,
  groupBy: ReportDimension,
  subGroupBy: ReportDimension | null,
) {
  const controller = new AbortController();
  const pageSize = 250;
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  let reportRows: ReportRow[] = [];
  const leafColumns: { id: string; header: string; ngoai: string | null; trong: string }[] = [];
  const valuesByRow = new Map<string, Map<string, string | null>>();

  while (offset < total) {
    const response = await provider.getReportGrid(
      filters,
      { groupBy, subGroupBy, columnOffset: offset, columnLimit: pageSize },
      controller.signal,
    );
    const page = response.data;
    reportRows = page.rows;
    total = page.columnPage.total;
    const parents = new Map(
      page.columns.filter((column) => column.parentId === null).map((column) => [column.id, column.name]),
    );
    const pageLeaves = page.columns.filter((column) => subGroupBy === null || column.parentId !== null);
    if (!pageLeaves.length) break;

    for (const column of pageLeaves) {
      const ngoai = column.parentId ? (parents.get(column.parentId) ?? column.parentId) : null;
      leafColumns.push({
        id: column.id,
        header: ngoai ? `${ngoai} · ${column.name}` : column.name,
        ngoai,
        trong: column.name,
      });
    }
    for (const cell of page.cells) {
      const rowValues = valuesByRow.get(cell.rowId) ?? new Map<string, string | null>();
      rowValues.set(cell.columnId, cell.value);
      valuesByRow.set(cell.rowId, rowValues);
    }
    offset += pageLeaves.length;
  }

  const rows: WideReportExportRow[] = reportRows.map((row) => ({
    row,
    values: valuesByRow.get(row.id) ?? new Map(),
  }));
  return {
    rows,
    leafColumns,
    columns: [
      { header: "Mã chỉ tiêu", value: (item: WideReportExportRow) => item.row.id },
      { header: "Chỉ tiêu", value: (item: WideReportExportRow) => item.row.name },
      { header: "Cấp", value: (item: WideReportExportRow) => item.row.depth, format: "count" as const },
      { header: "Loại dòng", value: (item: WideReportExportRow) => KIND_LABEL[item.row.kind] ?? item.row.kind },
      { header: "Tổng (đồng)", value: (item: WideReportExportRow) => item.row.total, format: "money" as const },
      ...leafColumns.map((column) => ({
        header: `${column.header} (đồng)`,
        format: "money" as const,
        value: (item: WideReportExportRow) => item.values.get(column.id) ?? null,
      })),
    ],
  };
}

/** Số dòng trong tệp mẫu của từng chỉ tiêu; hai nguồn cùng lấy từ một tệp gốc. */
const LINE_BY_ROW_ID = new Map(
  (reportTree.rows as { id: string; line: number }[]).map((r) => [r.id, r.line]),
);

/**
 * Nút xuất của bảng báo cáo.
 *
 * Xuất ra ĐÚNG mẫu báo cáo thu nội địa của ngành — không phải một bảng phẳng
 * dựng theo ý mình. File tải về dán thẳng vào bộ hồ sơ trình ký mà không phải
 * định dạng lại dòng nào, nên không có bản "xuất chung" thứ hai: một báo cáo
 * chỉ nên có một hình dạng, nếu không người nhận phải hỏi bản nào là bản đúng.
 */
function MauNganhButton({
  filters,
  groupBy,
  subGroupBy,
  periodLabel,
  thanhVienNgoai,
}: {
  filters: DashboardFilters;
  groupBy: ReportDimension;
  subGroupBy: ReportDimension | null;
  periodLabel: string;
  thanhVienNgoai: { id: string; name: string }[];
}) {
  const [phase, setPhase] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [tienDo, setTienDo] = useState<string | null>(null);
  /**
   * Nhóm ngoài cần xuất; `null` là toàn bộ.
   *
   * Báo cáo hai chiều ra tới 3.584 cột, và người mở file phải cuộn ngang qua
   * ngần ấy mới tới nhóm mình cần. Lọc ngay lúc xuất cắt file xuống đúng một
   * nhóm — mẫu 8 còn 29 cột thay vì 406 — mà vẫn giữ nguyên một sheet đúng hình
   * dạng tệp mẫu, nên bên nhận không phải học một bố cục khác.
   *
   * Mặc định vẫn là toàn bộ: nút mang chữ "toàn bộ", nên lẳng lặng xuất một
   * nhóm là nói dối ngay trên nhãn.
   */
  const [chon, setChon] = useState<string[]>([]);
  const [moBang, setMoBang] = useState(false);
  const hop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!moBang) return;
    // Bấm ra ngoài thì đóng. Không dựa được vào tiêu điểm: bấm vào một ô số
    // trong bảng chẳng chuyển tiêu điểm đi đâu cả, nên hộp cứ mở mãi.
    const ngoai = (event: PointerEvent) => {
      if (!hop.current?.contains(event.target as Node)) setMoBang(false);
    };
    document.addEventListener("pointerdown", ngoai);
    return () => document.removeEventListener("pointerdown", ngoai);
  }, [moBang]);
  /** Nhóm đã chọn, giữ đúng thứ tự của danh mục chứ không theo thứ tự bấm. */
  const daChon = thanhVienNgoai.filter((m) => chon.includes(m.id));
  useEffect(() => {
    // Đổi chiều thì lựa chọn cũ không còn nghĩa. Giữ lại thì nó nằm im cho tới
    // khi người dùng quay về chiều cũ rồi bật lại — một lựa chọn họ không hề
    // đặt trong lần này mà vẫn quyết định file xuất ra.
    setChon([]);
    setMoBang(false);
  }, [thanhVienNgoai]);

  /**
   * Mỗi nhóm một tệp, không phải một tệp nhiều sheet.
   *
   * Người nhận thường chỉ cần đúng phần của mình và sẽ chuyển tiếp nguyên tệp.
   * Gói nhiều nhóm vào một tệp là họ phải tự tách, hoặc gửi đi cả phần không
   * thuộc về người kia. Mỗi tệp cũng giữ nguyên một sheet đúng hình dạng mẫu.
   */
  const run = async () => {
    setPhase("working");
    setMessage(null);
    try {
      // Tải dữ liệu MỘT lần cho cả loạt: mọi tệp cắt ra từ cùng một bộ cột, nên
      // gọi lại theo từng nhóm chỉ tốn thêm thời gian mà không đổi con số nào.
      const { rows, columns, leafColumns } = await prepareWideReportExport(filters, groupBy, subGroupBy);
      // `null` = một tệp đầy đủ. Ngược lại mỗi nhóm một tệp.
      const loat: ({ id: string; name: string } | null)[] = daChon.length ? daChon : [null];

      for (const [i, nhom] of loat.entries()) {
        // Tiến độ chỉ đọc lên cho trình đọc màn hình, không vào nhãn nút: nhãn
        // mang số thì nút lại co giãn theo từng tệp, đúng cái vừa sửa xong.
        if (loat.length > 1) setTienDo(`Đang tạo tệp ${i + 1} trên ${loat.length}.`);
        // Lọc trên cột LÁ rồi mới suy ra cột số, để hai danh sách không thể lệch
        // nhau: lệch một cột là cả bảng số trượt sang một nhãn khác.
        const giuLa = nhom === null ? leafColumns : leafColumns.filter((c) => c.ngoai === nhom.name);
        if (!giuLa.length) throw new Error(`Nhóm "${nhom?.name}" không có cột nào.`);
        const giuId = new Set(giuLa.map((c) => `${c.header} (đồng)`));
        const cotSo = columns.slice(5).filter((c) => giuId.has(c.header));
        // Nối theo DÒNG EXCEL chứ không theo mã: mã của cây báo cáo dùng `ASTAR`
        // còn bảng chỉ tiêu dùng `A*`. Số dòng thì cả hai cùng lấy từ một tệp gốc.
        const theoDong = new Map<number, Map<string, number | null>>();
        for (const item of rows) {
          const dong = LINE_BY_ROW_ID.get(item.row.id);
          if (dong === undefined) continue;
          const o = new Map<string, number | null>();
          for (const c of cotSo) {
            const raw = c.value(item);
            const so = raw === null || raw === "" ? null : Number(raw);
            o.set(c.header, Number.isFinite(so as number) ? (so as number) : null);
          }
          theoDong.set(dong, o);
        }
        await xuatTheoMauNganh({
          coQuan: ["CỤC THUẾ", "THUẾ THÀNH PHỐ HÀ NỘI"],
          tieuDe: "BÁO CÁO THU NỘI ĐỊA",
          columns: giuLa.map((c) => ({ id: `${c.header} (đồng)`, ngoai: c.ngoai, trong: c.trong })),
          giaTri: theoDong,
          fileName: `bao-cao-thu-noi-dia-${groupBy}${subGroupBy ? `-${subGroupBy}` : ""}${
            nhom ? `-${nhom.id}` : ""
          }`,
          sheet: periodLabel,
          mauSo: templateNoOf(groupBy, subGroupBy),
        });
        // Nhả luồng giữa hai tệp: trình duyệt bỏ bớt tệp khi một loạt lượt tải
        // nổ ra trong cùng một nhịp, và người dùng chỉ thấy thiếu tệp chứ không
        // thấy lỗi nào.
        if (i < loat.length - 1) await new Promise((r) => setTimeout(r, 400));
      }
      setPhase("idle");
      setTienDo(null);
    } catch (error) {
      setPhase("error");
      setTienDo(null);
      setMessage((error as Error)?.message ?? "Không tạo được file.");
    }
  };

  return (
    <span className="dexport">
      {/* Chỉ hiện với báo cáo hai chiều: một chiều thì không có nhóm ngoài để
          lọc, và bày một ô chọn chỉ có một dòng là mời bấm vào chỗ không làm gì. */}
      {thanhVienNgoai.length > 0 && (
        <div
          className="dexport-loc"
          ref={hop}
          /*
            Đóng khi tiêu điểm rời HẲN khỏi hộp, và phải hỏi ở NHỊP SAU.

            Bấm vào phần chữ hay khoảng trống của một hàng tích thì trình duyệt
            thả tiêu điểm trước rồi mới chuyển nó sang ô tích, nên ngay lúc
            `blur` chạy `relatedTarget` vẫn là `null` — đọc nó là kết luận nhầm
            rằng tiêu điểm đã rời hộp và đóng hộp lại. Người dùng thấy: bấm trúng
            ô vuông thì ở lại, bấm vào chữ thì hộp biến mất, và hiểu thành chỉ
            mỗi ô vuông bấm được. Hỏi `document.activeElement` ở nhịp sau thì lúc
            đó tiêu điểm đã yên vị.
          */
          onBlur={() => {
            const khung = hop.current;
            setTimeout(() => {
              if (khung && !khung.contains(document.activeElement)) setMoBang(false);
            }, 0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && moBang) {
              event.preventDefault();
              setMoBang(false);
              hop.current?.querySelector<HTMLButtonElement>("[data-field='exportOuter']")?.focus();
            }
          }}
        >
          <button
            type="button"
            className="dbtn dexport-loc-nut"
            data-field="exportOuter"
            aria-expanded={moBang}
            aria-haspopup="true"
            disabled={phase === "working"}
            onClick={() => setMoBang((mo) => !mo)}
          >
            <span className="sr-only">Phạm vi xuất theo {DIMENSION_BY_ID[groupBy].name}: </span>
            {daChon.length === 0
              ? `Toàn bộ ${DIMENSION_BY_ID[groupBy].name.toLowerCase()}`
              : daChon.length === 1
                ? daChon[0].name
                : `${daChon.length} ${DIMENSION_BY_ID[groupBy].name.toLowerCase()}`}
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
              <path d="m5 8 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          {moBang && (
            <div className="dexport-loc-bang" role="group" aria-label={`Chọn ${DIMENSION_BY_ID[groupBy].name.toLowerCase()} cần xuất`}>
              <p className="dexport-loc-nhac">
                Không tích ô nào thì xuất một tệp đầy đủ. Tích nhiều nhóm thì mỗi
                nhóm một tệp, và trình duyệt có thể hỏi xác nhận trước khi tải
                nhiều tệp.
              </p>
              <div className="dexport-loc-ds">
                {/*
                  Cả thẻ LÀ cái điều khiển, không phải một ô tích có chữ đứng cạnh.

                  Dựng bằng `<label>` bọc `<input>` thì vùng bấm đúng là cả thẻ,
                  nhưng cái ô vuông vẫn là một đích bấm riêng bên trong: trình
                  duyệt chuyển tiêu điểm, phát `change`, rồi nhãn lại chuyển tiếp
                  cú bấm — ba đường đi cho một hành động, và mỗi trình duyệt xếp
                  thứ tự một khác. Ở đây chỉ còn MỘT nút: bấm chỗ nào trong thẻ
                  cũng là cùng một cú bấm, kể cả bấm trúng ô vuông, vì ô vuông
                  chỉ là hình vẽ. `role="checkbox"` giữ nguyên nghĩa cho trình
                  đọc màn hình, và nút thì Space lẫn Enter đều bật tắt được.
                */}
                {thanhVienNgoai.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="checkbox"
                    aria-checked={chon.includes(m.id)}
                    data-member={m.id}
                    onClick={() =>
                      setChon((truoc) =>
                        truoc.includes(m.id) ? truoc.filter((id) => id !== m.id) : [...truoc, m.id],
                      )
                    }
                  >
                    <span className="dcheck" aria-hidden="true" />
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="dbtn is-quiet"
                disabled={daChon.length === 0}
                onClick={() => setChon([])}
              >
                Bỏ chọn hết
              </button>
            </div>
          )}
        </div>
      )}
      <button type="button" className="dbtn" onClick={run} disabled={phase === "working"}>
        <NhanOnDinh
          nhan={
            phase === "working"
              ? "Đang tạo tệp…"
              : daChon.length === 0
                ? "Xuất toàn bộ Excel"
                : "Xuất Excel đã chọn"
          }
          moi={["Xuất toàn bộ Excel", "Xuất Excel đã chọn", "Đang tạo tệp…"]}
        />
      </button>
      <span className="sr-only" role="status">{tienDo ?? message ?? ""}</span>
      {phase === "error" && message && <small className="is-error" aria-hidden="true">{message}</small>}
    </span>
  );
}

/** Danh sách tám mẫu, để đối chiếu nhanh khi nghiệm thu. */
export const TEMPLATE_COUNT = REPORT_TEMPLATES.length;
