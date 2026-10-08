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
const issues = [];

files.forEach(file => {
  if (file.includes('FilePreview.tsx')) return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // If a line has text-white or text-slate-100 or text-slate-200, check if it's within a card/modal container or heading without dark:
    // Specifically look for headings h1, h2, h3, h4, h5, h6 or p or span with class containing text-white or text-slate-100 or text-slate-200
    // and NOT preceded by dark:
    if (
      /(?<![a-zA-Z0-9:_-])text-white(?![a-zA-Z0-9:_-])/.test(line) ||
      /(?<![a-zA-Z0-9:_-])text-slate-(?:100|200)(?![a-zA-Z0-9:_-])/.test(line)
    ) {
      // Check if it's on a saturated button: bg-amber-*, bg-emerald-*, bg-rose-*, bg-purple-*, bg-blue-*, bg-indigo-*, bg-black
      if (
        /bg-(?:amber|emerald|rose|purple|blue|indigo|cyan|red|green)-(?:500|600|700)/.test(line) ||
        /bg-gradient/.test(line) ||
        /dark:text-/.test(line) ||
        /isDark\s*\?/.test(line)
      ) {
        return;
      }
      issues.push({ file, line: idx + 1, text: line.trim() });
    }
  });
});

console.log(`Total potential text contrast issues: ${issues.length}`);
issues.slice(0, 30).forEach(i => console.log(`${i.file}:${i.line} -> ${i.text}`));
