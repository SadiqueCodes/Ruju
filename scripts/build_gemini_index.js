const fs = require('fs');
const path = require('path');

const dir = path.join('frames', 'gemini_perfect_slices');
const outPath = path.join('frames', 'geminiSlices.js');

const files = fs.readdirSync(dir)
  .filter((name) => name.toLowerCase().endsWith('.png'))
  .sort();

const lines = ['module.exports = ['];
files.forEach((name) => {
  lines.push(`  require('./gemini_perfect_slices/${name}'),`);
});
lines.push('];');

fs.writeFileSync(outPath, lines.join('\n') + '\n', { encoding: 'utf-8' });
console.log(`Wrote ${files.length} entries to ${outPath}`);
