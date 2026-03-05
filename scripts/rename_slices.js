const fs = require('fs');
const path = require('path');

const dir = path.join('frames', 'gemini_perfect_slices');
const files = fs.readdirSync(dir)
  .filter((name) => name.toLowerCase().endsWith('.png'))
  .sort();

files.forEach((name, index) => {
  const oldPath = path.join(dir, name);
  const newName = `gemini_slice_${String(index + 1).padStart(3, '0')}.png`;
  const newPath = path.join(dir, newName);
  if (oldPath !== newPath) {
    fs.renameSync(oldPath, newPath);
  }
});

console.log('Renamed slices to sequential numbers.');
