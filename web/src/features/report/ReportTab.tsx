import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useReportGrid } from "@/data/hooks";
import { provider } from "@/data";
import { useDashboardState } from "@/state/DashboardState";
import {
  DIMENSIONS,
  DIMENSION_BY_ID,
  REPORT_TEMPLATES,
  subDimensionsFor,
  type ReportDimension,
} from "@/domain/report";
import { toDisplayNumber } from "@/domain/money";
import { locationDimensionAvailable, locationDimensionNote } from "@/domain/periods";
import type { DashboardFilters, ReportCell, ReportGridData, ReportRow } from "@/domain/types";
import { Card, inScale, LiveNotice, moneyScale, ResourceView } from "@/components/primitives";
import { ReportSummary } from "./ReportSummary";
import { ReportModePicker } from "./ReportModePicker";
import { ReportExportButton } from "@/components/ReportExportButton";
import { useNarrow } from "@/components/useNarrow";

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
    <div className="dstack">
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
  const [mobileSection, setMobileSection] = useState<"summary" | "table">("summary");
  const [mobileDimensionsOpen, setMobileDimensionsOpen] = useState(false);
  const openMobileTable = () => {
    setMobileSection("table");
    window.requestAnimationFrame(() => document.getElementById("nsnn-report-table-title")?.focus());
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

  const { resource, retry, pending } = useReportGrid(filters, {
    groupBy,
    subGroupBy,
    columnOffset: offset,
    columnLimit: limit,
  });

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
        <span>Thiết lập mẫu</span>
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
        <details className="dreport-dimension-help">
          <summary>Cách lập mẫu báo cáo</summary>
          <p>
            Tám mẫu báo cáo là tám cặp chiều. Hàng luôn là cây 113 chỉ tiêu; Chương và Tiểu mục là điều kiện
            lấy số nên không xuất hiện thành cột.
          </p>
        </details>
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
          onOpenTable={openMobileTable}
        />
      </div>

      <div className="dreport-table-pane" data-mobile-active={mobileSection === "table"}>
        <ResourceView resource={resource} retry={retry} minHeight={420} pending={pending}>
          {(data) => (
            <ReportBody
              data={data}
              filters={filters}
              limit={limit}
              onPage={(next) => setOffset(next)}
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
  filters,
  limit,
  onPage,
}: {
  data: ReportGridData;
  filters: DashboardFilters;
  limit: number;
  onPage: (offset: number) => void;
}) {
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

  const { offset, total } = data.columnPage;
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
      <h2 className="dsubject" id="nsnn-report-table-title" tabIndex={-1}>
        {data.templateNo ? `Mẫu ${data.templateNo}` : "Cặp chiều ngoài tám mẫu"}
        <small>
          {DIMENSION_BY_ID[data.groupBy].name}
          {data.subGroupBy ? ` · chi tiết theo ${DIMENSION_BY_ID[data.subGroupBy].name}` : ""} ·{" "}
          {data.meta.periodLabel}
        </small>
      </h2>

      <Card
        title="Bảng báo cáo"
        subtitle={`${DIMENSION_BY_ID[data.groupBy].source}. Ô theo ${scale.unit}, cột tổng theo ${totalScale.unit}.`}
        actions={
          <div className="dreport-actions">
            <ReportExportButton
              label="Xuất toàn bộ CSV"
              request={{
                fileName: `bao-cao-thu-nsnn-${data.groupBy}${data.subGroupBy ? `-${data.subGroupBy}` : ""}`,
                rows: () => [],
                prepare: () => prepareWideReportExport(filters, data.groupBy, data.subGroupBy),
                meta: {
                  periodLabel: data.meta.periodLabel,
                  scopeLabel: data.meta.scopeLabel,
                  unit: "đồng",
                  freshness: {
                    dataAsOf: null,
                    generatedAt: data.meta.generatedAt,
                    status: data.origin === "mock" ? "mock" : "provisional",
                    sources: ["TREASURY"],
                  },
                },
              }}
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
        <div className="dtable-wrap">
          <table className="dtable dreport-table">
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
                  {groups.map((group) => (
                    <th
                      key={group.id}
                      scope="colgroup"
                      colSpan={leaves.filter((leaf) => leaf.parentId === group.id).length}
                    >
                      {group.name}
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
                  <tr key={row.id} className={`is-${row.kind}`} data-depth={Math.min(row.depth, 4)}>
                    <th scope="row">
                      {expandable ? (
                        <button type="button" className="dtms-toggle" aria-expanded={expanded} onClick={() => toggle(row.id)}>
                          <span aria-hidden="true" className="dtms-caret" />
                          {row.name}
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
                    <td className="is-num dreport-total" data-label="Tổng toàn bộ cột">
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
        <p className="dhint">
          Dòng "Trong đó" và dòng giải thích có số của riêng chúng nhưng không cộng vào dòng cha, vì cha đã
          bao gồm phần đó. Tiêu đề Hoàn thuế và Thu hồi hoàn thuế không phát sinh tổng nên để trống.
        </p>
      </Card>
    </>
  );
}

type WideReportExportRow = {
  row: ReportRow;
  values: Map<string, string | null>;
};

/**
 * Tải toàn bộ các trang cột rồi dựng CSV dạng ma trận giống bảng báo cáo.
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
  const leafColumns: { id: string; header: string }[] = [];
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
      leafColumns.push({
        id: column.id,
        header: column.parentId ? `${parents.get(column.parentId) ?? column.parentId} · ${column.name}` : column.name,
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
    columns: [
      { header: "Mã chỉ tiêu", value: (item: WideReportExportRow) => item.row.id },
      { header: "Chỉ tiêu", value: (item: WideReportExportRow) => item.row.name },
      { header: "Cấp", value: (item: WideReportExportRow) => item.row.depth },
      { header: "Loại dòng", value: (item: WideReportExportRow) => KIND_LABEL[item.row.kind] ?? item.row.kind },
      { header: "Tổng (đồng)", value: (item: WideReportExportRow) => item.row.total },
      ...leafColumns.map((column) => ({
        header: `${column.header} (đồng)`,
        value: (item: WideReportExportRow) => item.values.get(column.id) ?? null,
      })),
    ],
  };
}

/** Danh sách tám mẫu, để đối chiếu nhanh khi nghiệm thu. */
export const TEMPLATE_COUNT = REPORT_TEMPLATES.length;
