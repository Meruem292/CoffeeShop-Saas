import React from 'react';
import { Coffee, ArrowRight, Instagram, Facebook, Twitter } from 'lucide-react';
import { SplashScreen as SplashScreenType, ShopSettings } from '../types';

interface SplashScreenProps {
  data: SplashScreenType | null;
  shopSettings: ShopSettings | null;
  onStart: () => void;
}

export function SplashScreen({ data, shopSettings, onStart }: SplashScreenProps) {
  if (!data || !data.isActive) {
    onStart();
    return null;
  }

  const themeColor = shopSettings?.themeColor || '#4b2c20';

  return (
    <div className="fixed inset-0 z-[200] bg-[#F5EBE0] flex flex-col overflow-y-auto overflow-x-hidden font-sans">
      {/* Decorative Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#E3D5CA] rounded-full blur-[100px] opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D5BDAF] rounded-full blur-[80px] opacity-30" />

      {/* Header / Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-8 py-6 max-w-7xl mx-auto w-full shrink-0">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center overflow-hidden shadow-xl"
            style={{ backgroundColor: themeColor }}
          >
            {shopSettings?.logoUrl ? (
              <img src={shopSettings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <span className="text-base md:text-lg font-black text-white italic tracking-tighter">{shopSettings?.initials || 'CH'}</span>
            )}
          </div>
          <span className="text-xl md:text-2xl font-black text-coffee-950 uppercase tracking-tighter">{shopSettings?.name || 'CoffeeHouse'}</span>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4 text-coffee-700">
          <Instagram className="w-5 h-5 cursor-pointer hover:text-coffee-950 transition-colors" />
          <Facebook className="w-5 h-5 cursor-pointer hover:text-coffee-950 transition-colors" />
          <Twitter className="w-5 h-5 cursor-pointer hover:text-coffee-950 transition-colors" />
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 relative z-10 flex flex-col md:flex-row items-center justify-start md:justify-center px-6 md:px-8 max-w-7xl mx-auto w-full gap-8 md:gap-12 py-8 md:py-12 shrink-0">
        {/* Left Side: Image with Organic Mask */}
        <div 
          className="relative w-full max-w-sm md:max-w-lg aspect-square mt-4 md:mt-0 shrink-0"
        >
          {/* Organic Shape Background */}
          <div className="absolute inset-0 bg-coffee-900 rounded-[30%_70%_70%_30%_/_30%_30%_70%_70%] rotate-12 opacity-10" />
          
          {/* Main Image Container */}
          <div className="relative w-full h-full rounded-[40%_60%_70%_30%_/_40%_50%_50%_60%] overflow-hidden border-[6px] md:border-8 border-white shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80" 
              alt="Artisanal Coffee"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Floating Accents */}
          <div className="absolute -top-4 -left-4 w-10 h-10 md:w-12 md:h-12 bg-amber-500 rounded-full" />
          <div className="absolute top-1/4 -right-4 md:-right-6 w-6 h-6 md:w-8 md:h-8 bg-coffee-700 rounded-full" />
          <div className="absolute -bottom-2 right-1/4 w-12 h-12 md:w-16 md:h-16 bg-[#D5BDAF] rounded-full opacity-50" />
        </div>

        {/* Right Side: Typography & CTA */}
        <div className="flex-1 text-center md:text-left mb-8 md:mb-0">
          <div>
            <span className="text-amber-700 font-black uppercase tracking-[0.4em] text-xs md:text-sm mb-3 md:mb-4 block">
              {data.title || "Premium Coffee"}
            </span>
            <h1 className="text-5xl md:text-8xl font-black text-coffee-950 leading-[0.9] mb-4 md:mb-8 uppercase italic tracking-tighter">
              We are <br /> 
              <span className="text-coffee-700">Open!</span>
            </h1>
          </div>

          <p
            className="text-base md:text-xl text-coffee-700 mb-6 md:mb-10 max-w-md mx-auto md:mx-0 leading-relaxed font-medium"
          >
            {data.subtitle || "Experience the finest artisanal coffee crafted with passion and precision. Your daily ritual, elevated."}
          </p>

          <button
            onClick={onStart}
            className="group inline-flex items-center justify-center w-full md:w-auto gap-4 bg-white text-coffee-950 px-8 md:px-10 py-4 md:py-5 rounded-full font-black text-lg md:text-xl shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-coffee-950"
          >
            {data.buttonText || "Order Now"}
            <div className="w-8 h-8 bg-coffee-950 rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform shrink-0">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      </main>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white/30 to-transparent pointer-events-none" />
    </div>
  );
}

