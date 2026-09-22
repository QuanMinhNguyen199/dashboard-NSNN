/**
 * Kiểm chứng ba workspace mở theo biên bản 18/09/2026.
 *
 * Tách khỏi `acceptance.mjs` vì nó kiểm những lời hứa KHÁC: tổng cộng khớp,
 * mock luôn có nhãn, mã doanh nghiệp không phải mã số thuế, URL cũ vẫn mở đúng.
 *
 *   node scripts/check-workspaces.mjs http://127.0.0.1:5173
 */
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://127.0.0.1:5173";
const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ name, ok, actual, expected });
  console.log(`${ok ? "✓" : "✗"} ${name}`);
  if (!ok) {
    console.log("     mong đợi", JSON.stringify(expected));
    console.log("     thực tế ", JSON.stringify(actual));
  }
}

const P = "year=2026&periodType=MONTH&period=8&latency=0";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const jsErrors = [];
page.on("pageerror", (e) => jsErrors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error" && !/WebSocket|vite|Back-Forward/i.test(m.text())) jsErrors.push(m.text());
});

/** Mở một CHẾ ĐỘ của tab Báo cáo. Ba mảng mới không còn là tab cấp cao. */
const open = async (mode, extra = "") => {
  await page.goto(`${BASE}/?tab=report&report=${mode}&${P}${extra}`, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => document.querySelectorAll(".dkpis").length > 0, {
    timeout: 60000,
    polling: 200,
  });
  await wait(600);
};

/* ── 1. Dự toán: tổng cộng khớp và mở được một địa bàn ───────────────────── */
await open("budget");
const budget = await page.evaluate(() => {
  const num = (t) => Number(String(t).replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", "."));
  const rows = [...document.querySelectorAll(".dbudget-table tbody")];
  return {
    coBang: rows.length > 0,
    soDong: rows.length,
    coKpiSaiSo: [...document.querySelectorAll(".dkpis > div")].some((d) =>
      /Sai số dự báo/.test(d.textContent),
    ),
    // Mock không được tuyên bố đạt chỉ tiêu 3%.
    khongTuyenBoDat: !/\bĐạt\b/.test(document.querySelector("main").innerText),
    coNhanMock: /Dữ liệu mô phỏng/.test(document.querySelector("main").innerText),
    _num: num,
  };
});
check(
  "Dự toán: có bảng, có KPI sai số, không tuyên bố Đạt, có nhãn mô phỏng",
  {
    coBang: budget.coBang,
    coKpiSaiSo: budget.coKpiSaiSo,
    khongTuyenBoDat: budget.khongTuyenBoDat,
    coNhanMock: budget.coNhanMock,
  },
  { coBang: true, coKpiSaiSo: true, khongTuyenBoDat: true, coNhanMock: true },
);
check(
  "Dự toán: nhận đủ 126 địa bàn và các mốc điều hành từ bộ 18-09",
  await page.evaluate(() => {
    const text = document.querySelector("main").innerText.replace(/\s+/g, " ");
    return {
      coBangTienDo: document.querySelectorAll(".dbudget-table tbody").length > 0,
      rows: document.querySelectorAll(".dofficial-plan-table tbody tr").length,
      plan: /Dự toán năm 613\.500 tỷ/.test(text),
      actual: /Thực hiện tháng 8 35\.492 tỷ/.test(text),
      estimate: /Ước thực hiện cả năm 740\.314 tỷ/.test(text),
    };
  }),
  { coBangTienDo: true, rows: 126, plan: true, actual: true, estimate: true },
);

// Mở một dòng để xem thành phần cấu thành.
const expanded = await page.evaluate(async () => {
  const btn = document.querySelector(".dbudget-table .dtms-toggle:not([disabled])");
  if (!btn) return { moDuoc: false, dongCon: 0 };
  btn.click();
  await new Promise((r) => setTimeout(r, 400));
  return { moDuoc: true, dongCon: document.querySelectorAll(".dbudget-table tr.is-child").length };
});
check("Dự toán: mở một dòng thấy thành phần cấu thành", expanded.moDuoc && expanded.dongCon > 0, true);

// Đổi sang chế độ theo khoản thu.
await page.evaluate(() => {
  [...document.querySelectorAll(".dlocalbar .dseg button")]
    .find((b) => /khoản thu/i.test(b.textContent))
    ?.click();
});
await wait(2200);
check(
  "Dự toán: chuyển được sang Theo sắc thuế/khoản thu",
  await page.evaluate(() => /Khoản thu/.test(document.querySelector(".dbudget-table thead").textContent)),
  true,
);

/* ── 2. Doanh nghiệp: tổng khớp, token không phải MST ────────────────────── */
await open("taxpayer");
const ent = await page.evaluate(() => {
  const txt = document.querySelector("main").innerText;
  // Bảng có phân trang nên cộng các ô đang hiện KHÔNG ra tổng nữa. Thứ phải
  // kiểm là dòng Tổng ghim ở `tfoot`: nó là cách duy nhất còn lại để người xem
  // đối chiếu tổng danh bạ mà không phải lật hết các trang.
  const totalRow = document.querySelector(".dent-table tfoot tr.is-total");
  const totalCell = totalRow?.querySelector('td[data-label="Doanh nghiệp"]');
  return {
    coNhomChuaXacDinh: /Chưa xác định/.test(txt),
    soNhom: document.querySelectorAll(".dent-table tbody tr").length,
    coNhanMock: /Dữ liệu mô phỏng/.test(txt),
    coTongDanhBa: /Bản ghi danh bạ\s+473\.618/.test(txt),
    directoryTotalRow: Number((totalCell?.textContent ?? "").replace(/\D/g, "")) || 0,
  };
});
check(
  "Doanh nghiệp: có nhóm chưa xác định trong bảng, có nhãn mô phỏng",
  {
    coNhomChuaXacDinh: ent.coNhomChuaXacDinh,
    coNhanMock: ent.coNhanMock,
    coNhom: ent.soNhom > 0,
    coTongDanhBa: ent.coTongDanhBa,
    danhBaCongKhop: ent.directoryTotalRow === 473618,
  },
  {
    coNhomChuaXacDinh: true,
    coNhanMock: true,
    coNhom: true,
    coTongDanhBa: true,
    danhBaCongKhop: true,
  },
);

// Mở một nhóm rồi kiểm tra master–detail: hai cột cùng hàng và không cưỡng bức
// cuộn trang như cách chèn card xuống dưới trước đây.
const detail = await page.evaluate(async () => {
  const buttons = document.querySelectorAll(".dent-table tbody .dlink");
  const btn = buttons[1] ?? buttons[0];
  if (!btn) return null;
  const before = window.scrollY;
  btn.click();
  await new Promise((r) => setTimeout(r, 400));
  const split = document.querySelector(".dreport-master-detail");
  const master = split?.children[0]?.getBoundingClientRect();
  const side = split?.children[1]?.getBoundingClientRect();
  return {
    tokens: [...document.querySelectorAll(".dent-list .dtms-code")].map((e) => e.textContent.trim()),
    headers: [...document.querySelectorAll(".dent-list thead th")].map((e) => e.textContent.trim()),
    repeatedGroupNames: [...document.querySelectorAll(".dent-list tbody th")].filter((e) =>
      /Thuế cơ sở \d+ thành phố Hà Nội/.test(e.textContent),
    ).length,
    keptPosition: Math.abs(window.scrollY - before) < 5,
    sameRow: Boolean(master && side && Math.abs(master.top - side.top) < 5),
  };
});
check(
  "Doanh nghiệp: mở một nhóm thấy danh sách doanh nghiệp",
  Array.isArray(detail?.tokens) && detail.tokens.length > 0,
  true,
);
check(
  "Doanh nghiệp: master–detail cùng hàng và không tự cuộn trang",
  detail ? { keptPosition: detail.keptPosition, sameRow: detail.sameRow } : null,
  { keptPosition: true, sameRow: true },
);
check(
  "Doanh nghiệp: không mã nào mang hình dạng mã số thuế",
  (detail?.tokens ?? []).filter((t) => /^\d{10}(-\d{3})?$/.test(t)).length,
  0,
);
check(
  "Doanh nghiệp: chi tiết không lặp nguồn quản lý hoặc tên nhóm",
  detail ? { headers: detail.headers, repeatedGroupNames: detail.repeatedGroupNames } : null,
  { headers: ["Doanh nghiệp", "Số thu (tỷ đồng) ↓", "So cùng kỳ"], repeatedGroupNames: 0 },
);

// Ba góc nhìn đổi được.
const views = [];
for (const label of ["Theo cơ quan thuế", "Theo địa bàn"]) {
  await page.evaluate((l) => {
    [...document.querySelectorAll(".dlocalbar .dseg button")]
      .find((b) => b.textContent.trim() === l)
      ?.click();
  }, label);
  await wait(2200);
  views.push(
    await page.evaluate(() => document.querySelector(".dent-table thead th")?.textContent.trim()),
  );
}
check("Doanh nghiệp: chuyển được giữa ba chiều", views.length === 2 && views.every(Boolean), true);

/* ── 3. Kiểm tra: KPI cộng khớp bảng ─────────────────────────────────────── */
await open("inspection");
const insp = await page.evaluate(() => {
  const int = (t) => Number(String(t).replace(/\D/g, "")) || 0;
  const kpis = [...document.querySelectorAll(".dkpis > div")].map((d) => d.innerText.replace(/\s+/g, " "));
  const tong = kpis.find((k) => /Tổng số cuộc/.test(k));
  const foot = document.querySelector(".dinspect-table tfoot tr");
  const footCases = foot ? foot.children[1].textContent.trim() : "";
  return {
    kpiTongCuoc: tong ? int(tong.replace(/Tổng số cuộc kiểm tra/, "")) : -1,
    footTongCuoc: int(footCases.split("/")[1] ?? ""),
    coDongCong: !!foot,
    coNhanMock: /Dữ liệu mô phỏng/.test(document.querySelector("main").innerText),
    // Tên trung tính, chưa dùng "truy thu".
    khongDungTruyThu: !/truy thu/i.test(document.querySelector("main").innerText),
  };
});
check(
  "Kiểm tra: KPI tổng số cuộc bằng dòng Cộng của bảng",
  { bang: insp.kpiTongCuoc === insp.footTongCuoc, coDongCong: insp.coDongCong },
  { bang: true, coDongCong: true },
);
check(
  "Kiểm tra: có nhãn mô phỏng và chưa dùng cụm 'truy thu'",
  { coNhanMock: insp.coNhanMock, khongDungTruyThu: insp.khongDungTruyThu },
  { coNhanMock: true, khongDungTruyThu: true },
);
check(
  "Kiểm tra: báo cáo tháng có đủ diễn biến từ tháng 1 đến tháng 8",
  await page.evaluate(() => {
    const labels = [...document.querySelectorAll(".dstack .dbars .dbar-label b")].map((e) => e.textContent.trim());
    return {
      coThang1: labels.includes("Tháng 1"),
      coThang8: labels.includes("Tháng 8"),
      soThang: new Set(labels.filter((label) => /^Tháng \d+$/.test(label))).size,
    };
  }),
  { coThang1: true, coThang8: true, soThang: 8 },
);

// Chuyển tuần/tháng.
await page.evaluate(() => {
  [...document.querySelectorAll(".dlocalbar .dseg button")]
    .find((b) => /tuần/i.test(b.textContent))
    ?.click();
});
await wait(2200);
check(
  "Kiểm tra: chuyển được giữa báo cáo tuần và tháng",
  await page.evaluate(() => /Tuần/.test(document.querySelector("main").innerText)),
  true,
);

/* ── 4. URL cũ vẫn mở đúng nội dung ──────────────────────────────────────── */
const legacy = [];
for (const tab of [
  "overview",
  "report",
  "revenue-analysis",
  "location-detail",
  "tms-breakdown",
  "advanced-compare",
]) {
  await page.goto(`${BASE}/?tab=${tab}&${P}&location=00004`, { waitUntil: "networkidle0" });
  await wait(2400);
  legacy.push(
    await page.evaluate(
      // Nút tab mang `id="tab-<id>"`, không có `data-tab-id` — đọc đúng thứ có thật.
      () =>
        document.querySelector('[role="tab"][aria-selected="true"]')?.id.replace(/^tab-/, "") ??
        null,
    ),
  );
}
check("URL cũ: sáu workspace cũ vẫn mở đúng tab", legacy, [
  "overview",
  "report",
  "revenue-analysis",
  "location-detail",
  "tms-breakdown",
  "advanced-compare",
]);

/* ── 5. Trạng thái dữ liệu hiện ở cả ba workspace mới ────────────────────── */
const fresh = [];
for (const mode of ["budget", "taxpayer", "inspection"]) {
  await open(mode);
  fresh.push(
    await page.evaluate(() => {
      const bar = document.querySelector(".dfresh");
      if (!bar) return null;
      const dd = [...bar.querySelectorAll("dd")].map((e) => e.textContent.trim());
      return {
        nhan: bar.querySelector(".dtag")?.textContent.trim(),
        coNguon: dd[0]?.length > 0,
        // Ở trạng thái mô phỏng dải chỉ còn nhãn và nguồn. Không ô nào để trống:
        // một ô có nhãn mà không có giá trị chiếm chỗ mà không nói gì.
        soO: dd.length,
        oTrong: dd.filter((v) => v === "").length,
      };
    }),
  );
}
check(
  "Trạng thái dữ liệu: mô phỏng thì dải chỉ còn nhãn và nguồn, không ô trống",
  fresh,
  [
    { nhan: "Dữ liệu mô phỏng", coNguon: true, soO: 1, oTrong: 0 },
    { nhan: "Dữ liệu mô phỏng", coNguon: true, soO: 1, oTrong: 0 },
    { nhan: "Dữ liệu mô phỏng", coNguon: true, soO: 1, oTrong: 0 },
  ],
);

/* ── 5b. Sáu tab cấp cao, bốn chế độ báo cáo ─────────────────────────────── */
await page.goto(`${BASE}/?tab=report&${P}`, { waitUntil: "networkidle0" });
await wait(2600);
check(
  "Chọn loại báo cáo là một vùng điều hướng, không phải một ô lọc",
  await page.evaluate(() => {
    const e = document.querySelector(".dreport-modebar > *");
    return [e?.tagName, e?.getAttribute("aria-label")];
  }),
  ["NAV", "Loại báo cáo"],
);
check(
  "Thanh điều hướng có đúng sáu tab, không có tab thứ bảy",
  await page.evaluate(() => document.querySelectorAll('[role="tab"]').length),
  6,
);
// Bám vào VAI TRÒ chứ không bám vào lớp trình bày: loại báo cáo giờ là điều
// hướng cấp hai (`<nav>`), không còn là một rãnh phân đoạn trong thẻ trắng.
// Khẳng định cũ tra `.dseg` nên đổi cách vẽ là nó gãy, dù bốn chế độ vẫn nguyên.
check(
  "Tab Báo cáo có đúng bốn chế độ",
  await page.evaluate(() =>
    [...document.querySelectorAll(".dreport-modebar button")].map((b) => b.textContent.trim()),
  ),
  ["Thu NSNN", "Dự toán & dự báo", "Quản lý thu", "Kết quả kiểm tra"],
);
check(
  "Mặc định là chế độ Thu NSNN và URL ghi report=nsnn",
  await page.evaluate(() => new URLSearchParams(location.search).get("report")),
  "nsnn",
);
// Giá trị ngoài danh sách đóng phải về mặc định, không giữ nguyên chuỗi lạ.
await page.goto(`${BASE}/?tab=report&report=khong-ton-tai&${P}`, { waitUntil: "networkidle0" });
await wait(2400);
check(
  "Chế độ lạ trong URL trở về mặc định",
  await page.evaluate(() => new URLSearchParams(location.search).get("report")),
  "nsnn",
);

/* ── 5c. Ba URL tạm chuyển hướng, Back và Forward vẫn đúng ───────────────── */
const redirects = [];
for (const [legacy, expected] of [
  ["budget-forecast", "budget"],
  ["enterprise", "taxpayer"],
  ["inspection", "inspection"],
]) {
  await page.goto(`${BASE}/?tab=${legacy}&${P}`, { waitUntil: "networkidle0" });
  await wait(2600);
  redirects.push(
    await page.evaluate(() => {
      const q = new URLSearchParams(location.search);
      const tab = document.querySelector('[role="tab"][aria-selected="true"]')?.id.replace(/^tab-/, "");
      // Màn hình trắng là khi vùng nội dung không có gì để đọc.
      const main = document.querySelector("main")?.innerText.trim() ?? "";
      return { tab, report: q.get("report"), trong: main.length < 40 };
    }),
  );
  if (redirects.at(-1).report !== expected) redirects.at(-1).sai = expected;
}
check("Ba URL tạm chuyển tới đúng chế độ, không màn hình trắng", redirects, [
  { tab: "report", report: "budget", trong: false },
  { tab: "report", report: "taxpayer", trong: false },
  { tab: "report", report: "inspection", trong: false },
]);

/**
 * Redirect KHÔNG được tạo vòng lặp Back.
 *
 * Đây mới là điều đáng kiểm. Đổi chế độ dùng `replaceState` giống hệt đổi tab và
 * đổi bộ lọc — một quyết định đã ghi trong `DashboardState`: chỉ drawer dùng
 * `pushState`. Nên Back sau khi đổi chế độ rời khỏi trang, không lùi qua từng
 * chế độ, và đó là hành vi nhất quán chứ không phải lỗi.
 *
 * Cái sẽ hỏng nếu redirect làm sai là vòng lặp: nếu URL tạm được `pushState`
 * thì Back quay về URL tạm, URL tạm lại chuyển tiếp, và người dùng mắc kẹt.
 */
await page.goto(`${BASE}/?tab=overview&${P}`, { waitUntil: "networkidle0" });
await wait(2400);
await page.goto(`${BASE}/?tab=budget-forecast&${P}`, { waitUntil: "networkidle0" });
await wait(2600);
const beforeBack = await page.evaluate(() => new URLSearchParams(location.search).get("report"));
await page.goBack({ waitUntil: "networkidle0" });
await wait(2400);
const leftPage = await page.evaluate(() => {
  const q = new URLSearchParams(location.search);
  return { tab: q.get("tab"), report: q.get("report") };
});
check(
  "URL tạm không tạo vòng lặp Back: lùi một lần là rời khỏi chế độ báo cáo",
  { beforeBack, ...leftPage },
  { beforeBack: "budget", tab: "overview", report: null },
);

/* ── 6. Không NaN, Infinity và không lỗi JS ──────────────────────────────── */
const dirty = [];
for (const mode of ["budget", "taxpayer", "inspection"]) {
  await open(mode);
  const bad = await page.evaluate(() => {
    const t = document.querySelector("main").innerText;
    return /NaN|Infinity|undefined/.test(t);
  });
  if (bad) dirty.push(mode);
}
check("Không có NaN, Infinity hoặc undefined trên màn hình", dirty, []);
check("Không có lỗi JavaScript chưa xử lý", jsErrors, []);

await browser.close();

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} tiêu chí workspace mới đạt.`);
process.exit(passed === results.length ? 0 : 1);
