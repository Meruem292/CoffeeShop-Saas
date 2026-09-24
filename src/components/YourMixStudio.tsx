import React, { useState, useMemo, useEffect } from 'react';
import { 
  FlaskConical, Sparkles, Plus, Minus, RotateCcw, ShoppingBag, 
  Layers, Check, AlertCircle, Info, ChevronRight, X, ArrowLeft,
  Droplets, Flame, Snowflake, ShieldCheck, Tag, BookmarkPlus, Share2,
  Wand2, QrCode, Zap, Scale, Heart, Globe, Crown
} from 'lucide-react';
import { 
  YourMixIngredient, YourMixBasePreset, YourMixCupSize, 
  YourMixIngredientCategory, CartItem, YourMixRecipeItem, YourMixDrinkDetails,
  SavedCustomMix 
} from '../types';
import { DEFAULT_CUP_SIZES } from '../data/yourMixDefaults';
import { useToast } from '../lib/ToastContext';

interface YourMixStudioProps {
  ingredients: YourMixIngredient[];
  bases: YourMixBasePreset[];
  cupSizes?: YourMixCupSize[];
  onAddToCart: (item: CartItem) => void;
  onSaveCustomMix?: (mixData: Omit<SavedCustomMix, 'id' | 'createdAt' | 'userId'>) => Promise<any>;
  onClose?: () => void;
  mode?: 'mobile' | 'kiosk' | 'pos';
  isLoggedIn?: boolean;
  initialMixToLoad?: SavedCustomMix | null;
  onOpenCreativesMarket?: () => void;
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
  onSaveCustomMix,
  onClose,
  mode = 'kiosk',
  isLoggedIn = false,
  initialMixToLoad = null,
  onOpenCreativesMarket
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

  // Custom Mix Name State
  const [customMixName, setCustomMixName] = useState<string>('');

  // Animation trigger for pouring liquid
  const [lastAddedIngredient, setLastAddedIngredient] = useState<YourMixIngredient | null>(null);
  const [isPouring, setIsPouring] = useState(false);

  // Share Recipe Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Save & Publish to Creatives Market Modal
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [publishToMarket, setPublishToMarket] = useState(true);
  const [creatorHandle, setCreatorHandle] = useState('');
  const [drinkTagline, setDrinkTagline] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['#Sweet', '#Creamy']);

  // Handle Loading an initial remix recipe from Creatives Market
  useEffect(() => {
    if (initialMixToLoad) {
      if (initialMixToLoad.cupSize) {
        setSelectedCupSize(initialMixToLoad.cupSize);
      }
      setSelectedBaseId(initialMixToLoad.basePresetId || null);
      setCustomMixName(initialMixToLoad.mixName || '');
      if (initialMixToLoad.recipeItems && initialMixToLoad.recipeItems.length > 0) {
        const recipeMap: Record<string, number> = {};
        initialMixToLoad.recipeItems.forEach(it => {
          recipeMap[it.id] = it.quantity;
        });
        setActiveRecipe(recipeMap);
      }
      toast.success(`Loaded "${initialMixToLoad.mixName}" into Mix Lab!`);
    }
  }, [initialMixToLoad]);

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
      setCustomMixName('');
      toast.info('Starting with a clean, empty beaker!');
      return;
    }

    setSelectedBaseId(base.id);
    const recipeMap: Record<string, number> = {};
    base.items.forEach(it => {
      recipeMap[it.ingredientId] = it.quantity;
    });
    setActiveRecipe(recipeMap);
    setCustomMixName(`Custom ${base.name}`);
    toast.success(`Loaded "${base.name}" starting base! Customize your ingredients.`);
  };

  // Auto-generate a creative drink name
  const handleGenerateName = () => {
    const prefixes = ['Velvet', 'Galactic', 'Midnight', 'Ruby', 'Golden', 'Celestial', 'Starlight', 'Aura', 'Atomic', 'Cosmic', 'Nebula'];
    const activeNames = recipeItems.map(i => i.name.replace(/shot|brew|base|edition|fresh|syrup|puree|sauce|powder| pearls/gi, '').trim()).filter(Boolean);
    const flavor = activeNames.length > 0 ? activeNames[0] : 'Espresso';
    const suffixes = ['Infusion', 'Elixir', 'Cloud', 'Float', 'Mist', 'Brew', 'Special', 'Fusion', 'Latte', 'Nectar', 'Shake'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const generated = `${prefix} ${flavor} ${suffix}`;
    setCustomMixName(generated);
    toast.success(`Generated Mix Name: "${generated}"`);
  };

  // Calculate current volume, price, nutrition & layers
  const { 
    totalVolumeOz, calculatedPrice, recipeItems, liquidLayers, 
    hasIce, bobaLayer, foamLayer, estimatedCaffeineMg, estimatedSugarGrams, estimatedCalories 
  } = useMemo(() => {
    let vol = 0;
    let price = selectedCupSize.basePrice;
    let caffeine = 0;
    let sugar = 0;
    let calories = 0;
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
      const itemCaffeine = (ing.caffeineMgPerUnit || 0) * qty;
      const itemSugar = (ing.sugarGramsPerUnit || 0) * qty;
      const itemCalories = (ing.caloriesPerUnit || 0) * qty;

      vol += itemVol;
      price += itemPrice;
      caffeine += itemCaffeine;
      sugar += itemSugar;
      calories += itemCalories;

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
        layerType: ing.layerType || 'liquid',
        caffeineMg: itemCaffeine,
        sugarGrams: itemSugar,
        calories: itemCalories,
        measureGrams: (ing.measureGramsPerUnit || 15) * qty
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
          percent: 0
        });
      }
    });

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
      foamLayer: foamQty > 0,
      estimatedCaffeineMg: Math.round(caffeine),
      estimatedSugarGrams: Math.round(sugar),
      estimatedCalories: Math.round(calories)
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
    setCustomMixName('');
    toast.info('Beaker cleared');
  };

  // Save to Profile & Market Flow
  const handleSaveToProfile = () => {
    if (recipeItems.length === 0) {
      toast.warning('Add ingredients to your mix before saving!');
      return;
    }

    if (!onSaveCustomMix) {
      toast.info('Log in to save your custom mix formulas to your profile!');
      return;
    }

    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (recipeItems.length === 0) return;
    if (!onSaveCustomMix) return;

    const nameToSave = customMixName.trim() || `Custom Mix ${new Date().toLocaleDateString()}`;
    setIsSaving(true);
    try {
      const baseName = availableBases.find(b => b.id === selectedBaseId)?.name;
      await onSaveCustomMix({
        mixName: nameToSave,
        cupSize: selectedCupSize,
        basePresetId: selectedBaseId || undefined,
        basePresetName: baseName,
        recipeItems,
        totalVolumeOz,
        totalPrice: calculatedPrice,
        caffeineMg: estimatedCaffeineMg,
        sugarGrams: estimatedSugarGrams,
        calories: estimatedCalories,
        isPublic: publishToMarket,
        creatorHandle: creatorHandle.trim() || undefined,
        tagline: drinkTagline.trim() || undefined,
        tags: selectedTags
      });
      setIsSaveModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Add Custom Drink to Cart
  const handleConfirmAddToCart = () => {
    if (recipeItems.length === 0) {
      toast.warning('Your beaker is empty! Add ingredients to formulate your mix.');
      return;
    }

    const baseName = availableBases.find(b => b.id === selectedBaseId)?.name;
    const finalDrinkName = customMixName.trim() || (baseName ? `Your MIX — ${baseName}` : `Your MIX Custom Creation`);

    const recipeLines = recipeItems.map(it => `• ${it.quantity} ${it.unit} ${it.name} (${it.measureGrams || it.quantity * 15}g/ml)`);
    const fullMixtureGuide = [
      `[YOUR MIX LAB CREATION - ${selectedCupSize.name}]`,
      `Name: ${finalDrinkName}`,
      baseName ? `Base: ${baseName}` : `Style: From Scratch Custom Mix`,
      `Capacity: ${totalVolumeOz} oz / ${selectedCupSize.capacityOz} oz`,
      `Estimated Nutrition: ${estimatedCaffeineMg}mg Caffeine | ${estimatedSugarGrams}g Sugar | ${estimatedCalories} kcal`,
      `--- Barista Pouring & Recipe Steps ---`,
      ...recipeLines
    ].join('\n');

    const customCartItem: CartItem = {
      id: `your-mix-${Date.now()}`,
      cartId: `mix-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${finalDrinkName} (${selectedCupSize.capacityOz} oz)`,
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
        mixName: finalDrinkName,
        cupSize: selectedCupSize.name,
        capacityOz: selectedCupSize.capacityOz,
        totalVolumeOz,
        basePresetName: baseName,
        ingredients: recipeItems,
        calculatedBasePrice: selectedCupSize.basePrice,
        calculatedIngredientsPrice: calculatedPrice - selectedCupSize.basePrice,
        calculatedTotalPrice: calculatedPrice,
        estimatedCaffeineMg,
        estimatedSugarGrams,
        estimatedCalories
      }
    };

    onAddToCart(customCartItem);
    toast.success(`🧪 Added "${finalDrinkName}" to your order tray!`);
    if (onClose) onClose();
  };

  const filteredIngredients = activeCategory === 'all'
    ? availableIngredients
    : availableIngredients.filter(i => i.category === activeCategory);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col bg-slate-950 text-slate-100 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in duration-300">
      {/* Studio Header */}
      <div className="p-4 sm:p-6 bg-slate-900/80 backdrop-blur-2xl border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0">
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
              Formulate your custom beverage with dynamic fluid visualizer & exact barista step calculations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenCreativesMarket && (
            <button
              onClick={onOpenCreativesMarket}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500/30 hover:to-amber-500/40 text-amber-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-amber-500/40 shadow-sm active:scale-95 group"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Creatives Market</span>
            </button>
          )}

          {recipeItems.length > 0 && (
            <>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-cyan-500/30 active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share Formula</span>
              </button>

              <button
                onClick={handleSaveToProfile}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-purple-500/40 active:scale-95 disabled:opacity-50"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Save & Publish</span>
              </button>
            </>
          )}

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
      <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        {/* Left Side: Interactive Visual Mixing Canvas & Gauge */}
        <div className="w-full lg:w-[420px] xl:w-[460px] p-6 flex flex-col items-center justify-between bg-gradient-to-b from-slate-900/50 to-slate-950/80 shrink-0 space-y-4">
          
          {/* Step 1: Cup Size Selector */}
          <div className="w-full mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Step 1: Select Cup Size
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
                    className={`py-2.5 px-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
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
          <div className="relative w-full flex flex-col items-center my-2">
            
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
            <div className="relative w-48 sm:w-56 h-72 rounded-b-[3rem] rounded-t-xl border-4 border-white/20 bg-white/5 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-end p-2 transition-all">
              
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
                <div className="w-full h-8 bg-gradient-to-b from-white via-amber-50 to-amber-100 rounded-t-3xl shadow-inner flex items-center justify-center shrink-0 z-10 animate-in fade-in duration-500">
                  <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest opacity-80">
                    Foam Crown
                  </span>
                </div>
              )}

              {/* Floating Translucent Ice Cubes */}
              {hasIce && (
                <div className="absolute inset-x-4 top-16 z-15 flex justify-center gap-2 pointer-events-none animate-bounce duration-1000">
                  <div className="w-6 h-6 rounded-lg bg-cyan-100/40 border border-white/60 shadow-lg rotate-12 backdrop-blur-sm" />
                  <div className="w-5 h-5 rounded-lg bg-cyan-100/30 border border-white/60 shadow-lg -rotate-6 backdrop-blur-sm" />
                  <div className="w-7 h-7 rounded-lg bg-cyan-100/40 border border-white/60 shadow-lg rotate-45 backdrop-blur-sm" />
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
                      Empty Beaker
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
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/20 pointer-events-none" />
                      <span className="text-[9px] font-black text-white/90 drop-shadow uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                        {layer.name} ({layer.volumeOz} oz)
                      </span>
                    </div>
                  ))
                )}

                {/* Bottom Boba Pearls Layer */}
                {bobaLayer && (
                  <div className="h-9 w-full bg-[#1A120E] flex items-center justify-center gap-1 px-2 shrink-0 z-10 animate-in fade-in">
                    <div className="w-3 h-3 rounded-full bg-black border border-amber-900/60 shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-black border border-amber-900/60 shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-black border border-amber-900/60 shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-black border border-amber-900/60 shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-black border border-amber-900/60 shadow-inner" />
                  </div>
                )}
              </div>

              {/* Glass Glare Highlight */}
              <div className="absolute top-0 right-3 bottom-0 w-2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-full pointer-events-none" />
            </div>
          </div>

          {/* Real-time Nutrition & Flavor Meters */}
          <div className="w-full bg-black/40 p-3.5 rounded-2xl border border-white/10 space-y-2.5 mt-2">
            {/* Volumetric Capacity Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Beaker Volume
                </span>
                <span className={`font-mono font-black text-xs ${
                  isFull ? 'text-rose-400' : capacityPercent > 75 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {totalVolumeOz} / {selectedCupSize.capacityOz} oz ({capacityPercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-0.5">
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
            </div>

            {/* Nutrition Badges */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-center">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Caffeine
                </div>
                <div className="text-xs font-black text-amber-400 font-mono mt-0.5">
                  {estimatedCaffeineMg} mg
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-center">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Scale className="w-3 h-3 text-rose-400" /> Sugar
                </div>
                <div className="text-xs font-black text-rose-300 font-mono mt-0.5">
                  {estimatedSugarGrams} g
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-center">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-emerald-400" /> Energy
                </div>
                <div className="text-xs font-black text-emerald-300 font-mono mt-0.5">
                  {estimatedCalories} kcal
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Price & Add to Cart */}
          <div className="w-full pt-4 border-t border-white/10 mt-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Formula Price</span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                ₱{calculatedPrice}
              </div>
            </div>

            <button
              onClick={handleConfirmAddToCart}
              disabled={recipeItems.length === 0}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add Mix to Order</span>
            </button>
          </div>
        </div>

        {/* Right Side: Custom Drink Naming, Starting Bases & Ingredient Controls */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-start overflow-y-auto space-y-6">
          
          {/* Custom Mix Name Generator & Input */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-amber-400" /> Name Your Formula
              </span>
              <button
                onClick={handleGenerateName}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
              >
                <Sparkles className="w-3 h-3" /> Auto-Generate Name
              </button>
            </div>
            <input
              type="text"
              value={customMixName}
              onChange={(e) => setCustomMixName(e.target.value)}
              placeholder="e.g. Alex's Midnight Mocha, Velvet Uji Cloud..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs font-bold focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Step 2: Starting Point Presets */}
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
                        {base.items.length} starter elements
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] lg:max-h-[650px] overflow-y-auto pr-2">
              {filteredIngredients.map(ing => {
                const currentPortion = activeRecipe[ing.id] || 0;
                const isAdded = currentPortion > 0;
                const addedVol = (ing.volumeOz || 1) * (ing.stepPortion || 1);
                const wouldExceed = totalVolumeOz + addedVol > selectedCupSize.capacityOz;

                return (
                  <div
                    key={ing.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
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

      {/* Share Recipe Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-white/15 p-6 rounded-3xl max-w-md w-full text-slate-100 space-y-5 relative shadow-2xl">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase">Share Your Formula</h3>
                <p className="text-xs text-slate-400">Scan or copy recipe formula to share with friends</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 text-center space-y-3">
              <div className="w-32 h-32 mx-auto bg-white p-2 rounded-2xl flex items-center justify-center shadow-md">
                <QrCode className="w-28 h-28 text-slate-950" />
              </div>
              <div className="text-xs font-black text-amber-400">
                {customMixName || 'Custom Mix Creation'}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {recipeItems.map(i => `${i.quantity}${i.unit} ${i.name}`).join(' + ')}
              </p>
            </div>

            <button
              onClick={() => {
                const text = `🧪 Check out my custom drink recipe "${customMixName || 'Custom Mix'}" from CoffeeShop: ${recipeItems.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}!`;
                navigator.clipboard.writeText(text);
                toast.success('Recipe formula copied to clipboard!');
                setIsShareModalOpen(false);
              }}
              className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all"
            >
              Copy Shareable Formula Text
            </button>
          </div>
        </div>
      )}
      {/* Save & Publish to Creatives Market Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-white/15 p-6 rounded-3xl max-w-lg w-full text-slate-100 space-y-5 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSaveModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Save & Publish Mix</h3>
                <p className="text-xs text-slate-400">Save to your favorites & showcase in the Creatives Market</p>
              </div>
            </div>

            {/* Mix Name Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Drink Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customMixName}
                  onChange={(e) => setCustomMixName(e.target.value)}
                  placeholder="e.g. Midnight Salted Velvet"
                  maxLength={40}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10"
                />
                <button
                  type="button"
                  onClick={handleGenerateName}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 transition-colors"
                  title="Generate Cool Drink Name"
                >
                  <Wand2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Publish to Creatives Market Switch */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Publish to Creatives Market
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPublishToMarket(!publishToMarket)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    publishToMarket ? 'bg-amber-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                      publishToMarket ? 'right-0.5 shadow' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Feature your recipe in the community marketplace so other coffee enthusiasts can try, review, and make you the next sensation drink maker!
              </p>

              {publishToMarket && (
                <div className="space-y-3 pt-2 border-t border-amber-500/20 animate-in fade-in">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                      Creator Nickname / Handle
                    </label>
                    <input
                      type="text"
                      value={creatorHandle}
                      onChange={(e) => setCreatorHandle(e.target.value)}
                      placeholder="@BaristaAlex"
                      maxLength={25}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                      Drink Tagline / Inspiration
                    </label>
                    <input
                      type="text"
                      value={drinkTagline}
                      onChange={(e) => setDrinkTagline(e.target.value)}
                      placeholder="e.g. Silky cold foam layered with roasted boba pearls"
                      maxLength={70}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                      Flavor Tags (Select up to 3)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['#Sweet', '#StrongCoffee', '#Creamy', '#Refreshing', '#DessertStyle', '#BobaLover', '#LowSugar', '#BoldRoast'].map(tag => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTags(selectedTags.filter(t => t !== tag));
                              } else {
                                if (selectedTags.length < 3) {
                                  setSelectedTags([...selectedTags, tag]);
                                } else {
                                  toast.info('Maximum 3 tags allowed');
                                }
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recipe summary summary */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>{recipeItems.length} elements • {selectedCupSize.capacityOz} oz</span>
              <span className="font-black text-amber-400 text-sm">₱{calculatedPrice}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : publishToMarket ? 'Save & Publish' : 'Save to Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
