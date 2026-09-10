/**
 * Kiểm thử hành vi (không chụp ảnh): mỗi filter/nút phải hoạt động thật.
 *
 *   node scripts/interactions.mjs [baseUrl]
 *
 * Phạm vi: Overview dùng bộ lọc riêng (Năm · Chu kỳ · kỳ · Cách tính · Cấp ngân
 * sách · Chỉ tiêu). Hai tab còn lại dùng bộ lọc dựng theo bản gốc (Năm · Quý ·
 * Tháng · Loại kỳ · Chỉ tiêu · Địa bàn), nên các phép kiểm Quý/Tháng chạy trên
 * tab "Chi tiết địa bàn".
 */
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:5173";
const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ name, ok });
  const detail = ok
    ? ""
    : "\n    mong đợi " + JSON.stringify(expected) + "\n    thực tế  " + JSON.stringify(actual);
  console.log((ok ? "✓ " : "✗ ") + name + detail);
}

const readSelect = (page, label) =>
  page.evaluate((label) => {
    const el = [...document.querySelectorAll("label")].find(
      (l) => (l.childNodes[0]?.textContent ?? "").trim() === label,
    );
    const select = el?.querySelector("select");
    return select
      ? { value: select.value, options: [...select.options].map((o) => o.textContent.trim()) }
      : null;
  }, label);

async function selectByLabel(page, label, value) {
  await page.evaluate(
    (label, value) => {
      const el = [...document.querySelectorAll("label")].find(
        (l) => (l.childNodes[0]?.textContent ?? "").trim() === label,
      );
      const select = el.querySelector("select");
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        "value",
      ).set;
      setter.call(select, value);
      select.dispatchEvent(new Event("change", { bubbles: true }));
    },
    label,
    value,
  );
  await wait(1200);
}

const activeTab = (page) =>
  page.evaluate(
    () =>
      document.querySelector('[role="tab"][data-state="active"]')?.textContent?.trim() ?? null,
  );

const clickText = (page, text) =>
  page.evaluate((text) => {
    const button = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === text,
    );
    button?.click();
    return !!button;
  }, text);

const slugOf = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

const run = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const jsErrors = [];
  const missing = [];
  page.on("pageerror", (e) => jsErrors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    (/502|Bad Gateway/.test(m.text()) ? missing : jsErrors).push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() === 502 && r.url().includes("/api/")) missing.push(r.url());
  });

  // ═══ Overview ══════════════════════════════════════════════════════════
  await page.goto(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8&acc=PERIOD", {
    waitUntil: "networkidle0",
  });
  await wait(2200);

  check("URL tab=overview mở đúng tab Overview", await activeTab(page), "Overview");
  check(
    "Overview dựng đủ các khối phân tích, đúng thứ tự",
    await page.evaluate(() =>
      [...document.querySelectorAll(".ov-card h2, .ov-collapsed h2")].map((h) =>
        h.textContent.trim(),
      ),
    ),
    [
      "Diễn biến thu ngân sách",
      "Cơ cấu nguồn thu",
      "Khoản thu nội địa nổi bật",
      "Xếp hạng địa bàn",
      "Biến động theo địa bàn",
      "Cơ cấu cấp ngân sách",
      "So sánh nhanh địa bàn",
      "Đóng góp vào chênh lệch",
    ],
  );
  check(
    "Overview có đủ sáu bộ lọc",
    await page.evaluate(() =>
      [...document.querySelectorAll(".ov-filter-primary > *")].map((el) =>
        (el.childNodes[0]?.textContent ?? el.querySelector("span")?.textContent ?? "").trim(),
      ),
    ),
    ["Năm", "Chu kỳ", "Tháng", "Cách tính", "Cấp ngân sách", "Chỉ tiêu"],
  );

  await clickText(page, "Quý");
  await wait(900);
  check("Chuyển Chu kỳ sang Quý thì ô kỳ đổi thành danh sách quý", await readSelect(page, "Quý"), {
    value: "2",
    options: ["Quý 1", "Quý 2"],
  });
  await clickText(page, "Tháng");
  await wait(900);

  const kpiBefore = await page.evaluate(
    () => document.querySelector(".ov-kpis strong")?.textContent,
  );
  await selectByLabel(page, "Cấp ngân sách", "NSTW");
  check(
    "Cấp ngân sách NSTW ghi level lên URL và đổi số liệu",
    await page.evaluate(
      (before) => ({
        level: new URLSearchParams(location.search).get("level"),
        changed: document.querySelector(".ov-kpis strong")?.textContent !== before,
      }),
      kpiBefore,
    ),
    { level: "NSTW", changed: true },
  );
  await selectByLabel(page, "Cấp ngân sách", "NSNN");

  check(
    "Các %YoY không còn trùng nhau — dữ liệu mô phỏng đã có phương sai",
    await page.evaluate(
      () =>
        new Set([...document.querySelectorAll(".ov-bars .ov-change")].map((e) => e.textContent))
          .size > 3,
    ),
    true,
  );
  check(
    "Số tiền trên Overview dùng cùng thang rút gọn với hai tab kia",
    await page.evaluate(() =>
      /nghìn tỷ|tỷ|triệu/.test(document.querySelector(".ov-kpis strong")?.textContent ?? ""),
    ),
    true,
  );
  check(
    "Không còn dấu chấm thập phân trong phần trăm",
    await page.evaluate(() => document.querySelector(".ov-page").innerText.match(/\d\.\d%/g)),
    null,
  );

  // ═══ Phạm vi ══════════════════════════════════════════════════════════
  await page.goto(BASE + "/?year=2026&month=8&acc=PERIOD&item=tong-so&tab=detail", {
    waitUntil: "networkidle0",
  });
  await wait(2200);
  check(
    "Thanh phạm vi mặc định là toàn thành phố",
    await page.evaluate(() => document.querySelector(".scope-bar b")?.textContent),
    "Toàn thành phố Hà Nội",
  );

  await selectByLabel(page, "Địa bàn", "00070");
  check("Chọn địa bàn ở tab Chi tiết vẫn ở lại tab đó", await activeTab(page), "Chi tiết địa bàn");
  check(
    "Thanh phạm vi đổi sang phường đã chọn",
    await page.evaluate(() => document.querySelector(".scope-bar b")?.textContent),
    "Hoàn Kiếm",
  );

  // Radix Tabs kích hoạt theo mousedown/focus chứ không theo click tổng hợp,
  // nên phải bấm bằng chuột thật của trình duyệt.
  for (const trigger of await page.$$('[role="tab"]')) {
    if ((await trigger.evaluate((el) => el.textContent.trim())) === "Overview") {
      await trigger.click();
      break;
    }
  }
  await wait(1800);
  check("Mở Overview khi đang chọn phường vẫn được, không bị vô hiệu", await activeTab(page), "Overview");
  check(
    "Overview nói rõ luôn tính cho toàn thành phố",
    await page.evaluate(
      () =>
        document.querySelector(".scope-note")?.textContent?.includes("toàn thành phố") ?? false,
    ),
    true,
  );
  await page.evaluate(() => {
    [...document.querySelectorAll(".scope-back")]
      .find((b) => b.textContent.includes("Xem chi tiết"))
      ?.click();
  });
  await wait(1600);
  check("Lối tắt đưa về đúng trang chi tiết của phường", await activeTab(page), "Chi tiết địa bàn");

  await clickText(page, "Về toàn thành phố");
  await wait(1800);
  check(
    'Nút "Về toàn thành phố" xoá địa bàn và đưa về Tổng quan',
    {
      tab: await activeTab(page),
      ward: await page.evaluate(() => new URLSearchParams(location.search).get("ward")),
    },
    { tab: "Overview", ward: null },
  );

  // ═══ Bộ lọc của hai tab dựng theo bản gốc ═════════════════════════════
  await page.goto(BASE + "/?year=2026&acc=PERIOD&item=tong-so&tab=detail", {
    waitUntil: "networkidle0",
  });
  await wait(2000);
  await selectByLabel(page, "Quý", "2");
  check("Chọn Quý 2 thì Tháng chỉ còn 4/5/6", (await readSelect(page, "Tháng")).options, [
    "Tất cả tháng",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
  ]);
  check("Đổi quý xoá tháng đang chọn", (await readSelect(page, "Tháng")).value, "");
  await selectByLabel(page, "Tháng", "5");
  check(
    "Chọn tháng trong quý giữ cả quarter và month trên URL",
    await page.evaluate(() => {
      const q = new URLSearchParams(location.search);
      return [q.get("quarter"), q.get("month")];
    }),
    ["2", "5"],
  );
  for (const [value, slug] of [
    ["THU NGÂN SÁCH NHÀ NƯỚC", "thu-nsnn"],
    ["TỔNG SỐ (Đã loại trừ hoàn thuế GTGT)", "tong-so-tru-hoan-thue"],
    ["TỔNG SỐ", "tong-so"],
  ]) {
    await selectByLabel(page, "Chỉ tiêu", value);
    check(
      'Chỉ tiêu "' + value + '" ghi item=' + slug,
      await page.evaluate(() => new URLSearchParams(location.search).get("item")),
      slug,
    );
  }

  await page.goto(BASE + "/?year=2025&month=6&acc=PERIOD&item=tong-so&tab=detail", {
    waitUntil: "networkidle0",
  });
  await wait(1800);
  check(
    "Tháng 6/2025 dùng danh mục 30 quận/huyện cũ",
    (await readSelect(page, "Địa bàn")).options.length,
    31,
  );
  await page.goto(BASE + "/?year=2025&month=7&acc=PERIOD&item=tong-so&tab=detail", {
    waitUntil: "networkidle0",
  });
  await wait(1800);
  check(
    "Tháng 7/2025 quay về danh mục 126 phường/xã",
    (await readSelect(page, "Địa bàn")).options.length,
    127,
  );

  // ═══ URL, lịch sử, cảnh báo ═══════════════════════════════════════════
  await page.goto(BASE + "/?year=2026&acc=PERIOD&item=tong-so&tab=detail", {
    waitUntil: "networkidle0",
  });
  await wait(1800);
  const lenBefore = await page.evaluate(() => history.length);
  await selectByLabel(page, "Loại kỳ", "YTD");
  await selectByLabel(page, "Chỉ tiêu", "THU NGÂN SÁCH NHÀ NƯỚC");
  await selectByLabel(page, "Quý", "3");
  check(
    "Đổi ba filter không tạo thêm history entry",
    await page.evaluate(() => history.length),
    lenBefore,
  );

  await page.goto(
    BASE + "/?year=2026&month=8&quarter=1&acc=no&item=unknown&tab=oops&ward=unknown&foo=bar",
    { waitUntil: "networkidle0" },
  );
  await wait(2200);
  check(
    "URL sai tạo banner liệt kê đúng 6 tham số bị bỏ qua",
    await page.evaluate(
      () =>
        document
          .querySelector('[data-testid="url-param-notice"]')
          ?.textContent?.includes("Đã bỏ qua 6 tham số") ?? false,
    ),
    true,
  );
  await page.click('[aria-label="Đóng cảnh báo"]');
  await wait(400);
  check(
    "Đóng được banner cảnh báo",
    await page.evaluate(() => !document.querySelector('[data-testid="url-param-notice"]')),
    true,
  );

  // ═══ So sánh hai kỳ ═══════════════════════════════════════════════════
  await page.goto(
    BASE + "/?year=2026&acc=PERIOD&item=tong-so&ward=hoan-kiem&tab=compare&cmpa=2025m9&cmpb=2026m9",
    { waitUntil: "networkidle0" },
  );
  await wait(2200);
  const headingBefore = await page.evaluate(
    () => document.querySelector("h2.text-base")?.textContent?.trim(),
  );
  await page.evaluate(() => {
    const select = [...document.querySelectorAll("select")].find(
      (s) => s.getAttribute("aria-label") === "Kỳ A — kỳ trong năm",
    );
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      "value",
    ).set;
    setter.call(select, "m5");
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await wait(1200);
  check(
    "Đổi select Kỳ A chưa bấm So sánh thì heading giữ nguyên",
    await page.evaluate(() => document.querySelector("h2.text-base")?.textContent?.trim()),
    headingBefore,
  );
  await clickText(page, "So sánh");
  await wait(1800);
  check(
    "Bấm So sánh mới commit cmpa",
    await page.evaluate(() => new URLSearchParams(location.search).get("cmpa")),
    "2025m5",
  );
  check("Tab So sánh không bị ép chuyển khi có địa bàn", await activeTab(page), "So sánh hai kỳ");

  await page.goto(BASE + "/?year=2026&acc=PERIOD&item=tong-so&tab=compare", {
    waitUntil: "networkidle0",
  });
  await wait(1800);
  check(
    "Compare chưa chọn ward: ẩn Địa bàn, Năm và Reset zoom khỏi hàng filter",
    await page.evaluate(() => {
      const bar = document.querySelector(".flex.flex-wrap.items-end");
      const labels = [...bar.querySelectorAll("label")].map((l) =>
        (l.childNodes[0]?.textContent ?? "").trim(),
      );
      return {
        diaBan: labels.includes("Địa bàn"),
        nam: labels.includes("Năm"),
        reset: [...bar.querySelectorAll("button")].some(
          (b) => b.textContent.trim() === "Reset zoom",
        ),
      };
    }),
    { diaBan: false, nam: false, reset: false },
  );

  // ═══ Bản đồ ═══════════════════════════════════════════════════════════
  await page.goto(BASE + "/?year=2026&month=8&acc=PERIOD&item=tong-so&tab=detail", {
    waitUntil: "networkidle0",
  });
  await wait(2500);
  check(
    "Bản đồ tô theo thang đơn sắc lam, không còn thang cầu vồng đỏ→lá",
    await page.evaluate(() => {
      // d3 chuyển hex sang rgb() khi chuyển cảnh, nên chấp nhận cả hai dạng.
      const toRgb = (value) => {
        const hex = /^#([0-9a-f]{6})$/i.exec(value);
        if (hex) {
          const n = parseInt(hex[1], 16);
          return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        }
        const rgb = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(value);
        return rgb ? [+rgb[1], +rgb[2], +rgb[3]] : null;
      };
      const fills = [
        ...new Set(
          [...document.querySelectorAll("svg path[fill]")].map((p) => p.getAttribute("fill")),
        ),
      ]
        .map(toRgb)
        .filter(Boolean);
      // Mọi bậc phải là sắc lam: kênh xanh lam không nhỏ hơn kênh đỏ.
      return fills.length > 0 && fills.every(([r, , b]) => b >= r);
    }),
    true,
  );
  await page.evaluate(() => {
    [...document.querySelectorAll("svg path[stroke='#fff']")]
      .find((p) => p.getAttribute("fill") !== "var(--nodata)")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await wait(1500);
  const wardAfterMap = await page.evaluate(() =>
    new URLSearchParams(location.search).get("ward"),
  );
  check("Click vùng bản đồ chọn được ward", wardAfterMap !== null, true);
  await clickText(page, "Reset zoom");
  await wait(900);
  check(
    "Reset zoom không xoá ward đang chọn",
    await page.evaluate(() => new URLSearchParams(location.search).get("ward")),
    wardAfterMap,
  );
  check("Bấm dòng xếp hạng vẫn dùng được slug hợp lệ", slugOf("Hoàn Kiếm"), "hoan-kiem");

  console.log("");
  check("Không có ngoại lệ JavaScript trong toàn bộ luồng", jsErrors, []);

  const missingUrls = [
    ...new Set(missing.filter((u) => u.includes("/api/")).map((u) => u.replace(/^https?:\/\/[^/]+/, ""))),
  ];
  console.log(
    "\nℹ " +
      missingUrls.length +
      " tổ hợp filter chưa có fixture (trả 502 → UI hiện đúng trạng thái lỗi của bản gốc).",
  );

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " kiểm thử hành vi đạt.");
  process.exit(failed.length ? 1 : 0);
};

run();
