import React, { useState, useEffect } from 'react';
import { SplashScreen, ShopSettings } from '../types';
import { Layout, Image, Type, MousePointer2, Save, Eye, Palette, Building, MapPin, Phone } from 'lucide-react';

interface AdminSettingsProps {
  splashScreen: SplashScreen | null;
  shopSettings: ShopSettings | null;
  onUpdateSplash: (updates: Partial<SplashScreen>) => Promise<void>;
  onUpdateShop: (updates: Partial<ShopSettings>) => Promise<void>;
}

export function AdminSettings({ splashScreen, shopSettings, onUpdateSplash, onUpdateShop }: AdminSettingsProps) {
  const [activeTab, setActiveTab] = useState<'shop' | 'splash'>('shop');
  
  const [splashData, setSplashData] = useState<Partial<SplashScreen>>({
    title: '',
    subtitle: '',
    imageUrl: '',
    buttonText: '',
    isActive: true,
    useGlb: true,
    glbUrl: '/coffee_cup_with_plate.glb'
  });

  const [shopData, setShopData] = useState<Partial<ShopSettings>>({
    name: '',
    initials: '',
    logoUrl: '',
    themeColor: '#4b2c20',
    gridColumns: 4,
    mobileGridColumns: 2,
    address: '',
    phone: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (splashScreen) {
      setSplashData({
        title: splashScreen.title,
        subtitle: splashScreen.subtitle,
        imageUrl: splashScreen.imageUrl,
        buttonText: splashScreen.buttonText,
        isActive: splashScreen.isActive,
        useGlb: splashScreen.useGlb !== undefined ? splashScreen.useGlb : true,
        glbUrl: splashScreen.glbUrl || '/coffee_cup_with_plate.glb'
      });
    }
  }, [splashScreen]);

  useEffect(() => {
    if (shopSettings) {
      setShopData({
        name: shopSettings.name,
        initials: shopSettings.initials,
        logoUrl: shopSettings.logoUrl,
        themeColor: shopSettings.themeColor,
        gridColumns: shopSettings.gridColumns || 4,
        mobileGridColumns: shopSettings.mobileGridColumns || 2,
        address: shopSettings.address || '',
        phone: shopSettings.phone || ''
      });
    }
  }, [shopSettings]);

  const handleSplashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateSplash(splashData);
    } finally {
      setSaving(false);
    }
  };

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateShop(shopData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-6 md:p-8 lg:p-12 overflow-y-auto">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 md:mb-12">
        <div>
          <div className="flex items-center gap-4 mb-3 md:mb-4">
            <div className="px-3 py-1 bg-white/5 text-amber-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-white/10">
              Control Panel
            </div>
            <div className="h-[1px] flex-1 lg:w-48 bg-white/5" />
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase italic tracking-tighter leading-[0.85] flex flex-wrap items-baseline gap-x-3 sm:gap-x-4">
            System <span className="text-white/20 not-italic font-medium text-2xl sm:text-4xl md:text-5xl lg:text-6xl">Settings</span>
          </h1>
          <div className="flex items-center gap-3 mt-4 sm:mt-6">
            <div className="h-1.5 w-12 sm:w-16 bg-amber-600 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.5)] shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold text-white/30 uppercase tracking-widest leading-relaxed">
              Configure your brand identity and display presence.
            </span>
          </div>
        </div>
      </header>

      <div className="flex bg-white/5 backdrop-blur-md rounded-2xl p-1.5 shadow-sm border border-white/10 overflow-x-auto scrollbar-hide max-w-full shrink-0 mb-8 md:mb-12 w-fit">
        <button 
          onClick={() => setActiveTab('shop')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-all shrink-0 ${activeTab === 'shop' ? 'text-white bg-amber-600 shadow-[0_10px_20px_rgba(245,158,11,0.3)]' : 'text-white/40 hover:text-white'}`}
        >
          Brand Identity
        </button>
        <button 
          onClick={() => setActiveTab('splash')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-all shrink-0 ${activeTab === 'splash' ? 'text-white bg-amber-600 shadow-[0_10px_20px_rgba(245,158,11,0.3)]' : 'text-white/40 hover:text-white'}`}
        >
          Splash Screen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        {/* Form Area */}
        <div className="space-y-8">
          {activeTab === 'shop' ? (
            <form onSubmit={handleShopSubmit} className="space-y-6 bg-white/5 backdrop-blur-xl p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div>
                <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Shop & Receipt Name</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                  <input 
                    type="text" 
                    value={shopData.name}
                    onChange={e => setShopData({ ...shopData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none transition-all font-black text-white text-sm"
                    placeholder="e.g. Astro Coffee"
                  />
                </div>
                <p className="text-[9px] text-white/40 mt-2 ml-1 uppercase tracking-wider font-bold">This controls the branding throughout the application and on printed invoices/receipts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Initials</label>
                  <input 
                    type="text" 
                    maxLength={3}
                    value={shopData.initials}
                    onChange={e => setShopData({ ...shopData, initials: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none transition-all font-black text-white text-center text-sm"
                    placeholder="AC"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Theme Color</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={shopData.themeColor}
                      onChange={e => setShopData({ ...shopData, themeColor: e.target.value })}
                      className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl cursor-pointer overflow-hidden p-0 shrink-0"
                    />
                    <input 
                      type="text" 
                      value={shopData.themeColor}
                      onChange={e => setShopData({ ...shopData, themeColor: e.target.value })}
                      className="flex-1 min-w-0 px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none transition-all font-mono font-black text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Desktop Columns</label>
                  <select 
                    value={shopData.gridColumns}
                    onChange={e => setShopData({ ...shopData, gridColumns: parseInt(e.target.value) })}
                    className="w-full px-4 py-4 bg-[#111115] border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none transition-all font-black text-white text-sm cursor-pointer"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num} className="bg-slate-900 text-white">{num} Columns</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Mobile Columns</label>
                  <select 
                    value={shopData.mobileGridColumns}
                    onChange={e => setShopData({ ...shopData, mobileGridColumns: parseInt(e.target.value) })}
                    className="w-full px-4 py-4 bg-[#111115] border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none transition-all font-black text-white text-sm cursor-pointer"
                  >
                    {[1, 2, 3, 4].map(num => (
                      <option key={num} value={num} className="bg-slate-900 text-white">{num} Columns</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Logo Uplink (URL)</label>
                <div className="relative">
                  <Image className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                  <input 
                    type="text" 
                    value={shopData.logoUrl}
                    onChange={e => setShopData({ ...shopData, logoUrl: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none transition-all font-black text-white text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Receipt Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="text" 
                      value={shopData.address || ''}
                      onChange={e => setShopData({ ...shopData, address: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none transition-all font-black text-white text-sm"
                      placeholder="e.g. 123 Nebula Boulevard, Spaceport"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Receipt Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="text" 
                      value={shopData.phone || ''}
                      onChange={e => setShopData({ ...shopData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none transition-all font-black text-white text-sm"
                      placeholder="e.g. +63 900 123 4567"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white/90 transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'UPDATING...' : 'SAVE CHANGES'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSplashSubmit} className="space-y-6 bg-white/5 backdrop-blur-xl p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div>
                <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Terminal Title</label>
                <input 
                  type="text" 
                  value={splashData.title}
                  onChange={e => setSplashData({ ...splashData, title: e.target.value })}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none transition-all font-black text-white text-sm"
                  placeholder="e.g. Galaxy Terminal"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Subtitle</label>
                <textarea 
                  value={splashData.subtitle}
                  onChange={e => setSplashData({ ...splashData, subtitle: e.target.value })}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none transition-all font-black text-white text-sm h-24 resize-none"
                  placeholder="The finest orbital roast..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Hero Asset Mode</label>
                  <button
                    type="button"
                    onClick={() => setSplashData({ ...splashData, useGlb: !splashData.useGlb })}
                    className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                      splashData.useGlb 
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 font-black' 
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-400 font-black'
                    }`}
                  >
                    {splashData.useGlb ? '3D GLB MODEL' : 'SKETCHFAB EMBED'}
                  </button>
                </div>
                {splashData.useGlb && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">3D Model File Path</label>
                    <input 
                      type="text" 
                      value={splashData.glbUrl}
                      onChange={e => setSplashData({ ...splashData, glbUrl: e.target.value })}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none transition-all font-black text-white text-sm"
                      placeholder="e.g. /coffee.glb"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">Action CTA</label>
                  <input 
                    type="text" 
                    value={splashData.buttonText}
                    onChange={e => setSplashData({ ...splashData, buttonText: e.target.value })}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none transition-all font-black text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] mb-3 ml-1">State</label>
                  <button
                    type="button"
                    onClick={() => setSplashData({ ...splashData, isActive: !splashData.isActive })}
                    className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                      splashData.isActive 
                        ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    {splashData.isActive ? 'ACTIVE' : 'OFFLINE'}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white/90 transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'UPDATING...' : 'SAVE DISPLAY'}
              </button>
            </form>
          )}
        </div>

        {/* Live Preview Area */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] flex items-center gap-3">
            <Eye className="w-4 h-4" /> System Vision
          </h3>
          
          {activeTab === 'shop' ? (
            <div className="bg-[#020205] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 flex flex-col items-center justify-center border-2 border-white/5 aspect-square shadow-2xl relative overflow-hidden max-w-md mx-auto lg:max-w-none">
               <div className="absolute inset-0 opacity-20">
                 <div className="absolute top-0 -left-20 w-64 h-64 bg-purple-600 rounded-full blur-[100px]" />
                 <div className="absolute bottom-0 -right-20 w-64 h-64 bg-amber-600 rounded-full blur-[100px]" />
               </div>
               <div 
                className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 sm:mb-8 relative overflow-hidden group border border-white/10 z-10 bg-white/5"
                style={{ backgroundColor: shopData.themeColor || '#4b2c20' }}
               >
                 {shopData.logoUrl ? (
                   <img src={shopData.logoUrl} className="w-full h-full object-cover" alt="Logo" referrerPolicy="no-referrer" />
                 ) : (
                   <span className="text-5xl sm:text-7xl font-black text-white italic tracking-tighter">{shopData.initials || 'CH'}</span>
                 )}
               </div>
               <h4 className="text-2xl sm:text-3xl font-black text-white text-center leading-tight mb-2 uppercase italic tracking-tighter">
                 {shopData.name || 'Astro Coffee'}
               </h4>
               <p className="text-[9px] sm:text-[10px] text-coffee-600 font-black uppercase tracking-[0.2em]">Signature Mark Preview</p>
            </div>
          ) : (
            <div className="relative aspect-[9/16] w-full max-w-sm mx-auto rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl border-4 sm:border-8 border-black/80 bg-[#020205]">
               <div className="absolute inset-0 bg-[#020205]" />
               <div className="absolute top-0 -left-20 w-64 h-64 bg-purple-900/20 rounded-full blur-[100px]" />
               <div className="absolute bottom-0 -right-20 w-64 h-64 bg-amber-900/20 rounded-full blur-[100px]" />
               <div className="relative h-full flex flex-col p-6 sm:p-8">
                  <header className="flex justify-between items-center mb-8 sm:mb-12">
                     <div className="w-8 h-8 rounded-xl border border-white/10" style={{ backgroundColor: shopData.themeColor }} />
                     <div className="flex gap-2">
                        <div className="w-4 h-4 rounded-full bg-white/10" />
                        <div className="w-4 h-4 rounded-full bg-white/10" />
                     </div>
                  </header>

                  <main className="flex-1 flex flex-col justify-center">
                    <div className="aspect-square w-full rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-2xl mb-6 sm:mb-8">
                      <img 
                        src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80" 
                        alt="Hero"
                        className="w-full h-full object-cover opacity-60"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-amber-500 font-black uppercase tracking-[0.4em] text-[8px] mb-3 opacity-50">
                      {splashData.title || "Premium Coffee"}
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4 uppercase italic tracking-tighter">
                      Galaxy <br /> 
                      <span className="text-white/40">Launch.</span>
                    </h1>
                    <p className="text-[9px] sm:text-[10px] text-coffee-600 leading-relaxed font-black uppercase tracking-widest">
                      {splashData.subtitle || "Your cosmic ritual, elevated."}
                    </p>
                  </main>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
