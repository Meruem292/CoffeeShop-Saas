import React from 'react';
import { 
  Layout, Coffee, IceCream, CupSoda, Croissant, Utensils, Sparkles, Leaf,
  GlassWater, Wine, Cookie, Cake, Pizza, Sandwich, Gift, Tag, Flame, Heart, Package
} from 'lucide-react';
import { DynamicCategory } from '../types';

interface CategorySidebarProps {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  mode: 'mobile' | 'kiosk' | 'pos';
  categoriesData?: DynamicCategory[];
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

export const CategorySidebar = React.memo(({ categories, activeCategory, setActiveCategory, mode, categoriesData }: CategorySidebarProps) => {
  return (
    <div className={`flex flex-col py-6 md:py-8 overflow-y-auto scrollbar-hide shrink-0 z-20 transition-all ${mode === 'mobile' ? 'w-[76px] md:w-24 bg-slate-950/20 backdrop-blur-3xl border-r border-white/5 gap-4' : 'w-24 md:w-28 lg:w-32 bg-slate-950/40 backdrop-blur-3xl border-r border-white/5 gap-6 md:gap-7'}`}>
      {mode !== 'mobile' && (
        <div className="flex flex-col items-center gap-1.5 mb-6 opacity-90 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-12 h-12 rounded-[1.25rem] border border-white/10 flex items-center justify-center bg-white/5 shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[9px] text-amber-500 font-bold tracking-[0.3em] mt-2.5 uppercase">Astro</span>
        </div>
      )}

      <div className="flex flex-col gap-2 px-2">
        {categories.map((cat, idx) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex flex-col items-center py-2 px-1 rounded-2xl transition-all relative group animate-in fade-in slide-in-from-left-4 duration-500"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {isActive && (
                <div className="absolute inset-y-2 left-0 w-1 bg-amber-500 rounded-r-full shadow-[2px_0_8px_rgba(245,158,11,0.5)]" />
              )}
              <div className={`p-3 rounded-2xl transition-all relative z-10 ${
                isActive 
                  ? 'bg-amber-500 text-white shadow-[0_8px_20px_rgba(245,158,11,0.35)] scale-105' 
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
                {getCategoryIcon(cat, categoriesData)}
              </div>
              <span className={`text-[9px] mt-2.5 font-bold leading-none relative z-10 uppercase tracking-wider text-center ${
                isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
              }`}>
                {cat.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

CategorySidebar.displayName = 'CategorySidebar';
