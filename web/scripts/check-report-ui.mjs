import puppeteer from "puppeteer-core";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://127.0.0.1:5173";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const params = "tab=report&report=nsnn&year=2026&periodType=MONTH&period=8&latency=0";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
const results = [];

const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` · ${detail}` : ""}`);
};

await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto(`${BASE}/?${params}`, { waitUntil: "networkidle0" });
await page.waitForSelector(".dkpis");

const dimensionControlsCollapsed = await page.$eval(
  ".dreport-bar",
  (node) => getComputedStyle(node).display === "none",
);
check("Thiết lập chiều báo cáo thu gọn ở màn hình đầu", dimensionControlsCollapsed);

const kpis = await page.$$eval('.dkpis[data-columns="4"] > div', (nodes) =>
  nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width) };
  }),
);
check(
  "Dải KPI xếp 2×2 trên mobile",
  kpis.length === 4 && kpis[0].y === kpis[1].y && kpis[2].y === kpis[3].y && kpis[0].width === kpis[3].width,
);

await page.click('.dreport-mobile-switch button:nth-child(2)');
await page.waitForSelector('.dreport-table-pane[data-mobile-active="true"] .dreport-table');
const client = await page.createCDPSession();
const { nodes } = await client.send("Accessibility.getFullAXTree");
const columnHeaders = nodes.filter((node) => node.role?.value === "columnheader").length;
check("Header bảng vẫn có trong cây accessibility", columnHeaders > 0, `${columnHeaders} columnheader`);

const tableUi = await page.evaluate(() => ({
  summaryHidden: getComputedStyle(document.querySelector(".dreport-summary-pane")).display === "none",
  exportVisible: Boolean(document.querySelector(".dreport-table-pane .dexport")),
  liveRange: document.querySelector(".dreport-page [role=status]")?.getAttribute("aria-live"),
  overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
}));
check("Chế độ Bảng ẩn phần tóm tắt", tableUi.summaryHidden);
check("Bảng NSNN có xuất CSV", tableUi.exportVisible);
check("Phân trang thông báo thay đổi cột", tableUi.liveRange === "polite");
check("Không tràn ngang ở 390px", tableUi.overflow);

const downloadDir = await mkdtemp(join(tmpdir(), "nsnn-csv-"));
await client.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir });
await page.click(".dreport-table-pane .dexport button");
await page.waitForFunction(
  () => /Đã xuất/.test(document.querySelector(".dreport-table-pane .dexport")?.textContent ?? ""),
  { timeout: 30000 },
);
let files = [];
for (let attempt = 0; attempt < 30; attempt += 1) {
  files = (await readdir(downloadDir)).filter((file) => file.endsWith(".csv"));
  if (files.length) break;
  await new Promise((resolve) => setTimeout(resolve, 100));
}
const csv = files.length ? await readFile(join(downloadDir, files[0]), "utf8") : "";
const csvLines = csv.split(/\r?\n/);
const headerIndex = csvLines.findIndex((line) => line.replace(/^﻿/, "").startsWith("Mã chỉ tiêu,Chỉ tiêu,"));
const headerColumns = headerIndex < 0 ? 0 : (csvLines[headerIndex].match(/,/g)?.length ?? 0) + 1;
const dataRows = headerIndex < 0 ? 0 : csvLines.slice(headerIndex + 1).filter(Boolean).length;
check(
  "CSV xuất toàn bộ bảng và dàn topic theo cột ngang",
  headerColumns > 100 && dataRows === 113,
  `${headerColumns} cột · ${dataRows} chỉ tiêu`,
);
await rm(downloadDir, { recursive: true, force: true });

await page.goto(`${BASE}/?${params.replace("report=nsnn", "report=budget")}`, { waitUntil: "networkidle0" });
await page.waitForSelector(".dbudget-summary-split");
const budgetText = await page.$eval("main", (node) => node.textContent ?? "");
check(
  "Dự toán nói rõ cơ sở lũy kế và mốc bàn giao",
  /Lũy kế đến kỳ báo cáo/.test(budgetText) && /Số bàn giao · lũy kế 8 tháng/.test(budgetText),
);

await browser.close();
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} tiêu chí UI Báo cáo đạt.`);
process.exit(passed === results.length ? 0 : 1);
