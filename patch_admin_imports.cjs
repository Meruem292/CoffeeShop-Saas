const fs = require('fs');
let code = fs.readFileSync('src/components/AdminSettings.tsx', 'utf8');

const oldImports = `import { Layout, Image, Type, MousePointer2, Save, Eye, Palette, Building, MapPin, Phone, Upload, Sun, Moon, ScrollText, Receipt } from 'lucide-react';`;
const newImports = `import { Layout, Image, Type, MousePointer2, Save, Eye, Palette, Building, MapPin, Phone, Upload, Sun, Moon, ScrollText, Receipt, QrCode, Link, Trash2 } from 'lucide-react';`;

if (code.includes(oldImports)) {
  code = code.replace(oldImports, newImports);
  fs.writeFileSync('src/components/AdminSettings.tsx', code);
  console.log('AdminSettings imports patched');
} else {
  console.log('Could not find imports');
}
