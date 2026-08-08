import React from 'react';
import { Coffee, ArrowRight, Instagram, Facebook, Twitter, ChefHat, CheckCircle2, ShieldCheck, Zap, Award, Heart } from 'lucide-react';
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
}

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="flex items-start gap-4 p-4">
    <div className="w-12 h-12 rounded-full border border-[#dcd8cf] dark:border-slate-700 flex items-center justify-center text-[#2d241d] dark:text-slate-200 bg-white/50 dark:bg-slate-800/80 shrink-0">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h4 className="font-bold text-[#2d241d] dark:text-white uppercase tracking-wider text-sm">{title}</h4>
      <p className="text-[#8c857f] dark:text-slate-400 text-xs leading-relaxed">{desc}</p>
    </div>
  </div>
);

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
  
  const themeColor = shopSettings?.themeColor || '#e5a03e';

  return (
    <div className="fixed inset-0 z-[200] bg-[#f5f0e6] dark:bg-[#080d1a] flex flex-col font-sans text-[#2d241d] dark:text-slate-100 pointer-events-auto overflow-y-auto transition-colors duration-300">
      {/* 3D Model Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-90 dark:opacity-60">
        {data.useGlb ? (
          <model-viewer
            src={data.glbUrl || "/coffee_cup_with_plate.glb"}
            alt="3D Coffee Model"
            auto-rotate
            camera-controls
            ar
            style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
            camera-orbit="0deg 55deg 105%"
            shadow-intensity="2"
            exposure="1.2"
            interaction-prompt="none"
          ></model-viewer>
        ) : (
          <iframe 
            title="Cup of cappuccino" 
            className="w-full h-full"
            style={{ border: 'none' }}
            frameBorder="0" 
            allowFullScreen 
            allow="autoplay; fullscreen; xr-spatial-tracking" 
            src="https://sketchfab.com/models/04f2c34a3df94e58be97c2830e7e462a/embed?preload=1&transparent=1&autostart=1&ui_hint=0"
          ></iframe>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-12 px-6 md:px-12 max-w-[1400px] mx-auto w-full pb-12 pt-12 z-10">
        {/* Left Status */}
        <div className="w-full lg:w-[350px] space-y-8 shrink-0">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: themeColor }} />
               <h2 className="text-2xl font-black uppercase tracking-tighter text-[#2d241d] dark:text-white">Order Orbit</h2>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#8c857f] dark:text-slate-400">Real-time Order Status</p>
          </div>

          <div className="space-y-4">
            <div className="bg-[#fcfaf5] dark:bg-slate-900/80 p-6 rounded-2xl border border-[#ece9e2] dark:border-slate-800/80 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                 <ChefHat className="w-5 h-5" style={{ color: themeColor }} />
                 <span className="font-black text-sm uppercase tracking-widest text-[#2d241d] dark:text-white">Preparing</span>
               </div>
               <div className="flex flex-col gap-2">
                 {preparingOrders.length > 0 ? (
                   preparingOrders.map(order => (
                     <div key={order.id} className="flex items-center justify-between bg-white/80 dark:bg-slate-800/80 px-4 py-2.5 rounded-xl border border-black/5 dark:border-slate-700/60 shadow-sm">
                       <span className="font-black text-sm text-[#2d241d] dark:text-white tracking-tighter truncate max-w-[140px]">{order.customerName}</span>
                       <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full" style={{ color: themeColor, backgroundColor: `${themeColor}20` }}>
                         #{order.id?.substring(0, 5)}
                       </span>
                     </div>
                   ))
                 ) : (
                   <div className="text-xs text-[#b8a08d] dark:text-slate-500 text-center py-4 font-medium">No orders preparing</div>
                 )}
               </div>
            </div>
            <div className="bg-[#fcfaf5] dark:bg-slate-900/80 p-6 rounded-2xl border border-[#ece9e2] dark:border-slate-800/80 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                 <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                 <span className="font-black text-sm uppercase tracking-widest text-[#2d241d] dark:text-white">Now Serving</span>
               </div>
               <div className="flex flex-col gap-2">
                 {readyOrders.length > 0 ? (
                   readyOrders.map(order => (
                     <div key={order.id} className="flex items-center justify-between bg-white/80 dark:bg-slate-800/80 px-4 py-2.5 rounded-xl border border-black/5 dark:border-slate-700/60 animate-pulse shadow-sm">
                       <span className="font-black text-sm text-[#2d241d] dark:text-white tracking-tighter truncate max-w-[140px]">{order.customerName}</span>
                       <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                         #{order.id?.substring(0, 5)}
                       </span>
                     </div>
                   ))
                 ) : (
                   <div className="text-xs text-[#b8a08d] dark:text-slate-500 text-center py-4 font-medium">No orders serving</div>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* Right Open Card */}
        <div className="flex-1 relative">
           <div className="relative rounded-[2.5rem] overflow-hidden border border-white/50 dark:border-slate-700/60 shadow-2xl min-h-[500px] flex flex-col bg-white/30 dark:bg-slate-900/50 backdrop-blur-md">
             
             <div className="relative z-10 p-8 md:p-12 flex flex-col justify-between h-full flex-1">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#2d241d]/70 dark:text-slate-300">— Premium Coffee Experience</p>
                <div className="space-y-4 my-6">
                  <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-[#1a1a1a] dark:text-white">WE ARE <br/> OPEN!</h1>
                  <p className="text-base md:text-lg font-bold text-[#2d241d]/80 dark:text-slate-300 max-w-sm">Experience the finest coffee, crafted with passion and precision.</p>
                </div>
                
                <div className="bg-white/80 dark:bg-slate-900/90 border border-white/30 dark:border-slate-800/80 backdrop-blur-md p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between shadow-lg gap-6">
                   <button onClick={onStart} className="px-8 py-4 text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 w-full md:w-auto justify-center shadow-md hover:brightness-110 active:scale-95 transition-all" style={{ backgroundColor: themeColor }}>
                     Start Ordering <ArrowRight className="w-4 h-4"/>
                   </button>
                   <div className="flex items-center gap-4">
                      {shopSettings?.qrCodeUrl ? (
                          <img src={shopSettings.qrCodeUrl} alt="QR Code" className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-contain bg-white dark:bg-slate-800 p-1 border border-black/5 dark:border-slate-700" />
                      ) : (
                          <div className="w-24 h-24 md:w-28 md:h-28 bg-[#2d241d] dark:bg-slate-800 rounded-xl flex items-center justify-center p-2 text-center text-[10px] font-bold text-amber-500 uppercase">
                             Scan QR
                          </div>
                      )}
                      <div>
                        <div className="text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-1" style={{ backgroundColor: themeColor }}>Instant Ordering</div>
                        <p className="font-black uppercase tracking-widest text-sm text-[#2d241d] dark:text-white">Order from your phone</p>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: themeColor }}>Scan QR Code to start mission</p>
                      </div>
                   </div>
                </div>
             </div>
           </div>
        </div>
      </main>

      {/* Footer Features */}
      <footer className="bg-white/50 dark:bg-slate-900/70 border-t border-[#dcd8cf] dark:border-slate-800/80 px-6 md:px-12 py-8 mt-auto z-10 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard icon={Coffee} title="Premium Quality" desc="Finest beans, expertly roasted for perfection." />
          <FeatureCard icon={Zap} title="Fast & Fresh" desc="Quick service with uncompromised quality." />
          <FeatureCard icon={Award} title="Loyalty Rewards" desc="Earn points and enjoy exclusive benefits." />
          <FeatureCard icon={Heart} title="Made with Love" desc="Every cup is crafted with passion." />
        </div>
      </footer>
    </div>
  );
}

