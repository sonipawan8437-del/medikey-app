import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('--- Validating Frontend Assets & Modules ---');

const modules = [
  'js/utils.js',
  'js/supabase-client.js',
  'js/auth.js',
  'js/profile.js',
  'js/records.js',
  'js/storage.js',
  'js/qr.js',
  'js/emergency.js',
  'js/script.js',
  'sw.js'
];

let allValid = true;

for (const mod of modules) {
  const filePath = path.resolve(mod);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Missing module file: ${mod}`);
    allValid = false;
    continue;
  }
  try {
    execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
    const sz = fs.statSync(filePath).size;
    console.log(`✅ Module syntax clean: ${mod} (${(sz / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.log(`❌ Syntax error in ${mod}:`, err.message);
    allValid = false;
  }
}

// Validate manifest.json
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  console.log(`✅ manifest.json valid: Name="${manifest.name}", StartURL="${manifest.start_url}", Icons=${manifest.icons?.length}`);
} catch (err) {
  console.log(`❌ manifest.json invalid:`, err.message);
  allValid = false;
}

// Validate vendor assets
const vendorFiles = [
  'assets/vendor/supabase.min.js',
  'assets/vendor/qrcode.min.js',
  'assets/vendor/html5-qrcode.min.js'
];

for (const vf of vendorFiles) {
  if (fs.existsSync(vf)) {
    const sz = fs.statSync(vf).size;
    console.log(`✅ Vendor asset verified: ${vf} (${(sz / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`❌ Missing vendor asset: ${vf}`);
    allValid = false;
  }
}

// Validate icons
const iconFiles = [
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon.svg'
];

for (const ic of iconFiles) {
  if (fs.existsSync(ic)) {
    const sz = fs.statSync(ic).size;
    console.log(`✅ Icon verified: ${ic} (${sz} bytes)`);
  } else {
    console.log(`❌ Missing icon: ${ic}`);
    allValid = false;
  }
}

if (allValid) {
  console.log('\n🎉 ALL FRONTEND ASSETS & MODULES VALIDATED SUCCESSFULLY!');
} else {
  console.log('\n⚠️ Some frontend assets failed validation.');
  process.exit(1);
}
