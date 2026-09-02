import React, { useState, useMemo, useEffect } from 'react';
import { 
  FlaskConical, Sparkles, Plus, Minus, RotateCcw, ShoppingBag, 
  Layers, Check, AlertCircle, Info, ChevronRight, X, ArrowLeft,
  Droplets, Flame, Snowflake, ShieldCheck, Tag
} from 'lucide-react';
import { 
  YourMixIngredient, YourMixBasePreset, YourMixCupSize, 
  YourMixIngredientCategory, CartItem, YourMixRecipeItem, YourMixDrinkDetails 
} from '../types';
import { DEFAULT_CUP_SIZES } from '../data/yourMixDefaults';
import { useToast } from '../lib/ToastContext';

interface YourMixStudioProps {
  ingredients: YourMixIngredient[];
  bases: YourMixBasePreset[];
  cupSizes?: YourMixCupSize[];
  onAddToCart: (item: CartItem) => void;
  onClose?: () => void;
  mode?: 'mobile' | 'kiosk' | 'pos';
}

const CATEGORIES: { key: YourMixIngredientCategory | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'All Lab Elements', icon: '🧪' },
  { key: 'base_liquid', label: 'Coffee & Tea', icon: '☕' },
  { key: 'dairy_milk', label: 'Milks & Plant', icon: '🥛' },
  { key: 'sweetener_syrup', label: 'Syrups & Purees', icon: '🍯' },
  { key: 'topping_solid', label: 'Boba & Foams', icon: '🧋' },
  { key: 'ice_temp', label: 'Ice Level', icon: '🧊' },
];

export function YourMixStudio({
  ingredients,
  bases,
  cupSizes = DEFAULT_CUP_SIZES,
  onAddToCart,
  onClose,
  mode = 'kiosk'
}: YourMixStudioProps) {
  const { toast } = useToast();

  // Active Cup Size
  const [selectedCupSize, setSelectedCupSize] = useState<YourMixCupSize>(cupSizes[0] || DEFAULT_CUP_SIZES[0]);

  // Selected Starting Base (or null for "From Scratch")
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);

  // Active Ingredients in Current Mix: { [ingredientId]: quantity }
  const [activeRecipe, setActiveRecipe] = useState<Record<string, number>>({});

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<YourMixIngredientCategory | 'all'>('all');

  // Animation trigger for pouring liquid
  const [lastAddedIngredient, setLastAddedIngredient] = useState<YourMixIngredient | null>(null);
  const [isPouring, setIsPouring] = useState(false);

  // Available Active Ingredients
  const availableIngredients = useMemo(() => {
    return ingredients.filter(ing => ing.isActive !== false);
  }, [ingredients]);

  // Available Active Bases
  const availableBases = useMemo(() => {
    return bases.filter(b => b.isActive !== false);
  }, [bases]);

  // Load a base preset
  const handleSelectBase = (base: YourMixBasePreset | null) => {
    if (!base) {
      setSelectedBaseId(null);
      setActiveRecipe({});
      toast.info('Starting with a clean, empty beaker!');
      return;
    }

    setSelectedBaseId(base.id);
    const recipeMap: Record<string, number> = {};
    base.items.forEach(it => {
      recipeMap[it.ingredientId] = it.quantity;
    });
    setActiveRecipe(recipeMap);
    toast.success(`Loaded "${base.name}" starting base! You can now customize ingredients.`);
  };

  // Calculate current volume and price
  const { totalVolumeOz, calculatedPrice, recipeItems, liquidLayers, hasIce, bobaLayer, foamLayer } = useMemo(() => {
    let vol = 0;
    let price = selectedCupSize.basePrice;
    const items: YourMixRecipeItem[] = [];
    const liquids: { id: string; name: string; color: string; volumeOz: number; percent: number }[] = [];
    let iceQty = 0;
    let bobaQty = 0;
    let foamQty = 0;

    Object.entries(activeRecipe).forEach(([ingId, qty]) => {
      if (qty <= 0) return;
      const ing = availableIngredients.find(i => i.id === ingId);
      if (!ing) return;

      const itemVol = (ing.volumeOz || 1) * qty;
      const itemPrice = (ing.pricePerUnit || 0) * qty;

      vol += itemVol;
      price += itemPrice;

      const recipeItem: YourMixRecipeItem = {
        id: ing.id,
        name: ing.name,
        category: ing.category,
        quantity: qty,
        unit: ing.unit,
        volumeOz: itemVol,
        pricePerUnit: ing.pricePerUnit,
        totalPrice: itemPrice,
        color: ing.color || '#3E2723',
        layerType: ing.layerType || 'liquid'
      };
      items.push(recipeItem);

      if (ing.layerType === 'ice') {
        iceQty += qty;
      } else if (ing.layerType === 'bottom_solid') {
        bobaQty += qty;
      } else if (ing.layerType === 'foam' || ing.layerType === 'top_solid') {
        foamQty += qty;
      } else {
        liquids.push({
          id: ing.id,
          name: ing.name,
          color: ing.color || '#3E2723',
          volumeOz: itemVol,
          percent: 0 // Will compute relative to total liquid
        });
      }
    });

    // Compute relative heights of liquids inside beaker
    const totalLiquidVol = liquids.reduce((acc, l) => acc + l.volumeOz, 0);
    if (totalLiquidVol > 0) {
      liquids.forEach(l => {
        l.percent = (l.volumeOz / totalLiquidVol) * 100;
      });
    }

    return {
      totalVolumeOz: Math.round(vol * 10) / 10,
      calculatedPrice: Math.round(price),
      recipeItems: items,
      liquidLayers: liquids,
      hasIce: iceQty > 0,
      bobaLayer: bobaQty > 0,
      foamLayer: foamQty > 0
    };
  }, [activeRecipe, availableIngredients, selectedCupSize]);

  const capacityPercent = Math.min(100, Math.round((totalVolumeOz / selectedCupSize.capacityOz) * 100));
  const isFull = totalVolumeOz >= selectedCupSize.capacityOz;

  // Add / Increment Ingredient
  const handleAddIngredient = (ing: YourMixIngredient) => {
    const currentQty = activeRecipe[ing.id] || 0;
    const step = ing.stepPortion || 1;
    const max = ing.maxPortion || 10;
    const nextQty = currentQty + step;

    if (nextQty > max) {
      toast.warning(`Maximum limit for ${ing.name} is ${max} ${ing.unit}`);
      return;
    }

    const addedVol = (ing.volumeOz || 1) * step;
    if (totalVolumeOz + addedVol > selectedCupSize.capacityOz + 0.1) {
      toast.warning(`Exceeds cup capacity! Only ${(selectedCupSize.capacityOz - totalVolumeOz).toFixed(1)} oz remaining in this ${selectedCupSize.name}.`);
      return;
    }

    // Trigger pour animation
    setLastAddedIngredient(ing);
    setIsPouring(true);
    setTimeout(() => setIsPouring(false), 900);

    setActiveRecipe(prev => ({
      ...prev,
      [ing.id]: nextQty
    }));
  };

  // Decrement Ingredient
  const handleRemoveIngredient = (ing: YourMixIngredient) => {
    const currentQty = activeRecipe[ing.id] || 0;
    const step = ing.stepPortion || 1;
    const nextQty = currentQty - step;

    if (nextQty <= (ing.minPortion || 0)) {
      const next = { ...activeRecipe };
      delete next[ing.id];
      setActiveRecipe(next);
    } else {
      setActiveRecipe(prev => ({
        ...prev,
        [ing.id]: nextQty
      }));
    }
  };

  // Reset entire mix
  const handleClearAll = () => {
    setActiveRecipe({});
    setSelectedBaseId(null);
    toast.info('Beaker cleared');
  };

  // Add Custom Drink to Cart
  const handleConfirmAddToCart = () => {
    if (recipeItems.length === 0) {
      toast.warning('Your beaker is empty! Add ingredients to formulate your mix.');
      return;
    }

    // Construct detailed barista mixture guide
    const baseName = availableBases.find(b => b.id === selectedBaseId)?.name;
    const drinkTitle = baseName ? `Your MIX — ${baseName}` : `Your MIX Custom Creation`;

    const recipeLines = recipeItems.map(it => `• ${it.quantity} ${it.unit} ${it.name}`);
    const fullMixtureGuide = [
      `[YOUR MIX LAB CREATION - ${selectedCupSize.name}]`,
      baseName ? `Base: ${baseName}` : `Style: From Scratch Custom Mix`,
      `Capacity: ${totalVolumeOz} oz / ${selectedCupSize.capacityOz} oz`,
      `--- Exact Formula ---`,
      ...recipeLines
    ].join('\n');

    const customCartItem: CartItem = {
      id: `your-mix-${Date.now()}`,
      cartId: `mix-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${drinkTitle} (${selectedCupSize.capacityOz} oz)`,
      category: 'Your MIX',
      subCategory: 'Custom Mixology Studio',
      price: calculatedPrice,
      cost: recipeItems.reduce((sum, it) => {
        const orig = ingredients.find(i => i.id === it.id);
        return sum + (orig?.costPerUnit || 0) * it.quantity;
      }, 0),
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      description: `Custom formulated ${selectedCupSize.name} drink containing ${recipeItems.length} laboratory ingredients.`,
      stock: 999,
      unit: 'cup',
      lowStockThreshold: 5,
      isActive: true,
      quantity: 1,
      notes: `Custom Mix: ${recipeItems.map(r => `${r.quantity}${r.unit} ${r.name}`).join(', ')}`,
      isCustomMix: true,
      mixtureGuide: fullMixtureGuide,
      customMixDetails: {
        cupSize: selectedCupSize.name,
        capacityOz: selectedCupSize.capacityOz,
        totalVolumeOz,
        basePresetName: baseName,
        ingredients: recipeItems,
        calculatedBasePrice: selectedCupSize.basePrice,
        calculatedIngredientsPrice: calculatedPrice - selectedCupSize.basePrice,
        calculatedTotalPrice: calculatedPrice
      }
    };

    onAddToCart(customCartItem);
    toast.success(`🧪 Added "${drinkTitle}" to your order tray!`);
    if (onClose) onClose();
  };

  const filteredIngredients = activeCategory === 'all'
    ? availableIngredients
    : availableIngredients.filter(i => i.category === activeCategory);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-full bg-slate-950 text-slate-100 rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-in fade-in duration-300">
      {/* Studio Header */}
      <div className="p-4 sm:p-6 bg-slate-900/80 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 border border-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                Your MIX — Drink Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Interactive Lab
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Formulate your dream beverage with live visual layering & volume capacity metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearAll}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-white/10 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Empty Beaker</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        {/* Left Side: Interactive Visual Mixing Canvas & Gauge */}
        <div className="w-full lg:w-[420px] xl:w-[460px] p-6 flex flex-col items-center justify-between bg-gradient-to-b from-slate-900/50 to-slate-950/80 shrink-0">
          
          {/* Step 1: Cup Size Selector */}
          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Step 1: Select Cup Vessel
              </span>
              <span className="text-xs font-bold text-slate-400">
                Base Fee: ₱{selectedCupSize.basePrice}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {cupSizes.map(size => {
                const isSel = selectedCupSize.id === size.id;
                return (
                  <button
                    key={size.id}
                    onClick={() => {
                      setSelectedCupSize(size);
                      if (totalVolumeOz > size.capacityOz) {
                        toast.warning(`Total mix volume exceeds ${size.capacityOz} oz. Please adjust portions.`);
                      }
                    }}
                    className={`py-3 px-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSel
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/20 font-black'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black uppercase">{size.name}</div>
                      <div className={`text-[10px] ${isSel ? 'text-slate-900' : 'text-slate-400'}`}>
                        Cap: {size.capacityOz} oz
                      </div>
                    </div>
                    {isSel && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Layered Liquid Beaker Simulation */}
          <div className="relative w-full flex flex-col items-center my-4">
            
            {/* Pouring Stream Animation */}
            {isPouring && lastAddedIngredient && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 pointer-events-none animate-in slide-in-from-top-4 duration-300">
                <div 
                  className="w-2.5 h-16 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)] animate-pulse"
                  style={{ backgroundColor: lastAddedIngredient.color || '#3E2723' }}
                />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 mt-1 bg-black/80 px-2 py-0.5 rounded-full border border-amber-500/40">
                  Infusing {lastAddedIngredient.name}...
                </span>
              </div>
            )}

            {/* Transparent Glass Beaker Container */}
            <div className="relative w-48 sm:w-56 h-80 rounded-b-[3rem] rounded-t-xl border-4 border-white/20 bg-white/5 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-end p-2 transition-all">
              
              {/* Beaker Volume Scale Ticks */}
              <div className="absolute top-0 bottom-0 left-2 w-8 flex flex-col justify-between py-6 pointer-events-none z-20 opacity-60">
                <div className="border-b border-white/40 w-4 text-[9px] font-mono text-white/70 pl-5">22oz</div>
                <div className="border-b border-white/40 w-5 text-[9px] font-mono text-white/70 pl-6">16oz</div>
                <div className="border-b border-white/40 w-4 text-[9px] font-mono text-white/70 pl-5">12oz</div>
                <div className="border-b border-white/40 w-5 text-[9px] font-mono text-white/70 pl-6">8oz</div>
                <div className="border-b border-white/40 w-4 text-[9px] font-mono text-white/70 pl-5">4oz</div>
              </div>

              {/* Top Foam or Whipped Cream Peak */}
              {foamLayer && (
                <div className="w-full h-10 bg-gradient-to-b from-white via-amber-50 to-amber-100 rounded-t-3xl shadow-inner flex items-center justify-center shrink-0 z-10 animate-in fade-in duration-500">
                  <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest opacity-80">
                    Velvet Foam Crown
                  </span>
                </div>
              )}

              {/* Floating Translucent Ice Cubes */}
              {hasIce && (
                <div className="absolute inset-x-4 top-20 z-15 flex justify-center gap-2 pointer-events-none animate-bounce duration-1000">
                  <div className="w-7 h-7 rounded-lg bg-cyan-100/40 border border-white/60 shadow-lg rotate-12 backdrop-blur-sm" />
                  <div className="w-6 h-6 rounded-lg bg-cyan-100/30 border border-white/60 shadow-lg -rotate-6 backdrop-blur-sm" />
                  <div className="w-8 h-8 rounded-lg bg-cyan-100/40 border border-white/60 shadow-lg rotate-45 backdrop-blur-sm" />
                </div>
              )}

              {/* Fluid Layers Stack */}
              <div 
                className="w-full rounded-b-[2.5rem] overflow-hidden flex flex-col-reverse transition-all duration-700 relative"
                style={{ height: `${Math.min(94, Math.max(8, capacityPercent))}%` }}
              >
                {liquidLayers.length === 0 && !bobaLayer ? (
                  <div className="h-full w-full bg-amber-500/10 flex items-center justify-center text-center p-4">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Empty Laboratory Beaker
                    </span>
                  </div>
                ) : (
                  liquidLayers.map((layer, idx) => (
                    <div
                      key={`${layer.id}-${idx}`}
                      className="w-full transition-all duration-500 relative flex items-center justify-center group"
                      style={{
                        height: `${layer.percent}%`,
                        backgroundColor: layer.color
                      }}
                      title={`${layer.name}: ${layer.volumeOz} oz`}
                    >
                      {/* Subtle liquid shine gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/20 pointer-events-none" />
                      <span className="text-[9px] font-black text-white/90 drop-shadow uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                        {layer.name} ({layer.volumeOz} oz)
                      </span>
                    </div>
                  ))
                )}

                {/* Bottom Boba Pearls / Crystal Jelly Layer */}
                {bobaLayer && (
                  <div className="h-10 w-full bg-[#1A120E] flex items-center justify-center gap-1 px-2 shrink-0 z-10 animate-in fade-in">
                    <div className="w-3.5 h-3.5 rounded-full bg-black border border-amber-900/60 shadow-inner" />
                    <div className="w-3.5 h-3.5 rounded-full bg-black border border-amber-900/60 shadow-inner" />
                    <div className="w-3.5 h-3.5 rounded-full bg-black border border-amber-900/60 shadow-inner" />
                    <div className="w-3.5 h-3.5 rounded-full bg-black border border-amber-900/60 shadow-inner" />
                    <div className="w-3.5 h-3.5 rounded-full bg-black border border-amber-900/60 shadow-inner" />
                  </div>
                )}
              </div>

              {/* Glass Glare Highlight */}
              <div className="absolute top-0 right-3 bottom-0 w-2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-full pointer-events-none" />
            </div>
          </div>

          {/* Real-time Volumetric Capacity Gauge */}
          <div className="w-full bg-black/40 p-4 rounded-2xl border border-white/10 space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Current Beaker Volume
              </span>
              <span className={`font-mono font-black ${
                isFull ? 'text-rose-400' : capacityPercent > 75 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {totalVolumeOz} oz / {selectedCupSize.capacityOz} oz ({capacityPercent}%)
              </span>
            </div>

            {/* Gauge Progress Bar */}
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull 
                    ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                    : capacityPercent > 75 
                    ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                    : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                }`}
                style={{ width: `${Math.min(100, capacityPercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>0 oz</span>
              <span>Available Space: <strong>{(selectedCupSize.capacityOz - totalVolumeOz).toFixed(1)} oz</strong></span>
              <span>{selectedCupSize.capacityOz} oz</span>
            </div>
          </div>

          {/* Dynamic Price & Add to Cart */}
          <div className="w-full pt-4 border-t border-white/10 mt-4 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Drink Price</span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                ₱{calculatedPrice}
              </div>
            </div>

            <button
              onClick={handleConfirmAddToCart}
              disabled={recipeItems.length === 0}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add Mix to Order</span>
            </button>
          </div>
        </div>

        {/* Right Side: Step 2 Starting Point Bases & Ingredient Controls */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
          
          {/* Step 2: Starting Point Bases */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Step 2: Choose Starting Base or Start Empty
              </span>
              {selectedBaseId && (
                <button
                  onClick={() => handleSelectBase(null)}
                  className="text-[10px] font-bold text-slate-400 hover:text-white underline"
                >
                  Clear Base (Start Empty)
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {/* Start From Scratch Option */}
              <button
                onClick={() => handleSelectBase(null)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedBaseId === null
                    ? 'bg-amber-500/10 border-amber-500 shadow-md'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-sm mb-2">
                  🧪
                </div>
                <div>
                  <div className="text-xs font-black text-white leading-tight">Start From Scratch</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Empty cup (0 oz)</div>
                </div>
              </button>

              {/* Starter Presets */}
              {availableBases.map(base => {
                const isSelected = selectedBaseId === base.id;
                return (
                  <button
                    key={base.id}
                    onClick={() => handleSelectBase(base)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg font-black'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                        isSelected ? 'bg-slate-900 text-white' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {base.categoryTag || 'Base'}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-black leading-tight truncate">{base.name}</div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-900' : 'text-slate-400'} line-clamp-1`}>
                        {base.items.length} starter ingredients
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Add & Fine Tune Ingredients */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" /> Step 3: Add & Customize Ingredients
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {recipeItems.length} active elements in mix
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeCategory === cat.key
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Ingredients Grid / Steppers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-hide">
              {filteredIngredients.map(ing => {
                const currentPortion = activeRecipe[ing.id] || 0;
                const isAdded = currentPortion > 0;
                const addedVol = (ing.volumeOz || 1) * (ing.stepPortion || 1);
                const wouldExceed = totalVolumeOz + addedVol > selectedCupSize.capacityOz;

                return (
                  <div
                    key={ing.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isAdded 
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md' 
                        : 'bg-slate-900/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl border border-white/20 shadow-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: ing.color || '#3E2723' }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-white/70" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white leading-tight">
                          {ing.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-amber-400">
                            +₱{ing.pricePerUnit} / {ing.unit}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-mono">
                            {ing.volumeOz} oz vol
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stepper Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isAdded ? (
                        <div className="flex items-center gap-2 bg-black/60 p-1 rounded-xl border border-white/10">
                          <button
                            onClick={() => handleRemoveIngredient(ing)}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-xs font-black font-mono text-amber-400">
                            {currentPortion} {ing.unit}
                          </span>
                          <button
                            onClick={() => handleAddIngredient(ing)}
                            disabled={wouldExceed}
                            className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 flex items-center justify-center font-black transition-all active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddIngredient(ing)}
                          disabled={wouldExceed}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-30 disabled:hover:bg-white/10 disabled:hover:text-white text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Recipe Breakdown Footer */}
          {recipeItems.length > 0 && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Itemized Laboratory Mix Formula:
              </span>
              <div className="flex flex-wrap gap-2">
                {recipeItems.map(it => (
                  <span
                    key={it.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: it.color }} />
                    <strong>{it.quantity} {it.unit}</strong> {it.name}
                    <span className="text-amber-400 font-bold ml-0.5">(₱{it.totalPrice})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
