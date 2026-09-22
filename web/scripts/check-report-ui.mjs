import puppeteer from "puppeteer-core";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://127.0.0.1:5173";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const params = "tab=report&report=nsnn&year=2026&periodType=MONTH&period=8&latency=0";
const mobileParams = `${params}&host=mobile&platform=ios`;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
const results = [];

const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` · ${detail}` : ""}`);
};

await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto(`${BASE}/?${mobileParams}`, { waitUntil: "networkidle0" });
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

const kpiActions = await page.$$eval(".dkpi-action", (nodes) =>
  nodes.map((node) => ({ label: node.textContent ?? "", controls: node.getAttribute("aria-controls") })),
);
check(
  "Bốn KPI mobile có vùng bấm dẫn đến bảng chi tiết",
  kpiActions.length === 4 && kpiActions.every((item) => item.controls === "nsnn-report-table"),
);

await page.click(".dkpi-action");
await page.waitForSelector('.dreport-table-pane[data-mobile-active="true"]');
const treeToggle = await page.$eval(".dreport-table .dtms-toggle", (node) => ({
  expanded: node.getAttribute("aria-expanded"),
  label: node.textContent ?? "",
  caret: getComputedStyle(node.querySelector(".dtms-caret")).transform,
}));
check(
  "Hàng Tổng thu nội địa thể hiện trạng thái mở rộng",
  treeToggle.expanded === "true" &&
    treeToggle.caret.startsWith("matrix(0, 1, -1, 0") &&
    !/Xem chi tiết|Thu gọn/.test(treeToggle.label),
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
  rowTransition: getComputedStyle(document.querySelector(".dreport-table tbody tr")).transitionDuration,
}));
check("Chế độ Bảng ẩn phần tóm tắt", tableUi.summaryHidden);
check("Bảng NSNN có xuất Excel", tableUi.exportVisible);
check("Phân trang thông báo thay đổi cột", tableUi.liveRange === "polite");
check("Không tràn ngang ở 390px", tableUi.overflow);
check("Dòng bảng mobile không nhận hover animation", tableUi.rowTransition === "0s", tableUi.rowTransition);

const mobileReportRow = await page.$eval(".dreport-table tbody tr", (row) => {
  const heading = row.querySelector("th")?.getBoundingClientRect();
  const total = row.querySelector(".dreport-total")?.getBoundingClientRect();
  const dimensions = Array.from(row.querySelectorAll("td:not(.dreport-total)"))
    .slice(0, 3)
    .map((cell) => cell.getBoundingClientRect());
  return {
    headingY: Math.round(heading?.y ?? -1),
    totalY: Math.round(total?.y ?? -2),
    dimensionY: dimensions.map((rect) => Math.round(rect.y)),
    dimensionWidth: dimensions.map((rect) => Math.round(rect.width)),
    totalLabel: row.querySelector(".dreport-total")?.getAttribute("data-label"),
  };
});
check(
  "Card chỉ tiêu mobile gom tiêu đề và tổng, ba địa bàn cùng hàng",
  mobileReportRow.headingY === mobileReportRow.totalY &&
    mobileReportRow.dimensionY.length === 3 &&
    new Set(mobileReportRow.dimensionY).size === 1 &&
    Math.max(...mobileReportRow.dimensionWidth) - Math.min(...mobileReportRow.dimensionWidth) <= 1 &&
    mobileReportRow.totalLabel === "Tổng",
);

const downloadDir = await mkdtemp(join(tmpdir(), "nsnn-csv-"));
await client.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir });
await page.click(".dreport-table-pane .dexport > button.dbtn");
let files = [];
for (let attempt = 0; attempt < 300; attempt += 1) {
  files = (await readdir(downloadDir)).filter((file) => file.endsWith(".xlsx"));
  if (files.length) break;
  await new Promise((resolve) => setTimeout(resolve, 100));
}
const fileSize = files.length ? (await stat(join(downloadDir, files[0]))).size : 0;
check(
  "Excel toàn bộ được tạo từ bảng báo cáo",
  files.length === 1 && fileSize > 10_000,
  files.length ? `${files[0]} · ${fileSize} byte` : "không có tệp tải về",
);
await rm(downloadDir, { recursive: true, force: true });

await page.goto(`${BASE}/?${mobileParams.replace("report=nsnn", "report=budget")}`, { waitUntil: "networkidle0" });
await page.waitForSelector(".dbudget-summary-split");
const budgetText = await page.$eval("main", (node) => node.textContent ?? "");
const mobileCardTransition = await page.$eval(
  ".dcard",
  (node) => getComputedStyle(node).transitionDuration,
);
check(
  "Dự toán nói rõ cơ sở lũy kế và mốc bàn giao",
  /Thực hiện lũy kế/.test(budgetText) && /Số bàn giao · lũy kế 8 tháng/.test(budgetText),
);
check("Card mobile không nhận hover animation", mobileCardTransition === "0s", mobileCardTransition);

await page.goto(`${BASE}/?${mobileParams.replace("report=nsnn", "report=taxpayer")}`, { waitUntil: "networkidle0" });
await page.waitForSelector(".dpager-management");
const firstManagementPage = await page.$eval(".dpager-management", (pager) => {
  const previous = pager.querySelector("button:first-child");
  const next = pager.querySelector("button:last-child");
  return {
    previousDisplay: previous ? getComputedStyle(previous).display : "missing",
    nextDisplay: next ? getComputedStyle(next).display : "missing",
    nextColumn: next ? getComputedStyle(next).gridColumnStart : "missing",
  };
});
check(
  "Trang đầu Quản lý thu chỉ hiện Trang sau ở nửa phải",
  firstManagementPage.previousDisplay === "none" &&
    firstManagementPage.nextDisplay !== "none" &&
    firstManagementPage.nextColumn === "2",
);

await page.click(".dpager-management button:last-child");
const secondManagementPage = await page.$eval(".dpager-management", (pager) => {
  const previous = pager.querySelector("button:first-child");
  const next = pager.querySelector("button:last-child");
  const previousRect = previous?.getBoundingClientRect();
  const nextRect = next?.getBoundingClientRect();
  return {
    previousDisplay: previous ? getComputedStyle(previous).display : "missing",
    nextDisplay: next ? getComputedStyle(next).display : "missing",
    previousColumn: previous ? getComputedStyle(previous).gridColumnStart : "missing",
    sameRow: next && getComputedStyle(next).display !== "none"
      ? Math.round(previousRect?.y ?? -1) === Math.round(nextRect?.y ?? -2)
      : true,
  };
});
check(
  "Từ trang hai, Trang trước hiện bên trái và cùng hàng nếu còn Trang sau",
  secondManagementPage.previousDisplay !== "none" &&
    secondManagementPage.previousColumn === "1" &&
    secondManagementPage.sameRow,
);

await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${BASE}/?${params}`, { waitUntil: "networkidle0" });
await page.waitForSelector(".dreport-table");
const desktopActions = await page.$$eval(".dkpi-action", (nodes) => nodes.length);
const desktopTreeCopy = await page.$eval(".dreport-table", (node) => node.textContent ?? "");
const desktopCaret = await page.$eval(
  ".dreport-table .dtms-toggle[aria-expanded='true'] .dtms-caret",
  (node) => getComputedStyle(node).transform,
);
const desktopRowTransition = await page.$eval(
  ".dreport-table tbody tr",
  (node) => getComputedStyle(node).transitionDuration,
);
check(
  "Desktop giữ KPI tĩnh và không thêm nhãn mở rộng",
  desktopActions === 0 && !/Xem chi tiết|Thu gọn/.test(desktopTreeCopy),
);
check("Desktop vẫn giữ phản hồi hover bằng chuột", desktopRowTransition !== "0s", desktopRowTransition);
check("Caret desktop hướng xuống khi nội dung đang mở", desktopCaret.startsWith("matrix(0, 1, -1, 0"), desktopCaret);

await browser.close();
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} tiêu chí UI Báo cáo đạt.`);
process.exit(passed === results.length ? 0 : 1);
