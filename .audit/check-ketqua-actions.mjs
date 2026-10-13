import puppeteer from '../tax-ops/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import {mkdir,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
const dir=path.resolve('.audit/ketqua-exports');await mkdir(dir,{recursive:true});
const b=await puppeteer.launch({channel:'chrome',headless:true});
try { const p=await b.newPage();await p.goto('http://localhost:5174');await p.evaluate(()=>sessionStorage.setItem('tax-ops-demo-user',JSON.stringify({username:'ld.thuetp',vaiTro:'LD_TP'})));await p.goto('http://localhost:5174/?view=dieuhanh');await p.waitForSelector('.qd-the');await p.evaluate(()=>document.querySelector('.qd-popup[open] .drawer-close')?.click());
const client=await p.createCDPSession();await client.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:dir});
await p.evaluate(()=>[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Xuất Excel').click());
let downloaded=false;for(let i=0;i<40;i++){const files=await readdir(dir);if(files.some(f=>f.endsWith('.xlsx'))){downloaded=true;break;}await new Promise(r=>setTimeout(r,100));}if(!downloaded)throw Error('Excel missing');
const before=await p.$eval('.qd-the-so',e=>e.textContent);const options=await p.$$eval('[aria-labelledby="qd-ky"] option',e=>e.map(x=>x.value));await p.select('[aria-labelledby="qd-ky"]',options[1]);const after=await p.$eval('.qd-the-so',e=>e.textContent);if(before===after)throw Error('Period unchanged');
await p.focus('.qd-the');await p.keyboard.press('Enter');await p.waitForSelector('.qd-bang');console.log('PASS: leader overview, Excel download, period update, keyboard detail navigation');
} finally {await b.close();}
