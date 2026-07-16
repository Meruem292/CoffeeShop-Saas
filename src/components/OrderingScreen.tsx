import React, { useState, useMemo } from 'react';
import { Product, CartItem, Order, ProductSize, Addon, SugarLevel } from '../types';
import { Coffee, Minus, Plus, ShoppingBag, X, Check, Store, ArrowRight, Search, ChevronDown, Flame, Sparkles, Layout, IceCream } from 'lucide-react';
import MagicBento from './MagicBento';

interface OrderingScreenProps {
  mode: 'pos' | 'kiosk' | 'mobile';
  menu: Product[];
  addons?: Addon[];
  onPlaceOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => void;
}

export function OrderingScreen({ mode, menu, addons = [], onPlaceOrder }: OrderingScreenProps) {
  const categories = useMemo(() => {
    const cats = Array.from(new Set(menu.map(p => p.category)));
    return cats.length > 0 ? cats : ['Hot Coffee', 'Cold Coffee', 'Tea', 'Food'];
  }, [menu]);

  const [activeCategory, setActiveCategory] = useState<string>(categories[0] || 'Hot Coffee');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'take-away' | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isKioskCartOpen, setIsKioskCartOpen] = useState(false);
  const [isPosCartDrawerOpen, setIsPosCartDrawerOpen] = useState(false);
  const [gridColumns, setGridColumns] = useState<4 | 5 | 6>(5);
  const [selectedProductForConfig, setSelectedProductForConfig] = useState<Product | null>(null);

  const [selectedSizeConfig, setSelectedSizeConfig] = useState<ProductSize | null>(null);
  const [selectedSugarConfig, setSelectedSugarConfig] = useState<SugarLevel>('100%');
  const [selectedAddonsConfig, setSelectedAddonsConfig] = useState<Addon[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync active category if it's no longer valid
  if (activeCategory && !categories.includes(activeCategory) && categories.length > 0) {
    setActiveCategory(categories[0]);
  }

  const isProductBeverage = (product: Product) => {
    const categoryLower = (product.category || '').toLowerCase();
    const nameLower = (product.name || '').toLowerCase();
    return ['coffee', 'tea', 'drink', 'beverage', 'iced', 'hot', 'latte', 'americano', 'matcha', 'macchiato', 'espresso', 'cappuccino'].some(keyword => 
      categoryLower.includes(keyword) || nameLower.includes(keyword)
    ) || !!product.isCustomizable;
  };

  const handleProductClick = (product: Product) => {
    if ((product.sizes && product.sizes.length > 0) || product.isCustomizable || isProductBeverage(product)) {
      setSelectedProductForConfig(product);
      setSelectedSizeConfig(product.sizes && product.sizes.length > 0 ? product.sizes[0] : null);
      setSelectedSugarConfig('100%');
      setSelectedAddonsConfig([]);
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product: Product, size?: ProductSize, sugarLevel?: SugarLevel, selectedAddons?: Addon[]) => {
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
  };

  const handleConfigSubmit = () => {
    if (selectedProductForConfig) {
      addToCart(
        selectedProductForConfig, 
        selectedSizeConfig || undefined, 
        selectedProductForConfig.isCustomizable ? selectedSugarConfig : undefined, 
        selectedProductForConfig.isCustomizable ? selectedAddonsConfig : undefined
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

  const filteredMenu = useMemo(() => {
    if (searchQuery) {
      return menu.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return menu.filter(item => item.category === activeCategory);
  }, [menu, searchQuery, activeCategory]);

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
          <h1 className="text-7xl font-black text-white mb-6 uppercase italic tracking-tighter leading-none">
            Welcome to <span className="text-amber-500">Astro</span> Coffee
          </h1>
          <p className="text-coffee-400 text-2xl font-bold uppercase tracking-[0.3em]">Select your experience</p>
        </div>

        <div className="grid grid-cols-2 gap-12 w-full max-w-5xl relative z-10">
          <button
            onClick={() => setOrderType('dine-in')}
            className="flex flex-col items-center gap-10 bg-white/5 backdrop-blur-xl p-16 rounded-[4rem] shadow-2xl group transition-all hover:bg-white/10 border-2 border-white/5 hover:border-amber-500/50"
          >
            <div className="w-48 h-48 bg-amber-500/10 rounded-full flex items-center justify-center group-hover:bg-amber-500/20 transition-all group-hover:scale-110 shadow-inner">
              <Store className="w-24 h-24 text-amber-500" />
            </div>
            <div className="text-center">
              <span className="text-5xl font-black text-white block mb-2 uppercase italic tracking-tighter group-hover:text-amber-500 transition-colors">Dine In</span>
              <span className="text-coffee-500 font-bold uppercase tracking-[0.4em] text-sm">Station Experience</span>
            </div>
          </button>

          <button
            onClick={() => setOrderType('take-away')}
            className="flex flex-col items-center gap-10 bg-white/5 backdrop-blur-xl p-16 rounded-[4rem] shadow-2xl group transition-all hover:bg-white/10 border-2 border-white/5 hover:border-amber-500/50"
          >
            <div className="w-48 h-48 bg-amber-500/10 rounded-full flex items-center justify-center group-hover:bg-amber-500/20 transition-all group-hover:scale-110 shadow-inner">
              <ShoppingBag className="w-24 h-24 text-amber-500" />
            </div>
            <div className="text-center">
              <span className="text-5xl font-black text-white block mb-2 uppercase italic tracking-tighter group-hover:text-amber-500 transition-colors">Take Out</span>
              <span className="text-coffee-500 font-bold uppercase tracking-[0.4em] text-sm">Orbit Ready</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const containerClasses = {
    pos: 'flex h-screen overflow-hidden bg-transparent',
    kiosk: 'flex h-screen w-screen bg-transparent overflow-hidden border-white/5',
    mobile: 'flex flex-col h-screen w-full bg-transparent relative',
  };

  const renderMenuGrid = () => (
    <div className={`flex-1 overflow-hidden flex ${mode !== 'pos' ? 'flex-row' : 'flex-col'}`}>
      {/* Sidebar Navigation for Kiosk/Mobile */}
      {mode !== 'pos' && (
        <div className={`flex flex-col py-4 md:py-8 overflow-y-auto scrollbar-hide shrink-0 z-20 transition-all ${mode === 'mobile' ? 'w-[72px] md:w-20 bg-black/20 backdrop-blur-xl border-r border-white/5 gap-2' : 'w-20 md:w-28 lg:w-32 bg-black/40 backdrop-blur-2xl shadow-2xl gap-4 md:gap-6 border-r border-white/5'}`}>
          {mode !== 'mobile' && (
            <div className="flex flex-col items-center gap-1 mb-6 opacity-90">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl border border-white/10 flex items-center justify-center bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
              </div>
              <span className="text-[8px] md:text-[10px] text-coffee-400 uppercase font-black tracking-[0.4em] mt-3">Astro</span>
            </div>
          )}

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex flex-col items-center p-2 md:p-3 transition-all relative group ${
                  activeCategory === cat ? 'text-white' : 'text-white/20 hover:text-white'
                }`}
              >
                {activeCategory === cat && (
                  <div 
                    className="absolute inset-0 bg-amber-500/10 border-r-4 border-amber-500 shadow-[10px_0_20px_-10px_rgba(245,158,11,0.3)]" 
                  />
                )}
                <div className={`p-2.5 md:p-3 rounded-2xl transition-all relative z-10 ${
                  activeCategory === cat ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-110' : 'bg-transparent group-hover:bg-white/5'
                }`}>
                  {cat === 'All' && <Layout className={`w-5 h-5 md:w-6 md:h-6`} />}
                  {cat === 'Hot Coffee' && <Coffee className={`w-5 h-5 md:w-6 md:h-6`} />}
                  {cat === 'Cold Coffee' && <IceCream className={`w-5 h-5 md:w-6 md:h-6`} />}
                  {cat === 'Tea' && <Coffee className={`w-5 h-5 md:w-6 md:h-6`} />}
                  {cat === 'Food' && <Coffee className={`w-5 h-5 md:w-6 md:h-6`} />}
                </div>
                <span className={`text-[9px] md:text-[10px] mt-2 font-black leading-tight relative z-10 uppercase tracking-tighter italic ${
                  activeCategory === cat ? 'text-amber-500' : 'text-white/10 group-hover:text-white/30'
                }`}>
                  {cat.split(' ')[0]}
                </span>
              </button>
            ))}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {/* Horizontal Categories for POS only */}
        {mode === 'pos' && (
          <div className="p-4 bg-black/20 backdrop-blur-xl border-b border-white/5 flex gap-2.5 overflow-x-auto shrink-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : 'text-coffee-400 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 lg:p-12 scrollbar-hide">
          <div className="w-full max-w-[1600px] mx-auto">
            <header className={`${mode === 'mobile' ? 'mb-4 flex items-center px-1' : 'mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6'}`}>
              <div className={`${mode === 'mobile' ? 'flex items-center gap-2' : 'flex flex-col'}`}>
                {mode === 'mobile' ? (
                  <>
                    <div className="w-1 h-5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">
                      {searchQuery ? 'Search Results' : activeCategory}
                    </h2>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-amber-500/20">
                        Catalog
                      </div>
                      <div className="h-[1px] flex-1 bg-white/5" />
                    </div>
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase italic tracking-tighter leading-[0.85] flex flex-wrap items-baseline gap-x-4">
                      {searchQuery ? 'Results' : activeCategory.split(' ')[0]}
                      {!searchQuery && activeCategory.split(' ')[1] && (
                        <span className="text-purple-500/40 not-italic font-medium text-4xl md:text-5xl lg:text-6xl">{activeCategory.split(' ')[1]}</span>
                      )}
                    </h2>
                    <div className="flex items-center gap-3 mt-6">
                      <div className="h-1.5 w-16 bg-amber-600 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.3)]" />
                      <span className="text-xs font-bold text-coffee-500 uppercase tracking-widest">
                        {filteredMenu.length} items available
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className={`${mode === 'mobile' ? 'hidden' : 'flex items-center gap-4'}`}>
                {/* Search Bar - Premium Design */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-amber-500/10 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center bg-white/5 border-2 border-white/10 rounded-2xl overflow-hidden focus-within:border-amber-500/50 transition-all backdrop-blur-md">
                    <div className="pl-4">
                      <Search className="w-5 h-5 text-coffee-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Find a product..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-48 xl:w-72 pl-3 pr-4 py-3.5 text-sm font-bold text-white placeholder:text-coffee-600 focus:outline-none bg-transparent"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="pr-4 text-coffee-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Column Toggle - POS/Kiosk Only */}
                {mode !== 'mobile' && !searchQuery && (
                  <div className="flex flex-col items-end gap-2 pl-4 border-l border-white/10">
                    <span className="text-[10px] font-black text-coffee-600 uppercase tracking-[0.2em]">Layout</span>
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                      {[4, 5, 6].map((cols) => (
                        <button
                          key={cols}
                          onClick={() => setGridColumns(cols as 4 | 5 | 6)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-black transition-all ${
                            gridColumns === cols
                              ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
                              : 'text-coffee-500 hover:text-white hover:bg-white/10'
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

            {filteredMenu.length === 0 ? (
              <div className="py-12 text-center text-coffee-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium text-lg">No products found</p>
              </div>
            ) : (
              <div 
                className={`grid ${
                  mode === 'mobile' ? 'grid-cols-2 gap-3 sm:grid-cols-3' : 
                  `gap-5 md:gap-6 lg:gap-8 grid-cols-2 ${
                    gridColumns === 4 ? 'lg:grid-cols-4' : 
                    gridColumns === 5 ? 'lg:grid-cols-5' : 
                    'lg:grid-cols-6'
                  }`
                }`}
                key={searchQuery ? 'search' : activeCategory}
              >
                {filteredMenu.map((item) => (
                  <MagicBento 
                    key={item.id}
                    className="flex flex-col h-full cursor-pointer group/card"
                    textAutoHide={true}
                    enableStars
                    enableSpotlight
                    enableBorderGlow={true}
                    enableTilt={true}
                    enableMagnetism={false}
                    clickEffect
                    spotlightRadius={400}
                    particleCount={12}
                    glowColor="132, 0, 255"
                    disableAnimations={false}
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <div 
                      className="flex flex-col h-full"
                      onClick={() => handleProductClick(item)}
                    >
                      <div className={`w-full overflow-hidden bg-white/5 relative transition-all duration-500 ${mode === 'mobile' ? 'aspect-square rounded-t-xl mb-2' : 'aspect-square rounded-t-[1.5rem] mb-4'}`}>
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className={`w-full h-full object-cover transition-transform duration-1000 ease-out group-hover/card:scale-110`} 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        
                        {/* Interactive Badge */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {item.isCustomizable && (
                            <div className="bg-amber-500/90 backdrop-blur-md text-black text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg">
                              Customizable
                            </div>
                          )}
                          {item.category.includes('Hot') && (
                            <div className="bg-orange-500/90 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" /> Hot
                            </div>
                          )}
                        </div>

                        {cart.find(c => c.id === item.id) && (
                          <div className={`absolute bg-amber-600 text-white rounded-full flex items-center justify-center font-black border-2 border-white shadow-lg ${mode === 'mobile' ? 'top-1 right-1 w-5 h-5 text-[9px]' : 'top-2.5 right-2.5 w-6 h-6 text-[10px]'}`}>
                            {cart.filter(c => c.id === item.id).reduce((sum, item) => sum + item.quantity, 0)}
                          </div>
                        )}

                        <div className="absolute bottom-3 right-3 w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0 transition-all duration-300 hover:bg-amber-500 hover:text-black hover:border-amber-500 z-20">
                          <Plus className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <div className={`flex flex-col flex-1 px-4 pb-4 card-content ${mode === 'mobile' ? 'text-center' : 'text-center'}`}>
                        <h3 className={`font-black text-white leading-tight uppercase tracking-tight transition-colors ${mode === 'mobile' ? 'text-[11px] mb-1' : 'text-sm md:text-base mb-1.5 group-hover/card:text-amber-400'}`}>
                          {item.name}
                        </h3>
                        <p className="text-coffee-500 text-[10px] md:text-xs line-clamp-2 mb-4 font-medium flex-1 px-2">
                          {item.description}
                        </p>
                        <div className={`mt-auto ${mode === 'mobile' ? 'flex flex-col items-center' : ''}`}>
                          <div className={`font-black text-amber-500 italic ${mode === 'mobile' ? 'text-xs mt-1' : 'text-base md:text-lg'}`}>
                            ₱{item.price.toLocaleString()}
                          </div>
                          <div className="flex items-center justify-center gap-1.5 mt-2 opacity-40 group-hover/card:opacity-100 transition-opacity">
                            <div className="w-1 h-1 rounded-full bg-amber-500" />
                            <span className="text-[8px] font-bold text-coffee-400 uppercase tracking-widest">Details</span>
                            <div className="w-1 h-1 rounded-full bg-amber-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </MagicBento>
                ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-2xl">
      <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
        <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter italic">
          <ShoppingBag className="w-5 h-5 text-amber-500" />
          Order Orbit
        </h2>
        {(mode === 'mobile' || mode === 'kiosk' || isPosCartDrawerOpen) && (
          <button onClick={() => {
            setIsMobileCartOpen(false);
            setIsKioskCartOpen(false);
            setIsPosCartDrawerOpen(false);
          }} className="p-2 text-coffee-600 bg-white/5 rounded-full hover:bg-white/10 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-coffee-700 space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5 opacity-20">
                <Coffee className="w-10 h-10" />
              </div>
              <p className="font-black uppercase tracking-[0.3em] text-[10px]">Your orbit is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartId}
                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md group hover:border-white/20 transition-all"
              >
                <div className="flex-1 pr-4">
                  <div className="font-black text-white text-sm uppercase tracking-tight group-hover:text-amber-500 transition-colors">
                    {item.name}
                    {item.selectedSize && (
                      <span className="ml-2 text-[9px] text-amber-500 font-black bg-amber-500/10 px-2 py-0.5 rounded-full uppercase border border-amber-500/20">
                        {item.selectedSize.name}
                      </span>
                    )}
                  </div>
                  {(item.sugarLevel || (item.selectedAddons && item.selectedAddons.length > 0)) && (
                    <div className="text-[10px] text-coffee-600 font-bold uppercase tracking-widest mt-1 space-y-0.5">
                      {item.sugarLevel && <div>Sugar: {item.sugarLevel}</div>}
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-amber-500/50">+ {item.selectedAddons.map(a => a.name).join(', ')}</div>
                      )}
                    </div>
                  )}
                  <div className="text-white font-black text-xs mt-2">₱{(item.price * item.quantity).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => updateQuantity(item.cartId, -1)}
                    className="p-2 bg-white/5 rounded-xl text-coffee-500 hover:bg-white/10 hover:text-white transition-all active:scale-90"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-black text-white text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartId, 1)}
                    className="p-2 bg-amber-600 text-white rounded-xl hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.3)] transition-all active:scale-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
      </div>

      <div className="p-6 bg-white/5 backdrop-blur-xl border-t border-white/5">
        <div className="space-y-6 mb-8">
          <div className="flex gap-3">
            <button
              onClick={() => setOrderType('dine-in')}
              className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border ${orderType === 'dine-in' ? 'bg-amber-600 text-white border-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.2)]' : 'bg-white/5 text-coffee-600 border-white/10 hover:text-white hover:bg-white/10'}`}
            >
              <Store className="w-4 h-4" /> Dine-in
            </button>
            <button
              onClick={() => setOrderType('take-away')}
              className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border ${orderType === 'take-away' ? 'bg-amber-600 text-white border-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.2)]' : 'bg-white/5 text-coffee-600 border-white/10 hover:text-white hover:bg-white/10'}`}
            >
              <ShoppingBag className="w-4 h-4" /> Take-out
            </button>
          </div>

          <div className="relative group">
            <label className="block text-[9px] font-black text-coffee-600 uppercase tracking-[0.3em] mb-2 ml-1 opacity-50">Reference Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 text-white text-sm font-bold transition-all placeholder:text-coffee-900"
              placeholder="Who is this for?"
            />
          </div>

          {orderType === 'dine-in' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 relative group">
              <label className="block text-[9px] font-black text-coffee-600 uppercase tracking-[0.3em] mb-2 ml-1 opacity-50">Table Number</label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 text-white text-sm font-bold transition-all placeholder:text-coffee-900"
                placeholder="Station ID"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-8 px-2">
          <span className="text-coffee-600 font-black uppercase tracking-[0.2em] text-[10px]">Total Fuel</span>
          <span className="text-3xl font-black text-white italic">₱{total.toLocaleString()}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full bg-white hover:bg-white/90 disabled:bg-white/10 disabled:text-coffee-900 text-black py-5 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl transition-all active:scale-[0.98] mb-2"
        >
          {mode === 'mobile' ? 'Launch Order' : 'Checkout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className={containerClasses[mode]}>
      {mode === 'mobile' && (
        <div className="bg-transparent px-4 py-6 flex items-center justify-between z-10 shrink-0">
          {isSearchOpen ? (
            <div className="flex-1 flex items-center gap-3 animate-in slide-in-from-right-4 duration-300">
              <div className="flex-1 relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="Find your favorite..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-white/20"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              </div>
              <button 
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest leading-none mb-1 opacity-50">Discovery</div>
                  <h1 className="text-lg font-black text-white uppercase italic tracking-tighter">Astro Menu</h1>
                </div>
              </div>
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center text-white active:scale-90 transition-all"
              >
                <Search className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Layout */}
      <div className={`${mode === 'kiosk' ? 'flex flex-col flex-1' : 'flex flex-1'} ${mode === 'mobile' ? 'overflow-hidden' : ''}`}>
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderMenuGrid()}
        </div>

        {/* Cart Area - Kiosk (Bottom Bar) */}
        {mode === 'kiosk' && (
          <div className="h-32 bg-black/40 backdrop-blur-2xl border-t border-white/5 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.5)] z-30 flex items-stretch px-8 py-5 gap-8">
            <button 
              onClick={() => {
                setCart([]);
                setOrderType(null);
              }}
              className="px-10 bg-white/5 text-white/40 rounded-[2rem] border border-white/10 font-black text-xs uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-all flex items-center gap-3 active:scale-95"
            >
              <X className="w-5 h-5" />
              Abort
            </button>
            
            <div className="flex-1 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center px-10 shadow-inner group">
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/50 mb-1">Total Fuel</div>
                <div className="text-4xl font-black text-white italic">₱{total.toLocaleString()}</div>
              </div>
              <div className="flex -space-x-4 overflow-hidden py-2">
                 {cart.slice(0, 4).map((item, i) => (
                   <div key={item.cartId} className="relative transition-transform duration-300 group-hover:translate-x-2" style={{ zIndex: 10 - i }}>
                     <img 
                      src={item.image} 
                      className="w-14 h-14 rounded-full border-4 border-black/40 shadow-2xl object-cover" 
                      alt={item.name} 
                     />
                   </div>
                 ))}
                 {cart.length > 4 && (
                   <div className="w-14 h-14 rounded-full border-4 border-black/40 bg-white/5 backdrop-blur-md flex items-center justify-center text-xs font-black text-white shadow-2xl relative z-0">
                     +{cart.length - 4}
                   </div>
                 )}
              </div>
            </div>

            <button 
              onClick={() => setIsKioskCartOpen(true)}
              disabled={cart.length === 0}
              className="px-16 bg-white text-black rounded-[2.5rem] font-black text-2xl uppercase tracking-tighter italic hover:scale-[1.02] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center gap-4"
            >
              Ignition
              <ArrowRight className="w-8 h-8" />
            </button>
          </div>
        )}

        {isKioskCartOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-black/60 backdrop-blur-lg">
            <div className="bg-black/80 w-full max-w-3xl h-[85vh] rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] border-2 border-white/5 flex flex-col animate-in zoom-in-95 duration-500">
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
              className="fixed bottom-8 right-8 z-[60] bg-white text-black p-5 rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] flex items-center gap-4 group transition-all active:scale-95 animate-in fade-in zoom-in-95 duration-500 border border-white/10"
            >
              <div className="relative">
                <ShoppingBag className="w-7 h-7" />
                <span className="absolute -top-3 -right-3 bg-amber-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-black shadow-lg">
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
                className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/60 backdrop-blur-md transition-all animate-in fade-in duration-500"
                onClick={() => {
                  setIsMobileCartOpen(false);
                  setIsPosCartDrawerOpen(false);
                }}
              >
                <div 
                  className={`bg-black/90 w-full ${mode === 'mobile' ? 'h-[90vh]' : 'max-w-md ml-auto h-full'} rounded-t-[3rem] md:rounded-t-none md:rounded-l-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] border-t border-white/5 md:border-t-0 md:border-l border-white/5 flex flex-col animate-in ${mode === 'mobile' ? 'slide-in-from-bottom' : 'slide-in-from-right'} duration-700`}
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl"
          >
            <div
              className="bg-[#0a0a0c] w-full max-w-[95vw] sm:max-w-md md:max-w-2xl rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border-2 border-white/5 flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-500"
            >
              <div className="relative h-48 sm:h-64 md:h-80 w-full shrink-0 overflow-hidden">
                <img src={selectedProductForConfig.image} alt={selectedProductForConfig.name} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
                <button 
                  onClick={() => setSelectedProductForConfig(null)}
                  className="absolute top-6 right-6 p-3 bg-black/40 backdrop-blur-xl rounded-2xl text-white/40 shadow-2xl hover:bg-black/60 hover:text-white transition-all border border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 sm:p-10 flex-1 overflow-y-auto scrollbar-hide">
                <div className="mb-8">
                  <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2 opacity-80">{selectedProductForConfig.category}</div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white mb-2 uppercase italic tracking-tighter leading-none">{selectedProductForConfig.name}</h3>
                  <p className="text-coffee-600 text-xs sm:text-sm font-bold uppercase tracking-tight leading-relaxed">{selectedProductForConfig.description}</p>
                </div>
                
                {selectedProductForConfig.sizes && selectedProductForConfig.sizes.length > 0 && (
                  <div className="mb-10">
                    <label className="block text-[10px] sm:text-xs font-black text-coffee-700 uppercase tracking-[0.3em] mb-4 opacity-50">Select Magnitude</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedProductForConfig.sizes.map((size) => (
                        <button
                          key={size.name}
                          onClick={() => setSelectedSizeConfig(size)}
                          className={`flex items-center justify-between p-5 border-2 rounded-2xl transition-all active:scale-95 ${selectedSizeConfig?.name === size.name ? 'border-amber-600 bg-amber-600/10 shadow-[0_0_20px_rgba(217,119,6,0.2)]' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                        >
                          <span className="font-black text-white uppercase text-xs sm:text-sm tracking-widest">{size.name}</span>
                          <span className="font-black text-amber-500 text-xs sm:text-sm">₱{size.price.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {(selectedProductForConfig.isCustomizable || isProductBeverage(selectedProductForConfig)) && (
                  <>
                    <div className="mb-10">
                      <label className="block text-[10px] sm:text-xs font-black text-coffee-700 uppercase tracking-[0.3em] mb-4 opacity-50">Energy Level (Sugar)</label>
                      <div className="grid grid-cols-5 gap-2">
                        {(['0%', '25%', '50%', '75%', '100%'] as SugarLevel[]).map((level) => (
                          <button
                            key={level}
                            onClick={() => setSelectedSugarConfig(level)}
                            className={`py-3 rounded-xl font-black text-[10px] transition-all uppercase tracking-tighter ${selectedSugarConfig === level ? 'bg-amber-600 text-white shadow-lg scale-105' : 'bg-white/5 text-coffee-600 hover:bg-white/10'}`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    {addons.length > 0 && (
                      <div className="mb-10">
                        <label className="block text-[10px] sm:text-xs font-black text-coffee-700 uppercase tracking-[0.3em] mb-4 opacity-50">Cosmic Enhancers (Add-ons)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {addons.map((addon) => {
                            const isSelected = selectedAddonsConfig.some(a => a.id === addon.id);
                            return (
                              <button
                                key={addon.id}
                                onClick={() => toggleAddon(addon)}
                                className={`flex items-center justify-between p-5 border-2 rounded-2xl transition-all active:scale-95 ${isSelected ? 'border-amber-600 bg-amber-600/10 shadow-[0_0_20px_rgba(217,119,6,0.2)]' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all ${isSelected ? 'border-amber-600 bg-amber-600 shadow-inner' : 'border-white/10'}`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className="font-black text-white text-xs sm:text-sm uppercase tracking-widest">{addon.name}</span>
                                </div>
                                <span className="font-black text-amber-500 text-xs sm:text-sm">+₱{addon.price.toLocaleString()}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="p-8 sm:p-10 border-t border-white/5 bg-white/5 backdrop-blur-2xl shrink-0">
                <button
                  onClick={handleConfigSubmit}
                  className="w-full py-5 sm:py-7 bg-white text-black rounded-[2rem] font-black text-lg sm:text-2xl uppercase tracking-widest hover:bg-white/90 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95"
                >
                  Initiate Order - ₱{((selectedSizeConfig ? selectedSizeConfig.price : selectedProductForConfig.price) + selectedAddonsConfig.reduce((sum, a) => sum + a.price, 0)).toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
