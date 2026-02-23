const fs = require('fs');
let text = fs.readFileSync('ayahs_formatted.json', 'utf8');
if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
const rows = JSON.parse(text);
const empty = rows.filter(r => !String(r.translation || '').trim());
const pat1 = /_[^_\n]{15,}_/;
const pat2 = /[\"“][^\"”\n]{15,}[\"”]/;
const hits = empty.filter(r => pat1.test(String(r.tafseer || '')) || pat2.test(String(r.tafseer || '')));
console.log('rows', rows.length, 'empty', empty.length, 'recoverable', hits.length);
for (const r of hits.slice(0,80)) {
  console.log(`${r.surah_number}:${r.ayah_number} pid:${r.source_post_id}`);
}
