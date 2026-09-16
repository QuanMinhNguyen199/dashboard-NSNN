import { useEffect, useMemo, useRef, useState } from "react";
import { useTmsBreakdown } from "@/data/hooks";
import type { ManagementLevelFilter } from "@/domain/tms";
import type { TmsBreakdownData, TmsRow } from "@/domain/types";
import { useDashboardState } from "@/state/DashboardState";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { Bars, Card, Change, ResourceView, moneyScale, pct } from "@/components/primitives";
import { DonutChart } from "@/components/charts";
import { useNarrow } from "@/components/useNarrow";
import { LevelFilter } from "./LevelFilter";
import { Amount, CodeTable, SectionTable, UNKNOWN_SECTION } from "./TmsTables";
import { CorrespondencePanel, QualityPanel } from "./TmsPanels";

/**
 * Tab Mã hạch toán: Cấp quản lý → Mục → Tiểu mục.
 *
 * Cấp quản lý là một **bộ lọc**, không phải bậc trên cùng của một cây danh mục.
 * Chương không xuất hiện như một bước chọn — 104 mã là quá nhiều cho một bước, và
 * quan hệ cha con duy nhất trong danh mục là Tiểu mục thuộc Mục.
 *
 * Số ở tầng Chương/Mục/Tiểu mục là **số mô phỏng**: điều kiện báo cáo nói mã nào
 * đủ điều kiện, không nói mã nào chiếm bao nhiêu, và giao dịch thật chưa được
 * bàn giao. Nhãn ở dòng phạm vi nói điều đó, và nó tự biến mất khi provider trả
 * `origin: "api"` — giao diện không phải sửa dòng nào.
 */
export function TmsBreakdownTab() {
  const { filters, location, managementLevel, setManagementLevel } = useDashboardState();
  // Địa bàn là chiều độc lập với cấp quản lý, nhưng vẫn là một bộ lọc thật: bỏ
  // qua nó thì thanh lọc nói một phường còn bảng trả số toàn thành phố.
  const { resource, retry, pending } = useTmsBreakdown(filters, managementLevel, location);

  return (
    <div className="dstack">
      <LevelFilter value={managementLevel} onChange={setManagementLevel} />
      <ResourceView resource={resource} retry={retry} minHeight={320} pending={pending}>
        {(data) => <TmsBody data={data} level={managementLevel} />}
      </ResourceView>
    </div>
  );
}

/**
 * Lọc các dòng đã có số để đưa vào biểu đồ.
 *
 * `Bars` vẽ theo `amount: number`. Dòng chưa có số không vẽ được — và cũng không
 * nên vẽ thành cột rỗng, vì cột rỗng đọc thành "bằng 0".
 */
const asAmountRows = (rows: TmsRow[]) =>
  rows
    .filter((row): row is TmsRow & { amount: number } => row.amount !== null)
    .map((row) => ({ id: row.id, name: row.name, amount: row.amount, previous: row.previous, share: row.share, meta: row.meta }));

function TmsBody({ data, level }: { data: TmsBreakdownData; level: ManagementLevelFilter }) {
  const narrow = useNarrow();
  const [open, setOpen] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [dropped, setDropped] = useState<number>(0);
  const previousLevel = useRef(level);

  const sectionIds = useMemo(() => new Set(data.sections.map((row) => row.id)), [data.sections]);

  /**
   * Đổi cấp thì các Mục đang mở có thể không còn trong điều kiện của cấp mới.
   *
   * Đặc tả yêu cầu đặt lại lựa chọn không còn phù hợp **kèm thông báo**, chứ
   * không im lặng đóng. Đóng không báo thì người dùng tưởng mình bấm nhầm.
   */
  useEffect(() => {
    if (previousLevel.current === level) return;
    previousLevel.current = level;
    setOpen((current) => {
      const kept = current.filter((id) => sectionIds.has(id));
      setDropped(current.length - kept.length);
      return kept;
    });
  }, [level, sectionIds]);

  const toggle = (id: string) =>
    setOpen((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const subItemCount = data.sections.reduce((total, row) => total + row.subItems.length, 0);

  // Donut chỉ dùng khi tổng dương và mọi thành phần không âm; số âm thì một lát
  // trong hình tròn không có nghĩa hình học nào.
  const donutRows = useMemo(() => {
    const total = data.levelTotal.amount;
    if (total === null || total <= 0 || data.sections.some((row) => (row.amount ?? 0) < 0)) return null;
    const sorted = [...data.sections].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
    const top = sorted.slice(0, 5).map((row) => ({ ...row, amount: row.amount ?? 0 }));
    const rest = sorted.slice(5);
    const other = rest.reduce((sum, row) => sum + (row.amount ?? 0), 0);
    return other > 0
      ? [...top, { id: "khac", name: `Khác (${rest.length} Mục)`, amount: other, previous: null }]
      : top;
  }, [data.levelTotal.amount, data.sections]);

  const filteredChapters = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data.chapters.slice(0, narrow ? 6 : 12);
    return data.chapters.filter(
      (row) => row.id.includes(needle) || row.name.toLowerCase().includes(needle),
    );
  }, [data.chapters, narrow, query]);

  return (
    <>
      {/* Ở khổ hẹp thanh chọn cấp trong tab bị ẩn, nên dòng này là chỗ duy nhất
          nói người dùng đang đứng ở cấp nào. Giữ nguyên ở mọi khổ để hai bản
          không kể hai câu chuyện khác nhau về cùng một phạm vi. */}
      <h2 className="dsubject">
        {data.scopeName}
        <small>{data.levelTotal.name} · thu nội địa</small>
        {/* Nhãn theo dữ liệu, không theo trạng thái hôm nay: provider trả
            `origin: "api"` là nó tự biến mất. */}
        {data.origin === "mock" && (
          <span className="dtag is-review" title="Tỷ lệ giữa các Chương, Mục và Tiểu mục do lớp mô phỏng đặt ra; chưa có giao dịch TMS để tính.">
            Số mô phỏng
          </span>
        )}
      </h2>

      <KpiStrip label={`Mã hạch toán · ${data.levelTotal.name} · ${data.scopeName}`}>
        {/* Ô này chỉ có số khi xem tất cả các cấp. Chọn một cấp cụ thể thì nó
            trống, vì chia thu nội địa theo cấp quản lý của Chương là việc cần
            giao dịch — và chỗ trống nói điều đó rõ hơn bất kỳ câu nào. */}
        <Kpi
          label={`Thu trong ${data.levelTotal.name.toLowerCase()}`}
          note={
            data.levelTotal.amount === null ? undefined : (
              <>
                <Change current={data.levelTotal.amount} previous={data.levelTotal.previous} label="" /> so cùng kỳ
              </>
            )
          }
        >
          <Amount value={data.levelTotal.amount} />
        </Kpi>
        <Kpi
          label="Tỷ trọng trên tổng thu NSNN"
          note={
            data.nsnnTotal && data.levelTotal.share !== null
              ? `Mẫu số: ${data.scopeName.toLowerCase()} cùng kỳ, gồm cả nguồn ngoài phạm vi TMS`
              : undefined
          }
        >
          {data.levelTotal.share === null ? null : pct(data.levelTotal.share)}
        </Kpi>
        {/* Hai ô đếm này theo CẤP, không theo địa bàn — điều kiện báo cáo không
            đổi khi đổi phường. Đứng ngay dưới tên một phường mà không nói rõ thì
            người đọc tưởng chúng cũng đã được lọc, rồi thấy số không nhúc nhích
            và nghĩ màn hình bị hỏng. */}
        <Kpi label="Mục trong điều kiện" note="Trên 37 Mục; theo cấp quản lý, không đổi theo địa bàn">
          {data.sections.filter((row) => row.id !== UNKNOWN_SECTION).length}
        </Kpi>
        <Kpi label="Tiểu mục trong điều kiện" note="Theo cấp quản lý, không đổi theo địa bàn">
          {subItemCount}
        </Kpi>
      </KpiStrip>

      {dropped > 0 && (
        <p className="dnotice" role="status">
          Đã đóng {dropped} Mục không còn trong điều kiện của {data.levelTotal.name.toLowerCase()}. Kỳ, chỉ tiêu và
          địa bàn giữ nguyên.
        </p>
      )}

      <div className="dstack-row is-chart-pair">
        <Card
          title="Phân bố theo cấp quản lý"
          subtitle="Tỷ trọng tính trên toàn phạm vi TMS, không đổi theo cấp đang lọc"
          unit={moneyScale(data.levels.map((row) => row.amount ?? 0))}
        >
          <Bars rows={asAmountRows(data.levels)} scale="share" />
          {data.localLevels.length > 0 && (
            <div className="dtms-sublevels">
              <h3>Trong địa phương</h3>
              {/* Mẫu số là dòng địa phương, không phải toàn phạm vi: nếu không thì
                  ba cấp con và dòng cha cùng nằm trên một thang và cộng quá 100%. */}
              <Bars rows={asAmountRows(data.localLevels)} scale="share" />
            </div>
          )}
        </Card>
        <Card
          title="Cơ cấu theo Mục"
          subtitle={donutRows ? "5 Mục lớn nhất và phần còn lại" : "Có thành phần âm nên dùng bảng bên dưới"}
        >
          {donutRows ? (
            <DonutChart rows={donutRows} centerLabel="Mục" />
          ) : (
            <p className="dempty">
              Cơ cấu có thành phần âm nên không biểu diễn được bằng hình tròn. Bảng bên dưới giữ nguyên dấu.
            </p>
          )}
        </Card>
      </div>

      <Card
        title="Mục và Tiểu mục"
        subtitle="Mã nằm trong điều kiện báo cáo của cấp đang lọc. Nhóm chưa tra được Mục cha đứng đầu bảng."
      >
        <SectionTable sections={data.sections} open={open} onToggle={toggle} total={data.levelTotal.amount} />
      </Card>

      <Card
        title="Chương trong điều kiện"
        subtitle="Để tra cứu và lọc nâng cao; theo cấp quản lý, không đổi theo địa bàn"
        actions={
          <span className="dsearch">
            <input
              type="search"
              placeholder="Tìm mã hoặc tên Chương"
              aria-label="Tìm Chương"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </span>
        }
      >
        <CodeTable
          rows={filteredChapters}
          lastHeader="Cấp quản lý"
          caption="Chương trong điều kiện báo cáo"
          emptyText="Không có Chương nào khớp từ khoá."
        />
        {!query && data.chapters.length > filteredChapters.length && (
          <p className="dhint">
            Đang hiện {filteredChapters.length} trên {data.chapters.length} Chương trong điều kiện. Dùng ô tìm kiếm
            để mở phần còn lại.
          </p>
        )}
      </Card>

      <Card
        title="Cơ quan thuế"
        subtitle="Chiều riêng, không suy từ địa bàn hay cấp quản lý của Chương nên danh sách không đổi theo bộ lọc cấp"
      >
        <CodeTable
          rows={data.taxOffices}
          lastHeader=""
          caption="Cơ quan thuế quản lý chứng từ trong phạm vi"
          showAmount={false}
        />
        <p className="dhint">
          Bảng này là danh mục, không có cột số tiền: điều kiện báo cáo không nhắc tới cơ quan thuế, nên
          không có căn cứ nào để chia số theo chiều này, kể cả để mô phỏng. Nhóm cột theo cơ quan thuế là bốn
          trong tám mẫu báo cáo và cần giao dịch mang mã cơ quan thuế.
        </p>
      </Card>

      <CorrespondencePanel data={data} />
      <QualityPanel data={data} />
    </>
  );
}
