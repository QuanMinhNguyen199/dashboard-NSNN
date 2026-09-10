const fs=require('fs');let s=fs.readFileSync('.audit/site.js','utf8');let i=s.indexOf('tháng đã nạp');console.log(s.slice(i-5000,i-2000));
