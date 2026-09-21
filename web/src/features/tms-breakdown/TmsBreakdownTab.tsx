import { useEffect, useMemo, useRef, useState } from "react";
import { useTmsBreakdown } from "@/data/hooks";
import type { ManagementLevelFilter } from "@/domain/tms";
import type { TmsBreakdownData, TmsRow } from "@/domain/types";
import { useDashboardState } from "@/state/DashboardState";
import { levelLabel, TAX_OFFICE_NAME } from "@/domain/tms";
import { Kpi, KpiStrip } from "@/components/Kpi";
import { Bars, Card, Change, LiveNotice, Money, moneyScale, pct, ResourceView } from "@/components/primitives";
import { DonutChart } from "@/components/charts";
import { useNarrow } from "@/components/useNarrow";
import { usePinned } from "@/components/usePinned";
import { LevelFilter } from "./LevelFilter";
import { CodeTable, SectionTable, UNKNOWN_SECTION } from "./TmsTables";
import { CorrespondencePanel, QualityPanel, TaxOfficeAssignedAreas } from "./TmsPanels";

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
  const { filters, location, managementLevel, taxOfficeCode, setManagementLevel, setLocationScope } = useDashboardState();
  // Màn này đi từ CQT xuống các địa bàn được phân công. Xoá phạm vi địa bàn cũ
  // khi đi từ tab khác sang để URL và thanh lọc không mô tả một chiều bị bỏ qua.
  useEffect(() => {
    if (location !== null) setLocationScope(null);
  }, [location, setLocationScope]);
  const { resource, retry, pending } = useTmsBreakdown(
    filters,
    managementLevel,
    null,
    taxOfficeCode,
  );

  /**
   * Tiêu đề phạm vi suy từ BỘ LỌC, không từ payload.
   *
   * Trước đây nó đọc `data.scopeName` và `data.levelTotal.name`, nên nó phải
   * nằm trong vùng tải — và mỗi lần đổi cấp thì biến mất cùng cả trang. Nhưng
   * hai giá trị đó chỉ là nhãn của chính hai bộ lọc người dùng vừa đặt: nguồn
   * sự thật là bộ lọc, không phải phản hồi mạng. Suy từ bộ lọc thì tiêu đề
   * không bao giờ nói sai, và không có lý do gì phải đợi.
   */
  const scopeName = taxOfficeCode ? (TAX_OFFICE_NAME[taxOfficeCode] ?? taxOfficeCode) : "Toàn thành phố";
  const levelName = levelLabel(managementLevel);
  /** Giữ số trước đó trong lúc tải lại để phạm vi địa bàn không giật. */
  const lastData =
    resource.status === "ready" || resource.status === "partial" ? resource.data : null;

  return (
    <div className="dstack">
      <LevelFilter value={managementLevel} onChange={setManagementLevel} />
      <TaxOfficeAssignedAreas
        data={lastData}
        selectedCode={taxOfficeCode}
      />

      <h2 className="dsubject">
        {scopeName}
        <small>{levelName} · tổng thu nội địa A theo TMS</small>
      </h2>

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
  const [showAllChapters, setShowAllChapters] = useState(false);
  const pinnedChapters = usePinned("chuong");
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

  const filteredChapters = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle)
      return data.chapters.filter(
        (row) => row.id.includes(needle) || row.name.toLowerCase().includes(needle),
      );
    // Mục đã ghim luôn nằm trong tập hiển thị, kể cả khi chưa mở hết danh sách:
    // ghim một mã rồi thu gọn lại mà nó biến mất thì nút ghim thành vô nghĩa.
    if (showAllChapters) return data.chapters;
    const head = data.chapters.slice(0, narrow ? 6 : 12);
    const extra = data.chapters.filter(
      (row) => pinnedChapters.has(row.id) && !head.includes(row),
    );
    return [...head, ...extra];
  }, [data.chapters, narrow, query, showAllChapters, pinnedChapters]);

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

  /** Mã đã ghim nhưng không còn trong điều kiện của kỳ và cấp đang xem. */
  const staleChapters = useMemo(() => {
    const present = new Set(data.chapters.map((row) => row.id));
    return pinnedChapters.ids.filter((id) => !present.has(id));
  }, [data.chapters, pinnedChapters.ids]);

  return (
    <>
      <KpiStrip columns={3} label={`Mã hạch toán · ${data.levelTotal.name} · ${data.scopeName}`}>
        {/* Tổng của cấp đang lọc: cộng đúng các cặp (Chương, Tiểu mục) có Chương
            thuộc cấp đó. Là một phần của cùng một tổng nên chọn cấp nào thì số
            này nhỏ hơn dòng phạm vi, và bốn cấp cộng lại bằng đúng dòng đó. */}
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
          {/* KPI là giá trị đứng một mình, không có đầu cột nào ghi hộ đơn vị. */}
          <Money value={data.levelTotal.amount} />
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
        {/* Số mã theo CẤP, không theo địa bàn — điều kiện báo cáo không
            đổi khi đổi phường. Đứng ngay dưới tên một phường mà không nói rõ thì
            người đọc tưởng chúng cũng đã được lọc, rồi thấy số không nhúc nhích
            và nghĩ màn hình bị hỏng. */}
        <Kpi label="Mã trong điều kiện" note="Theo cấp quản lý, không đổi theo địa bàn">
          {data.sections.filter((row) => row.id !== UNKNOWN_SECTION).length} Mục · {subItemCount} Tiểu mục
        </Kpi>
      </KpiStrip>

      <LiveNotice>
        {dropped > 0
          ? `Đã đóng ${dropped} Mục không còn trong điều kiện của ${data.levelTotal.name.toLowerCase()}. Kỳ, chỉ tiêu và địa bàn giữ nguyên.`
          : null}
      </LiveNotice>

      {/* Thẻ này đứng ngay dưới thanh chọn cấp vì nó là NGỮ CẢNH của chính thanh
          đó: nó nói mỗi cấp nắm bao nhiêu, tức là chọn cấp nào thì đang bỏ lại
          bao nhiêu. Ở vị trí cũ — sau ba bảng — người đọc đã chọn xong cấp từ
          lâu, nên con số đến quá muộn để đổi được quyết định nào. */}
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
        title="Mục và Tiểu mục"
        subtitle="Mã nằm trong điều kiện báo cáo của cấp đang lọc. Nhóm chưa tra được Mục cha đứng đầu bảng."
      >
        <SectionTable sections={data.sections} open={open} onToggle={toggle} total={data.levelTotal.amount} />
      </Card>

      {/* Đứng ngay dưới bảng Mục vì nó tóm tắt đúng bảng đó: hình cho biết Mục
          nào chiếm phần lớn, bảng cho biết chính xác bao nhiêu. Tách hai thứ ra
          xa nhau thì phải nhớ để so. */}
      <Card
        title="Cơ cấu theo Mục"
        subtitle={donutRows ? "5 Mục lớn nhất và phần còn lại" : "Có thành phần âm nên dùng bảng bên trên"}
      >
        {donutRows ? (
          <DonutChart rows={donutRows} centerLabel="Mục" />
        ) : (
          <p className="dempty">
            Cơ cấu có thành phần âm nên không biểu diễn được bằng hình tròn. Bảng bên trên giữ nguyên dấu.
          </p>
        )}
      </Card>

      <Card
        title="Chương trong điều kiện"
        subtitle="Để tra cứu và lọc nâng cao; theo cấp quản lý, không đổi theo địa bàn"
      >
        {/* Ô lọc đứng ngay trên bảng nó lọc, không nằm ở tiêu đề thẻ: bảng này
            dài 105 dòng và ô lọc thuộc về bảng chứ không thuộc về cái thẻ. */}
        <div className="dlist-tools">
          <span className="dsearch">
            <input
              type="search"
              placeholder="Tìm mã hoặc tên Chương"
              aria-label="Tìm Chương"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </span>
        </div>
        <CodeTable
          rows={filteredChapters}
          lastHeader="Cấp quản lý"
          caption="Chương trong điều kiện báo cáo"
          emptyText="Không có Chương nào khớp từ khoá."
          pinned={pinnedChapters}
          staleRows={query ? [] : staleChapters}
        />
        {!query && (
          <p className="dhint">
            Đang hiện {filteredChapters.length} trên {data.chapters.length} Chương trong điều kiện.{" "}
            <button
              type="button"
              className="dlink"
              onClick={() => setShowAllChapters((value) => !value)}
            >
              {showAllChapters ? "Thu gọn" : `Xem tất cả ${data.chapters.length} Chương`}
            </button>
          </p>
        )}
      </Card>

      <CorrespondencePanel data={data} />
      <QualityPanel data={data} />
    </>
  );
}
