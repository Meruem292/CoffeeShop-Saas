const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

const oldCode = `        {/* Queuing Status Display */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-500 pointer-events-auto">
          {/* Preparing Column */}
          <div className="flex flex-col bg-black/10 dark:bg-white/10 backdrop-blur-xl rounded-[2rem] border border-black/10 dark:border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center gap-3 bg-black/5 dark:bg-white/5">
              <ChefHat className="w-6 h-6 text-amber-500" />
              <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Preparing</span>
            </div>
            <div className="p-6 flex flex-col gap-3 min-h-[120px]">
              {preparingOrders.length > 0 ? (
                preparingOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between bg-white/40 dark:bg-black/20 px-4 py-3 rounded-xl border border-black/5 dark:border-white/5">
                    <span className="font-black text-xl text-slate-900 dark:text-white tracking-tighter truncate max-w-[150px]">{order.customerName}</span>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full">
                      {order.id?.substring(0, 5)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest opacity-50">No orders preparing</span>
                </div>
              )}
            </div>
          </div>

          {/* Serving Column */}
          <div className="flex flex-col bg-black/10 dark:bg-white/10 backdrop-blur-xl rounded-[2rem] border border-black/10 dark:border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center gap-3 bg-black/5 dark:bg-white/5">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Now Serving</span>
            </div>
            <div className="p-6 flex flex-col gap-3 min-h-[120px]">
              {readyOrders.length > 0 ? (
                readyOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between bg-white/40 dark:bg-black/20 px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                    <span className="font-black text-xl text-slate-900 dark:text-white tracking-tighter truncate max-w-[150px]">{order.customerName}</span>
                    <span className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full">
                      {order.id?.substring(0, 5)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest opacity-50">No orders serving</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>`;

const newCode = `        {/* Queuing Status Display (Removed static grid, moved to marquee below) */}
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

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/components/SplashScreen.tsx', code);
  console.log('Successfully patched SplashScreen.tsx');
} else {
  console.log('Could not find old code in SplashScreen.tsx');
}
