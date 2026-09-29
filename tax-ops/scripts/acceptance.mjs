import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer-core";

/* Bỏ dấu gạch chéo cuối để `${base}/?view=` không thành đường dẫn hai gạch —
   máy chủ tĩnh trả 404 cho nó và lỗi hiện ra ở nơi khác hẳn nguyên nhân. */
const base = (process.argv[2] ?? "http://127.0.0.1:5174").replace(/\/+$/, "");
const views = ["workbench", "debt", "risk", "refund", "reports", "batches", "mapping", "rules"];
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
await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${base}/`, { waitUntil: "networkidle0" });
const hasLogin = await page.$(".login-page") !== null;
if (!hasLogin) throw new Error("Không thấy màn đăng nhập khi chưa có phiên demo.");
await page.screenshot({ path: ".impeccable/review/login-desktop.png", fullPage: true });
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.reload({ waitUntil: "networkidle0" });
await page.screenshot({ path: ".impeccable/review/login-mobile.png", fullPage: true });
await page.click(".login-submit");
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
await page.goto(`${base}/?view=workbench`, { waitUntil: "networkidle0" });
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, 0); });
await page.screenshot({ path: ".impeccable/review/desktop.png", fullPage: true });
await inspect(390, 844, true);
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
await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = "auto";
  const table = document.querySelector(".table-wrap");
  table?.scrollIntoView({ block: "start" });
  if (table) table.scrollLeft = table.scrollWidth;
});
const tableShell = await page.$(".table-shell");
await tableShell?.screenshot({ path: ".impeccable/review/debt-table-scrolled-mobile.png" });
await page.click(".page-actions .button");
await page.waitForSelector(".report-dialog[open]");
if (await page.$("input[name=reportName]") === null) throw new Error("CTA tạo báo cáo không mở form.");
await page.keyboard.press("Escape");

await page.goto(`${base}/?view=workbench`, { waitUntil: "networkidle0" });
await page.click(".menu-button");
await page.click(".mobile-drawer .logout-button");
await page.waitForSelector(".login-page");
if (await page.$(".workspace") !== null) throw new Error("Đăng xuất không xoá phiên demo.");

/* Ba vai, chốt 28/09: Lãnh đạo nhà nước KHÔNG vào Web quản lý. Đăng nhập được
   nhưng phải gặp một lời từ chối có giải thích kèm đường sang Dashboard, không
   phải một shell rỗng hay một màn trắng. */
await page.evaluate(() => {
  const accounts = [...document.querySelectorAll(".demo-account-list button")];
  const state = accounts.find((item) => item.textContent?.includes("Lãnh đạo nhà nước"));
  if (!(state instanceof HTMLButtonElement)) throw new Error("Thiếu tài khoản Lãnh đạo nhà nước.");
  state.click();
});
await page.click(".login-submit");
await page.waitForSelector(".dheader, .dmobile-header");
if (new URL(page.url()).pathname !== "/nsnn/") throw new Error("Lãnh đạo nhà nước chưa được điều hướng vào NSNN.");
await page.screenshot({ path: ".impeccable/review/nsnn-mobile.png", fullPage: true });

await browser.close();
if (errors.length) throw new Error(`JavaScript errors: ${errors.slice(0, 3).join(" | ")}`);
console.log(`✓ ${views.length} workspace đạt kiểm tra desktop và mobile; không tràn trang, vùng chạm đạt yêu cầu.`);
