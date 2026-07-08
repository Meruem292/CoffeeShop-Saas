import React from 'react';
import { motion } from 'motion/react';
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
    <div className="fixed inset-0 z-[200] bg-[#F5EBE0] flex flex-col overflow-hidden font-sans">
      {/* Decorative Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#E3D5CA] rounded-full blur-[100px] opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D5BDAF] rounded-full blur-[80px] opacity-30" />

      {/* Header / Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shadow-xl"
            style={{ backgroundColor: themeColor }}
          >
            {shopSettings?.logoUrl ? (
              <img src={shopSettings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <span className="text-lg font-black text-white italic tracking-tighter">{shopSettings?.initials || 'CH'}</span>
            )}
          </div>
          <span className="text-2xl font-black text-coffee-950 uppercase tracking-tighter">{shopSettings?.name || 'CoffeeHouse'}</span>
        </div>
        
        <div className="flex items-center gap-4 text-coffee-700">
          <Instagram className="w-5 h-5 cursor-pointer hover:text-coffee-950 transition-colors" />
          <Facebook className="w-5 h-5 cursor-pointer hover:text-coffee-950 transition-colors" />
          <Twitter className="w-5 h-5 cursor-pointer hover:text-coffee-950 transition-colors" />
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 relative z-10 flex flex-col md:flex-row items-center justify-center px-8 max-w-7xl mx-auto w-full gap-12 pb-12">
        {/* Left Side: Image with Organic Mask */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full max-w-lg aspect-square"
        >
          {/* Organic Shape Background */}
          <div className="absolute inset-0 bg-coffee-900 rounded-[30%_70%_70%_30%_/_30%_30%_70%_70%] rotate-12 opacity-10" />
          
          {/* Main Image Container */}
          <div className="relative w-full h-full rounded-[40%_60%_70%_30%_/_40%_50%_50%_60%] overflow-hidden border-8 border-white shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80" 
              alt="Artisanal Coffee"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Floating Accents */}
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-500 rounded-full" />
          <div className="absolute top-1/4 -right-6 w-8 h-8 bg-coffee-700 rounded-full" />
          <div className="absolute -bottom-2 right-1/4 w-16 h-16 bg-[#D5BDAF] rounded-full opacity-50" />
        </motion.div>

        {/* Right Side: Typography & CTA */}
        <div className="flex-1 text-center md:text-left">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-amber-700 font-black uppercase tracking-[0.4em] text-sm mb-4 block">
              {data.title || "Premium Coffee"}
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-coffee-950 leading-[0.9] mb-8 uppercase italic tracking-tighter">
              We are <br /> 
              <span className="text-coffee-700">Open!</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-coffee-700 mb-10 max-w-md leading-relaxed font-medium"
          >
            {data.subtitle || "Experience the finest artisanal coffee crafted with passion and precision. Your daily ritual, elevated."}
          </motion.p>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="group inline-flex items-center gap-4 bg-white text-coffee-950 px-10 py-5 rounded-full font-black text-xl shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-coffee-950"
          >
            {data.buttonText || "Order Now"}
            <div className="w-8 h-8 bg-coffee-950 rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </motion.button>
        </div>
      </main>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white/30 to-transparent pointer-events-none" />
    </div>
  );
}

