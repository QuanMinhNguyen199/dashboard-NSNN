/**
 * Kiểm chứng 15 tiêu chí nghiệm thu của THIET-KE-DASHBOARD-NSNN.md §18.
 *
 *   node scripts/acceptance.mjs [baseUrl]
 */
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:5173";
const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

function check(id, name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ id, name, ok });
  const detail = ok
    ? ""
    : "\n     mong đợi " + JSON.stringify(expected) + "\n     thực tế  " + JSON.stringify(actual);
  console.log(`${ok ? "✓" : "✗"} ${String(id).padStart(2)}. ${name}${detail}`);
}

const activeTab = (page) =>
  page.evaluate(
    () => document.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim() ?? null,
  );
const query = (page, key) =>
  page.evaluate((key) => new URLSearchParams(location.search).get(key), key);
const clickTab = async (page, label) => {
  for (const trigger of await page.$$('[role="tab"]')) {
    if ((await trigger.evaluate((el) => el.textContent.trim())) === label) {
      await trigger.click();
      await wait(1400);
      return;
    }
  }
};

const run = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const jsErrors = [];
  page.on("pageerror", (e) => jsErrors.push(String(e)));
  // WebSocket của Vite HMR đứt khi trang vào Back-Forward Cache — tiếng ồn của
  // dev server, không phải lỗi ứng dụng.
  const isNoise = (text) => /WebSocket|Back-Forward Cache|vite/i.test(text);
  page.on("console", (m) => {
    if (m.type() === "error" && !isNoise(m.text())) jsErrors.push(m.text());
  });

  // 1 — Điều hướng bốn tab
  await page.goto(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8", {
    waitUntil: "networkidle0",
  });
  await wait(2400);
  const tabs = await page.evaluate(() =>
    [...document.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim()),
  );
  check(1, "Điều hướng bốn tab hoạt động", tabs, [
    "Tổng quan",
    "Phân tích thu",
    "Chi tiết phường/xã",
    "So sánh nâng cao",
  ]);

  // 2 — Global filter giữ khi chuyển tab
  await page.select("select", "2025");
  await wait(1600);
  await clickTab(page, "Phân tích thu");
  check(
    2,
    "Global filter được giữ khi chuyển tab",
    { tab: await activeTab(page), year: await query(page, "year") },
    { tab: "Phân tích thu", year: "2025" },
  );

  // 3 — Deep link và reload khôi phục trạng thái
  const deep =
    "/?tab=revenue-analysis&section=import-export&view=ranking&year=2026&periodType=QUARTER&period=2&acc=YTD&level=NSTW&indicator=thu-nsnn";
  await page.goto(BASE + deep, { waitUntil: "networkidle0" });
  await wait(2400);
  const beforeReload = await page.evaluate(() => location.search);
  await page.reload({ waitUntil: "networkidle0" });
  await wait(2200);
  check(
    3,
    "Deep link và reload khôi phục đúng trạng thái",
    {
      search: await page.evaluate(() => location.search),
      same: (await page.evaluate(() => location.search)) === beforeReload,
      section: await page.evaluate(
        () => document.querySelector(".dsubnav button.is-active")?.textContent?.trim(),
      ),
      level: await query(page, "level"),
    },
    {
      search: beforeReload,
      same: true,
      section: "Thu xuất nhập khẩu",
      level: "NSTW",
    },
  );

  // 4 — Back đóng drawer và giữ filter
  await page.goto(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8&level=NSDP", {
    waitUntil: "networkidle0",
  });
  await wait(2400);
  await page.evaluate(() => {
    const card = [...document.querySelectorAll(".dcard")].find(
      (el) => el.querySelector("h2")?.textContent?.trim() === "Cơ cấu nguồn thu",
    );
    card.querySelector("button.dbar-row").click();
  });
  await wait(900);
  const drawerOpen = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  await page.goBack({ waitUntil: "domcontentloaded" });
  await wait(1200);
  check(
    4,
    "Back đóng drawer và giữ nguyên bộ lọc",
    {
      opened: drawerOpen,
      closed: await page.evaluate(() => !document.querySelector('[role="dialog"]')),
      level: await query(page, "level"),
    },
    { opened: true, closed: true, level: "NSDP" },
  );

  // 5 — Tổng quan điều hướng sang Phân tích thu và Chi tiết địa bàn
  await page.goto(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8", {
    waitUntil: "networkidle0",
  });
  await wait(2400);
  await page.evaluate(() => {
    const card = [...document.querySelectorAll(".dcard")].find(
      (el) => el.querySelector("h2")?.textContent?.trim() === "Top khoản thu nội địa",
    );
    [...card.querySelectorAll("button")].find((b) => b.textContent.includes("Xem tất cả")).click();
  });
  await wait(1600);
  const toAnalysis = { tab: await activeTab(page), section: await query(page, "section") };

  await page.goto(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8", {
    waitUntil: "networkidle0",
  });
  await wait(2400);
  await page.evaluate(() => {
    const card = [...document.querySelectorAll(".dcard")].find(
      (el) => el.querySelector("h2")?.textContent?.trim() === "Top địa bàn",
    );
    card.querySelector("button.dbar-row").click();
  });
  await wait(1600);
  check(
    5,
    "Tổng quan điều hướng đúng sang Phân tích thu và Chi tiết địa bàn",
    {
      analysis: toAnalysis,
      detail: { tab: await activeTab(page), hasLocation: !!(await query(page, "location")) },
    },
    {
      analysis: { tab: "Phân tích thu", section: "domestic" },
      detail: { tab: "Chi tiết phường/xã", hasLocation: true },
    },
  );

  // 6 — Waterfall điều hướng sang So sánh nâng cao
  await page.goto(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8", {
    waitUntil: "networkidle0",
  });
  await wait(2400);
  await page.evaluate(() => {
    document.querySelector("button.dcontrib-row").click();
  });
  await wait(1600);
  check(
    6,
    "Waterfall điều hướng sang So sánh nâng cao",
    { tab: await activeTab(page), mode: await query(page, "mode") },
    { tab: "So sánh nâng cao", mode: "revenue" },
  );

  // 7 — Drawer hiển thị đúng nguồn và có CTA
  await page.goto(
    BASE + "/?tab=overview&panel=revenue-preview&source=crude-oil&year=2026&periodType=MONTH&period=8",
    { waitUntil: "networkidle0" },
  );
  await wait(2400);
  const drawer = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return null;
    return {
      title: dialog.querySelector("h2")?.textContent?.trim(),
      cta: !![...dialog.querySelectorAll("button")].find((b) =>
        b.textContent.includes("Xem phân tích đầy đủ"),
      ),
      hasClose: !!dialog.querySelector('[aria-label="Đóng bảng xem nhanh"]'),
      metaRows: dialog.querySelectorAll("dl > div").length,
    };
  });
  await page.keyboard.press("Escape");
  await wait(900);
  check(
    7,
    "Drawer mở từ URL trực tiếp, đủ nội dung, Escape đóng được",
    {
      ...drawer,
      escapeClosed: await page.evaluate(() => !document.querySelector('[role="dialog"]')),
    },
    { title: "Thu về dầu thô", cta: true, hasClose: true, metaRows: 6, escapeClosed: true },
  );

  // 8 — Đúng 21 khoản thu nội địa
  await page.goto(
    BASE + "/?tab=revenue-analysis&section=domestic&year=2026&periodType=MONTH&period=8",
    { waitUntil: "networkidle0" },
  );
  await wait(2600);
  check(
    8,
    "Bảng thu nội địa đủ đúng 21 khoản",
    await page.evaluate(() => document.querySelectorAll(".dtable tbody tr").length),
    21,
  );

  // 9 — Null, zero và số âm
  const values = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".dtable tbody tr")].map((tr) =>
      [...tr.children].map((td) => td.textContent.trim()),
    );
    return {
      hasZero: rows.some((r) => r[1] === "0"),
      hasNegative: rows.some((r) => r[4].includes("−")),
      // Không được có "-100%" giả sinh ra từ dữ liệu thiếu.
      fake100: rows.some((r) => /−100,0%|-100.0%/.test(r[4])),
      noNaN: !document.body.innerText.includes("NaN") && !document.body.innerText.includes("Infinity"),
    };
  });
  check(9, "Null, zero và số âm được xử lý đúng", values, {
    hasZero: true,
    hasNegative: true,
    fake100: false,
    noNaN: true,
  });

  // 10 — Waterfall khớp tổng delta
  const reconciled = await page.evaluate(() => {
    const parse = (text) => {
      const m = /(−|-|\+)?\s*([\d.,]+)\s*(nghìn tỷ|tỷ|triệu)?/.exec(text.replace(/\u00a0/g, " "));
      if (!m) return NaN;
      const unit = m[3] === "nghìn tỷ" ? 1e12 : m[3] === "tỷ" ? 1e9 : m[3] === "triệu" ? 1e6 : 1;
      const value = Number(m[2].replace(/\./g, "").replace(",", ".")) * unit;
      return (m[1] === "−" || m[1] === "-" ? -1 : 1) * value;
    };
    const bridge = [...document.querySelectorAll(".dbridge strong")].map((el) => parse(el.textContent));
    const steps = [...document.querySelectorAll(".dcontrib strong")].map((el) => parse(el.textContent));
    const sum = steps.reduce((a, b) => a + b, 0);
    // Sai số làm tròn khi đọc lại từ chuỗi hiển thị, nên nới ngưỡng còn 1%.
    return Math.abs(sum - bridge[2]) / Math.abs(bridge[2] || 1) < 0.01;
  });
  check(10, "Waterfall khớp tổng delta", reconciled, true);

  // 11 — MCP payload không hợp lệ bị từ chối an toàn
  const guard = await page.evaluate(async () => {
    const module = await import("/src/dashboard/providers.ts");
    const dirty = module.sanitizeNavigation([
      { type: "OPEN_LOCATION_DETAIL", locationId: "00004" },
      { type: "OPEN_LOCATION_DETAIL", locationId: "KHONG_CO_THAT" },
      { type: "EVAL", code: "alert(1)" },
      { type: "OPEN_REVENUE_ANALYSIS", sourceId: "<script>", view: "javascript:1" },
      { type: "OPEN_ADVANCED_COMPARISON", mode: "period", entityIds: ["2025m8", "2026m8"] },
    ]);
    let rejected = false;
    try {
      module.validateOverview({ meta: {}, sources: [] });
    } catch {
      rejected = true;
    }
    return { kept: dirty.length, types: dirty.map((d) => d.type), rejected };
  });
  check(11, "MCP payload không hợp lệ bị từ chối an toàn", guard, {
    kept: 2,
    types: ["OPEN_LOCATION_DETAIL", "OPEN_ADVANCED_COMPARISON"],
    rejected: true,
  });

  // 12 — Request cũ không ghi đè request mới
  await page.goto(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8", {
    waitUntil: "networkidle0",
  });
  await wait(2400);
  const periodSelect = () =>
    page.evaluateHandle(() => {
      const label = [...document.querySelectorAll(".dfilters label")].find((l) =>
        (l.querySelector("span")?.textContent ?? "").trim() === "Tháng",
      );
      return label.querySelector("select");
    });
  const handle = await periodSelect();
  await handle.evaluate((select) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    // Đổi kỳ ba lần thật nhanh: chỉ kết quả của lần cuối được phép hiển thị.
    for (const value of ["3", "5", "7"]) {
      setter.call(select, value);
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await wait(2600);
  check(
    12,
    "Request cũ không ghi đè kết quả mới",
    {
      period: await query(page, "period"),
      shownPeriod: await handle.evaluate((select) => select.value),
    },
    { period: "7", shownPeriod: "7" },
  );

  // 13 — Không tràn ngang ở 390, 1024, 1440
  const overflow = [];
  for (const width of [390, 1024, 1440]) {
    for (const tab of ["overview", "revenue-analysis", "location-detail", "advanced-compare"]) {
      await page.setViewport({ width, height: 900 });
      await page.goto(
        BASE + `/?tab=${tab}&year=2026&periodType=MONTH&period=8&location=00004&mode=period&periodA=2025m8&periodB=2026m8`,
        { waitUntil: "networkidle0" },
      );
      await wait(1800);
      const info = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        view: window.innerWidth,
      }));
      if (info.doc > info.view) overflow.push(`${tab}@${width}px=${info.doc}`);
    }
  }
  check(13, "Không tràn ngang ở 390px, 1024px và 1440px", overflow, []);

  await page.setViewport({ width: 1440, height: 1000 });

  // 15 — Không có lỗi JavaScript
  check(15, "Không có lỗi JavaScript chưa xử lý", jsErrors, []);

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${results.length - failed.length}/${results.length} tiêu chí kiểm chứng qua trình duyệt đạt.`,
  );
  console.log("Tiêu chí 14 (TypeScript và production build) kiểm bằng `npm run build`.");
  process.exit(failed.length ? 1 : 0);
};

run();
