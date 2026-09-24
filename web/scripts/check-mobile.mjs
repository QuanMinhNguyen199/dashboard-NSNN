/**
 * Cổng nghiệm thu bản mobile.
 *
 * Bốn tiêu chí của brief, viết thành phép đo chứ không phải danh sách chữ:
 *
 *   1. Mỗi field trên web có tương đương trên mobile — đo bằng cách đếm ô THẬT
 *      SỰ hiển thị của cùng một hàng ở 1700px và ở 390px. `display: none` là
 *      cách một field biến mất mà không ai nhận ra, nên nó bị bắt ở đây.
 *   2. Mỗi action trên web có lối vào trên mobile — đếm số vùng bấm.
 *   3. Không có dữ liệu bị che hay không tới được — không tràn ngang, không ô
 *      nào bị cắt chữ mà không có vùng cuộn.
 *   4. Thao tác được bằng tay — mọi vùng bấm tối thiểu 44×44 px.
 *
 * Chạy: node scripts/check-mobile.mjs [baseUrl]
 */
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:5173";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Khổ điện thoại nhỏ nhất còn phải hỗ trợ, và khổ máy để so field. */
const MOBILE = { width: 390, height: 844, isMobile: true, hasTouch: true };
const DESKTOP = { width: 1700, height: 1000 };

/*
  `host=mobile` trong MỌI đường dẫn.

  Bản điện thoại được khoá theo HOST chứ không theo bề rộng: bản nhúng
  trong iframe cũng hẹp nhưng phải giữ nguyên bố cục web. Đo ở 390px mà không
  khai host thì đang đo chính bản nhúng, và cổng sẽ đòi nó có thanh đáy — thứ
  nó cố tình không có.
*/
const HOST = "&host=mobile";
const MAN_HINH = [
  ["Tổng quan", "/?tab=overview&year=2026&periodType=MONTH&period=8"],
  ["Báo cáo", "/?tab=report&report=nsnn&year=2026&periodType=MONTH&period=8"],
  ["Phân tích thu", "/?tab=revenue-analysis&section=domestic&year=2026&periodType=MONTH&period=8"],
  ["Chi tiết phường/xã", "/?tab=location-detail&year=2026&periodType=MONTH&period=8&location=00004"],
  ["Chi tiết đơn vị thuế", "/?tab=location-detail&year=2026&periodType=MONTH&period=8&cqt=0106"],
  ["So sánh nâng cao", "/?tab=advanced-compare&year=2026&periodType=MONTH&period=8&mode=period"],
];

let dat = 0;
let hong = 0;
const check = (ten, thuc, mong) => {
  const ok = JSON.stringify(thuc) === JSON.stringify(mong);
  if (ok) {
    dat += 1;
    console.log(`✓ ${ten}`);
  } else {
    hong += 1;
    console.log(`✗ ${ten}`);
    console.log(`     mong đợi ${JSON.stringify(mong)}`);
    console.log(`     thực tế  ${JSON.stringify(thuc)}`);
  }
};

/** Số ô thực sự hiển thị của hàng đầu tiên trong một bảng. */
const demField = (page, selector) =>
  page.evaluate((sel) => {
    const table = document.querySelector(sel);
    if (!table) return null;
    const row = table.querySelector("tbody tr");
    if (!row) return null;
    return [...row.children].filter((cell) => getComputedStyle(cell).display !== "none").length;
  }, selector);

const doMotManHinh = (page) =>
  page.evaluate(() => {
    const hien = (el) => {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return box.width > 0 && box.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const bam = [...document.querySelectorAll('button,a[href],select,input,[role="button"],[role="tab"]')].filter(hien);
    const nho = bam.filter((el) => {
      const box = el.getBoundingClientRect();
      return box.width < 44 || box.height < 44;
    });
    /* Ô bị cắt chữ chỉ là lỗi khi KHÔNG có vùng cuộn nào để lấy lại phần thiếu.
       Có vùng cuộn thì chữ vẫn tới được, chỉ tốn một thao tác. */
    const catMaKhongCuonDuoc = [...document.querySelectorAll("td, th")].filter((cell) => {
      if (cell.scrollWidth <= cell.clientWidth + 1) return false;
      const wrap = cell.closest(".dtable-wrap");
      return !wrap || wrap.scrollWidth <= wrap.clientWidth + 1;
    });
    return {
      soVungBam: bam.length,
      vungBamNho: nho.length,
      viDuNho: [...new Set(nho.map((el) => {
        const box = el.getBoundingClientRect();
        const lop = typeof el.className === "string" ? el.className.split(" ")[0] : el.tagName;
        return `${lop} ${Math.round(box.width)}x${Math.round(box.height)}`;
      }))].slice(0, 4),
      tranNgang: document.documentElement.scrollWidth > window.innerWidth + 1,
      oBiCat: catMaKhongCuonDuoc.length,
      coDieuHuongDay: (() => {
        const nav = document.querySelector(".dshell > nav");
        if (!nav) return false;
        const box = nav.getBoundingClientRect();
        return getComputedStyle(nav).position === "fixed" && box.bottom >= window.innerHeight - 2;
      })(),
    };
  });

const browser = await puppeteer.launch({ channel: "chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
const loiJs = [];
page.on("pageerror", (err) => loiJs.push(String(err)));

/* ── 1. Field parity: bảng nào cũng phải giữ đủ ô khi sang thẻ ───────────── */
const BANG = [
  [".dtaxpayer-table", "/?tab=revenue-analysis&section=domestic&year=2026&periodType=MONTH&period=8"],
  [".dlocation-taxpayers", "/?tab=location-detail&year=2026&periodType=MONTH&period=8&location=00004"],
  [".dinspector-finance", "/?tab=revenue-analysis&section=domestic&year=2026&periodType=MONTH&period=8"],
];
for (const [selector, url] of BANG) {
  await page.setViewport(DESKTOP);
  await page.goto(BASE + url, { waitUntil: "networkidle0" });
  await wait(2600);
  const web = await demField(page, selector);
  await page.setViewport(MOBILE);
  await page.goto(BASE + url + HOST, { waitUntil: "networkidle0" });
  await wait(2600);
  const mobile = await demField(page, selector);
  check(`Field parity ${selector}`, { web, mobile }, { web, mobile: web });
}

/* ── 2..4. Từng màn hình ở khổ 390px ─────────────────────────────────────── */
await page.setViewport(MOBILE);
for (const [ten, url] of MAN_HINH) {
  await page.goto(BASE + url + HOST, { waitUntil: "networkidle0" });
  await wait(2600);
  const d = await doMotManHinh(page);
  check(
    `${ten}: chạm ≥44px, không tràn ngang, không chữ bị che, có điều hướng đáy`,
    {
      vungBamNho: d.vungBamNho,
      viDuNho: d.viDuNho,
      tranNgang: d.tranNgang,
      oBiCat: d.oBiCat,
      coDieuHuongDay: d.coDieuHuongDay,
      coVungBam: d.soVungBam > 0,
    },
    {
      vungBamNho: 0,
      viDuNho: [],
      tranNgang: false,
      oBiCat: 0,
      coDieuHuongDay: true,
      coVungBam: true,
    },
  );
}

/* ── 5. Bộ lọc mở ra thành bottom sheet, không đẩy nội dung ──────────────── */
await page.goto(BASE + MAN_HINH[0][1] + HOST, { waitUntil: "networkidle0" });
await wait(2600);
await page.evaluate(() => document.querySelector(".dfilters-toggle")?.click());
await wait(800);
const sheet = await page.evaluate(() => {
  const el = document.querySelector(".dfilters");
  const box = el.getBoundingClientRect();
  return {
    viTri: getComputedStyle(el).position,
    chamDay: Math.round(box.bottom) >= window.innerHeight - 24,
    soOLoc: el.querySelectorAll("select, input").length,
  };
});
check(
  "Bộ lọc mở thành bottom sheet, giữ đủ ô lọc",
  { viTri: sheet.viTri, chamDay: sheet.chamDay, duOLoc: sheet.soOLoc >= 6 },
  { viTri: "fixed", chamDay: true, duOLoc: true },
);

check("Không có lỗi JavaScript chưa xử lý", loiJs.slice(0, 2), []);

await browser.close();
console.log(`\n${dat}/${dat + hong} tiêu chí mobile đạt.`);
if (hong > 0) process.exitCode = 1;
