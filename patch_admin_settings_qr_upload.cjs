const fs = require('fs');
let code = fs.readFileSync('src/components/AdminSettings.tsx', 'utf8');

const oldHandleAudio = `  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {`;
const newHandleAudio = `  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('QR Code image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setShopData(prev => ({ ...prev, qrCodeUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {`;

if (code.includes(oldHandleAudio)) {
  code = code.replace(oldHandleAudio, newHandleAudio);
}

const oldAudioSection = `              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Notification Audio File</label>
                  <div className="flex flex-col gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10">`;

const newAudioSection = `              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">QR Code (Order Orbit)</label>
                  <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10">
                    {shopData.qrCodeUrl ? (
                      <div className="w-16 h-16 rounded-xl bg-white p-1 overflow-hidden shrink-0 border border-black/10 dark:border-white/10 relative group">
                        <img src={shopData.qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                        <button type="button" onClick={() => setShopData({...shopData, qrCodeUrl: ''})} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-black/5 dark:bg-white/5 border-2 border-dashed border-black/10 dark:border-white/10 flex items-center justify-center shrink-0">
                        <QrCode className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <label className="flex-1 flex items-center justify-center border-2 border-dashed border-black/10 dark:border-white/10 hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 text-center group">
                      <Upload className="w-5 h-5 text-slate-500 dark:text-white/40 group-hover:text-amber-500 mr-2 transition-all" />
                      <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Upload QR</span>
                      <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Notification Audio File</label>
                  <div className="flex flex-col gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10">`;

if (code.includes(oldAudioSection)) {
  code = code.replace(oldAudioSection, newAudioSection);
}

fs.writeFileSync('src/components/AdminSettings.tsx', code);
console.log('AdminSettings patched');
