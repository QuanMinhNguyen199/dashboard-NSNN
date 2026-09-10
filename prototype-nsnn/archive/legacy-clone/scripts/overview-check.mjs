import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] ?? 'http://127.0.0.1:5173';
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const out = path.resolve('.impeccable/review'); fs.mkdirSync(out, { recursive: true });
const errors = []; const results = [];
for (const [name, width, height] of [['desktop',1440,1000],['tablet',1024,900],['mobile',390,844]]) {
  const page = await browser.newPage(); await page.setViewport({ width, height });
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`)); page.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errors.push(`${name}: ${m.text()}`); });
  await page.goto(`${BASE}/?year=2026&acc=PERIOD&item=tong-so&tab=overview`, { waitUntil:'networkidle0' }); await new Promise(r => setTimeout(r, 800));
  const state = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, cards: document.querySelectorAll('.ov-card').length, kpis: document.querySelectorAll('.ov-kpis>div').length, text: document.body.innerText }));
  await page.screenshot({ path:path.join(out,`${name}.png`), fullPage:true }); results.push({ name, ...state, overflow: state.width > state.viewport });
  if (name === 'desktop') {
    const before = await page.$eval('.ov-kpis strong', el => el.textContent);
    await page.select('.ov-filter-primary label:nth-child(1) select','2025'); await new Promise(r => setTimeout(r, 400));
    const after = await page.$eval('.ov-kpis strong', el => el.textContent); if (before === after) errors.push('desktop: đổi năm không cập nhật KPI');
    await page.click('.ov-structure button'); await page.waitForSelector('[role="dialog"]'); await page.keyboard.press('Escape');
    await page.click('.ov-collapsed button'); await page.waitForSelector('.ov-ward-picks');
    await page.evaluate(() => [...document.querySelectorAll('.ov-segmented button')].find(el => el.textContent.trim() === 'Quý')?.click());
    await page.select('.ov-filter-primary label:nth-child(5) select', 'NSTW'); await new Promise(r => setTimeout(r, 500));
    const saved = await page.evaluate(() => { const p = new URLSearchParams(location.search); return [p.get('periodType'), p.get('level')]; }); if (saved.join('/') !== 'QUARTER/NSTW') errors.push(`desktop: URL Overview sai ${saved.join('/')}`);
    await page.click('.master-tab:nth-child(2)'); await new Promise(r => setTimeout(r, 700));
    const detailActive = await page.$eval('[role="tab"][data-state="active"]', el => el.textContent.trim()); if (detailActive !== 'Chi tiết địa bàn') errors.push('desktop: không chuyển được tab Chi tiết');
    await page.click('.master-tab:nth-child(3)'); await new Promise(r => setTimeout(r, 500));
    const compareActive = await page.$eval('[role="tab"][data-state="active"]', el => el.textContent.trim()); if (compareActive !== 'So sánh hai kỳ') errors.push('desktop: không chuyển được tab So sánh');
    await page.click('.master-tab:nth-child(1)'); await new Promise(r => setTimeout(r, 500));
    const restored = await page.evaluate(() => { const p = new URLSearchParams(location.search); return [p.get('periodType'), p.get('level')]; }); if (restored.join('/') !== 'QUARTER/NSTW') errors.push(`desktop: không khôi phục filter Overview ${restored.join('/')}`);
  }
  await page.close();
}
await browser.close();
console.log(JSON.stringify({ results: results.map(({text,...x}) => ({...x, hasMockLabel:text.includes('Dữ liệu mô phỏng phục vụ prototype')})), errors }, null, 2));
if (errors.length || results.some(r => r.overflow || r.cards < 6 || r.kpis !== 4)) process.exitCode = 1;
