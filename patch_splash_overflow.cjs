const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

const oldMain = `<main className="flex-1 relative z-10 flex flex-col lg:flex-row px-6 lg:px-12 max-w-[1600px] mx-auto w-full py-8 lg:py-12 gap-12 shrink-0 overflow-y-auto lg:overflow-hidden h-auto lg:h-full pointer-events-auto lg:pointer-events-none scrollbar-hide">`;
const newMain = `<main className="flex-1 relative z-10 flex flex-col lg:flex-row px-6 lg:px-12 max-w-[1600px] mx-auto w-full py-8 lg:py-12 gap-12 overflow-y-auto lg:overflow-hidden min-h-0 pointer-events-auto lg:pointer-events-none scrollbar-hide">`;

if (code.includes(oldMain)) {
  code = code.replace(oldMain, newMain);
} else {
  console.log("Could not find oldMain");
}

fs.writeFileSync('src/components/SplashScreen.tsx', code);
console.log('Main patched');
