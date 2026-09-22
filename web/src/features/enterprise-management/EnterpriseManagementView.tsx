import { useEffect, useMemo, useRef, useState } from "react";
import { useEnterpriseManagement } from "@/data/hooks";
import { useDashboardState } from "@/state/DashboardState";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { Card, Money, ResourceView, moneyScale, pct, type MoneyScale } from "@/components/primitives";
import { DataFreshnessBar } from "@/components/DataFreshnessBar";
import { ReportExportButton } from "@/components/ReportExportButton";
import { DIMENSION_BY_ID } from "@/domain/report";
import type {
  EnterpriseGroupBy,
  EnterpriseGroupRow,
  EnterpriseManagementData,
} from "@/domain/workspaces";
import { useNarrow } from "@/components/useNarrow";
import { useTouch } from "@/components/useTouch";
import { useHostContext } from "@/host/HostContext";
import { IndustrySummary } from "./IndustrySummary";
import { EnterpriseTable } from "./EnterpriseTable";
import { revealSection } from "@/components/sectionNavigation";

const GROUPS: { id: EnterpriseGroupBy; label: string }[] = [
  { id: "industry", label: "Theo ngành nghề" },
  { id: "taxOffice", label: "Theo cơ quan thuế" },
  { id: "location", label: "Theo địa bàn" },
];

export function EnterpriseManagementView() {
  const { filters } = useDashboardState();
  const [groupBy, setGroupBy] = useState<EnterpriseGroupBy>("industry");
  const [selected, setSelected] = useState<string | null>(null);
  const { resource, retry, pending } = useEnterpriseManagement(filters, groupBy);
  const hep = useNarrow();
  /**
   * Khổ hẹp đi theo lối tổng quan → trang chi tiết, không phải hai cột.
   *
   * Xếp chồng hai cột lại thì màn hình dài 3.225px và danh sách doanh nghiệp
   * của một nhóm nào đó tự dưng nằm dưới bảng xếp hạng, không ai bảo nó thuộc
   * về nhóm nào. Ở đây chỉ một trong hai có mặt mỗi lần, nên lúc nào cũng rõ
   * đang xem cái gì.
   */
  const trangChiTiet = hep && selected !== null;

  return (
    <>
      {/* Thanh chọn chiều thuộc về TỔNG QUAN. Để nó lại trên trang chi tiết thì
          đổi chiều ngay giữa lúc đang xem doanh nghiệp của một ngành, và nhóm
          đang mở không còn nghĩa. */}
      {!trangChiTiet && (
      <div className="dlocalbar">
        <div className="dfield">
          <span>Xem theo</span>
          <div className="dseg" role="group" aria-label="Chiều phân tích quản lý thu">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={groupBy === g.id ? "is-active" : undefined}
                aria-pressed={groupBy === g.id}
                onClick={() => {
                  setGroupBy(g.id);
                  // Đổi chiều thì nhóm đang mở không còn nghĩa: một mã ngành
                  // không phải một mã cơ quan thuế.
                  setSelected(null);
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      )}

      <ResourceView resource={resource} retry={retry} minHeight={420} pending={pending}>
        {(data) => (
          <EnterpriseBody key={data.groupBy} data={data} selected={selected} onSelect={setSelected} />
        )}
      </ResourceView>
    </>
  );
}

function EnterpriseBody({
  data,
  selected,
  onSelect,
}: {
  data: EnterpriseManagementData;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const hep = useNarrow();
  const [enterpriseQuery, setEnterpriseQuery] = useState("");
  const unit = useMemo(() => moneyScale(data.groups.map((g) => g.amount)), [data.groups]);
  const dimensionName = DIMENSION_BY_ID[data.groupBy].name;
  const top = useMemo(
    () => data.groups.find((g) => !g.unclassified) ?? null,
    [data.groups],
  );
  /**
   * Nhóm đang mở.
   *
   * Màn hình rộng luôn có nội dung ở cột phải: chưa chọn thì lấy nhóm đầu tiên
   * có doanh nghiệp, để không bày ra một nửa màn hình trống. Khổ hẹp thì KHÔNG
   * tự chọn — tự mở một nhóm nghĩa là người dùng bị đưa vào một trang họ không
   * bấm để vào, và nút quay lại chẳng biết quay về đâu.
   */
  const activeGroup: EnterpriseGroupRow | null =
    (selected === null ? null : (data.groups.find((g) => g.id === selected) ?? null)) ??
    (hep ? null : (data.groups.find((g) => !g.unclassified && g.enterpriseCount > 0) ?? null));

  if (hep && activeGroup)
    return (
      <TrangChiTiet
        nhom={activeGroup}
        rows={data.enterprises[activeGroup.id] ?? []}
        unit={unit}
        dimensionName={dimensionName}
        query={enterpriseQuery}
        onQuery={setEnterpriseQuery}
        onBack={() => {
          setEnterpriseQuery("");
          onSelect(null);
        }}
      />
    );

  return (
    <>
      <DataFreshnessBar
        freshness={data.freshness}
        note="Số doanh nghiệp lấy từ danh bạ tổng hợp; số thu và chi tiết đang mô phỏng"
      />

      <KpiStrip columns={4} label={`Quản lý thu · ${dimensionName} · ${data.meta.periodLabel}`}>
        <Kpi label="Số thu trong phạm vi" onActivate={hep ? () => revealSection("enterprise-report-groups") : undefined} controls="enterprise-report-groups">
          <Money value={data.totals.amount} scale={unit} />
        </Kpi>
        <Kpi label="Bản ghi danh bạ" note={`${data.totals.groupCount} nhóm ${dimensionName.toLowerCase()} có dữ liệu`} onActivate={hep ? () => revealSection("enterprise-report-groups") : undefined} controls="enterprise-report-groups">
          {data.totals.directoryTotal?.toLocaleString("vi-VN")}
        </Kpi>
        <Kpi label="Đóng góp lớn nhất" note={top ? top.name : undefined} onActivate={hep ? () => revealSection("enterprise-report-groups") : undefined} controls="enterprise-report-groups">
          {top ? <Money value={top.amount} scale={unit} /> : null}
        </Kpi>
        <Kpi
          label="Đã xác định được nhóm"
          note={
            <>
              Chưa xác định: <Money value={data.totals.unclassifiedAmount} scale={unit} />
            </>
          }
          onActivate={hep ? () => revealSection("enterprise-report-groups") : undefined}
          controls="enterprise-report-groups"
        >
          {pct(data.totals.classifiedRate)}
        </Kpi>
      </KpiStrip>

      <div className="dreport-split dreport-master-detail dsection-target" id="enterprise-report-groups" tabIndex={-1}>
        <Card
          title={`Số thu theo ${dimensionName.toLowerCase()}`}
          // Khổ hẹp không có cột bên cạnh: nhóm mở ra một trang riêng.
          subtitle={
            hep
              ? "Chạm một nhóm để xem doanh nghiệp trong nhóm đó"
              : "Chọn một nhóm để xem doanh nghiệp ở cột bên cạnh"
          }
          unit={unit}
          actions={
            <ReportExportButton
              request={{
                title: `Số thu theo ${dimensionName.toLowerCase()}`,
                fileName: `thu-theo-${data.groupBy}`,
                rows: () => data.groups,
                meta: {
                  periodLabel: data.meta.periodLabel,
                  scopeLabel: data.meta.scopeLabel,
                  unit: "đồng",
                  freshness: data.freshness,
                },
                columns: [
                  { header: dimensionName, value: (r: EnterpriseGroupRow) => r.name },
                  { header: "Số thu (đồng)", value: (r: EnterpriseGroupRow) => r.amount, format: "money" },
                  { header: "Tỷ trọng (%)", value: (r: EnterpriseGroupRow) => r.share, format: "percent" },
                  { header: "Cùng kỳ (đồng)", value: (r: EnterpriseGroupRow) => r.previous, format: "money" },
                  { header: "Số doanh nghiệp", value: (r: EnterpriseGroupRow) => r.enterpriseCount, format: "count" },
                ],
              }}
            />
          }
        >
          <IndustrySummary
            groups={data.groups}
            unit={unit}
            totals={data.totals}
            selected={activeGroup?.id ?? null}
            onSelect={(id) => {
              setEnterpriseQuery("");
              onSelect(id);
            }}
            dimensionName={dimensionName}
          />
        </Card>

        {activeGroup && !hep && (
          <div
            key={activeGroup.id}
            className="dreport-detail"
            aria-live="polite"
            aria-label={`Chi tiết doanh nghiệp thuộc ${activeGroup.name}`}
          >
          <Card
            title={`Doanh nghiệp thuộc ${activeGroup.name}`}
            unit={unit}
            actions={
              <label className="dsearch dhead-search">
                <span className="sr-only">Tìm doanh nghiệp</span>
                <input
                  type="search"
                  placeholder="Tìm mã hoặc tên doanh nghiệp"
                  value={enterpriseQuery}
                  onChange={(e) => setEnterpriseQuery(e.target.value)}
                />
              </label>
            }
          >
            <EnterpriseTable
              rows={data.enterprises[activeGroup.id] ?? []}
              unit={unit}
              query={enterpriseQuery}
              groupName={activeGroup.name}
            />
          </Card>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Trang chi tiết của một nhóm, cho khổ hẹp.
 *
 * Là một TRANG, không phải một khối nữa xếp dưới bảng: nó thay chỗ của tổng
 * quan, mở đầu bằng thanh quay lại ghi rõ quay về đâu, rồi mới tới nội dung.
 * Thiếu thanh đó thì người dùng mở một nhóm xong không biết mình đang ở đâu và
 * cũng không biết đường ra.
 */
function TrangChiTiet({
  nhom,
  rows,
  unit,
  dimensionName,
  query,
  onQuery,
  onBack,
}: {
  nhom: EnterpriseGroupRow;
  rows: EnterpriseManagementData["enterprises"][string];
  unit: MoneyScale;
  dimensionName: string;
  query: string;
  onQuery: (value: string) => void;
  onBack: () => void;
}) {
  const cham = useRef<{ x: number; y: number } | null>(null);
  /**
   * Cử chỉ vuốt chỉ dành cho ngón tay, KHÔNG dành cho mọi khổ hẹp.
   *
   * Bề rộng nói về CHỖ, con trỏ nói về CÁCH CHẠM VÀO. Một iframe 500px trên màn
   * hình máy bàn vẫn là chuột và bàn phím: đo được `pointer: fine`,
   * `hover: hover`. Bày dòng "Vuốt sang trái" ở đó là chỉ cho người ta một thao
   * tác họ không làm được, và che mất nút quay lại mà họ làm được.
   *
   * Chế độ xem thử mobile cũng bật, vì nó tồn tại để cho thấy người dùng điện
   * thoại nhìn thấy gì — ẩn đi thì bản xem thử nói dối về bản thật.
   */
  const camUng = useTouch();
  const { host } = useHostContext();
  const vuotDuoc = camUng || host.source === "mobile";
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, [nhom.id]);
  return (
    <section
      className="dtrang"
      aria-label={`Doanh nghiệp thuộc ${nhom.name}`}
      onTouchStart={(event) => {
        const t = event.touches[0];
        cham.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(event) => {
        const dau = cham.current;
        cham.current = null;
        if (!dau) return;
        const t = event.changedTouches[0];
        const dx = t.clientX - dau.x;
        const dy = t.clientY - dau.y;
        /*
          Chỉ nhận vuốt sang TRÁI.
          Vuốt sang phải từ mép trái là cử chỉ quay lại của chính trình duyệt và
          hệ điều hành — đo thử thì nó rời hẳn ứng dụng, URL thành `about:blank`.
          Bắt thêm chiều đó vừa thừa vừa không chặn nổi cử chỉ của nền tảng.

          Ngưỡng 70px và phải ngang hơn dọc gấp rưỡi, để cuộn dọc — thao tác
          thường gặp nhất trên trang này — không bị tính nhầm thành vuốt.
        */
        if (vuotDuoc && dx < -70 && Math.abs(dx) > Math.abs(dy) * 1.5) onBack();
      }}
    >
      <div className="dtrang-nav">
        <button type="button" className="dtrang-back" onClick={onBack}>
          <span aria-hidden="true">‹</span> {dimensionName}
        </button>
        {vuotDuoc && <p>Vuốt sang trái để quay lại</p>}
      </div>

      <h2 className="dtrang-ten" ref={heading} tabIndex={-1}>{nhom.name}</h2>
      <p className="dtrang-so">
        <strong>
          <Money value={nhom.amount} scale={unit} />
        </strong>
        <span>
          {pct(nhom.share)} tổng thu · {nhom.enterpriseCount.toLocaleString("vi-VN")} doanh nghiệp
        </span>
      </p>

      <Card
        title="Doanh nghiệp trong nhóm"
        unit={unit}
        actions={
          <label className="dsearch dhead-search">
            <span className="sr-only">Tìm doanh nghiệp</span>
            <input
              type="search"
              placeholder="Tìm mã hoặc tên doanh nghiệp"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
            />
          </label>
        }
      >
        <EnterpriseTable rows={rows} unit={unit} query={query} groupName={nhom.name} />
      </Card>
    </section>
  );
}
