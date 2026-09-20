const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

// 1. Remove the gradient
const gradientRegex = /\{\/\* Decorative Background Overlay .*?\*\/\}[\s\S]*?<div className="absolute inset-0 bg-gradient-to-r.*? \/>/;
if (gradientRegex.test(code)) {
  code = code.replace(gradientRegex, `{/* Solid Background Overlay */}\n      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 pointer-events-none z-1" />`);
}

// 2. Highlight queuing column
const oldQueueHeading = `<h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-3 shrink-0 bg-white/20 dark:bg-black/20 p-4 rounded-3xl backdrop-blur-xl border border-black/10 dark:border-white/10">
            <div className="w-2 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            Order Orbit
          </h2>`;

const newQueueHeading = `<div className="absolute -inset-4 bg-amber-500/10 blur-3xl rounded-full z-0 pointer-events-none" />
          <h2 className="relative text-xl lg:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-3 shrink-0 bg-amber-500/20 dark:bg-amber-500/20 p-5 rounded-3xl backdrop-blur-xl border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <div className="w-2 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse" />
            Order Orbit
          </h2>`;

if (code.includes(oldQueueHeading)) {
  code = code.replace(oldQueueHeading, newQueueHeading);
}

const oldPreparing = `<div className="flex flex-col bg-black/10 dark:bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-black/10 dark:border-white/10 overflow-hidden shrink-0 flex-1 min-h-0">`;
const newPreparing = `<div className="relative flex flex-col bg-white/50 dark:bg-black/50 backdrop-blur-3xl rounded-[2rem] border border-amber-500/30 overflow-hidden shrink-0 flex-1 min-h-0 shadow-[0_0_30px_rgba(245,158,11,0.15)]">`;

if (code.includes(oldPreparing)) {
  code = code.replace(oldPreparing, newPreparing);
}

const oldServing = `<div className="flex flex-col bg-black/10 dark:bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-black/10 dark:border-white/10 overflow-hidden shrink-0 flex-1 min-h-0">`;
const newServing = `<div className="relative flex flex-col bg-white/50 dark:bg-black/50 backdrop-blur-3xl rounded-[2rem] border border-green-500/30 overflow-hidden shrink-0 flex-1 min-h-0 shadow-[0_0_30px_rgba(34,197,94,0.15)]">`;

if (code.includes(oldServing)) {
  code = code.replace(oldServing, newServing);
}

fs.writeFileSync('src/components/SplashScreen.tsx', code);
console.log('Patched');
