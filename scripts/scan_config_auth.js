import fs from 'fs';
const c = fs.readFileSync('supabase/config.jsonc', 'utf8');
const lines = c.split('\n');
const start = lines.findIndex(l => l.includes('"auth":'));
console.log(lines.slice(start, start + 75).join('\n'));
