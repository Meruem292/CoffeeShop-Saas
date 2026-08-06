import React from 'react';
import { 
  Layout, Coffee, IceCream, CupSoda, Croissant, Utensils, Sparkles, Leaf,
  GlassWater, Wine, Cookie, Cake, Pizza, Sandwich, Gift, Tag, Flame, Heart, Package,
  LogIn, LogOut
} from 'lucide-react';
import { DynamicCategory, ShopSettings } from '../types';

interface CategorySidebarProps {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  mode: 'mobile' | 'kiosk' | 'pos';
  categoriesData?: DynamicCategory[];
  shopSettings?: ShopSettings | null;
  user?: any;
  onSignOut?: () => void;
  onSignInClick?: () => void;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Coffee,
  IceCream,
  CupSoda,
  Croissant,
  Utensils,
  Sparkles,
  Leaf,
  Layout,
  GlassWater,
  Wine,
  Cookie,
  Cake,
  Pizza,
  Sandwich,
  Gift,
  Tag,
  Flame,
  Heart,
  Package
};

const getCategoryIcon = (category: string, categoriesData?: DynamicCategory[]) => {
  const catLower = category.toLowerCase();
  if (catLower === 'all') return <Layout className="w-5 h-5 md:w-6 md:h-6" />;
  
  if (categoriesData) {
    const found = categoriesData.find(c => c.name.toLowerCase() === catLower);
    if (found && found.iconName && iconMap[found.iconName]) {
      const IconComponent = iconMap[found.iconName];
      return <IconComponent className="w-5 h-5 md:w-6 md:h-6" />;
    }
  }

  if (catLower.includes('hot') && catLower.includes('coffee')) return <Coffee className="w-5 h-5 md:w-6 md:h-6" />;
  if (catLower.includes('cold') || catLower.includes('ice') || catLower.includes('frappe')) return <IceCream className="w-5 h-5 md:w-6 md:h-6" />;
  if (catLower.includes('tea') || catLower.includes('matcha') || catLower.includes('leaf')) return <Leaf className="w-5 h-5 md:w-6 md:h-6" />;
  if (catLower.includes('food') || catLower.includes('bakery') || catLower.includes('pastry') || catLower.includes('snack') || catLower.includes('croissant') || catLower.includes('cake')) return <Croissant className="w-5 h-5 md:w-6 md:h-6" />;
  return <CupSoda className="w-5 h-5 md:w-6 md:h-6" />;
};

export const CategorySidebar = React.memo(({ 
  categories, 
  activeCategory, 
  setActiveCategory, 
  mode, 
  categoriesData, 
  shopSettings,
  user,
  onSignOut,
  onSignInClick
}: CategorySidebarProps) => {
  return (
    <div className={`flex flex-col py-6 md:py-8 h-full overflow-hidden shrink-0 z-20 transition-all ${
      mode === 'mobile' 
        ? 'w-[76px] md:w-24 bg-white dark:bg-slate-950/20 backdrop-blur-3xl border-r border-black/10 dark:border-white/5' 
        : 'w-24 md:w-28 lg:w-32 bg-white/60 dark:bg-slate-950/40 backdrop-blur-3xl border-r border-black/10 dark:border-white/5'
    }`}>
      {mode !== 'mobile' && (
        <div className="flex flex-col items-center gap-1.5 mb-6 opacity-90 animate-in fade-in slide-in-from-top-4 duration-700 w-full px-2 text-center shrink-0">
          <div className="w-12 h-12 rounded-[1.25rem] border border-black/10 dark:border-white/10 flex items-center justify-center bg-black/5 dark:bg-white/5 shadow-inner overflow-hidden">
            {shopSettings?.logoUrl ? (
              <img src={shopSettings.logoUrl || undefined} className="w-full h-full object-cover" alt="Logo" referrerPolicy="no-referrer" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <span className="text-[9px] text-amber-500 font-bold tracking-wider mt-2.5 uppercase truncate w-full px-1">
            {shopSettings?.name || 'Astro Coffee'}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-2 px-2 pb-4">
        {categories.map((cat, idx) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex flex-col items-center py-2 px-1 rounded-2xl transition-all relative group animate-in fade-in slide-in-from-left-4 duration-500 shrink-0"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {isActive && (
                <div className="absolute inset-y-2 left-0 w-1 bg-amber-500 rounded-r-full shadow-[2px_0_8px_rgba(245,158,11,0.5)]" />
              )}
              <div className={`p-3 rounded-2xl transition-all relative z-10 ${
                isActive 
                  ? 'bg-amber-500 text-slate-900 dark:text-white shadow-[0_8px_20px_rgba(245,158,11,0.35)] scale-105' 
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}>
                {getCategoryIcon(cat, categoriesData)}
              </div>
              <span className={`text-[9px] mt-2.5 font-bold leading-none relative z-10 uppercase tracking-wider text-center truncate w-full ${
                isActive ? 'text-amber-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-200'
              }`}>
                {cat.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Auth/User Section */}
      <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 flex flex-col items-center gap-2 w-full px-2 shrink-0">
        {user ? (
          <div className="flex flex-col items-center w-full gap-1 animate-in fade-in duration-300">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-500 font-black text-xs md:text-sm relative">
              <span className="uppercase">{(user.displayName || user.email || 'U')[0]}</span>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-slate-950" />
            </div>
            <span className="text-[8px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight text-center truncate max-w-full px-1">
              {user.displayName || user.email?.split('@')[0]}
            </span>
            <button
              onClick={onSignOut}
              className="mt-1 flex items-center justify-center gap-1 px-2 py-1 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all border border-rose-500/10 hover:border-transparent active:scale-95"
            >
              <LogOut className="w-2.5 h-2.5" /> Out
            </button>
          </div>
        ) : (
          <button
            onClick={onSignInClick}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all relative group w-full hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 animate-in fade-in duration-300"
          >
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm scale-100 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-slate-900 transition-all">
              <LogIn className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="text-[9px] mt-2 font-bold leading-none uppercase tracking-wider text-center text-slate-600 dark:text-slate-400 group-hover:text-slate-200">
              Sign In
            </span>
          </button>
        )}
      </div>
    </div>
  );
});

CategorySidebar.displayName = 'CategorySidebar';
