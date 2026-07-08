import React, { useState, useMemo } from 'react';
import { Product, CartItem, Order, ProductSize } from '../types';
import { Coffee, Minus, Plus, ShoppingBag, X, Check, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderingScreenProps {
  mode: 'pos' | 'kiosk' | 'mobile';
  menu: Product[];
  onPlaceOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => void;
}

export function OrderingScreen({ mode, menu, onPlaceOrder }: OrderingScreenProps) {
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
  const [selectedProductForSize, setSelectedProductForSize] = useState<Product | null>(null);

  // Sync active category if it's no longer valid
  if (activeCategory && !categories.includes(activeCategory) && categories.length > 0) {
    setActiveCategory(categories[0]);
  }

  const addToCart = (product: Product, size?: ProductSize) => {
    if (product.sizes && product.sizes.length > 0 && !size) {
      setSelectedProductForSize(product);
      return;
    }

    const price = size ? size.price : product.price;
    const cartId = Math.random().toString(36).substr(2, 9);
    
    setCart((prev) => {
      const existingIndex = prev.findIndex(ci => ci.id === product.id && ci.selectedSize?.name === size?.name);
      if (existingIndex > -1) {
        return prev.map((ci, idx) => idx === existingIndex ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { ...product, cartId, quantity: 1, notes: '', selectedSize: size, price }];
    });
    setSelectedProductForSize(null);
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
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 text-center mb-16"
        >
          <Coffee className="w-20 h-20 text-amber-500 mx-auto mb-6" />
          <h1 className="text-6xl font-black text-white mb-4">Where will you be eating today?</h1>
          <p className="text-coffee-300 text-2xl font-medium">Please select your order type below</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-12 w-full max-w-5xl relative z-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
          </motion.button>
        </div>
      </div>
    );
  }

  const containerClasses = {
    pos: 'flex h-screen overflow-hidden',
    kiosk: 'flex h-screen w-screen bg-white overflow-hidden border-coffee-200',
    mobile: 'flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl relative',
  };

  const renderMenuGrid = () => (
    <div className={`flex-1 overflow-hidden bg-coffee-50/50 flex ${mode === 'kiosk' ? 'flex-row' : 'flex-col'}`}>
      {/* Kiosk Vertical Sidebar */}
      {mode === 'kiosk' && (
        <div className="w-32 bg-white border-r border-coffee-200 flex flex-col py-4 gap-2 overflow-y-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex flex-col items-center gap-2 p-4 transition-all ${
                activeCategory === cat
                  ? 'bg-amber-100 border-l-4 border-amber-600'
                  : 'hover:bg-coffee-50'
              }`}
            >
              <div className={`p-3 rounded-full ${activeCategory === cat ? 'bg-amber-600 text-white' : 'bg-coffee-100 text-coffee-600'}`}>
                <Coffee className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-black uppercase text-center leading-tight ${activeCategory === cat ? 'text-amber-900' : 'text-coffee-500'}`}>
                {cat}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Categories for POS and Mobile */}
        {mode !== 'kiosk' && (
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

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <motion.div 
            className={`grid gap-4 pb-24 md:pb-0 ${
              mode === 'mobile' ? 'grid-cols-2' : 
              mode === 'kiosk' ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 
              'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}
            initial="hidden"
            animate="show"
            key={activeCategory}
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
          >
            {menu.filter((item) => item.category === activeCategory).map((item) => (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addToCart(item)}
                className={`bg-white shadow-sm border border-coffee-100 hover:shadow-2xl hover:border-amber-300 transition-all cursor-pointer flex flex-col group ${
                  mode === 'kiosk' ? 'rounded-2xl p-3' : 'rounded-[2rem] p-5'
                }`}
              >
                <div className={`rounded-xl overflow-hidden bg-coffee-100 mb-3 relative shadow-inner aspect-square`}>
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col flex-1">
                  <h3 className={`font-black text-coffee-950 leading-tight mb-1 group-hover:text-amber-700 transition-colors ${
                    mode === 'kiosk' ? 'text-sm' : 'text-xl'
                  }`}>{item.name}</h3>
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <div className={`font-black text-coffee-900 ${
                      mode === 'kiosk' ? 'text-lg' : 'text-2xl'
                    }`}>₱{item.price.toLocaleString()}</div>
                    <div className={`rounded-xl bg-coffee-900 text-white flex items-center justify-center group-hover:bg-amber-600 transition-all shadow-lg group-hover:rotate-6 ${
                      mode === 'kiosk' ? 'w-8 h-8' : 'w-10 h-10'
                    }`}>
                      <Plus className={mode === 'kiosk' ? 'w-4 h-4' : 'w-6 h-6'} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
        <AnimatePresence>
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-coffee-400 space-y-3">
              <Coffee className="w-12 h-12 opacity-20" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.cartId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
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
                  <div className="text-coffee-500 text-sm">₱{(item.price * item.quantity).toLocaleString()}</div>
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
              </motion.div>
            ))
          )}
        </AnimatePresence>
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
      {/* Main Layout */}
      <div className={`${mode === 'kiosk' ? 'flex flex-col flex-1' : 'flex flex-1'}`}>
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
          <div className="h-32 bg-white border-t-4 border-amber-500 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] z-10 flex items-center px-8 gap-8">
            <div className="flex-1 flex gap-4 overflow-x-auto py-2 scrollbar-hide">
              {cart.map((item) => (
                <div key={item.cartId} className="flex items-center gap-3 bg-coffee-50 p-2 rounded-2xl border border-coffee-100 shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-coffee-100">
                    <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-coffee-900 truncate w-24 leading-none mb-1">{item.name}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.cartId, -1)} className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-coffee-900 border border-coffee-200">-</button>
                      <span className="text-sm font-black">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartId, 1)} className="w-6 h-6 bg-coffee-900 rounded-md flex items-center justify-center text-white">+</button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="flex items-center gap-4 text-coffee-400 font-bold italic">
                  <ShoppingBag className="w-8 h-8 opacity-20" />
                  <span>Start adding items to your order</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-8 shrink-0">
               <div className="text-right">
                  <div className="text-xs font-bold text-coffee-500 uppercase tracking-widest">Grand Total</div>
                  <div className="text-4xl font-black text-coffee-950">₱{total.toLocaleString()}</div>
               </div>
               
               <div className="flex gap-3">
                 <button 
                  onClick={() => {
                    setCart([]);
                    setOrderType(null);
                  }}
                  className="px-8 py-4 border-2 border-coffee-200 rounded-2xl font-black text-coffee-600 hover:bg-coffee-50 transition-colors"
                 >
                   CANCEL
                 </button>
                 <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="px-12 py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-coffee-200 text-white rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
                 >
                   CHECKOUT
                 </button>
               </div>
            </div>
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

          <AnimatePresence>
            {isMobileCartOpen && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
              >
                <div className="bg-white w-full h-[85vh] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col">
                  {renderCart()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Size Selection Modal */}
      <AnimatePresence>
        {selectedProductForSize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="relative aspect-video">
                <img src={selectedProductForSize.image} alt={selectedProductForSize.name} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedProductForSize(null)}
                  className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full text-coffee-900 shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-coffee-900 mb-1">{selectedProductForSize.name}</h3>
                <p className="text-coffee-500 text-sm mb-6">{selectedProductForSize.description}</p>
                
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-coffee-400 uppercase tracking-widest mb-2">Select Size</label>
                  {selectedProductForSize.sizes?.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => addToCart(selectedProductForSize, size)}
                      className="w-full flex items-center justify-between p-4 border-2 border-coffee-100 rounded-2xl hover:border-coffee-900 hover:bg-coffee-50 transition-all group"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-coffee-900 group-hover:text-coffee-950 uppercase">{size.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-coffee-900">₱{size.price.toLocaleString()}</span>
                        <div className="w-6 h-6 rounded-full border-2 border-coffee-200 group-hover:border-coffee-900 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-coffee-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {/* Option for base price if no sizes but we somehow got here */}
                  {(!selectedProductForSize.sizes || selectedProductForSize.sizes.length === 0) && (
                    <button
                      onClick={() => addToCart(selectedProductForSize)}
                      className="w-full flex items-center justify-between p-4 border-2 border-coffee-900 bg-coffee-50 rounded-2xl"
                    >
                      <span className="font-bold text-coffee-900">Standard</span>
                      <span className="font-bold text-coffee-900">₱{selectedProductForSize.price.toLocaleString()}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
