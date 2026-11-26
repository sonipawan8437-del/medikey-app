import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('css/style.css', 'utf8');

// 1. Check CSS braces
let openBraces = 0;
const lines = css.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let c of line) {
    if (c === '{') openBraces++;
    if (c === '}') openBraces--;
  }
}
console.log('Current CSS unclosed braces count (should be 0):', openBraces);

// 2. Check layout containers in index.html
const classMatches = html.match(/class="([^"]+)"/g) || [];
const classes = new Set();
classMatches.forEach(m => {
  const cls = m.replace(/class="|"/g, '').split(/\s+/);
  cls.forEach(c => c && classes.add(c));
});

console.log('Total unique classes in current index.html:', classes.size);
const missingInCss = [];
classes.forEach(c => {
  const regex = new RegExp('\\.' + c.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '(?![a-zA-Z0-9_-])');
  if (!regex.test(css)) {
    missingInCss.push(c);
  }
});
console.log('Classes in index.html missing in current css/style.css:', missingInCss);
