const fs = require('fs');
let code = fs.readFileSync('src/components/AdminSettings.tsx', 'utf8');

const oldState = `    logoUrl: '',
    receiptName: '',`;
const newState = `    logoUrl: '',
    qrCodeUrl: '',
    receiptName: '',`;

if (code.includes(oldState)) {
  code = code.replace(oldState, newState);
}

const oldInit = `        logoUrl: shopSettings.logoUrl,
        receiptName: shopSettings.receiptName || '',`;
const newInit = `        logoUrl: shopSettings.logoUrl,
        qrCodeUrl: shopSettings.qrCodeUrl || '',
        receiptName: shopSettings.receiptName || '',`;

if (code.includes(oldInit)) {
  code = code.replace(oldInit, newInit);
}

const oldInput = `                <div className="pt-4 border-t border-black/10 dark:border-white/10">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Or Paste Image URL</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 dark:text-white/20" />
                    <input 
                      type="url" 
                      value={shopData.logoUrl || ''}
                      onChange={e => setShopData({ ...shopData, logoUrl: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl focus:border-amber-500/50 outline-none transition-all font-black text-slate-900 dark:text-white text-xs"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
              </div>`;
              
const newInput = `                <div className="pt-4 border-t border-black/10 dark:border-white/10">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Or Paste Image URL</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 dark:text-white/20" />
                    <input 
                      type="url" 
                      value={shopData.logoUrl || ''}
                      onChange={e => setShopData({ ...shopData, logoUrl: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl focus:border-amber-500/50 outline-none transition-all font-black text-slate-900 dark:text-white text-xs"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[2rem] border border-black/10 dark:border-white/10 mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-black/10 dark:bg-white/10 rounded-2xl flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Splash Screen QR Code</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Display a QR code on the order orbit screen</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center p-6 bg-white dark:bg-[#111115] border border-dashed border-black/10 dark:border-white/20 rounded-2xl cursor-pointer hover:border-amber-500/50 hover:bg-black/5 dark:hover:bg-white/5 transition-all group">
                    <Upload className="w-6 h-6 text-black/20 dark:text-white/20 group-hover:text-amber-500 group-hover:scale-110 transition-all mb-2" />
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Upload Image</span>
                    <span className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest">Max 1.5MB (PNG/JPG)</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleLogoUpload(e, 'qrCodeUrl')} 
                      className="hidden" 
                    />
                  </label>
                  
                  {shopData.qrCodeUrl && (
                    <div className="relative w-24 h-24 shrink-0 bg-white dark:bg-[#111115] rounded-2xl border border-black/10 dark:border-white/10 p-2 overflow-hidden flex items-center justify-center group">
                      <img src={shopData.qrCodeUrl} className="w-full h-full object-contain" alt="QR Code" />
                      <button 
                        type="button"
                        onClick={() => setShopData({ ...shopData, qrCodeUrl: '' })}
                        className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 mt-4 border-t border-black/10 dark:border-white/10">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Or Paste QR Image URL</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 dark:text-white/20" />
                    <input 
                      type="url" 
                      value={shopData.qrCodeUrl || ''}
                      onChange={e => setShopData({ ...shopData, qrCodeUrl: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl focus:border-amber-500/50 outline-none transition-all font-black text-slate-900 dark:text-white text-xs"
                      placeholder="https://example.com/qr.png"
                    />
                  </div>
                </div>
              </div>`;

if (code.includes(oldInput)) {
  code = code.replace(oldInput, newInput);
}

fs.writeFileSync('src/components/AdminSettings.tsx', code);
console.log('AdminSettings patched');
