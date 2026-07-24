import React, { useState, useMemo, useCallback } from 'react';
import { Product, CartItem, Order, ProductSize, Addon, SugarLevel, ShopSettings, DynamicCategory } from '../types';
import { Coffee, Minus, Plus, ShoppingBag, X, Check, Store, ArrowRight, Search, ChevronDown, Flame, Sparkles, Layout, IceCream } from 'lucide-react';
import MagicBento from './MagicBento';
import { CategorySidebar } from './CategorySidebar';
import { ProductCard } from './ProductCard';

interface OrderingScreenProps {
  mode: 'pos' | 'kiosk' | 'mobile';
  menu: Product[];
  addons?: Addon[];
  onPlaceOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => void;
  searchQuery?: string;
  shopSettings?: ShopSettings | null;
  categoriesData?: DynamicCategory[];
}

export function OrderingScreen({ mode, menu, addons = [], onPlaceOrder, searchQuery = '', shopSettings, categoriesData }: OrderingScreenProps) {
  const categories = useMemo(() => {
    let list: string[] = [];
    if (categoriesData && categoriesData.length > 0) {
      // First, get all active categories
      list = categoriesData.filter(c => c.isActive !== false).map(c => c.name);
      
      // We also need all configured categories (even hidden) to avoid accidentally adding them back
      const allConfiguredCategories = categoriesData.map(c => c.name);
      
      // Also include categories from products that might not be in categoriesData
      const productCats = Array.from(new Set(menu.map(p => p.category)));
      productCats.forEach(pCat => {
        const pCatLower = (pCat || '').trim().toLowerCase();
        
        const isCovered = allConfiguredCategories.some(cName => {
          const cNameLower = cName.trim().toLowerCase();
          if (cNameLower === pCatLower) return true;
          
          const pParts = pCatLower.split('/').map(s => s.trim());
          if (pParts.includes(cNameLower)) return true;
          
          const cParts = cNameLower.split('/').map(s => s.trim());
          return cParts.some(cp => pParts.includes(cp) || pCatLower === cp);
        });
        
        // Only add if it's not configured AT ALL. If it's configured and hidden, skip it.
        if (!isCovered && pCat && pCat.trim()) {
          list.push(pCat.trim());
        }
      });
    } else {
      list = Array.from(new Set(menu.map(p => p.category)));
      if (list.length === 0) {
        list = ['Hot Coffee', 'Cold Coffee', 'Tea', 'Food'];
      }
    }
    
    // Show all configured categories, plus any implied by products
    return list;
  }, [categoriesData, menu]);

  const [activeCategory, setActiveCategory] = useState<string>(categories[0] || '');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('All');

  // Keep activeCategory in sync with available categories
  React.useEffect(() => {
    if (categories.length > 0) {
      const exists = categories.some(c => c.trim().toLowerCase() === activeCategory.trim().toLowerCase());
      if (!exists) {
        setActiveCategory(categories[0]);
      }
    } else {
      setActiveCategory('');
    }
  }, [categories, activeCategory]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'take-away' | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isKioskCartOpen, setIsKioskCartOpen] = useState(false);
  const [isPosCartDrawerOpen, setIsPosCartDrawerOpen] = useState(false);
  const [gridColumns, setGridColumns] = useState<number>(shopSettings?.gridColumns || 5);
  const [selectedProductForConfig, setSelectedProductForConfig] = useState<Product | null>(null);

  // Sync grid columns if shopSettings change
  React.useEffect(() => {
    if (shopSettings?.gridColumns) {
      setGridColumns(shopSettings.gridColumns);
    }
  }, [shopSettings?.gridColumns]);

  const [selectedSizeConfig, setSelectedSizeConfig] = useState<ProductSize | null>(null);
  const [selectedSugarConfig, setSelectedSugarConfig] = useState<SugarLevel>('100%');
  const [selectedAddonsConfig, setSelectedAddonsConfig] = useState<Addon[]>([]);

  // Category Change Handler
  const handleCategoryChange = useCallback((cat: string) => {
    setActiveCategory(cat);
    setActiveSubCategory('All');
  }, []);

  const isProductBeverage = (product: Product) => {
    const categoryLower = (product.category || '').toLowerCase();
    const nameLower = (product.name || '').toLowerCase();
    if (categoryLower.includes('food') || categoryLower.includes('pastry') || categoryLower.includes('dessert') || categoryLower.includes('meal') || categoryLower.includes('snack')) {
      return false; 
    }
    return ['coffee', 'tea', 'drink', 'beverage', 'iced', 'hot', 'latte', 'americano', 'matcha', 'macchiato', 'espresso', 'cappuccino'].some(keyword => 
      categoryLower.includes(keyword) || nameLower.includes(keyword)
    ) || !!product.isCustomizable;
  };

  const addToCart = useCallback((product: Product, size?: ProductSize, sugarLevel?: SugarLevel, selectedAddons?: Addon[]) => {
    const basePrice = size ? size.price : product.price;
    const addonsPrice = selectedAddons ? selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
    const finalPrice = basePrice + addonsPrice;
    
    const cartId = Math.random().toString(36).substr(2, 9);
    
    setCart((prev) => {
      // Check for identical item (same size, sugar, and addons)
      const existingIndex = prev.findIndex(ci => 
        ci.id === product.id && 
        ci.selectedSize?.name === size?.name &&
        ci.sugarLevel === sugarLevel &&
        JSON.stringify(ci.selectedAddons?.map(a => a.id).sort()) === JSON.stringify(selectedAddons?.map(a => a.id).sort())
      );
      if (existingIndex > -1) {
        return prev.map((ci, idx) => idx === existingIndex ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { ...product, cartId, quantity: 1, notes: '', selectedSize: size, price: finalPrice, sugarLevel, selectedAddons }];
    });
  }, []);

  // Product Click Handler
  const handleProductClick = useCallback((product: Product) => {
    if ((product.sizes && product.sizes.length > 0) || product.isCustomizable || isProductBeverage(product)) {
      setSelectedProductForConfig(product);
      setSelectedSizeConfig(product.sizes && product.sizes.length > 0 ? product.sizes[0] : null);
      setSelectedSugarConfig('100%');
      setSelectedAddonsConfig([]);
    } else {
      addToCart(product);
    }
  }, [addToCart]);

  const handleConfigSubmit = () => {
    if (selectedProductForConfig) {
      const isBev = isProductBeverage(selectedProductForConfig);
      addToCart(
        selectedProductForConfig, 
        selectedSizeConfig || undefined, 
        isBev ? selectedSugarConfig : undefined, 
        isBev ? selectedAddonsConfig : undefined
      );
      setSelectedProductForConfig(null);
    }
  };

  const toggleAddon = (addon: Addon) => {
    setSelectedAddonsConfig(prev => {
      const isSelected = prev.some(a => a.id === addon.id);
      if (isSelected) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId === cartId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const availableSubCategories = useMemo(() => {
    if (!activeCategory) return ['All'];
    const activeCatLower = (activeCategory || '').trim().toLowerCase();
    const catItems = menu.filter(item => {
      const itemCatLower = (item.category || '').trim().toLowerCase();
      if (itemCatLower === activeCatLower) return true;
      const productParts = itemCatLower.split('/').map(s => s.trim());
      if (productParts.includes(activeCatLower)) return true;
      const activeParts = activeCatLower.split('/').map(s => s.trim());
      return activeParts.some(ap => productParts.includes(ap) || itemCatLower === ap);
    });
    
    const subCats = new Set<string>();
    catItems.forEach(item => {
      if (item.subCategory && item.subCategory.trim()) {
        subCats.add(item.subCategory.trim());
      }
    });
    return ['All', ...Array.from(subCats).sort()];
  }, [menu, activeCategory]);

  const filteredMenu = useMemo(() => {
    if (searchQuery) {
      return menu.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    const activeCatLower = (activeCategory || '').trim().toLowerCase();
    const catFiltered = menu.filter(item => {
      const itemCatLower = (item.category || '').trim().toLowerCase();
      if (itemCatLower === activeCatLower) return true;
      
      // Support slash-separated combined categories (e.g., "Matcha/Non-Coffee" matches "Non-Coffee")
      const productParts = itemCatLower.split('/').map(s => s.trim());
      if (productParts.includes(activeCatLower)) return true;
      
      const activeParts = activeCatLower.split('/').map(s => s.trim());
      return activeParts.some(ap => productParts.includes(ap) || itemCatLower === ap);
    });
    
    if (activeSubCategory === 'All') {
      return catFiltered;
    }
    
    return catFiltered.filter(item => 
      (item.subCategory || '').trim().toLowerCase() === activeSubCategory.toLowerCase()
    );
  }, [menu, searchQuery, activeCategory, activeSubCategory]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Ensure we have a default order type if not set
    const finalOrderType = orderType || 'take-away';
    
    onPlaceOrder({
      items: cart,
      total,
      source: mode,
      customerName: customerName.trim() || 'Guest',
      tableNumber: finalOrderType === 'dine-in' ? (tableNumber || undefined) : undefined,
      orderType: finalOrderType,
    });
    setCart([]);
    setCustomerName('');
    setTableNumber('');
    setOrderType(null);
    setIsMobileCartOpen(false);
    setIsKioskCartOpen(false);
    setIsPosCartDrawerOpen(false);
  };

  if (mode === 'kiosk' && !orderType) {
    return (
      <div className="fixed inset-0 z-[100] bg-transparent flex flex-col items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse delay-700" />
          <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        </div>
        <div 
          className="relative z-10 text-center mb-16"
        >
          <div className="w-24 h-24 bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-12 h-12 text-amber-500" />
          </div>
          <h1 className="text-7xl font-black text-foreground mb-6 uppercase italic tracking-tighter leading-none">
            Welcome to <span className="text-amber-500">Astro</span> Coffee
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-2xl font-bold uppercase tracking-[0.3em]">Select your experience</p>
        </div>

        <div className="grid grid-cols-2 gap-12 w-full max-w-5xl relative z-10">
          <button
            onClick={() => setOrderType('dine-in')}
            className="flex flex-col items-center gap-10 bg-white dark:bg-slate-900 shadow-2xl p-16 rounded-[4rem] group transition-all hover:shadow-amber-500/10 border-2 border-slate-100 dark:border-white/5 hover:border-amber-500/50"
          >
            <div className="w-48 h-48 bg-amber-500/5 rounded-full flex items-center justify-center group-hover:bg-amber-500/10 transition-all group-hover:scale-110 shadow-inner">
              <Store className="w-24 h-24 text-amber-500" />
            </div>
            <div className="text-center">
              <span className="text-5xl font-black text-foreground block mb-2 uppercase italic tracking-tighter group-hover:text-amber-500 transition-colors">Dine In</span>
              <span className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-[0.4em] text-sm">Station Experience</span>
            </div>
          </button>

          <button
            onClick={() => setOrderType('take-away')}
            className="flex flex-col items-center gap-10 bg-white dark:bg-slate-900 shadow-2xl p-16 rounded-[4rem] group transition-all hover:shadow-amber-500/10 border-2 border-slate-100 dark:border-white/5 hover:border-amber-500/50"
          >
            <div className="w-48 h-48 bg-amber-500/5 rounded-full flex items-center justify-center group-hover:bg-amber-500/10 transition-all group-hover:scale-110 shadow-inner">
              <ShoppingBag className="w-24 h-24 text-amber-500" />
            </div>
            <div className="text-center">
              <span className="text-5xl font-black text-foreground block mb-2 uppercase italic tracking-tighter group-hover:text-amber-500 transition-colors">Take Out</span>
              <span className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-[0.4em] text-sm">Orbit Ready</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const containerClasses = {
    pos: 'flex h-screen overflow-hidden bg-transparent',
    kiosk: 'flex h-screen w-screen bg-transparent overflow-hidden border-black/10 dark:border-white/5',
    mobile: 'flex flex-col h-screen w-full bg-transparent relative',
  };

  const getMobileGridClasses = (configuredCols: number) => {
    if (configuredCols <= 1) return 'grid-cols-1';
    if (configuredCols === 2) return 'grid-cols-2';
    if (configuredCols === 3) return 'grid-cols-2 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
  };

  const gridColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
  };

  const lgGridColsMap: Record<number, string> = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
    7: 'lg:grid-cols-7',
    8: 'lg:grid-cols-8',
  };

  const renderMenuGrid = () => (
    <div className={`flex-1 overflow-hidden flex ${mode !== 'pos' ? 'flex-row' : 'flex-col'}`}>
      {/* Sidebar Navigation for Kiosk/Mobile */}
      {mode !== 'pos' && (
        <CategorySidebar 
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={handleCategoryChange}
          mode={mode}
          categoriesData={categoriesData}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {/* Horizontal Categories for POS only */}
        {mode === 'pos' && (
          <div className="p-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-white/5 flex gap-2.5 overflow-x-auto shrink-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-slate-900 dark:text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-100 dark:border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 lg:p-12 scrollbar-hide ${mode === 'mobile' ? 'pb-32' : ''}`}>
          <div className="w-full max-w-[1600px] mx-auto">
            <header className={`${mode === 'mobile' ? 'mb-4 flex items-center px-1' : 'mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6'}`}>
              <div className={`${mode === 'mobile' ? 'flex items-center gap-2' : 'flex flex-col'}`}>
                {mode === 'mobile' ? (
                  <>
                    <div className="w-1 h-5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {searchQuery ? 'Search Results' : activeCategory}
                    </h2>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-amber-500/20">
                        Catalog
                      </div>
                      <div className="h-[1px] flex-1 bg-slate-200" />
                    </div>
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground uppercase italic tracking-tighter leading-[0.85] flex flex-wrap items-baseline gap-x-4">
                      {searchQuery ? 'Results' : activeCategory.split(' ')[0]}
                      {!searchQuery && activeCategory.split(' ')[1] && (
                        <span className="text-slate-700 dark:text-slate-300 not-italic font-medium text-4xl md:text-5xl lg:text-6xl">{activeCategory.split(' ')[1]}</span>
                      )}
                    </h2>
                    <div className="flex items-center gap-3 mt-6">
                      <div className="h-1.5 w-16 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)]" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                        {filteredMenu.length} items available
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className={`${mode === 'mobile' ? 'hidden' : 'flex items-center gap-4'}`}>
                {/* Column Toggle - POS/Kiosk Only */}
                {mode !== 'mobile' && !searchQuery && (
                  <div className="flex flex-col items-end gap-2 pl-4 border-l border-slate-200">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">Layout</span>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {[4, 5, 6].map((cols) => (
                        <button
                          key={cols}
                          onClick={() => setGridColumns(cols as 4 | 5 | 6)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-black transition-all ${
                            gridColumns === cols
                              ? 'bg-amber-500 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
                              : 'text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-white'
                          }`}
                        >
                          {cols}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </header>

            {availableSubCategories.length > 1 && !searchQuery && (
              <div className="flex flex-wrap gap-2 mb-8 animate-in fade-in slide-in-from-top-4">
                {availableSubCategories.map(subCat => (
                  <button
                    key={subCat}
                    onClick={() => setActiveSubCategory(subCat)}
                    className={`px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                      activeSubCategory === subCat
                        ? 'bg-amber-500 text-slate-900 shadow-md'
                        : 'bg-white dark:bg-[#111115] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:border-amber-500/50'
                    }`}
                  >
                    {subCat}
                  </button>
                ))}
              </div>
            )}

            {filteredMenu.length === 0 ? (
              <div className="py-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-900 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-slate-200 dark:border-white/5 shadow-inner">
                  <Search className="w-12 h-12 text-slate-700 dark:text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter mb-4">No Galactic Findings</h3>
                <p className="text-slate-600 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs max-w-xs mx-auto">Our sensors couldn't locate any matching items in this sector.</p>
              </div>
            ) : (
              <div 
                className={`grid ${
                  mode === 'mobile' ? `${getMobileGridClasses(shopSettings?.mobileGridColumns || 3)} gap-1.5` : 
                  `gap-3 md:gap-4 lg:gap-5 grid-cols-2 ${lgGridColsMap[gridColumns] || 'lg:grid-cols-5'}`
                }`}
                key={searchQuery ? 'search' : activeCategory}
              >
                {filteredMenu.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    mode={mode}
                    cartCount={cart.filter(c => c.id === item.id).reduce((sum, item) => sum + item.quantity, 0)}
                    onClick={handleProductClick}
                  />
                ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="flex flex-col h-full bg-white/95 dark:bg-[#0D0F14]/95 backdrop-blur-2xl text-slate-900 dark:text-white">
      <div className="p-6 border-b border-black/10 dark:border-white/5 bg-slate-50/80 dark:bg-[#131722]/80 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter italic">
          <ShoppingBag className="w-5 h-5 text-amber-500" />
          Order Orbit
        </h2>
        {(mode === 'mobile' || mode === 'kiosk' || isPosCartDrawerOpen) && (
          <button onClick={() => {
            setIsMobileCartOpen(false);
            setIsKioskCartOpen(false);
            setIsPosCartDrawerOpen(false);
          }} className="p-2 text-slate-500 dark:text-white/40 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-white/40 space-y-4">
              <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10 opacity-50">
                <Coffee className="w-10 h-10 text-amber-500" />
              </div>
              <p className="font-black uppercase tracking-[0.3em] text-[10px]">Your orbit is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartId}
                className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-3xl shadow-sm group hover:border-amber-500/30 transition-all"
              >
                <div className="flex-1 pr-4">
                  <div className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight group-hover:text-amber-500 transition-colors">
                    {item.name}
                    {item.selectedSize && (
                      <span className="ml-2 text-[9px] text-amber-500 font-black bg-amber-500/10 px-2 py-0.5 rounded-full uppercase border border-amber-500/20">
                        {item.selectedSize.name}
                      </span>
                    )}
                  </div>
                  {(item.sugarLevel || (item.selectedAddons && item.selectedAddons.length > 0)) && (
                    <div className="text-[10px] text-slate-500 dark:text-white/40 font-bold uppercase tracking-widest mt-1 space-y-0.5">
                      {item.sugarLevel && <div>Sugar: {item.sugarLevel}</div>}
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-amber-500/60">+ {item.selectedAddons.map(a => a.name).join(', ')}</div>
                      )}
                    </div>
                  )}
                  <div className="text-slate-900 dark:text-white font-black text-xs mt-2">₱{(item.price * item.quantity).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-black/10 dark:border-white/10">
                  <button
                    onClick={() => updateQuantity(item.cartId, -1)}
                    className="p-2 bg-black/5 dark:bg-white/5 rounded-xl text-slate-600 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-black text-slate-900 dark:text-white text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartId, 1)}
                    className="p-2 bg-amber-500 text-black rounded-xl hover:bg-amber-400 shadow-lg transition-all active:scale-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
      </div>

      <div className="p-6 bg-slate-50/80 dark:bg-[#131722]/80 backdrop-blur-xl border-t border-black/10 dark:border-white/5 shrink-0">
        <div className="space-y-6 mb-8">
          <div className="flex gap-3">
            <button
              onClick={() => setOrderType('dine-in')}
              className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border ${orderType === 'dine-in' ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/10' : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 border-black/10 dark:border-white/5 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'}`}
            >
              <Store className="w-4 h-4" /> Dine-in
            </button>
            <button
              onClick={() => setOrderType('take-away')}
              className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border ${orderType === 'take-away' ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/10' : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 border-black/10 dark:border-white/5 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'}`}
            >
              <ShoppingBag className="w-4 h-4" /> Take-out
            </button>
          </div>

          <div className="relative group">
            <label className="block text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.3em] mb-2 ml-1">Reference Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 text-slate-900 dark:text-white text-sm font-bold transition-all placeholder:text-white/20"
              placeholder="Who is this for?"
            />
          </div>

          {orderType === 'dine-in' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 relative group">
              <label className="block text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.3em] mb-2 ml-1">Table Number</label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 text-slate-900 dark:text-white text-sm font-bold transition-all placeholder:text-white/20"
                placeholder="Station ID"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-8 px-2">
          <span className="text-slate-500 dark:text-white/40 font-black uppercase tracking-[0.2em] text-[10px]">Total Fuel</span>
          <span className="text-3xl font-black text-slate-900 dark:text-white italic">₱{total.toLocaleString()}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-black/5 dark:disabled:bg-white/10 disabled:text-black/30 dark:disabled:text-white/50 text-black py-5 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] mb-2"
        >
          {mode === 'mobile' ? 'Launch Order' : 'Checkout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className={containerClasses[mode]}>
      {/* Mobile/Kiosk local header removed as search moved to global header */}

      {/* Main Layout */}
      <div className={`${mode === 'kiosk' ? 'flex flex-col flex-1' : 'flex flex-1'} ${mode === 'mobile' ? 'overflow-hidden' : ''}`}>
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderMenuGrid()}
        </div>

        {/* Cart Area - Kiosk (Bottom Bar) */}
        {mode === 'kiosk' && (
          <div className="h-32 bg-white/90 dark:bg-[#0D0F14]/90 backdrop-blur-2xl border-t border-black/10 dark:border-white/5 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.5)] z-30 flex items-stretch px-8 py-5 gap-8">
            <button 
              onClick={() => {
                setCart([]);
                setOrderType(null);
              }}
              className="px-10 bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 rounded-[2rem] border border-black/10 dark:border-white/5 font-black text-xs uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-all flex items-center gap-3 active:scale-95"
            >
              <X className="w-5 h-5" />
              Abort
            </button>
            
            <div className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-[2.5rem] flex items-center px-10 shadow-inner group">
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/50 mb-1">Total Fuel</div>
                <div className="text-4xl font-black text-slate-900 dark:text-white italic">₱{total.toLocaleString()}</div>
              </div>
              <div className="flex -space-x-4 overflow-hidden py-2">
                 {cart.slice(0, 4).map((item, i) => (
                   <div key={item.cartId} className="relative transition-transform duration-300 group-hover:translate-x-2" style={{ zIndex: 10 - i }}>
                     <img 
                      src={item.image || undefined} 
                      className="w-14 h-14 rounded-full border-4 border-slate-900 shadow-xl object-cover" 
                      alt={item.name} 
                     />
                   </div>
                 ))}
                 {cart.length > 4 && (
                   <div className="w-14 h-14 rounded-full border-4 border-slate-900 bg-black/5 dark:bg-white/5 backdrop-blur-md flex items-center justify-center text-xs font-black text-slate-500 dark:text-white/40 shadow-xl relative z-0">
                     +{cart.length - 4}
                   </div>
                 )}
              </div>
            </div>

            <button 
              onClick={() => setIsKioskCartOpen(true)}
              disabled={cart.length === 0}
              className="px-16 bg-amber-500 hover:bg-amber-400 text-black rounded-[2.5rem] font-black text-2xl uppercase tracking-tighter italic hover:scale-[1.02] transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center gap-4"
            >
              Ignition
              <ArrowRight className="w-8 h-8" />
            </button>
          </div>
        )}

        {isKioskCartOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-slate-300 dark:bg-black/60 backdrop-blur-lg">
            <div className="bg-black/80 w-full max-w-3xl h-[85vh] rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] border-2 border-black/10 dark:border-white/5 flex flex-col animate-in zoom-in-95 duration-500">
              {renderCart()}
            </div>
          </div>
        )}
      </div>

      {/* Cart Area - Mobile & POS (Floating Button & Drawer) */}
      {(mode === 'mobile' || mode === 'pos') && (
        <>
          {cart.length > 0 && !isMobileCartOpen && !isPosCartDrawerOpen && (
            <button
              onClick={() => mode === 'mobile' ? setIsMobileCartOpen(true) : setIsPosCartDrawerOpen(true)}
              className="fixed bottom-8 right-8 z-[60] bg-white dark:bg-slate-900 text-black dark:text-white p-5 rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] flex items-center gap-4 group transition-all active:scale-95 animate-in fade-in zoom-in-95 duration-500 border border-black/10 dark:border-white/10"
            >
              <div className="relative">
                <ShoppingBag className="w-7 h-7" />
                <span className="absolute -top-3 -right-3 bg-amber-600 text-slate-900 dark:text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-black shadow-lg">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              </div>
              <div className="flex flex-col items-start pr-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 opacity-50">Fuel Check</span>
                <span className="font-black text-lg italic leading-none">₱{total.toLocaleString()}</span>
              </div>
            </button>
          )}

          {(isMobileCartOpen || isPosCartDrawerOpen) && (
              <div
                className="fixed inset-0 z-[70] flex flex-col justify-end bg-slate-300 dark:bg-black/60 backdrop-blur-md transition-all animate-in fade-in duration-500"
                onClick={() => {
                  setIsMobileCartOpen(false);
                  setIsPosCartDrawerOpen(false);
                }}
              >
                <div 
                  className={`bg-black/90 w-full ${mode === 'mobile' ? 'h-[90vh]' : 'max-w-md ml-auto h-full'} rounded-t-[3rem] md:rounded-t-none md:rounded-l-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] border-t border-black/10 dark:border-white/5 md:border-t-0 md:border-l border-black/10 dark:border-white/5 flex flex-col animate-in ${mode === 'mobile' ? 'slide-in-from-bottom' : 'slide-in-from-right'} duration-700`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex-1 overflow-hidden">
                    {renderCart()}
                  </div>
                </div>
              </div>
            )}
        </>
      )}
        {/* Customization Modal */}
        {selectedProductForConfig && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md"
          >
            <div
              className="bg-white dark:bg-[#0b1329] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-black/10 dark:border-white/10 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300"
            >
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
                <img src={selectedProductForConfig.image || undefined} alt={selectedProductForConfig.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1329] via-[#0b1329]/30 to-transparent" />
                <button 
                  onClick={() => setSelectedProductForConfig(null)}
                  className="absolute top-5 right-5 w-10 h-10 bg-white dark:bg-slate-950/50 backdrop-blur-md border border-white/15 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-950/80 transition-all active:scale-90 z-20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 sm:p-8 flex-1 overflow-y-auto scrollbar-hide space-y-6">
                <div>
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">{selectedProductForConfig.category}</div>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white mb-2 leading-tight">{selectedProductForConfig.name}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">{selectedProductForConfig.description}</p>
                </div>
                
                {selectedProductForConfig.sizes && selectedProductForConfig.sizes.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Size / Variant</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedProductForConfig.sizes.map((size) => {
                        const isSelected = selectedSizeConfig?.name === size.name;
                        return (
                          <button
                            key={size.name}
                            onClick={() => setSelectedSizeConfig(size)}
                            className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-200 active:scale-98 ${isSelected ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white shadow-sm' : 'border-black/10 dark:border-white/5 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-white/10 hover:bg-black/10 dark:hover:bg-white/10'}`}
                          >
                            <span className="font-bold uppercase text-xs sm:text-sm tracking-wider">{size.name}</span>
                            <span className="font-bold text-amber-400 text-xs sm:text-sm">₱{size.price.toLocaleString()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {isProductBeverage(selectedProductForConfig) && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Sugar Level</label>
                      <div className="grid grid-cols-5 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/10 dark:border-white/5 gap-1">
                        {(['0%', '25%', '50%', '75%', '100%'] as SugarLevel[]).map((level) => {
                          const isSelected = selectedSugarConfig === level;
                          return (
                            <button
                              key={level}
                              onClick={() => setSelectedSugarConfig(level)}
                              className={`py-2 rounded-xl text-xs font-semibold transition-all ${isSelected ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/10' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {addons.length > 0 && (
                      <div className="space-y-3">
                        <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Add-ons</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {addons.map((addon) => {
                            const isSelected = selectedAddonsConfig.some(a => a.id === addon.id);
                            return (
                              <button
                                key={addon.id}
                                onClick={() => toggleAddon(addon)}
                                className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-200 active:scale-98 ${isSelected ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white' : 'border-black/10 dark:border-white/5 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-white/10 hover:bg-black/10 dark:hover:bg-white/10'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${isSelected ? 'border-amber-500 bg-amber-500 text-black' : 'border-black/10 dark:border-white/10 bg-transparent'}`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </div>
                                  <span className="font-bold text-xs sm:text-sm uppercase tracking-wider text-left">{addon.name}</span>
                                </div>
                                <span className="font-bold text-amber-400 text-xs sm:text-sm">+₱{addon.price.toLocaleString()}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-6 sm:p-8 border-t border-black/10 dark:border-white/5 bg-white/95 dark:bg-[#0b1329]/95 backdrop-blur-md shrink-0">
                <button
                  onClick={handleConfigSubmit}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_8px_30px_rgba(245,158,11,0.25)] active:scale-98 flex items-center justify-center gap-2"
                >
                  Add to Order - ₱{((selectedSizeConfig ? selectedSizeConfig.price : selectedProductForConfig.price) + selectedAddonsConfig.reduce((sum, a) => sum + a.price, 0)).toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
