const fs=require('fs');
let text=fs.readFileSync('ayahs_formatted.json','utf8');
if(text.charCodeAt(0)===0xFEFF) text=text.slice(1);
const rows=JSON.parse(text);
function clean(v){
  return String(v||'')
    .replace(/\r\n/g,'\n').replace(/\r/g,'\n')
    .replace(/[\u200B-\u200D\uFEFF]/g,'')
    .replace(/[*_`~]/g,'')
    .replace(/[ \t]{2,}/g,' ')
    .trim();
}
function derive(r){
  const direct=clean(r.translation);
  if(direct) return direct;
  const t=String(r.tafseer||'');
  let m=t.match(/[\"“]([^\"\n”]{15,})[\"”]/);
  if(m&&clean(m[1])) return clean(m[1]);
  m=t.match(/_([^_\n]{15,})_/);
  if(m&&clean(m[1])) return clean(m[1]);
  return '';
}
const withTrans=rows.filter(r=>derive(r)).length;
console.log('rows',rows.length,'visible translation',withTrans,'missing',rows.length-withTrans);
