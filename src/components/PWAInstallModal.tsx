import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Laptop, Share, X, CheckCircle2, ArrowDownToLine, PlusSquare } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Detect if already installed / standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        onInstallSuccess();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-[#0d1322] border border-black/10 dark:border-white/10 rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl relative flex flex-col space-y-6 animate-in zoom-in-95 duration-300 text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10 relative">
            <img 
              src="/icon-512.jpg" 
              alt="App Icon" 
              className="w-full h-full object-cover rounded-3xl"
              onError={(e) => {
                // Fallback to icon if image fails
                e.currentTarget.style.display = 'none';
              }}
            />
            <Download className="w-8 h-8 text-amber-500 absolute" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight italic">
              Install OrderOrbit
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Get the native app experience with offline support, fast loading, and quick home screen launch!
            </p>
          </div>
        </div>

        {/* Dynamic State / Instructions */}
        {isStandalone ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-500">App Already Installed!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You are currently running OrderOrbit in native standalone app mode.
            </p>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-4">
            <button
              onClick={handleInstallClick}
              className="w-full relative group overflow-hidden py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] flex items-center justify-center gap-3 transition-all duration-300 active:scale-95"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-950/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowDownToLine className="w-4 h-4 text-slate-950" />
              </div>
              <span>Download & Install Now</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider">
              One-click standard install for desktop & android
            </p>
          </div>
        ) : isIOS ? (
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> iOS Safari Installation Instructions:
            </h4>
            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 font-medium list-decimal list-inside">
              <li>
                Tap the <span className="inline-flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded"><Share className="w-3.5 h-3.5" /> Share</span> icon at the bottom of Safari.
              </li>
              <li>
                Scroll down and select <span className="inline-flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</span>.
              </li>
              <li>
                Tap <span className="font-bold text-amber-500">Add</span> in the top right to install!
              </li>
            </ol>
          </div>
        ) : (
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <Laptop className="w-4 h-4" /> Desktop / Android Manual Install:
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>Look for the <strong>Install / Download icon</strong> in your browser address bar (top right).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>Or open browser menu <span className="font-mono font-bold">(⋮ or ⋯)</span> and click <strong>"Install OrderOrbit"</strong> or <strong>"Add to Home screen"</strong>.</span>
              </li>
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400 uppercase font-black tracking-widest">
          <span>PWA App</span>
          <span>Fast • Offline • Secure</span>
        </div>
      </div>
    </div>
  );
};
