import React from 'react';
import { Coffee, ArrowRight, Instagram, Facebook, Twitter, ChefHat, CheckCircle2 } from 'lucide-react';
import { SplashScreen as SplashScreenType, ShopSettings, Order } from '../types';
import ShapeGrid from './ShapeGrid';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

interface SplashScreenProps {
  data: SplashScreenType | null;
  shopSettings: ShopSettings | null;
  orders: Order[];
  onStart: () => void;
}

export function SplashScreen({ data, shopSettings, orders, onStart }: SplashScreenProps) {
  React.useEffect(() => {
    if (!data || !data.isActive) {
      onStart();
    }
  }, [data, onStart]);

  if (!data || !data.isActive) {
    return null;
  }

  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  const themeColor = shopSettings?.themeColor || '#4b2c20';

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-[#020617] flex flex-col overflow-hidden font-sans text-slate-900 dark:text-white pointer-events-none">
      {/* 3D Model Background Container - Positioned on the right for desktop */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[55%] h-full z-0 pointer-events-auto flex items-center justify-center overflow-hidden">
        {data.useGlb ? (
          <model-viewer
            src={data.glbUrl || "/coffee_cup_with_plate.glb"}
            alt="3D Coffee Model"
            auto-rotate
            camera-controls
            ar
            style={{ 
              width: '100%', 
              height: '100%', 
              backgroundColor: 'transparent',
              transform: 'perspective(1200px) rotateX(15deg) rotateY(-5deg) scale(1.12)',
              transformOrigin: 'center center'
            }}
            camera-orbit="0deg 55deg 105%"
            shadow-intensity="2"
            exposure="1.2"
            interaction-prompt="none"
          ></model-viewer>
        ) : (
          <iframe 
            title="Cup of cappuccino" 
            className="w-full h-full"
            style={{ 
              transform: 'perspective(1200px) rotateX(22deg) rotateY(-4deg) scale(1.28)', 
              transformOrigin: 'center center',
              border: 'none'
            }}
            frameBorder="0" 
            allowFullScreen 
            allow="autoplay; fullscreen; xr-spatial-tracking" 
            src="https://sketchfab.com/models/04f2c34a3df94e58be97c2830e7e462a/embed?preload=1&transparent=1&autostart=1&ui_hint=0"
          ></iframe>
        )}
      </div>

      {/* Decorative Background Overlay / Vignette to ensure contrast (strong on left, fades to right on desktop) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/90 lg:via-[#020617]/40 to-[#020617]/10 lg:to-transparent pointer-events-none z-1" />

      {/* Header / Nav */}
      <header className="relative z-20 flex items-center justify-between px-8 md:px-12 py-10 max-w-7xl mx-auto w-full shrink-0 pointer-events-auto">
        <div className="flex items-center gap-5 group cursor-pointer">
          <div 
            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl border border-slate-200/20 bg-white p-0.5 transition-transform group-hover:scale-110 duration-500"
          >
            {shopSettings?.logoUrl ? (
              <img src={shopSettings.logoUrl || undefined} className="w-full h-full object-cover rounded-xl" alt="Logo" />
            ) : (
              <span className="text-xl md:text-2xl font-black text-[#020617] italic tracking-tighter">{shopSettings?.initials || 'CH'}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-display uppercase tracking-tighter leading-none mb-1">{shopSettings?.name || 'Astro Coffee'}</span>
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] leading-none opacity-60">Sequence Initiated</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6 md:gap-8 text-slate-600 dark:text-slate-400">
          <Instagram className="w-5 h-5 cursor-pointer hover:text-amber-500 hover:scale-110 transition-all" />
          <Facebook className="w-5 h-5 cursor-pointer hover:text-amber-500 hover:scale-110 transition-all" />
          <Twitter className="w-5 h-5 cursor-pointer hover:text-amber-500 hover:scale-110 transition-all" />
        </div>
      </header>

      {/* Hero Content */}
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

        {/* Queuing Status */}
        <div className="mt-8 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-500 pointer-events-auto">
          <div className="flex items-center gap-3 bg-black/10 dark:bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-black/10 dark:border-white/10">
            <ChefHat className="w-5 h-5 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Preparing</span>
              <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{preparingCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-black/10 dark:bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-black/10 dark:border-white/10">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Serving</span>
              <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{readyCount}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white/5 to-transparent pointer-events-none z-1" />
    </div>
  );
}

