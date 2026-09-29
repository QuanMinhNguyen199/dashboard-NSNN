import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const base = process.argv[2] ?? "http://localhost:5174";
const output = new URL("../.impeccable/review/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const results = { checks: [], navigationMs: [], errors: [] };
page.on("pageerror", error => results.errors.push(error.message));
const pass = label => results.checks.push({ label, pass: true });
const clickNav = async index => {
  const items = await page.$$(".sidebar .nav-item");
  await items[index - 1].click();
};
try {
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base);
  await page.click(".login-submit");
  await page.waitForSelector(".workspace");
  for (const [index, title] of [[2, "Nợ và cưỡng chế"], [3, "Kiểm tra và rủi ro"], [4, "Hoàn thuế và hỗ trợ"], [5, "Báo cáo"], [1, "Trang công việc"]]) {
    const start = performance.now();
    await clickNav(index);
    await page.waitForFunction(title => document.querySelector("main h1")?.textContent === title, {}, title);
    await page.waitForFunction(() => document.querySelector(".workspace-view").getAnimations().every(animation => animation.playState === "finished"));
    results.navigationMs.push(Math.round(performance.now() - start));
  }
  pass("5 sidebar routes render and finish transition");
  await clickNav(5);
  await page.waitForSelector(".page-actions button");
  const before = await page.$$eval("tbody tr", rows => rows.length);
  await page.click(".page-actions button");
  await page.waitForSelector(".report-dialog[open]");
  assert.equal(await page.evaluate(() => document.activeElement.name), "reportName");
  pass("Create opens a named dialog with input focus");
  await page.click('.report-form button[type="submit"]');
  assert.equal(await page.$$eval("tbody tr", rows => rows.length), before);
  assert.equal(await page.$eval(".report-form", form => form.checkValidity()), false);
  pass("Empty fields cannot create a report");
  await page.type('[name="reportName"]', "Báo cáo kiểm tra UX");
  await page.type('[name="reportPeriod"]', "Tháng 9/2026");
  for (let index = 0; index < 7; index++) {
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector(".report-dialog") || !!document.activeElement.closest(".report-dialog")), true);
  }
  pass("Keyboard focus stays inside the create dialog");
  const createStart = performance.now();
  await page.click('.report-form button[type="submit"]');
  await page.waitForFunction(count => document.querySelectorAll("tbody tr").length === count + 1, {}, before);
  results.createResponseMs = Math.round(performance.now() - createStart);
  assert.equal(await page.$(".report-dialog[open]"), null);
  pass("Create adds one selected draft and closes the dialog");
  await page.reload();
  await page.waitForFunction(() => document.querySelector("tbody").textContent.includes("Báo cáo kiểm tra UX"));
  pass("Draft survives reload in the same browser session");
  await page.click(".page-actions button");
  await page.keyboard.press("Escape");
  assert.equal(await page.$(".report-dialog[open]"), null);
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelector(".page-actions button")), true);
  pass("Escape cancels and restores trigger focus");
  for (const index of [2, 3, 4]) {
    await clickNav(index);
    await page.click(".page-actions button");
    await page.waitForSelector(".report-dialog[open]");
    await page.keyboard.press("Escape");
  }
  pass("Debt, Risk and Refund create actions all open the report form");
  await clickNav(4);
  await page.click("tbody tr:nth-child(2) .row-select");
  await page.waitForFunction(() => [...document.querySelectorAll(".panel h2")].some(element => element.textContent.includes("HS-2026-09188")));
  pass("Selecting a refund row opens the matching record");
  await page.waitForFunction(() => getComputedStyle(document.querySelector("tbody tr.is-selected")).backgroundColor === "rgb(247, 229, 231)");
  const selectedColor = await page.$eval("tbody tr.is-selected", element => getComputedStyle(element).backgroundColor);
  await page.hover("tbody tr:nth-child(3)");
  await page.waitForFunction(() => getComputedStyle(document.querySelector("tbody tr:nth-child(3)")).transform === "matrix(1, 0, 0, 1, 0, -2)");
  const hoverColor = await page.$eval("tbody tr:nth-child(3)", element => getComputedStyle(element).backgroundColor);
  assert.notEqual(hoverColor, selectedColor);
  await page.hover("tbody tr.is-selected");
  assert.equal(await page.$eval("tbody tr.is-selected", element => getComputedStyle(element).backgroundColor), selectedColor);
  pass("Hover and selected rows have distinct colors; selected stays selected on hover");
  assert.equal(await page.$eval(".panel", element => getComputedStyle(element).transform), "none");
  await page.hover(".kpi");
  assert.equal(await page.$eval(".kpi", element => getComputedStyle(element).transform), "none");
  pass("Only interactive rows lift; panels and read-only KPI stay still");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await clickNav(1);
  assert.equal(await page.$eval(".workspace-view", element => getComputedStyle(element).animationName), "none");
  pass("Reduced motion removes route animation");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  results.mobile = await page.evaluate(() => ({
    firstTaskTop: Math.round(document.querySelector(".task-row").getBoundingClientRect().top),
    visibleTasks: [...document.querySelectorAll(".task-row")].filter(element => element.getBoundingClientRect().bottom < innerHeight - 64).length,
    panelBorder: getComputedStyle(document.querySelector(".panel")).borderTopWidth,
    panelShadow: getComputedStyle(document.querySelector(".panel")).boxShadow,
    metadataSize: getComputedStyle(document.querySelector(".task-copy small")).fontSize,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
  assert.equal(results.mobile.overflow, false);
  assert.equal(results.mobile.metadataSize, "12px");
  assert.equal(results.mobile.panelBorder, "1px");
  pass("Mobile has no page overflow, metadata is 12px and panel boundaries are visible");
  await page.screenshot({ path: fileURLToPath(new URL("ux-after-mobile.png", output)) });
  await page.click(".menu-button");
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Đóng điều hướng");
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains("menu-button")), true);
  pass("Mobile drawer receives and restores keyboard focus");
  await page.setViewport({ width: 1440, height: 1000 });
  await page.screenshot({ path: fileURLToPath(new URL("ux-after-desktop.png", output)) });
  assert.deepEqual(results.errors, []);
  pass("No uncaught browser errors during scenarios");
  try { results.before = JSON.parse(await readFile(new URL("ux-before.json", output), "utf8")); } catch { results.before = null; }
  await writeFile(new URL("ux-results.json", output), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
