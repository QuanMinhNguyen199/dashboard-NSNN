import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer-core";

/* Bỏ dấu gạch chéo cuối để `${base}/?view=` không thành đường dẫn hai gạch —
   máy chủ tĩnh trả 404 cho nó và lỗi hiện ra ở nơi khác hẳn nguyên nhân. */
const base = (process.argv[2] ?? "http://127.0.0.1:5174").replace(/\/+$/, "");
const views = ["workbench", "debt", "risk", "refund", "reports", "runs", "batches", "mapping", "rules"];
const browser = await puppeteer.launch({ channel: "chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`${message.text()} ${message.location().url ?? ""}`.trim());
});
await mkdir(".impeccable/review", { recursive: true });

/* Mỗi lượt nghiệm thu bắt đầu từ màn đăng nhập để kiểm tra đúng luồng demo,
   sau đó giữ phiên trong sessionStorage cho các deep link kế tiếp. */
/* Màn đăng nhập không còn lối chọn nhanh tài khoản mẫu, nên cổng kiểm gõ
   thông tin như người dùng thật. Ô luôn rỗng khi màn vừa dựng. */
async function dangNhap(page, username, password = "demo123") {
  await page.waitForSelector(".login-form");
  await page.click('input[name="username"]', { clickCount: 3 });
  await page.type('input[name="username"]', username);
  await page.click('input[name="password"]', { clickCount: 3 });
  await page.type('input[name="password"]', password);
  await page.click(".login-submit");
}

await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${base}/`, { waitUntil: "networkidle0" });
const hasLogin = await page.$(".login-page") !== null;
if (!hasLogin) throw new Error("Không thấy màn đăng nhập khi chưa có phiên demo.");
await page.screenshot({ path: ".impeccable/review/login-desktop.png", fullPage: true });
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.reload({ waitUntil: "networkidle0" });
await page.screenshot({ path: ".impeccable/review/login-mobile.png", fullPage: true });
/* Ô rỗng + bấm Đăng nhập phải ra lỗi có giải thích, không phải im lặng. */
await page.click(".login-submit");
if (await page.$(".login-error") === null) throw new Error("Gửi form rỗng mà không báo lỗi.");
await dangNhap(page, "canbo.thue");
await page.waitForSelector(".workspace");
await page.reload({ waitUntil: "networkidle0" });
if (await page.$(".workspace") === null) throw new Error("Phiên đăng nhập demo không được khôi phục sau reload.");

async function inspect(width, height, mobile) {
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile });
  for (const view of views) {
    await page.goto(`${base}/?view=${view}`, { waitUntil: "networkidle0" });
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
    });
    /* Một màn rơi về Trang công việc vẫn có h1 hợp lệ, nên chỉ kiểm "có tiêu
       đề" là không đủ: phải kiểm đúng màn đã yêu cầu thật sự mở ra. */
    const dungMan = await page.evaluate(() => new URLSearchParams(location.search).get("view"));
    const navActive = await page.$eval(".nav-item.is-active span, .mobile-nav button.is-active span", (el) => el.textContent).catch(() => null);
    if (!navActive) throw new Error(`${mobile ? "mobile" : "desktop"}/${view}: không xác định được mục điều hướng đang mở.`);
    if (dungMan !== view) throw new Error(`${mobile ? "mobile" : "desktop"}/${view}: URL không giữ được view.`);
    const result = await page.evaluate((isMobile) => {
      const visible = (element) => {
        if (element.classList.contains("sr-only")) return false;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      };
      const controls = [...document.querySelectorAll("button,select,input,[tabindex]")].filter(visible);
      const small = controls.filter((element) => {
        const rect = element.getBoundingClientRect();
        return isMobile ? rect.height < 44 || rect.width < 32 : rect.height < 32;
      });
      return {
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        small: small.slice(0, 6).map((element) => `${element.tagName}.${element.className}:${Math.round(element.getBoundingClientRect().width)}x${Math.round(element.getBoundingClientRect().height)}`),
        heading: document.querySelector("main h1")?.textContent ?? null,
      };
    }, mobile);
    if (result.overflow || result.small.length || !result.heading) {
      throw new Error(`${mobile ? "mobile" : "desktop"}/${view}: ${JSON.stringify(result)}`);
    }
    await page.screenshot({ path: `.impeccable/review/${view}-${mobile ? "mobile" : "desktop"}.png` });
  }
}

await inspect(1440, 1000, false);
for (const view of ["debt", "refund", "reports", "batches"]) {
  await page.goto(`${base}/?view=${view}`, { waitUntil: "networkidle0" });
  const split = await page.evaluate(() => {
    const list = document.querySelector(".case-list")?.getBoundingClientRect();
    const detail = document.querySelector(".case-detail")?.getBoundingClientRect();
    return Boolean(list && detail && detail.left >= list.right && Math.abs(detail.top - list.top) < 2);
  });
  if (!split) throw new Error(`${view}: chi tiết chưa nằm cạnh danh sách trên desktop.`);
  /* Đưa hàng vào GIỮA khung nhìn trước khi bấm. Thanh điều hướng đáy cố định
     phủ 62px cuối màn; để puppeteer tự cuộn thì cú bấm có thể rơi trúng thanh
     đó và nhảy sang màn khác — đúng như một người dùng bấm nhầm. */
  await page.$eval(".case-list tbody tr:nth-child(2) .row-select", (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.click(".case-list tbody tr:nth-child(2) .row-select");
  const selected = await page.$eval(".case-list tbody tr:nth-child(2)", (row) => row.classList.contains("is-selected"));
  if (!selected) throw new Error(`${view}: chọn hồ sơ thứ hai chưa cập nhật chi tiết.`);
}
await page.goto(`${base}/?view=risk`, { waitUntil: "networkidle0" });
const riskTable = await page.evaluate(() => ({
  hasK: [...document.querySelectorAll("main th")].some((cell) => cell.textContent?.trim() === "Hệ số K"),
  firstK: document.querySelector("main tbody tr:first-child td:nth-child(5)")?.textContent?.trim(),
  hasDetailsBelow: [...document.querySelectorAll("main .panel h2")].some((title) => title.textContent?.startsWith("Hồ sơ ·")),
  rowButtons: document.querySelectorAll("main tbody .row-select").length,
}));
if (!riskTable.hasK || riskTable.firstK !== "4,8" || riskTable.hasDetailsBelow || riskTable.rowButtons) {
  throw new Error(`Bảng kiểm tra tại bàn chưa trình bày dữ liệu trên cùng hàng: ${JSON.stringify(riskTable)}`);
}
await page.goto(`${base}/?view=workbench`, { waitUntil: "networkidle0" });
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, 0); });
await page.screenshot({ path: ".impeccable/review/desktop.png", fullPage: true });
await inspect(390, 844, true);
for (const view of ["debt", "refund", "reports", "batches"]) {
  await page.goto(`${base}/?view=${view}`, { waitUntil: "networkidle0" });
  await page.$eval(".case-list tbody tr:nth-child(2) .row-select", (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.click(".case-list tbody tr:nth-child(2) .row-select");
  await page.waitForSelector(".case-detail-dialog[open]");
  await new Promise((resolve) => setTimeout(resolve, 220));
  await page.screenshot({ path: `.impeccable/review/${view}-detail-mobile.png` });
  await page.keyboard.press("Escape");
  const restored = await page.evaluate(() => !document.querySelector(".case-detail-dialog")?.open && document.activeElement?.matches(".case-list tbody tr:nth-child(2) .row-select"));
  if (!restored) throw new Error(`${view}: đóng chi tiết chưa trả focus về hồ sơ đã chọn.`);
}
await page.goto(`${base}/?view=workbench`, { waitUntil: "networkidle0" });
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, 0); });
await page.screenshot({ path: ".impeccable/review/mobile.png", fullPage: true });

/* Trạng thái tương tác mobile: drawer, chế độ con và bảng đã cuộn. */
await page.click(".menu-button");
const drawer = await page.evaluate(() => ({
  open: document.querySelector('[role="dialog"][aria-modal="true"]') !== null,
  focus: document.activeElement?.getAttribute("aria-label"),
}));
if (!drawer.open || drawer.focus !== "Đóng điều hướng") throw new Error(`Drawer focus/semantics: ${JSON.stringify(drawer)}`);
if (await page.$(".mobile-drawer .product-switch") !== null) throw new Error("Không vai nào của Web QL được có lối mở Dashboard NSNN trong điều hướng.");
await page.screenshot({ path: ".impeccable/review/drawer-mobile.png" });
await page.keyboard.press("Escape");
const drawerClosed = await page.evaluate(() => document.querySelector('[role="dialog"]') === null && document.activeElement?.classList.contains("menu-button"));
if (!drawerClosed) throw new Error("Drawer không đóng bằng Escape hoặc không trả focus về nút mở.");

await page.goto(`${base}/?view=risk`, { waitUntil: "networkidle0" });
await page.select(".segmented-mobile select", "VERIFY");
await page.screenshot({ path: ".impeccable/review/risk-subview-mobile.png" });

await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
/* Nút "Tạo báo cáo" là hành động cấp HỆ THỐNG: nó phải mở được form tạo từ một
   màn nghiệp vụ bất kỳ, không chỉ từ màn Báo cáo. */
await page.$eval("#global-create-report", (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
await page.click("#global-create-report");
await page.waitForSelector(".report-dialog[open]");
if (await page.$("input[name=reportName]") === null) throw new Error("CTA tạo báo cáo không mở form.");
await page.keyboard.press("Escape");

/* Nút "Nhập dữ liệu" là cửa duy nhất cho tệp vào hệ: kiểm tra nó mở đúng hộp
   thoại nhập và hộp thoại có ô chọn tệp thật. */
await page.goto(`${base}/?view=batches`, { waitUntil: "networkidle0" });
await page.$eval(".system-actions .button", (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
await page.click(".system-actions .button");
await page.waitForSelector(".import-dialog[open]");
if (await page.$(".import-dialog input[type=file]") === null) throw new Error("Hộp thoại nhập không có ô chọn tệp.");
await page.keyboard.press("Escape");
await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = "auto";
  const table = document.querySelector(".table-wrap");
  table?.scrollIntoView({ block: "start" });
  if (table) table.scrollLeft = table.scrollWidth;
});
const tableShell = await page.$(".table-shell");
await tableShell?.screenshot({ path: ".impeccable/review/debt-table-scrolled-mobile.png" });

/* Cán bộ lập và gửi; chỉ lãnh đạo mới được duyệt, phát hành. Hai vai cùng
   đọc bản ghi demo trong một tab trình duyệt sau khi đăng xuất/đăng nhập. */
const reportName = `Kiểm tra quyền ${Date.now()}`;
await page.goto(`${base}/?view=reports`, { waitUntil: "networkidle0" });
await page.$eval("#global-create-report", (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
await page.click("#global-create-report");
await page.type('input[name="reportName"]', reportName);
await page.type('input[name="reportPeriod"]', "Tháng 9/2026");
await page.click('.report-form button[type="submit"]');
const officerRow = await page.evaluate((name) => {
  const row = [...document.querySelectorAll(".case-list tbody tr")].find((item) => item.textContent?.includes(name));
  row?.querySelector(".row-select")?.click();
  return Boolean(row);
}, reportName);
if (!officerRow) throw new Error("Bản nháp vừa tạo không có trong danh sách cán bộ.");
await page.waitForSelector(".case-detail-dialog[open]");
const officerActions = await page.evaluate(() => {
  const actions = [...document.querySelectorAll(".case-detail-dialog .panel-actions button")].map((button) => button.textContent?.trim());
  return { send: actions.includes("Gửi duyệt"), canApprove: actions.includes("Duyệt") || actions.includes("Phát hành") };
});
if (!officerActions.send || officerActions.canApprove) throw new Error(`Quyền cán bộ ở tab Báo cáo sai: ${JSON.stringify(officerActions)}`);
await page.click(".case-detail-dialog .panel-actions button");
const sent = await page.evaluate((name) => [...document.querySelectorAll(".case-list tbody tr")].some((row) => row.textContent?.includes(name) && row.textContent?.includes("Đã gửi duyệt")), reportName);
if (!sent) throw new Error("Cán bộ gửi duyệt nhưng trạng thái báo cáo chưa đổi.");
await page.keyboard.press("Escape");
await page.screenshot({ path: ".impeccable/review/reports-officer-sent-mobile.png" });

await page.goto(`${base}/?view=workbench`, { waitUntil: "networkidle0" });
await page.click(".menu-button");
await page.click(".mobile-drawer .logout-button");
await page.waitForSelector(".login-page");
if (await page.$(".workspace") !== null) throw new Error("Đăng xuất không xoá phiên demo.");

await dangNhap(page, "lanhdao.thue");
await page.goto(`${base}/?view=reports`, { waitUntil: "networkidle0" });
await page.screenshot({ path: ".impeccable/review/reports-leader-review-mobile.png" });
await page.setViewport({ width: 1440, height: 1000 });
await page.screenshot({ path: ".impeccable/review/reports-leader-review-desktop.png" });
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const leaderRow = await page.evaluate((name) => {
  const row = [...document.querySelectorAll(".case-list tbody tr")].find((item) => item.textContent?.includes(name));
  row?.querySelector(".row-select")?.click();
  return Boolean(row);
}, reportName);
if (!leaderRow) throw new Error("Lãnh đạo không thấy báo cáo cán bộ đã gửi.");
await page.waitForSelector(".case-detail-dialog[open]");
const leaderActions = await page.evaluate(() => ({
  approve: [...document.querySelectorAll(".case-detail-dialog .panel-actions button")].some((button) => button.textContent?.trim() === "Duyệt"),
  canCreate: Boolean(document.querySelector("#global-create-report")),
  queue: [...document.querySelectorAll(".figure-line span")].some((item) => item.textContent?.trim() === "Cần duyệt"),
  showsDraft: [...document.querySelectorAll(".case-list tbody tr")].some((row) => row.textContent?.includes("Bản nháp")),
}));
if (!leaderActions.approve || leaderActions.canCreate || !leaderActions.queue || leaderActions.showsDraft) throw new Error(`Quyền lãnh đạo ở tab Báo cáo sai: ${JSON.stringify(leaderActions)}`);
await new Promise((resolve) => setTimeout(resolve, 220));
await page.screenshot({ path: ".impeccable/review/reports-leader-detail-mobile.png" });
await page.click(".case-detail-dialog .panel-actions button");
const approved = await page.evaluate((name) => {
  const row = [...document.querySelectorAll(".case-list tbody tr")].find((item) => item.textContent?.includes(name));
  return Boolean(row?.textContent?.includes("Đã duyệt") && [...document.querySelectorAll(".case-detail-dialog .panel-actions button")].some((button) => button.textContent?.trim() === "Phát hành"));
}, reportName);
if (!approved) throw new Error("Lãnh đạo duyệt nhưng báo cáo chưa chuyển sang Đã duyệt.");
await page.keyboard.press("Escape");
await page.click(".menu-button");
await page.click(".mobile-drawer .logout-button");
await page.waitForSelector(".login-page");

/* Ba vai, chốt 28/09: Lãnh đạo nhà nước KHÔNG vào Web quản lý. Đăng nhập được
   nhưng phải gặp một lời từ chối có giải thích kèm đường sang Dashboard, không
   phải một shell rỗng hay một màn trắng. */
await dangNhap(page, "lanhdao.nhanuoc");
await page.waitForSelector(".dheader, .dmobile-header");
if (new URL(page.url()).pathname !== new URL(`${base}/nsnn/`).pathname) throw new Error("Lãnh đạo nhà nước chưa được điều hướng vào NSNN.");
await page.screenshot({ path: ".impeccable/review/nsnn-mobile.png", fullPage: true });

await browser.close();
if (errors.length) throw new Error(`JavaScript errors: ${errors.slice(0, 3).join(" | ")}`);
console.log(`✓ ${views.length} workspace đạt kiểm tra desktop và mobile; không tràn trang, vùng chạm đạt yêu cầu.`);
