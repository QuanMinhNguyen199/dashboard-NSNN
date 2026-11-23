/* Generated plugin uses the standard Figma Plugin API, with no network access. */
const DATA = /*__TOKENS__*/;
const SCREENS = /*__SCREENS__*/;
const PREFIX = 'Tax Ops / ';
const PAGE_NAMES = ['00 · Tax Ops — Hướng dẫn','01 · Tax Ops — Foundations','02 · Tax Ops — Icons','03 · Tax Ops — Controls','04 · Tax Ops — Data','05 · Tax Ops — Feedback'];
const state = {fileKey:null,pages:{},collections:{},variables:{},styles:{},components:{},sections:{},reviewFrames:[],createdNodeIds:[],warnings:[]};
const V = {}, ST = {}, FX = {}, C = {}, FONTS = {};
let page;
let baseX=0;
const LIBRARY_PAGE="Tax Ops — Design System v"+DATA.version.replace(/\.0$/,"");
const rgb = hex => ({r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255});
function track(n){state.createdNodeIds.push(n.id);return n;}
function paint(key){return figma.variables.setBoundVariableForPaint({type:'SOLID',color:rgb(DATA.colors[key]||'#ffffff')},'color',V[key]);}
function fill(n,key){n.fills=key?[paint(key)]:[];}
function stroke(n,key){n.strokes=key?[paint(key)]:[];n.strokeWeight=1;}
function spacing(n,key,value){n.setBoundVariable(key,V['space/'+value]);}
function pad(n,v){for(const k of ['paddingLeft','paddingRight','paddingTop','paddingBottom'])spacing(n,k,v);}
function radius(n,key){n.setBoundVariable('cornerRadius',V['radius/'+key]);}
function box(name,dir='VERTICAL',width){const n=track(figma.createFrame());n.name=name;n.layoutMode=dir;n.fills=[];n.clipsContent=false;if(width)n.resize(width,48);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode=width?'FIXED':'AUTO';return n;}
async function text(parent,value,style='Body',color='ink',width){const t=track(figma.createText());t.name=value.slice(0,60);await t.setTextStyleIdAsync(ST[style].id);t.characters=value;t.fills=[paint(color)];parent.appendChild(t);if(width){t.textAutoResize='HEIGHT';t.resize(width,t.height);}return t;}
function prop(owner,node,label,value){const key=owner.addComponentProperty(label,'TEXT',value);node.componentPropertyReferences={characters:key};}
function component(name,dir='HORIZONTAL',w,h){const n=track(figma.createComponent());n.name=name;n.layoutMode=dir;n.fills=[];n.clipsContent=false;if(w&&h)n.resize(w,h);else{n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='AUTO';}n.counterAxisAlignItems='CENTER';spacing(n,'itemSpacing',6);return n;}
function inst(parent,comp){const n=track(comp.createInstance());parent.appendChild(n);return n;}
function icon(parent,name,color='ink',size=20){const n=inst(parent,C['Icon/'+name]);n.resize(size,size);n.findAllWithCriteria({types:['VECTOR']}).forEach(v=>{if(v.strokes.length)v.strokes=[paint(color)];});return n;}
function focus(n,dark=false){n.effects=[{type:'DROP_SHADOW',color:{...rgb(DATA.colors[dark?'focus-on-chrome':'focus']),a:1},offset:{x:0,y:0},radius:0,spread:4,visible:true,blendMode:'NORMAL'},{type:'DROP_SHADOW',color:{...rgb(DATA.colors[dark?'chrome':'surface']),a:1},offset:{x:0,y:0},radius:0,spread:2,visible:true,blendMode:'NORMAL'}];}
async function newPage(index){if(!page){page=track(figma.createPage());page.name=LIBRARY_PAGE;state.pages[page.name]=page.id;await figma.setCurrentPageAsync(page);page.backgrounds=[{type:'SOLID',color:rgb(DATA.colors.canvas)}];}baseX=index*2800;state.sections[PAGE_NAMES[index]]={x:baseX};return page;}
async function review(title,desc){const f=box(title,'VERTICAL',1120);page.appendChild(f);f.x=baseX+80;f.y=80;pad(f,32);spacing(f,'itemSpacing',24);fill(f,'surface');radius(f,'panel');await text(f,title,'Heading');await text(f,desc,'Body','ink-2',1056);state.reviewFrames.push(f.id);return f;}
async function section(parent,title,description){const b=box(title,'VERTICAL',1056);spacing(b,'itemSpacing',16);parent.appendChild(b);await text(b,title,'Title');if(description)await text(b,description,'Caption','ink-3',1024);return b;}
function row(parent,name='Examples'){const n=box(name,'HORIZONTAL');spacing(n,'itemSpacing',24);n.counterAxisAlignItems='CENTER';parent.appendChild(n);return n;}
function remember(name,node,source){C[name]=node;state.components[name]={id:node.id,key:node.key,source:source||DATA.sourceMappings[name]||'src/styles.css'};node.description=`Tax Ops v${DATA.version}. ${source||DATA.sourceMappings[name]||'src/styles.css'}. Dùng instance; giữ token, text style và nhãn tiếng Việt.`;}
// Adapted from figma-generate-library/scripts/createComponentWithVariants.js:
// use variable-width grid placement after combineAsVariants, outside review frames.
function variants(name,nodes,columns=4){const set=track(figma.combineAsVariants(nodes,page));set.name=PREFIX+name;set.fills=[];let y=32;for(let i=0;i<nodes.length;i+=columns){let x=32,h=0;for(const n of nodes.slice(i,i+columns)){n.x=x;n.y=y;x+=n.width+32;h=Math.max(h,n.height);}y+=h+32;}set.resizeWithoutConstraints(Math.max(...nodes.map(n=>n.x+n.width))+32,y);set.x=baseX+1320;set.y=80+Object.values(C).filter(n=>n.type==='COMPONENT_SET'&&n.parent===page&&n.x===baseX+1320).reduce((a,n)=>a+n.height+80,0);remember(name,set);return set;}
function standalone(name,n){page.appendChild(n);n.x=baseX+1320;n.y=80+page.children.filter(c=>c!==n&&c.x>=baseX+1300&&c.x<baseX+2800).reduce((a,c)=>a+c.height+64,0);n.name=PREFIX+name;remember(name,n);return n;}
// Adapted from figma-generate-library/scripts/createVariableCollection.js.
function collection(name,mode){const c=figma.variables.createVariableCollection(PREFIX+name);c.renameMode(c.defaultModeId,mode);state.collections[name]=c.id;return c;}
function variable(coll,name,type,value,scopes,css){const v=figma.variables.createVariable(name,coll,type);v.scopes=scopes;v.setValueForMode(coll.defaultModeId,value);v.setVariableCodeSyntax('WEB',`var(--${css})`);state.variables[coll.name+'/'+name]=v.id;return v;}
async function foundations(){
  const prim=collection('Primitives','Default'),sem=collection('Color','Light'),dim=collection('Dimensions','Default');
  const unique={};
  for(const [key,hex]of Object.entries(DATA.colors)){
    if(!unique[hex])unique[hex]=variable(prim,'color/'+hex.slice(1),'COLOR',{...rgb(hex),a:1},[],'primitive-'+hex.slice(1));
    const scope=/^(ink|on-chrome|positive-on-chrome)/.test(key)?['TEXT_FILL','SHAPE_FILL','STROKE_COLOR']:/line|edge|focus/.test(key)?['STROKE_COLOR','FRAME_FILL','SHAPE_FILL']:['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];
    V[key]=variable(sem,key,'COLOR',{type:'VARIABLE_ALIAS',id:unique[hex].id},scope,key);
  }
  for(const v of DATA.spacing)V['space/'+v]=variable(dim,'space/'+v,'FLOAT',v,['GAP'],'space-'+v);
  for(const [k,v]of Object.entries(DATA.radius))V['radius/'+k]=variable(dim,'radius/'+k,'FLOAT',v,['CORNER_RADIUS'],'radius-'+k);
  for(const [k,v]of Object.entries(DATA.size))V['size/'+k]=variable(dim,'size/'+k,'FLOAT',v,['WIDTH_HEIGHT'],k==='topbar'?'topbar-h':'size-'+k);
  for(const spec of DATA.typography){const s=figma.createTextStyle();s.name=PREFIX+spec.name;s.fontName=FONTS[spec.weight];s.fontSize=spec.size;s.lineHeight={unit:'PIXELS',value:spec.lineHeight};s.letterSpacing={unit:'PIXELS',value:spec.letterSpacing};s.description='Public Sans; source: tax-ops/src/styles.css. Enable tabular figures for numerical data.';ST[spec.name]=s;state.styles[s.name]=s.id;}
  const effects={Panel:[{x:0,y:1,r:2,a:.05},{x:0,y:5,r:14,a:.04}],Overlay:[{x:0,y:18,r:48,a:.2}],Button:[{x:0,y:1,r:1,a:.08}]};
  for(const [name,es]of Object.entries(effects)){const s=figma.createEffectStyle();s.name=PREFIX+name;s.effects=es.map(e=>({type:'DROP_SHADOW',color:{...rgb(name==='Overlay'?DATA.colors.chrome:DATA.colors.ink),a:e.a},offset:{x:e.x,y:e.y},radius:e.r,spread:0,visible:true,blendMode:'NORMAL'}));FX[name]=s;state.styles[s.name+' effect']=s.id;}
  await newPage(1);const f=await review('Foundations','Nguồn: CSS hiện tại của tax-ops. Một chế độ Light; nền chrome là khung điều hướng, không phải dark theme.');
  for(let i=0;i<Object.keys(DATA.colors).length;i+=5){const r=row(f,'Color tokens');for(const [key,hex]of Object.entries(DATA.colors).slice(i,i+5)){const c=box(key,'VERTICAL',184);spacing(c,'itemSpacing',8);r.appendChild(c);const p=track(figma.createRectangle());p.resize(184,64);fill(p,key);radius(p,'control');c.appendChild(p);await text(c,key,'Label');await text(c,hex,'Caption','ink-3');}}
  const type=await section(f,'Public Sans','Mẫu dấu tiếng Việt và chữ số; trọng lượng 650 giữ đúng font biến thể trong prototype.');
  for(const spec of DATA.typography){const r=row(type);await text(r,spec.name+' / '+spec.size+' / '+spec.weight,'Caption','ink-3',220);await text(r,'Quản lý Thuế · 0123456789',spec.name,'ink',780);}
  const sp=await section(f,'Khoảng cách & bo góc','Control 6px · panel 10px · chip 4px · dialog 12px. Desktop 32px; cảm ứng 44px.');const rr=row(sp);for(const size of [4,8,12,16,20,24,32,48]){const b=box('Space '+size,'VERTICAL',104);rr.appendChild(b);const r=track(figma.createRectangle());r.resize(size,32);fill(r,'brand');b.appendChild(r);await text(b,size+'px','Label');}
}
async function icons(){await newPage(2);const f=await review('Icons','SVG gốc từ Icon trong src/components/ui.tsx. Lưới 24px, nét 1.6px. Dùng instance swap để thay icon.');const names=Object.keys(DATA.icons);for(let i=0;i<names.length;i+=6){const r=row(f);for(const name of names.slice(i,i+6)){const c=component(PREFIX+'Icon/'+name,'HORIZONTAL',24,24);const svg=track(figma.createNodeFromSvg(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${DATA.colors.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${DATA.icons[name]}</svg>`));c.appendChild(svg);svg.findAllWithCriteria({types:['VECTOR']}).forEach(v=>{track(v);if(v.strokes.length)v.strokes=[paint('ink')];});page.appendChild(c);c.x=baseX+1320+(names.indexOf(name)%6)*100;c.y=80+Math.floor(names.indexOf(name)/6)*120;remember('Icon/'+name,c,'src/components/ui.tsx#Icon');const tile=box(name,'VERTICAL',150);spacing(tile,'itemSpacing',12);r.appendChild(tile);inst(tile,c);await text(tile,name,'Caption');}}}
async function controls(){await newPage(3);const f=await review('Controls','Các trạng thái theo prototype. State chỉ phục vụ kiểm tra thiết kế; không tự tạo hành vi nghiệp vụ.');
  for(const density of ['Desktop','Touch']){const all=[];const s=await section(f,'Button / '+density,density==='Desktop'?'Cao 32px · primary / secondary / quiet. Tab hoặc chọn State=Focus để kiểm tra vòng focus.':'Cao 44px · dành cho vùng chạm ở khổ ≤900px.');for(const kind of ['Primary','Secondary','Quiet']){const r=row(s);for(const status of ['Default','Hover','Focus','Disabled']){const b=component(`Kind=${kind}, State=${status}`,'HORIZONTAL',166,density==='Desktop'?32:44);b.primaryAxisAlignItems='CENTER';radius(b,'control');spacing(b,'paddingLeft',kind==='Quiet'?8:11);spacing(b,'paddingRight',kind==='Quiet'?8:11);b.setBoundVariable('minHeight',V['size/control-'+(density==='Desktop'?'desktop':'touch')]);const bg=kind==='Primary'?(status==='Hover'?'brand-strong':'brand'):kind==='Secondary'?(status==='Hover'?'surface-soft':'surface'):(status==='Hover'?'surface-tint':null);fill(b,bg);stroke(b,kind==='Primary'?bg:kind==='Secondary'?(status==='Hover'?'control-line-hover':'control-line'):null);const col=kind==='Primary'?'surface':kind==='Quiet'?'brand':'ink';const ic=icon(b,'report',col,17);const txt=await text(b,'Tạo báo cáo','Body strong',col);const label=b.addComponentProperty('Label','TEXT','Tạo báo cáo');txt.componentPropertyReferences={characters:label};const show=b.addComponentProperty('Show icon','BOOLEAN',true);const swap=b.addComponentProperty('Icon','INSTANCE_SWAP',C['Icon/report'].id);ic.componentPropertyReferences={visible:show,mainComponent:swap};if(status==='Disabled')b.opacity=.45;else if(status==='Focus')focus(b);else if(kind!=='Quiet')await b.setEffectStyleIdAsync(FX.Button.id);all.push(b);inst(r,b);}}
    const set=variants('Button/'+density,all,4);state.components['Button/'+density].source=DATA.sourceMappings.Button;set.description='Button kind: primary | secondary | quiet. Label, Show icon và Icon có thể ghi đè. Disabled opacity 0.45. '+DATA.sourceMappings.Button;
  }
  const inputs=[];const s=await section(f,'Field','Text, search và select có các trạng thái Default / Focus / Disabled. Error là mẫu validation cho form; nhãn và trợ giúp có thể sửa.');for(const kind of ['Text','Search','Select']){const r=row(s);for(const status of ['Default','Focus','Disabled']){const b=component(`Kind=${kind}, State=${status}`,'VERTICAL',320,70);b.primaryAxisSizingMode='AUTO';b.counterAxisAlignItems='MIN';const label=await text(b,kind==='Search'?'Tìm người nộp thuế':kind==='Select'?'Kỳ báo cáo':'Tên báo cáo','Label','ink-2');prop(b,label,'Label',label.characters);const field=box('Control','HORIZONTAL',320);field.resize(320,32);field.counterAxisAlignItems='CENTER';spacing(field,'itemSpacing',8);spacing(field,'paddingLeft',9);spacing(field,'paddingRight',9);fill(field,'surface');stroke(field,'control-line');radius(field,'control');b.appendChild(field);if(kind==='Search')icon(field,'search','ink-3',17);const val=await text(field,kind==='Select'?'Tháng 10/2026':kind==='Search'?'Tên hoặc mã số thuế':'Nhập tên báo cáo','Body','ink-3');prop(b,val,'Value',val.characters);if(kind==='Select'){val.layoutSizingHorizontal='FILL';const a=icon(field,'arrow','ink-3',16);a.rotation=-90;}if(status==='Focus')focus(field);if(status==='Disabled')b.opacity=.45;inputs.push(b);inst(r,b);}}const error=track(inputs[0].clone());error.name='Kind=Text, State=Error';const errControl=error.findOne(n=>n.name==='Control');stroke(errControl,'critical');const help=await text(error,'Nhập tên báo cáo để tiếp tục.','Caption','critical',320);prop(error,help,'Helper',help.characters);inputs.push(error);inst(s,error);variants('Field',inputs,3);
  const navs=[];const ns=await section(f,'Navigation','Nền navy thể chế; mục được chọn dùng nền trắng và chữ xanh hành động.');const nr=row(ns);fill(nr,'chrome');pad(nr,20);for(const status of ['Default','Hover','Selected']){const n=component('State='+status,'HORIZONTAL',280,38);spacing(n,'paddingLeft',10);spacing(n,'paddingRight',10);radius(n,'chip');fill(n,status==='Selected'?'surface':null);if(status==='Hover')n.fills=[{...paint('surface'),opacity:20/255}];const tx=await text(n,'Trang công việc',status==='Selected'?'Navigation':'Body',status==='Selected'?'brand-strong':'on-chrome-1');prop(n,tx,'Label',tx.characters);navs.push(n);inst(nr,n);}variants('Navigation',navs,3);
  const segs=[];const seg=await section(f,'Segmented','Nhóm bộ lọc. Trên mobile dùng select tương đương.');const sr=row(seg);fill(sr,'line');pad(sr,2);radius(sr,'panel');for(const status of ['Default','Hover','Selected']){const c=component('State='+status,'HORIZONTAL',180,32);c.primaryAxisAlignItems='CENTER';radius(c,'control');fill(c,status==='Selected'?'surface':status==='Hover'?'hover-surface':null);stroke(c,status==='Selected'?'state-edge':null);const t=await text(c,status==='Selected'?'Tất cả':'Chờ duyệt','Body strong');prop(c,t,'Label',t.characters);segs.push(c);inst(sr,c);}variants('Segmented',segs,3);
}
async function badges(parent){const all=[],r=row(parent);for(const [tone,label]of [['Neutral','Bản nháp'],['Positive','Đã duyệt'],['Warning','Chờ duyệt'],['Info','Đang xử lý'],['Critical','Cần xử lý']]){const b=component('Tone='+tone);const key=tone==='Neutral'?'ink-2':tone.toLowerCase();if(tone==='Critical'){fill(b,'critical-bg');radius(b,'chip');spacing(b,'paddingLeft',7);spacing(b,'paddingRight',7);spacing(b,'paddingTop',2);spacing(b,'paddingBottom',2);}const dot=track(figma.createEllipse());dot.resize(6,6);fill(dot,key);b.appendChild(dot);const t=await text(b,label,'Label',key);prop(b,t,'Label',label);all.push(b);inst(r,b);}variants('Badge',all,5);}
async function data(){await newPage(4);const f=await review('Data & composition','Mẫu cho bảng và dữ liệu nghiệp vụ. Các con số trong tài liệu này đều là dữ liệu mô phỏng.');const bs=await section(f,'Badge','Nhãn chữ luôn đi kèm màu. Badge critical mới có nền màu.');await badges(bs);
  const cells=[];for(const role of ['Header','Text','Number']){const c=component('Role='+role,'HORIZONTAL',240,role==='Header'?34:38);spacing(c,'paddingLeft',12);spacing(c,'paddingRight',12);fill(c,role==='Header'?'surface-soft':'surface');c.primaryAxisAlignItems=role==='Number'?'MAX':'MIN';const t=await text(c,role==='Header'?'Tên báo cáo':role==='Number'?'1.280':'Tổng hợp nợ thuế',role==='Header'?'Column head':'Body',role==='Header'?'ink-2':'ink');prop(c,t,'Value',t.characters);cells.push(c);}variants('Table/Cell',cells,3);
  const rows=[];const ts=await section(f,'Table row','Hàng dữ liệu 38px; header 34px. Selected ưu tiên hơn hover. Total ghim ĐẦU bảng: chữ đậm 700, vạch 2px ink-3 bên dưới, không nền (DESIGN.md · The Total Row Does Not Need A Colour Rule).');for(const status of ['Total','Default','Hover','Selected']){const tong=status==='Total';const r=component('State='+status,'HORIZONTAL',1008,38);r.itemSpacing=0;fill(r,status==='Selected'?'selected-surface':status==='Hover'?'hover-surface':'surface');for(const [i,value]of (tong?['Tổng cộng (30 đơn vị)','Tháng 10/2026','—','38.400']:['Tổng hợp nợ thuế','Tháng 10/2026','Chờ duyệt','1.280']).entries()){const c=inst(r,cells[i===3?2:1]);c.resize(252,38);c.fills=[];const key=Object.keys(c.componentProperties).find(k=>k.startsWith('Value#'));c.setProperties({[key]:value});if(tong){const t=c.findOne(n=>n.type==='TEXT');if(t)await t.setTextStyleIdAsync(ST.Title.id);}}if(tong){r.strokes=[paint('ink-3')];r.strokeAlign='INSIDE';r.strokeTopWeight=0;r.strokeLeftWeight=0;r.strokeRightWeight=0;r.strokeBottomWeight=2;}rows.push(r);inst(ts,r);}variants('Table/Row',rows,1);
  const panel=component('Panel','VERTICAL',1008,190);panel.primaryAxisSizingMode='AUTO';panel.counterAxisAlignItems='MIN';panel.itemSpacing=0;fill(panel,'surface');stroke(panel,'line');radius(panel,'panel');await panel.setEffectStyleIdAsync(FX.Panel.id);const hd=box('Panel header','HORIZONTAL',1008);pad(hd,16);panel.appendChild(hd);const title=await text(hd,'Danh sách báo cáo','Title');prop(panel,title,'Title',title.characters);for(const c of cells.slice(0,1)){const header=box('Table header','HORIZONTAL',1008);header.itemSpacing=0;panel.appendChild(header);for(const name of ['Tên báo cáo','Kỳ báo cáo','Trạng thái','Số bản ghi']){const it=inst(header,c);it.resize(252,34);const k=Object.keys(it.componentProperties).find(x=>x.startsWith('Value#'));it.setProperties({[k]:name});}}
  inst(panel,rows[0]);inst(panel,rows[1]);inst(panel,rows[3]);standalone('Panel',panel);const ps=await section(f,'Panel / Table','Component lồng nhau: panel, cell và row. Thay dữ liệu bằng overrides.');inst(ps,panel);
  const metric=component('Figure','VERTICAL',240,76);metric.primaryAxisSizingMode='AUTO';metric.counterAxisAlignItems='MIN';pad(metric,16);spacing(metric,'itemSpacing',2);fill(metric,'surface');for(const [label,sty,col]of [['Hồ sơ cần xử lý','Label','ink-3'],['1.280','Metric','ink'],['Kỳ tháng 10/2026','Caption','ink-3']]){const t=await text(metric,label,sty,col);prop(metric,t,sty==='Metric'?'Value':sty==='Label'?'Label':'Note',label);}standalone('Figure',metric);const fig=component('FigureLine','HORIZONTAL',1008,90);fig.primaryAxisSizingMode='AUTO';fig.counterAxisSizingMode='AUTO';fig.itemSpacing=0;stroke(fig,'line');fill(fig,'surface');radius(fig,'panel');await fig.setEffectStyleIdAsync(FX.Panel.id);for(let i=0;i<4;i++)inst(fig,metric);standalone('FigureLine',fig);const fs=await section(f,'FigureLine','Một dải tổng hợp; số giữ màu trung tính.');inst(fs,fig);
  const pager=component('Pager');const prev=icon(pager,'arrow','ink-3',16);prev.rotation=180;const label=await text(pager,'Trang 1/12','Label','ink-2');prop(pager,label,'Position',label.characters);icon(pager,'arrow');pad(pager,8);standalone('Pager',pager);const pg=await section(f,'Pager','Ẩn khi chỉ có một trang; vô hiệu hóa nút trước/sau ở biên.');inst(pg,pager);
}
async function feedback(){await newPage(5);const f=await review('Feedback & overlays','Thông báo, toggletip ⓘ, toast, empty state và dialog. Các nhãn được sửa qua component properties.');const s=await section(f,'Notice','Màu mang nghĩa; nội dung giải thích hành động tiếp theo.');const ns=[];for(const [tone,title,body]of [['Warning','Dữ liệu mô phỏng','Số liệu dùng để minh họa giao diện.'],['Critical','Chưa đủ dữ liệu','Kiểm tra lô nguồn trước khi lập báo cáo.'],['Positive','Đã kiểm tra','Lô dữ liệu đã hoàn tất đối chiếu.'],['Info','Kỳ báo cáo','Đang hiển thị tháng 10/2026.']]){const n=component('Tone='+tone,'HORIZONTAL',1008,44);spacing(n,'paddingLeft',13);spacing(n,'paddingRight',13);spacing(n,'itemSpacing',10);fill(n,tone.toLowerCase()+'-bg');radius(n,'control');const a=await text(n,title,'Body strong',tone.toLowerCase());prop(n,a,'Title',title);const b=await text(n,body,'Lead','ink',720);prop(n,b,'Message',body);ns.push(n);inst(s,n);}variants('Notice',ns,1);
  /* Toggletip ⓘ — src/components/GoiYCachTinh.tsx (20/11/2026). ⓘ dựng từ đúng SVG của component, không có trong bộ Icon. */
  const tipSvg='<svg width="17" height="17" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8.1" fill="none" stroke="#000" stroke-width="1.9"/><circle cx="10" cy="6.3" r="1.25" fill="#000"/><path d="M10 9.1v5.4" stroke="#000" stroke-width="2.1" stroke-linecap="round"/></svg>';
  const trig=component('Toggletip/Trigger','HORIZONTAL',28,28);trig.primaryAxisAlignItems='CENTER';radius(trig,'control');const ii=track(figma.createNodeFromSvg(tipSvg));ii.name='Info';ii.fills=[];trig.appendChild(ii);ii.findAll(n=>'strokes' in n).forEach(v=>{if(v.strokes.length)v.strokes=[paint('brand')];if(v.fills&&v.fills.length)v.fills=[paint('brand')];});standalone('Toggletip/Trigger',trig);
  const tipBox=component('Toggletip','VERTICAL',360,120);tipBox.primaryAxisSizingMode='AUTO';tipBox.counterAxisAlignItems='MIN';pad(tipBox,16);spacing(tipBox,'itemSpacing',10);fill(tipBox,'surface');stroke(tipBox,'line');radius(tipBox,'panel');await tipBox.setEffectStyleIdAsync(FX.Overlay.id);const tpt=await text(tipBox,'Cách tính','Title');prop(tipBox,tpt,'Title',tpt.characters);const tpb=await text(tipBox,'Tỷ lệ = Số đã xử phạt / Tổng số phải xử phạt. Vạch trên thanh là bình quân toàn thuế.','Lead','ink-2',328);prop(tipBox,tpb,'Body',tpb.characters);standalone('Toggletip',tipBox);
  const tts=await section(f,'Toggletip ⓘ','Nút thật đứng ngay sau tên khối. Rê chuột hoặc Tab tới: hiện. Bấm, Enter, Space: giữ mở (không lật đóng). Esc, bấm ra ngoài, focus đi chỗ khác: đóng. Chuột vào được hộp để đọc và bôi chữ (WCAG 1.4.13). aria-expanded trên nút, role="tooltip" trên hộp. Từ 900px trở xuống và trên màn cảm ứng nút cao 44px.');const ttr=row(tts);inst(ttr,trig);inst(ttr,tipBox);
  const toast=component('Toast','HORIZONTAL',420,46);pad(toast,9);spacing(toast,'itemSpacing',10);fill(toast,'chrome');radius(toast,'panel');await toast.setEffectStyleIdAsync(FX.Overlay.id);icon(toast,'check','positive-on-chrome');const tt=await text(toast,'Đã lưu bản nháp','Body strong','surface');prop(toast,tt,'Message',tt.characters);tt.layoutSizingHorizontal='FILL';icon(toast,'close','on-chrome-1');standalone('Toast',toast);const st=await section(f,'Toast','Xác nhận ngắn sau hành động.');inst(st,toast);
  const empty=component('EmptyState','VERTICAL',600,140);pad(empty,28);spacing(empty,'itemSpacing',6);fill(empty,'surface');icon(empty,'check','positive',24);const et=await text(empty,'Không có hồ sơ cần xử lý','Body strong');prop(empty,et,'Title',et.characters);const en=await text(empty,'Thử thay đổi bộ lọc để xem các hồ sơ khác.','Lead','ink-3');prop(empty,en,'Message',en.characters);standalone('EmptyState',empty);const es=await section(f,'Empty state','Dùng thông điệp cụ thể và chỉ dẫn phù hợp với nguyên nhân rỗng.');inst(es,empty);
  const dialog=component('Dialog','VERTICAL',480,280);dialog.counterAxisAlignItems='MIN';dialog.primaryAxisSizingMode='AUTO';pad(dialog,24);spacing(dialog,'itemSpacing',20);fill(dialog,'surface');stroke(dialog,'line');radius(dialog,'panel');await dialog.setEffectStyleIdAsync(FX.Overlay.id);const dt=await text(dialog,'Tạo báo cáo mới','Heading');prop(dialog,dt,'Title',dt.characters);const fld=inst(dialog,C.Field.children[0]);fld.resize(432,fld.height);const acts=box('Actions','HORIZONTAL',432);acts.primaryAxisAlignItems='MAX';spacing(acts,'itemSpacing',8);dialog.appendChild(acts);const cancel=inst(acts,C['Button/Desktop'].children.find(c=>c.name==='Kind=Secondary, State=Default'));cancel.setProperties({[Object.keys(cancel.componentProperties).find(k=>k.startsWith('Label#'))]:'Hủy',[Object.keys(cancel.componentProperties).find(k=>k.startsWith('Show icon#'))]:false});const ok=inst(acts,C['Button/Desktop'].children[0]);ok.setProperties({[Object.keys(ok.componentProperties).find(k=>k.startsWith('Label#'))]:'Tạo bản nháp'});standalone('Dialog',dialog);const ds=await section(f,'Dialog','Rộng tối đa 480px, bo 10px như khối (bậc 12px đã bỏ). Khi triển khai: trap focus, Escape để đóng, trả focus về nút mở.');inst(ds,dialog);
}
async function cover(){await newPage(0);const f=await review('Tax Ops — Design system','Bộ thành phần cho Web quản lý nghiệp vụ Thuế. Phiên bản '+DATA.version+' · nguồn prototype trong repository dashboard-NSNN.');
  const mast=box('Identity','VERTICAL',1056);pad(mast,32);spacing(mast,'itemSpacing',16);fill(mast,'chrome');f.appendChild(mast);await text(mast,'Quản lý Thuế','Display','surface');await text(mast,'Nền xám xanh · Khung navy · Thang xanh dữ liệu','Body','on-chrome-2');
  for(const [title,body]of [['Bắt đầu','Mở Assets → Local components → Tax Ops. Kéo instance và sửa Label, Value, State hoặc Icon. Không detach instance khi chỉ đổi nội dung.'],['Cấu trúc','Foundations: màu, chữ, kích thước và effects. Icons: 21 SVG gốc. Controls: button, field, navigation, segmented. Data: badge, cell, row, panel, figure và pager. Feedback: notice, toast, empty state, dialog.'],['Nguồn chuẩn','src/styles.css và src/components/ui.tsx trong tax-ops. Bộ mới dùng Public Sans và palette dùng chung với Dashboard Thu NSNN; các màn cũ dùng Inter được giữ nguyên.'],['Quy tắc','Xanh thương hiệu dành cho hành động; thang xanh dành cho dữ liệu; trạng thái semantic giữ màu riêng và luôn có nhãn. Focus 2px; vùng chạm tối thiểu 44px. Không có dark mode trong prototype.'],['Tích hợp code','Component description chỉ ra file nguồn. tokens.json và tokens.css đi kèm gói import. Chưa publish library hoặc đăng ký Code Connect; cần kết nối Figma hoạt động để hoàn tất phần đó.'],['Giới hạn bản v1','Các mẫu là cấu trúc chỉnh sửa được, không thay thế logic ứng dụng. Typography số dùng Public Sans; bật tabular figures khi dựng bảng. Field Error minh họa validation; hành vi xác thực tiếp tục do ứng dụng xử lý.']]){const s=await section(f,title);await text(s,body,'Body','ink-2',1024);}
  figma.root.insertChild(0,page);figma.currentPage.selection=[f];figma.viewport.scrollAndZoomIntoView([f]);
}
/* ---------- Màn chi tiết dựng từ app (23/11/2026) ----------
   SCREENS do capture-screen.mjs chụp từ app đang chạy (vị trí, nền, viền, chữ, icon từng phần tử).
   Dựng lại thành layer sửa được trên trang riêng; màu trùng token gắn variable, cỡ chữ trùng thang
   gắn text style. Trang này là sản phẩm sinh ra: mỗi lần chạy thay trang cũ. */
const SCREEN_PAGE_RE=/^Tax Ops — Màn chi tiết/;
let MONO=null;
const HEX2KEY={};for(const [k,h]of Object.entries(DATA.colors)){const x=h.toLowerCase();if(!(x in HEX2KEY))HEX2KEY[x]=k;}
function screenPaint(c){if(!c)return [];const key=HEX2KEY[c.hex];const p=key&&V[key]?figma.variables.setBoundVariableForPaint({type:'SOLID',color:rgb(c.hex)},'color',V[key]):{type:'SOLID',color:rgb(c.hex)};return [c.a<1?{...p,opacity:c.a}:p];}
/* Màn chụp → khung Figma. Khối lặp (nhóm "comp" trong JSON) thành component chính đặt cạnh khung, mỗi chỗ
   dùng là instance (23/11/2026). Gom chỗ dùng vào một component khi cùng tên, cùng kiểu và cùng kích thước.
   Mỗi lớp được ghép vào "khe" cùng loại gần nhất trong component (lệch tối đa 2px); không khe nào khớp thì
   thêm khe mới. Component chứa đủ khe của mọi chỗ dùng trong cụm; chỗ nào không có khe đó thì ẩn lớp. Chữ, kiểu chữ, màu, độ mờ là ghi đè; component lồng khác mẫu thì hoán đổi. */
const hashStr=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return (h>>>0).toString(36);};
const phangMuc=ds=>ds.flatMap(m=>m.t==='comp'?phangMuc(m.muc):[m]);
const laPhai=m=>/right|end/.test(m.can);
const SAI_SO=2;
function neo(m,g){
  const l=m.x-g.x,r=g.x+g.w-(m.x+m.w),t=m.y-g.y,b=g.y+g.h-(m.y+m.h);
  return {h:Math.abs(l)<1&&Math.abs(r)<1?'STRETCH':Math.abs(r)<1&&l>1?'MAX':'MIN',v:Math.abs(t)<1&&Math.abs(b)<1?'STRETCH':Math.abs(b)<1&&t>1?'MAX':'MIN'};
}
/* Khe của từng mục: loại (kiểu lớp) và hình học dùng để so. */
function khe(g){
  if(g._khe)return g._khe;
  g._khe=g.muc.map(m=>{
    const x=m.x-g.x,y=m.y-g.y;
    const loai=m.t==='chu'?'T'+m.co+(m.mono?'m':'')+(laPhai(m)?'P':m.can==='center'?'G':'L')+(m.nhieuDong?'n':'')
      :m.t==='hop'?'H'+m.ten+'|'+m.bo.join(',')+'|'+m.vien.map(v=>v?v.w:0).join(',')
      :m.t==='svg'?'V'+hashStr(m.svg):'C'+m.comp;
    const hinh=m.t==='chu'?(m.nhieuDong?[x,y,m.w]:laPhai(m)?[g.w-(x+m.w),y]:[x,y]):m.t==='hop'?[x,y,m.w,m.h]:[x,y];
    return {loai,m,g,hinh};
  });
  return g._khe;
}
let CUM=[];
function vaoCum(g){
  let c=CUM.find(c=>c.comp===g.comp&&c.kieu===g.kieu&&Math.abs(c.w-g.w)<=1&&Math.abs(c.h-g.h)<=1);
  if(!c){c={comp:g.comp,kieu:g.kieu,w:g.w,h:g.h,khe:[],so:0,dung:0,c:null};CUM.push(c);}
  const gan={},daDung=new Set();let sau=-1;
  for(const s of khe(g)){
    let tot=null,lech=Infinity;
    c.khe.forEach((o,i)=>{if(o.loai!==s.loai||daDung.has(o.id))return;const d=Math.max(...o.hinh.map((v,j)=>Math.abs(v-s.hinh[j])));if(d<=SAI_SO&&d<lech){tot=o;lech=d;}});
    if(!tot){tot={...s,id:'k'+(++c.so)};c.khe.splice(sau+1,0,tot);}
    daDung.add(tot.id);gan[tot.id]=s.m;sau=c.khe.indexOf(tot);
  }
  g._cum=c;g._gan=gan;c.dung++;return c;
}
async function kieuChu(t,m){
  const dam=Math.round(m.dam);const st=!m.mono&&DATA.typography.find(s=>s.size===m.co&&s.weight===dam);
  if(st){if(t.textStyleId!==ST[st.name].id)await t.setTextStyleIdAsync(ST[st.name].id);return;}
  t.fontName=m.mono&&MONO?MONO:FONTS[dam]||FONTS[400];t.fontSize=m.co;if(m.gian)t.lineHeight={unit:'PIXELS',value:m.gian};t.letterSpacing={unit:'PIXELS',value:m.cach};
}
async function dungLa(m,g,cha,dem){
  const x=m.x-g.x,y=m.y-g.y;
  if(m.t==='comp'){
    const inst=track((await mainCua(m._cum,dem)).createInstance());inst.x=x;inst.y=y;
    if(Math.abs(inst.width-m.w)>.5||Math.abs(inst.height-m.h)>.5)inst.resize(Math.max(m.w,.01),Math.max(m.h,.01));
    inst.constraints={horizontal:neo(m,g).h==='STRETCH'?'STRETCH':'MIN',vertical:'MIN'};
    cha.appendChild(inst);await ghiDe(inst,m,dem);dem.instance++;return;
  }
  if(m.t==='hop'){
    const r=track(figma.createRectangle());r.name=m.ten;r.resize(Math.max(m.w,.01),Math.max(m.h,.01));r.x=x;r.y=y;r.fills=screenPaint(m.nen);
    [r.topLeftRadius,r.topRightRadius,r.bottomRightRadius,r.bottomLeftRadius]=m.bo;
    const v=m.vien.find(Boolean);
    if(v){r.strokes=screenPaint(v);r.strokeAlign='INSIDE';r.strokeTopWeight=m.vien[0]?m.vien[0].w:0;r.strokeRightWeight=m.vien[1]?m.vien[1].w:0;r.strokeBottomWeight=m.vien[2]?m.vien[2].w:0;r.strokeLeftWeight=m.vien[3]?m.vien[3].w:0;}
    if(m.op<1)r.opacity=m.op;const n=neo(m,g);r.constraints={horizontal:n.h,vertical:n.v};cha.appendChild(r);return;
  }
  if(m.t==='chu'){
    const t=track(figma.createText());await kieuChu(t,m);
    t.characters=m.chu;t.name=m.chu.trim().slice(0,48)||'chữ';t.fills=screenPaint(m.mau);
    t.textAlignHorizontal=laPhai(m)?'RIGHT':m.can==='center'?'CENTER':'LEFT';
    if(m.gach)t.textDecoration='UNDERLINE';
    let ngang='MIN';
    if(m.nhieuDong){t.textAutoResize='HEIGHT';t.resize(Math.max(m.w+1,1),Math.max(m.h,1));t.x=x;}
    /* Chữ căn phải: hộp chạy từ mép trái nhóm tới mép phải chữ, ghi đè chữ dài ngắn vẫn giữ mép phải. */
    else if(laPhai(m)&&x+m.w>1){t.textAutoResize='HEIGHT';t.resize(x+m.w,Math.max(m.h,1));t.x=0;ngang='STRETCH';}
    else{t.textAutoResize='WIDTH_AND_HEIGHT';t.x=x;}
    if(m.op<1)t.opacity=m.op;t.y=y;t.constraints={horizontal:ngang,vertical:'MIN'};cha.appendChild(t);return;
  }
  const n=track(figma.createNodeFromSvg(m.svg));n.name=m.ten;n.fills=[];if(m.op<1)n.opacity=m.op;n.x=x;n.y=y;
  n.constraints={horizontal:neo(m,g).h==='MAX'?'MAX':'MIN',vertical:'MIN'};cha.appendChild(n);
}
/* Ghi đè một chỗ dùng lên instance: lớp con theo đúng thứ tự khe của cụm; khe chỗ này không có thì ẩn. */
async function ghiDe(inst,g,dem){
  const c=g._cum,con=inst.children;
  if(con.length!==c.khe.length){dem.lech++;return;}
  for(let i=0;i<c.khe.length;i++){const n=con[i],m=g._gan[c.khe[i].id];try{
    if(!m){n.visible=false;continue;}
    n.visible=true;
    if(m.t==='chu'){await kieuChu(n,m);if(n.characters!==m.chu)n.characters=m.chu;n.fills=screenPaint(m.mau);n.opacity=m.op<1?m.op:1;}
    else if(m.t==='hop'){n.fills=screenPaint(m.nen);const v=m.vien.find(Boolean);if(v)n.strokes=screenPaint(v);n.opacity=m.op<1?m.op:1;}
    else if(m.t==='svg'){n.opacity=m.op<1?m.op:1;}
    else{
      const chinh=await mainCua(m._cum,dem);
      if(n.mainComponent!==chinh){n.swapComponent(chinh);dem.hoanDoi++;}
      if(Math.abs(n.width-m.w)>.5||Math.abs(n.height-m.h)>.5){try{n.resize(Math.max(m.w,.01),Math.max(m.h,.01));}catch(e){}}
      await ghiDe(n,m,dem);
    }
  }catch(e){dem.loi++;if(dem.loi<=3)state.warnings.push('Ghi đè '+g.comp+': '+String(e.message||e));}}
}
async function mainCua(c,dem){
  if(c.c)return c.c;
  const k=track(figma.createComponent());k.resize(Math.max(c.w,.01),Math.max(c.h,.01));k.fills=[];k.clipsContent=false;c.c=k;
  for(const s of c.khe)await dungLa(s.m,s.g,k,dem);
  dem.main++;return k;
}
const hienRo=(n,goc)=>{for(let p=n;p&&p!==goc;p=p.parent)if(p.visible===false)return false;return true;};
async function screens(){
  if(!SCREENS.length){log('info','Không có màn chụp nào để dựng.');return;}
  const cu=figma.root.children.filter(p=>SCREEN_PAGE_RE.test(p.name));
  /* Không xóa trang màn cũ (23/11/2026): đổi tên thành "(cũ <giờ>)" để người dùng tự xóa. */
  if(cu.length){const ten=cu.map(p=>p.name);const gio=new Date().toISOString().slice(0,16).replace('T',' ');for(const p of cu)p.name=p.name.replace(/^Tax Ops — /,'Tax Ops (cũ '+gio+') — ');log('info','Giữ trang màn cũ, đổi tên: '+ten.join(', '));}
  state.screens=[];
  for(const sc of SCREENS){
    /* Lập cụm trước khi dựng: duyệt mọi nhóm ở mọi khổ, nhóm trong trước nhóm ngoài. */
    CUM=[];const xep=ds=>ds.forEach(m=>{if(m.t==='comp'){xep(m.muc);vaoCum(m);}});for(const k of sc.kho)xep(k.muc);
    const sp=track(figma.createPage());sp.name='Tax Ops — Màn chi tiết · '+sc.ten.replace(/^Hồ sơ NNT · /,'');sp.backgrounds=[{type:'SOLID',color:rgb(DATA.colors.canvas)}];state.pages[sp.name]=sp.id;
    let x=0;
    const tong={main:0,instance:0,lech:0,loi:0,hoanDoi:0};
    for(const k of sc.kho){
      const fr=track(figma.createFrame());fr.name=sc.ten+' — '+k.rong+'px';fr.resize(k.w,k.h);fr.x=x;fr.y=0;fr.clipsContent=true;fr.fills=screenPaint({hex:DATA.colors.surface.toLowerCase(),a:1});sp.appendChild(fr);x+=k.w+160;
      const dem={main:0,instance:0,lech:0,loi:0,hoanDoi:0};const goc={x:0,y:0,w:k.w,h:k.h};
      for(const m of k.muc){
        try{await dungLa(m,goc,fr,dem);}
        catch(e){dem.loi++;if(dem.loi<=3)state.warnings.push('Màn '+k.rong+'px: không dựng được một '+(m.comp||m.t)+' — '+String(e.message||e));}
      }
      const chuChup=phangMuc(k.muc).filter(m=>m.t==='chu').length,chuDung=fr.findAll(n=>n.type==='TEXT'&&hienRo(n,fr)).length;
      for(const kk of Object.keys(tong))tong[kk]+=dem[kk];
      state.screens.push({ten:fr.name,id:fr.id,muc:phangMuc(k.muc).length,chuChup,chuDung,loi:dem.loi,lech:dem.lech,instance:dem.instance});
      log('info','Dựng '+fr.name+': '+chuDung+'/'+chuChup+' chữ, '+dem.instance+' instance, '+dem.loi+' mục lỗi');
    }
    /* Gom component chính theo tên khối thành bộ biến thể, xếp thành cột bên phải các khung. */
    const nhom={};for(const c of CUM)if(c.c)(nhom[c.comp]=nhom[c.comp]||[]).push(c);
    let y=0;const x0=x;let soBo=0;
    for(const [ten,ds] of Object.entries(nhom)){
      try{
        const stt={};
        for(const c of ds){const kieu=c.kieu||'mặc định';stt[kieu]=(stt[kieu]||0)+1;c.c.name='Kiểu='+kieu+', Mẫu='+stt[kieu];sp.appendChild(c.c);}
        const bo=track(figma.combineAsVariants(ds.map(c=>c.c),sp));bo.name='Màn / Hồ sơ NNT / '+ten;
        let cx=24,cao=0;for(const c of ds){c.c.x=cx;c.c.y=24;cx+=c.c.width+24;cao=Math.max(cao,c.c.height);}
        bo.resizeWithoutConstraints(Math.max(cx,1),cao+48);bo.x=x0;bo.y=y;y+=cao+48+80;soBo++;
      }catch(e){state.warnings.push('Gom biến thể '+ten+': '+String(e.message||e));}
    }
    log('info',sc.ten+': '+soBo+' bộ component, '+tong.main+' component chính cho '+tong.instance+' instance'+(tong.lech?', '+tong.lech+' instance lệch cấu trúc':''));
    state.screenComps={bo:soBo,main:tong.main,instance:tong.instance,lech:tong.lech,loi:tong.loi};
  }
}
/* ---------- Nhật ký và báo cáo sau khi chạy (23/11/2026) ----------
   Mọi lần chạy — thành công, dừng ở bước kiểm tra trước, hay lỗi giữa chừng — đều mở một
   bảng báo cáo dạng chữ để người dùng chép và dán lại cho nhóm phát triển kiểm tra.
   Chỉ đọc và ghi trong file Figma đang mở; không gọi mạng. */
const BUILT='/*__BUILT__*/';
const T0=Date.now();const LOG=[];let currentPhase='Kiểm tra trước';
state.phases=[];state.checks=[];
function log(level,msg){LOG.push({t:((Date.now()-T0)/1000).toFixed(1),level,msg});}
function check(name,ok,detail){state.checks.push({name,ok:!!ok,detail:detail||''});log(ok?'ok':'error',(ok?'ĐẠT  ':'LỖI  ')+name+(detail?' — '+detail:''));return !!ok;}
async function phase(name,fn){currentPhase=name;const s0=Date.now(),n0=state.createdNodeIds.length;log('info','▶ '+name);await fn();const ms=Date.now()-s0;state.phases.push({name,ms,nodes:state.createdNodeIds.length-n0});log('info','✓ '+name+' · '+ms+' ms · '+(state.createdNodeIds.length-n0)+' node');}
const EXPECTED_COMPONENTS=['Button/Desktop','Button/Touch','Field','Navigation','Segmented','Badge','Table/Cell','Table/Row','Panel','Figure','FigureLine','Pager','Notice','Toggletip','Toggletip/Trigger','Toast','EmptyState','Dialog'];
async function audit(){
  const vars=await figma.variables.getLocalVariablesAsync();const ids=new Set(Object.values(state.variables));const own=vars.filter(v=>ids.has(v.id));
  const badVars=own.filter(v=>v.scopes.includes('ALL_SCOPES')||!v.codeSyntax.WEB).map(v=>v.name);
  check('Variables có scope và CSS syntax',!badVars.length,badVars.length?badVars.slice(0,8).join(', '):own.length+' variables');
  const colorVars=own.filter(v=>v.resolvedType==='COLOR'&&!v.name.startsWith('color/')).length;
  check('Số màu semantic = số màu trong CSS',colorVars===Object.keys(DATA.colors).length,colorVars+' / '+Object.keys(DATA.colors).length);
  const styles=(await figma.getLocalTextStylesAsync()).filter(st=>st.name.startsWith(PREFIX));
  check('Số text style',styles.length===DATA.typography.length,styles.length+' / '+DATA.typography.length);
  const iconCount=Object.keys(C).filter(k=>k.startsWith('Icon/')).length;
  check('Số icon',iconCount===Object.keys(DATA.icons).length,iconCount+' / '+Object.keys(DATA.icons).length);
  const missing=EXPECTED_COMPONENTS.filter(k=>!C[k]);
  check('Đủ component',!missing.length,missing.length?'thiếu: '+missing.join(', '):EXPECTED_COMPONENTS.length+' component');
  const dup=[],zero=[];for(const [name,n]of Object.entries(C)){if(n.type==='COMPONENT_SET'){const labels=n.children.map(c=>c.name);if(new Set(labels).size!==labels.length)dup.push(name);}if(n.width<=0||n.height<=0)zero.push(name);}
  check('Không trùng tên variant',!dup.length,dup.join(', '));
  check('Không component kích thước 0',!zero.length,zero.join(', '));
  const total=C['Table/Row']&&C['Table/Row'].children.find(c=>c.name==='State=Total');
  check('Table/Row có State=Total, vạch dưới 2px, không vạch trên',!!total&&total.strokeBottomWeight===2&&total.strokeTopWeight===0,total?'dưới '+total.strokeBottomWeight+'px / trên '+total.strokeTopWeight+'px':'không thấy variant');
  const tip=C['Toggletip/Trigger'];const vec=tip?tip.findAll(n=>n.type==='VECTOR'||n.type==='ELLIPSE').length:0;
  check('Toggletip/Trigger dựng được ⓘ từ SVG',vec>0,vec+' vector');
  const texts=page?page.findAllWithCriteria({types:['TEXT']}):[];
  const noStyle=texts.filter(t=>!t.textStyleId).length,missFont=texts.filter(t=>t.hasMissingFont).length;
  check('Mọi text dùng text style',noStyle===0,noStyle+' / '+texts.length+' text không có style');
  check('Không thiếu font',missFont===0,missFont+' text thiếu font');
  const viet=texts.filter(t=>/[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(t.characters)).length;
  log('info','Text có dấu tiếng Việt: '+viet+' — cần xem bằng mắt (plugin không kiểm được glyph).');
  if(SCREENS.length){const sp=figma.root.children.find(p=>SCREEN_PAGE_RE.test(p.name));const soKhung=SCREENS.reduce((a,sc)=>a+sc.kho.length,0);const ds=state.screens||[];
    check('Có trang màn chi tiết',!!sp,sp?sp.name:'không thấy');
    check('Đủ khung màn (mỗi khổ một khung)',ds.length===soKhung,ds.length+' / '+soKhung);
    check('Dựng đủ chữ của màn chụp',ds.every(x=>x.chuDung===x.chuChup),ds.map(x=>x.ten.split(' — ')[1]+' '+x.chuDung+'/'+x.chuChup).join(' · '));
    check('Không mục nào lỗi khi dựng màn',ds.every(x=>!x.loi),ds.map(x=>x.loi).join(' · ')+' mục lỗi');
    const sc=state.screenComps||{};check('Khối lặp là instance của component',sc.instance>0&&!sc.lech,(sc.instance||0)+' instance từ '+(sc.main||0)+' component chính, '+(sc.bo||0)+' bộ biến thể'+(sc.lech?', '+sc.lech+' lệch':''));}
  state.counts={pages:1,sections:6,variables:own.length,textStyles:styles.length,effectStyles:3,componentFamilies:Object.keys(C).filter(k=>!k.startsWith('Icon/')).length,icons:iconCount,texts:texts.length};
  state.status=state.checks.every(c=>c.ok)?'imported-structurally-checked':'imported-with-issues';
}
function reportText(status,error){
  const L=[];const ok=state.checks.filter(c=>c.ok).length;
  L.push('=== TAX OPS · BÁO CÁO IMPORT FIGMA ===');
  L.push('Kết quả: '+status+(error?' (dừng ở: '+currentPhase+')':''));
  L.push('Plugin: v'+DATA.version+' · build '+BUILT+' · chạy '+new Date().toISOString());
  L.push('File: '+(state.fileKey||'(chưa có fileKey — file chưa lưu hoặc plugin không đọc được)')+' · trang: '+LIBRARY_PAGE);
  L.push('Figma API: '+(figma.apiVersion||'?')+' · editor: '+figma.editorType);
  L.push('Font: Public Sans '+(state.font||'chưa kiểm'));
  L.push('');L.push('— Kiểm tra ('+ok+'/'+state.checks.length+' đạt)');
  for(const c of state.checks)L.push((c.ok?'[đạt] ':'[LỖI] ')+c.name+(c.detail?' — '+c.detail:''));
  if(state.phases.length){L.push('');L.push('— Giai đoạn');for(const ph of state.phases)L.push(ph.name+': '+ph.ms+' ms, '+ph.nodes+' node');}
  if(state.cleanup){const k=state.cleanup;L.push('');L.push('— Thư viện cũ: '+(k.mode==='lưu trữ'?'LƯU TRỮ (đang được dùng ở trang "'+k.usedOn+'")':'ĐÃ XÓA (không còn được dùng)'));L.push('Trang: '+k.pages.join(', '));L.push(k.collections.length+' collection · '+k.textStyles+' text style · '+k.effectStyles+' effect style · '+k.components+' component');}
  if(state.counts){L.push('');L.push('— Số lượng: '+Object.entries(state.counts).map(([k,v])=>k+' '+v).join(' · '));}
  L.push('Node đã tạo: '+state.createdNodeIds.length+(error&&state.createdNodeIds.length?' → Undo (Ctrl/Cmd+Z) một lần để hoàn tác cả lần chạy, kể cả phần đã xóa':''));
  if(state.warnings.length){L.push('');L.push('— Cảnh báo');for(const w of state.warnings)L.push('· '+w);}
  if(error){L.push('');L.push('— Lỗi');L.push(String(error.message||error));if(error.stack&&currentPhase!=='Kiểm tra trước')L.push(String(error.stack).split('\n').slice(0,6).join('\n'));}
  L.push('');L.push('— Nhật ký');for(const e of LOG)L.push('['+e.t+'s] '+e.msg);
  L.push('=== HẾT BÁO CÁO ===');
  return L.join('\n');
}
function finish(status,error){
  const text=reportText(status,error);
  const json=JSON.stringify({status,error:error?String(error.message||error):null,phase:currentPhase,built:BUILT,version:DATA.version,log:LOG,state},null,2);
  const ok=status==='THÀNH CÔNG';
  const title=ok?'Đã tạo Tax Ops Design System v'+DATA.version:status==='CẦN KIỂM TRA'?'Đã tạo, có mục cần kiểm tra':'Chưa hoàn tất — xem lỗi trong báo cáo';
  const color=ok?DATA.colors.positive:status==='CẦN KIỂM TRA'?DATA.colors.warning:DATA.colors.critical;
  const ui='<html lang="vi"><body style="margin:0;font:13px system-ui;color:'+DATA.colors.ink+';background:'+DATA.colors.surface+'"><div style="padding:16px;display:grid;gap:10px">'
    +'<strong style="font-size:15px;color:'+color+'">'+title+'</strong>'
    +'<span>Bấm <b>Chép báo cáo</b> rồi dán nguyên văn vào cuộc trò chuyện để kiểm tra.</span>'
    +'<textarea id="r" readonly style="width:100%;height:330px;box-sizing:border-box;font:12px/1.45 ui-monospace,Consolas,monospace;padding:8px;border:1px solid '+DATA.colors.line+';border-radius:6px;resize:vertical"></textarea>'
    +'<div style="display:flex;gap:8px;align-items:center"><button id="copy" style="padding:7px 12px">Chép báo cáo</button><button id="save" style="padding:7px 12px">Tải JSON</button><span id="msg" role="status"></span></div></div>'
    +'<script>let J;onmessage=function(e){var m=e.data.pluginMessage;document.getElementById("r").value=m.text;J=m.json};'
    +'document.getElementById("copy").onclick=function(){var t=document.getElementById("r");t.focus();t.select();var ok=false;try{ok=document.execCommand("copy")}catch(_){}document.getElementById("msg").textContent=ok?"Đã chép.":"Không chép tự động được — bôi đen ô trên rồi Ctrl/Cmd+C."};'
    +'document.getElementById("save").onclick=function(){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([J],{type:"application/json"}));a.download="tax-ops-figma-import-report.json";a.click()};<\/script></body></html>';
  figma.showUI(ui,{width:560,height:500});
  figma.ui.postMessage({text,json});
}
/* Dọn thư viện Tax Ops cũ trước khi dựng (23/11/2026).
   • Không bao giờ xóa (23/11/2026). Thư viện cũ luôn được lưu trữ.
   • Thư viện cũ ĐANG được dùng (instance ở trang khác trỏ vào component của nó) → LƯU TRỮ thay vì xóa:
     đổi tên trang, component, collection, style sang "Tax Ops vX (lưu trữ) / …". Instance giữ nguyên main
     component và giá trị; bản mới dựng bên cạnh, thay dần bằng instance swap. Lần chạy đầu trên file thật
     (23/11/2026) có 2.174 instance dùng v1 — xóa sẽ làm mọi màn đó mất component.
   Chỉ chạy sau khi kiểm font đạt. Toàn bộ lần chạy là một bước Undo. Tên được đọc TRƯỚC khi xóa —
   bản trước đọc p.name sau p.remove() nên lỗi "node does not exist". */
const LIBRARY_PAGE_RE=/^Tax Ops — Design System v[\d.]+$/;
async function cleanup(){
  const oldPages=figma.root.children.filter(p=>LIBRARY_PAGE_RE.test(p.name));
  const oldColls=(await figma.variables.getLocalVariableCollectionsAsync()).filter(c=>c.name.startsWith(PREFIX));
  const oldText=(await figma.getLocalTextStylesAsync()).filter(s=>s.name.startsWith(PREFIX));
  const oldFx=(await figma.getLocalEffectStylesAsync()).filter(s=>s.name.startsWith(PREFIX));
  if(!oldPages.length&&!oldColls.length&&!oldText.length&&!oldFx.length){log('info','Không có thư viện Tax Ops cũ — dựng mới.');return;}
  const pageNames=oldPages.map(p=>p.name),collNames=oldColls.map(c=>c.name);
  const ban=(pageNames[0]||'').replace('Tax Ops — Design System ','')||'cũ';
  /* Có instance nào ở trang khác trỏ vào component cũ không? Dừng ở instance đầu tiên tìm thấy. */
  const mainIds=new Set();
  for(const p of oldPages){await p.loadAsync();for(const n of p.findAllWithCriteria({types:['COMPONENT']}))mainIds.add(n.id);}
  let dangDung=null,quet=0;
  if(mainIds.size){outer:for(const p of figma.root.children){if(oldPages.includes(p))continue;await p.loadAsync();for(const it of p.findAllWithCriteria({types:['INSTANCE']})){quet++;const m=await it.getMainComponentAsync();if(m&&mainIds.has(m.id)){dangDung=p.name;break outer;}}}}
  log('info','Quét '+quet+' instance ở trang khác: '+(dangDung?'có instance dùng thư viện cũ (trang "'+dangDung+'")':'không có instance nào dùng thư viện cũ'));
  /* 23/11/2026: không bao giờ xóa. Sau sự cố file "Web Quản lý nghiệp vụ Thuế" mất component, thư viện cũ
     luôn được lưu trữ (đổi tên); người dùng tự xóa trang lưu trữ khi chắc chắn không còn dùng. */
  {
    const moi='Tax Ops '+ban+' (lưu trữ) / ';
    const doiTen=(n)=>{n.name=moi+n.name.slice(PREFIX.length);};
    let soComp=0;
    for(const p of oldPages){for(const n of p.findAllWithCriteria({types:['COMPONENT_SET','COMPONENT']}))if(n.name.startsWith(PREFIX)){doiTen(n);soComp++;}p.name=p.name+' (lưu trữ)';}
    for(const c of oldColls)doiTen(c);
    for(const s of oldText)doiTen(s);
    for(const s of oldFx)doiTen(s);
    state.cleanup={mode:'lưu trữ',pages:pageNames.map(n=>n+' → '+n+' (lưu trữ)'),collections:collNames,textStyles:oldText.length,effectStyles:oldFx.length,components:soComp,usedOn:dangDung||'(không thấy instance nào, vẫn giữ để an toàn)'};
    state.warnings.push('Thư viện '+ban+(dangDung?' đang được dùng ở trang khác (ví dụ "'+dangDung+'")':' không thấy instance nào dùng')+' — plugin LƯU TRỮ, không xóa: tên đổi sang "'+moi+'…". Các màn cũ vẫn chạy; thay dần bằng component v'+DATA.version+' rồi xóa trang lưu trữ khi không còn instance nào dùng.');
    log('info','Đã lưu trữ thư viện cũ: '+pageNames.length+' trang, '+soComp+' component, '+collNames.length+' collection, '+oldText.length+' text style, '+oldFx.length+' effect style.');
    return;
  }
}
async function run(){
  state.fileKey=figma.fileKey||null;log('info','Bắt đầu · plugin v'+DATA.version+' · build '+BUILT);
  const available=await figma.listAvailableFontsAsync();const hasFont=available.some(f=>f.fontName.family==='Public Sans');
  const axes=hasFont&&typeof figma.getFontFamilyVariationAxes==='function'?figma.getFontFamilyVariationAxes('Public Sans'):null;
  state.font=hasFont?(axes?'có, trục '+axes.join('/'):'có, không đọc được trục'):'không có';
  const pre=[check('Có font Public Sans',hasFont,hasFont?'':'cài Public Sans rồi chạy lại'),
    check('Public Sans có trục wght (giữ weight 650)',!!axes&&axes.includes('wght'),axes?axes.join('/'):'')];
  if(pre.some(x=>!x))throw new Error('Dừng ở bước kiểm tra trước. Chưa thay đổi file — thư viện cũ (nếu có) vẫn còn nguyên.');
  const weights=new Set([400,600,650,700]);for(const sc of SCREENS)for(const k of sc.kho)for(const m of k.muc)if(m.t==='chu'&&!m.mono)weights.add(Math.round(m.dam));
  for(const w of weights){FONTS[w]={family:'Public Sans',style:'Regular',variationSettings:{wght:w}};await figma.loadFontAsync(FONTS[w]);}
  log('info','Đã nạp Public Sans '+[...weights].sort((a,b)=>a-b).join('/'));
  for(const fam of ['JetBrains Mono','Roboto Mono','Source Code Pro','IBM Plex Mono','Courier New']){const f=available.find(x=>x.fontName.family===fam&&x.fontName.style==='Regular');if(f){MONO=f.fontName;await figma.loadFontAsync(MONO);break;}}
  log('info','Font mono cho mã số: '+(MONO?MONO.family:'không có — dùng Public Sans'));
  await phase('Dọn thư viện cũ',cleanup);
  check('Không còn thư viện Tax Ops nào chiếm tên của bản mới',!figma.root.children.some(p=>LIBRARY_PAGE_RE.test(p.name))&&!(await figma.variables.getLocalVariableCollectionsAsync()).some(c=>c.name.startsWith(PREFIX)),state.cleanup?(state.cleanup.mode==='lưu trữ'?'đã lưu trữ ':'đã xóa ')+state.cleanup.pages.length+' trang, '+state.cleanup.collections.length+' collection':'không có thư viện cũ');
  await phase('Foundations',foundations);await phase('Icons',icons);await phase('Controls',controls);await phase('Data',data);await phase('Feedback',feedback);await phase('Hướng dẫn',cover);await phase('Màn chi tiết',screens);
  currentPhase='Kiểm tra sau khi dựng';await audit();
  finish(state.checks.every(c=>c.ok)?'THÀNH CÔNG':'CẦN KIỂM TRA');
}
run().catch(error=>{console.error(error);log('error','Lỗi: '+String(error.message||error));figma.notify(String(error.message||error),{error:true,timeout:8000});finish('THẤT BẠI',error);});
