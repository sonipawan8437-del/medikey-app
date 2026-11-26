import fs from 'fs';

const files = ['index.html', 'css/style.css', 'js/script.js', 'js/auth.js', 'js/profile.js', 'js/records.js', 'js/storage.js', 'js/qr.js', 'js/emergency.js', 'js/utils.js'];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/supabase|postgresql|postgres|private storage|cloud:|demo-banner|developer/i.test(line)) {
      if (!line.includes('import ') && !line.includes('from \'') && !line.includes('from "') && 
          !line.includes('supabaseClient') && !line.includes('supabase.auth') && 
          !line.includes('supabase.from') && !line.includes('supabase.storage') && 
          !line.includes('supabase.rpc') && !line.includes('supabase.min.js')) {
        console.log(`${file}:${idx+1}: ${line.trim().slice(0, 140)}`);
      }
    }
  });
}
