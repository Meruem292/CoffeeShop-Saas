const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const oldCode = `  notificationVolume?: number;`;
const newCode = `  notificationVolume?: number;\n  qrCodeUrl?: string;`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/types.ts', code);
  console.log('Successfully patched src/types.ts');
} else {
  console.log('Could not find old code in src/types.ts');
}
