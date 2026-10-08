import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        results = results.concat(walk(full));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(full);
    }
  });
  return results;
}

const files = walk('./src');
const unPrefixed = {};

files.forEach(file => {
  if (file.includes('FilePreview.tsx')) return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const regex = /(?<![a-zA-Z0-9:_-])bg-(?:slate|gray|zinc)-(?:800|900|950)(?:\/\d+)?(?![a-zA-Z0-9:_-])/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      const start = match.index;
      const prefix = line.slice(Math.max(0, start - 25), start);
      if (/dark:$|dark:[a-z0-9_-]+:$/.test(prefix)) {
        continue;
      }
      if (!unPrefixed[file]) unPrefixed[file] = [];
      unPrefixed[file].push({ line: idx + 1, word: match[0], text: line.trim() });
    }
  });
});

for (const [file, items] of Object.entries(unPrefixed)) {
  console.log(`\n=== ${file} (${items.length}) ===`);
  items.forEach(i => console.log(`  L${i.line}: [${i.word}] ${i.text}`));
}
