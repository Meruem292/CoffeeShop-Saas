const fs = require('fs');
let code = fs.readFileSync('src/components/AdminSettings.tsx', 'utf8');

const oldPreview = `                    <p className="text-[9px] sm:text-[10px] text-coffee-600 leading-relaxed font-black uppercase tracking-widest">
                      {splashData.subtitle || "Your cosmic ritual, elevated."}
                    </p>
                  </main>
               </div>
            </div>`;

const newPreview = `                    <p className="text-[9px] sm:text-[10px] text-coffee-600 leading-relaxed font-black uppercase tracking-widest">
                      {splashData.subtitle || "Your cosmic ritual, elevated."}
                    </p>
                    {shopData.qrCodeUrl && (
                      <div className="mt-4 flex items-center gap-2 sm:gap-3 bg-black/10 dark:bg-white/5 p-2 rounded-xl">
                        <div className="w-10 h-10 bg-white p-1 rounded-lg shrink-0">
                          <img src={shopData.qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-left">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Order Mobile</p>
                          <p className="text-[7px] font-bold text-amber-500 uppercase tracking-widest">Scan QR</p>
                        </div>
                      </div>
                    )}
                  </main>
               </div>
            </div>`;

if (code.includes(oldPreview)) {
  code = code.replace(oldPreview, newPreview);
  console.log('Preview patched');
} else {
  console.log('Could not find Preview');
}

fs.writeFileSync('src/components/AdminSettings.tsx', code);
