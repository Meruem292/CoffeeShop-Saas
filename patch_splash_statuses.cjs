const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

const oldPreparing = `  const preparingOrders = orders.filter(o => o.status === 'preparing').sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);`;
const newPreparing = `  const preparingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing').sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);`;

if (code.includes(oldPreparing)) {
  code = code.replace(oldPreparing, newPreparing);
  fs.writeFileSync('src/components/SplashScreen.tsx', code);
  console.log('Successfully patched SplashScreen.tsx');
} else {
  console.log('Could not find old preparing status code');
}
