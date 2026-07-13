import React, { useState, useEffect } from 'react';
import { SplashScreen, ShopSettings } from '../types';
import { Layout, Image, Type, MousePointer2, Save, Eye, Palette, Building } from 'lucide-react';

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
    isActive: true
  });

  const [shopData, setShopData] = useState<Partial<ShopSettings>>({
    name: '',
    initials: '',
    logoUrl: '',
    themeColor: '#4b2c20'
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (splashScreen) {
      setSplashData({
        title: splashScreen.title,
        subtitle: splashScreen.subtitle,
        imageUrl: splashScreen.imageUrl,
        buttonText: splashScreen.buttonText,
        isActive: splashScreen.isActive
      });
    }
  }, [splashScreen]);

  useEffect(() => {
    if (shopSettings) {
      setShopData({
        name: shopSettings.name,
        initials: shopSettings.initials,
        logoUrl: shopSettings.logoUrl,
        themeColor: shopSettings.themeColor
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
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-coffee-950 flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4">
          <Building className="w-8 h-8 md:w-10 md:h-10 text-amber-600 shrink-0" />
          <span className="leading-tight">Shop Console</span>
        </h2>
        <p className="text-coffee-600 mt-2 font-medium">Configure your SAAS brand identity and display presence.</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-coffee-200">
        <button 
          onClick={() => setActiveTab('shop')}
          className={`pb-4 px-6 font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'shop' ? 'text-amber-600 border-b-4 border-amber-600' : 'text-coffee-400 hover:text-coffee-600'}`}
        >
          Brand Identity
        </button>
        <button 
          onClick={() => setActiveTab('splash')}
          className={`pb-4 px-6 font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'splash' ? 'text-amber-600 border-b-4 border-amber-600' : 'text-coffee-400 hover:text-coffee-600'}`}
        >
          Splash Screen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form Area */}
        <div className="space-y-8">
          {activeTab === 'shop' ? (
            <form onSubmit={handleShopSubmit} className="space-y-6 bg-white p-8 rounded-[2.5rem] border-2 border-coffee-100 shadow-xl">
              <div>
                <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-3">Shop Name</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-coffee-300" />
                  <input 
                    type="text" 
                    value={shopData.name}
                    onChange={e => setShopData({ ...shopData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-coffee-50 border-2 border-transparent rounded-2xl focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-coffee-900"
                    placeholder="e.g. Artisanal Roasters"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-3">Initials</label>
                  <input 
                    type="text" 
                    maxLength={3}
                    value={shopData.initials}
                    onChange={e => setShopData({ ...shopData, initials: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-4 bg-coffee-50 border-2 border-transparent rounded-2xl focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-coffee-900 text-center"
                    placeholder="CH"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-3">Theme Color</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={shopData.themeColor}
                      onChange={e => setShopData({ ...shopData, themeColor: e.target.value })}
                      className="w-14 h-14 bg-transparent border-none cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={shopData.themeColor}
                      onChange={e => setShopData({ ...shopData, themeColor: e.target.value })}
                      className="flex-1 px-4 py-4 bg-coffee-50 border-2 border-transparent rounded-2xl focus:border-amber-500 focus:bg-white outline-none transition-all font-mono font-bold text-coffee-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-3">Logo URL</label>
                <div className="relative">
                  <Image className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-coffee-300" />
                  <input 
                    type="text" 
                    value={shopData.logoUrl}
                    onChange={e => setShopData({ ...shopData, logoUrl: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-coffee-50 border-2 border-transparent rounded-2xl focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-coffee-900"
                    placeholder="https://...logo.png"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-amber-500 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Save className="w-6 h-6" />
                {saving ? 'UPDATING...' : 'SAVE BRAND'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSplashSubmit} className="space-y-6 bg-white p-8 rounded-[2.5rem] border-2 border-coffee-100 shadow-xl">
              <div>
                <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-3">Hero Title</label>
                <input 
                  type="text" 
                  value={splashData.title}
                  onChange={e => setSplashData({ ...splashData, title: e.target.value })}
                  className="w-full px-6 py-4 bg-coffee-50 border-2 border-transparent rounded-2xl focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-coffee-900"
                  placeholder="e.g. We are Open!"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-3">Tagline</label>
                <textarea 
                  value={splashData.subtitle}
                  onChange={e => setSplashData({ ...splashData, subtitle: e.target.value })}
                  className="w-full px-6 py-4 bg-coffee-50 border-2 border-transparent rounded-2xl focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-coffee-900 h-24"
                  placeholder="Experience the finest artisanal coffee..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-3">Button CTA</label>
                  <input 
                    type="text" 
                    value={splashData.buttonText}
                    onChange={e => setSplashData({ ...splashData, buttonText: e.target.value })}
                    className="w-full px-6 py-4 bg-coffee-50 border-2 border-transparent rounded-2xl focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-coffee-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-3">Status</label>
                  <button
                    type="button"
                    onClick={() => setSplashData({ ...splashData, isActive: !splashData.isActive })}
                    className={`w-full py-4 rounded-2xl font-black transition-all border-2 ${
                      splashData.isActive 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    {splashData.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full py-5 bg-coffee-900 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-coffee-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Save className="w-6 h-6" />
                {saving ? 'UPDATING...' : 'SAVE DISPLAY'}
              </button>
            </form>
          )}
        </div>

        {/* Live Preview Area */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-coffee-500 uppercase tracking-[0.3em] flex items-center gap-3">
            <Eye className="w-4 h-4" /> Live System Preview
          </h3>
          
          {activeTab === 'shop' ? (
            <div className="bg-coffee-50 rounded-[3rem] p-12 flex flex-col items-center justify-center border-4 border-dashed border-coffee-200 aspect-square">
               <div 
                className="w-48 h-48 rounded-full flex items-center justify-center shadow-2xl mb-8 relative overflow-hidden group"
                style={{ backgroundColor: shopData.themeColor || '#4b2c20' }}
               >
                 {shopData.logoUrl ? (
                   <img src={shopData.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                 ) : (
                   <span className="text-7xl font-black text-white italic tracking-tighter">{shopData.initials || 'CH'}</span>
                 )}
               </div>
               <h4 className="text-4xl font-black text-coffee-950 text-center leading-tight mb-2">
                 {shopData.name || 'CoffeeHouse OS'}
               </h4>
               <p className="text-coffee-500 font-bold uppercase tracking-widest">Brand Mark Preview</p>
            </div>
          ) : (
            <div className="relative aspect-[9/16] w-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-coffee-100">
               <div className="absolute inset-0 bg-[#F5EBE0]" />
               <div className="relative h-full flex flex-col p-8">
                  <header className="flex justify-between items-center mb-12">
                     <div className="w-8 h-8 rounded-full" style={{ backgroundColor: shopData.themeColor }} />
                     <div className="flex gap-2">
                        <div className="w-4 h-4 rounded-full bg-coffee-200" />
                        <div className="w-4 h-4 rounded-full bg-coffee-200" />
                     </div>
                  </header>

                  <main className="flex-1 flex flex-col justify-center">
                    <div className="aspect-square w-full rounded-[2rem] overflow-hidden border-4 border-white shadow-xl mb-8">
                      <img 
                        src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80" 
                        alt="Hero"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-amber-700 font-black uppercase tracking-[0.3em] text-[10px] mb-2">
                      {splashData.title || "Premium Coffee"}
                    </span>
                    <h1 className="text-4xl font-black text-coffee-950 leading-none mb-4 uppercase italic tracking-tighter">
                      We are <br /> 
                      <span className="text-coffee-700">Open!</span>
                    </h1>
                    <p className="text-xs text-coffee-700 leading-relaxed font-bold opacity-80">
                      {splashData.subtitle || "Your daily ritual, elevated."}
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
