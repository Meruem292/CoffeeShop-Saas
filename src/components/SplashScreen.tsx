import React from 'react';
import { Coffee, ArrowRight, Instagram, Facebook, Twitter } from 'lucide-react';
import { SplashScreen as SplashScreenType, ShopSettings } from '../types';
import Galaxy from './Galaxy';

interface SplashScreenProps {
  data: SplashScreenType | null;
  shopSettings: ShopSettings | null;
  onStart: () => void;
}

export function SplashScreen({ data, shopSettings, onStart }: SplashScreenProps) {
  React.useEffect(() => {
    if (!data || !data.isActive) {
      onStart();
    }
  }, [data, onStart]);

  if (!data || !data.isActive) {
    return null;
  }

  const themeColor = shopSettings?.themeColor || '#4b2c20';

  return (
    <div className="fixed inset-0 z-[200] bg-[#020205] flex flex-col overflow-y-auto overflow-x-hidden font-sans">
      {/* Galaxy Background Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <Galaxy 
          mouseRepulsion
          mouseInteraction
          density={0.8}
          glowIntensity={0.6}
          saturation={0.8}
          hueShift={190}
          twinkleIntensity={0.9}
          rotationSpeed={0.05}
          repulsionStrength={9.5}
          autoCenterRepulsion={0}
          starSpeed={0.1}
          speed={0.3}
        />
      </div>

      {/* Decorative Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#5227FF]/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF9FFC]/10 rounded-full blur-[100px]" />

      {/* Header / Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-8 py-8 max-w-7xl mx-auto w-full shrink-0">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)] border border-white/20 bg-white/5 backdrop-blur-md"
          >
            {shopSettings?.logoUrl ? (
              <img src={shopSettings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <span className="text-xl md:text-2xl font-black text-white italic tracking-tighter">{shopSettings?.initials || 'CH'}</span>
            )}
          </div>
          <span className="text-2xl md:text-3xl font-black text-white font-display uppercase tracking-tighter">{shopSettings?.name || 'CoffeeHouse'}</span>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6 text-white/40">
          <Instagram className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
          <Facebook className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
          <Twitter className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 relative z-10 flex flex-col md:flex-row items-center justify-start md:justify-center px-6 md:px-8 max-w-7xl mx-auto w-full gap-12 md:gap-24 py-12 md:py-24 shrink-0">
        {/* Left Side: Image with Galaxy Frame */}
        <div 
          className="relative w-full max-w-sm md:max-w-lg aspect-square mt-4 md:mt-0 shrink-0"
        >
          {/* Main Image Container */}
          <div className="relative w-full h-full rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-white/5 backdrop-blur-md">
            <img 
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80" 
              alt="Artisanal Coffee"
              className="w-full h-full object-cover opacity-80"
            />
          </div>

          {/* Floating Accents (Stardust) */}
          <div className="absolute -top-6 -left-6 w-16 h-16 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-1/4 -right-8 w-24 h-24 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute -bottom-8 right-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px]" />
        </div>

        {/* Right Side: Typography & CTA */}
        <div className="flex-1 text-center md:text-left mb-12 md:mb-0">
          <div className="mb-8">
            <span className="text-amber-500 font-black uppercase tracking-[0.5em] text-[10px] md:text-xs mb-4 block opacity-80">
              {data.title || "Premium Coffee"}
            </span>
            <h1 className="text-6xl md:text-9xl font-black text-white font-display leading-[0.85] mb-6 md:mb-10 uppercase italic tracking-tighter">
              WE ARE <br /> 
              <span className="text-white/20 not-italic">OPEN!</span>
            </h1>
          </div>

          <p
            className="text-lg md:text-2xl text-white/50 mb-10 md:mb-14 max-w-md mx-auto md:mx-0 leading-relaxed font-bold uppercase tracking-tight"
          >
            {data.subtitle || "Experience the finest artisanal coffee crafted with passion and precision. Your daily ritual, elevated."}
          </p>

          <button
            onClick={onStart}
            className="group relative inline-flex items-center justify-center w-full md:w-auto gap-6 bg-white text-black px-10 md:px-14 py-5 md:py-7 rounded-[2rem] font-black text-xl md:text-2xl shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-[0_25px_50px_rgba(255,255,255,0.15)] transition-all active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative uppercase tracking-widest">{data.buttonText || "Order Now"}</span>
            <div className="relative w-10 h-10 bg-black rounded-full flex items-center justify-center group-hover:translate-x-3 transition-transform shrink-0">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </button>
        </div>
      </main>
      {/* Footer Decoration */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
    </div>
  );
}

