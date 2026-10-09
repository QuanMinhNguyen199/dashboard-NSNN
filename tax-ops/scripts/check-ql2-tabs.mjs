import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const base = process.argv[2] ?? "http://127.0.0.1:5174/quan-ly/";
const browser = await puppeteer.launch({ channel: "chrome", headless: true });
try {
  const p = await browser.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(base, { waitUntil: "networkidle0" });
  const login = (name) => p.evaluate((ma) => [...document.querySelectorAll(".demo-accounts-list button")].find((b) => b.querySelector("code")?.textContent === ma).click(), name);
  await login("cv.ql2");
  const go = (q) => p.goto(`${base}?view=hoadon&${q}`, { waitUntil: "networkidle0" });
  const click = async (text) => {
    const found = await p.evaluate((t) => { const b = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === t); b?.click(); return Boolean(b); }, text);
    assert(found, `Missing button ${text}`);
  };
  const report = await p.evaluate(async () => {
    const d = await import("/src/data/ql2.ts");
    const { ql2Workbook } = await import("/src/domain/reportExport.ts");
    const ky = d.KY_QL2_02[0];
    const ds = d.danhSachK(ky.hat);
    const row = ds.find((r) => r.trangThai === "Chưa xử lý");
    const before = d.bangHeSoK(ky.hat).reduce((t, r) => t + d.tonCuoiK(r), 0);
    const after = d.bangHeSoK(ky.hat, [row.mst]).reduce((t, r) => t + d.tonCuoiK(r), 0);
    const xk = d.KY_QL2_04[0];
    const source = d.danhSachXM(xk.hat);
    const xm = d.bangXM(xk.hat);
    const sheet = ql2Workbook("QL2-04", xk, [])[0];
    return {
      ky, states: d.TRANG_THAI_XM.map((t) => t.ma), before, after,
      unresolved: ds.filter((r) => r.trangThai === "Chưa xử lý").length,
      firstOfMonth: d.ngayTonDauK(d.KY_QL2_02.find((k) => k.id === "q202-m09")),
      sourceCount: source.length, total: xm.reduce((t, r) => t + d.tongXM(r), 0),
      expectedPending: source.filter((r) => r.trangThai !== 14).length,
      actualPending: xm.reduce((t, r) => t + d.tonXM(r), 0),
      widths: sheet.rows.map((r) => r.length), headers: sheet.headers, percentages: sheet.percent,
      unsupported: ["QL2-03", "QL2-05", "QL2-06"].map((ma) => ql2Workbook(ma, xk, []).length),
    };
  });
  assert.deepEqual(report.states, [10, 14, 6, 7, 8]);
  assert.equal(report.ky.loai, "TUAN");
  assert.equal(report.ky.ngayChot, "24/09/2026");
  assert.equal(report.firstOfMonth, "31/08/2026");
  assert.equal(report.before, report.unresolved);
  assert.equal(report.after, report.before - 1);
  assert.equal(report.total, report.sourceCount);
  assert.equal(report.actualPending, report.expectedPending);
  assert(report.widths.every((w) => w === report.headers.length));
  assert.equal(report.percentages[0], report.headers.indexOf("Tỷ lệ hoàn thành"));
  assert(!report.headers.some((h) => /trong hạn|quá hạn|Trạng thái 9/.test(h)));
  assert.deepEqual(report.unsupported, [0, 0, 0]);

  await go("muc=kton");
  assert((await p.$$eval(".ql1-ds-table tbody tr", (rows) => rows.map((r) => r.textContent))).every((r) => r.includes("Chưa xử lý")));
  const mst = await p.$eval('.ql1-ds-table tbody tr td', (e) => e.textContent);
  await click("Đánh dấu gửi QLRR");
  await click("Vướng mắc gửi QLRR");
  assert((await p.$eval('.ql1-ds-table tbody', (e) => e.textContent)).includes(mst));
  await p.reload({ waitUntil: "networkidle0" });
  assert((await p.$eval('.ql1-ds-table tbody', (e) => e.textContent)).includes(mst));
  await click("Gỡ đánh dấu");
  assert((await p.$eval('.ql1-ds-table tbody', (e) => e.textContent)).includes("Không có lượt"));

  await go("muc=kbc");
  assert.equal(await p.$('input[aria-label="Hệ số K từ ngày"]'), null);
  for (const kind of ["Tháng", "Ngày", "Tuần"]) {
    await click(kind);
    assert.equal(await p.$('input[aria-label="Hệ số K từ ngày"]'), null);
    assert(await p.$('.bo-loc-select'));
  }
  await click("Mẫu Cục Thuế QLTT3");
  assert.equal(await p.$('.ql1-table'), null);
  assert((await p.$eval('.panel-body', (e) => e.textContent)).includes("Q-102"));
  await click("Báo cáo nội bộ");
  await click("Tùy chọn");
  assert(await p.$('.bo-loc-chung input[aria-label="Hệ số K từ ngày"]'));
  assert.equal(await p.$('.bo-loc-select'), null);
  await p.$eval('input[aria-label="Hệ số K từ ngày"]', (e) => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; setter.call(e, "2026-08-03"); e.dispatchEvent(new Event("input", { bubbles: true })); });
  await click("Áp dụng khoảng ngày");
  await p.waitForFunction(() => location.search.includes("q202-custom"));
  assert((await p.$eval('.ql1-table thead', (e) => e.textContent)).includes("02/08/2026"));
  await p.reload({ waitUntil: "networkidle0" });
  assert((await p.$eval('.ql1-table thead', (e) => e.textContent)).includes("02/08/2026"));

  const firstRange = new URL(p.url()).searchParams.get("ky");
  await p.$eval('input[aria-label="Hệ số K từ ngày"]', (e) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(e, "2026-08-04"); e.dispatchEvent(new Event("input", { bubbles: true })); });
  await click("Áp dụng khoảng ngày");
  await p.waitForFunction((old) => new URLSearchParams(location.search).get("ky") !== old, {}, firstRange);
  assert((await p.$eval('.ql1-table thead', (e) => e.textContent)).includes("03/08/2026"));

  await go("muc=xm");
  const headers = await p.$$eval('.ql1-table th[scope="col"]', (els) => els.map((e) => e.textContent));
  assert(!headers.some((h) => /9 Duyệt|Tồn ·/.test(h)));
  await go("muc=xmqh");
  assert.equal(await p.$eval('.panel button[aria-pressed="true"]', (e) => e.textContent).catch(() => ""), "Tất cả còn tồn");
  assert(await p.$eval('.ql1-ds-table thead', (e) => e.textContent.includes("Số hóa đơn")));

  await go("muc=congan");
  const inputs = await p.$$('.ql2-manual');
  for (const [i, value] of ["10", "30", "4", "12", "Công văn demo 01"].entries()) await inputs[i].type(value);
  await click("Lưu dòng");
  assert((await p.$eval('.ql1-ds-table tbody tr', (e) => e.textContent)).includes("40,00%"));
  await p.reload({ waitUntil: "networkidle0" });
  assert.equal(await p.$eval('.ql2-manual', (e) => e.value), "10");
  const done = (await p.$$('.ql2-manual'))[2];
  await done.click({ clickCount: 3 }); await done.type("11"); await click("Lưu dòng");
  assert((await p.$eval('[role="alert"]', (e) => e.textContent)).includes("không được vượt"));
  await go("muc=tpr");
  assert((await p.$eval('.ql1-table', (e) => e.textContent)).includes("8501"));
  assert((await p.$eval('.ql1-table', (e) => e.textContent)).includes("Phòng HKD"));
  await go("muc=cbrr");
  assert(!(await p.$eval('body', (e) => e.textContent)).includes("không được lên web"));

  await mkdir(".impeccable/review", { recursive: true });
  for (const route of ["kbc", "kton", "xm", "xmqh", "tpr", "congan", "cbrr"]) {
    await go(`muc=${route}`);
    for (const width of [1440, 390]) {
      await p.setViewport({ width, height: 900 });
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow ${route} ${width}`);
      await p.screenshot({ path: `.impeccable/review/ql2-${route}-${width}.png`, fullPage: true });
    }
    await p.setViewport({ width: 1440, height: 900 });
  }
  await p.click('.logout-button'); await p.waitForSelector('.demo-accounts-list'); await login("tp.ql2");
  await go("muc=congan"); assert.equal(await p.$('.ql2-manual'), null);
  await go("muc=kton"); assert(!(await p.$eval('body', (e) => e.textContent)).includes("Đánh dấu gửi QLRR"));
  assert.deepEqual(errors, []);
  console.log("PASS: periods, K reconciliation and exclusions, XM invoice counts and exports, manual entry validation/persistence/roles, seven routes desktop/mobile.");
} finally { await browser.close(); }
