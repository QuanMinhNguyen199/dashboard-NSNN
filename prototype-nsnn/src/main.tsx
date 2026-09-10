import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { DashboardProvider } from "./state/DashboardState";
import "./styles/dashboard.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DashboardProvider>
      <App />
    </DashboardProvider>
  </StrictMode>,
);
