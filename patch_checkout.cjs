const fs = require('fs');
let code = fs.readFileSync('src/components/OrderingScreen.tsx', 'utf8');

code = code.replace(
  /onPlaceOrder\(\{\s*items: cart,\s*total,\s*source: mode,\s*customerName: customerName\.trim\(\) \|\| 'Guest',/g,
  `if (!customerName.trim()) {\n      alert('Please enter your name before placing the order.');\n      return;\n    }\n\n    onPlaceOrder({\n      items: cart,\n      total,\n      source: mode,\n      customerName: customerName.trim(),`
);

fs.writeFileSync('src/components/OrderingScreen.tsx', code);
console.log('Patched OrderingScreen via regex');
