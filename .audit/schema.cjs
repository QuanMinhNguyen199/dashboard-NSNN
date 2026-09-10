const fs = require('fs');
const root = 'reference-nsnn';
const manifest = JSON.parse(fs.readFileSync(root + '/api/manifest.json','utf8'));
const endpoints = {};
for (const [url, entry] of Object.entries(manifest)) {
  const name = url.split('?')[0];
  if (endpoints[name]) continue;
  const data = JSON.parse(fs.readFileSync(root + '/api/' + entry.file,'utf8'));
  const shape = Array.isArray(data) ? {type:'array',length:data.length,first:data[0]} : {type:typeof data,keys:Object.keys(data),sample:Object.fromEntries(Object.entries(data).map(([key,value])=>[key,Array.isArray(value)?{length:value.length,first:value[0]}:value]))};
  endpoints[name] = {exampleURL:url,fixture:entry.file,shape};
}
fs.writeFileSync(root+'/api-shapes.json',JSON.stringify(endpoints,null,2));
console.log(Object.keys(endpoints));
for (const name of ['hanoi_126_wards','hanoi_30_districts_pre_2025']) {
 const data=JSON.parse(fs.readFileSync(root+'/data/'+name+'.geojson','utf8'));
 console.log(name,data.features.length);
}
const states=JSON.parse(fs.readFileSync(root+'/states/index.json','utf8'));
fs.writeFileSync(root+'/SCREENSHOTS.md','# Mục lục ảnh khảo sát\n\nẢnh desktop 1440×1000 trừ các ảnh có tiền tố tablet (1024×900), mobile (390×844). Hai ảnh expanded chỉ chụp viewport; các ảnh còn lại chụp full page. JSON cùng tên ghi lại text và URL.\n\n'+states.map(s=>'- ['+s.name+'](screenshots/'+s.name+'.png) — [state](states/'+s.name+'.json) — '+s.url).join('\n'));
console.log('COUNT',states.length,Object.keys(manifest).length);
console.log('PROMPT WORDS',fs.readFileSync('PROMPT-CLAUDE-NSNN.md','utf8').split(/\s+/).length);
