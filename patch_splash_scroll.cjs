const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

const oldMain = `<main className="flex-1 relative z-10 flex flex-col md:flex-row px-8 md:px-12 max-w-[1600px] mx-auto w-full py-8 lg:py-12 gap-8 lg:gap-12 shrink-0 overflow-hidden h-full">`;
const newMain = `<main className="flex-1 relative z-10 flex flex-col lg:flex-row px-6 lg:px-12 max-w-[1600px] mx-auto w-full py-8 lg:py-12 gap-12 shrink-0 overflow-y-auto lg:overflow-hidden h-auto lg:h-full pointer-events-auto lg:pointer-events-none scrollbar-hide">`;

if (code.includes(oldMain)) {
  code = code.replace(oldMain, newMain);
} else {
  console.log("Could not find oldMain");
}

const oldLeftCol = `<div className="flex w-full lg:w-[450px] flex-col gap-4 lg:gap-6 shrink-0 lg:h-full lg:overflow-hidden animate-in fade-in slide-in-from-bottom-5 lg:slide-in-from-left-5 duration-1000 z-10 relative order-2 lg:order-1 flex-1 lg:flex-none">`;
const newLeftCol = `<div className="flex w-full lg:w-[450px] flex-col gap-4 lg:gap-6 shrink-0 lg:h-full lg:overflow-hidden animate-in fade-in slide-in-from-bottom-5 lg:slide-in-from-left-5 duration-1000 z-10 relative order-2 lg:order-1 flex-1 lg:flex-none pointer-events-auto min-h-[600px] lg:min-h-0">`;

if (code.includes(oldLeftCol)) {
  code = code.replace(oldLeftCol, newLeftCol);
} else {
  console.log("Could not find oldLeftCol");
}

fs.writeFileSync('src/components/SplashScreen.tsx', code);
console.log('Mobile layout patched');
