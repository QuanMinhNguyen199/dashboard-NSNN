import puppeteer from "puppeteer-core";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const P = "year=2026&periodType=MONTH&period=8&latency=0";
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1200 });
const errs = []; p.on("pageerror", e => errs.push(String(e)));
const thu = async (ten, url, sel) => {
  await p.goto("http://localhost:5173/" + url, { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 2800));
  const ra = await p.evaluate((sel) => {
    const nut = document.querySelector(sel);
    if (!nut) return { loi: "khong thay " + sel };
    const hang = nut.closest("tr");
    const r = hang.getBoundingClientRect();
    // điểm ở 85% bề rộng hàng — chắc chắn ngoài vùng chữ
    const x = r.x + r.width * 0.85, y = r.y + r.height / 2;
    const tren = document.elementFromPoint(x, y);
    return { nutPhu: Math.round((nut.getBoundingClientRect().width / r.width) * 100),
      diem85: tren ? (tren.tagName + "." + (tren.className || "")).slice(0, 34) : null,
      laNutDo: tren === nut || nut.contains(tren) };
  }, sel);
  // bấm thật ở 85% rồi xem trạng thái có đổi không
  const truoc = await p.evaluate((sel) => document.querySelector(sel)?.getAttribute("aria-expanded")
    ?? document.querySelector(sel)?.getAttribute("aria-pressed"), sel);
  const box = await p.evaluate((sel) => { const r = document.querySelector(sel).closest("tr").getBoundingClientRect();
    return { x: r.x + r.width * 0.85, y: r.y + r.height / 2 }; }, sel);
  await p.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 900));
  const sau = await p.evaluate((sel) => document.querySelector(sel)?.getAttribute("aria-expanded")
    ?? document.querySelector(sel)?.getAttribute("aria-pressed"), sel);
  console.log(ten, JSON.stringify({ ...ra, truoc, sau, doiTrangThai: truoc !== sau }));
};
await thu("report      ", `?tab=report&${P}`, ".dreport-table tbody .dtms-toggle");
await thu("tms-breakdown", `?tab=tms-breakdown&${P}`, ".dtms-table tbody .dtms-toggle");
await thu("budget      ", `?tab=report&report=budget&${P}`, ".dbudget-table tbody .dtms-toggle");
await thu("taxpayer    ", `?tab=report&report=taxpayer&${P}`, ".dent-table tbody .dlink");
console.log("JS errors:", errs.length, errs.slice(0, 2));
await b.close();
