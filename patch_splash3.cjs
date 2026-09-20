const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

const oldCode = `      {/* Hero Content */}
      <main className="flex-1 relative z-10 flex flex-col justify-center px-8 md:px-12 max-w-7xl mx-auto w-full py-12 lg:py-20 shrink-0">
        <div className="flex-1 flex items-center">
          {/* Glassmorphic Panel: Floating Typography & CTA */}
          <div className="w-full max-w-xl p-8 md:p-14 rounded-[3.5rem] bg-black/5 dark:bg-white/5 dark:bg-slate-900/20 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.4)] flex flex-col text-left animate-in fade-in slide-in-from-left-10 duration-1000 pointer-events-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8 bg-amber-500/60" />
                <span className="text-amber-500 font-black uppercase tracking-[0.5em] text-[10px] md:text-xs">
                  {data.title || "The Orbit Experience"}
                </span>
              </div>
              <h1 className="text-6xl md:text-7xl lg:text-[7.5rem] font-black text-slate-900 dark:text-white font-display leading-[0.8] mb-6 lg:mb-8 uppercase italic tracking-tighter">
                WE ARE <br /> 
                <span className="text-slate-600 dark:text-slate-400 dark:text-slate-600 not-italic">OPEN!</span>
              </h1>
            </div>
            <p
              className="text-lg lg:text-2xl text-slate-700 dark:text-slate-300 mb-10 lg:mb-14 leading-tight font-black uppercase tracking-tighter opacity-90"
            >
              {data.subtitle || "Elevate your daily ritual in our galactic sanctuary."}
            </p>
            <button
              onClick={onStart}
              className="group relative inline-flex items-center justify-center w-full gap-8 bg-white text-[#020617] px-10 py-5 lg:py-6 rounded-[2rem] font-black text-xl lg:text-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#020617]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative uppercase tracking-[0.2em]">{data.buttonText || "Begin Mission"}</span>
              <div className="relative w-10 h-10 bg-slate-50 dark:bg-[#020617] rounded-xl flex items-center justify-center group-hover:translate-x-3 transition-transform shrink-0 shadow-inner">
                <ArrowRight className="w-5 h-5 text-slate-900 dark:text-white" />
              </div>
            </button>
          </div>
        </div>
        {/* Queuing Status Display (Removed static grid, moved to marquee below) */}
      </main>

      {/* Queue Marquee */}
      {(preparingOrders.length > 0 || readyOrders.length > 0) && (
        <div className="absolute bottom-6 left-0 w-full overflow-hidden pointer-events-none z-20 py-2">
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused] pointer-events-auto">
            {[0, 1].map((iteration) => (
              <div key={iteration} className="flex gap-4 shrink-0 px-2">
                {preparingOrders.map(order => (
                  <div key={\`prep-\${iteration}-\${order.id}\`} className="flex items-center gap-3 bg-white/60 dark:bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-amber-500/30 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                    <ChefHat className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Preparing:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{order.customerName}</span>
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest bg-amber-500/20 px-2 py-1 rounded-full">
                      {order.id?.substring(0, 5)}
                    </span>
                  </div>
                ))}
                {readyOrders.map(order => (
                  <div key={\`ready-\${iteration}-\${order.id}\`} className="flex items-center gap-3 bg-white/60 dark:bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-green-500/30 shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                    <CheckCircle2 className="w-5 h-5 text-green-500 animate-pulse" />
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Now Serving:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{order.customerName}</span>
                    <span className="text-[10px] font-black text-green-700 dark:text-green-300 uppercase tracking-widest bg-green-500/20 px-2 py-1 rounded-full">
                      {order.id?.substring(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}`;

const newCode = `      {/* Hero Content & Queue Layout */}
      <main className="flex-1 relative z-10 flex flex-col lg:flex-row px-8 md:px-12 max-w-[1600px] mx-auto w-full py-12 lg:py-16 gap-12 shrink-0 overflow-hidden h-full">
        
        {/* Left Column: Queuing Status */}
        <div className="hidden md:flex w-full lg:w-[450px] flex-col gap-6 shrink-0 h-full overflow-hidden animate-in fade-in slide-in-from-left-5 duration-1000 z-10 relative">
          
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-3 shrink-0 bg-white/20 dark:bg-black/20 p-4 rounded-3xl backdrop-blur-xl border border-black/10 dark:border-white/10">
            <div className="w-2 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            Order Orbit
          </h2>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6 flex flex-col">
            {/* Preparing Column */}
            <div className="flex flex-col bg-black/10 dark:bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-black/10 dark:border-white/10 overflow-hidden shrink-0 flex-1 min-h-0">
              <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center gap-3 bg-black/5 dark:bg-white/5">
                <ChefHat className="w-6 h-6 text-amber-500" />
                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Preparing</span>
              </div>
              <div className="p-6 flex flex-col gap-3 overflow-y-auto scrollbar-hide flex-1">
                {preparingOrders.length > 0 ? (
                  preparingOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between bg-white/60 dark:bg-black/40 px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 shrink-0 shadow-sm">
                      <span className="font-black text-xl text-slate-900 dark:text-white tracking-tighter truncate max-w-[150px]">{order.customerName}</span>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full">
                        {order.id?.substring(0, 5)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center min-h-[100px]">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest opacity-50">No orders preparing</span>
                  </div>
                )}
              </div>
            </div>

            {/* Serving Column */}
            <div className="flex flex-col bg-black/10 dark:bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-black/10 dark:border-white/10 overflow-hidden shrink-0 flex-1 min-h-0">
              <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center gap-3 bg-black/5 dark:bg-white/5">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Now Serving</span>
              </div>
              <div className="p-6 flex flex-col gap-3 overflow-y-auto scrollbar-hide flex-1">
                {readyOrders.length > 0 ? (
                  readyOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between bg-white/60 dark:bg-black/40 px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.2)] shrink-0">
                      <span className="font-black text-xl text-slate-900 dark:text-white tracking-tighter truncate max-w-[150px]">{order.customerName}</span>
                      <span className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full">
                        {order.id?.substring(0, 5)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center min-h-[100px]">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest opacity-50">No orders serving</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Content */}
        <div className="flex-1 flex items-center justify-center lg:justify-end animate-in fade-in slide-in-from-right-10 duration-1000 z-10 w-full lg:pl-12">
          {/* Glassmorphic Panel: Floating Typography & CTA */}
          <div className="w-full max-w-xl p-8 md:p-14 rounded-[3.5rem] bg-black/5 dark:bg-white/5 dark:bg-slate-900/20 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.4)] flex flex-col text-left pointer-events-auto mt-auto mb-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8 bg-amber-500/60" />
                <span className="text-amber-500 font-black uppercase tracking-[0.5em] text-[10px] md:text-xs">
                  {data.title || "The Orbit Experience"}
                </span>
              </div>
              <h1 className="text-6xl md:text-7xl lg:text-[7.5rem] font-black text-slate-900 dark:text-white font-display leading-[0.8] mb-6 lg:mb-8 uppercase italic tracking-tighter">
                WE ARE <br /> 
                <span className="text-slate-600 dark:text-slate-400 not-italic">OPEN!</span>
              </h1>
            </div>
            <p
              className="text-lg lg:text-2xl text-slate-700 dark:text-slate-300 mb-10 lg:mb-14 leading-tight font-black uppercase tracking-tighter opacity-90"
            >
              {data.subtitle || "Elevate your daily ritual in our galactic sanctuary."}
            </p>
            <button
              onClick={onStart}
              className="group relative inline-flex items-center justify-center w-full gap-8 bg-white text-[#020617] px-10 py-5 lg:py-6 rounded-[2rem] font-black text-xl lg:text-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#020617]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative uppercase tracking-[0.2em]">{data.buttonText || "Begin Mission"}</span>
              <div className="relative w-10 h-10 bg-slate-50 dark:bg-[#020617] rounded-xl flex items-center justify-center group-hover:translate-x-3 transition-transform shrink-0 shadow-inner">
                <ArrowRight className="w-5 h-5 text-slate-900 dark:text-white" />
              </div>
            </button>
          </div>
        </div>
      </main>`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/components/SplashScreen.tsx', code);
  console.log('Successfully patched SplashScreen.tsx');
} else {
  console.log('Could not find old code in SplashScreen.tsx');
}
