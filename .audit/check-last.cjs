const fs=require('fs');let s=JSON.parse(fs.readFileSync('reference-nsnn/states/28-detail-hoankiem.json','utf8'));console.log(s.buttons,s.text.slice(-500));
