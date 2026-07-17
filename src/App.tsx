import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ViewMode, Order, Product, OrderStatus } from './types';
import { SplashScreen } from './components/SplashScreen';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Store, MonitorSmartphone, Tablet, Smartphone, ChefHat, Package, CheckCircle2, Settings, LogOut, ShieldAlert, Lock, Home, Banknote, BarChart3, Sparkles, Sun, Moon, Search, X, Coffee, Croissant, CakeSlice, Cookie, Milk, CupSoda, Utensils, Menu, ChevronRight } from 'lucide-react';
import { useFirebase } from './lib/useFirebase';
import { useAuth } from './lib/AuthContext';
import ShapeGrid from './components/ShapeGrid';

// Lazy loaded components
const OrderingScreen = lazy(() => import('./components/OrderingScreen').then(m => ({ default: m.OrderingScreen })));
const KitchenQueue = lazy(() => import('./components/KitchenQueue').then(m => ({ default: m.KitchenQueue })));
const InventoryManager = lazy(() => import('./components/InventoryManager').then(m => ({ default: m.InventoryManager })));
const AdminProducts = lazy(() => import('./components/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminSettings = lazy(() => import('./components/AdminSettings').then(m => ({ default: m.AdminSettings })));
const CashierView = lazy(() => import('./components/CashierView').then(m => ({ default: m.CashierView })));
const TransactionReports = lazy(() => import('./components/TransactionReports').then(m => ({ default: m.TransactionReports })));

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('mobile');
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { user, isAdmin, loading: authLoading, logOut } = useAuth();
  
  const {
    products,
    addons,
    orders,
    categories,
    splashScreen,
    shopSettings,
    loading: dbLoading,
    error: dbError,
    updateShopSettings,
    updateSplashScreen,
    addProduct,
    updateProduct,
    deleteProduct,
    addAddon,
    updateAddon,
    deleteAddon,
    addOrder,
    updateOrderStatus,
    updateStock,
    deleteOrder,
    clearOrders,
    addCategory,
    updateCategory,
    deleteCategory
  } = useFirebase(user?.uid, isAdmin);

  const [isStarted, setIsStarted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const navigationItems: { id: ViewMode; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'mobile', label: 'App', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'pos', label: 'POS', icon: <MonitorSmartphone className="w-4 h-4" />, adminOnly: true },
    { id: 'cashier', label: 'Cashier', icon: <Banknote className="w-4 h-4" />, adminOnly: true },
    { id: 'queue', label: 'Kitchen', icon: <ChefHat className="w-4 h-4" />, adminOnly: true },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" />, adminOnly: true },
    { id: 'admin-products', label: 'Products', icon: <Package className="w-4 h-4" />, adminOnly: true },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" />, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, adminOnly: true },
  ];

  const allowedNavigation = navigationItems.filter(item => !item.adminOnly || isAdmin);

  // Automatically switch to an allowed view if current is restricted
  useEffect(() => {
    const isAllowed = allowedNavigation.some(item => item.id === currentView);
    if (!isAllowed && allowedNavigation.length > 0) {
      setCurrentView(allowedNavigation[0].id);
    }
  }, [allowedNavigation, currentView]);

  // Auto-start for admin to avoid splash screen in management view
  useEffect(() => {
    if (isAdmin) {
      setIsStarted(true);
    }
  }, [isAdmin]);

  // Handle landing page state
  useEffect(() => {
    if (!isAdmin && (currentView === 'mobile' || currentView === 'kiosk')) {
      // Keep isStarted as is (likely false at start)
    } else {
      setIsStarted(true);
    }
  }, [currentView, isAdmin]);

  const handlePlaceOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    const initialStatus: OrderStatus = 'unpaid';
    
    addOrder({
      ...orderData,
      status: initialStatus
    });
    
    const modalOrder: Order = {
      ...orderData,
      id: `ord_${Date.now().toString().slice(-6)}`,
      createdAt: Date.now(),
      status: initialStatus,
    };
    setSuccessOrder(modalOrder);
  };

  const menuItems = React.useMemo(() => {
    const items = allowedNavigation.map(item => ({
      label: item.label,
      link: '#',
      onClick: () => {
        setCurrentView(item.id);
        if (item.id === 'mobile' || item.id === 'kiosk') {
          setIsStarted(false);
        } else {
          setIsStarted(true);
        }
      }
    }));

    if (user) {
      items.push({
        label: 'Logout',
        link: '#',
        onClick: logOut
      });
    } else {
      items.push({
        label: 'Login',
        link: '#',
        onClick: () => setShowAdminLogin(true)
      });
    }
    return items;
  }, [allowedNavigation, user, logOut]);

  const socialItems = React.useMemo(() => [
    { label: 'Instagram', link: 'https://instagram.com' },
    { label: 'Facebook', link: 'https://facebook.com' },
    { label: 'Twitter', link: 'https://twitter.com' }
  ], []);

  if (authLoading || (user && dbLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-white font-bold overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none z-0">
          <ShapeGrid 
            speed={0.3} 
            squareSize={50}
            direction='diagonal'
            borderColor='rgba(255, 255, 255, 0.03)'
            hoverFillColor='rgba(245, 158, 11, 0.1)'
            shape='square'
            hoverTrailAmount={5}
          />
        </div>
        <div className="relative z-10 animate-in fade-in zoom-in duration-1000 flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-amber-500/10 backdrop-blur-2xl border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-pulse">
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="uppercase tracking-[0.5em] text-[8px] font-black text-amber-500/50">Initialising Orbit</span>
            <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 animate-[loading_2s_infinite]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#020617] text-white font-sans selection:bg-amber-500/30 overflow-hidden relative">
      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
      
      {/* Background Shapes & Space Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#020617]">
        <ShapeGrid 
          speed={0.2} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.02)'
          hoverFillColor='rgba(245, 158, 11, 0.08)'
          shape='square'
          hoverTrailAmount={10}
        />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#a855f7]/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      <div className="flex-1 flex min-h-screen overflow-hidden relative z-10 w-full">
        {dbError && (
          <div className="fixed top-0 left-0 right-0 z-[400] bg-amber-600 text-white text-[10px] sm:text-xs py-1.5 px-4 text-center font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-500">
            <ShieldAlert className="w-3.5 h-3.5" />
            {dbError}
          </div>
        )}

        {/* Elegant iOS-Inclined Sidebar - Desktop (lg and up) */}
        {!(!isStarted && !isAdmin && (currentView === 'mobile' || currentView === 'kiosk')) && (
          <aside className="hidden lg:flex flex-col w-72 bg-slate-950/40 border-r border-white/5 backdrop-blur-3xl h-screen shrink-0 relative z-10 transition-all duration-300">
            {/* Store Brand Header */}
            <div className="p-6 border-b border-white/5 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                {shopSettings?.logoUrl ? (
                  <img src={shopSettings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black tracking-tight uppercase italic truncate block leading-tight">
                  {shopSettings?.name || 'Astro Coffee'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">System Live</span>
                </div>
              </div>
            </div>

            {/* Sidebar Search bar */}
            <div className="p-4 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Quick search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-slate-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Menu Links */}
            <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto scrollbar-hide">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-3 block mb-2 leading-none">Navigation</span>
              {allowedNavigation.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      if (item.id === 'mobile' || item.id === 'kiosk') {
                        setIsStarted(false);
                      } else {
                        setIsStarted(true);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                      isActive 
                        ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border-r-2 border-amber-500 font-bold' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`transition-colors ${isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-white'}`}>
                        {item.icon}
                      </div>
                      <span className="text-xs tracking-tight">{item.label}</span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Profile / Admin Portal Widget */}
            <div className="p-4 border-t border-white/5 bg-slate-950/20 shrink-0">
              {user ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-xs shrink-0">
                      {user.email?.slice(0, 2).toUpperCase() || 'AD'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-white truncate leading-none mb-1">{user.email}</span>
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none">Administrator</span>
                    </div>
                  </div>
                  <button 
                    onClick={logOut}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-all shrink-0"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAdminLogin(true)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  Admin Portal
                </button>
              )}
            </div>
          </aside>
        )}

        {/* Main Content Workspace Panel */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-20 min-w-0">
          
          {/* Top Bar - Mobile View Only (lg and below) */}
          {!(!isStarted && !isAdmin && (currentView === 'mobile' || currentView === 'kiosk')) && (
            <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-slate-950/40 backdrop-blur-3xl border-b border-white/5 shrink-0 relative z-20">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 shrink-0"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black tracking-tight uppercase italic leading-none mb-1 truncate block">
                    {shopSettings?.name || 'Astro Coffee'}
                  </span>
                  <div className="flex items-center gap-1 leading-none mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">System Live</span>
                  </div>
                </div>
              </div>

              {/* Mobile Quick Search Bar expansion */}
              <div className="flex items-center gap-2 shrink-0">
                {isSearchOpen ? (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                    <input
                      type="text"
                      placeholder="Search menu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-28 xs:w-40 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="p-1 text-slate-400 hover:text-amber-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 shrink-0"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}
              </div>
            </header>
          )}

          {/* Sliding Translucent Mobile Menu Drawer */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              
              <div className="relative flex flex-col w-72 max-w-[80vw] h-full bg-[#020617]/95 backdrop-blur-2xl border-r border-white/10 p-6 animate-in slide-in-from-left duration-300 text-white z-50">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                      {shopSettings?.logoUrl ? (
                        <img src={shopSettings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <span className="text-xs font-black tracking-tight uppercase italic truncate max-w-[120px]">
                      {shopSettings?.name || 'Astro Coffee'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-6 shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-4 py-1.5 bg-white/5 border border-white/5 rounded-lg text-xs"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>

                <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-hide">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2 leading-none">Views</span>
                  {allowedNavigation.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id);
                          setIsMobileMenuOpen(false);
                          if (item.id === 'mobile' || item.id === 'kiosk') {
                            setIsStarted(false);
                          } else {
                            setIsStarted(true);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                          isActive 
                            ? 'bg-white/10 text-white border-l-2 border-amber-500 font-bold' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isActive ? 'text-amber-500' : 'text-slate-400'}>{item.icon}</span>
                          <span className="text-xs tracking-tight">{item.label}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </button>
                    );
                  })}
                </nav>

                <div className="pt-4 border-t border-white/5 shrink-0">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-[10px]">
                          AD
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 truncate flex-1">{user.email}</span>
                      </div>
                      <button 
                        onClick={() => {
                          logOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-bold uppercase transition-all"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setShowAdminLogin(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                      <Lock className="w-3 h-3 text-amber-500" />
                      Admin Login
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <main className="flex-1 relative overflow-hidden flex flex-col">
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Initializing Sequence...</span>
                </div>
              </div>
            }>
          {!isStarted && !isAdmin && (currentView === 'mobile' || currentView === 'kiosk') && (
            <SplashScreen 
              data={splashScreen} 
              shopSettings={shopSettings}
              onStart={() => setIsStarted(true)} 
            />
          )}
          
          {!allowedNavigation.some(item => item.id === currentView) ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <ShieldAlert className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Access Denied</h2>
                <p className="text-coffee-600 font-bold uppercase tracking-widest text-[10px] mb-8 leading-relaxed">This terminal is restricted to authorized personnel. Please authenticate to proceed.</p>
                <button 
                  onClick={() => setShowAdminLogin(true)}
                  className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-white/90 transition-all active:scale-95"
                >
                  Authenticate
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div
                key={currentView}
                className="flex-1 overflow-hidden flex"
              >
                <div className="flex-1 relative z-10 flex flex-col">
                  {currentView === 'pos' && (
                    <OrderingScreen 
                      mode="pos" 
                      menu={products.filter(p => p.isActive)} 
                      addons={addons.filter(a => a.isActive)} 
                      onPlaceOrder={handlePlaceOrder} 
                      searchQuery={searchQuery}
                      shopSettings={shopSettings}
                      categoriesData={categories}
                    />
                  )}
                  {currentView === 'kiosk' && (
                    <OrderingScreen 
                      mode="kiosk" 
                      menu={products.filter(p => p.isActive)} 
                      addons={addons.filter(a => a.isActive)} 
                      onPlaceOrder={handlePlaceOrder} 
                      searchQuery={searchQuery}
                      shopSettings={shopSettings}
                      categoriesData={categories}
                    />
                  )}
                  {currentView === 'mobile' && (
                    <OrderingScreen 
                      mode="mobile" 
                      menu={products.filter(p => p.isActive)} 
                      addons={addons.filter(a => a.isActive)} 
                      onPlaceOrder={handlePlaceOrder} 
                      searchQuery={searchQuery}
                      shopSettings={shopSettings}
                      categoriesData={categories}
                    />
                  )}
                  {currentView === 'cashier' && (
                    <CashierView orders={orders} onUpdateStatus={updateOrderStatus} />
                  )}
                  {currentView === 'reports' && (
                    <TransactionReports orders={orders} onDeleteOrder={deleteOrder} onClearOrders={clearOrders} />
                  )}
                  {currentView === 'queue' && (
                    <KitchenQueue orders={orders} onUpdateStatus={updateOrderStatus} />
                  )}
                  {currentView === 'inventory' && (
                    <InventoryManager products={products} onUpdateStock={updateStock} />
                  )}
                  {currentView === 'admin-products' && (
                    <AdminProducts 
                      products={products}
                      addons={addons}
                      categories={categories}
                      onAddProduct={addProduct}
                      onUpdateProduct={updateProduct}
                      onDeleteProduct={deleteProduct}
                      onAddAddon={addAddon}
                      onUpdateAddon={updateAddon}
                      onDeleteAddon={deleteAddon}
                      onAddCategory={addCategory}
                      onUpdateCategory={updateCategory}
                      onDeleteCategory={deleteCategory}
                    />
                  )}
                  {currentView === 'settings' && (
                    <AdminSettings 
                      splashScreen={splashScreen}
                      shopSettings={shopSettings}
                      onUpdateSplash={updateSplashScreen}
                      onUpdateShop={updateShopSettings}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          {showAdminLogin && (
            <AdminLoginModal onClose={() => setShowAdminLogin(false)} />
          )}
        </Suspense>
      </main>
        </div>

        {successOrder && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500"
          >
            <div
              className="bg-[#0a0a0c] rounded-[3rem] p-10 max-w-sm w-full shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] flex flex-col items-center text-center border-2 border-white/5 relative overflow-hidden animate-in zoom-in-95 duration-500"
            >
              {/* Background Glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-24 h-24 bg-green-500/10 rounded-[2rem] flex items-center justify-center text-green-500 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              </div>

              <h2 className="text-3xl font-black text-white mb-3 uppercase italic tracking-tighter">Order Launched!</h2>
              <p className="text-coffee-600 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
                Your sequence <span className="text-white">#{successOrder.id?.slice(-4)}</span> {successOrder.status === 'unpaid' ? 'is awaiting fuel credits. Please visit the station.' : 'is now being prepared in orbit.'}
              </p>
              
              <div className="w-full space-y-3 relative z-10">
                <button
                  onClick={() => {
                    setSuccessOrder(null);
                    if (currentView === 'mobile' || currentView === 'kiosk') {
                      setIsStarted(false);
                    }
                  }}
                  className="w-full py-4 bg-white hover:bg-white/90 text-black rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95"
                >
                  {successOrder.source === 'mobile' ? 'Track Status' : 'New Mission'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
