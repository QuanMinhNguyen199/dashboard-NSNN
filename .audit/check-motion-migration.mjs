import puppeteer from '../tax-ops/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import assert from 'node:assert/strict';
const b=await puppeteer.launch({channel:'chrome',headless:true});const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e)));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function testMotion(selector) {
 await wait(350);
 await p.$eval(selector,e=>e.setAttribute('data-motion-key','migration-1'));
 await wait(50);
 const active=await p.$eval(selector,e=>({opacity:Number(getComputedStyle(e).opacity),animations:e.getAnimations().length}));
 assert.ok(active.opacity>0&&active.opacity<1,JSON.stringify(active));assert.ok(active.animations>0);
 await wait(300);assert.equal(await p.$eval(selector,e=>e.style.opacity),'');assert.equal(await p.$eval(selector,e=>e.getAnimations().length),0);
 await p.$eval(selector,e=>e.setAttribute('data-motion-key','migration-2'));await wait(30);
 await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await wait(40);
 assert.equal(await p.$eval(selector,e=>e.getAnimations().length),0);assert.equal(await p.$eval(selector,e=>e.style.opacity),'');
 await p.$eval(selector,e=>e.setAttribute('data-motion-key','migration-3'));await wait(40);assert.equal(await p.$eval(selector,e=>e.getAnimations().length),0);
 await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);await wait(80);
 await p.$eval(selector,e=>e.setAttribute('data-motion-key','migration-4'));await wait(45);assert.ok(await p.$eval(selector,e=>e.getAnimations().length>0));await wait(300);
 // Overlay animations must preserve existing inline transforms and priorities.
 await p.evaluate(()=>{const el=document.createElement('div');el.className='toast';el.id='motion-probe';el.style.cssText='position:fixed;top:20px;left:20px;width:60px;height:40px;opacity:.8;transform:translateX(12px)';document.getElementById('root').append(el);});await wait(40);assert.ok(await p.$eval('#motion-probe',e=>e.getAnimations().length>0));await wait(350);assert.equal(await p.$eval('#motion-probe',e=>e.style.opacity),'0.8');assert.equal(await p.$eval('#motion-probe',e=>e.style.transform),'translateX(12px)');await p.$eval('#motion-probe',e=>e.remove());
}
try {
await p.setViewport({width:1440,height:900});await p.goto('http://localhost:5174');await p.evaluate(()=>sessionStorage.setItem('tax-ops-demo-user',JSON.stringify({username:'cv.ql2',vaiTro:'CV'})));await p.goto('http://localhost:5174/?view=canhbao');await p.waitForSelector('.qd-alert-results');await testMotion('.qd-alert-results');
for(let i=0;i<6;i++) await p.click(`.qd-the-loc-o:nth-child(${i%2+1})`);await wait(350);assert.equal(await p.$$eval('.qd-the-loc-o',es=>es.reduce((n,e)=>n+e.getAnimations().length,0)),0);
for(const view of ['doituong','dieuhanh','debt','hoadon','risk','hoan','tinhtrang']){await p.goto(`http://localhost:5174/?view=${view}`);await p.waitForSelector('.workspace-view');await wait(300);assert.equal(await p.$eval('.workspace-view',e=>e.style.opacity),'');}
await p.setViewport({width:390,height:844});await p.click('[aria-label="Mở điều hướng"]');await p.waitForSelector('.mobile-drawer');await wait(350);assert.equal(await p.$eval('.mobile-drawer',e=>e.style.transform),'');await p.keyboard.press('Escape');await p.waitForSelector('.mobile-drawer',{hidden:true});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
console.log('PASS tax-ops: real native Motion frames, cleanup, reduced motion, rapid clicks, seven routes, mobile drawer');
await p.setViewport({width:1440,height:900});await p.goto('http://127.0.0.1:5173');await p.waitForSelector('.dworkspace');await testMotion('.dworkspace');for(const tab of ['report','revenue-analysis','location-detail','advanced-compare','overview']){await p.click(`#tab-${tab}`);await wait(350);assert.equal(await p.$eval('.dworkspace',e=>e.style.opacity),'');}console.log('PASS NSNN: real native Motion frames, cleanup, reduced motion, all five tabs');assert.deepEqual(errors,[]);console.log('No page errors');
}finally{await b.close();}
