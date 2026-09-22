import puppeteer from "puppeteer-core";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const P = "year=2026&periodType=MONTH&period=8&latency=0";
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1200 });
const errs = []; p.on("pageerror", e => errs.push(String(e)));

/* ── A. Bề rộng nút không đổi ──────────────────────────────────────────── */
await p.goto(`http://localhost:5173/?tab=report&${P}`, { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 2500));
const pick = async (f, t) => p.evaluate((f, t) => { const s = document.querySelector(`select[data-field="${f}"]`);
  s.value = [...s.options].find(o => o.textContent.trim() === t).value;
  s.dispatchEvent(new Event("change", { bubbles: true })); }, f, t);
await pick("groupBy", "Ngành nghề"); await new Promise(r => setTimeout(r, 1500));
await pick("subGroupBy", "Cơ quan thuế"); await new Promise(r => setTimeout(r, 3000));
const do_ = () => p.evaluate(() => {
  const x = [...document.querySelectorAll(".dexport .dbtn")].find(b => /Xuất|Đang/.test(b.innerText));
  const t = document.querySelector("[data-field='exportOuter']");
  return { xuat: Math.round(x.getBoundingClientRect().width), nhanXuat: x.innerText.trim().split("\n").pop(),
    mo: Math.round(t.getBoundingClientRect().width), nhanMo: t.innerText.trim().split("\n").pop() };
});
console.log("0 chon:", JSON.stringify(await do_()));
await p.evaluate(() => document.querySelector("[data-field='exportOuter']").click());
await new Promise(r => setTimeout(r, 400));
await p.evaluate(() => document.querySelectorAll(".dexport-loc-ds input")[0].click());
await new Promise(r => setTimeout(r, 400));
console.log("1 chon:", JSON.stringify(await do_()));
await p.evaluate(() => [...document.querySelectorAll(".dexport-loc-ds input")].slice(1,5).forEach(i => i.click()));
await new Promise(r => setTimeout(r, 400));
console.log("5 chon:", JSON.stringify(await do_()));
await p.evaluate(() => [...document.querySelectorAll(".dexport-loc-ds input")].slice(5,10).forEach(i => i.click()));
await new Promise(r => setTimeout(r, 400));
console.log("10 chon:", JSON.stringify(await do_()));

/* ── B. Vùng bấm cả hàng ───────────────────────────────────────────────── */
const hang = async (ten, url, sel, attr) => {
  await p.goto("http://localhost:5173/" + url, { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 2800));
  const conTro = await p.evaluate((sel) => getComputedStyle(document.querySelector(sel).closest("tr")).cursor, sel);
  const truoc = await p.evaluate((sel, a) => document.querySelector(sel).getAttribute(a), sel, attr);
  const box = await p.evaluate((sel) => { const r = document.querySelector(sel).closest("tr").getBoundingClientRect();
    return { x: r.x + r.width * 0.88, y: r.y + r.height / 2, phu: Math.round(document.querySelector(sel).getBoundingClientRect().width / r.width * 100) }; }, sel);
  await p.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 900));
  const sau = await p.evaluate((sel, a) => document.querySelector(sel).getAttribute(a), sel, attr);
  console.log(ten, JSON.stringify({ nutPhu: box.phu + "%", conTro, truoc, sau, doi: truoc !== sau }));
};
await hang("report       ", `?tab=report&${P}`, ".dreport-table tbody .dtms-toggle", "aria-expanded");
await hang("tms-breakdown", `?tab=tms-breakdown&${P}`, ".dtms-table tbody .dtms-toggle", "aria-expanded");
await hang("budget       ", `?tab=report&report=budget&${P}`, ".dbudget-table tbody .dtms-toggle", "aria-expanded");
await hang("taxpayer     ", `?tab=report&report=taxpayer&${P}`, ".dent-table tbody .dlink", "aria-pressed");
console.log("JS errors:", errs.length, errs.slice(0, 2));
await b.close();
