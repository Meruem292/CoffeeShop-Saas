const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

const oldQr = `{shopSettings?.qrCodeUrl && (
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-6 justify-center sm:justify-start bg-black/10 dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-black/10 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <div className="w-24 h-24 bg-white p-2 rounded-2xl shrink-0 shadow-xl border border-black/5">
                  <img src={shopSettings.qrCodeUrl} alt="Order QR Code" className="w-full h-full object-contain" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm sm:text-base mb-1">Order from your phone</p>
                  <p className="text-amber-600 dark:text-amber-500 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">Scan QR to start mission</p>
                </div>
              </div>
            )}`;

const newQr = `            {/* QR Code Section */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-6 justify-center sm:justify-start bg-black/10 dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-black/10 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <div className="w-24 h-24 bg-white p-2 rounded-2xl shrink-0 shadow-xl border border-black/5 flex items-center justify-center">
                {shopSettings?.qrCodeUrl ? (
                  <img src={shopSettings.qrCodeUrl} alt="Order QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center flex flex-col items-center justify-center h-full w-full border-2 border-dashed border-slate-300 rounded-xl">
                     <span className="text-[8px] font-bold text-slate-400 uppercase">No QR</span>
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm sm:text-base mb-1">Order from your phone</p>
                <p className="text-amber-600 dark:text-amber-500 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">Scan QR to start mission</p>
              </div>
            </div>`;

if (code.includes(oldQr)) {
  code = code.replace(oldQr, newQr);
  console.log("QR section patched in SplashScreen");
} else {
  console.log("Could not find QR code section");
}
fs.writeFileSync('src/components/SplashScreen.tsx', code);
