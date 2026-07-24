const fs = require('fs');
let code = fs.readFileSync('src/components/AdminSettings.tsx', 'utf8');

const oldSubmit = `  const handleSplashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateSplash(splashData);
    } finally {
      setSaving(false);
    }
  };`;

const newSubmit = `  const handleSplashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateSplash(splashData);
      await onUpdateShop(shopData);
    } finally {
      setSaving(false);
    }
  };`;

if (code.includes(oldSubmit)) {
  code = code.replace(oldSubmit, newSubmit);
  console.log('handleSplashSubmit patched');
}

fs.writeFileSync('src/components/AdminSettings.tsx', code);
