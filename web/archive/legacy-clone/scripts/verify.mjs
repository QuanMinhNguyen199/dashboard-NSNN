/**
 * Kịch bản kiểm chứng: mở prototype ở nhiều viewport/trạng thái, chụp ảnh và
 * ghi lại text + console error để đối chiếu với reference-nsnn/states.
 *
 *   node scripts/verify.mjs [baseUrl]
 *
 * Ảnh ghi vào ../verification/, kèm .txt là innerText của #root.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "../../verification");
const BASE = process.argv[2] ?? "http://localhost:5173";
const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

const DESKTOP = { width: 1440, height: 1000 };
const TABLET = { width: 1024, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** Mỗi ca: id, query, viewport, và các thao tác sau khi tải xong. */
const CASES = [
  { id: "01-overview", q: "?year=2026&acc=PERIOD&item=tong-so&tab=overview" },
  { id: "02-quarter2", q: "?year=2026&quarter=2&acc=PERIOD&item=tong-so&tab=overview" },
  { id: "03-quarter2-month5", q: "?year=2026&quarter=2&month=5&acc=PERIOD&item=tong-so&tab=overview" },
  { id: "04-month5-ytd", q: "?year=2026&quarter=2&month=5&acc=YTD&item=tong-so&tab=overview" },
  { id: "05-item-thu-nsnn", q: "?year=2026&quarter=2&month=5&acc=YTD&item=thu-nsnn&tab=overview" },
  { id: "06-item-net-total", q: "?year=2026&quarter=2&month=5&acc=YTD&item=tong-so-tru-hoan-thue&tab=overview" },
  { id: "07-aug-overview", q: "?year=2026&month=8&acc=PERIOD&item=tong-so&tab=overview" },
  {
    id: "08-trend-modal",
    q: "?year=2026&month=8&acc=PERIOD&item=tong-so&tab=overview",
    act: async (page) => {
      await page.click(".cursor-zoom-in");
      await wait(700);
    },
  },
  {
    id: "09-ranking-growth",
    q: "?year=2026&month=8&acc=PERIOD&item=tong-so&tab=overview",
    act: (page) => clickText(page, "button", "Theo tăng trưởng %"),
  },
  {
    id: "10-ranking-stability",
    q: "?year=2026&month=8&acc=PERIOD&item=tong-so&tab=overview",
    act: (page) => clickText(page, "button", "Theo độ ổn định"),
  },
  {
    id: "11-ranking-modal",
    q: "?year=2026&month=8&acc=PERIOD&item=tong-so&tab=overview",
    // Bản khảo sát mở modal ngay sau ca 10, tức bảng xếp hạng đang ở mode "độ ổn định".
    act: async (page) => {
      await clickText(page, "button", "Theo độ ổn định");
      const rows = await page.$$('div[class*="min-h-"]');
      for (const row of rows) {
        const text = await row.evaluate((el) => el.textContent?.trim() ?? "");
        if (/^#1\D/.test(text)) {
          await row.click();
          break;
        }
      }
      await wait(1000);
    },
  },
  {
    id: "12-tax-composition",
    q: "?year=2026&month=8&acc=PERIOD&item=tong-so&tab=overview",
    act: (page) => clickText(page, "button", "Sắc thuế"),
  },
  { id: "13-historical-2024", q: "?year=2024&acc=PERIOD&item=tong-so&tab=detail" },
  { id: "14-historical-district", q: "?year=2024&acc=PERIOD&item=tong-so&district=hoan-kiem&tab=detail" },
  { id: "15-mixed-2025", q: "?year=2025&acc=PERIOD&item=tong-so&tab=detail" },
  { id: "16-june2025", q: "?year=2025&month=6&acc=PERIOD&item=tong-so&tab=detail" },
  { id: "17-july2025", q: "?year=2025&month=7&acc=PERIOD&item=tong-so&tab=detail" },
  { id: "18-detail-ward", q: "?year=2025&month=7&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=detail" },
  { id: "19-no-data", q: "?year=2026&month=12&acc=PERIOD&item=tong-so&tab=overview" },
  { id: "20-invalid-url", q: "?year=2026&month=8&quarter=1&acc=no&item=unknown&tab=oops&ward=unknown&foo=bar" },
  {
    id: "21-dismiss-notice",
    q: "?year=2026&month=8&quarter=1&acc=no&item=unknown&tab=oops&ward=unknown&foo=bar",
    act: (page) => clickAria(page, "Đóng cảnh báo"),
  },
  { id: "22-compare-empty", q: "?year=2026&acc=PERIOD&item=tong-so&tab=compare" },
  { id: "23-compare-default", q: "?year=2026&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=compare&cmpa=2025m9&cmpb=2026m9" },
  { id: "25-compare-aug", q: "?year=2026&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=compare&cmpa=2025m8&cmpb=2026m8" },
  { id: "26-compare-ytd", q: "?year=2026&acc=YTD&item=tong-so&ward=hoan-kiem&tab=compare&cmpa=2025m8&cmpb=2026m8" },
  { id: "27-compare-q3", q: "?year=2026&acc=YTD&item=tong-so&ward=hoan-kiem&tab=compare&cmpa=2025q3&cmpb=2026q3" },
  { id: "28-detail-hoankiem", q: "?year=2026&month=8&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=detail" },
  {
    id: "29-reset-zoom",
    q: "?year=2026&month=8&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=detail",
    act: (page) => clickText(page, "button", "Reset zoom"),
  },
  {
    id: "30-refresh",
    q: "?year=2026&month=8&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=detail",
    act: (page) => clickText(page, "button", "Tải lại dữ liệu"),
  },
  {
    id: "31-ranking-expanded",
    q: "?year=2026&month=8&acc=PERIOD&item=tong-so&tab=overview",
    act: (page) => clickPrefix(page, "button", "Xem thêm 122"),
  },
  {
    id: "32-composition-expanded",
    q: "?year=2026&month=8&acc=PERIOD&item=tong-so&tab=overview",
    act: (page) => clickPrefix(page, "button", "Xem thêm 121"),
  },
  { id: "33-compare-same-year", q: "?year=2026&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=compare&cmpa=2026m7&cmpb=2026m8" },
  { id: "34-compare-annual", q: "?year=2026&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=compare&cmpa=2024y&cmpb=2025y" },
  {
    id: "24-compare-draft",
    q: "?year=2026&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=compare&cmpa=2025m9&cmpb=2026m9",
    act: async (page) => {
      // Đổi select Kỳ A sang tháng khác nhưng KHÔNG bấm So sánh — heading phải giữ nguyên.
      const handles = await page.$$("select");
      for (const handle of handles) {
        const aria = await handle.evaluate((el) => el.getAttribute("aria-label"));
        if (aria === "Kỳ A — kỳ trong năm") {
          await handle.select("m5");
          break;
        }
      }
      await wait(400);
    },
  },
  { id: "tablet-overview", q: "?year=2026&month=8&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=overview", vp: TABLET },
  { id: "tablet-detail", q: "?year=2026&month=8&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=detail", vp: TABLET },
  { id: "tablet-compare", q: "?year=2026&month=8&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=compare&cmpa=2025m8&cmpb=2026m8", vp: TABLET },
  { id: "mobile-overview", q: "?year=2026&month=8&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=overview", vp: MOBILE },
  { id: "mobile-detail", q: "?year=2026&month=8&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=detail", vp: MOBILE },
  { id: "mobile-compare", q: "?year=2026&month=8&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=compare&cmpa=2025m8&cmpb=2026m8", vp: MOBILE },
];

/** Bản gốc chụp hai ca này ở kích thước viewport sau khi bấm "Xem thêm". */
const VIEWPORT_ONLY = new Set(["31-ranking-expanded", "32-composition-expanded"]);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Recharts vẽ đường bằng JS (react-smooth), không dùng Web Animations API, nên
 * phải chờ tới khi thuộc tính `d` của mọi path ngừng thay đổi mới chụp — nếu không
 * sẽ chụp trúng khung giữa animation và ảnh lệch hẳn so với bản gốc.
 */
async function waitForChartsSettled(page, timeout = 12_000) {
  const snapshot = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("svg path, svg rect, svg circle")]
        .map((el) => el.getAttribute("d") ?? `${el.getAttribute("x")}:${el.getAttribute("width")}:${el.getAttribute("cx")}`)
        .join("|"),
    );
  const deadline = Date.now() + timeout;
  let previous = await snapshot();
  let stable = 0;
  while (Date.now() < deadline) {
    await wait(250);
    const current = await snapshot();
    stable = current === previous ? stable + 1 : 0;
    previous = current;
    if (stable >= 3) return true;
  }
  return false;
}

async function clickText(page, selector, text) {
  const handles = await page.$$(selector);
  for (const handle of handles) {
    const value = await handle.evaluate((el) => el.textContent?.trim());
    if (value === text) {
      await handle.click();
      await wait(900);
      return true;
    }
  }
  return false;
}

async function clickPrefix(page, selector, prefix) {
  const handles = await page.$$(selector);
  for (const handle of handles) {
    const value = await handle.evaluate((el) => el.textContent?.trim() ?? "");
    if (value.startsWith(prefix)) {
      await handle.click();
      await wait(900);
      return true;
    }
  }
  return false;
}

async function clickAria(page, label) {
  const handle = await page.$(`[aria-label="${label}"]`);
  if (!handle) return false;
  await handle.click();
  await wait(500);
  return true;
}

const run = async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });
  const report = [];

  for (const testCase of CASES) {
    const page = await browser.newPage();
    const problems = [];
    page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
    });
    await page.setViewport(testCase.vp ?? DESKTOP);

    try {
      await page.goto(BASE + testCase.q, { waitUntil: "networkidle0", timeout: 45_000 });
      // Chờ chart/animation ổn định trước khi chụp.
      await waitForChartsSettled(page);
      if (testCase.act) await testCase.act(page);
      await waitForChartsSettled(page);
      await wait(400);

      const info = await page.evaluate(() => ({
        text: document.getElementById("root")?.innerText ?? "",
        url: location.search,
        docWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        headings: [...document.querySelectorAll("h2,h3")].map((h) => h.textContent?.trim()),
      }));

      // Chụp toàn trang bằng cách nới chiều cao viewport rồi chụp viewport, KHÔNG dùng
      // fullPage: fullPage tự resize ngay lúc chụp, khiến Recharts vẽ lại và ảnh dính
      // đúng khung giữa animation (bar/line ngắn hơn thực tế).
      // Ngoại lệ: modal dùng position:fixed nên nới viewport sẽ đẩy nó ra giữa trang dài;
      // hai ca 31/32 bản gốc chụp ở kích thước viewport sau khi bấm "Xem thêm".
      const vp = testCase.vp ?? DESKTOP;
      // Trang tràn ngang (Overview trên điện thoại) phải chụp fullPage mới lấy được
      // phần vượt mép phải — đúng cách bản gốc đã chụp.
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      const expand =
        !VIEWPORT_ONLY.has(testCase.id) && !testCase.id.includes("modal") && !overflows;
      if (expand) {
        const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewport({ width: vp.width, height: Math.min(docHeight, 30_000) });
        await waitForChartsSettled(page);
        await wait(1800);
      }
      await page.screenshot({
        path: path.join(OUT, `${testCase.id}.png`),
        fullPage: !expand && !VIEWPORT_ONLY.has(testCase.id),
      });
      fs.writeFileSync(
        path.join(OUT, `${testCase.id}.txt`),
        `URL ${info.url}\nviewport ${info.viewportWidth} · document ${info.docWidth}\n\n${info.text}`,
      );

      report.push({
        id: testCase.id,
        url: info.url,
        docWidth: info.docWidth,
        viewportWidth: info.viewportWidth,
        overflow: info.docWidth > info.viewportWidth,
        headings: info.headings,
        problems,
      });
      const flag = problems.length ? ` ⚠ ${problems.length} lỗi console` : "";
      const over = info.docWidth > info.viewportWidth ? ` ⚠ tràn ngang ${info.docWidth}px` : "";
      console.log(`✓ ${testCase.id}${over}${flag}`);
    } catch (err) {
      report.push({ id: testCase.id, error: String(err), problems });
      console.log(`✗ ${testCase.id} — ${err}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(`\nĐã ghi ${report.length} ca vào ${OUT}`);
};

run();
