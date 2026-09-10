const fs=require('fs');for(const n of ['dac-ta-v2','update_dac-ta-89_tham-khaor']){const s=fs.readFileSync(n+'.html','utf8');console.log(n,s.match(/<img\b[^>]*>/g));}
