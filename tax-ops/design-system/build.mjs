import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(dir);
const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/components/ui.tsx'), 'utf8');
const colors = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)].map(m => [m[1], m[2]]));
const icons = Object.fromEntries([...ui.matchAll(/^  (\w+): (.+),$/gm)].filter(m => m[2].includes('<')).map(m => [m[1], m[2].replaceAll('<>', '').replaceAll('</>', '')]));
const typography = [
  ['Display',30,650,37.5,-0.66], ['Heading',20,650,25,-0.4], ['Metric',18,650,22.5,-0.27],
  ['Title',14,700,21,-0.112], ['Body',14,400,21,0], ['Body strong',13,600,19.5,0],
  ['Lead',13,400,19.5,0], ['Label',12,600,16.8,0], ['Caption',12,400,18,0],
  ['Column head',11,700,16.5,0.22], ['Navigation',14,600,21,0],
].map(([name,size,weight,lineHeight,letterSpacing])=>({name,size,weight,lineHeight,letterSpacing}));
const tokens = {name:'Tax Ops',version:'1.0.0',source:'tax-ops/src/styles.css',colors,typography,
  spacing:[0,1,2,3,4,6,7,8,9,10,11,12,13,14,16,18,20,24,28,32,40,48],
  radius:{panel:10,control:6,chip:4,hairline:2,dialog:12},
  size:{'control-desktop':32,'control-touch':44,'nav':38,'table-header':34,'table-row':38,'topbar':60,'sidebar':252},
  icons, motion:{duration:120,easing:'cubic-bezier(.16, 1, .3, 1)'},
  sourceMappings:{Button:'src/components/ui.tsx#Button',Badge:'src/components/ui.tsx#Badge',Icon:'src/components/ui.tsx#Icon',SearchField:'src/components/ui.tsx#SearchField',Segmented:'src/components/ui.tsx#Segmented',Panel:'src/components/ui.tsx#Panel',FigureLine:'src/components/ui.tsx#FigureLine',Pager:'src/components/ui.tsx#Pager',Table:'src/components/ui.tsx#TableWrap',Navigation:'src/components/Shell.tsx',Notice:'src/styles.css#.notice',Toast:'src/styles.css#.toast',EmptyState:'src/styles.css#.empty-state',Dialog:'src/features/Reports.tsx'},
};
fs.writeFileSync(path.join(dir,'tokens.json'),JSON.stringify(tokens,null,2)+'\n');
const expanded = Object.entries(colors).map(([key,hex])=>`  --${key}: ${hex};`).join('\n');
const primitiveCss = [...new Set(Object.values(colors))].map(hex=>`  --primitive-${hex.slice(1)}: ${hex};`).join('\n');
const spaces = tokens.spacing.map(v=>`  --space-${v}: ${v}px;`).join('\n');
const dims = [...Object.entries(tokens.radius).map(([k,v])=>`  --radius-${k}: ${v}px;`),...Object.entries(tokens.size).map(([k,v])=>`  --size-${k}: ${v}px;`)];
fs.writeFileSync(path.join(dir,'tokens.css'),`:root {\n${expanded}\n${primitiveCss}\n${spaces}\n${dims.join('\n')}\n  --topbar-h: 60px;\n}\n`);
const plugin = fs.readFileSync(path.join(dir,'plugin.template.js'),'utf8').replace('/*__TOKENS__*/',JSON.stringify(tokens));
fs.mkdirSync(path.join(dir,'figma-plugin'),{recursive:true});
fs.writeFileSync(path.join(dir,'figma-plugin/code.js'),plugin);
const font = fs.readFileSync(path.join(root,'src/fonts/public-sans-latin.woff2')).toString('base64');
const viet = fs.readFileSync(path.join(root,'src/fonts/public-sans-vietnamese.woff2')).toString('base64');
const svg = name=>`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const swatches = Object.entries(colors).map(([k,v])=>`<div class="swatch"><div style="background:${v}" class="paint"></div><strong>${k}</strong><code>${v}</code></div>`).join('');
const typeRows=typography.map(t=>`<div class="type-row"><code>${t.name}<small>${t.size}px / ${t.weight} / ${t.lineHeight}px</small></code><span style="font-size:${t.size}px;font-weight:${t.weight};line-height:${t.lineHeight}px;letter-spacing:${t.letterSpacing}px">Quản lý nghiệp vụ Thuế</span></div>`).join('');
const iconRows=Object.keys(icons).map(k=>`<div class="icon-item">${svg(k)}<code>${k}</code></div>`).join('');
const badge=(tone,label)=>`<span class="badge tone-${tone}">${label}</span>`;
const btn=(kind,text,extra='')=>`<button type="button" class="button is-${kind}" ${extra}>${svg('report')}<span>${text}</span></button>`;
const preview=fs.readFileSync(path.join(dir,'preview.template.html'),'utf8')
  .replace('/*__CSS__*/',css.replace(/url\("\.\/fonts\/public-sans-vietnamese.woff2"\)/g,`url("data:font/woff2;base64,${viet}")`).replace(/url\("\.\/fonts\/public-sans-latin.woff2"\)/g,`url("data:font/woff2;base64,${font}")`))
  .replace('<!--SWATCHES-->',swatches).replace('<!--TYPE-->',typeRows).replace('<!--ICONS-->',iconRows)
  .replace('<!--BUTTONS-->',['primary','secondary','quiet'].map(k=>`<div class="demo-row"><code>${k}</code>${btn(k,'Tạo báo cáo')}${btn(k,'Không khả dụng','disabled')}</div>`).join(''))
  .replaceAll('<!--BADGES-->',[['neutral','Bản nháp'],['positive','Đã duyệt'],['warning','Chờ duyệt'],['info','Đang xử lý'],['critical','Cần xử lý']].map(([t,l])=>badge(t,l)).join(''));
fs.writeFileSync(path.join(dir,'preview.html'),preview);
console.log(`Built ${Object.keys(colors).length} source colors, ${typography.length} text styles, ${Object.keys(icons).length} icons; Figma plugin and standalone preview.`);
