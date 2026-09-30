import React, { useState, useEffect } from 'react';
import { SplashScreen, ShopSettings } from '../types';
import {
  Image, Type, Save, Eye, Palette, Building, MapPin, Phone,
  Upload, Sun, Moon, ScrollText, QrCode, Trash2, Lock, Store,
  Power, Download, Maximize2, X, FlaskConical, Sliders, RefreshCw,
  Box, RotateCw, Compass, Snowflake, Wind, Check, AlertCircle,
  Smartphone, Volume2, ShieldCheck, Sparkles, Layers, Monitor, SlidersHorizontal
} from 'lucide-react';
import { useTheme } from '../lib/ThemeProvider';
import { useToast } from '../lib/ToastContext';

interface AdminSettingsProps {
  splashScreen: SplashScreen | null;
  shopSettings: ShopSettings | null;
  onUpdateSplash: (updates: Partial<SplashScreen>) => Promise<void>;
  onUpdateShop: (updates: Partial<ShopSettings>) => Promise<void>;
  onNavigateToYourMix?: () => void;
}

type SettingsSection = 'store' | 'themes' | 'checkout' | 'splash';

export function AdminSettings({
  splashScreen,
  shopSettings,
  onUpdateSplash,
  onUpdateShop,
  onNavigateToYourMix
}: AdminSettingsProps) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<SettingsSection>('store');
  const [mobileViewMode, setMobileViewMode] = useState<'form' | 'preview'>('form');

  const [splashData, setSplashData] = useState<Partial<SplashScreen>>({
    title: '',
    subtitle: '',
    imageUrl: '',
    buttonText: '',
    isActive: true,
    useGlb: true,
    glbUrl: '/coffee_cup_with_plate.glb',
    glbScale: 1.0,
    glbZoom: 100,
    glbPositionX: 0,
    glbPositionY: 0,
    glbRotationY: 0,
    glbCameraPitch: 60,
    glbAutoRotate: true,
  });

  const [shopData, setShopData] = useState<Partial<ShopSettings>>({
    name: '',
    initials: '',
    logoUrl: '',
    qrCodeUrl: '',
    receiptName: '',
    receiptLogoUrl: '',
    themeColor: '#4b2c20',
    themeMode: 'dark',
    notificationSoundUrl: '',
    notificationVolume: 1.0,
    gridColumns: 4,
    mobileGridColumns: 2,
    address: '',
    phone: '',
    tagline: '',
    speakCustomerName: false,
    kioskPin: '0000',
    adminPin: '0000',
    pointsEarnedPer10Pesos: 1,
    pointsEarnedPer100Pesos: 10,
    gcashQrUrl: '',
    gcashNumber: '',
    isClosed: false,
    yourMixEnabled: true,
    yourMixStatus: 'active',
    activeTheme: 'christmas',
    snowEnabled: true,
    snowSpeedMultiplier: 1.0,
    snowFlakeCount: 50,
    batCount: 7,
    batSize: 1.0,
    batGlowColor: '#ffffff',
    batGlowIntensity: 1.0,
    batSpeedMultiplier: 1.0,
    batSpread: 1.0,
    footerContent: ''
  });

  const [saving, setSaving] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'brand' | 'splash'>('brand');

  useEffect(() => {
    if (splashScreen) {
      setSplashData({
        title: splashScreen.title,
        subtitle: splashScreen.subtitle,
        imageUrl: splashScreen.imageUrl,
        buttonText: splashScreen.buttonText,
        isActive: splashScreen.isActive,
        useGlb: splashScreen.useGlb !== undefined ? splashScreen.useGlb : true,
        glbUrl: splashScreen.glbUrl || '/coffee_cup_with_plate.glb',
        glbScale: splashScreen.glbScale ?? 1.0,
        glbZoom: splashScreen.glbZoom ?? 100,
        glbPositionX: splashScreen.glbPositionX ?? 0,
        glbPositionY: splashScreen.glbPositionY ?? 0,
        glbRotationY: splashScreen.glbRotationY ?? 0,
        glbCameraPitch: splashScreen.glbCameraPitch ?? 60,
        glbAutoRotate: splashScreen.glbAutoRotate !== false,
      });
    }
  }, [splashScreen]);

  useEffect(() => {
    if (shopSettings) {
      setShopData({
        name: shopSettings.name || '',
        initials: shopSettings.initials || '',
        logoUrl: shopSettings.logoUrl || '',
        qrCodeUrl: shopSettings.qrCodeUrl || '',
        receiptName: shopSettings.receiptName || '',
        receiptLogoUrl: shopSettings.receiptLogoUrl || '',
        themeColor: shopSettings.themeColor || '#4b2c20',
        themeMode: shopSettings.themeMode || (theme === 'system' ? 'dark' : theme),
        notificationSoundUrl: shopSettings.notificationSoundUrl || '',
        notificationVolume: shopSettings.notificationVolume !== undefined ? shopSettings.notificationVolume : 1.0,
        gridColumns: shopSettings.gridColumns || 4,
        mobileGridColumns: shopSettings.mobileGridColumns || 2,
        address: shopSettings.address || '',
        phone: shopSettings.phone || '',
        tagline: shopSettings.tagline || '',
        speakCustomerName: shopSettings.speakCustomerName || false,
        kioskPin: shopSettings.kioskPin || '0000',
        adminPin: shopSettings.adminPin || '0000',
        pointsEarnedPer10Pesos: shopSettings.pointsEarnedPer10Pesos || 1,
        pointsEarnedPer100Pesos: shopSettings.pointsEarnedPer100Pesos || 10,
        gcashQrUrl: shopSettings.gcashQrUrl || '',
        gcashNumber: shopSettings.gcashNumber || '',
        isClosed: shopSettings.isClosed || false,
        yourMixEnabled: shopSettings.yourMixEnabled !== undefined ? shopSettings.yourMixEnabled : true,
        yourMixStatus: shopSettings.yourMixStatus || 'active',
        activeTheme: shopSettings.activeTheme || (shopSettings.snowEnabled !== false ? 'christmas' : 'none'),
        snowEnabled: shopSettings.snowEnabled !== undefined ? shopSettings.snowEnabled : true,
        snowSpeedMultiplier: shopSettings.snowSpeedMultiplier !== undefined ? shopSettings.snowSpeedMultiplier : 1.0,
        snowFlakeCount: shopSettings.snowFlakeCount || 50,
        batCount: shopSettings.batCount || 7,
        batSize: shopSettings.batSize !== undefined ? shopSettings.batSize : 1.0,
        batGlowColor: shopSettings.batGlowColor || '#ffffff',
        batGlowIntensity: shopSettings.batGlowIntensity !== undefined ? shopSettings.batGlowIntensity : 1.0,
        batSpeedMultiplier: shopSettings.batSpeedMultiplier !== undefined ? shopSettings.batSpeedMultiplier : 1.0,
        batSpread: shopSettings.batSpread !== undefined ? shopSettings.batSpread : 1.0,
        footerContent: shopSettings.footerContent || ''
      });
    }
  }, [shopSettings, theme]);

  // When switching to splash section, automatically show splash preview
  useEffect(() => {
    if (activeSection === 'splash') {
      setPreviewTab('splash');
    } else {
      setPreviewTab('brand');
    }
  }, [activeSection]);

  const handleDownloadGcashQr = () => {
    if (!shopData.gcashQrUrl) return;
    const a = document.createElement('a');
    a.href = shopData.gcashQrUrl;
    a.download = `GCash_Payment_QR_${shopData.name || 'Store'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('GCash QR Code image downloaded!');
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('QR Code image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setShopData(prev => ({ ...prev, qrCodeUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleGcashQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('GCash QR Code image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setShopData(prev => ({ ...prev, gcashQrUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Audio file is too large. Please select a file under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      if (base64String) {
        setShopData(prev => ({ ...prev, notificationSoundUrl: base64String }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'receiptLogoUrl' = 'logoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.warning('Image size is too large. Please select an image under 1.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      if (base64String) {
        setShopData(prev => ({ ...prev, [field]: base64String }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Instant toggle for Store Operating Status
  const handleToggleClosed = async (newIsClosed: boolean) => {
    setShopData(prev => ({ ...prev, isClosed: newIsClosed }));
    try {
      await onUpdateShop({ isClosed: newIsClosed });
      if (newIsClosed) {
        toast.info('Store set to PAUSED. Catalog is in Browse-Only mode.');
      } else {
        toast.success('Store is now OPEN and accepting orders!');
      }
    } catch {
      toast.error('Failed to update store status');
    }
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await onUpdateShop(shopData);
      await onUpdateSplash(splashData);
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const navigationTabs: { id: SettingsSection; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'store', label: 'Store & Brand', icon: Store, badge: shopData.isClosed ? 'Paused' : 'Open' },
    { id: 'themes', label: 'Seasonal Themes', icon: Palette, badge: (shopData.activeTheme || 'none').toUpperCase() },
    { id: 'checkout', label: 'Checkout & POS', icon: ScrollText },
    { id: 'splash', label: 'Splash & 3D', icon: Smartphone },
  ];

  return (
    <div className="min-h-full bg-transparent p-2.5 sm:p-5 md:p-8 lg:p-10 pb-10 sm:pb-16 overflow-x-hidden">
      {/* Header with Title, Mode Switcher, and Primary Save Action */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-amber-500/20">
              Admin Suite
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Terminal Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight leading-tight">
            Store <span className="text-amber-500 not-italic font-normal">Settings</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl line-clamp-2">
            Configure operations, branding, thermal receipts, and 3D hero assets.
          </p>
        </div>

        {/* Action Controls in Header: Mobile View Toggle & Primary Save Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile/Tablet View Toggle (Form vs Live Preview) */}
          <div className="flex xl:hidden items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/10 dark:border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setMobileViewMode('form')}
              className={`py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                mobileViewMode === 'form'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>Form</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('preview')}
              className={`py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                mobileViewMode === 'preview'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>Preview</span>
            </button>
          </div>

          {/* Primary Save Button in Header - Always accessible, never overlaps components */}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </header>

      {/* Responsive Sub-Tabs Bar: 3 Concise Categories, Never Clipped */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="grid grid-cols-3 sm:flex sm:w-fit items-center gap-1 sm:gap-1.5 bg-black/5 dark:bg-white/5 p-1 sm:p-1.5 rounded-2xl border border-black/10 dark:border-white/10">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSection(tab.id);
                  if (tab.id === 'splash') {
                    setPreviewTab('splash');
                  } else {
                    setPreviewTab('brand');
                  }
                }}
                className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`hidden sm:inline-block ml-0.5 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase ${
                      shopData.isClosed
                        ? 'bg-amber-400/30 text-amber-900 dark:text-amber-200'
                        : 'bg-emerald-400/30 text-emerald-950 dark:text-emerald-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Form Column */}
        <div className={`xl:col-span-7 2xl:col-span-8 space-y-5 sm:space-y-6 ${mobileViewMode === 'preview' ? 'hidden xl:block' : 'block'}`}>
          <form onSubmit={handleSaveAll} className="space-y-5 sm:space-y-6">
            {/* TAB 1: STORE & BRAND */}
            {activeSection === 'store' && (
              <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
                {/* Store Operating Status Control Card */}
                <div
                  className={`p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border transition-all ${
                    shopData.isClosed
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                          shopData.isClosed ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        <Store className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            Store Operational Status
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                              shopData.isClosed
                                ? 'bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 animate-pulse'
                            }`}
                          >
                            {shopData.isClosed ? 'ORDERING PAUSED (BROWSE ONLY)' : 'LIVE & ACCEPTING ORDERS'}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
                          {shopData.isClosed ? 'Shop is Currently Paused' : 'Shop is Open for Customer Orders'}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {shopData.isClosed
                            ? 'Customers browse roasts, sizes & pricing in Browse-Only mode, but cannot checkout.'
                            : 'Customers can seamlessly formulate and submit orders on Mobile Web and Walk-in Kiosks.'}
                        </p>
                      </div>
                    </div>

                    {/* Segmented [OPEN | CLOSED] Switch */}
                    <div className="grid grid-cols-2 sm:flex p-1 bg-black/10 dark:bg-white/10 rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10 w-full sm:w-auto shrink-0 self-stretch sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleClosed(false)}
                        className={`py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          !shopData.isClosed
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-slate-950 inline-block animate-pulse"></span>
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleClosed(true)}
                        className={`py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          shopData.isClosed
                            ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-slate-950 inline-block"></span>
                        Paused
                      </button>
                    </div>
                  </div>
                </div>

                {/* General Store Details */}
                <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 shadow-sm space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/10 dark:border-white/10">
                    <Building className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      General Store Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        Store Name
                      </label>
                      <div className="relative">
                        <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={shopData.name}
                          onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
                          className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none transition-all font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                          placeholder="e.g. Astro Coffee"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        Store Tagline / Designation
                      </label>
                      <input
                        type="text"
                        value={shopData.tagline || ''}
                        onChange={(e) => setShopData({ ...shopData, tagline: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none transition-all font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                        placeholder="e.g. Refuel Station"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        Initials
                      </label>
                      <input
                        type="text"
                        maxLength={3}
                        value={shopData.initials}
                        onChange={(e) => setShopData({ ...shopData, initials: e.target.value.toUpperCase() })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none transition-all font-black text-slate-900 dark:text-white text-center text-xs sm:text-sm"
                        placeholder="AC"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        Desktop Grid Columns
                      </label>
                      <select
                        value={shopData.gridColumns}
                        onChange={(e) => setShopData({ ...shopData, gridColumns: parseInt(e.target.value) })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none transition-all font-bold text-slate-900 dark:text-white text-xs sm:text-sm cursor-pointer"
                      >
                        {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <option key={num} value={num}>
                            {num} Columns
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        Mobile Grid Columns
                      </label>
                      <select
                        value={shopData.mobileGridColumns}
                        onChange={(e) => setShopData({ ...shopData, mobileGridColumns: parseInt(e.target.value) })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none transition-all font-bold text-slate-900 dark:text-white text-xs sm:text-sm cursor-pointer"
                      >
                        {[1, 2, 3, 4].map((num) => (
                          <option key={num} value={num}>
                            {num} Columns
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Text-To-Speech Option */}
                  <div className="flex items-center gap-3 bg-white/40 dark:bg-white/5 p-3 rounded-xl sm:rounded-2xl border border-black/5 dark:border-white/5">
                    <input
                      type="checkbox"
                      id="speakCustomerName"
                      checked={shopData.speakCustomerName || false}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setShopData({ ...shopData, speakCustomerName: val });
                      }}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                    />
                    <label
                      htmlFor="speakCustomerName"
                      className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none leading-tight"
                    >
                      Announce customer name aloud via Text-to-Speech when order is ready
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                      Footer Copyright & Notice
                    </label>
                    <textarea
                      value={shopData.footerContent || ''}
                      onChange={(e) => setShopData({ ...shopData, footerContent: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none transition-all font-bold text-slate-900 dark:text-white text-xs resize-none h-18 sm:h-20"
                      placeholder="e.g. © 2026 Astro Coffee. All rights reserved."
                    />
                  </div>
                </div>

                {/* Brand Identity & Visual Theme */}
                <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 shadow-sm space-y-5 sm:space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/10 dark:border-white/10">
                    <Palette className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Palette & Theme Mode
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        Brand Accent Color
                      </label>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="color"
                          value={shopData.themeColor}
                          onChange={(e) => setShopData({ ...shopData, themeColor: e.target.value })}
                          className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl cursor-pointer p-0.5 shrink-0"
                        />
                        <input
                          type="text"
                          value={shopData.themeColor}
                          onChange={(e) => setShopData({ ...shopData, themeColor: e.target.value })}
                          className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white uppercase"
                        />
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {['#4b2c20', '#d97706', '#0284c7', '#10b981', '#8b5cf6', '#e11d48'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setShopData({ ...shopData, themeColor: c })}
                            className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg border border-white/20 transition-transform active:scale-95 hover:scale-110"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        System Theme Mode
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const newMode = theme === 'dark' ? 'light' : 'dark';
                          setShopData(prev => ({ ...prev, themeMode: newMode }));
                          setTheme(newMode);
                          try {
                            await onUpdateShop({ themeMode: newMode });
                          } catch {
                            // ignore background error
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2.5 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 hover:border-amber-500/50 rounded-xl sm:rounded-2xl px-3 py-2.5 sm:py-3 transition-all h-11 sm:h-12"
                      >
                        {theme === 'dark' ? (
                          <>
                            <Sun className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                              Dark Mode (Switch to Light)
                            </span>
                          </>
                        ) : (
                          <>
                            <Moon className="w-4 h-4 text-slate-700" />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                              Light Mode (Switch to Dark)
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Web / App Logo */}
                  <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-2.5">
                    <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest ml-1">
                      Web & App Brand Logo
                    </label>

                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white/40 dark:bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10">
                      {shopData.logoUrl ? (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-black/10 dark:bg-black/40 border border-black/10 dark:border-white/10 shrink-0 relative group self-center sm:self-auto">
                          <img src={shopData.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                          <button
                            type="button"
                            onClick={() => setShopData({ ...shopData, logoUrl: '' })}
                            className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove logo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 flex items-center justify-center shrink-0 self-center sm:self-auto text-slate-400">
                          <Image className="w-5 h-5 opacity-40" />
                        </div>
                      )}

                      <div className="flex-1 space-y-2">
                        <label className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                          <Upload className="w-3.5 h-3.5 text-amber-500" />
                          <span>Upload Image File</span>
                          <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logoUrl')} className="hidden" />
                        </label>

                        <div className="relative">
                          <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={shopData.logoUrl || ''}
                            onChange={(e) => setShopData({ ...shopData, logoUrl: e.target.value })}
                            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl focus:border-amber-500/50 outline-none text-xs font-bold text-slate-900 dark:text-white"
                            placeholder="Or paste direct image URL (https://...)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SEASONAL THEMES & AMBIENT FX */}
            {activeSection === 'themes' && (
              <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
                <div className="p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm space-y-4 sm:space-y-5">
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                        <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            Seasonal Themes & FX Management
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Active: {(shopData.activeTheme || 'none').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Select the active ambient seasonal theme across Kiosk, Mobile & POS viewports.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3 Theme Selector Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Default Theme Card */}
                    <button
                      type="button"
                      onClick={() => setShopData({ ...shopData, activeTheme: 'none', snowEnabled: false })}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 relative overflow-hidden group ${
                        (shopData.activeTheme === 'none' || (!shopData.activeTheme && shopData.snowEnabled === false))
                          ? 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                          : 'bg-white/40 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-9 h-9 rounded-xl bg-slate-500/20 text-slate-400 flex items-center justify-center font-black text-xs">
                          🚫
                        </div>
                        {(shopData.activeTheme === 'none' || (!shopData.activeTheme && shopData.snowEnabled === false)) && (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-amber-500 text-slate-950">Active</span>
                        )}
                      </div>
                      <div>
                        <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                          Standard Theme
                        </h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Clean, minimalist interface without seasonal overlays.
                        </p>
                      </div>
                    </button>

                    {/* Christmas Theme Card */}
                    <button
                      type="button"
                      onClick={() => setShopData({ ...shopData, activeTheme: 'christmas', snowEnabled: true })}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 relative overflow-hidden group ${
                        (shopData.activeTheme === 'christmas' || (!shopData.activeTheme && shopData.snowEnabled !== false))
                          ? 'bg-cyan-500/10 border-cyan-500 shadow-md ring-2 ring-cyan-500/30'
                          : 'bg-white/40 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs">
                          ❄️
                        </div>
                        {(shopData.activeTheme === 'christmas' || (!shopData.activeTheme && shopData.snowEnabled !== false)) && (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-cyan-500 text-slate-950">Active</span>
                        )}
                      </div>
                      <div>
                        <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                          Christmas Theme
                        </h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Winter snowfall, drifting particles & snowy roof caps.
                        </p>
                      </div>
                    </button>

                    {/* Halloween Theme Card */}
                    <button
                      type="button"
                      onClick={() => setShopData({ ...shopData, activeTheme: 'halloween', snowEnabled: false })}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 relative overflow-hidden group ${
                        shopData.activeTheme === 'halloween'
                          ? 'bg-orange-500/10 border-orange-500 shadow-md ring-2 ring-orange-500/30'
                          : 'bg-white/40 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-orange-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center font-black text-xs">
                          🎃
                        </div>
                        {shopData.activeTheme === 'halloween' && (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-orange-500 text-slate-950">Active</span>
                        )}
                      </div>
                      <div>
                        <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                          Halloween Theme
                        </h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Swinging pumpkin garland, glowing moon & 3D bats.
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Theme Specific Extra Settings: Christmas Snow */}
                  {(shopData.activeTheme === 'christmas' || (!shopData.activeTheme && shopData.snowEnabled !== false)) && (
                    <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs text-cyan-400 font-bold bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20">
                        <span className="flex items-center gap-2">
                          <Snowflake className="w-4 h-4 text-cyan-400" /> Winter Snowfall Dynamics & Particle Density
                        </span>
                        <span className="px-2 py-0.5 bg-cyan-500 text-slate-950 text-[9px] font-black uppercase rounded-md">
                          Snow Config
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Snow Flake Count / Quantity */}
                        <div className="bg-white/40 dark:bg-white/5 p-3 sm:p-4 rounded-xl border border-black/10 dark:border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <Snowflake className="w-3.5 h-3.5 text-cyan-400" /> Snow Quantity / Density
                            </span>
                            <span className="text-cyan-500 font-mono font-black">{shopData.snowFlakeCount ?? 50} flakes</span>
                          </div>
                          <input
                            type="range"
                            min="15"
                            max="150"
                            step="5"
                            value={shopData.snowFlakeCount ?? 50}
                            onChange={(e) =>
                              setShopData({ ...shopData, snowFlakeCount: parseInt(e.target.value) })
                            }
                            className="w-full accent-cyan-400 bg-black/10 dark:bg-white/10 rounded-lg h-2 cursor-pointer py-1"
                          />
                          <div className="flex gap-1.5 flex-wrap pt-0.5">
                            {[
                              { label: 'Light', count: 25 },
                              { label: 'Moderate', count: 50 },
                              { label: 'Heavy', count: 90 },
                              { label: 'Blizzard', count: 140 },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setShopData({ ...shopData, snowFlakeCount: preset.count })}
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wide border transition-all ${
                                  (shopData.snowFlakeCount ?? 50) === preset.count
                                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-sm'
                                    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {preset.label} ({preset.count})
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Flake Speed */}
                        <div className="bg-white/40 dark:bg-white/5 p-3 sm:p-4 rounded-xl border border-black/10 dark:border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <Wind className="w-3.5 h-3.5 text-cyan-400" /> Flake Fall Speed
                            </span>
                            <span className="text-cyan-500 font-mono font-black">
                              {(shopData.snowSpeedMultiplier ?? 1.0).toFixed(2)}x
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.05"
                            max="3.0"
                            step="0.05"
                            value={shopData.snowSpeedMultiplier ?? 1.0}
                            onChange={(e) =>
                              setShopData({ ...shopData, snowSpeedMultiplier: parseFloat(e.target.value) })
                            }
                            className="w-full accent-cyan-400 bg-black/10 dark:bg-white/10 rounded-lg h-2 cursor-pointer py-1"
                          />
                          <div className="flex gap-1.5 flex-wrap pt-0.5">
                            {[
                              { name: '🧊 Ultra Slow', speed: 0.1 },
                              { name: '❄️ Drift', speed: 0.4 },
                              { name: '🌨️ Normal', speed: 1.0 },
                              { name: '⚡ Blizzard', speed: 2.2 },
                            ].map((preset) => (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => setShopData({ ...shopData, snowSpeedMultiplier: preset.speed })}
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wide border transition-all ${
                                  Math.abs((shopData.snowSpeedMultiplier ?? 1.0) - preset.speed) < 0.05
                                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-sm'
                                    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Theme Specific Extra Settings: Halloween Bats FX */}
                  {shopData.activeTheme === 'halloween' && (
                    <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs text-orange-400 font-bold bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                        <span className="flex items-center gap-2">
                          <span>🦇</span> 3D Roaming Bats, Pumpkin Garland & Spooky Moon FX
                        </span>
                        <span className="px-2 py-0.5 bg-orange-500 text-slate-950 text-[9px] font-black uppercase rounded-md">
                          Bat Config
                        </span>
                      </div>

                      {/* Bat Count & Bat Size */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Bat Count */}
                        <div className="bg-white/40 dark:bg-white/5 p-3 sm:p-4 rounded-xl border border-black/10 dark:border-white/10 space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>Bat Flock Count</span>
                            <span className="text-orange-500 font-mono font-black">{shopData.batCount ?? 7} bats</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="18"
                            step="1"
                            value={shopData.batCount ?? 7}
                            onChange={(e) => setShopData({ ...shopData, batCount: parseInt(e.target.value) })}
                            className="w-full accent-orange-500 bg-black/10 dark:bg-white/10 rounded-lg h-2 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                            <span>2 (Few)</span>
                            <span>8 (Standard)</span>
                            <span>18 (Swarm)</span>
                          </div>
                        </div>

                        {/* Bat Size */}
                        <div className="bg-white/40 dark:bg-white/5 p-3 sm:p-4 rounded-xl border border-black/10 dark:border-white/10 space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>Bat Size / Wingspan</span>
                            <span className="text-orange-500 font-mono font-black">{(shopData.batSize ?? 1.0).toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.2"
                            step="0.05"
                            value={shopData.batSize ?? 1.0}
                            onChange={(e) => setShopData({ ...shopData, batSize: parseFloat(e.target.value) })}
                            className="w-full accent-orange-500 bg-black/10 dark:bg-white/10 rounded-lg h-2 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                            <span>0.5x (Small)</span>
                            <span>1.0x (Normal)</span>
                            <span>2.2x (Giant)</span>
                          </div>
                        </div>
                      </div>

                      {/* Bat Glow Color & Light Intensity */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Glow Color */}
                        <div className="bg-white/40 dark:bg-white/5 p-3 sm:p-4 rounded-xl border border-black/10 dark:border-white/10 space-y-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Bat Glow Light Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={shopData.batGlowColor || '#ffffff'}
                              onChange={(e) => setShopData({ ...shopData, batGlowColor: e.target.value })}
                              className="w-9 h-9 rounded-lg bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 cursor-pointer p-0.5 shrink-0"
                            />
                            <input
                              type="text"
                              value={shopData.batGlowColor || '#ffffff'}
                              onChange={(e) => setShopData({ ...shopData, batGlowColor: e.target.value })}
                              className="flex-1 px-3 py-1.5 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                              placeholder="#ffffff"
                            />
                          </div>
                          {/* Color presets */}
                          <div className="flex gap-1.5 flex-wrap pt-1">
                            {[
                              { label: '⚪ White', color: '#ffffff' },
                              { label: '🎃 Orange', color: '#f97316' },
                              { label: '💜 Purple', color: '#a855f7' },
                              { label: '💚 Green', color: '#22c55e' },
                              { label: '⚡ Cyan', color: '#38bdf8' },
                              { label: '🩸 Red', color: '#ef4444' },
                            ].map((preset) => (
                              <button
                                key={preset.color}
                                type="button"
                                onClick={() => setShopData({ ...shopData, batGlowColor: preset.color })}
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wide border transition-all ${
                                  (shopData.batGlowColor || '#ffffff').toLowerCase() === preset.color.toLowerCase()
                                    ? 'bg-orange-500 text-slate-950 border-orange-400 font-extrabold shadow-sm'
                                    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Glow Light Intensity */}
                        <div className="bg-white/40 dark:bg-white/5 p-3 sm:p-4 rounded-xl border border-black/10 dark:border-white/10 space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>Glow Light Intensity</span>
                            <span className="text-orange-500 font-mono font-black">{(shopData.batGlowIntensity ?? 1.0).toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="2.5"
                            step="0.05"
                            value={shopData.batGlowIntensity ?? 1.0}
                            onChange={(e) => setShopData({ ...shopData, batGlowIntensity: parseFloat(e.target.value) })}
                            className="w-full accent-orange-500 bg-black/10 dark:bg-white/10 rounded-lg h-2 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                            <span>0.2x (Soft)</span>
                            <span>1.0x (Balanced)</span>
                            <span>2.5x (Vibrant Glow)</span>
                          </div>
                        </div>
                      </div>

                      {/* Flight Speed & Space Movement Roaming Area */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Space Movement (Roaming Spread) */}
                        <div className="bg-white/40 dark:bg-white/5 p-3 sm:p-4 rounded-xl border border-black/10 dark:border-white/10 space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>Space Movement (Roaming Area)</span>
                            <span className="text-orange-500 font-mono font-black">{(shopData.batSpread ?? 1.0).toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.3"
                            max="2.0"
                            step="0.05"
                            value={shopData.batSpread ?? 1.0}
                            onChange={(e) => setShopData({ ...shopData, batSpread: parseFloat(e.target.value) })}
                            className="w-full accent-orange-500 bg-black/10 dark:bg-white/10 rounded-lg h-2 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                            <span>0.3x (Clustered)</span>
                            <span>1.0x (Full Screen)</span>
                            <span>2.0x (Wild Roam)</span>
                          </div>
                        </div>

                        {/* Flight Speed Multiplier */}
                        <div className="bg-white/40 dark:bg-white/5 p-3 sm:p-4 rounded-xl border border-black/10 dark:border-white/10 space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>Flight Speed Multiplier</span>
                            <span className="text-orange-500 font-mono font-black">{(shopData.batSpeedMultiplier ?? 1.0).toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.4"
                            max="2.5"
                            step="0.05"
                            value={shopData.batSpeedMultiplier ?? 1.0}
                            onChange={(e) => setShopData({ ...shopData, batSpeedMultiplier: parseFloat(e.target.value) })}
                            className="w-full accent-orange-500 bg-black/10 dark:bg-white/10 rounded-lg h-2 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                            <span>0.4x (Slow Flap)</span>
                            <span>1.0x (Normal)</span>
                            <span>2.5x (Fast Dart)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: CHECKOUT & POS */}
            {activeSection === 'checkout' && (
              <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
                {/* Receipts Formatting */}
                <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 shadow-sm space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/10 dark:border-white/10">
                    <ScrollText className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Thermal POS Receipt Configuration
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        Receipt Header Name
                      </label>
                      <input
                        type="text"
                        value={shopData.receiptName || ''}
                        onChange={(e) => setShopData({ ...shopData, receiptName: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                        placeholder="e.g. Astro Coffee Roasters Ltd."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        Receipt Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={shopData.phone || ''}
                          onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
                          className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                          placeholder="+63 900 123 4567"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                      Receipt Physical Store Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={shopData.address || ''}
                        onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                        className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                        placeholder="123 Nebula Blvd, Station 4"
                      />
                    </div>
                  </div>

                  {/* Receipt Logo */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                      Thermal Receipt Logo (Monochrome Preferred)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white/40 dark:bg-white/5 p-3 rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10">
                      {shopData.receiptLogoUrl ? (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white p-1 border border-black/10 shrink-0 relative group self-center sm:self-auto">
                          <img src={shopData.receiptLogoUrl} alt="Receipt Logo" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setShopData({ ...shopData, receiptLogoUrl: '' })}
                            className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 flex items-center justify-center shrink-0 self-center sm:self-auto text-slate-400">
                          <Image className="w-4 h-4 opacity-40" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5">
                        <label className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                          <Upload className="w-3.5 h-3.5 text-amber-500" />
                          <span>Upload Monochrome Logo</span>
                          <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'receiptLogoUrl')} className="hidden" />
                        </label>
                        <input
                          type="text"
                          value={shopData.receiptLogoUrl || ''}
                          onChange={(e) => setShopData({ ...shopData, receiptLogoUrl: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                          placeholder="Or paste receipt image URL"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* GCash Digital Payments */}
                <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 shadow-sm space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/10 dark:border-white/10">
                    <QrCode className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      GCash Payment Checkout
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                      GCash Merchant Account / Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={shopData.gcashNumber || ''}
                        onChange={(e) => setShopData({ ...shopData, gcashNumber: e.target.value })}
                        className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                        placeholder="e.g. 0917-123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                      GCash Payment QR Code Image
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white/40 dark:bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10">
                      {shopData.gcashQrUrl ? (
                        <div className="flex items-center gap-2 shrink-0 self-center sm:self-auto">
                          <div
                            onClick={() => setIsQrModalOpen(true)}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1 overflow-hidden shrink-0 border border-black/10 cursor-pointer hover:border-amber-500 transition-all shadow-sm relative group"
                            title="Click to view QR"
                          >
                            <img src={shopData.gcashQrUrl} alt="GCash QR" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-slate-950/60 text-amber-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Maximize2 className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={handleDownloadGcashQr}
                              className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition-all"
                              title="Download QR"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setShopData({ ...shopData, gcashQrUrl: '' })}
                              className="p-1.5 sm:p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-all"
                              title="Remove QR"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 flex items-center justify-center shrink-0 self-center sm:self-auto text-slate-400">
                          <QrCode className="w-5 h-5 opacity-40" />
                        </div>
                      )}

                      <div className="flex-1">
                        <label className="w-full px-3 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                          <Upload className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Upload GCash QR</span>
                          <input type="file" accept="image/*" onChange={handleGcashQrUpload} className="hidden" />
                        </label>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 ml-1">
                          Displayed during online checkout.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security & Terminal Passcodes */}
                <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 shadow-sm space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/10 dark:border-white/10">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Security & Terminal Passcodes
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        Kiosk Exit PIN (Staff Only)
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={shopData.kioskPin || ''}
                          onChange={(e) => setShopData({ ...shopData, kioskPin: e.target.value })}
                          className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                          placeholder="0000"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 ml-1">
                        Required by cashier to exit customer kiosk mode.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        Admin Voucher Override PIN
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/60" />
                        <input
                          type="text"
                          value={shopData.adminPin || ''}
                          onChange={(e) => setShopData({ ...shopData, adminPin: e.target.value })}
                          className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-amber-500/30 dark:border-amber-500/20 rounded-xl sm:rounded-2xl focus:border-amber-500 outline-none font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                          placeholder="0000"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 ml-1">
                        Used to authorize special voucher overrides at POS.
                      </p>
                    </div>
                  </div>

                  {/* Loyalty Points Calculation */}
                  <div className="pt-2 border-t border-black/10 dark:border-white/10">
                    <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                      Loyalty Points Rate (Per ₱10 Spent)
                    </label>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <input
                        type="number"
                        min="0"
                        value={shopData.pointsEarnedPer10Pesos ?? 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setShopData({
                            ...shopData,
                            pointsEarnedPer10Pesos: val,
                            pointsEarnedPer100Pesos: val * 10,
                          });
                        }}
                        className="w-24 sm:w-28 px-3 py-2 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none font-black text-slate-900 dark:text-white text-xs sm:text-sm"
                      />
                      <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300">
                        = {((shopData.pointsEarnedPer10Pesos ?? 1) * 10)} Pts per ₱100
                      </span>
                    </div>
                  </div>

                  {/* Notification Audio & Volume */}
                  <div className="pt-2 border-t border-black/10 dark:border-white/10 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        POS Notification Audio
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="w-full px-3 py-2.5 bg-white dark:bg-[#111115] hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                          <Upload className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Upload Notification Audio</span>
                          <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                        </label>
                        {shopData.notificationSoundUrl && (
                          <span className="text-[10px] text-emerald-500 font-bold uppercase mt-1 block ml-1">
                            ✓ Custom audio loaded
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          <span>Chime Volume</span>
                          <span className="text-amber-500 font-mono">
                            {Math.round((shopData.notificationVolume || 1) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={shopData.notificationVolume || 1}
                          onChange={(e) =>
                            setShopData({ ...shopData, notificationVolume: parseFloat(e.target.value) })
                          }
                          className="w-full accent-amber-500 bg-black/10 dark:bg-white/10 rounded-lg h-2 cursor-pointer py-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SPLASH & 3D */}
            {activeSection === 'splash' && (
              <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
                {/* Your MIX Drink Studio */}
                <div className="p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-cyan-500/10 border border-amber-500/30 shadow-sm space-y-3.5 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0">
                        <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            Your MIX — Drink Studio
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Custom Lab
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Let customers formulate custom beverages layer-by-layer.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShopData({ ...shopData, yourMixEnabled: !shopData.yourMixEnabled })}
                      className={`px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center ${
                        shopData.yourMixEnabled
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-black/10 dark:bg-white/10 text-slate-400'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {shopData.yourMixEnabled ? 'Active (ON)' : 'Disabled (OFF)'}
                    </button>
                  </div>

                  {shopData.yourMixEnabled && (
                    <div className="pt-3 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Operating Mode:
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                          {(['active', 'paused', 'offline'] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setShopData({ ...shopData, yourMixStatus: st })}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                shopData.yourMixStatus === st
                                  ? st === 'active'
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : st === 'paused'
                                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                                    : 'bg-rose-500 text-white shadow-sm'
                                  : 'bg-white/40 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {st === 'active' ? '● Live' : st === 'paused' ? '⏸ Rush Paused' : '✕ Offline'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {onNavigateToYourMix && (
                        <button
                          type="button"
                          onClick={onNavigateToYourMix}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 w-fit"
                        >
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>Manage Ingredients</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Splash Screen Presentation */}
                <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 shadow-sm space-y-5 sm:space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/10 dark:border-white/10">
                    <Smartphone className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Splash Screen Presentation
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        Headline Title
                      </label>
                      <input
                        type="text"
                        value={splashData.title}
                        onChange={(e) => setSplashData({ ...splashData, title: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                        placeholder="Premium Coffee"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                        Action Button Text
                      </label>
                      <input
                        type="text"
                        value={splashData.buttonText}
                        onChange={(e) => setSplashData({ ...splashData, buttonText: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                        placeholder="Start Ordering"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                      Splash Subtitle / Description
                    </label>
                    <textarea
                      value={splashData.subtitle}
                      onChange={(e) => setSplashData({ ...splashData, subtitle: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl focus:border-amber-500/50 outline-none font-bold text-slate-900 dark:text-white text-xs resize-none h-18 sm:h-20"
                      placeholder="Your cosmic ritual, elevated."
                    />
                  </div>

                  {/* QR Code for Instant Mobile Ordering on Splash */}
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5 ml-1">
                      Mobile Ordering Instant QR ({shopData.name || 'Store'})
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white/40 dark:bg-white/5 p-3 rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10">
                      {shopData.qrCodeUrl ? (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white p-1 overflow-hidden shrink-0 border border-black/10 relative group self-center sm:self-auto">
                          <img src={shopData.qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setShopData({ ...shopData, qrCodeUrl: '' })}
                            className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 flex items-center justify-center shrink-0 self-center sm:self-auto text-slate-400">
                          <QrCode className="w-5 h-5 opacity-40" />
                        </div>
                      )}
                      <label className="flex-1 px-3 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Upload className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Upload App QR</span>
                        <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Hero 3D GLB Asset Configuration */}
                  <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          3D Interactive Model Setup
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSplashData((prev) => ({
                            ...prev,
                            glbScale: 1.0,
                            glbZoom: 100,
                            glbPositionX: 0,
                            glbPositionY: 0,
                            glbRotationY: 0,
                            glbCameraPitch: 60,
                            glbAutoRotate: true,
                          }))
                        }
                        className="text-[10px] font-black uppercase text-amber-500 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Reset
                      </button>
                    </div>

                    <div className="flex gap-2 flex-col sm:flex-row">
                      <input
                        type="text"
                        value={splashData.glbUrl || ''}
                        onChange={(e) => setSplashData({ ...splashData, glbUrl: e.target.value })}
                        className="flex-1 px-3 sm:px-4 py-2 bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-xl focus:border-amber-500/50 outline-none font-bold text-xs text-slate-900 dark:text-white"
                        placeholder="/coffee_cup_with_plate.glb"
                      />
                      <label className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center shrink-0 transition-all">
                        Upload .GLB
                        <input
                          type="file"
                          accept=".glb,.gltf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setSplashData((prev) => ({ ...prev, glbUrl: reader.result as string }));
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Available 3D Presets:
                      </span>
                      <div className="flex flex-wrap gap-1 sm:gap-1.5">
                        {[
                          { name: '☕ Cup', path: '/coffee_cup_with_plate.glb' },
                          { name: '🎄 Tree', path: '/stylised_christmas_tree.glb' },
                          { name: '🎄 Pine', path: '/xmastree.glb' },
                          { name: '🪐 Sphere', path: '/celestial_sphere.glb' },
                          { name: '🌐 Orb 2020', path: '/celestial_sphere_2020_update.glb' },
                        ].map((preset) => (
                          <button
                            key={preset.path}
                            type="button"
                            onClick={() => setSplashData((prev) => ({ ...prev, glbUrl: preset.path }))}
                            className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all border ${
                              splashData.glbUrl === preset.path
                                ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-sm'
                                : 'bg-white/40 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calibration Sliders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 border-t border-black/10 dark:border-white/10">
                      {/* Scale */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-500">
                          <span className="flex items-center gap-1">
                            <Box className="w-3 h-3 text-purple-400" /> Scale Factor
                          </span>
                          <span className="text-amber-500 font-bold font-mono">
                            {(splashData.glbScale ?? 1.0).toFixed(2)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="2.5"
                          step="0.05"
                          value={splashData.glbScale ?? 1.0}
                          onChange={(e) => setSplashData({ ...splashData, glbScale: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500 bg-black/10 dark:bg-white/10 rounded-lg h-2 cursor-pointer py-1"
                        />
                      </div>

                      {/* Zoom */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-500">
                          <span className="flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-cyan-400" /> Camera Zoom
                          </span>
                          <span className="text-amber-500 font-bold font-mono">
                            {splashData.glbZoom ?? 100}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="250"
                          step="5"
                          value={splashData.glbZoom ?? 100}
                          onChange={(e) => setSplashData({ ...splashData, glbZoom: parseInt(e.target.value) })}
                          className="w-full accent-amber-500 bg-black/10 dark:bg-white/10 rounded-lg h-2 cursor-pointer py-1"
                        />
                      </div>

                      {/* Orbit Rotation */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-500">
                          <span className="flex items-center gap-1">
                            <RotateCw className="w-3 h-3 text-amber-400" /> Orbit Angle
                          </span>
                          <span className="text-amber-500 font-bold font-mono">
                            {splashData.glbRotationY ?? 0}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={splashData.glbRotationY ?? 0}
                          onChange={(e) => setSplashData({ ...splashData, glbRotationY: parseInt(e.target.value) })}
                          className="w-full accent-amber-500 bg-black/10 dark:bg-white/10 rounded-lg h-2 cursor-pointer py-1"
                        />
                      </div>

                      {/* Camera Tilt */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-500">
                          <span className="flex items-center gap-1">
                            <Compass className="w-3 h-3 text-emerald-400" /> Camera Tilt
                          </span>
                          <span className="text-amber-500 font-bold font-mono">
                            {splashData.glbCameraPitch ?? 60}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="90"
                          step="5"
                          value={splashData.glbCameraPitch ?? 60}
                          onChange={(e) => setSplashData({ ...splashData, glbCameraPitch: parseInt(e.target.value) })}
                          className="w-full accent-amber-500 bg-black/10 dark:bg-white/10 rounded-lg h-2 cursor-pointer py-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Auto Spin
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSplashData({ ...splashData, glbAutoRotate: !(splashData.glbAutoRotate !== false) })
                        }
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                          splashData.glbAutoRotate !== false
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-black/10 dark:bg-white/10 text-slate-400 border-black/10 dark:border-white/10'
                        }`}
                      >
                        {splashData.glbAutoRotate !== false ? 'Active (ON)' : 'Off'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form In-Flow Save Action Bar */}
            <div className="pt-4 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
                Changes will sync to the terminal and active kiosks immediately upon saving.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column (Sticky on Desktop, Full Width on Mobile Preview Mode) */}
        <div
          className={`xl:col-span-5 2xl:col-span-4 space-y-4 xl:sticky xl:top-6 ${
            mobileViewMode === 'form' ? 'hidden xl:block' : 'block'
          }`}
        >
          {/* Preview Navigation Header */}
          <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-1.5 sm:p-2 rounded-2xl border border-black/10 dark:border-white/10">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Vision Preview
              </span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPreviewTab('brand')}
                className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  previewTab === 'brand'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Brand Card
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('splash')}
                className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  previewTab === 'splash'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                3D Mobile
              </button>
            </div>
          </div>

          {/* BRAND PREVIEW CARD */}
          {previewTab === 'brand' && (
            <div className="bg-white dark:bg-[#020205] rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col items-center justify-center border border-black/10 dark:border-white/10 shadow-xl relative overflow-hidden text-center">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 -left-10 w-48 h-48 bg-purple-600 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 -right-10 w-48 h-48 bg-amber-600 rounded-full blur-[80px]" />
              </div>

              {/* Status Badge */}
              <div className="mb-3 sm:mb-4 z-10">
                <span
                  className={`px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${
                    shopData.isClosed
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {shopData.isClosed ? 'ORDERING PAUSED' : 'OPEN & ACCEPTING ORDERS'}
                </span>
              </div>

              <div
                className="w-24 h-24 sm:w-36 sm:h-36 rounded-2xl flex items-center justify-center shadow-xl mb-3 sm:mb-4 relative overflow-hidden border border-black/10 dark:border-white/10 z-10 transition-colors"
                style={{ backgroundColor: shopData.themeColor || '#4b2c20' }}
              >
                {shopData.logoUrl ? (
                  <img
                    src={shopData.logoUrl}
                    className="w-full h-full object-cover"
                    alt="Logo"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-3xl sm:text-5xl font-black text-white italic tracking-tighter">
                    {shopData.initials || 'AC'}
                  </span>
                )}
              </div>

              <h4 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight leading-tight z-10">
                {shopData.name || 'Astro Coffee'}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-amber-500 font-black uppercase tracking-widest mt-1 z-10">
                {shopData.tagline || 'Refuel Station'}
              </p>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-black/10 dark:border-white/10 w-full flex items-center justify-around text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider z-10">
                <span>Desktop: {shopData.gridColumns || 4} cols</span>
                <span>•</span>
                <span>Mobile: {shopData.mobileGridColumns || 2} cols</span>
              </div>
            </div>
          )}

          {/* 3D SPLASH MOBILE MOCKUP */}
          {previewTab === 'splash' && (
            <div className="relative aspect-[9/16] w-full max-w-[270px] xs:max-w-[290px] sm:max-w-[320px] mx-auto rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-black/80 bg-white dark:bg-[#020205]">
              <div className="absolute inset-0 bg-white dark:bg-[#020205]" />
              <div className="absolute top-0 -left-10 w-48 h-48 bg-purple-900/20 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 -right-10 w-48 h-48 bg-amber-900/20 rounded-full blur-[80px]" />

              <div className="relative h-full flex flex-col p-4 sm:p-5">
                <header className="flex justify-between items-center mb-3 sm:mb-4">
                  <div
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg border border-black/10 dark:border-white/10"
                    style={{ backgroundColor: shopData.themeColor }}
                  />
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-black/10 dark:bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-black/10 dark:bg-white/10" />
                  </div>
                </header>

                <main className="flex-1 flex flex-col justify-center text-center">
                  <div className="aspect-square w-full rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-xl mb-3 sm:mb-4 relative bg-[#090D16]">
                    <div
                      className="w-full h-full flex items-center justify-center transition-all duration-300"
                      style={{
                        transform: `translate(${splashData.glbPositionX ?? 0}%, ${splashData.glbPositionY ?? 0}%)`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <model-viewer
                        src={splashData.glbUrl || '/coffee_cup_with_plate.glb'}
                        alt="3D Model Preview"
                        {...(splashData.glbAutoRotate !== false ? { 'auto-rotate': true } : {})}
                        camera-controls
                        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                        scale={`${splashData.glbScale ?? 1.0} ${splashData.glbScale ?? 1.0} ${splashData.glbScale ?? 1.0}`}
                        camera-orbit={`${splashData.glbRotationY ?? 0}deg ${splashData.glbCameraPitch ?? 60}deg ${splashData.glbZoom ?? 100}%`}
                        min-camera-orbit="auto auto 5%"
                        max-camera-orbit="auto auto 500%"
                        shadow-intensity="2"
                        exposure="1.2"
                        interaction-prompt="none"
                      ></model-viewer>
                    </div>
                  </div>

                  <span className="text-amber-500 font-black uppercase tracking-[0.3em] text-[8px] mb-1 opacity-70">
                    {splashData.title || 'Premium Coffee'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight uppercase italic tracking-tight">
                    {shopData.name || 'Store'} Launch
                  </h3>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1 line-clamp-2">
                    {splashData.subtitle || 'Your cosmic ritual, elevated.'}
                  </p>

                  <div className="mt-3 py-2 px-3 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-md">
                    {splashData.buttonText || 'Start Ordering'}
                  </div>
                </main>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* GCash QR Modal */}
      {isQrModalOpen && shopData.gcashQrUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 w-full max-w-xs sm:max-w-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 text-white text-center relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-widest">
                <QrCode className="w-4 h-4" /> GCash Payment QR
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-2.5 rounded-xl sm:rounded-2xl inline-block shadow-xl border-4 border-amber-500/30">
              <img src={shopData.gcashQrUrl} alt="GCash QR Code" className="w-40 h-40 sm:w-48 sm:h-48 object-contain rounded-lg" />
            </div>

            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-white">{shopData.name || 'Store'} GCash QR</h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                Displayed to customers during checkout
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadGcashQr}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> Download QR Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
