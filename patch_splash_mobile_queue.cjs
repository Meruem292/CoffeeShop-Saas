const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

const oldQueueContainer = `<div className="hidden md:flex w-full lg:w-[450px] flex-col gap-6 shrink-0 h-full overflow-hidden animate-in fade-in slide-in-from-left-5 duration-1000 z-10 relative">`;
const newQueueContainer = `<div className="flex w-full lg:w-[450px] flex-col gap-4 lg:gap-6 shrink-0 lg:h-full lg:overflow-hidden animate-in fade-in slide-in-from-bottom-5 lg:slide-in-from-left-5 duration-1000 z-10 relative order-2 lg:order-1 flex-1 lg:flex-none">`;

const oldHeroContainer = `<div className="flex-1 flex items-center justify-center lg:justify-end animate-in fade-in slide-in-from-right-10 duration-1000 z-10 w-full lg:pl-12">`;
const newHeroContainer = `<div className="flex-1 flex items-center justify-center lg:justify-end animate-in fade-in slide-in-from-top-10 lg:slide-in-from-right-10 duration-1000 z-10 w-full lg:pl-12 order-1 lg:order-2 shrink-0 lg:shrink">`;

if (code.includes(oldQueueContainer)) {
  code = code.replace(oldQueueContainer, newQueueContainer);
}

if (code.includes(oldHeroContainer)) {
  code = code.replace(oldHeroContainer, newHeroContainer);
}

fs.writeFileSync('src/components/SplashScreen.tsx', code);
console.log('Mobile queue patched');
