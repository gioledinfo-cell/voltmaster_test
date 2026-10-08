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
const byFile = {};

files.forEach(file => {
  if (file.includes('FilePreview.tsx')) return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (
      /(?<![a-zA-Z0-9:_-])text-white(?![a-zA-Z0-9:_-])/.test(line) ||
      /(?<![a-zA-Z0-9:_-])text-slate-(?:100|200)(?![a-zA-Z0-9:_-])/.test(line)
    ) {
      if (
        /bg-(?:amber|emerald|rose|purple|blue|indigo|cyan|red|green)-(?:500|600|700)/.test(line) ||
        /bg-gradient/.test(line) ||
        /dark:text-/.test(line) ||
        /isDark\s*\?/.test(line)
      ) {
        return;
      }
      if (!byFile[file]) byFile[file] = [];
      byFile[file].push({ line: idx + 1, text: line.trim() });
    }
  });
});

for (const [file, items] of Object.entries(byFile)) {
  console.log(`\n=== ${file} (${items.length}) ===`);
  items.forEach(i => console.log(`  L${i.line}: ${i.text}`));
}
