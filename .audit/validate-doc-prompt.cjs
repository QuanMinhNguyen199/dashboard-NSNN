const fs=require('fs'),path=require('path'),crypto=require('crypto');
const files=['PROMPT-CLAUDE-NSNN.md','reference-nsnn/DOI-CHIEU-DAC-TA-V2.md','reference-nsnn/README.md'];
for(const f of files){const s=fs.readFileSync(f,'utf8');console.log(f, s.split('\n').length,'lines',s.length,'chars');if(s.includes('dac-ta-v2.md'))throw new Error('Stale filename '+f);}
const originals=['dac-ta-v2.html','update_dac-ta-89_tham-khaor.html','index.html','phan-tich.md'];
for(const f of originals){if(!fs.readFileSync(f).equals(fs.readFileSync('reference-nsnn/documents/'+f)))throw new Error('Copy differs '+f);}
const p=fs.readFileSync('PROMPT-CLAUDE-NSNN.md','utf8');for(const x of ['## 0.','## 11.','## 12.','21 khoản','tỷ đồng','SPEC-GAPS.md','DATA-MAPPING.md'])if(!p.includes(x))throw new Error('Missing '+x);
console.log('Verified prompt additions and unchanged source copies.');
