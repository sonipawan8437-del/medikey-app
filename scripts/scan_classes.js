import fs from 'fs';

const files = ['js/script.js', 'js/records.js', 'js/profile.js', 'js/qr.js', 'js/emergency.js', 'js/storage.js'];
const dynamicClasses = new Set();
const classListClasses = new Set();

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const classMatches = content.match(/class=['"]([^'"]+)['"]/g) || [];
  classMatches.forEach(m => {
    const cls = m.replace(/class=['"]|['"]/g, '').split(/\s+/);
    cls.forEach(c => c && dynamicClasses.add(c));
  });

  const listMatches = content.match(/classList\.(?:add|remove|toggle)\(['"]([^'"]+)['"]\)/g) || [];
  listMatches.forEach(m => {
    const mMatch = m.match(/classList\.(?:add|remove|toggle)\(['"]([^'"]+)['"]\)/);
    if (mMatch) classListClasses.add(mMatch[1]);
  });
}

console.log('Dynamic HTML classes from JS:', Array.from(dynamicClasses).sort());
console.log('classList classes from JS:', Array.from(classListClasses).sort());
