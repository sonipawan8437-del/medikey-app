import fs from 'fs';

const script = fs.readFileSync('js/script.js', 'utf8');
const lines = script.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('data-nav') || line.includes('switchTab') || line.includes('viewHome') || line.includes('nav-item') || line.includes('switchView')) {
    console.log(`Line ${idx+1}: ${line.trim()}`);
  }
});
