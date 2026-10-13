import puppeteer from '../tax-ops/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const browser = await puppeteer.launch({channel:'chrome', headless:true});
const page = await browser.newPage();
const errors=[]; page.on('pageerror', e=>errors.push(String(e)));
await page.goto('http://localhost:5174/');
await page.evaluate(()=>sessionStorage.setItem('tax-ops-demo-user',JSON.stringify({username:'cv.ql1',vaiTro:'CV'})));
for (const [name,width,height,user,role] of [['desktop',1920,1080,'cv.ql1','CV'],['laptop',1366,900,'tp.ql1','TP'],['mobile',390,844,'cv.ql1','CV']]) {
 await page.setViewport({width,height});
 await page.evaluate((u,r)=>sessionStorage.setItem('tax-ops-demo-user',JSON.stringify({username:u,vaiTro:r})),user,role);
 await page.goto('http://localhost:5174/?view=dieuhanh');
 await page.waitForSelector('.qd-the'); await page.evaluate(()=>document.querySelector('.qd-popup[open] .drawer-close')?.click()); await new Promise(r=>setTimeout(r,400));
 await page.screenshot({path:`.audit/ketqua-${name}.png`,fullPage:true});
 console.log(name, await page.evaluate(()=>({cards:document.querySelectorAll('.qd-the').length,overflow:document.documentElement.scrollWidth>innerWidth,columns:getComputedStyle(document.querySelector('.is-wide .qd-the-luoi')).gridTemplateColumns})));
 if(name==='desktop') {await page.click('.qd-the'); await page.waitForSelector('.qd-bang'); console.log('detail opens');}
}
await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
await page.reload(); await page.waitForSelector('.qd-the');
console.log('reduced motion',await page.$eval('.qd-results .panel',el=>getComputedStyle(el).opacity));
console.log({errors}); await browser.close();

