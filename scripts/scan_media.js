import fs from 'fs';

const css = fs.readFileSync('css/style.css', 'utf8');
const lines = css.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('@media')) {
    console.log(`Line ${idx+1}: ${line}`);
  }
});
