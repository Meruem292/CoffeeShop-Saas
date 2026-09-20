const fs = require('fs');
let code = fs.readFileSync('src/lib/useFirebase.ts', 'utf8');

const oldCode = `    if (!userUid) {
       setOrders([]);
       setLoading(false);
       return () => {
         unsubSettings();
         unsubSplash();
         unsubProducts();
         unsubAddons();
         unsubCategories();
       };
    }`;

const newCode = `    // Removed early return so public clients can listen to orders for the TV queue`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/lib/useFirebase.ts', code);
  console.log('useFirebase patched: Removed early return!');
} else {
  console.log('Could not find early return in useFirebase');
}
