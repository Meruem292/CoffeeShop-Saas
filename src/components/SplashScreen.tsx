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

  const preparingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing').sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const readyOrders = orders.filter(o => o.status === 'ready').sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

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

      {/* Solid Background Overlay */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 pointer-events-none z-1" />

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

      {/* Hero Content & Queue Layout */}
      <main className="flex-1 relative z-10 flex flex-col md:flex-row px-8 md:px-12 max-w-[1600px] mx-auto w-full py-8 lg:py-12 gap-8 lg:gap-12 shrink-0 overflow-hidden h-full">
        
        {/* Left Column: Queuing Status */}
        <div className="flex w-full lg:w-[450px] flex-col gap-4 lg:gap-6 shrink-0 lg:h-full lg:overflow-hidden animate-in fade-in slide-in-from-bottom-5 lg:slide-in-from-left-5 duration-1000 z-10 relative order-2 lg:order-1 flex-1 lg:flex-none">
          
          <div className="absolute -inset-4 bg-amber-500/10 blur-3xl rounded-full z-0 pointer-events-none" />
          <h2 className="relative text-xl lg:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-3 shrink-0 bg-amber-500/20 dark:bg-amber-500/20 p-5 rounded-3xl backdrop-blur-xl border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <div className="w-2 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse" />
            Order Orbit
          </h2>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6 flex flex-col">
            {/* Preparing Column */}
            <div className="relative flex flex-col bg-white/50 dark:bg-black/50 backdrop-blur-3xl rounded-[2rem] border border-amber-500/30 overflow-hidden shrink-0 flex-1 min-h-0 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
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
            <div className="relative flex flex-col bg-white/50 dark:bg-black/50 backdrop-blur-3xl rounded-[2rem] border border-green-500/30 overflow-hidden shrink-0 flex-1 min-h-0 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
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
        <div className="flex-1 flex items-center justify-center lg:justify-end animate-in fade-in slide-in-from-top-10 lg:slide-in-from-right-10 duration-1000 z-10 w-full lg:pl-12 order-1 lg:order-2 shrink-0 lg:shrink">
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
            
            {shopSettings?.qrCodeUrl && (
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-6 justify-center sm:justify-start bg-black/10 dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-black/10 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <div className="w-24 h-24 bg-white p-2 rounded-2xl shrink-0 shadow-xl border border-black/5">
                  <img src={shopSettings.qrCodeUrl} alt="Order QR Code" className="w-full h-full object-contain" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm sm:text-base mb-1">Order from your phone</p>
                  <p className="text-amber-600 dark:text-amber-500 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">Scan QR to start mission</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white/5 to-transparent pointer-events-none z-1" />
    </div>
  );
}

