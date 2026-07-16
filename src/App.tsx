import React, { useState, useEffect } from 'react';
import { ViewMode, Order, Product, OrderStatus } from './types';
import { OrderingScreen } from './components/OrderingScreen';
import { KitchenQueue } from './components/KitchenQueue';
import { InventoryManager } from './components/InventoryManager';
import { AdminProducts } from './components/AdminProducts';
import { AdminSettings } from './components/AdminSettings';
import { SplashScreen } from './components/SplashScreen';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CashierView } from './components/CashierView';
import { TransactionReports } from './components/TransactionReports';
import { Store, MonitorSmartphone, Tablet, Smartphone, ChefHat, Package, CheckCircle2, Settings, LogOut, ShieldAlert, Lock, Home, Banknote, BarChart3, Sparkles } from 'lucide-react';
import { useFirebase } from './lib/useFirebase';
import { useAuth } from './lib/AuthContext';
import Galaxy from './components/Galaxy';
import StaggeredMenu from './components/StaggeredMenu';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('mobile');
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const { user, isAdmin, loading: authLoading, logOut } = useAuth();
  
  const {
    products,
    addons,
    orders,
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
    updateStock
  } = useFirebase(user?.uid, isAdmin);

  const [isStarted, setIsStarted] = useState(false);

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
      <div className="flex h-screen items-center justify-center bg-[#020205] text-white font-bold overflow-hidden">
        <Galaxy 
          mouseRepulsion
          mouseInteraction
          density={0.8}
          glowIntensity={0.6}
          saturation={0.8}
          hueShift={190}
          twinkleIntensity={0.9}
          rotationSpeed={0.05}
          repulsionStrength={9.5}
          autoCenterRepulsion={0}
          starSpeed={0.1}
          speed={0.5}
        />
        <div className="relative z-10 animate-in fade-in zoom-in duration-1000 flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-amber-500/10 backdrop-blur-2xl border border-amber-500/30 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-pulse">
            <Sparkles className="w-10 h-10 text-amber-500" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="uppercase tracking-[0.5em] text-[10px] font-black text-amber-500/50">Initialising System</span>
            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 animate-[loading_2s_infinite]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <style>
        {`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <Galaxy 
          mouseRepulsion
          mouseInteraction
          density={0.8}
          glowIntensity={0.6}
          saturation={0.8}
          hueShift={190}
          twinkleIntensity={0.9}
          rotationSpeed={0.05}
          repulsionStrength={9.5}
          autoCenterRepulsion={0}
          starSpeed={0.1}
          speed={0.2}
        />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        {dbError && (
          <div className="bg-amber-600 text-white text-[10px] sm:text-xs py-1 px-4 text-center font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-500 relative z-[60]">
            <ShieldAlert className="w-3 h-3" />
            {dbError}
          </div>
        )}
        
        {/* Conditional Header: Only render when NOT on the splash screen to avoid overlapping logos/names */}
        {!(!isStarted && splashScreen?.isActive && !isAdmin && (currentView === 'mobile' || currentView === 'kiosk')) && (
          <>
            <div className="fixed top-0 left-0 right-0 z-[300] p-6 pointer-events-none">
              <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto bg-black/40 backdrop-blur-2xl text-white px-5 py-3 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div 
                    className="w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 shadow-inner group cursor-pointer transition-all hover:scale-105 active:scale-95 bg-white/5"
                  >
                    {shopSettings?.logoUrl ? (
                      <img src={shopSettings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-amber-500" />
                    )}
                  </div>
                  <div className="hidden xs:block">
                    <span className="text-sm font-black tracking-tighter uppercase italic block leading-none mb-1">
                      {shopSettings?.name || 'Astro Coffee'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] leading-none">System Live</span>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-auto bg-black/40 backdrop-blur-2xl text-white px-5 py-3 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center h-[68px]">
                  <StaggeredMenu
                    position="right"
                    items={menuItems}
                    socialItems={socialItems}
                    displaySocials
                    displayItemNumbering={true}
                    menuButtonColor="#ffffff"
                    openMenuButtonColor="#fff"
                    changeMenuColorOnOpen={true}
                    colors={['#B497CF', '#5227FF']}
                    logoUrl={shopSettings?.logoUrl}
                    accentColor="#5227FF"
                  />
                </div>
              </div>
            </div>

            <div className="h-24 shrink-0" /> {/* Spacer for floating header */}
          </>
        )}

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {!isStarted && splashScreen?.isActive && !isAdmin && (currentView === 'mobile' || currentView === 'kiosk') && (
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
                  <OrderingScreen mode="pos" menu={products.filter(p => p.isActive)} addons={addons.filter(a => a.isActive)} onPlaceOrder={handlePlaceOrder} />
                )}
                {currentView === 'kiosk' && (
                  <OrderingScreen mode="kiosk" menu={products.filter(p => p.isActive)} addons={addons.filter(a => a.isActive)} onPlaceOrder={handlePlaceOrder} />
                )}
                {currentView === 'mobile' && (
                  <OrderingScreen mode="mobile" menu={products.filter(p => p.isActive)} addons={addons.filter(a => a.isActive)} onPlaceOrder={handlePlaceOrder} />
                )}
                {currentView === 'cashier' && (
                  <CashierView orders={orders} onUpdateStatus={updateOrderStatus} />
                )}
                {currentView === 'reports' && (
                  <TransactionReports orders={orders} />
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
                    onAddProduct={addProduct}
                    onUpdateProduct={updateProduct}
                    onDeleteProduct={deleteProduct}
                    onAddAddon={addAddon}
                    onUpdateAddon={updateAddon}
                    onDeleteAddon={deleteAddon}
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

      </main>

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
