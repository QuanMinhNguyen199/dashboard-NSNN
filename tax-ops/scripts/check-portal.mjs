import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const review = new URL("../.impeccable/review/", import.meta.url);
await mkdir(review, { recursive: true });

const base = new URL(`${(process.argv[2] ?? "http://localhost:5174").replace(/\/+$/, "")}/`);
const dashboard = new URL("nsnn/", base);
const browser = await puppeteer.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(dashboard.href);
  await page.waitForSelector(".login-page");
  for (const role of ["Cán bộ thuế", "Lãnh đạo Thuế", "Lãnh đạo nhà nước"]) {
    await page.evaluate(label => [...document.querySelectorAll(".demo-account-list button")]
      .find(button => button.textContent.includes(label)).click(), role);
    await page.click(".login-submit");
    const state = role === "Lãnh đạo nhà nước";
    const selector = state ? ".dheader" : ".workspace";
    await page.waitForSelector(selector);
    assert.equal(new URL(page.url()).origin, base.origin);
    assert.equal(new URL(page.url()).pathname, state ? dashboard.pathname : base.pathname);
    await page.reload();
    await page.waitForSelector(selector);
    if (!state) {
      await page.goto(dashboard.href);
      await page.waitForSelector(".workspace");
      assert.equal(new URL(page.url()).pathname, base.pathname);
    } else {
      await page.goto(base.href);
      await page.waitForSelector(".dheader");
      await page.waitForSelector(".dkpis");
      assert.equal(new URL(page.url()).pathname, dashboard.pathname);
      await page.screenshot({ path: fileURLToPath(new URL("portal-nsnn-desktop.png", review)) });
      await page.setViewport({ width: 390, height: 844 });
      await page.screenshot({ path: fileURLToPath(new URL("portal-nsnn-mobile.png", review)) });
    }
    if (state) await page.click(".dheader-tools .dapp-switch");
    else await page.click(".sidebar .logout-button");
    await page.waitForSelector(".login-page");
    await page.goto(dashboard.href);
    await page.waitForSelector(".login-page");
    console.log(`PASS ${role}: same origin, redirect, reload, direct URL, logout`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
