import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const base = process.argv[2] ?? "http://127.0.0.1:5174/quan-ly/";
const browser = await puppeteer.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(base, { waitUntil: "networkidle0" });
  await page.evaluate(() => [...document.querySelectorAll(".demo-accounts-list button")].find((b) => b.querySelector("code")?.textContent === "cv.ql2").click());
  const go = (query) => page.goto(`${base}?view=hoadon&${query}`, { waitUntil: "networkidle0" });
  const snapshot = () => page.evaluate(() => {
    const table = document.querySelector(".ql1-ds-table");
    const button = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Giao phiếu PRS-03"));
    return {
      headers: [...table.querySelectorAll("thead th")].map((e) => e.textContent),
      rows: [...table.querySelectorAll("tbody tr")].map((e) => e.innerText),
      checked: table.querySelectorAll("input:checked").length,
      button: button ? { disabled: button.disabled, text: button.textContent } : null,
      form: Boolean(document.querySelector(".phieu-bang")),
    };
  });
  await go("muc=dschenh");
  assert.equal((await snapshot()).button, null);
  assert.equal((await snapshot()).form, false);
  assert(!(await snapshot()).headers.includes("Phiếu PRS-03"));
  assert(!(await snapshot()).headers.includes("Chọn"));
  const flag = (await page.evaluateHandle(() => [...document.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "khongnop")))).asElement();
  for (const value of ["thua", "thieu", "khongnop", ""]) {
    await flag.select(value);
    const { rows } = await snapshot();
    assert(rows.length);
    if (value === "thua") assert(rows.every((r) => r.includes("Đầu vào")));
    if (value === "thieu") assert(rows.every((r) => !r.includes("Đầu vào")));
    if (value === "khongnop") assert(rows.every((r) => r.includes("Không nộp TK")));
  }
  await page.screenshot({ path: ".impeccable/review/ql2-list-r31-desktop.png", fullPage: true });
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: ".impeccable/review/ql2-list-r31-mobile.png", fullPage: true });
  await page.setViewport({ width: 1440, height: 900 });
  await go("muc=th01");
  await page.click('.ql2-01-table tbody tr:not(.is-tong):not(.is-khoi) td.num button');
  await page.waitForSelector('.ql1-ds-table');
  const url = new URL(page.url());
  assert.equal(url.searchParams.get("muc"), "dschenh");
  assert.equal(url.searchParams.get("co"), "thieu");
  assert.equal(url.searchParams.get("loaitk"), "01");
  assert(url.searchParams.get("donvi"));
  assert((await snapshot()).rows.every((r) => r.includes("Đầu ra")));
  await go("muc=dschenh&ky=q201-m08&donvi=T1");
  assert.equal((await snapshot()).button.disabled, true);
  assert((await snapshot()).rows.every((r) => r.includes("Thiếu dữ liệu r31")));
  await page.click('.ql1-ds-table input:not(:disabled)');
  assert.equal((await snapshot()).checked, 1);
  assert.match((await snapshot()).button.text, /1 dòng/);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Theo dõi phiếu dự phòng")).click());
  assert.equal((await snapshot()).form, true);
  const units = await page.$$eval('.phieu-bang tbody tr', (rows) => rows.map((r) => r.children[1]?.textContent));
  assert(units.length && units.every((u) => u.includes("Thuế cơ sở 01")));
  await page.screenshot({ path: ".impeccable/review/ql2-list-fallback.png", fullPage: true });
  await go("muc=dschenh&ky=q201-m08&donvi=T2");
  assert.equal((await snapshot()).button, null);
  await page.click('.logout-button');
  await page.waitForSelector('.demo-accounts-list');
  await page.evaluate(() => [...document.querySelectorAll(".demo-accounts-list button")].find((b) => b.querySelector("code")?.textContent === "tp.ql2").click());
  await go("muc=dschenh&ky=q201-m08&donvi=T1");
  assert.equal((await snapshot()).button, null);
  assert.equal((await snapshot()).form, false);
  assert(!(await snapshot()).headers.includes("Chọn"));
  assert.deepEqual(errors, []);
  console.log("PASS: r31 default, flags, drilldown, missing-source fallback, unit scope, row selection, role access; desktop/mobile screenshots saved.");
} finally {
  await browser.close();
}
