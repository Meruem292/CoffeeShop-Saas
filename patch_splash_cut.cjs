const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

const oldLeftCol = `<div className="flex w-full lg:w-[450px] flex-col gap-4 lg:gap-6 shrink-0 lg:h-full lg:overflow-hidden animate-in fade-in slide-in-from-bottom-5 lg:slide-in-from-left-5 duration-1000 z-10 relative order-2 lg:order-1 flex-1 lg:flex-none pointer-events-auto min-h-[600px] lg:min-h-0">`;
const newLeftCol = `<div className="flex w-full lg:w-[450px] flex-col gap-4 lg:gap-6 shrink-0 lg:h-full lg:overflow-hidden animate-in fade-in slide-in-from-bottom-5 lg:slide-in-from-left-5 duration-1000 z-10 relative order-2 lg:order-1 flex-1 lg:flex-none pointer-events-auto h-auto lg:min-h-0 mb-12 lg:mb-0">`;

if (code.includes(oldLeftCol)) {
  code = code.replace(oldLeftCol, newLeftCol);
}

const oldListsWrapper = `<div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6 flex flex-col">`;
const newListsWrapper = `<div className="flex-1 lg:overflow-y-auto pr-0 lg:pr-2 scrollbar-hide flex flex-col gap-6">`;

if (code.includes(oldListsWrapper)) {
  code = code.replace(oldListsWrapper, newListsWrapper);
}

const oldPrepBox = `<div className="relative flex flex-col bg-white/50 dark:bg-black/50 backdrop-blur-3xl rounded-[2rem] border border-amber-500/30 overflow-hidden shrink-0 flex-1 min-h-0 shadow-[0_0_30px_rgba(245,158,11,0.15)]">`;
const newPrepBox = `<div className="relative flex flex-col bg-white/50 dark:bg-black/50 backdrop-blur-3xl rounded-[2rem] border border-amber-500/30 overflow-hidden shrink-0 lg:flex-1 lg:min-h-0 shadow-[0_0_30px_rgba(245,158,11,0.15)]">`;

if (code.includes(oldPrepBox)) {
  code = code.replace(oldPrepBox, newPrepBox);
}

const oldPrepInner = `<div className="p-6 flex flex-col gap-3 overflow-y-auto scrollbar-hide flex-1">`;
const newPrepInner = `<div className="p-4 lg:p-6 flex flex-col gap-3 lg:overflow-y-auto scrollbar-hide flex-1">`;

if (code.includes(oldPrepInner)) {
  code = code.replace(oldPrepInner, newPrepInner);
}

const oldServBox = `<div className="relative flex flex-col bg-white/50 dark:bg-black/50 backdrop-blur-3xl rounded-[2rem] border border-green-500/30 overflow-hidden shrink-0 flex-1 min-h-0 shadow-[0_0_30px_rgba(34,197,94,0.15)]">`;
const newServBox = `<div className="relative flex flex-col bg-white/50 dark:bg-black/50 backdrop-blur-3xl rounded-[2rem] border border-green-500/30 overflow-hidden shrink-0 lg:flex-1 lg:min-h-0 shadow-[0_0_30px_rgba(34,197,94,0.15)]">`;

if (code.includes(oldServBox)) {
  code = code.replace(oldServBox, newServBox);
}

const oldServInner = `<div className="p-6 flex flex-col gap-3 overflow-y-auto scrollbar-hide flex-1">`;
const newServInner = `<div className="p-4 lg:p-6 flex flex-col gap-3 lg:overflow-y-auto scrollbar-hide flex-1">`;

if (code.includes(oldServInner)) {
  code = code.replace(oldServInner, newServInner);
}

fs.writeFileSync('src/components/SplashScreen.tsx', code);
console.log('Mobile layout patched');
