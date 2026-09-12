import { useEffect, useRef } from "react";
import { providerKind } from "@/data";
import { INDICATORS, YEARS } from "@/domain/catalog";
import type { DashboardFilters, TabId } from "@/domain/types";
import { useHostContext } from "@/host/HostContext";
import { useDashboardState } from "@/state/DashboardState";
import { TABS } from "./tabs";
import { AdvancedCompareTab } from "@/features/advanced-compare/AdvancedCompareTab";
import { LocationDetailTab } from "@/features/location-detail/LocationDetailTab";
import { OverviewTab } from "@/features/overview/OverviewTab";
import { RevenueAnalysisTab } from "@/features/revenue-analysis/RevenueAnalysisTab";
import { FilterBar } from "@/components/FilterBar";
import { RevenuePreviewDrawer } from "@/features/revenue-preview/RevenuePreviewDrawer";


export function App() {
  const { tab, setTab, filters, setFilters } = useDashboardState();
  const { host, embedded, commands, postToHost } = useHostContext();
  const tablistRef = useRef<HTMLDivElement | null>(null);
  const handledCommand = useRef(0);
  const active = TABS.find((item) => item.id === tab) ?? TABS[0];
  const mobileHost = host.source === "mobile";

  /** Điều hướng bàn phím theo chuẩn tablist: mũi tên trái/phải, Home/End. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = TABS.findIndex((item) => item.id === tab);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? TABS.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setTab(TABS[next].id);
    requestAnimationFrame(() => {
      tablistRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    });
  };

  // Tiêu đề trang đi theo workspace để lịch sử trình duyệt đọc được.
  useEffect(() => {
    document.title = `${active.label} · Thu NSNN Hà Nội`;
  }, [active.label]);

  // Lệnh từ host đi qua cùng API state như thao tác tại chỗ, nên URL, dữ liệu và
  // mọi widget luôn đồng bộ. Payload lạ bị bỏ qua thay vì lọt vào domain state.
  useEffect(() => {
    for (const command of commands) {
      if (command.sequence <= handledCommand.current) continue;
      handledCommand.current = command.sequence;
      if (typeof command.payload !== "object" || command.payload === null) continue;
      const payload = command.payload as Record<string, unknown>;

      if (command.type === "NSNN_NAVIGATE") {
        const requested = payload.tab;
        if (typeof requested === "string" && TABS.some((item) => item.id === requested))
          setTab(requested as TabId);
        continue;
      }

      const raw = typeof payload.filters === "object" && payload.filters !== null
        ? payload.filters as Record<string, unknown>
        : payload;
      const patch: Partial<DashboardFilters> = {};
      if (typeof raw.year === "number" && YEARS.includes(raw.year as (typeof YEARS)[number]))
        patch.year = raw.year;
      if (raw.periodType === "MONTH" || raw.periodType === "QUARTER")
        patch.periodType = raw.periodType;
      if (typeof raw.period === "number" && Number.isInteger(raw.period) && raw.period >= 0)
        patch.period = raw.period;
      if (raw.accumulation === "PERIOD" || raw.accumulation === "YTD")
        patch.accumulation = raw.accumulation;
      if (raw.budgetLevel === "NSNN" || raw.budgetLevel === "NSTW" || raw.budgetLevel === "NSDP")
        patch.budgetLevel = raw.budgetLevel;
      if (typeof raw.indicator === "string" && INDICATORS.some((item) => item.slug === raw.indicator))
        patch.indicator = raw.indicator as DashboardFilters["indicator"];
      if (Object.keys(patch).length > 0) setFilters(patch);
    }
  }, [commands, setFilters, setTab]);

  // Parent chỉ cần nghe một event để đồng bộ thanh tiêu đề, deep link hoặc state
  // native; không phải hiểu các event nội bộ của từng chart/widget.
  useEffect(() => {
    postToHost("NSNN_STATE_CHANGE", { tab, filters });
  }, [filters, postToHost, tab]);

  // Báo chiều cao nội dung cho iframe/WebView để host tránh thanh cuộn lồng nhau.
  useEffect(() => {
    if (!embedded || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const report = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        postToHost("NSNN_RESIZE", {
          height: Math.ceil(document.documentElement.scrollHeight),
          width: document.documentElement.clientWidth,
        });
      });
    };
    const observer = new ResizeObserver(report);
    observer.observe(document.body);
    report();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [embedded, postToHost]);

  return (
    <div className="dapp" data-host={host.source} data-platform={host.platform}>
      <a className="dskip" href="#workspace">
        Bỏ qua điều hướng
      </a>

      {mobileHost ? (
        <header className="dmobile-header">
          <div>
            <h1>Thu NSNN Hà Nội</h1>
            <p>{active.label}</p>
          </div>
          <span>{providerKind === "mock" ? "Dữ liệu mô phỏng" : providerKind.toUpperCase()}</span>
        </header>
      ) : (
        <header className="dheader">
          <div className="dheader-mark">
            <i aria-hidden="true">HN</i>
            <div>
              <h1>Thu ngân sách Nhà nước</h1>
              <p>Kho bạc Nhà nước khu vực I · Thành phố Hà Nội</p>
            </div>
          </div>
          <div className="dheader-tools">
            <p className="dheader-source">
              {providerKind === "mock" ? "Dữ liệu mô phỏng phục vụ prototype" : `Nguồn dữ liệu: ${providerKind.toUpperCase()}`}
            </p>
            <button
              type="button"
              className="dheader-frame"
              onClick={() => {
                const query = new URLSearchParams(window.location.search);
                query.set("frame", "500");
                window.location.search = query.toString();
              }}
              title="Mở dashboard trong một iframe thật để xem bố cục ở khổ hẹp"
            >
              Xem thử iframe
            </button>
            <button
              type="button"
              className="dheader-frame"
              onClick={() => {
                const query = new URLSearchParams(window.location.search);
                query.set("frame", "390");
                query.set("host", "mobile");
                query.set("platform", "ios");
                query.set("device", "iphone-14");
                window.location.search = query.toString();
              }}
              title="Mở bản báo cáo dành cho Mobile WebView"
            >
              Xem thử mobile
            </button>
          </div>
        </header>
      )}

      <div className="dshell">
        <div
          className="dtabs"
          role="tablist"
          aria-label="Khu vực phân tích"
          ref={tablistRef}
          onKeyDown={onKeyDown}
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls="workspace"
              tabIndex={tab === item.id ? 0 : -1}
              title={item.question}
              className={tab === item.id ? "is-active" : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <FilterBar />

        <main
          id="workspace"
          className="dworkspace"
          role="tabpanel"
          aria-labelledby={`tab-${active.id}`}
          tabIndex={-1}
        >
          {tab === "overview" && <OverviewTab />}
          {tab === "revenue-analysis" && <RevenueAnalysisTab />}
          {tab === "location-detail" && <LocationDetailTab />}
          {tab === "advanced-compare" && <AdvancedCompareTab />}
        </main>
      </div>

      <RevenuePreviewDrawer />
    </div>
  );
}
