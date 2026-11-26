import fs from 'fs';

const files = ['js/records.js', 'js/storage.js', 'js/emergency.js', 'js/profile.js', 'js/qr.js', 'js/script.js', 'js/auth.js', 'js/utils.js'];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check strings inside quotes or templates that contain technical words
    const matches = line.match(/(['"`])([^'"`]*(?:database|storage|supabase|postgres|sql|cloud|backend)[^'"`]*)\1/gi) || [];
    matches.forEach(m => {
      // Exclude table names or storage bucket names in code like 'profiles', 'medikey-documents', etc.
      if (!m.includes('from(') && !m.includes('storage.from') && !m.includes('supabase.min.js') && !m.includes('import')) {
        console.log(`${file}:${idx+1}: ${m}`);
      }
    });
  });
}
