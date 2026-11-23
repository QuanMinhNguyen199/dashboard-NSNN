import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(dir);
const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/components/ui.tsx'), 'utf8');
const colors = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)].map(m => [m[1], m[2]]));
const icons = Object.fromEntries([...ui.matchAll(/^  (\w+): (.+),$/gm)].filter(m => m[2].includes('<')).map(m => [m[1], m[2].replaceAll('<>', '').replaceAll('</>', '')]));
/*
  Thang chữ theo DESIGN.md (bản 20/11/2026): chín cỡ 10.5–24px viết bằng rem trong CSS (gốc 16px),
  ba giãn dòng 1.25 / 1.35 / 1.5, bậc 650 chỉ từ 16px trở lên. Figma không có rem nên ghi px ở gốc 16px.
  Tên style cũ giữ nguyên vì plugin gọi theo tên; Figure, Subhead, Nav group là ba bậc mới.
  [tên, cỡ px, weight, giãn dòng (hệ số), letter-spacing (em)]
*/
const typography = [
  ['Display',30,650,1.25,-0.022], ['Heading',20,650,1.25,-0.02], ['Figure',24,700,1.25,-0.015],
  ['Metric',18,650,1.25,-0.015], ['Subhead',16,650,1.35,-0.008],
  ['Title',14,700,1.5,-0.008], ['Body',14,400,1.5,0], ['Body strong',13,600,1.35,0],
  ['Lead',13,400,1.5,0], ['Label',12,600,1.35,0], ['Caption',12,400,1.5,0],
  ['Column head',11,700,1.35,0.02], ['Nav group',10.5,700,1.35,0.01], ['Navigation',14,600,1.5,0],
].map(([name,size,weight,lh,em])=>({name,size,weight,lineHeight:+(size*lh).toFixed(2),letterSpacing:+(size*em).toFixed(3),rem:+(size/16).toFixed(5)}));
const tokens = {name:'Tax Ops',version:'1.1.0',source:'tax-ops/src/styles.css',remBase:16,colors,typography,
  spacing:[0,1,2,3,4,6,7,8,9,10,11,12,13,14,16,18,20,24,28,32,40,48],
  /* Ba bậc khối/control/chip + hairline cho thanh dữ liệu. Bậc 12px của hộp thoại đã bỏ (DESIGN.md · Shapes). */
  radius:{panel:10,control:6,chip:4,hairline:2},
  /* Không còn măng sét (topbar): mặt làm việc bắt đầu ngay mép trên khung nhìn. Thanh bên = --sidebar-width 15.75rem. */
  size:{'control-desktop':32,'control-touch':44,'nav':38,'table-header':34,'table-row':38,'sidebar':252,'drawer':600,'drawer-wide':760},
  icons, motion:{duration:120,easing:'cubic-bezier(.16, 1, .3, 1)'},
  sourceMappings:{Button:'src/components/ui.tsx#Button',Badge:'src/components/ui.tsx#Badge',Icon:'src/components/ui.tsx#Icon',SearchField:'src/components/ui.tsx#SearchField',Segmented:'src/components/ui.tsx#Segmented',Panel:'src/components/ui.tsx#Panel',FigureLine:'src/components/ui.tsx#FigureLine',Pager:'src/components/ui.tsx#Pager',Table:'src/components/ui.tsx#TableWrap',Navigation:'src/components/Shell.tsx',Notice:'src/styles.css#.notice',Toast:'src/styles.css#.toast',EmptyState:'src/styles.css#.empty-state',Dialog:'src/features/Reports.tsx',Toggletip:'src/components/GoiYCachTinh.tsx','Toggletip/Trigger':'src/components/GoiYCachTinh.tsx'},
};
fs.writeFileSync(path.join(dir,'tokens.json'),JSON.stringify(tokens,null,2)+'\n');
const expanded = Object.entries(colors).map(([key,hex])=>`  --${key}: ${hex};`).join('\n');
const primitiveCss = [...new Set(Object.values(colors))].map(hex=>`  --primitive-${hex.slice(1)}: ${hex};`).join('\n');
const spaces = tokens.spacing.map(v=>`  --space-${v}: ${v}px;`).join('\n');
const dims = [...Object.entries(tokens.radius).map(([k,v])=>`  --radius-${k}: ${v}px;`),...Object.entries(tokens.size).map(([k,v])=>`  --size-${k}: ${v}px;`)];
fs.writeFileSync(path.join(dir,'tokens.css'),`:root {\n${expanded}\n${primitiveCss}\n${spaces}\n${dims.join('\n')}\n}\n`);
/* Màn chụp từ app (capture-screen.mjs) — nhúng nguyên vào plugin để dựng thành layer. */
const screenDir=path.join(dir,'screens');
const screens=fs.existsSync(screenDir)?fs.readdirSync(screenDir).filter(f=>f.endsWith('.json')).sort().map(f=>JSON.parse(fs.readFileSync(path.join(screenDir,f),'utf8'))):[];
const plugin = fs.readFileSync(path.join(dir,'plugin.template.js'),'utf8').replace('/*__TOKENS__*/',JSON.stringify(tokens)).replace('/*__BUILT__*/',new Date().toISOString()).replace('/*__SCREENS__*/',JSON.stringify(screens));
fs.mkdirSync(path.join(dir,'figma-plugin'),{recursive:true});
fs.writeFileSync(path.join(dir,'figma-plugin/code.js'),plugin);
const font = fs.readFileSync(path.join(root,'src/fonts/public-sans-latin.woff2')).toString('base64');
const viet = fs.readFileSync(path.join(root,'src/fonts/public-sans-vietnamese.woff2')).toString('base64');
const svg = name=>`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const swatches = Object.entries(colors).map(([k,v])=>`<div class="swatch"><div style="background:${v}" class="paint"></div><strong>${k}</strong><code>${v}</code></div>`).join('');
const typeRows=typography.map(t=>`<div class="type-row"><code>${t.name}<small>${t.size}px · ${t.rem}rem / ${t.weight} / ${t.lineHeight}px</small></code><span style="font-size:${t.size}px;font-weight:${t.weight};line-height:${t.lineHeight}px;letter-spacing:${t.letterSpacing}px">Quản lý Thuế</span></div>`).join('');
const iconRows=Object.keys(icons).map(k=>`<div class="icon-item">${svg(k)}<code>${k}</code></div>`).join('');
const badge=(tone,label)=>`<span class="badge tone-${tone}">${label}</span>`;
const btn=(kind,text,extra='')=>`<button type="button" class="button is-${kind}" ${extra}>${svg('report')}<span>${text}</span></button>`;
const preview=fs.readFileSync(path.join(dir,'preview.template.html'),'utf8')
  .replace('/*__CSS__*/',css.replace(/url\("\.\/fonts\/public-sans-vietnamese.woff2"\)/g,`url("data:font/woff2;base64,${viet}")`).replace(/url\("\.\/fonts\/public-sans-latin.woff2"\)/g,`url("data:font/woff2;base64,${font}")`))
  .replace('<!--SWATCHES-->',swatches).replace('<!--TYPE-->',typeRows).replace('<!--ICONS-->',iconRows)
  .replace('<!--BUTTONS-->',['primary','secondary','quiet'].map(k=>`<div class="demo-row"><code>${k}</code>${btn(k,'Tạo báo cáo')}${btn(k,'Không khả dụng','disabled')}</div>`).join(''))
  .replaceAll('<!--BADGES-->',[['neutral','Bản nháp'],['positive','Đã duyệt'],['warning','Chờ duyệt'],['info','Đang xử lý'],['critical','Cần xử lý']].map(([t,l])=>badge(t,l)).join(''));
fs.writeFileSync(path.join(dir,'preview.html'),preview);
console.log(`Built ${screens.length} captured screen(s), ${Object.keys(colors).length} source colors, ${typography.length} text styles, ${Object.keys(icons).length} icons; Figma plugin and standalone preview.`);
