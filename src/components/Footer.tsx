import React from 'react';
import { ShopSettings } from '../types';

interface FooterProps {
  shopSettings: ShopSettings | null;
}

export function Footer({ shopSettings }: FooterProps) {
  if (!shopSettings?.footerContent) {
    return null;
  }

  return (
    <footer className="w-full py-6 px-6 bg-slate-50 dark:bg-[#020617] border-t border-black/10 dark:border-white/5 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30">
      {shopSettings.footerContent}
    </footer>
  );
}
