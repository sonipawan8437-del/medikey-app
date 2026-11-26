import fs from 'fs';
import { execSync } from 'child_process';

const oldHtml = execSync('git show 53219f1:index.html', { encoding: 'utf8' });
const oldCss = execSync('git show 53219f1:css/style.css', { encoding: 'utf8' });

const oldMatches = oldHtml.match(/class="([^"]+)"/g) || [];
const oldClasses = new Set();
oldMatches.forEach(m => {
  const cls = m.replace(/class="|"/g, '').split(/\s+/);
  cls.forEach(c => c && oldClasses.add(c));
});

console.log('53219f1 total unique classes in index.html:', oldClasses.size);

const missingInOldCss = [];
oldClasses.forEach(c => {
  const regex = new RegExp('\\.' + c.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '(?![a-zA-Z0-9_-])');
  if (!regex.test(oldCss)) {
    missingInOldCss.push(c);
  }
});
console.log('53219f1 classes missing in 53219f1 css:', missingInOldCss);
