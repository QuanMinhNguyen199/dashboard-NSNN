import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const browser=await puppeteer.launch({channel:'chrome',headless:true});
const results=[];
try {
  for(const width of [1440,390]){
    const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.setViewport({width,height:1000});
    await p.goto(pathToFileURL(path.join(dir,'preview.html')).href,{waitUntil:'networkidle0'});
    await p.evaluate(()=>document.fonts.ready);
    await p.click('.demo-row button:not(:disabled)');
    const feedback=await p.$eval('#feedback',e=>e.textContent);
    // CSS switches segmented to native select in the prototype on mobile;
    // the documentation intentionally demonstrates this control at all widths.
    const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    const count=await p.$$eval('.swatch',n=>n.length);
    const fonts=await p.evaluate(()=>document.fonts.check('14px "Public Sans"'));
    await p.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});
    await p.screenshot({path:path.join(dir,`preview-${width}.png`),fullPage:true});
    const result={width,overflow,colorCount:count,fontsLoaded:fonts,buttonFeedback:!!feedback,errors};results.push(result);
    if(overflow||count!==38||!fonts||!feedback||errors.length)throw new Error(JSON.stringify(result));
    await p.close();
  }
  fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify({preview:results,figma:'Not executed: Figma MCP Starter quota exhausted. Plugin syntax checked; canvas import and visual QA pending.'},null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
