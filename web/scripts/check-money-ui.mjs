import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
try {
  for (const width of [1558, 390]) {
    const page=await browser.newPage();
    await page.setViewport({width,height:1000});
    await page.goto("http://127.0.0.1:5173/?tab=revenue-analysis&section=domestic&latency=0"+(width===390?"&host=mobile&platform=ios":""),{waitUntil:"networkidle0"});
    await page.waitForSelector(".drevenue-master-detail");

    await page.waitForFunction(()=>document.body.innerText.includes("240 triệu"));
    const card=await page.$(".drevenue-master-detail .dcard:last-child");
    const text=await card.evaluate(el=>el.innerText);
    assert.match(text,/Đơn vị: tỷ đồng/);
    assert.match(text,/trị tuyệt đối < 1 tỷ/);
    assert.match(await card.evaluate(el=>el.textContent),/% Đạt DT/);
    assert.match(text,/Số liệu mô phỏng/);
    assert.ok(!text.includes("Xem mẫu tiền triệu"));
    assert.match(text,/240 triệu/);
    assert.match(text,/−94 triệu/);
    assert.ok(!text.includes("7,06 tỷ"));
    assert.ok(!text.includes("VND"));
    const opacity=await card.$eval(".dmoney-million-unit",el=>getComputedStyle(el).opacity);
    assert.equal(opacity,"0.72");
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    if(width===1558)await card.screenshot({path:fileURLToPath(new URL("../../.audit/default-billion-preview.png",import.meta.url))});
    await page.evaluate(()=>[...document.querySelectorAll(".dinspector-tabs button")].find(el=>el.textContent==="Đơn vị cơ quan thuế").click());
    await page.waitForFunction(()=>document.querySelector(".dinspector-tabs button.is-active")?.textContent==="Đơn vị cơ quan thuế");
    assert.ok(!(await card.evaluate(el=>el.innerText)).includes("Số liệu mô phỏng"));
    console.log("PASS: permanent mock, reference layout and working detail tabs at "+width);
    await page.close();
  }
}finally{await browser.close();}
