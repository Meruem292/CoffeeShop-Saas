import React from 'react';
import { Flame, Plus, Eye } from 'lucide-react';
import MagicBento from './MagicBento';
import { SnowCap } from './SnowCap';
import { PumpkinCap } from './PumpkinCap';
import { Product } from '../types';

interface ProductCardProps {
  item: Product;
  mode: 'mobile' | 'kiosk' | 'pos';
  cartCount: number;
  onClick: (item: Product) => void;
  isMostPicked?: boolean;
  isFavorite?: boolean;
  isOrderingClosed?: boolean;
  activeTheme?: 'none' | 'christmas' | 'halloween';
}

export const ProductCard = React.memo(({ item, mode, cartCount, onClick, isMostPicked, isFavorite, isOrderingClosed, activeTheme }: ProductCardProps) => {
  const isAvailable = item.isActive !== false;

  if (mode === 'mobile') {
    return (
      <div 
        key={item.id}
        onClick={() => {
          if (isAvailable) {
            onClick(item);
          }
        }}
        className={`flex flex-col h-full overflow-hidden rounded-2xl border transition-all duration-150 relative select-none transform-gpu ${
          isAvailable 
            ? 'cursor-pointer active:scale-[0.96] ' + (
                (isMostPicked || isFavorite)
                  ? isFavorite 
                    ? 'border-rose-500/70 bg-rose-500/[0.04] dark:bg-rose-950/20 shadow-sm'
                    : 'border-amber-500/70 bg-amber-500/[0.04] dark:bg-amber-950/20 shadow-sm'
                  : 'border-black/10 dark:border-white/10 bg-white dark:bg-[#111726] shadow-[0_2px_8px_rgba(0,0,0,0.05)] active:bg-slate-50 dark:active:bg-[#151d30]'
              )
            : 'cursor-not-allowed border-black/5 dark:border-white/5 bg-slate-100/60 dark:bg-slate-950/40 opacity-60'
        }`}
        style={{
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          contain: 'content'
        }}
      >
        {/* Mobile Image Container */}
        <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-[#0c101b] relative overflow-hidden shrink-0">
          {/* Seasonal Theme Topper */}
          {activeTheme === 'christmas' && <SnowCap className="z-20" />}
          {activeTheme === 'halloween' && <PumpkinCap className="z-20" />}

          <img 
            src={item.image || undefined} 
            alt={item.name} 
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-transform duration-300 ${isAvailable ? 'active:scale-105' : 'grayscale opacity-30'}`}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1 z-10">
            {isOrderingClosed && isAvailable && (
              <div className="bg-amber-500/90 text-slate-950 text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                <Eye className="w-2 h-2" /> Browse
              </div>
            )}
            {item.isCustomizable && isAvailable && (
              <div className="bg-slate-900/80 text-white text-[7.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-white/10 shadow-sm">
                Custom
              </div>
            )}
            {(item.category.toLowerCase().includes('hot') || item.name.toLowerCase().includes('hot')) && isAvailable && (
              <div className="bg-orange-500/90 text-white text-[7.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                <Flame className="w-2 h-2" /> Hot
              </div>
            )}
          </div>
          
          {cartCount > 0 && isAvailable && (
            <div className="absolute top-1.5 right-1.5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-black border border-white/40 shadow-md w-5 h-5 text-[9px] z-20 animate-in zoom-in-75 duration-200">
              {cartCount}
            </div>
          )}
          
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center p-2">
              <div className="bg-red-500/80 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-md">
                Sold Out
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile Card Details */}
        <div className="flex flex-col flex-1 p-2 sm:p-2.5 text-left justify-between min-h-0">
          <div>
            {isFavorite && isAvailable ? (
              <span className="text-[8px] text-rose-500 font-extrabold uppercase tracking-wider mb-0.5 flex items-center gap-0.5 leading-none">
                ❤️ Favorite
              </span>
            ) : isMostPicked && isAvailable ? (
              <span className="text-[8px] text-amber-500 font-extrabold uppercase tracking-wider mb-0.5 flex items-center gap-0.5 leading-none">
                🔥 Popular
              </span>
            ) : null}
            <h3 className="font-display font-bold text-slate-900 dark:text-white tracking-tight leading-snug text-xs truncate">
              {item.name}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-[9.5px] line-clamp-1 leading-tight font-normal mt-0.5">
              {item.description || item.category}
            </p>
          </div>

          <div className="mt-2 pt-1.5 flex items-center justify-between border-t border-black/5 dark:border-white/5">
            <span className="font-display font-black text-amber-500 text-xs sm:text-sm leading-none">
              ₱{item.price.toLocaleString()}
            </span>
            {isAvailable ? (
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center active:bg-amber-500 active:text-slate-950 transition-colors shadow-sm">
                {isOrderingClosed ? <Eye className="w-3 h-3" /> : <Plus className="w-3 h-3 stroke-[2.5]" />}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-400 text-[10px] font-bold">
                -
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <MagicBento 
      key={item.id}
      className={`flex flex-col h-full overflow-hidden rounded-[1.75rem] border transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative ${
        (isMostPicked || isFavorite) && isAvailable
          ? `cursor-pointer group/card border-2 ${isFavorite ? 'border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.25)] bg-rose-500/5 hover:border-rose-400' : 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.35)] bg-amber-500/10 hover:border-amber-400'}`
          : isAvailable 
            ? 'cursor-pointer group/card border-black/10 dark:border-white/10 border-t-white/40 dark:border-t-white/30 bg-slate-100 dark:bg-slate-900/20 backdrop-blur-xl hover:bg-slate-900/40 hover:border-white/20' 
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
        className="flex flex-col h-full relative"
        onClick={() => {
          if (isAvailable) {
            onClick(item);
          }
        }}
      >
        <div className={`w-full overflow-hidden bg-white/60 dark:bg-slate-950/40 relative transition-all duration-500 aspect-square mb-2`}>
          {/* Seasonal Theme Topper */}
          {activeTheme === 'christmas' && <SnowCap className="z-20" />}
          {activeTheme === 'halloween' && <PumpkinCap className="z-20" />}

          <img 
            src={item.image || undefined} 
            alt={item.name} 
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-transform duration-700 ${isAvailable ? 'group-hover/card:scale-105' : 'grayscale opacity-30'}`}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
          
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
            {isOrderingClosed && isAvailable && (
              <div className="bg-amber-500/25 backdrop-blur-md text-amber-600 dark:text-amber-300 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1 shadow-sm">
                <Eye className="w-2.5 h-2.5" /> Browse Only
              </div>
            )}
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
            <div className={`absolute bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold border border-black/20 dark:border-white/20 shadow-lg top-2.5 right-2.5 w-6 h-6 text-[10px] z-20`}>
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
              {isOrderingClosed ? <Eye className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
          )}
        </div>
        
        <div className={`flex flex-col flex-1 px-4 pb-4 pt-1 text-left ${!isAvailable ? 'opacity-50' : ''}`}>
          {isFavorite && isAvailable ? (
            <span className="text-[9px] text-rose-500 dark:text-rose-400 font-extrabold uppercase tracking-widest mb-1.5 flex items-center gap-1">
              ❤️ Your Favorite
            </span>
          ) : isMostPicked && isAvailable ? (
            <span className="text-[9px] text-amber-500 dark:text-amber-400 font-extrabold uppercase tracking-widest mb-1.5 flex items-center gap-1">
              🔥 Best seller
            </span>
          ) : null}
          <h3 className={`font-display font-bold text-slate-900 dark:text-white tracking-tight leading-tight transition-colors ${isAvailable ? 'group-hover/card:text-amber-400' : ''} text-sm md:text-base mb-1.5`}>
            {item.name}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-[10px] md:text-xs line-clamp-2 mb-3 leading-relaxed font-normal flex-1">
            {item.description}
          </p>
          <div className="mt-auto pt-1.5 flex items-center justify-between border-t border-black/10 dark:border-white/5">
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Price</span>
              <span className={`font-display font-bold ${isAvailable ? 'text-amber-400' : 'text-slate-600 dark:text-slate-400'} text-base`}>
                ₱{item.price.toLocaleString()}
              </span>
            </div>
            {isAvailable ? (
              <div className="w-7 h-7 rounded-xl bg-black/5 dark:bg-white/5 group-hover/card:bg-amber-500/20 group-hover/card:text-amber-400 border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors duration-300">
                {isOrderingClosed ? <Eye className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </div>
            ) : (
              <div className="w-7 h-7 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-600">
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
