import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('js/script.js', 'utf8');
const profile = fs.readFileSync('js/profile.js', 'utf8');

// Find all buttons, links, and select elements in index.html
const buttonRegex = /<(button|a|select)[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/gi;
let match;
const elements = [];
while ((match = buttonRegex.exec(html)) !== null) {
  const [full, tag, id, text] = match;
  const cleanText = text.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  elements.push({ tag, id, cleanText });
}

// Also check elements with data-section, data-nav, data-quick
const dataActionRegex = /<button[^>]*data-(section|nav|quick)="([^"]+)"[^>]*>([\s\S]*?)<\/button>/gi;
while ((match = dataActionRegex.exec(html)) !== null) {
  const [full, type, val, text] = match;
  const cleanText = text.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  elements.push({ tag: 'button', attr: `data-${type}="${val}"`, cleanText });
}

console.log('Total interactive elements found:', elements.length);

for (const el of elements) {
  const identifier = el.id ? `#${el.id}` : el.attr;
  
  // Search in script.js for handler
  let handler = 'Not found';
  const lines = script.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (el.id && (l.includes(`'#${el.id}'`) || l.includes(`"#${el.id}"`) || l.includes(`.${el.id}`) || l.includes(el.id))) {
      if (l.includes('.onclick') || l.includes('addEventListener') || l.includes('.onchange')) {
        handler = `script.js:${i+1}: ${l.trim().slice(0, 90)}`;
        break;
      }
    }
  }

  console.log(`- Element: [${identifier}] "${el.cleanText}" -> Handler: ${handler}`);
}
