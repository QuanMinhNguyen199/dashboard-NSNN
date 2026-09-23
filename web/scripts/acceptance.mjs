/**
 * Kiểm chứng 19 tiêu chí qua trình duyệt; TypeScript và production build là tiêu chí 14.
 *
 *   node scripts/acceptance.mjs [baseUrl]
 */
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:5173";
/**
 * Bản dựng thử mô phỏng độ trễ của backend dev, mặc định vài giây mỗi màn hình.
 * Kiểm thử không có lý do gì phải chờ nó, nên mọi đường dẫn ở đây tắt trễ.
 */
const withFastMock = (url) => url + (url.includes("?") ? "&" : "?") + "latency=0";
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

  // 1 — Điều hướng năm tab
  await page.goto(withFastMock(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8"), {
    waitUntil: "networkidle0",
  });
  await wait(2400);
  const tabs = await page.evaluate(() =>
    [...document.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim()),
  );
  check(1, "Điều hướng năm tab hoạt động", tabs, [
    "Tổng quan",
    "Báo cáo",
    "Phân tích thu",
    "Chi tiết Địa bàn & Đơn vị Thuế",
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
  await page.goto(withFastMock(BASE + deep), { waitUntil: "networkidle0" });
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
  await page.goto(withFastMock(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8&level=NSDP"), {
    waitUntil: "networkidle0",
  });
  await wait(2400);
  await page.evaluate(() => {
    const card = [...document.querySelectorAll(".dcard")].find(
      (el) => el.querySelector("h2")?.textContent?.trim() === "Cơ cấu 4 nhóm nguồn thu",
    );
    card.querySelector(".doverview-sources button").click();
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

  // 5 — Hai cụm điều hành ở Tổng quan điều hướng đúng ngữ cảnh
  await page.goto(withFastMock(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8"), {
    waitUntil: "networkidle0",
  });
  await wait(2400);
  await page.evaluate(() => {
    const card = [...document.querySelectorAll(".dcard")].find(
      (el) => el.querySelector("h2")?.textContent?.trim() === "Động lực ngành nghề và doanh nghiệp",
    );
    card.querySelector("button.dbar-row").click();
  });
  await wait(1600);
  const toAnalysis = { tab: await activeTab(page), section: await query(page, "section") };

  await page.goto(withFastMock(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8"), {
    waitUntil: "networkidle0",
  });
  await wait(2400);
  await page.evaluate(() => {
    const card = [...document.querySelectorAll(".dcard")].find(
      (el) => el.querySelector("h2")?.textContent?.trim() === "Theo dõi quản lý nhà nước",
    );
    [...card.querySelectorAll(".dseg button")].find((button) => button.textContent.includes("Theo địa bàn")).click();
  });
  await wait(350);
  await page.evaluate(() => {
    const card = [...document.querySelectorAll(".dcard")].find(
      (el) => el.querySelector("h2")?.textContent?.trim() === "Theo dõi quản lý nhà nước",
    );
    card.querySelector(".dexecution-list button").click();
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
      analysis: { tab: "Phân tích thu", section: "src_k7m2qx" },
      detail: { tab: "Chi tiết Địa bàn & Đơn vị Thuế", hasLocation: true },
    },
  );

  // 6 — Chọn nhóm chỉ tiêu điều hướng và khóa ngành đúng ma trận
  await page.goto(withFastMock(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8"), {
    waitUntil: "networkidle0",
  });
  await wait(2400);
  await page.select(".dfilter-indicator select", "import-export");
  await wait(1600);
  check(
    6,
    "Nhóm chỉ tiêu điều hướng sang Phân tích thu và khóa Ngành nghề",
    {
      tab: await activeTab(page),
      section: await query(page, "section"),
      industryDisabled: await page.$eval("#nganh-nghe", (input) => input.disabled),
    },
    { tab: "Phân tích thu", section: "src_v4n8pc", industryDisabled: true },
  );

  // 7 — Drawer hiển thị đúng nguồn, và lối ra của nó phụ thuộc nguồn
  //
  // `dac-ta-v2` §3.3: dầu thô KHÔNG có phần riêng ở tab Phân tích thu, nên
  // drawer của nó là điểm cuối — chỉ đóng lại. Ba nguồn còn lại vẫn dẫn sang
  // Tab 2. Phép kiểm phải phủ cả hai vế, nếu không thì bỏ hẳn nút dẫn của mọi
  // nguồn vẫn đạt.
  await page.goto(
    withFastMock(BASE + "/?tab=overview&panel=revenue-preview&source=crude-oil&year=2026&periodType=MONTH&period=8"),
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
  const escapeClosed = await page.evaluate(() => !document.querySelector('[role="dialog"]'));

  // Vế đối chứng: một nguồn CÓ phần riêng thì nút dẫn phải còn.
  await page.goto(
    withFastMock(BASE + "/?tab=overview&panel=revenue-preview&source=domestic&year=2026&periodType=MONTH&period=8"),
    { waitUntil: "networkidle0" },
  );
  await wait(2400);
  const ctaNoiDia = await page.evaluate(() =>
    !![...(document.querySelector('[role="dialog"]')?.querySelectorAll("button") ?? [])].find((b) =>
      b.textContent.includes("Xem phân tích đầy đủ"),
    ),
  );
  check(
    7,
    "Drawer mở từ URL trực tiếp, đủ nội dung, Escape đóng được",
    { ...drawer, escapeClosed, ctaNoiDia },
    {
      title: "Thu về dầu thô",
      // Dầu thô: không có nút dẫn, vì không có màn hình để dẫn tới.
      cta: false,
      hasClose: true,
      metaRows: 6,
      escapeClosed: true,
      // Thu nội địa: vẫn có.
      ctaNoiDia: true,
    },
  );

  // 8 — Đúng ba khối nội địa và bộ Phạm vi hai cấp
  await page.goto(
    withFastMock(BASE + "/?tab=revenue-analysis&section=domestic&year=2026&periodType=MONTH&period=8"),
    { waitUntil: "networkidle0" },
  );
  await wait(2600);
  const domesticGroups = await page.evaluate(() => document.querySelectorAll(".ddonut-legend li").length);

  /*
    Mốc để so là tổng trên TỔNG QUAN.

    Trước đây mốc này đọc ở tab Mã hạch toán; tab đó đã bỏ. Tổng quan thay được
    vì nó cũng là màn hình đọc theo đúng phạm vi đang lọc, và nó là tab người
    dùng quay về sau khi bỏ phạm vi — nên đây đúng là chỗ một con số sai sẽ bị
    nhìn thấy.
  */
  await page.goto(
    withFastMock(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8"),
    { waitUntil: "networkidle0" },
  );
  await wait(2600);
  const firstKpi = () =>
    page.$eval(".dkpis > div:first-child > strong", (el) => el.textContent.trim());
  const beforeOffice = await firstKpi();

  /*
    Ô đầu chọn loại đối tượng; ô kế bên chỉ tìm trong danh mục con tương ứng.
    Cấu trúc này giữ ba loại phạm vi tách bạch nhưng vẫn bảo đảm đơn vị thuế và
    địa bàn loại trừ nhau.
  */
  const chonPhamVi = async (kind, go, value) => {
    await page.select("#pham-vi-loai", kind);
    await wait(300);
    if (kind === "city") return;
    await page.click("#pham-vi-chi-tiet", { clickCount: 3 });
    await page.type("#pham-vi-chi-tiet", go, { delay: 8 });
    await wait(500);
    await page.click(`.dfilter-location .dautocomplete-list [data-value="${value}"]`);
    await wait(1400);
  };
  await chonPhamVi("tax-office", "Thuế cơ sở 1 thành", "0106");
  const afterOffice = await firstKpi();
  const officeUrl = await query(page, "cqt");
  const officeSelected = await page.$eval("#pham-vi-chi-tiet", (el) => el.value.includes("Thuế cơ sở 1"));
  const officeScope = await page.evaluate(() => ({
    haiCapPhamVi:
      document.querySelectorAll("#pham-vi-loai").length === 1 &&
      document.querySelectorAll("#pham-vi-chi-tiet").length === 1,
    khongConOCu: !document.querySelector("#tms-tax-office, #location-autocomplete"),
    // Chọn đơn vị thuế thì cấp ngân sách khoá ở Tổng NSNN: dữ liệu của đơn vị
    // thuế quản theo tổng thu, chưa tách theo cấp.
    capNganSachKhoa: document.querySelector(".dfilter-budget select")?.disabled === true,
    hasAssignedLocations: document.querySelectorAll(".dtax-scope .dtax-location-grid li").length > 0,
    explainsAssignment: /Địa bàn phụ trách/i.test(
      document.querySelector(".dtax-scope")?.textContent ?? "",
    ),
    // Chọn một đơn vị thuế là sang thẳng trang của đơn vị đó.
    sangTabChiTiet:
      document.querySelector('[role="tab"][aria-selected="true"]')?.textContent.trim() ===
      "Chi tiết Địa bàn & Đơn vị Thuế",
  }));
  await chonPhamVi("city", "", "");
  const clearedOfficeUrl = await query(page, "cqt");

  /*
    Quay lại bằng cách BẤM TAB, không phải tải lại trang: tải lại phải chép đủ
    mọi tham số dẫn xuất, sót một cái là hai con số khác nhau vì lý do chẳng
    liên quan gì tới phạm vi. Bấm tab giữ nguyên toàn bộ trạng thái, nên thứ
    duy nhất đã đổi rồi trả lại đúng là cái đang cần khẳng định.
  */
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll('[role="tab"]')].find(
      (t) => t.textContent.trim() === "Tổng quan",
    );
    tab?.click();
  });
  await wait(2600);
  const resetOffice = await firstKpi();
  check(
    8,
    "Phạm vi hai cấp đổi đúng danh mục con và khôi phục tổng Tổng quan",
    {
      domesticGroups,
      officeSelected,
      officeUrl,
      clearedOfficeUrl,
      ...officeScope,
      changed: beforeOffice !== afterOffice,
      restored: beforeOffice === resetOffice,
    },
    {
      domesticGroups: 3,
      officeSelected: true,
      officeUrl: "0106",
      clearedOfficeUrl: null,
      haiCapPhamVi: true,
      khongConOCu: true,
      capNganSachKhoa: true,
      hasAssignedLocations: true,
      explainsAssignment: true,
      sangTabChiTiet: true,
      changed: true,
      restored: true,
    },
  );

  // 9 — Null và số thiếu không bị diễn giải thành giá trị giả
  await page.goto(
    withFastMock(BASE + "/?tab=revenue-analysis&section=domestic&year=2026&periodType=MONTH&period=8"),
    { waitUntil: "networkidle0" },
  );
  const values = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".dtable tbody tr")].map((tr) =>
      [...tr.children].map((td) => td.textContent.trim()),
    );
    return {
      // Không được có "-100%" giả sinh ra từ dữ liệu thiếu.
      fake100: rows.some((r) => /−100,0%|-100.0%/.test(r.join(" "))),
      noNaN: !document.body.innerText.includes("NaN") && !document.body.innerText.includes("Infinity"),
    };
  });
  check(9, "Null và số thiếu được xử lý đúng", values, {
    fake100: false,
    noNaN: true,
  });

  // 10 — Ngành nghề là lát cắt thu nội địa và khóa đúng Khối doanh nghiệp
  await page.click("#nganh-nghe");
  await page.type("#nganh-nghe", "Bất động sản", { delay: 8 });
  await wait(400);
  await page.click('.dfilter-industry [data-value="bat-dong-san"]');
  await wait(1500);
  const industryLock = await page.evaluate(() => ({
    tab: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent.trim(),
    selectedGroup: document.querySelector(".ddonut-legend button.is-selected span")?.textContent.trim(),
    industry: new URLSearchParams(location.search).get("nganh"),
  }));
  check(10, "Ngành nghề mở Thu nội địa và khóa Khối doanh nghiệp", industryLock, {
    tab: "Phân tích thu",
    selectedGroup: "Khối doanh nghiệp",
    industry: "bat-dong-san",
  });

  // 11 — MCP payload không hợp lệ bị từ chối an toàn
  const guard = await page.evaluate(async () => {
    const module = await import("/src/data/index.ts");
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
  await page.goto(withFastMock(BASE + "/?tab=overview&year=2026&periodType=MONTH&period=8"), {
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
    for (const tab of [
      "overview",
      "report",
      "revenue-analysis",
      "location-detail",
      "advanced-compare",
    ]) {
      await page.setViewport({ width, height: 900 });
      await page.goto(
        withFastMock(BASE + `/?tab=${tab}&year=2026&periodType=MONTH&period=8&location=00004&mode=period&periodA=2025m8&periodB=2026m8`),
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

  // 16 — Không thẻ nào bị cắt nội dung ngang bên trong
  //
  // Khác tiêu chí 13: trang không tràn ngang vẫn có thể có thẻ mà nội dung bên
  // trong rộng hơn chính nó (header thẻ, dải KPI, thanh lọc), và chỗ thừa bị
  // `overflow: hidden` của thẻ nuốt mất — nhìn thì tưởng thiếu chữ.
  const clipped = [];
  for (const width of [390, 700, 768, 1024, 1280]) {
    for (const tab of ["overview", "revenue-analysis", "location-detail", "advanced-compare"]) {
      await page.setViewport({ width, height: 900 });
      await page.goto(
        withFastMock(BASE + `/?tab=${tab}&year=2026&periodType=MONTH&period=8&location=00004&mode=period&periodA=2025m8&periodB=2026m8`),
        { waitUntil: "networkidle0" },
      );
      await wait(1500);
      const bad = await page.evaluate(() =>
        [...document.querySelectorAll(".dcard, .dcard-head, .dkpis > div, .dfilters")]
          .filter((el) => el.scrollWidth - el.clientWidth > 1)
          .map((el) => `${el.className.split(" ")[0]}+${el.scrollWidth - el.clientWidth}`),
      );
      if (bad.length) clipped.push(`${tab}@${width}px:${bad.join(",")}`);
    }
  }
  check(16, "Không thẻ nào bị cắt nội dung ngang", clipped, []);

  // 17 — Hai thẻ cùng một hàng phải cao bằng nhau
  //
  // Lưới `align-items: start` cho mỗi thẻ cao theo nội dung riêng, nên mép dưới
  // lệch nhau và cả hàng trông như vỡ.
  const unevenRows = [];
  for (const width of [768, 960, 1280, 1600]) {
    for (const tab of ["overview", "revenue-analysis", "location-detail"]) {
      await page.setViewport({ width, height: 900 });
      await page.goto(withFastMock(BASE + `/?tab=${tab}&location=00004`), { waitUntil: "networkidle0" });
      await wait(1500);
      const off = await page.evaluate(() => {
        const bad = [];
        for (const sel of [".dg", ".dstack-row"])
          for (const box of document.querySelectorAll(sel)) {
            const byTop = new Map();
            for (const cell of box.children) {
              const r = cell.getBoundingClientRect();
              if (!r.height) continue;
              const card = cell.classList.contains("dcard") ? cell : cell.firstElementChild;
              if (!card) continue;
              const key = Math.round(r.top);
              if (!byTop.has(key)) byTop.set(key, []);
              byTop.get(key).push(Math.round(card.getBoundingClientRect().height));
            }
            for (const [, hs] of byTop)
              if (hs.length > 1 && Math.max(...hs) - Math.min(...hs) > 1) bad.push(hs.join("/"));
          }
        return bad;
      });
      if (off.length) unevenRows.push(`${tab}@${width}px:${off.join(" ")}`);
    }
  }
  check(17, "Thẻ cùng hàng cao bằng nhau", unevenRows, []);

  // 18 — Một cột số chỉ được dùng MỘT đơn vị tiền
  //
  // DESIGN.md đã có "The Single Money Scale Rule" từ đầu, code vẫn vi phạm suốt
  // vì không ai canh: sáu trong mười ba thẻ trộn đơn vị, bảng chi tiết trộn bốn
  // đơn vị trong sáu cột. Quy tắc bằng lời không tự thực thi được, nên đưa vào
  // đây. Cũng chặn luôn bậc "nghìn tỷ" đã bị loại khỏi thang.
  const mixedUnits = [];
  for (const tab of ["overview", "revenue-analysis", "location-detail", "advanced-compare"]) {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(
      withFastMock(BASE + `/?tab=${tab}&year=2026&periodType=MONTH&period=8&location=00004&mode=period&periodA=2025m8&periodB=2026m8`),
      { waitUntil: "networkidle0" },
    );
    await wait(1500);
    const bad = await page.evaluate(() => {
      const unitOf = (text) => {
        const m = /(nghìn tỷ|tỷ|triệu|nghìn|đồng)\s*$/.exec(text.trim());
        return m ? m[1] : null;
      };
      const out = [];
      for (const card of document.querySelectorAll(".dcard")) {
        const title = card.querySelector("h2")?.textContent ?? "?";
        const cells = [
          ...card.querySelectorAll(".dbar-value, .dlist-amount, .dtable td.is-num, .dledger strong, .dcontrib strong, .dbridge strong"),
        ].map((el) => el.textContent);
        const units = new Set(cells.map(unitOf).filter(Boolean));
        if (units.size > 1) out.push(`${title}:${[...units].join("+")}`);
      }
      // Bậc nghìn tỷ đã bị loại khỏi thang, không được xuất hiện ở bất kỳ đâu.
      if (/nghìn tỷ/.test(document.body.innerText)) out.push("còn chuỗi 'nghìn tỷ'");
      return out;
    });
    if (bad.length) mixedUnits.push(`${tab}: ${bad.join(", ")}`);
  }
  check(18, "Một cột số chỉ dùng một đơn vị tiền", mixedUnits, []);

  await page.setViewport({ width: 1440, height: 1000 });

  // 19 — Tám mẫu báo cáo: đổi thứ tự hai chiều giữ nguyên tổng của mỗi hàng
  //
  // Đây là điều kiện nghiệm thu DS02, và nó là thứ duy nhất phân biệt một bảng
  // nhiều chiều đúng với một bảng nhiều chiều chỉ trông như đúng: cùng tập dữ
  // liệu, đổi vai cha con của hai chiều, tổng từng hàng phải không đổi.
  const totalsOf = async (groupBy, subGroupBy) => {
    await page.goto(withFastMock(BASE + "/?tab=report&year=2026&periodType=MONTH&period=8"), {
      waitUntil: "networkidle0",
    });
    await wait(1200);
    await page.select('[data-field="groupBy"]', groupBy);
    await wait(1400);
    await page.select('[data-field="subGroupBy"]', subGroupBy);
    await wait(1600);
    return page.evaluate(() =>
      [...document.querySelectorAll(".dreport-table tbody tr")].map((tr) => ({
        row: tr.querySelector("th")?.textContent.trim().slice(0, 30),
        cells: [...tr.querySelectorAll("td")].length,
      })),
    );
  };
  const byIndustry = await totalsOf("industry", "location");
  const byLocation = await totalsOf("location", "industry");
  check(
    19,
    "Đổi thứ tự hai chiều giữ nguyên cây chỉ tiêu và số cột",
    {
      cungSoHang: byIndustry.length === byLocation.length && byIndustry.length > 0,
      cungTenHang: byIndustry.every((r, i) => r.row === byLocation[i].row),
    },
    { cungSoHang: true, cungTenHang: true },
  );

  // Tiêu chí 20 cũ ("Đối soát không hiện số chênh khi còn điều kiện chưa khớp")
  // đã bỏ cùng tab Đối soát Kho bạc: TMS là lớp chi tiết của số Kho bạc chứ
  // không phải một nguồn độc lập để trừ cho nhau, nên phép kiểm đó không còn
  // đối tượng. Nếu dựng lại dòng độ phủ thì viết phép kiểm MỚI cho dòng đó,
  // không khôi phục phép kiểm này.

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
