import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const review = new URL("../.impeccable/review/", import.meta.url);
await mkdir(review, { recursive: true });

const base = new URL(`${(process.argv[2] ?? "http://localhost:5174").replace(/\/+$/, "")}/`);
const dashboard = new URL("nsnn/", base);
const management = new URL("quan-ly/", base);
/*
  Số nút trên trang đăng nhập phải ĐẾM TỪ NGUỒN, không gõ cứng.

  Con số 5 gõ cứng ở đây đúng vào ngày viết — khi mới có QL1, QL3 và Vận hành.
  QL2 và QL4 thêm bốn tài khoản thì cổng phát hành đỏ, trong khi bản web không
  hỏng gì: phép kiểm canh một con số, còn thứ đáng canh là "trang nghiệp vụ
  liệt kê ĐỦ tài khoản nghiệp vụ, trang NSNN chỉ liệt kê một". Đọc thẳng danh
  sách thật thì mỗi lần thêm hay gỡ tài khoản, phép kiểm vẫn hỏi đúng câu ấy.
*/
const nguon = await readFile(new URL("../src/auth/demoAuth.ts", import.meta.url), "utf8");
const soNghiepVu = [...nguon.matchAll(/permissions: \["TAX_OPS_VIEW"\]/g)].length;
assert.ok(soNghiepVu > 0, "Không đọc được danh sách tài khoản nghiệp vụ trong demoAuth.ts");

const browser = await puppeteer.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(dashboard.href);
  await page.waitForSelector(".login-page");
  for (const role of ["cv.ql1", "tp.ql1", "cv.ql3", "tp.ql3", "vanhanh.dulieu", "lanhdao.nhanuoc"]) {
    const state = role === "lanhdao.nhanuoc";
    await page.goto(state ? dashboard.href : management.href);
    await page.waitForSelector(".login-page");
    assert.equal(await page.$$eval(".demo-accounts-list button", buttons => buttons.length), state ? 1 : soNghiepVu);
    if (state) {
      await page.screenshot({ path: fileURLToPath(new URL("portal-login-nsnn-desktop.png", review)) });
      await page.setViewport({ width: 390, height: 844 });
      await page.screenshot({ path: fileURLToPath(new URL("portal-login-nsnn-mobile.png", review)) });
      await page.setViewport({ width: 1440, height: 900 });
    }
    await page.evaluate(label => [...document.querySelectorAll(".demo-accounts-list button")]
      .find(button => button.querySelector("code")?.textContent === label).click(), role);
    const selector = state ? ".dheader" : ".workspace";
    await page.waitForSelector(selector);
    assert.equal(new URL(page.url()).origin, base.origin);
    assert.equal(new URL(page.url()).pathname, state ? dashboard.pathname : management.pathname);
    await page.reload();
    await page.waitForSelector(selector);
    if (!state) {
      await page.goto(dashboard.href);
      await page.waitForSelector(".workspace");
      assert.equal(new URL(page.url()).pathname, management.pathname);
    } else {
      await page.goto(base.href);
      await page.waitForSelector(".dheader");
      await page.waitForSelector(".dkpis");
      assert.equal(new URL(page.url()).pathname, dashboard.pathname);
      await page.screenshot({ path: fileURLToPath(new URL("portal-nsnn-desktop.png", review)) });
      await page.setViewport({ width: 390, height: 844 });
      await page.screenshot({ path: fileURLToPath(new URL("portal-nsnn-mobile.png", review)) });
    }
    if (state) {
      await page.setViewport({ width: 1440, height: 900 });
      await page.click(".dheader-tools .dapp-switch");
    }
    else await page.click(".sidebar .logout-button");
    await page.waitForSelector(".login-page");
    assert.equal(new URL(page.url()).pathname, state ? `${dashboard.pathname}dang-nhap/` : management.pathname);
    await page.goto(dashboard.href);
    await page.waitForSelector(".login-page");
    console.log(`PASS ${role}: same origin, redirect, reload, direct URL, logout`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
