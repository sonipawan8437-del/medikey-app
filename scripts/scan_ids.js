import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const idMatches = html.match(/id="([^"]+)"/g) || [];
const ids = idMatches.map(m => m.replace(/id="|"/g, '')).sort();
console.log('Total IDs in current index.html:', ids.length);
console.log('IDs list:', ids.join(', '));
