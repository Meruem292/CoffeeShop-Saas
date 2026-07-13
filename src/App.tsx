import React, { useState, useEffect } from 'react';
import { ViewMode, Order, Product } from './types';
import { OrderingScreen } from './components/OrderingScreen';
import { KitchenQueue } from './components/KitchenQueue';
import { InventoryManager } from './components/InventoryManager';
import { AdminProducts } from './components/AdminProducts';
import { AdminSettings } from './components/AdminSettings';
import { SplashScreen } from './components/SplashScreen';
import { AdminLoginModal } from './components/AdminLoginModal';
import Balatro from './components/Balatro';
import { CashierView } from './components/CashierView';
import { Store, MonitorSmartphone, Tablet, Smartphone, ChefHat, Package, CheckCircle2, Settings, LogOut, ShieldAlert, Lock, Home, Banknote } from 'lucide-react';
import { useFirebase } from './lib/useFirebase';
import { useAuth } from './lib/AuthContext';

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
    const initialStatus = orderData.source === 'pos' ? 'pending' : 'unpaid';
    
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

  if (authLoading || (user && dbLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-coffee-50 text-coffee-600 font-bold">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Store className="w-12 h-12 text-coffee-400" />
          <span>Loading System...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-coffee-50 font-sans relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <Balatro 
          isRotate={false}
          mouseInteraction
          pixelFilter={745}
          color1="#2C1810"
          color2="#6F4E37"
          color3="#D2B48C"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="bg-coffee-950 text-coffee-50 px-2 py-1.5 shadow-lg z-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-coffee-800 shadow-inner"
              style={{ backgroundColor: shopSettings?.themeColor || '#4b2c20' }}
            >
              {shopSettings?.logoUrl ? (
                <img src={shopSettings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <span className="text-[10px] font-black text-white italic">{shopSettings?.initials || 'CH'}</span>
              )}
            </div>
            <span className="text-sm sm:text-base font-black tracking-tighter uppercase hidden xs:block">
              {shopSettings?.name || 'CoffeeHouse OS'}
            </span>
          </div>
          
          <div className="flex-1 flex justify-center">
            <div className="flex gap-1 bg-coffee-900/50 p-1 rounded-xl border border-coffee-800/50 overflow-x-auto scrollbar-hide max-w-[300px] sm:max-w-none">
              {allowedNavigation.map((item) => (
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    currentView === item.id
                      ? 'bg-amber-600 text-white shadow-lg scale-105'
                      : 'text-coffee-400 hover:text-white hover:bg-coffee-800'
                  }`}
                >
                  {item.icon}
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isStarted && (currentView === 'mobile' || currentView === 'kiosk') && !isAdmin && (
              <button 
                onClick={() => setIsStarted(false)} 
                className="p-2 bg-coffee-900 text-coffee-100 rounded-lg font-bold hover:bg-coffee-800 transition-colors shadow-sm border border-coffee-800"
                title="Back to Start"
              >
                <Home className="w-4 h-4" />
              </button>
            )}
            {!user ? (
              <button onClick={() => setShowAdminLogin(true)} className="flex items-center gap-2 text-xs bg-amber-500 text-coffee-950 px-4 py-1.5 rounded-lg font-black hover:bg-amber-400 transition-all shadow-lg active:scale-95">
                <Lock className="w-3.5 h-3.5" />
                <span>STAFF</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <div className="text-[10px] text-coffee-400 font-bold uppercase tracking-widest leading-none mb-1">
                    {isAdmin ? 'System Admin' : 'Staff Member'}
                  </div>
                  <div className="text-[11px] text-coffee-100 font-bold truncate max-w-[100px] leading-none">
                    {user.email?.split('@')[0]}
                  </div>
                </div>
                <button onClick={logOut} className="p-2 text-coffee-400 hover:text-white bg-coffee-900 hover:bg-coffee-800 rounded-lg transition-colors border border-coffee-800" title="Log Out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
            <div className="text-center space-y-4">
              <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto" />
              <h2 className="text-2xl font-bold text-coffee-950 uppercase italic tracking-tighter">Access Restricted</h2>
              <p className="text-coffee-600 font-medium">Please log in as staff to access this terminal.</p>
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="px-8 py-3 bg-amber-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-amber-500 transition-all active:scale-95"
              >
                Staff Login
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-coffee-950/40 backdrop-blur-sm"
          >
            <div
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center border-2 border-coffee-100"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-coffee-900 mb-2">Order Placed!</h2>
              <p className="text-coffee-600 mb-6">
                Your order <span className="font-bold text-coffee-900">#{successOrder.id?.slice(-4)}</span> {successOrder.status === 'unpaid' ? 'is awaiting payment. Please proceed to the cashier.' : 'has been sent to the kitchen.'}
              </p>
              
              <div className="w-full space-y-3">
                <button
                  onClick={() => {
                    setSuccessOrder(null);
                    if (currentView === 'mobile' || currentView === 'kiosk') {
                      setIsStarted(false);
                    }
                  }}
                  className="w-full py-3.5 bg-coffee-900 hover:bg-coffee-800 text-white rounded-xl font-bold text-lg shadow-md transition-colors"
                >
                  {successOrder.source === 'mobile' ? 'View Order Status' : 'Start New Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
