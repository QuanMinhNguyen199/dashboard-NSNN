import type { ReactNode } from "react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { SOURCES, SOURCE_BY_CODE, type DomesticGroupId, type SourceCode } from "@/domain/catalog";
import { useRevenueAnalysis } from "@/data/hooks";
import type { AmountRow, RevenueAnalysisData, RevenueGroupRow, TaxpayerRow, TrendPoint } from "@/domain/types";
import { useDashboardState } from "@/state/DashboardState";
import { GridRows } from "@/components/Grid";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { DonutChart } from "@/components/charts";
import { TaxpayerDrawer } from "@/components/TaxpayerDrawer";
import { topNguoiNopThue } from "@/data/mock/build";
import {
  Bars,
  Card,
  Change,
  Money,
  money,
  ResourceView,
  inScale,
  moneyScale,
  pct,
  Segmented,
} from "@/components/primitives";

/** Sub-navigation của workspace phân tích thu. */
/**
 * BA phần, đúng đặc tả nguồn — không phải bốn.
 *
 * `dac-ta-v2` §1: "Tab 2 · Phân tích thu · ① Thu nội địa · ② Thu XNK · ③ Thu
 * khác", và §3.3 ghi thẳng: "Panel Thu dầu thô (KHÔNG có phần riêng ở Tab 2)".
 * Dầu thô xem tại chỗ bằng drawer ở Tổng quan.
 *
 * Lý do của đặc tả đứng vững: dầu thô chỉ có 2 khoản, `cityOnly`, thu điều tiết
 * trung ương không phân bổ theo phường xã. Mở nó thành một phần đầy đủ nghĩa là
 * dựng "Bảng chi tiết 21 khoản", "Đóng góp theo địa bàn 10 phường xã" và
 * "Biến động trong nhóm" cho một nguồn hai dòng, không có địa bàn — phần lớn
 * widget sẽ rỗng hoặc vô nghĩa.
 *
 * Dầu thô vẫn nằm trong `SOURCES`: thẻ Cơ cấu nguồn thu ở Tổng quan phải đủ
 * BỐN dòng theo §3.3, và tab So sánh nâng cao vẫn so được nó.
 */
const SECTIONS: { id: SourceCode; label: string }[] = [
  { id: "domestic", label: "Thu nội địa không kể dầu thô" },
  { id: "import-export", label: "Thu xuất nhập khẩu" },
  { id: "other", label: "Thu khác" },
];

/** Nguồn có phần riêng ở tab này — một nguồn sự thật cho cả drawer ở Tổng quan. */
export const ANALYSIS_SOURCES: SourceCode[] = SECTIONS.map((s) => s.id);

export function RevenueAnalysisTab() {
  const { filters, section, setSection } = useDashboardState();
  const scope = SECTIONS.some((s) => s.id === section) ? section : "domestic";
  const { resource, retry } = useRevenueAnalysis(filters, scope);

  // Deep-link cũ tới nguồn không còn nằm trong đặc tả được đưa về mục mặc định,
  // để URL và nội dung đang hiển thị không lệch nhau.
  useEffect(() => {
    if (section !== scope) setSection(scope);
  }, [section, scope, setSection]);

  return (
    <>
      <nav className="dsubnav" aria-label="Nhóm nguồn thu">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={scope === item.id ? "page" : undefined}
            className={scope === item.id ? "is-active" : undefined}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <ResourceView resource={resource} retry={retry} minHeight={420}>
        {(data) => <AnalysisBody data={data} />}
      </ResourceView>
    </>
  );
}

function AnalysisBody({ data }: { data: RevenueAnalysisData }) {
  const { filters, group, setGroup, setFilters, dispatchIntent } = useDashboardState();
  const source = SOURCE_BY_CODE[data.scope];
  const sourceLabel = data.scope === "domestic" ? source.name : source.shortName;
  const kpi = data.kpis.total;
  const lockedToIndustry = Boolean(filters.industry);
  const selectedGroup = lockedToIndustry
    ? data.groups?.find((row) => row.id === "sxkd")
    : data.groups?.find((row) => row.id === group) ?? data.groups?.[0];
  const [detailMode, setDetailMode] = useState<"tax" | "office" | "industry">("tax");
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<TaxpayerRow | null>(null);
  const [heatSelection, setHeatSelection] = useState<{ industry: string; tax: string; amount: number } | null>(null);
  /*
    Cơ sở phân rã của khối đang mở: theo khối kinh tế hay theo sắc thuế.

    Đổi CẢ HAI cột cùng lúc, không riêng danh sách bên trái — hai cột đang
    nói về cùng một tổng, để chúng cắt theo hai chiều khác nhau là bày ra hai
    bảng không cộng được với nhau mà không nói lý do.
  */
  const [coSo, setCoSo] = useState<"khoi" | "sac-thue">("khoi");
  /*
    Bảng Top doanh nghiệp phải ĐỔI THẬT khi bấm một ô của lưới nhiệt.

    Bản trước chỉ đổi phụ đề thành "Bất động sản · TNDN" còn mười dòng bên
    dưới giữ nguyên — màn hình khẳng định một phép lọc đã xảy ra trong khi nó
    chưa xảy ra. Đó tệ hơn là không làm gì cả.

    Danh sách được sinh lại tất định từ chính ô đó: hạt giống là cặp ngành × sắc
    thuế, tổng là số tiền của ô, nên bấm hai ô khác nhau cho hai danh sách khác
    nhau và bấm lại cùng một ô luôn cho cùng kết quả.
  */
  const taxpayerRows = useMemo(() => {
    if (!heatSelection) return data.topTaxpayers.rows.slice(0, 10);
    return topNguoiNopThue(
      `heat|${heatSelection.industry}|${heatSelection.tax}`,
      heatSelection.amount,
      heatSelection.industry,
    ).rows.slice(0, 10);
  }, [data.topTaxpayers.rows, heatSelection]);

  /** Có nút chuyển hay không do DỮ LIỆU quyết định, không phải một danh sách mã ở đây. */
  const sacThue = selectedGroup?.taxItems ?? null;
  const coSoDung: "khoi" | "sac-thue" = sacThue ? coSo : "khoi";
  const khoanCuaKhoi = coSoDung === "sac-thue" && sacThue ? sacThue : (selectedGroup?.items ?? []);

  const inspectorRows = useMemo(() => {
    // Mẫu số là tổng của KHỐI đang mở; không còn trạng thái "một khoản đang chọn".
    const total = selectedGroup?.amount ?? kpi.amount;
    if (detailMode === "office") return rescaleRows(data.byTaxOffice, total).slice(0, 10);
    if (detailMode === "industry") return rescaleRows(data.byIndustry, total).slice(0, 10);
    /*
      Luôn trả ĐỦ các khoản của khối, không có nhánh "một khoản".

      Chọn một khoản rồi bảng còn đúng một dòng, mà số tiền, tỷ trọng và
      tăng trưởng của dòng đó đã nằm sẵn ở thẻ bên trái — đổi cả một thẻ cao
      gần 700px lấy hai con số mới. Giá trị thật của thẻ này nằm ở ba chế độ
      Sắc thuế / Đơn vị CQT / Ngành nghề: ba cách cắt khác hẳn bên trái.
    */
    return khoanCuaKhoi.length ? khoanCuaKhoi : data.breakdown;
  }, [data.breakdown, data.byIndustry, data.byTaxOffice, detailMode, khoanCuaKhoi, kpi.amount, selectedGroup]);

  return (
    <>
      <KpiStrip label={`Chỉ số ${sourceLabel}`} columns={3}>
        <Kpi
          label={`${sourceLabel} trong kỳ`}
          note={<><Change current={kpi.amount} previous={kpi.previous} label="" /> so cùng kỳ</>}
        >
          <Money value={kpi.amount} />
        </Kpi>
        <Kpi label="Tỷ trọng trên tổng thu" note="Trên cùng chỉ tiêu và cấp ngân sách đang lọc">
          {pct(data.kpis.share)}
        </Kpi>
        <Kpi label={filters.accumulation === "YTD" ? "% tiến độ dự toán" : "% hoàn thành kế hoạch tháng"} note={data.estimate ? `Dự toán năm ${money(data.estimate.annual)}` : "Chưa có dữ liệu dự toán"}>{data.estimate?.progress == null ? "—" : pct(data.estimate.progress * 100)}</Kpi>
      </KpiStrip>

      <Card title={`Xu hướng và nhịp độ ${sourceLabel.toLowerCase()}`} subtitle="Cột: phát sinh tháng · Đường: lũy kế năm nay và cùng kỳ">
        <RevenueComboChart monthly={data.monthlyTrend} cumulative={data.cumulativeTrend} year={filters.year} onSelectMonth={(period) => setFilters({ periodType: "MONTH", period, accumulation: "PERIOD" })} />
      </Card>

      {data.groups ? <section className="drevenue-master-detail" aria-label="Bóc tách cơ cấu thu nội địa">
        <Card title="Cơ cấu 3 nhóm thu nội địa" subtitle={lockedToIndustry ? "Ngành nghề chỉ áp cho Khối doanh nghiệp, nên hai khối còn lại đang khoá" : "Chọn một khối để điều khiển bảng bên cạnh"}>
          {/*
            Khối bị khoá được KHAI BÁO, không phải chặn lúc bấm.

            Bản trước `return` ngay trong `onSelect`, nên hai lát kia vẫn mang
            `role="button"`, vẫn sáng khi rê chuột và vẫn đổi con trỏ — bấm thì
            không có gì xảy ra và không có gì trên màn hình nói tại sao.
          */}
          <DomesticGroupStructure
            groups={data.groups}
            selected={selectedGroup}
            disabledIds={lockedToIndustry ? data.groups.filter((g) => g.id !== "sxkd").map((g) => g.id) : []}
            onSelect={(id) => setGroup(id as DomesticGroupId)}
            rows={khoanCuaKhoi}
            note={
              coSoDung === "sac-thue"
                ? `${khoanCuaKhoi.length} sắc thuế · số mô phỏng, cộng lại bằng đúng tổng khối.`
                : `Đủ cả ${khoanCuaKhoi.length} khoản của nhóm.`
            }
            basisControl={
              /* Nút chỉ hiện ở khối CÓ chiều sắc thuế. Hai khối kia không có gì
                 để chuyển sang, nên bày một nút xám ở đó là thêm một thứ phải giải mã. */
              sacThue ? (
                <Segmented
                  label="Cơ sở phân rã khối"
                  value={coSoDung}
                  options={[
                    { value: "khoi" as const, label: "Khối kinh tế" },
                    { value: "sac-thue" as const, label: "Sắc thuế" },
                  ]}
                  onChange={setCoSo}
                />
              ) : null
            }
          />
        </Card>
        <Card title="Chi tiết chỉ tiêu đang chọn" subtitle={`Đang phân tích: ${selectedGroup?.name ?? sourceLabel}${coSoDung === "sac-thue" ? " · theo sắc thuế" : ""}`} actions={<Segmented label="Góc nhìn chi tiết" value={detailMode} options={[{ value: "tax", label: "Sắc thuế" }, { value: "office", label: "Đơn vị CQT" }, { value: "industry", label: "Ngành nghề" }]} onChange={setDetailMode} />}>
          <InspectorTable rows={inspectorRows} />
        </Card>
      </section> : <GridRows rows={[
        [{ id: "breakdown", span: 8, render: () => <BreakdownTable data={data} /> }, { id: "location", span: 4, hidden: !data.byLocation.length, render: () => <Card title="Đóng góp theo địa bàn" subtitle="10 phường, xã đóng góp nhiều nhất" unit={moneyScale(data.byLocation.map((row) => row.amount))}><Bars rows={data.byLocation} onSelect={(row) => dispatchIntent({ type: "OPEN_LOCATION_DETAIL", locationId: row.id })} /></Card> }],
        [{ id: "net", span: 12, hidden: !data.netReconciliation, render: () => <NetReconciliation data={data} /> }],
      ]} />}

      {data.scope === "domestic" && <section className="drevenue-drivers" aria-label="Động lực ngành nghề và doanh nghiệp">
        {/* Nhãn mô phỏng là BẮT BUỘC ở thẻ này: cả hai chiều đều là số suy ra.
            Chiều ngành chia tỷ lệ từ tổng thật, còn chiều sắc thuế thì dùng BỐN
            HỆ SỐ CỐ ĐỊNH giống hệt nhau cho mọi ngành. Thẻ bên cạnh có nhãn
            trong phụ đề của riêng nó, không che được cho thẻ này. */}
        <Card title="Ngành nghề × sắc thuế chủ lực" subtitle="Chọn một ô để lọc danh sách doanh nghiệp bên cạnh" actions={<span className="dtag is-review">Số mô phỏng</span>}>
          <IndustryHeatmap rows={data.byIndustry.slice(0, 6)} selected={heatSelection} onSelect={setHeatSelection} />
        </Card>
        <Card
          title="Top doanh nghiệp nộp thuế"
          subtitle={
            heatSelection
              ? `${heatSelection.industry} · ${heatSelection.tax} · dữ liệu mô phỏng`
              : "10 doanh nghiệp đóng góp lớn nhất · dữ liệu mô phỏng"
          }
          unit={moneyScale(taxpayerRows.map((row) => row.amount))}
          actions={
            heatSelection ? (
              <button type="button" className="dlink" onClick={() => setHeatSelection(null)}>
                Bỏ lọc ô
              </button>
            ) : undefined
          }
        >
          <TaxpayerTable rows={taxpayerRows} onSelect={setSelectedTaxpayer} />
        </Card>
      </section>}
      <TaxpayerDrawer row={selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </>
  );
}

function rescaleRows(rows: AmountRow[], total: number): AmountRow[] {
  const sourceTotal = rows.reduce((sum, row) => sum + row.amount, 0) || 1;
  return rows.map((row) => {
    const amount = Math.round(total * row.amount / sourceTotal);
    const previous = row.previous === null ? null : Math.round(total * row.previous / sourceTotal);
    return { ...row, amount, previous, share: total > 0 ? amount / total * 100 : null };
  });
}

/** Mốc trục là số TRÒN trong đơn vị đang hiển thị, không phải đỉnh chia bốn. */
function mocTruc(dinh: number, divisor: number, soBuoc = 4) {
  const tho = dinh / soBuoc / divisor;
  const bac = 10 ** Math.floor(Math.log10(Math.max(tho, 1e-9)));
  const buoc = ((([1, 2, 2.5, 5, 10].find((m) => bac * m >= tho) ?? 10) * bac)) * divisor;
  const tran = Math.max(Math.ceil(dinh / buoc) * buoc, buoc);
  return {
    tran,
    mocs: Array.from({ length: Math.round(tran / buoc) + 1 }, (_, i) => i * buoc).reverse(),
  };
}

/**
 * Combo chart đúng đặc tả: cột phát sinh tháng và hai đường lũy kế nằm trong
 * cùng một vùng vẽ. Hai trục Y được ghi rõ ở hai mép để người đọc không so
 * trực tiếp chiều cao của hai đại lượng có quy mô khác nhau.
 */
function RevenueComboChart({ monthly, cumulative, year, onSelectMonth }: {
  monthly: TrendPoint[];
  cumulative: TrendPoint[];
  year: number;
  onSelectMonth: (month: number) => void;
}) {
  const giaTriThang = monthly.map((p) => p.current ?? 0);
  const giaTriLuyKe = cumulative.flatMap((p) => [p.current ?? 0, p.previous ?? 0]);
  const unit = moneyScale([...giaTriThang, ...giaTriLuyKe]);

  // Ba bước giúp các mốc tròn và giữ cột tháng đủ cao để đọc.
  const lk = mocTruc(Math.max(...giaTriLuyKe, 1), unit.divisor, 3);
  const th = mocTruc(Math.max(...giaTriThang, 1), unit.divisor, 3);
  const ticks = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3;
    return {
      ratio,
      monthly: th.tran * ratio,
      cumulative: lk.tran * ratio,
    };
  });

  const line = (key: "current" | "previous") => cumulative
    .map((point, index) => {
      const value = point[key];
      if (value === null) return null;
      /*
        X nằm giữa Ô THÁNG, không phải `index / 11`.

        Lưới cột chia 12 ô đều và đặt cột ở tâm ô, tức (i + 0,5) / 12.
        Vì vậy điểm đường của mỗi tháng nằm đúng giữa cột tương ứng.
      */
      return `${((index + 0.5) / 12) * 100},${100 - (value / lk.tran) * 100}`;
    })
    .filter(Boolean).join(" ");

  return <section
    className="drevenue-combo"
    aria-label={`Biểu đồ kết hợp phát sinh tháng và lũy kế, đơn vị ${unit.unit}`}
  >
    <div className="drevenue-combo-inner">
      <div className="drevenue-combo-head">
        <span className="drevenue-combo-axis-title">Phát sinh tháng · {unit.short}</span>
        <span className="drevenue-combo-keys" aria-hidden="true">
          <span><i className="is-monthly" />Phát sinh tháng</span>
          <span><i className="is-current" />Lũy kế {year}</span>
          <span><i className="is-previous" />Cùng kỳ {year - 1}</span>
        </span>
        <span className="drevenue-combo-axis-title is-right">Lũy kế · {unit.short}</span>
      </div>

      <div className="drevenue-combo-plot">
        <div className="drevenue-combo-axis" aria-hidden="true">
          {ticks.map(({ ratio, monthly: monthlyTick, cumulative: cumulativeTick }) => (
            <span key={ratio} style={{ bottom: `${ratio * 100}%` }}>
              <b>{inScale(monthlyTick, unit)}</b>
              <i />
              <em>{inScale(cumulativeTick, unit)}</em>
            </span>
          ))}
        </div>

        <div className="drevenue-combo-bars">
          {monthly.map((point) => (
            <button
              key={point.month}
              type="button"
              disabled={point.current === null}
              onClick={() => onSelectMonth(point.month)}
              title={`${point.label}: ${point.current === null ? "chưa có số liệu" : `${inScale(point.current, unit)} ${unit.short}`}`}
            >
              {point.current !== null && (
                <i style={{ height: `${Math.max((point.current / th.tran) * 100, 1)}%` }} />
              )}
              <span>{point.label}</span>
            </button>
          ))}
        </div>

      <div className="drevenue-combo-area">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline className="is-previous" points={line("previous")} />
          <polyline className="is-current" points={line("current")} />
        </svg>
      </div>
      </div>
    </div>
  </section>;
}

function InspectorTable({ rows }: { rows: AmountRow[] }) {
  const unit = moneyScale(rows.flatMap((row) => [row.amount, row.previous, row.amount - (row.previous ?? 0)]));
  return <div className="dtable-wrap"><table className="dtable dinspector-finance"><thead><tr><th>Khoản mục / Đối tượng</th><th className="is-num">Kỳ này</th><th className="is-num">Cùng kỳ</th><th className="is-num">Chênh lệch</th><th className="is-num">Tăng trưởng</th><th className="is-num">Tỷ trọng</th></tr></thead><tbody>{rows.map((row) => {
    const delta = row.amount - (row.previous ?? 0);
    return <tr key={row.id}><th scope="row">{row.name}</th><td className="is-num" data-label="Kỳ này">{inScale(row.amount, unit)}</td><td className="is-num" data-label="Cùng kỳ">{row.previous === null ? "—" : inScale(row.previous, unit)}</td><td className={`is-num ${delta >= 0 ? "tone-pos" : "tone-neg"}`} data-label="Chênh lệch">{row.previous === null ? "—" : `${delta >= 0 ? "+" : "−"}${inScale(Math.abs(delta), unit)}`}</td><td className="is-num" data-label="Tăng trưởng"><Change current={row.amount} previous={row.previous} /></td><td className="is-num" data-label="Tỷ trọng"><span className="dshare-cell"><i><em style={{ width: `${Math.max(Math.min(row.share ?? 0, 100), 0)}%` }} /></i>{pct(row.share)}</span></td></tr>;
  })}</tbody></table></div>;
}

const HEAT_TAXES = ["GTGT", "TNDN", "TTĐB", "Tiền thuê đất"];

function IndustryHeatmap({ rows, selected, onSelect }: {
  rows: AmountRow[];
  selected: { industry: string; tax: string } | null;
  onSelect: (value: { industry: string; tax: string; amount: number }) => void;
}) {
  const ratios = [0.38, 0.42, 0.08, 0.12];
  const max = Math.max(...rows.flatMap((row) => ratios.map((ratio) => row.amount * ratio)), 1);
  const unit = moneyScale([max]);
  return <div className="dheatmap" style={{ /* San 190px chu khong phai 150px: nhan dai nhat cua danh muc nganh la
          "Tai chinh, Ngan hang, Bao hiem" - do duoc 178px chu + 8px dem. San 150
          cho cot 159px nen no thieu 19px va bi cat cut. */
        gridTemplateColumns: `minmax(190px, 1.6fr) repeat(${HEAT_TAXES.length}, minmax(68px, 1fr))` }}>
    <span />{HEAT_TAXES.map((tax) => <b key={tax}>{tax}</b>)}
    {rows.map((row) => <div className="dheatmap-row" key={row.id} style={{ display: "contents" }}><strong title={row.name}><span>{row.name}</span></strong>{HEAT_TAXES.map((tax, index) => {
      const amount = row.amount * ratios[index];
      const active = selected?.industry === row.name && selected.tax === tax;
      return <button key={tax} type="button" className={active ? "is-active" : undefined} onClick={() => onSelect({ industry: row.name, tax, amount })} style={{ "--heat": Math.max(amount / max, 0.08) } as CSSProperties}><span>{inScale(amount, unit)}</span></button>;
    })}</div>)}
  </div>;
}

function TaxpayerTable({ rows, onSelect }: { rows: TaxpayerRow[]; onSelect: (row: TaxpayerRow) => void }) {
  const unit = moneyScale(rows.map((row) => row.amount));
  /*
    Mỗi đầu cột tự khai VAI TRÒ của mình.

    Không khai thì bảng rơi vào luật chung `.dtable th:first-child { width: 36% }`
    — luật đó viết cho bảng có cột đầu là TÊN khoản thu. Ở đây cột đầu là STT,
    nên một con số một chữ số chiếm 305px trong khi sáu cột còn lại chia đều
    90px, và tên doanh nghiệp phải xuống ba dòng.
  */
  return <div className="dtable-wrap"><table className="dtable dtaxpayer-table"><thead><tr><th className="dcol-rank">STT</th><th className="dcol-code">Mã hiển thị</th><th>Người nộp thuế</th><th className="dcol-meta">Ngành nghề chính</th><th className="dcol-office">Đơn vị quản lý</th><th className="is-num dcol-money">Số đã nộp</th><th className="is-num dcol-pct">Tỷ trọng</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id} onClick={() => onSelect(row)}><td className="dcol-rank" data-label="STT">{index + 1}</td><td className="dcol-code" data-label="Mã hiển thị"><button type="button" className="dlink" onClick={(event) => { event.stopPropagation(); onSelect(row); }}>{row.displayCode}</button></td><th scope="row" title={row.name}>{row.name}</th><td className="dcol-meta" data-label="Ngành nghề chính" title={row.industry}>{row.industry}</td><td className="dcol-office" data-label="Đơn vị quản lý" title={row.taxOffice}>{row.taxOffice}</td><td className="is-num dcol-money" data-label="Số đã nộp">{inScale(row.amount, unit)}</td><td className="is-num dcol-pct" data-label="Tỷ trọng">{pct(row.share)}</td></tr>)}</tbody></table></div>;
}

function DomesticGroupStructure({
  groups,
  selected,
  onSelect,
  disabledIds = [],
  rows,
  note,
  basisControl,
}: {
  groups: RevenueGroupRow[];
  selected?: RevenueGroupRow;
  onSelect: (id: string) => void;
  disabledIds?: readonly string[];
  /** Các khoản của khối theo cơ sở phân rã đang chọn. */
  rows: AmountRow[];
  note: string;
  /** Nút chuyển cơ sở; `null` ở khối không có chiều sắc thuế riêng. */
  basisControl: ReactNode;
}) {
  return (
    <div className="dgroup-analysis">
      <DonutChart
        rows={groups}
        centerLabel="Thu nội địa"
        selectedId={selected?.id}
        onSelect={onSelect}
        disabledIds={disabledIds}
      />
      {selected && (
        <div className="dgroup-detail">
          {/* Tieu de khoi va nut chuyen co so nam CUNG MOT HANG.
              Nut o hang rieng an them mot hang chieu cao ma khong noi them gi;
              no thuoc ve chinh tieu de nay, vi no doi cach doc cua ca khoi. */}
          <div className="dgroup-detail-head">
            <div className="dgroup-detail-title">
              <strong>{selected.name}</strong>
              {selected.meta && <span title={selected.meta}>{selected.meta}</span>}
            </div>
            {basisControl}
          </div>
          {/* Hiện ĐỦ các khoản của nhóm, cuộn khi dài.
              Bản trước cắt còn bốn để ba nhóm (4, 5 và 12 khoản) cho cùng một
              chiều cao thẻ — đổi lát donut mà thẻ không xê dịch. Vùng cuộn cao cố
              định giữ được đúng tính chất đó mà không giấu khoản nào: tám khoản
              còn lại của nhóm phí lệ phí trước đây phải đi tìm ở bảng khác. */}
          <div className="dgroup-items">
            <Bars rows={rows} showMoneyUnit />
          </div>
          <small>{note}</small>
        </div>
      )}
    </div>
  );
}

type SortKey = "name" | "amount" | "share" | "delta" | "pct";

/** Bảng đủ các khoản của nhóm, có tìm kiếm và sắp xếp mọi cột. */
function BreakdownTable({ data }: { data: RevenueAnalysisData }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "amount", desc: true });

  const rows = useMemo(() => {
    const normalise = (text: string) =>
      text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const needle = normalise(query.trim());
    const filtered = needle
      ? data.breakdown.filter((row) => normalise(row.name).includes(needle))
      : data.breakdown;

    const valueOf = (row: AmountRow): number | string => {
      switch (sort.key) {
        case "name":
          return row.name;
        case "share":
          return row.share ?? -Infinity;
        case "delta":
          return row.amount - (row.previous ?? 0);
        case "pct":
          return row.previous && row.previous > 0
            ? ((row.amount - row.previous) / row.previous) * 100
            : -Infinity;
        default:
          return row.amount;
      }
    };
    return [...filtered].sort((a, b) => {
      const x = valueOf(a);
      const y = valueOf(b);
      const cmp = typeof x === "string" ? String(x).localeCompare(String(y), "vi") : (x as number) - (y as number);
      return sort.desc ? -cmp : cmp;
    });
  }, [data.breakdown, query, sort]);

  // Ba cột tiền dùng CHUNG một thang, tính trên cả ba: nếu mỗi cột một đơn vị
  // thì không đọc được "kỳ này so kỳ trước" theo hàng ngang.
  const unit = useMemo(
    () =>
      moneyScale(
        data.breakdown.flatMap((row) => [row.amount, row.previous, row.amount - (row.previous ?? 0)]),
      ),
    [data.breakdown],
  );

  const header = (key: SortKey, label: string, numeric = true) => (
    <th scope="col" className={numeric ? "is-num" : undefined} aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : "none"}>
      <button
        type="button"
        className="dsort"
        onClick={() => setSort((current) => ({ key, desc: current.key === key ? !current.desc : true }))}
      >
        {label}
        <span aria-hidden="true">{sort.key === key ? (sort.desc ? " ↓" : " ↑") : ""}</span>
      </button>
    </th>
  );

  return (
    <Card
      title="Bảng chi tiết"
      subtitle={`${data.breakdown.length} khoản trong nhóm${data.scope === "domestic" ? " · đúng 21 khoản nội địa" : ""}`}
      unit={unit}
      actions={
        <label className="dsearch dhead-search">
          <span className="sr-only">Tìm khoản thu</span>
          <input
            type="search"
            value={query}
            placeholder="Tìm khoản thu…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      }
    >
      <div className="dtable-wrap">
        <table className="dtable is-breakdown">
          <thead>
            <tr>
              {header("name", "Khoản thu", false)}
              {header("amount", "Kỳ này")}
              <th scope="col" className="is-num">Cùng kỳ</th>
              {header("delta", "Chênh lệch")}
              {header("pct", "±%")}
              {header("share", "Tỷ trọng")}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const delta = row.amount - (row.previous ?? 0);
              return (
                <tr key={row.id}>
                  <th scope="row">{row.name}</th>
                  <td className="is-num">{inScale(row.amount, unit)}</td>
                  <td className="is-num">
                    {row.previous === null ? "chưa có" : inScale(row.previous, unit)}
                  </td>
                  <td className={`is-num ${delta >= 0 ? "tone-pos" : "tone-neg"}`}>
                    {delta >= 0 ? "+" : "−"}
                    {inScale(Math.abs(delta), unit)}
                  </td>
                  <td className="is-num">
                    <Change current={row.amount} previous={row.previous} />
                  </td>
                  <td className="is-num">{pct(row.share)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="dempty">
                  Không có khoản thu nào khớp “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Chỉ nhóm XNK: tổng gộp − các dòng hoàn = thu ròng, đối chiếu được từng dòng. */
function NetReconciliation({ data }: { data: RevenueAnalysisData }) {
  const net = data.netReconciliation!;
  const unit = moneyScale([net.gross, net.net, ...net.deductions.map((row) => row.amount)]);
  return (
    <Card
      title="Đối chiếu thu ròng"
      subtitle="Tổng gộp trừ các khoản hoàn và khấu trừ"
      unit={unit}
    >
      <ul className="dledger">
        <li>
          <span>Tổng bảy khoản gộp</span>
          <strong>{inScale(net.gross, unit)}</strong>
        </li>
        {net.deductions.map((row) => (
          <li key={row.id}>
            <span>{row.name}</span>
            <strong className="tone-neg">{inScale(row.amount, unit)}</strong>
          </li>
        ))}
        <li className="is-total">
          <span>Thu cân đối ròng</span>
          <strong>{inScale(net.net, unit)}</strong>
        </li>
      </ul>
    </Card>
  );
}

export { SOURCES };
