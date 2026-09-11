import { useEffect, useRef } from "react";
import { providerKind } from "@/data";
import { useDashboardState } from "@/state/DashboardState";
import { TABS } from "./tabs";
import { AdvancedCompareTab } from "@/features/advanced-compare/AdvancedCompareTab";
import { LocationDetailTab } from "@/features/location-detail/LocationDetailTab";
import { OverviewTab } from "@/features/overview/OverviewTab";
import { RevenueAnalysisTab } from "@/features/revenue-analysis/RevenueAnalysisTab";
import { FilterBar } from "@/components/FilterBar";
import { RevenuePreviewDrawer } from "@/features/revenue-preview/RevenuePreviewDrawer";


export function App() {
  const { tab, setTab } = useDashboardState();
  const tablistRef = useRef<HTMLDivElement | null>(null);
  const active = TABS.find((item) => item.id === tab) ?? TABS[0];

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

  return (
    <>
      <a className="dskip" href="#workspace">
        Bỏ qua điều hướng
      </a>

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
          {/* Mở ở khổ 500px — đúng bề ngang một khung chat cạnh agent. */}
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
        </div>
      </header>

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
    </>
  );
}
