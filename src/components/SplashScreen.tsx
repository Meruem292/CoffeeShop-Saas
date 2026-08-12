import React from 'react';
import { Coffee, ArrowRight, ChefHat, CheckCircle2, Clock, Lock, Zap, Sparkles, Orbit } from 'lucide-react';
import { SplashScreen as SplashScreenType, ShopSettings, Order } from '../types';

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
  isKioskModeActive?: boolean;
  onExitKiosk?: () => void;
}

export function SplashScreen({ data, shopSettings, orders, onStart, isKioskModeActive, onExitKiosk }: SplashScreenProps) {
  const [hasModelError, setHasModelError] = React.useState(false);

  React.useEffect(() => {
    if (!data || !data.isActive) {
      onStart();
    }
  }, [data, onStart]);

  React.useEffect(() => {
    setHasModelError(false);
  }, [data?.glbUrl, data?.useGlb]);

  if (!data || !data.isActive) {
    return null;
  }

  const preparingOrders = orders
    .filter(o => o.status === 'pending' || o.status === 'preparing')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const readyOrders = orders
    .filter(o => o.status === 'ready')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const qrUrl = shopSettings?.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin)}`;

  return (
    <div className="fixed inset-0 z-[200] bg-[#090D16] flex flex-col font-sans text-white pointer-events-auto overflow-y-auto">
      {/* Header Bar */}
      <header className="px-6 py-4 md:px-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#090D16]/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          {shopSettings?.logoUrl ? (
            <img 
              src={shopSettings.logoUrl} 
              alt={shopSettings.name || 'Shop Logo'} 
              className="w-10 h-10 rounded-2xl object-cover border border-amber-500/30 shadow-lg shadow-amber-500/20 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-lg shadow-orange-500/20 shrink-0">
              {shopSettings?.initials || shopSettings?.name?.substring(0, 2).toUpperCase() || <Orbit className="w-6 h-6 text-slate-950" />}
            </div>
          )}
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
              {shopSettings?.name || 'CAIDOZ'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.25em] uppercase">
              {shopSettings?.tagline || 'REAL-TIME ORDER STATUS'}
            </p>
          </div>
        </div>

        {(isKioskModeActive || onExitKiosk) && (
          <button 
            type="button"
            onClick={onExitKiosk}
            className="border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-full px-5 py-2 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-500/10"
          >
            <Lock className="w-4 h-4 text-amber-500" />
            EXIT KIOSK
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6 z-10">
        {/* Left Column (3 Status Cards) */}
        <div className="w-full lg:w-[360px] xl:w-[380px] flex flex-col gap-4 shrink-0">
          
          {/* Card 1: PREPARING */}
          <div className="bg-[#101522] border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
                <ChefHat className="w-5 h-5" />
              </div>
              <span className="font-black text-sm uppercase tracking-widest text-white">PREPARING</span>
            </div>
            <div className="flex flex-col gap-2 min-h-[50px]">
              {preparingOrders.length > 0 ? (
                preparingOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between bg-[#161D2E] px-4 py-2.5 rounded-2xl border border-white/5 shadow-sm">
                    <span className="font-black text-sm text-white tracking-tight truncate max-w-[150px]">
                      {order.customerName}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                      #{order.id?.substring(0, 6).toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 font-bold text-center py-4">No orders preparing</div>
              )}
            </div>
          </div>

          {/* Card 2: NOW SERVING */}
          <div className="bg-[#101522] border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="font-black text-sm uppercase tracking-widest text-white">NOW SERVING</span>
            </div>
            <div className="flex flex-col gap-2 min-h-[50px]">
              {readyOrders.length > 0 ? (
                readyOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between bg-[#161D2E] px-4 py-2.5 rounded-2xl border border-white/5 shadow-sm animate-pulse">
                    <span className="font-black text-sm text-white tracking-tight truncate max-w-[150px]">
                      {order.customerName}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                      #{order.id?.substring(0, 6).toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 font-bold text-center py-4">No orders serving</div>
              )}
            </div>
          </div>

          {/* Card 3: FAST. FRESH. FOR YOU. */}
          <div className="bg-[#101522] border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col gap-3 mt-auto">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
                <Clock className="w-5 h-5" />
              </div>
              <span className="font-black text-xs md:text-sm uppercase tracking-widest text-white">FAST. FRESH. FOR YOU.</span>
            </div>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              We craft every cup with precision and care.
            </p>
            <button 
              type="button"
              onClick={onStart}
              className="w-full mt-1 py-3 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Coffee className="w-4 h-4 text-amber-500" />
              Need help? Ask our team!
            </button>
          </div>

        </div>

        {/* Right Hero Container */}
        <div className="flex-1 bg-[#101522] border border-white/10 rounded-[2.5rem] p-6 lg:p-10 flex flex-col justify-between relative overflow-hidden shadow-2xl min-h-[550px]">
          
          {/* 3D Model / Coffee Visual Overlay on Right */}
          <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 pointer-events-none opacity-40 lg:opacity-100 flex items-center justify-center z-0 overflow-hidden">
            {data?.useGlb && !hasModelError ? (
              <model-viewer
                ref={(el: HTMLElement | null) => {
                  if (el) {
                    const errorHandler = () => setHasModelError(true);
                    el.addEventListener('error', errorHandler);
                    el.addEventListener('error-load', errorHandler);
                  }
                }}
                src={data.glbUrl && !data.glbUrl.startsWith('blob:') ? data.glbUrl : "/coffee_cup_with_plate.glb"}
                alt="3D Coffee Model"
                auto-rotate
                camera-controls
                ar
                style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                camera-orbit="0deg 60deg 100%"
                shadow-intensity="2"
                exposure="1.2"
                interaction-prompt="none"
              ></model-viewer>
            ) : (
              <iframe 
                title="Cup of cappuccino" 
                className="w-full h-full scale-125 translate-x-12 pointer-events-none"
                style={{ border: 'none' }}
                frameBorder="0" 
                allowFullScreen 
                allow="autoplay; fullscreen; xr-spatial-tracking" 
                src="https://sketchfab.com/models/04f2c34a3df94e58be97c2830e7e462a/embed?preload=1&transparent=1&autostart=1&ui_hint=0"
              ></iframe>
            )}
          </div>

          {/* Top Hero Text */}
          <div className="relative z-10 max-w-xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-3 flex items-center gap-2">
              <span className="w-6 h-0.5 bg-amber-500 rounded-full inline-block" /> PREMIUM COFFEE EXPERIENCE
            </p>
            
            <div className="space-y-1 mb-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter text-white leading-none">
                WE ARE
              </h1>
              <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter leading-none ${
                shopSettings?.isClosed ? 'text-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,0.4)]' : 'text-amber-500'
              }`}>
                {shopSettings?.isClosed ? 'CLOSED' : 'OPEN!'}
              </h1>
            </div>

            <div className="flex items-center gap-3 my-4 text-amber-500/40">
              <div className="h-px bg-amber-500/20 flex-1 max-w-[80px]" />
              <Coffee className="w-4 h-4 text-amber-500" />
              <div className="h-px bg-amber-500/20 flex-1 max-w-[80px]" />
            </div>

            <p className="text-sm sm:text-base font-bold text-slate-300 max-w-sm leading-relaxed mb-6">
              {shopSettings?.isClosed 
                ? 'We are currently not taking new orders. Please check back soon or visit our counter!' 
                : 'Experience the finest coffee, crafted with passion and precision.'}
            </p>
          </div>

          {/* Bottom Action Card & Features */}
          <div className="relative z-10 mt-auto space-y-6">
            
            {/* Main Action Box */}
            <div className="bg-[#161D2E]/90 border border-white/10 backdrop-blur-xl p-5 lg:p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 justify-between shadow-2xl">
              
              {/* Left Button */}
              <div className="w-full md:w-1/2 flex flex-col gap-2">
                {shopSettings?.isClosed ? (
                  <div className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-black text-sm uppercase tracking-widest px-6 py-4 rounded-2xl flex items-center justify-between shadow-lg">
                    <span className="flex items-center gap-3">
                      <Coffee className="w-6 h-6 text-rose-500" />
                      STORE IS CLOSED
                    </span>
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-md text-[10px]">PAUSED</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onStart}
                    className="w-full bg-gradient-to-r from-orange-600 via-amber-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-slate-950 font-black text-base lg:text-lg uppercase tracking-widest px-6 py-4 rounded-2xl flex items-center justify-between shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all group"
                  >
                    <span className="flex items-center gap-3">
                      <Coffee className="w-6 h-6 text-slate-950" />
                      START ORDERING
                    </span>
                    <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
                <p className="text-[11px] font-bold text-slate-400 text-center md:text-left px-1">
                  {shopSettings?.isClosed 
                    ? 'Orders are disabled while the shop is closed.' 
                    : "Place your order and we'll get it ready for you."}
                </p>
              </div>

              <div className="hidden md:block w-px h-16 bg-white/10" />

              {/* Right Phone QR */}
              <div className="w-full md:w-1/2 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-widest inline-block">
                      INSTANT ORDERING
                    </span>
                  </div>
                  <h3 className="text-sm lg:text-base font-black uppercase tracking-tight text-white truncate">
                    ORDER FROM YOUR PHONE
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Scan QR code to start mission
                  </p>
                </div>

                <div className="bg-white p-2 rounded-2xl border border-white/20 shadow-md shrink-0 flex items-center justify-center">
                  <img 
                    src={qrUrl} 
                    alt="Scan to order" 
                    className="w-20 h-20 object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

            </div>

            {/* Feature Icons Footer Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-white">PREMIUM QUALITY</h4>
                  <p className="text-[10px] font-bold text-slate-400">Top-quality beans</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-white">CRAFTED WITH CARE</h4>
                  <p className="text-[10px] font-bold text-slate-400">Made by passionate baristas</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-white">FAST & RELIABLE</h4>
                  <p className="text-[10px] font-bold text-slate-400">Quick service, every time</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
