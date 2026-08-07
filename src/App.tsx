import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { ViewMode, Order, Product, OrderStatus } from './types';
import { SplashScreen } from './components/SplashScreen';
import { UnifiedAuthModal } from './components/UnifiedAuthModal';
import { Store, MonitorSmartphone, Tablet, Smartphone, ChefHat, Package, CheckCircle2, Settings, LogOut, ShieldAlert, Lock, Home, Banknote, BarChart3, Sparkles, Sun, Moon, Search, X, Coffee, Croissant, CakeSlice, Cookie, Milk, CupSoda, Utensils, Menu, ChevronRight , Tag, User } from 'lucide-react';
import { useFirebase } from './lib/useFirebase';
import { useAuth } from './lib/AuthContext';
import { useTheme } from './lib/ThemeProvider';
import { useToast } from './lib/ToastContext';
import { playNotificationSound } from './lib/audio';
import ShapeGrid from './components/ShapeGrid';
import { Footer } from './components/Footer';

// Lazy loaded components
const OrderingScreen = lazy(() => import('./components/OrderingScreen').then(m => ({ default: m.OrderingScreen })));
const KitchenQueue = lazy(() => import('./components/KitchenQueue').then(m => ({ default: m.KitchenQueue })));
const InventoryManager = lazy(() => import('./components/InventoryManager').then(m => ({ default: m.InventoryManager })));
const AdminProducts = lazy(() => import('./components/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminVouchers = lazy(() => import('./components/AdminVouchers').then(m => ({ default: m.AdminVouchers })));
const AdminSettings = lazy(() => import('./components/AdminSettings').then(m => ({ default: m.AdminSettings })));
const CashierView = lazy(() => import('./components/CashierView').then(m => ({ default: m.CashierView })));
const TransactionReports = lazy(() => import('./components/TransactionReports').then(m => ({ default: m.TransactionReports })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));

export default function App() {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<ViewMode>('mobile');
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [successTimer, setSuccessTimer] = useState<number>(10);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isKioskModeActive, setIsKioskModeActive] = useState(() => {
    return localStorage.getItem('astro_pos_kiosk_active') === 'true';
  });
  const [showExitKioskModal, setShowExitKioskModal] = useState(false);
  const [exitKioskPassword, setExitKioskPassword] = useState('');
  const [exitKioskError, setExitKioskError] = useState('');
  const [exitKioskLoading, setExitKioskLoading] = useState(false);

  const { user, isAdmin, loading: authLoading, logOut, signInWithEmail } = useAuth();
  const handleLogout = async () => {
    try {
      await logOut();
      toast.success('Logged out successfully');
    } catch (err: any) {
      toast.error('Failed to log out');
    }
  };
  const { theme, setTheme } = useTheme();
  
  const {
    products,
    addons,
    orders,
    userOrders,
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
    updateOrder,
    updateStock,
    deleteOrder,
    clearOrders,
    addCategory,
    updateCategory,
    deleteCategory,
    vouchers,
    addVoucher,
    updateVoucher,
    deleteVoucher
  } = useFirebase(user?.uid, isAdmin);

  const [isStarted, setIsStarted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (shopSettings?.themeMode) {
      setTheme(shopSettings.themeMode);
    } else if (shopSettings) {
      setTheme('dark');
    }
  }, [shopSettings?.themeMode, setTheme]);

  const navigationItems: { id: ViewMode; label: string; icon: React.ReactNode; adminOnly?: boolean; userOnly?: boolean }[] = [
    { id: 'mobile', label: 'App', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" />, userOnly: true },
    { id: 'kiosk', label: 'Kiosk', icon: <Tablet className="w-4 h-4" />, adminOnly: true },
    { id: 'pos', label: 'POS', icon: <MonitorSmartphone className="w-4 h-4" />, adminOnly: true },
    { id: 'cashier', label: 'Cashier', icon: <Banknote className="w-4 h-4" />, adminOnly: true },
    { id: 'queue', label: 'Kitchen', icon: <ChefHat className="w-4 h-4" />, adminOnly: true },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" />, adminOnly: true },
    { id: 'admin-products', label: 'Products', icon: <Package className="w-4 h-4" />, adminOnly: true },
    { id: 'admin-vouchers', label: 'Vouchers', icon: <Tag className="w-4 h-4" />, adminOnly: true },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" />, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, adminOnly: true },
  ];

  const unpaidOrdersCount = orders.filter(o => o.status === 'unpaid').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  const allowedNavigation = navigationItems.filter(item => 
    (!item.adminOnly || isAdmin || (item.id === 'kiosk' && isKioskModeActive)) &&
    (!item.userOnly || user)
  );

  // Automatically switch to an allowed view if current is restricted
  useEffect(() => {
    const isAllowed = allowedNavigation.some(item => item.id === currentView);
    if (!isAllowed && allowedNavigation.length > 0) {
      setCurrentView(allowedNavigation[0].id);
    }
  }, [allowedNavigation, currentView]);

  // Force Kiosk view if kiosk mode is active
  useEffect(() => {
    if (isKioskModeActive) {
      setCurrentView('kiosk');
    }
  }, [isKioskModeActive]);

  // Auto-start for admin to avoid splash screen in management view (unless Kiosk mode is active)
  useEffect(() => {
    if (isAdmin && !isKioskModeActive) {
      setIsStarted(true);
    }
  }, [isAdmin, isKioskModeActive]);

  // Prevent zooming (pinch-to-zoom / ctrl+wheel zoom / keyboard shortcuts on desktop and touch devices)
  useEffect(() => {
    const handleGestureStart = (e: Event) => e.preventDefault();
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
      }
    };

    document.addEventListener('gesturestart', handleGestureStart);
    document.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('gesturestart', handleGestureStart);
      document.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle landing page state
  useEffect(() => {
    if ((!isAdmin || isKioskModeActive) && (currentView === 'mobile' || currentView === 'kiosk')) {
      // Keep isStarted as is (likely false at start)
    } else {
      setIsStarted(true);
    }
  }, [currentView, isAdmin, isKioskModeActive]);

  // Auto-return to splash after 10s if successOrder is active and not clicked
  useEffect(() => {
    if (!successOrder) {
      setSuccessTimer(10);
      return;
    }

    setSuccessTimer(10);
    const interval = setInterval(() => {
      setSuccessTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setSuccessOrder(null);
          setIsStarted(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [successOrder]);

  // Notification for new orders on admin side
  const prevOrderIds = useRef<Set<string>>(new Set());
  const prevOrderStatuses = useRef<Map<string, string>>(new Map());
  const prevUserOrderStatuses = useRef<Map<string, OrderStatus>>(new Map());

  const mostPickedProductIds = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      order.items.forEach(item => {
        if (item.id) {
          counts[item.id] = (counts[item.id] || 0) + (item.quantity || 1);
        }
      });
    });

    const categoryProducts: Record<string, Product[]> = {};
    products.forEach(p => {
      const cat = p.category || 'Other';
      if (!categoryProducts[cat]) categoryProducts[cat] = [];
      categoryProducts[cat].push(p);
    });

    const topIds = new Set<string>();

    Object.values(categoryProducts).forEach(catProds => {
      let maxCount = -1;
      let topId: string | null = null;
      catProds.forEach(p => {
        const count = counts[p.id] || 0;
        if (count > maxCount) {
          maxCount = count;
          topId = p.id;
        }
      });
      if (topId) {
        topIds.add(topId);
      } else if (catProds.length > 0) {
        topIds.add(catProds[0].id);
      }
    });

    return topIds;
  }, [orders, products]);

  useEffect(() => {
    if (isAdmin) {
      const currentIds = new Set(orders.map(o => o.id || ''));
      const currentStatuses = new Map(orders.map(o => [o.id || '', o.status]));

      if (prevOrderIds.current.size > 0) {
        let hasNew = false;
        for (const id of currentIds) {
          if (!prevOrderIds.current.has(id)) {
            const order = orders.find(o => o.id === id);
            if (order && (order.status === 'unpaid' || order.status === 'pending' || order.status === 'pending-verification')) {
               hasNew = true;
               break;
            }
          }
        }
        if (hasNew) {
           playNotificationSound(shopSettings?.notificationSoundUrl, shopSettings?.notificationVolume);
        }
      }

      if (prevOrderStatuses.current.size > 0) {
        for (const [id, status] of currentStatuses.entries()) {
          const prevStatus = prevOrderStatuses.current.get(id);
          if (prevStatus !== 'ready' && status === 'ready') {
            const order = orders.find(o => o.id === id);
            if (order && shopSettings?.speakCustomerName && 'speechSynthesis' in window) {
              const text = `Order ready for pickup, ${order.customerName || 'Guest'}`;
              const utterance = new SpeechSynthesisUtterance(text);
              window.speechSynthesis.speak(utterance);
            }
          }
        }
      }

      prevOrderIds.current = currentIds;
      prevOrderStatuses.current = currentStatuses;
    }
  }, [orders, isAdmin, shopSettings?.speakCustomerName, shopSettings?.notificationSoundUrl, shopSettings?.notificationVolume]);

  useEffect(() => {
    if (user) {
      userOrders.forEach(order => {
        const prevStatus = prevUserOrderStatuses.current.get(order.id || '');
        if (prevStatus && prevStatus !== 'ready' && order.status === 'ready') {
          toast.success(`Your order ${order.id?.slice(-4)} is ready!`);
          playNotificationSound(shopSettings?.notificationSoundUrl, shopSettings?.notificationVolume);
        }
        prevUserOrderStatuses.current.set(order.id || '', order.status);
      });
    }
  }, [userOrders, user, shopSettings?.notificationSoundUrl, shopSettings?.notificationVolume]);

  const handlePlaceOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
    const initialStatus: OrderStatus = orderData.status || 'unpaid';
    
    try {
      await addOrder({
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
      toast.success(initialStatus === 'pending-verification' ? 'Order submitted! Pending GCash verification.' : 'Order placed successfully!');
    } catch (err) {
      console.error('Failed to place order', err);
      toast.error('Failed to place order. Please try again.');
    }
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
        onClick: handleLogout
      });
    } else {
      items.push({
        label: 'Login',
        link: '#',
        onClick: () => setShowAdminLogin(true)
      });
    }
    return items;
  }, [allowedNavigation, user, handleLogout]);

  const voidOrder = async (id: string, reason: string) => {
    try {
      await updateOrder(id, { status: 'cancelled', voidReason: reason });
      toast.success('Order voided successfully!');
    } catch (e) {
      toast.error('Failed to void order');
    }
  };

  const socialItems = React.useMemo(() => [
    { label: 'Instagram', link: 'https://instagram.com' },
    { label: 'Facebook', link: 'https://facebook.com' },
    { label: 'Twitter', link: 'https://twitter.com' }
  ], []);

  if (authLoading || (user && dbLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white font-bold overflow-hidden relative">
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
            <div className="w-24 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 animate-[loading_2s_infinite]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white font-sans selection:bg-amber-500/30 overflow-hidden relative">
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
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-slate-50 dark:bg-[#020617]">
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
        {isKioskModeActive && (
          <div className="absolute top-4 right-4 z-[300]">
            <button
              onClick={() => setShowExitKioskModal(true)}
              className="px-4 py-2 bg-black/80 hover:bg-black backdrop-blur-md border border-amber-500/30 rounded-full text-amber-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              Exit Kiosk
            </button>
          </div>
        )}

        {isKioskModeActive && showExitKioskModal && (
          <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#0a0a0c] rounded-[2.5rem] p-8 max-w-sm w-full border border-white/10 shadow-2xl relative">
              <button 
                onClick={() => setShowExitKioskModal(false)}
                className="absolute top-5 right-5 p-2 text-white/40 hover:text-white bg-white/5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Exit Kiosk Mode</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Enter Kiosk Exit PIN to Unlock</p>
              </div>

              {exitKioskError && (
                <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest mb-4 border border-rose-500/20 text-center">
                  {exitKioskError}
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                setExitKioskError('');
                setExitKioskLoading(true);
                setTimeout(() => {
                  const targetPin = shopSettings?.kioskPin || '0000';
                  if (exitKioskPassword === targetPin) {
                    setIsKioskModeActive(false);
                    localStorage.removeItem('astro_pos_kiosk_active');
                    setCurrentView('pos');
                    setShowExitKioskModal(false);
                    setExitKioskPassword('');
                    toast.success('Successfully exited Kiosk Mode!');
                  } else {
                    setExitKioskError('Invalid Kiosk PIN');
                    toast.error('Invalid Kiosk exit PIN!');
                  }
                  setExitKioskLoading(false);
                }, 400);
              }} className="space-y-4">
                <input 
                  type="password"
                  required
                  placeholder="Kiosk Exit PIN..."
                  value={exitKioskPassword}
                  onChange={e => setExitKioskPassword(e.target.value)}
                  className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs focus:border-amber-500/50 outline-none"
                />
                <button
                  disabled={exitKioskLoading}
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 text-black rounded-xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {exitKioskLoading ? 'Verifying...' : 'Unlock & Exit'}
                </button>
              </form>
            </div>
          </div>
        )}
        {dbError && (
          <div className="fixed top-0 left-0 right-0 z-[400] bg-amber-600 text-slate-900 dark:text-white text-[10px] sm:text-xs py-1.5 px-4 text-center font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-500">
            <ShieldAlert className="w-3.5 h-3.5" />
            {dbError}
          </div>
        )}

        {/* Elegant iOS-Inclined Sidebar - Desktop (lg and up) */}
        {!isKioskModeActive && !(!isStarted && !isAdmin && (currentView === 'mobile' || currentView === 'kiosk')) && (
          <aside className="hidden lg:flex flex-col w-72 bg-white/60 dark:bg-slate-950/40 border-r border-black/10 dark:border-white/5 backdrop-blur-3xl h-screen shrink-0 relative z-10 transition-all duration-300">
            {/* Store Brand Header */}
            <div className="p-6 border-b border-black/10 dark:border-white/5 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                {shopSettings?.logoUrl ? (
                  <img src={shopSettings.logoUrl || undefined} className="w-full h-full object-cover" alt="Logo" />
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
                        ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border-r-2 border-amber-500 font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`transition-colors ${isActive ? 'text-amber-500' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:hover:text-white'}`}>
                        {item.icon}
                      </div>
                      <span className="text-xs tracking-tight">{item.label}</span>{((item.id === 'cashier' && unpaidOrdersCount > 0) || (item.id === 'queue' && pendingOrdersCount > 0)) && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-2" />}
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Profile / Admin Portal Widget */}
            <div className="p-4 border-t border-black/10 dark:border-white/5 bg-white dark:bg-slate-950/20 shrink-0">
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsKioskModeActive(true);
                    localStorage.setItem('astro_pos_kiosk_active', 'true');
                    setCurrentView('kiosk');
                    setIsStarted(false);
                    toast.success('Secure Kiosk Mode activated!');
                  }}
                  className="w-full mb-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                  <MonitorSmartphone className="w-3.5 h-3.5" />
                  Launch Secure Kiosk
                </button>
              )}
              {user ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-xs shrink-0">
                      {user.email?.slice(0, 2).toUpperCase() || 'AD'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate leading-none mb-1">{user.email}</span>
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none">Administrator</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={handleLogout}
                      className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-red-400 transition-all shrink-0"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAdminLogin(true)}
                  className="w-full py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  Login
                </button>
              )}
            </div>
          </aside>
        )}

        {/* Main Content Workspace Panel */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-20 min-w-0">
          
          {/* Top Bar - Mobile View Only (lg and below) */}
          {!isKioskModeActive && !(!isStarted && !isAdmin && (currentView === 'mobile' || currentView === 'kiosk')) && (
            <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/60 dark:bg-slate-950/40 backdrop-blur-3xl border-b border-black/10 dark:border-white/5 shrink-0 relative z-20">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shrink-0"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black tracking-tight uppercase italic leading-none mb-1 truncate block">
                    {shopSettings?.name || 'Astro Coffee'}
                  </span>
                  <div className="flex items-center gap-1 leading-none mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[7px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none">System Live</span>
                  </div>
                </div>
              </div>

            </header>
          )}

          {/* Sliding Translucent Mobile Menu Drawer */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div 
                className="fixed inset-0 bg-slate-300 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              
              <div className="relative flex flex-col w-72 max-w-[80vw] h-full bg-slate-50 dark:bg-[#020617]/95 backdrop-blur-2xl border-r border-black/10 dark:border-white/10 p-6 animate-in slide-in-from-left duration-300 text-slate-900 dark:text-white z-50">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/10 dark:border-white/5 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center overflow-hidden">
                      {shopSettings?.logoUrl ? (
                        <img src={shopSettings.logoUrl || undefined} className="w-full h-full object-cover" alt="Logo" />
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
                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-hide pt-4">
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
                            ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white border-l-2 border-amber-500 font-bold' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isActive ? 'text-amber-500' : 'text-slate-600 dark:text-slate-400'}>{item.icon}</span>
                          <span className="text-xs tracking-tight">{item.label}</span>{((item.id === 'cashier' && unpaidOrdersCount > 0) || (item.id === 'queue' && pendingOrdersCount > 0)) && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-2" />}
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </button>
                    );
                  })}
                </nav>

                <div className="pt-4 border-t border-black/10 dark:border-white/5 shrink-0 space-y-2">
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        setIsKioskModeActive(true);
                        localStorage.setItem('astro_pos_kiosk_active', 'true');
                        setCurrentView('kiosk');
                        setIsStarted(false);
                        setIsMobileMenuOpen(false);
                        toast.success('Secure Kiosk Mode activated!');
                      }}
                      className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                      <MonitorSmartphone className="w-4 h-4" />
                      Launch Secure Kiosk
                    </button>
                  )}
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-black/5 dark:bg-white/5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-[10px]">
                          AD
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate flex-1">{user.email}</span>
                      </div>
                      <button 
                        onClick={() => {
                          handleLogout();
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
                      className="w-full py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                      <Lock className="w-3 h-3 text-amber-500" />
                      Login
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
              orders={orders}
              onStart={() => setIsStarted(true)} 
            />
          )}
          
          {!allowedNavigation.some(item => item.id === currentView) ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <ShieldAlert className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4">Access Denied</h2>
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
                <div className="flex-1 relative z-10 flex flex-col overflow-hidden">
                  {currentView === 'pos' && (
                    <OrderingScreen 
                      mode="pos" 
                      menu={products} 
                      addons={addons.filter(a => a.isActive)} 
                      onPlaceOrder={handlePlaceOrder} 
                      shopSettings={shopSettings}
                      categoriesData={categories}
                      mostPickedProductIds={mostPickedProductIds}
                      vouchers={vouchers}
                    />
                  )}
                  {currentView === 'kiosk' && (
                    <OrderingScreen 
                      mode="kiosk" 
                      menu={products} 
                      addons={addons.filter(a => a.isActive)} 
                      onPlaceOrder={handlePlaceOrder} 
                      shopSettings={shopSettings}
                      categoriesData={categories}
                      mostPickedProductIds={mostPickedProductIds}
                      vouchers={vouchers}
                    />
                  )}
                  {currentView === 'mobile' && (
                    <OrderingScreen 
                      mode="mobile" 
                      menu={products} 
                      addons={addons.filter(a => a.isActive)} 
                      onPlaceOrder={handlePlaceOrder} 
                      shopSettings={shopSettings}
                      categoriesData={categories}
                      mostPickedProductIds={mostPickedProductIds}
                      vouchers={vouchers}
                    />
                  )}
                  {currentView === 'cashier' && (
                    <CashierView 
                      orders={orders} 
                      onUpdateStatus={updateOrderStatus} 
                      onUpdateOrder={updateOrder}
                      onDeleteOrder={deleteOrder}
                      shopSettings={shopSettings} 
                      addons={addons}
                    />
                  )}
                  {currentView === 'reports' && (
                    <TransactionReports orders={orders} onDeleteOrder={deleteOrder} onClearOrders={clearOrders} />
                  )}
                  {currentView === 'queue' && (
                    <KitchenQueue 
                      orders={orders} 
                      onUpdateStatus={updateOrderStatus} 
                      onDeleteOrder={deleteOrder}
                      onVoidOrder={voidOrder}
                    />
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
                  {currentView === 'admin-vouchers' && (
                    <AdminVouchers
                      vouchers={vouchers}
                      onAddVoucher={addVoucher}
                      onUpdateVoucher={updateVoucher}
                      onDeleteVoucher={deleteVoucher}
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
                  {currentView === 'profile' && (
                    <ProfilePage 
                      user={user}
                      vouchers={vouchers}
                      orders={userOrders}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          {showAdminLogin && (
            <UnifiedAuthModal onClose={() => setShowAdminLogin(false)} />
          )}
        </Suspense>
      </main>
        </div>

        {successOrder && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-300 dark:bg-black/60 backdrop-blur-xl animate-in fade-in duration-500"
          >
            <div
              className="bg-white dark:bg-[#0a0a0c] rounded-[3rem] p-10 max-w-sm w-full shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] flex flex-col items-center text-center border-2 border-black/10 dark:border-white/5 relative overflow-hidden animate-in zoom-in-95 duration-500"
            >
              {/* Background Glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-24 h-24 bg-green-500/10 rounded-[2rem] flex items-center justify-center text-green-500 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              </div>

              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 uppercase italic tracking-tighter">Order Launched!</h2>
              <p className="text-coffee-600 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
                Your sequence <span className="text-slate-900 dark:text-white">#{successOrder.id?.slice(-4)}</span> {(successOrder.status === 'unpaid' || successOrder.status === 'pending-verification') ? 'will not be made until payment is verified. Please proceed to the cashier.' : 'is now being prepared in orbit.'}
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
                <p className="text-amber-500/70 text-[10px] font-bold uppercase tracking-widest pt-2">
                  Returning to splash in {successTimer}s...
                </p>
              </div>
            </div>
          </div>
        )}
        <Footer shopSettings={shopSettings} />
      </div>
    </div>
  );
}
