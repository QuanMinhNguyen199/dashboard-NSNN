import puppeteer from '../tax-ops/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import assert from 'node:assert/strict';
import {mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
const b=await puppeteer.launch({channel:'chrome',headless:true});
const errors=[];const p=await b.newPage();p.on('pageerror',e=>errors.push(String(e)));
const pause=()=>new Promise(r=>setTimeout(r,320));
const login=async(u,r,view='canhbao')=>{await p.goto('http://localhost:5174');await p.evaluate((username,vaiTro)=>sessionStorage.setItem('tax-ops-demo-user',JSON.stringify({username,vaiTro})),u,r);await p.goto(`http://localhost:5174/?view=${view}`);await p.waitForSelector('.workspace-view');await pause();};
try {
for(const [name,width,u,r] of [['desktop',1600,'cv.ql2','CV'],['manager',1366,'tp.ql1','TP'],['leader',1920,'ld.thuetp','LD_TP'],['mobile',390,'cv.ql2','CV']]) {
 await p.setViewport({width,height:1000});await login(u,r);assert.equal(await p.$('.qd-popup'),null);
 await p.screenshot({path:`.audit/alerts-${name}.png`,fullPage:true});
 const info=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,rows:document.querySelectorAll('.qd-bang-cb .qd-viec').length,panels:document.querySelectorAll('.qd-alert-overview > .panel').length,inlineMotion:document.querySelectorAll('[style*="opacity"]').length}));assert.equal(info.overflow,false);assert.ok(info.rows<=12);console.log(name,info);
 if(name==='leader'){await p.click('.qd-alert-overview .row-select');await p.waitForSelector('.qd-alert-unit');assert.ok(await p.$('.qd-bang-cb'));}
 if(name==='manager'){const next=await p.$('button[aria-label="Trang sau"]');if(next){await next.click();await pause();}}
}
await p.click('.qd-the-loc-o:nth-child(3)');await p.waitForSelector('.qd-alert-empty');assert.match(await p.$eval('.qd-alert-empty',e=>e.textContent),/Không có việc/);
await p.evaluate(()=>[...document.querySelectorAll('.qd-alert-empty button')][0].click());await p.waitForSelector('.qd-viec');
await p.focus('.qd-bang-cb .row-select');await p.keyboard.press('Enter');await p.waitForSelector('.qd-ho-so');assert.equal(await p.$eval('.qd-bang-cb .row-select',e=>e.getAttribute('aria-expanded')),'true');await p.keyboard.press('Enter');assert.equal(await p.$('.qd-ho-so'),null);
await p.type('.qd-loc-cb input','no-such-taxpayer');await p.waitForSelector('.qd-alert-empty');await p.evaluate(()=>[...document.querySelectorAll('.qd-alert-empty button')][0].click());
await p.select('[aria-labelledby="qd-bao-truoc"]','10');assert.equal(await p.evaluate(()=>localStorage.getItem('qldn-bao-truoc:cv.ql2')),'10');await p.select('[aria-labelledby="qd-bao-truoc"]','3');
const dir=path.resolve('.audit/alert-exports');await mkdir(dir,{recursive:true});const cd=await p.createCDPSession();await cd.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:dir});await p.evaluate(()=>[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Xuất Excel').click());let files=[];for(let i=0;i<40;i++){files=await readdir(dir);if(files.some(f=>f.endsWith('.xlsx')))break;await new Promise(r=>setTimeout(r,100));}assert.ok(files.some(f=>f.endsWith('.xlsx')));
await p.setViewport({width:1440,height:1000});
for(const view of ['doituong','dieuhanh','canhbao','debt','hoadon','risk','hoan','tinhtrang']) {await p.goto(`http://localhost:5174/?view=${view}`);await p.waitForSelector('.workspace');await pause();assert.equal(await p.$('.qd-popup'),null);assert.equal(await p.$eval('.workspace-view',e=>e.style.opacity),'');console.log('route',view,'OK');}
await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await p.goto('http://localhost:5174/?view=canhbao');await p.waitForSelector('.qd-the-loc');await p.click('.qd-the-loc-o:nth-child(2)');assert.equal(await p.$eval('.qd-the-loc-o:nth-child(2)',e=>e.style.opacity),'');
await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);await p.click('.qd-the-loc-o:first-child');await pause();assert.equal(await p.$eval('.qd-the-loc-o',e=>e.style.opacity),'');
await p.goto('http://127.0.0.1:5173');await p.waitForSelector('.dworkspace');await pause();for(const id of ['report','revenue-analysis','location-detail','advanced-compare','overview']){await p.click(`#tab-${id}`);await pause();assert.equal(await p.$eval('.dworkspace',e=>e.style.opacity),'');console.log('NSNN tab',id,'OK');}
assert.deepEqual(errors,[]);console.log('PASS: modal removed, responsive, filters, keyboard details, preferences, Excel, all routes, both apps motion cleanup; no page errors');
}finally{await b.close();}
