const fs = require('fs');
const content = fs.readFileSync('src/components/OrderingScreen.tsx', 'utf-8');
const lines = content.split('\n');

let balance = 0;
let inCart = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('const renderCart = () => (')) {
    inCart = true;
  }
  
  if (inCart) {
    const openDivs = (line.match(/<div/g) || []).length;
    const closeDivs = (line.match(/<\/div>/g) || []).length;
    balance += openDivs - closeDivs;
    console.log(`${i + 1}: bal=${balance} | ${line}`);
    
    if (balance === 0 && line.includes(');')) {
      break;
    }
    // we just want to see up to line 1020
    if (i > 1020) break;
  }
}
