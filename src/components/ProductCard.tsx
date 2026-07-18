import React from 'react';
import { Flame, Plus } from 'lucide-react';
import MagicBento from './MagicBento';
import { Product } from '../types';

interface ProductCardProps {
  item: Product;
  mode: 'mobile' | 'kiosk' | 'pos';
  cartCount: number;
  onClick: (item: Product) => void;
}

export const ProductCard = React.memo(({ item, mode, cartCount, onClick }: ProductCardProps) => {
  const isAvailable = item.isActive !== false;

  return (
    <MagicBento 
      key={item.id}
      className={`flex flex-col h-full overflow-hidden rounded-[1.75rem] border transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.15)] ${
        isAvailable 
          ? 'cursor-pointer group/card border-black/10 dark:border-white/5 bg-slate-100 dark:bg-slate-900/20 backdrop-blur-xl hover:bg-slate-900/40 hover:border-white/10' 
          : 'cursor-not-allowed border-black/10 dark:border-white/5 bg-white dark:bg-slate-950/10 opacity-60'
      }`}
      textAutoHide={true}
      enableStars={false}
      enableSpotlight={isAvailable}
      enableTilt={isAvailable}
      enableMagnetism={false}
      clickEffect={isAvailable}
      spotlightRadius={300}
      particleCount={isAvailable ? 6 : 0}
      glowColor={isAvailable ? "245, 158, 11" : "100, 116, 139"}
      disableAnimations={!isAvailable}
    >
      <div 
        className="flex flex-col h-full"
        onClick={() => {
          if (isAvailable) {
            onClick(item);
          }
        }}
      >
        <div className={`w-full overflow-hidden bg-white/60 dark:bg-slate-950/40 relative transition-all duration-500 ${mode === 'mobile' ? 'aspect-[4/3] mb-1' : 'aspect-square mb-2'}`}>
          <img 
            src={item.image} 
            alt={item.name} 
            className={`w-full h-full object-cover transition-transform duration-700 ${isAvailable ? 'group-hover/card:scale-105' : 'grayscale opacity-30'}`}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
            {item.isCustomizable && isAvailable && (
              <div className="bg-white dark:bg-slate-950/60 backdrop-blur-md text-slate-900 dark:text-white text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10">
                Customizable
              </div>
            )}
            {(item.category.toLowerCase().includes('hot') || item.name.toLowerCase().includes('hot')) && isAvailable && (
              <div className="bg-orange-500/80 backdrop-blur-md text-slate-900 dark:text-white text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 flex items-center gap-1">
                <Flame className="w-2.5 h-2.5" /> Hot
              </div>
            )}
          </div>
          
          {cartCount > 0 && isAvailable && (
            <div className={`absolute bg-amber-500 text-slate-900 dark:text-white rounded-full flex items-center justify-center font-bold border border-black/20 dark:border-white/20 shadow-lg ${mode === 'mobile' ? 'top-2 right-2 w-5 h-5 text-[9px]' : 'top-2.5 right-2.5 w-6 h-6 text-[10px]'}`}>
              {cartCount}
            </div>
          )}
          
          {!isAvailable && (
            <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.75)_0px,rgba(0,0,0,0.75)_10px,rgba(239,68,68,0.15)_10px,rgba(239,68,68,0.15)_20px)] z-10 flex flex-col items-center justify-center p-3">
              <div className="text-red-500/60 font-black text-6xl md:text-7xl pointer-events-none select-none font-sans absolute opacity-40 transform -rotate-[25deg] scale-125">
                /
              </div>
              <div className="bg-red-500/25 backdrop-blur-md border border-red-500/35 text-red-300 text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full shadow-lg z-20 animate-pulse">
                Not Available
              </div>
            </div>
          )}
          
          {isAvailable && (
            <div className="absolute bottom-2.5 right-2.5 w-8 h-8 bg-black/10 dark:bg-white/10 backdrop-blur-md border border-white/15 text-slate-900 dark:text-white rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 translate-y-1 group-hover/card:translate-y-0 transition-all duration-300 hover:bg-amber-500 hover:text-slate-900 dark:hover:text-white hover:border-amber-500 z-20">
              <Plus className="w-4 h-4" />
            </div>
          )}
        </div>
        
        <div className={`flex flex-col flex-1 px-4 pb-4 pt-1 text-left ${!isAvailable ? 'opacity-50' : ''}`}>
          <h3 className={`font-display font-bold text-slate-900 dark:text-white tracking-tight leading-tight transition-colors ${isAvailable ? 'group-hover/card:text-amber-400' : ''} ${mode === 'mobile' ? 'text-xs mb-1' : 'text-sm md:text-base mb-1.5'}`}>
            {item.name}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-[10px] md:text-xs line-clamp-2 mb-3 leading-relaxed font-normal flex-1">
            {item.description}
          </p>
          <div className="mt-auto pt-1.5 flex items-center justify-between border-t border-black/10 dark:border-white/5">
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Price</span>
              <span className={`font-display font-bold ${isAvailable ? 'text-amber-400' : 'text-slate-600 dark:text-slate-400'} ${mode === 'mobile' ? 'text-sm' : 'text-base'}`}>
                ₱{item.price.toLocaleString()}
              </span>
            </div>
            {isAvailable ? (
              <div className="w-7 h-7 rounded-xl bg-black/5 dark:bg-white/5 group-hover/card:bg-amber-500/20 group-hover/card:text-amber-400 border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors duration-300">
                <Plus className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 flex items-center justify-center text-slate-600">
                <span className="text-xs font-black">/</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </MagicBento>
  );
});

ProductCard.displayName = 'ProductCard';
