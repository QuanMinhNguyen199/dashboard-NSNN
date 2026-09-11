import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { DashboardProvider } from "./state/DashboardState";
import { FramePreview, frameWidthFromUrl } from "./ui/FramePreview";
import "./styles/dashboard.css";

// Chế độ xem thử khổ nhúng dựng cây riêng, không bọc `DashboardProvider`:
// provider ghi lại query từ state sau mỗi lần đổi bộ lọc và sẽ xoá mất `frame`.
const frameWidth = frameWidthFromUrl(window.location.search);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {frameWidth === null ? (
      <DashboardProvider>
        <App />
      </DashboardProvider>
    ) : (
      <FramePreview initialWidth={frameWidth} />
    )}
  </StrictMode>,
);
