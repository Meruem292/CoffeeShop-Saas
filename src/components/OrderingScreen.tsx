import React, { useState, useMemo } from 'react';
import { Product, CartItem, Order, ProductSize, Addon, SugarLevel } from '../types';
import { Coffee, Minus, Plus, ShoppingBag, X, Check, Store, ArrowRight, Search, ChevronDown } from 'lucide-react';

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
    onPlaceOrder({
      items: cart,
      total,
      source: mode,
      customerName: customerName || 'Guest',
      tableNumber: mode === 'kiosk' ? tableNumber : undefined,
      orderType: orderType || 'take-away',
    });
    setCart([]);
    setCustomerName('');
    setTableNumber('');
    setOrderType(null);
    setIsMobileCartOpen(false);
  };

  if (mode === 'kiosk' && !orderType) {
    return (
      <div className="fixed inset-0 z-[100] bg-coffee-950 flex flex-col items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80" 
            className="w-full h-full object-cover" 
            alt="Bg"
          />
        </div>
        <div 
          className="relative z-10 text-center mb-16"
        >
          <Coffee className="w-20 h-20 text-amber-500 mx-auto mb-6" />
          <h1 className="text-6xl font-black text-white mb-4">Where will you be eating today?</h1>
          <p className="text-coffee-300 text-2xl font-medium">Please select your order type below</p>
        </div>

        <div className="grid grid-cols-2 gap-12 w-full max-w-5xl relative z-10">
          <button
            onClick={() => setOrderType('dine-in')}
            className="flex flex-col items-center gap-10 bg-white p-16 rounded-[4rem] shadow-2xl group transition-all hover:bg-amber-50 border-4 border-transparent hover:border-amber-500"
          >
            <div className="w-48 h-48 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <Store className="w-24 h-24 text-amber-600" />
            </div>
            <div className="text-center">
              <span className="text-5xl font-black text-coffee-950 block mb-2">Eat In</span>
              <span className="text-coffee-500 font-bold uppercase tracking-[0.2em] text-lg">Enjoy in our cafe</span>
            </div>
          </button>

          <button
            onClick={() => setOrderType('take-away')}
            className="flex flex-col items-center gap-10 bg-white p-16 rounded-[4rem] shadow-2xl group transition-all hover:bg-amber-50 border-4 border-transparent hover:border-amber-500"
          >
            <div className="w-48 h-48 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <ShoppingBag className="w-24 h-24 text-amber-600" />
            </div>
            <div className="text-center">
              <span className="text-5xl font-black text-coffee-950 block mb-2">Take Out</span>
              <span className="text-coffee-500 font-bold uppercase tracking-[0.2em] text-lg">Packed to go</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const containerClasses = {
    pos: 'flex h-screen overflow-hidden',
    kiosk: 'flex h-screen w-screen bg-white overflow-hidden border-coffee-200',
    mobile: 'flex flex-col h-screen w-full bg-[#F8F9FA] relative',
  };

  const renderMenuGrid = () => (
    <div className={`flex-1 overflow-hidden flex ${mode !== 'pos' ? 'flex-row' : 'flex-col'}`}>
      {/* Sidebar Navigation for Kiosk/Mobile */}
      {mode !== 'pos' && (
        <div className={`flex flex-col py-4 md:py-8 overflow-y-auto scrollbar-hide shrink-0 z-20 transition-all ${mode === 'mobile' ? 'w-[72px] md:w-20 bg-white border-r border-coffee-100 gap-2' : 'w-20 md:w-28 lg:w-32 bg-coffee-950 shadow-2xl gap-4 md:gap-6'}`}>
          {mode !== 'mobile' && (
            <div className="flex flex-col items-center gap-1 mb-6 opacity-90">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 shadow-inner">
                <span className="text-white font-black text-xl md:text-3xl italic tracking-tighter">A</span>
              </div>
              <span className="text-[8px] md:text-[10px] text-white/30 uppercase font-black tracking-[0.4em] mt-3">Abacus</span>
            </div>
          )}

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex flex-col items-center p-2 md:p-3 transition-all relative ${
                mode === 'mobile' 
                  ? activeCategory === cat ? 'text-coffee-900 bg-coffee-50' : 'text-coffee-400 hover:text-coffee-600'
                  : activeCategory === cat ? 'text-white' : 'text-coffee-400 hover:text-coffee-200'
              }`}
            >
              {activeCategory === cat && mode !== 'mobile' && (
                <div 
                  className="absolute inset-0 bg-white/10 border-r-4 border-amber-500" 
                />
              )}
              {activeCategory === cat && mode === 'mobile' && (
                <div 
                  className="absolute inset-y-0 left-0 w-[3px] bg-coffee-900 rounded-r-full" 
                />
              )}
              <div className={`p-2 md:p-2.5 rounded-xl transition-all relative z-10 ${
                activeCategory === cat && mode !== 'mobile' ? 'bg-white text-coffee-900 shadow-xl scale-110' : 'bg-transparent'
              }`}>
                {cat === 'Hot Coffee' && <Coffee className={`w-5 h-5 md:w-6 md:h-6 ${mode === 'mobile' && activeCategory === cat ? 'text-coffee-900' : ''}`} />}
                {cat === 'Cold Coffee' && <Coffee className={`w-5 h-5 md:w-6 md:h-6 ${mode === 'mobile' && activeCategory === cat ? 'text-coffee-900' : ''}`} />}
                {cat === 'Tea' && <Coffee className={`w-5 h-5 md:w-6 md:h-6 ${mode === 'mobile' && activeCategory === cat ? 'text-coffee-900' : ''}`} />}
                {cat === 'Food' && <Coffee className={`w-5 h-5 md:w-6 md:h-6 ${mode === 'mobile' && activeCategory === cat ? 'text-coffee-900' : ''}`} />}
              </div>
              <span className={`text-[9px] md:text-[10px] mt-1 font-black leading-tight relative z-10 ${
                activeCategory === cat && mode !== 'mobile' ? 'text-amber-500 uppercase tracking-widest' : ''
              } ${activeCategory === cat && mode === 'mobile' ? 'text-coffee-900 text-center' : 'text-center'}`}>
                {mode === 'mobile' ? cat : cat.split(' ')[0]}
              </span>
            </button>
          ))}
          
          {mode !== 'mobile' && (
            <div className="mt-auto flex flex-col items-center py-4">
               <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-white rotate-90" />
               </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Horizontal Categories for POS only */}
        {mode === 'pos' && (
          <div className="p-4 bg-white border-b border-coffee-100 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                  activeCategory === cat
                    ? 'bg-coffee-900 text-white shadow-md'
                    : 'bg-coffee-50 text-coffee-600 hover:bg-coffee-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-hide">
          <div className="w-full max-w-[1440px] mx-auto">
            <header className={`${mode === 'mobile' ? 'mb-4 flex items-center' : 'mb-8 flex items-end justify-between border-b border-coffee-100 pb-5'}`}>
              <div className={`${mode === 'mobile' ? 'flex items-center gap-2' : ''}`}>
                {mode === 'mobile' && <div className="w-1 h-5 bg-coffee-900 rounded-full" />}
                <h2 className={`${mode === 'mobile' ? 'text-lg font-black text-coffee-950 uppercase tracking-tight' : 'text-3xl md:text-4xl lg:text-5xl font-black text-coffee-950 uppercase italic tracking-tighter leading-none'}`}>
                  {searchQuery ? 'Search Results' : activeCategory}
                </h2>
                {mode !== 'mobile' && <div className="h-1.5 w-16 bg-amber-600 rounded-full mt-3" />}
              </div>
              <div className={`${mode === 'mobile' ? 'hidden' : 'hidden lg:flex items-center gap-4'}`}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-coffee-200 rounded-full text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-64"
                  />
                  <Search className="w-4 h-4 text-coffee-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {!searchQuery && (
                  <div className="text-right pb-1 ml-4 border-l border-coffee-100 pl-4">
                    <span className="text-[9px] font-black text-coffee-300 uppercase tracking-[0.4em] block mb-1">Section</span>
                    <div className="text-base font-black text-coffee-900 italic tracking-tighter">
                      {categories.indexOf(activeCategory) + 1} <span className="text-coffee-200">/</span> {categories.length}
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
                  'gap-5 md:gap-6 lg:gap-8 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                }`}
                key={searchQuery ? 'search' : activeCategory}
              >
                {filteredMenu.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleProductClick(item)}
                  className={`bg-white transition-all cursor-pointer flex flex-col group relative ${mode === 'mobile' ? 'rounded-xl pb-2 shadow-sm' : 'rounded-[1.5rem] p-4 md:p-5 border border-coffee-100 hover:border-amber-500/30 hover:shadow-xl'}`}
                >
                  <div className={`w-full overflow-hidden bg-coffee-50 relative transition-all duration-500 ${mode === 'mobile' ? 'aspect-square rounded-t-xl mb-2' : 'aspect-square rounded-[1rem] mb-4 shadow-sm group-hover:shadow-md'}`}>
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${mode === 'mobile' ? '' : 'group-hover:scale-110'}`} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                    
                    {cart.find(c => c.id === item.id) && (
                      <div className={`absolute bg-amber-600 text-white rounded-full flex items-center justify-center font-black border-2 border-white shadow-lg ${mode === 'mobile' ? 'top-1 right-1 w-5 h-5 text-[9px]' : 'top-2.5 right-2.5 w-6 h-6 text-[10px]'}`}>
                        {cart.filter(c => c.id === item.id).reduce((sum, item) => sum + item.quantity, 0)}
                      </div>
                    )}
                  </div>
                  
                  <div className={`flex flex-col flex-1 ${mode === 'mobile' ? 'px-2 text-center' : 'text-center'}`}>
                    <h3 className={`font-black text-coffee-950 leading-tight uppercase tracking-tight transition-colors ${mode === 'mobile' ? 'text-[11px] mb-1' : 'text-sm md:text-base mb-1.5 group-hover:text-amber-700'}`}>
                      {item.name}
                    </h3>
                    <div className={`mt-auto ${mode === 'mobile' ? 'flex flex-col items-center' : ''}`}>
                      <div className={`font-black text-coffee-900 italic ${mode === 'mobile' ? 'text-xs mt-1' : 'text-base md:text-lg mb-2'}`}>
                        ₱{item.price.toLocaleString()}
                      </div>
                      {mode !== 'mobile' && (
                        <div className="inline-flex h-8 w-8 rounded-lg bg-coffee-900 text-white items-center justify-center group-hover:bg-amber-600 transition-all shadow-md group-hover:rotate-12 mt-1">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 md:p-6 border-b border-coffee-100 bg-coffee-50/30 flex justify-between items-center">
        <h2 className="text-xl font-bold text-coffee-900 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-coffee-600" />
          Current Order
        </h2>
        {mode === 'mobile' && (
          <button onClick={() => setIsMobileCartOpen(false)} className="p-2 text-coffee-500 bg-coffee-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-coffee-400 space-y-3">
              <Coffee className="w-12 h-12 opacity-20" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartId}
                className="flex items-center justify-between p-3 bg-white border border-coffee-100 rounded-xl shadow-sm"
              >
                <div className="flex-1 pr-2">
                  <div className="font-semibold text-coffee-900 text-sm md:text-base leading-tight">
                    {item.name}
                    {item.selectedSize && (
                      <span className="ml-1 text-xs text-coffee-500 font-medium bg-coffee-100 px-1.5 py-0.5 rounded uppercase">
                        {item.selectedSize.name}
                      </span>
                    )}
                  </div>
                  {(item.sugarLevel || (item.selectedAddons && item.selectedAddons.length > 0)) && (
                    <div className="text-xs text-coffee-400 mt-0.5 space-y-0.5">
                      {item.sugarLevel && <div>Sugar: {item.sugarLevel}</div>}
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div>+ {item.selectedAddons.map(a => a.name).join(', ')}</div>
                      )}
                    </div>
                  )}
                  <div className="text-coffee-500 text-sm mt-1">₱{(item.price * item.quantity).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 bg-coffee-50 p-1 rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.cartId, -1)}
                    className="p-1.5 md:p-2 bg-white rounded-md text-coffee-700 hover:bg-coffee-200 shadow-sm transition-colors"
                  >
                    <Minus className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                  <span className="w-4 md:w-6 text-center font-medium text-coffee-900 text-sm md:text-base">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartId, 1)}
                    className="p-1.5 md:p-2 bg-coffee-900 text-white rounded-md hover:bg-coffee-800 shadow-sm transition-colors"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
      </div>

      <div className="p-4 md:p-6 bg-coffee-50/50 border-t border-coffee-100">
        {(mode === 'pos' || mode === 'kiosk') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-coffee-700 mb-1">Customer Name (Optional)</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2.5 border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500 bg-white"
              placeholder="Enter name for order"
            />
          </div>
        )}
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <span className="text-coffee-600 font-medium">Total</span>
          <span className="text-2xl font-bold text-coffee-900">₱{total.toLocaleString()}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full bg-coffee-900 hover:bg-coffee-800 disabled:bg-coffee-300 text-white py-3 md:py-4 rounded-xl font-bold text-lg shadow-md transition-all active:scale-[0.98]"
        >
          {mode === 'mobile' ? 'Place Mobile Order' : 'Checkout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className={containerClasses[mode]}>
      {mode === 'mobile' && (
        <div className="bg-[#F8F9FA] px-4 py-3 flex items-center justify-between z-10 shrink-0 border-b border-coffee-100">
          {isSearchOpen ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 bg-white border border-coffee-200 rounded-full text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <button 
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="w-8 h-8 flex items-center justify-center text-coffee-400 hover:text-coffee-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[#1B2956]">
                <Store className="w-4 h-4" />
                <span className="font-bold text-sm">Store Pickup</span>
              </div>
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#1B2956]"
              >
                <Search className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Layout */}
      <div className={`${mode === 'kiosk' ? 'flex flex-col flex-1' : 'flex flex-1'} ${mode === 'mobile' ? 'overflow-hidden' : ''}`}>
        <div className={`${mode === 'mobile' ? 'flex-1' : mode === 'kiosk' ? 'flex-1' : 'flex-1 md:w-2/3 border-r border-coffee-200'} flex flex-col overflow-hidden`}>
          {renderMenuGrid()}
        </div>

        {/* Cart Area - Desktop/Tablet (Side Bar) */}
        {mode === 'pos' && (
          <div className="hidden md:block w-1/3 min-w-[320px] max-w-[400px]">
            {renderCart()}
          </div>
        )}

        {/* Cart Area - Kiosk (Bottom Bar) */}
        {mode === 'kiosk' && (
          <div className="h-28 bg-white border-t border-coffee-100 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)] z-30 flex items-stretch px-6 py-4 gap-6">
            <button 
              onClick={() => {
                setCart([]);
                setOrderType(null);
              }}
              className="px-8 bg-coffee-50 text-coffee-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel Order
            </button>
            
            <div className="flex-1 bg-amber-600 text-white rounded-2xl flex items-center px-8 shadow-lg">
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Order</div>
                <div className="text-3xl font-black italic">₱{total.toLocaleString()}</div>
              </div>
              <div className="flex -space-x-3 overflow-hidden">
                 {cart.slice(0, 3).map((item, i) => (
                   <img 
                    key={item.cartId} 
                    src={item.image} 
                    className="w-10 h-10 rounded-full border-2 border-amber-600 shadow-md object-cover" 
                    alt={item.name} 
                   />
                 ))}
                 {cart.length > 3 && (
                   <div className="w-10 h-10 rounded-full border-2 border-amber-600 bg-amber-700 flex items-center justify-center text-[10px] font-bold shadow-md">
                     +{cart.length - 3}
                   </div>
                 )}
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="px-12 bg-coffee-950 text-white rounded-2xl font-black text-xl uppercase tracking-tighter italic hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              Checkout
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Cart Area - Mobile (Floating Button & Drawer) */}
      {mode === 'mobile' && (
        <>
          <div className="p-4 bg-white border-t border-coffee-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
             <button
              onClick={() => setIsMobileCartOpen(true)}
              className="w-full bg-coffee-900 text-white py-3 rounded-xl font-bold flex justify-between items-center px-4 shadow-md"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span>View Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
              </div>
              <span>₱{total.toLocaleString()}</span>
            </button>
          </div>

          {isMobileCartOpen && (
              <div
                className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
              >
                <div className="bg-white w-full h-[85vh] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col">
                  {renderCart()}
                </div>
              </div>
            )}
        </>
      )}

      {/* Customization Modal */}
        {selectedProductForConfig && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
          >
            <div
              className="bg-white w-full max-w-[95vw] sm:max-w-md md:max-w-lg rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            >
              <div className="relative h-36 sm:h-48 md:h-56 w-full shrink-0 overflow-hidden">
                <img src={selectedProductForConfig.image} alt={selectedProductForConfig.name} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedProductForConfig(null)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 bg-white/90 backdrop-blur rounded-full text-coffee-900 shadow-lg hover:bg-white transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto scrollbar-thin">
                <h3 className="text-lg sm:text-2xl font-bold text-coffee-900 mb-0.5 sm:mb-1">{selectedProductForConfig.name}</h3>
                <p className="text-coffee-500 text-xs sm:text-sm mb-4 sm:mb-6">{selectedProductForConfig.description}</p>
                
                {selectedProductForConfig.sizes && selectedProductForConfig.sizes.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <label className="block text-[10px] sm:text-xs font-bold text-coffee-400 uppercase tracking-widest mb-2 sm:mb-3">Select Size</label>
                    <div className="space-y-1.5 sm:space-y-2">
                      {selectedProductForConfig.sizes.map((size) => (
                        <button
                          key={size.name}
                          onClick={() => setSelectedSizeConfig(size)}
                          className={`w-full flex items-center justify-between p-2.5 sm:p-3 border-2 rounded-xl transition-all ${selectedSizeConfig?.name === size.name ? 'border-amber-600 bg-amber-50' : 'border-coffee-100 hover:border-coffee-300'}`}
                        >
                          <span className="font-bold text-coffee-900 uppercase text-xs sm:text-sm">{size.name}</span>
                          <span className="font-bold text-coffee-900 text-xs sm:text-sm">₱{size.price.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {(selectedProductForConfig.isCustomizable || isProductBeverage(selectedProductForConfig)) && (
                  <>
                    <div className="mb-4 sm:mb-6">
                      <label className="block text-[10px] sm:text-xs font-bold text-coffee-400 uppercase tracking-widest mb-2 sm:mb-3">Sugar Level</label>
                      <div className="flex gap-1.5 sm:gap-2">
                        {(['0%', '25%', '50%', '75%', '100%'] as SugarLevel[]).map((level) => (
                          <button
                            key={level}
                            onClick={() => setSelectedSugarConfig(level)}
                            className={`flex-1 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${selectedSugarConfig === level ? 'bg-amber-600 text-white' : 'bg-coffee-100 text-coffee-600 hover:bg-coffee-200'}`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    {addons.length > 0 && (
                      <div className="mb-4 sm:mb-6">
                        <label className="block text-[10px] sm:text-xs font-bold text-coffee-400 uppercase tracking-widest mb-2 sm:mb-3">Add-ons</label>
                        <div className="space-y-1.5 sm:space-y-2">
                          {addons.map((addon) => {
                            const isSelected = selectedAddonsConfig.some(a => a.id === addon.id);
                            return (
                              <button
                                key={addon.id}
                                onClick={() => toggleAddon(addon)}
                                className={`w-full flex items-center justify-between p-2.5 sm:p-3 border-2 rounded-xl transition-all ${isSelected ? 'border-amber-600 bg-amber-50' : 'border-coffee-100 hover:border-coffee-300'}`}
                              >
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center border-2 ${isSelected ? 'border-amber-600 bg-amber-600' : 'border-coffee-300'}`}>
                                    {isSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />}
                                  </div>
                                  <span className="font-bold text-coffee-900 text-xs sm:text-sm">{addon.name}</span>
                                </div>
                                <span className="font-bold text-coffee-900 text-xs sm:text-sm">+₱{addon.price.toLocaleString()}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="p-3 sm:p-4 border-t border-coffee-100 bg-coffee-50 shrink-0">
                <button
                  onClick={handleConfigSubmit}
                  className="w-full py-2.5 sm:py-4 bg-coffee-900 text-white rounded-xl font-bold text-sm sm:text-lg hover:bg-coffee-800 transition-colors shadow-md"
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
