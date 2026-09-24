import React, { useState } from 'react';
import { 
  FlaskConical, Sparkles, Plus, Edit3, Trash2, Check, X, RotateCcw,
  Search, Droplets, Layers, ShieldCheck, AlertTriangle, ArrowLeft,
  ChevronRight, Coffee, Info, Tag, DollarSign, Package, Star
} from 'lucide-react';
import { YourMixIngredient, YourMixBasePreset, YourMixCupSize, YourMixIngredientCategory, ShopSettings } from '../types';
import { useToast } from '../lib/ToastContext';

interface AdminYourMixProps {
  ingredients: YourMixIngredient[];
  bases: YourMixBasePreset[];
  cupSizes?: YourMixCupSize[];
  shopSettings: ShopSettings | null;
  onAddIngredient: (ing: Omit<YourMixIngredient, 'id'>) => Promise<string | undefined>;
  onUpdateIngredient: (id: string, updates: Partial<YourMixIngredient>) => Promise<void>;
  onDeleteIngredient: (id: string) => Promise<void>;
  onAddBase: (base: Omit<YourMixBasePreset, 'id'>) => Promise<string | undefined>;
  onUpdateBase: (id: string, updates: Partial<YourMixBasePreset>) => Promise<void>;
  onDeleteBase: (id: string) => Promise<void>;
  onAddCupSize?: (cs: Omit<YourMixCupSize, 'id'>) => Promise<string | undefined>;
  onUpdateCupSize?: (id: string, updates: Partial<YourMixCupSize>) => Promise<void>;
  onDeleteCupSize?: (id: string) => Promise<void>;
  onResetDefaults: () => Promise<void>;
  onBackToSettings?: () => void;
}

const CATEGORY_LABELS: Record<YourMixIngredientCategory, { label: string; color: string }> = {
  base_liquid: { label: 'Coffee & Tea Base', color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' },
  dairy_milk: { label: 'Milk & Plant-Based', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  sweetener_syrup: { label: 'Syrups & Purees', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  powder_flavor: { label: 'Powders & Dust', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  topping_solid: { label: 'Toppings & Foam', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  ice_temp: { label: 'Ice & Temperature', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
};

export function AdminYourMix({
  ingredients,
  bases,
  cupSizes = [],
  shopSettings,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  onAddBase,
  onUpdateBase,
  onDeleteBase,
  onAddCupSize,
  onUpdateCupSize,
  onDeleteCupSize,
  onResetDefaults,
  onBackToSettings
}: AdminYourMixProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'ingredients' | 'bases' | 'cup_sizes'>('ingredients');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cup Size Modal State
  const [isCupModalOpen, setIsCupModalOpen] = useState(false);
  const [editingCupId, setEditingCupId] = useState<string | null>(null);
  const [cupForm, setCupForm] = useState<Omit<YourMixCupSize, 'id'>>({
    name: '',
    capacityOz: 16,
    basePrice: 40,
    isActive: true,
    isDefault: false
  });

  const handleOpenNewCup = () => {
    setEditingCupId(null);
    setCupForm({
      name: '',
      capacityOz: 16,
      basePrice: 40,
      isActive: true,
      isDefault: false
    });
    setIsCupModalOpen(true);
  };

  const handleOpenEditCup = (cup: YourMixCupSize) => {
    setEditingCupId(cup.id);
    setCupForm({
      name: cup.name,
      capacityOz: cup.capacityOz,
      basePrice: cup.basePrice,
      isActive: cup.isActive !== false,
      isDefault: !!cup.isDefault
    });
    setIsCupModalOpen(true);
  };

  const handleCupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cupForm.name.trim()) {
      toast.error('Cup size name is required');
      return;
    }
    if (cupForm.capacityOz <= 0) {
      toast.error('Capacity must be greater than 0 oz');
      return;
    }

    try {
      if (editingCupId) {
        if (onUpdateCupSize) {
          await onUpdateCupSize(editingCupId, cupForm);
        }
      } else {
        if (onAddCupSize) {
          await onAddCupSize(cupForm);
        }
      }
      setIsCupModalOpen(false);
    } catch {
      toast.error('Failed to save cup size');
    }
  };

  const handleToggleCupActive = async (cup: YourMixCupSize) => {
    if (!onUpdateCupSize) return;
    try {
      await onUpdateCupSize(cup.id, { isActive: !cup.isActive });
    } catch {
      toast.error('Failed to update cup size status');
    }
  };

  const handleSetDefaultCup = async (cup: YourMixCupSize) => {
    if (!onUpdateCupSize) return;
    try {
      for (const cs of cupSizes) {
        if (cs.id === cup.id) {
          await onUpdateCupSize(cs.id, { isDefault: true });
        } else if (cs.isDefault) {
          await onUpdateCupSize(cs.id, { isDefault: false });
        }
      }
      toast.success(`"${cup.name}" set as default cup size`);
    } catch {
      toast.error('Failed to set default cup size');
    }
  };

  // Ingredient Modal State
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [ingredientForm, setIngredientForm] = useState<Omit<YourMixIngredient, 'id'>>({
    name: '',
    category: 'base_liquid',
    unit: 'oz',
    volumeOz: 1,
    costPerUnit: 5,
    pricePerUnit: 15,
    minPortion: 0,
    maxPortion: 6,
    stepPortion: 1,
    color: '#3E2723',
    layerType: 'liquid',
    inventoryStock: 500,
    inventoryUnit: 'oz',
    inventoryDeductionPerUnit: 1,
    isActive: true,
    description: ''
  });

  // Base Preset Modal State
  const [isBaseModalOpen, setIsBaseModalOpen] = useState(false);
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [baseForm, setBaseForm] = useState<Omit<YourMixBasePreset, 'id'>>({
    name: '',
    categoryTag: 'Custom Base',
    description: '',
    defaultCupSize: '16 oz',
    items: [],
    isActive: true
  });

  const filteredIngredients = ingredients.filter(ing => {
    const matchesCat = selectedCategory === 'all' || ing.category === selectedCategory;
    const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (ing.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenNewIngredient = () => {
    setEditingIngredientId(null);
    setIngredientForm({
      name: '',
      category: 'base_liquid',
      unit: 'oz',
      volumeOz: 1,
      costPerUnit: 5,
      pricePerUnit: 15,
      minPortion: 0,
      maxPortion: 6,
      stepPortion: 1,
      color: '#3E2723',
      layerType: 'liquid',
      inventoryStock: 500,
      inventoryUnit: 'oz',
      inventoryDeductionPerUnit: 1,
      isActive: true,
      description: ''
    });
    setIsIngredientModalOpen(true);
  };

  const handleOpenEditIngredient = (ing: YourMixIngredient) => {
    setEditingIngredientId(ing.id);
    setIngredientForm({
      name: ing.name,
      category: ing.category,
      unit: ing.unit,
      volumeOz: ing.volumeOz,
      costPerUnit: ing.costPerUnit,
      pricePerUnit: ing.pricePerUnit,
      minPortion: ing.minPortion,
      maxPortion: ing.maxPortion,
      stepPortion: ing.stepPortion,
      color: ing.color || '#3E2723',
      layerType: ing.layerType || 'liquid',
      inventoryStock: ing.inventoryStock ?? 500,
      inventoryUnit: ing.inventoryUnit || ing.unit,
      inventoryDeductionPerUnit: ing.inventoryDeductionPerUnit ?? 1,
      isActive: ing.isActive ?? true,
      description: ing.description || ''
    });
    setIsIngredientModalOpen(true);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientForm.name.trim()) {
      toast.warning('Please enter an ingredient name');
      return;
    }

    if (editingIngredientId) {
      await onUpdateIngredient(editingIngredientId, ingredientForm);
    } else {
      await onAddIngredient(ingredientForm);
    }
    setIsIngredientModalOpen(false);
  };

  const handleOpenNewBase = () => {
    setEditingBaseId(null);
    setBaseForm({
      name: '',
      categoryTag: 'Custom Base',
      description: '',
      defaultCupSize: '16 oz',
      items: [],
      isActive: true
    });
    setIsBaseModalOpen(true);
  };

  const handleOpenEditBase = (base: YourMixBasePreset) => {
    setEditingBaseId(base.id);
    setBaseForm({
      name: base.name,
      categoryTag: base.categoryTag,
      description: base.description,
      defaultCupSize: base.defaultCupSize || '16 oz',
      items: base.items || [],
      isActive: base.isActive ?? true
    });
    setIsBaseModalOpen(true);
  };

  const handleSaveBase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseForm.name.trim()) {
      toast.warning('Please enter a base preset name');
      return;
    }
    if (baseForm.items.length === 0) {
      toast.warning('Please add at least one ingredient to this preset');
      return;
    }

    if (editingBaseId) {
      await onUpdateBase(editingBaseId, baseForm);
    } else {
      await onAddBase(baseForm);
    }
    setIsBaseModalOpen(false);
  };

  const handleToggleBaseIngredient = (ingredientId: string) => {
    const exists = baseForm.items.find(it => it.ingredientId === ingredientId);
    if (exists) {
      setBaseForm({
        ...baseForm,
        items: baseForm.items.filter(it => it.ingredientId !== ingredientId)
      });
    } else {
      const ing = ingredients.find(i => i.id === ingredientId);
      const defaultQty = ing?.stepPortion || 1;
      setBaseForm({
        ...baseForm,
        items: [...baseForm.items, { ingredientId, quantity: defaultQty }]
      });
    }
  };

  const handleUpdateBaseIngredientQty = (ingredientId: string, quantity: number) => {
    if (quantity <= 0) {
      handleToggleBaseIngredient(ingredientId);
      return;
    }
    setBaseForm({
      ...baseForm,
      items: baseForm.items.map(it => it.ingredientId === ingredientId ? { ...it, quantity } : it)
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 md:p-8 animate-in fade-in duration-500 pb-36 scrollbar-thin scrollbar-thumb-amber-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
          {onBackToSettings && (
            <button
              onClick={onBackToSettings}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 active:scale-95"
              title="Back to Admin Settings"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
            <FlaskConical className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                Your MIX — Lab Manager
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                Mixology Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure drink ingredients, unit cost pricing, liquid layer colors, and starting base recipes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Restore default factory ingredients and drink bases? This will re-seed preset laboratory items.')) {
                onResetDefaults();
              }
            }}
            className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider border border-white/10 transition-all flex items-center gap-2 active:scale-95"
            title="Reset to factory laboratory defaults"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Defaults</span>
          </button>
          {activeTab === 'ingredients' ? (
            <button
              onClick={handleOpenNewIngredient}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Ingredient</span>
            </button>
          ) : activeTab === 'bases' ? (
            <button
              onClick={handleOpenNewBase}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Base Preset</span>
            </button>
          ) : (
            <button
              onClick={handleOpenNewCup}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Cup Size</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('ingredients')}
          className={`px-5 sm:px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'ingredients'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>Ingredients & Costing ({ingredients.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('bases')}
          className={`px-5 sm:px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'bases'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Starting Base Presets ({bases.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('cup_sizes')}
          className={`px-5 sm:px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'cup_sizes'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Cup Sizes & Availability ({cupSizes.length})</span>
        </button>
      </div>

      {activeTab === 'ingredients' && (
        <div className="space-y-6">
          {/* Filters & Search Bar */}
          <div className="bg-white/5 p-4 sm:p-5 rounded-3xl border border-white/10 space-y-3.5 backdrop-blur-xl shadow-lg">
            {/* Top Row: Search Input & Result Count Status */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search ingredients by name or notes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-black/40 border border-white/10 focus:border-amber-500 rounded-2xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-white/10 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400 justify-between sm:justify-end">
                <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono">
                  Showing <strong className="text-amber-400">{filteredIngredients.length}</strong> of {ingredients.length} items
                </span>
                {(selectedCategory !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="text-[10px] font-black uppercase tracking-wider text-amber-500 hover:text-amber-400 hover:underline transition-all px-1.5"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Row: Category Filter Pills (Wrap cleanly without being squashed or cut off) */}
            <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md scale-[1.02]'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>All Categories</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  selectedCategory === 'all' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-300'
                }`}>
                  {ingredients.length}
                </span>
              </button>

              {(Object.keys(CATEGORY_LABELS) as YourMixIngredientCategory[]).map(catKey => {
                const count = ingredients.filter(i => i.category === catKey).length;
                const isSel = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => setSelectedCategory(catKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      isSel
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md scale-[1.02]'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    <span>{CATEGORY_LABELS[catKey].label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSel ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-300'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ingredients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIngredients.map(ing => {
              const profitMargin = ing.pricePerUnit > 0 
                ? Math.round(((ing.pricePerUnit - ing.costPerUnit) / ing.pricePerUnit) * 100)
                : 0;

              return (
                <div
                  key={ing.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                    ing.isActive 
                      ? 'bg-slate-900/60 border-white/10 hover:border-amber-500/40 shadow-xl' 
                      : 'bg-slate-950/40 border-white/5 opacity-60'
                  }`}
                >
                  <div>
                    {/* Header with color swatch and category */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl border border-white/20 shadow-md flex items-center justify-center shrink-0"
                          style={{ backgroundColor: ing.color || '#3E2723' }}
                          title={`Visual layer color: ${ing.color}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-white/60" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white leading-tight">
                            {ing.name}
                          </h3>
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border mt-1 ${CATEGORY_LABELS[ing.category]?.color || 'bg-white/10 text-white'}`}>
                            {CATEGORY_LABELS[ing.category]?.label || ing.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onUpdateIngredient(ing.id, { isActive: !ing.isActive })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          ing.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {ing.isActive ? 'Active' : 'Off'}
                      </button>
                    </div>

                    {ing.description && (
                      <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                        {ing.description}
                      </p>
                    )}

                    {/* Costing & Capacity stats */}
                    <div className="grid grid-cols-3 gap-2 bg-black/30 p-3 rounded-2xl border border-white/5 mb-4 text-center">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Unit Price</span>
                        <span className="text-xs font-black text-amber-400">₱{ing.pricePerUnit}</span>
                        <span className="text-[9px] text-slate-400 block">/{ing.unit}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Unit Cost</span>
                        <span className="text-xs font-black text-slate-300">₱{ing.costPerUnit}</span>
                        <span className="text-[9px] text-emerald-400 block font-bold">+{profitMargin}%</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Volume</span>
                        <span className="text-xs font-black text-cyan-400">{ing.volumeOz} oz</span>
                        <span className="text-[9px] text-slate-400 block">per {ing.unit}</span>
                      </div>
                    </div>

                    {/* Portion Limit & Inventory */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mb-4">
                      <span>Portion: <strong>{ing.minPortion} - {ing.maxPortion} {ing.unit}</strong> (step: {ing.stepPortion})</span>
                      <span className="text-slate-300 font-bold">Stock: {ing.inventoryStock} {ing.inventoryUnit || ing.unit}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleOpenEditIngredient(ing)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ingredient "${ing.name}"?`)) {
                          onDeleteIngredient(ing.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                      title="Delete ingredient"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'bases' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bases.map(base => {
              // Calculate total volume and price
              let totalVolOz = 0;
              let totalPrice = 40; // Default base fee
              let totalCost = 0;

              base.items.forEach(it => {
                const ing = ingredients.find(i => i.id === it.ingredientId);
                if (ing) {
                  totalVolOz += (ing.volumeOz || 1) * it.quantity;
                  totalPrice += (ing.pricePerUnit || 0) * it.quantity;
                  totalCost += (ing.costPerUnit || 0) * it.quantity;
                }
              });

              return (
                <div
                  key={base.id}
                  className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                    base.isActive 
                      ? 'bg-slate-900/60 border-white/10 hover:border-amber-500/40 shadow-xl' 
                      : 'bg-slate-950/40 border-white/5 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {base.categoryTag || 'Drink Base'}
                        </span>
                        <h3 className="text-base font-black text-white mt-1.5 leading-tight">
                          {base.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => onUpdateBase(base.id, { isActive: !base.isActive })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          base.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {base.isActive ? 'Active' : 'Off'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                      {base.description || 'Pre-formulated starter recipe for customer mixology.'}
                    </p>

                    {/* Ingredients summary */}
                    <div className="space-y-1.5 bg-black/30 p-3 rounded-2xl border border-white/5 mb-4">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                        Starter Formula:
                      </span>
                      {base.items.map((it, idx) => {
                        const ing = ingredients.find(i => i.id === it.ingredientId);
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                            <span className="flex items-center gap-2">
                              <span 
                                className="w-2 h-2 rounded-full shrink-0" 
                                style={{ backgroundColor: ing?.color || '#3E2723' }} 
                              />
                              {ing?.name || 'Unknown Ingredient'}
                            </span>
                            <span className="font-bold text-amber-400">
                              {it.quantity} {ing?.unit || 'oz'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-2xl text-center mb-4">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Est. Price</span>
                        <span className="text-xs font-black text-amber-400">₱{totalPrice}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Est. Cost</span>
                        <span className="text-xs font-black text-slate-300">₱{totalCost}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Capacity</span>
                        <span className="text-xs font-black text-cyan-400">{totalVolOz} oz</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleOpenEditBase(base)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Recipe</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete base preset "${base.name}"?`)) {
                          onDeleteBase(base.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                      title="Delete preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'cup_sizes' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 rounded-3xl border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">
                  Dynamic Cup Sizes & Stock Availability
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Control the cup volumes, base fees, and toggle instant availability (In Stock / Out of Stock) for customer drink formulations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                Active in Store: <strong className="text-emerald-400">{cupSizes.filter(c => c.isActive !== false).length}</strong> / {cupSizes.length}
              </span>
            </div>
          </div>

          {/* Cup Sizes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cupSizes.map(cup => {
              const isAvailable = cup.isActive !== false;
              return (
                <div
                  key={cup.id}
                  className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                    isAvailable
                      ? 'bg-slate-900/60 border-white/10 hover:border-amber-500/40 shadow-xl'
                      : 'bg-slate-950/40 border-rose-500/20 opacity-75'
                  }`}
                >
                  <div>
                    {/* Header with capacity badge and availability toggle */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border font-black text-sm shrink-0 ${
                          isAvailable
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        }`}>
                          {cup.capacityOz}oz
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white leading-tight">
                              {cup.name}
                            </h3>
                            {cup.isDefault && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-medium mt-0.5 block">
                            Volume: {cup.capacityOz} fluid ounces
                          </span>
                        </div>
                      </div>

                      {/* Quick Availability Toggle */}
                      <button
                        onClick={() => handleToggleCupActive(cup)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 active:scale-95 ${
                          isAvailable
                            ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-400'
                        }`}
                        title="Click to toggle availability"
                      >
                        <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        <span>{isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                      </button>
                    </div>

                    {/* Pricing breakdown */}
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1 mb-5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Base Cup Fee:</span>
                        <span className="font-black text-amber-400 text-sm">₱{cup.basePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Includes cup, ice & initial lab prep</span>
                        <span>{isAvailable ? 'Customer orderable' : 'Disabled in Studio'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      {!cup.isDefault && (
                        <button
                          onClick={() => handleSetDefaultCup(cup)}
                          className="text-[10px] font-bold text-slate-400 hover:text-amber-400 uppercase tracking-wider flex items-center gap-1 transition-colors"
                        >
                          <Star className="w-3 h-3" />
                          <span>Set as Default</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditCup(cup)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete cup size "${cup.name}"?`)) {
                            if (onDeleteCupSize) onDeleteCupSize(cup.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                        title="Delete cup size"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>

      {/* Ingredient Modal */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Droplets className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  {editingIngredientId ? 'Edit Ingredient' : 'New Lab Ingredient'}
                </h3>
              </div>
              <button
                onClick={() => setIsIngredientModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Ingredient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ingredientForm.name}
                    onChange={e => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                    placeholder="e.g. Ceremonial Uji Matcha Shot"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={ingredientForm.category}
                    onChange={e => setIngredientForm({ ...ingredientForm, category: e.target.value as YourMixIngredientCategory })}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  >
                    {(Object.keys(CATEGORY_LABELS) as YourMixIngredientCategory[]).map(catKey => (
                      <option key={catKey} value={catKey} className="bg-slate-900 text-white">
                        {CATEGORY_LABELS[catKey].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit, Volume Oz & Pricing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/30 p-4 rounded-2xl border border-white/5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Unit
                  </label>
                  <select
                    value={ingredientForm.unit}
                    onChange={e => setIngredientForm({ ...ingredientForm, unit: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="oz">oz (ounce)</option>
                    <option value="g">g (grams)</option>
                    <option value="pump">pump</option>
                    <option value="scoop">scoop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Vol In Cup (oz)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={ingredientForm.volumeOz}
                    onChange={e => setIngredientForm({ ...ingredientForm, volumeOz: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-cyan-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Selling Price (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={ingredientForm.pricePerUnit}
                    onChange={e => setIngredientForm({ ...ingredientForm, pricePerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Unit Cost (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={ingredientForm.costPerUnit}
                    onChange={e => setIngredientForm({ ...ingredientForm, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Portion Limits & Layer Visuals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Portion Limits For Customer
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold uppercase">Min</label>
                      <input
                        type="number"
                        min="0"
                        value={ingredientForm.minPortion}
                        onChange={e => setIngredientForm({ ...ingredientForm, minPortion: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold uppercase">Max</label>
                      <input
                        type="number"
                        min="1"
                        value={ingredientForm.maxPortion}
                        onChange={e => setIngredientForm({ ...ingredientForm, maxPortion: parseFloat(e.target.value) || 1 })}
                        className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold uppercase">Step</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={ingredientForm.stepPortion}
                        onChange={e => setIngredientForm({ ...ingredientForm, stepPortion: parseFloat(e.target.value) || 1 })}
                        className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Visual Liquid Simulation
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold uppercase">Layer Type</label>
                      <select
                        value={ingredientForm.layerType}
                        onChange={e => setIngredientForm({ ...ingredientForm, layerType: e.target.value as any })}
                        className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white"
                      >
                        <option value="liquid">Liquid Layer</option>
                        <option value="ice">Ice Cubes</option>
                        <option value="bottom_solid">Bottom Boba / Jelly</option>
                        <option value="top_solid">Top Whipped Cream</option>
                        <option value="foam">Cold Foam Top</option>
                        <option value="powder">Powder Dust</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold uppercase">Layer Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={ingredientForm.color}
                          onChange={e => setIngredientForm({ ...ingredientForm, color: e.target.value })}
                          className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={ingredientForm.color}
                          onChange={e => setIngredientForm({ ...ingredientForm, color: e.target.value })}
                          className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Inventory */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Inventory Stock ({ingredientForm.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ingredientForm.inventoryStock}
                    onChange={e => setIngredientForm({ ...ingredientForm, inventoryStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setIngredientForm({ ...ingredientForm, isActive: !ingredientForm.isActive })}
                    className={`w-full py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      ingredientForm.isActive ? 'bg-emerald-500 text-white' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {ingredientForm.isActive ? 'Active (In Menu)' : 'Disabled / Hidden'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Flavor Description
                </label>
                <textarea
                  value={ingredientForm.description || ''}
                  onChange={e => setIngredientForm({ ...ingredientForm, description: e.target.value })}
                  placeholder="Describe flavor notes for customer guidance..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsIngredientModalOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  {editingIngredientId ? 'Save Changes' : 'Create Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Base Preset Modal */}
      {isBaseModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  {editingBaseId ? 'Edit Starting Base Preset' : 'New Starting Base Preset'}
                </h3>
              </div>
              <button
                onClick={() => setIsBaseModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBase} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Preset Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={baseForm.name}
                    onChange={e => setBaseForm({ ...baseForm, name: e.target.value })}
                    placeholder="e.g. Iced Latte Base"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Category Tag (e.g. Latte Base)
                  </label>
                  <input
                    type="text"
                    value={baseForm.categoryTag}
                    onChange={e => setBaseForm({ ...baseForm, categoryTag: e.target.value })}
                    placeholder="e.g. Matcha Base"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={baseForm.description}
                  onChange={e => setBaseForm({ ...baseForm, description: e.target.value })}
                  placeholder="Explain what this starter base provides..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Ingredients in this base */}
              <div className="space-y-3 bg-black/30 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                  Select Starter Ingredients & Portions
                </span>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                  {ingredients.map(ing => {
                    const item = baseForm.items.find(it => it.ingredientId === ing.id);
                    const isSelected = !!item;

                    return (
                      <div
                        key={ing.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          isSelected ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900/60 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleBaseIngredient(ing.id)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-white/20 bg-black/40'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: ing.color || '#3E2723' }}
                          />
                          <span className="text-xs font-bold text-white">
                            {ing.name}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Portion:</span>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={item.quantity}
                              onChange={e => handleUpdateBaseIngredientQty(ing.id, parseFloat(e.target.value) || 1)}
                              className="w-16 p-1.5 bg-slate-950 border border-white/20 rounded-lg text-xs font-black text-amber-400 text-center"
                            />
                            <span className="text-xs text-slate-400 font-bold">{ing.unit}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsBaseModalOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  {editingBaseId ? 'Save Preset' : 'Create Preset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cup Size Modal */}
      {isCupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Coffee className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white">
                  {editingCupId ? 'Edit Cup Size' : 'Add New Cup Size'}
                </h3>
              </div>
              <button
                onClick={() => setIsCupModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCupSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Cup Size Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 16 oz (Standard Lab Cup)"
                  value={cupForm.name}
                  onChange={e => setCupForm({ ...cupForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 focus:border-amber-500 rounded-2xl text-xs font-bold text-white focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Capacity (oz)
                  </label>
                  <input
                    type="number"
                    required
                    min="4"
                    max="64"
                    step="1"
                    value={cupForm.capacityOz}
                    onChange={e => setCupForm({ ...cupForm, capacityOz: parseFloat(e.target.value) || 16 })}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 focus:border-amber-500 rounded-2xl text-xs font-bold text-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Base Fee (₱)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={cupForm.basePrice}
                    onChange={e => setCupForm({ ...cupForm, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 focus:border-amber-500 rounded-2xl text-xs font-bold text-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cupForm.isActive}
                    onChange={e => setCupForm({ ...cupForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20 bg-slate-950 border-white/20"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Available in Store (In Stock)</span>
                    <span className="text-[10px] text-slate-400 block">Customers can formulate drinks in this cup size</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cupForm.isDefault}
                    onChange={e => setCupForm({ ...cupForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20 bg-slate-950 border-white/20"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Default Selected Cup Size</span>
                    <span className="text-[10px] text-slate-400 block">Automatically selected when customer opens the studio</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCupModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  {editingCupId ? 'Save Changes' : 'Create Cup Size'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
