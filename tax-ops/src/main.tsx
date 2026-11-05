import React from "react";
import ReactDOM from "react-dom/client";
import { I18nProvider } from "react-aria-components";
import { App } from "@/App";
import "@/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><I18nProvider locale="vi-VN"><App/></I18nProvider></React.StrictMode>);
